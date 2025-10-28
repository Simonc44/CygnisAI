
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/services/auth-service.tsx';
import { AppProvider } from '@/components/app-provider';
import { ThemeManager } from '@/components/theme-manager';
import ChatLayout from '@/components/chat/chat-layout';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { CookieBanner } from '@/components/cookie-banner';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontHeadline = Inter({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-headline',
});

// This is the root layout component.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Pages that don't use the main ChatLayout (sidebar, header, etc.)
  const isStandalonePage = ['/', '/demo', '/login', '/signup'].includes(pathname);

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="CygnisAI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CygnisAI" />
        <meta name="description" content="Connectez vos données et libérez leur potentiel avec une IA intelligente." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0A0910" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0A0910" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'><path d='M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19Z' fill='currentColor' opacity='0.2' style='color: hsl(217.2 91.2% 59.8%);' /><path d='M16.5414 10.3541C15.8617 9.68729 14.974 9.24988 14 9.10241V12.1873L16.5414 10.3541Z' fill='currentColor' style='color: hsl(217.2 91.2% 59.8%);' /><path d='M12.0001 14.8129L9.45874 16.6461C10.1384 17.3129 11.0261 17.7503 12.0001 17.8978V14.8129Z' fill='currentColor' style='color: hsl(217.2 91.2% 59.8%);' /><path d='M12.0001 6.10254C12.974 6.24995 13.8617 6.68735 14.5414 7.35413L12.0001 9.18734V6.10254Z' fill='currentColor' style='color: hsl(217.2 91.2% 59.8%);' /><path d='M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' style='color: hsl(217.2 91.2% 59.8%);' /></svg>" />
        <link rel="manifest" href="/manifest.json" />
        
        <title>CygnisAI</title>
      </head>
      <body className={cn("font-sans antialiased", fontSans.variable, fontHeadline.variable)}>
        <ul className="shard-container">
            <li className="shard"></li>
            <li className="shard"></li>
            <li className="shard"></li>
            <li className="shard"></li>
            <li className="shard"></li>
            <li className="shard"></li>
            <li className="shard"></li>
            <li className="shard"></li>
        </ul>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            <AppProvider>
              <ThemeManager />
              {isStandalonePage ? (
                // For standalone pages (landing, login, etc.), render children directly
                <>{children}</>
              ) : (
                // For all other app pages, wrap them in the main ChatLayout
                <ChatLayout>{children}</ChatLayout>
              )}
            </AppProvider>
          </TooltipProvider>
          <Toaster />
        </AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
