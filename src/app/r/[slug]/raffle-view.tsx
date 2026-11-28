'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Trophy,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Dices,
  Search,
  ShoppingCart,
  Loader2,
  X,
  Plus,
  Printer,
  Sparkles,
  QrCode as QrIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sliders,
  Pencil,
  Eye,
  AlertCircle,
  AlertTriangle,
  MinusCircle,
  Percent,
  Tag,
  Clock,
} from 'lucide-react';

const DISCOUNT_COUNTDOWN_MS = 10 * 60 * 1000; // 10 minutos

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface RouletteTrackedOrder {
  orderId: string;
  discountPercent: number;
  createdAt: number;
}

interface StoredRouletteState {
  activeSpinPercent: number | null;
  activeOrderId: string | null;
  orders: RouletteTrackedOrder[];
  highestPaidPercent: number;
  spinsCount: number;
}

const EMPTY_ROULETTE_STATE: StoredRouletteState = {
  activeSpinPercent: null,
  activeOrderId: null,
  orders: [],
  highestPaidPercent: 0,
  spinsCount: 0,
};

import {
  createOrder,
  subscribeToRaffle,
  subscribeToRaffleOrders,
  computeOccupiedTicketsFromOrders,
} from '@/lib/firebase/raffles';
import {
  calculateDiscountedPricing,
  getDiscountForFixedQty,
  getRouletteSpinDistribution,
  normalizeDiscountConfig,
} from '@/lib/discounts';
import { getRaffleAdminPath } from '@/lib/raffle-urls';
import DiscountRouletteModal from '@/components/discount-roulette-modal';
import { generateBrandInitials } from '@/lib/image-processor';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { generatePixBrCode } from '@/lib/pix-brcode';
import { formatBrazilMobile, getBrazilMobileError } from '@/lib/validators';
import PhysicalCardModal from '@/components/physical-card-modal';
import EditRaffleModal from '@/components/edit-raffle-modal';
import { BuyerParticipationTermsModal } from '@/components/terms-modals';
import {
  RaffleFomoToast,
  RaffleScarcityWidget,
} from '@/components/raffle-fomo-widgets';
import type { Raffle, OccupiedTicket, Order } from '@/types/database.types';

interface RafflePublicViewProps {
  raffle: Raffle;
  initialOccupiedTickets: OccupiedTicket[];
}

function PixIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.074 3.326a3.83 3.83 0 0 0-5.42 0L9.43 5.55a.77.77 0 0 0 0 1.085l2.946 2.946a.767.767 0 0 0 1.085 0l2.73-2.73a1.536 1.536 0 0 1 2.172 0 1.536 1.536 0 0 1 0 2.172l-2.73 2.73a.767.767 0 0 0 0 1.085l2.946 2.946a.767.767 0 0 0 1.085 0l2.224-2.224a3.83 3.83 0 0 0 0-5.42L17.074 3.326zM6.926 3.326a3.83 3.83 0 0 0-5.42 0 3.83 3.83 0 0 0 0 5.42l2.224 2.224a.767.767 0 0 0 1.085 0l2.946-2.946a.767.767 0 0 0 0-1.085l-2.73-2.73a1.536 1.536 0 0 1 0-2.172 1.536 1.536 0 0 1 2.172 0l2.73 2.73a.767.767 0 0 0 1.085 0l2.946-2.946a.767.767 0 0 0 0-1.085L6.926 3.326zm-3.6 10.748a3.83 3.83 0 0 0-3.326 3.852 3.83 3.83 0 0 0 1.102 2.748l4.814 4.814a3.83 3.83 0 0 0 5.42 0l2.224-2.224a.767.767 0 0 0 0-1.085l-2.946-2.946a.767.767 0 0 0-1.085 0l-2.73 2.73a1.536 1.536 0 0 1-2.172 0 1.536 1.536 0 0 1 0-2.172l2.73-2.73a.767.767 0 0 0 0-1.085l-2.946-2.946a.767.767 0 0 0-1.085 0L3.326 14.074zm13.748 0a.767.767 0 0 0-1.085 0l-2.946 2.946a.767.767 0 0 0 0 1.085l2.73 2.73a1.536 1.536 0 0 1 0 2.172 1.536 1.536 0 0 1-2.172 0l-2.73-2.73a.767.767 0 0 0-1.085 0l-2.946 2.946a.767.767 0 0 0 0 1.085l2.224 2.224a3.83 3.83 0 0 0 5.42 0l4.814-4.814a3.83 3.83 0 0 0 0-5.42l-2.224-2.224z" />
    </svg>
  );
}

