'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dices, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface DiscountRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: number[];
  brandColor?: 'blue' | 'green' | string | null;
  alreadyWonPercent?: number | null;
  onWin: (percent: number) => void;
}

export default function DiscountRouletteModal({
  isOpen,
  onClose,
  options,
  brandColor,
  alreadyWonPercent,
  onWin,
}: DiscountRouletteModalProps) {
  const safeOptions = options && options.length >= 2 ? options.slice(0, 6) : [5, 10, 15, 20];
  const isGreen = brandColor === 'green';

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPercent, setWonPercent] = useState<number | null>(alreadyWonPercent || null);

  useEffect(() => {
    if (isOpen) {
      setWonPercent(alreadyWonPercent || null);
      setIsSpinning(false);
    }
  }, [isOpen, alreadyWonPercent]);

  if (!isOpen) return null;

  const sliceAngle = 360 / safeOptions.length;
  const maxOption = Math.max(...safeOptions);

  function handleSpin() {
    if (isSpinning || wonPercent) return;

    let randIndex = 0;
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      randIndex = buf[0] % safeOptions.length;
    } else {
      randIndex = Math.floor(Math.random() * safeOptions.length);
    }

    const chosenPercent = safeOptions[randIndex];
    // Ponteiro está no topo (0 deg). Fatia i ocupa [i*sliceAngle, (i+1)*sliceAngle] a partir do topo em sentido horário.
    // Para alinhar o centro da fatia i com 0 deg após girar: rot = 360 - (i + 0.5) * sliceAngle
    const centerAngle = (randIndex + 0.5) * sliceAngle;
    const targetMod = (360 - centerAngle + 360) % 360;
    const baseTurns = 360 * 5;
    const finalRotation = rotation - (rotation % 360) + baseTurns + targetMod;

    setIsSpinning(true);
    setRotation(finalRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setWonPercent(chosenPercent);
      onWin(chosenPercent);
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: isGreen
            ? ['#00A868', '#10B981', '#F59E0B', '#FFFFFF']
            : ['#0869F5', '#529BFF', '#F59E0B', '#FFFFFF'],
        });
      } catch {}
    }, 3400);
  }

  // Gera os caminhos SVG das fatias
  const cx = 140;
  const cy = 140;
  const r = 130;

  function polarToCartesian(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="ora-card rounded-[28px] max-w-md w-full p-5 sm:p-7 space-y-5 text-center relative my-auto border border-[#D9E5F7] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSpinning}
          aria-label="Fechar roleta de desconto"
          className="absolute right-4 top-4 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F5F9FF] cursor-pointer disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Roleta da Sorte • 1 Giro por Campanha
          </span>
          <h3 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
            {wonPercent ? `Você ganhou ${wonPercent}% OFF!` : 'Gire e ganhe seu desconto!'}
          </h3>
          <p className="text-xs text-[#475872]">
            {wonPercent
              ? 'O desconto já foi aplicado automaticamente no cálculo do seu PIX.'
              : 'Seu desconto será aplicado na hora sobre todas as cotas selecionadas.'}
          </p>
        </div>

        {/* Roda SVG + Ponteiro */}
        <div className="relative mx-auto w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] flex items-center justify-center">
          {/* Ponteiro fixo no topo */}
          <div
            aria-hidden="true"
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#0D1729] drop-shadow-md"
          />

          <svg
            viewBox="0 0 280 280"
            className="w-full h-full drop-shadow-[0_14px_30px_rgba(13,23,41,0.16)]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 3.4s cubic-bezier(0.16, 1, 0.3, 1)'
                : 'none',
            }}
          >
            <circle cx={cx} cy={cy} r={r + 4} fill="#FFFFFF" stroke="#D9E5F7" strokeWidth="4" />
            {safeOptions.map((pct, idx) => {
              const startAngle = idx * sliceAngle;
              const endAngle = (idx + 1) * sliceAngle;
              const start = polarToCartesian(endAngle, r);
              const end = polarToCartesian(startAngle, r);
              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              const d = [
                `M ${cx} ${cy}`,
                `L ${end.x} ${end.y}`,
                `A ${r} ${r} 0 ${largeArcFlag} 1 ${start.x} ${start.y}`,
                'Z',
              ].join(' ');

              const midAngle = startAngle + sliceAngle / 2;
              const labelPos = polarToCartesian(midAngle, r * 0.63);
              const isTopPrize = pct === maxOption;
              const fillColor = isTopPrize
                ? '#F59E0B'
                : idx % 2 === 0
                  ? isGreen
                    ? '#00A868'
                    : '#0869F5'
                  : isGreen
                    ? '#E8F7F0'
                    : '#EDF5FF';
              const textColor =
                isTopPrize || idx % 2 === 0 ? '#FFFFFF' : '#0D1729';

              return (
                <g key={`${idx}-${pct}`}>
                  <path d={d} fill={fillColor} stroke="#FFFFFF" strokeWidth="2.5" />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={textColor}
                    fontSize="16"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r="22" fill="#FFFFFF" stroke="#D9E5F7" strokeWidth="3" />
            <circle cx={cx} cy={cy} r="10" fill={isGreen ? '#00A868' : '#0869F5'} />
          </svg>
        </div>

        {/* Botão de Ação */}
        {wonPercent ? (
          <button
            type="button"
            onClick={onClose}
            className="ora-btn-primary w-full py-3.5 rounded-[18px] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aplicar Desconto de {wonPercent}% OFF</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className="ora-btn-primary w-full py-3.5 rounded-[18px] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Dices className="w-4 h-4" />
            <span>{isSpinning ? 'Girando a Roleta...' : 'Girar Roleta e Destravar Desconto'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
