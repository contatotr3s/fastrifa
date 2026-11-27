'use client';

import React from 'react';
import {
  Ban,
  Dices,
  Gift,
  Plus,
  Tag,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  DEFAULT_BUY_X_QTY,
  DEFAULT_DISCOUNT_CONFIG,
  DEFAULT_PAY_Y_QTY,
  DEFAULT_PROGRESSIVE_TIERS,
  DEFAULT_ROULETTE_OPTIONS,
  calculateDiscountedPricing,
  normalizeDiscountConfig,
} from '@/lib/discounts';
import type { DiscountMode, DiscountTier, RaffleDiscountConfig } from '@/types/database.types';

interface DiscountConfigEditorProps {
  value: RaffleDiscountConfig;
  onChange: (next: RaffleDiscountConfig) => void;
  unitPrice: number;
  compact?: boolean;
}

type OptionTone = 'neutral' | 'blue' | 'green' | 'amber';

const MODE_OPTIONS: Array<{
  mode: DiscountMode;
  label: string;
  subtitle: string;
  badge?: string;
  tone: OptionTone;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    mode: 'none',
    label: 'Sem Desconto',
    subtitle: 'Preço padrão por cota',
    tone: 'neutral',
    icon: Ban,
  },
  {
    mode: 'progressive',
    label: 'Progressivo',
    subtitle: 'Mais cotas, maior % OFF',
    badge: 'Mais vendas',
    tone: 'blue',
    icon: TrendingUp,
  },
  {
    mode: 'buy_x_pay_y',
    label: 'Compre X, Pague\u00A0Y',
    subtitle: 'Ex.: Compre 3, pague\u00A02',
    badge: 'Cota grátis',
    tone: 'green',
    icon: Gift,
  },
  {
    mode: 'roulette',
    label: 'Roleta da Sorte',
    subtitle: 'Cliente gira p/ ganhar %',
    badge: 'Interativo',
    tone: 'amber',
    icon: Dices,
  },
];

const BUY_X_PAY_Y_PRESETS = [
  { buyX: 3, payY: 2, label: 'Compre 3, Pague 2' },
  { buyX: 4, payY: 3, label: 'Compre 4, Pague 3' },
  { buyX: 5, payY: 4, label: 'Compre 5, Pague 4' },
  { buyX: 10, payY: 8, label: 'Compre 10, Pague 8' },
];

const TONE_CLASSES: Record<
  OptionTone,
  {
    idleCard: string;
    activeCard: string;
    iconBoxActive: string;
    iconBoxIdle: string;
    badgeIdle: string;
    badgeActive: string;
  }