export default function RafflePublicView({
  raffle: initialRaffle,
  initialOccupiedTickets,
}: RafflePublicViewProps) {
  const { user, profile } = useAuth();
  const [raffle, setCurrentRaffle] = useState<Raffle>(initialRaffle);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>(
    initialOccupiedTickets
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Identificação do Perfil (Criador Oficial vs Comprador Visitante)
  const userEmail = user?.email?.toLowerCase().trim() || '';
  const isMaster = userEmail === MASTER_EMAIL || profile?.role === 'master';
  const isCreator = Boolean(user && (user.uid === raffle.user_id || isMaster));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipationTerms, setShowParticipationTerms] = useState(false);

  // Múltiplas Fotos do Prêmio & Carrossel Interativo
  const allPrizeImages: string[] = useMemo(() => {
    if (raffle.prize_images && raffle.prize_images.length > 0) {
      return raffle.prize_images;
    }
    if (raffle.prize_image_url) {
      return [raffle.prize_image_url];
    }
    return [];
  }, [raffle.prize_images, raffle.prize_image_url]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  // Auto-slide suave a cada 4.5s quando há mais de 1 foto
  useEffect(() => {
    if (allPrizeImages.length <= 1 || isHoveringImage) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allPrizeImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [allPrizeImages.length, isHoveringImage]);

  // Efeito celebrativo ao abrir página de rifa sorteada/concluída
  useEffect(() => {
    if (raffle.status === 'completed' && raffle.winner_ticket != null) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#0869F5', '#00A868', '#FFFFFF', '#F59E0B'],
        });
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [raffle.status, raffle.winner_ticket]);

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [conflictingTicket, setConflictingTicket] = useState<number | null>(null);
  const [manualReplacementInput, setManualReplacementInput] = useState('');

  // Success / Payment screen state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    tickets: number[];
    total: number;
    originalAmount?: number;
    discountPercent?: number;
    discountAmount?: number;
    discountLabel?: string | null;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBrCode, setCopiedBrCode] = useState(false);
  const [pixBrCodePayload, setPixBrCodePayload] = useState<string>('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [showPhysicalCardModal, setShowPhysicalCardModal] = useState(false);
  const [quickPickFeedback, setQuickPickFeedback] = useState<{
    text: string;
    type: 'add' | 'remove' | 'info';
  } | null>(null);
  const [isFeedbackFading, setIsFeedbackFading] = useState(false);
  const feedbackFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buyerFieldErrors, setBuyerFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showDiscountRoulette, setShowDiscountRoulette] = useState(false);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [rouletteState, setRouletteState] = useState<StoredRouletteState>(
    EMPTY_ROULETTE_STATE
  );

  function persistRouletteState(next: StoredRouletteState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        `fastrifa_roulette_state_${raffle.id}`,
        JSON.stringify(next)
      );
    } catch {}
  }

  function triggerQuickPickFeedback(
    text: string,
    type: 'add' | 'remove' | 'info' = 'add'
  ) {
    if (feedbackFadeTimerRef.current) clearTimeout(feedbackFadeTimerRef.current);
    if (feedbackClearTimerRef.current) clearTimeout(feedbackClearTimerRef.current);

    setIsFeedbackFading(false);
    setQuickPickFeedback({ text, type });

    feedbackFadeTimerRef.current = setTimeout(() => {
      setIsFeedbackFading(true);
    }, 1800);

    feedbackClearTimerRef.current = setTimeout(() => {
      setQuickPickFeedback(null);
      setIsFeedbackFading(false);
    }, 2300);
  }

  useEffect(() => {
    return () => {
      if (feedbackFadeTimerRef.current) clearTimeout(feedbackFadeTimerRef.current);
      if (feedbackClearTimerRef.current) clearTimeout(feedbackClearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`fastrifa_roulette_state_${raffle.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredRouletteState>;
        setRouletteState({
          activeSpinPercent:
            typeof parsed.activeSpinPercent === 'number' && parsed.activeSpinPercent > 0
              ? parsed.activeSpinPercent
              : null,
          activeOrderId:
            typeof parsed.activeOrderId === 'string' ? parsed.activeOrderId : null,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          highestPaidPercent:
            typeof parsed.highestPaidPercent === 'number' && parsed.highestPaidPercent > 0
              ? parsed.highestPaidPercent
              : 0,
          spinsCount:
            typeof parsed.spinsCount === 'number' && parsed.spinsCount >= 0
              ? parsed.spinsCount
              : 0,
        });
        return;
      }

      const legacySaved = sessionStorage.getItem(`fastrifa_roulette_${raffle.id}`);
      if (legacySaved) {
        const parsed = parseInt(legacySaved, 10);
        if (parsed > 0 && parsed <= 80) {
          const migrated: StoredRouletteState = {
            ...EMPTY_ROULETTE_STATE,
            activeSpinPercent: parsed,
            spinsCount: 1,
          };
          setRouletteState(migrated);
          localStorage.setItem(
            `fastrifa_roulette_state_${raffle.id}`,
            JSON.stringify(migrated)
          );
        }
      }
    } catch {}
  }, [raffle.id]);

  function handleRouletteWin(percent: number) {
    setRouletteState((prev) => {
      const next: StoredRouletteState = {
        ...prev,
        activeSpinPercent: percent,
        activeOrderId: null,
        spinsCount: prev.spinsCount + 1,
      };
      persistRouletteState(next);
      return next;
    });
  }

  // Sincronização em tempo real da rifa e cotas ocupadas (reservas e aprovações ao vivo)
  useEffect(() => {
    const unsubRaffle = subscribeToRaffle(raffle.id, (liveRaffle) => {
      if (liveRaffle) {
        setCurrentRaffle((prev) => ({
          ...liveRaffle,
          brand_color: prev.brand_color ?? liveRaffle.brand_color,
          brand_logo_url: prev.brand_logo_url ?? liveRaffle.brand_logo_url,
          brand_name: prev.brand_name ?? liveRaffle.brand_name,
        }));
      }
    });

    const unsubOrders = subscribeToRaffleOrders(raffle.id, (orders) => {
      setLiveOrders(orders);
      const liveOccupied = computeOccupiedTicketsFromOrders(orders);
      setOccupiedTickets(liveOccupied);

      const liveOccupiedSet = new Set(liveOccupied.map((t) => t.ticket_number));
      setSelectedTickets((prev) => {
        const filtered = prev.filter((num) => !liveOccupiedSet.has(num));
        if (filtered.length !== prev.length) {
          triggerQuickPickFeedback(
            'Algumas cotas selecionadas acabaram de ser reservadas por outro participante.',
            'info'
          );
        }
        return filtered;
      });
    });

    return () => {
      unsubRaffle();
      unsubOrders();
    };
  }, [raffle.id]);

  // Set of occupied numbers
  const occupiedMap = useMemo(() => {
    const map = new Map<number, 'pending' | 'paid'>();
    occupiedTickets.forEach((t) => map.set(t.ticket_number, t.status));
    return map;
  }, [occupiedTickets]);

  const selectedSet = useMemo(() => new Set(selectedTickets), [selectedTickets]);

  // Available numbers array
  const allAvailableNumbers = useMemo(() => {
    const available: number[] = [];
    for (let i = 1; i <= raffle.total_tickets; i++) {
      if (!occupiedMap.has(i) && !selectedSet.has(i)) {
        available.push(i);
      }
    }
    return available;
  }, [raffle.total_tickets, occupiedMap, selectedSet]);

  // Calculate statistics
  const paidTicketNumbers = useMemo(
    () =>
      occupiedTickets
        .filter((t) => t.status === 'paid')
        .map((t) => t.ticket_number),
    [occupiedTickets]
  );
  const pendingTicketNumbers = useMemo(
    () =>
      occupiedTickets
        .filter((t) => t.status === 'pending')
        .map((t) => t.ticket_number),
    [occupiedTickets]
  );
  const paidCount = paidTicketNumbers.length;
  const pendingCount = pendingTicketNumbers.length;
  const progressPercent = Math.min(
    100,
    Math.round((paidCount / raffle.total_tickets) * 100)
  );
  const primaryBrandColor = raffle.brand_color === 'green' ? '#00A868' : '#0869F5';
  const normalizedDiscount = useMemo(
    () => normalizeDiscountConfig(raffle.discount_config),
    [raffle.discount_config]
  );

  const [discountExpiresAt, setDiscountExpiresAt] = useState<number | null>(null);
  const [discountSecondsLeft, setDiscountSecondsLeft] = useState<number>(0);
  const [isDiscountExpiredPermanently, setIsDiscountExpiredPermanently] =
    useState(false);

  // Carrega countdown de 10 minutos salvo por rifa (se já expirou, perde o desconto definitivamente)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`fastrifa_discount_timer_${raffle.id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        expiresAt?: number;
        expiredPermanently?: boolean;
      };
      if (
        parsed.expiredPermanently ||
        (parsed.expiresAt && Date.now() >= parsed.expiresAt)
      ) {
        setIsDiscountExpiredPermanently(true);
        setDiscountExpiresAt(parsed.expiresAt || Date.now());
        setDiscountSecondsLeft(0);
        localStorage.setItem(
          `fastrifa_discount_timer_${raffle.id}`,
          JSON.stringify({
            expiresAt: parsed.expiresAt || Date.now(),
            expiredPermanently: true,
          })
        );
      } else if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
        setDiscountExpiresAt(parsed.expiresAt);
        setDiscountSecondsLeft(Math.ceil((parsed.expiresAt - Date.now()) / 1000));
      }
    } catch {}
  }, [raffle.id]);

  // Sincroniza pagamento confirmado no Firestore para liberar novo giro progressivo da roleta
  useEffect(() => {
    if (liveOrders.length === 0) return;

    const orderMap = new Map(liveOrders.map((o) => [o.id, o]));
    let maxPaidFromOrders = 0;

    for (const tracked of rouletteState.orders) {
      const liveOrder = orderMap.get(tracked.orderId);
      if (liveOrder?.status === 'paid') {
        const pct =
          typeof liveOrder.discount_percent === 'number' && liveOrder.discount_percent > 0
            ? liveOrder.discount_percent
            : tracked.discountPercent;
        if (pct > maxPaidFromOrders) {
          maxPaidFromOrders = pct;
        }
      }
    }

    const activeLiveOrder = rouletteState.activeOrderId
      ? orderMap.get(rouletteState.activeOrderId)
      : undefined;
    const isActiveOrderPaid = activeLiveOrder?.status === 'paid';
    const nextHighestPaid = Math.max(
      rouletteState.highestPaidPercent,
      maxPaidFromOrders
    );

    if (isActiveOrderPaid || nextHighestPaid > rouletteState.highestPaidPercent) {
      const nextState: StoredRouletteState = {
        ...rouletteState,
        highestPaidPercent: nextHighestPaid,
        ...(isActiveOrderPaid
          ? { activeOrderId: null, activeSpinPercent: null }
          : {}),
      };
      setRouletteState(nextState);
      persistRouletteState(nextState);

      if (isActiveOrderPaid) {
        setDiscountExpiresAt(null);
        setDiscountSecondsLeft(0);
        setIsDiscountExpiredPermanently(false);
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`fastrifa_discount_timer_${raffle.id}`);
          } catch {}
        }
      }
    }
  }, [liveOrders, rouletteState, raffle.id]);

  const rouletteOptions = useMemo(
    () => normalizedDiscount.roulette_options || [5, 10, 15, 20],
    [normalizedDiscount.roulette_options]
  );

  const rouletteDistribution = useMemo(
    () =>
      getRouletteSpinDistribution(
        rouletteOptions,
        rouletteState.highestPaidPercent > 0 ? rouletteState.highestPaidPercent : null
      ),
    [rouletteOptions, rouletteState.highestPaidPercent]
  );

  const hasReachedRouletteCap =
    rouletteState.highestPaidPercent >= rouletteDistribution.maxOption;

  const hasPendingRouletteOrder = useMemo(
    () =>
      Boolean(
        rouletteState.activeOrderId &&
          liveOrders.some(
            (o) => o.id === rouletteState.activeOrderId && o.status === 'pending'
          )
      ),
    [rouletteState.activeOrderId, liveOrders]
  );

  const effectiveRoulettePercent = useMemo(() => {
    if (rouletteState.activeSpinPercent != null && rouletteState.activeSpinPercent > 0) {
      return rouletteState.activeSpinPercent;
    }
    if (hasReachedRouletteCap) {
      return rouletteDistribution.maxOption;
    }
    return null;
  }, [
    rouletteState.activeSpinPercent,
    hasReachedRouletteCap,
    rouletteDistribution.maxOption,
  ]);

  const rawPricing = useMemo(
    () =>
      calculateDiscountedPricing({
        ticketCount: selectedTickets.length,
        unitPrice: raffle.ticket_price,
        config: normalizedDiscount,
        rouletteWonPercent: effectiveRoulettePercent,
      }),
    [selectedTickets.length, raffle.ticket_price, normalizedDiscount, effectiveRoulettePercent]
  );

  const pricing = useMemo(() => {
    if (!isDiscountExpiredPermanently) return rawPricing;
    return calculateDiscountedPricing({
      ticketCount: selectedTickets.length,
      unitPrice: raffle.ticket_price,
      config: { mode: 'none' },
      rouletteWonPercent: null,
    });
  }, [isDiscountExpiredPermanently, rawPricing, selectedTickets.length, raffle.ticket_price]);

  // Inicia countdown de 10 min na primeira vez que um desconto é concedido para esta rifa
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      normalizedDiscount.mode !== 'none' &&
      !isDiscountExpiredPermanently &&
      !discountExpiresAt &&
      rawPricing.discountPercent > 0
    ) {
      const expiresAt = Date.now() + DISCOUNT_COUNTDOWN_MS;
      setDiscountExpiresAt(expiresAt);
      setDiscountSecondsLeft(Math.ceil(DISCOUNT_COUNTDOWN_MS / 1000));
      try {
        localStorage.setItem(
          `fastrifa_discount_timer_${raffle.id}`,
          JSON.stringify({ expiresAt, expiredPermanently: false })
        );
      } catch {}
    }
  }, [
    normalizedDiscount.mode,
    isDiscountExpiredPermanently,
    discountExpiresAt,
    rawPricing.discountPercent,
    raffle.id,
  ]);

  // Tick a cada 1 segundo até expirar definitivamente em 10 minutos
  useEffect(() => {
    if (!discountExpiresAt || isDiscountExpiredPermanently) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((discountExpiresAt - Date.now()) / 1000)
      );
      setDiscountSecondsLeft(remaining);
      if (remaining <= 0) {
        setIsDiscountExpiredPermanently(true);
        try {
          localStorage.setItem(
            `fastrifa_discount_timer_${raffle.id}`,
            JSON.stringify({ expiresAt: discountExpiresAt, expiredPermanently: true })
          );
        } catch {}
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [discountExpiresAt, isDiscountExpiredPermanently, raffle.id]);

  const totalPrice = pricing.finalAmount.toFixed(2);

  function fireCelebrationConfetti(mode: 'order' | 'quick' | 'copy' = 'order') {
    try {
      const isGreen = raffle.brand_color === 'green';
      const palette = isGreen
        ? ['#059669', '#10B981', '#F59E0B', '#34D399', '#FBBF24']
        : ['#0869F5', '#3888FF', '#F59E0B', '#60A5FA', '#FBBF24'];

      if (mode === 'order') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.25, y: 0.6 },
          colors: palette,
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { x: 0.75, y: 0.6 },
            colors: palette,
          });
        }, 160);
      } else if (mode === 'copy') {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.68 },
          colors: palette,
        });
      } else {
        confetti({
          particleCount: 24,
          spread: 45,
          scalar: 0.85,
          origin: { y: 0.55 },
          colors: palette,
        });
      }
    } catch {}
  }

  // Gera automaticamente o QR Code PIX com valor somado quando o pedido é confirmado
  useEffect(() => {
    if (!confirmedOrder) {
      setPixBrCodePayload('');
      setPixQrCodeUrl('');
      return;
    }

    const payload = generatePixBrCode({
      pixKey: raffle.pix_key,
      pixKeyType: raffle.pix_key_type,
      merchantName: raffle.brand_name || 'FASTRIFA',
      merchantCity: 'BRASIL',
      amount: confirmedOrder.total,
      description: `RIFA ${confirmedOrder.tickets.length} COTAS`,
    });
    setPixBrCodePayload(payload);

    QRCode.toDataURL(payload, {
      width: 440,
      margin: 1,
      color: { dark: '#0D1729', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setPixQrCodeUrl(url))
      .catch(() => setPixQrCodeUrl(''));
  }, [confirmedOrder, raffle]);

  // Sincroniza o tema da rifa ou o tema global padrão (verde)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const globalTheme =
      localStorage.getItem('fastrifa_global_system_theme') || 'green';
    const themeToApply = raffle.brand_color ? raffle.brand_color : globalTheme;
    document.documentElement.setAttribute('data-theme', themeToApply);
  }, [raffle.brand_color]);

  // Handle clicking a number in the grid
  function toggleTicket(num: number) {
    if (raffle.status !== 'active') return;
    if (occupiedMap.has(num)) return;

    setSelectedTickets((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num].sort((a, b) => a - b)
    );
  }

  // Quick Pick: add N random free numbers
  function addRandomTickets(count: number) {
    if (raffle.status !== 'active') return;
    const shuffled = [...allAvailableNumbers].sort(() => 0.5 - Math.random());
    const toAdd = shuffled.slice(0, count);

    setSelectedTickets((prev) => [...prev, ...toAdd].sort((a, b) => a - b));
    fireCelebrationConfetti('quick');
    triggerQuickPickFeedback(`+${toAdd.length} cotas da sorte adicionadas!`, 'add');
  }

  // Quick Remove: remove up to N selected numbers
  function removeSelectedTickets(count: number) {
    if (raffle.status !== 'active' || selectedTickets.length === 0) return;
    const removedCount = Math.min(count, selectedTickets.length);
    setSelectedTickets((prev) => prev.slice(0, Math.max(0, prev.length - count)));
    triggerQuickPickFeedback(
      `-${removedCount} cota(s) removida(s) da sua seleção!`,
      'remove'
    );
  }

  function clearSelection() {
    setSelectedTickets([]);
  }

  function copyPixKey() {
    navigator.clipboard.writeText(raffle.pix_key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  }

  function copyPixBrCode() {
    if (!pixBrCodePayload) return;
    navigator.clipboard.writeText(pixBrCodePayload);
    setCopiedBrCode(true);
    fireCelebrationConfetti('copy');
    setTimeout(() => setCopiedBrCode(false), 3000);
  }

  // Substituição de cota em conflito diretamente no modal
  function handleReplaceConflictingWithRandom(conflictNumber: number) {
    const freeCandidates = allAvailableNumbers.filter(
      (n) => n !== conflictNumber && !selectedTickets.includes(n)
    );
    if (freeCandidates.length === 0) {
      setOrderError('Não há mais cotas disponíveis para substituição nesta rifa.');
      return;
    }
    const chosen = freeCandidates[Math.floor(Math.random() * freeCandidates.length)];
    setSelectedTickets((prev) =>
      [...prev.filter((n) => n !== conflictNumber), chosen].sort((a, b) => a - b)
    );
    setConflictingTicket(null);
    setOrderError(null);
  }

  function handleReplaceConflictingWithManual(conflictNumber: number, targetNum: number) {
    if (targetNum < 1 || targetNum > raffle.total_tickets) {
      setOrderError(`Número inválido. Escolha um número de 1 a ${raffle.total_tickets}.`);
      return;
    }
    if (occupiedMap.has(targetNum)) {
      setOrderError(`A cota #${targetNum.toString().padStart(3, '0')} já está reservada ou paga.`);
      return;
    }
    if (selectedTickets.includes(targetNum)) {
      setOrderError(`A cota #${targetNum.toString().padStart(3, '0')} já está na sua lista.`);
      return;
    }
    setSelectedTickets((prev) =>
      [...prev.filter((n) => n !== conflictNumber), targetNum].sort((a, b) => a - b)
    );
    setConflictingTicket(null);
    setOrderError(null);
    setManualReplacementInput('');
  }

  function removeTicketFromSelection(num: number) {
    const updated = selectedTickets.filter((n) => n !== num);
    if (updated.length === 0) {
      setSelectedTickets([]);
      setIsCheckoutOpen(false);
      setConflictingTicket(null);
      setOrderError(null);
      return;
    }
    setSelectedTickets(updated);
    if (conflictingTicket === num) {
      setConflictingTicket(null);
      setOrderError(null);
    }
  }

  // Submit order
  async function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOrderError(null);

    const nextFieldErrors: { name?: string; phone?: string } = {};
    const cleanBuyerName = buyerName.trim();
    if (cleanBuyerName.length < 2) {
      nextFieldErrors.name = 'Informe seu nome completo para reservar suas cotas.';
    }

    const phoneErr = getBrazilMobileError(buyerPhone);
    if (phoneErr) {
      nextFieldErrors.phone = phoneErr;
    }

    setBuyerFieldErrors(nextFieldErrors);
    if (nextFieldErrors.name || nextFieldErrors.phone) {
      return;
    }

    setIsSubmitting(true);

    const amount = pricing.finalAmount;

    const result = await createOrder({
      raffle_id: raffle.id,
      buyer_name: cleanBuyerName,
      buyer_phone: formatBrazilMobile(buyerPhone),
      ticket_numbers: selectedTickets,
      total_amount: amount,
      ...(pricing.discountPercent > 0
        ? {
            original_amount: pricing.originalAmount,
            discount_percent: pricing.discountPercent,
            discount_amount: pricing.discountAmount,
            discount_label: pricing.discountLabel,
          }
        : {}),
      status: 'pending',
    });

    if (result.error || !result.orderId) {
      setOrderError(result.error || 'Erro ao registrar pedido.');
      if (result.conflictingTicket !== undefined) {
        setConflictingTicket(result.conflictingTicket);
        // Atualiza occupiedTickets local para que o sistema saiba que este número está ocupado
        setOccupiedTickets((prev) => [
          ...prev.filter((t) => t.ticket_number !== result.conflictingTicket),
          { ticket_number: result.conflictingTicket!, status: 'pending' },
        ]);
      }
      setIsSubmitting(false);
      return;
    }

    // Success! Update local occupied tickets and show payment step
    const newOccupied: OccupiedTicket[] = selectedTickets.map((n) => ({
      ticket_number: n,
      status: 'pending',
    }));
    setOccupiedTickets((prev) => [...prev, ...newOccupied]);

    if (normalizedDiscount.mode === 'roulette' && pricing.discountPercent > 0) {
      const trackedOrderId = result.orderId;
      setRouletteState((prev) => {
        const next: StoredRouletteState = {
          ...prev,
          activeOrderId: trackedOrderId,
          orders: [
            ...prev.orders.filter((o) => o.orderId !== trackedOrderId),
            {
              orderId: trackedOrderId,
              discountPercent: pricing.discountPercent,
              createdAt: Date.now(),
            },
          ],
        };
        persistRouletteState(next);
        return next;
      });
    }

    setConfirmedOrder({
      orderId: result.orderId,
      tickets: [...selectedTickets],
      total: amount,
      originalAmount: pricing.originalAmount,
      discountPercent: pricing.discountPercent,
      discountAmount: pricing.discountAmount,
      discountLabel: pricing.discountLabel,
    });
    setSelectedTickets([]);
    setConflictingTicket(null);
    setIsSubmitting(false);
    fireCelebrationConfetti('order');
  }

  // Filter grid by search
  const visibleNumbers = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= raffle.total_tickets; i++) {
      if (!searchQuery || i.toString().includes(searchQuery)) {
        list.push(i);
      }
    }
    return list;
  }, [raffle.total_tickets, searchQuery]);

  const hasCompletedOnboarding = Boolean(
    profile?.onboarding_completed && profile?.brand_name?.trim()
  );
  const panelHref = isMaster
    ? '/admin/master'
    : hasCompletedOnboarding
    ? '/admin'
    : '/admin/onboarding';
  const userBrandName = isMaster
    ? 'FastRifa'
    : profile?.brand_name?.trim() || 'Minha Marca';

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col pb-8 sm:pb-12 relative overflow-hidden">
      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-2.5 sm:py-4 space-y-4 sm:space-y-6">
        {/* Banner Incisivo de Modo Criador Oficial (exibido apenas para o criador autenticado) */}
        {isCreator && (
          <div className="bg-gradient-to-r from-[#0869F5] to-[#0755DE] text-white p-4 sm:p-5 rounded-[24px] shadow-[0_12px_32px_rgba(8,105,245,0.20)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/20 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-xl font-bold shadow-xs">
                👑
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm sm:text-base font-display font-bold">
                    Você é o Criador Oficial desta Campanha
                  </strong>
                  <span className="bg-white/25 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {isMaster ? 'Master / Administrador' : 'Organizador'}
                  </span>
                </div>
                <p className="text-xs text-white/85 leading-snug mt-0.5">
                  Esta é a visão pública que seus compradores veem. Você tem acesso rápido à gestão de cotas, pagamentos e edição da rifa.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-display font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Rifa</span>
              </button>
              <Link
                href={getRaffleAdminPath(raffle)}
                className="px-4 py-2 rounded-full bg-white text-[#0869F5] hover:bg-[#F5F9FF] font-display font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Gerenciar Pedidos</span>
              </Link>
            </div>
          </div>
        )}

        {/* Box Hero da Campanha */}
        <section
          id="public-raffle-hero"
          className="ora-card rounded-[24px] sm:rounded-[30px] p-3.5 sm:p-5 lg:p-6 relative overflow-hidden"
        >
          {/* Barra Superior Interna com Divider: Marca + Campanha Oficial | Botões Painel e Criar Rifa */}
          <div
            id="hero-top-bar"
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-[#E0E9F7]"
          >
            <div
              id="hero-brand-col"
              className="flex flex-row items-start text-left gap-3 sm:gap-4 min-w-0 flex-1"
            >
              <div className="w-16 h-16 sm:w-[128px] sm:h-[128px] lg:w-[144px] lg:h-[144px] rounded-[16px] sm:rounded-[24px] overflow-hidden border-2 border-[#CDE0FC] shadow-sm bg-gradient-to-br from-[#A7F3D0] to-[var(--ora-blue,#00A868)] text-white flex items-center justify-center shrink-0 text-xl sm:text-4xl font-bold">
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
              <div className="min-w-0 pt-0.5 sm:pt-1">
                <span className="text-[11px] sm:text-[20px] lg:text-[24px] uppercase font-bold tracking-wider text-[#0869F5] block leading-tight">
                  Campanha Oficial de
                </span>
                <strong className="font-display text-xl sm:text-[36px] lg:text-[42px] font-bold text-[#0D1729] leading-[1.06] tracking-[-0.03em] block break-words max-w-full sm:max-w-[460px] mt-0.5 sm:mt-1">
                  {raffle.brand_name || 'Organizador Oficial'}
                </strong>
              </div>
            </div>

            <div
              id="hero-cta-corner"
              className="flex flex-wrap items-center justify-end sm:self-start gap-2 shrink-0"
            >
              {user && (
                <Link
                  href={panelHref}
                  className="ora-btn-secondary rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold inline-flex items-center justify-center text-[#0D1729] whitespace-nowrap"
                  title={`Acessar Painel — ${userBrandName}`}
                >
                  <span>Painel</span>
                </Link>
              )}
              <Link
                href={
                  user
                    ? isMaster || hasCompletedOnboarding
                      ? '/admin/rifas/nova'
                      : '/admin/onboarding'
                    : '/cadastro'
                }
                className="ora-btn-primary rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-white shrink-0 stroke-[2.5]" />
                <span>Criar Rifa</span>
              </Link>
            </div>
          </div>

          {raffle.status === 'completed' && raffle.winner_ticket != null && (
            <div className="mb-5 p-4 sm:p-5 bg-gradient-to-r from-[#FFFDF0] via-[#FFF8EB] to-white border-2 border-[#F5D08A] rounded-[22px] shadow-[0_12px_36px_rgba(245,158,11,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden animate-in fade-in">
              <div className="flex items-start sm:items-center gap-4 relative z-10">
                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center flex-shrink-0 shadow-md text-2xl">
                  🏆
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#9A6700] px-3 py-0.5 rounded-full shadow-xs">
                      Sorteio Realizado Oficial
                    </span>
                    {raffle.draw_date && (
                      <span className="text-xs text-[#9A6700] font-semibold">
                        {new Date(raffle.draw_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
                    Cota Premiada: <strong className="text-[#0869F5]">#{raffle.winner_ticket.toString().padStart(3, '0')}</strong>
                  </h3>
                  <p className="text-sm font-semibold text-[#526480] mt-0.5">
                    Ganhador Oficial: <strong className="text-[#0D1729]">{raffle.winner_name || 'Comprador da Cota'}</strong>
                  </p>
                </div>
              </div>

              <div className="sm:self-center flex-shrink-0 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold shadow-xs">
                  <Check className="w-4 h-4" />
                  <span>Resultado Homologado</span>
                </span>
              </div>
            </div>
          )}

          {/* Corpo Principal: Título, Subtítulo e Descrição (Esquerda) | Fotos do Prêmio (Direita no Desktop) */}
          <div className="flex flex-col lg:flex-row-reverse lg:items-start gap-3.5 sm:gap-5 lg:gap-7">
            {allPrizeImages.length > 0 && (
              <div
                id="hero-photos-col"
                className="w-full lg:w-[330px] xl:w-[350px] flex flex-col gap-2 shrink-0"
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
              >
                {/* Frame Principal do Slider */}
                <div className="relative w-full h-44 sm:h-52 lg:h-[210px] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#F5F9FF] border border-[#E0E9F7] shadow-[0_12px_30px_rgba(32,75,134,0.08)] group">
                  <img
                    src={allPrizeImages[activeImageIndex] || allPrizeImages[0]}
                    alt={`${raffle.title} - Foto ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-500 ease-out"
                  />

                  {/* Controles de Navegação Anterior / Próximo quando houver mais de 1 foto */}
                  {allPrizeImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) =>
                            prev === 0 ? allPrizeImages.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) =>
                            (prev + 1) % allPrizeImages.length
                          );
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Badge de Contagem no Topo */}
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tabular-nums">
                        📸 {activeImageIndex + 1} / {allPrizeImages.length}
                      </span>

                      {/* Dots Indicadores na Base */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
                        {allPrizeImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`transition-all rounded-full ${
                              idx === activeImageIndex
                                ? 'w-4 h-1.5 bg-white'
                                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Ir para foto ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Miniaturas Clicáveis abaixo do frame quando há mais de 1 foto */}
                {allPrizeImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {allPrizeImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-12 h-10 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                          idx === activeImageIndex
                            ? 'border-[#0869F5] ring-2 ring-[#0869F5]/25 scale-105'
                            : 'border-[#E0E9F7] opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              id="hero-info-col"
              className="flex-1 min-w-0 space-y-1.5 sm:space-y-2.5"
            >
              <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-[32px] text-[#0D1729] tracking-[-0.04em] leading-[1.12]">
                {raffle.title}
              </h1>

              {raffle.subtitle && (
                <p
                  id="hero-subtitle"
                  className="font-display font-semibold text-[15.5px] sm:text-[17px] lg:text-[19px] text-[#0869F5] leading-[1.3] tracking-[-0.015em]"
                >
                  {raffle.subtitle}
                </p>
              )}

              {raffle.description && (
                <p className="text-[13px] sm:text-[14px] text-[#475872] leading-[1.45] whitespace-pre-line">
                  {raffle.description}
                </p>
              )}
            </div>
          </div>

          {/* Linha Inferior da Hero: Widget Campanha Aberta ao Vivo (Esquerda) + Box Valor Unitário (Direita) */}
          <div
            id="hero-metrics-row"
            className={`mt-3 sm:mt-4 grid grid-cols-1 ${raffle.status === 'active' ? 'md:grid-cols-2' : ''} gap-2.5 sm:gap-3.5 items-stretch`}
          >
            {raffle.status === 'active' && (
              <div id="hero-live-box" className="h-full">
                <RaffleScarcityWidget
                  totalTickets={raffle.total_tickets}
                  availableCount={allAvailableNumbers.length}
                  paidCount={paidCount}
                  pendingCount={pendingCount}
                  progressPercent={progressPercent}
                  orders={liveOrders}
                  brandColor={raffle.brand_color}
                  className="h-full !px-3.5 !py-2.5 sm:!px-4 sm:!py-3"
                />
              </div>
            )}

            <div
              id="hero-price-box"
              className="h-full flex flex-col justify-between bg-[#F5F9FF] border border-[#E0E9F7] rounded-[18px] sm:rounded-[20px] p-3 sm:p-3.5 space-y-2 tabular-nums"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#526480]">
                  Valor unitário
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-xl sm:text-2xl text-[#0869F5]">
                    R$ {Number(raffle.ticket_price).toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-[#475872]">/ por cota</span>
                </div>
              </div>

              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#14213A]">
                  <span>Cotas confirmadas</span>
                  <span style={{ color: primaryBrandColor }} className="font-extrabold">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 sm:h-3 bg-[#E2E8F0] rounded-full overflow-hidden p-0.5 border border-[#CBD5E1]">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-xs"
                    style={{
                      width: `${Math.max(progressPercent, 0)}%`,
                      backgroundColor: primaryBrandColor,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ticket Selector Section */}
        <section className="ora-card rounded-[32px] p-5 sm:p-8 space-y-6 relative z-10">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0869F5] tracking-[-0.04em]">
              {raffle.status === 'completed'
                ? 'Cartela Oficial & Resultado do Sorteio'
                : 'Escolha suas cotas'}
            </h2>
            <p className="text-sm sm:text-[15px] text-[#475872] mt-1">
              {raffle.status === 'completed'
                ? 'Esta campanha já foi finalizada. Confira os números e a cota premiada na grade abaixo.'
                : 'Toque nos números desejados na grade abaixo ou adicione pacotes aleatórios com 1 clique.'}
            </p>
          </div>

          {/* Banner CTA Promocional de Desconto (antes de selecionar cotas; ao selecionar, tudo centraliza no checkout) */}
          {raffle.status === 'active' &&
            normalizedDiscount.mode !== 'none' &&
            selectedTickets.length === 0 &&
            !isDiscountExpiredPermanently && (
            <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#E8F7F0] via-[#F3FAF6] to-[#EDF5FF] border border-[#B9E7D2] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#00A868] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {normalizedDiscount.mode === 'roulette' ? (
                      <Dices className="w-4 h-4" />
                    ) : (
                      <Percent className="w-4 h-4" />
                    )}
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A868] block">
                      {normalizedDiscount.mode === 'progressive'
                        ? 'Desconto Progressivo Ativo'
                        : normalizedDiscount.mode === 'buy_x_pay_y'
                          ? `Promoção Compre ${normalizedDiscount.buy_x_qty}, Pague ${normalizedDiscount.pay_y_qty}`
                          : normalizedDiscount.mode === 'roulette'
                            ? 'Roleta da Sorte Promocional'
                            : 'Desconto Especial por Quantidade'}
                    </span>
                    <p className="text-xs sm:text-[13px] font-semibold text-[#0D1729] leading-snug">
                      {normalizedDiscount.mode === 'progressive' &&
                        'Vai comprar mais de um bilhete? Você tem direito a um desconto progressivo: quanto mais você compra, maiores são as suas chances de ganhar e mais barato fica!'}
                      {normalizedDiscount.mode === 'buy_x_pay_y' &&
                        `Vai comprar mais de um bilhete? Aproveite: a cada ${normalizedDiscount.buy_x_qty} cotas escolhidas, você paga apenas ${normalizedDiscount.pay_y_qty} (${(normalizedDiscount.buy_x_qty || 3) - (normalizedDiscount.pay_y_qty || 2)} cota(s) grátis)!`}
                      {normalizedDiscount.mode === 'simple' &&
                        `Vai comprar mais de um bilhete? Compre a partir de ${normalizedDiscount.simple_min_tickets} cotas e ganhe ${normalizedDiscount.simple_percent}% de desconto automático no PIX!`}
                      {normalizedDiscount.mode === 'roulette' &&
                        `Vai comprar mais de um bilhete? Escolha a partir de ${normalizedDiscount.roulette_min_tickets} cotas e gire a Roleta da Sorte para ganhar até ${Math.max(...(normalizedDiscount.roulette_options || [20]))}% de desconto!`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Faixas visíveis no modo Progressivo */}
              {normalizedDiscount.mode === 'progressive' && normalizedDiscount.tiers && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 tabular-nums">
                  {normalizedDiscount.tiers.map((tier) => (
                    <span
                      key={tier.min_tickets}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-white border-[#D9E5F7] text-[#475872]"
                    >
                      <span>{tier.min_tickets}+ cotas</span>
                      <span>•</span>
                      <span>{tier.percent}% OFF</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Pick Buttons (apenas quando ativa) */}
          {raffle.status === 'active' && (
            <div className="p-4 sm:p-5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[24px] space-y-3.5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475872] block">
                  Seleção Rápida Automática
                </span>
                <p className="text-xs text-[#475872] leading-relaxed">
                  Os botões abaixo selecionam a quantidade <strong>aleatoriamente</strong> entre as cotas livres. Você pode clicar várias vezes no mesmo botão para somar mais cotas.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
                {[5, 10, 25, 50].map((qty) => {
                  const disabled = isRemoveMode
                    ? selectedTickets.length === 0
                    : allAvailableNumbers.length < qty;
                  const qtyDiscountPct = !isRemoveMode && !isDiscountExpiredPermanently
                    ? getDiscountForFixedQty(qty, normalizedDiscount)
                    : 0;
                  return (
                    <button
                      key={qty}
                      type="button"
                      onClick={() =>
                        isRemoveMode
                          ? removeSelectedTickets(qty)
                          : addRandomTickets(qty)
                      }
                      disabled={disabled}
                      className={`px-4 py-2.5 border text-xs sm:text-sm font-display font-bold rounded-[14px] shadow-[0_4px_12px_rgba(36,97,184,0.06)] transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer ${
                        isRemoveMode
                          ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6] border-[#FECDD3] hover:border-[#FDA4AF] text-[#BE123C]'
                          : 'bg-white hover:bg-[#EDF5FF] active:bg-[#D9ECFF] border-[#CDE0FC] hover:border-[#0869F5] text-[#0755DE]'
                      }`}
                    >
                      {isRemoveMode ? (
                        <MinusCircle className="w-4 h-4 text-[#BE123C]" />
                      ) : (
                        <Dices className="w-4 h-4 text-[#0869F5]" />
                      )}
                      <span>
                        {isRemoveMode ? `-${qty} cotas` : `+${qty} cotas`}
                      </span>
                      {qtyDiscountPct > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#E8F7F0] text-[#00A868] text-[9.5px] font-extrabold">
                          -{qtyDiscountPct}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <label className="inline-flex items-center gap-2.5 pt-1 text-xs font-semibold text-[#14213A] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRemoveMode}
                  onChange={(e) => setIsRemoveMode(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#BE123C] cursor-pointer"
                />
                <span>
                  Remover cotas: marque esta caixa e clique nos botões acima para retirar a quantidade selecionada
                </span>
              </label>
            </div>
          )}

          {/* Search and Status Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-[#E0E9F7]">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#475872] tabular-nums">
              {raffle.status === 'completed' && raffle.winner_ticket != null && (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-[5px] bg-[#FFD700] border border-[#D97706] shadow-xs" />
                  <span className="text-[#9A6700] font-bold">
                    Cota Premiada (#{raffle.winner_ticket.toString().padStart(3, '0')})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-[5px] bg-[#F5F9FF] border border-[#D9E5F7]" />
                <span>Disponível ({allAvailableNumbers.length})</span>
              </div>
              {raffle.status === 'active' && (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-[5px] bg-[#0869F5]" />
                  <span>Selecionada ({selectedTickets.length})</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-[5px] bg-[#FFF8EB] border border-[#F5D08A]" />
                <span className="text-[#D97706] font-semibold">Reservada ({pendingCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-[5px] bg-[#FFF0F0] border border-[#FCA5A5]" />
                <span className="text-[#DC2626] font-semibold">Paga ({paidCount})</span>
              </div>
            </div>

            {/* Number Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#526480]" />
              <input
                type="text"
                aria-label="Buscar número da cota"
                placeholder="Buscar número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-2 bg-[#F5F9FF] border border-[#D9E5F7] rounded-full text-xs font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] tabular-nums"
              />
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-10 gap-2 tabular-nums">
              {visibleNumbers.map((num) => {
                const isWinner =
                  raffle.status === 'completed' && raffle.winner_ticket === num;
                const isSelected = selectedSet.has(num);
                const status = occupiedMap.get(num);
                const isPaid = status === 'paid';
                const isPending = status === 'pending';

                let btnStyle =
                  'bg-[#F5F9FF] hover:bg-[#EDF5FF] text-[#14213A] border-[#D9E5F7] hover:border-[#0869F5] cursor-pointer';

                if (isWinner) {
                  btnStyle =
                    'bg-gradient-to-br from-[#FFE899] via-[#FFD700] to-[#F59E0B] text-[#78350F] font-extrabold border-2 border-[#D97706] shadow-[0_0_20px_rgba(245,158,11,0.55)] scale-105 z-10 animate-pulse';
                } else if (isSelected) {
                  btnStyle =
                    'bg-[#0869F5] text-white font-bold border-[#0869F5] shadow-[0_8px_18px_rgba(8,105,245,0.28)] scale-[1.02] cursor-pointer';
                } else if (isPaid) {
                  btnStyle =
                    'bg-[#FFF0F0] text-[#DC2626] border-[#FCA5A5] line-through font-bold opacity-80 cursor-not-allowed shadow-[inset_0_1px_2px_rgba(220,38,38,0.06)]';
                } else if (isPending) {
                  btnStyle =
                    'bg-[#FFF8EB] text-[#9A6700] border-[#F5D08A] cursor-not-allowed';
                } else if (raffle.status === 'completed') {
                  btnStyle =
                    'bg-[#F5F9FF] text-[#8A9BB3] border-[#E0E9F7] cursor-not-allowed opacity-60';
                }

                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isPaid || isPending || raffle.status === 'completed'}
                    onClick={() => toggleTicket(num)}
                    className={`h-11 sm:h-12 rounded-[13px] text-xs font-display font-bold transition-all duration-150 active:scale-90 flex items-center justify-center border ${btnStyle}`}
                  >
                    {isWinner ? (
                      <span className="flex items-center gap-1">
                        <span>🏆</span>
                        <span>{num.toString().padStart(3, '0')}</span>
                      </span>
                    ) : (
                      num.toString().padStart(3, '0')
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer Brand & FastRifa Attribution */}
        <footer className="pt-8 pb-4 text-center text-xs text-[#526480] space-y-3 relative z-10 max-w-xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group hover:opacity-90 transition"
              title="FastRifa Oficial"
            >
              <img
                src="/logo-fastrifa.png"
                alt="FastRifa"
                className="h-6 w-auto object-contain opacity-90 group-hover:opacity-100"
              />
            </Link>
          </div>

          <div className="space-y-0.5">
            <p className="font-semibold text-[#0D1729]">
              Campanha gerenciada por <strong>{raffle.brand_name || 'Organizador Oficial'}</strong>
            </p>
            <p className="text-[11px] text-[#526480]">
              Tecnologia FastRifa • Pagamentos 100% diretos via PIX sem intermediários
            </p>
          </div>
        </footer>
      </main>

      {/* Floating Bottom Capsule (Active when tickets are selected) */}
      {raffle.status === 'active' && selectedTickets.length > 0 && (() => {
        const rouletteMaxPct = Math.max(...(normalizedDiscount.roulette_options || [20]));
        const feedbackPill = quickPickFeedback ? (
          <div
            className={`w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 border flex items-center justify-center sm:justify-start gap-2 text-xs font-bold transition-all duration-500 ease-out ${
              isFeedbackFading
                ? 'opacity-0 -translate-y-1'
                : 'opacity-100 translate-y-0'
            } ${
              quickPickFeedback.type === 'add'
                ? 'bg-gradient-to-r from-[#E8F7F0] via-[#DCFCE7] to-[#EDF5FF] border-[#A7F3D0] text-[#065F46]'
                : quickPickFeedback.type === 'remove'
                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                  : 'bg-[#FFF8EB] border-[#F5D08A] text-[#92400E]'
            }`}
          >
            {quickPickFeedback.type === 'add' ? (
              <CheckCircle2 className="w-4 h-4 text-[#00A868] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="leading-snug text-center sm:text-left">{quickPickFeedback.text}</span>
          </div>
        ) : null;

        const countdownBadge =
          pricing.discountPercent > 0 && discountSecondsLeft > 0 ? (
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums border ${
                discountSecondsLeft <= 120
                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C] animate-pulse'
                  : 'bg-white/95 border-[#A7F3D0] text-[#065F46]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{formatCountdown(discountSecondsLeft)}</span>
            </span>
          ) : null;

        const discountPill = !quickPickFeedback && normalizedDiscount.mode !== 'none' ? (
          isDiscountExpiredPermanently ? (
            <div className="w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center sm:justify-start gap-2 text-[11px] sm:text-xs font-bold animate-in fade-in duration-300">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-snug animate-pulse text-center sm:text-left">
                Prazo de 10 minutos encerrado — desconto expirado.
              </span>
            </div>
          ) : normalizedDiscount.mode === 'roulette' ? (
            pricing.canSpinRoulette ? (
              <div className="w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 bg-gradient-to-r from-[#FFF8EB] via-[#FEF3C7] to-[#FFFBEB] border border-[#F5D08A] text-[#92400E] flex items-center justify-center sm:justify-start gap-2 text-[11px] sm:text-xs font-bold animate-in fade-in duration-300">
                <Dices className="w-4 h-4 text-[#D97706] shrink-0" />
                <span className="leading-snug animate-pulse text-center sm:text-left">
                  {rouletteState.highestPaidPercent > 0 && rouletteDistribution.minEligiblePercent
                    ? `Novo giro liberado! Gire para ganhar de ${rouletteDistribution.minEligiblePercent}% a ${rouletteDistribution.maxOption}% OFF!`
                    : `Roleta da Sorte desbloqueada! Gire para ganhar até ${rouletteMaxPct}% OFF!`}
                </span>
              </div>
            ) : pricing.discountPercent > 0 ? (
              <div className="w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 bg-[#E8F7F0] border border-[#B9E7D2] text-[#065F46] flex items-center justify-between gap-2 text-[11px] sm:text-xs font-bold animate-in fade-in duration-300">
                <span className="flex items-center gap-1.5 min-w-0 leading-snug">
                  <Tag className="w-3.5 h-3.5 text-[#00A868] shrink-0" />
                  <span className="animate-pulse">
                    {hasPendingRouletteOrder
                      ? `${pricing.discountPercent}% OFF ativo (-R$ ${pricing.discountAmount.toFixed(2)}) · Pague o pedido pendente p/ liberar novo giro!`
                      : pricing.discountPercent >= rouletteDistribution.maxOption
                        ? `${pricing.discountPercent}% OFF máximo ativo! Adicione mais cotas mantendo o desconto.`
                        : `${pricing.discountPercent}% OFF ativo (-R$ ${pricing.discountAmount.toFixed(2)}) · Adicione mais cotas mantendo o desconto!`}
                  </span>
                </span>
                {countdownBadge}
              </div>
            ) : pricing.needsMoreForRoulette > 0 ? (
              <div className="w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 bg-[#F5F9FF] border border-[#D9E5F7] text-[#334661] flex items-center justify-center sm:justify-start gap-2 text-[11px] sm:text-xs font-semibold animate-in fade-in duration-300">
                <Dices className="w-3.5 h-3.5 text-[#0869F5] shrink-0" />
                <span className="leading-snug animate-pulse text-center sm:text-left">
                  {rouletteState.highestPaidPercent > 0 && rouletteDistribution.minEligiblePercent
                    ? `Adicione +${pricing.needsMoreForRoulette} cota(s) para girar novamente (de ${rouletteDistribution.minEligiblePercent}% a ${rouletteDistribution.maxOption}% OFF).`
                    : hasReachedRouletteCap
                      ? `Adicione +${pricing.needsMoreForRoulette} cota(s) para aplicar seu desconto máximo de ${rouletteDistribution.maxOption}% OFF.`
                      : `Adicione +${pricing.needsMoreForRoulette} cota(s) para desbloquear a Roleta da Sorte (até ${rouletteMaxPct}% OFF).`}
                </span>
              </div>
            ) : null
          ) : pricing.discountPercent > 0 ? (
            <div className="w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 bg-[#E8F7F0] border border-[#B9E7D2] text-[#065F46] flex items-center justify-between gap-2 text-[11px] sm:text-xs font-bold animate-in fade-in duration-300">
              <span className="flex items-center gap-1.5 min-w-0 leading-snug">
                <Percent className="w-3.5 h-3.5 text-[#00A868] shrink-0" />
                <span className="animate-pulse">
                  {normalizedDiscount.mode === 'buy_x_pay_y'
                    ? `Compre ${pricing.buyQty}, Pague ${pricing.payQty}: ${pricing.freeTickets} grátis! (-R$ ${pricing.discountAmount.toFixed(2)})`
                    : `${
                        normalizedDiscount.mode === 'progressive'
                          ? 'Progressivo'
                          : 'Especial'
                      }: ${pricing.discountPercent}% OFF! (-R$ ${pricing.discountAmount.toFixed(2)})`}
                  {pricing.nextTier
                    ? normalizedDiscount.mode === 'buy_x_pay_y'
                      ? ` · +${pricing.nextTier.remaining} → +${(pricing.buyQty || 3) - (pricing.payQty || 2)} grátis`
                      : ` · +${pricing.nextTier.remaining} → ${pricing.nextTier.percent}%`
                    : ''}
                </span>
              </span>
              {countdownBadge}
            </div>
          ) : pricing.nextTier ? (
            <div className="w-full sm:w-auto max-w-full rounded-[14px] px-3 py-1.5 bg-[#F5F9FF] border border-[#D9E5F7] text-[#334661] flex items-center justify-center sm:justify-start gap-2 text-[11px] sm:text-xs font-semibold animate-in fade-in duration-300">
              <Percent className="w-3.5 h-3.5 text-[#00A868] shrink-0" />
              <span className="leading-snug animate-pulse text-center sm:text-left">
                {normalizedDiscount.mode === 'buy_x_pay_y'
                  ? `Adicione +${pricing.nextTier.remaining} cota(s) para ganhar ${(normalizedDiscount.buy_x_qty || 3) - (normalizedDiscount.pay_y_qty || 2)} cota(s) grátis (Compre ${normalizedDiscount.buy_x_qty}, Pague ${normalizedDiscount.pay_y_qty})!`
                  : `Adicione +${pricing.nextTier.remaining} cota(s) para desbloquear ${pricing.nextTier.percent}% OFF automático!`}
              </span>
            </div>
          ) : null
        ) : null;

        const centerCheckoutSlot = feedbackPill || discountPill;

        return (
          <div className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 z-40 pointer-events-none flex justify-center animate-in slide-in-from-bottom-4 duration-200">
            <div
              id="checkout-floating-bar"
              className="pointer-events-auto max-w-4xl w-full bg-white/95 backdrop-blur-xl border-2 border-[var(--ora-blue,#00A868)] rounded-[22px] sm:rounded-[26px] px-3.5 pt-2.5 pb-2 sm:px-6 sm:pt-3.5 sm:pb-3 shadow-[0_20px_50px_rgba(0,168,104,0.18)] tabular-nums"
            >
              {/* Mobile: faixa promocional fixa acima para nunca deslocar o botão Reservar Agora */}
              {centerCheckoutSlot && (
                <div className="sm:hidden w-full mb-2 flex items-center justify-center min-w-0">
                  {centerCheckoutSlot}
                </div>
              )}

              <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-5">
                <div className="space-y-0.5 min-w-0 shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                    <span
                      id="checkout-tickets-count"
                      className="text-xs sm:text-sm font-display font-bold text-[#0D1729] whitespace-nowrap"
                    >
                      {selectedTickets.length} cota(s)
                    </span>
                    {pricing.discountPercent > 0 && (
                      <span
                        id="checkout-discount-badge"
                        className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] text-[10px] font-bold whitespace-nowrap shrink-0"
                      >
                        -{pricing.discountPercent}% OFF
                      </span>
                    )}
                    <button
                      type="button"
                      id="checkout-clear-btn"
                      onClick={clearSelection}
                      className="text-[11px] sm:text-xs font-bold text-[#BE123C] hover:underline cursor-pointer flex-shrink-0"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1.5 flex-nowrap whitespace-nowrap">
                    {pricing.discountPercent > 0 && (
                      <span className="text-[11px] sm:text-sm text-[#8A9BB3] line-through font-semibold">
                        R$ {pricing.originalAmount.toFixed(2)}
                      </span>
                    )}
                    <div className="font-display font-bold text-[15px] sm:text-xl text-[var(--ora-blue,#00A868)] leading-tight">
                      Total: R$ {totalPrice}
                    </div>
                  </div>
                </div>

                {centerCheckoutSlot && (
                  <div className="hidden sm:flex sm:flex-1 items-center justify-center min-w-0">
                    {centerCheckoutSlot}
                  </div>
                )}

                <div className="flex items-center shrink-0">
                  {pricing.canSpinRoulette ? (
                    <button
                      type="button"
                      onClick={() => setShowDiscountRoulette(true)}
                      className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 font-bold rounded-full bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] hover:brightness-105 text-white border border-[#FBBF24]/70 shadow-[0_10px_24px_rgba(234,88,12,0.32)] flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base active:scale-95 transition cursor-pointer flex-shrink-0 whitespace-nowrap"
                    >
                      <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Girar Roleta</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="checkout-reserve-btn"
                      onClick={() => {
                        setBuyerFieldErrors({});
                        setOrderError(null);
                        setIsCheckoutOpen(true);
                      }}
                      className="ora-btn-primary px-3.5 sm:px-6 py-2.5 sm:py-3.5 font-bold rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base active:scale-95 transition cursor-pointer flex-shrink-0 whitespace-nowrap shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Reservar Agora</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-[#E0E9F7]/85 text-center">
                <p
                  id="checkout-participation-notice"
                  className="text-[10px] sm:text-[10.5px] sm:whitespace-nowrap tracking-[-0.01em] text-[#526480] leading-snug"
                >
                  Ao confirmar, você aceita os{' '}
                  <button
                    type="button"
                    onClick={() => setShowParticipationTerms(true)}
                    className="font-bold text-[var(--ora-blue,#00A868)] underline decoration-[var(--ora-blue,#00A868)]/60 underline-offset-2 hover:opacity-80 transition cursor-pointer"
                  >
                    Termos de Participação
                  </button>{' '}
                  e declara ciência de que a campanha é de responsabilidade exclusiva do Organizador.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Checkout Modal (Ajustado para caber em 1 única tela no computador sem rolagem) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/45 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="ora-card rounded-[24px] sm:rounded-[28px] max-w-md sm:max-w-xl w-full p-4 sm:p-6 space-y-3 sm:space-y-4 relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              aria-label="Fechar modal"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 p-2 text-[#475872] hover:text-[#0D1729] rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
                Finalizar Reserva
              </h3>
              <p className="text-xs sm:text-sm text-[#475872] mt-0.5">
                Informe seu nome e WhatsApp para vincular os números escolhidos a você.
              </p>
            </div>

            {orderError && (
              <div
                role="alert"
                className="p-3 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-medium rounded-[14px]"
              >
                {orderError}
              </div>
            )}

            {/* Resolução de Conflito de Cota já Reservada (Sem fechar o modal) */}
            {conflictingTicket && (
              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-[16px] space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#BE123C] font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>A cota #{conflictingTicket.toString().padStart(3, '0')} acabou de ser reservada por outra pessoa.</span>
                </div>
                <p className="text-[11px] text-[#9F1239] leading-snug">
                  Escolha como deseja substituir para concluir seu pedido:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleReplaceConflictingWithRandom(conflictingTicket)}
                    className="flex-1 py-2 px-3 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Trocar por aleatório livre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeTicketFromSelection(conflictingTicket)}
                    className="py-2 px-3 bg-white hover:bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-bold rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    Remover cota
                  </button>
                </div>

                <div className="flex gap-2 pt-1 border-t border-[#FECDD3]">
                  <input
                    type="text"
                    placeholder="Ou digite o número substituto..."
                    value={manualReplacementInput}
                    onChange={(e) => setManualReplacementInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-1.5 bg-white border border-[#FECDD3] rounded-xl text-xs font-medium text-[#0D1729] focus:outline-none focus:border-[#BE123C] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseInt(manualReplacementInput, 10);
                      if (!isNaN(num)) {
                        handleReplaceConflictingWithManual(conflictingTicket, num);
                      }
                    }}
                    disabled={!manualReplacementInput}
                    className="px-3 py-1.5 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    Substituir
                  </button>
                </div>
              </div>
            )}

            {/* Summary Box */}
            <div className="p-3.5 bg-[#F5F9FF] rounded-[18px] border border-[#E0E9F7] space-y-2 tabular-nums">
              <div className="flex justify-between text-xs font-semibold text-[#475872]">
                <span>Cotas selecionadas:</span>
                <span className="font-bold text-[#0D1729]">
                  {selectedTickets.length} cota(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-14 overflow-y-auto">
                {selectedTickets.map((n) => {
                  const isConflict = n === conflictingTicket;
                  return (
                    <span
                      key={n}
                      className={`px-2 py-0.5 border text-xs font-display font-bold rounded-[8px] inline-flex items-center gap-1 ${
                        isConflict
                          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C] ring-2 ring-[#BE123C]/30 animate-pulse'
                          : 'bg-white border-[#D9E5F7] text-[#0869F5]'
                      }`}
                    >
                      <span>#{n.toString().padStart(3, '0')}</span>
                      {isConflict && <span className="text-[10px] uppercase font-bold">(Ocupada)</span>}
                      <button
                        type="button"
                        onClick={() => removeTicketFromSelection(n)}
                        className="hover:opacity-75 cursor-pointer text-[10px] text-[#526480] hover:text-[#DC2626] font-bold"
                        title="Remover cota"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>

              {isDiscountExpiredPermanently && normalizedDiscount.mode !== 'none' && (
                <div className="p-2.5 rounded-[12px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>O prazo de 10 minutos encerrou e o desconto promocional foi perdido definitivamente.</span>
                </div>
              )}

              {!isDiscountExpiredPermanently && pricing.canSpinRoulette && (
                <div className="p-2.5 rounded-[12px] bg-[#FFF8EB] border border-[#F5D08A] text-[#92400E] text-xs font-bold flex items-center gap-2">
                  <Dices className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>
                    {rouletteState.highestPaidPercent > 0 && rouletteDistribution.minEligiblePercent
                      ? `Novo giro da Roleta liberado! Gire para concorrer entre ${rouletteDistribution.minEligiblePercent}% e ${rouletteDistribution.maxOption}% OFF.`
                      : 'Roleta da Sorte Promocional desbloqueada! Gire antes de gerar o PIX.'}
                  </span>
                </div>
              )}

              {pricing.discountPercent > 0 && (
                <div
                  className={`p-2.5 rounded-[12px] border text-xs font-bold flex items-center justify-between gap-2 ${
                    discountSecondsLeft <= 120
                      ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                      : 'bg-[#E8F7F0] border-[#B9E7D2] text-[#065F46]'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0 leading-snug">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {normalizedDiscount.mode === 'roulette' ? (
                        <>
                          Desconto de {pricing.discountPercent}% OFF ativo! Você pode adicionar mais cotas mantendo o desconto. Pague em até{' '}
                          <strong className="underline">{formatCountdown(discountSecondsLeft)}</strong> ou perderá o desconto.
                        </>
                      ) : normalizedDiscount.mode === 'buy_x_pay_y' ? (
                        <>
                          Compre {pricing.buyQty}, Pague {pricing.payQty} ({pricing.freeTickets} grátis) ativo! Pague em até{' '}
                          <strong className="underline">{formatCountdown(discountSecondsLeft)}</strong> ou perderá o desconto para sempre.
                        </>
                      ) : (
                        <>
                          Desconto de {pricing.discountPercent}% OFF ativo! Pague em até{' '}
                          <strong className="underline">{formatCountdown(discountSecondsLeft)}</strong> ou perderá o desconto para sempre.
                        </>
                      )}
                    </span>
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#E0E9F7] space-y-1">
                {pricing.discountPercent > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#526480]">
                      Subtotal:{' '}
                      <span className="line-through">R$ {pricing.originalAmount.toFixed(2)}</span>
                    </span>
                    <span className="font-bold text-[#00A868]">
                      {normalizedDiscount.mode === 'buy_x_pay_y'
                        ? `Compre ${pricing.buyQty}, Pague ${pricing.payQty} (${pricing.freeTickets} grátis): - R$ ${pricing.discountAmount.toFixed(2)}`
                        : `Desconto (${pricing.discountPercent}% OFF): - R$ ${pricing.discountAmount.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-[#14213A]">Total a pagar:</span>
                  <span className="font-display font-bold text-xl text-[#0869F5]">
                    R$ {totalPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Form em 2 colunas no desktop para caber sem rolagem */}
            <form onSubmit={handleOrderSubmit} noValidate className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold text-[#14213A] mb-1"
                    htmlFor="buyerName"
                  >
                    Nome Completo *
                  </label>
                  <input
                    id="buyerName"
                    type="text"
                    required
                    placeholder="Digite seu nome completo"
                    value={buyerName}
                    onChange={(e) => {
                      setBuyerName(e.target.value);
                      if (buyerFieldErrors.name) {
                        setBuyerFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 sm:py-3 rounded-[14px] text-[#0D1729] placeholder-[#526480] text-sm focus:outline-none focus:bg-white ${
                      buyerFieldErrors.name
                        ? 'bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]'
                        : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[#0869F5]'
                    }`}
                  />
                  {buyerFieldErrors.name && (
                    <p className="mt-1 text-[11px] font-semibold text-[#BE123C] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{buyerFieldErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold text-[#14213A] mb-1"
                    htmlFor="buyerPhone"
                  >
                    WhatsApp com DDD *
                  </label>
                  <input
                    id="buyerPhone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    required
                    placeholder="(11) 99999-9999"
                    value={buyerPhone}
                    onChange={(e) => {
                      setBuyerPhone(formatBrazilMobile(e.target.value));
                      if (buyerFieldErrors.phone) {
                        setBuyerFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    onBlur={() => {
                      if (buyerPhone.trim()) {
                        const phoneErr = getBrazilMobileError(buyerPhone);
                        if (phoneErr) {
                          setBuyerFieldErrors((prev) => ({ ...prev, phone: phoneErr }));
                        }
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 sm:py-3 rounded-[14px] text-[#0D1729] placeholder-[#526480] text-sm focus:outline-none focus:bg-white ${
                      buyerFieldErrors.phone
                        ? 'bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]'
                        : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[#0869F5]'
                    }`}
                  />
                  {buyerFieldErrors.phone && (
                    <p className="mt-1 text-[11px] font-semibold text-[#BE123C] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{buyerFieldErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {pricing.canSpinRoulette ? (
                <button
                  type="button"
                  onClick={() => setShowDiscountRoulette(true)}
                  className="w-full py-3.5 font-bold rounded-full bg-gradient-to-r from-[#F59E0B] via-[#EA580C] to-[#D97706] hover:brightness-105 text-white border border-[#FBBF24]/70 shadow-[0_10px_24px_rgba(234,88,12,0.32)] flex items-center justify-center gap-2 text-sm sm:text-[15px] active:scale-[0.98] transition cursor-pointer"
                >
                  <Dices className="w-5 h-5" />
                  <span>Girar Roleta da Sorte</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ora-btn-primary w-full py-3.5 font-bold rounded-full flex items-center justify-center gap-2 text-sm sm:text-[15px] disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Reservando cotas...</span>
                    </>
                  ) : (
                    <>
                      <PixIcon className="w-4 h-4" />
                      <span>Confirmar e Gerar PIX</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Payment Screen Modal (Maior, mais legível, sem "Reserva Confirmada" e 1 tela sem rolagem) */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/55 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="ora-card rounded-[22px] sm:rounded-[30px] max-w-md sm:max-w-2xl w-full max-h-[calc(100dvh-16px)] sm:max-h-[calc(100dvh-32px)] overflow-y-auto p-3 sm:p-7 space-y-2 sm:space-y-5 relative text-center animate-in zoom-in-95 duration-200 my-auto">
            {/* Cabeçalho perfeitamente alinhado com ícone circular verde ao lado do título */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-[#E0E9F7]">
              <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-[#ECFDF5] border-2 border-[#A7F3D0] flex items-center justify-center text-[#059669] shadow-xs shrink-0">
                <Check className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-display font-bold text-[15px] sm:text-[26px] text-[#0D1729] tracking-[-0.03em] leading-tight text-left">
                Cotas Reservadas com Sucesso!
              </h3>
            </div>

            {/* Corpo em 2 colunas no Desktop e bloco compacto lado a lado (Valor + QR) no Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-center">
              {/* Coluna Esquerda: Valor + QR Code grande */}
              <div className="sm:col-span-5 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2.5 sm:gap-3 p-2.5 sm:p-4 rounded-[16px] sm:rounded-[22px] bg-[#F8FBFF] border border-[#E0E9F7]">
                <div className="text-left sm:text-center space-y-0.5 sm:space-y-1 min-w-0 flex-1 sm:flex-none">
                  <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#526480]">
                    Valor exato do PIX
                  </span>
                  <div className="font-display font-bold text-xl sm:text-3xl text-[#0869F5] tabular-nums leading-tight">
                    R$ {confirmedOrder.total.toFixed(2)}
                  </div>
                  {confirmedOrder.discountPercent && confirmedOrder.discountPercent > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#E8F7F0] text-[#00A868] text-[10px] sm:text-[11px] font-bold leading-tight">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span>Economia de R$ {(confirmedOrder.discountAmount || 0).toFixed(2)} ({confirmedOrder.discountPercent}% OFF)</span>
                    </span>
                  ) : null}
                </div>

                {pixQrCodeUrl && (
                  <div className="w-[84px] h-[84px] sm:w-52 sm:h-52 p-1.5 sm:p-3 bg-white rounded-[14px] sm:rounded-[20px] border-2 border-[#CDE0FC] shadow-[0_8px_18px_rgba(8,105,245,0.10)] sm:shadow-[0_10px_24px_rgba(8,105,245,0.10)] flex items-center justify-center shrink-0">
                    <img
                      src={pixQrCodeUrl}
                      alt="QR Code PIX com valor da rifa"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Coluna Direita: Countdown, Copiar PIX, Aviso e WhatsApp */}
              <div className="sm:col-span-7 flex flex-col gap-2 sm:gap-3.5 text-left">
                {confirmedOrder.discountPercent && confirmedOrder.discountPercent > 0 ? (
                  isDiscountExpiredPermanently ? (
                    <div className="p-2 sm:p-3 rounded-[12px] sm:rounded-[14px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-[11px] sm:text-xs leading-snug font-bold flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>Prazo de 10 minutos encerrado — o desconto promocional expirou.</span>
                    </div>
                  ) : (
                    <div
                      className={`p-2 sm:p-3 rounded-[12px] sm:rounded-[14px] border text-[11px] sm:text-xs leading-snug font-bold flex items-center gap-2 tabular-nums ${
                        discountSecondsLeft <= 120
                          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                          : 'bg-[#E8F7F0] border-[#B9E7D2] text-[#065F46]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>
                        Pague em até <strong className="underline">{formatCountdown(discountSecondsLeft)}</strong> para garantir seu desconto de {confirmedOrder.discountPercent}% OFF (se não pagar no prazo, perde para sempre).
                      </span>
                    </div>
                  )
                ) : null}

                {pixBrCodePayload && (
                  <button
                    type="button"
                    onClick={copyPixBrCode}
                    className={`w-full py-2.5 sm:py-3.5 px-3.5 sm:px-5 rounded-full font-bold text-[12.5px] sm:text-[15px] leading-tight flex items-center justify-center gap-1.5 sm:gap-2 transition active:scale-[0.98] cursor-pointer shadow-sm ${
                      copiedBrCode
                        ? 'bg-[#059669] text-white'
                        : 'ora-btn-primary'
                    }`}
                  >
                    {copiedBrCode ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>
                          PIX Copia e Cola Copiado! (R$ {confirmedOrder.total.toFixed(2)})
                        </span>
                      </>
                    ) : (
                      <>
                        <QrIcon className="w-4 h-4 shrink-0" />
                        <span>
                          Copiar PIX Copia e Cola (R$ {confirmedOrder.total.toFixed(2)})
                        </span>
                      </>
                    )}
                  </button>
                )}

                {/* Card de Atenção e Envio de Comprovante */}
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[14px] sm:rounded-[18px] p-2.5 sm:p-4 space-y-1 sm:space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#92400E] font-display font-bold text-[11px] sm:text-[13px]">
                    <span>📸</span>
                    <span>ATENÇÃO: COMPROVANTE DE PAGAMENTO</span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-[#78350F] leading-snug sm:leading-relaxed">
                    Após realizar o Pix, <strong>salve o comprovante no seu celular</strong> e clique abaixo para enviá-lo no WhatsApp.
                  </p>
                  <p className="pt-1 sm:pt-1.5 border-t border-[#FDE68A]/70 text-[11px] sm:text-[13px] text-[#065F46] font-semibold leading-snug">
                    {normalizedDiscount.mode === 'roulette' &&
                    confirmedOrder.discountPercent &&
                    confirmedOrder.discountPercent < rouletteDistribution.maxOption
                      ? `✅ Após o pagamento confirmado, você libera novo giro da roleta (até ${rouletteDistribution.maxOption}% OFF)! 🍀`
                      : '✅ Seus números serão confirmados após a conferência. 🍀 Boa sorte!'}
                  </p>
                </div>

                {/* WhatsApp Receipt Button */}
                {(() => {
                  const organizerCleanPhone = (raffle.phone_whatsapp || '').replace(
                    /\D/g,
                    ''
                  );
                  const formattedTickets = confirmedOrder.tickets
                    .map((n) => `#${n.toString().padStart(3, '0')}`)
                    .join(', ');

                  const discountNote =
                    confirmedOrder.discountPercent && confirmedOrder.discountPercent > 0
                      ? ` (com ${confirmedOrder.discountPercent}% de desconto aplicado!)`
                      : '';
                  const message = `Olá! Meu nome é ${buyerName} e reservei as cotas (${formattedTickets}) na rifa "${raffle.title}". Notifico o pagamento no valor de R$ ${confirmedOrder.total.toFixed(2)}${discountNote} e anexo meu comprovante para conferência e confirmação!`;
                  const whatsappUrl = `https://wa.me/55${organizerCleanPhone}?text=${encodeURIComponent(
                    message
                  )}`;

                  return (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 sm:py-3.5 px-3.5 sm:px-5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full flex items-center justify-center gap-1.5 sm:gap-2 text-[12.5px] sm:text-[15px] leading-tight shadow-sm transition active:scale-[0.98]"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Enviar Notificação e Comprovante no WhatsApp</span>
                    </a>
                  );
                })()}
              </div>
            </div>

            <div className="pt-0 sm:pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  setIsCheckoutOpen(false);
                }}
                className="text-xs sm:text-sm font-bold text-[#475872] hover:text-[#0D1729] cursor-pointer py-0.5"
              >
                Fechar e voltar para a campanha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações FOMO em Tempo Real (atividade real da campanha) */}
      <RaffleFomoToast
        raffleId={raffle.id}
        orders={liveOrders}
        availableCount={allAvailableNumbers.length}
        totalTickets={raffle.total_tickets}
        progressPercent={progressPercent}
        brandColor={raffle.brand_color}
        hasCheckoutBar={selectedTickets.length > 0}
        isSuppressed={
          raffle.status !== 'active' ||
          isCheckoutOpen ||
          Boolean(confirmedOrder) ||
          showDiscountRoulette ||
          showPhysicalCardModal ||
          showEditModal ||
          showParticipationTerms
        }
      />

      {/* Modal Roleta Promocional de Desconto */}
      <DiscountRouletteModal
        isOpen={showDiscountRoulette}
        onClose={() => setShowDiscountRoulette(false)}
        options={rouletteOptions}
        brandColor={raffle.brand_color}
        alreadyWonPercent={effectiveRoulettePercent}
        minExclusivePercent={
          rouletteState.highestPaidPercent > 0 ? rouletteState.highestPaidPercent : null
        }
        spinRound={
          effectiveRoulettePercent
            ? Math.max(1, rouletteState.spinsCount)
            : rouletteState.spinsCount + 1
        }
        onWin={handleRouletteWin}
      />

      {/* Modal Gerador de Cartela Física em PDF (2 Páginas A4) */}
      <PhysicalCardModal
        raffle={raffle}
        paidTicketNumbers={paidTicketNumbers}
        pendingTicketNumbers={pendingTicketNumbers}
        isOpen={showPhysicalCardModal}
        onClose={() => setShowPhysicalCardModal(false)}
      />

      {/* Modal de Edição de Rifa (Criador Oficial / Master) */}
      {showEditModal && (
        <EditRaffleModal
          raffle={raffle}
          hasPaidOrders={paidCount > 0}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setCurrentRaffle(updated);
          }}
        />
      )}

      {/* Modal: Termo de Ciência e Participação do Comprador */}
      <BuyerParticipationTermsModal
        isOpen={showParticipationTerms}
        onClose={() => setShowParticipationTerms(false)}
      />
    </div>
  );
}
