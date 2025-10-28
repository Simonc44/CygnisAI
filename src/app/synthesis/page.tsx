
'use client';
import { useState, useEffect, useTransition } from 'react';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';
import { getChatsForUserAction, type Chat } from '@/app/actions';
import { Loader2, Sparkles, Wand, FileText, AlertTriangle } from 'lucide-react';
import { submitMessageAction } from '@/app/actions';
import type { ServerChatInput, ChatOutput } from '@/ai/schemas';
import { ChatMessage } from '@/components/chat/chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SynthesisPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChats, setSelectedChats] = useState<string[]>([]);
    const [prompt, setPrompt] = useState<string>("Fais-moi une synthèse des points clés.");
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [synthesisResult, setSynthesisResult] = useState<ChatOutput | null>(null);

    useEffect(() => {
        if (user) {
            getChatsForUserAction(user.uid)
                .then(userChats => setChats(userChats.filter(c => !c.isArchived)))
                .catch(() => toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les discussions.' }))
                .finally(() => setIsLoading(false));
        }
    }, [user, toast]);

    const handleSelectChat = (chatId: string) => {
        setSelectedChats(prev =>
            prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
        );
    };

    const handleGenerate = async () => {
        if (!user || selectedChats.length === 0 || !prompt) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner au moins une discussion et entrer une instruction.' });
            return;
        }

        setIsGenerating(true);
        setSynthesisResult(null);

        const chatsToSynthesize = chats.filter(c => selectedChats.includes(c.id));
        
        let combinedContent = `Voici le contenu de ${chatsToSynthesize.length} discussion(s) :\n\n`;
        chatsToSynthesize.forEach(chat => {
            combinedContent += `--- DEBUT DISCUSSION: "${chat.title}" ---\n`;
            chat.messages.forEach(msg => {
                combinedContent += `${msg.role === 'user' ? 'Utilisateur' : 'Modèle'}: ${msg.content}\n`;
            });
            combinedContent += `--- FIN DISCUSSION: "${chat.title}" ---\n\n`;
        });
        
        const finalPrompt = `En te basant sur le contenu des discussions fournies, réponds à la demande suivante : "${prompt}".\nNe mentionne pas le fait que tu te bases sur des discussions, réponds directement à la demande.`;

        const input: ServerChatInput = {
            userId: user.uid,
            chatId: null,
            chatHistory: [],
            message: finalPrompt,
            documentContent: combinedContent,
            systemPrompt: "Tu es un assistant expert en synthèse et analyse de conversations. Ta tâche est de lire les transcriptions de discussions fournies et de répondre à la demande de l'utilisateur en te basant exclusivement sur ce contenu.",
        };

        try {
            const result = await submitMessageAction(input);
            setSynthesisResult(result);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur de synthèse', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (!user) {
        return (
            <GenericPage title="Synthèse de Discussions">
                 <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                    <h3 className="mt-4 text-lg font-medium">Accès Restreint</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Vous devez être connecté pour accéder à cette fonctionnalité.
                    </p>
                </div>
            </GenericPage>
        )
    }

    return (
        <GenericPage
            title="Synthèse de Discussions"
            description="Analysez une ou plusieurs discussions pour en extraire des résumés, des tâches, ou des informations clés."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne de sélection des chats */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Sélectionnez les discussions</CardTitle>
                            <CardDescription>Cochez les conversations à analyser.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                            ) : chats.length > 0 ? (
                                <ScrollArea className="h-96 pr-4">
                                    <div className="space-y-3">
                                        {chats.map(chat => (
                                            <div
                                                key={chat.id}
                                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                            >
                                                <Checkbox
                                                    id={`chat-${chat.id}`}
                                                    checked={selectedChats.includes(chat.id)}
                                                    onCheckedChange={() => handleSelectChat(chat.id)}
                                                />
                                                <label
                                                    htmlFor={`chat-${chat.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                                >
                                                    {chat.title}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">Aucune discussion disponible.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Colonne de prompt et de résultat */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Définissez votre objectif</CardTitle>
                            <CardDescription>Que doit faire l'IA avec le contenu des discussions sélectionnées ?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Ex: Fais-moi un résumé des points clés, liste toutes les tâches à faire, ou écris un e-mail récapitulatif..."
                                className="min-h-[100px]"
                            />
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isGenerating || selectedChats.length === 0 || !prompt}
                        >
                            {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                            Lancer la synthèse
                        </Button>
                    </div>

                    {isGenerating && (
                        <div className="flex justify-center py-8">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="animate-spin" />
                                <span>Génération de la synthèse en cours...</span>
                            </div>
                        </div>
                    )}
                    
                    {synthesisResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText />
                                    Résultat de la synthèse
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChatMessage
                                    message={{
                                        id: 'synthesis-result',
                                        role: 'model',
                                        content: synthesisResult.text || '',
                                        code: synthesisResult.code,
                                        sources: synthesisResult.sources,
                                        createdAt: new Date().toISOString()
                                    }}
                                    onFeedback={() => {}}
                                    onEdit={() => {}}
                                    onRegenerate={() => {}}
                                    onReport={() => {}}
                                    onCancel={() => {}}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </GenericPage>
    );
}
