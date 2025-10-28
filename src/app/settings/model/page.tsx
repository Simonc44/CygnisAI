
'use client';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Sparkles, Gem, Bot, Star, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import useLocalStorage from "@/hooks/use-local-storage";
import { CygnisLogo, GoogleIcon, GitHubIcon, OpenAILogo, GoogleGemmaLogo, QwenLogo, DeepSeekLogo, MoonshotAILogo } from "@/components/icons";
import { useAuth } from "@/services/auth-service.tsx";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { modelOptions } from "@/lib/models";

// We need a mapping from model ID to its icon component and color tag
const modelMetadata: Record<string, { icon: React.FC<any>; tags: string[]; tagsColor: "blue" | "purple" | "green" | "yellow" }> = {
    'cygnis-a1': { icon: CygnisLogo, tags: ["Recommandé", "Rapide"], tagsColor: "yellow" },
    'google/gemma-2-9b-it:free': { icon: GoogleGemmaLogo, tags: ["OpenRouter", "Rapide"], tagsColor: "blue" },
    'deepseek/deepseek-chat-v3.1:free': { icon: DeepSeekLogo, tags: ["OpenRouter", "Discussion"], tagsColor: "green" },
    'moonshotai/kimi-k2:free': { icon: MoonshotAILogo, tags: ["OpenRouter", "Long Contexte"], tagsColor: "green" },
    'cygnis_a2': { icon: CygnisLogo, tags: ["Pro", "Multimodal"], tagsColor: "purple" },
    'alibaba/tongyi-deepresearch-30b-a3b:free': { icon: QwenLogo, tags: ["Pro", "Recherche"], tagsColor: "purple" },
    'qwen/qwen3-coder:free': { icon: QwenLogo, tags: ["Pro", "Code"], tagsColor: "purple" },
    'openai/gpt-oss-20b:free': { icon: OpenAILogo, tags: ["Pro", "Puissant", "Code"], tagsColor: "blue" },
};


export default function ModelSettingsPage() {
    const { toast } = useToast();
    const { role } = useAuth();
    const [selectedModel, setSelectedModel] = useLocalStorage<string>('selectedModel', 'cygnis-a1');
    const isPro = role === 'pro' || role === 'admin';

    const handleModelChange = (model: (typeof modelOptions)[0]) => {
        if (model.isComingSoon) {
             toast({
                title: "Bientôt disponible",
                description: `Le modèle ${model.name} n'est pas encore activé.`,
            });
            return;
        }
        if (model.isPro && !isPro) {
            toast({
                variant: 'destructive',
                title: "Fonctionnalité Pro",
                description: "Ce modèle est réservé aux membres Pro.",
                action: <Button asChild size="sm"><Link href="/upgrade">Passer à Pro</Link></Button>
            });
            return;
        }

        setSelectedModel(model.id);
        toast({
            title: "Modèle mis à jour",
            description: `Le modèle actif est maintenant ${model.name}.`,
        });
    }

    const freeModels = modelOptions.filter(m => !m.isPro);
    const proModels = modelOptions.filter(m => m.isPro);

    const ModelCard = ({ model }: { model: (typeof modelOptions)[0] }) => {
        const metadata = modelMetadata[model.id];
        const Icon = metadata?.icon || Bot;

        return (
            <Card
                key={model.id}
                className={cn(
                    "group flex flex-col transition-all duration-200",
                    (model.isPro && !isPro) || model.isComingSoon ? 'bg-secondary/30 opacity-70 hover:opacity-100' : 'cursor-pointer',
                    selectedModel === model.id && 'border-primary ring-2 ring-primary/50'
                )}
                onClick={() => handleModelChange(model)}
            >
                <CardHeader>
                    <CardTitle className="text-base flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <Icon className={cn("h-6 w-6 shrink-0", (selectedModel === model.id || model.id.startsWith('cygnis')) && 'text-primary')} />
                            <span className="truncate">{model.name}</span>
                        </div>
                         <Switch
                            checked={selectedModel === model.id}
                            onCheckedChange={(checked) => {
                                if (checked) handleModelChange(model);
                            }}
                            disabled={(model.isPro && !isPro) || model.isComingSoon}
                            aria-label={`Select ${model.name} model`}
                        />
                    </CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex flex-wrap gap-2">
                        {model.isComingSoon && (
                             <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">
                                <Clock className="size-3 mr-1" />
                                Bientôt disponible
                            </Badge>
                        )}
                        {metadata?.tags.map(tag => (
                            <span
                                key={tag}
                                className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    metadata.tagsColor === "blue" && "bg-blue-500/20 text-blue-300",
                                    metadata.tagsColor === "purple" && "bg-purple-500/20 text-purple-300",
                                    metadata.tagsColor === "green" && "bg-green-500/20 text-green-300",
                                    metadata.tagsColor === "yellow" && "bg-yellow-500/20 text-yellow-300"
                                )}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </CardContent>
                 {model.isPro && !isPro && !model.isComingSoon && (
                    <div className="p-4 pt-0 text-xs text-yellow-400/80 flex items-center gap-1.5">
                        <Star className="size-4 fill-yellow-400/20" /> 
                        <span>Réservé aux membres Pro</span>
                    </div>
                 )}
            </Card>
        )
    };


    return (
        <GenericPage
            title="Sélection du Modèle d'IA"
            description="Choisissez le modèle qui alimente vos conversations, en fonction de vos besoins."
        >
            <div className="space-y-8">
                <Alert>
                    <Cpu className="h-4 w-4" />
                    <AlertTitle>Choix du modèle de génération de texte</AlertTitle>
                    <AlertDescription>
                        Votre sélection sera utilisée pour toutes les nouvelles conversations. Les modèles d'images, vidéo et audio sont sélectionnés automatiquement.
                    </AlertDescription>
                </Alert>

                <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4">Modèles Gratuits</h2>
                     <div className="grid gap-4 md:grid-cols-2">
                        {freeModels.map(model => <ModelCard key={model.id} model={model} />)}
                    </div>
                </div>
                
                 <div>
                    <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
                        <Star className="size-5 text-yellow-400" />
                        <span>Modèles Pro</span>
                    </h2>
                     <div className="grid gap-4 md:grid-cols-2">
                        {proModels.map(model => <ModelCard key={model.id} model={model} />)}
                    </div>
                </div>

            </div>
        </GenericPage>
    );
}
