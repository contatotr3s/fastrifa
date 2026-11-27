'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth, MASTER_EMAIL } from './firebase/auth-context';

export type SystemTheme = 'blue' | 'green';

export const GLOBAL_THEME_STORAGE_KEY = 'fastrifa_global_system_theme';
export const DEFAULT_SYSTEM_THEME: SystemTheme = 'green';

interface ThemeContextType {
  theme: SystemTheme;
  globalTheme: SystemTheme;
  isMaster: boolean;
  setTheme: (theme: SystemTheme) => Promise<void>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_SYSTEM_THEME,
  globalTheme: DEFAULT_SYSTEM_THEME,
  isMaster: false,
  setTheme: async () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  // Cor padrão verde definitiva em toda a plataforma
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-theme', 'green');
    try {
      localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, 'green');
      document.cookie = `${GLOBAL_THEME_STORAGE_KEY}=green; path=/; max-age=31536000; SameSite=Lax`;
      if (user?.uid) {
        localStorage.setItem(`fastrifa_theme_${user.uid}`, 'green');
      }
    } catch {}
  }, [user?.uid]);

  async function setTheme() {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'green');
    }
  }

  function toggleTheme() {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'green');
    }
  }

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme: DEFAULT_SYSTEM_THEME,
      globalTheme: DEFAULT_SYSTEM_THEME,
      isMaster,
      setTheme,
      toggleTheme,
    }),
    [isMaster]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
