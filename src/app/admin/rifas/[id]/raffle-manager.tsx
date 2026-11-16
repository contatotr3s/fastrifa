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
  X,
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

  const publicUrl =
    typeof window !== 'undefined'
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
  const availableTicketsCount = Math.max(
    0,
    raffle.total_tickets - (paidTicketsCount + pendingTicketsCount)
  );
  const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);

  async function handleStatusChange(
    orderId: string,
    newStatus: 'paid' | 'cancelled' | 'pending'
  ) {
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
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin"
            aria-label="Voltar para o painel"
            className="ora-btn-secondary p-2.5 rounded-full inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[#14213A]" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  raffle.status === 'active'
                    ? 'bg-[#0869F5] text-white'
                    : raffle.status === 'completed'
                    ? 'bg-[#FFF8EB] text-[#9A6700] border border-[#F5D08A]'
                    : 'bg-[#F5F9FF] text-[#475872] border border-[#D9E5F7]'
                }`}
              >
                {raffle.status === 'active'
                  ? 'Ativa'
                  : raffle.status === 'completed'
                  ? 'Concluída'
                  : 'Pausada'}
              </span>
              {raffle.status === 'completed' && raffle.winner_ticket != null && (
                <span className="text-xs text-[#9A6700] bg-[#FFF8EB] border border-[#F5D08A] px-3 py-0.5 rounded-full font-bold inline-flex items-center gap-1 tabular-nums">
                  <Trophy className="w-3.5 h-3.5" />
                  Cota Premiada: #{String(raffle.winner_ticket).padStart(3, '0')}
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
              {raffle.title}
            </h1>
          </div>
        </div>

        {/* Public Link and Draw actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={copyPublicLink}
            className="ora-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#0869F5]" />
            ) : (
              <Copy className="w-4 h-4 text-[#0869F5]" />
            )}
            <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          <Link
            href={`/r/${raffle.slug}`}
            target="_blank"
            className="ora-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full"
          >
            <ExternalLink className="w-4 h-4 text-[#0869F5]" />
            <span>Ver Página Pública</span>
          </Link>

          {raffle.status === 'active' && (
            <button
              type="button"
              onClick={() => setShowDrawModal(true)}
              className="ora-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-full cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Realizar Sorteio</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
        <div className="ora-card rounded-[24px] p-5">
          <div className="text-[#475872] text-xs font-bold uppercase tracking-wider mb-1">
            Arrecadado (Pago)
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#0869F5]">
            R$ {totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="ora-card rounded-[24px] p-5">
          <div className="text-[#475872] text-xs font-bold uppercase tracking-wider mb-1">
            Cotas Pagas
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729]">
            {paidTicketsCount}{' '}
            <span className="text-sm font-medium text-[#526480]">
              / {raffle.total_tickets}
            </span>
          </div>
        </div>

        <div className="ora-card rounded-[24px] p-5">
          <div className="text-[#475872] text-xs font-bold uppercase tracking-wider mb-1">
            Reservadas
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#9A6700]">
            {pendingTicketsCount}
          </div>
        </div>

        <div className="ora-card rounded-[24px] p-5">
          <div className="text-[#475872] text-xs font-bold uppercase tracking-wider mb-1">
            Disponíveis
          </div>
          <div className="font-display font-bold text-2xl sm:text-3xl text-[#14213A]">
            {availableTicketsCount}
          </div>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="ora-card rounded-[28px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-[#0D1729] tracking-[-0.03em]">
              Pedidos & Participantes
            </h2>
            <p className="text-sm text-[#475872]">
              Confirme os pagamentos recebidos via PIX para liberar definitivamente os números.
            </p>
          </div>

          {/* Oratry Capsule Filter Toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 bg-[#F8FBFF] rounded-full border border-[#DBE7F6] self-start sm:self-auto text-xs font-bold tabular-nums">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#0869F5] text-white shadow-[0_4px_12px_rgba(8,105,245,0.2)]'
                  : 'text-[#475872] hover:text-[#0D1729]'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#0869F5] text-white shadow-[0_4px_12px_rgba(8,105,245,0.2)]'
                  : 'text-[#475872] hover:text-[#0D1729]'
              }`}
            >
              Pendentes ({pendingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('paid')}
              className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                filter === 'paid'
                  ? 'bg-[#0869F5] text-white shadow-[0_4px_12px_rgba(8,105,245,0.2)]'
                  : 'text-[#475872] hover:text-[#0D1729]'
              }`}
            >
              Pagos ({paidOrders.length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center bg-[#F5F9FF] rounded-[20px] border border-[#E0E9F7] text-[#475872] text-sm">
            Nenhum pedido encontrado nesta categoria.
          </div>
        ) : (
          <div className="divide-y divide-[#E0E9F7]">
            {filteredOrders.map((order) => {
              const cleanPhone = order.buyer_phone.replace(/\D/g, '');
              const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                `Olá ${order.buyer_name}! Entro em contato referente ao seu pedido na rifa "${raffle.title}".`
              )}`;

              return (
                <div
                  key={order.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-display font-bold text-[#0D1729] text-base">
                        {order.buyer_name}
                      </span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0755DE] bg-[#F2F7FF] hover:bg-[#E3EFFF] border border-[#CDE0FC] px-2.5 py-1 rounded-full inline-flex items-center gap-1 font-bold transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{order.buyer_phone}</span>
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475872] tabular-nums">
                      <span>
                        {order.ticket_numbers.length} cota(s) • Total:{' '}
                        <strong className="text-[#0D1729] font-bold">
                          R$ {Number(order.total_amount).toFixed(2)}
                        </strong>
                      </span>
                      <span className="text-[#B9D3F8]">•</span>
                      <span className="text-[#526480]">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Ticket Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1 tabular-nums">
                      {order.ticket_numbers.map((num) => (
                        <span
                          key={num}
                          className="px-2.5 py-1 bg-[#F5F9FF] border border-[#D9E5F7] text-[#14213A] text-xs font-display font-bold rounded-[10px]"
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
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'paid')}
                          disabled={actionLoading === order.id}
                          className="ora-btn-primary inline-flex items-center gap-1.5 px-4 py-2 font-bold rounded-[14px] text-xs cursor-pointer"
                        >
                          {actionLoading === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Confirmar PIX</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          disabled={actionLoading === order.id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] font-bold rounded-[14px] text-xs transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Liberar Cotas</span>
                        </button>
                      </>
                    ) : order.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EDF5FF] text-[#0755DE] border border-[#CDE0FC] rounded-full text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Pago</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] rounded-full text-xs font-bold">
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
        <div className="fixed inset-0 z-50 bg-[#0D1729]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="ora-card rounded-[28px] max-w-md w-full p-7 space-y-5 relative">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-[#0D1729] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#0869F5]" />
                <span>Definir Ganhador da Rifa</span>
              </h3>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setShowDrawModal(false)}
                className="p-1.5 text-[#475872] hover:text-[#0D1729] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#475872] leading-relaxed">
              Ao informar o número sorteado, a campanha será marcada como Concluída e o resultado ficará visível publicamente na página da rifa.
            </p>

            <form onSubmit={handleFinishRaffle} className="space-y-4">
              <div>
                <label
                  className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                  htmlFor="winnerTicket"
                >
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
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] text-sm focus:outline-none focus:bg-white focus:border-[#0869F5] tabular-nums"
                />
              </div>

              <div>
                <label
                  className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                  htmlFor="winnerName"
                >
                  Nome do Ganhador (opcional)
                </label>
                <input
                  id="winnerName"
                  type="text"
                  value={winnerName}
                  onChange={(e) => setWinnerName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] text-sm focus:outline-none focus:bg-white focus:border-[#0869F5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDrawModal(false)}
                  className="ora-btn-secondary px-5 py-2.5 rounded-[14px] text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={drawLoading}
                  className="ora-btn-primary px-5 py-2.5 rounded-[14px] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {drawLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar Sorteio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
