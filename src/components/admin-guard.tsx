'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 1. Não autenticado -> redireciona para login
    if (!user) {
      router.replace('/login');
      return;
    }

    const email = user.email?.toLowerCase().trim() || '';
    const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

    // 2. Se for Master Owner (Danilo), acesso irrestrito sem necessidade de marca
    if (isMaster) {
      if (pathname === '/admin/onboarding') {
        router.replace('/admin');
      }
      return;
    }

    // 3. Se for organizador comum:
    // Regra obrigatória: deve preencher os dados de cadastro de sua marca antes de acessar o painel
    const needsOnboarding = !profile?.onboarding_completed || !profile?.brand_name?.trim();

    if (needsOnboarding) {
      if (pathname !== '/admin/onboarding') {
        router.replace('/admin/onboarding');
      }
    } else {
      // Se já configurou a marca e tentar acessar a tela de onboarding inicial, manda para o painel
      if (pathname === '/admin/onboarding') {
        router.replace('/admin');
      }
    }
  }, [user, profile, loading, pathname, router]);

  if (loading) {
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
