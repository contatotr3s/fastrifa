'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Flame,
  ShoppingBag,
  TrendingUp,
  X,
} from 'lucide-react';
import type { Order } from '@/types/database.types';

export interface FomoActivityEvent {
  id: string;
  kind: 'paid' | 'pending' | 'scarcity';
  buyerLabel: string;
  initials: string;
  ticketCount: number;
  discountPercent: number;
  timeLabel: string;
  headline: string;
  subline: string;
}

export function formatShortBuyerName(fullName?: string | null): string {
  const clean = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!clean || !/[A-Za-zÀ-ÿ]/.test(clean)) return 'Uma pessoa';
  const parts = clean.split(' ').filter(Boolean);
  const first = parts[0];
  if (parts.length === 1) {
    return first.slice(0, 18);
  }
  const last = parts[parts.length - 1];
  const initial = last.charAt(0).toUpperCase();
  return initial ? `${first.slice(0, 14)} ${initial}.` : first.slice(0, 18);
}

export function formatRelativeTimePtBr(
  isoDate?: string | null,
  nowMs?: number
): string {
  if (!isoDate) return 'recentemente';
  const ts = new Date(isoDate).getTime();
  if (!Number.isFinite(ts) || ts <= 0) return 'recentemente';
  const refNow = nowMs ?? Date.now();
  const diffSec = Math.max(0, Math.floor((refNow - ts) / 1000));
  if (diffSec < 60) return 'agora há pouco';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `há ${diffHour}h`;
  const diffDays = Math.floor(diffHour / 24);
  return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
}

function getInitials(shortName: string): string {
  const letters = shortName.replace(/[^A-Za-zÀ-ÿ\s]/g, '').trim().split(/\s+/);
  if (letters.length === 0 || !letters[0]) return 'FR';
  if (letters.length === 1) return letters[0].slice(0, 2).toUpperCase();
  return `${letters[0].charAt(0)}${letters[1].charAt(0)}`.toUpperCase();
}

export function buildFomoEvents(
  orders: Order[],
  availableCount: number,
  totalTickets: number,
  progressPercent: number,
  nowMs?: number
): FomoActivityEvent[] {
  const validOrders = (orders || [])
    .filter(
      (o) =>
        (o.status === 'paid' || o.status === 'pending') &&
        Array.isArray(o.ticket_numbers) &&
        o.ticket_numbers.length > 0
    )
    .sort((a, b) => {
      const tA = new Date(a.paid_at || a.created_at || 0).getTime();
      const tB = new Date(b.paid_at || b.created_at || 0).getTime();
      return tB - tA;
    })
    .slice(0, 6);

  const mapped: FomoActivityEvent[] = validOrders.map((o) => {
    const buyerLabel = formatShortBuyerName(o.buyer_name);
    const count = o.ticket_numbers.length;
    const discount = typeof o.discount_percent === 'number' ? o.discount_percent : 0;
    const timeLabel = formatRelativeTimePtBr(o.paid_at || o.created_at, nowMs);
    const kind: 'paid' | 'pending' = o.status === 'paid' ? 'paid' : 'pending';
    const quotaWord = count === 1 ? 'cota' : 'cotas';
    const discountPart = discount > 0 ? ` · ${discount}% OFF` : '';

    return {
      id: `order-${o.id}-${o.status}`,
      kind,
      buyerLabel,
      initials: getInitials(buyerLabel),
      ticketCount: count,
      discountPercent: discount,
      timeLabel,
      headline:
        kind === 'paid'
          ? `garantiu ${count} ${quotaWord}`
          : `reservou ${count} ${quotaWord}`,
      subline:
        kind === 'paid'
          ? `Pago no PIX · ${timeLabel}${discountPart}`
          : `Aguardando PIX · ${timeLabel}${discountPart}`,
    };
  });

  if (
    availableCount > 0 &&
    totalTickets > 0 &&
    (progressPercent >= 50 || availableCount <= 20)
  ) {
    const scarcityEvent: FomoActivityEvent = {
      id: `scarcity-${availableCount}`,
      kind: 'scarcity',
      buyerLabel: `Restam apenas ${availableCount} cotas livres`,
      initials: `${progressPercent}%`,
      ticketCount: availableCount,
      discountPercent: 0,
      timeLabel: 'ao vivo',
      headline: '',
      subline: `${progressPercent}% da campanha já garantida`,
    };

    if (mapped.length >= 2) {
      mapped.splice(2, 0, scarcityEvent);
    } else if (mapped.length === 1) {
      mapped.push(scarcityEvent);
    } else {
      mapped.push(scarcityEvent);
    }
  }

  return mapped;
}

interface RaffleScarcityWidgetProps {
  totalTickets: number;
  availableCount: number;
  paidCount: number;
  pendingCount: number;
  progressPercent: number;
  orders: Order[];
  brandColor?: string | null;
}

