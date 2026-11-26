'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  QrCode,
  Send,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface StepItem {
  id: string;
  stepNumber: string;
  shortLabel: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const STEPS: StepItem[] = [
  {
    id: 'passo-1',
    stepNumber: 'Passo 1',
    shortLabel: 'Criar',
    badge: '2 min',
    title: 'Você cria em 2 minutos',
    description:
      'Coloque o título do prêmio, a quantidade de cotas, o valor do número e sua chave PIX. Sem burocracia.',
    icon: Zap,
  },
  {
    id: 'passo-2',
    stepNumber: 'Passo 2',
    shortLabel: 'Divulgar',
    badge: '1 clique',
    title: 'Você divulga no WhatsApp',
    description:
      'Copie seu link exclusivo e mande nos grupos, status do zap e redes sociais. O link abre rápido em qualquer celular.',
    icon: MessageCircle,
  },
  {
    id: 'passo-3',
    stepNumber: 'Passo 3',
    shortLabel: 'Vender',
    badge: 'Sem cadastro',
    title: 'Seu cliente escolhe e paga',
    description:
      'Ele clica nos números da sorte, copia seu PIX, faz o pagamento e envia o comprovante direto no seu WhatsApp.',
    icon: QrCode,
  },
  {
    id: 'passo-4',
    stepNumber: 'Passo 4',
    shortLabel: 'Receber',
    badge: 'Taxa R$ 0',
    title: 'Você recebe e confirma',
    description:
      'O dinheiro já está na sua conta bancária. Você confere no painel e confirma as cotas com 1 toque.',
    icon: Trophy,
  },
];

function StepMiniScene({
  stepIndex,
  revealed,
}: {
  stepIndex: number;
  revealed: boolean;
}) {
  const animClass = revealed ? 'fr-hiw-scene-play' : 'fr-hiw-scene-wait';

  if (stepIndex === 0) {
    return (
      <div
        className={`${animClass} h-[132px] rounded-[16px] bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/70 border border-[#E0E9F7] p-2.5 flex flex-col justify-center overflow-hidden`}
      >
        <div className="bg-white rounded-[12px] border border-[#DCE8F8] p-2.5 shadow-[0_8px_20px_rgba(32,77,139,0.06)] space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#0D1729] truncate">
              iPhone 16 Pro Max
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E8F7F0] text-[#00A868] text-[9.5px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" />
              PIX verificado
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-[#526480] font-semibold tabular-nums bg-[#F7FAFF] border border-[#E6EFFC] rounded-lg px-2 py-1">
            <span>100 cotas · R$ 15,00</span>
            <span className="text-[#0869F5] font-bold">Ativo</span>
          </div>
          <div className="fr-hiw-shimmer ora-btn-primary rounded-[9px] w-full py-1.5 px-2.5 text-[10.5px] font-bold flex items-center justify-center gap-1.5 pointer-events-none relative overflow-hidden">
            <Zap className="w-3 h-3 relative z-10" />
            <span className="relative z-10">Publicar Agora</span>
          </div>
        </div>
      </div>
    );
  }

  if (stepIndex === 1) {
    return (
      <div
        className={`${animClass} h-[132px] rounded-[16px] bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/70 border border-[#E0E9F7] p-2.5 flex flex-col justify-between overflow-hidden`}
      >
        {/* Mini-barra link copiado */}
        <div className="bg-white rounded-[10px] border border-[#DCE8F8] px-2 py-1.5 flex items-center justify-between gap-1.5 shadow-[0_4px_12px_rgba(32,77,139,0.05)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Copy className="w-3 h-3 text-[#0869F5] shrink-0" />
            <span className="text-[10.5px] font-semibold text-[#0D1729] truncate">
              fastrifa.app/r/iphone16
            </span>
          </div>
          <span className="fr-hiw-badge-pop shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] text-[9.5px] font-bold">
            <Check className="w-2.5 h-2.5" />
            Copiado
          </span>
        </div>

        {/* Mini-bolha WhatsApp */}
        <div className="fr-hiw-bubble-in bg-[#F3FAF6] border border-[#C6EBD8] rounded-[11px] rounded-tl-xs px-2.5 py-1.5 text-left">
          <p className="text-[10.5px] font-semibold text-[#0D1729] truncate">
            🎉 Escolha seu número em segundos!
          </p>
        </div>

        {/* Indicador ao vivo */}
        <div className="flex items-center justify-between px-0.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0869F5]">
            <span className="fr-hiw-live-dot w-1.5 h-1.5 rounded-full bg-[#0869F5]" />
            24 abrindo agora
          </span>
          <span className="text-[9.5px] font-semibold text-[#526480]">
            Grupos &amp; Status
          </span>
        </div>
      </div>
    );
  }

  if (stepIndex === 2) {
    const miniTickets = [
      { num: '01', status: 'free' },
      { num: '02', status: 'paid' },
      { num: '03', status: 'selected', delay: '60ms' },
      { num: '04', status: 'free' },
      { num: '05', status: 'free' },
      { num: '06', status: 'selected', delay: '120ms' },
      { num: '07', status: 'selected', delay: '180ms' },
      { num: '08', status: 'free' },
    ];

    return (
      <div
        className={`${animClass} h-[132px] rounded-[16px] bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/70 border border-[#E0E9F7] p-2.5 flex flex-col justify-between overflow-hidden`}
      >
        <div className="grid grid-cols-4 gap-1.5 tabular-nums">
          {miniTickets.map((t) => {
            if (t.status === 'selected') {
              return (
                <div
                  key={t.num}
                  style={{ animationDelay: t.delay }}
                  className="fr-hiw-ticket-tap rounded-[8px] py-1.5 text-center text-[10.5px] font-bold bg-[#0869F5] text-white border border-[#0755DE] shadow-[0_4px_10px_rgba(8,105,245,0.24)]"
                >
                  {t.num}
                </div>
              );
            }
            if (t.status === 'paid') {
              return (
                <div
                  key={t.num}
                  className="rounded-[8px] py-1.5 text-center text-[10.5px] font-semibold bg-[#F1F5FA] text-[#94A3B8] border border-[#E2EAF5] line-through"
                >
                  {t.num}
                </div>
              );
            }
            return (
              <div
                key={t.num}
                className="rounded-[8px] py-1.5 text-center text-[10.5px] font-bold bg-white text-[#14213A] border border-[#DCE8F8]"
              >
                {t.num}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[10px] border border-[#CDE0FC] px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <QrCode className="w-3.5 h-3.5 text-[#0869F5] shrink-0" />
            <span className="text-[10.5px] font-bold text-[#0D1729] truncate tabular-nums">
              PIX Copia e Cola · R$ 45
            </span>
          </div>
          <span className="shrink-0 text-[9.5px] font-bold text-[#00A868]">
            Direto
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${animClass} h-[132px] rounded-[16px] bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/70 border border-[#E0E9F7] p-2.5 flex flex-col justify-between overflow-hidden`}
    >
      {/* Mini notificação PIX recebido */}
      <div className="fr-hiw-push-in bg-white rounded-[10px] border border-[#B9E7D2] px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-[0_6px_14px_rgba(0,168,104,0.10)]">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00A868]">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          PIX Recebido
        </span>
        <span className="text-[11px] font-bold text-[#0D1729] tabular-nums">
          + R$ 45,00
        </span>
      </div>

      {/* Aprovação rápida */}
      <div className="bg-white rounded-[10px] border border-[#DCE8F8] px-2.5 py-1.5 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold text-[#0D1729] truncate">
          Maria Silva
        </span>
        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0869F5] text-white text-[9.5px] font-bold">
          <Send className="w-2.5 h-2.5" />
          Confirmado ✓
        </span>
      </div>

      {/* Barra de progresso 78% GPU-only */}
      <div className="space-y-1 px-0.5">
        <div className="flex items-center justify-between text-[10px] font-semibold text-[#475872]">
          <span>Rifa vendida</span>
          <span className="font-bold text-[#00A868] tabular-nums">78%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#DCE9FB] overflow-hidden">
          <div className="fr-hiw-bar-grow w-full h-full rounded-full bg-gradient-to-r from-[#0869F5] to-[#00A868]" />
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const desktopLineRef = useRef<HTMLDivElement | null>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [desktopRevealed, setDesktopRevealed] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const hoveredStepRef = useRef<number | null>(null);
  hoveredStepRef.current = hoveredStep;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDesktopRevealed(true);
      return;
    }
    const target = sectionRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setDesktopRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setDesktopRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Motor de rolagem suavizada (Desktop: trilha fluida | Mobile: sticky stacking deck)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (prefersReducedMotion) {
      if (desktopLineRef.current) {
        desktopLineRef.current.style.transform = 'scaleX(1)';
      }
      mobileCardRefs.current.forEach((card) => {
        if (!card) return;
        card.style.transform = '';
      });
      return;
    }

    let rafId = 0;
    let currentDesktop = 0;
    let isRunning = false;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const updateFrame = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight || 800;
      let needsMoreFrames = false;

      if (vw >= 1024) {
        const sec = sectionRef.current;
        if (sec && desktopLineRef.current) {
          const rect = sec.getBoundingClientRect();
          const startTop = vh * 0.85;
          const endTop = vh * 0.26;
          const scrollRatio = clamp01((startTop - rect.top) / Math.max(1, startTop - endTop));
          const hoverBoost =
            hoveredStepRef.current !== null
              ? hoveredStepRef.current / (STEPS.length - 1)
              : 0;
          const targetDesktop = Math.max(scrollRatio, hoverBoost);

          currentDesktop += (targetDesktop - currentDesktop) * 0.14;
          if (Math.abs(targetDesktop - currentDesktop) < 0.001) {
            currentDesktop = targetDesktop;
          } else {
            needsMoreFrames = true;
          }
          desktopLineRef.current.style.transform = `scaleX(${currentDesktop.toFixed(4)})`;
        }
      } else {
        // Mobile: profundidade suave nos cards cobertos (mantendo 100% opaco para não vazar texto)
        const cards = mobileCardRefs.current;

        for (let idx = 0; idx < STEPS.length; idx++) {
          const card = cards[idx];
          if (!card) continue;
          const stickyTop = 88 + idx * 12;

          if (idx < STEPS.length - 1) {
            const nextCard = cards[idx + 1];
            if (nextCard) {
              const nextStickyTop = 88 + (idx + 1) * 12;
              const nextRect = nextCard.getBoundingClientRect();
              const startOverlapY = stickyTop + 260;
              const overlap = clamp01(
                (startOverlapY - nextRect.top) / Math.max(1, startOverlapY - nextStickyTop)
              );
              const scale = 1 - overlap * 0.055;
              const liftY = -overlap * 4;

              card.style.transform = `scale(${scale.toFixed(4)}) translate3d(0, ${liftY.toFixed(2)}px, 0)`;
            }
          } else {
            card.style.transform = 'scale(1) translate3d(0, 0, 0)';
          }
        }
      }

      if (needsMoreFrames) {
        rafId = window.requestAnimationFrame(updateFrame);
      } else {
        isRunning = false;
      }
    };

    const scheduleFrame = () => {
      if (isRunning) return;
      isRunning = true;
      rafId = window.requestAnimationFrame(updateFrame);
    };

    scheduleFrame();
    window.addEventListener('scroll', scheduleFrame, { passive: true });
    window.addEventListener('resize', scheduleFrame, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleFrame);
      window.removeEventListener('resize', scheduleFrame);
    };
  }, [prefersReducedMotion]);

  // Recalcula suavemente a trilha desktop quando hover muda
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;
    if (window.innerWidth < 1024) return;
    window.dispatchEvent(new Event('scroll'));
  }, [hoveredStep, prefersReducedMotion]);

  const activeDesktopNodes = desktopRevealed ? STEPS.length : 0;

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className="ora-section-seam scroll-mt-20 py-6 sm:py-8 lg:py-8 lg:min-h-[calc(100svh-75px)] flex flex-col justify-center px-4 sm:px-8"
    >
      <style>{`
        #como-funciona {
          --fr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
          --fr-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
        }

        @keyframes frHiwCardIn {
          from {
            opacity: 0;
            transform: translate3d(0, 16px, 0) scale(0.97);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes frHiwBeam {
          0% {
            opacity: 0;
            transform: translate3d(-15%, 0, 0);
          }
          20% {
            opacity: 0.75;
          }
          80% {
            opacity: 0.75;
          }
          100% {
            opacity: 0;
            transform: translate3d(115%, 0, 0);
          }
        }

        @keyframes frHiwShimmerSweep {
          from { transform: translate3d(-110%, 0, 0) skewX(-18deg); }
          to { transform: translate3d(210%, 0, 0) skewX(-18deg); }
        }

        @keyframes frHiwBubbleIn {
          from {
            opacity: 0;
            transform: translate3d(-8px, 0, 0) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes frHiwPushIn {
          from {
            opacity: 0;
            transform: translate3d(0, -8px, 0) scale(0.97);
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

        @keyframes frHiwBarGrow {
          from { transform: scaleX(0.42); }
          to { transform: scaleX(0.78); }
        }

        .fr-hiw-card-hidden {
          opacity: 0;
          transform: translate3d(0, 16px, 0) scale(0.97);
        }

        .fr-hiw-card-in {
          animation: frHiwCardIn 420ms var(--fr-ease-out) both;
          will-change: transform, opacity, filter;
        }

        .fr-hiw-beam {
          animation: frHiwBeam 3.2s var(--fr-ease-in-out) infinite;
        }

        .fr-hiw-scene-wait .fr-hiw-shimmer::after,
        .fr-hiw-scene-wait .fr-hiw-bubble-in,
        .fr-hiw-scene-wait .fr-hiw-push-in,
        .fr-hiw-scene-wait .fr-hiw-badge-pop,
        .fr-hiw-scene-wait .fr-hiw-ticket-tap,
        .fr-hiw-scene-wait .fr-hiw-bar-grow {
          animation: none;
        }

        .fr-hiw-scene-play .fr-hiw-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 48%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
          pointer-events: none;
          animation: frHiwShimmerSweep 750ms var(--fr-ease-out) 240ms 1 both;
        }

        .fr-hiw-scene-play .fr-hiw-bubble-in {
          transform-origin: top left;
          animation: frHiwBubbleIn 240ms var(--fr-ease-out) 120ms both;
        }

        .fr-hiw-scene-play .fr-hiw-push-in {
          animation: frHiwPushIn 240ms var(--fr-ease-out) 140ms both;
        }

        .fr-hiw-scene-play .fr-hiw-badge-pop {
          animation: frHiwBadgePop 220ms var(--fr-ease-out) 110ms both;
        }

        .fr-hiw-scene-play .fr-hiw-ticket-tap {
          animation: frHiwTicketTap 220ms var(--fr-ease-out) both;
        }

        .fr-hiw-live-dot {
          animation: frHiwLiveDot 1.8s var(--fr-ease-in-out) infinite;
        }

        .fr-hiw-bar-grow {
          transform-origin: left center;
        }

        .fr-hiw-scene-play .fr-hiw-bar-grow {
          animation: frHiwBarGrow 680ms var(--fr-ease-out) 200ms both;
        }

        .fr-hiw-card-surface {
          transition:
            transform 220ms var(--fr-ease-out),
            border-color 200ms var(--fr-ease-out),
            box-shadow 220ms var(--fr-ease-out);
        }

        .fr-hiw-node {
          transition:
            transform 220ms var(--fr-ease-out),
            background-color 220ms var(--fr-ease-out),
            border-color 220ms var(--fr-ease-out),
            color 220ms var(--fr-ease-out),
            box-shadow 220ms var(--fr-ease-out);
        }

        .fr-hiw-line-fill {
          transform-origin: left center;
          transform: scaleX(0);
          will-change: transform;
        }

        @media (hover: hover) and (pointer: fine) {
          .fr-hiw-card-surface:hover {
            transform: translate3d(0, -4px, 0);
            border-color: #b9d3f8;
            box-shadow: 0 22px 46px rgba(8, 105, 245, 0.11);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fr-hiw-card-hidden,
          .fr-hiw-card-in {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            animation: none !important;
          }
          .fr-hiw-beam,
          .fr-hiw-live-dot,
          .fr-hiw-scene-play .fr-hiw-bubble-in,
          .fr-hiw-scene-play .fr-hiw-push-in,
          .fr-hiw-scene-play .fr-hiw-badge-pop,
          .fr-hiw-scene-play .fr-hiw-ticket-tap,
          .fr-hiw-scene-play .fr-hiw-bar-grow {
            animation: none !important;
          }
          .fr-hiw-bar-grow {
            transform: scaleX(0.78) !important;
          }
          .fr-hiw-scene-play .fr-hiw-shimmer::after {
            display: none !important;
          }
          .fr-hiw-card-surface,
          .fr-hiw-node {
            transition-duration: 0ms !important;
          }
        }
      `}</style>

      <div className="max-w-[1340px] w-full mx-auto">
        {/* ================================================================
            VERSÃO DESKTOP: Fluxo Contínuo Ponta a Ponta (4 Passos em 1 Tela)
           ================================================================ */}
        <div className="hidden lg:flex flex-col space-y-5">
          {/* Cabeçalho centralizado sem controles de player */}
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[#0869f5] text-xs font-bold uppercase tracking-wider block mb-1.5">
              Praticidade de Ponta a Ponta
            </span>
            <h2 className="font-display font-bold text-[clamp(1.75rem,2.9vw,2.6rem)] leading-[1.06] tracking-[-0.045em] text-[#0D1729]">
              Criar. Divulgar. Vender. Receber.
            </h2>
            <p className="mt-1.5 text-[15px] text-[#475872] leading-[1.45]">
              Desenvolvemos a FastRifa para eliminar qualquer perda de tempo entre você e o dinheiro das suas cotas.
            </p>
          </div>

          {/* Trilha Contínua guiada por rolagem + hover */}
          <div className="relative pt-1">
            <div className="relative grid grid-cols-4 items-center">
              {/* Linha base conectando os 4 nós */}
              <div
                aria-hidden="true"
                className="absolute left-[12.5%] right-[12.5%] top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-[#E1ECFC] overflow-hidden"
              >
                <div
                  ref={desktopLineRef}
                  className="fr-hiw-line-fill w-full h-full rounded-full bg-gradient-to-r from-[#0869F5] to-[#00A868]"
                />
                <div className="fr-hiw-beam absolute inset-y-0 left-0 w-24 rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              </div>

              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isNodeActive =
                  hoveredStep !== null ? idx <= hoveredStep : idx < activeDesktopNodes;
                const isNodeFocused = hoveredStep === idx;

                return (
                  <div key={step.id} className="relative z-10 flex justify-center">
                    <div
                      className={`fr-hiw-node inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tabular-nums ${
                        isNodeFocused
                          ? 'bg-[#0869F5] border-[#0869F5] text-white shadow-[0_8px_20px_rgba(8,105,245,0.28)] scale-[1.04]'
                          : isNodeActive
                            ? 'bg-white border-[#B9D3F8] text-[#0D1729] shadow-[0_6px_16px_rgba(32,77,139,0.08)]'
                            : 'bg-[#F8FBFF] border-[#DCE8F8] text-[#526480]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isNodeFocused
                            ? 'bg-white/20 text-white'
                            : isNodeActive
                              ? 'bg-[#EDF5FF] text-[#0869F5]'
                              : 'bg-white text-[#64748B]'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                      <span>
                        0{idx + 1} · {step.shortLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid com os 4 passos completos simultaneamente */}
          <div className="grid grid-cols-4 gap-4 xl:gap-5 items-stretch">
            {STEPS.map((step, idx) => {
              const staggerMs = idx * 65;
              const isCardHovered = hoveredStep === idx;

              return (
                <article
                  key={step.id}
                  onMouseEnter={() => setHoveredStep(idx)}
                  onMouseLeave={() => setHoveredStep(null)}
                  style={{
                    animationDelay: desktopRevealed ? `${staggerMs}ms` : '0ms',
                  }}
                  className={`ora-card fr-hiw-card-surface rounded-[24px] p-4 xl:p-5 border border-[#D9E5F7] flex flex-col justify-between gap-3.5 ${
                    desktopRevealed ? 'fr-hiw-card-in' : 'fr-hiw-card-hidden'
                  } ${
                    isCardHovered
                      ? 'shadow-[0_22px_46px_rgba(8,105,245,0.11)]'
                      : 'shadow-[0_14px_34px_rgba(32,77,139,0.07)]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Topo do Card: Passo + Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#0869f5] uppercase tracking-wider">
                        {step.stepNumber}
                      </span>
                      <span className="text-[10.5px] font-semibold text-[#0869f5] bg-[#EDF5FF] px-2.5 py-0.5 rounded-full">
                        {step.badge}
                      </span>
                    </div>

                    {/* Micro-Cena Visual */}
                    <StepMiniScene stepIndex={idx} revealed={desktopRevealed} />

                    {/* Título & Descrição */}
                    <div className="space-y-1.5">
                      <h3 className="font-display font-bold text-[17.5px] xl:text-[18.5px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                        {step.title}
                      </h3>
                      <p className="text-[13px] text-[#475872] leading-[1.48]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Rodapé síntese discreto */}
          <div className="flex justify-center pt-0.5">
            <div className="ora-glass-pill rounded-full px-5 py-2 text-xs font-semibold text-[#14213A] inline-flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00A868] shrink-0" />
              <span>
                Da criação ao PIX direto na sua conta — sem intermediários e sem taxa no saque.
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================
            VERSÃO MOBILE / TABLET: Sticky Scroll-Stacking Deck (Zero Player)
           ================================================================ */}
        <div className="block lg:hidden space-y-5">
          {/* Cabeçalho natural acima do deck para nunca colidir com o Passo 4 */}
          <div className="text-center max-w-md mx-auto space-y-1.5">
            <span className="text-[#0869f5] text-xs font-bold uppercase tracking-wider block">
              Praticidade de Ponta a Ponta
            </span>
            <h2 className="font-display font-bold text-[1.5rem] sm:text-[1.75rem] leading-[1.1] tracking-[-0.04em] text-[#0D1729]">
              Criar. Divulgar. Vender. Receber.
            </h2>
            <p className="text-[13.5px] text-[#475872] leading-[1.45]">
              Desenvolvemos a FastRifa para eliminar qualquer perda de tempo entre você e o dinheiro das suas cotas.
            </p>
          </div>

          {/* Deck de 4 cards 100% opacos empilháveis durante a rolagem */}
          <div className="space-y-5 pb-3">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    mobileCardRefs.current[idx] = el;
                  }}
                  style={{
                    top: `${88 + idx * 12}px`,
                    zIndex: 10 + idx,
                    backgroundColor: '#FFFFFF',
                  }}
                  className="ora-card sticky rounded-[24px] p-4 border border-[#D9E5F7] shadow-[0_-10px_28px_rgba(13,23,41,0.06),0_14px_34px_rgba(32,77,139,0.09)] space-y-3 will-change-transform"
                >
                  {/* Cabeçalho do card + trilha segmentada 01..04 integrada */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[11px] font-bold text-[#0869f5] uppercase tracking-wider">
                          {step.stepNumber}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#0869f5] bg-[#EDF5FF] px-2.5 py-0.5 rounded-full">
                        {step.badge}
                      </span>
                    </div>

                    {/* Progresso visual de ponta a ponta em 4 etapas */}
                    <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                      {STEPS.map((s, segIdx) => (
                        <div
                          key={s.id}
                          className={`h-1 rounded-full ${
                            segIdx <= idx
                              ? 'bg-gradient-to-r from-[#0869F5] to-[#00A868]'
                              : 'bg-[#E5EEFA]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <StepMiniScene stepIndex={idx} revealed />

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-[17.5px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-[#475872] leading-[1.45]">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
