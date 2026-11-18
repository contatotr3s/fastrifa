'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './firebase/auth-context';

export type SystemTheme = 'blue' | 'green';

interface ThemeContextType {
  theme: SystemTheme;
  setTheme: (theme: SystemTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'blue',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, updateProfile } = useAuth();
  const [theme, setThemeState] = useState<SystemTheme>('blue');

  // Sincroniza o tema estritamente com o perfil do usuário logado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Limpa qualquer chave global legada que afetava todos os usuários indiscriminadamente
    try {
      localStorage.removeItem('fastrifa_theme');
    } catch {}

    if (user) {
      // Usuário autenticado: busca cor da marca no perfil ou no armazenamento individual do usuário
      const userThemeKey = `fastrifa_theme_${user.uid}`;
      const savedUserTheme = (localStorage.getItem(userThemeKey) as SystemTheme) || null;
      const profileTheme = (profile?.brand_color as SystemTheme) || null;

      const activeTheme: SystemTheme =
        profileTheme === 'green' || savedUserTheme === 'green' ? 'green' : 'blue';

      setThemeState(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);
    } else {
      // Usuário deslogado ou visitante: sempre azul padrão do sistema
      setThemeState('blue');
      document.documentElement.setAttribute('data-theme', 'blue');
    }
  }, [user, profile?.brand_color]);

  function setTheme(newTheme: SystemTheme) {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      if (user) {
        try {
          localStorage.setItem(`fastrifa_theme_${user.uid}`, newTheme);
        } catch {}

        // Persiste a preferência no perfil da marca no banco de dados
        updateProfile({ brand_color: newTheme }).catch((err) =>
          console.warn('Could not persist brand_color in profile:', err)
        );
      }
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
