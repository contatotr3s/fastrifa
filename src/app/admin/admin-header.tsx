'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import ThemeSwitcher from '@/components/theme-switcher';
import BrandOnboardingModal from '@/components/brand-onboarding-modal';
import { generateBrandInitials } from '@/lib/image-processor';
import { PlusCircle, LogOut, Store, ShieldCheck } from 'lucide-react';

export default function AdminHeader() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const brandName = profile?.brand_name || 'FastRifa';
  const brandInitials = profile?.brand_initials || generateBrandInitials(brandName);
  const brandLogo = profile?.brand_logo_url;
  const isMaster = profile?.role === 'master' || profile?.id === 'demo-organizer-uid';

  return (
    <>
      <header className="sticky top-0 z-50 h-[84px] flex items-center bg-white/85 backdrop-blur-md border-b border-[#E3EDFB]">
        <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Brand Pill (Dynamic White-label) */}
            <Link
              href="/admin"
              className="ora-glass-pill rounded-full pl-2.5 pr-4 py-2 flex items-center gap-2.5 hover:border-[#B9D3F8] transition"
              title={`Painel do Organizador — ${brandName}`}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_14px_rgba(8,105,245,0.35)] flex-shrink-0">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt={brandName}
                    className="w-full h-full object-cover"
                  />
                ) : profile?.brand_name ? (
                  <span className="font-display font-bold text-xs text-white">
                    {brandInitials}
                  </span>
                ) : (
                  <img
                    src="/icone-isolado.png"
                    alt="Ícone Fast Rifa"
                    className="w-16 h-16 object-contain brightness-0 invert"
                  />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-base sm:text-lg tracking-[-0.04em] text-[#0D1729] leading-tight">
                  {profile?.brand_name ? (
                    profile.brand_name
                  ) : (
                    <>
                      Fast<span className="text-[#0869F5]">Rifa</span>
                    </>
                  )}
                </span>
                {profile?.brand_name && (
                  <span className="text-[10px] font-semibold text-[#526480] leading-none mt-0.5">
                    Painel do Criador
                  </span>
                )}
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#475872]">
              <Link href="/admin" className="text-[#0D1729] hover:text-[#0869F5] font-semibold transition">
                Minhas Campanhas
              </Link>
              <Link href="/admin/rifas/nova" className="text-[#0869F5] hover:text-[#052498] font-semibold transition">
                + Nova Rifa
              </Link>
              {isMaster && (
                <Link
                  href="/admin/master"
                  className="px-3 py-1 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] hover:bg-[#FDECC8] font-bold text-xs transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Painel Master</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeSwitcher variant="compact" />

            {/* Configurar Marca Button */}
            <button
              type="button"
              onClick={() => setIsBrandModalOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold text-[#475872] hover:text-[#0869F5] hover:bg-[#F2F7FF] border border-transparent hover:border-[#CDE0FC] transition flex items-center gap-1.5 cursor-pointer"
              title="Personalizar identidade da sua marca"
            >
              <Store className="w-4 h-4 text-[#0869F5]" />
              <span className="hidden sm:inline">Minha Marca</span>
            </button>

            <Link
              href="/admin/rifas/nova"
              className="ora-btn-primary rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Rifa</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
              className="p-2.5 text-[#475872] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] rounded-full transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Brand Modal */}
      <BrandOnboardingModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        isEditMode={true}
      />
    </>
  );
}
