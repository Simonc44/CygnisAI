'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-md text-center shadow-lg animate-in fade-in-50">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-5xl font-bold tracking-tighter text-destructive">
            404
          </CardTitle>
          <CardDescription className="text-xl font-medium tracking-tight">
            Page Non Trouvée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Button asChild>
            <Link href="/chat">
              <Home className="mr-2 h-4 w-4" />
              Retourner au chat
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
