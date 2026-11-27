'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { Home, LogOut, ShieldCheck } from 'lucide-react';

export default function AdminHeader() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';
  const isOnboarding = pathname === '/admin/onboarding';
  const isNewRafflePage = pathname === '/admin/rifas/nova';
  const isRaffleDetailsPage =
    Boolean(pathname?.startsWith('/admin/rifas/')) && !isNewRafflePage;

  // Em /admin/rifas/nova, /admin e /admin/rifas/[id] (organizador logado),
  // o header externo é removido e a navegação fica dentro da própria box hero/formulário
  if (isNewRafflePage || (!isMaster && (pathname === '/admin' || isRaffleDetailsPage))) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 h-[84px] flex items-center bg-white/85 backdrop-blur-md border-b border-[#E3EDFB]">
        {isOnboarding ? (
          <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            {/* Esquerda: Logo principal */}
            <div className="justify-self-start flex items-center">
              <Link
                href="/admin/onboarding"
                className="ora-glass-pill rounded-full h-11 sm:h-12 px-3 sm:px-4 inline-flex items-center justify-center hover:border-[#B9D3F8] transition"
                title="Fast Rifa — Configuração Inicial"
              >
                <img
                  src="/logo-fastrifa.png"
                  alt="Fast Rifa"
                  className="h-7 sm:h-8 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Centro: Título Configuração Inicial centralizado */}
            <div className="justify-self-center text-center">
              <span className="font-display font-bold text-sm sm:text-lg text-[#0D1729] tracking-[-0.03em] whitespace-nowrap">
                Configuração Inicial
              </span>
            </div>

            {/* Direita: Somente botão Sair (sem seletor de cor) */}
            <div className="justify-self-end flex items-center">
              <button
                type="button"
                onClick={handleLogout}
                title="Sair da conta"
                aria-label="Sair da conta"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#475872] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-[#E0E9F7] hover:border-[#FECDD3] rounded-full transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {isMaster ? (
                <>
                  {/* Brand Pill (Master) */}
                  <Link
                    href="/admin/master"
                    className="ora-glass-pill rounded-full pl-2.5 pr-4 py-2 flex items-center gap-2.5 hover:border-[#B9D3F8] transition"
                    title="FastRifa — Painel Master"
                  >
                    <img
                      src="/logo-fastrifa.png"
                      alt="Fast Rifa"
                      className="h-6 w-auto object-contain flex-shrink-0 block sm:hidden"
                    />
                    <img
                      src="/icone-isolado.png"
                      alt="Fast Rifa"
                      className="w-8 h-8 object-contain flex-shrink-0 hidden sm:block"
                    />
                    <div className="flex flex-col text-left max-w-[110px] sm:max-w-[200px] md:max-w-none">
                      <span className="font-display font-bold text-base sm:text-lg tracking-[-0.04em] text-[#0D1729] leading-tight truncate hidden sm:inline">
                        Fast<span className="text-[#0869F5]">Rifa</span>
                      </span>
                      <span className="text-[10px] font-semibold text-[#526480] leading-none mt-0.5 truncate">
                        Painel Master
                      </span>
                    </div>
                  </Link>

                  {/* Navigation links (somente selo do Painel Master no desktop) */}
                  <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#475872]">
                    <Link
                      href="/admin/master"
                      className="px-3.5 py-1.5 rounded-full bg-[#0869F5] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Painel Master</span>
                    </Link>
                  </nav>
                </>
              ) : (
                /* Organizador: ícone de Home no lugar do badge da marca + Painel do Criador */
                <Link
                  href="/"
                  title="Ir para a página inicial"
                  aria-label="Ir para a página inicial"
                  className="ora-btn-secondary rounded-full w-11 h-11 inline-flex items-center justify-center text-[#14213A] hover:text-[#0869F5] transition shrink-0"
                >
                  <Home className="w-5 h-5" />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {isMaster && (
                <Link
                  href="/"
                  title="Ir para a página inicial"
                  aria-label="Ir para a página inicial"
                  className="ora-btn-secondary rounded-full w-10 h-10 inline-flex items-center justify-center text-[#14213A] hover:text-[#0869F5] transition shrink-0"
                >
                  <Home className="w-4 h-4" />
                </Link>
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
        )}
      </header>
    </>
  );
}
