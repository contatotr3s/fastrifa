'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Dices,
  Hash,
  X,
  MessageCircle,
  CheckCircle2,
  Phone,
  Flame,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { Raffle, Order } from '@/types/database.types';

interface DrawRouletteModalProps {
  raffle: Raffle;
  paidOrders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onFinish: (winnerTicket: number, winnerName: string) => Promise<void>;
}

export default function DrawRouletteModal({
  raffle,
  paidOrders,
  isOpen,
  onClose,
  onFinish,
}: DrawRouletteModalProps) {
  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [manualNumber, setManualNumber] = useState('');
  const [winnerNameInput, setWinnerNameInput] = useState('');

  // Sorteio states: 'idle' | 'countdown' | 'spinning' | 'revealed'
  const [stage, setStage] = useState<'idle' | 'countdown' | 'spinning' | 'revealed'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [displayNumber, setDisplayNumber] = useState(1);
  const [finalWinnerTicket, setFinalWinnerTicket] = useState<number | null>(null);
  const [finalWinnerName, setFinalWinnerName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);

  // Map of ticket -> buyer name from paid orders
  const ticketBuyerMap = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    const map = new Map<number, string>();
    for (const order of paidOrders) {
      if (order.status === 'paid') {
        for (const num of order.ticket_numbers) {
          map.set(num, order.buyer_name);
        }
      }
    }
    ticketBuyerMap.current = map;
  }, [paidOrders]);

  // Lista de números pagos elegíveis
  const eligiblePaidTickets = Array.from(ticketBuyerMap.current.keys());

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStage('idle');
      setCountdown(3);
      setError(null);
      setFinalWinnerTicket(null);
      setFinalWinnerName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function triggerConfettiExplosion() {
    // Explosão central
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0869F5', '#00A868', '#FFD700', '#FF4D4D', '#FFFFFF'],
    });

    // Canhões laterais sincronizados
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0869F5', '#FFD700', '#34D399'],
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0869F5', '#FFD700', '#34D399'],
      });
    }, 250);
  }

  function handleStartDraw() {
    setError(null);

    let chosenTicket: number;
    let chosenBuyer = '';

    if (mode === 'random') {
      if (eligiblePaidTickets.length === 0) {
        // Se ainda não houver cotas pagas confirmadas, sorteia do total da rifa
        chosenTicket = Math.floor(Math.random() * raffle.total_tickets) + 1;
        chosenBuyer = ticketBuyerMap.current.get(chosenTicket) || winnerNameInput.trim() || 'Aguardando Identificação';
      } else {
        // Sorteia estritamente entre as cotas pagas
        const randomIndex = Math.floor(Math.random() * eligiblePaidTickets.length);
        chosenTicket = eligiblePaidTickets[randomIndex];
        chosenBuyer = ticketBuyerMap.current.get(chosenTicket) || 'Comprador da Cota';
      }
    } else {
      // Modo manual (ex: Loteria Federal)
      const num = parseInt(manualNumber, 10);
      if (isNaN(num) || num < 1 || num > raffle.total_tickets) {
        setError(`Por favor, insira um número válido entre 1 e ${raffle.total_tickets}.`);
        return;
      }
      chosenTicket = num;
      chosenBuyer =
        ticketBuyerMap.current.get(num) ||
        winnerNameInput.trim() ||
        'Ganhador Oficial';
    }

    setFinalWinnerTicket(chosenTicket);
    setFinalWinnerName(chosenBuyer);

    // Inicia contagem regressiva
    setStage('countdown');
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          startSpinning(chosenTicket);
          return 0;
        }
        return prev - 1;
      });
    }, 800);
  }

  function startSpinning(targetTicket: number) {
    setStage('spinning');

    const totalDuration = 3800; // 3.8s de giro cinematográfico
    const startTime = performance.now();

    function spin(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      // Função de desaceleração suave (ease-out cubic)
      const speedFactor = 1 - Math.pow(progress, 3);

      if (progress < 1) {
        // Alterna números aleatórios rapidamente enquanto gira
        const randomNum = Math.floor(Math.random() * raffle.total_tickets) + 1;
        setDisplayNumber(randomNum);

        // Ajusta intervalo com base na desaceleração
        const delay = 30 + (1 - speedFactor) * 200;
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(spin);
        }, delay);
      } else {
        // Chegou ao fim! Fixa o número vencedor e estoura confetes
        setDisplayNumber(targetTicket);
        setStage('revealed');
        triggerConfettiExplosion();
      }
    }

    animationRef.current = requestAnimationFrame(spin);
  }

  async function handleConfirmSave() {
    if (finalWinnerTicket == null) return;
    setIsSaving(true);
    try {
      await onFinish(finalWinnerTicket, finalWinnerName);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar o resultado oficial do sorteio.');
    } finally {
      setIsSaving(false);
    }
  }

  // Encontra telefone do ganhador se existir
  let winnerPhone = '';
  if (finalWinnerTicket != null) {
    const orderWithTicket = paidOrders.find((o) =>
      o.ticket_numbers.includes(finalWinnerTicket)
    );
    if (orderWithTicket?.buyer_phone) {
      winnerPhone = orderWithTicket.buyer_phone.replace(/\D/g, '');
    }
  }

  const winnerMessage = `🎉 *PARABÉNS! VOCÊ GANHOU O PRÊMIO!* 🏆
Olá ${finalWinnerName}, sua cota *#${finalWinnerTicket?.toString().padStart(3, '0')}* foi a grande vencedora na rifa *"${raffle.title}"*!

Entre em contato para combinarmos a entrega do seu prêmio.
— *${raffle.brand_name || 'FastRifa'}*`;

  const whatsappWinnerUrl = `https://wa.me/55${winnerPhone}?text=${encodeURIComponent(
    winnerMessage
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0D1729] border border-[#203456] rounded-[24px] sm:rounded-[36px] p-4 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.5)] text-white text-center max-h-[92vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(8,105,245,0.45)_0%,transparent_70%)] blur-2xl"
        />

        {/* Close Button (available in idle or revealed) */}
        {(stage === 'idle' || stage === 'revealed') && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#8A9BB3] hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* STAGE 1: Configuração do Sorteio */}
        {stage === 'idle' && (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#529BFF] to-[#0869F5] flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(8,105,245,0.4)]">
              <Trophy className="w-7 h-7 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0869F5]/20 border border-[#0869F5]/40 text-[#62A5FF] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sorteador Oficial</span>
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-[-0.03em]">
                Realizar Sorteio do Prêmio
              </h2>
              <p className="text-xs text-[#8A9BB3] mt-1">
                {raffle.title}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[#BE123C]/20 border border-[#BE123C]/40 text-[#FDA4AF] text-xs rounded-[14px]">
                {error}
              </div>
            )}

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-[#14213A] p-1.5 rounded-[20px] border border-[#203456]">
              <button
                type="button"
                onClick={() => setMode('random')}
                className={`py-2.5 px-3 rounded-[15px] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'random'
                    ? 'bg-[#0869F5] text-white shadow-sm'
                    : 'text-[#8A9BB3] hover:text-white'
                }`}
              >
                <Dices className="w-4 h-4" />
                <span>Sorteio Digital</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2.5 px-3 rounded-[15px] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-[#0869F5] text-white shadow-sm'
                    : 'text-[#8A9BB3] hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Loteria Federal</span>
              </button>
            </div>

            {/* Mode details */}
            {mode === 'random' ? (
              <div className="p-4 rounded-[20px] bg-[#14213A]/70 border border-[#203456] text-left text-xs space-y-1">
                <span className="font-bold text-white block">Sorteio Aleatório Seguro</span>
                <p className="text-[#8A9BB3]">
                  {eligiblePaidTickets.length > 0 ? (
                    <>
                      O sistema selecionará automaticamente entre as <strong>{eligiblePaidTickets.length} cotas pagas</strong> com animação de roleta ao vivo.
                    </>
                  ) : (
                    <>
                      Nenhuma cota paga confirmada ainda. O sorteio escolherá entre o total de <strong>{raffle.total_tickets} cotas</strong> da rifa.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8A9BB3] mb-1">
                    Número Oficial Sorteado (1 a {raffle.total_tickets}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={raffle.total_tickets}
                    placeholder="Ex: 42"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-[#14213A] border border-[#203456] rounded-[16px] text-white placeholder-[#526480] text-sm font-bold focus:outline-none focus:border-[#0869F5] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8A9BB3] mb-1">
                    Nome do Ganhador (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Identificar nome do ganhador"
                    value={winnerNameInput}
                    onChange={(e) => setWinnerNameInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#14213A] border border-[#203456] rounded-[16px] text-white placeholder-[#526480] text-xs focus:outline-none focus:border-[#0869F5]"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleStartDraw}
              className="ora-btn-primary w-full py-4 rounded-[20px] text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_10px_30px_rgba(8,105,245,0.4)]"
            >
              <Flame className="w-5 h-5 text-[#FFD700]" />
              <span>Girar a Roleta & Sortear Agora</span>
            </button>
          </div>
        )}

        {/* STAGE 2: Contagem Regressiva (3, 2, 1...) */}
        {stage === 'countdown' && (
          <div className="py-12 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#62A5FF]">
              O sorteio vai começar em...
            </span>

            <div className="font-display font-extrabold text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white to-[#62A5FF] animate-bounce">
              {countdown}
            </div>

            <p className="text-xs text-[#8A9BB3]">
              Prepare sua transmissão ou gravação de tela!
            </p>
          </div>
        )}

        {/* STAGE 3: Giro em Alta Velocidade (Spinning Roulette) */}
        {stage === 'spinning' && (
          <div className="py-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0869F5]/25 border border-[#0869F5] text-[#62A5FF] text-xs font-bold animate-pulse">
              <Dices className="w-4 h-4" />
              <span>Sorteando a Cota da Sorte...</span>
            </div>

            {/* Glowing Roulette Box */}
            <div className="relative w-64 h-44 mx-auto rounded-[30px] bg-[#14213A] border-2 border-[#0869F5] shadow-[0_0_60px_rgba(8,105,245,0.4)] flex items-center justify-center overflow-hidden">
              <div className="font-display font-extrabold text-6xl text-white tabular-nums tracking-wider filter drop-shadow-[0_4px_16px_rgba(8,105,245,0.8)]">
                #{displayNumber.toString().padStart(3, '0')}
              </div>

              {/* Horizontal scanning lines */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse" />
            </div>

            <p className="text-xs text-[#8A9BB3] italic">
              Desacelerando... quem será o grande vencedor?
            </p>
          </div>
        )}

        {/* STAGE 4: Revelação Triunfante do Ganhador */}
        {stage === 'revealed' && finalWinnerTicket != null && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/60 text-[#FFD700] text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              <span>Cota Premiada Oficial!</span>
            </div>

            {/* Big Ticket Display */}
            <div className="relative py-6 px-4 rounded-[28px] bg-gradient-to-b from-[#14213A] to-[#0D1729] border-2 border-[#FFD700] shadow-[0_0_70px_rgba(255,215,0,0.3)]">
              <span className="text-xs uppercase font-bold text-[#8A9BB3] tracking-widest block mb-1">
                Número Sorteado
              </span>
              <div className="font-display font-extrabold text-6xl sm:text-7xl text-[#FFD700] tabular-nums tracking-wider drop-shadow-[0_4px_20px_rgba(255,215,0,0.5)]">
                #{finalWinnerTicket.toString().padStart(3, '0')}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00A868]" />
                <strong className="text-lg text-white font-bold">
                  {finalWinnerName || 'Comprador da Cota'}
                </strong>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {winnerPhone ? (
                <a
                  href={whatsappWinnerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 rounded-[18px] bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notificar Ganhador no WhatsApp</span>
                </a>
              ) : null}

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="ora-btn-primary w-full py-3.5 rounded-[18px] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gravando Resultado Oficial...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar e Salvar Resultado</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
