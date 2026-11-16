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
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  signup: (name: string, phone: string, email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as Profile);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, pass: string) {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return {};
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        return { error: 'E-mail ou senha incorretos.' };
      }
      return { error: error.message || 'Erro ao realizar login.' };
    }
  }

  async function signup(name: string, phone: string, email: string, pass: string) {
    try {
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
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      if (error.code === 'auth/email-already-in-use') {
        return { error: 'Este e-mail já está cadastrado.' };
      }
      return { error: error.message || 'Erro ao criar conta.' };
    }
  }

  async function logout() {
    await signOut(auth);
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