export function RaffleScarcityWidget({
  totalTickets,
  availableCount,
  pendingCount,
  progressPercent,
  orders,
  brandColor,
}: RaffleScarcityWidgetProps) {
  const [clientNow, setClientNow] = useState<number | null>(null);

  useEffect(() => {
    setClientNow(Date.now());
  }, [orders.length]);

  const isGreen = brandColor === 'green';

  const activeOrders = useMemo(
    () =>
      (orders || []).filter(
        (o) => o.status === 'paid' || o.status === 'pending'
      ),
    [orders]
  );

  const recent24hCount = useMemo(() => {
    if (clientNow === null) return 0;
    const cutoff = clientNow - 24 * 60 * 60 * 1000;
    return activeOrders.filter((o) => {
      const ts = new Date(o.paid_at || o.created_at || 0).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    }).length;
  }, [activeOrders, clientNow]);

  const lastOrderTimeLabel = useMemo(() => {
    if (clientNow === null || activeOrders.length === 0) return null;
    const latest = [...activeOrders].sort((a, b) => {
      const tA = new Date(a.paid_at || a.created_at || 0).getTime();
      const tB = new Date(b.paid_at || b.created_at || 0).getTime();
      return tB - tA;
    })[0];
    if (!latest) return null;
    return formatRelativeTimePtBr(latest.paid_at || latest.created_at, clientNow);
  }, [activeOrders, clientNow]);

  const isCritical =
    availableCount > 0 && (availableCount <= 15 || progressPercent >= 90);
  const isWarm = !isCritical && progressPercent >= 70;
  const isMid = !isCritical && !isWarm && progressPercent >= 25;

  const containerStyle = isCritical
    ? 'bg-[#FFF8EB] border-[#F5D08A] text-[#92400E]'
    : isWarm
      ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
      : isMid
        ? isGreen
          ? 'bg-[#F0FBF6] border-[#B9E7D2] text-[#065F46]'
          : 'bg-[#F2F7FF] border-[#CDE0FC] text-[#0755DE]'
        : 'bg-white/90 border-[#D9E5F7] text-[#14213A]';

  const dotStyle =
    isCritical || isWarm
      ? 'bg-[#D97706]'
      : isGreen
        ? 'bg-[#00A868]'
        : 'bg-[#0869F5]';

  const headline =
    availableCount <= 0
      ? 'Todas as cotas desta campanha foram reservadas!'
      : isCritical
        ? `Últimas ${availableCount} ${availableCount === 1 ? 'cota disponível' : 'cotas disponíveis'}!`
        : isWarm
          ? `Reta final: ${progressPercent}% já garantido`
          : isMid
            ? `Ritmo acelerado: ${progressPercent}% da campanha preenchido`
            : `Campanha aberta ao vivo • ${availableCount} cotas livres`;

  return (
    <div
      className={`rounded-[18px] border px-4 py-3 transition-colors tabular-nums space-y-2 ${containerStyle}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${dotStyle}`}
          />
          {isCritical || isWarm ? (
            <Flame className="w-4 h-4 shrink-0 text-[#D97706]" />
          ) : isMid ? (
            <TrendingUp className="w-4 h-4 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 shrink-0 text-[#0869F5]" />
          )}
          <span className="font-display font-bold text-xs sm:text-[13px] leading-snug">
            {headline}
          </span>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-white/85 border border-black/10 text-[11px] font-bold text-[#0D1729] shrink-0">
          Restam {availableCount} de {totalTickets}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        {recent24hCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-black/10 text-[#14213A]">
            {recent24hCount} {recent24hCount === 1 ? 'pedido' : 'pedidos'} nas últimas 24h
          </span>
        )}
        {lastOrderTimeLabel && (
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-black/10 text-[#475872]">
            Última movimentação {lastOrderTimeLabel}
          </span>
        )}
        {pendingCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-white/80 border border-black/10 text-[#9A6700]">
            {pendingCount} {pendingCount === 1 ? 'cota em reserva agora' : 'cotas em reserva agora'}
          </span>
        )}
      </div>
    </div>
  );
}

interface RaffleFomoToastProps {
  raffleId: string;
  orders: Order[];
  availableCount: number;
  totalTickets: number;
  progressPercent: number;
  brandColor?: string | null;
  hasCheckoutBar: boolean;
  isSuppressed: boolean;
}

const QUIET_PERIOD_MS = 4000;
const VISIBLE_DURATION_MS = 5000;
const COOLDOWN_MS = 9000;
const MAX_AUTO_SHOWN = 4;

export function RaffleFomoToast({
  raffleId,
  orders,
  availableCount,
  totalTickets,
  progressPercent,
  brandColor,
  hasCheckoutBar,
  isSuppressed,
}: RaffleFomoToastProps) {
  const [dismissed, setDismissed] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [currentEvent, setCurrentEvent] = useState<FomoActivityEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const autoShownCountRef = useRef(0);
  const eventCursorRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(`fastrifa_fomo_dismissed_${raffleId}`) === '1') {
        setDismissed(true);
      }
    } catch {}
  }, [raffleId]);

  const events = useMemo(
    () =>
      nowMs === null
        ? []
        : buildFomoEvents(orders, availableCount, totalTickets, progressPercent, nowMs),
    [orders, availableCount, totalTickets, progressPercent, nowMs]
  );

  const eventsRef = useRef<FomoActivityEvent[]>(events);
  eventsRef.current = events;

  function clearTimers() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }

  function showSingleEvent(ev: FomoActivityEvent, onFinished?: () => void) {
    clearTimers();
    setNowMs(Date.now());
    setCurrentEvent(ev);
    setIsVisible(true);

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onFinished) {
        nextTimerRef.current = setTimeout(onFinished, COOLDOWN_MS);
      }
    }, VISIBLE_DURATION_MS);
  }

  // Disparo imediato quando entra um pedido real novo enquanto o usuário está na página
  useEffect(() => {
    if (nowMs === null) return;
    const currentOrderIds = new Set(orders.map((o) => o.id));

    if (knownOrderIdsRef.current === null) {
      knownOrderIdsRef.current = currentOrderIds;
      return;
    }

    const newlyArrived = orders.find(
      (o) =>
        !knownOrderIdsRef.current!.has(o.id) &&
        (o.status === 'paid' || o.status === 'pending') &&
        Array.isArray(o.ticket_numbers) &&
        o.ticket_numbers.length > 0
    );

    knownOrderIdsRef.current = currentOrderIds;

    if (newlyArrived && !dismissed && !isSuppressed) {
      const built = buildFomoEvents(
        [newlyArrived],
        availableCount,
        totalTickets,
        progressPercent,
        Date.now()
      )[0];
      if (built) {
        showSingleEvent(built);
      }
    }
  }, [orders, nowMs, dismissed, isSuppressed, availableCount, totalTickets, progressPercent]);

  // Ciclo respeitoso inicial (quiet period 4s, até 4 exibições por ciclo)
  useEffect(() => {
    if (dismissed || isSuppressed || nowMs === null || eventsRef.current.length === 0) {
      setIsVisible(false);
      clearTimers();
      return;
    }

    if (autoShownCountRef.current >= MAX_AUTO_SHOWN) {
      return;
    }

    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled || autoShownCountRef.current >= MAX_AUTO_SHOWN) return;
      const list = eventsRef.current;
      if (!list || list.length === 0) return;

      const ev = list[eventCursorRef.current % list.length];
      eventCursorRef.current += 1;
      autoShownCountRef.current += 1;

      showSingleEvent(ev, () => {
        if (!cancelled) {
          scheduleNext();
        }
      });
    };

    nextTimerRef.current = setTimeout(() => {
      if (!cancelled && !isVisible) {
        scheduleNext();
      }
    }, QUIET_PERIOD_MS);

    return () => {
      cancelled = true;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed, isSuppressed, nowMs !== null, events.length > 0]);

  function handleDismiss() {
    clearTimers();
    setIsVisible(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`fastrifa_fomo_dismissed_${raffleId}`, '1');
      } catch {}
    }
  }

  if (dismissed || isSuppressed || !currentEvent || !isVisible) {
    return null;
  }

  const isGreen = brandColor === 'green';
  const avatarClasses =
    currentEvent.kind === 'paid'
      ? 'bg-[#E8F7F0] border-[#A7F3D0] text-[#059669]'
      : currentEvent.kind === 'scarcity'
        ? 'bg-[#FFF8EB] border-[#F5D08A] text-[#D97706]'
        : isGreen
          ? 'bg-[#E8F7F0] border-[#B9E7D2] text-[#00A868]'
          : 'bg-[#EDF5FF] border-[#CDE0FC] text-[#0869F5]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-30 pointer-events-none transition-all duration-300 ease-out ${
        hasCheckoutBar
          ? 'hidden sm:flex sm:left-5 sm:right-auto sm:bottom-[116px] sm:justify-start'
          : 'bottom-4 inset-x-4 flex justify-center sm:left-5 sm:right-auto sm:inset-x-auto sm:bottom-5 sm:justify-start'
      }`}
    >
      <div className="pointer-events-auto w-full max-w-[330px] rounded-[18px] bg-white/92 backdrop-blur-md border border-[#D9E5F7] shadow-[0_14px_34px_rgba(13,23,41,0.12)] px-3.5 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div
          className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 font-display font-bold text-xs ${avatarClasses}`}
        >
          {currentEvent.kind === 'scarcity' ? (
            <Flame className="w-4 h-4" />
          ) : currentEvent.kind === 'paid' ? (
            <span>{currentEvent.initials}</span>
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-bold text-[#0D1729] truncate leading-snug">
            {currentEvent.kind === 'scarcity' ? (
              currentEvent.buyerLabel
            ) : (
              <>
                <span>{currentEvent.buyerLabel}</span>{' '}
                <span className="font-semibold text-[#334661]">
                  {currentEvent.headline}
                </span>
              </>
            )}
          </p>
          <p className="text-[11px] font-medium text-[#526480] truncate leading-snug">
            {currentEvent.subline}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar notificações de atividade"
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#526480] hover:text-[#0D1729] hover:bg-[#F5F9FF] transition shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
