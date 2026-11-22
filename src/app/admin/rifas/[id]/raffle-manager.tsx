'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Share2,
  CheckCircle2,
  Phone,
  Store,
  Sparkles,
  ShieldCheck,
  Trash2,
  Printer,
  Pencil,
  Search,
  CheckCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { useTheme } from '@/lib/theme-context';
import { updateOrderStatus, finishRaffle, deleteRaffle } from '@/lib/firebase/raffles';
import SocialShareModal from '@/components/social-share-modal';
import DrawRouletteModal from '@/components/draw-roulette-modal';
import PhysicalCardModal from '@/components/physical-card-modal';
import EditRaffleModal from '@/components/edit-raffle-modal';
import HybridSalesWelcomeModal from '@/components/hybrid-sales-welcome-modal';
import type { Raffle, Order } from '@/types/database.types';

interface RaffleManagerProps {
  raffle: Raffle;
  initialOrders: Order[];
}

export default function RaffleManager({ raffle: initialRaffle, initialOrders }: RaffleManagerProps) {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [raffle, setCurrentRaffle] = useState<Raffle>(initialRaffle);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'approve' | 'cancel' | null>(null);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  async function handleDeleteRaffle() {
    if (
      !confirm(
        `Tem certeza que deseja excluir permanentemente a rifa "${raffle.title}"?\n\nEsta ação apagará todas as cotas e pedidos desta rifa de forma irreversível.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRaffle(raffle.id);
      router.push('/admin');
    } catch (err) {
      console.error('Erro ao excluir rifa:', err);
      alert('Ocorreu um erro ao excluir a rifa.');
      setIsDeleting(false);
    }
  }

  // Modais
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showPhysicalCardModal, setShowPhysicalCardModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [approvalNotification, setApprovalNotification] = useState<Order | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('created') === 'true') {
        setShowWelcomeModal(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const publicUrl =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/r/${raffle.slug}`
      : `https://fastrifa.vercel.app/r/${raffle.slug}`;

  function copyPublicLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Calculate ticket numbers
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const paidTicketNumbers = paidOrders.flatMap((o) => o.ticket_numbers);
  const pendingTicketNumbers = pendingOrders.flatMap((o) => o.ticket_numbers);
  const paidTicketsCount = paidTicketNumbers.length;
  const pendingTicketsCount = pendingTicketNumbers.length;
  const availableTicketsCount = Math.max(
    0,
    raffle.total_tickets - (paidTicketsCount + pendingTicketsCount)
  );
  const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);

  function formatTickets(numbers: number[]): string {
    return numbers.map((n) => `#${n.toString().padStart(3, '0')}`).join(', ');
  }

  function getApprovedWhatsAppUrl(order: Order): string {
    const cleanPhone = (order.buyer_phone || '').replace(/\D/g, '');
    const tickets = formatTickets(order.ticket_numbers);
    const brand = raffle.brand_name || 'FastRifa Oficial';
    const msg = `🎉 *PAGAMENTO CONFIRMADO!*
Olá ${order.buyer_name}, seu pagamento de R$ ${Number(order.total_amount).toFixed(2)} foi confirmado com sucesso na rifa *"${raffle.title}"*!

🎟️ Suas cotas oficiais:
${tickets}

Acompanhe a campanha no link:
${publicUrl}

Boa sorte! 🍀
— *${brand}*`;

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }

  function getPendingReminderWhatsAppUrl(order: Order): string {
    const cleanPhone = (order.buyer_phone || '').replace(/\D/g, '');
    const tickets = formatTickets(order.ticket_numbers);
    const brand = raffle.brand_name || 'FastRifa Oficial';
    const msg = `Olá ${order.buyer_name}! Notamos que você reservou as cotas (${tickets}) na rifa *"${raffle.title}"*.

💰 Total: R$ ${Number(order.total_amount).toFixed(2)}
🔑 Chave PIX: ${raffle.pix_key} (${(raffle.pix_key_type || 'PIX').toUpperCase()})

Após pagar, envie o comprovante por aqui para confirmarmos suas cotas!
— *${brand}*`;

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }

  async function handleStatusChange(
    orderId: string,
    newStatus: 'paid' | 'cancelled' | 'pending'
  ) {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
      setOrders(updated);

      if (newStatus === 'paid') {
        const order = updated.find((o) => o.id === orderId);
        if (order) {
          setApprovalNotification(order);
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBatchApprovePending() {
    if (pendingOrders.length === 0) return;
    if (
      !confirm(
        `Deseja confirmar o pagamento de todos os ${pendingOrders.length} pedido(s) pendente(s) de uma vez?`
      )
    ) {
      return;
    }

    setIsBatchProcessing(true);
    setBatchActionType('approve');
    try {
      await Promise.all(
        pendingOrders.map((order) => updateOrderStatus(order.id, 'paid'))
      );
      setOrders((prev) =>
        prev.map((o) => (o.status === 'pending' ? { ...o, status: 'paid' } : o))
      );
      setBatchSuccessMessage(`${pendingOrders.length} pedido(s) aprovado(s) com sucesso!`);
      setTimeout(() => setBatchSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Erro ao aprovar pedidos em lote:', err);
      alert('Ocorreu um erro ao processar alguns pedidos.');
    } finally {
      setIsBatchProcessing(false);
      setBatchActionType(null);
    }
  }

  async function handleBatchCancelPending() {
    if (pendingOrders.length === 0) return;
    if (
      !confirm(
        `Tem certeza que deseja cancelar todas as ${pendingOrders.length} reserva(s) pendente(s)?\n\nIsso liberará as cotas na grade imediatamente para que outros compradores possam escolher.`
      )
    ) {
      return;
    }

    setIsBatchProcessing(true);
    setBatchActionType('cancel');
    try {
      await Promise.all(
        pendingOrders.map((order) => updateOrderStatus(order.id, 'cancelled'))
      );
      setOrders((prev) =>
        prev.map((o) => (o.status === 'pending' ? { ...o, status: 'cancelled' } : o))
      );
      setBatchSuccessMessage(`${pendingOrders.length} reserva(s) cancelada(s) e cotas liberadas!`);
      setTimeout(() => setBatchSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Erro ao liberar cotas em lote:', err);
      alert('Ocorreu um erro ao liberar algumas cotas.');
    } finally {
      setIsBatchProcessing(false);
      setBatchActionType(null);
    }
  }

  async function handleFinishDraw(winnerTicket: number, winnerName: string) {
    await finishRaffle(raffle.id, winnerTicket, winnerName);
    const now = new Date().toISOString();
    setCurrentRaffle((prev) => ({
      ...prev,
      status: 'completed',
      winner_ticket: winnerTicket,
      winner_name: winnerName,
      draw_date: now,
    }));
    setShowDrawModal(false);
  }

  // Dados do ganhador oficial para comunicação rápida
  const winnerTicket = raffle.winner_ticket;
  const winnerOrder =
    winnerTicket != null
      ? paidOrders.find((o) => o.ticket_numbers.includes(winnerTicket))
      : null;
  const winnerPhone = winnerOrder?.buyer_phone?.replace(/\D/g, '') || '';
  const resolvedWinnerName =
    raffle.winner_name || winnerOrder?.buyer_name || 'Ganhador da Cota';

  const winnerWhatsappMessage = `🎉 *PARABÉNS! VOCÊ GANHOU O PRÊMIO!* 🏆
Olá ${resolvedWinnerName}, sua cota *#${winnerTicket?.toString().padStart(3, '0')}* foi a grande vencedora da rifa *"${raffle.title}"*!

Entre em contato para combinarmos a entrega do seu prêmio.
— *${raffle.brand_name || 'FastRifa'}*`;

  const winnerWhatsappUrl = winnerPhone
    ? `https://wa.me/55${winnerPhone}?text=${encodeURIComponent(winnerWhatsappMessage)}`
    : null;

  const filteredOrders = orders.filter((o) => {
    // 1. Filtro por status
    if (filter !== 'all' && o.status !== filter) return false;

    // 2. Filtro por texto / telefone / cota
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanPhone = (o.buyer_phone || '').replace(/\D/g, '');
      const cleanDigits = q.replace(/\D/g, '');

      const nameMatch = (o.buyer_name || '').toLowerCase().includes(q);
      const phoneMatch = cleanDigits ? cleanPhone.includes(cleanDigits) : false;
      const ticketMatch = o.ticket_numbers.some((num) => {
        const numStr = num.toString();
        const numPadded = numStr.padStart(3, '0');
        return numStr === cleanDigits || numPadded === cleanDigits || numStr.includes(q);
      });

      return nameMatch || phoneMatch || ticketMatch;
    }

    return true;
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
              {raffle.brand_name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#526480] bg-[#F5F9FF] px-2.5 py-0.5 rounded-full border border-[#E0E9F7]">
                  <Store className="w-3 h-3 text-[#0869F5]" />
                  <span>{raffle.brand_name}</span>
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
              {raffle.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gerar Cartela Física (Disponível para rifas de até 200 números) */}
          {raffle.total_tickets <= 200 && (
            <button
              type="button"
              onClick={() => setShowPhysicalCardModal(true)}
              className="ora-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full cursor-pointer border-[#0869F5]/40 hover:border-[#0869F5]"
              title="Vai gerar cartela física em PDF (2 páginas A4), pronta para impressão"
            >
              <Printer className="w-4 h-4 text-[#0869F5]" />
              <span>Gerar Cartela</span>
            </button>
          )}

          {/* Editar Campanha com Auditoria */}
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="ora-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full cursor-pointer hover:border-[#0869F5]"
            title="Editar título, fotos, descrição e valor com registro de auditoria"
          >
            <Pencil className="w-4 h-4 text-[#0869F5]" />
            <span>Editar Rifa</span>
          </button>

          {/* Divulgar nas Redes */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="ora-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full cursor-pointer hover:border-[#0869F5]"
            title="Gerar card com QR Code para Stories e WhatsApp"
          >
            <Share2 className="w-4 h-4 text-[#0869F5]" />
            <span>Divulgar nas Redes</span>
          </button>

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

          {raffle.status === 'active' ? (
            <button
              type="button"
              onClick={() => setShowDrawModal(true)}
              className="ora-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-full cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Realizar Sorteio</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDrawModal(true)}
              className="ora-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full cursor-pointer border-[#F5D08A] text-[#9A6700] hover:bg-[#FFF8EB]"
              title="Abrir roleta novamente para transmissão ao vivo ou gravação de tela"
            >
              <Trophy className="w-4 h-4 text-[#9A6700]" />
              <span>Ver Roleta</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Triunfante de Sorteio Concluído */}
      {raffle.status === 'completed' && raffle.winner_ticket != null && (
        <div className="ora-card rounded-[28px] p-6 sm:p-7 bg-gradient-to-r from-[#FFFDF0] via-[#FFF8EB] to-white border-2 border-[#F5D08A] shadow-[0_12px_32px_rgba(245,158,11,0.12)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-[#9A6700] text-white flex items-center justify-center flex-shrink-0 shadow-sm text-2xl">
                🏆
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-[#9A6700] text-white text-[11px] font-bold uppercase tracking-wider">
                    Sorteio Oficial Concluído
                  </span>
                  <span className="text-xs text-[#9A6700] font-semibold">
                    {raffle.draw_date ? new Date(raffle.draw_date).toLocaleString('pt-BR') : 'Finalizado'}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#0D1729] mt-0.5">
                  Cota Premiada: <span className="text-[#0869F5]">#{String(raffle.winner_ticket).padStart(3, '0')}</span> — {resolvedWinnerName}
                </h3>
                {winnerOrder && (
                  <p className="text-xs text-[#526480] mt-0.5">
                    Telefone registrado: <strong>{winnerOrder.buyer_phone}</strong> • Total de cotas compradas: {winnerOrder.ticket_numbers.length}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
              {winnerWhatsappUrl && (
                <a
                  href={winnerWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notificar Ganhador no WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowDrawModal(true)}
                className="ora-btn-secondary px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                title="Abrir roleta novamente para transmissão ao vivo ou gravação de tela"
              >
                <RotateCcw className="w-4 h-4 text-[#9A6700]" />
                <span>Reabrir Roleta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Cartela Física Pronta para Impressão (Rifas até 200 números) */}
      {raffle.total_tickets <= 200 && (
        <div className="ora-card rounded-[24px] p-4 sm:p-5 bg-gradient-to-r from-[#EDF5FF] via-[#F5F9FF] to-white border border-[#CDE0FC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-white border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <strong className="font-display font-bold text-sm sm:text-base text-[#0D1729]">
                  Cartela Física Pronta para Impressão (PDF A4 — 2 Páginas)
                </strong>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0869F5] text-white text-[10px] font-bold uppercase tracking-wider">
                  Físico + Virtual
                </span>
              </div>
              <p className="text-xs text-[#475872] mt-0.5">
                Como sua rifa possui até 200 números ({raffle.total_tickets} cotas), você pode gerar a cartela física estilizada com QR Code da rifa e folha de controle presencial com calculadora PIX automática.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Link
              href={`/r/${raffle.slug}/pix`}
              target="_blank"
              className="ora-btn-secondary px-4 py-3 rounded-[16px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm hover:border-[#0869F5]"
            >
              <ExternalLink className="w-4 h-4 text-[#0869F5]" />
              <span>Abrir Checador Físico</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowPhysicalCardModal(true)}
              className="ora-btn-primary px-5 py-3 rounded-[16px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar Cartela</span>
            </button>
          </div>
        </div>
      )}

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
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
              Pedidos e Comprovantes
            </h2>
            <p className="text-xs text-[#475872] mt-0.5">
              Confirme os comprovantes recebidos no WhatsApp e notifique os compradores instantaneamente.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F9FF] p-1.5 rounded-[18px] border border-[#E0E9F7]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-[14px] transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#0869F5] shadow-sm'
                  : 'text-[#475872] hover:text-[#0D1729]'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-[14px] transition cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white text-[#9A6700] shadow-sm'
                  : 'text-[#475872] hover:text-[#0D1729]'
              }`}
            >
              Pendentes ({pendingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('paid')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-[14px] transition cursor-pointer ${
                filter === 'paid'
                  ? 'bg-white text-[#0869F5] shadow-sm'
                  : 'text-[#475872] hover:text-[#0D1729]'
              }`}
            >
              Confirmados ({paidOrders.length})
            </button>
          </div>
        </div>

        {/* Batch Success Feedback */}
        {batchSuccessMessage && (
          <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold rounded-[16px] flex items-center gap-2 animate-in fade-in">
            <CheckCheck className="w-4 h-4 flex-shrink-0" />
            <span>{batchSuccessMessage}</span>
          </div>
        )}

        {/* Search Bar & Batch Actions Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1 border-t border-[#E0E9F7]">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#526480]" />
            <input
              type="text"
              placeholder="Buscar por comprador, telefone ou cota (ex: #42)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-xs font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs font-bold text-[#8A9BB3] hover:text-[#0D1729] cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Batch Actions when pending orders exist */}
          {pendingOrders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBatchProcessing}
                onClick={handleBatchApprovePending}
                className="ora-btn-primary px-3.5 py-2 text-xs font-bold rounded-[14px] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                title="Aprova todos os pedidos que estão marcados como pendentes"
              >
                {isBatchProcessing && batchActionType === 'approve' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Aprovar Todos os Pendentes ({pendingOrders.length})</span>
              </button>

              <button
                type="button"
                disabled={isBatchProcessing}
                onClick={handleBatchCancelPending}
                className="px-3.5 py-2 text-xs font-bold rounded-[14px] inline-flex items-center gap-1.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] cursor-pointer disabled:opacity-50 transition"
                title="Cancela todas as reservas pendentes e devolve os números à grade"
              >
                {isBatchProcessing && batchActionType === 'cancel' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Liberar Todas as Reservas</span>
              </button>
            </div>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-[#526480] text-sm">
            Nenhum pedido encontrado nesta categoria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const cleanPhone = (order.buyer_phone || '').replace(/\D/g, '');

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 bg-white border border-[#E0E9F7] rounded-[22px] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#B9D3F8] transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <strong className="font-display font-bold text-base text-[#0D1729]">
                        {order.buyer_name}
                      </strong>
                      <a
                        href={`https://wa.me/55${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0869F5] hover:underline tabular-nums"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
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

                  {/* Actions & WhatsApp Direct */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botão de Notificação no WhatsApp do Comprador */}
                    {order.status === 'paid' ? (
                      <a
                        href={getApprovedWhatsAppUrl(order)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 sm:px-3 sm:py-2 rounded-[14px] bg-[#EBF7F0] hover:bg-[#D5EFE1] border border-[#BCECD4] text-[#00A868] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Enviar comprovante de cotas no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Confirmar no WhatsApp</span>
                      </a>
                    ) : order.status === 'pending' ? (
                      <a
                        href={getPendingReminderWhatsAppUrl(order)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 sm:px-3 sm:py-2 rounded-[14px] bg-[#FFF8EB] hover:bg-[#FDECC8] border border-[#F5D08A] text-[#9A6700] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Enviar lembrete e chave PIX no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cobrar PIX</span>
                      </a>
                    ) : null}

                    {/* Status Toggle Buttons */}
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
                        <span>Confirmado</span>
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

      {/* ZONA EXCLUSIVA MASTER: Excluir Rifa */}
      {isMaster && (
        <div className="ora-card rounded-[28px] p-6 border border-[#FECDD3] bg-[#FFF8F8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#BE123C] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Painel Master • Ação Restrita</span>
            </div>
            <h4 className="font-display font-bold text-base text-[#0D1729]">
              Excluir Rifa Permanentemente
            </h4>
            <p className="text-xs text-[#526480] mt-0.5">
              Esta ação remove a rifa do banco de dados, da lista de campanhas e libera todas as cotas.
            </p>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteRaffle}
            className="px-5 py-2.5 rounded-full bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Excluir Rifa (Master)</span>
          </button>
        </div>
      )}

      {/* MODAL 0: Edição de Rifa com Registro de Auditoria */}
      {showEditModal && (
        <EditRaffleModal
          raffle={raffle}
          hasPaidOrders={paidOrders.length > 0}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setCurrentRaffle(updated);
          }}
        />
      )}

      {/* MODAL 1: Divulgação nas Redes (Stories / Feed com QR Code) */}
      <SocialShareModal
        raffle={raffle}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* MODAL 2: Sorteio da Roleta Animada com Confetes */}
      <DrawRouletteModal
        raffle={raffle}
        paidOrders={paidOrders}
        isOpen={showDrawModal}
        onClose={() => setShowDrawModal(false)}
        onFinish={handleFinishDraw}
      />

      {/* MODAL 2.5: Gerador de Cartela Física em PDF (2 Páginas A4) */}
      <PhysicalCardModal
        raffle={{
          ...raffle,
          brand_color: (theme === 'green' || theme === 'blue') ? theme : (raffle.brand_color || 'green'),
        }}
        paidTicketNumbers={paidTicketNumbers}
        pendingTicketNumbers={pendingTicketNumbers}
        isOpen={showPhysicalCardModal}
        onClose={() => setShowPhysicalCardModal(false)}
      />

      {/* MODAL 2.8: Boas-Vindas Pós-Criação com Apresentação da Venda Híbrida (Físico + Online) */}
      <HybridSalesWelcomeModal
        raffle={raffle}
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onOpenPrintModal={() => setShowPhysicalCardModal(true)}
      />

      {/* MODAL 3: Confirmação Imediata de Aprovação de PIX */}
      {approvalNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1729]/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#D9E5F7] space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF7F0] text-[#00A868] flex items-center justify-center mx-auto border border-[#BCECD4]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-[#0D1729]">
                Pagamento Confirmado!
              </h3>
              <p className="text-xs text-[#526480] mt-1">
                As cotas de <strong>{approvalNotification.buyer_name}</strong> foram ativadas com sucesso.
              </p>
            </div>

            <div className="bg-[#F5F9FF] p-3.5 rounded-[16px] border border-[#E0E9F7] text-xs text-left space-y-1">
              <span className="text-[#526480] font-semibold block">Cotas Oficiais:</span>
              <strong className="text-[#0869F5] font-display font-bold text-sm block">
                {formatTickets(approvalNotification.ticket_numbers)}
              </strong>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={getApprovedWhatsAppUrl(approvalNotification)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setApprovalNotification(null)}
                className="w-full py-3.5 rounded-[16px] bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Confirmação de Cotas no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setApprovalNotification(null)}
                className="w-full py-2.5 text-xs font-bold text-[#526480] hover:text-[#0D1729] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
