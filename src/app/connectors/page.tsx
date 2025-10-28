
'use client';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2 } from "lucide-react";
import { useAuth, linkWithGitHub, linkWithGoogle, unlinkProvider } from "@/services/auth-service";
import { useRouter } from "next/navigation";

// SVG Icon Components
const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GmailIcon = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
        alt="Gmail icon"
        width={24}
        height={24}
        {...props}
    />
);


const GoogleCalendarIcon = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
        alt="Google Calendar icon"
        width={24}
        height={24}
        {...props}
    />
);

const initialConnectors = [
    { id: 'github', name: 'Github', description: 'Analysez des dépôts, suivez les problèmes et plus encore.', icon: GitHubIcon, providerId: 'github.com' },
    { id: 'gmail', name: 'Gmail', description: 'Connectez votre boîte de réception pour analyser vos emails.', icon: GmailIcon, providerId: 'google.com' },
    { id: 'google_calendar', name: 'Google Agenda', description: 'Gérez vos événements et planifiez des tâches.', icon: GoogleCalendarIcon, providerId: 'google.com' },
];

export default function ConnectorsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [providers, setProviders] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setProviders(user.providerData.map(p => p.providerId));
        }
    }, [user]);

    const isProviderLinked = (providerId: string | null) => {
        return providerId ? providers.includes(providerId) : false;
    };

    const handleLinkProvider = async (connector: typeof initialConnectors[0]) => {
        const { id, providerId, name } = connector;
        if (!user) return;
        
        if (!providerId) {
            toast({ title: `L'intégration de ce connecteur est en cours de développement.` });
            return;
        };

        setIsProcessing(id);
        
        try {
            let updatedUser: typeof user | null = null;
            if (providerId === 'github.com') {
                updatedUser = await linkWithGitHub();
            } else if (providerId === 'google.com') {
                updatedUser = await linkWithGoogle();
            }

            if (updatedUser) {
                setProviders(updatedUser.providerData.map(p => p.providerId));
                toast({ title: "Compte associé !", description: `Votre compte ${name} a été associé avec succès.` });
            }
        } finally {
            setIsProcessing(null);
        }
    };
    
    const handleUnlinkProvider = async (providerId: string, name: string) => {
        setIsProcessing(providerId);
        try {
            const updatedUser = await unlinkProvider(providerId as any);
            if (updatedUser) {
                setProviders(updatedUser.providerData.map(p => p.providerId));
                toast({ title: 'Compte dissocié', description: `Le fournisseur ${name} a été supprimé.` });
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const handleToggleConnector = (connector: typeof initialConnectors[0]) => {
        const { providerId, name } = connector;

        if (isProviderLinked(providerId)) {
            // Unlink logic
            if (!providerId) return;
            if (providerId === 'google.com') {
                handleUnlinkProvider(providerId, 'Google');
            } else {
                handleUnlinkProvider(providerId, name);
            }
        } else {
            // Link logic
            if (!providerId) {
                toast({ title: `L'intégration de ce connecteur est en cours de développement.` });
                return;
            }
            handleLinkProvider(connector);
        }
    };

  return (
    <GenericPage
      title="Connecteurs"
      description="Connectez vos applications et services tiers pour permettre à CygnisAI de travailler avec vos données."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialConnectors.map((connector) => {
            const isConfigured = isProviderLinked(connector.providerId);
            return (
                <Card key={connector.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <connector.icon className="w-8 h-8" />
                      <CardTitle>{connector.name}</CardTitle>
                    </div>
                    <CardDescription>{connector.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <div>
                        <strong>Statut : </strong> 
                        <Badge variant={isConfigured ? 'default' : 'secondary'} className={cn(isConfigured ? 'bg-green-600' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')}>
                            {isConfigured ? 'Connecté' : 'Non configuré'}
                        </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button 
                                className="w-full" 
                                variant={isConfigured ? 'destructive' : 'default'} 
                                disabled={!!isProcessing}
                            >
                                {isProcessing === connector.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {isConfigured ? 'Déconnecter' : 'Configurer'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir {isConfigured ? 'déconnecter' : 'configurer'} le connecteur {connector.name}?
                                    {isConfigured && connector.providerId === 'google.com' && " Cela déconnectera tous les services Google (Gmail, Calendar)."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setIsProcessing(null)}>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleToggleConnector(connector)} 
                                    className={cn(isConfigured && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                                    disabled={isProcessing === connector.id}
                                >
                                    Confirmer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
            )
        })}
      </div>
    </GenericPage>
  );
}
