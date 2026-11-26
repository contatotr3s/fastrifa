'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageCircle,
  Pause,
  Play,
  QrCode,
  Send,
  Sparkles,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface StepItem {
  id: string;
  stepNumber: string;
  shortLabel: string;
  title: string;
  description: string;
  highlight: string;
  stageTag: string;
  stageSubtitle: string;
  icon: LucideIcon;
}

const AUTO_ADVANCE_MS = 5500;

const STEPS: StepItem[] = [
  {
    id: 'passo-1',
    stepNumber: 'Passo 1',
    shortLabel: 'Criar',
    title: 'Você cria em 2 minutos',
    description:
      'Coloque o título do prêmio, a quantidade de cotas, o valor do número e sua chave PIX. Sem burocracia.',
    highlight: '⚡ Rifa no ar na hora',
    stageTag: 'Criador Relâmpago',
    stageSubtitle: 'Configuração guiada pronta em segundos',
    icon: Zap,
  },
  {
    id: 'passo-2',
    stepNumber: 'Passo 2',
    shortLabel: 'Divulgar',
    title: 'Você divulga no WhatsApp',
    description:
      'Copie seu link exclusivo e mande nos grupos, status do zap e redes sociais. O link abre rápido em qualquer celular.',
    highlight: '📲 Link pronto com 1 clique',
    stageTag: 'Compartilhamento Direto',
    stageSubtitle: 'Link leve que carrega rápido nos grupos',
    icon: MessageCircle,
  },
  {
    id: 'passo-3',
    stepNumber: 'Passo 3',
    shortLabel: 'Vender',
    title: 'Seu cliente escolhe e paga',
    description:
      'Ele clica nos números da sorte, copia seu PIX, faz o pagamento e envia o comprovante direto no seu WhatsApp.',
    highlight: '💸 PIX direto pro seu banco',
    stageTag: 'Checkout Sem Cadastro',
    stageSubtitle: 'Cotas selecionadas e PIX Copia e Cola automático',
    icon: QrCode,
  },
  {
    id: 'passo-4',
    stepNumber: 'Passo 4',
    shortLabel: 'Receber',
    title: 'Você recebe e confirma',
    description:
      'O dinheiro já está na sua conta bancária. Você confere no painel e confirma as cotas com 1 toque.',
    highlight: '🏆 100% sob seu controle',
    stageTag: 'Painel em Tempo Real',
    stageSubtitle: 'Aprovação instantânea direto no seu banco',
    icon: Trophy,
  },
];

