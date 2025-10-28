
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CygnisLogo, GoogleIcon, GitHubIcon } from "@/components/icons";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle, signInWithGitHub, signUpWithEmail, useAuth } from '@/services/auth-service';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isProviderLoading, setIsProviderLoading] = useState<null | 'google' | 'github'>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!isAuthLoading && user) {
            router.replace('/chat');
        }
    }, [isAuthLoading, user, router]);

    const handleSuccess = (user: any) => {
        toast({
            title: "Compte créé avec succès !",
            description: `Bienvenue sur CygnisAI, ${user.displayName || user.email}.`,
        });
        // The AuthProvider will handle the redirect
    }

    const handleProviderLogin = async (provider: 'google' | 'github') => {
        setIsProviderLoading(provider);
        const user = await (provider === 'google' ? signInWithGoogle() : signInWithGitHub());
        if (user) {
            // The success toast is handled inside the signIn function
        }
        setIsProviderLoading(null);
    };
    
    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmailLoading(true);
        const user = await signUpWithEmail(email, password);
        if (user) {
            handleSuccess(user);
        }
        setIsEmailLoading(false);
    };
    
    const isLoading = isEmailLoading || !!isProviderLoading;

    if (isAuthLoading || user) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
             <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-foreground/80 hover:text-foreground">
                <CygnisLogo className="size-6" />
                <span className="font-semibold">CygnisAI</span>
            </Link>
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Créer un compte</CardTitle>
                    <CardDescription>Rejoignez CygnisAI pour commencer</CardDescription>
                </CardHeader>
                 <form onSubmit={handleEmailSignup}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="nom@exemple.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password"/>
                        </div>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                             {isEmailLoading && <Loader2 className="mr-2 animate-spin" />}
                            Créer mon compte
                        </Button>
                    </CardContent>
                </form>
                <CardFooter className="flex flex-col gap-4">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Ou s'inscrire avec</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => handleProviderLogin('google')} disabled={isLoading}>
                           {isProviderLoading === 'google' ? <Loader2 className="mr-2 animate-spin" /> : <GoogleIcon className="mr-2" />}
                           Google
                        </Button>
                        <Button variant="outline" onClick={() => handleProviderLogin('github')} disabled={isLoading}>
                           {isProviderLoading === 'github' ? <Loader2 className="mr-2 animate-spin" /> : <GitHubIcon className="mr-2" />}
                           GitHub
                        </Button>
                    </div>
                     <p className="text-center text-sm text-muted-foreground">
                        Déjà un compte ?{" "}
                        <Link href="/login" className="underline hover:text-primary">
                            Connectez-vous
                        </Link>
                    </p>
                </CardFooter>
            </Card>
            <p className="mt-4 px-8 text-center text-xs text-muted-foreground">
                En créant un compte, vous acceptez nos{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Conditions d'utilisation
                </Link>{" "}
                et notre{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Politique de confidentialité
                </Link>
                .
            </p>
        </div>
    );
}
