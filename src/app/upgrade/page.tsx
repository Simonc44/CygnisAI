
'use client';
import { useState } from 'react';
import { Check, Loader2, Star, Zap, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/services/auth-service.tsx';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { GenericPage } from '@/components/generic-page';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const tiers = [
  {
    name: 'Gratuit',
    id: 'free',
    price: '0€',
    priceSuffix: '/ mois',
    description: 'Pour découvrir les fonctionnalités de base de CygnisAI.',
    features: [
      { text: 'Accès au modèle standard', icon: Bot },
      { text: 'Historique des discussions', negative: false },
      { text: 'Fonctionnalités de base', negative: false },
      { text: "Support par la communauté", negative: false },
    ],
    cta: 'Votre plan actuel',
    isCurrent: true,
  },
  {
    name: 'Pro',
    id: 'pro',
    priceId: 'price_1SJcZFFMe63wZBKKBtNHcam5',
    price: '9,99€',
    priceSuffix: '/ mois',
    description: 'Libérez tout le potentiel de l\'IA avec les meilleurs modèles.',
    features: [
      { text: 'Accès au modèle premium', icon: Zap },
      { text: 'Génération d\'images et vidéos illimitée', icon: Star },
      { text: 'Analyse de documents et URLs', icon: Star },
      { text: 'Support prioritaire par e-mail', icon: Star },
    ],
    cta: 'Passer à Pro',
    isCurrent: false,
  },
];

export default function UpgradePage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour vous abonner.',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, userId: user.uid }),
      });
      
      const { sessionId, error } = await res.json();

      if (error) {
        throw new Error(error);
      }

      if (!sessionId) {
        throw new Error('Session ID manquant.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js n\'a pas pu se charger.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: error.message || 'Une erreur est survenue.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const isPro = role === 'pro' || role === 'admin';

  return (
    <GenericPage
      title="Abonnement"
      description="Choisissez le plan qui correspond le mieux à vos besoins et débloquez la pleine puissance de CygnisAI."
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={cn(
              'flex flex-col',
              tier.id === 'pro' && !isPro && 'border-primary ring-2 ring-primary/50 shadow-lg'
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{tier.name}</span>
                {tier.id === 'pro' && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Recommandé
                  </span>
                )}
              </CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               <div className="flex items-baseline">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.priceSuffix}</span>
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {tier.id === 'free' ? (
                <Button variant="outline" className="w-full" disabled>
                  {isPro ? "Revenir au plan Gratuit" : "Votre plan actuel"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={loading || isPro}
                  onClick={() => handleCheckout(tier.priceId!)}
                >
                  {loading && <Loader2 className="mr-2 animate-spin" />}
                  {isPro ? "Vous êtes Pro" : tier.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </GenericPage>
  );
}
