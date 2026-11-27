'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Handshake,
  Home,
  Link2,
  Loader2,
  LogOut,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import {
  getRaffleById,
  getRaffleOrders,
  subscribeToRaffle,
  subscribeToRaffleOrders,
} from '@/lib/firebase/raffles';
import {
  createPartnerInvite,
  createPartnerPayout,
  getOrganizerPartnerInvites,
  getOrganizerPartnerPayouts,
  getOrganizerPartners,
  revokePartnerInvite,
  updateRafflePartnerStatus,
} from '@/lib/firebase/partners';
import {
  collectReusableCatalogPartners,
  computePartnerStats,
  formatCommissionRuleLabel,
  isPartnerInviteUsable,
  maskCpfDisplay,
} from '@/lib/partner-finance';
import {
  getOrganizerDirectCheckoutPath,
  getPartnerCheckoutPath,
  getPartnerInvitePath,
  getPartnerPayoutConfirmPath,
  getRaffleAdminPath,
  getShareOrigin,
} from '@/lib/raffle-urls';
import { formatBrazilMobile, onlyDigits } from '@/lib/validators';
import type {
  Order,
  PartnerCommissionType,
  PartnerInvite,
  PartnerPayout,
  Raffle,
  RafflePartner,
} from '@/types/database.types';

interface InvitePrefill {
  name?: string;
  cpf?: string;
  phone?: string;
  sourcePartnerId?: string;
}

