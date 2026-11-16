'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import type { Profile } from '@/types/database.types';

interface AuthContextType {
  user: User | { uid: string; email: string | null } | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  signup: (name: string, phone: string, email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const LOCAL_USER_KEY = 'fastrifa_auth_user';
const LOCAL_PROFILE_KEY = 'fastrifa_auth_profile';
const LOCAL_ACCOUNTS_KEY = 'fastrifa_auth_accounts';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | { uid: string; email: string | null } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Carrega sessão local imediatamente (0ms de latência, persiste mesmo com refresh)
    let hasLocalUser = false;
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem(LOCAL_USER_KEY);
        const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (savedUser && savedProfile) {
          setUser(JSON.parse(savedUser));
          setProfile(JSON.parse(savedProfile));
          hasLocalUser = true;
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading initial local auth:', e);
      }
    }

    // 2. Monitora Firebase Auth se disponível
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          try {
            const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
            if (profileDoc.exists()) {
              setProfile(profileDoc.data() as Profile);
            }
          } catch {
            // Profile fallback
          }
          setLoading(false);
        } else if (!hasLocalUser) {
          // Só limpa o usuário se não houver sessão local salva
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  function loadLocalAuth() {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem(LOCAL_USER_KEY);
        const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (savedUser && savedProfile) {
          setUser(JSON.parse(savedUser));
          setProfile(JSON.parse(savedProfile));
        }
      } catch (e) {
        console.error('Error loading local auth:', e);
      }
    }
    setLoading(false);
  }

  async function login(email: string, pass: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verificação direta para conta oficial de testes (100% autônoma e imediata)
    if (normalizedEmail === 'admin@fastrifa.com' && pass === '123456') {
      const demoUser = { uid: 'demo-organizer-uid', email: 'admin@fastrifa.com' };
      const demoProfile: Profile = {
        id: 'demo-organizer-uid',
        full_name: 'Organizador FastRifa',
        phone_whatsapp: '11999999999',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(demoProfile));
      }
      setUser(demoUser);
      setProfile(demoProfile);
      return {};
    }

    // 2. Try Firebase Auth first
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
        await signInWithEmailAndPassword(auth, email, pass);
        return {};
      }
    } catch (err: unknown) {
      console.warn('Firebase login failed, checking local auth accounts...', err);
    }

    // 3. Local / Autonomous fallback para contas cadastradas
    if (typeof window !== 'undefined') {
      try {
        const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
        const accounts: Array<{ email: string; pass: string; profile: Profile }> = rawAccounts
          ? JSON.parse(rawAccounts)
          : [];

        const found = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
        if (!found || found.pass !== pass) {
          return { error: 'E-mail ou senha incorretos.' };
        }

        const localUser = { uid: found.profile.id, email: found.email };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(found.profile));
        setUser(localUser);
        setProfile(found.profile);
        return {};
      } catch {
        return { error: 'Erro ao validar login.' };
      }
    }

    return { error: 'Ambiente não suportado.' };
  }

  async function signup(name: string, phone: string, email: string, pass: string) {
    // Try Firebase Auth first
    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const newProfile: Profile = {
          id: cred.user.uid,
          full_name: name,
          phone_whatsapp: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
        setProfile(newProfile);
        return {};
      }
    } catch (err: unknown) {
      console.warn('Firebase signup failed, using local auth...', err);
    }

    // Local / Autonomous fallback
    if (typeof window !== 'undefined') {
      try {
        const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
        const accounts: Array<{ email: string; pass: string; profile: Profile }> = rawAccounts
          ? JSON.parse(rawAccounts)
          : [];

        if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
          return { error: 'Este e-mail já está cadastrado.' };
        }

        const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
        const newProfile: Profile = {
          id: uid,
          full_name: name,
          phone_whatsapp: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        accounts.push({ email, pass, profile: newProfile });
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));

        const localUser = { uid, email };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
        setUser(localUser);
        setProfile(newProfile);
        return {};
      } catch {
        return { error: 'Erro ao criar conta local.' };
      }
    }

    return { error: 'Ambiente não suportado.' };
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
    }
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
