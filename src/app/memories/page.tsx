'use client';
import { useState, useEffect, useTransition } from 'react';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Trash2, AlertTriangle, Loader2, Eraser } from 'lucide-react';
import { useAuth } from '@/services/auth-service';
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
import { useToast } from '@/hooks/use-toast';
import { type Memory } from '@/lib/types';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function MemoriesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const db = getFirestore(app);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const memoriesQuery = query(collection(db, 'users', user.uid, 'memories'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(memoriesQuery, (snapshot) => {
            const userMemories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Memory));
            setMemories(userMemories);
            setIsLoading(false);
        }, (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/memories`, operation: 'list'}));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, db]);

    const handleDelete = (memoryId: string) => {
        if (!user) return;
        startTransition(async () => {
            const docRef = doc(db, 'users', user.uid, 'memories', memoryId);
            deleteDoc(docRef)
                .then(() => toast({ title: 'Souvenir supprimé', description: 'Le souvenir a été effacé avec succès.' }))
                .catch(() => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/memories/${memoryId}`, operation: 'delete'}));
                });
        });
    };
    
     const handleClearAll = () => {
        if (!user || memories.length === 0) return;
        startTransition(async () => {
             const batch = writeBatch(db);
             memories.forEach(memory => {
                 const docRef = doc(db, 'users', user!.uid, 'memories', memory.id);
                 batch.delete(docRef);
             });
             batch.commit()
                .then(() => toast({ title: 'Mémoire effacée', description: `${memories.length} souvenirs ont été supprimés.` }))
                .catch(() => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/memories`, operation: 'delete'}));
                });
        });
    };

    return (
        <GenericPage
            title="Mémoire à long terme"
            description="L'IA se souvient des faits clés de vos conversations pour personnaliser votre expérience. Vous pouvez consulter et supprimer ces souvenirs ici."
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-6 w-6 text-primary" />
                            <span>Souvenirs Enregistrés</span>
                        </CardTitle>
                        <CardDescription>
                            Voici ce que l'IA a retenu pour mieux vous assister. Ces données sont synchronisées sur tous vos appareils.
                        </CardDescription>
                    </div>
                    {memories.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
                                    Tout supprimer
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Vider toute la mémoire ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible et supprimera les {memories.length} souvenirs enregistrés dans votre compte.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={handleClearAll}
                                        disabled={isPending}
                                    >
                                        Oui, tout supprimer
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : memories.length > 0 ? (
                        <ul className="space-y-3">
                            {memories.map(memory => (
                                <li key={memory.id} className="flex items-start justify-between p-3 border rounded-lg bg-secondary/30 gap-4">
                                    <div className="flex-grow">
                                        <p className="text-sm text-foreground">{memory.fact}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(memory.createdAt).toLocaleString('fr-FR')}</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer ce souvenir ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   Êtes-vous sûr de vouloir supprimer ce souvenir ? Cette action est irréversible.
                                                   <br/><br/>
                                                   <span className="italic text-foreground p-2 bg-muted rounded-md block">"{memory.fact}"</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={() => handleDelete(memory.id)}
                                                >
                                                    Supprimer
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 bg-secondary/30 rounded-lg">
                            <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Aucun souvenir</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                L'IA n'a pas encore mémorisé de faits importants.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </GenericPage>
    );
}
