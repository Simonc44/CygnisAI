
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail } from '@/services/auth-service.tsx';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Note: In a real-world scenario, you might want to use a specific admin sign-in method
            // or verify the user's role immediately after sign-in.
            const user = await signInWithEmail(email, password);
            if (user) {
                toast({
                    title: "Connexion réussie",
                    description: `Bienvenue, administrateur.`,
                });
                router.push('/admin'); // Redirect to the admin dashboard
            }
        } catch (error: any) {
            let description = "L'adresse e-mail ou le mot de passe est incorrect.";
            if (error.code === 'auth/invalid-credential') {
                description = "L'adresse e-mail ou le mot de passe est incorrect.";
            }
            toast({
                variant: 'destructive',
                title: "Échec de la connexion",
                description,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-sm shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="text-2xl">Accès Administrateur</CardTitle>
                    <CardDescription>Veuillez vous connecter pour continuer.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAdminLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="admin@exemple.com" 
                                required 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 animate-spin" />}
                            Se connecter
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
