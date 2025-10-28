
'use client';

import { CygnisLogo } from './icons';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = "Chargement de CygnisAI..." }: LoadingScreenProps) {
  return (
    <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0"
    )}>
      <div className="flex flex-col items-center gap-4">
        <CygnisLogo className="size-24 text-primary animate-create-logo" />
        <p className="text-lg font-medium text-muted-foreground">
            {message.split('').map((char, index) => (
              <span
                key={index}
                className="animate-scale-in-pop"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
        </p>
      </div>
    </div>
  );
}
