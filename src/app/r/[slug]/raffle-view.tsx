'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Trophy,
  Check,
  Copy,
  MessageCircle,
  Dices,
  Search,
  ShoppingCart,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { createOrder } from './actions';
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
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>(initialOccupiedTickets);
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
  const progressPercent = Math.min(100, Math.round((paidCount / raffle.total_tickets) * 100));
  const totalPrice = (selectedTickets.length * raffle.ticket_price).toFixed(2);

  // Handle clicking a number in the grid
  function toggleTicket(num: number) {
    if (raffle.status !== 'active') return;
    if (occupiedMap.has(num)) return;

    setSelectedTickets((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
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
      raffleId: raffle.id,
      slug: raffle.slug,
      buyerName,
      buyerPhone,
      ticketNumbers: selectedTickets,
      totalAmount: amount,
    });

    if (result.error) {
      setOrderError(result.error);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 pb-28">
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
            <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
              <Ticket className="w-5 h-5" />
            </span>
            FAST<span className="text-emerald-400">RIFA</span>
          </Link>
          <Link
            href="/cadastro"
            className="text-xs font-bold text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/30 px-3.5 py-1.5 rounded-xl transition"
          >
            Criar Minha Rifa
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Prize Showcase Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden relative shadow-2xl">
          {raffle.status === 'completed' && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
              <span className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                <Trophy className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Rifa Concluída / Sorteio Realizado
                </span>
                <span className="text-sm font-bold text-white">
                  Cota Premiada: <strong className="text-amber-300 text-base">#{raffle.winner_ticket}</strong>
                  {raffle.winner_name && ` — Parabéns, ${raffle.winner_name}!`}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {raffle.prize_image_url && (
              <div className="w-full md:w-64 h-56 rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                <img
                  src={raffle.prize_image_url}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  Rifa Oficial
                </span>
                <span className="text-xs text-slate-400">
                  {raffle.total_tickets} cotas no total
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {raffle.title}
              </h1>

              {raffle.description && (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {raffle.description}
                </p>
              )}

              {/* Price & Progress */}
              <div className="pt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-xs uppercase font-bold text-slate-400">Por apenas</span>
                <span className="text-3xl font-black text-emerald-400">
                  R$ {Number(raffle.ticket_price).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">/ cota</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Progresso das vendas</span>
                  <span className="text-emerald-400">{progressPercent}% pago</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Selector Section */}
        {raffle.status === 'active' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Escolha suas cotas da sorte
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Clique nos números que preferir ou use os botões rápidos para adicionar cotas aleatórias.
              </p>
            </div>

            {/* Quick Pick Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Seleção Rápida de Cotas:
              </span>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => addRandomTickets(qty)}
                    disabled={allAvailableNumbers.length < qty}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Dices className="w-3.5 h-3.5 text-emerald-400" />
                    +{qty} cotas
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Status Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-slate-800/60">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Sua Seleção</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
                  <span>Reservado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-950 opacity-50 border border-slate-900" />
                  <span>Pago</span>
                </div>
              </div>

              {/* Number Search */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="max-h-96 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-1.5 sm:gap-2">
                {visibleNumbers.map((num) => {
                  const isSelected = selectedSet.has(num);
                  const status = occupiedMap.get(num);
                  const isPaid = status === 'paid';
                  const isPending = status === 'pending';

                  let btnStyle = 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60';

                  if (isSelected) {
                    btnStyle = 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20';
                  } else if (isPaid) {
                    btnStyle = 'bg-slate-950 text-slate-600 border-slate-900 line-through opacity-40 cursor-not-allowed';
                  } else if (isPending) {
                    btnStyle = 'bg-amber-500/15 text-amber-500 border-amber-500/30 opacity-60 cursor-not-allowed';
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isPaid || isPending}
                      onClick={() => toggleTicket(num)}
                      className={`h-10 sm:h-11 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center border ${btnStyle}`}
                    >
                      {num.toString().padStart(3, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Bar (Active when tickets are selected) */}
      {selectedTickets.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl p-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {selectedTickets.length} cota(s)
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Limpar
                </button>
              </div>
              <div className="text-lg font-black text-emerald-400">
                R$ {totalPrice}
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Participar Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Finalizar Reserva</h3>
              <p className="text-xs text-slate-400 mt-1">
                Preencha seus dados para reservar suas cotas e receber as instruções de pagamento.
              </p>
            </div>

            {orderError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                {orderError}
              </div>
            )}

            {/* Summary Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Cotas selecionadas:</span>
                <span className="font-bold text-white">{selectedTickets.length} cota(s)</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedTickets.map((n) => (
                  <span
                    key={n}
                    className="px-2 py-0.5 bg-slate-800 text-slate-200 text-xs font-mono font-bold rounded"
                  >
                    #{n.toString().padStart(3, '0')}
                  </span>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-300">Total a pagar:</span>
                <span className="text-lg font-black text-emerald-400">R$ {totalPrice}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="buyerName">
                  Nome Completo *
                </label>
                <input
                  id="buyerName"
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="buyerPhone">
                  WhatsApp com DDD *
                </label>
                <input
                  id="buyerPhone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Reservando cotas...
                  </>
                ) : (
                  'Confirmar e Ir para o Pagamento'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Screen Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Cotas Reservadas com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Realize a transferência via PIX e envie o comprovante ao organizador para confirmar seu bilhete.
              </p>
            </div>

            {/* PIX Key Box */}
            <div className="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-left">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>Chave PIX do Organizador ({raffle.pix_key_type.toUpperCase()}):</span>
                <span className="text-emerald-400 font-bold">R$ {confirmedOrder.total.toFixed(2)}</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm text-white break-all flex items-center justify-between gap-2">
                <span>{raffle.pix_key}</span>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex-shrink-0 transition"
                  title="Copiar Chave"
                >
                  {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {copiedPix && (
                <div className="text-center text-xs font-bold text-emerald-400">
                  Chave PIX copiada para a área de transferência!
                </div>
              )}
            </div>

            {/* WhatsApp Receipt Button */}
            {(() => {
              const organizerCleanPhone = (raffle.phone_whatsapp || '').replace(/\D/g, '');
              const formattedTickets = confirmedOrder.tickets
                .map((n) => `#${n.toString().padStart(3, '0')}`)
                .join(', ');

              const message = `Olá! Meu nome é ${buyerName} e acabei de reservar as cotas (${formattedTickets}) na rifa "${raffle.title}". Segue em anexo o comprovante do PIX no valor de R$ ${confirmedOrder.total.toFixed(2)}.`;
              const whatsappUrl = `https://wa.me/55${organizerCleanPhone}?text=${encodeURIComponent(message)}`;

              return (
                <div className="space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Enviar Comprovante no WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      setConfirmedOrder(null);
                      setIsCheckoutOpen(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Fechar e Voltar para a Rifa
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
