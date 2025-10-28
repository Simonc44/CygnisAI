
'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, MoreHorizontal, Trash2, Edit, Settings, LogOut, Bot, BrainCircuit, Rocket, Shield, Brain, LifeBuoy, Package, Mail, Search, ChevronDown, Folder, Archive, Share2, Loader2, Copy, Users, Wand, Briefcase, FolderPlus, User, Settings2 } from 'lucide-react';
import type { Chat, UserRole, Project } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '../ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import NextLink from 'next/link';
import { type User as AuthUser } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePathname } from 'next/navigation';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from '../ui/label';
import { useAuth } from '@/services/auth-service';
import { collection, query, where, onSnapshot, getFirestore, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface ChatHistoryProps {
  user: AuthUser | null;
  userRole: UserRole;
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onLogout: () => void;
  onDialogStateChange: (isOpen: boolean) => void;
  onClearChat: () => void;
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

export function ChatHistory({
  user,
  userRole,
  activeChatId,
  onNewChat,
  onSelectChat,
  onLogout,
  onDialogStateChange,
  activeProject,
  setActiveProject,
}: ChatHistoryProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const db = getFirestore(app);

  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState<string | null>('Localisation...');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isManageProjectsModalOpen, setIsManageProjectsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isDeletingProject, setIsDeletingProject] = useState<string | null>(null);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharingChat, setSharingChat] = useState<Chat | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    const projectsQuery = query(collection(db, 'users', user.uid, 'projects'));
    const chatsQuery = query(collection(db, 'chats'), where('members', 'array-contains', user.uid));

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
        const userProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(userProjects);
    }, (error) => {
        const permissionError = new FirestorePermissionError({ path: `users/${user.uid}/projects`, operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    });

    const unsubChats = onSnapshot(chatsQuery, (snapshot) => {
        const userChats = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Chat))
            .filter(chat => !chat.isArchived);
        setChats(userChats);
    }, (error) => {
        const permissionError = new FirestorePermissionError({ path: 'chats', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    });

    setIsLoading(false);

    return () => {
        unsubProjects();
        unsubChats();
    };
}, [user, db]);
  

  useEffect(() => {
    onDialogStateChange(isDialogOpen || shareDialogOpen || isProjectModalOpen || isManageProjectsModalOpen);
  }, [isDialogOpen, shareDialogOpen, isProjectModalOpen, isManageProjectsModalOpen, onDialogStateChange]);
  
    const onRemoveChat = async (chatId: string) => {
        deleteDoc(doc(db, 'chats', chatId)).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: `chats/${chatId}`, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const onRenameChat = async (chatId: string, newTitle: string) => {
        updateDoc(doc(db, 'chats', chatId), { title: newTitle }).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: `chats/${chatId}`, operation: 'update', requestResourceData: { title: newTitle } });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const onArchiveChat = async (chatId: string) => {
        updateDoc(doc(db, 'chats', chatId), { isArchived: true }).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: `chats/${chatId}`, operation: 'update', requestResourceData: { isArchived: true } });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  
    const onCreateProject = async (name: string) => {
        if (!user) return;
        const newProjectData = { name, userId: user.uid, createdAt: serverTimestamp() };
        addDoc(collection(db, 'users', user.uid, 'projects'), newProjectData).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: `users/${user.uid}/projects`, operation: 'create', requestResourceData: newProjectData });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    const onDeleteProject = async (projectId: string) => {
        if (!user) return;
        setIsDeletingProject(projectId);
        const projectDocRef = doc(db, 'users', user.uid, 'projects', projectId);
        
        deleteDoc(projectDocRef)
            .then(() => {
                toast({ title: "Projet supprimé", description: `Le projet a été supprimé.` });
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: projectDocRef.path,
                    operation: 'delete'
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsDeletingProject(null);
            });
    }
  
  const handleRename = (id: string, currentTitle: string) => {
    setRenameId(id);
    setRenameValue(currentTitle);
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameId && renameValue.trim()) {
      onRenameChat(renameId, renameValue.trim());
      setRenameId(null);
      setRenameValue('');
    }
  }

  const handleOpenShareDialog = (chat: Chat) => {
    setSharingChat(chat);
    setShareEmail('');
    setShareDialogOpen(true);
  }
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
        await onCreateProject(newProjectName.trim());
        toast({ title: "Projet créé", description: `Le projet "${newProjectName.trim()}" a été créé.` });
        setNewProjectName('');
        setIsProjectModalOpen(false);
    } catch(e) {
        // Error is handled by emitter
    }
  }

    const handleDeleteProject = async (projectId: string, projectName: string) => {
        await onDeleteProject(projectId);
    }

    const handleShare = async (type: 'copy' | 'invite') => {
        if (!sharingChat || !shareEmail || !user) return;
        setIsSharing(true);
        // Sharing logic needs to be a server-side action for security
        // The old actions were removed. This requires a new secure implementation.
        // For now, we will show a toast.
        toast({
            title: 'Partage non disponible',
            description: "La logique de partage sécurisé est en cours de développement.",
        });
        setIsSharing(false);
        setShareDialogOpen(false);
    };
  
   useEffect(() => {
    if (!navigator.geolocation) {
      // setLocation("Géolocalisation non supportée");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`);
        const data = await response.json();
        if (data.city && data.countryName) {
          setLocation(`${data.city}, ${data.countryName}`);
        } else {
          // setLocation("Localisation inconnue");
        }
      } catch (error) {
        // setLocation("Erreur de localisation");
      }
    }, (error) => {
      //  setLocation("Localisation désactivée");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }
  
  const isActionDisabled = isDialogOpen || isLoading || isSharing;

  const filteredChats = chats.filter(chat => {
    const isChatInProject = activeProject ? chat.projectId === activeProject.id : !chat.projectId;
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase());
    return isChatInProject && matchesSearch;
  });

  return (
    <>
       <SidebarHeader>
        <div className="flex flex-col gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-auto">
                        <div className="flex items-center gap-2">
                            {activeProject ? <Briefcase className="size-4" /> : <User className="size-4" />}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-muted-foreground">Projet</span>
                                <span className="font-semibold text-sm truncate">{activeProject?.name || "Personnel"}</span>
                            </div>
                        </div>
                        <ChevronDown className="ml-auto size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--sidebar-width)]">
                    <DropdownMenuLabel>Changer de projet</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={activeProject?.id || 'personal'} onValueChange={(value) => {
                        if (value === 'personal') {
                            setActiveProject(null);
                        } else {
                            const project = projects.find(p => p.id === value);
                            if (project) setActiveProject(project);
                        }
                    }}>
                        <DropdownMenuRadioItem value="personal">Personnel</DropdownMenuRadioItem>
                        {projects && projects.map(project => (
                            <DropdownMenuRadioItem key={project.id} value={project.id}>{project.name}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsProjectModalOpen(true)}>
                        <FolderPlus className="mr-2" />
                        <span>Nouveau projet</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsManageProjectsModalOpen(true)}>
                        <Settings2 className="mr-2" />
                        <span>Gérer les projets</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="default"
              className="h-10 w-full justify-start glow-on-hover"
              onClick={onNewChat}
              disabled={isActionDisabled}
            >
              <Plus className="mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">Nouvelle discussion</span>
            </Button>
        </div>
        <div className="relative group-data-[collapsible=icon]:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80 z-10" />
            <Input 
                placeholder="Rechercher..." 
                className={cn(
                  'h-8 pl-9 text-xs rounded-lg',
                  'bg-muted/40 border-transparent',
                  'focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:border-primary/50',
                  'transition-colors duration-200'
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Modèles" isActive={pathname.startsWith('/settings/model')} disabled={isActionDisabled}>
                <NextLink href="/settings/model">
                <BrainCircuit />
                <span>Modèles</span>
                </NextLink>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Agents" isActive={pathname.startsWith('/gems')} disabled={isActionDisabled}>
                <NextLink href="/gems">
                <Bot />
                <span>Agents</span>
                </NextLink>
            </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Synthèse" isActive={pathname.startsWith('/synthesis')} disabled={isActionDisabled}>
                    <NextLink href="/synthesis">
                        <Wand />
                        <span>Synthèse</span>
                    </NextLink>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Mémoire" isActive={pathname.startsWith('/memories')} disabled={isActionDisabled}>
                <NextLink href="/memories">
                <Brain />
                <span>Mémoire</span>
                </NextLink>
            </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarSeparator />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="hover:no-underline text-xs font-medium text-sidebar-foreground/70 px-2 py-2 justify-start gap-2 group-data-[collapsible=icon]:justify-center">
              <Folder className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Ressources</span>
              <ChevronDown className="size-4 ml-auto shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden" />
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Connecteurs" isActive={pathname.startsWith('/connectors')} disabled={isActionDisabled}>
                        <NextLink href="/connectors">
                            <Users />
                            <span>Connecteurs</span>
                        </NextLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Produits & API" isActive={pathname.startsWith('/product')} disabled={isActionDisabled}>
                        <NextLink href="/product">
                            <Package />
                            <span>Produits</span>
                        </NextLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Aide" isActive={pathname.startsWith('/help')} disabled={isActionDisabled}>
                        <NextLink href="/help">
                            <LifeBuoy />
                            <span>Aide</span>
                        </NextLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Contact" isActive={pathname.startsWith('/contact')} disabled={isActionDisabled}>
                        <NextLink href="/contact">
                            <Mail />
                            <span>Contact</span>
                        </NextLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        </Accordion>


        <ScrollArea className="h-full">
            {isLoading ? (
                <div className="p-2 space-y-2">
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                </div>
            ) : filteredChats.length > 0 ? (
            <SidebarGroup>
                <SidebarGroupLabel>
                Discussions récentes
                </SidebarGroupLabel>
                
                <SidebarMenu>
                {filteredChats.map(chat =>
                    renameId === chat.id ? (
                    <form key={chat.id} onSubmit={handleRenameSubmit} className="px-2">
                        <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => setRenameId(null)}
                        className="h-8"
                        disabled={isActionDisabled}
                        />
                    </form>
                    ) : (
                    <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                        onClick={() => onSelectChat(chat.id)}
                        isActive={activeChatId === chat.id && pathname.startsWith('/chat')}
                        tooltip={chat.title}
                        disabled={isActionDisabled}
                    >
                        {chat.members.length > 1 ? <Users /> : <MessageSquare />}
                        <span>{chat.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction asChild showOnHover>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isActionDisabled}>
                            <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleRename(chat.id, chat.title)}>
                                <Edit className="mr-2" /> Renommer
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleOpenShareDialog(chat)}>
                                <Share2 className="mr-2" /> Partager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onArchiveChat(chat.id)}>
                                <Archive className="mr-2" /> Archiver
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog onOpenChange={setIsDialogOpen}>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                  >
                                  <Trash2 className="mr-2" />
                                  <span>Supprimer</span>
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Cette action supprimera définitivement la discussion &quot;{chat.title}&quot;.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                      onClick={() => onRemoveChat(chat.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                      Supprimer
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuAction>
                    </SidebarMenuItem>
                    )
                )}
                </SidebarMenu>
            </SidebarGroup>
            ) : (
                 <div className="p-4 text-center text-sm text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                    {searchTerm ? "Aucune discussion ne correspond à votre recherche." : "Aucune discussion dans ce projet."}
                </div>
            )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="p-2">
          {userRole === 'free' && userRole !== 'admin' && (
            <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Passer à Pro" isActive={pathname.startsWith('/upgrade')} disabled={isActionDisabled}>
                      <NextLink href="/upgrade">
                          <Rocket />
                          <span>Passer à Pro</span>
                      </NextLink>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
          {userRole === 'admin' && (
             <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Panel" isActive={pathname.startsWith('/admin')} disabled={isActionDisabled}>
                      <NextLink href="/admin">
                          <Shield />
                          <span>Admin</span>
                      </NextLink>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto w-full justify-start items-center gap-3 p-2" disabled={isActionDisabled}>
                    <Avatar className="size-8">
                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                     <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-sidebar-foreground truncate">{user?.displayName || user?.email}</span>
                          {userRole === 'pro' && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pro</Badge>}
                          {userRole === 'admin' && <Badge className={cn("bg-primary/20 text-primary-foreground border-primary/30")}>Admin</Badge>}
                        </div>
                        <span className="text-xs text-sidebar-foreground/70 truncate">{location}</span>
                     </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="mb-2 w-56">
                <DropdownMenuItem asChild>
                     <NextLink href="/settings">
                          <Settings />
                          <span>Paramètres & Activité</span>
                      </NextLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                    <LogOut />
                    <span>Se déconnecter</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
           </DropdownMenu>
      </SidebarFooter>
      
      {/* Share Chat Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Partager la discussion "{sharingChat?.title}"</DialogTitle>
                <DialogDescription>
                    Invitez un autre utilisateur à collaborer ou envoyez-lui une copie de la discussion.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
                <Label htmlFor="share-email">Email du destinataire</Label>
                <Input 
                    id="share-email" 
                    type="email" 
                    placeholder="nom@exemple.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    disabled={isSharing}
                />
            </div>
            <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="secondary" className="w-full flex items-center gap-2" onClick={() => handleShare('copy')} disabled={isSharing || !shareEmail}>
                    {isSharing && <Loader2 className="animate-spin" />}
                    <Copy className="size-4" />
                    Envoyer une copie
                </Button>
                <Button className="w-full flex items-center gap-2" onClick={() => handleShare('invite')} disabled={isSharing || !shareEmail}>
                    {isSharing && <Loader2 className="animate-spin" />}
                    <Users className="size-4" />
                    Inviter à collaborer
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* New Project Dialog */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau Projet</DialogTitle>
            <DialogDescription>
              Les projets vous aident à organiser vos discussions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Nom
              </Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Refonte du site web"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateProject}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Projects Dialog */}
      <Dialog open={isManageProjectsModalOpen} onOpenChange={setIsManageProjectsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer les projets</DialogTitle>
            <DialogDescription>
              Supprimez les projets dont vous n'avez plus besoin. La suppression d'un projet entraîne la suppression de toutes les discussions qu'il contient.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96 pr-4 -mr-4 mt-4">
            <div className="space-y-2">
              {projects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <span className="font-medium">{project.name}</span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" disabled={isDeletingProject === project.id}>
                                {isDeletingProject === project.id ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4"/>}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le projet "{project.name}" ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Toutes les discussions associées à ce projet seront également supprimées.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => handleDeleteProject(project.id, project.name)}
                                >
                                    Oui, supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                    Vous n'avez pas encore de projets.
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

    

    