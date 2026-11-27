'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { getUserRaffles, subscribeToUserRaffles } from '@/lib/firebase/raffles';
import { getRaffleAdminPath, getRafflePublicPath } from '@/lib/raffle-urls';
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
  ShieldCheck,
  Home,
  LogOut,
} from 'lucide-react';
import type { Raffle } from '@/types/database.types';

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && isMaster) {
      router.replace('/admin/master');
      return;
    }

    if (user) {
      getUserRaffles(user.uid)
        .then((data) => setRaffles(data))
        .catch((err) => console.error('Erro ao buscar rifas:', err))
        .finally(() => setLoading(false));

      const unsubscribe = subscribeToUserRaffles(user.uid, (liveRaffles) => {
        setRaffles(liveRaffles);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, authLoading, router, isMaster]);

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
  const totalTicketsCreated = raffles.reduce(
    (acc, r) => acc + (Number(r.total_tickets) || 0),
    0
  );

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Master Owner Banner */}
      {isMaster && (
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#FFF8EB] via-[#FEF3D6] to-[#FFF8EB] border border-[#F5D08A] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 rounded-2xl bg-[#D97706]/15 text-[#9A6700] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-display font-bold text-base text-[#78350F]">
                  Acesso Owner FastRifa
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#D97706] text-white">
                  Master
                </span>
              </div>
              <p className="text-xs text-[#92400E] mt-0.5">
                Você é o proprietário geral da plataforma. Para gerenciar todos os organizadores cadastrados e todas as rifas, acesse o painel master.
              </p>
            </div>
          </div>
          <Link
            href="/admin/master"
            className="px-5 py-2.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Abrir Painel Master</span>
          </Link>
        </div>
      )}

      {/* Header + Identidade da Marca unificados em Box Única (Organizador) / Cabeçalho Master */}
      {isMaster ? (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0869F5]">
                FastRifa
              </span>
              <span className="text-[#B9D3F8]">•</span>
              <span className="text-xs text-[#526480] font-medium">
                Visão Geral do Proprietário
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D1729] tracking-[-0.04em]">
              Minhas Campanhas Pessoais
            </h1>
            <p className="text-[#475872] text-[15px] mt-1.5">
              Acompanhe suas rifas rápidas, aprove comprovantes e confirme cotas com agilidade no PIX.
            </p>
          </div>
          <div className="flex flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/admin/master"
              className="ora-btn-secondary flex-1 sm:flex-initial rounded-[18px] px-3.5 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
              <span>Painel Master</span>
            </Link>
            <Link
              href="/admin/rifas/nova"
              className="ora-btn-primary flex-1 sm:flex-initial rounded-[18px] px-3.5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-[15px] font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Rifa rápida</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="ora-card rounded-[26px] sm:rounded-[30px] p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-stretch gap-5 sm:gap-7">
            {/* Esquerda: Nome da marca acima + Imagem ampliada em destaque abaixo */}
            <div className="flex flex-col items-center justify-center shrink-0 gap-2.5 md:pr-7 md:border-r md:border-[#E0E9F7]">
              <strong className="font-display font-bold text-base sm:text-lg text-[#0D1729] tracking-[-0.02em] text-center max-w-[168px] leading-tight truncate">
                {profile?.brand_name || 'Sua Marca'}
              </strong>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] sm:rounded-[26px] overflow-hidden bg-white border-2 border-[#CDE0FC] shadow-[0_12px_28px_rgba(8,105,245,0.12)] flex items-center justify-center flex-shrink-0">
                {profile?.brand_logo_url ? (
                  <img
                    src={profile.brand_logo_url}
                    alt={profile.brand_name || 'Logo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white font-display font-bold text-3xl sm:text-4xl">
                    {profile?.brand_initials || generateBrandInitials(profile?.brand_name || 'FR')}
                  </div>
                )}
              </div>
            </div>

            {/* Direita: Hero do Painel com ações principais e ícones Home/Sair no canto inferior direito */}
            <div className="flex-1 min-w-0 flex flex-col xl:flex-row xl:items-stretch xl:justify-between gap-4 sm:gap-5 text-center md:text-left">
              <div className="space-y-1.5 min-w-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00A868]">
                    Bem-vindo
                  </span>
                </div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-[34px] text-[#0D1729] tracking-[-0.04em] leading-tight">
                  Painel de Controle
                </h1>
                <p className="text-[#475872] text-sm sm:text-[15px] leading-relaxed">
                  Acompanhe suas rifas rápidas, aprove comprovantes e confirme cotas com agilidade no PIX.
                </p>
                <p className="text-xs text-[#526480] pt-0.5">
                  Sua marca e logotipo aparecem no topo de todas as suas campanhas públicas para os seus clientes.
                </p>
              </div>

              <div className="flex flex-col items-center md:items-start xl:items-end justify-between gap-3 shrink-0 self-stretch">
                <div className="flex flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center md:justify-start xl:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsBrandModalOpen(true)}
                    className="ora-btn-secondary flex-1 sm:flex-initial rounded-full px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Store className="w-4 h-4 text-[#0869F5]" />
                    <span>Minha Marca</span>
                  </button>
                  <Link
                    href="/admin/rifas/nova"
                    className="ora-btn-primary flex-1 sm:flex-initial rounded-full px-4 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-[15px] font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Rifa rápida</span>
                  </Link>
                </div>

                {/* Ícones de Home e Sair alinhados no canto inferior direito com o botão Rifa rápida */}
                <div className="mt-auto pt-1 flex items-center justify-end gap-2 w-full">
                  <Link
                    href="/"
                    title="Ir para a página inicial"
                    aria-label="Ir para a página inicial"
                    className="ora-btn-secondary rounded-full w-10 h-10 inline-flex items-center justify-center text-[#14213A] hover:text-[#00A868] transition shrink-0"
                  >
                    <Home className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sair da conta"
                    aria-label="Sair da conta"
                    className="w-10 h-10 inline-flex items-center justify-center text-[#475872] hover:text-[#BE123C] bg-[#F8FBFF] hover:bg-[#FFF1F2] border border-[#D9E5F7] hover:border-[#FECDD3] rounded-full transition cursor-pointer shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Summary Strip (3 cards ricos e coerentes em grade responsiva) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-5 tabular-nums">
        <div className="ora-card rounded-[20px] sm:rounded-[26px] overflow-hidden flex flex-col justify-between bg-white">
          <div className="h-1 w-full bg-gradient-to-r from-[#529BFF] to-[#0869F5]" />
          <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-1 text-[#475872] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="truncate">
                <span className="hidden sm:inline">Total de Rifas</span>
                <span className="sm:hidden">Total Rifas</span>
              </span>
              <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#F2F7FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center flex-shrink-0">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-2xl sm:text-4xl text-[#0D1729] leading-none">
                {totalRaffles}
              </div>
              <p className="text-[10px] sm:text-xs text-[#526480] font-medium mt-1.5 truncate">
                {totalTicketsCreated > 0
                  ? `${totalTicketsCreated.toLocaleString('pt-BR')} cotas criadas`
                  : 'Crie sua 1ª campanha'}
              </p>
            </div>
          </div>
        </div>

        <div className="ora-card rounded-[20px] sm:rounded-[26px] overflow-hidden flex flex-col justify-between bg-white">
          <div className="h-1 w-full bg-gradient-to-r from-[#10B981] to-[#00A868]" />
          <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-1 text-[#475872] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 truncate">
                {activeRaffles > 0 && (
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00A868] animate-pulse shrink-0" />
                )}
                <span className="truncate">
                  <span className="hidden sm:inline">Rifas Ativas</span>
                  <span className="sm:hidden">Ativas</span>
                </span>
              </span>
              <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-2xl sm:text-4xl text-[#0869F5] leading-none">
                {activeRaffles}
              </div>
              <p className="text-[10px] sm:text-xs text-[#526480] font-medium mt-1.5 truncate">
                {activeRaffles > 0 ? 'Recebendo no PIX' : 'Nenhuma em andamento'}
              </p>
            </div>
          </div>
        </div>

        <div className="ora-card rounded-[20px] sm:rounded-[26px] overflow-hidden flex flex-col justify-between bg-white">
          <div className="h-1 w-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]" />
          <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-1 text-[#475872] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="truncate">Concluídas</span>
              <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] flex items-center justify-center flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-2xl sm:text-4xl text-[#0D1729] leading-none">
                {completedRaffles}
              </div>
              <p className="text-[10px] sm:text-xs text-[#526480] font-medium mt-1.5 truncate">
                {completedRaffles > 0 ? 'Sorteios finalizados' : 'Nenhum sorteio ainda'}
              </p>
            </div>
          </div>
        </div>
      </div>

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
            {raffles.map((raffle) => {
              const coverImage = raffle.prize_image_url || raffle.prize_images?.[0] || null;
              return (
              <div
                key={raffle.id}
                className="ora-card rounded-[25px] p-5 sm:p-6 flex flex-col justify-between hover:border-[#97BAE7] transition shadow-sm"
              >
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Miniatura da Imagem da Rifa */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[18px] overflow-hidden bg-[#F2F7FF] border border-[#D9E5F7] flex-shrink-0 flex items-center justify-center">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={raffle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#0869F5]/70 gap-1 p-2 text-center">
                          <Tag className="w-6 h-6 text-[#0869F5]" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#526480]">Sem foto</span>
                        </div>
                      )}
                    </div>

                    {/* Título e Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                        <span className="text-[11px] text-[#526480] truncate font-mono">
                          {getRafflePublicPath(raffle)}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-[#0D1729] tracking-[-0.03em] line-clamp-2 leading-tight">
                        {raffle.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#475872] mt-3 mb-5 tabular-nums bg-[#F5F9FF] p-3 rounded-[16px] border border-[#E0E9F7]">
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
                    href={getRafflePublicPath(raffle)}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#475872] hover:text-[#0869F5] transition"
                  >
                    <span>Página Pública</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href={getRaffleAdminPath(raffle)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F2F7FF] hover:bg-[#E3EFFF] border border-[#CDE0FC] text-[#0755DE] text-[13px] font-bold rounded-[13px] transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Gerenciar Cotas</span>
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand Setup Modal */}
      {!isMaster && (
        <BrandOnboardingModal
          isOpen={isBrandModalOpen}
          onClose={() => setIsBrandModalOpen(false)}
          isEditMode={true}
        />
      )}
    </div>
  );
}
