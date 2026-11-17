'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type SystemTheme = 'blue' | 'green';

interface ThemeContextType {
  theme: SystemTheme;
  setTheme: (theme: SystemTheme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'fastrifa_theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'blue',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SystemTheme>('blue');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as SystemTheme;
      if (saved === 'green' || saved === 'blue') {
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'blue');
      }
    } catch {
      // Ignored in SSR
    }
  }, []);

  function setTheme(newTheme: SystemTheme) {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch {
      // Ignored in SSR
    }
  }

  function toggleTheme() {
    setTheme(theme === 'blue' ? 'green' : 'blue');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
