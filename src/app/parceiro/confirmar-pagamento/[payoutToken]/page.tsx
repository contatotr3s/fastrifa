'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  confirmPartnerPayout,
  getPartnerPayoutByToken,
} from '@/lib/firebase/partners';
import { getRaffleById } from '@/lib/firebase/raffles';
import { maskCpfDisplay } from '@/lib/partner-finance';
import {
  getPartnerCheckoutPath,
  getRafflePublicPath,
} from '@/lib/raffle-urls';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import type { PartnerPayout, Raffle } from '@/types/database.types';

function formatCurrencyBrl(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `R$ ${safe.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTimePtBr(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConfirmPartnerPayoutPage({
  params,
}: {
  params: Promise<{ payoutToken: string }>;
}) {
  const { payoutToken } = use(params);

  const [payout, setPayout] = useState<PartnerPayout | null>(null);
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError(null);

      try {
        const foundPayout = await getPartnerPayoutByToken(payoutToken);
        if (!active) return;

        if (!foundPayout) {
          setPayout(null);
          setLoading(false);
          return;
        }

        setPayout(foundPayout);

        const foundRaffle = await getRaffleById(foundPayout.raffle_id).catch(
          () => null
        );
        if (!active) return;
        setRaffle(foundRaffle);

        if (typeof window !== 'undefined') {
          const globalTheme =
            localStorage.getItem('fastrifa_global_system_theme') || 'green';
          const themeToApply = foundRaffle?.brand_color
            ? foundRaffle.brand_color
            : globalTheme;
          document.documentElement.setAttribute('data-theme', themeToApply);
        }
      } catch (err) {
        console.error('Erro ao carregar recibo de comissão:', err);
        if (active) {
          setLoadError('Não foi possível carregar este recibo de pagamento.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        const globalTheme =
          localStorage.getItem('fastrifa_global_system_theme') || 'green';
        document.documentElement.setAttribute('data-theme', globalTheme);
      }
    };
  }, [payoutToken]);

  async function handleConfirm() {
    if (!payout || confirming || payout.status === 'confirmed') return;
    setConfirmError(null);
    setConfirming(true);

    try {
      const result = await confirmPartnerPayout(payoutToken);
      if (!result.success || !result.payout) {
        setConfirmError(
          result.error ||
            'Não foi possível confirmar o recebimento agora. Tente novamente.'
        );
        setConfirming(false);
        return;
      }

      setPayout(result.payout);
      setJustConfirmed(true);
    } catch (err) {
      console.error('Erro ao confirmar recebimento do repasse:', err);
      setConfirmError(
        'Ocorreu um erro inesperado ao confirmar o recebimento. Tente novamente.'
      );
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] ora-hero-stage flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[var(--ora-blue,#00A868)] animate-spin" />
      </div>
    );
  }

  if (loadError || !payout) {
    return (
      <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center p-4">
        <div className="ora-card rounded-[28px] p-7 sm:p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#0D1729]">
            {loadError ? 'Erro ao carregar recibo' : 'Recibo não encontrado'}
          </h1>
          <p className="text-sm text-[#475872] leading-relaxed">
            {loadError ||
              'Não encontramos nenhum comprovante de repasse para este link. Verifique o endereço enviado pelo organizador.'}
          </p>
          <Link
            href="/"
            className="ora-btn-secondary rounded-full px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir para o Início</span>
          </Link>
        </div>
      </div>
    );
  }

  const brandName = raffle?.brand_name || 'FastRifa Oficial';
  const raffleTitle = raffle?.title || payout.raffle_title;
  const isConfirmed = payout.status === 'confirmed';

  return (
    <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center px-4 py-8 sm:py-12">
      <main className="w-full max-w-[480px] space-y-5">
        <div className="text-center space-y-2.5">
          <div className="ora-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--ora-blue,#00A868)]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Comprovante Bilateral de Repasse</span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.04em] text-[#0D1729]">
            {isConfirmed
              ? 'Recebimento Confirmado'
              : 'Confirme o Recebimento'}
          </h1>
          <p className="text-sm text-[#475872] leading-relaxed">
            {isConfirmed
              ? 'Este acerto de comissão está confirmado e auditado no histórico da campanha.'
              : 'O organizador informou o pagamento da sua comissão. Confira os dados abaixo e confirme se o valor já caiu para você.'}
          </p>
        </div>

        <section className="ora-card rounded-[28px] p-5 sm:p-7 space-y-5">
          {/* Cabeçalho da Campanha */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#E0E9F7]">
            <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#A7F3D0] to-[var(--ora-blue,#00A868)] text-white text-xs font-bold shadow-xs shrink-0">
              {raffle?.brand_logo_url ? (
                <img
                  src={raffle.brand_logo_url}
                  alt={brandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{generateBrandInitials(brandName)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block truncate">
                {brandName}
              </span>
              <h2 className="font-display font-bold text-sm sm:text-base text-[#0D1729] truncate">
                {raffleTitle}
              </h2>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1 shrink-0 ${
                isConfirmed
                  ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                  : 'bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]'
              }`}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmado</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendente</span>
                </>
              )}
            </span>
          </div>

          {/* Valor do Repasse */}
          <div className="p-4 rounded-[20px] bg-[#F5F9FF] border border-[#D9E5F7] text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526480] block">
              Valor informado pelo organizador
            </span>
            <div className="font-display font-bold text-3xl sm:text-4xl text-[#0D1729] tabular-nums">
              {formatCurrencyBrl(payout.amount)}
            </div>
            <span className="text-xs text-[#526480] block">
              Registrado em {formatDateTimePtBr(payout.created_at)}
            </span>
          </div>

          {/* Dados do Parceiro & Observação */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3 py-2 border-b border-[#E0E9F7]">
              <span className="text-xs font-semibold text-[#526480]">
                Parceiro
              </span>
              <span className="font-display font-bold text-[#0D1729] text-right truncate">
                {payout.partner_name}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-b border-[#E0E9F7]">
              <span className="text-xs font-semibold text-[#526480]">CPF</span>
              <span className="font-mono font-bold text-xs text-[#14213A] tabular-nums">
                {maskCpfDisplay(payout.partner_cpf)}
              </span>
            </div>

            {payout.note && (
              <div className="p-3 rounded-[16px] bg-[#F5F9FF] border border-[#D9E5F7] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#526480] block">
                  Observação do organizador
                </span>
                <p className="text-xs sm:text-sm text-[#14213A] leading-relaxed">
                  {payout.note}
                </p>
              </div>
            )}
          </div>

          {confirmError && (
            <div
              role="alert"
              className="p-3.5 rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs sm:text-sm font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{confirmError}</span>
            </div>
          )}

          {/* Ação ou Comprovante Auditável */}
          {isConfirmed ? (
            <div className="p-4 rounded-[20px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-2 text-[#065F46]">
              <div className="flex items-center gap-2 font-display font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                <span>
                  {justConfirmed
                    ? 'Recebimento confirmado com sucesso!'
                    : 'Recebimento já confirmado por você'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#047857]">
                Comprovante registrado no histórico auditável da campanha em{' '}
                <strong className="tabular-nums">
                  {formatDateTimePtBr(payout.confirmed_at)}
                </strong>
                .
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-[#047857] break-all">
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span>Recibo: {payout.id}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="ora-btn-primary w-full rounded-full py-3.5 px-6 text-sm sm:text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirmando recebimento...</span>
                </>
              ) : (
                <>
                  <BadgeCheck className="w-4 h-4" />
                  <span>Confirmar Recebimento deste Pagamento</span>
                </>
              )}
            </button>
          )}

          {/* Atalhos */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
            <Link
              href={getPartnerCheckoutPath(payout.partner_id)}
              className="ora-btn-secondary flex-1 rounded-full px-4 py-3 text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
              <span>Voltar ao Meu Checkout</span>
            </Link>

            {raffle && (
              <Link
                href={getRafflePublicPath(raffle)}
                target="_blank"
                rel="noreferrer"
                className="ora-btn-secondary rounded-full px-4 py-3 text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                <span>Ver Campanha</span>
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
