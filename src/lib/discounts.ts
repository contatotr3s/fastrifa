import type {
  DiscountTier,
  RaffleDiscountConfig,
} from '@/types/database.types';

export const DEFAULT_PROGRESSIVE_TIERS: DiscountTier[] = [
  { min_tickets: 2, percent: 5 },
  { min_tickets: 5, percent: 10 },
  { min_tickets: 10, percent: 15 },
];

export const DEFAULT_ROULETTE_OPTIONS: number[] = [5, 10, 15, 20];

export const DEFAULT_DISCOUNT_CONFIG: RaffleDiscountConfig = {
  mode: 'none',
  tiers: DEFAULT_PROGRESSIVE_TIERS,
  simple_min_tickets: 2,
  simple_percent: 10,
  roulette_min_tickets: 2,
  roulette_options: DEFAULT_ROULETTE_OPTIONS,
};

export interface DiscountPricingResult {
  mode: RaffleDiscountConfig['mode'];
  ticketCount: number;
  unitPrice: number;
  originalAmount: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  discountLabel: string | null;
  activeTier: DiscountTier | null;
  nextTier: {
    minTickets: number;
    percent: number;
    remaining: number;
  } | null;
  canSpinRoulette: boolean;
  needsMoreForRoulette: number;
}

export function roundCurrency(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function clampPercent(value: number): number {
  const num = Math.round(Number(value) || 0);
  return Math.min(80, Math.max(1, num));
}

function clampMinTickets(value: number): number {
  const num = Math.round(Number(value) || 0);
  return Math.max(2, num);
}

/**
 * Sanitiza a configuração de descontos removendo campos `undefined` para o Firestore
 * e ordenando faixas sem duplicidade.
 */
export function normalizeDiscountConfig(
  raw?: RaffleDiscountConfig | null
): RaffleDiscountConfig {
  const mode = raw?.mode || 'none';

  const tierMap = new Map<number, number>();
  const sourceTiers =
    raw?.tiers && raw.tiers.length > 0 ? raw.tiers : DEFAULT_PROGRESSIVE_TIERS;
  for (const t of sourceTiers) {
    const min = clampMinTickets(t.min_tickets);
    const pct = clampPercent(t.percent);
    tierMap.set(min, Math.max(tierMap.get(min) || 0, pct));
  }
  const cleanTiers = Array.from(tierMap.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(0, 5)
    .map(([min_tickets, percent]) => ({ min_tickets, percent }));

  const simpleMin = clampMinTickets(raw?.simple_min_tickets ?? 2);
  const simplePct = clampPercent(raw?.simple_percent ?? 10);

  const rouletteMin = clampMinTickets(raw?.roulette_min_tickets ?? 2);
  const rawOptions =
    raw?.roulette_options && raw.roulette_options.length >= 2
      ? raw.roulette_options
      : DEFAULT_ROULETTE_OPTIONS;
  const cleanOptions = rawOptions.slice(0, 6).map((opt) => clampPercent(opt));
  while (cleanOptions.length < 2) {
    cleanOptions.push(DEFAULT_ROULETTE_OPTIONS[cleanOptions.length] || 10);
  }

  return {
    mode,
    tiers: cleanTiers,
    simple_min_tickets: simpleMin,
    simple_percent: simplePct,
    roulette_min_tickets: rouletteMin,
    roulette_options: cleanOptions,
  };
}

/**
 * Calcula valores, faixa atingida, próximo degrau e estado da roleta promocional.
 */
export function calculateDiscountedPricing({
  ticketCount,
  unitPrice,
  config,
  rouletteWonPercent,
}: {
  ticketCount: number;
  unitPrice: number;
  config?: RaffleDiscountConfig | null;
  rouletteWonPercent?: number | null;
}): DiscountPricingResult {
  const normalized = normalizeDiscountConfig(config);
  const safeCount = Math.max(0, Math.floor(Number(ticketCount) || 0));
  const safeUnit = Math.max(0, Number(unitPrice) || 0);
  const originalAmount = roundCurrency(safeCount * safeUnit);

  let discountPercent = 0;
  let discountLabel: string | null = null;
  let activeTier: DiscountTier | null = null;
  let nextTier: DiscountPricingResult['nextTier'] = null;
  let canSpinRoulette = false;
  let needsMoreForRoulette = 0;

  if (normalized.mode === 'progressive') {
    const tiers = normalized.tiers || DEFAULT_PROGRESSIVE_TIERS;
    for (const tier of tiers) {
      if (safeCount >= tier.min_tickets) {
        activeTier = tier;
        discountPercent = tier.percent;
      } else if (!nextTier) {
        nextTier = {
          minTickets: tier.min_tickets,
          percent: tier.percent,
          remaining: tier.min_tickets - safeCount,
        };
      }
    }
    if (activeTier) {
      discountLabel = `Desconto progressivo (${activeTier.min_tickets}+ cotas · ${activeTier.percent}% OFF)`;
    }
  } else if (normalized.mode === 'simple') {
    const min = normalized.simple_min_tickets ?? 2;
    const pct = normalized.simple_percent ?? 10;
    if (safeCount >= min) {
      discountPercent = pct;
      activeTier = { min_tickets: min, percent: pct };
      discountLabel = `Desconto especial (${min}+ cotas · ${pct}% OFF)`;
    } else {
      nextTier = {
        minTickets: min,
        percent: pct,
        remaining: min - safeCount,
      };
    }
  } else if (normalized.mode === 'roulette') {
    const min = normalized.roulette_min_tickets ?? 2;
    if (safeCount >= min) {
      if (rouletteWonPercent && rouletteWonPercent > 0) {
        discountPercent = clampPercent(rouletteWonPercent);
        discountLabel = `Roleta da Sorte (${discountPercent}% OFF)`;
      } else {
        canSpinRoulette = true;
      }
    } else {
      needsMoreForRoulette = min - safeCount;
    }
  }

  let discountAmount = 0;
  let finalAmount = originalAmount;

  if (safeCount > 0 && discountPercent > 0) {
    finalAmount = Math.max(
      0.01,
      roundCurrency(originalAmount * (1 - discountPercent / 100))
    );
    discountAmount = Math.max(0, roundCurrency(originalAmount - finalAmount));
  }

  return {
    mode: normalized.mode,
    ticketCount: safeCount,
    unitPrice: safeUnit,
    originalAmount,
    discountPercent,
    discountAmount,
    finalAmount,
    discountLabel,
    activeTier,
    nextTier,
    canSpinRoulette,
    needsMoreForRoulette,
  };
}

/**
 * Retorna o percentual de desconto direto para uma quantidade fixa (ex: +5, +10, +25, +50).
 */
export function getDiscountForFixedQty(
  qty: number,
  config?: RaffleDiscountConfig | null
): number {
  if (!config || config.mode === 'none' || config.mode === 'roulette') return 0;
  const normalized = normalizeDiscountConfig(config);
  if (normalized.mode === 'progressive') {
    let pct = 0;
    for (const tier of normalized.tiers || []) {
      if (qty >= tier.min_tickets) pct = tier.percent;
    }
    return pct;
  }
  if (normalized.mode === 'simple') {
    const min = normalized.simple_min_tickets ?? 2;
    const pct = normalized.simple_percent ?? 10;
    return qty >= min ? pct : 0;
  }
  return 0;
}