function formatCurrencyBrl(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `R$ ${safe.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTimePtBr(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRemainingTime(expiresAtMs: number): string {
  const diffMs = Math.max(0, expiresAtMs - Date.now());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${Math.max(1, minutes)}min`;
  }
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function buildInviteWhatsAppUrl(
  raffle: Raffle,
  invite: PartnerInvite,
  inviteUrl: string,
  phone?: string | null
): string {
  const ruleLabel = formatCommissionRuleLabel(
    invite.commission_type,
    invite.commission_value
  );
  const brand = raffle.brand_name?.trim() || 'FastRifa';
  const greeting = invite.prefill_name
    ? `Olá ${invite.prefill_name.split(' ')[0]}!`
    : 'Olá!';
  const message = `${greeting} Você recebeu um convite oficial para atuar como parceiro(a) de vendas da campanha *"${raffle.title}"* (${brand}).

📋 Regra de comissão: *${ruleLabel}*
⏳ Link de uso único válido por *24 horas*:
${inviteUrl}

Ao abrir, confirme seu nome completo, CPF e WhatsApp para receber seu link exclusivo de checkout.`;

  const digits = onlyDigits(phone || '');
  if (digits.length >= 10) {
    return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function buildPayoutConfirmWhatsAppUrl(
  raffle: Raffle,
  payout: PartnerPayout,
  confirmUrl: string,
  partnerPhone?: string | null
): string {
  const message = `Olá ${payout.partner_name.split(' ')[0]}! Informamos um pagamento de comissão referente à campanha *"${raffle.title}"*.

💰 Valor informado: *${formatCurrencyBrl(payout.amount)}*${
    payout.note ? `\n📝 Observação: ${payout.note}` : ''
  }

Clique no link abaixo para confirmar o recebimento no seu histórico:
${confirmUrl}`;

  const digits = onlyDigits(partnerPhone || '');
  if (digits.length >= 10) {
    return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export default function RafflePartnersAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<RafflePartner[]>([]);
  const [invites, setInvites] = useState<PartnerInvite[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedbacks rápidos
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Modal de Convite (Link 24h)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePrefill, setInvitePrefill] = useState<InvitePrefill | null>(null);
  const [commissionType, setCommissionType] =
    useState<PartnerCommissionType>('negotiable');
  const [commissionValueInput, setCommissionValueInput] = useState<string>('0');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<PartnerInvite | null>(null);

  // Modal de Informar Pagamento (Payout)
  const [payoutPartner, setPayoutPartner] = useState<RafflePartner | null>(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState<string>('0.00');
  const [payoutNote, setPayoutNote] = useState<string>('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [createdPayout, setCreatedPayout] = useState<PartnerPayout | null>(null);

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  const organizerId = useMemo(
    () => raffle?.user_id || user?.uid || '',
    [raffle?.user_id, user?.uid]
  );

  const refreshPartnerData = useCallback(async (targetOrganizerId: string) => {
    if (!targetOrganizerId) return;
    const [nextPartners, nextInvites, nextPayouts] = await Promise.all([
      getOrganizerPartners(targetOrganizerId),
      getOrganizerPartnerInvites(targetOrganizerId),
      getOrganizerPartnerPayouts(targetOrganizerId),
    ]);
    setPartners(nextPartners);
    setInvites(nextInvites);
    setPayouts(nextPayouts);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!user || !id) return;

    let active = true;
    setLoading(true);
    setError(null);

    getRaffleById(id)
      .then(async (raffleData) => {
        if (!active) return;
        if (!raffleData) {
          setError('Campanha não encontrada.');
          return;
        }
        if (raffleData.user_id !== user.uid && !isMaster) {
          setError('Você não tem permissão para gerenciar os parceiros desta campanha.');
          return;
        }

        setRaffle(raffleData);
        const targetOrganizerId = raffleData.user_id || user.uid;

        const [ordersData, partnersData, invitesData, payoutsData] =
          await Promise.all([
            getRaffleOrders(raffleData.id),
            getOrganizerPartners(targetOrganizerId),
            getOrganizerPartnerInvites(targetOrganizerId),
            getOrganizerPartnerPayouts(targetOrganizerId),
          ]);

        if (!active) return;
        setOrders(ordersData);
        setPartners(partnersData);
        setInvites(invitesData);
        setPayouts(payoutsData);
      })
      .catch((err) => {
        console.error('Erro ao carregar gestão de parceiros:', err);
        if (active) {
          setError('Não foi possível carregar os dados dos parceiros desta campanha.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, user, id, isMaster, router]);

  useEffect(() => {
    if (!raffle?.id) return;
    const unsubRaffle = subscribeToRaffle(raffle.id, (liveRaffle) => {
      if (liveRaffle) setRaffle(liveRaffle);
    });
    const unsubOrders = subscribeToRaffleOrders(raffle.id, (liveOrders) => {
      setOrders(liveOrders);
    });
    return () => {
      unsubRaffle();
      unsubOrders();
    };
  }, [raffle?.id]);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  function handleCopyText(key: string, value: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2200);
    }
  }

  function showTemporaryFeedback(msg: string) {
    setFeedbackBanner(msg);
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  function openNewInviteModal(prefill: InvitePrefill | null = null) {
    setInvitePrefill(prefill);
    setCommissionType('negotiable');
    setCommissionValueInput('0');
    setInviteError(null);
    setGeneratedInvite(null);
    setShowInviteModal(true);
  }

  async function handleGenerateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle || !organizerId) return;

    setInviteError(null);
    let parsedValue = 0;

    if (commissionType !== 'negotiable') {
      const normalizedInput = commissionValueInput.replace(',', '.').trim();
      parsedValue = normalizedInput === '' ? 0 : Number(normalizedInput);
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        setInviteError('Informe um valor válido maior ou igual a 0.');
        return;
      }
      if (commissionType === 'percent' && parsedValue > 100) {
        setInviteError('O percentual de comissão deve estar entre 0% e 100%.');
        return;
      }
    }

    setInviteSubmitting(true);
    try {
      const invite = await createPartnerInvite({
        raffle,
        organizerId,
        commissionType,
        commissionValue: parsedValue,
        prefill: invitePrefill || undefined,
        revokeExistingCpfInRaffle: true,
      });
      setGeneratedInvite(invite);
      await refreshPartnerData(organizerId);
    } catch (err) {
      setInviteError(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o link de convite. Tente novamente.'
      );
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleRevokeInvite(invite: PartnerInvite) {
    if (!confirm('Deseja cancelar este convite de 24 horas?')) return;
    setActionLoadingId(invite.id);
    try {
      await revokePartnerInvite(invite.id);
      await refreshPartnerData(organizerId);
      showTemporaryFeedback('Convite revogado com sucesso.');
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Não foi possível revogar este convite.'
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handlePartnerStatusChange(
    partner: RafflePartner,
    nextStatus: 'active' | 'paused' | 'revoked'
  ) {
    if (
      nextStatus === 'revoked' &&
      !confirm(
        `Tem certeza que deseja revogar o acesso de ${partner.full_name} nesta campanha?\n\nAs vendas já realizadas permanecem registradas no histórico, mas o link dele deixará de aceitar novas reservas.`
      )
    ) {
      return;
    }

    setActionLoadingId(partner.id);
    try {
      await updateRafflePartnerStatus(partner.id, nextStatus);
      await refreshPartnerData(organizerId);
      showTemporaryFeedback(
        nextStatus === 'paused'
          ? `Parceiro ${partner.full_name} pausado.`
          : nextStatus === 'active'
          ? `Parceiro ${partner.full_name} reativado.`
          : `Acesso de ${partner.full_name} revogado.`
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar o status do parceiro.'
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  function openPayoutModal(partner: RafflePartner, balanceToSettle: number) {
    setPayoutPartner(partner);
    setPayoutAmountInput(
      balanceToSettle > 0 ? balanceToSettle.toFixed(2) : '0.00'
    );
    setPayoutNote('');
    setPayoutError(null);
    setCreatedPayout(null);
  }

  async function handleCreatePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle || !payoutPartner || !organizerId) return;

    const normalizedAmount = payoutAmountInput.replace(',', '.').trim();
    const parsedAmount = normalizedAmount === '' ? 0 : Number(normalizedAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setPayoutError('Informe um valor válido maior ou igual a R$ 0,00.');
      return;
    }

    setPayoutError(null);
    setPayoutSubmitting(true);
    try {
      const payout = await createPartnerPayout({
        raffle,
        organizerId,
        partner: payoutPartner,
        amount: parsedAmount,
        note: payoutNote,
      });
      setCreatedPayout(payout);
      await refreshPartnerData(organizerId);
    } catch (err) {
      setPayoutError(
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar o pagamento.'
      );
    } finally {
      setPayoutSubmitting(false);
    }
  }

  const shareOrigin = getShareOrigin();

  const currentRafflePartners = useMemo(() => {
    if (!raffle) return [];
    return partners.filter((p) => p.raffle_id === raffle.id);
  }, [partners, raffle]);

  const rafflePayouts = useMemo(() => {
    if (!raffle) return [];
    return payouts.filter((p) => p.raffle_id === raffle.id);
  }, [payouts, raffle]);

  const pendingInvites = useMemo(() => {
    if (!raffle) return [];
    return invites.filter(
      (i) => i.raffle_id === raffle.id && isPartnerInviteUsable(i).usable
    );
  }, [invites, raffle]);

  const reusablePartners = useMemo(() => {
    if (!raffle) return [];
    return collectReusableCatalogPartners(partners, raffle.id);
  }, [partners, raffle]);

  const partnerPhoneById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of partners) {
      map.set(p.id, p.phone_whatsapp);
    }
    return map;
  }, [partners]);

  const partnerStatsById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computePartnerStats>>();
    for (const p of currentRafflePartners) {
      map.set(p.id, computePartnerStats(p, orders, rafflePayouts));
    }
    return map;
  }, [currentRafflePartners, orders, rafflePayouts]);

  const networkSummary = useMemo(() => {
    const activePartnersCount = currentRafflePartners.filter(
      (p) => p.status === 'active'
    ).length;

    let partnerPaidTickets = 0;
    let partnerPendingTickets = 0;
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const isPartnerOrder =
        order.sale_channel === 'partner' || Boolean(order.partner_id);
      if (!isPartnerOrder) continue;
      const qty = Array.isArray(order.ticket_numbers)
        ? order.ticket_numbers.length
        : 0;
      if (order.status === 'paid') partnerPaidTickets += qty;
      if (order.status === 'pending') partnerPendingTickets += qty;
    }

    let confirmedCommissionTotal = 0;
    let pendingCommissionTotal = 0;
    for (const stats of partnerStatsById.values()) {
      confirmedCommissionTotal += stats.confirmedCommission;
      pendingCommissionTotal += stats.pendingCommission;
    }

    let settledTotal = 0;
    let confirmedPayoutsTotal = 0;
    let confirmedPayoutsCount = 0;
    for (const payout of rafflePayouts) {
      const amount = Number.isFinite(payout.amount) ? Math.max(0, payout.amount) : 0;
      settledTotal += amount;
      if (payout.status === 'confirmed') {
        confirmedPayoutsTotal += amount;
        confirmedPayoutsCount += 1;
      }
    }

    return {
      activePartnersCount,
      totalRegisteredCount: currentRafflePartners.length,
      totalPartnerTickets: partnerPaidTickets + partnerPendingTickets,
      partnerPaidTickets,
      partnerPendingTickets,
      confirmedCommissionTotal,
      pendingCommissionTotal,
      settledTotal,
      confirmedPayoutsTotal,
      confirmedPayoutsCount,
      totalPayoutsCount: rafflePayouts.length,
    };
  }, [currentRafflePartners, orders, partnerStatsById, rafflePayouts]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="ora-card rounded-[28px] p-10 text-center space-y-4 max-w-md mx-auto">
        <div className="text-[#BE123C] font-display font-bold text-lg">
          {error || 'Campanha não encontrada.'}
        </div>
        <Link
          href="/admin"
          className="ora-btn-secondary rounded-full px-5 py-2.5 inline-flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </Link>
      </div>
    );
  }

  const generatedInviteUrl = generatedInvite
    ? `${shareOrigin}${getPartnerInvitePath(generatedInvite.id)}`
    : '';
  const createdPayoutConfirmUrl = createdPayout
    ? `${shareOrigin}${getPartnerPayoutConfirmPath(createdPayout.id)}`
    : '';

  return (
    <div className="space-y-7">
      {/* Integrated Hero Header Box */}
      <section className="ora-card rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={getRaffleAdminPath(raffle)}
                className="ora-glass-pill rounded-full px-3 py-1 text-xs font-bold text-[#14213A] hover:border-[#0869F5] inline-flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>Voltar para a Rifa</span>
              </Link>

              <span className="ora-glass-pill rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0869F5] inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Rede de Vendas & Comissões</span>
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em] leading-tight">
              Checkout para Parceiros
            </h1>

            <p className="text-xs sm:text-sm text-[#475872]">
              Campanha: <strong className="text-[#0D1729]">{raffle.title}</strong> •{' '}
              <span className="tabular-nums font-semibold">
                {raffle.total_tickets} cotas
              </span>{' '}
              • Valor da cota:{' '}
              <span className="tabular-nums font-semibold">
                {formatCurrencyBrl(Number(raffle.ticket_price))}
              </span>
            </p>
          </div>

          {/* Navegação no canto superior direito: Voltar p/ Rifa, Home e Sair */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={getRaffleAdminPath(raffle)}
              title="Voltar para o gerenciamento da rifa"
              aria-label="Voltar para o gerenciamento da rifa"
              className="ora-btn-secondary w-9 h-9 sm:w-10 sm:h-10 rounded-full inline-flex items-center justify-center text-[#14213A] hover:text-[#0869F5] transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              title="Ir para a página inicial"
              aria-label="Ir para a página inicial"
              className="ora-btn-secondary w-9 h-9 sm:w-10 sm:h-10 rounded-full inline-flex items-center justify-center text-[#14213A] hover:text-[#0869F5] transition shrink-0"
            >
              <Home className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
              className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center text-[#475872] hover:text-[#BE123C] bg-[#F8FBFF] hover:bg-[#FFF1F2] border border-[#D9E5F7] hover:border-[#FECDD3] rounded-full transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Ações Principais (2 botões exigidos no topo) */}
        <div className="pt-4 border-t border-[#E0E9F7] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openNewInviteModal(null)}
              className="ora-btn-primary rounded-full px-5 py-2.5 text-xs sm:text-[13px] font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Parceiro (Link 24h)</span>
            </button>

            <Link
              href={getOrganizerDirectCheckoutPath(raffle)}
              target="_blank"
              className="ora-btn-secondary rounded-full px-5 py-2.5 text-xs sm:text-[13px] font-bold inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-[#0869F5]" />
              <span>Abrir Meu Checkout Direto</span>
            </Link>
          </div>

          <span className="text-[11px] font-medium text-[#526480] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A868]" />
            <span>100% dos PIX caem direto na sua chave cadastrada</span>
          </span>
        </div>
      </section>

      {feedbackBanner && (
        <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold rounded-[18px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Campaign Network Summary Strip (4 compact KPI cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="ora-card rounded-[24px] p-5 space-y-1">
          <div className="text-[#475872] text-[11px] font-bold uppercase tracking-wider">
            Parceiros Ativos
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#0869F5]">
            {networkSummary.activePartnersCount}
          </div>
          <div className="text-[11px] text-[#526480]">
            {networkSummary.totalRegisteredCount} vinculado(s) nesta rifa
          </div>
        </div>

        <div className="ora-card rounded-[24px] p-5 space-y-1">
          <div className="text-[#475872] text-[11px] font-bold uppercase tracking-wider">
            Cotas via Parceiros
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729]">
            {networkSummary.totalPartnerTickets}
          </div>
          <div className="text-[11px] text-[#526480]">
            {networkSummary.partnerPaidTickets} pagas •{' '}
            {networkSummary.partnerPendingTickets} pendentes
          </div>
        </div>

        <div className="ora-card rounded-[24px] p-5 space-y-1">
          <div className="text-[#475872] text-[11px] font-bold uppercase tracking-wider">
            Comissões da Campanha
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729]">
            {formatCurrencyBrl(networkSummary.confirmedCommissionTotal)}
          </div>
          <div className="text-[11px] text-[#9A6700] font-semibold">
            + {formatCurrencyBrl(networkSummary.pendingCommissionTotal)} em reservas abertas
          </div>
        </div>

        <div className="ora-card rounded-[24px] p-5 space-y-1">
          <div className="text-[#475872] text-[11px] font-bold uppercase tracking-wider">
            Acertado / Confirmado
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#00A868]">
            {formatCurrencyBrl(networkSummary.settledTotal)}
          </div>
          <div className="text-[11px] text-[#526480]">
            {networkSummary.confirmedPayoutsCount}/{networkSummary.totalPayoutsCount} confirmado(s) •{' '}
            {formatCurrencyBrl(networkSummary.confirmedPayoutsTotal)}
          </div>
        </div>
      </div>

      {/* Section 1 — Parceiros Habilitados nesta Campanha */}
      <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-[#0D1729] tracking-[-0.03em]">
              Parceiros Habilitados nesta Campanha
            </h2>
            <p className="text-xs text-[#526480] mt-0.5">
              Cada parceiro tem um link exclusivo de checkout e enxerga somente as próprias vendas e comissões.
            </p>
          </div>
          <span className="ora-glass-pill rounded-full px-3 py-1 text-xs font-bold text-[#14213A] self-start sm:self-auto">
            {currentRafflePartners.length} parceiro(s)
          </span>
        </div>

        {currentRafflePartners.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#CDE0FC] bg-[#F8FBFF] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm text-[#475872] max-w-lg mx-auto leading-relaxed">
              Esta campanha começa zerada. Envie um link único de 24h para cadastrar um parceiro ou habilite alguém de suas campanhas anteriores abaixo.
            </p>
            <button
              type="button"
              onClick={() => openNewInviteModal(null)}
              className="ora-btn-primary rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Convite de 24h</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentRafflePartners.map((partner) => {
              const stats = partnerStatsById.get(partner.id);
              const partnerCheckoutUrl = `${shareOrigin}${getPartnerCheckoutPath(
                partner.id
              )}`;
              const isBusy = actionLoadingId === partner.id;
              const isCopied = copiedKey === `partner-link-${partner.id}`;

              return (
                <div
                  key={partner.id}
                  className="p-5 rounded-[22px] bg-white border border-[#E0E9F7] hover:border-[#B9D3F8] transition space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-[#0D1729]">
                          {partner.full_name}
                        </h3>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                            partner.status === 'active'
                              ? 'bg-[#E8F7F0] border-[#B9E7D2] text-[#00A868]'
                              : partner.status === 'paused'
                              ? 'bg-[#FFF8EB] border-[#F5D08A] text-[#9A6700]'
                              : 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                          }`}
                        >
                          {partner.status === 'active'
                            ? 'Ativo'
                            : partner.status === 'paused'
                            ? 'Pausado'
                            : 'Revogado'}
                        </span>

                        <span className="ora-glass-pill rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#0869F5]">
                          {formatCommissionRuleLabel(
                            partner.commission_type,
                            partner.commission_value
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#526480] tabular-nums">
                        <span>CPF: {maskCpfDisplay(partner.cpf)}</span>
                        <span>•</span>
                        <span>
                          WhatsApp:{' '}
                          {formatBrazilMobile(partner.phone_whatsapp) ||
                            partner.phone_whatsapp}
                        </span>
                      </div>
                    </div>

                    {/* Ações do Parceiro */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `partner-link-${partner.id}`,
                            partnerCheckoutUrl
                          )
                        }
                        className="ora-btn-secondary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-[#00A868]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#0869F5]" />
                        )}
                        <span>
                          {isCopied ? 'Link Copiado!' : 'Copiar Link de Vendas'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openPayoutModal(partner, stats?.balanceToSettle ?? 0)
                        }
                        className="ora-btn-primary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Informar Pagamento</span>
                      </button>

                      {partner.status !== 'revoked' && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handlePartnerStatusChange(
                                partner,
                                partner.status === 'active' ? 'paused' : 'active'
                              )
                            }
                            className="ora-btn-secondary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : partner.status === 'active' ? (
                              <PauseCircle className="w-3.5 h-3.5 text-[#9A6700]" />
                            ) : (
                              <PlayCircle className="w-3.5 h-3.5 text-[#00A868]" />
                            )}
                            <span>
                              {partner.status === 'active' ? 'Pausar' : 'Reativar'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handlePartnerStatusChange(partner, 'revoked')
                            }
                            className="px-3.5 py-2 rounded-full bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Revogar Acesso</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Métricas do Parceiro */}
                  {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E0E9F7] text-xs tabular-nums">
                      <div className="p-3 rounded-[16px] bg-[#F8FBFF] border border-[#E0E9F7]">
                        <span className="text-[11px] font-semibold text-[#526480] block">
                          Vendas Pagas
                        </span>
                        <strong className="text-sm font-display font-bold text-[#0D1729]">
                          {stats.paidTicketsCount} cota(s)
                        </strong>
                        <span className="text-[11px] text-[#0869F5] font-semibold block">
                          {formatCurrencyBrl(stats.paidRevenue)}
                        </span>
                      </div>

                      <div className="p-3 rounded-[16px] bg-[#F8FBFF] border border-[#E0E9F7]">
                        <span className="text-[11px] font-semibold text-[#526480] block">
                          Aguardando PIX
                        </span>
                        <strong className="text-sm font-display font-bold text-[#9A6700]">
                          {stats.pendingTicketsCount} cota(s)
                        </strong>
                        <span className="text-[11px] text-[#9A6700] font-semibold block">
                          {formatCurrencyBrl(stats.pendingRevenue)}
                        </span>
                      </div>

                      <div className="p-3 rounded-[16px] bg-[#F8FBFF] border border-[#E0E9F7]">
                        <span className="text-[11px] font-semibold text-[#526480] block">
                          Comissão (Paga / Pend.)
                        </span>
                        <strong className="text-sm font-display font-bold text-[#0D1729]">
                          {partner.commission_type === 'negotiable'
                            ? 'A combinar'
                            : formatCurrencyBrl(stats.confirmedCommission)}
                        </strong>
                        <span className="text-[11px] text-[#526480] block">
                          {partner.commission_type === 'negotiable'
                            ? stats.hasUnsettledNegotiableSales
                              ? 'Vendas pagas aguardando acerto'
                              : 'Acordo livre'
                            : `Pendente: ${formatCurrencyBrl(stats.pendingCommission)}`}
                        </span>
                      </div>

                      <div className="p-3 rounded-[16px] bg-[#F8FBFF] border border-[#E0E9F7]">
                        <span className="text-[11px] font-semibold text-[#526480] block">
                          Acertado / Confirmado
                        </span>
                        <strong className="text-sm font-display font-bold text-[#00A868]">
                          {formatCurrencyBrl(stats.settledAmount)}
                        </strong>
                        <span className="text-[11px] text-[#526480] block">
                          Confirmado pelo parceiro:{' '}
                          {formatCurrencyBrl(stats.confirmedPayoutAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2 — Pagamentos e Confirmações Enviadas */}
      <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-[#0D1729] tracking-[-0.03em]">
              Pagamentos e Confirmações Enviadas
            </h2>
            <p className="text-xs text-[#526480] mt-0.5">
              Envie o link de confirmação para o parceiro registrar o recebimento da comissão no histórico.
            </p>
          </div>
          <span className="ora-glass-pill rounded-full px-3 py-1 text-xs font-bold text-[#14213A] self-start sm:self-auto">
            {rafflePayouts.length} acerto(s)
          </span>
        </div>

        {rafflePayouts.length === 0 ? (
          <div className="rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7] p-6 text-center text-xs text-[#526480]">
            Nenhum pagamento de comissão informado nesta campanha ainda. Use{' '}
            <strong>Informar Pagamento</strong> no card do parceiro acima quando realizar um repasse.
          </div>
        ) : (
          <div className="space-y-3">
            {rafflePayouts.map((payout) => {
              const confirmUrl = `${shareOrigin}${getPartnerPayoutConfirmPath(
                payout.id
              )}`;
              const isPending = payout.status === 'pending_confirmation';
              const isCopied = copiedKey === `payout-link-${payout.id}`;
              const partnerPhone = partnerPhoneById.get(payout.partner_id);

              return (
                <div
                  key={payout.id}
                  className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E0E9F7] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-display font-bold text-base text-[#0D1729]">
                        {payout.partner_name}
                      </strong>
                      <span className="font-display font-bold text-sm text-[#0869F5] tabular-nums">
                        {formatCurrencyBrl(payout.amount)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                          isPending
                            ? 'bg-[#FFF8EB] border-[#F5D08A] text-[#9A6700]'
                            : 'bg-[#E8F7F0] border-[#B9E7D2] text-[#00A868]'
                        }`}
                      >
                        {isPending ? (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Aguardando parceiro confirmar</span>
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="w-3.5 h-3.5" />
                            <span>Recebimento confirmado ✓</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#526480]">
                      <span>Enviado em {formatDateTimePtBr(payout.created_at)}</span>
                      {!isPending && payout.confirmed_at && (
                        <>
                          <span>•</span>
                          <span className="text-[#00A868] font-semibold">
                            Confirmado em {formatDateTimePtBr(payout.confirmed_at)}
                          </span>
                        </>
                      )}
                      {payout.note && (
                        <>
                          <span>•</span>
                          <span className="text-[#14213A]">{payout.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(`payout-link-${payout.id}`, confirmUrl)
                        }
                        className="ora-btn-secondary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-[#00A868]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#0869F5]" />
                        )}
                        <span>
                          {isCopied
                            ? 'Link Copiado!'
                            : 'Copiar Link de Confirmação'}
                        </span>
                      </button>

                      <a
                        href={buildPayoutConfirmWhatsAppUrl(
                          raffle,
                          payout,
                          confirmUrl,
                          partnerPhone
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Enviar WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3 — Convites Pendentes (Uso Único · 24h) */}
      <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-[#0D1729] tracking-[-0.03em]">
              Convites Pendentes (Uso Único · 24h)
            </h2>
            <p className="text-xs text-[#526480] mt-0.5">
              Links ainda não aceitos. Cada link expira automaticamente após 24 horas ou no 1º cadastro concluído.
            </p>
          </div>
          <span className="ora-glass-pill rounded-full px-3 py-1 text-xs font-bold text-[#14213A] self-start sm:self-auto">
            {pendingInvites.length} pendente(s)
          </span>
        </div>

        {pendingInvites.length === 0 ? (
          <div className="rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7] p-6 text-center text-xs text-[#526480]">
            Nenhum convite pendente no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvites.map((invite) => {
              const inviteUrl = `${shareOrigin}${getPartnerInvitePath(
                invite.id
              )}`;
              const isCopied = copiedKey === `invite-link-${invite.id}`;
              const isBusy = actionLoadingId === invite.id;

              return (
                <div
                  key={invite.id}
                  className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E0E9F7] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ora-glass-pill rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#0869F5]">
                        {formatCommissionRuleLabel(
                          invite.commission_type,
                          invite.commission_value
                        )}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] text-[11px] font-bold inline-flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>Expira em {formatRemainingTime(invite.expires_at_ms)}</span>
                      </span>
                      {invite.prefill_name && (
                        <span className="text-xs font-bold text-[#0D1729]">
                          Para: {invite.prefill_name}
                          {invite.prefill_cpf
                            ? ` (${maskCpfDisplay(invite.prefill_cpf)})`
                            : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#526480] truncate">
                      {inviteUrl}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(`invite-link-${invite.id}`, inviteUrl)
                      }
                      className="ora-btn-secondary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-[#00A868]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#0869F5]" />
                      )}
                      <span>{isCopied ? 'Copiado!' : 'Copiar Link'}</span>
                    </button>

                    <a
                      href={buildInviteWhatsAppUrl(
                        raffle,
                        invite,
                        inviteUrl,
                        invite.prefill_phone
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRevokeInvite(invite)}
                      className="px-3.5 py-2 rounded-full bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Revogar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 4 — Parceiros de Outras Campanhas suas */}
      <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-[#0D1729] tracking-[-0.03em]">
              Parceiros de Outras Campanhas suas
            </h2>
            <p className="text-xs text-[#526480] mt-0.5">
              Reabilite rapidamente quem já vendeu com você em outras rifas enviando um novo link único de 24 horas.
            </p>
          </div>
          <span className="ora-glass-pill rounded-full px-3 py-1 text-xs font-bold text-[#14213A] self-start sm:self-auto">
            {reusablePartners.length} disponível(is)
          </span>
        </div>

        {reusablePartners.length === 0 ? (
          <div className="rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7] p-6 text-center text-xs text-[#526480]">
            Nenhum parceiro de campanhas anteriores disponível para habilitar nesta rifa no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {reusablePartners.map((prevPartner) => (
              <div
                key={prevPartner.id}
                className="p-4 rounded-[20px] bg-white border border-[#E0E9F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-display font-bold text-sm text-[#0D1729]">
                      {prevPartner.full_name}
                    </strong>
                    <span className="ora-glass-pill rounded-full px-2 py-0.5 text-[10px] font-bold text-[#526480]">
                      Última regra:{' '}
                      {formatCommissionRuleLabel(
                        prevPartner.commission_type,
                        prevPartner.commission_value
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-[#526480] tabular-nums">
                    CPF: {maskCpfDisplay(prevPartner.cpf)} •{' '}
                    {formatBrazilMobile(prevPartner.phone_whatsapp) ||
                      prevPartner.phone_whatsapp}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openNewInviteModal({
                      name: prevPartner.full_name,
                      cpf: prevPartner.cpf,
                      phone: prevPartner.phone_whatsapp,
                      sourcePartnerId: prevPartner.id,
                    })
                  }
                  className="ora-btn-secondary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hover:border-[#0869F5]"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span>Gerar Link p/ Habilitar (24h)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL 1: Cadastrar Novo Parceiro / Habilitar via Link 24h */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/60 backdrop-blur-sm">
          <div className="ora-card rounded-[24px] sm:rounded-[28px] max-w-lg w-full p-5 sm:p-7 space-y-5 relative max-h-[92vh] overflow-y-auto bg-white">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              aria-label="Fechar modal de convite"
              className="absolute right-4 top-4 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F5F9FF] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <span className="ora-glass-pill rounded-full px-3 py-1 text-[11px] font-bold text-[#0869F5] inline-flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Convite Único · Validade 24 horas</span>
              </span>
              <h3 className="font-display font-bold text-xl text-[#0D1729] pt-1">
                {invitePrefill?.name
                  ? 'Habilitar Parceiro nesta Campanha'
                  : 'Cadastrar Novo Parceiro (Link 24h)'}
              </h3>
              <p className="text-xs text-[#526480]">
                Defina a regra de comissão antes de gerar o link. O parceiro confirmará os dados pessoais ao aceitar.
              </p>
            </div>

            {invitePrefill?.name && (
              <div className="p-3.5 rounded-[16px] bg-[#F5F9FF] border border-[#CDE0FC] text-xs space-y-1">
                <div className="font-bold text-[#0869F5] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dados pré-preenchidos de campanha anterior</span>
                </div>
                <div className="text-[#0D1729] font-semibold">
                  {invitePrefill.name}
                  {invitePrefill.cpf
                    ? ` • ${maskCpfDisplay(invitePrefill.cpf)}`
                    : ''}
                  {invitePrefill.phone
                    ? ` • ${formatBrazilMobile(invitePrefill.phone) || invitePrefill.phone}`
                    : ''}
                </div>
                <p className="text-[11px] text-[#526480]">
                  Se este CPF já teve acesso anterior nesta rifa, o vínculo antigo será revogado automaticamente sem apagar pedidos já realizados.
                </p>
              </div>
            )}

            {!generatedInvite ? (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#14213A]">
                    Regra de Comissão
                  </label>

                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-[16px] border cursor-pointer transition ${
                        commissionType === 'negotiable'
                          ? 'bg-[#EDF5FF] border-[#0869F5]'
                          : 'bg-[#F8FBFF] border-[#D9E5F7] hover:border-[#B9D3F8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="commissionType"
                        value="negotiable"
                        checked={commissionType === 'negotiable'}
                        onChange={() => setCommissionType('negotiable')}
                        className="mt-0.5 accent-[#0869F5]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#0D1729] block">
                          A combinar (Padrão)
                        </span>
                        <span className="text-[11px] text-[#526480]">
                          O acerto é combinado diretamente e você lança o valor quando realizar o pagamento.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-[16px] border cursor-pointer transition ${
                        commissionType === 'percent'
                          ? 'bg-[#EDF5FF] border-[#0869F5]'
                          : 'bg-[#F8FBFF] border-[#D9E5F7] hover:border-[#B9D3F8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="commissionType"
                        value="percent"
                        checked={commissionType === 'percent'}
                        onChange={() => setCommissionType('percent')}
                        className="mt-0.5 accent-[#0869F5]"
                      />
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-xs font-bold text-[#0D1729] block">
                            Percentual (%) sobre vendas pagas
                          </span>
                          <span className="text-[11px] text-[#526480]">
                            Aceita de 0% (ajudante voluntário) até 100% sobre o total efetivo do pedido.
                          </span>
                        </div>
                        {commissionType === 'percent' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={commissionValueInput}
                              onChange={(e) =>
                                setCommissionValueInput(e.target.value)
                              }
                              className="w-28 px-3 py-2 rounded-[12px] bg-white border border-[#CDE0FC] text-xs font-bold text-[#0D1729] tabular-nums focus:outline-none focus:border-[#0869F5]"
                            />
                            <span className="text-xs font-bold text-[#475872]">
                              %
                            </span>
                            {Number(commissionValueInput) === 0 && (
                              <span className="text-[11px] font-semibold text-[#00A868]">
                                Ajudante voluntário (0%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-[16px] border cursor-pointer transition ${
                        commissionType === 'fixed_per_ticket'
                          ? 'bg-[#EDF5FF] border-[#0869F5]'
                          : 'bg-[#F8FBFF] border-[#D9E5F7] hover:border-[#B9D3F8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="commissionType"
                        value="fixed_per_ticket"
                        checked={commissionType === 'fixed_per_ticket'}
                        onChange={() => setCommissionType('fixed_per_ticket')}
                        className="mt-0.5 accent-[#0869F5]"
                      />
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-xs font-bold text-[#0D1729] block">
                            Valor fixo (R$) por cota paga
                          </span>
                          <span className="text-[11px] text-[#526480]">
                            Aceita a partir de R$ 0,00 (ajudante voluntário) por cota confirmada.
                          </span>
                        </div>
                        {commissionType === 'fixed_per_ticket' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#475872]">
                              R$
                            </span>
                            <input
                              type="number"
                              min={0}
                              step={0.1}
                              value={commissionValueInput}
                              onChange={(e) =>
                                setCommissionValueInput(e.target.value)
                              }
                              className="w-28 px-3 py-2 rounded-[12px] bg-white border border-[#CDE0FC] text-xs font-bold text-[#0D1729] tabular-nums focus:outline-none focus:border-[#0869F5]"
                            />
                            <span className="text-xs font-bold text-[#475872]">
                              / cota
                            </span>
                            {Number(commissionValueInput) === 0 && (
                              <span className="text-[11px] font-semibold text-[#00A868]">
                                Voluntário (R$ 0,00)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {inviteError && (
                  <div className="p-3 rounded-[14px] bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#BE123C] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="ora-btn-primary rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {inviteSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    <span>Gerar Link de Convite (24h)</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-[18px] bg-[#E8F7F0] border border-[#B9E7D2] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00A868]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Link de convite gerado com sucesso!</span>
                  </div>
                  <p className="text-xs text-[#14213A]">
                    Regra definida:{' '}
                    <strong>
                      {formatCommissionRuleLabel(
                        generatedInvite.commission_type,
                        generatedInvite.commission_value
                      )}
                    </strong>{' '}
                    • Válido por 24 horas (uso único).
                  </p>
                </div>

                <div className="p-3 rounded-[14px] bg-[#F8FBFF] border border-[#D9E5F7] text-xs font-mono text-[#0D1729] break-all">
                  {generatedInviteUrl}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText('modal-generated-invite', generatedInviteUrl)
                    }
                    className="ora-btn-secondary flex-1 rounded-full py-2.5 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'modal-generated-invite' ? (
                      <Check className="w-4 h-4 text-[#00A868]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#0869F5]" />
                    )}
                    <span>
                      {copiedKey === 'modal-generated-invite'
                        ? 'Link Copiado!'
                        : 'Copiar Link (24h)'}
                    </span>
                  </button>

                  <a
                    href={buildInviteWhatsAppUrl(
                      raffle,
                      generatedInvite,
                      generatedInviteUrl,
                      invitePrefill?.phone
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar pelo WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2 text-xs font-bold text-[#526480] hover:text-[#0D1729] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Informar Pagamento de Comissão */}
      {payoutPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/60 backdrop-blur-sm">
          <div className="ora-card rounded-[24px] sm:rounded-[28px] max-w-lg w-full p-5 sm:p-7 space-y-5 relative max-h-[92vh] overflow-y-auto bg-white">
            <button
              type="button"
              onClick={() => setPayoutPartner(null)}
              aria-label="Fechar modal de pagamento"
              className="absolute right-4 top-4 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F5F9FF] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <span className="ora-glass-pill rounded-full px-3 py-1 text-[11px] font-bold text-[#0869F5] inline-flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>Acerto de Comissão</span>
              </span>
              <h3 className="font-display font-bold text-xl text-[#0D1729] pt-1">
                Informar Pagamento — {payoutPartner.full_name}
              </h3>
              <p className="text-xs text-[#526480]">
                Registre o valor repassado (aceita acertos parciais que somam ao histórico) e envie o link para o parceiro confirmar o recebimento.
              </p>
            </div>

            {!createdPayout ? (
              <form onSubmit={handleCreatePayout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#14213A]">
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={payoutAmountInput}
                    onChange={(e) => setPayoutAmountInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[14px] bg-[#F8FBFF] border border-[#D9E5F7] text-sm font-bold text-[#0D1729] tabular-nums focus:outline-none focus:bg-white focus:border-[#0869F5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#14213A]">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PIX enviado referente às primeiras 10 cotas..."
                    value={payoutNote}
                    onChange={(e) => setPayoutNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[14px] bg-[#F8FBFF] border border-[#D9E5F7] text-xs font-medium text-[#0D1729] placeholder-[#8A9BB3] focus:outline-none focus:bg-white focus:border-[#0869F5]"
                  />
                </div>

                {payoutError && (
                  <div className="p-3 rounded-[14px] bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#BE123C] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoutPartner(null)}
                    className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="ora-btn-primary rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {payoutSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Handshake className="w-4 h-4" />
                    )}
                    <span>Registrar e Gerar Link de Confirmação</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-[18px] bg-[#E8F7F0] border border-[#B9E7D2] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00A868]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pagamento registrado!</span>
                  </div>
                  <p className="text-xs text-[#14213A]">
                    Valor de{' '}
                    <strong className="tabular-nums">
                      {formatCurrencyBrl(createdPayout.amount)}
                    </strong>{' '}
                    aguardando confirmação de{' '}
                    <strong>{createdPayout.partner_name}</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-[14px] bg-[#F8FBFF] border border-[#D9E5F7] text-xs font-mono text-[#0D1729] break-all">
                  {createdPayoutConfirmUrl}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        'modal-created-payout',
                        createdPayoutConfirmUrl
                      )
                    }
                    className="ora-btn-secondary flex-1 rounded-full py-2.5 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'modal-created-payout' ? (
                      <Check className="w-4 h-4 text-[#00A868]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#0869F5]" />
                    )}
                    <span>
                      {copiedKey === 'modal-created-payout'
                        ? 'Link Copiado!'
                        : 'Copiar Link de Confirmação'}
                    </span>
                  </button>

                  <a
                    href={buildPayoutConfirmWhatsAppUrl(
                      raffle,
                      createdPayout,
                      createdPayoutConfirmUrl,
                      payoutPartner.phone_whatsapp
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar no WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setPayoutPartner(null)}
                  className="w-full py-2 text-xs font-bold text-[#526480] hover:text-[#0D1729] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
