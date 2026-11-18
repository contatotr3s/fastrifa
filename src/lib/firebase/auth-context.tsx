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

export const MASTER_EMAIL = 'dancos3@gmail.com';

export interface AuthResult {
  error?: string;
  isNewUser?: boolean;
  needsOnboarding?: boolean;
}

interface AuthContextType {
  user: User | { uid: string; email: string | null; displayName?: string | null } | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AuthResult>;
  signup: (name: string, phone: string, email: string, pass: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
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
    // 1. Limpa resquícios de sessões mock antigas ou dados de teste indesejados
    let hasLocalUser = false;
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem(LOCAL_USER_KEY);
        const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (savedUser && savedProfile) {
          const parsedUser = JSON.parse(savedUser);
          const parsedProfile = JSON.parse(savedProfile);
          
          // Se for conta de teste antiga (admin@fastrifa.com / demo-organizer-uid) ou mock usr_google, purga
          if (
            parsedUser?.email === 'admin@fastrifa.com' ||
            parsedUser?.uid === 'demo-organizer-uid' ||
            parsedUser?.uid?.startsWith('usr_google')
          ) {
            localStorage.removeItem(LOCAL_USER_KEY);
            localStorage.removeItem(LOCAL_PROFILE_KEY);
          } else {
            // Se for dancos3@gmail.com, assegura que é master sem marca
            if (parsedUser?.email?.toLowerCase() === MASTER_EMAIL) {
              parsedProfile.role = 'master';
              parsedProfile.brand_name = 'FastRifa';
              parsedProfile.onboarding_completed = true;
            }
            setUser(parsedUser);
            setProfile(parsedProfile);
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
          const isMaster = currentUser.email?.toLowerCase().trim() === MASTER_EMAIL;
          setUser(currentUser);

          try {
            const profileRef = doc(db, 'profiles', currentUser.uid);
            const profileDoc = await getDoc(profileRef);

            if (profileDoc.exists()) {
              const loadedProfile = profileDoc.data() as Profile;
              if (isMaster) {
                loadedProfile.role = 'master';
                loadedProfile.brand_name = 'FastRifa';
                loadedProfile.brand_initials = 'FR';
                loadedProfile.onboarding_completed = true;
                setProfile(loadedProfile);
                await setDoc(profileRef, { role: 'master', brand_name: 'FastRifa', onboarding_completed: true }, { merge: true });
              } else {
                setProfile(loadedProfile);
              }

              if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(currentUser));
                localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(loadedProfile));
              }
            } else {
              // Documento ainda não existia: cria novo perfil
              const initialProfile: Profile = {
                id: currentUser.uid,
                full_name: currentUser.displayName || (isMaster ? 'Danilo (Owner FastRifa)' : 'Organizador'),
                phone_whatsapp: currentUser.phoneNumber || '',
                brand_name: isMaster ? 'FastRifa' : '',
                brand_initials: isMaster ? 'FR' : '',
                role: isMaster ? 'master' : 'organizer',
                onboarding_completed: isMaster ? true : false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              try {
                await setDoc(profileRef, initialProfile);
              } catch (e) {
                console.warn('Could not set initial profile in firestore:', e);
              }

              setProfile(initialProfile);
              if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(currentUser));
                localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(initialProfile));
              }
            }
          } catch (err) {
            console.warn('Error reading/syncing profile:', err);
            if (isMaster) {
              const fallbackMaster: Profile = {
                id: currentUser.uid,
                full_name: 'Danilo (Owner FastRifa)',
                phone_whatsapp: '11999999999',
                role: 'master',
                brand_name: 'FastRifa',
                brand_initials: 'FR',
                onboarding_completed: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setProfile(fallbackMaster);
            }
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

  async function login(email: string, pass: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const isMasterUser = normalizedEmail === MASTER_EMAIL;

    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      let userProfile: Profile | null = null;

      try {
        const profileDoc = await getDoc(doc(db, 'profiles', cred.user.uid));
        if (profileDoc.exists()) {
          userProfile = profileDoc.data() as Profile;
          if (isMasterUser) {
            userProfile.role = 'master';
            userProfile.brand_name = 'FastRifa';
            userProfile.brand_initials = 'FR';
            userProfile.onboarding_completed = true;
          }
        }
      } catch {
        // ignore
      }

      const activeProfile: Profile = userProfile || {
        id: cred.user.uid,
        full_name: isMasterUser ? 'Danilo (Owner FastRifa)' : 'Organizador',
        phone_whatsapp: isMasterUser ? '11999999999' : '',
        brand_name: isMasterUser ? 'FastRifa' : '',
        brand_initials: isMasterUser ? 'FR' : '',
        role: isMasterUser ? 'master' : 'organizer',
        onboarding_completed: isMasterUser ? true : false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(cred.user));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(activeProfile));
      }

      setUser(cred.user);
      setProfile(activeProfile);

      const needsOnboarding = !isMasterUser && (!activeProfile.onboarding_completed || !activeProfile.brand_name);
      return { needsOnboarding };
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

  async function signup(name: string, phone: string, email: string, pass: string): Promise<AuthResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const isMasterUser = cleanEmail === MASTER_EMAIL;

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const newProfile: Profile = {
        id: cred.user.uid,
        full_name: name.trim(),
        phone_whatsapp: cleanPhone,
        brand_name: isMasterUser ? 'FastRifa' : '', // Novo organizador começa sem marca para configurar no onboarding
        brand_initials: isMasterUser ? 'FR' : '',
        role: isMasterUser ? 'master' : 'organizer',
        onboarding_completed: isMasterUser ? true : false,
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
      return { isNewUser: true, needsOnboarding: !isMasterUser };
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

  async function loginWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // Autenticação Real com Firebase OAuth
      const cred = await signInWithPopup(auth, provider);
      const googleUser = cred.user;
      const email = (googleUser.email || '').toLowerCase().trim();
      const isMasterUser = email === MASTER_EMAIL;

      let userProfile: Profile;
      let isNewUser = false;
      let needsOnboarding = false;

      try {
        const docSnap = await getDoc(doc(db, 'profiles', googleUser.uid));
        if (docSnap.exists()) {
          userProfile = docSnap.data() as Profile;
          if (isMasterUser) {
            userProfile.role = 'master';
            userProfile.brand_name = 'FastRifa';
            userProfile.brand_initials = 'FR';
            userProfile.onboarding_completed = true;
            await setDoc(doc(db, 'profiles', googleUser.uid), userProfile, { merge: true });
            needsOnboarding = false;
          } else {
            // Se já tem cadastro, verifica se já configurou os dados da marca
            needsOnboarding = !userProfile.onboarding_completed || !userProfile.brand_name;
          }
        } else {
          // NÃO EXISTE NO BANCO: Tratar obrigatoriamente como NOVO CADASTRO!
          isNewUser = true;
          needsOnboarding = !isMasterUser;

          userProfile = {
            id: googleUser.uid,
            full_name: googleUser.displayName || (isMasterUser ? 'Danilo (Owner FastRifa)' : 'Organizador'),
            phone_whatsapp: googleUser.phoneNumber || '',
            brand_name: isMasterUser ? 'FastRifa' : '', // Começa sem marca para forçar o onboarding
            brand_initials: isMasterUser ? 'FR' : '',
            role: isMasterUser ? 'master' : 'organizer',
            onboarding_completed: isMasterUser ? true : false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await setDoc(doc(db, 'profiles', googleUser.uid), userProfile);
        }
      } catch (err) {
        console.warn('Could not read/write firestore profile:', err);
        isNewUser = true;
        needsOnboarding = !isMasterUser;
        userProfile = {
          id: googleUser.uid,
          full_name: googleUser.displayName || (isMasterUser ? 'Danilo (Owner FastRifa)' : 'Organizador'),
          phone_whatsapp: '',
          brand_name: isMasterUser ? 'FastRifa' : '',
          brand_initials: isMasterUser ? 'FR' : '',
          role: isMasterUser ? 'master' : 'organizer',
          onboarding_completed: isMasterUser ? true : false,
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
      return { isNewUser, needsOnboarding };
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
      await sendPasswordResetEmail(auth, normalizedEmail);
      return {
        success: true,
        message: 'Um link oficial de recuperação foi enviado para o seu e-mail. Verifique sua caixa de entrada e spam.',
      };
    } catch (err: unknown) {
      const errObj = err as { code?: string };
      console.warn('Firebase password reset error:', err);
      if (errObj.code === 'auth/user-not-found') {
        return {
          success: true,
          message: 'Se o e-mail estiver cadastrado, o link oficial de redefinição de senha foi enviado.',
        };
      }
      return { error: 'Erro ao enviar o link de redefinição de senha. Verifique o e-mail digitado.' };
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return;
    const isMasterUser = user.email?.toLowerCase().trim() === MASTER_EMAIL;

    const current = profile || {
      id: user.uid,
      full_name: (user as { displayName?: string }).displayName || 'Organizador',
      phone_whatsapp: '',
      role: isMasterUser ? 'master' : 'organizer',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedProfile: Profile = {
      ...current,
      ...updates,
      role: isMasterUser ? 'master' : (updates.role || current.role || 'organizer'),
      updated_at: new Date().toISOString(),
    };

    setProfile(updatedProfile);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updatedProfile));
    }

    try {
      await setDoc(doc(db, 'profiles', user.uid), updatedProfile, { merge: true });
    } catch (err) {
      console.warn('Could not save profile in firestore:', err);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      localStorage.removeItem('fastrifa_theme');
      document.documentElement.setAttribute('data-theme', 'blue');
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
