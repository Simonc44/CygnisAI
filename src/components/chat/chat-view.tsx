
'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Chat, Message, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, CornerDownLeft, Mic, Video, Image as ImageIcon, BrainCircuit, Paperclip, Code, Loader2, Star, Cpu, Languages, Square, Volume2, AudioLines } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatWelcome } from './chat-welcome';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import type { LearnFromUrlInput } from '@/ai/schemas';
import Link from 'next/link';
import { useAuth } from '@/services/auth-service.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLocalStorage from '@/hooks/use-local-storage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { modelOptions } from '@/lib/models';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Dynamically import the generation functions
const generateImage = () => import('@/ai/flows/image-generation-flow').then(mod => mod.generateImage);
const generateVideo = () => import('@/ai/flows/video-generation-flow').then(mod => mod.generateVideo);
const generateCode = () => import('@/ai/flows/code-generation-flow').then(mod => mod.generateCode);
const learnFromUrl = () => import('@/ai/flows/url-learning-flow').then(mod => mod.learnFromUrl);
const textToSpeech = () => import('@/ai/flows/tts-flow').then(mod => mod.textToSpeech);


declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface ChatViewProps {
  chat: Chat | null;
  isSending: boolean;
  onSendMessage: (content: string, imageUrl?: string, documentContent?: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onFeedback: (isGood: boolean, message: Message) => void;
  onRegenerate: (message: Message) => void;
  onReport: (message: Message) => void;
  onCancel: () => void;
  userRole?: UserRole;
}

export function ChatView({ chat, isSending, onSendMessage, onEditMessage, onFeedback, onRegenerate, userRole = 'guest', onReport, onCancel }: ChatViewProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);

  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [learningUrl, setLearningUrl] = useState('');
  const [learningPrompt, setLearningPrompt] = useState('');
  const [codePrompt, setCodePrompt] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [translationLang, setTranslationLang] = useState('English');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useLocalStorage<string>('selectedModel', 'cygnis-a1');
  const [audioResponse, setAudioResponse] = useLocalStorage<'auto' | 'manual'>('audioResponse', 'manual');
  const isPro = userRole === 'pro' || userRole === 'admin';

 const handleGenerateImageSubmit = async () => {
    if (!imagePrompt) return;
    setIsProcessing(true);
    setIsImageModalOpen(false);
    onSendMessage(`system:Génération d'une image pour : "${imagePrompt}"`);
    try {
        const genImageFunc = await generateImage();
        const imageUrl = await genImageFunc(imagePrompt);
        onSendMessage(`Voici l'image que j'ai créée pour "${imagePrompt}"`, imageUrl);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Erreur de génération d\'image', description: e.message });
        setIsProcessing(false);
    } finally {
        setImagePrompt('');
        setIsProcessing(false);
    }
  };

 const handleGenerateVideoSubmit = async () => {
    if (!videoPrompt) return;
    setIsProcessing(true);
    setIsVideoModalOpen(false);
    onSendMessage(`system:Génération d'une vidéo pour : "${videoPrompt}"`);
    try {
        const genVideoFunc = await generateVideo();
        const { videoUrl } = await genVideoFunc(videoPrompt);
        onSendMessage(`Voici la vidéo que j'ai créée pour "${videoPrompt}".`, videoUrl);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Erreur de génération de vidéo', description: e.message });
    } finally {
        setVideoPrompt('');
        setIsProcessing(false);
    }
  };

 const handleLearnFromUrlSubmit = async () => {
    if (!learningUrl) return;
    setIsProcessing(true);
    setIsLearningModalOpen(false);
    onSendMessage(`system:Analyse de l'URL : ${learningUrl}`);
    try {
        const learnFunc = await learnFromUrl();
        const result = await learnFunc({ url: learningUrl, prompt: learningPrompt });
        onSendMessage(result);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Erreur d\'apprentissage', description: e.message });
    } finally {
        setLearningUrl('');
        setLearningPrompt('');
        setIsProcessing(false);
    }
  };

  const handleGenerateCodeSubmit = async () => {
    if (!codePrompt) return;
    setIsProcessing(true);
    setIsCodeModalOpen(false);
    onSendMessage(`system:Génération de code pour : "${codePrompt}"`);
    try {
        const genCodeFunc = await generateCode();
        const { code, language } = await genCodeFunc(codePrompt);
        onSendMessage(`Voici le code que j'ai généré pour vous en ${language}:\n\`\`\`${language}\n${code}\n\`\`\``);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Erreur de génération de code', description: e.message });
    } finally {
        setCodePrompt('');
        setIsProcessing(false);
    }
  };
  
 const handleTranslateSubmit = async () => {
    if (!translationText) return;
    setIsProcessing(true);
    setIsTranslationModalOpen(false);

    // Send a system command to the backend
    onSendMessage(`system:translate:${translationLang}:${translationText}`);
    
    // Clear the fields after sending
    setTranslationText('');
    setTranslationLang('English');
    setIsProcessing(false);
};


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({ variant: 'destructive', title: 'Erreur de reconnaissance vocale', description: event.error });
      }
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
    };
  }, [toast]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
    
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setInput(prev => prev + finalTranscript + interimTranscript);
        };
    }
  }, []);


  const handleMicClick = async () => {
    if (!recognitionRef.current) {
        toast({
            variant: 'destructive',
            title: 'Fonctionnalité non prise en charge',
            description: "La reconnaissance vocale n'est pas prise en charge par votre navigateur.",
        });
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }
    
    setInput('');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
    } catch (err) {
      console.error("Error getting mic permission", err);
      toast({
        variant: 'destructive',
        title: 'Permission du microphone refusée',
        description: "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.",
      });
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || isProcessing) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (!result) return;
        
        if (file.type.startsWith('image/')) {
            onSendMessage(`Analyse cette image pour moi : ${file.name}`, result as string);
        } else {
            onSendMessage(`Analyse ce document pour moi : ${file.name}`, undefined, result as string);
        }
    };
    
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Erreur de lecture', description: 'Impossible de lire le fichier.'});
    }

    if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf' || file.type === 'text/plain' || file.type === 'text/markdown') {
        reader.readAsText(file);
    } else {
        toast({ variant: 'destructive', title: 'Fichier invalide', description: 'Veuillez sélectionner un fichier image, PDF, ou texte.'});
    }

    // Reset the input so the same file can be selected again
    if(event.target) event.target.value = '';
  };
  
    const handleToggleAudio = async (message: Message) => {
        if (speakingMessageId === message.id) {
            audioRef.current?.pause();
            setSpeakingMessageId(null);
            return;
        }

        setIsProcessing(true);
        try {
            const ttsFunc = await textToSpeech();
            const audioData = await ttsFunc(message.content);
            if (audioData) {
                if (!audioRef.current) {
                    audioRef.current = new Audio();
                }
                audioRef.current.src = audioData;
                audioRef.current.play();
                setSpeakingMessageId(message.id);
                audioRef.current.onended = () => {
                    setSpeakingMessageId(null);
                };
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erreur de lecture audio', description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if(viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [chat?.messages]);

  const handleModelChange = (modelId: string) => {
    const model = modelOptions.find(m => m.id === modelId);
    if (!model) return;
    
    if (model.isPro && !isPro) {
        toast({
            variant: 'destructive',
            title: 'Fonctionnalité Pro',
            description: `Le modèle ${model.name} est réservé aux membres Pro.`,
            action: <Button asChild size="sm"><Link href="/upgrade">Passer à Pro</Link></Button>
        });
        return;
    }
    setSelectedModel(modelId);
  }
  
    useEffect(() => {
        const lastMessage = chat?.messages[chat.messages.length - 1];
        if (lastMessage?.role === 'model' && !lastMessage.isLoading && lastMessage.content && audioResponse === 'auto') {
            handleToggleAudio(lastMessage);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chat?.messages, audioResponse]);


  const anyActionInProgress = isSending || isProcessing;
  
  const AttachmentMenuItem = ({ icon, text, onClick, isProFeature = false }: { icon: React.ElementType, text: string, onClick: () => void, isProFeature?: boolean }) => {
    const Icon = icon;
    const isDisabled = isProFeature && !isPro;

    const handleClick = () => {
        if (isDisabled) {
             toast({
                variant: 'destructive',
                title: 'Fonctionnalité Pro',
                description: `"${text}" est réservé aux membres Pro.`,
                action: <Button asChild size="sm"><Link href="/upgrade">Passer à Pro</Link></Button>
            });
        } else {
            onClick();
        }
    };
    
    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex w-full items-center gap-2 rounded p-2 text-sm text-left hover:bg-muted",
                isDisabled && "cursor-not-allowed opacity-60"
            )}
        >
            <Icon className="size-4" />
            <span className="flex-1">{text}</span>
            {isProFeature && <Star className="size-3 text-yellow-400 fill-yellow-400/20" />}
        </button>
    );
  };
  
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="relative flex-1">
        <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
          <div className="mx-auto max-w-3xl px-4 py-6">
            {chat && chat.messages.length > 0 ? (
              <div className="space-y-6">
                {chat.messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    onFeedback={onFeedback}
                    onEdit={onEditMessage}
                    onRegenerate={onRegenerate}
                    onReport={onReport}
                    onCancel={onCancel}
                    isSpeaking={speakingMessageId === message.id}
                    onToggleAudio={() => handleToggleAudio(message)}
                  />
                ))}
              </div>
            ) : (
              <ChatWelcome onSuggestionClick={(prompt, action) => {
                if (action === 'start_chat') {
                  setInput(prompt);
                  inputRef.current?.focus();
                } else if (action === 'generate_code') {
                  setCodePrompt(prompt);
                  setIsCodeModalOpen(true);
                } else if (action === 'generate_image') {
                   if (!isPro) {
                        toast({ variant: 'destructive', title: 'Fonctionnalité Pro', description: 'La génération d\'images est réservée aux membres Pro.' });
                        return;
                    }
                  setImagePrompt(prompt);
                  setIsImageModalOpen(true);
                }
              }}/>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background/80 backdrop-blur shrink-0">
        <div className="mx-auto max-w-3xl px-4 pt-4 pb-2">
          {userRole === 'guest' && (
             <div className="flex items-center justify-center gap-2 rounded-md border bg-card/80 mb-2 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                <span>Vous êtes en mode invité. L'historique ne sera pas sauvegardé. <Link href="/signup" className="underline font-semibold text-primary/80 hover:text-primary">S'inscrire</Link></span>
             </div>
          )}
          <div className="relative flex items-center gap-2">
            <Select value={selectedModel} onValueChange={handleModelChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SelectTrigger className="w-auto h-auto p-2 bg-secondary border-none rounded-full">
                            <Cpu className="size-5" />
                        </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Choisir le modèle d'IA</p>
                    </TooltipContent>
                </Tooltip>
                <SelectContent>
                    {modelOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id} disabled={opt.isComingSoon || (opt.isPro && !isPro)}>
                             <div className="flex items-center gap-2">
                                <span>{opt.name}</span>
                                {opt.isPro && <Star className="size-3 text-yellow-400 fill-yellow-400/20" />}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Cygnis..."
              className="min-h-[48px] resize-none rounded-2xl border-border/60 bg-secondary pr-20 shadow-sm"
              rows={1}
              disabled={anyActionInProgress}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 transform flex items-center gap-1">
              {isSending ? (
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 rounded-md transition-all active:scale-95 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  onClick={onCancel}
                >
                  <Square className="h-4 w-4" />
                  <span className="sr-only">Annuler</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-full transition-transform active:scale-95 glow-on-hover"
                  disabled={!input.trim() || anyActionInProgress}
                  onClick={handleSubmit}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  <span className="sr-only">Envoyer</span>
                </Button>
              )}
              <div className="absolute -right-1 -bottom-5 hidden text-[10px] text-muted-foreground md:block">
                <CornerDownLeft className="mr-1 inline-block h-2 w-2" />
                Enter
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 mt-2">
             <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleMicClick} data-active={isListening} className="h-8 w-8 transition-transform active:scale-95" disabled={anyActionInProgress}>
                            <Mic className={cn('size-5', isListening && 'text-primary animate-pulse')}/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isListening ? "Arrêter l'écoute" : "Utiliser le micro"}</p></TooltipContent>
                </Tooltip>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 transition-transform active:scale-95" disabled={anyActionInProgress}>
                             <Paperclip className='size-5'/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-2" align="start">
                        <div className="space-y-1">
                           <AttachmentMenuItem icon={ImageIcon} text="Générer une image" onClick={() => setIsImageModalOpen(true)} isProFeature={true} />
                           <AttachmentMenuItem icon={Video} text="Générer une vidéo" onClick={() => setIsVideoModalOpen(true)} isProFeature={true} />
                           <AttachmentMenuItem icon={BrainCircuit} text="Apprendre d'une URL" onClick={() => setIsLearningModalOpen(true)} isProFeature={true} />
                           <Separator className="my-1" />
                           <AttachmentMenuItem icon={Code} text="Générer du code" onClick={() => setIsCodeModalOpen(true)} />
                           <AttachmentMenuItem icon={Languages} text="Traduire du texte" onClick={() => setIsTranslationModalOpen(true)} />
                           <Separator className="my-1" />
                           <AttachmentMenuItem icon={Paperclip} text="Joindre un fichier" onClick={() => fileInputRef.current?.click()} isProFeature={true} />
                        </div>
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 transition-transform active:scale-95" disabled={anyActionInProgress}>
                             <Volume2 className={cn('size-5', audioResponse === 'auto' && 'text-primary')}/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-3" align="start">
                         <div className="space-y-2">
                           <h4 className="font-medium leading-none">Réponse Audio</h4>
                           <p className="text-sm text-muted-foreground">
                             Choisissez si l'IA doit répondre vocalement.
                           </p>
                         </div>
                         <RadioGroup value={audioResponse} onValueChange={(value: 'auto' | 'manual') => setAudioResponse(value)} className="grid gap-2 mt-4">
                           <div className="flex items-center space-x-2">
                             <RadioGroupItem value="auto" id="r-auto" />
                             <Label htmlFor="r-auto">Automatique</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                             <RadioGroupItem value="manual" id="r-manual" />
                             <Label htmlFor="r-manual">Manuel</Label>
                           </div>
                         </RadioGroup>
                    </PopoverContent>
                </Popover>

             </div>
             <div>
                {/* Espace réservé pour d'éventuels boutons à droite */}
             </div>
             
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,text/plain,text/markdown" disabled={anyActionInProgress || !isPro} />
          </div>
        </div>
      </div>
      
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer une image</DialogTitle>
            <DialogDescription>
              Décrivez l'image que vous souhaitez créer.
            </DialogDescription>
          </DialogHeader>
          <Input 
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Ex: Un astronaute surfant sur une vague cosmique"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>Annuler</Button>
            <Button disabled={isProcessing || !imagePrompt} onClick={handleGenerateImageSubmit}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer une vidéo</DialogTitle>
            <DialogDescription>
              Décrivez la vidéo que vous souhaitez créer. La génération peut prendre jusqu'à une minute.
            </DialogDescription>
          </DialogHeader>
          <Input 
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="Ex: Un dragon majestueux survolant une forêt"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVideoModalOpen(false)}>Annuler</Button>
            <Button disabled={isProcessing || !videoPrompt} onClick={handleGenerateVideoSubmit}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isLearningModalOpen} onOpenChange={setIsLearningModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apprendre depuis une URL</DialogTitle>
            <DialogDescription>
              Fournissez une URL pour que l'IA en analyse le contenu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={learningUrl}
              onChange={(e) => setLearningUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <Textarea
              value={learningPrompt}
              onChange={(e) => setLearningPrompt(e.target.value)}
              placeholder="Optionnel : que dois-je rechercher spécifiquement ? (Ex: résume-moi les points clés)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLearningModalOpen(false)}>Annuler</Button>
            <Button disabled={isProcessing || !learningUrl} onClick={handleLearnFromUrlSubmit}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Démarrer l'apprentissage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
             <DialogTitle>Générateur de Code</DialogTitle>
             <DialogDescription>
                Décrivez le composant, la fonction ou l'application que vous souhaitez créer. Soyez aussi précis que possible.
             </DialogDescription>
          </DialogHeader>
           <Textarea
              value={codePrompt}
              onChange={(e) => setCodePrompt(e.target.value)}
              placeholder="Ex: Un composant de bouton React en TypeScript avec des props pour le variant (primary, secondary) et la taille (sm, md, lg) en utilisant Tailwind CSS."
              className="min-h-[150px]"
           />
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsCodeModalOpen(false)}>Fermer</Button>
             <Button disabled={isProcessing || !codePrompt} onClick={handleGenerateCodeSubmit}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer le code
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isTranslationModalOpen} onOpenChange={setIsTranslationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Traduire du texte</DialogTitle>
            <DialogDescription>
              Entrez le texte à traduire et choisissez la langue cible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={translationText}
              onChange={(e) => setTranslationText(e.target.value)}
              placeholder="Entrez le texte ici..."
              className="min-h-[120px]"
            />
            <Select value={translationLang} onValueChange={setTranslationLang}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisir une langue" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="English">Anglais</SelectItem>
                    <SelectItem value="French">Français</SelectItem>
                    <SelectItem value="Spanish">Espagnol</SelectItem>
                    <SelectItem value="German">Allemand</SelectItem>
                    <SelectItem value="Japanese">Japonais</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTranslationModalOpen(false)}>Annuler</Button>
            <Button disabled={isProcessing || !translationText} onClick={handleTranslateSubmit}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Traduire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
