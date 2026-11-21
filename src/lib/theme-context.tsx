'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from './firebase/auth-context';
import { db, getPublicFirestore } from './firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { syncCreatorBrandColorToRaffles } from './firebase/raffles';

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
  const { user, profile, updateProfile } = useAuth();
  const pathname = usePathname();

  // Cor global definida pelo Master (com fallback no cache local ou 'green' padrão atual)
  const [globalTheme, setGlobalThemeState] = useState<SystemTheme>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(GLOBAL_THEME_STORAGE_KEY);
      if (cached === 'blue' || cached === 'green') return cached;
    }
    return DEFAULT_SYSTEM_THEME;
  });

  // Cor individual do usuário logado
  const [userTheme, setUserThemeState] = useState<SystemTheme>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(GLOBAL_THEME_STORAGE_KEY);
      if (cached === 'blue' || cached === 'green') return cached;
    }
    return DEFAULT_SYSTEM_THEME;
  });
  const [activeTheme, setActiveThemeState] = useState<SystemTheme>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(GLOBAL_THEME_STORAGE_KEY);
      if (cached === 'blue' || cached === 'green') return cached;
    }
    return DEFAULT_SYSTEM_THEME;
  });

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  // Identificação do tipo de rota
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));
  const isRaffleRoute = Boolean(pathname?.startsWith('/r/'));
  const isPublicRoute = !isAdminRoute && !isRaffleRoute;

  // 1. Escuta em tempo real o tema global do sistema configurado pelo Master no Firestore
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    getPublicFirestore()
      .then((activeDb) => {
        if (cancelled) return;
        const systemDocRef = doc(activeDb, 'settings', 'system');
        unsubscribe = onSnapshot(
          systemDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data?.global_theme === 'blue' || data?.global_theme === 'green') {
                const newGlobal = data.global_theme as SystemTheme;
                setGlobalThemeState(newGlobal);
                try {
                  localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, newGlobal);
                  document.cookie = `${GLOBAL_THEME_STORAGE_KEY}=${newGlobal}; path=/; max-age=31536000; SameSite=Lax`;
                } catch {}
              }
            }
          },
          () => {
            // Silently ignore if settings doc doesn't exist yet
          }
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Sincroniza a preferência individual do usuário logado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (user) {
      const userThemeKey = `fastrifa_theme_${user.uid}`;
      const savedUserTheme = localStorage.getItem(userThemeKey) as SystemTheme | null;
      const profileTheme = profile?.brand_color as SystemTheme | null;

      const chosen: SystemTheme =
        profileTheme === 'green' || savedUserTheme === 'green'
          ? 'green'
          : profileTheme === 'blue' || savedUserTheme === 'blue'
          ? 'blue'
          : globalTheme;

      setUserThemeState(chosen);
    }
  }, [user, profile?.brand_color, globalTheme]);

  // 3. Aplica a cor correta no document.documentElement baseada no escopo de navegação
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Se estiver na página pública da rifa, a própria página aplica a cor da marca do organizador
    if (isRaffleRoute) return;

    let targetTheme: SystemTheme = globalTheme;

    if (isPublicRoute) {
      // Home (/), Login (/login), Cadastro (/cadastro), etc:
      // SEMPRE a cor global definida pelo Master do sistema!
      targetTheme = globalTheme;
    } else if (isAdminRoute) {
      if (isMaster) {
        // No painel master, a cor é a cor global que o master definiu
        targetTheme = globalTheme;
      } else {
        // No painel do organizador comum (/admin em diante), aplica a cor individual da marca dele
        targetTheme = userTheme || (profile?.brand_color as SystemTheme) || globalTheme;
      }
    }

    setActiveThemeState(targetTheme);
    document.documentElement.setAttribute('data-theme', targetTheme);
  }, [pathname, isPublicRoute, isAdminRoute, isRaffleRoute, isMaster, globalTheme, userTheme, profile?.brand_color]);

  // 4. Alteração de cor (Diferenciação estrita entre Master e Usuário Comum)
  async function setTheme(newTheme: SystemTheme) {
    if (isMaster) {
      // MASTER: Altera a cor GLOBAL do sistema (Home, Login, novas contas e padrão geral)
      setGlobalThemeState(newTheme);
      setActiveThemeState(newTheme);

      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
          localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, newTheme);
          document.cookie = `${GLOBAL_THEME_STORAGE_KEY}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
          if (user) {
            localStorage.setItem(`fastrifa_theme_${user.uid}`, newTheme);
          }
        } catch {}
      }

      // Persiste no Firestore em settings/system
      try {
        await setDoc(
          doc(db, 'settings', 'system'),
          {
            global_theme: newTheme,
            updated_at: new Date().toISOString(),
            updated_by: user?.email || 'master',
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Erro ao salvar tema global no firestore:', err);
      }

      // Atualiza também o perfil do master e suas rifas
      if (user) {
        updateProfile({ brand_color: newTheme }).catch(() => {});
        syncCreatorBrandColorToRaffles(user.uid, newTheme).catch(() => {});
      }
    } else {
      // USUÁRIO COMUM: Altera apenas do seu painel em diante e suas próprias rifas
      setUserThemeState(newTheme);
      setActiveThemeState(newTheme);

      if (typeof window !== 'undefined') {
        if (isAdminRoute) {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
        if (user) {
          try {
            localStorage.setItem(`fastrifa_theme_${user.uid}`, newTheme);
          } catch {}
        }
      }

      // Persiste a escolha na marca do usuário e sincroniza em todas as suas rifas
      if (user) {
        updateProfile({ brand_color: newTheme }).catch((err) =>
          console.warn('Could not persist brand_color in profile:', err)
        );
        syncCreatorBrandColorToRaffles(user.uid, newTheme).catch((err) =>
          console.warn('Could not sync brand_color to user raffles:', err)
        );
      }
    }
  }

  function toggleTheme() {
    setTheme(activeTheme === 'blue' ? 'green' : 'blue');
  }

  const contextValue = useMemo(
    () => ({
      theme: activeTheme,
      globalTheme,
      isMaster,
      setTheme,
      toggleTheme,
    }),
    [activeTheme, globalTheme, isMaster]
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
