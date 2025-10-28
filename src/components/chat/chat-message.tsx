'use client';

import { cn } from '@/lib/utils';
import type { Message, Source } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CygnisLogo } from '../icons';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '../ui/button';
import { Clipboard, ThumbsDown, ThumbsUp, Pencil, Check, X, RefreshCw, Share2, AlertOctagon, Volume2, CheckSquare, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/services/auth-service';
import { useState, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTypingEffect } from '@/hooks/use-typing-effect';

interface ChatMessageProps {
  message: Message;
  onFeedback: (isGood: boolean, message: Message) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onRegenerate: (message: Message) => void;
  onReport: (message: Message) => void;
  onCancel: () => void;
  isSpeaking: boolean;
  onToggleAudio: (text: string) => void;
}

const TypingIndicator = ({ onCancel }: { onCancel: () => void }) => (
    <div className="flex items-center justify-between w-full">
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-auto px-2 py-1 text-xs">
            Annuler
        </Button>
    </div>
);


export function ChatMessage({ message, onFeedback, onEdit, onRegenerate, onReport, onCancel, isSpeaking, onToggleAudio }: ChatMessageProps) {
  const isModel = message.role === 'model';
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const displayedText = useTypingEffect(message.content, 10, isModel && !message.isLoading && !isSpeaking);


  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
        toast({ title: 'Copié !' });
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        toast({ variant: 'destructive', title: 'Copie échouée' });
    });
  };

  const handleShare = async (content: string) => {
      try {
        if (!navigator.share) {
            throw new Error("La fonction de partage n'est pas supportée sur ce navigateur.");
        }
        await navigator.share({
            title: 'Réponse de CygnisAI',
            text: content,
        });
      } catch (error: any) {
          if (error.name === 'AbortError') {
              // User cancelled the share dialog, do nothing.
              return;
          }
          // For other errors, including PermissionDeniedError, fallback to copy.
          handleCopy(content);
          toast({
              title: 'Copié dans le presse-papiers',
              description: 'Le partage direct a échoué, le message a été copié.',
          });
      }
  };

  const handleEditSubmit = () => {
    if (editedContent.trim() !== message.content.trim()) {
      onEdit(message.id, editedContent.trim());
    }
    setIsEditing(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
  };
  
  const handleFeedbackClick = (isGood: boolean) => {
    if (message.feedback) return; // Prevent changing feedback
    onFeedback(isGood, message);
  }
  
  const handleListen = (content: string) => {
    onToggleAudio(content);
  }

  const renderContent = (text: string) => {
    const cleanedText = text.replace(/\|\|/g, '\n');
    const lines = cleanedText.split('\n');
    const elements: (JSX.Element | string)[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
        if (isTableLine && i + 1 < lines.length && lines[i+1].trim().match(/^\|(\s*:?-+:?\s*\|)+$/)) {
            const tableLines = [];
            let tableEndIndex = i;
            while(tableEndIndex < lines.length && lines[tableEndIndex].trim().startsWith('|')) {
                tableLines.push(lines[tableEndIndex]);
                tableEndIndex++;
            }
            
            const headers = tableLines[0].split('|').slice(1, -1).map(h => h.trim());
            const rows = tableLines.slice(2).map(rowLine => rowLine.split('|').slice(1, -1).map(cell => cell.trim()));

            elements.push(
                <div key={`table-${i}`} className="my-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b">
                            <tr>
                                {headers.map((header, hIndex) => <th key={hIndex} className="p-2 font-semibold">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIndex) => (
                                <tr key={rIndex} className="border-b border-muted">
                                    {row.map((cell, cIndex) => <td key={cIndex} className="p-2">{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            i = tableEndIndex;
            continue;
        }

        const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        if (isListItem) {
            const content = line.trim().substring(2);
            elements.push(<li key={`li-${i}`} className="ml-5 list-disc">{content}</li>);
        } else if (line.trim() !== '') {
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            const regex = /(\*\*(.*?)\*\*)/g;
            let match;
            while ((match = regex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                }
                parts.push(<strong key={match.index}>{match[2]}</strong>);
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
            }
            elements.push(<p key={`p-${i}`} className="whitespace-pre-wrap text-sm leading-relaxed">{parts}</p>);
        }
        i++;
    }

    return elements;
};
  
  const hasContent = message.content || message.code || message.imageUrl || message.videoUrl;

  return (
    <div
      className={cn(
        'group/message flex items-start gap-3',
        !isModel && 'justify-end',
        'animate-in fade-in-0 slide-in-from-bottom-4 duration-500'
      )}
    >
      {isModel && (
         <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/50">
            <div className="bg-primary/20 p-1.5 rounded-full text-primary-foreground flex items-center justify-center h-full w-full">
             <CygnisLogo className="size-5" />
            </div>
         </Avatar>
      )}
      <div className="flex flex-col gap-1 max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <div
            className={cn(
            'flex-1 space-y-2 overflow-hidden rounded-xl relative',
            !isModel && 'bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] text-primary-foreground rounded-br-none shadow-lg',
            isModel && 'bg-secondary rounded-bl-none',
            )}
        >
            {isEditing ? (
              <div className="p-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-background/80 text-foreground"
                  autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(false)}><X className="size-4" /></Button>
                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleEditSubmit}><Check className="size-4" /></Button>
                </div>
              </div>
            ) : (
            <>
                {message.isLoading ? (
                    <div className="px-4 py-2 flex items-center h-10">
                        <TypingIndicator onCancel={onCancel} />
                    </div>
                ) : (
                <div className="message-content">
                     {message.content && <div className="px-4 py-3 space-y-2">{renderContent(isModel ? displayedText : message.content)}</div>}
                    
                    {message.imageUrl && (
                        <Card className="mt-2 bg-transparent border-0 shadow-none">
                            <CardContent className="p-0">
                                <Image
                                    src={message.imageUrl}
                                    alt="Generated or uploaded content"
                                    width={400}
                                    height={400}
                                    className="rounded-lg object-cover"
                                />
                            </CardContent>
                        </Card>
                    )}
                    
                    {message.videoUrl && (
                        <Card className="mt-2 bg-transparent border-0 shadow-none">
                            <CardContent className="p-0">
                                <video
                                    src={message.videoUrl}
                                    width={400}
                                    height={400}
                                    className="rounded-lg"
                                    controls
                                    autoPlay
                                    muted
                                    loop
                                />
                            </CardContent>
                        </Card>
                    )}
                    
                    {message.code && message.code.content && (
                    <div className="relative text-sm bg-[#1e1e1e] rounded-b-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-700/50">
                            <span className="text-xs text-slate-300 font-sans">{message.code.language}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => handleCopy(message.code!.content)}>
                            <Clipboard className="size-4" />
                            </Button>
                        </div>
                        <SyntaxHighlighter language={message.code.language} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem' }} codeTagProps={{ className: "text-sm font-mono"}}>
                            {message.code.content}
                        </SyntaxHighlighter>
                    </div>
                    )}
                </div>
                )}
            </>
            )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
            {isModel && !message.isLoading && (
            <>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedbackClick(true)} disabled={!!message.feedback}>
                    <ThumbsUp className={cn("size-4", message.feedback === 'good' && 'text-primary fill-primary/20')} />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedbackClick(false)} disabled={!!message.feedback}>
                    <ThumbsDown className={cn("size-4", message.feedback === 'bad' && 'text-destructive fill-destructive/20')} />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRegenerate(message)}>
                    <RefreshCw className="size-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleShare(message.content)}>
                    <Share2 className="size-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleListen(message.content)}>
                    <Volume2 className={cn("size-4", isSpeaking && "text-primary")} />
                 </Button>

                 {message.sources && message.sources.length > 0 && (
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <CheckSquare className="size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Sources</h4>
                                <p className="text-sm text-muted-foreground">
                                    Voici les sources utilisées pour générer cette réponse.
                                </p>
                            </div>
                            <ScrollArea className="h-64 mt-4">
                                <div className="space-y-4">
                                {message.sources.map((source, index) => (
                                    <div key={index} className="text-sm border-t pt-2">
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline flex items-center gap-1">
                                            {source.title} <ExternalLink className="size-3" />
                                        </a>
                                        <p className="text-muted-foreground mt-1 text-xs italic line-clamp-3">"{source.snippet}"</p>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                 )}
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReport(message)}>
                    <AlertOctagon className="size-4" />
                 </Button>
            </>
            )}
            {!isModel && !message.isLoading && !isEditing && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                    <Pencil className="size-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content)}>
                    <Clipboard className="size-4" />
                 </Button>
              </>
            )}
        </div>
      </div>
       {!isModel && user && (
         <Avatar className="h-8 w-8 shrink-0 bg-secondary">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'U'} />
            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
         </Avatar>
      )}
       {!isModel && !user && (
         <Avatar className="h-8 w-8 shrink-0 bg-secondary">
            <AvatarFallback>U</AvatarFallback>
         </Avatar>
       )}
    </div>
  );
}
