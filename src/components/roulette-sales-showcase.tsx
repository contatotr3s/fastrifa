'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Dices,
  Lock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface StageOption {
  percent: number;
  eligible: boolean;
  chanceLabel: string;
  barWidth: number;
}

interface StageConfig {
  id: string;
  tabLabel: string;
  badgeText: string;
  headline: string;
  description: string;
  options: StageOption[];
}

const PROGRESSIVE_STAGES: StageConfig[] = [
  {
    id: 'spin-1',
    tabLabel: '1º Giro',
    badgeText: 'Média controlada: 8,5% OFF',
    headline: 'Entrada com sorteio calibrado',
    description:
      'As 4 fatias ficam disponíveis, mas os pesos protegem a margem do organizador desde o primeiro pedido.',
    options: [
      { percent: 5, eligible: true, chanceLabel: '55,0%', barWidth: 55 },
      { percent: 10, eligible: true, chanceLabel: '25,0%', barWidth: 25 },
      { percent: 15, eligible: true, chanceLabel: '15,0%', barWidth: 15 },
      { percent: 20, eligible: true, chanceLabel: '5,0%', barWidth: 5 },
    ],
  },
  {
    id: 'spin-2',
    tabLabel: 'Pagou 5%',
    badgeText: 'Recompra após PIX confirmado',
    headline: 'Sobe para a faixa seguinte (10% a 20%)',
    description:
      'Depois que o PIX da 1ª compra cai na conta, a fatia de 5% sai da roleta e as chances das restantes são reproporcionadas.',
    options: [
      { percent: 5, eligible: false, chanceLabel: 'Eliminada', barWidth: 0 },
      { percent: 10, eligible: true, chanceLabel: '55,6%', barWidth: 56 },
      { percent: 15, eligible: true, chanceLabel: '33,3%', barWidth: 33 },
      { percent: 20, eligible: true, chanceLabel: '11,1%', barWidth: 11 },
    ],
  },
  {
    id: 'spin-3',
    tabLabel: 'Pagou 10%',
    badgeText: 'Rumo ao teto da campanha',
    headline: 'Concorre direto entre 15% e 20% OFF',
    description:
      'Cada pagamento confirmado elimina os degraus anteriores da roda e mantém o prêmio máximo proporcionalmente exclusivo.',
    options: [
      { percent: 5, eligible: false, chanceLabel: 'Eliminada', barWidth: 0 },
      { percent: 10, eligible: false, chanceLabel: 'Eliminada', barWidth: 0 },
      { percent: 15, eligible: true, chanceLabel: '75,0%', barWidth: 75 },
      { percent: 20, eligible: true, chanceLabel: '25,0%', barWidth: 25 },
    ],
  },
];

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export default function RouletteSalesShowcase() {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const activeStage = PROGRESSIVE_STAGES[activeStageIdx] || PROGRESSIVE_STAGES[0];

  const cx = 100;
  const cy = 100;
  const r = 88;
  const wheelOptions = activeStage.options.filter((opt) => opt.eligible);
  const sliceAngle = 360 / Math.max(1, wheelOptions.length);

  return (
    <section
      id="roleta-de-vendas"
      className="ora-section-seam scroll-mt-20 py-14 sm:py-20 px-4 sm:px-8"
    >
      <div className="max-w-[1280px] w-full mx-auto">
        <div className="ora-demo-stage rounded-[24px] lg:rounded-[32px] p-5 sm:p-8 lg:p-10 border border-[#D9E5F7] shadow-[0_22px_60px_rgba(32,77,139,0.08)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Coluna Esquerda: Argumento Comercial + Benefícios */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <span className="text-[#0869F5] text-xs font-bold uppercase tracking-wider block">
                Motor de Recompra · Exclusivo FastRifa
              </span>
              <h2 className="font-display font-bold text-[clamp(1.75rem,3vw,2.65rem)] leading-[1.08] tracking-[-0.035em] text-[#0D1729]">
                Roleta da Sorte Progressiva: uma compra puxa a outra.
              </h2>
              <p className="text-[14.5px] sm:text-[16px] text-[#475872] leading-[1.6] max-w-xl mx-auto lg:mx-0">
                Aumente o ticket médio, acelere o pagamento no PIX e faça o mesmo comprador voltar para garantir mais cotas — com probabilidades inteligentes que protegem a sua margem.
              </p>

              <div className="space-y-2.5 pt-1 text-left max-w-xl mx-auto lg:mx-0">
                <div className="flex items-start gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#14213A]">
                  <span className="w-6 h-6 rounded-full bg-[#EDF5FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    <strong>Mais cotas por pedido:</strong> exige mínimo de bilhetes para girar e deixa o cliente somar mais números mantendo o desconto.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#14213A]">
                  <span className="w-6 h-6 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    <strong>Urgência real de 10 minutos:</strong> contador regressivo no checkout incentiva o pagamento imediato no PIX.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#14213A]">
                  <span className="w-6 h-6 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    <strong>Recompra validada sem prejuízo:</strong> só libera novo giro (em faixas maiores até o teto) depois que o PIX da compra anterior for confirmado.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center lg:justify-start">
                <Link
                  href="/cadastro"
                  className="ora-btn-primary rounded-[18px] px-6 py-3.5 text-[15px] font-bold inline-flex items-center gap-2 shadow-[0_12px_28px_rgba(8,105,245,0.22)]"
                >
                  <span>Ativar Roleta na Minha Rifa</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Coluna Direita: Simulador Interativo da Escada Progressiva */}
            <div className="lg:col-span-6">
              <div className="ora-card rounded-[26px] p-5 sm:p-6 border border-[#D9E5F7] bg-white space-y-4">
                {/* Cabeçalho + Seletor de Estágios */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D1729]">
                    <Dices className="w-4 h-4 text-[#0869F5]" />
                    <span>Simulação da Escada Progressiva</span>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Estágios da roleta progressiva"
                    className="inline-flex items-center gap-1 p-1 rounded-full bg-[#F5F9FF] border border-[#D9E5F7] self-start sm:self-auto"
                  >
                    {PROGRESSIVE_STAGES.map((stage, idx) => {
                      const isActive = idx === activeStageIdx;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveStageIdx(idx)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-[#0869F5] text-white shadow-xs'
                              : 'text-[#475872] hover:text-[#0D1729]'
                          }`}
                        >
                          {stage.tabLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Título e Badge da Etapa */}
                <div className="rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] p-3.5 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="font-display font-bold text-sm sm:text-[15px] text-[#0D1729]">
                      {activeStage.headline}
                    </strong>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#065F46] text-[10.5px] font-bold">
                      {activeStage.badgeText}
                    </span>
                  </div>
                  <p className="text-xs text-[#475872] leading-relaxed">
                    {activeStage.description}
                  </p>
                </div>

                {/* Mini Roda SVG + Tabela de Chances Reproporcionadas */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5 flex items-center justify-center">
                    <div className="relative w-44 h-44 sm:w-[176px] sm:h-[176px] flex items-center justify-center select-none">
                      <div
                        aria-hidden="true"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[15px] border-t-[#0D1729]"
                      />
                      <svg
                        viewBox="0 0 200 200"
                        className="w-full h-full drop-shadow-[0_10px_22px_rgba(13,23,41,0.12)]"
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r + 3}
                          fill="#FFFFFF"
                          stroke="#D9E5F7"
                          strokeWidth="3"
                        />
                        {wheelOptions.length === 1 ? (
                          <g key={`single-${wheelOptions[0].percent}`}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill="#F59E0B"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            <text
                              x={cx}
                              y={cy - r * 0.52}
                              fill="#FFFFFF"
                              fontSize="15"
                              fontWeight="800"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {wheelOptions[0].percent}%
                            </text>
                          </g>
                        ) : (
                          wheelOptions.map((opt, idx) => {
                            const startAngle = idx * sliceAngle;
                            const endAngle = (idx + 1) * sliceAngle;
                            const start = polarToCartesian(cx, cy, r, endAngle);
                            const end = polarToCartesian(cx, cy, r, startAngle);
                            const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                            const d = [
                              `M ${cx} ${cy}`,
                              `L ${end.x} ${end.y}`,
                              `A ${r} ${r} 0 ${largeArcFlag} 1 ${start.x} ${start.y}`,
                              'Z',
                            ].join(' ');
                            const midAngle = startAngle + sliceAngle / 2;
                            const labelPos = polarToCartesian(cx, cy, r * 0.62, midAngle);
                            const isMax = opt.percent === 20;
                            const fill = isMax
                              ? '#F59E0B'
                              : idx % 2 === 0
                                ? '#00A868'
                                : '#EDF5FF';
                            const textFill =
                              isMax || idx % 2 === 0 ? '#FFFFFF' : '#0D1729';

                            return (
                              <g key={opt.percent}>
                                <path
                                  d={d}
                                  fill={fill}
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                />
                                <text
                                  x={labelPos.x}
                                  y={labelPos.y}
                                  fill={textFill}
                                  fontSize="13"
                                  fontWeight="800"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
                                >
                                  {opt.percent}%
                                </text>
                              </g>
                            );
                          })
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="16"
                          fill="#FFFFFF"
                          stroke="#D9E5F7"
                          strokeWidth="2.5"
                        />
                        <circle cx={cx} cy={cy} r="7" fill="#0869F5" />
                      </svg>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2.5 tabular-nums">
                    {activeStage.options.map((opt) => (
                      <div key={opt.percent} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              opt.eligible
                                ? 'text-[#0D1729]'
                                : 'text-[#8A9BB3] line-through'
                            }`}
                          >
                            {!opt.eligible && <Lock className="w-3 h-3 text-[#8A9BB3]" />}
                            <span>{opt.percent}% OFF</span>
                            {opt.percent === 20 && opt.eligible && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#FFF8EB] text-[#9A6700] text-[9.5px] font-extrabold">
                                Teto
                              </span>
                            )}
                          </span>
                          <span
                            className={
                              opt.eligible ? 'text-[#0869F5]' : 'text-[#8A9BB3] font-semibold'
                            }
                          >
                            {opt.chanceLabel}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EEF4FD] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              !opt.eligible
                                ? 'bg-[#CBD5E1]'
                                : opt.percent === 20
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#00A868]'
                            }`}
                            style={{ width: `${opt.barWidth}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rodapé de garantia */}
                <div className="pt-2 border-t border-[#E0E9F7] flex items-center gap-2 text-[11.5px] font-semibold text-[#065F46]">
                  <CheckCircle2 className="w-4 h-4 text-[#00A868] shrink-0" />
                  <span>
                    Novo giro liberado somente após confirmação real do PIX anterior.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
