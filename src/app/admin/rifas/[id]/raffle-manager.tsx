'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Trophy,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { updateOrderStatus, finishRaffle } from '@/lib/firebase/raffles';
import type { Raffle, Order } from '@/types/database.types';

interface RaffleManagerProps {
  raffle: Raffle;
  initialOrders: Order[];
}

export default function RaffleManager({ raffle, initialOrders }: RaffleManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Winner draw form state
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [winnerTicket, setWinnerTicket] = useState('');
  const [winnerName, setWinnerName] = useState('');
  const [drawLoading, setDrawLoading] = useState(false);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${raffle.slug}`
    : `/r/${raffle.slug}`;

  function copyPublicLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Calculate ticket numbers
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const paidTicketsCount = paidOrders.reduce((acc, o) => acc + o.ticket_numbers.length, 0);
  const pendingTicketsCount = pendingOrders.reduce((acc, o) => acc + o.ticket_numbers.length, 0);
  const availableTicketsCount = Math.max(0, raffle.total_tickets - (paidTicketsCount + pendingTicketsCount));
  const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);

  async function handleStatusChange(orderId: string, newStatus: 'paid' | 'cancelled' | 'pending') {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFinishRaffle(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerTicket) return;

    setDrawLoading(true);
    try {
      const ticketNum = parseInt(winnerTicket, 10);
      await finishRaffle(raffle.id, ticketNum, winnerName);
      setShowDrawModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Erro ao finalizar rifa:', err);
    } finally {
      setDrawLoading(false);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  raffle.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : raffle.status === 'completed'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {raffle.status === 'active' ? 'Ativa' : raffle.status === 'completed' ? 'Concluída' : 'Pausada'}
              </span>
              {raffle.status === 'completed' && raffle.winner_ticket !== null && (
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Bilhete Ganhador: #{raffle.winner_ticket}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{raffle.title}</h1>
          </div>
        </div>

        {/* Public Link and Draw actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyPublicLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          <Link
            href={`/r/${raffle.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Página</span>
          </Link>

          {raffle.status === 'active' && (
            <button
              onClick={() => setShowDrawModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Trophy className="w-4 h-4" />
              <span>Realizar Sorteio</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Arrecadado (Pago)
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            R$ {totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Cotas Pagas
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {paidTicketsCount} <span className="text-xs text-slate-500">/ {raffle.total_tickets}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Reservadas
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {pendingTicketsCount}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Disponíveis
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-300">
            {availableTicketsCount}
          </div>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Pedidos & Participantes</h2>
            <p className="text-xs text-slate-400">
              Confirme pagamentos recebidos via PIX para garantir os números do comprador.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendentes ({pendingOrders.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pagos ({paidOrders.length})
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum pedido encontrado nesta categoria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredOrders.map((order) => {
              const cleanPhone = order.buyer_phone.replace(/\D/g, '');
              const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                `Olá ${order.buyer_name}! Entro em contato referente ao seu pedido na rifa "${raffle.title}".`
              )}`;

              return (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{order.buyer_name}</span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {order.buyer_phone}
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">
                        {order.ticket_numbers.length} cota(s) • Total: <strong>R$ {Number(order.total_amount).toFixed(2)}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Ticket Badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {order.ticket_numbers.map((num) => (
                        <span
                          key={num}
                          className="px-2 py-0.5 bg-slate-800 text-slate-200 text-xs font-mono font-bold rounded"
                        >
                          #{num.toString().padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, 'paid')}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                        >
                          {actionLoading === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Confirmar Pagamento</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-lg text-xs transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Liberar Cotas</span>
                        </button>
                      </>
                    ) : order.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs font-semibold">
                        Cancelado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sorteio / Modal de Ganhador */}
      {showDrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Definir Ganhador da Rifa
              </h3>
              <button
                onClick={() => setShowDrawModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Ao informar o número sorteado, a rifa será marcada como Concluída e o resultado ficará visível publicamente na página da rifa.
            </p>

            <form onSubmit={handleFinishRaffle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="winnerTicket">
                  Número do Bilhete Premiado *
                </label>
                <input
                  id="winnerTicket"
                  type="number"
                  min={1}
                  max={raffle.total_tickets}
                  required
                  value={winnerTicket}
                  onChange={(e) => setWinnerTicket(e.target.value)}
                  placeholder="Ex: 42"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="winnerName">
                  Nome do Ganhador (opcional)
                </label>
                <input
                  id="winnerName"
                  type="text"
                  value={winnerName}
                  onChange={(e) => setWinnerName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDrawModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={drawLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  {drawLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar Sorteio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
