'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import ThemeSwitcher from '@/components/theme-switcher';
import BrandOnboardingModal from '@/components/brand-onboarding-modal';
import { generateBrandInitials } from '@/lib/image-processor';
import { PlusCircle, LogOut, Store, ShieldCheck } from 'lucide-react';

export default function AdminHeader() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';
  const isOnboarding = pathname === '/admin/onboarding';

  const brandName = isMaster ? 'FastRifa' : profile?.brand_name || 'FastRifa';
  const brandInitials = isMaster ? 'FR' : profile?.brand_initials || generateBrandInitials(brandName);
  const brandLogo = isMaster ? null : profile?.brand_logo_url;

  return (
    <>
      <header className="sticky top-0 z-50 h-[84px] flex items-center bg-white/85 backdrop-blur-md border-b border-[#E3EDFB]">
        <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Brand Pill */}
            <Link
              href={isMaster ? '/admin/master' : '/admin'}
              className="ora-glass-pill rounded-full pl-2.5 pr-4 py-2 flex items-center gap-2.5 hover:border-[#B9D3F8] transition"
              title={isMaster ? 'FastRifa — Painel Master' : `Painel do Organizador — ${brandName}`}
            >
              {isMaster ? (
                <>
                  <img
                    src="/icone-mobile-fastrifa.png"
                    alt="Fast Rifa"
                    className="h-7 w-auto object-contain flex-shrink-0 block sm:hidden"
                  />
                  <img
                    src="/icone-isolado.png"
                    alt="Fast Rifa"
                    className="w-8 h-8 object-contain flex-shrink-0 hidden sm:block"
                  />
                </>
              ) : brandLogo ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-[#D9E5F7] flex-shrink-0">
                  <img
                    src={brandLogo}
                    alt={brandName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : profile?.brand_name ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white flex-shrink-0 shadow-sm">
                  <span className="font-display font-bold text-xs text-white">
                    {brandInitials}
                  </span>
                </div>
              ) : (
                <>
                  <img
                    src="/icone-mobile-fastrifa.png"
                    alt="Fast Rifa"
                    className="h-7 w-auto object-contain flex-shrink-0 block sm:hidden"
                  />
                  <img
                    src="/icone-isolado.png"
                    alt="Fast Rifa"
                    className="w-8 h-8 object-contain flex-shrink-0 hidden sm:block"
                  />
                </>
              )}
              <div className="flex flex-col text-left max-w-[110px] sm:max-w-[200px] md:max-w-none">
                <span className="font-display font-bold text-base sm:text-lg tracking-[-0.04em] text-[#0D1729] leading-tight truncate">
                  {isMaster ? (
                    <>
                      Fast<span className="text-[#0869F5]">Rifa</span>
                    </>
                  ) : profile?.brand_name ? (
                    profile.brand_name
                  ) : (
                    <>
                      Fast<span className="text-[#0869F5]">Rifa</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] font-semibold text-[#526480] leading-none mt-0.5 truncate">
                  {isMaster
                    ? 'Painel Master'
                    : profile?.brand_name
                    ? 'Painel do Criador'
                    : 'Configuração Inicial'}
                </span>
              </div>
            </Link>

            {/* Navigation links (escondidos se estiver no onboarding) */}
            {!isOnboarding && (
              <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#475872]">
                {isMaster ? (
                  <Link
                    href="/admin/master"
                    className="px-3.5 py-1.5 rounded-full bg-[#0869F5] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Painel Master</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/admin"
                      className={`hover:text-[#0869F5] font-semibold transition ${
                        pathname === '/admin' ? 'text-[#0869F5]' : 'text-[#0D1729]'
                      }`}
                    >
                      Minhas Campanhas
                    </Link>
                    <Link
                      href="/admin/rifas/nova"
                      className={`hover:text-[#052498] font-semibold transition ${
                        pathname === '/admin/rifas/nova' ? 'text-[#0869F5]' : 'text-[#0869F5]'
                      }`}
                    >
                      + Nova Rifa
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeSwitcher variant="compact" />

            {/* Se NÃO for Master e NÃO estiver no onboarding, permite editar a marca (oculto no mobile para evitar redundância e desalinhamento) */}
            {!isMaster && !isOnboarding && (
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                className="hidden sm:flex px-3 py-1.5 rounded-full text-xs font-bold text-[#475872] hover:text-[#0869F5] hover:bg-[#F2F7FF] border border-transparent hover:border-[#CDE0FC] transition items-center gap-1.5 cursor-pointer"
                title="Personalizar identidade da sua marca"
              >
                <Store className="w-4 h-4 text-[#0869F5]" />
                <span>Minha Marca</span>
              </button>
            )}

            {/* Se for Master, link direto para Painel Master no cabeçalho mobile */}
            {isMaster && (
              <Link
                href="/admin/master"
                className="md:hidden p-2 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700]"
                title="Painel Master"
              >
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}

            {/* Nova Rifa: visível no desktop, oculto no mobile pois já existe com destaque no topo do painel */}
            {!isOnboarding && (
              <Link
                href="/admin/rifas/nova"
                className="hidden sm:inline-flex ora-btn-primary rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Rifa</span>
              </Link>
            )}

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

      {/* Brand Modal para edição posterior */}
      {!isMaster && (
        <BrandOnboardingModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          isEditMode={true}
        />
      )}
    </>
  );
}
