
'use client';

import { useApp } from './app-provider';
import * as React from 'react';
import { usePathname } from 'next/navigation';

/**
 * This component manages the application of the theme on the client side
 * by reading the value from the AppContext and listening for changes.
 */
export function ThemeManager() {
  const { theme } = useApp();
  const pathname = usePathname();

  React.useEffect(() => {
    const isLandingPage = pathname === '/';
    const effectiveTheme = isLandingPage ? 'dark' : theme;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(effectiveTheme);
  }, [theme, pathname]);

  return null; // This component does not render any UI
}
