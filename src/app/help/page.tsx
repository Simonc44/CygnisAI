
'use client';
import { GenericPage } from "@/components/generic-page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Brain, Rocket, Lock, Trash2, HelpCircle, ArrowRight, MessageSquare } from "lucide-react";
import Link from 'next/link';

const faqCategories = [
  {
    title: "Fonctionnalités Principales",
    icon: Bot,
    faqs: [
      {
        question: "Comment fonctionnent les Agents ?",
        answer: "Les Agents sont des IA pré-configurées avec des instructions spécifiques pour accomplir une tâche donnée, comme l'écriture créative ou l'analyse de code. En choisissant un agent, vous démarrez une conversation avec une IA déjà spécialisée.",
        icon: Bot
      },
      {
        question: "La fonctionnalité 'Mémoire' est-elle privée ?",
        answer: "Oui, absolument. Les 'souvenirs' sont des faits que l'IA retient de vos conversations pour personnaliser les futures interactions. Ces données sont stockées de manière sécurisée et ne sont accessibles que par vous. Vous pouvez les consulter et les supprimer à tout moment depuis la page 'Mémoire'.",
        icon: Brain
      },
    ]
  },
  {
    title: "Abonnement & Facturation",
    icon: Rocket,
    faqs: [
        {
        question: "Comment puis-je passer au plan Pro ?",
        answer: "Vous pouvez vous abonner au plan Pro en visitant la page 'Abonnement' (accessible via l'icône de fusée dans la barre latérale). Le plan Pro débloque l'accès à des modèles plus puissants et à des fonctionnalités avancées comme la génération d'images et de vidéos.",
        icon: Rocket
      },
    ]
  },
    {
    title: "Compte & Données",
    icon: Lock,
    faqs: [
      {
        question: "Comment sont utilisées mes données ?",
        answer: "Nous utilisons vos données uniquement pour fournir et améliorer le service. Vos conversations peuvent être utilisées pour entraîner nos modèles uniquement si vous donnez votre consentement explicite via les mécanismes de feedback (pouce vers le bas). Pour plus de détails, consultez notre Politique de confidentialité.",
        icon: Lock
      },
      {
        question: "Puis-je supprimer mon compte et mes données ?",
        answer: "Oui. Vous pouvez exporter toutes vos conversations et supprimer définitivement votre compte depuis la page 'Paramètres'. Cette action est irréversible.",
        icon: Trash2
      },
    ]
  }
];


export default function HelpPage() {
  return (
    <GenericPage
      title="Aide & Foire Aux Questions"
      description="Trouvez les réponses à vos questions les plus fréquentes sur CygnisAI."
    >
      <div className="space-y-8">
        {faqCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <category.icon className="size-6 text-primary" />
                <span>{category.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className={index === category.faqs.length - 1 ? 'border-b-0' : ''}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3 text-left">
                        <faq.icon className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-10">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
        
        <Card className="bg-primary/10 border-primary/20">
           <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-3">
                        <MessageSquare className="size-6 text-primary" />
                        <span>Besoin d'aide supplémentaire ?</span>
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Si vous ne trouvez pas votre réponse, n'hésitez pas à nous contacter directement.
                    </p>
                </div>
                <Link href="/contact" className="group flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                    Nous contacter <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
           </CardHeader>
        </Card>

      </div>
    </GenericPage>
  );
}