function StepStageVisual({
  stepIndex,
  direction,
  compact = false,
}: {
  stepIndex: number;
  direction: number;
  compact?: boolean;
}) {
  const stageDirectionClass =
    direction < 0 ? 'fr-hiw-stage-in-bwd' : 'fr-hiw-stage-in-fwd';

  if (stepIndex === 0) {
    return (
      <div
        key={`stage-0-${compact ? 'm' : 'd'}`}
        className={`${stageDirectionClass} w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px] pt-3.5'} mx-auto relative`}
      >
        {/* Pill flutuante superior direita */}
        <div
          className={`fr-hiw-pop fr-hiw-delay-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] font-bold shadow-[0_10px_24px_rgba(0,168,104,0.14)] ${
            compact
              ? 'px-2.5 py-0.5 text-[10px] mb-1.5'
              : 'px-3.5 py-1 text-xs absolute top-0 right-3 z-20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>⚡ No ar em 1m 42s</span>
        </div>

        {/* Mini card do criador Fast Rifa */}
        <div
          className={`bg-white rounded-[22px] border border-[#D9E5F7] shadow-[0_18px_42px_rgba(32,77,139,0.10)] ${
            compact ? 'p-2.5 space-y-1.5' : 'p-4 xl:p-5 space-y-3'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b border-[#EDF3FC] ${
              compact ? 'pb-1.5' : 'pb-2.5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </span>
              <span className="font-display font-bold text-xs sm:text-sm text-[#0D1729]">
                Nova Campanha
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EDF5FF] text-[#0869F5]">
              Passo único
            </span>
          </div>

          <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
            <div
              className={`fr-hiw-pop fr-hiw-delay-0 flex items-center justify-between bg-[#F5F9FF] border border-[#E0E9F7] rounded-[13px] px-3 ${
                compact ? 'py-1.5' : 'py-2'
              }`}
            >
              <span className="text-[11px] font-medium text-[#526480]">Prêmio</span>
              <span className="text-xs font-bold text-[#0D1729] truncate max-w-[190px]">
                iPhone 16 Pro Max
              </span>
            </div>

            <div
              className={`fr-hiw-pop fr-hiw-delay-1 grid grid-cols-2 ${
                compact ? 'gap-1.5' : 'gap-2'
              }`}
            >
              <div
                className={`bg-[#F5F9FF] border border-[#E0E9F7] rounded-[13px] px-3 ${
                  compact ? 'py-1.5' : 'py-2'
                } flex items-center justify-between`}
              >
                <span className="text-[11px] font-medium text-[#526480]">Cotas</span>
                <span className="text-xs font-bold text-[#0D1729] tabular-nums">100</span>
              </div>
              <div
                className={`bg-[#F5F9FF] border border-[#E0E9F7] rounded-[13px] px-3 ${
                  compact ? 'py-1.5' : 'py-2'
                } flex items-center justify-between`}
              >
                <span className="text-[11px] font-medium text-[#526480]">Valor</span>
                <span className="text-xs font-bold text-[#0869F5] tabular-nums">R$ 15,00</span>
              </div>
            </div>

            <div
              className={`fr-hiw-pop fr-hiw-delay-2 flex items-center justify-between bg-[#F3FAF6] border border-[#C6EBD8] rounded-[13px] px-3 ${
                compact ? 'py-1.5' : 'py-2'
              }`}
            >
              <span className="text-[11px] font-medium text-[#475872]">Chave PIX</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A868]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Chave verificada
              </span>
            </div>
          </div>

          <div className="fr-hiw-pop fr-hiw-delay-3 pt-0.5">
            <div
              className={`fr-hiw-shimmer ora-btn-primary rounded-[14px] w-full ${
                compact ? 'py-2' : 'py-2.5'
              } px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 pointer-events-none relative overflow-hidden`}
            >
              <Zap className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Publicar Rifa Agora</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepIndex === 1) {
    return (
      <div
        key={`stage-1-${compact ? 'm' : 'd'}`}
        className={`${stageDirectionClass} w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto space-y-2.5`}
      >
        {/* Barra de link copiado */}
        <div className="fr-hiw-pop fr-hiw-delay-0 bg-white rounded-[18px] border border-[#D9E5F7] p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(32,77,139,0.08)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold text-[#0D1729] truncate">
              fastrifa.app/r/iphone16
            </span>
          </div>
          <span className="fr-hiw-badge-pop shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] text-[11px] font-bold">
            <Check className="w-3 h-3" />
            Copiado
          </span>
        </div>

        {/* Conversa estilo WhatsApp */}
        <div
          className={`bg-white rounded-[22px] border border-[#D9E5F7] shadow-[0_18px_42px_rgba(32,77,139,0.10)] ${
            compact ? 'p-2.5 space-y-1.5' : 'p-4 sm:p-5 space-y-2.5'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#EDF3FC] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E8F7F0] text-[#00A868] flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-[#0D1729]">
                Grupo Amigos &amp; Status
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#00A868] bg-[#E8F7F0] px-2 py-0.5 rounded-full">
              Ao vivo
            </span>
          </div>

          {/* Bolha do organizador chegando da esquerda */}
          <div className="fr-hiw-bubble-in bg-[#F3FAF6] border border-[#C6EBD8] rounded-[16px] rounded-tl-sm p-2.5 sm:p-3 text-left space-y-1.5">
            <p className="text-[11.5px] sm:text-xs font-medium text-[#0D1729] leading-snug">
              🎉 <strong>Rifa Relâmpago!</strong> Escolha seu número da sorte em segundos e concorra a um iPhone 16 Pro Max!
            </p>
            <div className="bg-white rounded-[11px] px-2.5 py-1.5 border border-[#D9E5F7] flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-[#0869F5]">
                Abrir grade de cotas →
              </span>
              <span className="text-[10px] font-semibold text-[#526480] tabular-nums">
                R$ 15,00
              </span>
            </div>
          </div>

          {/* Reação / alcance */}
          <div className="fr-hiw-pop fr-hiw-delay-2 flex items-center justify-between gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0869F5] bg-[#EDF5FF] border border-[#CDE0FC] rounded-full px-3 py-1">
              <span className="fr-hiw-live-dot w-2 h-2 rounded-full bg-[#0869F5]" />
              <span>24 pessoas abrindo agora</span>
            </div>
            <span className="text-[11px] font-semibold text-[#526480]">
              📲 Status &amp; Grupos
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (stepIndex === 2) {
    const tickets = [
      { num: '01', status: 'free' },
      { num: '02', status: 'paid' },
      { num: '03', status: 'free' },
      { num: '04', status: 'free' },
      { num: '05', status: 'paid' },
      { num: '06', status: 'free' },
      { num: '07', status: 'selected', tapDelay: '60ms' },
      { num: '08', status: 'free' },
      { num: '09', status: 'free' },
      { num: '10', status: 'paid' },
      { num: '11', status: 'selected', tapDelay: '115ms' },
      { num: '12', status: 'selected', tapDelay: '170ms' },
    ];

    return (
      <div
        key={`stage-2-${compact ? 'm' : 'd'}`}
        className={`${stageDirectionClass} w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto space-y-2.5`}
      >
        {/* Mini grade de cotas */}
        <div
          className={`bg-white rounded-[22px] border border-[#D9E5F7] shadow-[0_18px_42px_rgba(32,77,139,0.10)] ${
            compact ? 'p-2.5 space-y-2' : 'p-4 sm:p-5 space-y-3'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0D1729]">
              Escolha seus números da sorte
            </span>
            <span className="text-[11px] font-bold text-[#0869F5] bg-[#EDF5FF] px-2.5 py-0.5 rounded-full tabular-nums">
              3 selecionadas
            </span>
          </div>

          <div className="fr-hiw-pop fr-hiw-delay-0 grid grid-cols-4 gap-1.5 sm:gap-2 tabular-nums">
            {tickets.map((t) => {
              if (t.status === 'selected') {
                return (
                  <div
                    key={t.num}
                    style={{ animationDelay: t.tapDelay }}
                    className="fr-hiw-ticket-tap rounded-[11px] py-1.5 sm:py-2 text-center text-xs font-bold bg-[#0869F5] text-white border border-[#0755DE] shadow-[0_6px_14px_rgba(8,105,245,0.28)]"
                  >
                    {t.num}
                  </div>
                );
              }
              if (t.status === 'paid') {
                return (
                  <div
                    key={t.num}
                    className="rounded-[11px] py-1.5 sm:py-2 text-center text-xs font-semibold bg-[#F1F5FA] text-[#94A3B8] border border-[#E2EAF5] line-through"
                  >
                    {t.num}
                  </div>
                );
              }
              return (
                <div
                  key={t.num}
                  className="rounded-[11px] py-1.5 sm:py-2 text-center text-xs font-bold bg-[#F8FBFF] text-[#14213A] border border-[#DCE8F8]"
                >
                  {t.num}
                </div>
              );
            })}
          </div>

          {/* Barra PIX Copia e Cola deslizando de baixo */}
          <div className="fr-hiw-pop fr-hiw-delay-4 bg-[#F5F9FF] border border-[#CDE0FC] rounded-[16px] p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10.5px] font-bold text-[#526480] tabular-nums">
                  3 cotas • R$ 45,00
                </span>
                <span className="block text-xs font-bold text-[#0D1729] truncate">
                  PIX Copia e Cola
                </span>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00A868] text-white text-[10.5px] font-bold shadow-xs">
              <Check className="w-3 h-3" />
              PIX Copiado
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`stage-3-${compact ? 'm' : 'd'}`}
      className={`${stageDirectionClass} w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto space-y-2.5`}
    >
      {/* Notificação Bancária PIX Recebido descendo suavemente do topo */}
      <div className="fr-hiw-push-in bg-white rounded-[18px] border-2 border-[#B9E7D2] p-3 shadow-[0_14px_32px_rgba(0,168,104,0.14)] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#E8F7F0] text-[#00A868] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div className="text-left min-w-0">
            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#00A868]">
              PIX Recebido na Conta
            </span>
            <span className="block font-display font-bold text-sm sm:text-base text-[#0D1729] tabular-nums">
              + R$ 45,00
            </span>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#E8F7F0] text-[#00A868] text-[10.5px] font-bold">
          Taxa R$ 0,00
        </span>
      </div>

      {/* Painel do Organizador - Aprovação 1 toque */}
      <div
        className={`bg-white rounded-[22px] border border-[#D9E5F7] shadow-[0_18px_42px_rgba(32,77,139,0.10)] ${
          compact ? 'p-2.5 space-y-2' : 'p-4 sm:p-5 space-y-3'
        }`}
      >
        <div className="fr-hiw-pop fr-hiw-delay-1 flex items-center justify-between gap-2 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[15px] p-2.5 sm:p-3">
          <div className="text-left min-w-0">
            <strong className="block text-xs sm:text-sm font-bold text-[#0D1729] truncate">
              Maria Silva
            </strong>
            <span className="block text-[11px] font-semibold text-[#0869F5] tabular-nums">
              Cotas #07, #11, #12
            </span>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#0869F5] text-white text-[10.5px] font-bold shadow-[0_6px_14px_rgba(8,105,245,0.24)]">
            <Send className="w-3 h-3" />
            Confirmado ✓
          </span>
        </div>

        {/* Barra de evolução das vendas (GPU-only scaleX) */}
        <div className="fr-hiw-pop fr-hiw-delay-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#475872]">
            <span>Progresso da Rifa</span>
            <span className="font-bold text-[#00A868] tabular-nums">78% vendida</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#EDF3FC] overflow-hidden">
            <div className="fr-hiw-bar-grow w-full h-full rounded-full bg-gradient-to-r from-[#0869F5] to-[#00A868]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mobileStageTrackRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    axis: 'none' | 'horizontal' | 'vertical';
    lastDampedX: number;
    ignore: boolean;
  } | null>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [instantNav, setInstantNav] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const isPaused = manualPaused || isHovering || prefersReducedMotion || !isPageVisible;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsPageVisible(!document.hidden);
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const selectStep = useCallback(
    (nextIndex: number, options?: { instant?: boolean }) => {
      const normalized = ((nextIndex % STEPS.length) + STEPS.length) % STEPS.length;
      setInstantNav(Boolean(options?.instant));
      setActiveStep((prev) => {
        if (prev === normalized) return prev;
        let nextDir = normalized > prev ? 1 : -1;
        if (prev === STEPS.length - 1 && normalized === 0) nextDir = 1;
        if (prev === 0 && normalized === STEPS.length - 1) nextDir = -1;
        setDirection(nextDir);
        return normalized;
      });
      setProgressKey((k) => k + 1);
    },
    []
  );

  useEffect(() => {
    if (!isInView || isPaused) return;
    const timer = window.setInterval(() => {
      setInstantNav(false);
      setDirection(1);
      setActiveStep((prev) => (prev + 1) % STEPS.length);
      setProgressKey((k) => k + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isInView, isPaused, progressKey]);

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectStep(index + 1, { instant: true });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      selectStep(index - 1, { instant: true });
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectStep(0, { instant: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      selectStep(STEPS.length - 1, { instant: true });
    }
  };

  const resetMobileTrackTransform = useCallback(() => {
    const track = mobileStageTrackRef.current;
    if (!track) return;
    track.style.transition = prefersReducedMotion
      ? 'none'
      : 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)';
    track.style.transform = 'translate3d(0px, 0, 0)';
  }, [prefersReducedMotion]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      touchRef.current = {
        startX: 0,
        startY: 0,
        startTime: 0,
        axis: 'none',
        lastDampedX: 0,
        ignore: true,
      };
      resetMobileTrackTransform();
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: performance.now(),
      axis: 'none',
      lastDampedX: 0,
      ignore: false,
    };

    if (mobileStageTrackRef.current) {
      mobileStageTrackRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const state = touchRef.current;
    if (!state || state.ignore) return;
    if (e.touches.length > 1) {
      state.ignore = true;
      resetMobileTrackTransform();
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (state.axis === 'none') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      state.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'horizontal' : 'vertical';
    }

    if (state.axis !== 'horizontal' || prefersReducedMotion) return;

    const atStartEdge = activeStep === 0 && dx > 0;
    const atEndEdge = activeStep === STEPS.length - 1 && dx < 0;
    const resistance = atStartEdge || atEndEdge ? 0.14 : 0.35;
    const dampedX = Math.max(-52, Math.min(52, dx * resistance));
    state.lastDampedX = dampedX;

    if (mobileStageTrackRef.current) {
      mobileStageTrackRef.current.style.transform = `translate3d(${dampedX}px, 0, 0)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const state = touchRef.current;
    touchRef.current = null;
    resetMobileTrackTransform();

    if (!state || state.ignore || state.axis === 'vertical') return;

    const changedTouch = e.changedTouches[0];
    if (!changedTouch) return;

    const dx = changedTouch.clientX - state.startX;
    const elapsed = Math.max(1, performance.now() - state.startTime);
    const velocity = Math.abs(dx) / elapsed;

    const shouldAdvance = Math.abs(dx) > 40 || (Math.abs(dx) > 16 && velocity > 0.11);
    if (!shouldAdvance) return;

    const target =
      dx < 0
        ? Math.min(STEPS.length - 1, activeStep + 1)
        : Math.max(0, activeStep - 1);

    if (target !== activeStep) {
      selectStep(target, { instant: false });
    }
  };

  const currentStep = STEPS[activeStep];
  const CurrentIcon = currentStep.icon;
  const desktopFlowScale = activeStep / (STEPS.length - 1);

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className={`ora-section-seam scroll-mt-20 py-3 sm:py-5 lg:py-7 min-h-[calc(100svh-75px)] flex flex-col justify-center px-4 sm:px-8 ${
        instantNav ? 'fr-hiw-instant' : ''
      }`}
    >
      <style>{`
        #como-funciona {
          --fr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
          --fr-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
        }

        @keyframes frHiwStageForward {
          from {
            opacity: 0;
            transform: translate3d(14px, 0, 0) scale(0.97);
            filter: blur(2.5px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes frHiwStageBackward {
          from {
            opacity: 0;
            transform: translate3d(-14px, 0, 0) scale(0.97);
            filter: blur(2.5px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes frHiwFadeOnly {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes frHiwPop {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes frHiwBubbleIn {
          from {
            opacity: 0;
            transform: translate3d(-10px, 0, 0) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes frHiwPushIn {
          from {
            opacity: 0;
            transform: translate3d(0, -10px, 0) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes frHiwBadgePop {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          65% {
            opacity: 1;
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes frHiwTicketTap {
          0% {
            opacity: 0.72;
            transform: scale(0.92);
          }
          55% {
            opacity: 1;
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes frHiwShimmerSweep {
          from { transform: translate3d(-110%, 0, 0) skewX(-18deg); }
          to { transform: translate3d(210%, 0, 0) skewX(-18deg); }
        }

        @keyframes frHiwLiveDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.45;
            transform: scale(0.85);
          }
        }

        @keyframes frHiwProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes frHiwBarGrow {
          from { transform: scaleX(0.42); }
          to { transform: scaleX(0.78); }
        }

        .fr-hiw-stage-in-fwd {
          animation: frHiwStageForward 250ms var(--fr-ease-out) both;
          will-change: transform, opacity, filter;
        }

        .fr-hiw-stage-in-bwd {
          animation: frHiwStageBackward 250ms var(--fr-ease-out) both;
          will-change: transform, opacity, filter;
        }

        .fr-hiw-pop {
          animation: frHiwPop 220ms var(--fr-ease-out) both;
        }

        .fr-hiw-delay-0 { animation-delay: 0ms; }
        .fr-hiw-delay-1 { animation-delay: 45ms; }
        .fr-hiw-delay-2 { animation-delay: 85ms; }
        .fr-hiw-delay-3 { animation-delay: 125ms; }
        .fr-hiw-delay-4 { animation-delay: 185ms; }

        .fr-hiw-bubble-in {
          transform-origin: top left;
          animation: frHiwBubbleIn 220ms var(--fr-ease-out) 60ms both;
        }

        .fr-hiw-push-in {
          animation: frHiwPushIn 230ms var(--fr-ease-out) 0ms both;
        }

        .fr-hiw-badge-pop {
          animation: frHiwBadgePop 210ms var(--fr-ease-out) 80ms both;
        }

        .fr-hiw-ticket-tap {
          animation: frHiwTicketTap 210ms var(--fr-ease-out) both;
        }

        .fr-hiw-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 48%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
          pointer-events: none;
          animation: frHiwShimmerSweep 750ms var(--fr-ease-out) 220ms 1 both;
        }

        .fr-hiw-live-dot {
          animation: frHiwLiveDot 1.8s var(--fr-ease-in-out) infinite;
        }

        .fr-hiw-progress-fill {
          transform-origin: left center;
          animation: frHiwProgress ${AUTO_ADVANCE_MS}ms linear forwards;
        }

        .fr-hiw-progress-paused {
          animation-play-state: paused;
        }

        .fr-hiw-bar-grow {
          transform-origin: left center;
          animation: frHiwBarGrow 650ms var(--fr-ease-out) 140ms both;
        }

        /* Botões e controles interativos: nunca usar transition: all */
        .fr-hiw-press {
          transition:
            transform 150ms var(--fr-ease-out),
            background-color 180ms var(--fr-ease-out),
            border-color 180ms var(--fr-ease-out),
            color 180ms var(--fr-ease-out),
            box-shadow 180ms var(--fr-ease-out);
        }

        .fr-hiw-press:active {
          transform: scale(0.97);
        }

        /* Accordion interruptível de descrição do Stepper Desktop */
        .fr-hiw-accordion {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition:
            grid-template-rows 240ms var(--fr-ease-out),
            opacity 190ms var(--fr-ease-out);
        }

        .fr-hiw-accordion[data-open='true'] {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        .fr-hiw-accordion > div {
          overflow: hidden;
        }

        .fr-hiw-step-indicator {
          transform-origin: center center;
          transition:
            transform 220ms var(--fr-ease-out),
            opacity 180ms var(--fr-ease-out);
        }

        .fr-hiw-flow-bar {
          transform-origin: left center;
          transition: transform 320ms var(--fr-ease-in-out);
        }

        .fr-hiw-dot-pill {
          transition:
            clip-path 240ms var(--fr-ease-in-out),
            background-color 200ms var(--fr-ease-out),
            opacity 200ms var(--fr-ease-out);
        }

        .fr-hiw-clip-layer {
          transition: clip-path 240ms var(--fr-ease-in-out);
        }

        /* Hover protegido para evitar sticky hover em toque */
        @media (hover: hover) and (pointer: fine) {
          .fr-hiw-step-inactive:hover {
            background-color: #ffffff;
            border-color: #cde0fc;
          }
          .fr-hiw-step-inactive:hover .fr-hiw-step-icon-idle {
            border-color: #b9d3f8;
          }
          .fr-hiw-step-inactive:hover .fr-hiw-step-title-idle {
            color: #0d1729;
          }
          .fr-hiw-ctrl:hover {
            border-color: #b9d3f8;
            background-color: #ffffff;
          }
          .fr-hiw-dot-btn:hover .fr-hiw-dot-pill-idle {
            background-color: #93b9f4;
          }
          .fr-hiw-tab-base:hover {
            color: #0d1729;
          }
        }

        /* Ações iniciadas por teclado não animam */
        #como-funciona.fr-hiw-instant .fr-hiw-stage-in-fwd,
        #como-funciona.fr-hiw-instant .fr-hiw-stage-in-bwd,
        #como-funciona.fr-hiw-instant .fr-hiw-pop,
        #como-funciona.fr-hiw-instant .fr-hiw-bubble-in,
        #como-funciona.fr-hiw-instant .fr-hiw-push-in,
        #como-funciona.fr-hiw-instant .fr-hiw-badge-pop,
        #como-funciona.fr-hiw-instant .fr-hiw-ticket-tap,
        #como-funciona.fr-hiw-instant .fr-hiw-bar-grow,
        #como-funciona.fr-hiw-instant .fr-hiw-shimmer::after,
        #como-funciona.fr-hiw-instant .fr-hiw-accordion,
        #como-funciona.fr-hiw-instant .fr-hiw-step-indicator,
        #como-funciona.fr-hiw-instant .fr-hiw-flow-bar,
        #como-funciona.fr-hiw-instant .fr-hiw-dot-pill,
        #como-funciona.fr-hiw-instant .fr-hiw-clip-layer {
          animation-duration: 0.01ms !important;
          animation-delay: 0ms !important;
          transition-duration: 0ms !important;
        }

        /* Reduced motion mantém crossfade gentil em opacidade */
        @media (prefers-reduced-motion: reduce) {
          .fr-hiw-stage-in-fwd,
          .fr-hiw-stage-in-bwd {
            animation: frHiwFadeOnly 200ms ease both !important;
            filter: none !important;
          }
          .fr-hiw-pop,
          .fr-hiw-bubble-in,
          .fr-hiw-push-in,
          .fr-hiw-badge-pop,
          .fr-hiw-ticket-tap,
          .fr-hiw-bar-grow,
          .fr-hiw-live-dot,
          .fr-hiw-progress-fill {
            animation: none !important;
          }
          .fr-hiw-bar-grow {
            transform: scaleX(0.78) !important;
          }
          .fr-hiw-shimmer::after {
            display: none !important;
          }
          .fr-hiw-accordion,
          .fr-hiw-step-indicator,
          .fr-hiw-flow-bar,
          .fr-hiw-dot-pill,
          .fr-hiw-clip-layer,
          .fr-hiw-press {
            transition-duration: 0ms !important;
          }
        }
      `}</style>

      <div className="max-w-[1340px] w-full mx-auto space-y-2.5 sm:space-y-4 lg:space-y-4">
        {/* Cabeçalho da Seção + Controles Desktop */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-2.5 lg:gap-6">
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <span className="text-[#0869f5] text-xs font-bold uppercase tracking-wider block mb-1">
              Praticidade de Ponta a Ponta
            </span>
            <h2 className="font-display font-bold text-[clamp(1.4rem,2.9vw,2.6rem)] leading-[1.06] tracking-[-0.045em] text-[#0D1729]">
              Criar. Divulgar. Vender. Receber.
            </h2>
            <p className="mt-1 text-[13px] sm:text-[15px] text-[#475872] leading-[1.42]">
              Desenvolvemos a FastRifa para eliminar qualquer perda de tempo entre você e o dinheiro das suas cotas.
            </p>
          </div>

          {/* Controles Desktop */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <span className="ora-glass-pill rounded-full px-4 py-2 text-xs font-bold text-[#0D1729] tabular-nums">
              0{activeStep + 1} / 0{STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setManualPaused((p) => !p)}
              aria-label={manualPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
              className="ora-btn-secondary fr-hiw-press fr-hiw-ctrl w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer"
              title={manualPaused ? 'Retomar apresentação' : 'Pausar apresentação'}
            >
              {manualPaused ? (
                <Play className="w-4 h-4 text-[#0869F5]" />
              ) : (
                <Pause className="w-4 h-4 text-[#475872]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => selectStep(activeStep - 1, { instant: false })}
              aria-label="Passo anterior"
              className="ora-btn-secondary fr-hiw-press fr-hiw-ctrl w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => selectStep(activeStep + 1, { instant: false })}
              aria-label="Próximo passo"
              className="ora-btn-secondary fr-hiw-press fr-hiw-ctrl w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================================
            VERSÃO DESKTOP: Palco Interativo Split (Stepper Vivo + UI Preview)
           ================================================================ */}
        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="hidden lg:grid lg:grid-cols-12 gap-5 items-stretch ora-card rounded-[28px] p-4 xl:p-5 border border-[#D9E5F7] shadow-[0_22px_60px_rgba(32,77,139,0.08)]"
        >
          {/* Coluna Esquerda: Stepper Interativo */}
          <div
            role="tablist"
            aria-label="Etapas de funcionamento da FastRifa"
            className="lg:col-span-5 flex flex-col justify-between gap-2"
          >
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              return (
                <button
                  key={step.id}
                  id={`tab-${step.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`panel-${step.id}`}
                  onClick={() => selectStep(index, { instant: false })}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={`fr-hiw-press group relative w-full text-left rounded-[18px] cursor-pointer overflow-hidden border ${
                    isActive
                      ? 'bg-white border-[#B9D3F8] p-3.5 shadow-[0_14px_34px_rgba(8,105,245,0.10)]'
                      : 'fr-hiw-step-inactive bg-[#F8FBFF]/80 border-[#E5EEFA] px-3.5 py-2.5'
                  }`}
                >
                  {/* Indicador vertical ativo */}
                  <span
                    aria-hidden="true"
                    style={{
                      transform: `scaleY(${isActive ? 1 : 0})`,
                      opacity: isActive ? 1 : 0,
                    }}
                    className="fr-hiw-step-indicator absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b from-[#0869F5] to-[#00A868]"
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-[background-color,border-color,color,box-shadow] duration-200 ${
                        isActive
                          ? 'bg-gradient-to-br from-[#529BFF] to-[#0869F5] text-white shadow-[0_8px_20px_rgba(8,105,245,0.28)]'
                          : 'fr-hiw-step-icon-idle bg-white border border-[#D9E5F7] text-[#0869F5]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#0869f5] uppercase tracking-wider">
                          {step.stepNumber}
                        </span>
                        {isActive && (
                          <span className="text-[10.5px] font-semibold text-[#0869f5] bg-[#EDF5FF] px-2.5 py-0.5 rounded-full">
                            {step.highlight}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`font-display font-bold tracking-[-0.03em] leading-[1.2] mt-0.5 transition-colors duration-200 ${
                          isActive
                            ? 'text-[16.5px] text-[#0D1729]'
                            : 'fr-hiw-step-title-idle text-[14.5px] text-[#334661]'
                        }`}
                      >
                        {step.title}
                      </h3>

                      <div className="fr-hiw-accordion" data-open={isActive}>
                        <div>
                          <p className="mt-1 text-[13px] text-[#475872] leading-[1.45]">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso automática no item ativo */}
                  {isActive && (
                    <div
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8F1FD]"
                    >
                      <div
                        key={progressKey}
                        className={`h-full bg-gradient-to-r from-[#0869F5] to-[#00A868] fr-hiw-progress-fill ${
                          isPaused || !isInView ? 'fr-hiw-progress-paused' : ''
                        }`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Coluna Direita: Palco Dinâmico com Simulação do Produto */}
          <div
            id={`panel-${currentStep.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentStep.id}`}
            className="lg:col-span-7 relative rounded-[22px] bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/75 border border-[#D9E5F7] p-4 xl:p-5 flex flex-col justify-between min-h-[330px] xl:min-h-[355px] overflow-hidden"
          >
            {/* Ambient Radial Glows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(8,105,245,0.14)_0%,transparent_70%)] blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(0,168,104,0.12)_0%,transparent_70%)] blur-2xl"
            />

            {/* Topo contextual do palco + Trilha de fluxo contínuo 01 → 04 */}
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="ora-glass-pill rounded-full px-3.5 py-1.5 inline-flex items-center gap-2">
                  <CurrentIcon className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span className="text-xs font-bold text-[#0D1729]">
                    {currentStep.stageTag}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#526480]">
                  {currentStep.stageSubtitle}
                </span>
              </div>

              {/* Trilha Contínua de Ponta a Ponta */}
              <div className="relative flex items-center justify-between px-1" aria-hidden="true">
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-[#D9E5F7] overflow-hidden">
                  <div
                    style={{ transform: `scaleX(${desktopFlowScale})` }}
                    className="fr-hiw-flow-bar w-full h-full rounded-full bg-gradient-to-r from-[#0869F5] to-[#00A868]"
                  />
                </div>
                {STEPS.map((s, idx) => {
                  const passed = idx <= activeStep;
                  const isCurrent = idx === activeStep;
                  return (
                    <span
                      key={s.id}
                      className={`relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums border transition-[background-color,border-color,color,box-shadow] duration-200 ${
                        isCurrent
                          ? 'bg-[#0869F5] border-[#0869F5] text-white shadow-[0_4px_12px_rgba(8,105,245,0.26)]'
                          : passed
                            ? 'bg-white border-[#B9E7D2] text-[#00A868]'
                            : 'bg-white/90 border-[#D9E5F7] text-[#64748B]'
                      }`}
                    >
                      0{idx + 1} {s.shortLabel}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Cena interativa centralizada */}
            <div className="relative z-10 flex-1 flex items-center justify-center py-2">
              <StepStageVisual stepIndex={activeStep} direction={direction} />
            </div>

            {/* Rodapé do palco com paginação GPU-friendly */}
            <div className="relative z-10 flex items-center justify-between gap-4 pt-2 border-t border-[#D9E5F7]/70">
              <span className="text-xs font-semibold text-[#0869f5]">
                {currentStep.highlight}
              </span>

              <div className="flex items-center gap-1">
                {STEPS.map((s, idx) => {
                  const isDotActive = idx === activeStep;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Ir para ${s.stepNumber}: ${s.title}`}
                      onClick={() => selectStep(idx, { instant: false })}
                      className="fr-hiw-dot-btn fr-hiw-press h-6 px-0.5 inline-flex items-center justify-center cursor-pointer"
                    >
                      <span
                        style={{
                          clipPath: isDotActive
                            ? 'inset(0 0px 0 0px round 9999px)'
                            : 'inset(0 10px 0 10px round 9999px)',
                        }}
                        className={`fr-hiw-dot-pill w-7 h-2 ${
                          isDotActive
                            ? 'bg-[#0869F5]'
                            : 'fr-hiw-dot-pill-idle bg-[#C8DBF7]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            VERSÃO MOBILE / TABLET: Tabs clip-path + Card Único (1 Tela)
           ================================================================ */}
        <div className="block lg:hidden space-y-2">
          {/* Barra segmentada com clip-path: inset(...) */}
          <div className="p-1 ora-glass-pill rounded-[16px]">
            <div
              role="tablist"
              aria-label="Selecionar passo"
              className="relative grid grid-cols-4"
            >
              {STEPS.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <button
                    key={step.id}
                    id={`mob-tab-${step.id}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    aria-controls={`mob-panel-${step.id}`}
                    onClick={() => selectStep(index, { instant: false })}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className="fr-hiw-tab-base py-1.5 px-1 rounded-[12px] text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer text-[#475872] transition-colors duration-150"
                  >
                    <span className="text-[9px] leading-none uppercase tracking-wider text-[#0869f5]">
                      0{index + 1}
                    </span>
                    <span className="truncate leading-tight">{step.shortLabel}</span>
                  </button>
                );
              })}

              {/* Camada duplicada ativa recortada com clip-path */}
              <div
                aria-hidden="true"
                style={{
                  clipPath: `inset(0 ${(STEPS.length - 1 - activeStep) * 25}% 0 ${activeStep * 25}% round 12px)`,
                }}
                className="fr-hiw-clip-layer pointer-events-none absolute inset-0 grid grid-cols-4 bg-[#0869F5] text-white rounded-[12px]"
              >
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className="py-1.5 px-1 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-[9px] leading-none uppercase tracking-wider text-white/85">
                      0{index + 1}
                    </span>
                    <span className="truncate leading-tight">{step.shortLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card único interativo com swipe momentum e damping */}
          <div
            id={`mob-panel-${currentStep.id}`}
            role="tabpanel"
            aria-labelledby={`mob-tab-${currentStep.id}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="ora-card rounded-[24px] overflow-hidden border border-[#D9E5F7] shadow-[0_18px_46px_rgba(32,77,139,0.09)] relative touch-pan-y"
          >
            <div ref={mobileStageTrackRef} className="will-change-transform">
              {/* Topo Visual Compacto */}
              <div className="relative bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/75 border-b border-[#D9E5F7] p-2.5 min-h-[164px] flex flex-col items-center justify-center overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(8,105,245,0.14)_0%,transparent_70%)] blur-xl"
                />
                <StepStageVisual
                  stepIndex={activeStep}
                  direction={direction}
                  compact
                />
              </div>

              {/* Corpo Editorial Compacto */}
              <div className="p-3 bg-white space-y-1.5 relative">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0869f5] uppercase tracking-wider">
                    {currentStep.stepNumber}
                  </span>
                  <span className="text-[10.5px] font-semibold text-[#0869f5] bg-[#EDF5FF] px-2.5 py-0.5 rounded-full">
                    {currentStep.highlight}
                  </span>
                </div>

                <h3 className="font-display font-bold text-[17px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                  {currentStep.title}
                </h3>

                <p className="text-[12.5px] text-[#475872] leading-[1.42]">
                  {currentStep.description}
                </p>

                {/* Navegação inferior compacta + dots GPU-friendly */}
                <div className="pt-1 border-t border-[#EDF3FC] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-0.5">
                    {STEPS.map((s, idx) => {
                      const isDotActive = idx === activeStep;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-label={`Ir para ${s.stepNumber}`}
                          onClick={() => selectStep(idx, { instant: false })}
                          className="fr-hiw-dot-btn fr-hiw-press h-6 px-0.5 inline-flex items-center justify-center cursor-pointer"
                        >
                          <span
                            style={{
                              clipPath: isDotActive
                                ? 'inset(0 0px 0 0px round 9999px)'
                                : 'inset(0 8px 0 8px round 9999px)',
                            }}
                            className={`fr-hiw-dot-pill w-6 h-2 ${
                              isDotActive
                                ? 'bg-[#0869F5]'
                                : 'fr-hiw-dot-pill-idle bg-[#CDE0FC]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setManualPaused((p) => !p)}
                      aria-label={manualPaused ? 'Retomar animação' : 'Pausar animação'}
                      className="fr-hiw-press fr-hiw-ctrl w-8 h-8 rounded-full border border-[#D9E5F7] bg-[#F8FBFF] text-[#475872] flex items-center justify-center cursor-pointer"
                    >
                      {manualPaused ? (
                        <Play className="w-3.5 h-3.5 text-[#0869F5]" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => selectStep(activeStep - 1, { instant: false })}
                      aria-label="Passo anterior"
                      className="fr-hiw-press fr-hiw-ctrl w-8 h-8 rounded-full border border-[#D9E5F7] bg-[#F8FBFF] text-[#0D1729] flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => selectStep(activeStep + 1, { instant: false })}
                      aria-label="Próximo passo"
                      className="fr-hiw-press fr-hiw-ctrl w-8 h-8 rounded-full border border-[#D9E5F7] bg-[#F8FBFF] text-[#0D1729] flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de progresso na base do card mobile */}
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8F1FD]"
            >
              <div
                key={`mob-${progressKey}`}
                className={`h-full bg-gradient-to-r from-[#0869F5] to-[#00A868] fr-hiw-progress-fill ${
                  isPaused || !isInView ? 'fr-hiw-progress-paused' : ''
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
