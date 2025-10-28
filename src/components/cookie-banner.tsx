
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookie_consent');
    if (consent !== 'true') {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500',
        showBanner ? 'translate-y-0' : 'translate-y-full'
      )}
    >
        <div className="max-w-4xl mx-auto bg-background/80 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
                Nous utilisons des cookies pour améliorer votre expérience. En continuant à utiliser ce site, vous acceptez notre utilisation des cookies. 
                Pour en savoir plus, consultez notre{' '}
                <Link href="/privacy" className="underline hover:text-primary">
                    Politique de confidentialité
                </Link>
                .
            </p>
            <Button onClick={handleAccept} size="sm" className="shrink-0">
                Accepter
            </Button>
        </div>
    </div>
  );
}
