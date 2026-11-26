'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = Boolean(user && (email === MASTER_EMAIL || profile?.role === 'master'));
  const needsOnboarding = Boolean(
    user && !isMaster && profile && (!profile.onboarding_completed || !profile.brand_name?.trim())
  );

  useEffect(() => {
    if (loading) return;

    // 1. Não autenticado -> redireciona para login
    if (!user) {
      router.replace('/login');
      return;
    }

    // 2. Se for Master Owner (Danilo), acesso irrestrito sem onboarding (vai para Master)
    if (isMaster) {
      if (pathname === '/admin/onboarding') {
        router.replace('/admin/master');
      }
      return;
    }

    // 3. Aguarda o perfil do Firestore carregar antes de decidir onboarding
    if (!profile) return;

    // 4. Se for organizador comum: deve preencher os dados da marca antes de acessar o painel
    if (needsOnboarding) {
      if (pathname !== '/admin/onboarding') {
        router.replace('/admin/onboarding');
      }
    } else if (pathname === '/admin/onboarding') {
      router.replace('/admin');
    }
  }, [user, profile, loading, pathname, router, isMaster, needsOnboarding]);

  const waitingProfile = Boolean(user && !isMaster && !profile);
  const redirectingMasterFromOnboarding = Boolean(isMaster && pathname === '/admin/onboarding');
  const redirectingOrganizer = Boolean(
    user &&
      !isMaster &&
      profile &&
      ((needsOnboarding && pathname !== '/admin/onboarding') ||
        (!needsOnboarding && pathname === '/admin/onboarding'))
  );

  if (loading || waitingProfile || redirectingMasterFromOnboarding || redirectingOrganizer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
        <span className="text-xs font-semibold text-[#526480]">
          Carregando ambiente seguro...
        </span>
      </div>
    );
  }

  // Se não estiver logado, evita renderizar flash do conteúdo
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
