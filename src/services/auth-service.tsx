
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  linkWithPopup,
  unlink,
  GoogleAuthProvider,
  GithubAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  type User
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, db } from '@/lib/firebase-config';
import type { UserRole } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { toast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ADMIN_UID = 'J1y7j5K35mhqGWxjWkSp9eH2JcB3';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('guest');

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Create or update user in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const isUserAdmin = firebaseUser.uid === ADMIN_UID;
        
        if (!userDoc.exists()) {
          const newUserPayload = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            creationTime: firebaseUser.metadata.creationTime,
            disabled: false,
            role: isUserAdmin ? 'admin' : 'free',
          };
          await setDoc(userDocRef, newUserPayload);
        } else {
          // If user exists, check if they should be admin but aren't
          const userData = userDoc.data();
          if (isUserAdmin && userData.role !== 'admin') {
            await updateDoc(userDocRef, { role: 'admin' });
          }
        }
        
        const finalUserDoc = await getDoc(userDocRef);
        const finalUserData = finalUserDoc.data();
        setRole(finalUserData?.role || 'free');

      } else {
        setRole('guest');
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, role, isLoading };

  return (
    <AuthContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ========== AUTH FUNCTIONS ==========

function handleFirebaseError(error: unknown, context: string): boolean {
    console.error(`Error during ${context}:`, error);
    if (error instanceof FirebaseError) {
        let description = error.message;
        
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            toast({
                variant: 'default',
                title: 'Opération annulée',
                description: "La fenêtre de connexion a été fermée avant la fin de l'opération.",
            });
            return true;
        }

        switch (error.code) {
            case 'auth/popup-blocked':
                description = 'Le pop-up a été bloqué par le navigateur. Veuillez autoriser les pop-ups pour ce site et réessayer.';
                break;
            case 'auth/credential-already-in-use':
                description = 'Ce compte est déjà associé à un autre utilisateur.';
                break;
             case 'auth/email-already-in-use':
                description = "Cette adresse e-mail est déjà utilisée. Essayez de vous connecter.";
                break;
            case 'auth/weak-password':
                description = "Le mot de passe doit contenir au moins 6 caractères.";
                break;
            case 'auth/invalid-credential':
                description = "L'adresse e-mail ou le mot de passe est incorrect.";
                break;
            case 'auth/requires-recent-login':
                description = 'Cette opération est sensible. Veuillez vous reconnecter et réessayer.';
                break;
        }
        toast({ variant: 'destructive', title: `Échec de ${context}`, description });
    } else {
        toast({ variant: 'destructive', title: 'Erreur inconnue', description: 'Une erreur inattendue est survenue.' });
    }
    return false;
}


async function handlePopupAuth(provider: GoogleAuthProvider | GithubAuthProvider, isLinking: boolean): Promise<User | null> {
    const context = `${isLinking ? "l'association" : "la connexion"} ${provider.providerId}`;
    try {
        const result = isLinking
            ? await linkWithPopup(auth.currentUser!, provider)
            : await signInWithPopup(auth, provider);
        
        toast({
            title: isLinking ? 'Compte associé !' : 'Connexion réussie !',
            description: `Connecté avec ${result.user.displayName || result.user.email}.`,
        });
        return result.user;
    } catch (error) {
        handleFirebaseError(error, context);
        return null;
    }
}

// --- Google
export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  return handlePopupAuth(provider, false);
}

export async function linkWithGoogle(): Promise<User | null> {
  if (!auth.currentUser) throw new Error("Utilisateur non authentifié");
  const provider = new GoogleAuthProvider();
  return handlePopupAuth(provider, true);
}

// --- GitHub
export async function signInWithGitHub(): Promise<User | null> {
  const provider = new GithubAuthProvider();
  return handlePopupAuth(provider, false);
}

export async function linkWithGitHub(): Promise<User | null> {
  if (!auth.currentUser) throw new Error("Utilisateur non authentifié");
  const provider = new GithubAuthProvider();
  return handlePopupAuth(provider, true);
}

// --- Email
export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    handleFirebaseError(error, "l'inscription par e-mail");
    return null;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    handleFirebaseError(error, "la connexion par e-mail");
    return null;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    toast({
      title: 'E-mail envoyé',
      description: `Un lien de réinitialisation a été envoyé à ${email}`,
    });
  } catch (error) {
    handleFirebaseError(error, "la réinitialisation de mot de passe");
  }
}

// --- Unlink
export async function unlinkProvider(
  providerId: 'google.com' | 'github.com'
): Promise<User | null> {
  if (!auth.currentUser) {
    throw new Error("Aucun utilisateur n'est connecté.");
  }

  if (auth.currentUser.providerData.length <= 1) {
    toast({
        variant: 'destructive',
        title: 'Échec de la dissociation',
        description: "Impossible de dissocier votre dernière méthode de connexion.",
    });
    return null;
  }

  try {
    const user = await unlink(auth.currentUser, providerId);
    toast({ title: 'Méthode de connexion dissociée avec succès.' });
    return user;
  } catch (error) {
    handleFirebaseError(error, "la dissociation du fournisseur");
    return null;
  }
}

// --- Sign out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    handleFirebaseError(error, "la déconnexion");
  }
}

// --- Delete user
export async function deleteUserFromAuth(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Aucun utilisateur n'est actuellement connecté.");
  }

  try {
    await deleteUser(user);
    toast({ title: 'Compte supprimé avec succès.' });
  } catch (error) {
    handleFirebaseError(error, "la suppression du compte");
    throw error; // Re-throw to be caught by the component
  }
}
