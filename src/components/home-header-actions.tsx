'use client';

import Link from 'next/link';
import { UserCheck } from 'lucide-react';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { generateBrandInitials } from '@/lib/image-processor';

export default function HomeHeaderActions() {
  const { user, profile, loading } = useAuth();

  if (!loading && user) {
    const email = user.email?.toLowerCase().trim() || '';
    const isMaster = email === MASTER_EMAIL || profile?.role === 'master';
    const hasCompletedOnboarding = Boolean(
      profile?.onboarding_completed && profile?.brand_name?.trim()
    );
    const panelHref = isMaster
      ? '/admin/master'
      : hasCompletedOnboarding
      ? '/admin'
      : '/admin/onboarding';
    const createHref =
      isMaster || hasCompletedOnboarding
        ? '/admin/rifas/nova'
        : '/admin/onboarding';

    const brandName = isMaster
      ? 'FastRifa'
      : profile?.brand_name?.trim() || 'Minha Marca';
    const brandInitials =
      profile?.brand_initials || generateBrandInitials(brandName);

    return (
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <Link
          href={panelHref}
          className="ora-btn-secondary rounded-full h-11 sm:h-12 pl-2 pr-4 sm:pl-2.5 sm:pr-5 text-[13.5px] sm:text-[14px] font-semibold inline-flex items-center justify-center gap-2"
          title={`Acessar Painel — ${brandName}`}
        >
          <span className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-[#D9E5F7] bg-white shadow-xs">
            {!isMaster && profile?.brand_logo_url ? (
              <img
                src={profile.brand_logo_url}
                alt={brandName}
                className="w-full h-full object-cover"
              />
            ) : !isMaster && profile?.brand_name?.trim() ? (
              <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white font-display font-bold text-[10px]">
                {brandInitials}
              </span>
            ) : (
              <img
                src="/icone-isolado.png"
                alt="Fast Rifa"
                className="w-5 h-5 object-contain"
              />
            )}
          </span>
          <span>Painel</span>
        </Link>

        <Link
          href={createHref}
          className="ora-btn-primary rounded-full h-11 sm:h-12 px-4 sm:px-6 text-[13.5px] sm:text-[14px] font-bold inline-flex items-center justify-center"
        >
          <span>Criar rifa</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      <Link
        href="/login"
        className="ora-btn-secondary rounded-full h-11 sm:h-12 px-3.5 sm:px-5 text-[13.5px] sm:text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2"
      >
        <UserCheck className="w-4 h-4 text-[#0869F5]" />
        <span>Entrar</span>
      </Link>
      <Link
        href="/cadastro"
        className="ora-btn-primary rounded-full h-11 sm:h-12 px-4 sm:px-6 text-[13.5px] sm:text-[14px] font-bold inline-flex items-center justify-center"
      >
        <span>Criar rifa</span>
      </Link>
    </div>
  );
}
