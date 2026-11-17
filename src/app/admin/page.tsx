'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { getUserRaffles } from '@/lib/firebase/raffles';
import ThemeSwitcher from '@/components/theme-switcher';
import BrandOnboardingModal from '@/components/brand-onboarding-modal';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  PlusCircle,
  ExternalLink,
  Settings,
  Trophy,
  Sparkles,
  Tag,
  Store,
  Loader2,
} from 'lucide-react';
import type { Raffle } from '@/types/database.types';

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Exibe onboarding automaticamente no primeiro acesso se não tiver configurado marca
  const shouldAutoOnboard =
    !authLoading &&
    profile &&
    profile.onboarding_completed !== true &&
    !profile.brand_name;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      getUserRaffles(user.uid)
        .then((data) => setRaffles(data))
        .catch((err) => console.error('Erro ao buscar rifas:', err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
      </div>
    );
  }

  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter((r) => r.status === 'active').length;
  const completedRaffles = raffles.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-10">
      {/* Page Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0869F5]">
              {profile?.brand_name ? profile.brand_name : 'FastRifa'}
            </span>
            <span className="text-[#B9D3F8]">•</span>
            <span className="text-xs text-[#526480] font-medium">Painel do Organizador</span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D1729] tracking-[-0.04em]">
            Painel de Controle
          </h1>
          <p className="text-[#475872] text-[15px] mt-1.5">
            Acompanhe suas rifas rápidas, aprove comprovantes e confirme cotas com agilidade no PIX.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBrandModalOpen(true)}
            className="ora-btn-secondary rounded-[18px] px-5 py-3.5 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4 text-[#0869F5]" />
            <span>Minha Marca</span>
          </button>
          <Link
            href="/admin/rifas/nova"
            className="ora-btn-primary rounded-[18px] px-6 py-3.5 text-[15px] font-bold inline-flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Rifa Rápida</span>
          </Link>
        </div>
      </div>

      {/* Brand Identity Banner */}
      <div className="ora-card-soft rounded-[25px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-[18px] overflow-hidden bg-white border border-[#CDE0FC] shadow-sm flex items-center justify-center flex-shrink-0">
            {profile?.brand_logo_url ? (
              <img
                src={profile.brand_logo_url}
                alt={profile.brand_name || 'Logo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white font-display font-bold text-xl">
                {profile?.brand_initials || generateBrandInitials(profile?.brand_name || profile?.full_name || 'FR')}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <strong className="font-display font-bold text-lg text-[#0D1729]">
                {profile?.brand_name || 'Configure sua marca'}
              </strong>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EDF5FF] text-[#0869F5] border border-[#CDE0FC]">
                Oficial
              </span>
            </div>
            <p className="text-xs text-[#526480] mt-0.5">
              {profile?.brand_name
                ? 'Sua marca e logo são exibidas no topo de todas as suas campanhas públicas.'
                : 'Defina o nome do seu negócio e carregue sua logo para personalizar suas páginas.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsBrandModalOpen(true)}
          className="ora-btn-secondary rounded-full px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Store className="w-3.5 h-3.5 text-[#0869F5]" />
          <span>{profile?.brand_name ? 'Editar Identidade' : 'Configurar Minha Marca'}</span>
        </button>
      </div>

      {/* Overview Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 tabular-nums">
        <div className="ora-card rounded-[25px] p-6">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total de Rifas</span>
            <span className="w-8 h-8 rounded-full bg-[#F2F7FF] text-[#0869F5] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#0D1729]">{totalRaffles}</div>
        </div>

        <div className="ora-card rounded-[25px] p-6">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Campanhas Ativas</span>
            <span className="w-8 h-8 rounded-full bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#0869F5]">{activeRaffles}</div>
        </div>

        <div className="ora-card rounded-[25px] p-6">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Finalizadas</span>
            <span className="w-8 h-8 rounded-full bg-[#FFF8EB] text-[#9A6700] flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#0D1729]">{completedRaffles}</div>
        </div>
      </div>

      {/* Theme Customizer Switcher */}
      <ThemeSwitcher variant="full" />

      {/* Raffles List */}
      <div className="space-y-5">
        <h2 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
          Suas Campanhas
        </h2>

        {raffles.length === 0 ? (
          <div className="ora-card rounded-[28px] p-12 text-center">
            <div className="w-14 h-14 bg-[#F2F7FF] border border-[#CDE0FC] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0869F5]">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#0D1729] mb-1.5">
              Nenhuma campanha criada ainda
            </h3>
            <p className="text-[15px] text-[#475872] max-w-md mx-auto mb-6">
              Comece agora configurando seu primeiro prêmio com chave PIX e compartilhando o link público com seus participantes.
            </p>
            <Link
              href="/admin/rifas/nova"
              className="ora-btn-primary rounded-[18px] px-6 py-3.5 text-sm font-bold inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Primeira Rifa</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {raffles.map((raffle) => (
              <div
                key={raffle.id}
                className="ora-card rounded-[25px] p-6 sm:p-7 flex flex-col justify-between hover:border-[#97BAE7] transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 ${
                          raffle.status === 'active'
                            ? 'bg-[#0869F5] text-white'
                            : raffle.status === 'completed'
                            ? 'bg-[#FFF8EB] text-[#9A6700] border border-[#F5D08A]'
                            : 'bg-[#F5F9FF] text-[#475872] border border-[#D9E5F7]'
                        }`}
                      >
                        {raffle.status === 'active'
                          ? 'Ativa'
                          : raffle.status === 'completed'
                          ? 'Concluída'
                          : 'Pausada'}
                      </span>
                      <h3 className="font-display font-bold text-xl text-[#0D1729] tracking-[-0.03em] line-clamp-1">
                        {raffle.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#475872] mt-3 mb-6 tabular-nums bg-[#F5F9FF] p-3.5 rounded-[16px] border border-[#E0E9F7]">
                    <span>
                      <strong className="text-[#0D1729] font-bold">{raffle.total_tickets}</strong> cotas
                    </span>
                    <span className="text-[#B9D3F8]">•</span>
                    <span>
                      <strong className="text-[#0D1729] font-bold">
                        R$ {Number(raffle.ticket_price).toFixed(2)}
                      </strong>{' '}
                      por cota
                    </span>
                    <span className="text-[#B9D3F8]">•</span>
                    <span>
                      Potencial:{' '}
                      <strong className="text-[#0869F5] font-bold">
                        R$ {(raffle.total_tickets * raffle.ticket_price).toFixed(2)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E0E9F7] flex items-center justify-between gap-3">
                  <Link
                    href={`/r/${raffle.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#475872] hover:text-[#0869F5] transition"
                  >
                    <span>Página Pública</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/admin/rifas/${raffle.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F2F7FF] hover:bg-[#E3EFFF] border border-[#CDE0FC] text-[#0755DE] text-[13px] font-bold rounded-[13px] transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Gerenciar Cotas</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Setup / Onboarding Modal */}
      <BrandOnboardingModal
        isOpen={Boolean(shouldAutoOnboard || isBrandModalOpen)}
        onClose={() => setIsBrandModalOpen(false)}
        isEditMode={!shouldAutoOnboard}
      />
    </div>
  );
}
