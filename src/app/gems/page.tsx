'use client';
import { useState, useEffect } from 'react';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Feather, Brain, Beaker, PenTool, PlusCircle, type LucideIcon, icons, MoreVertical, Trash2, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomAgent } from "@/lib/types";
import { useAuth } from "@/services/auth-service.tsx";
import { useApp } from "@/components/app-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { modelOptions } from '@/lib/models';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const lucideIconNames = Object.keys(icons);

interface Agent {
  name: string;
  description: string;
  systemPrompt?: string;
  icon: LucideIcon | string;
}

interface AssistantCategory {
  title: string;
  assistants: Agent[];
}

const predefinedAssistants: AssistantCategory[] = [
    {
      title: "Assistants de base",
      assistants: [
        { name: "Discussion générale", description: "Démarrez une conversation normale. Idéal pour les questions, les idées, ou simplement pour discuter.", icon: Bot, },
      ],
    },
    {
      title: "Créativité & Écriture",
      assistants: [
        { name: "Aide à l'écriture", description: "Obtenez de l'aide pour rédiger des e-mails, des articles, ou tout autre type de texte.", systemPrompt: "Tu es un assistant expert en écriture. Ton but est d'aider l'utilisateur à créer le meilleur texte possible. Sois proactif, pose des questions pour clarifier ses besoins (ton, audience, but) et propose des améliorations.", icon: Feather },
        { name: "Conteur d'histoires", description: "Générez des histoires courtes et créatives à partir d'un simple thème.", systemPrompt: "Tu es un maître conteur. Transforme les idées de l'utilisateur en récits captivants avec des personnages mémorables et des rebondissements inattendus.", icon: PenTool },
        { name: "Brainstorming créatif", description: "Trouvez de nouvelles idées pour vos projets, noms d'entreprise, slogans, etc.", systemPrompt: "Tu es un facilitateur de brainstorming. Ton rôle est de générer des idées originales et de pousser la créativité de l'utilisateur en explorant des angles inattendus.", icon: Brain },
      ],
    },
    {
      title: "Productivité & Analyse",
      assistants: [
        { name: "Analyseur de texte", description: "Analysez et résumez n'importe quel texte en extrayant les points clés.", systemPrompt: "Tu es un analyste de données textuelles. Extrais les informations clés, le sentiment, les entités nommées, et fournis un résumé concis de tout texte fourni par l'utilisateur.", icon: Beaker },
        { name: "Planificateur de projet", description: "Créez un plan d'action structuré pour atteindre vos objectifs.", systemPrompt: "Tu es un chef de projet expert. Transforme les objectifs de l'utilisateur en plans d'action structurés avec des étapes claires, des jalons et des dépendances.", icon: Bot },
      ],
    },
];

const AgentCard = ({ agent, onSelect, children }: { agent: Agent | CustomAgent, onSelect: (agent: Agent | CustomAgent) => void, children?: React.ReactNode }) => {
    const LucideIcon = typeof agent.icon === 'string' ? icons[agent.icon as keyof typeof icons] as LucideIcon : agent.icon;
    
    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent selection when clicking on the dropdown trigger
      if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
        return;
      }
      onSelect(agent);
    };
    
    return (
         <Card 
            className={cn("cursor-pointer group flex flex-col gradient-border-card card-hover-effect")}
            onClick={handleCardClick}
        >
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                      {LucideIcon ? <LucideIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" /> : <Bot className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />}
                  </div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
                {children}
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{agent.description}</p>
            </CardContent>
        </Card>
    )
}

