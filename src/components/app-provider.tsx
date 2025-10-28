'use client';

import * as React from 'react';
import { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/services/auth-service';
import type { Chat, Message, UserRole, CustomAgent, Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import type { ChatOutput, ServerChatInput } from '@/ai/schemas';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import useLocalStorage from '@/hooks/use-local-storage';
import { submitMessageAction } from '@/app/actions';
import { onSnapshot, doc, getFirestore, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';

interface Agent {
  name: string;
  description: string;
  systemPrompt?: string;
  icon: React.ElementType | string;
}

interface AppContextType {
  chat: Chat | null;
  setChat: (chat: Chat | null) => void;
  isSending: boolean;
  onSendMessage: (content: string, imageUrl?: string, documentContent?: string) => void;
  onFeedback: (isGood: boolean, message: Message) => void;
  userRole: UserRole;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onNewChat: (agent?: Agent | CustomAgent) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: (message: Message) => void;
  onReport: (message: Message) => void;
  onCancel: () => void;
  isChatLoading: boolean;
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, role: userRole, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [isSending, setIsSending] = useState(false);
  
  const [activeProject, setActiveProject] = useLocalStorage<Project | null>('activeProject', null);

  // Real-time listener for active chat
  useEffect(() => {
    const chatId = params.id;
    if (!user || !chatId || typeof chatId !== 'string') {
      setIsChatLoading(false);
      setActiveChat(null);
      return;
    }
    
    setIsChatLoading(true);
    const db = getFirestore(app);
    const chatRef = doc(db, 'chats', chatId);

    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
        if (snapshot.exists()) {
            const chatData = snapshot.data() as Omit<Chat, 'id'>;
            if (chatData.members.includes(user.uid)) {
                const fullChat: Chat = {
                    id: snapshot.id,
                    ...chatData,
                };
                setActiveChat(fullChat);
            } else {
                const permissionError = new FirestorePermissionError({
                    path: `chats/${chatId}`,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Accès non autorisé', description: 'Vous n\'êtes pas membre de cette discussion.' });
                setActiveChat(null);
                router.push('/chat');
            }
        } else {
            toast({ variant: 'destructive', title: 'Discussion introuvable' });
            setActiveChat(null);
            router.push('/chat');
        }
        setIsChatLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
          path: `chats/${chatId}`,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsChatLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user?.uid]);


  useEffect(() => {
    if (!user && !isAuthLoading) {
      // Clear all data if user logs out
      setActiveChat(null);
      setIsChatLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthLoading]);

  const setChat = (chat: Chat | null) => {
    if (chat) {
      router.push(`/chat/${chat.id}`);
    } else {
      router.push('/chat');
    }
    setActiveChat(chat);
  };
  
    const onNewChat = async (agent?: Agent | CustomAgent) => {
        if (!user) return;
        const db = getFirestore(app);
        const chatsCollection = collection(db, 'chats');

        const newChatData = {
            title: agent ? `Discussion: ${agent.name}` : 'Nouvelle discussion',
            userId: user.uid,
            members: [user.uid],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            messages: [],
            isArchived: false,
            ...(agent?.systemPrompt && { systemPrompt: agent.systemPrompt }),
            ...(activeProject && { projectId: activeProject.id }),
        };

        try {
            const newChatRef = await addDoc(chatsCollection, newChatData);
            router.push(`/chat/${newChatRef.id}`);
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: `chats`,
                operation: 'create',
                requestResourceData: newChatData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };
  
    const onSendMessage = async (content: string, imageUrl?: string, documentContent?: string) => {
        if (isSending || !user) return;

        setIsSending(true);
        abortControllerRef.current = new AbortController();

        const db = getFirestore(app);
        let finalChat = activeChat;

        // If there's no active chat, create one first.
        if (!finalChat) {
            const title = content.substring(0, 30);
            const newChatData = {
                title,
                userId: user.uid,
                members: [user.uid],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                messages: [],
                isArchived: false,
                ...(activeProject && { projectId: activeProject.id }),
            };
            try {
                const newChatRef = await addDoc(collection(db, 'chats'), newChatData);
                finalChat = { id: newChatRef.id, ...newChatData, createdAt: Date.now(), updatedAt: Date.now() }; // approximate timestamps
                router.push(`/chat/${finalChat.id}`, { scroll: false });
            } catch (e) {
                const permissionError = new FirestorePermissionError({ path: 'chats', operation: 'create', requestResourceData: newChatData });
                errorEmitter.emit('permission-error', permissionError);
                setIsSending(false);
                return;
            }
        }
        
        const currentChatId = finalChat.id;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            imageUrl,
            documentContent,
            createdAt: new Date().toISOString(),
        };
        
        const chatRef = doc(db, 'chats', currentChatId);

        // Optimistically update UI
        setActiveChat(prev => prev ? ({ ...prev, messages: [...prev.messages, userMessage] }) : null);

        // Add user message to Firestore
        updateDoc(chatRef, {
            messages: arrayUnion(userMessage),
            updatedAt: serverTimestamp()
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: `chats/${currentChatId}`, operation: 'update', requestResourceData: { messages: '...arrayUnion' } });
            errorEmitter.emit('permission-error', permissionError);
             // Revert optimistic update
            setActiveChat(prev => prev ? ({ ...prev, messages: prev.messages.slice(0, -1) }) : null);
            setIsSending(false);
        });

        try {
            if (activeChat?.messages.length === 0) { // Renaming for the first message
                 updateDoc(chatRef, { title: content.substring(0, 30) });
            }

            const historyForAI = [...(activeChat?.messages || []), userMessage];
            
            const result: ChatOutput = await submitMessageAction({
                userId: user.uid,
                chatId: currentChatId,
                chatHistory: historyForAI.map(m => ({ role: m.role, content: m.content })),
                message: content,
                imageUrl,
                documentContent,
                systemPrompt: finalChat.systemPrompt,
                modelId: localStorage.getItem('selectedModel')?.replace(/"/g, '') || undefined,
            } as ServerChatInput);

            const finalModelMessage: Message = { 
                id: crypto.randomUUID(),
                role: 'model',
                content: result.text || '', 
                isLoading: false, 
                sources: result.sources, 
                code: result.code,
                createdAt: new Date().toISOString(),
            };

            if (result.error) {
                finalModelMessage.content = `Erreur: ${result.error}`;
                toast({ variant: 'destructive', title: "Erreur de l'IA", description: result.error });
            }
            
            updateDoc(chatRef, {
                messages: arrayUnion(finalModelMessage),
                updatedAt: serverTimestamp()
            });

        } catch (error: any) {
             if (error.name !== 'AbortError') {
                const errorMessage = "Une erreur est survenue lors de la génération de la réponse.";
                toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
                const errorModelMessage: Message = { id: crypto.randomUUID(), role: 'model', content: `Erreur: ${errorMessage}`, isLoading: false, createdAt: new Date().toISOString() };
                updateDoc(chatRef, {
                    messages: arrayUnion(errorModelMessage)
                });
             } else {
                 toast({ title: 'Génération annulée' });
             }
        } finally {
            setIsSending(false);
            abortControllerRef.current = null;
        }
    };


  const onEditMessage = (messageId: string, newContent: string) => {
    const messageIndex = activeChat?.messages.findIndex(m => m.id === messageId);
    if (activeChat && messageIndex !== undefined && messageIndex > -1) {
      const newHistory = activeChat.messages.slice(0, messageIndex + 1);
      newHistory[messageIndex].content = newContent;
      setActiveChat({ ...activeChat, messages: newHistory });
      onSendMessage(newContent, newHistory[messageIndex].imageUrl);
    }
  };

  const onRegenerate = (message: Message) => {
    if (!activeChat) return;
    const modelMessageIndex = activeChat.messages.findIndex(m => m.id === message.id);
    if (modelMessageIndex !== undefined && modelMessageIndex > 0) {
      const userMessage = activeChat.messages[modelMessageIndex - 1];
      const historyBeforeUserMessage = activeChat.messages.slice(0, modelMessageIndex - 1);
      setActiveChat({ ...activeChat, messages: historyBeforeUserMessage });
      onSendMessage(userMessage.content, userMessage.imageUrl, userMessage.documentContent);
    }
  };

    const onFeedback = async (isGood: boolean, message: Message) => {
        if (!activeChat || !user) return;
        const db = getFirestore(app);

        if (!isGood) {
            const userQueryIndex = activeChat.messages.findIndex(m => m.id === message.id) - 1;
            const userQuery = userQueryIndex >= 0 ? activeChat.messages[userQueryIndex].content : 'N/A';
            
            const feedbackData = {
                userId: user.uid,
                chatId: activeChat.id,
                userQuery,
                modelResponse: message.content,
                status: 'pending',
                createdAt: serverTimestamp(),
            };

            addDoc(collection(db, 'feedback'), feedbackData).catch(serverError => {
                 const permissionError = new FirestorePermissionError({ path: `feedback`, operation: 'create', requestResourceData: feedbackData });
                 errorEmitter.emit('permission-error', permissionError);
            });
            toast({ title: 'Merci !', description: 'Votre avis a été envoyé pour analyse.' });
        } else {
            toast({ title: 'Merci !', description: 'Votre avis positif a été pris en compte.' });
        }
    };
  
  const onCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSending(false);
    }
  };

  const onReport = () => {
    toast({ title: 'Signalement', description: "Cette fonctionnalité n'est pas encore implémentée." });
  };


  const contextValue: AppContextType = {
    chat: activeChat,
    setChat,
    isSending,
    onSendMessage,
    onFeedback,
    userRole,
    theme,
    setTheme,
    onNewChat,
    onEditMessage,
    onRegenerate,
    onReport,
    onCancel,
    isChatLoading,
    activeProject,
    setActiveProject,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
