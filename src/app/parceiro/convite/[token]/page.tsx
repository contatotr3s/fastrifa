'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  acceptPartnerInvite,
  getPartnerInviteByToken,
} from '@/lib/firebase/partners';
import { getRaffleById } from '@/lib/firebase/raffles';
import {
  formatCommissionRuleLabel,
  isPartnerInviteUsable,
} from '@/lib/partner-finance';
import {
  getPartnerCheckoutPath,
  getRafflePublicPath,
} from '@/lib/raffle-urls';
import {
  formatBrazilMobile,
  formatCpf,
  getBrazilMobileError,
  isValidCpf,
  onlyDigits,
} from '@/lib/validators';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wallet,
} from 'lucide-react';
import type { PartnerInvite, Raffle } from '@/types/database.types';

const PARTNER_ACCESS_TOKENS_STORAGE_KEY = 'fastrifa_partner_access_tokens';

function getSavedPartnerAccessToken(raffleId: string): string | null {
  if (typeof window === 'undefined' || !raffleId) return null;
  try {
    const raw = localStorage.getItem(PARTNER_ACCESS_TOKENS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const token = parsed?.[raffleId];
    return typeof token === 'string' && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

function savePartnerAccessToken(raffleId: string, partnerId: string): void {
  if (typeof window === 'undefined' || !raffleId || !partnerId) return;
  try {
    const raw = localStorage.getItem(PARTNER_ACCESS_TOKENS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const next: Record<string, string> =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? { ...parsed }
        : {};
    next[raffleId] = partnerId;
    localStorage.setItem(
      PARTNER_ACCESS_TOKENS_STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch {}
}

function formatExpirationPtBr(expiresAtMs: number, expiresAtIso?: string): string {
  const date = Number.isFinite(expiresAtMs) && expiresAtMs > 0
    ? new Date(expiresAtMs)
    : expiresAtIso
      ? new Date(expiresAtIso)
      : null;

  if (!date || Number.isNaN(date.getTime())) return '24 horas';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface InviteFormErrors {
  fullName?: string;
  cpf?: string;
  phoneWhatsapp?: string;
}

export default function PartnerInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<PartnerInvite | null>(null);
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savedLocalPartnerToken, setSavedLocalPartnerToken] = useState<
    string | null
  >(null);

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [fieldErrors, setFieldErrors] = useState<InviteFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError(null);

      try {
        const foundInvite = await getPartnerInviteByToken(token);
        if (!active) return;

        if (!foundInvite) {
          setInvite(null);
          setLoading(false);
          return;
        }

        setInvite(foundInvite);
        setNowMs(Date.now());
        setSavedLocalPartnerToken(
          getSavedPartnerAccessToken(foundInvite.raffle_id)
        );

        if (foundInvite.prefill_name) {
          setFullName(foundInvite.prefill_name);
        }
        if (foundInvite.prefill_cpf) {
          setCpf(formatCpf(foundInvite.prefill_cpf));
        }
        if (foundInvite.prefill_phone) {
          setPhoneWhatsapp(formatBrazilMobile(foundInvite.prefill_phone));
        }

        const foundRaffle = await getRaffleById(foundInvite.raffle_id).catch(
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
        console.error('Erro ao carregar convite de parceiro:', err);
        if (active) {
          setLoadError(
            'Não foi possível carregar os dados deste convite. Tente novamente.'
          );
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
  }, [token]);

  const usability = useMemo(() => {
    if (!invite) return { usable: false as const, reason: undefined };
    return isPartnerInviteUsable(invite, nowMs);
  }, [invite, nowMs]);

  function validateForm(): boolean {
    const errors: InviteFormErrors = {};
    const trimmedName = fullName.trim();
    const cpfDigits = onlyDigits(cpf);

    if (trimmedName.length < 3) {
      errors.fullName =
        'Informe seu nome completo (mínimo de 3 caracteres).';
    }

    if (!cpfDigits) {
      errors.cpf = 'Informe seu CPF para identificação como parceiro.';
    } else if (cpfDigits.length < 11) {
      errors.cpf = 'O CPF deve conter 11 dígitos.';
    } else if (!isValidCpf(cpfDigits)) {
      errors.cpf = 'CPF inválido. Confira os números digitados.';
    }

    const phoneError = getBrazilMobileError(phoneWhatsapp);
    if (phoneError) {
      errors.phoneWhatsapp = phoneError;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invite || submitting) return;

    setSubmitError(null);

    const currentMs = Date.now();
    setNowMs(currentMs);
    const currentCheck = isPartnerInviteUsable(invite, currentMs);
    if (!currentCheck.usable) {
      setSavedLocalPartnerToken(getSavedPartnerAccessToken(invite.raffle_id));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await acceptPartnerInvite({
        inviteToken: token,
        fullName: fullName.trim(),
        cpf,
        phoneWhatsapp,
      });

      if (!result.success || !result.partner) {
        const latestInvite = await getPartnerInviteByToken(token).catch(
          () => null
        );
        if (latestInvite) {
          setInvite(latestInvite);
          setNowMs(Date.now());
          setSavedLocalPartnerToken(
            getSavedPartnerAccessToken(latestInvite.raffle_id)
          );
        }
        setSubmitError(
          result.error ||
            'Não foi possível ativar seu acesso de parceiro. Tente novamente.'
        );
        setSubmitting(false);
        return;
      }

      savePartnerAccessToken(invite.raffle_id, result.partner.id);
      router.replace(getPartnerCheckoutPath(result.partner.id));
    } catch (err) {
      console.error('Erro ao aceitar convite de parceiro:', err);
      setSubmitError(
        'Ocorreu um erro inesperado ao ativar seu convite. Tente novamente.'
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] ora-hero-stage flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[var(--ora-blue,#00A868)] animate-spin" />
      </div>
    );
  }

  if (loadError || !invite) {
    return (
      <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center p-4">
        <div className="ora-card rounded-[28px] p-7 sm:p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#0D1729]">
            {loadError ? 'Erro ao carregar convite' : 'Convite não encontrado'}
          </h1>
          <p className="text-sm text-[#475872] leading-relaxed">
            {loadError ||
              'Este link de convite é inválido ou não existe mais. Solicite um novo link ao organizador da campanha.'}
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

  const brandName = raffle?.brand_name || invite.brand_name || 'FastRifa Oficial';
  const raffleTitle = raffle?.title || invite.raffle_title;
  const commissionLabel = formatCommissionRuleLabel(
    invite.commission_type,
    invite.commission_value
  );
  const isVoluntary =
    invite.commission_type !== 'negotiable' && invite.commission_value === 0;

  if (!usability.usable) {
    const isUsed = usability.reason === 'used';
    const isRevoked = usability.reason === 'revoked';

    const statusTitle = isUsed
      ? 'Convite já utilizado'
      : isRevoked
        ? 'Convite cancelado'
        : 'Convite expirado (24h)';

    const statusDescription = isUsed
      ? 'Este link de convite era de uso único e já foi ativado anteriormente.'
      : isRevoked
        ? 'O organizador cancelou este convite antes da ativação.'
        : 'O prazo de 24 horas para aceitar este convite terminou.';

    return (
      <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center p-4">
        <main className="max-w-md w-full">
          <section className="ora-card rounded-[28px] p-6 sm:p-8 space-y-5 text-center">
            <div className="ora-glass-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#475872] mx-auto">
              {isUsed ? (
                <UserCheck className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
              ) : isRevoked ? (
                <Ban className="w-3.5 h-3.5 text-[#BE123C]" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[#B45309]" />
              )}
              <span>Convite Único • 24 horas</span>
            </div>

            <div className="space-y-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                  isUsed
                    ? 'bg-[#F5F9FF] border-[#D9E5F7] text-[var(--ora-blue,#00A868)]'
                    : isRevoked
                      ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                      : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                }`}
              >
                {isUsed ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isRevoked ? (
                  <Ban className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>

              <h1 className="font-display font-bold text-2xl text-[#0D1729]">
                {statusTitle}
              </h1>
              <p className="text-sm text-[#475872] leading-relaxed">
                {statusDescription}
              </p>
            </div>

            <div className="p-3.5 rounded-[18px] bg-[#F5F9FF] border border-[#D9E5F7] text-left space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                {brandName}
              </span>
              <p className="font-display font-bold text-sm text-[#0D1729] truncate">
                {raffleTitle}
              </p>
            </div>

            {isUsed && savedLocalPartnerToken ? (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-[16px] bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] font-medium">
                  Encontramos seu acesso salvo neste aparelho para esta campanha!
                </div>
                <Link
                  href={getPartnerCheckoutPath(savedLocalPartnerToken)}
                  className="ora-btn-primary w-full rounded-full py-3.5 px-5 text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <span>Abrir Meu Checkout de Parceiro</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="p-3.5 rounded-[16px] bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
                Solicite ao organizador da campanha o envio de um{' '}
                <strong>novo link de convite</strong> (ou o reenvio do seu link pessoal de checkout, caso já tenha concluído o cadastro).
              </div>
            )}

            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              {raffle && (
                <Link
                  href={getRafflePublicPath(raffle)}
                  className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                  <span>Ver Campanha</span>
                </Link>
              )}
              <Link
                href="/"
                className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Início</span>
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center px-4 py-8 sm:py-12">
      <main className="w-full max-w-[480px] space-y-5">
        {/* Selo Superior */}
        <div className="text-center space-y-3">
          <div className="ora-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--ora-blue,#00A868)]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Convite Oficial de Parceiro • Uso Único (24h)</span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.04em] text-[#0D1729]">
            Ative seu Checkout de Parceiro
          </h1>
          <p className="text-sm text-[#475872] leading-relaxed">
            Preencha seus dados uma única vez para liberar seu link exclusivo de vendas desta campanha.
          </p>
        </div>

        {/* Card Principal */}
        <section className="ora-card rounded-[28px] p-5 sm:p-7 space-y-5">
          {/* Resumo da Campanha + Regra de Comissão */}
          <div className="p-3.5 sm:p-4 rounded-[20px] bg-[#F5F9FF] border border-[#D9E5F7] space-y-3">
            <div className="flex items-center gap-3">
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
                {raffle && (
                  <span className="text-[11px] font-semibold text-[#475872] tabular-nums block">
                    {raffle.total_tickets} cotas • R${' '}
                    {Number(raffle.ticket_price || 0).toFixed(2)} por cota
                  </span>
                )}
              </div>

              {raffle && (
                <Link
                  href={getRafflePublicPath(raffle)}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir página pública da campanha"
                  className="ora-btn-secondary rounded-full p-2 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                </Link>
              )}
            </div>

            <div className="pt-2.5 border-t border-[#E0E9F7] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#475872]">
                <Wallet className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                <span>Comissão combinada:</span>
              </span>
              <span className="ora-glass-pill px-2.5 py-1 rounded-full font-display font-bold text-[#0D1729] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--ora-blue,#00A868)]" />
                <span>
                  {isVoluntary
                    ? `Ajuda voluntária (${commissionLabel})`
                    : commissionLabel}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-[#526480]">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  Válido até {formatExpirationPtBr(invite.expires_at_ms, invite.expires_at)}
                </span>
              </span>
              <span className="font-semibold text-[var(--ora-blue,#00A868)]">
                PIX direto p/ organizador
              </span>
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="p-3.5 rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs sm:text-sm font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Nome completo */}
            <div>
              <label
                htmlFor="partnerFullName"
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              >
                Nome completo
              </label>
              <input
                id="partnerFullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                  if (submitError) setSubmitError(null);
                }}
                placeholder="Ex: João da Silva"
                className={`w-full px-4 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] transition focus:outline-none ${
                  fieldErrors.fullName
                    ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                    : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label
                htmlFor="partnerCpf"
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              >
                CPF
              </label>
              <input
                id="partnerCpf"
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatCpf(e.target.value));
                  if (fieldErrors.cpf) {
                    setFieldErrors((prev) => ({ ...prev, cpf: undefined }));
                  }
                  if (submitError) setSubmitError(null);
                }}
                placeholder="000.000.000-00"
                className={`w-full px-4 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] tabular-nums transition focus:outline-none ${
                  fieldErrors.cpf
                    ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                    : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                }`}
              />
              {fieldErrors.cpf && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.cpf}</span>
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label
                htmlFor="partnerWhatsapp"
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              >
                WhatsApp com DDD
              </label>
              <input
                id="partnerWhatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneWhatsapp}
                onChange={(e) => {
                  setPhoneWhatsapp(formatBrazilMobile(e.target.value));
                  if (fieldErrors.phoneWhatsapp) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      phoneWhatsapp: undefined,
                    }));
                  }
                  if (submitError) setSubmitError(null);
                }}
                placeholder="(11) 99999-9999"
                className={`w-full px-4 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] tabular-nums transition focus:outline-none ${
                  fieldErrors.phoneWhatsapp
                    ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                    : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                }`}
              />
              {fieldErrors.phoneWhatsapp && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.phoneWhatsapp}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="ora-btn-primary w-full rounded-full py-3.5 px-6 text-sm sm:text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ativando seu checkout...</span>
                </>
              ) : (
                <>
                  <span>Aceitar Convite e Abrir Meu Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-[#526480] leading-relaxed">
            Ao aceitar, este link único será encerrado e você será direcionado ao seu link pessoal de vendas nesta campanha.
          </p>
        </section>
      </main>
    </div>
  );
}
