
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, RefreshCw, Sparkles, BrainCircuit, AlertTriangle, Inbox, Users, ShieldCheck, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/services/auth-service.tsx';
import { GenericPage } from '@/components/generic-page';
import type { Feedback, ContactMessage, AppUser } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, getDocs, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';

const PAGE_SIZE = 5;

type LoadingStatus = 'loading' | 'success' | 'error';
type DataState<T> = {
    items: T[];
    status: LoadingStatus;
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
};

function AdminPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const db = getFirestore(app);

  const [users, setUsers] = useState<DataState<AppUser>>({ items: [], status: 'loading', lastDoc: null, hasMore: true });
  const [feedback, setFeedback] = useState<DataState<Feedback>>({ items: [], status: 'loading', lastDoc: null, hasMore: true });
  const [contacts, setContacts] = useState<DataState<ContactMessage>>({ items: [], status: 'loading', lastDoc: null, hasMore: true });

  const [isLoadingMore, setIsLoadingMore] = useState<'users' | 'feedback' | 'contacts' | null>(null);
  
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [correctedResponses, setCorrectedResponses] = useState<Record<string, string>>({});

  const [trainingQuestion, setTrainingQuestion] = useState('');
  const [trainingAnswer, setTrainingAnswer] = useState('');
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    if (role !== 'admin' || !user) {
        setUsers(s => ({ ...s, status: 'error' }));
        setFeedback(s => ({ ...s, status: 'error' }));
        setContacts(s => ({ ...s, status: 'error' }));
        return;
    }

    const createListener = <T extends {id: string}>(
      collectionName: string, 
      setDataState: React.Dispatch<React.SetStateAction<DataState<T>>>
    ) => {
      const q = query(collection(db, collectionName), orderBy(collectionName === 'users' ? 'creationTime' : 'createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setDataState({
            items,
            status: 'success',
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            hasMore: items.length >= PAGE_SIZE, // Simplified logic
        });
      }, (error) => {
        console.error(`Failed to fetch ${collectionName}:`, error);
        setDataState(s => ({ ...s, status: 'error' }));
        toast({ variant: 'destructive', title: 'Erreur de Permission', description: `Impossible de charger les données de la collection "${collectionName}". Vérifiez vos règles de sécurité Firestore.`});
      });
    };

    const unsubUsers = createListener<AppUser>('users', setUsers as any);
    const unsubFeedback = createListener<Feedback>('feedback', setFeedback);
    const unsubContacts = createListener<ContactMessage>('contact_messages', setContacts);

    return () => {
        unsubUsers();
        unsubFeedback();
        unsubContacts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user]);

  const loadMore = async (type: 'users' | 'feedback' | 'contacts') => {
      if (isLoadingMore) return;
      setIsLoadingMore(type);
      
      try {
        let state, setState, collectionName, orderField;

        if (type === 'users') {
            [state, setState, collectionName, orderField] = [users, setUsers, 'users', 'creationTime'];
        } else if (type === 'feedback') {
            [state, setState, collectionName, orderField] = [feedback, setFeedback, 'feedback', 'createdAt'];
        } else {
            [state, setState, collectionName, orderField] = [contacts, setContacts, 'contact_messages', 'createdAt'];
        }
        
        if (!state.lastDoc) {
             setState(s => ({ ...s, hasMore: false }));
             setIsLoadingMore(null);
             return;
        }
        
        const q = query(collection(db, collectionName), orderBy(orderField, 'desc'), startAfter(state.lastDoc), limit(PAGE_SIZE));

        const snapshot = await getDocs(q);
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const newHasMore = snapshot.docs.length === PAGE_SIZE;

        const newItems = snapshot.docs.map(doc => ({ [type === 'users' ? 'uid' : 'id']: doc.id, ...doc.data() }));

        setState(prev => ({
            ...prev,
            items: [...prev.items, ...newItems] as any,
            lastDoc: newLastDoc,
            hasMore: newHasMore,
        }));

      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger plus de données.' });
      } finally {
        setIsLoadingMore(null);
      }
  }
  
  const handleUpdateFeedback = async (feedbackId: string) => {
      const correctedResponse = correctedResponses[feedbackId];
      if (!correctedResponse) return;
      setIsUpdating(feedbackId);
      const feedbackRef = doc(db, 'feedback', feedbackId);
      const data = { status: 'corrected', correctedResponse };
      try {
        await updateDoc(feedbackRef, data);
        toast({ title: 'Feedback mis à jour', description: 'La correction a été enregistrée.' });
      } catch (e: any) {
        toast({ variant: 'destructive', title: "Erreur de mise à jour", description: e.message });
      } finally {
          setIsUpdating(null);
      }
  }

  const handleTrainingSubmit = async () => {
    if (!trainingQuestion || !trainingAnswer || !user) return;
    setIsTraining(true);

    const trainingData = {
        question: trainingQuestion,
        idealAnswer: trainingAnswer,
        addedBy: user.uid,
        createdAt: serverTimestamp(),
    };
    try {
        await addDoc(collection(db, 'training_data'), trainingData);
        toast({ title: 'Données enregistrées', description: 'La nouvelle paire question/réponse a été ajoutée.' });
        setTrainingQuestion('');
        setTrainingAnswer('');
    } catch(e: any) {
        toast({ variant: 'destructive', title: "Erreur d'enregistrement", description: e.message });
    } finally {
        setIsTraining(false);
    }
  }
  
  const handleToggleUserStatus = async (targetUser: AppUser, disabled: boolean) => {
    if (!user) return;
    setIsUpdating(targetUser.uid);
    const userDocRef = doc(db, 'users', targetUser.uid);
    const data = { disabled };
    try {
        await updateDoc(userDocRef, data);
        toast({
            title: 'Statut mis à jour',
            description: `L'utilisateur ${targetUser.email} a été ${disabled ? 'désactivé' : 'activé'}.`,
        });
        setUsers(prev => ({ ...prev, items: prev.items.map(u => u.uid === targetUser.uid ? { ...u, disabled } : u)}));
    } catch(e: any) {
        toast({ variant: 'destructive', title: "Erreur de mise à jour", description: e.message });
    } finally {
        setIsUpdating(null);
    }
  }

  const renderDisabledContent = (title: string, description: string) => (
       <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                    <h3 className="mt-4 text-lg font-medium">Accès Restreint</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Vous devez être administrateur pour accéder à cette fonctionnalité.
                    </p>
                </div>
            </CardContent>
        </Card>
  )
  
  const renderErrorContent = (collectionName: string) => (
      <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-4 text-lg font-medium text-destructive">Erreur de Permission</h3>
          <p className="mt-1 text-sm text-muted-foreground">
              Impossible de charger les données de la collection "{collectionName}". Vérifiez vos règles de sécurité Firestore.
          </p>
          <p className="mt-2 text-xs text-destructive/80 font-mono">Missing or insufficient permissions.</p>
      </div>
  );

  const isLoadingInitialData = users.status === 'loading' || feedback.status === 'loading' || contacts.status === 'loading';

  if (isLoadingInitialData && role === 'admin') {
    return (
        <GenericPage
            title="Panneau d'Administration"
            description="Gérez, entraînez et améliorez le modèle d'IA."
        >
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        </GenericPage>
    );
  }

  if (role !== 'admin') {
      return (
          <GenericPage
            title="Panneau d'Administration"
            description="Gérez, entraînez et améliorez le modèle d'IA."
        >
            <main className="space-y-8">
                {renderDisabledContent("Gestion des Utilisateurs", "Visualisez et gérez les utilisateurs de la plateforme.")}
                {renderDisabledContent("Boîte de Réception", "Consultez les messages envoyés via le formulaire de contact.")}
                {renderDisabledContent("Terrain d'Entraînement", "Entraînez l'IA en lui posant une question et en lui fournissant la réponse idéale.")}
                {renderDisabledContent("Centre de Correction", "Améliorez l'IA en corrigeant ses erreurs.")}
            </main>
        </GenericPage>
      );
  }

  return (
    <GenericPage
        title="Panneau d'Administration"
        description="Gérez, entraînez et améliorez le modèle d'IA."
    >
        <main className="space-y-8">
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        <span>Gestion des Utilisateurs</span>
                    </CardTitle>
                    <CardDescription>
                        Visualisez et gérez les utilisateurs de la plateforme.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {users.status === 'error' ? renderErrorContent("users") : (
                        users.items.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Créé le</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.items.map(u => (
                                    <TableRow key={u.uid}>
                                        <TableCell className="font-medium">{u.email}</TableCell>
                                        <TableCell>{u.displayName}</TableCell>
                                        <TableCell>{new Date(u.creationTime).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell>
                                            <Badge variant={u.disabled ? 'destructive' : 'default'}>
                                                {u.disabled ? 'Désactivé' : 'Actif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={!u.disabled}
                                                onCheckedChange={(checked) => handleToggleUserStatus(u, !checked)}
                                                disabled={isUpdating === u.uid}
                                                aria-label="Activer ou désactiver l'utilisateur"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur trouvé.</p>
                    ))}
                </CardContent>
                {users.hasMore && (
                    <CardFooter>
                        <Button
                            variant="outline"
                            onClick={() => loadMore('users')}
                            disabled={isLoadingMore === 'users'}
                            className="w-full"
                        >
                            {isLoadingMore === 'users' && <Loader2 className="mr-2 animate-spin" />}
                            Charger plus d'utilisateurs
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Inbox className="h-6 w-6 text-primary" />
                        <span>Boîte de Réception</span>
                    </CardTitle>
                    <CardDescription>
                        Consultez les messages envoyés par les utilisateurs via le formulaire de contact.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {contacts.status === 'error' ? renderErrorContent("contact_messages") : (
                        contacts.items.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/30 rounded-lg">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">Boîte de réception vide</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Aucun message n'a été reçu pour le moment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {contacts.items.map(msg => (
                                <div key={msg.id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="font-semibold">{msg.name} <span className="font-normal text-muted-foreground">&lt;{msg.email}&gt;</span></p>
                                            <p className="text-xs text-muted-foreground">Date: {new Date(msg.createdAt).toLocaleString('fr-FR')}</p>
                                        </div>
                                        <Badge variant={msg.status === 'new' ? 'destructive' : 'secondary'}>{msg.status}</Badge>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm p-2 bg-muted/50 rounded-md mt-1">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </CardContent>
                {contacts.hasMore && (
                    <CardFooter>
                        <Button
                            variant="outline"
                            onClick={() => loadMore('contacts')}
                            disabled={isLoadingMore === 'contacts'}
                            className="w-full"
                        >
                            {isLoadingMore === 'contacts' && <Loader2 className="mr-2 animate-spin" />}
                            Charger plus de messages
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span>Terrain d'Entraînement</span>
                    </CardTitle>
                    <CardDescription>
                        Entraînez l'IA en lui posant une question et en lui fournissant la réponse idéale. Ces données serviront de référence pour les futures interactions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="training-question">Question de l'utilisateur</Label>
                        <Textarea 
                            id="training-question"
                            placeholder="Ex: Comment puis-je configurer l'authentification avec Google ?"
                            value={trainingQuestion}
                            onChange={(e) => setTrainingQuestion(e.target.value)}
                            disabled={isTraining}
                        />
                     </div>
                      <div className="grid gap-2">
                        <Label htmlFor="training-answer">Réponse idéale</Label>
                        <Textarea 
                            id="training-answer"
                            placeholder="Ex: Pour configurer l'authentification Google, vous devez d'abord créer un projet sur la console Google Cloud..."
                            value={trainingAnswer}
                            onChange={(e) => setTrainingAnswer(e.target.value)}
                            className="min-h-[120px]"
                            disabled={isTraining}
                        />
                     </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        disabled={isTraining || !trainingQuestion || !trainingAnswer}
                        onClick={handleTrainingSubmit}
                    >
                        {isTraining && <Loader2 className="mr-2 animate-spin" />}
                        Soumettre l'entraînement
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Centre de Correction</CardTitle>
                    <CardDescription>
                        Améliorez l'IA en corrigeant ses erreurs. Les feedbacks "pouce en bas" apparaissent ici.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {feedback.status === 'error' ? renderErrorContent("feedback") : (
                        feedback.items.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/30 rounded-lg">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">Tout est en ordre !</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                            Aucun feedback en attente de correction.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {feedback.items.map(fb => (
                                <div key={fb.id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Utilisateur: {fb.userId}</p>
                                            <p className="text-xs text-muted-foreground">Date: {new Date(fb.createdAt).toLocaleString('fr-FR')}</p>
                                        </div>
                                        <Badge variant={fb.status === 'corrected' ? 'default' : 'secondary'} className={cn(fb.status === 'corrected' && 'bg-green-600')}>{fb.status}</Badge>
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label className="font-semibold">Requête de l'utilisateur</Label>
                                        <p className="text-sm p-2 bg-muted/50 rounded-md mt-1">{fb.userQuery}</p>
                                    </div>
                                     <div>
                                        <Label className="font-semibold">Réponse du modèle (incorrecte)</Label>
                                        <p className="text-sm p-2 bg-destructive/10 border border-destructive/20 rounded-md mt-1">{fb.modelResponse}</p>
                                    </div>
                                     <div>
                                        <Label htmlFor={`corrected-${fb.id}`} className="font-semibold">Réponse corrigée</Label>
                                        <Textarea
                                            id={`corrected-${fb.id}`}
                                            placeholder="Entrez la réponse idéale ici..."
                                            value={correctedResponses[fb.id] || fb.correctedResponse || ''}
                                            onChange={(e) => setCorrectedResponses(prev => ({...prev, [fb.id]: e.target.value}))}
                                            className="mt-1"
                                            disabled={fb.status === 'corrected' || isUpdating === fb.id}
                                        />
                                    </div>
                                    {fb.status === 'pending' && (
                                        <Button 
                                            size="sm"
                                            onClick={() => handleUpdateFeedback(fb.id)}
                                            disabled={isUpdating === fb.id || !correctedResponses[fb.id]}
                                        >
                                            {isUpdating === fb.id && <Loader2 className="mr-2 animate-spin" />}
                                            Enregistrer la correction
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </CardContent>
                 {feedback.hasMore && (
                    <CardFooter>
                        <Button
                            variant="outline"
                            onClick={() => loadMore('feedback')}
                            disabled={isLoadingMore === 'feedback'}
                            className="w-full"
                        >
                            {isLoadingMore === 'feedback' && <Loader2 className="mr-2 animate-spin" />}
                            Charger plus de feedbacks
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </main>
    </GenericPage>
  );
}

export default AdminPage;
