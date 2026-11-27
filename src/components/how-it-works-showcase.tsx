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
  compact = false,
}: {
  stepIndex: number;
  compact?: boolean;
}) {
  if (stepIndex === 0) {
    return (
      <div
        key="stage-0"
        className={`fr-hiw-stage-in w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto relative`}
      >
        {/* Pill flutuante superior direita */}
        <div
          className={`fr-hiw-pop fr-hiw-delay-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] font-bold shadow-[0_10px_24px_rgba(0,168,104,0.14)] ${
            compact
              ? 'px-2.5 py-0.5 text-[10px] mb-1.5'
              : 'px-3.5 py-1.5 text-xs absolute -top-4 right-2 z-20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>⚡ No ar em 1m 42s</span>
        </div>

        {/* Mini card do criador Fast Rifa */}
        <div
          className={`bg-white rounded-[22px] border border-[#D9E5F7] shadow-[0_18px_42px_rgba(32,77,139,0.10)] ${
            compact ? 'p-2.5 space-y-1.5' : 'p-5 space-y-3.5'
          }`}
        >
          <div className={`flex items-center justify-between border-b border-[#EDF3FC] ${compact ? 'pb-1.5' : 'pb-2.5'}`}>
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
            <div className={`fr-hiw-pop fr-hiw-delay-1 flex items-center justify-between bg-[#F5F9FF] border border-[#E0E9F7] rounded-[13px] px-3 ${compact ? 'py-1.5' : 'py-2'}`}>
              <span className="text-[11px] font-medium text-[#526480]">Prêmio</span>
              <span className="text-xs font-bold text-[#0D1729] truncate max-w-[190px]">
                iPhone 16 Pro Max
              </span>
            </div>

            <div className={`fr-hiw-pop fr-hiw-delay-2 grid grid-cols-2 ${compact ? 'gap-1.5' : 'gap-2'}`}>
              <div className={`bg-[#F5F9FF] border border-[#E0E9F7] rounded-[13px] px-3 ${compact ? 'py-1.5' : 'py-2'} flex items-center justify-between`}>
                <span className="text-[11px] font-medium text-[#526480]">Cotas</span>
                <span className="text-xs font-bold text-[#0D1729] tabular-nums">100</span>
              </div>
              <div className={`bg-[#F5F9FF] border border-[#E0E9F7] rounded-[13px] px-3 ${compact ? 'py-1.5' : 'py-2'} flex items-center justify-between`}>
                <span className="text-[11px] font-medium text-[#526480]">Valor</span>
                <span className="text-xs font-bold text-[#0869F5] tabular-nums">R$ 15,00</span>
              </div>
            </div>

            <div className={`fr-hiw-pop fr-hiw-delay-3 flex items-center justify-between bg-[#F3FAF6] border border-[#C6EBD8] rounded-[13px] px-3 ${compact ? 'py-1.5' : 'py-2'}`}>
              <span className="text-[11px] font-medium text-[#475872]">Chave PIX</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A868]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Chave verificada
              </span>
            </div>
          </div>

          <div className="fr-hiw-pop fr-hiw-delay-4 pt-0.5">
            <div className={`ora-btn-primary rounded-[14px] w-full ${compact ? 'py-2' : 'py-2.5'} px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 pointer-events-none`}>
              <Zap className="w-4 h-4" />
              <span>Publicar Rifa Agora</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepIndex === 1) {
    return (
      <div
        key="stage-1"
        className={`fr-hiw-stage-in w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto space-y-2.5`}
      >
        {/* Barra de link copiado */}
        <div className="fr-hiw-pop fr-hiw-delay-1 bg-white rounded-[18px] border border-[#D9E5F7] p-2.5 sm:p-3 shadow-[0_12px_30px_rgba(32,77,139,0.08)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold text-[#0D1729] truncate">
              fastrifa.app/r/iphone16
            </span>
          </div>
          <span className="fr-hiw-pulse-badge shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] text-[11px] font-bold">
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

          {/* Bolha do organizador */}
          <div className="fr-hiw-pop fr-hiw-delay-2 bg-[#F3FAF6] border border-[#C6EBD8] rounded-[16px] rounded-tl-sm p-2.5 sm:p-3 text-left space-y-1.5">
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
          <div className="fr-hiw-pop fr-hiw-delay-3 flex items-center justify-between gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0869F5] bg-[#EDF5FF] border border-[#CDE0FC] rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-[#0869F5] animate-pulse" />
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
      { num: '07', status: 'selected' },
      { num: '08', status: 'free' },
      { num: '09', status: 'free' },
      { num: '10', status: 'paid' },
      { num: '11', status: 'selected' },
      { num: '12', status: 'selected' },
    ];

    return (
      <div
        key="stage-2"
        className={`fr-hiw-stage-in w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto space-y-2.5`}
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

          <div className="fr-hiw-pop fr-hiw-delay-1 grid grid-cols-4 gap-1.5 sm:gap-2 tabular-nums">
            {tickets.map((t) => {
              if (t.status === 'selected') {
                return (
                  <div
                    key={t.num}
                    className="fr-hiw-ticket-active rounded-[11px] py-1.5 sm:py-2 text-center text-xs font-bold bg-[#0869F5] text-white border border-[#0755DE] shadow-[0_6px_14px_rgba(8,105,245,0.28)]"
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

          {/* Barra PIX Copia e Cola */}
          <div className="fr-hiw-pop fr-hiw-delay-2 bg-[#F5F9FF] border border-[#CDE0FC] rounded-[16px] p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
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
      key="stage-3"
      className={`fr-hiw-stage-in w-full ${compact ? 'max-w-[330px]' : 'max-w-[440px]'} mx-auto space-y-2.5`}
    >
      {/* Notificação Bancária PIX Recebido */}
      <div className="fr-hiw-pop fr-hiw-delay-1 bg-white rounded-[18px] border-2 border-[#B9E7D2] p-3 shadow-[0_14px_32px_rgba(0,168,104,0.14)] flex items-center justify-between gap-2.5">
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
        <div className="fr-hiw-pop fr-hiw-delay-2 flex items-center justify-between gap-2 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[15px] p-2.5 sm:p-3">
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

        {/* Barra de evolução das vendas */}
        <div className="fr-hiw-pop fr-hiw-delay-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#475872]">
            <span>Progresso da Rifa</span>
            <span className="font-bold text-[#00A868] tabular-nums">78% vendida</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#EDF3FC] overflow-hidden">
            <div className="fr-hiw-bar-grow h-full rounded-full bg-gradient-to-r from-[#0869F5] to-[#00A868]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const isPaused = manualPaused || isHovering || prefersReducedMotion;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
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

  const selectStep = useCallback((nextIndex: number) => {
    const normalized = ((nextIndex % STEPS.length) + STEPS.length) % STEPS.length;
    setActiveStep(normalized);
    setProgressKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isInView || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
      setProgressKey((k) => k + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isInView, isPaused, progressKey]);

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectStep(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      selectStep(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectStep(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      selectStep(STEPS.length - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    const endX = e.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX == null || endX == null) return;
    const delta = endX - startX;
    if (delta < -42) {
      selectStep(activeStep + 1);
    } else if (delta > 42) {
      selectStep(activeStep - 1);
    }
  };

  const currentStep = STEPS[activeStep];
  const CurrentIcon = currentStep.icon;

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className="ora-section-seam scroll-mt-20 py-4 sm:py-6 lg:py-8 min-h-[calc(100svh-75px)] flex flex-col justify-center px-4 sm:px-8"
    >
      <style>{`
        @keyframes frHiwStageIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes frHiwPop {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes frHiwProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes frHiwBarGrow {
          from { width: 42%; }
          to { width: 78%; }
        }
        @keyframes frHiwTicketPulse {
          0%, 100% { box-shadow: 0 6px 14px rgba(8, 105, 245, 0.24); }
          50% { box-shadow: 0 8px 20px rgba(8, 105, 245, 0.42); }
        }
        .fr-hiw-stage-in {
          animation: frHiwStageIn 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .fr-hiw-pop {
          animation: frHiwPop 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .fr-hiw-delay-1 { animation-delay: 0.05s; }
        .fr-hiw-delay-2 { animation-delay: 0.14s; }
        .fr-hiw-delay-3 { animation-delay: 0.23s; }
        .fr-hiw-delay-4 { animation-delay: 0.31s; }
        .fr-hiw-progress-fill {
          transform-origin: left center;
          animation: frHiwProgress ${AUTO_ADVANCE_MS}ms linear forwards;
        }
        .fr-hiw-progress-paused {
          animation-play-state: paused;
        }
        .fr-hiw-bar-grow {
          animation: frHiwBarGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
        }
        .fr-hiw-ticket-active {
          animation: frHiwTicketPulse 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .fr-hiw-stage-in,
          .fr-hiw-pop,
          .fr-hiw-progress-fill,
          .fr-hiw-bar-grow,
          .fr-hiw-ticket-active {
            animation: none !important;
          }
        }
      `}</style>

      <div className="max-w-[1336px] w-full mx-auto space-y-3 sm:space-y-4 lg:space-y-5">
        {/* Cabeçalho da Seção + Controles Desktop */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 lg:gap-6">
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <span className="text-[#0869f5] text-xs font-bold uppercase tracking-wider block mb-1 sm:mb-1.5">
              Praticidade de Ponta a Ponta
            </span>
            <h2 className="font-display font-bold text-[clamp(1.45rem,3vw,2.65rem)] leading-[1.06] tracking-[-0.045em] text-[#0D1729]">
              Criar. Divulgar. Vender. Receber.
            </h2>
            <p className="mt-1.5 text-[13px] sm:text-[15px] text-[#475872] leading-[1.45]">
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
              className="ora-btn-secondary w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer"
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
              onClick={() => selectStep(activeStep - 1)}
              aria-label="Passo anterior"
              className="ora-btn-secondary w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => selectStep(activeStep + 1)}
              aria-label="Próximo passo"
              className="ora-btn-secondary w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer"
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
          className="hidden lg:flex gap-5 items-stretch ora-card rounded-[28px] p-4 xl:p-5 border border-[#D9E5F7] shadow-[0_22px_60px_rgba(32,77,139,0.08)]"
        >
          {/* Coluna Esquerda: Stepper Interativo */}
          <div
            role="tablist"
            aria-label="Etapas de funcionamento da FastRifa"
            className="lg:w-[calc(41.666667%-11.6667px)] lg:shrink-0 min-w-0 flex flex-col justify-between gap-2"
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
                  onClick={() => selectStep(index)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={`group relative w-full text-left rounded-[18px] transition-all duration-300 cursor-pointer overflow-hidden border ${
                    isActive
                      ? 'bg-white border-[#B9D3F8] p-3.5 shadow-[0_14px_34px_rgba(8,105,245,0.10)]'
                      : 'bg-[#F8FBFF]/80 border-[#E5EEFA] px-3.5 py-2.5 hover:bg-white hover:border-[#CDE0FC]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-[#529BFF] to-[#0869F5] text-white shadow-[0_8px_20px_rgba(8,105,245,0.28)]'
                          : 'bg-white border border-[#D9E5F7] text-[#0869F5] group-hover:border-[#B9D3F8]'
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
                        className={`font-display font-bold tracking-[-0.03em] leading-[1.2] mt-0.5 transition-colors ${
                          isActive
                            ? 'text-[16.5px] text-[#0D1729]'
                            : 'text-[14.5px] text-[#334661] group-hover:text-[#0D1729]'
                        }`}
                      >
                        {step.title}
                      </h3>

                      {isActive && (
                        <p className="mt-1 text-[13px] text-[#475872] leading-[1.45] fr-hiw-pop">
                          {step.description}
                        </p>
                      )}
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
            className="lg:flex-1 min-w-0 relative rounded-[22px] bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/75 border border-[#D9E5F7] p-4 xl:p-5 flex flex-col justify-between min-h-[330px] xl:min-h-[360px] overflow-hidden"
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

            {/* Topo contextual do palco */}
            <div className="relative z-10 flex items-center justify-between gap-3">
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

            {/* Cena interativa centralizada */}
            <div className="relative z-10 flex-1 flex items-center justify-center py-2">
              <StepStageVisual stepIndex={activeStep} />
            </div>

            {/* Rodapé do palco com paginação clicável */}
            <div className="relative z-10 flex items-center justify-between gap-4 pt-2 border-t border-[#D9E5F7]/70">
              <span className="text-xs font-semibold text-[#0869f5]">
                {currentStep.highlight}
              </span>

              <div className="flex items-center gap-1.5">
                {STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Ir para ${s.stepNumber}: ${s.title}`}
                    onClick={() => selectStep(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeStep
                        ? 'w-7 bg-[#0869F5]'
                        : 'w-2 bg-[#C8DBF7] hover:bg-[#93B9F4]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            VERSÃO MOBILE / TABLET: Barra Segmentada + Card Único (Zero Empilhamento)
           ================================================================ */}
        <div className="block lg:hidden space-y-2.5">
          {/* Barra segmentada com os 4 passos em 1 linha */}
          <div
            role="tablist"
            aria-label="Selecionar passo"
            className="grid grid-cols-4 gap-1 p-1 ora-glass-pill rounded-[16px]"
          >
            {STEPS.map((step, index) => {
              const isActive = index === activeStep;
              return (
                <button
                  key={step.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => selectStep(index)}
                  className={`py-1.5 px-1 rounded-[12px] text-[11px] font-bold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#0869F5] text-white shadow-[0_6px_16px_rgba(8,105,245,0.28)]'
                      : 'text-[#475872] hover:text-[#0D1729]'
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase tracking-wider ${
                      isActive ? 'text-white/85' : 'text-[#0869f5]'
                    }`}
                  >
                    0{index + 1}
                  </span>
                  <span className="truncate">{step.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Card único interativo com suporte a swipe horizontal */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="ora-card rounded-[24px] overflow-hidden border border-[#D9E5F7] shadow-[0_18px_46px_rgba(32,77,139,0.09)] relative"
          >
            {/* Topo Visual Compacto */}
            <div className="relative bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FF] to-[#E8F7F0]/75 border-b border-[#D9E5F7] p-2.5 min-h-[168px] flex flex-col items-center justify-center overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(8,105,245,0.14)_0%,transparent_70%)] blur-xl"
              />
              <StepStageVisual stepIndex={activeStep} compact />
            </div>

            {/* Corpo Editorial Compacto */}
            <div className="p-3.5 bg-white space-y-1.5 relative">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0869f5] uppercase tracking-wider">
                  {currentStep.stepNumber}
                </span>
                <span className="text-[10.5px] font-semibold text-[#0869f5] bg-[#EDF5FF] px-2.5 py-0.5 rounded-full">
                  {currentStep.highlight}
                </span>
              </div>

              <h3 className="font-display font-bold text-[17.5px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                {currentStep.title}
              </h3>

              <p className="text-[13px] text-[#475872] leading-[1.45]">
                {currentStep.description}
              </p>

              {/* Navegação inferior compacta + dots */}
              <div className="pt-1.5 border-t border-[#EDF3FC] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Ir para ${s.stepNumber}`}
                      onClick={() => selectStep(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeStep ? 'w-6 bg-[#0869F5]' : 'w-2 bg-[#CDE0FC]'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setManualPaused((p) => !p)}
                    aria-label={manualPaused ? 'Retomar animação' : 'Pausar animação'}
                    className="w-8 h-8 rounded-full border border-[#D9E5F7] bg-[#F8FBFF] text-[#475872] flex items-center justify-center cursor-pointer"
                  >
                    {manualPaused ? (
                      <Play className="w-3.5 h-3.5 text-[#0869F5]" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectStep(activeStep - 1)}
                    aria-label="Passo anterior"
                    className="w-8 h-8 rounded-full border border-[#D9E5F7] bg-[#F8FBFF] text-[#0D1729] flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectStep(activeStep + 1)}
                    aria-label="Próximo passo"
                    className="w-8 h-8 rounded-full border border-[#D9E5F7] bg-[#F8FBFF] text-[#0D1729] flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
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
      </div>
    </section>
  );
}
