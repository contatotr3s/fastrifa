'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  computeOccupiedTicketsFromOrders,
  createOrder,
  getOccupiedTickets,
  getRaffleById,
  getRaffleByPublicParams,
  getRaffleBySlug,
  subscribeToRaffle,
  subscribeToRaffleOrders,
} from '@/lib/firebase/raffles';
import { getPartnerPayoutsByIds } from '@/lib/firebase/partners';
import { MASTER_EMAIL, useAuth } from '@/lib/firebase/auth-context';
import {
  getPartnerCheckoutPath,
  getRafflePublicPath,
  getRuntimeOrigin,
} from '@/lib/raffle-urls';
import { generatePixBrCode } from '@/lib/pix-brcode';
import {
  calculateDiscountedPricing,
  getRouletteSpinDistribution,
  normalizeDiscountConfig,
} from '@/lib/discounts';
import {
  buildInitialPartnerCheckoutSession,
  calculateOrderCommission,
  formatCommissionRuleLabel,
} from '@/lib/partner-finance';
import { generateBrandInitials } from '@/lib/image-processor';
import { formatBrazilMobile, getBrazilMobileError } from '@/lib/validators';
import DiscountRouletteModal from '@/components/discount-roulette-modal';
import PhysicalCardModal from '@/components/physical-card-modal';
import PartnerSalesTab, {
  PartnerPendingPayoutsBanner,
} from '@/components/partner-sales-tab';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Dices,
  ExternalLink,
  Loader2,
  MessageCircle,
  Minus,
  Percent,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCheck,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import type {
  OccupiedTicket,
  Order,
  PartnerPayout,
  Raffle,
  RafflePartner,
} from '@/types/database.types';

type FlowStep = 'qty' | 'check' | 'reserve' | 'pix';
type PartnerTab = 'sell' | 'sales';

const DISCOUNT_COUNTDOWN_MS = 10 * 60 * 1000; // 10 minutos

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface UnavailableAlert {
  number: number;
  reason: 'paid' | 'pending' | 'duplicate' | 'out_of_range';
  message: string;
  suggestions: number[];
}

export interface PhysicalCartelaPixViewProps {
  slug?: string;
  brand?: string;
  keyword?: string;
  code?: string;
  raffleId?: string;
  checkoutMode?: 'public_pix' | 'organizer_direct' | 'partner';
  requestedOrganizerMode?: boolean;
  partner?: RafflePartner | null;
  onPartnerRefresh?: () => Promise<void> | void;
}

