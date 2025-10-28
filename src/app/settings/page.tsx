'use client';

import { useState, useEffect } from 'react';
import { useAuth, deleteUserFromAuth, sendPasswordReset } from '@/services/auth-service';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useLocalStorage from "@/hooks/use-local-storage";
import { Moon, Sun, Download, AlertTriangle, Loader2, KeyRound, CreditCard, Palette, ShieldCheck, Archive } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
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
import { useApp } from '@/components/app-provider';
import { Badge } from '@/components/ui/badge';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';

export default function SettingsPage() {
    const { user, role, isLoading } = useAuth();
    const { theme, setTheme } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    const [responseStyle, setResponseStyle] = useLocalStorage('responseStyle', 'concise');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    const handleExportData = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            const db = getFirestore(app);
            const q = query(collection(db, 'chats'), where('members', 'array-contains', user.uid));
            const querySnapshot = await getDocs(q);
            const chats = querySnapshot.docs.map(doc => doc.data());

            if (chats && chats.length > 0) {
                const blob = new Blob([JSON.stringify(chats, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cygnisai_chats_${user.uid}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast({ title: "Exportation réussie", description: "Votre historique de discussion a été téléchargé." });
            } else {
                toast({ variant: 'destructive', title: "Aucune donnée", description: "Aucun historique de discussion à exporter." });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur d'exportation", description: "Impossible de récupérer les données de discussion." });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setIsResettingPassword(true);
        try {
            await sendPasswordReset(user.email);
            toast({
                title: "E-mail envoyé",
                description: "Un e-mail de réinitialisation de mot de passe a été envoyé à votre adresse.",
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible d'envoyer l'e-mail de réinitialisation. Réessayez plus tard.",
            });
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteUserFromAuth();
            toast({ title: "Compte supprimé", description: "Votre compte a été supprimé avec succès." });
            router.push('/');
        } catch (error: any) {
            console.error("Error deleting account:", error);
            let description = "Une erreur est survenue lors de la suppression du compte.";
            if (error.code === 'auth/requires-recent-login') {
                description = "Cette opération est sensible et nécessite une authentification récente. Veuillez vous reconnecter et réessayer.";
            }
            toast({ variant: 'destructive', title: "Échec de la suppression", description });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (isLoading || !isClient || !user) {
        return (
            <div className="flex flex-1 items-start justify-center p-4 sm:p-6 md:p-8">
                 <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
            </div>
        );
    }

    return (
        <GenericPage
            title="Paramètres"
            description="Gérez les préférences de l'application, votre compte et vos données."
        >
            <div className="space-y-8">
                {/* General Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Palette className="size-6 text-primary" />
                            <span>Préférences Générales</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 divide-y">
                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="theme-select" className="font-semibold">Thème</Label>
                            <div className="flex items-center gap-2">
                                <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('light')}><Sun className="size-5" /></Button>
                                <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTheme('dark')}><Moon className="size-5" /></Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <Label htmlFor="response-style-select" className="font-semibold">Style de réponse de l'IA</Label>
                            <Select value={responseStyle} onValueChange={setResponseStyle}>
                                <SelectTrigger id="response-style-select" className="w-[180px]">
                                    <SelectValue placeholder="Choisir un style" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="concise">Concise</SelectItem>
                                    <SelectItem value="detailed">Détaillé</SelectItem>
                                    <SelectItem value="creative">Créatif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <CreditCard className="size-6 text-primary" />
                            <span>Facturation & Abonnement</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/40">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                   <span className="font-semibold">Votre abonnement actuel</span>
                                   <Badge variant={role === 'pro' || role === 'admin' ? 'default' : 'secondary'} className="w-fit mt-1 capitalize">{role}</Badge>
                                </div>
                            </div>
                            <Button variant="outline" asChild><Link href="/upgrade">Gérer mon abonnement</Link></Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Management */}
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-3">
                            <ShieldCheck className="size-6 text-primary" />
                            <span>Sécurité du Compte</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/40">
                            <div className="flex items-center gap-4">
                                <KeyRound className="h-6 w-6 text-muted-foreground" />
                                <div className="flex flex-col">
                                   <span className="font-semibold">Mot de passe</span>
                                   <span className="text-sm text-muted-foreground">Réinitialisez votre mot de passe par e-mail.</span>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword}>
                                {isResettingPassword ? <Loader2 className="mr-2 animate-spin" /> : null}
                                Réinitialiser
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/40">
                            <div className="flex items-center gap-4">
                                <Link href="/connections" className="flex items-center gap-4">
                                    <KeyRound className="h-6 w-6 text-muted-foreground" />
                                    <div className="flex flex-col">
                                    <span className="font-semibold">Gérer les connexions</span>
                                    <span className="text-sm text-muted-foreground">Ajoutez ou supprimez des méthodes d'authentification.</span>
                                    </div>
                                </Link>
                            </div>
                            <Button variant="outline" asChild><Link href="/connections">Gérer</Link></Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Management */}
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-3">
                            <Archive className="size-6 text-primary" />
                            <span>Gestion des Données</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/40">
                             <div className="flex items-center gap-4">
                                <Download className="h-6 w-6 text-muted-foreground" />
                                 <div className="flex flex-col">
                                   <span className="font-semibold">Exporter les données</span>
                                   <span className="text-sm text-muted-foreground">Téléchargez l'historique de toutes vos discussions.</span>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                                {isExporting && <Loader2 className="mr-2 animate-spin" />}
                                Exporter
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/40">
                            <div className="flex items-center gap-4">
                                <Archive className="h-6 w-6 text-muted-foreground" />
                                <div className="flex flex-col">
                                   <span className="font-semibold">Discussions Archivées</span>
                                   <span className="text-sm text-muted-foreground">Consultez et restaurez vos discussions archivées.</span>
                                </div>
                            </div>
                            <Button variant="outline" asChild><Link href="/settings/archive">Consulter</Link></Button>
                        </div>
                    </CardContent>
                </Card>


                {/* Danger Zone */}
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Zone de Danger
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-destructive/30 bg-destructive/10 rounded-lg">
                           <div className="flex flex-col gap-1">
                                <h4 className="font-semibold">Supprimer le compte</h4>
                                <p className="text-sm text-destructive/80">Supprimez définitivement votre compte et toutes vos données. Cette action est irréversible.</p>
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isDeleting}>
                                        {isDeleting && <Loader2 className="mr-2 animate-spin" />}
                                        Supprimer le compte
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Toutes vos données, y compris l'historique des discussions et les informations de compte, seront définitivement supprimées.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                        >
                                            Oui, supprimer mon compte
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </GenericPage>
    );
}
