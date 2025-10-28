
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { CygnisLogo } from '../icons';
import { Button } from '../ui/button';
import { Code, Image, PenTool, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const suggestionCards = [
  {
    title: 'Brainstormer des idées',
    icon: Brain,
    description: 'Pour un nouveau projet.',
    action: 'start_chat',
    prompt: 'Aide-moi à brainstormer des idées pour un nouveau projet.',
  },
  {
    title: "Générer une image",
    icon: Image,
    description: "d'un chaton jouant avec une pelote de laine.",
    action: 'generate_image',
    prompt: "Un chaton jouant avec une pelote de laine.",
  },
  {
    title: 'Écrire une histoire',
    icon: PenTool,
    description: 'sur un voyage dans le temps.',
    action: 'start_chat',
    prompt: 'Écris-moi une histoire sur un voyage dans le temps.',
  },
  {
    title: 'Générer du code',
    icon: Code,
    description: 'pour un bouton en React.',
    action: 'generate_code',
    prompt: 'Un composant de bouton React en TypeScript avec des props pour le variant (primary, secondary) et la taille (sm, md, lg) en utilisant Tailwind CSS.',
  },
];

type SuggestionAction = 'start_chat' | 'generate_image' | 'generate_code';

interface ChatWelcomeProps {
    onSuggestionClick: (prompt: string, action: SuggestionAction) => void;
}


export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  return (
      <div className="flex h-full flex-col items-center justify-center pb-20">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-in fade-in-50 duration-1000">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/20">
              <CygnisLogo className="size-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 animate-in fade-in-50 duration-700 font-headline">
            Comment puis-je aider aujourd'hui ?
          </h1>
        </div>
        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 animate-in fade-in-50 duration-1000">
          {suggestionCards.map((card, i) => (
            <Card
              key={i}
              className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg gradient-border-card"
              onClick={() => onSuggestionClick(card.prompt, card.action as SuggestionAction)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <card.icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold font-headline">{card.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
  );
}
