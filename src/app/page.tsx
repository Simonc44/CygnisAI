
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/auth-service.tsx';
import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { CygnisLogo } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, PencilRuler, Bot, Send } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const features = [
  { 
    icon: Cpu, 
    title: "Modèles Puissants", 
    description: "Utilisez la puissance des modèles Gemini de Google pour des réponses rapides et précises, adaptées à chaque tâche." 
  },
  { 
    icon: PencilRuler, 
    title: "Génération de Contenu", 
    description: "Créez des images, vidéos, et bouts de code en quelques secondes grâce à des outils créatifs intégrés." 
  },
  { 
    icon: Bot, 
    title: "Agents Personnalisés", 
    description: "Utilisez nos 'Agents' pré-configurés pour des tâches spécifiques comme l'écriture, l'analyse ou la planification."
  },
];


function GuestPage() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (path: string, e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isAnimating || isNavigating) return;

    setIsNavigating(true);
    // Short delay to allow the loading screen to appear
    setTimeout(() => {
        router.push(path);
    }, 500); 
  };
  
    const handleNavigateToDemo = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isAnimating || isNavigating) return;
        setIsAnimating(true);
        setTimeout(() => {
          router.push('/demo');
        }, 800);
    };

  const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 text-center h-full">
        <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
  );

  return (
    <div className={cn("flex w-full flex-col bg-transparent text-foreground overflow-x-hidden")}>
        {isNavigating && <LoadingScreen />}
      <div className="fixed inset-0 -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover brightness-50"
        >
          <source src="https://framerusercontent.com/assets/i3PFzJAwD41icVH6B7JkT9VGs.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Animated Logo Container */}
      <div className={cn(
          "fixed inset-0 z-20 flex items-center justify-center transition-opacity duration-500 pointer-events-none",
          isAnimating ? 'opacity-100' : 'opacity-0'
      )}>
          <CygnisLogo className={cn(
              "text-primary transition-all duration-700 ease-in-out",
              isAnimating ? 'size-24 scale-125' : 'size-12'
          )} />
      </div>

      <header className={cn(
          "absolute top-0 flex w-full items-center justify-between p-4 z-10 transition-opacity duration-300",
          isAnimating ? 'opacity-0' : 'opacity-100'
      )}>
        <div className="flex items-center gap-2">
            <CygnisLogo className="size-8" />
            <span className="text-xl font-semibold font-headline">CygnisAI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/login" onClick={(e) => handleNavigate('/login', e)}>Se connecter</Link></Button>
          <Button asChild className="glow-on-hover"><Link href="/signup" onClick={(e) => handleNavigate('/signup', e)}>S'inscrire</Link></Button>
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className={cn("relative z-10 transition-opacity duration-500", isAnimating ? "opacity-0" : "opacity-100")}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-gray-200 to-gray-500 mb-4 animate-in fade-in-0 slide-in-from-top-10 duration-1000 font-headline">
              L'IA qui vous ressemble.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground mb-8 animate-in fade-in-0 slide-in-from-top-12 duration-1000">
              Discutez, créez, et explorez avec une suite d'outils IA conçus pour la performance et la personnalisation. Passez à la vitesse supérieure.
            </p>
        </div>
        <div className="w-full max-w-xl mx-auto relative z-10">
              <div className={cn("relative flex items-center justify-center transition-opacity duration-300", isAnimating ? 'opacity-0' : 'opacity-100')}>
                  <Input
                      placeholder="Commencez à discuter..."
                      className={cn(
                        "w-full h-14 pl-4 pr-16 rounded-full bg-card/50 backdrop-blur-sm border-border/50 focus:ring-primary/50 focus:ring-2 transition-all duration-500 ease-in-out cursor-pointer",
                         isAnimating && 'w-14 placeholder-transparent'
                      )}
                      readOnly
                      onClick={(e) => handleNavigateToDemo(e as any)}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full transition-all duration-500 ease-in-out",
                         isAnimating && "right-1/2 translate-x-1/2 animate-button-pulse"
                    )}
                    onClick={handleNavigateToDemo}
                  >
                      <Send className="h-5 w-5" />
                  </Button>
              </div>
          </div>
      </main>

      <section className={cn("w-full py-20 overflow-hidden bg-background/50 backdrop-blur-md transition-opacity duration-300 relative", isAnimating ? 'opacity-0' : 'opacity-100')}>
        <div className="marquee-container flex">
            <div className="marquee flex min-w-full shrink-0 items-center justify-around gap-4">
                {[...features, ...features].map((feature, index) => (
                    <div key={index} className="w-[350px] h-full p-1">
                        <FeatureCard {...feature} />
                    </div>
                ))}
            </div>
             <div className="marquee flex min-w-full shrink-0 items-center justify-around gap-4">
                {[...features, ...features].map((feature, index) => (
                    <div key={index} className="w-[350px] h-full p-1">
                        <FeatureCard {...feature} />
                    </div>
                ))}
            </div>
        </div>
      </section>

      <footer className={cn("w-full border-t border-white/10 py-6 px-4 bg-background/50 backdrop-blur-md transition-opacity duration-300 relative", isAnimating ? 'opacity-0' : 'opacity-100')}>
        <div className="max-w-5xl mx-auto text-center text-muted-foreground text-sm">
            <div className="flex justify-center gap-4 mb-2">
                <Link href="/terms" className="hover:text-primary transition-colors">Conditions d'utilisation</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} CygnisAI. Tous droits réservés.</p>
            <p>Créé avec ❤️ par Firebase. Powered by Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/chat');
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return <LoadingScreen />;
  }

  return <GuestPage />;}

    

    