export default function PhysicalCartelaPixView({
  slug,
  brand,
  keyword,
  code,
  raffleId,
  checkoutMode,
  requestedOrganizerMode = false,
  partner = null,
  onPartnerRefresh,
}: PhysicalCartelaPixViewProps) {
  const { user, loading: authLoading } = useAuth();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado exclusivo do modo Parceiro
  const [activeTab, setActiveTab] = useState<PartnerTab>('sell');
  const [partnerPayouts, setPartnerPayouts] = useState<PartnerPayout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [copiedPartnerLink, setCopiedPartnerLink] = useState(false);
  const [showPhysicalCardModal, setShowPhysicalCardModal] = useState(false);

  // Fluxo guiado de checkout presencial / direto
  const initialSession = useMemo(() => buildInitialPartnerCheckoutSession(), []);
  const [step, setStep] = useState<FlowStep>('qty');
  const [quantity, setQuantity] = useState<number>(3);

  // Estado do Checador Passo a Passo
  const [verifiedNumbers, setVerifiedNumbers] = useState<number[]>(
    initialSession.verifiedNumbers
  );
  const [numberInput, setNumberInput] = useState<string>('');
  const [isCheckingNumber, setIsCheckingNumber] = useState<boolean>(false);
  const [lastApprovedNumber, setLastApprovedNumber] = useState<number | null>(
    null
  );
  const [unavailableAlert, setUnavailableAlert] =
    useState<UnavailableAlert | null>(null);

  // Estado da Roleta & Timer de 10 minutos
  const [rouletteWonPercent, setRouletteWonPercent] = useState<number | null>(
    initialSession.rouletteWonPercent
  );
  const [rouletteHighestPercent, setRouletteHighestPercent] = useState<number>(
    initialSession.rouletteHighestPercent
  );
  const [rouletteSpinRound, setRouletteSpinRound] = useState<number>(1);
  const [showRouletteModal, setShowRouletteModal] = useState<boolean>(false);
  const [discountStartedAtMs, setDiscountStartedAtMs] = useState<number | null>(
    initialSession.discountStartedAtMs
  );
  const [discountExpired, setDiscountExpired] = useState<boolean>(
    initialSession.discountExpired
  );
  const [discountSecondsLeft, setDiscountSecondsLeft] = useState<number>(
    Math.ceil(DISCOUNT_COUNTDOWN_MS / 1000)
  );

  // Dados do comprador para concluir a reserva
  const [buyerName, setBuyerName] = useState(initialSession.buyerName);
  const [buyerPhone, setBuyerPhone] = useState(initialSession.buyerPhone);
  const [buyerFieldErrors, setBuyerFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  // Estado final do PIX com valor somado
  const [pixPayload, setPixPayload] = useState<string>('');
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [confirmedPixAmount, setConfirmedPixAmount] = useState<number | null>(
    null
  );
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [reservationConfirmed, setReservationConfirmed] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Carregamento inicial da rifa + listeners em tempo real
  useEffect(() => {
    let active = true;
    let unsubRaffle: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;

    setLoading(true);
    setError(null);

    const fetcher = raffleId
      ? getRaffleById(raffleId)
      : brand && keyword && code
        ? getRaffleByPublicParams(brand, keyword, code)
        : slug
          ? getRaffleBySlug(slug)
          : null;

    if (!fetcher) {
      setError('Campanha não encontrada.');
      setLoading(false);
      return;
    }

    fetcher
      .then(async (data) => {
        if (!active) return;
        if (!data) {
          setError('Campanha não encontrada.');
          setLoading(false);
          return;
        }

        setRaffle(data);
        const occupied = await getOccupiedTickets(data.id);
        if (!active) return;
        setOccupiedTickets(occupied);

        if (typeof window !== 'undefined') {
          const globalTheme =
            localStorage.getItem('fastrifa_global_system_theme') || 'green';
          const themeToApply = data.brand_color ? data.brand_color : globalTheme;
          document.documentElement.setAttribute('data-theme', themeToApply);
        }

        unsubRaffle = subscribeToRaffle(data.id, (updated) => {
          if (!active || !updated) return;
          setRaffle((prev) => ({
            ...updated,
            brand_color: updated.brand_color || prev?.brand_color,
            brand_logo_url: updated.brand_logo_url || prev?.brand_logo_url,
            brand_name: updated.brand_name || prev?.brand_name,
          }));
          if (typeof window !== 'undefined' && updated.brand_color) {
            document.documentElement.setAttribute('data-theme', updated.brand_color);
          }
        });

        unsubOrders = subscribeToRaffleOrders(data.id, (liveOrders) => {
          if (!active) return;
          setOrders(liveOrders);
          setOccupiedTickets(computeOccupiedTicketsFromOrders(liveOrders));
        });
      })
      .catch(() => {
        if (active) setError('Erro ao carregar dados da campanha.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (unsubRaffle) unsubRaffle();
      if (unsubOrders) unsubOrders();
      if (typeof window !== 'undefined') {
        const globalTheme =
          localStorage.getItem('fastrifa_global_system_theme') || 'green';
        document.documentElement.setAttribute('data-theme', globalTheme);
      }
    };
  }, [raffleId, slug, brand, keyword, code]);

  // Determinação segura do modo efetivo (organizador direto exige autoria ou Master)
  const isMaster = Boolean(
    user?.email && user.email.toLowerCase().trim() === MASTER_EMAIL
  );
  const isOrganizerOwner = Boolean(
    !authLoading &&
      user &&
      raffle &&
      (user.uid === raffle.user_id || isMaster)
  );
  const effectiveMode: 'public_pix' | 'organizer_direct' | 'partner' =
    checkoutMode === 'partner'
      ? 'partner'
      : (checkoutMode === 'organizer_direct' || requestedOrganizerMode) &&
          isOrganizerOwner
        ? 'organizer_direct'
        : 'public_pix';

  const payoutIdsKey = useMemo(
    () => (partner?.payout_ids || []).join(','),
    [partner?.payout_ids]
  );

  const loadPartnerPayouts = useCallback(async () => {
    if (effectiveMode !== 'partner' || !partner) {
      setPartnerPayouts([]);
      return;
    }
    const ids = partner.payout_ids || [];
    if (ids.length === 0) {
      setPartnerPayouts([]);
      return;
    }
    setLoadingPayouts(true);
    try {
      const list = await getPartnerPayoutsByIds(ids);
      setPartnerPayouts(list);
    } finally {
      setLoadingPayouts(false);
    }
  }, [effectiveMode, partner]);

  useEffect(() => {
    loadPartnerPayouts();
  }, [loadPartnerPayouts, payoutIdsKey]);

  const handleRefreshPartnerData = useCallback(async () => {
    if (onPartnerRefresh) {
      await onPartnerRefresh();
    }
    await loadPartnerPayouts();
  }, [onPartnerRefresh, loadPartnerPayouts]);

  useEffect(() => {
    if (effectiveMode !== 'partner' || typeof window === 'undefined') return;
    const onFocus = () => {
      handleRefreshPartnerData().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [effectiveMode, handleRefreshPartnerData]);

  // Mapas de cotas ocupadas (para checador e impressão de cartela <= 200)
  const occupiedMap = useMemo(() => {
    const map = new Map<number, 'pending' | 'paid'>();
    occupiedTickets.forEach((t) => map.set(t.ticket_number, t.status));
    return map;
  }, [occupiedTickets]);

  const { paidTicketNumbers, pendingTicketNumbers } = useMemo(() => {
    const paid: number[] = [];
    const pending: number[] = [];
    occupiedTickets.forEach((t) => {
      if (t.status === 'paid') paid.push(t.ticket_number);
      else pending.push(t.ticket_number);
    });
    return { paidTicketNumbers: paid, pendingTicketNumbers: pending };
  }, [occupiedTickets]);

  const availableCount = useMemo(() => {
    if (!raffle) return 0;
    return Math.max(0, raffle.total_tickets - occupiedMap.size);
  }, [raffle, occupiedMap]);

  // Pedidos e confirmações pendentes do parceiro logado por token
  const partnerOrders = useMemo(() => {
    if (effectiveMode !== 'partner' || !partner) return [];
    return orders.filter((o) => o.partner_id === partner.id);
  }, [effectiveMode, partner, orders]);

  const pendingPayoutConfirmationsCount = useMemo(
    () => partnerPayouts.filter((p) => p.status === 'pending_confirmation').length,
    [partnerPayouts]
  );

  // Bloqueio imediato quando rifa não está ativa ou parceiro não está ativo
  const isRaffleInactive = Boolean(raffle && raffle.status !== 'active');
  const isPartnerInactive =
    effectiveMode === 'partner' && (!partner || partner.status !== 'active');
  const isSalesBlocked = isRaffleInactive || isPartnerInactive;

  // Promoções, Roleta e Precificação
  const unitPrice = raffle ? Number(raffle.ticket_price) : 0;
  const normalizedDiscount = useMemo(
    () => normalizeDiscountConfig(raffle?.discount_config),
    [raffle?.discount_config]
  );

  const activeTicketCount =
    step === 'reserve' || step === 'pix' ? verifiedNumbers.length : quantity;

  const rawPricing = useMemo(
    () =>
      calculateDiscountedPricing({
        ticketCount: activeTicketCount,
        unitPrice,
        config: normalizedDiscount,
        rouletteWonPercent,
      }),
    [activeTicketCount, unitPrice, normalizedDiscount, rouletteWonPercent]
  );

  const pricing = useMemo(() => {
    if (!discountExpired) return rawPricing;
    return calculateDiscountedPricing({
      ticketCount: activeTicketCount,
      unitPrice,
      config: { mode: 'none' },
      rouletteWonPercent: null,
    });
  }, [discountExpired, rawPricing, activeTicketCount, unitPrice]);

  const totalAmount = pricing.finalAmount;

  const rouletteOptions = useMemo(
    () =>
      normalizedDiscount.roulette_options &&
      normalizedDiscount.roulette_options.length >= 2
        ? normalizedDiscount.roulette_options
        : [5, 10, 15, 20],
    [normalizedDiscount.roulette_options]
  );
  const rouletteMaxOption = useMemo(
    () => Math.max(...rouletteOptions),
    [rouletteOptions]
  );
  const rouletteDistribution = useMemo(
    () =>
      getRouletteSpinDistribution(
        rouletteOptions,
        rouletteHighestPercent > 0 ? rouletteHighestPercent : null
      ),
    [rouletteOptions, rouletteHighestPercent]
  );

  // Inicia timer de 10 minutos quando um desconto passa a valer
  useEffect(() => {
    if (
      normalizedDiscount.mode !== 'none' &&
      !discountExpired &&
      discountStartedAtMs === null &&
      rawPricing.discountPercent > 0
    ) {
      setDiscountStartedAtMs(Date.now());
      setDiscountSecondsLeft(Math.ceil(DISCOUNT_COUNTDOWN_MS / 1000));
    }
  }, [
    normalizedDiscount.mode,
    discountExpired,
    discountStartedAtMs,
    rawPricing.discountPercent,
  ]);

  // Tick de 1 segundo até expirar o prazo de 10 minutos
  useEffect(() => {
    if (!discountStartedAtMs || discountExpired) return;
    const expiresAt = discountStartedAtMs + DISCOUNT_COUNTDOWN_MS;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setDiscountSecondsLeft(remaining);
      if (remaining <= 0) {
        setDiscountExpired(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [discountStartedAtMs, discountExpired]);

  function fireConfetti(mode: 'mini' | 'full' = 'full') {
    try {
      const isGreen = raffle?.brand_color === 'green';
      const colors = isGreen
        ? ['#059669', '#10B981', '#F59E0B', '#34D399']
        : ['#0869F5', '#3888FF', '#F59E0B', '#60A5FA'];

      if (mode === 'mini') {
        confetti({
          particleCount: 25,
          spread: 45,
          scalar: 0.85,
          origin: { y: 0.6 },
          colors,
        });
      } else {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.62 },
          colors,
        });
      }
    } catch {}
  }

  function findNearbySuggestions(
    target: number,
    latestMap: Map<number, 'pending' | 'paid'>,
    alreadyPicked: number[],
    maxTotal: number
  ): number[] {
    const pickedSet = new Set(alreadyPicked);
    const suggestions: number[] = [];
    for (let offset = 1; offset <= maxTotal && suggestions.length < 4; offset++) {
      const candidates = [target - offset, target + offset];
      for (const c of candidates) {
        if (
          c >= 1 &&
          c <= maxTotal &&
          !latestMap.has(c) &&
          !pickedSet.has(c) &&
          suggestions.length < 4
        ) {
          suggestions.push(c);
        }
      }
    }
    return suggestions;
  }

  // Inicia o passo de checagem número por número
  function handleStartChecking() {
    if (!raffle || isSalesBlocked || availableCount <= 0) return;
    if (quantity > availableCount) {
      setQuantity(availableCount);
    }
    setVerifiedNumbers([]);
    setNumberInput('');
    setUnavailableAlert(null);
    setLastApprovedNumber(null);
    setReserveError(null);
    setStep('check');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Checa a disponibilidade de um número em tempo real no Firestore
  async function handleCheckNumber(customNum?: number) {
    if (!raffle || isSalesBlocked) return;
    const rawVal =
      customNum !== undefined ? customNum : parseInt(numberInput.trim(), 10);

    if (Number.isNaN(rawVal)) {
      return;
    }

    if (rawVal < 1 || rawVal > raffle.total_tickets) {
      setUnavailableAlert({
        number: rawVal,
        reason: 'out_of_range',
        message: `Esta rifa vai do número 001 ao ${raffle.total_tickets
          .toString()
          .padStart(3, '0')}. Peça ao cliente para escolher dentro desse limite.`,
        suggestions: [],
      });
      return;
    }

    if (verifiedNumbers.includes(rawVal)) {
      setUnavailableAlert({
        number: rawVal,
        reason: 'duplicate',
        message: `O número #${rawVal
          .toString()
          .padStart(3, '0')} já foi selecionado e marcado com Vzinho nesta mesma compra! Escolha outro número para a próxima cota.`,
        suggestions: findNearbySuggestions(
          rawVal,
          occupiedMap,
          verifiedNumbers,
          raffle.total_tickets
        ),
      });
      return;
    }

    setIsCheckingNumber(true);
    setLastApprovedNumber(null);

    try {
      const freshOccupied = await getOccupiedTickets(raffle.id);
      setOccupiedTickets(freshOccupied);

      const freshMap = new Map<number, 'pending' | 'paid'>();
      freshOccupied.forEach((t) => freshMap.set(t.ticket_number, t.status));

      const status = freshMap.get(rawVal);

      if (status === 'paid' || status === 'pending') {
        const near = findNearbySuggestions(
          rawVal,
          freshMap,
          verifiedNumbers,
          raffle.total_tickets
        );
        setUnavailableAlert({
          number: rawVal,
          reason: status,
          message:
            status === 'paid'
              ? `O número #${rawVal
                  .toString()
                  .padStart(3, '0')} JÁ FOI VENDIDO (PAGO)! Avise o cliente e peça para escolher outro número.`
              : `O número #${rawVal
                  .toString()
                  .padStart(3, '0')} JÁ ESTÁ RESERVADO aguardando pagamento! Avise o cliente e peça para escolher outro número.`,
          suggestions: near,
        });
        setIsCheckingNumber(false);
        return;
      }

      const updatedList = [...verifiedNumbers, rawVal];
      setVerifiedNumbers(updatedList);
      setLastApprovedNumber(rawVal);
      setNumberInput('');
      setUnavailableAlert(null);
      fireConfetti('mini');

      if (updatedList.length >= quantity) {
        setTimeout(() => {
          setStep('reserve');
        }, 550);
      } else {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    } catch (err) {
      console.error('Erro ao checar número:', err);
    } finally {
      setIsCheckingNumber(false);
    }
  }

  function handleUnderstandUnavailable() {
    setUnavailableAlert(null);
    setNumberInput('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function removeVerifiedNumber(numToRemove: number) {
    setVerifiedNumbers((prev) => prev.filter((n) => n !== numToRemove));
    setLastApprovedNumber(null);
    if (step === 'reserve') {
      setStep('check');
    }
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function buildPixForCurrentAmount(cotaCount: number, exactAmount: number) {
    if (!raffle) return;
    const payload = generatePixBrCode({
      pixKey: raffle.pix_key,
      pixKeyType: raffle.pix_key_type,
      merchantName: raffle.brand_name || 'FASTRIFA',
      merchantCity: 'BRASIL',
      amount: exactAmount,
      description: `RIFA ${cotaCount} COTAS`,
    });

    const qrUrl = await QRCode.toDataURL(payload, {
      width: 520,
      margin: 1,
      color: {
        dark: '#0D1729',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    setPixPayload(payload);
    setPixQrDataUrl(qrUrl);
    setConfirmedPixAmount(exactAmount);
  }

  // Conclui a reserva das cotas verificadas no Firestore e gera o QR Code PIX somado
  async function handleConfirmReservationAndGeneratePix(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle) return;
    setReserveError(null);

    if (isSalesBlocked) {
      setReserveError(
        isPartnerInactive
          ? 'Seu acesso como parceiro não está ativo para novas reservas.'
          : 'Esta campanha não está aberta para novas reservas no momento.'
      );
      return;
    }

    const trimmedName = buyerName.trim();
    const nextFieldErrors: { name?: string; phone?: string } = {};

    if (trimmedName.length < 2) {
      nextFieldErrors.name =
        'Informe o nome do comprador para registrar a reserva.';
    }
    const phoneErr = getBrazilMobileError(buyerPhone);
    if (phoneErr) {
      nextFieldErrors.phone = phoneErr;
    }

    setBuyerFieldErrors(nextFieldErrors);
    if (nextFieldErrors.name || nextFieldErrors.phone) {
      return;
    }

    setIsSubmittingReservation(true);

    try {
      const effectivePricing = discountExpired
        ? calculateDiscountedPricing({
            ticketCount: verifiedNumbers.length,
            unitPrice,
            config: { mode: 'none' },
            rouletteWonPercent: null,
          })
        : calculateDiscountedPricing({
            ticketCount: verifiedNumbers.length,
            unitPrice,
            config: normalizedDiscount,
            rouletteWonPercent,
          });

      const finalOrderAmount = effectivePricing.finalAmount;

      const partnerPayload =
        effectiveMode === 'partner' && partner
          ? {
              partner_id: partner.id,
              partner_name: partner.full_name,
              commission_type: partner.commission_type,
              commission_value: partner.commission_value,
              commission_amount: calculateOrderCommission({
                totalAmount: finalOrderAmount,
                ticketCount: verifiedNumbers.length,
                commissionType: partner.commission_type,
                commissionValue: partner.commission_value,
              }),
            }
          : {};

      const res = await createOrder({
        raffle_id: raffle.id,
        buyer_name: trimmedName,
        buyer_phone: formatBrazilMobile(buyerPhone),
        ticket_numbers: verifiedNumbers,
        total_amount: finalOrderAmount,
        sale_channel:
          effectiveMode === 'partner'
            ? 'partner'
            : effectiveMode === 'organizer_direct'
              ? 'organizer_direct'
              : 'public',
        ...(effectivePricing.discountPercent > 0 && !discountExpired
          ? {
              original_amount: effectivePricing.originalAmount,
              discount_percent: effectivePricing.discountPercent,
              discount_amount: effectivePricing.discountAmount,
              discount_label: effectivePricing.discountLabel,
            }
          : {}),
        ...partnerPayload,
        status: 'pending',
      });

      if (!res.success || res.error) {
        setReserveError(
          res.error ||
            'Algum número acabou de ser reservado. Volte e verifique outro número.'
        );
        setIsSubmittingReservation(false);
        return;
      }

      setOccupiedTickets((prev) => [
        ...prev,
        ...verifiedNumbers.map((num) => ({
          ticket_number: num,
          status: 'pending' as const,
        })),
      ]);
      setReservationConfirmed(true);

      await buildPixForCurrentAmount(verifiedNumbers.length, finalOrderAmount);
      setStep('pix');
      fireConfetti('full');
    } catch (err) {
      console.error('Erro ao confirmar reserva:', err);
      setReserveError('Erro ao salvar a reserva. Tente novamente.');
    } finally {
      setIsSubmittingReservation(false);
    }
  }

  // Preserva o cliente atual (nome + WhatsApp) para nova rodada / giro progressivo da Roleta
  function handleCustomerBuyMore() {
    const nextHighest = Math.max(
      rouletteHighestPercent,
      rouletteWonPercent || 0
    );
    setRouletteHighestPercent(nextHighest);

    if (
      normalizedDiscount.mode === 'roulette' &&
      nextHighest >= rouletteMaxOption &&
      nextHighest > 0
    ) {
      // Já atingiu o desconto máximo da roleta: preserva para não perder o benefício
      setRouletteWonPercent(nextHighest);
    } else {
      setRouletteWonPercent(null);
      setRouletteSpinRound((prev) => prev + 1);
    }

    setVerifiedNumbers([]);
    setNumberInput('');
    setLastApprovedNumber(null);
    setUnavailableAlert(null);
    setReserveError(null);
    setBuyerFieldErrors({});
    setPixPayload('');
    setPixQrDataUrl('');
    setConfirmedPixAmount(null);
    setReservationConfirmed(false);
    setDiscountStartedAtMs(null);
    setDiscountExpired(false);
    setDiscountSecondsLeft(Math.ceil(DISCOUNT_COUNTDOWN_MS / 1000));
    setShowRouletteModal(false);
    setStep('qty');

    if (raffle) {
      getOccupiedTickets(raffle.id)
        .then(setOccupiedTickets)
        .catch(() => {});
    }
  }

  // Zera 100% da sessão de atendimento para o próximo cliente
  function handleResetForNextCustomer() {
    const fresh = buildInitialPartnerCheckoutSession();
    setBuyerName(fresh.buyerName);
    setBuyerPhone(fresh.buyerPhone);
    setVerifiedNumbers(fresh.verifiedNumbers);
    setRouletteWonPercent(fresh.rouletteWonPercent);
    setRouletteHighestPercent(fresh.rouletteHighestPercent);
    setDiscountStartedAtMs(fresh.discountStartedAtMs);
    setDiscountExpired(fresh.discountExpired);

    setRouletteSpinRound(1);
    setShowRouletteModal(false);
    setDiscountSecondsLeft(Math.ceil(DISCOUNT_COUNTDOWN_MS / 1000));
    setPixPayload('');
    setPixQrDataUrl('');
    setConfirmedPixAmount(null);
    setReservationConfirmed(false);
    setReserveError(null);
    setBuyerFieldErrors({});
    setUnavailableAlert(null);
    setLastApprovedNumber(null);
    setNumberInput('');
    setQuantity(3);
    setStep('qty');

    if (raffle) {
      getOccupiedTickets(raffle.id)
        .then(setOccupiedTickets)
        .catch(() => {});
    }
  }

  function copyPixPayload() {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    fireConfetti('mini');
    setTimeout(() => setCopiedPayload(false), 3000);
  }

  function copyPartnerCheckoutLink() {
    if (!partner) return;
    const url = `${getRuntimeOrigin()}${getPartnerCheckoutPath(partner.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedPartnerLink(true);
    setTimeout(() => setCopiedPartnerLink(false), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen ora-hero-stage flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--ora-blue,#00A868)] animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen ora-hero-stage flex flex-col items-center justify-center p-4 text-center">
        <div className="ora-card rounded-[28px] p-8 max-w-md space-y-4">
          <h1 className="font-display font-bold text-2xl text-[#0D1729]">
            Campanha não encontrada
          </h1>
          <p className="text-sm text-[#475872]">
            Verifique o link de acesso ou o QR Code da cartela e tente novamente.
          </p>
          <Link
            href="/"
            className="ora-btn-primary rounded-full px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir para o Início</span>
          </Link>
        </div>
      </div>
    );
  }

  const organizerCleanPhone = (raffle.phone_whatsapp || '').replace(/\D/g, '');
  const formattedVerifiedNums =
    verifiedNumbers.length > 0
      ? ` (${verifiedNumbers
          .map((n) => `#${n.toString().padStart(3, '0')}`)
          .join(', ')})`
      : '';
  const orderedCount = verifiedNumbers.length || quantity;
  const displayedPixAmount =
    step === 'pix' && confirmedPixAmount !== null
      ? confirmedPixAmount
      : totalAmount;
  const whatsappMessage = `Olá! Reservei *${orderedCount} cota(s)*${formattedVerifiedNums} na rifa *"${raffle.title}"* no valor total de *R$ ${displayedPixAmount.toFixed(2)}*.${
    buyerName ? ` Comprador: ${buyerName}.` : ''
  }${
    effectiveMode === 'partner' && partner
      ? ` Atendimento via parceiro: ${partner.full_name}.`
      : ''
  } Notifico que o pagamento via PIX foi realizado!`;
  const whatsappUrl = `https://wa.me/55${organizerCleanPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const currentSlotIndex = verifiedNumbers.length + 1;
  const canPrintPhysicalCard = raffle.total_tickets <= 200;
  const hasActiveAttendanceControls =
    step === 'check' ||
    step === 'reserve' ||
    step === 'pix' ||
    discountExpired ||
    rouletteWonPercent != null ||
    reservationConfirmed;

  const blockReasonTitle = isPartnerInactive
    ? partner?.status === 'revoked'
      ? 'Vínculo de Parceiro Revogado'
      : 'Acesso de Parceiro Pausado'
    : raffle.status === 'completed'
      ? 'Campanha Encerrada / Sorteada'
      : raffle.status === 'cancelled'
        ? 'Campanha Cancelada'
        : 'Campanha Pausada Temporariamente';

  const blockReasonDescription = isPartnerInactive
    ? partner?.status === 'revoked'
      ? 'Seu vínculo nesta campanha foi revogado pelo organizador. Novas vendas estão bloqueadas, mas você ainda pode consultar suas vendas e comissões.'
      : 'O organizador pausou temporariamente suas vendas nesta campanha. Você ainda pode acessar seus pedidos e confirmar recebimentos na aba Minhas Vendas e Comissões.'
    : raffle.status === 'completed'
      ? 'Esta campanha já foi finalizada. Não é possível reservar novas cotas.'
      : raffle.status === 'cancelled'
        ? 'Esta campanha foi cancelada pelo organizador. Novas reservas estão bloqueadas.'
        : 'O organizador pausou esta campanha no momento. Novas reservas estão temporariamente bloqueadas.';

  return (
    <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center p-2.5 sm:p-4">
      <main className="max-w-xl w-full">
        <section className="ora-card rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 space-y-3 shadow-[0_20px_50px_rgba(13,23,41,0.08)]">
          {/* ================================================================= */}
          {/* CABEÇALHO SUPERIOR POR MODO                                       */}
          {/* ================================================================= */}
          {effectiveMode === 'public_pix' && (
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 pb-2.5 border-b border-[#E0E9F7]">
              <Link
                href={getRafflePublicPath(raffle)}
                className="ora-btn-secondary rounded-full px-2.5 sm:px-3 py-1.5 inline-flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs font-bold text-[#0D1729] shrink-0 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                <span>Ver Rifa Completa</span>
              </Link>

              <div className="ora-glass-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[var(--ora-blue,#00A868)] text-[9.5px] sm:text-[11px] font-bold whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Checador Oficial • Físico + Digital</span>
              </div>
            </div>
          )}

          {effectiveMode === 'organizer_direct' && (
            <div className="space-y-2 pb-2.5 border-b border-[#E0E9F7]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="ora-glass-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[var(--ora-blue,#00A868)] text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Checkout Direto • Organizador</span>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={getRafflePublicPath(raffle)}
                    target="_blank"
                    rel="noreferrer"
                    className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                    <span>Ver Rifa Pública</span>
                  </Link>

                  {canPrintPhysicalCard && (
                    <button
                      type="button"
                      onClick={() => setShowPhysicalCardModal(true)}
                      className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                      <span>Imprimir Cartela</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {effectiveMode === 'partner' && partner && (
            <div className="space-y-2.5 pb-2.5 border-b border-[#E0E9F7]">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="ora-glass-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[var(--ora-blue,#00A868)] text-[11px] font-bold max-w-full">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Parceiro Oficial · {partner.full_name}
                  </span>
                </span>

                <span className="ora-glass-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[#14213A] text-[10.5px] font-bold">
                  <Wallet className="w-3 h-3 text-[var(--ora-blue,#00A868)] shrink-0" />
                  <span>
                    Comissão:{' '}
                    {formatCommissionRuleLabel(
                      partner.commission_type,
                      partner.commission_value
                    )}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={getRafflePublicPath(raffle)}
                  target="_blank"
                  rel="noreferrer"
                  className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                  <span>Ver Rifa Pública</span>
                </Link>

                {canPrintPhysicalCard && (
                  <button
                    type="button"
                    onClick={() => setShowPhysicalCardModal(true)}
                    className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                    <span>Imprimir Cartela</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={copyPartnerCheckoutLink}
                  className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPartnerLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span className="text-[#059669]">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
                      <span>Copiar Meu Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Banner de Recibos Pendentes de Confirmação no Modo Parceiro */}
          {effectiveMode === 'partner' && (
            <PartnerPendingPayoutsBanner
              payouts={partnerPayouts}
              onRefresh={handleRefreshPartnerData}
            />
          )}

          {/* Informações da Rifa */}
          <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#E0E9F7]">
            <div className="flex items-center gap-2.5 min-w-0">
              {raffle.prize_image_url ? (
                <img
                  src={raffle.prize_image_url}
                  alt={raffle.title}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-[#E0E9F7] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#A7F3D0] to-[var(--ora-blue,#00A868)] text-white text-xs font-bold shadow-xs shrink-0">
                  {raffle.brand_logo_url ? (
                    <img
                      src={raffle.brand_logo_url}
                      alt={raffle.brand_name || 'Organizador'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{generateBrandInitials(raffle.brand_name || 'FR')}</span>
                  )}
                </div>
              )}

              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#526480] block leading-none truncate">
                  {raffle.brand_name || 'FastRifa Oficial'}
                </span>
                <h1 className="font-display font-bold text-sm sm:text-base text-[#0D1729] leading-tight truncate mt-0.5">
                  {raffle.title}
                </h1>
                <span className="text-[11px] font-semibold text-[#475872] tabular-nums block leading-tight">
                  001 a {raffle.total_tickets.toString().padStart(3, '0')} •{' '}
                  <strong className="text-[#059669]">{availableCount} livres</strong>
                </span>
              </div>
            </div>

            <div className="text-right tabular-nums shrink-0 bg-[#F5F9FF] px-2.5 py-1.5 rounded-xl border border-[#D9E5F7]">
              <span className="text-[9px] font-bold uppercase text-[#526480] block leading-none">
                Cada Cota
              </span>
              <strong className="font-display font-bold text-sm sm:text-base text-[var(--ora-blue,#00A868)] leading-tight">
                R$ {unitPrice.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Abas do Parceiro: Vender Cotas vs Minhas Vendas e Comissões */}
          {effectiveMode === 'partner' && partner && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-[#F5F9FF] border border-[#D9E5F7]">
              <button
                type="button"
                onClick={() => setActiveTab('sell')}
                className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'sell'
                    ? 'ora-btn-primary shadow-xs'
                    : 'text-[#475872] hover:text-[#0D1729]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Vender Cotas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'sales'
                    ? 'ora-btn-primary shadow-xs'
                    : 'text-[#475872] hover:text-[#0D1729]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Minhas Vendas e Comissões</span>
                {(pendingPayoutConfirmationsCount > 0 || partnerOrders.length > 0) && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold tabular-nums shrink-0 ${
                      pendingPayoutConfirmationsCount > 0
                        ? 'bg-[#F59E0B] text-white'
                        : activeTab === 'sales'
                          ? 'bg-white/25 text-white'
                          : 'bg-[#E8F7F0] text-[#00A868]'
                    }`}
                  >
                    {pendingPayoutConfirmationsCount > 0
                      ? `${pendingPayoutConfirmationsCount}!`
                      : partnerOrders.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* ABA 2 DO PARCEIRO: MINHAS VENDAS E COMISSÕES                      */}
          {/* ================================================================= */}
          {effectiveMode === 'partner' && partner && activeTab === 'sales' ? (
            <PartnerSalesTab
              partner={partner}
              orders={orders}
              payouts={partnerPayouts}
              loadingPayouts={loadingPayouts}
              onRefresh={handleRefreshPartnerData}
            />
          ) : isSalesBlocked ? (
            /* =============================================================== */
            /* BLOQUEIO DE VENDAS (RIFA INATIVA OU PARCEIRO PAUSADO/REVOGADO)  */
            /* =============================================================== */
            <div className="p-5 rounded-[22px] bg-[#FFF1F2] border border-[#FECDD3] text-center space-y-3 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto border border-[#FECDD3]">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display font-bold text-lg text-[#881337]">
                  {blockReasonTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#9F1239] leading-relaxed">
                  {blockReasonDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {effectiveMode === 'partner' && partner && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sales')}
                    className="ora-btn-primary rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Ver Minhas Vendas e Comissões</span>
                  </button>
                )}
                <Link
                  href={getRafflePublicPath(raffle)}
                  className="ora-btn-secondary rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Página da Campanha</span>
                </Link>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* ABA 1 / FLUXO DE CHECKOUT DIRETO (QUANTIDADE -> CHECADOR -> PIX)*/
            /* =============================================================== */
            <div className="space-y-2.5 sm:space-y-3">
              {/* Cronômetro de 10 minutos ou aviso de expiração */}
              {normalizedDiscount.mode !== 'none' &&
                (discountExpired ? (
                  <div className="px-3 py-2 rounded-[14px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-[11px] sm:text-xs font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      Prazo de 10 minutos encerrado — o desconto desta rodada expirou.
                    </span>
                  </div>
                ) : (
                  pricing.discountPercent > 0 &&
                  discountStartedAtMs !== null && (
                    <div
                      className={`px-3 py-2 rounded-[14px] border text-[11px] sm:text-xs font-bold flex items-center justify-between gap-2 tabular-nums ${
                        discountSecondsLeft <= 120
                          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                          : 'bg-[#E8F7F0] border-[#B9E7D2] text-[#065F46]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {pricing.discountLabel || `${pricing.discountPercent}% OFF`} ativo!
                        </span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10.5px] font-extrabold shrink-0 ${
                          discountSecondsLeft <= 120
                            ? 'bg-white border-[#FDA4AF] text-[#BE123C] animate-pulse'
                            : 'bg-white border-[#A7F3D0] text-[#065F46]'
                        }`}
                      >
                        {formatCountdown(discountSecondsLeft)}
                      </span>
                    </div>
                  )
                ))}

              {/* ============================================================= */}
              {/* PASSO 1: QUANTAS COTAS O CLIENTE QUER?                        */}
              {/* ============================================================= */}
              {step === 'qty' && (
                <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
                  <div className="text-center space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider inline-block">
                      Etapa 1 de 3 • Quantidade
                    </span>
                    <h2 className="font-display font-bold text-lg sm:text-xl text-[#0D1729] tracking-[-0.03em] leading-tight">
                      Quantos números o cliente quer?
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#475872] leading-snug">
                      {buyerName.trim()
                        ? `Atendendo ${buyerName.trim()} — informe as cotas desta compra.`
                        : 'Informe quantas cotas serão vendidas para checar em tempo real.'}
                    </p>
                  </div>

                  {/* Banner da Promoção Ativa na Campanha */}
                  {normalizedDiscount.mode !== 'none' && !discountExpired && (
                    <div className="p-3 rounded-[18px] bg-gradient-to-r from-[#E8F7F0] via-[#F3FAF6] to-[#EDF5FF] border border-[#B9E7D2] space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-[var(--ora-blue,#00A868)] text-white flex items-center justify-center shrink-0 shadow-xs">
                          {normalizedDiscount.mode === 'roulette' ? (
                            <Dices className="w-4 h-4" />
                          ) : (
                            <Percent className="w-4 h-4" />
                          )}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ora-blue,#00A868)] block">
                            {normalizedDiscount.mode === 'progressive'
                              ? 'Desconto Progressivo Ativo'
                              : normalizedDiscount.mode === 'buy_x_pay_y'
                                ? `Promoção Compre ${normalizedDiscount.buy_x_qty}, Pague ${normalizedDiscount.pay_y_qty}`
                                : normalizedDiscount.mode === 'roulette'
                                  ? 'Roleta da Sorte Promocional'
                                  : 'Desconto Especial por Quantidade'}
                          </span>
                          <p className="text-[11px] sm:text-xs font-semibold text-[#0D1729] leading-snug">
                            {normalizedDiscount.mode === 'progressive' &&
                              'Quanto mais cotas o cliente levar, maior o desconto automático aplicado no PIX.'}
                            {normalizedDiscount.mode === 'buy_x_pay_y' &&
                              `A cada ${normalizedDiscount.buy_x_qty} cotas, o cliente paga apenas ${normalizedDiscount.pay_y_qty}!`}
                            {normalizedDiscount.mode === 'simple' &&
                              `A partir de ${normalizedDiscount.simple_min_tickets} cotas, aplica ${normalizedDiscount.simple_percent}% OFF automático.`}
                            {normalizedDiscount.mode === 'roulette' &&
                              `A partir de ${normalizedDiscount.roulette_min_tickets || 2} cotas, o cliente gira a Roleta da Sorte para ganhar até ${rouletteMaxOption}% OFF!`}
                          </p>
                        </div>
                      </div>

                      {normalizedDiscount.mode === 'progressive' &&
                        normalizedDiscount.tiers && (
                          <div className="flex flex-wrap gap-1.5 tabular-nums">
                            {normalizedDiscount.tiers.map((tier) => {
                              const isCurrentTier =
                                pricing.activeTier?.min_tickets ===
                                tier.min_tickets;
                              return (
                                <span
                                  key={tier.min_tickets}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                                    isCurrentTier
                                      ? 'bg-[var(--ora-blue,#00A868)] border-[var(--ora-blue,#00A868)] text-white'
                                      : 'bg-white border-[#D9E5F7] text-[#475872]'
                                  }`}
                                >
                                  <span>{tier.min_tickets}+ cotas</span>
                                  <span>•</span>
                                  <span>{tier.percent}% OFF</span>
                                </span>
                              );
                            })}
                          </div>
                        )}

                      {normalizedDiscount.mode === 'roulette' && (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
                            {rouletteOptions.map((pct, idx) => (
                              <span
                                key={`${pct}-${idx}`}
                                className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                                  rouletteWonPercent === pct
                                    ? 'bg-[#F59E0B] border-[#D97706] text-white'
                                    : 'bg-white border-[#D9E5F7] text-[#475872]'
                                }`}
                              >
                                {pct}% OFF
                              </span>
                            ))}
                          </div>

                          {rouletteHighestPercent > 0 &&
                            rouletteDistribution.minEligiblePercent && (
                              <p className="text-[11px] font-bold text-[#9A6700]">
                                Desconto anterior: {rouletteHighestPercent}% OFF • Novo giro concorre entre{' '}
                                {rouletteDistribution.minEligiblePercent}% e{' '}
                                {rouletteMaxOption}% OFF!
                              </p>
                            )}

                          {rouletteHighestPercent >= rouletteMaxOption &&
                            rouletteHighestPercent > 0 && (
                              <p className="text-[11px] font-bold text-[#065F46]">
                                Desconto máximo de {rouletteHighestPercent}% OFF já alcançado e mantido!
                              </p>
                            )}

                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 sm:p-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[18px] space-y-2.5">
                    <div className="flex items-center justify-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl bg-white border border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-xs"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="text-center min-w-[92px]">
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, availableCount)}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setQuantity(
                              Number.isNaN(val)
                                ? 1
                                : Math.min(
                                    Math.max(1, availableCount || raffle.total_tickets),
                                    Math.max(1, val)
                                  )
                            );
                          }}
                          className="w-20 text-center font-display font-bold text-3xl text-[var(--ora-blue,#00A868)] bg-transparent focus:outline-none tabular-nums leading-none"
                        />
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#526480] mt-0.5">
                          {quantity === 1 ? 'Número' : 'Números'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(
                              Math.max(1, availableCount || raffle.total_tickets),
                              q + 1
                            )
                          )
                        }
                        className="w-10 h-10 rounded-xl bg-white border border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-xs"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 tabular-nums">
                      {[1, 2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          disabled={availableCount > 0 && preset > availableCount}
                          onClick={() => setQuantity(preset)}
                          className={`px-3 py-1 rounded-full text-[11px] font-display font-bold border transition active:scale-95 cursor-pointer disabled:opacity-40 ${
                            quantity === preset
                              ? 'bg-[var(--ora-blue,#00A868)] text-white border-[var(--ora-blue,#00A868)] shadow-xs'
                              : 'bg-white text-[var(--ora-blue,#00A868)] border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)]'
                          }`}
                        >
                          {preset} {preset === 1 ? 'cota' : 'cotas'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botão interativo da Roleta quando desbloqueada na Etapa 1 */}
                  {normalizedDiscount.mode === 'roulette' &&
                    !discountExpired &&
                    pricing.canSpinRoulette && (
                      <button
                        type="button"
                        onClick={() => setShowRouletteModal(true)}
                        className="w-full py-3 px-4 rounded-full font-bold text-sm sm:text-base bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] hover:brightness-105 text-white border border-[#FBBF24]/70 shadow-[0_10px_24px_rgba(234,88,12,0.28)] flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                      >
                        <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Cliente: Girar Roleta da Sorte!</span>
                      </button>
                    )}

                  {/* Incentivo dinâmico de promoção (mesmo padrão da rifa pública) */}
                  {normalizedDiscount.mode !== 'none' && !discountExpired && (() => {
                    const freeQty =
                      (normalizedDiscount.buy_x_qty || 3) - (normalizedDiscount.pay_y_qty || 2);
                    let tone: 'amber' | 'green' | 'blue' | null = null;
                    let icon: 'dices' | 'percent' = 'percent';
                    let text = '';

                    if (normalizedDiscount.mode === 'roulette') {
                      icon = 'dices';
                      if (pricing.canSpinRoulette) {
                        tone = 'amber';
                        text =
                          rouletteHighestPercent > 0 && rouletteDistribution.minEligiblePercent
                            ? `Novo giro liberado! Gire para ganhar de ${rouletteDistribution.minEligiblePercent}% a ${rouletteMaxOption}% OFF!`
                            : `Roleta da Sorte desbloqueada! Gire para ganhar até ${rouletteMaxOption}% OFF!`;
                      } else if (pricing.discountPercent > 0) {
                        tone = 'green';
                        text =
                          pricing.discountPercent >= rouletteMaxOption
                            ? `${pricing.discountPercent}% OFF máximo ativo! Adicione mais cotas mantendo o desconto.`
                            : `${pricing.discountPercent}% OFF ativo (-R$ ${pricing.discountAmount.toFixed(2)}) · Adicione mais cotas mantendo o desconto!`;
                      } else if (pricing.needsMoreForRoulette > 0) {
                        tone = 'blue';
                        text =
                          rouletteHighestPercent > 0 && rouletteDistribution.minEligiblePercent
                            ? `Adicione +${pricing.needsMoreForRoulette} cota(s) para girar novamente (de ${rouletteDistribution.minEligiblePercent}% a ${rouletteMaxOption}% OFF).`
                            : `Adicione +${pricing.needsMoreForRoulette} cota(s) para desbloquear a Roleta da Sorte (até ${rouletteMaxOption}% OFF).`;
                      }
                    } else if (pricing.discountPercent > 0) {
                      tone = 'green';
                      const base =
                        normalizedDiscount.mode === 'buy_x_pay_y'
                          ? `Compre ${pricing.buyQty ?? normalizedDiscount.buy_x_qty}, Pague ${pricing.payQty ?? normalizedDiscount.pay_y_qty}: ${pricing.freeTickets} grátis! (-R$ ${pricing.discountAmount.toFixed(2)})`
                          : `${normalizedDiscount.mode === 'progressive' ? 'Progressivo' : 'Especial'}: ${pricing.discountPercent}% OFF! (-R$ ${pricing.discountAmount.toFixed(2)})`;
                      const next = pricing.nextTier
                        ? normalizedDiscount.mode === 'buy_x_pay_y'
                          ? ` · +${pricing.nextTier.remaining} → +${freeQty} grátis`
                          : ` · +${pricing.nextTier.remaining} → ${pricing.nextTier.percent}%`
                        : '';
                      text = base + next;
                    } else if (pricing.nextTier) {
                      tone = 'blue';
                      text =
                        normalizedDiscount.mode === 'buy_x_pay_y'
                          ? `Adicione +${pricing.nextTier.remaining} cota(s) para ganhar ${freeQty} cota(s) grátis (Compre ${normalizedDiscount.buy_x_qty}, Pague ${normalizedDiscount.pay_y_qty})!`
                          : `Adicione +${pricing.nextTier.remaining} cota(s) para desbloquear ${pricing.nextTier.percent}% OFF automático!`;
                    }

                    if (!tone || !text) return null;

                    const toneClass =
                      tone === 'amber'
                        ? 'bg-gradient-to-r from-[#FFF8EB] via-[#FEF3C7] to-[#FFFBEB] border-[#F5D08A] text-[#92400E] font-bold'
                        : tone === 'green'
                          ? 'bg-[#E8F7F0] border-[#B9E7D2] text-[#065F46] font-bold'
                          : 'bg-[#F5F9FF] border-[#D9E5F7] text-[#334661] font-semibold';
                    const iconClass =
                      tone === 'amber'
                        ? 'text-[#D97706]'
                        : tone === 'green'
                          ? 'text-[#00A868]'
                          : icon === 'dices'
                            ? 'text-[#0869F5]'
                            : 'text-[#00A868]';

                    return (
                      <div
                        role="status"
                        aria-live="polite"
                        className={`w-full rounded-[14px] px-3 py-2 border flex items-center justify-center gap-2 text-[11px] sm:text-xs animate-in fade-in duration-300 ${toneClass}`}
                      >
                        {icon === 'dices' ? (
                          <Dices className={`w-4 h-4 shrink-0 ${iconClass}`} />
                        ) : (
                          <Percent className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
                        )}
                        <span className="leading-snug text-center animate-pulse">{text}</span>
                      </div>
                    );
                  })()}

                  <div className="px-3.5 py-2.5 rounded-[16px] bg-[var(--ora-surface-alt,#E8F7F0)] border border-[var(--ora-border-strong,#B9E7D2)] flex items-center justify-between tabular-nums">
                    <div>
                      <span className="text-xs font-bold text-[#475872] block leading-tight">
                        {quantity} cota(s) × R$ {unitPrice.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#526480] leading-tight">
                        {pricing.discountPercent > 0
                          ? pricing.discountLabel ||
                            `Desconto de ${pricing.discountPercent}% OFF aplicado!`
                          : 'Valor somado automático'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ora-blue-deep,#008F58)] block leading-none">
                        Total a Pagar
                      </span>
                      {pricing.discountPercent > 0 && (
                        <span className="text-[11px] text-[#64748B] line-through block leading-tight">
                          R$ {pricing.originalAmount.toFixed(2)}
                        </span>
                      )}
                      <span className="font-display font-bold text-xl sm:text-2xl text-[var(--ora-blue,#00A868)] leading-tight">
                        R$ {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {availableCount <= 0 ? (
                    <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-bold text-center">
                      Todas as cotas desta campanha já estão reservadas ou vendidas.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartChecking}
                      className="ora-btn-primary w-full py-3 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Verificar Disponibilidade dos {quantity} Números</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* PASSO 2: CHECADOR PASSO A PASSO                               */}
              {/* ============================================================= */}
              {step === 'check' && (
                <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('qty')}
                      className="text-xs font-bold text-[#526480] hover:text-[#0D1729] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Mudar quantidade ({quantity})</span>
                    </button>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-[11px] font-bold tabular-nums">
                      Verificando {Math.min(currentSlotIndex, quantity)} de {quantity}
                    </span>
                  </div>

                  {/* Painel Visual de Slots com Vzinho */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#526480] block">
                      Números desta venda ({verifiedNumbers.length}/{quantity} aprovados):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-[68px] overflow-y-auto tabular-nums">
                      {Array.from({ length: quantity }, (_, idx) => {
                        const approvedNum = verifiedNumbers[idx];
                        const isCurrent = idx === verifiedNumbers.length;

                        if (approvedNum !== undefined) {
                          return (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#ECFDF5] border border-[#10B981] text-[#065F46] font-display font-bold text-xs shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                              <span>#{approvedNum.toString().padStart(3, '0')}</span>
                              <button
                                type="button"
                                onClick={() => removeVerifiedNumber(approvedNum)}
                                title="Trocar este número"
                                className="ml-0.5 text-[#059669] hover:text-[#DC2626] cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-display font-bold transition ${
                              isCurrent
                                ? 'bg-[var(--ora-surface-alt,#E8F7F0)] border-[var(--ora-blue,#00A868)] text-[var(--ora-blue,#00A868)] shadow-xs'
                                : 'bg-[#F8FAFC] border-dashed border-[#CBD5E1] text-[#94A3B8]'
                            }`}
                          >
                            <span>{idx + 1}º Número</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {lastApprovedNumber !== null && !unavailableAlert && (
                    <div className="px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5 text-[#065F46] animate-in fade-in duration-150">
                      <div className="w-7 h-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="text-xs leading-snug">
                        <strong>
                          Número #{lastApprovedNumber.toString().padStart(3, '0')} disponível! ✓
                        </strong>{' '}
                        <span className="text-[11px] text-[#047857]">
                          Digite o <strong>{currentSlotIndex}º número</strong>.
                        </span>
                      </div>
                    </div>
                  )}

                  {unavailableAlert ? (
                    <div className="p-3.5 rounded-[18px] bg-[#FFF1F2] border border-[#F43F5E] space-y-2.5 text-left animate-in zoom-in-95 duration-150">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0 border border-[#FECDD3]">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9.5px] font-bold uppercase tracking-wider">
                            {unavailableAlert.reason === 'paid'
                              ? 'Número Já Vendido'
                              : unavailableAlert.reason === 'pending'
                                ? 'Número Já Reservado'
                                : 'Número Indisponível'}
                          </span>
                          <h3 className="font-display font-bold text-sm sm:text-base text-[#881337] leading-tight">
                            O número #{unavailableAlert.number.toString().padStart(3, '0')} não está disponível!
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[#9F1239] leading-snug">
                            {unavailableAlert.message}
                          </p>
                        </div>
                      </div>

                      {unavailableAlert.suggestions.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-white/90 border border-[#FECDD3] space-y-1.5">
                          <span className="text-[10.5px] font-bold text-[#881337] block">
                            Vizinhos livres agora:
                          </span>
                          <div className="flex flex-wrap gap-1.5 tabular-nums">
                            {unavailableAlert.suggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => {
                                  setUnavailableAlert(null);
                                  handleCheckNumber(sug);
                                }}
                                className="px-2.5 py-1 rounded-full bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#10B981] text-[#065F46] text-[11px] font-display font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                              >
                                <Check className="w-3 h-3 text-[#059669]" />
                                <span>#{sug.toString().padStart(3, '0')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleUnderstandUnavailable}
                        className="w-full py-2.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Entendi, escolher outro número</span>
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCheckNumber();
                      }}
                      className="p-3.5 bg-[#F5F9FF] border border-[var(--ora-border-strong,#B9E7D2)] rounded-[18px] space-y-2.5"
                    >
                      <div className="text-center space-y-0.5">
                        <label
                          htmlFor="checkNumberInput"
                          className="block font-display font-bold text-base sm:text-lg text-[#0D1729]"
                        >
                          Qual é o {currentSlotIndex}º número escolhido?
                        </label>
                        <span className="text-[11px] text-[#526480] block">
                          Digite de <strong>1</strong> a{' '}
                          <strong>{raffle.total_tickets}</strong> para checar disponibilidade
                        </span>
                      </div>

                      <input
                        ref={inputRef}
                        id="checkNumberInput"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={raffle.total_tickets}
                        placeholder={`Ex: ${Math.min(12, raffle.total_tickets)}`}
                        value={numberInput}
                        onChange={(e) => setNumberInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border-2 border-[var(--ora-border-strong,#B9E7D2)] focus:border-[var(--ora-blue,#00A868)] rounded-xl text-center font-display font-bold text-2xl text-[#0D1729] placeholder-[#94A3B8] focus:outline-none tabular-nums shadow-inner"
                      />

                      <button
                        type="submit"
                        disabled={!numberInput.trim() || isCheckingNumber}
                        className="ora-btn-primary w-full py-3 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm disabled:opacity-45 active:scale-[0.98] transition cursor-pointer"
                      >
                        {isCheckingNumber ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verificando disponibilidade...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>
                              Checar Número{' '}
                              {numberInput.trim()
                                ? `#${numberInput.trim().padStart(3, '0')}`
                                : ''}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* PASSO 3: DADOS DO COMPRADOR, ROLETA (SE PENDENTE) E RESERVA   */}
              {/* ============================================================= */}
              {step === 'reserve' && (
                <div className="space-y-2.5 sm:space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-bold uppercase tracking-wider inline-block">
                        Etapa 2 de 3 • Todos Disponíveis!
                      </span>
                      <h2 className="font-display font-bold text-lg sm:text-xl text-[#0D1729] tracking-[-0.03em] leading-tight mt-0.5">
                        {verifiedNumbers.length}{' '}
                        {verifiedNumbers.length === 1
                          ? 'Número Verificado'
                          : 'Números Verificados'}!
                      </h2>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[16px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#065F46]">
                      <span>
                        Cotas livres · Total:{' '}
                        {pricing.discountPercent > 0 && (
                          <span className="line-through text-[#64748B] mr-1">
                            R$ {pricing.originalAmount.toFixed(2)}
                          </span>
                        )}
                        <strong className="text-[var(--ora-blue,#00A868)]">
                          R$ {totalAmount.toFixed(2)}
                        </strong>
                        {pricing.discountPercent > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white text-[#059669] text-[9.5px]">
                            -{pricing.discountPercent}% OFF
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('check')}
                        className="text-[var(--ora-blue,#00A868)] hover:underline cursor-pointer"
                      >
                        Alterar números
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto tabular-nums">
                      {verifiedNumbers.map((num) => (
                        <span
                          key={num}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#10B981] text-[#065F46] font-display font-bold text-xs shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 text-[#059669]" />
                          <span>#{num.toString().padStart(3, '0')}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Opção de girar a Roleta antes de gerar o PIX caso ainda não tenha girado */}
                  {normalizedDiscount.mode === 'roulette' &&
                    !discountExpired &&
                    pricing.canSpinRoulette && (
                      <button
                        type="button"
                        onClick={() => setShowRouletteModal(true)}
                        className="w-full py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] hover:brightness-105 text-white border border-[#FBBF24]/70 shadow-[0_8px_20px_rgba(234,88,12,0.25)] flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                      >
                        <Dices className="w-4 h-4" />
                        <span>Cliente: Girar Roleta da Sorte antes do PIX!</span>
                      </button>
                    )}

                  {reserveError && (
                    <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold">
                      {reserveError}
                    </div>
                  )}

                  <form
                    onSubmit={handleConfirmReservationAndGeneratePix}
                    noValidate
                    className="space-y-2.5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-[#14213A] mb-1">
                        Nome do Comprador *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nome completo do cliente"
                        value={buyerName}
                        onChange={(e) => {
                          setBuyerName(e.target.value);
                          if (buyerFieldErrors.name) {
                            setBuyerFieldErrors((prev) => ({
                              ...prev,
                              name: undefined,
                            }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-[14px] text-sm font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white ${
                          buyerFieldErrors.name
                            ? 'bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]'
                            : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[var(--ora-blue,#00A868)]'
                        }`}
                      />
                      {buyerFieldErrors.name && (
                        <p className="mt-1 text-[11px] font-semibold text-[#BE123C] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{buyerFieldErrors.name}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14213A] mb-1">
                        WhatsApp do Comprador com DDD *
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={15}
                        required
                        placeholder="(11) 99999-9999"
                        value={buyerPhone}
                        onChange={(e) => {
                          setBuyerPhone(formatBrazilMobile(e.target.value));
                          if (buyerFieldErrors.phone) {
                            setBuyerFieldErrors((prev) => ({
                              ...prev,
                              phone: undefined,
                            }));
                          }
                        }}
                        onBlur={() => {
                          if (buyerPhone.trim()) {
                            const phoneErr = getBrazilMobileError(buyerPhone);
                            if (phoneErr) {
                              setBuyerFieldErrors((prev) => ({
                                ...prev,
                                phone: phoneErr,
                              }));
                            }
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-[14px] text-sm font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white ${
                          buyerFieldErrors.phone
                            ? 'bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]'
                            : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[var(--ora-blue,#00A868)]'
                        }`}
                      />
                      {buyerFieldErrors.phone && (
                        <p className="mt-1 text-[11px] font-semibold text-[#BE123C] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{buyerFieldErrors.phone}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReservation}
                      className="ora-btn-primary w-full py-3 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition cursor-pointer"
                    >
                      {isSubmittingReservation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            Reservando os {verifiedNumbers.length} números...
                          </span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>
                            Reservar Cotas e Gerar PIX (R$ {totalAmount.toFixed(2)})
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ============================================================= */}
              {/* PASSO 4: PAGAMENTO PIX COM VALOR SOMADO                       */}
              {/* ============================================================= */}
              {step === 'pix' && (
                <div className="space-y-2.5 text-center animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between gap-2 text-left">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[10px] font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {reservationConfirmed
                            ? `${verifiedNumbers.length} Cota(s) Reservada(s)!`
                            : 'PIX Pronto!'}
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em] tabular-nums mt-0.5 leading-tight">
                        Total: R$ {displayedPixAmount.toFixed(2)}
                      </h2>
                    </div>

                    {verifiedNumbers.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1 max-w-[170px] max-h-[52px] overflow-y-auto tabular-nums">
                        {verifiedNumbers.map((n) => (
                          <span
                            key={n}
                            className="px-2 py-0.5 rounded-md bg-[#ECFDF5] border border-[#10B981] text-[#065F46] text-[11px] font-display font-bold inline-flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3 text-[#059669]" />#
                            {n.toString().padStart(3, '0')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {pixQrDataUrl && (
                    <div className="mx-auto w-32 h-32 sm:w-36 sm:h-36 p-2 bg-white rounded-[18px] border-2 border-[var(--ora-border-strong,#B9E7D2)] shadow-sm flex items-center justify-center">
                      <img
                        src={pixQrDataUrl}
                        alt="QR Code PIX com valor somado"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={copyPixPayload}
                    className={`w-full py-2.5 sm:py-3 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-sm ${
                      copiedPayload
                        ? 'bg-[#059669] text-white'
                        : 'ora-btn-primary'
                    }`}
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          PIX Copia e Cola Copiado! (R$ {displayedPixAmount.toFixed(2)})
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>
                          Copiar PIX Copia e Cola (R$ {displayedPixAmount.toFixed(2)})
                        </span>
                      </>
                    )}
                  </button>

                  <div className="text-left bg-[#FFFBEB] border border-[#FDE68A] rounded-[16px] p-2.5 space-y-1 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[#92400E] font-display font-bold text-[11px]">
                      <span>📸</span>
                      <span>ATENÇÃO: COMPROVANTE DE PAGAMENTO</span>
                    </div>
                    <p className="text-[11px] text-[#78350F] leading-snug">
                      Após realizar o Pix, <strong>salve o comprovante</strong> e clique abaixo para enviá-lo no WhatsApp.
                    </p>
                    <p className="pt-1 border-t border-[#FDE68A]/70 text-[11px] text-[#065F46] font-medium leading-snug">
                      ✅ Seus números serão confirmados pelo organizador após conferência. 🍀 Boa sorte!
                    </p>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 sm:py-3 px-4 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Notificação e Comprovante no WhatsApp</span>
                  </a>
                </div>
              )}

              {/* ============================================================= */}
              {/* CONTROLES DE ATENDIMENTO CONTÍNUO / TROCA DE CLIENTE          */}
              {/* ============================================================= */}
              {hasActiveAttendanceControls && (
                <div className="pt-2.5 border-t border-[#E0E9F7] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCustomerBuyMore}
                    className="ora-btn-secondary w-full py-2.5 px-3 rounded-full text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span>
                      {normalizedDiscount.mode !== 'none'
                        ? 'Cliente deseja comprar mais? (Tentar novo desconto)'
                        : 'Cliente deseja comprar mais cotas'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForNextCustomer}
                    className="ora-btn-secondary w-full py-2.5 px-3 rounded-full text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)] shrink-0" />
                    <span>Novo Cliente</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Modal da Roleta Promocional de Desconto */}
      <DiscountRouletteModal
        isOpen={showRouletteModal}
        onClose={() => setShowRouletteModal(false)}
        options={rouletteOptions}
        brandColor={raffle.brand_color}
        alreadyWonPercent={rouletteWonPercent}
        minExclusivePercent={
          rouletteHighestPercent > 0 ? rouletteHighestPercent : null
        }
        spinRound={rouletteSpinRound}
        onWin={(pct) => {
          setRouletteWonPercent(pct);
          if (discountStartedAtMs === null) {
            setDiscountStartedAtMs(Date.now());
            setDiscountSecondsLeft(Math.ceil(DISCOUNT_COUNTDOWN_MS / 1000));
          }
        }}
      />

      {/* Modal de Cartela Física PDF A4 (restrito a <= 200 cotas) */}
      {canPrintPhysicalCard && (
        <PhysicalCardModal
          raffle={raffle}
          paidTicketNumbers={paidTicketNumbers}
          pendingTicketNumbers={pendingTicketNumbers}
          isOpen={showPhysicalCardModal}
          onClose={() => setShowPhysicalCardModal(false)}
        />
      )}
    </div>
  );
}
