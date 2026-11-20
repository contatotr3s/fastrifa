'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
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
  Printer,
  Sparkles,
  QrCode as QrIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sliders,
  Pencil,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { createOrder } from '@/lib/firebase/raffles';
import { generateBrandInitials } from '@/lib/image-processor';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { generatePixBrCode } from '@/lib/pix-brcode';
import PhysicalCardModal from '@/components/physical-card-modal';
import EditRaffleModal from '@/components/edit-raffle-modal';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

interface RafflePublicViewProps {
  raffle: Raffle;
  initialOccupiedTickets: OccupiedTicket[];
}

export default function RafflePublicView({
  raffle: initialRaffle,
  initialOccupiedTickets,
}: RafflePublicViewProps) {
  const { user, profile } = useAuth();
  const [raffle, setCurrentRaffle] = useState<Raffle>(initialRaffle);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>(
    initialOccupiedTickets
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Identificação do Perfil (Criador Oficial vs Comprador Visitante)
  const userEmail = user?.email?.toLowerCase().trim() || '';
  const isMaster = userEmail === MASTER_EMAIL || profile?.role === 'master';
  const isCreator = Boolean(user && (user.uid === raffle.user_id || isMaster));
  const [showEditModal, setShowEditModal] = useState(false);

  // Múltiplas Fotos do Prêmio & Carrossel Interativo
  const allPrizeImages: string[] = useMemo(() => {
    if (raffle.prize_images && raffle.prize_images.length > 0) {
      return raffle.prize_images;
    }
    if (raffle.prize_image_url) {
      return [raffle.prize_image_url];
    }
    return [];
  }, [raffle.prize_images, raffle.prize_image_url]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  // Auto-slide suave a cada 4.5s quando há mais de 1 foto
  useEffect(() => {
    if (allPrizeImages.length <= 1 || isHoveringImage) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allPrizeImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [allPrizeImages.length, isHoveringImage]);

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [conflictingTicket, setConflictingTicket] = useState<number | null>(null);
  const [manualReplacementInput, setManualReplacementInput] = useState('');

  // Success / Payment screen state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    tickets: number[];
    total: number;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBrCode, setCopiedBrCode] = useState(false);
  const [pixBrCodePayload, setPixBrCodePayload] = useState<string>('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [showPhysicalCardModal, setShowPhysicalCardModal] = useState(false);
  const [quickPickFeedback, setQuickPickFeedback] = useState<string | null>(null);

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
  const paidTicketNumbers = useMemo(
    () =>
      occupiedTickets
        .filter((t) => t.status === 'paid')
        .map((t) => t.ticket_number),
    [occupiedTickets]
  );
  const pendingTicketNumbers = useMemo(
    () =>
      occupiedTickets
        .filter((t) => t.status === 'pending')
        .map((t) => t.ticket_number),
    [occupiedTickets]
  );
  const paidCount = paidTicketNumbers.length;
  const pendingCount = pendingTicketNumbers.length;
  const progressPercent = Math.min(
    100,
    Math.round((paidCount / raffle.total_tickets) * 100)
  );
  const totalPrice = (selectedTickets.length * raffle.ticket_price).toFixed(2);

  function fireCelebrationConfetti(mode: 'order' | 'quick' | 'copy' = 'order') {
    try {
      const isGreen = raffle.brand_color === 'green';
      const palette = isGreen
        ? ['#059669', '#10B981', '#F59E0B', '#34D399', '#FBBF24']
        : ['#0869F5', '#3888FF', '#F59E0B', '#60A5FA', '#FBBF24'];

      if (mode === 'order') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.25, y: 0.6 },
          colors: palette,
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { x: 0.75, y: 0.6 },
            colors: palette,
          });
        }, 160);
      } else if (mode === 'copy') {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.68 },
          colors: palette,
        });
      } else {
        confetti({
          particleCount: 24,
          spread: 45,
          scalar: 0.85,
          origin: { y: 0.55 },
          colors: palette,
        });
      }
    } catch {}
  }

  // Gera automaticamente o QR Code PIX com valor somado quando o pedido é confirmado
  useEffect(() => {
    if (!confirmedOrder) {
      setPixBrCodePayload('');
      setPixQrCodeUrl('');
      return;
    }

    const payload = generatePixBrCode({
      pixKey: raffle.pix_key,
      pixKeyType: raffle.pix_key_type,
      merchantName: raffle.brand_name || 'FASTRIFA',
      merchantCity: 'BRASIL',
      amount: confirmedOrder.total,
      description: `RIFA ${confirmedOrder.tickets.length} COTAS`,
    });
    setPixBrCodePayload(payload);

    QRCode.toDataURL(payload, {
      width: 440,
      margin: 1,
      color: { dark: '#0D1729', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setPixQrCodeUrl(url))
      .catch(() => setPixQrCodeUrl(''));
  }, [confirmedOrder, raffle]);

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
    fireCelebrationConfetti('quick');
    setQuickPickFeedback(`+${toAdd.length} cotas da sorte adicionadas!`);
    setTimeout(() => setQuickPickFeedback(null), 2400);
  }

  function clearSelection() {
    setSelectedTickets([]);
  }

  function copyPixKey() {
    navigator.clipboard.writeText(raffle.pix_key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  }

  function copyPixBrCode() {
    if (!pixBrCodePayload) return;
    navigator.clipboard.writeText(pixBrCodePayload);
    setCopiedBrCode(true);
    fireCelebrationConfetti('copy');
    setTimeout(() => setCopiedBrCode(false), 3000);
  }

  // Substituição de cota em conflito diretamente no modal
  function handleReplaceConflictingWithRandom(conflictNumber: number) {
    const freeCandidates = allAvailableNumbers.filter(
      (n) => n !== conflictNumber && !selectedTickets.includes(n)
    );
    if (freeCandidates.length === 0) {
      setOrderError('Não há mais cotas disponíveis para substituição nesta rifa.');
      return;
    }
    const chosen = freeCandidates[Math.floor(Math.random() * freeCandidates.length)];
    setSelectedTickets((prev) =>
      [...prev.filter((n) => n !== conflictNumber), chosen].sort((a, b) => a - b)
    );
    setConflictingTicket(null);
    setOrderError(null);
  }

  function handleReplaceConflictingWithManual(conflictNumber: number, targetNum: number) {
    if (targetNum < 1 || targetNum > raffle.total_tickets) {
      setOrderError(`Número inválido. Escolha um número de 1 a ${raffle.total_tickets}.`);
      return;
    }
    if (occupiedMap.has(targetNum)) {
      setOrderError(`A cota #${targetNum.toString().padStart(3, '0')} já está reservada ou paga.`);
      return;
    }
    if (selectedTickets.includes(targetNum)) {
      setOrderError(`A cota #${targetNum.toString().padStart(3, '0')} já está na sua lista.`);
      return;
    }
    setSelectedTickets((prev) =>
      [...prev.filter((n) => n !== conflictNumber), targetNum].sort((a, b) => a - b)
    );
    setConflictingTicket(null);
    setOrderError(null);
    setManualReplacementInput('');
  }

  function removeTicketFromSelection(num: number) {
    const updated = selectedTickets.filter((n) => n !== num);
    if (updated.length === 0) {
      setSelectedTickets([]);
      setIsCheckoutOpen(false);
      setConflictingTicket(null);
      setOrderError(null);
      return;
    }
    setSelectedTickets(updated);
    if (conflictingTicket === num) {
      setConflictingTicket(null);
      setOrderError(null);
    }
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
      if (result.conflictingTicket !== undefined) {
        setConflictingTicket(result.conflictingTicket);
        // Atualiza occupiedTickets local para que o sistema saiba que este número está ocupado
        setOccupiedTickets((prev) => [
          ...prev.filter((t) => t.ticket_number !== result.conflictingTicket),
          { ticket_number: result.conflictingTicket!, status: 'pending' },
        ]);
      }
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
    setConflictingTicket(null);
    setIsSubmitting(false);
    fireCelebrationConfetti('order');
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
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col pb-32 relative overflow-hidden">
      {/* Elementos de Sorte Sutis com Baixa Opacidade ao redor da página */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        {/* Trevo superior esquerdo */}
        <svg
          viewBox="0 0 120 144"
          className="w-28 h-28 sm:w-36 sm:h-36 absolute top-24 -left-6 sm:left-6 opacity-[0.055] -rotate-12 text-[#0869F5]"
          fill="currentColor"
        >
          <circle cx="60" cy="36" r="22" />
          <circle cx="84" cy="60" r="22" />
          <circle cx="60" cy="84" r="22" />
          <circle cx="36" cy="60" r="22" />
          <path
            d="M60 84 Q78 112 66 136"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Ferradura superior direita */}
        <svg
          viewBox="0 0 120 125"
          className="w-28 h-28 sm:w-36 sm:h-36 absolute top-28 -right-6 sm:right-8 opacity-[0.055] rotate-12 text-[#0869F5]"
          fill="none"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
        >
          <path d="M35 22 C16 42, 16 78, 36 96 C50 108, 70 108, 84 96 C104 78, 104 42, 85 22" />
        </svg>

        {/* Trevo inferior direito */}
        <svg
          viewBox="0 0 120 144"
          className="w-32 h-32 absolute bottom-20 right-6 opacity-[0.045] rotate-15 text-[#0869F5] hidden md:block"
          fill="currentColor"
        >
          <circle cx="60" cy="36" r="22" />
          <circle cx="84" cy="60" r="22" />
          <circle cx="60" cy="84" r="22" />
          <circle cx="36" cy="60" r="22" />
        </svg>

        {/* Ferradura inferior esquerda */}
        <svg
          viewBox="0 0 120 125"
          className="w-32 h-32 absolute bottom-24 left-8 opacity-[0.045] -rotate-15 text-[#0869F5] hidden md:block"
          fill="none"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
        >
          <path d="M35 22 C16 42, 16 78, 36 96 C50 108, 70 108, 84 96 C104 78, 104 42, 85 22" />
        </svg>
      </div>

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

          {/* Organizer Brand Badge (Visível em todas as telas para reforçar a marca do criador) */}
          {raffle.brand_name && (
            <div className="ora-glass-pill rounded-full px-3 sm:px-3.5 py-1.5 flex items-center gap-2 sm:gap-2.5 border-[#CDE0FC]">
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
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#526480] block leading-none">
                  Organizador
                </span>
                <strong className="text-[11px] sm:text-xs text-[#0D1729] font-bold leading-tight block truncate max-w-[110px] sm:max-w-none">
                  {raffle.brand_name}
                </strong>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {raffle.total_tickets <= 200 && (
              <button
                type="button"
                onClick={() => setShowPhysicalCardModal(true)}
                title="Vai gerar cartela física em PDF (2 páginas), pronta para impressão"
                className="ora-btn-secondary rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer border-[#0869F5]/40 hover:border-[#0869F5] active:scale-95 transition"
              >
                <Printer className="w-4 h-4 text-[#0869F5]" />
                <span>Gerar Cartela</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/rifas/nova"
                  className="ora-btn-primary rounded-full px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold hidden sm:inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>Criar Minha Rifa</span>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </Link>
                <Link
                  href={profile?.role === 'master' ? '/admin/master' : '/admin'}
                  className="ora-btn-secondary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1 text-[#475872] hover:text-[#0D1729]"
                >
                  <span>Painel</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/cadastro"
                className="ora-btn-secondary rounded-full px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold hidden sm:inline-flex items-center gap-1.5"
              >
                <span>Criar Minha Rifa</span>
                <ArrowUpRight className="w-4 h-4 text-[#0869F5]" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-8">
        {/* Banner Incisivo de Modo Criador Oficial vs Comprador Visitante */}
        {isCreator ? (
          <div className="bg-gradient-to-r from-[#0869F5] to-[#0755DE] text-white p-4 sm:p-5 rounded-[24px] shadow-[0_12px_32px_rgba(8,105,245,0.20)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/20 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-xl font-bold shadow-xs">
                👑
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm sm:text-base font-display font-bold">
                    Você é o Criador Oficial desta Campanha
                  </strong>
                  <span className="bg-white/25 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {isMaster ? 'Master / Administrador' : 'Organizador'}
                  </span>
                </div>
                <p className="text-xs text-white/85 leading-snug mt-0.5">
                  Esta é a visão pública que seus compradores veem. Você tem acesso rápido à gestão de cotas, pagamentos e edição da rifa.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-display font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Rifa</span>
              </button>
              <Link
                href={`/admin/rifas/${raffle.id}`}
                className="px-4 py-2 rounded-full bg-white text-[#0869F5] hover:bg-[#F5F9FF] font-display font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Gerenciar Pedidos</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#F5F9FF] border border-[#CDE0FC] p-4 sm:p-5 rounded-[24px] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#CDE0FC] flex items-center justify-center flex-shrink-0 text-[#0869F5] shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#0869F5]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-xs sm:text-sm font-display font-bold text-[#0D1729]">
                    Página Pública Oficial • Comprador Visitante
                  </strong>
                  <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    PIX Direto sem Intermediários
                  </span>
                </div>
                <p className="text-xs text-[#526480] leading-snug mt-0.5">
                  Selecione suas cotas abaixo. O pagamento é realizado diretamente ao organizador <strong>{raffle.brand_name || 'Oficial'}</strong>. Não exige cadastro prévio!
                </p>
              </div>
            </div>
          </div>
        )}

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
            {/* Carrossel / Slider de Fotos do Prêmio */}
            {allPrizeImages.length > 0 && (
              <div
                className="w-full md:w-80 flex flex-col gap-2.5 flex-shrink-0"
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
              >
                {/* Frame Principal do Slider */}
                <div className="relative w-full h-64 sm:h-72 rounded-[26px] overflow-hidden bg-[#F5F9FF] border border-[#E0E9F7] shadow-[0_12px_30px_rgba(32,75,134,0.08)] group">
                  <img
                    src={allPrizeImages[activeImageIndex] || allPrizeImages[0]}
                    alt={`${raffle.title} - Foto ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-500 ease-out"
                  />

                  {/* Controles de Navegação Anterior / Próximo quando houver mais de 1 foto */}
                  {allPrizeImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) =>
                            prev === 0 ? allPrizeImages.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) =>
                            (prev + 1) % allPrizeImages.length
                          );
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Badge de Contagem no Topo */}
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tabular-nums">
                        📸 {activeImageIndex + 1} / {allPrizeImages.length}
                      </span>

                      {/* Dots Indicadores na Base */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
                        {allPrizeImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`transition-all rounded-full ${
                              idx === activeImageIndex
                                ? 'w-4 h-1.5 bg-white'
                                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Ir para foto ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Miniaturas Clicáveis abaixo do frame quando há mais de 1 foto */}
                {allPrizeImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {allPrizeImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-14 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                          idx === activeImageIndex
                            ? 'border-[#0869F5] ring-2 ring-[#0869F5]/25 scale-105'
                            : 'border-[#E0E9F7] opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
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
          <section className="ora-card rounded-[32px] p-6 sm:p-10 space-y-7 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
                  Escolha suas cotas
                </h2>
                <p className="text-sm sm:text-[15px] text-[#475872] mt-1">
                  Toque nos números desejados na grade abaixo ou adicione pacotes aleatórios com 1 clique.
                </p>
              </div>

              {raffle.total_tickets <= 200 && (
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <Link
                    href={`/r/${raffle.slug}/pix`}
                    className="px-3.5 py-2.5 rounded-2xl bg-[#F5F9FF] hover:bg-[#EDF5FF] border border-[#CDE0FC] hover:border-[#0869F5] text-left flex items-center gap-2.5 transition active:scale-95"
                  >
                    <span className="w-8 h-8 rounded-xl bg-white border border-[#CDE0FC] flex items-center justify-center text-[#0869F5] flex-shrink-0 shadow-sm">
                      <Search className="w-4 h-4" />
                    </span>
                    <div>
                      <strong className="block text-xs font-display font-bold text-[#0D1729] leading-tight">
                        Checador de Números
                      </strong>
                      <span className="block text-[10px] font-semibold text-[#526480] leading-tight">
                        Verificador p/ venda física
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowPhysicalCardModal(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-[#F5F9FF] hover:bg-[#EDF5FF] border border-[#CDE0FC] hover:border-[#0869F5] text-left flex items-center gap-2.5 transition active:scale-95 cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-xl bg-white border border-[#CDE0FC] flex items-center justify-center text-[#0869F5] flex-shrink-0 shadow-sm">
                      <Printer className="w-4 h-4" />
                    </span>
                    <div>
                      <strong className="block text-xs font-display font-bold text-[#0D1729] leading-tight">
                        Gerar Cartela
                      </strong>
                      <span className="block text-[10px] font-semibold text-[#526480] leading-tight">
                        Cartela física pronta p/ impressão
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Pick Buttons */}
            <div className="p-5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[24px] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475872] block">
                  Seleção Rápida Automática
                </span>
                {quickPickFeedback && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold animate-bounce">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{quickPickFeedback}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5 tabular-nums">
                {[5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => addRandomTickets(qty)}
                    disabled={allAvailableNumbers.length < qty}
                    className="px-4 py-2.5 bg-white hover:bg-[#EDF5FF] active:bg-[#D9ECFF] active:scale-95 border border-[#CDE0FC] hover:border-[#0869F5] text-[#0755DE] text-xs sm:text-sm font-display font-bold rounded-[14px] shadow-[0_4px_12px_rgba(36,97,184,0.06)] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                  <span className="text-[#D97706] font-semibold">Reservada ({pendingCount})</span>
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
                      className={`h-11 sm:h-12 rounded-[13px] text-xs font-display font-bold transition-all duration-150 active:scale-90 flex items-center justify-center border ${btnStyle}`}
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
        <footer className="pt-6 pb-2 text-center text-xs text-[#526480] space-y-1 relative z-10">
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
        <div className="fixed bottom-4 inset-x-4 z-40 pointer-events-none flex justify-center animate-in slide-in-from-bottom-4 duration-200">
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
              className="ora-btn-primary px-6 py-3.5 font-bold rounded-[18px] flex items-center gap-2 text-sm sm:text-base active:scale-95 transition cursor-pointer"
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
          <div className="ora-card rounded-[28px] max-w-md w-full p-7 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-150">
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

            {/* Resolução de Conflito de Cota já Reservada (Sem fechar o modal) */}
            {conflictingTicket && (
              <div className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-[18px] space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#BE123C] font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>A cota #{conflictingTicket.toString().padStart(3, '0')} acabou de ser reservada por outra pessoa.</span>
                </div>
                <p className="text-[11px] text-[#9F1239] leading-snug">
                  Não precisa fechar o modal! Escolha como deseja substituir para concluir seu pedido:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleReplaceConflictingWithRandom(conflictingTicket)}
                    className="flex-1 py-2 px-3 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Trocar por outro número aleatório livre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeTicketFromSelection(conflictingTicket)}
                    className="py-2 px-3 bg-white hover:bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-bold rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    Remover cota
                  </button>
                </div>

                {/* Ou digitar um número específico para substituir */}
                <div className="flex gap-2 pt-1 border-t border-[#FECDD3]">
                  <input
                    type="text"
                    placeholder="Ou digite o número substituto..."
                    value={manualReplacementInput}
                    onChange={(e) => setManualReplacementInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-1.5 bg-white border border-[#FECDD3] rounded-xl text-xs font-medium text-[#0D1729] focus:outline-none focus:border-[#BE123C] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseInt(manualReplacementInput, 10);
                      if (!isNaN(num)) {
                        handleReplaceConflictingWithManual(conflictingTicket, num);
                      }
                    }}
                    disabled={!manualReplacementInput}
                    className="px-3 py-1.5 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    Substituir
                  </button>
                </div>
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
                {selectedTickets.map((n) => {
                  const isConflict = n === conflictingTicket;
                  return (
                    <span
                      key={n}
                      className={`px-2.5 py-0.5 border text-xs font-display font-bold rounded-[8px] inline-flex items-center gap-1.5 ${
                        isConflict
                          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C] ring-2 ring-[#BE123C]/30 animate-pulse'
                          : 'bg-white border-[#D9E5F7] text-[#0869F5]'
                      }`}
                    >
                      <span>#{n.toString().padStart(3, '0')}</span>
                      {isConflict && <span className="text-[10px] uppercase font-bold">(Ocupada)</span>}
                      <button
                        type="button"
                        onClick={() => removeTicketFromSelection(n)}
                        className="hover:opacity-75 cursor-pointer text-[10px] text-[#526480] hover:text-[#DC2626] font-bold"
                        title="Remover cota"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
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
                className="ora-btn-primary w-full py-4 font-bold rounded-[18px] flex items-center justify-center gap-2 text-[15px] disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Reservando cotas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirmar e Gerar PIX</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Screen Modal (Com QR Code PIX já no Valor Somado + Confetes) */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/55 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="ora-card rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-5 relative text-center my-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full flex items-center justify-center mx-auto text-[#059669] shadow-sm">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#EDF5FF] text-[#0869F5] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" />
                Reserva Confirmada
              </span>
              <h3 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                Cotas Reservadas com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-[#475872] mt-1">
                O QR Code e o código PIX abaixo já estão configurados com o valor exato de{' '}
                <strong className="text-[#0869F5]">
                  R$ {confirmedOrder.total.toFixed(2)}
                </strong>
                .
              </p>
            </div>

            {/* QR Code PIX Oficial com Valor Somado */}
            {pixQrCodeUrl && (
              <div className="mx-auto w-48 h-48 p-3 bg-white rounded-[22px] border-2 border-[#CDE0FC] shadow-[0_12px_28px_rgba(8,105,245,0.12)] flex items-center justify-center">
                <img
                  src={pixQrCodeUrl}
                  alt="QR Code PIX com valor da rifa"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Botão Principal: PIX Copia e Cola já com o valor */}
            {pixBrCodePayload && (
              <button
                type="button"
                onClick={copyPixBrCode}
                className={`w-full py-3.5 px-5 rounded-[18px] font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-md ${
                  copiedBrCode
                    ? 'bg-[#059669] text-white'
                    : 'ora-btn-primary'
                }`}
              >
                {copiedBrCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      PIX Copia e Cola Copiado! (R$ {confirmedOrder.total.toFixed(2)})
                    </span>
                  </>
                ) : (
                  <>
                    <QrIcon className="w-4 h-4" />
                    <span>
                      Copiar PIX Copia e Cola (R$ {confirmedOrder.total.toFixed(2)})
                    </span>
                  </>
                )}
              </button>
            )}

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
                <div className="space-y-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-[18px] flex items-center justify-center gap-2 text-sm shadow-sm transition active:scale-[0.98]"
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

      {/* Modal Gerador de Cartela Física em PDF (2 Páginas A4) */}
      <PhysicalCardModal
        raffle={raffle}
        paidTicketNumbers={paidTicketNumbers}
        pendingTicketNumbers={pendingTicketNumbers}
        isOpen={showPhysicalCardModal}
        onClose={() => setShowPhysicalCardModal(false)}
      />

      {/* Modal de Edição de Rifa (Criador Oficial / Master) */}
      {showEditModal && (
        <EditRaffleModal
          raffle={raffle}
          hasPaidOrders={paidCount > 0}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setCurrentRaffle(updated);
          }}
        />
      )}
    </div>
  );
}
