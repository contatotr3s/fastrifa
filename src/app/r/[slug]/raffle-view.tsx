'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Check,
  Copy,
  MessageCircle,
  Dices,
  Search,
  ShoppingCart,
  Loader2,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { createOrder } from '@/lib/firebase/raffles';
import { generateBrandInitials } from '@/lib/image-processor';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

interface RafflePublicViewProps {
  raffle: Raffle;
  initialOccupiedTickets: OccupiedTicket[];
}

export default function RafflePublicView({
  raffle,
  initialOccupiedTickets,
}: RafflePublicViewProps) {
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>(
    initialOccupiedTickets
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Success / Payment screen state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    tickets: number[];
    total: number;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Set of occupied numbers
  const occupiedMap = useMemo(() => {
    const map = new Map<number, 'pending' | 'paid'>();
    occupiedTickets.forEach((t) => map.set(t.ticket_number, t.status));
    return map;
  }, [occupiedTickets]);

  const selectedSet = useMemo(() => new Set(selectedTickets), [selectedTickets]);

  // Available numbers array
  const allAvailableNumbers = useMemo(() => {
    const available: number[] = [];
    for (let i = 1; i <= raffle.total_tickets; i++) {
      if (!occupiedMap.has(i) && !selectedSet.has(i)) {
        available.push(i);
      }
    }
    return available;
  }, [raffle.total_tickets, occupiedMap, selectedSet]);

  // Calculate statistics
  const paidCount = occupiedTickets.filter((t) => t.status === 'paid').length;
  const progressPercent = Math.min(
    100,
    Math.round((paidCount / raffle.total_tickets) * 100)
  );
  const totalPrice = (selectedTickets.length * raffle.ticket_price).toFixed(2);

  // Handle clicking a number in the grid
  function toggleTicket(num: number) {
    if (raffle.status !== 'active') return;
    if (occupiedMap.has(num)) return;

    setSelectedTickets((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num].sort((a, b) => a - b)
    );
  }

  // Quick Pick: add N random free numbers
  function addRandomTickets(count: number) {
    if (raffle.status !== 'active') return;
    const shuffled = [...allAvailableNumbers].sort(() => 0.5 - Math.random());
    const toAdd = shuffled.slice(0, count);

    setSelectedTickets((prev) => [...prev, ...toAdd].sort((a, b) => a - b));
  }

  function clearSelection() {
    setSelectedTickets([]);
  }

  function copyPixKey() {
    navigator.clipboard.writeText(raffle.pix_key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  }

  // Submit order
  async function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOrderError(null);
    setIsSubmitting(true);

    const amount = selectedTickets.length * raffle.ticket_price;

    const result = await createOrder({
      raffle_id: raffle.id,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      ticket_numbers: selectedTickets,
      total_amount: amount,
      status: 'pending',
    });

    if (result.error || !result.orderId) {
      setOrderError(result.error || 'Erro ao registrar pedido.');
      setIsSubmitting(false);
      return;
    }

    // Success! Update local occupied tickets and show payment step
    const newOccupied: OccupiedTicket[] = selectedTickets.map((n) => ({
      ticket_number: n,
      status: 'pending',
    }));
    setOccupiedTickets((prev) => [...prev, ...newOccupied]);

    setConfirmedOrder({
      orderId: result.orderId,
      tickets: [...selectedTickets],
      total: amount,
    });
    setSelectedTickets([]);
    setIsSubmitting(false);
  }

  // Filter grid by search
  const visibleNumbers = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= raffle.total_tickets; i++) {
      if (!searchQuery || i.toString().includes(searchQuery)) {
        list.push(i);
      }
    }
    return list;
  }, [raffle.total_tickets, searchQuery]);

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col pb-32">
      {/* Top Floating Pill Navbar with Smooth Feathered Atmosphere */}
      <header className="sticky top-0 z-40 h-[84px] flex items-center">
        <div className="ora-header-feather" aria-hidden="true" />
        <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="ora-glass-pill rounded-full px-4 py-2 flex items-center justify-center hover:border-[#B9D3F8] transition"
          >
            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Organizer Brand Badge */}
          {raffle.brand_name && (
            <div className="ora-glass-pill rounded-full px-3.5 py-1.5 hidden sm:flex items-center gap-2.5 border-[#CDE0FC]">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
                {raffle.brand_logo_url ? (
                  <img
                    src={raffle.brand_logo_url}
                    alt={raffle.brand_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{generateBrandInitials(raffle.brand_name)}</span>
                )}
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-[#526480] block leading-none">
                  Organizador
                </span>
                <strong className="text-xs text-[#0D1729] font-bold leading-tight block">
                  {raffle.brand_name}
                </strong>
              </div>
            </div>
          )}

          <Link
            href="/cadastro"
            className="ora-btn-secondary rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
          >
            <span>Criar Minha Rifa</span>
            <ArrowUpRight className="w-4 h-4 text-[#0869F5]" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-8">
        {/* Prize Showcase Card */}
        <section className="ora-card rounded-[32px] p-6 sm:p-10 relative overflow-hidden">
          {raffle.status === 'completed' && (
            <div className="mb-7 p-5 bg-[#FFF8EB] border border-[#F5D08A] rounded-[22px] flex items-center gap-4">
              <span className="p-3 bg-[#9A6700] text-white rounded-2xl">
                <Trophy className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9A6700] block">
                  Sorteio Concluído
                </span>
                <span className="text-base font-bold text-[#0D1729] tabular-nums">
                  Cota Premiada:{' '}
                  <strong className="text-[#0869F5] text-lg">
                    #{raffle.winner_ticket?.toString().padStart(3, '0')}
                  </strong>
                  {raffle.winner_name && ` — Parabéns, ${raffle.winner_name}!`}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {raffle.prize_image_url && (
              <div className="w-full md:w-72 h-64 rounded-[24px] overflow-hidden bg-[#F5F9FF] flex-shrink-0 border border-[#E0E9F7] shadow-[0_12px_30px_rgba(32,75,134,0.08)]">
                <img
                  src={raffle.prize_image_url}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 space-y-4 w-full">
              <div className="flex flex-wrap items-center gap-2.5">
                {raffle.brand_name ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F9FF] border border-[#CDE0FC] text-[#0869F5] text-xs font-bold rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#0869F5]" />
                    <span>Oficial: <strong>{raffle.brand_name}</strong></span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1 bg-[#0869F5] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Campanha Oficial
                  </span>
                )}
                <span className="px-3.5 py-1 bg-[#F5F9FF] border border-[#D9E5F7] text-[#475872] text-xs font-semibold rounded-full tabular-nums">
                  {raffle.total_tickets} cotas no total
                </span>
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-4xl text-[#0D1729] tracking-[-0.04em] leading-[1.1]">
                {raffle.title}
              </h1>

              {raffle.description && (
                <p className="text-[15px] sm:text-base text-[#475872] leading-[1.6] whitespace-pre-line">
                  {raffle.description}
                </p>
              )}

              {/* Price Box & Progress */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[22px] p-4 sm:p-5 tabular-nums">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#526480] block">
                    Valor unitário
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-display font-bold text-3xl sm:text-4xl text-[#0869F5]">
                      R$ {Number(raffle.ticket_price).toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-[#475872]">/ por cota</span>
                  </div>
                </div>

                <div className="w-full sm:w-56 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#14213A]">
                    <span>Cotas confirmadas</span>
                    <span className="text-[#0869F5]">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-[#D9E5F7]">
                    <div
                      className="h-full bg-gradient-to-r from-[#3888FF] to-[#0869F5] transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ticket Selector Section */}
        {raffle.status === 'active' && (
          <section className="ora-card rounded-[32px] p-6 sm:p-10 space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
                  Escolha suas cotas
                </h2>
                <p className="text-sm sm:text-[15px] text-[#475872] mt-1">
                  Toque nos números desejados na grade abaixo ou adicione pacotes aleatórios com 1 clique.
                </p>
              </div>
            </div>

            {/* Quick Pick Buttons */}
            <div className="p-5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[24px] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475872] block">
                Seleção Rápida Automática
              </span>
              <div className="flex flex-wrap gap-2.5 tabular-nums">
                {[5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => addRandomTickets(qty)}
                    disabled={allAvailableNumbers.length < qty}
                    className="px-4 py-2.5 bg-white hover:bg-[#EDF5FF] active:bg-[#D9ECFF] border border-[#CDE0FC] hover:border-[#0869F5] text-[#0755DE] text-xs sm:text-sm font-display font-bold rounded-[14px] shadow-[0_4px_12px_rgba(36,97,184,0.06)] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    <Dices className="w-4 h-4 text-[#0869F5]" />
                    <span>+{qty} cotas</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Status Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-[#E0E9F7]">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#475872] tabular-nums">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-[5px] bg-[#F5F9FF] border border-[#D9E5F7]" />
                  <span>Disponível ({allAvailableNumbers.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-[5px] bg-[#0869F5]" />
                  <span>Selecionada ({selectedTickets.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-[5px] bg-[#FFF8EB] border border-[#F5D08A]" />
                  <span>Reservada</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-[5px] bg-[#FFF0F0] border border-[#FCA5A5]" />
                  <span className="text-[#DC2626] font-semibold">Paga ({paidCount})</span>
                </div>
              </div>

              {/* Number Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#526480]" />
                <input
                  type="text"
                  aria-label="Buscar número da cota"
                  placeholder="Buscar número..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2 bg-[#F5F9FF] border border-[#D9E5F7] rounded-full text-xs font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] tabular-nums"
                />
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-10 gap-2 tabular-nums">
                {visibleNumbers.map((num) => {
                  const isSelected = selectedSet.has(num);
                  const status = occupiedMap.get(num);
                  const isPaid = status === 'paid';
                  const isPending = status === 'pending';

                  let btnStyle =
                    'bg-[#F5F9FF] hover:bg-[#EDF5FF] text-[#14213A] border-[#D9E5F7] hover:border-[#0869F5] cursor-pointer';

                  if (isSelected) {
                    btnStyle =
                      'bg-[#0869F5] text-white font-bold border-[#0869F5] shadow-[0_8px_18px_rgba(8,105,245,0.28)] scale-[1.02] cursor-pointer';
                  } else if (isPaid) {
                    btnStyle =
                      'bg-[#FFF0F0] text-[#DC2626] border-[#FCA5A5] line-through font-bold opacity-80 cursor-not-allowed shadow-[inset_0_1px_2px_rgba(220,38,38,0.06)]';
                  } else if (isPending) {
                    btnStyle =
                      'bg-[#FFF8EB] text-[#9A6700] border-[#F5D08A] cursor-not-allowed';
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isPaid || isPending}
                      onClick={() => toggleTicket(num)}
                      className={`h-11 sm:h-12 rounded-[13px] text-xs font-display font-bold transition flex items-center justify-center border ${btnStyle}`}
                    >
                      {num.toString().padStart(3, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Footer Brand & Security Attribution */}
        <footer className="pt-6 pb-2 text-center text-xs text-[#526480] space-y-1">
          <p className="font-semibold text-[#0D1729]">
            Campanha gerenciada por <strong>{raffle.brand_name || 'Organizador Oficial'}</strong>
          </p>
          <p className="text-[11px] text-[#526480]">
            Tecnologia FastRifa • Pagamentos 100% diretos via PIX sem intermediários
          </p>
        </footer>
      </main>

      {/* Floating Bottom Capsule (Active when tickets are selected) */}
      {selectedTickets.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 pointer-events-none flex justify-center">
          <div className="pointer-events-auto max-w-3xl w-full bg-white/95 backdrop-blur-xl border-2 border-[#0869F5] rounded-[24px] px-5 py-4 shadow-[0_20px_50px_rgba(8,105,245,0.22)] flex items-center justify-between gap-4 tabular-nums">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-display font-bold text-[#0D1729]">
                  {selectedTickets.length} cota(s) selecionada(s)
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-bold text-[#BE123C] hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
              <div className="font-display font-bold text-xl text-[#0869F5]">
                Total: R$ {totalPrice}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="ora-btn-primary px-6 py-3.5 font-bold rounded-[18px] flex items-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Reservar Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="ora-card rounded-[28px] max-w-md w-full p-7 sm:p-8 space-y-6 relative">
            <button
              type="button"
              aria-label="Fechar modal"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-5 top-5 p-2 text-[#475872] hover:text-[#0D1729] rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                Finalizar Reserva
              </h3>
              <p className="text-sm text-[#475872] mt-1">
                Informe seu nome e WhatsApp para vincular os números escolhidos a você.
              </p>
            </div>

            {orderError && (
              <div
                role="alert"
                className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-medium rounded-[14px]"
              >
                {orderError}
              </div>
            )}

            {/* Summary Box */}
            <div className="p-4 bg-[#F5F9FF] rounded-[20px] border border-[#E0E9F7] space-y-2.5 tabular-nums">
              <div className="flex justify-between text-xs font-semibold text-[#475872]">
                <span>Cotas selecionadas:</span>
                <span className="font-bold text-[#0D1729]">
                  {selectedTickets.length} cota(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedTickets.map((n) => (
                  <span
                    key={n}
                    className="px-2.5 py-0.5 bg-white border border-[#D9E5F7] text-[#0869F5] text-xs font-display font-bold rounded-[8px]"
                  >
                    #{n.toString().padStart(3, '0')}
                  </span>
                ))}
              </div>
              <div className="pt-2.5 border-t border-[#E0E9F7] flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#14213A]">Total a pagar:</span>
                <span className="font-display font-bold text-xl text-[#0869F5]">
                  R$ {totalPrice}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                  htmlFor="buyerName"
                >
                  Nome Completo *
                </label>
                <input
                  id="buyerName"
                  type="text"
                  required
                  placeholder="Digite seu nome completo"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] text-sm focus:outline-none focus:bg-white focus:border-[#0869F5]"
                />
              </div>

              <div>
                <label
                  className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                  htmlFor="buyerPhone"
                >
                  WhatsApp com DDD *
                </label>
                <input
                  id="buyerPhone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] text-sm focus:outline-none focus:bg-white focus:border-[#0869F5]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="ora-btn-primary w-full py-4 font-bold rounded-[18px] flex items-center justify-center gap-2 text-[15px] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Reservando cotas...</span>
                  </>
                ) : (
                  <span>Confirmar e Gerar PIX</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Screen Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ora-card rounded-[32px] max-w-lg w-full p-7 sm:p-9 space-y-6 relative text-center">
            <div className="w-16 h-16 bg-[#EDF5FF] border border-[#CDE0FC] rounded-full flex items-center justify-center mx-auto text-[#0869F5]">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                Cotas Reservadas com Sucesso!
              </h3>
              <p className="text-sm text-[#475872] mt-1.5">
                Faça o pagamento via PIX usando a chave abaixo e envie o comprovante ao organizador para confirmar seus números.
              </p>
            </div>

            {/* PIX Key Box */}
            <div className="p-5 bg-[#F5F9FF] rounded-[22px] border border-[#E0E9F7] space-y-3 text-left tabular-nums">
              <div className="flex justify-between items-center text-xs font-bold text-[#475872]">
                <span>Chave PIX ({raffle.pix_key_type.toUpperCase()}):</span>
                <span className="text-[#0869F5] text-base">
                  R$ {confirmedOrder.total.toFixed(2)}
                </span>
              </div>

              <div className="p-3.5 bg-white border border-[#D9E5F7] rounded-[16px] font-mono text-sm font-bold text-[#0D1729] break-all flex items-center justify-between gap-2">
                <span>{raffle.pix_key}</span>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="px-3 py-1.5 bg-[#F2F7FF] hover:bg-[#E3EFFF] border border-[#CDE0FC] text-[#0755DE] text-xs font-sans font-bold rounded-[10px] flex-shrink-0 inline-flex items-center gap-1.5 transition cursor-pointer"
                  title="Copiar Chave PIX"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0869F5]" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* WhatsApp Receipt Button */}
            {(() => {
              const organizerCleanPhone = (raffle.phone_whatsapp || '').replace(
                /\D/g,
                ''
              );
              const formattedTickets = confirmedOrder.tickets
                .map((n) => `#${n.toString().padStart(3, '0')}`)
                .join(', ');

              const message = `Olá! Meu nome é ${buyerName} e acabei de reservar as cotas (${formattedTickets}) na rifa "${raffle.title}". Segue em anexo o comprovante do PIX no valor de R$ ${confirmedOrder.total.toFixed(2)}.`;
              const whatsappUrl = `https://wa.me/55${organizerCleanPhone}?text=${encodeURIComponent(
                message
              )}`;

              return (
                <div className="space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ora-btn-primary w-full py-4 font-bold rounded-[18px] flex items-center justify-center gap-2 text-[15px]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Enviar Comprovante no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrder(null);
                      setIsCheckoutOpen(false);
                    }}
                    className="text-xs font-bold text-[#475872] hover:text-[#0D1729] cursor-pointer"
                  >
                    Fechar e voltar para a campanha
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
