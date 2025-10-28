'use client';
import { useState, useEffect, useTransition } from 'react';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, CheckCircle, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';
import { type Chat } from '@/lib/types';
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
import { useRouter } from 'next/navigation';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ArchivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const db = getFirestore(app);
    const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const q = query(collection(db, 'chats'), where('members', 'array-contains', user.uid), where('isArchived', '==', true));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
            setArchivedChats(chats.sort((a,b) => b.updatedAt - a.updatedAt));
            setIsLoading(false);
        }, (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `chats`, operation: 'list' }));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, db]);

    const handleUnarchive = (chatId: string) => {
        if (!user) return;
        startTransition(async () => {
            const chatRef = doc(db, 'chats', chatId);
            updateDoc(chatRef, { isArchived: false })
                .then(() => toast({ title: 'Discussion restaurée', description: 'La discussion est de retour dans votre liste principale.' }))
                .catch(() => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `chats/${chatId}`, operation: 'update', requestResourceData: { isArchived: false }}));
                });
        });
    };

    const handleDelete = (chatId: string) => {
        if (!user) return;
        startTransition(async () => {
            const chatRef = doc(db, 'chats', chatId);
            deleteDoc(chatRef)
                .then(() => toast({ title: 'Discussion supprimée', description: 'La discussion archivée a été supprimée définitivement.' }))
                .catch(() => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `chats/${chatId}`, operation: 'delete'}));
                });
        });
    };

    return (
        <GenericPage
            title="Discussions Archivées"
            description="Consultez, restaurez ou supprimez définitivement vos discussions archivées."
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-6 w-6 text-primary" />
                        <span>Archives</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : archivedChats.length > 0 ? (
                        <ul className="space-y-3">
                            {archivedChats.map(chat => (
                                <li key={chat.id} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/30 gap-4">
                                    <div className="flex items-center gap-3 flex-grow overflow-hidden">
                                        <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Archivé le : {new Date(chat.updatedAt).toLocaleString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center shrink-0 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnarchive(chat.id)}
                                            disabled={isPending}
                                        >
                                            <ArchiveRestore className="h-4 w-4 mr-2" />
                                            Restaurer
                                        </Button>
                                        <AlertDialog onOpenChange={setIsDialogOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={isPending}>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Supprimer
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Êtes-vous sûr de vouloir supprimer cette discussion archivée ? Cette action est irréversible.
                                                        <br/><br/>
                                                        <span className="italic text-foreground p-2 bg-muted rounded-md block">"{chat.title}"</span>
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={() => handleDelete(chat.id)}
                                                    >
                                                        Oui, supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 bg-secondary/30 rounded-lg">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">Aucune archive</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Vous n'avez aucune discussion archivée pour le moment.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </GenericPage>
    );
}
