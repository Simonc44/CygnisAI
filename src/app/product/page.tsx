
'use client';
import { GenericPage } from "@/components/generic-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Code, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

const apiFeatures = [
  {
    icon: Rocket,
    title: "Performances Élevées",
    description: "Profitez de temps de réponse rapides et d'une infrastructure scalable conçue pour la production.",
  },
  {
    icon: Code,
    title: "Intégration Simplifiée",
    description: "Avec des endpoints REST classiques et une documentation claire, intégrez notre IA dans vos applications en quelques minutes.",
  },
  {
    icon: CheckCircle,
    title: "Modèles de Pointe",
    description: "Accédez aux derniers modèles d'IA, y compris la famille Gemini de Google et d'autres modèles spécialisés.",
  },
];

function ProductPage() {
  return (
    <GenericPage
      title="Produits & API"
      description="Intégrez la puissance de CygnisAI directement dans vos applications grâce à notre API RESTful."
    >
      <div className="space-y-8">
        <Card className="bg-gradient-to-br from-primary/10 to-background">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">API Cygnis AI</CardTitle>
            <CardDescription className="max-w-lg mx-auto">
              Libérez l'intelligence de nos modèles au sein de vos propres services.
              Idéal pour les développeurs souhaitant enrichir leurs produits avec des capacités d'IA générative.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild size="lg">
              <Link href="https://cygnis-ai-studio.vercel.app/documentation" target="_blank" rel="noopener noreferrer">
                Consulter la Documentation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Disponible sur : https://cygnis-ai-studio.vercel.app/documentation
            </p>
          </CardContent>
        </Card>
        
        <div>
          <h3 className="text-xl font-semibold mb-4 text-center">Pourquoi utiliser notre API ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </GenericPage>
  );
}

export default ProductPage;
