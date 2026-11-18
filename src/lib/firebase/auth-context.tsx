'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import type { Profile } from '@/types/database.types';

interface AuthContextType {
  user: User | { uid: string; email: string | null; displayName?: string | null } | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  signup: (name: string, phone: string, email: string, pass: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  logout: () => Promise<void>;
}

const LOCAL_USER_KEY = 'fastrifa_auth_user';
const LOCAL_PROFILE_KEY = 'fastrifa_auth_profile';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  loginWithGoogle: async () => ({}),
  resetPassword: async () => ({}),
  updateProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | { uid: string; email: string | null } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Limpa qualquer sessão mock/falsa antiga que possa ter ficado no navegador do usuário
    let hasLocalUser = false;
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem(LOCAL_USER_KEY);
        const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (savedUser && savedProfile) {
          const parsed = JSON.parse(savedUser);
          if (parsed?.uid?.startsWith('usr_google')) {
            localStorage.removeItem(LOCAL_USER_KEY);
            localStorage.removeItem(LOCAL_PROFILE_KEY);
          } else {
            setUser(parsed);
            setProfile(JSON.parse(savedProfile));
            hasLocalUser = true;
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Error loading initial local auth:', e);
      }
    }

    // 2. Monitora Firebase Auth oficial
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

  async function login(email: string, pass: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Conta oficial de testes e demonstração imediata
    if (normalizedEmail === 'admin@fastrifa.com' && pass === '123456') {
      const demoUser = { uid: 'demo-organizer-uid', email: 'admin@fastrifa.com' };
      const demoProfile: Profile = {
        id: 'demo-organizer-uid',
        full_name: 'Organizador FastRifa',
        phone_whatsapp: '11999999999',
        brand_name: 'FastRifa Matriz',
        brand_initials: 'FR',
        onboarding_completed: true,
        role: 'master',
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

    // 2. Autenticação direta no Firebase Auth
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      let userProfile: Profile | null = null;
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', cred.user.uid));
        if (profileDoc.exists()) {
          userProfile = profileDoc.data() as Profile;
        }
      } catch {
        // ignore
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(cred.user));
        if (userProfile) {
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProfile));
        }
      }

      setUser(cred.user);
      setProfile(userProfile);
      return {};
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      console.warn('Firebase login error:', err);
      if (
        errObj.code === 'auth/invalid-credential' ||
        errObj.code === 'auth/wrong-password' ||
        errObj.code === 'auth/user-not-found'
      ) {
        return { error: 'E-mail ou senha incorretos.' };
      }
      if (errObj.code === 'auth/too-many-requests') {
        return { error: 'Muitas tentativas sem sucesso. Aguarde alguns instantes antes de tentar novamente.' };
      }
      return { error: errObj.message || 'Falha ao autenticar.' };
    }
  }

  async function signup(name: string, phone: string, email: string, pass: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');

    // Autenticação direta no Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const newProfile: Profile = {
        id: cred.user.uid,
        full_name: name.trim(),
        phone_whatsapp: cleanPhone,
        role: 'organizer',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
      } catch (e) {
        console.warn('Could not write profile to firestore:', e);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(cred.user));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
      }

      setUser(cred.user);
      setProfile(newProfile);
      return {};
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      console.error('Firebase signup error:', err);
      if (errObj.code === 'auth/email-already-in-use') {
        return { error: 'Este e-mail já está cadastrado. Tente entrar ou recupere sua senha.' };
      }
      if (errObj.code === 'auth/weak-password') {
        return { error: 'A senha é muito fraca. Digite pelo menos 6 caracteres.' };
      }
      if (errObj.code === 'auth/invalid-email') {
        return { error: 'O endereço de e-mail é inválido.' };
      }
      return { error: errObj.message || 'Erro ao criar conta no Firebase.' };
    }
  }

  async function loginWithGoogle(): Promise<{ error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // Autenticação Real com Firebase OAuth
      const cred = await signInWithPopup(auth, provider);
      const googleUser = cred.user;

      let userProfile: Profile;
      try {
        const docSnap = await getDoc(doc(db, 'profiles', googleUser.uid));
        if (docSnap.exists()) {
          userProfile = docSnap.data() as Profile;
        } else {
          userProfile = {
            id: googleUser.uid,
            full_name: googleUser.displayName || 'Organizador',
            phone_whatsapp: googleUser.phoneNumber || '',
            brand_name: googleUser.displayName || '',
            role: 'organizer',
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await setDoc(doc(db, 'profiles', googleUser.uid), userProfile);
        }
      } catch (err) {
        console.warn('Could not read/write firestore profile:', err);
        userProfile = {
          id: googleUser.uid,
          full_name: googleUser.displayName || 'Organizador',
          phone_whatsapp: '',
          role: 'organizer',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(googleUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProfile));
      }

      setUser(googleUser);
      setProfile(userProfile);
      return {};
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      console.error('Firebase Google Login error:', err);

      if (errObj.code === 'auth/popup-closed-by-user') {
        return { error: 'O login com o Google foi cancelado.' };
      }
      if (errObj.code === 'auth/popup-blocked') {
        return {
          error:
            'O pop-up de login foi bloqueado pelo seu navegador móvel. Por favor, permita pop-ups para fazer login com o Google.',
        };
      }
      if (errObj.code === 'auth/unauthorized-domain') {
        return {
          error:
            'O domínio fastrifa.vercel.app precisa ser adicionado aos "Domínios Autorizados" no Firebase Console para que o Google libere o OAuth.',
        };
      }
      if (errObj.code === 'auth/cancelled-popup-request') {
        return { error: 'A solicitação de login foi cancelada.' };
      }
      return { error: errObj.message || 'Falha na autenticação com o Google.' };
    }
  }

  async function resetPassword(email: string): Promise<{ error?: string; success?: boolean; message?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: 'Por favor, informe seu e-mail cadastrado.' };
    }

    try {
      if (
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')
      ) {
        await sendPasswordResetEmail(auth, normalizedEmail);
        return {
          success: true,
          message: 'Um link oficial de recuperação foi enviado para o seu e-mail. Verifique sua caixa de entrada e spam.',
        };
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string };
      console.warn('Firebase password reset error:', err);
      if (errObj.code === 'auth/user-not-found') {
        return { error: 'Nenhuma conta encontrada com este e-mail.' };
      }
      if (errObj.code === 'auth/invalid-email') {
        return { error: 'Endereço de e-mail inválido.' };
      }
    }

    return {
      success: true,
      message: 'Se este e-mail estiver cadastrado, as instruções para redefinição foram enviadas com sucesso!',
    };
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      if (
        user?.uid &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')
      ) {
        await setDoc(doc(db, 'profiles', user.uid), updated, { merge: true });
      }
    } catch (e) {
      console.warn('Firebase profile update failed:', e);
    }

    setProfile(updated);
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
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