export default function AgentsPage() {
    const { user } = useAuth();
    const { onNewChat } = useApp();
    const { toast } = useToast();
    const db = getFirestore(app);
    
    const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAgent, setNewAgent] = useState<Omit<CustomAgent, 'id' | 'userId'>>({ name: '', description: '', systemPrompt: '', modelId: modelOptions[0].id, icon: 'Bot' });
    
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [sharingAgent, setSharingAgent] = useState<CustomAgent | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        const q = query(collection(db, 'users', user.uid, 'agents'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomAgent));
            setCustomAgents(agents);
            setIsLoading(false);
        }, (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/agents`, operation: 'list'}));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, db]);

    const handleSelectAgent = (agent: Agent | CustomAgent) => {
        if (!user) return;
        onNewChat(agent);
    };

    const handleCreateAgent = async () => {
        if (!user) return;
        if (!newAgent.name || !newAgent.systemPrompt) {
            toast({ variant: 'destructive', title: 'Champs requis', description: "Le nom de l'agent et les instructions sont obligatoires." });
            return;
        }
        
        const agentData = { ...newAgent, userId: user.uid };
        addDoc(collection(db, 'users', user.uid, 'agents'), agentData)
            .then(() => {
                setIsCreateModalOpen(false);
                setNewAgent({ name: '', description: '', systemPrompt: '', modelId: modelOptions[0].id, icon: 'Bot' });
                toast({ title: 'Agent créé !', description: `L'agent "${newAgent.name}" est prêt à être utilisé.` });
            })
            .catch(serverError => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${user.uid}/agents`,
                    operation: 'create',
                    requestResourceData: agentData,
                }));
            });
    };
    
    const handleDeleteAgent = async (agentId: string) => {
        if (!user) return;
        deleteDoc(doc(db, 'users', user.uid, 'agents', agentId))
            .catch(serverError => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}/agents/${agentId}`, operation: 'delete'}));
            });
    };
    
    const handleOpenShareDialog = (agent: CustomAgent) => {
        setSharingAgent(agent);
        setShareEmail('');
        setShareDialogOpen(true);
    };

    const handleShareAgent = async () => {
        if (!sharingAgent || !shareEmail || !user) return;
        setIsSharing(true);
        // Sharing must be a secure server-side action. This is a placeholder.
        toast({
            title: 'Partage non disponible',
            description: "La logique de partage sécurisé est en cours de développement.",
        });
        setIsSharing(false);
        setShareDialogOpen(false);
    };

    return (
        <GenericPage
            title="Agents"
            description="Les agents sont pré-configurés pour vous aider à accomplir des tâches spécifiques. Choisissez-en un pour démarrer une nouvelle discussion ou créez le vôtre."
        >
            <div className="space-y-12">
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <>
                    {customAgents.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight mb-4">Vos Agents Personnalisés</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {customAgents.map((agent, index) => (
                                    <div key={agent.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 fill-mode-both">
                                        <AgentCard agent={agent} onSelect={handleSelectAgent}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenShareDialog(agent)}>
                                                        <Share2 className="mr-2 h-4 w-4" />
                                                        Partager
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                onSelect={(e) => e.preventDefault()}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Supprimer cet agent ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    L'agent "{agent.name}" sera supprimé définitivement. Cette action est irréversible.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                    onClick={() => handleDeleteAgent(agent.id)}
                                                                >
                                                                    Supprimer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </AgentCard>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
                )}
                {predefinedAssistants.map((category) => (
                    <div key={category.title}>
                        <h2 className="text-xl font-semibold tracking-tight mb-4">{category.title}</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                             {category.title === 'Assistants de base' && (
                                <Card className="cursor-pointer group flex flex-col items-center justify-center text-center p-6 border-dashed hover:border-solid hover:border-primary/50 hover:shadow-lg transition-all" onClick={() => setIsCreateModalOpen(true)}>
                                    <PlusCircle className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                    <CardTitle className="text-base">Créer un Agent</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Personnalisez une IA pour une tâche spécifique.</p>
                                </Card>
                            )}
                            {category.assistants.map((assistant, index) => (
                                <div key={assistant.name} style={{ animationDelay: `${index * 100}ms` }} className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 fill-mode-both">
                                    <AgentCard agent={assistant} onSelect={handleSelectAgent} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Agent Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Créer un nouvel agent</DialogTitle>
                        <DialogDescription>
                            Configurez votre propre assistant IA. Donnez-lui un nom, une mission et choisissez son cerveau.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="agent-name" className="text-right">Nom</Label>
                            <Input id="agent-name" value={newAgent.name} onChange={e => setNewAgent(p => ({...p, name: e.target.value}))} className="col-span-3" placeholder="Ex: Correcteur de code" />
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="agent-desc" className="text-right pt-2">Description</Label>
                            <Textarea id="agent-desc" value={newAgent.description} onChange={e => setNewAgent(p => ({...p, description: e.target.value}))} className="col-span-3" placeholder="Ex: Analyse le code et suggère des améliorations." />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="agent-prompt" className="text-right pt-2">Instructions (Prompt)</Label>
                            <Textarea id="agent-prompt" value={newAgent.systemPrompt} onChange={e => setNewAgent(p => ({...p, systemPrompt: e.target.value}))} className="col-span-3 min-h-[120px]" placeholder="Ex: Tu es un expert en programmation. Analyse le code fourni par l'utilisateur, identifie les erreurs, et propose des optimisations..." />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="agent-model" className="text-right">Modèle d'IA</Label>
                            <Select value={newAgent.modelId} onValueChange={modelId => setNewAgent(p => ({...p, modelId}))}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Choisir un modèle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {modelOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="agent-icon" className="text-right">Icône</Label>
                            <Select value={newAgent.icon} onValueChange={icon => setNewAgent(p => ({...p, icon}))}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Choisir une icône" />
                                </SelectTrigger>
                                <SelectContent>
                                    <ScrollArea className="h-72">
                                        {lucideIconNames.map(iconName => {
                                            const IconComponent = icons[iconName as keyof typeof icons];
                                            return (
                                                <SelectItem key={iconName} value={iconName}>
                                                    <div className="flex items-center gap-2">
                                                        {IconComponent && <IconComponent className="size-4" />}
                                                        <span>{iconName}</span>
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreateAgent}>Créer l'agent</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Agent Modal */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Partager l'agent "{sharingAgent?.name}"</DialogTitle>
                        <DialogDescription>
                            Envoyez une copie de cet agent à un autre utilisateur CygnisAI.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 pt-2">
                        <Label htmlFor="share-agent-email">Email du destinataire</Label>
                        <Input
                            id="share-agent-email"
                            type="email"
                            placeholder="nom@exemple.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            disabled={isSharing}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleShareAgent} disabled={isSharing || !shareEmail}>
                            {isSharing && <Loader2 className="mr-2 animate-spin" />}
                            Partager
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </GenericPage>
    );
}
