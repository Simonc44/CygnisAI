'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface GenericPageProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function GenericPage({ title, description, children }: GenericPageProps) {
  return (
    <div className="flex flex-1 items-start justify-center p-4 sm:p-6 md:p-8 page-transition">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight font-headline">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {children || <p>This page is under construction. Check back soon!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
