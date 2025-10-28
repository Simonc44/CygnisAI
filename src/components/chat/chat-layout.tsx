'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useApp } from '@/components/app-provider';
import { useAuth } from '@/services/auth-service.tsx';
import { ChatHistory } from '@/components/chat/chat-history';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOutUser } from '@/services/auth-service.tsx';
import { LoadingScreen } from '../loading-screen';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { ChevronDown, Rocket, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const GUEST_ACCESSIBLE_PAGES = ['/', '/login', '/signup', '/terms', '/privacy', '/demo'];


function LayoutForLoggedInUser({ children }: { children: React.ReactNode }) {
    const { user, role, isLoading: isAuthLoading } = useAuth();
    const { chat, setChat, isChatLoading, onNewChat, activeProject, setActiveProject } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const { open, setOpen } = useSidebar();
    const [isSidebarLocked, setIsSidebarLocked] = useState(false);
    
    const isPro = role === 'pro' || role === 'admin';
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isSidebarLocked) return;
            const sidebarWidth = 256; // 16rem
            if (e.clientX < 15 && !open) {
                setOpen(true);
            } else if (e.clientX > sidebarWidth && open) {
                setOpen(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [open, setOpen, isSidebarLocked]);

    // Redirect logged-in users away from guest pages
    useEffect(() => {
        if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/' || pathname === '/demo')) {
            router.replace('/chat');
        }
    }, [user, pathname, router]);

    const handleSelectChat = (chatId: string) => {
        router.push(`/chat/${chatId}`);
    };

    const handleLogout = async () => {
        await signOutUser();
        toast({ title: 'Déconnexion réussie', description: 'Vous avez été déconnecté.' });
        router.push('/');
    }
    

    const getPageTitle = () => {
        if (pathname.startsWith('/gems')) return 'Agents';
        if (pathname.startsWith('/upgrade')) return 'Abonnement';
        if (pathname.startsWith('/settings/archive')) return 'Archives';
        if (pathname.startsWith('/settings')) return 'Paramètres';
        if (pathname.startsWith('/memories')) return 'Mémoire';
        if (pathname.startsWith('/connections')) return 'Connexions';
        if (pathname.startsWith('/admin')) return 'Admin';
        if (pathname.startsWith('/product')) return 'Produits & API';
        if (pathname.startsWith('/help')) return 'Aide & FAQ';
        if (pathname.startsWith('/contact')) return 'Contact';
        if (pathname.startsWith('/connectors')) return 'Connecteurs';
        if (pathname.startsWith('/synthesis')) return 'Synthèse';
        
        if (chat) {
            return chat.title;
        }
        
        return "Nouvelle discussion";
    }


    useEffect(() => {
        if (role !== 'admin' && pathname.startsWith('/admin')) {
          router.push('/chat');
          toast({
            variant: 'destructive',
            title: 'Accès non autorisé',
            description: 'Cette page est réservée aux administrateurs.'
          });
        }
    }, [role, pathname, router, toast]);

    if (isAuthLoading) {
        return <LoadingScreen />
    }
    
    const pageTitle = getPageTitle();
    
    return (
      <div className="flex h-screen w-full bg-background">
          <Sidebar 
            collapsible="offcanvas" 
            className="group-data-[collapsible=icon]:-ml-1"
          >
          <ChatHistory
              user={user}
              userRole={role}
              activeChatId={chat?.id || null}
              onNewChat={() => onNewChat()}
              onSelectChat={handleSelectChat}
              onLogout={handleLogout}
              onDialogStateChange={setIsSidebarLocked}
              onClearChat={() => setChat(null)}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
          />
          </Sidebar>
          <SidebarInset className="flex flex-col">
          <header className="flex h-12 items-center border-b px-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2 ml-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-1.5 px-2 -ml-2">
                            <h1 className="truncate text-lg font-semibold md:text-base font-headline">{pageTitle}</h1>
                            <ChevronDown className="size-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                         <DropdownMenuLabel>
                            {isPro ? "Vous êtes un membre Pro" : "Plan Gratuit"}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/upgrade" className="cursor-pointer">
                                {isPro ? <Settings className="mr-2" /> : <Rocket className="mr-2 text-primary" />}
                                <span>{isPro ? "Gérer l'abonnement" : "Passer à Pro"}</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </header>
          {children}
          </SidebarInset>
      </div>
    )
}


export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !GUEST_ACCESSIBLE_PAGES.includes(pathname)) {
      router.replace('/');
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading && !GUEST_ACCESSIBLE_PAGES.includes(pathname)) {
    return <LoadingScreen />;
  }
  
  if (!user && GUEST_ACCESSIBLE_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return <LoadingScreen />;
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
        <LayoutForLoggedInUser>{children}</LayoutForLoggedInUser>
    </SidebarProvider>
  );
}