> = {
  neutral: {
    idleCard:
      'bg-gradient-to-b from-white via-[#FCFDFE] to-[#F2F6FC] border border-[#CBD9EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#C7D8EE,0_6px_14px_rgba(13,23,41,0.06)] hover:-translate-y-[2px] hover:border-[#94A3B8] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_5px_0_#B4C6DC,0_10px_20px_rgba(13,23,41,0.10)] active:translate-y-[3px] active:shadow-[inset_0_2px_4px_rgba(13,23,41,0.10),0_0px_0_#C7D8EE,0_1px_2px_rgba(13,23,41,0.06)]',
    activeCard:
      'bg-gradient-to-b from-white via-[#F8FAFC] to-[#EAF0F7] border-2 border-[#0D1729] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#0D1729,0_10px_20px_rgba(13,23,41,0.14)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(13,23,41,0.12),0_1px_0_#0D1729,0_3px_6px_rgba(13,23,41,0.10)]',
    iconBoxActive:
      'bg-[#0D1729] text-white border-[#0D1729] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_5px_rgba(13,23,41,0.18)]',
    iconBoxIdle:
      'bg-[#F1F5F9] text-[#475872] border-[#DCE8F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(13,23,41,0.06)]',
    badgeIdle: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
    badgeActive: 'bg-[#0D1729] text-white border border-[#0D1729]',
  },
  blue: {
    idleCard:
      'bg-gradient-to-b from-white via-[#FCFDFE] to-[#F2F6FC] border border-[#CBD9EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#C7D8EE,0_6px_14px_rgba(13,23,41,0.06)] hover:-translate-y-[2px] hover:border-[#60A5FA] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_5px_0_#93C5FD,0_10px_20px_rgba(8,105,245,0.12)] active:translate-y-[3px] active:shadow-[inset_0_2px_4px_rgba(8,105,245,0.12),0_0px_0_#C7D8EE,0_1px_2px_rgba(13,23,41,0.06)]',
    activeCard:
      'bg-gradient-to-b from-[#F5FAFF] via-[#ECF4FF] to-[#DCEBFF] border-2 border-[#0869F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#0652C5,0_10px_22px_rgba(8,105,245,0.20)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(8,105,245,0.14),0_1px_0_#0652C5,0_3px_8px_rgba(8,105,245,0.14)]',
    iconBoxActive:
      'bg-[#0869F5] text-white border-[#0869F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_5px_rgba(13,23,41,0.18)]',
    iconBoxIdle:
      'bg-[#EDF5FF] text-[#0869F5] border-[#CDE0FC] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(13,23,41,0.06)]',
    badgeIdle: 'bg-[#EDF5FF] text-[#0869F5] border border-[#CDE0FC]',
    badgeActive: 'bg-[#0869F5] text-white border border-[#0869F5]',
  },
  green: {
    idleCard:
      'bg-gradient-to-b from-white via-[#FCFDFE] to-[#F2F6FC] border border-[#CBD9EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#C7D8EE,0_6px_14px_rgba(13,23,41,0.06)] hover:-translate-y-[2px] hover:border-[#34D399] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_5px_0_#6EE7B7,0_10px_20px_rgba(0,168,104,0.12)] active:translate-y-[3px] active:shadow-[inset_0_2px_4px_rgba(0,168,104,0.12),0_0px_0_#C7D8EE,0_1px_2px_rgba(13,23,41,0.06)]',
    activeCard:
      'bg-gradient-to-b from-[#F2FEF8] via-[#E6FBF1] to-[#D4F6E6] border-2 border-[#00A868] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#008250,0_10px_22px_rgba(0,168,104,0.20)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(0,168,104,0.14),0_1px_0_#008250,0_3px_8px_rgba(0,168,104,0.14)]',
    iconBoxActive:
      'bg-[#00A868] text-white border-[#00A868] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_5px_rgba(13,23,41,0.18)]',
    iconBoxIdle:
      'bg-[#E8F7F0] text-[#00A868] border-[#B9E7D2] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(13,23,41,0.06)]',
    badgeIdle: 'bg-[#E8F7F0] text-[#00A868] border border-[#B9E7D2]',
    badgeActive: 'bg-[#00A868] text-white border border-[#00A868]',
  },
  amber: {
    idleCard:
      'bg-gradient-to-b from-white via-[#FCFDFE] to-[#F2F6FC] border border-[#CBD9EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#C7D8EE,0_6px_14px_rgba(13,23,41,0.06)] hover:-translate-y-[2px] hover:border-[#FBBF24] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_5px_0_#FCD34D,0_10px_20px_rgba(217,119,6,0.12)] active:translate-y-[3px] active:shadow-[inset_0_2px_4px_rgba(217,119,6,0.12),0_0px_0_#C7D8EE,0_1px_2px_rgba(13,23,41,0.06)]',
    activeCard:
      'bg-gradient-to-b from-[#FFFDF5] via-[#FEF8E2] to-[#FDEEC2] border-2 border-[#D97706] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_0_#B45309,0_10px_22px_rgba(217,119,6,0.20)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(217,119,6,0.14),0_1px_0_#B45309,0_3px_8px_rgba(217,119,6,0.14)]',
    iconBoxActive:
      'bg-[#D97706] text-white border-[#D97706] shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_5px_rgba(13,23,41,0.18)]',
    iconBoxIdle:
      'bg-[#FFF8EB] text-[#D97706] border-[#F5D08A] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(13,23,41,0.06)]',
    badgeIdle: 'bg-[#FFF8EB] text-[#B45309] border border-[#F5D08A]',
    badgeActive: 'bg-[#D97706] text-white border border-[#D97706]',
  },
};

