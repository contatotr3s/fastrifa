'use client';

import React from 'react';
import {
  Ban,
  Dices,
  Layers,
  Percent,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_DISCOUNT_CONFIG,
  DEFAULT_PROGRESSIVE_TIERS,
  DEFAULT_ROULETTE_OPTIONS,
  normalizeDiscountConfig,
} from '@/lib/discounts';
import type { DiscountMode, DiscountTier, RaffleDiscountConfig } from '@/types/database.types';

interface DiscountConfigEditorProps {
  value: RaffleDiscountConfig;
  onChange: (next: RaffleDiscountConfig) => void;
  unitPrice: number;
  compact?: boolean;
}

const MODE_OPTIONS: Array<{
  mode: DiscountMode;
  label: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    mode: 'none',
    label: 'Sem Desconto',
    subtitle: 'Preço fixo por cota',
    icon: Ban,
  },
  {
    mode: 'progressive',
    label: 'Progressivo',
    subtitle: 'Mais cotas, maior desconto',
    badge: 'Mais vendas',
    icon: Layers,
  },
  {
    mode: 'simple',
    label: 'Regra Simples',
    subtitle: 'Compre N+ e ganhe X%',
    icon: Percent,
  },
  {
    mode: 'roulette',
    label: 'Roleta de Desconto',
    subtitle: 'Cliente gira para ganhar %',
    badge: 'Interativo',
    icon: Dices,
  },
];

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
      simple_min_tickets: simpleMin,
      simple_percent: simplePercent,
      roulette_min_tickets: rouletteMin,
      roulette_options: rouletteOptions,
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

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#0D1729] tracking-[-0.02em] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0869F5]" />
            <span>Descontos para Múltiplos Bilhetes</span>
          </h3>
          <p className="text-xs text-[#526480] mt-0.5">
            Incentive seus clientes a comprarem mais cotas pagando menos por bilhete no PIX.
          </p>
        </div>
      </div>

      {/* Seletor de Modalidade (4 Opções) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MODE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => handleSelectMode(item.mode)}
              className={`relative p-3 rounded-[16px] border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-[#EDF5FF] border-[#0869F5] shadow-[0_6px_18px_rgba(8,105,245,0.12)]'
                  : 'bg-[#F8FBFF] border-[#DCE8F8] hover:border-[#B9D3F8] hover:bg-white'
              }`}
            >
              {item.badge && (
                <span
                  className={`self-start px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'bg-[#0869F5] text-white'
                      : 'bg-[#E8F7F0] text-[#00A868]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-[#0869F5]' : 'text-[#526480]'
                  }`}
                />
                <span className="font-display font-bold text-xs text-[#0D1729] leading-tight">
                  {item.label}
                </span>
              </div>
              <span className="text-[10.5px] text-[#526480] leading-snug">
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

      {/* Painel Regra Simples */}
      {currentMode === 'simple' && (
        <div className="p-4 rounded-[20px] bg-[#F5F9FF] border border-[#CDE0FC] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
            <div>
              <label className="block text-[11px] font-bold text-[#14213A] mb-1">
                Quantidade mínima de cotas
              </label>
              <input
                type="number"
                min={2}
                max={10000}
                value={simpleMin}
                onChange={(e) =>
                  onChange({
                    ...value,
                    mode: 'simple',
                    simple_min_tickets: Math.max(2, parseInt(e.target.value, 10) || 2),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9E5F7] rounded-[12px] text-sm font-bold text-[#0D1729] focus:outline-none focus:border-[#0869F5]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#14213A] mb-1">
                Percentual de desconto (%)
              </label>
              <input
                type="number"
                min={1}
                max={80}
                value={simplePercent}
                onChange={(e) =>
                  onChange({
                    ...value,
                    mode: 'simple',
                    simple_percent: Math.min(80, Math.max(1, parseInt(e.target.value, 10) || 1)),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#B9E7D2] rounded-[12px] text-sm font-bold text-[#00A868] focus:outline-none focus:border-[#00A868]"
              />
            </div>
          </div>

          <p className="text-xs font-medium text-[#475872] bg-white rounded-[12px] px-3 py-2 border border-[#E0E9F7] tabular-nums">
            Prévia: comprando <strong>{normalizedPreview.simple_min_tickets}+ cotas</strong>, o cliente ganha{' '}
            <strong className="text-[#00A868]">{normalizedPreview.simple_percent}% OFF</strong> e paga{' '}
            <strong>
              R$ {(safePrice * (1 - (normalizedPreview.simple_percent || 0) / 100)).toFixed(2)}
            </strong>{' '}
            por número.
          </p>
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
