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

export const ROULETTE_WEIGHT_PRESETS: Record<number, number[]> = {
  2: [75, 25],
  3: [60, 30, 10],
  4: [55, 25, 15, 5],
  5: [45, 25, 15, 10, 5],
  6: [40, 24, 16, 10, 6, 4],
};

export interface RouletteSliceProbability {
  index: number;
  percent: number;
  baseWeight: number;
  eligible: boolean;
  probability: number;
}

export interface RouletteSpinDistribution {
  entries: RouletteSliceProbability[];
  eligibleEntries: RouletteSliceProbability[];
  minEligiblePercent: number | null;
  maxOption: number;
  hasHigherOption: boolean;
}

export function getRouletteSpinDistribution(
  options?: number[] | null,
  minExclusivePercent?: number | null
): RouletteSpinDistribution {
  const safeOptions =
    options && options.length >= 2
      ? options.slice(0, 6).map((opt) => clampPercent(opt))
      : DEFAULT_ROULETTE_OPTIONS;

  const weights =
    ROULETTE_WEIGHT_PRESETS[safeOptions.length] ||
    safeOptions.map((_, idx) => Math.max(1, safeOptions.length - idx));

  const sortedIndices = safeOptions
    .map((pct, index) => ({ pct, index }))
    .sort((a, b) => (a.pct !== b.pct ? a.pct - b.pct : a.index - b.index));

  const baseWeightByIndex = new Array<number>(safeOptions.length).fill(1);
  sortedIndices.forEach((item, rank) => {
    baseWeightByIndex[item.index] = weights[rank] ?? 1;
  });

  const minFloor =
    minExclusivePercent != null && minExclusivePercent > 0
      ? Number(minExclusivePercent)
      : null;

  const rawEntries = safeOptions.map((percent, index) => {
    const eligible = minFloor !== null ? percent > minFloor : true;
    return {
      index,
      percent,
      baseWeight: baseWeightByIndex[index],
      eligible,
      probability: 0,
    };
  });

  const totalEligibleWeight = rawEntries.reduce(
    (sum, item) => (item.eligible ? sum + item.baseWeight : sum),
    0
  );

  const entries: RouletteSliceProbability[] = rawEntries.map((item) => ({
    ...item,
    probability:
      item.eligible && totalEligibleWeight > 0
        ? item.baseWeight / totalEligibleWeight
        : 0,
  }));

  const eligibleEntries = entries.filter((e) => e.eligible);
  const minEligiblePercent =
    eligibleEntries.length > 0
      ? Math.min(...eligibleEntries.map((e) => e.percent))
      : null;
  const maxOption = Math.max(...safeOptions);

  return {
    entries,
    eligibleEntries,
    minEligiblePercent,
    maxOption,
    hasHigherOption: eligibleEntries.length > 0,
  };
}

export function pickWeightedRouletteSlice(
  options?: number[] | null,
  minExclusivePercent?: number | null
): { index: number; percent: number } | null {
  const { eligibleEntries } = getRouletteSpinDistribution(
    options,
    minExclusivePercent
  );
  if (eligibleEntries.length === 0) return null;

  let rand = 0;
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    rand = buf[0] / 4294967296;
  } else {
    rand = Math.random();
  }

  let cumulative = 0;
  for (const entry of eligibleEntries) {
    cumulative += entry.probability;
    if (rand < cumulative) {
      return { index: entry.index, percent: entry.percent };
    }
  }

  const fallback = eligibleEntries[eligibleEntries.length - 1];
  return { index: fallback.index, percent: fallback.percent };
}

export const DEFAULT_BUY_X_QTY = 3;
export const DEFAULT_PAY_Y_QTY = 2;

export const DEFAULT_DISCOUNT_CONFIG: RaffleDiscountConfig = {
  mode: 'none',
  tiers: DEFAULT_PROGRESSIVE_TIERS,
  buy_x_qty: DEFAULT_BUY_X_QTY,
  pay_y_qty: DEFAULT_PAY_Y_QTY,
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
  freeTickets: number;
  paidTickets: number;
  buyQty?: number;
  payQty?: number;
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

  const buyX = Math.max(
    2,
    Math.min(1000, Math.round(Number(raw?.buy_x_qty ?? DEFAULT_BUY_X_QTY) || DEFAULT_BUY_X_QTY))
  );
  const payY = Math.max(
    1,
    Math.min(buyX - 1, Math.round(Number(raw?.pay_y_qty ?? DEFAULT_PAY_Y_QTY) || DEFAULT_PAY_Y_QTY))
  );

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
    buy_x_qty: buyX,
    pay_y_qty: payY,
    simple_min_tickets: simpleMin,
    simple_percent: simplePct,
    roulette_min_tickets: rouletteMin,
    roulette_options: cleanOptions,
  };
}

/**
 * Calcula valores, faixa atingida, próximo degrau, combos Compre X Pague Y e estado da roleta promocional.
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
  let freeTickets = 0;
  let paidTickets = safeCount;
  let buyQty: number | undefined;
  let payQty: number | undefined;
  let discountAmount = 0;
  let finalAmount = originalAmount;

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
  } else if (normalized.mode === 'buy_x_pay_y') {
    const buyX = normalized.buy_x_qty ?? DEFAULT_BUY_X_QTY;
    const payY = Math.min(buyX - 1, Math.max(1, normalized.pay_y_qty ?? DEFAULT_PAY_Y_QTY));
    buyQty = buyX;
    payQty = payY;
    const freePerBundle = buyX - payY;
    const bundles = Math.floor(safeCount / buyX);
    freeTickets = bundles * freePerBundle;
    paidTickets = Math.max(0, safeCount - freeTickets);

    if (freeTickets > 0 && safeCount > 0) {
      finalAmount = Math.max(0.01, roundCurrency(paidTickets * safeUnit));
      discountAmount = Math.max(0, roundCurrency(originalAmount - finalAmount));
      discountPercent =
        originalAmount > 0
          ? Math.max(1, Math.round((discountAmount / originalAmount) * 100))
          : 0;
      activeTier = { min_tickets: buyX, percent: discountPercent };
      discountLabel = `Compre ${buyX}, Pague ${payY} (${freeTickets} cota${freeTickets > 1 ? 's' : ''} grátis)`;
    }

    const remainder = safeCount % buyX;
    const remaining = remainder === 0 ? (bundles === 0 ? buyX : 0) : buyX - remainder;
    if (remaining > 0) {
      const nextTotal = safeCount + remaining;
      const nextFree = Math.floor(nextTotal / buyX) * freePerBundle;
      const nextPct = Math.round((nextFree / nextTotal) * 100);
      nextTier = {
        minTickets: nextTotal,
        percent: nextPct,
        remaining,
      };
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

  if (normalized.mode !== 'buy_x_pay_y' && safeCount > 0 && discountPercent > 0) {
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
    freeTickets,
    paidTickets,
    buyQty,
    payQty,
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
  if (normalized.mode === 'buy_x_pay_y') {
    const buyX = normalized.buy_x_qty ?? DEFAULT_BUY_X_QTY;
    const payY = Math.min(buyX - 1, Math.max(1, normalized.pay_y_qty ?? DEFAULT_PAY_Y_QTY));
    const bundles = Math.floor(qty / buyX);
    const free = bundles * (buyX - payY);
    return free > 0 && qty > 0 ? Math.round((free / qty) * 100) : 0;
  }
  if (normalized.mode === 'simple') {
    const min = normalized.simple_min_tickets ?? 2;
    const pct = normalized.simple_percent ?? 10;
    return qty >= min ? pct : 0;
  }
  return 0;
}
