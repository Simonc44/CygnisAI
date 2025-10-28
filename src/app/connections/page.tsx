
'use client';
import { useState, useEffect } from 'react';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, linkWithGitHub, linkWithGoogle, unlinkProvider } from '@/services/auth-service';
import { Mail, Link, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { UserInfo } from 'firebase/auth';
import { GitHubIcon, GoogleIcon } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FirebaseError } from 'firebase/app';


const ProviderIcon = ({ providerId }: { providerId: string }) => {
    switch (providerId) {
        case 'password':
            return <Mail className="h-6 w-6 text-muted-foreground" />;
        case 'google.com':
            return <GoogleIcon className="h-6 w-6" />;
        case 'github.com':
            return <GitHubIcon className="h-6 w-6" />;
        default:
            return <Link className="h-6 w-6 text-muted-foreground" />;
    }
}

const ProviderName = ({ providerId }: { providerId: string }) => {
     switch (providerId) {
        case 'password':
            return 'Email et Mot de passe';
        case 'google.com':
            return 'Google';
        case 'github.com':
            return 'GitHub';
        default:
            return providerId;
    }
}


export default function ConnectionsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [providers, setProviders] = useState<UserInfo[]>([]);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setProviders(user.providerData);
        }
    }, [user]);

    const isProviderLinked = (providerId: string) => {
        return providers.some(p => p.providerId === providerId);
    }

    const handleLinkProvider = async (provider: 'google' | 'github') => {
        setLoadingProvider(provider);
        try {
            const linkFunction = provider === 'google' ? linkWithGoogle : linkWithGitHub;
            const updatedUser = await linkFunction();
            
            if (updatedUser) {
                setProviders(updatedUser.providerData);
                toast({
                    title: 'Compte associé !',
                    description: `Votre compte ${provider === 'google' ? 'Google' : 'GitHub'} a été associé avec succès.`,
                });
            }

        } catch (error: any) {
            let description = 'Une erreur est survenue lors de l\'association.';
            if (error instanceof FirebaseError) {
                 switch (error.code) {
                    case 'auth/popup-blocked':
                    case 'auth/cancelled-popup-request':
                        description = 'Le pop-up a été bloqué par le navigateur. Veuillez autoriser les pop-ups et réessayer.';
                        break;
                    case 'auth/popup-closed-by-user':
                        description = "La fenêtre de connexion a été fermée avant la fin de l'opération.";
                        break;
                    case 'auth/credential-already-in-use':
                        description = `Ce compte est déjà associé à un autre utilisateur.`;
                        break;
                    default:
                        description = `Erreur: ${error.message}`;
                        break;
                 }
            }
            console.error(`Failed to link ${provider}`, error);
            toast({
                variant: 'destructive',
                title: `Échec de l'association`,
                description,
            });
        } finally {
            setLoadingProvider(null);
        }
    }
    
    const handleUnlinkProvider = async (providerId: string) => {
        setLoadingProvider(providerId);
         try {
            const updatedUser = await unlinkProvider(providerId);
            if (updatedUser) {
                setProviders(updatedUser.providerData);
                toast({
                    title: 'Compte dissocié',
                    description: `Le fournisseur de connexion a été supprimé avec succès.`,
                });
            }
        } catch (error: any) {
            let description = 'Une erreur est survenue.';
            if (error.code === 'auth/requires-recent-login') {
                description = 'Cette opération est sensible. Veuillez vous reconnecter et réessayer.';
            } else if (error.message.includes("dernière méthode de connexion")) {
                 description = "Impossible de dissocier votre dernière méthode de connexion.";
            }
            toast({
                variant: 'destructive',
                title: 'Échec de la dissociation',
                description,
            });
        } finally {
            setLoadingProvider(null);
        }
    }

  return (
    <GenericPage
      title="Connexions"
      description="Gérez les méthodes d'authentification associées à votre compte."
    >
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Méthodes de connexion actives</CardTitle>
                <CardDescription>Vous pouvez utiliser ces services pour vous connecter à votre compte CygnisAI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {providers.map(provider => (
                     <div key={provider.uid || provider.providerId} className="flex items-center justify-between p-4 border rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-4">
                           <ProviderIcon providerId={provider.providerId} />
                           <div className="flex flex-col">
                               <span className="font-semibold"><ProviderName providerId={provider.providerId} /></span>
                               <span className="text-sm text-muted-foreground">{provider.email || provider.displayName}</span>
                           </div>
                        </div>
                        {provider.providerId !== 'password' ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={loadingProvider === provider.providerId}>
                                        {loadingProvider === provider.providerId ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4 mr-2"/>}
                                        Dissocier
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Dissocier le compte <ProviderName providerId={provider.providerId} /> ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Vous ne pourrez plus utiliser ce service pour vous connecter. Cette action est irréversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => handleUnlinkProvider(provider.providerId)}
                                        >
                                            Oui, dissocier
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                           <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                     </div>
                 ))}
            </CardContent>
        </Card>

        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-xl">Associer un nouveau compte</CardTitle>
                <CardDescription>Connectez d'autres services pour les utiliser comme méthode de connexion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isProviderLinked('google.com') && (
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                             <GoogleIcon className="h-6 w-6" />
                             <span className="font-semibold">Google</span>
                        </div>
                        <Button onClick={() => handleLinkProvider('google')} disabled={!!loadingProvider}>
                            {loadingProvider === 'google' ? <Loader2 className="animate-spin" /> : 'Associer'}
                        </Button>
                     </div>
                )}
                 {!isProviderLinked('github.com') && (
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                             <GitHubIcon className="h-6 w-6" />
                             <span className="font-semibold">GitHub</span>
                        </div>
                        <Button onClick={() => handleLinkProvider('github')} disabled={!!loadingProvider}>
                            {loadingProvider === 'github' ? <Loader2 className="animate-spin" /> : 'Associer'}
                        </Button>
                     </div>
                )}
                {isProviderLinked('google.com') && isProviderLinked('github.com') && (
                    <p className="text-sm text-muted-foreground text-center py-4">Tous les fournisseurs disponibles sont déjà associés à votre compte.</p>
                )}
            </CardContent>
        </Card>
    </GenericPage>
  );
}