export default function DiscountConfigEditor({
  value,
  onChange,
  unitPrice,
  compact = false,
}: DiscountConfigEditorProps) {
  const safePrice = Math.max(0.01, Number(unitPrice) || 0);
  const currentMode: DiscountMode = value?.mode || 'none';
  const tiers: DiscountTier[] =
    value?.tiers && value.tiers.length > 0 ? value.tiers : DEFAULT_PROGRESSIVE_TIERS;
  const buyX = Math.max(2, Math.min(1000, Math.round(value?.buy_x_qty ?? DEFAULT_BUY_X_QTY)));
  const payY = Math.max(1, Math.min(buyX - 1, Math.round(value?.pay_y_qty ?? DEFAULT_PAY_Y_QTY)));
  const simpleMin = value?.simple_min_tickets ?? 2;
  const simplePercent = value?.simple_percent ?? 10;
  const rouletteMin = value?.roulette_min_tickets ?? 2;
  const rouletteOptions =
    value?.roulette_options && value.roulette_options.length >= 2
      ? value.roulette_options
      : DEFAULT_ROULETTE_OPTIONS;

  function handleSelectMode(mode: DiscountMode) {
    onChange({
      ...DEFAULT_DISCOUNT_CONFIG,
      ...value,
      mode,
      tiers,
      buy_x_qty: buyX,
      pay_y_qty: payY,
      simple_min_tickets: simpleMin,
      simple_percent: simplePercent,
      roulette_min_tickets: rouletteMin,
      roulette_options: rouletteOptions,
    });
  }

  function handleBuyXChange(raw: number) {
    const nextX = Math.max(2, Math.min(1000, Math.round(raw || 2)));
    const nextY = payY >= nextX ? Math.max(1, nextX - 1) : payY;
    onChange({
      ...value,
      mode: 'buy_x_pay_y',
      buy_x_qty: nextX,
      pay_y_qty: nextY,
    });
  }

  function handlePayYChange(raw: number) {
    const nextY = Math.max(1, Math.min(buyX - 1, Math.round(raw || 1)));
    onChange({
      ...value,
      mode: 'buy_x_pay_y',
      buy_x_qty: buyX,
      pay_y_qty: nextY,
    });
  }

  function updateTier(idx: number, field: keyof DiscountTier, raw: number) {
    const nextTiers = tiers.map((t, i) =>
      i === idx
        ? {
            ...t,
            [field]:
              field === 'min_tickets'
                ? Math.max(2, Math.round(raw || 2))
                : Math.min(80, Math.max(1, Math.round(raw || 1))),
          }
        : t
    );
    onChange({ ...value, mode: currentMode, tiers: nextTiers });
  }

  function addTier() {
    if (tiers.length >= 5) return;
    const last = tiers[tiers.length - 1] || { min_tickets: 5, percent: 10 };
    const nextTiers = [
      ...tiers,
      {
        min_tickets: Math.max(2, last.min_tickets + 5),
        percent: Math.min(80, last.percent + 5),
      },
    ];
    onChange({ ...value, mode: currentMode, tiers: nextTiers });
  }

  function removeTier(idx: number) {
    if (tiers.length <= 1) return;
    onChange({
      ...value,
      mode: currentMode,
      tiers: tiers.filter((_, i) => i !== idx),
    });
  }

  function updateRouletteOption(idx: number, raw: number) {
    const nextOpts = rouletteOptions.map((opt, i) =>
      i === idx ? Math.min(80, Math.max(1, Math.round(raw || 1))) : opt
    );
    onChange({ ...value, mode: currentMode, roulette_options: nextOpts });
  }

  const normalizedPreview = normalizeDiscountConfig(value);
  const singleBundlePreview = calculateDiscountedPricing({
    ticketCount: buyX,
    unitPrice: safePrice,
    config: { ...normalizedPreview, mode: 'buy_x_pay_y', buy_x_qty: buyX, pay_y_qty: payY },
  });
  const doubleBundlePreview = calculateDiscountedPricing({
    ticketCount: buyX * 2,
    unitPrice: safePrice,
    config: { ...normalizedPreview, mode: 'buy_x_pay_y', buy_x_qty: buyX, pay_y_qty: payY },
  });

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-[14px] bg-[#EDF5FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center shrink-0 mt-0.5">
          <Tag className="w-4 h-4" />
        </span>
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#0D1729] tracking-[-0.02em]">
            Descontos para Múltiplos Bilhetes
          </h3>
          <p className="text-xs text-[#526480] mt-0.5">
            Incentive seus clientes a comprarem mais cotas pagando menos por bilhete no PIX.
          </p>
        </div>
      </div>

      {/* Seletor de Modalidade (4 Card Buttons táteis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-1">
        {MODE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = currentMode === item.mode;
          const tone = TONE_CLASSES[item.tone];
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => handleSelectMode(item.mode)}
              aria-pressed={isSelected}
              className={`group relative min-h-[104px] p-3 rounded-[18px] text-left select-none transition-all duration-150 ease-out cursor-pointer flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0869F5] focus-visible:ring-offset-2 ${
                isSelected ? tone.activeCard : tone.idleCard
              }`}
            >
              {/* Linha superior: Ícone + Título e selo ao lado */}
              <div className="flex items-center gap-2.5 w-full min-w-0">
                <span
                  className={`w-9 h-9 rounded-[12px] border flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                    isSelected ? tone.iconBoxActive : tone.iconBoxIdle
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block font-display font-bold text-[12.5px] sm:text-[13px] text-[#0D1729] leading-tight">
                    {item.label}
                  </span>
                  <span
                    className={`mt-1 whitespace-nowrap inline-flex items-center px-2 py-[3px] rounded-full text-[8.5px] font-bold uppercase tracking-[0.04em] leading-none ${
                      isSelected ? tone.badgeActive : tone.badgeIdle
                    }`}
                  >
                    {item.badge || 'Padrão'}
                  </span>
                </div>
              </div>

              {/* Subtítulo enxuto */}
              <span className="block text-[11px] text-[#526480] leading-snug">
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Painel Progressivo */}
      {currentMode === 'progressive' && (
        <div className="p-4 rounded-[20px] bg-[#F5F9FF] border border-[#CDE0FC] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0D1729]">
              Faixas de Desconto Progressivo
            </span>
            {tiers.length < 5 && (
              <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#CDE0FC] hover:border-[#0869F5] text-[#0869F5] text-[11px] font-bold cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar faixa</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {tiers.map((tier, idx) => {
              const effectiveUnit = Math.max(
                0.01,
                safePrice * (1 - Math.min(80, Math.max(1, tier.percent)) / 100)
              );
              return (
                <div
                  key={idx}
                  className="bg-white rounded-[14px] border border-[#DCE8F8] p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 tabular-nums"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#14213A]">
                    <span>A partir de</span>
                    <input
                      type="number"
                      min={2}
                      max={10000}
                      value={tier.min_tickets}
                      onChange={(e) =>
                        updateTier(idx, 'min_tickets', parseInt(e.target.value, 10))
                      }
                      aria-label={`Quantidade mínima da faixa ${idx + 1}`}
                      className="w-16 px-2 py-1 rounded-lg bg-[#F5F9FF] border border-[#D9E5F7] text-center font-bold text-[#0D1729] focus:outline-none focus:border-[#0869F5]"
                    />
                    <span>cotas →</span>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={tier.percent}
                      onChange={(e) =>
                        updateTier(idx, 'percent', parseInt(e.target.value, 10))
                      }
                      aria-label={`Percentual de desconto da faixa ${idx + 1}`}
                      className="w-16 px-2 py-1 rounded-lg bg-[#E8F7F0] border border-[#B9E7D2] text-center font-bold text-[#00A868] focus:outline-none focus:border-[#00A868]"
                    />
                    <span className="font-bold text-[#00A868]">% OFF</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[11px] font-semibold text-[#526480]">
                      (R$ {effectiveUnit.toFixed(2)}/cota)
                    </span>
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        aria-label="Remover faixa"
                        className="p-1.5 rounded-lg text-[#BE123C] hover:bg-[#FFF1F2] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Painel Compre X, Pague Y */}
      {currentMode === 'buy_x_pay_y' && (
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#F3FAF6] border border-[#B9E7D2] space-y-3.5">
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
              Combos populares de 1 clique
            </span>
            <div className="flex flex-wrap gap-1.5 tabular-nums">
              {BUY_X_PAY_Y_PRESETS.map((preset) => {
                const isActive = buyX === preset.buyX && payY === preset.payY;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        mode: 'buy_x_pay_y',
                        buy_x_qty: preset.buyX,
                        pay_y_qty: preset.payY,
                      })
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      isActive
                        ? 'bg-[#00A868] border-[#00A868] text-white shadow-xs'
                        : 'bg-white border-[#B9E7D2] text-[#065F46] hover:border-[#00A868]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
            <div>
              <label
                htmlFor="buy-x-qty-input"
                className="block text-[11px] font-bold text-[#14213A] mb-1"
              >
                Cliente escolhe (X cotas)
              </label>
              <input
                id="buy-x-qty-input"
                type="number"
                min={2}
                max={1000}
                value={buyX}
                onChange={(e) => handleBuyXChange(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#B9E7D2] rounded-[12px] text-sm font-bold text-[#0D1729] focus:outline-none focus:border-[#00A868]"
              />
            </div>

            <div>
              <label
                htmlFor="pay-y-qty-input"
                className="block text-[11px] font-bold text-[#14213A] mb-1"
              >
                Cliente paga apenas (Y cotas)
              </label>
              <input
                id="pay-y-qty-input"
                type="number"
                min={1}
                max={Math.max(1, buyX - 1)}
                value={payY}
                onChange={(e) => handlePayYChange(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#B9E7D2] rounded-[12px] text-sm font-bold text-[#00A868] focus:outline-none focus:border-[#00A868]"
              />
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#B9E7D2] p-3 space-y-1.5 text-xs text-[#14213A] tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Regra ativa:</strong> a cada{' '}
                <strong className="text-[#0D1729]">{buyX} cotas</strong> escolhidas,{' '}
                <strong className="text-[#00A868]">
                  {buyX - payY} {buyX - payY === 1 ? 'sai grátis' : 'saem grátis'}
                </strong>{' '}
                (~{singleBundlePreview.discountPercent}% de economia).
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F7F0] text-[#00A868] font-bold text-[11px]">
                De R$ {singleBundlePreview.originalAmount.toFixed(2)} por R${' '}
                {singleBundlePreview.finalAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-[#526480]">
              Cumulativo automático: se o cliente escolher{' '}
              <strong>{buyX * 2} cotas</strong>, ganha{' '}
              <strong>{doubleBundlePreview.freeTickets} grátis</strong> e paga{' '}
              <strong>R$ {doubleBundlePreview.finalAmount.toFixed(2)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Aviso de retrocompatibilidade para campanhas legadas salvas no modo 'simple' */}
      {currentMode === 'simple' && (
        <div className="p-4 rounded-[20px] bg-[#FFFBEB] border border-[#F5D08A] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[#78350F]">
              <strong>Regra legada ativa ({simpleMin}+ cotas · {simplePercent}% OFF)</strong>
              <span className="block text-[11px] text-[#92400E] mt-0.5">
                Esta campanha usa o formato antigo de desconto simples. Você pode migrar para &ldquo;Compre 3, Pague 2&rdquo; com 1 clique.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectMode('buy_x_pay_y')}
              className="px-3.5 py-2 rounded-full bg-[#00A868] text-white text-xs font-bold hover:brightness-105 transition cursor-pointer"
            >
              Migrar para Compre 3, Pague 2
            </button>
          </div>
        </div>
      )}

      {/* Painel Roleta Promocional */}
      {currentMode === 'roulette' && (
        <div className="p-4 rounded-[20px] bg-[#FFFDF5] border border-[#F5D08A] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                Mínimo de cotas para liberar a Roleta
              </label>
              <input
                type="number"
                min={2}
                max={1000}
                value={rouletteMin}
                onChange={(e) =>
                  onChange({
                    ...value,
                    mode: 'roulette',
                    roulette_min_tickets: Math.max(2, parseInt(e.target.value, 10) || 2),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#F5D08A] rounded-[12px] text-sm font-bold text-[#0D1729] tabular-nums focus:outline-none focus:border-[#D97706]"
              />
            </div>
            <p className="text-[11px] text-[#92400E] leading-snug">
              Ao atingir <strong>{rouletteMin}+ cotas</strong>, o comprador gira a Roleta da Sorte 1 vez na sessão e ganha na hora uma das porcentagens abaixo.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-[#78350F]">
              Opções de desconto na Roleta (%):
            </span>
            <div className="grid grid-cols-4 gap-2 tabular-nums">
              {rouletteOptions.slice(0, 4).map((opt, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#F5D08A] rounded-[12px] px-2 py-1.5 flex items-center justify-center gap-1"
                >
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={opt}
                    onChange={(e) =>
                      updateRouletteOption(idx, parseInt(e.target.value, 10))
                    }
                    aria-label={`Fatia ${idx + 1} da roleta`}
                    className="w-11 text-center text-sm font-bold text-[#0D1729] focus:outline-none"
                  />
                  <span className="text-xs font-bold text-[#D97706]">%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
