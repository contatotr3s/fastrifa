'use client';

import { use, useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  getRaffleBySlug,
  getOccupiedTickets,
  createOrder,
} from '@/lib/firebase/raffles';
import { generatePixBrCode } from '@/lib/pix-brcode';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Loader2,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  X,
} from 'lucide-react';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

type FlowStep = 'qty' | 'check' | 'reserve' | 'pix';

interface UnavailableAlert {
  number: number;
  reason: 'paid' | 'pending' | 'duplicate' | 'out_of_range';
  message: string;
  suggestions: number[];
}

export default function PhysicalCartelaPixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fluxo guiado para colaborador / comprador físico
  const [step, setStep] = useState<FlowStep>('qty');
  const [quantity, setQuantity] = useState<number>(3);

  // Estado do Checador Passo a Passo
  const [verifiedNumbers, setVerifiedNumbers] = useState<number[]>([]);
  const [numberInput, setNumberInput] = useState<string>('');
  const [isCheckingNumber, setIsCheckingNumber] = useState<boolean>(false);
  const [lastApprovedNumber, setLastApprovedNumber] = useState<number | null>(
    null
  );
  const [unavailableAlert, setUnavailableAlert] =
    useState<UnavailableAlert | null>(null);

  // Dados do comprador para concluir a reserva dos números verificados
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  // Estado final do PIX com valor somado
  const [pixPayload, setPixPayload] = useState<string>('');
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedRawKey, setCopiedRawKey] = useState(false);
  const [reservationConfirmed, setReservationConfirmed] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    getRaffleBySlug(slug)
      .then(async (data) => {
        if (!data) {
          setError('Campanha não encontrada.');
          setLoading(false);
          return;
        }
        setRaffle(data);
        const occupied = await getOccupiedTickets(data.id);
        setOccupiedTickets(occupied);

        if (typeof window !== 'undefined') {
          const globalTheme =
            localStorage.getItem('fastrifa_global_system_theme') || 'green';
          const themeToApply = data.brand_color ? data.brand_color : globalTheme;
          document.documentElement.setAttribute('data-theme', themeToApply);
        }
      })
      .catch(() => setError('Erro ao carregar dados da campanha.'))
      .finally(() => setLoading(false));

    return () => {
      if (typeof window !== 'undefined') {
        const globalTheme =
          localStorage.getItem('fastrifa_global_system_theme') || 'green';
        document.documentElement.setAttribute('data-theme', globalTheme);
      }
    };
  }, [slug]);

  const occupiedMap = useMemo(() => {
    const map = new Map<number, 'pending' | 'paid'>();
    occupiedTickets.forEach((t) => map.set(t.ticket_number, t.status));
    return map;
  }, [occupiedTickets]);

  const availableCount = useMemo(() => {
    if (!raffle) return 0;
    return Math.max(0, raffle.total_tickets - occupiedMap.size);
  }, [raffle, occupiedMap]);

  const unitPrice = raffle ? Number(raffle.ticket_price) : 0;
  const totalAmount = quantity * unitPrice;

  function fireConfetti(mode: 'mini' | 'full' = 'full') {
    try {
      const isGreen = raffle?.brand_color === 'green';
      const colors = isGreen
        ? ['#059669', '#10B981', '#F59E0B', '#34D399']
        : ['#0869F5', '#3888FF', '#F59E0B', '#60A5FA'];

      if (mode === 'mini') {
        confetti({
          particleCount: 25,
          spread: 45,
          scalar: 0.85,
          origin: { y: 0.6 },
          colors,
        });
      } else {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.62 },
          colors,
        });
      }
    } catch {}
  }

  function findNearbySuggestions(
    target: number,
    latestMap: Map<number, 'pending' | 'paid'>,
    alreadyPicked: number[],
    maxTotal: number
  ): number[] {
    const pickedSet = new Set(alreadyPicked);
    const suggestions: number[] = [];
    for (let offset = 1; offset <= maxTotal && suggestions.length < 4; offset++) {
      const candidates = [target - offset, target + offset];
      for (const c of candidates) {
        if (
          c >= 1 &&
          c <= maxTotal &&
          !latestMap.has(c) &&
          !pickedSet.has(c) &&
          suggestions.length < 4
        ) {
          suggestions.push(c);
        }
      }
    }
    return suggestions;
  }

  // Inicia o passo de checagem número por número
  function handleStartChecking() {
    setVerifiedNumbers([]);
    setNumberInput('');
    setUnavailableAlert(null);
    setLastApprovedNumber(null);
    setStep('check');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Checa a disponibilidade de um número em tempo real no Firestore
  async function handleCheckNumber(customNum?: number) {
    if (!raffle) return;
    const rawVal =
      customNum !== undefined ? customNum : parseInt(numberInput.trim(), 10);

    if (Number.isNaN(rawVal)) {
      return;
    }

    if (rawVal < 1 || rawVal > raffle.total_tickets) {
      setUnavailableAlert({
        number: rawVal,
        reason: 'out_of_range',
        message: `Esta rifa vai do número 001 ao ${raffle.total_tickets
          .toString()
          .padStart(3, '0')}. Peça ao cliente para escolher dentro desse limite.`,
        suggestions: [],
      });
      return;
    }

    if (verifiedNumbers.includes(rawVal)) {
      setUnavailableAlert({
        number: rawVal,
        reason: 'duplicate',
        message: `O número #${rawVal
          .toString()
          .padStart(3, '0')} já foi selecionado e marcado com Vzinho nesta mesma compra! Escolha outro número para a próxima cota.`,
        suggestions: findNearbySuggestions(
          rawVal,
          occupiedMap,
          verifiedNumbers,
          raffle.total_tickets
        ),
      });
      return;
    }

    setIsCheckingNumber(true);
    setLastApprovedNumber(null);

    try {
      // Consulta fresca no banco para garantir disponibilidade real no exato segundo
      const freshOccupied = await getOccupiedTickets(raffle.id);
      setOccupiedTickets(freshOccupied);

      const freshMap = new Map<number, 'pending' | 'paid'>();
      freshOccupied.forEach((t) => freshMap.set(t.ticket_number, t.status));

      const status = freshMap.get(rawVal);

      if (status === 'paid' || status === 'pending') {
        const near = findNearbySuggestions(
          rawVal,
          freshMap,
          verifiedNumbers,
          raffle.total_tickets
        );
        setUnavailableAlert({
          number: rawVal,
          reason: status,
          message:
            status === 'paid'
              ? `O número #${rawVal
                  .toString()
                  .padStart(3, '0')} JÁ FOI VENDIDO (PAGO)! Avise o cliente e peça para escolher outro número.`
              : `O número #${rawVal
                  .toString()
                  .padStart(3, '0')} JÁ ESTÁ RESERVADO aguardando pagamento! Avise o cliente e peça para escolher outro número.`,
          suggestions: near,
        });
        setIsCheckingNumber(false);
        return;
      }

      // DISPONÍVEL! Marca Vzinho e adiciona à lista verificada
      const updatedList = [...verifiedNumbers, rawVal];
      setVerifiedNumbers(updatedList);
      setLastApprovedNumber(rawVal);
      setNumberInput('');
      setUnavailableAlert(null);
      fireConfetti('mini');

      if (updatedList.length >= quantity) {
        // Completou todas as cotas solicitadas! Avança para confirmar reserva e gerar PIX
        setTimeout(() => {
          setStep('reserve');
        }, 550);
      } else {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    } catch (err) {
      console.error('Erro ao checar número:', err);
    } finally {
      setIsCheckingNumber(false);
    }
  }

  function handleUnderstandUnavailable() {
    setUnavailableAlert(null);
    setNumberInput('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function removeVerifiedNumber(numToRemove: number) {
    setVerifiedNumbers((prev) => prev.filter((n) => n !== numToRemove));
    setLastApprovedNumber(null);
    if (step === 'reserve') {
      setStep('check');
    }
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  // Conclui a reserva das cotas verificadas no Firestore e gera o QR Code PIX somado
  async function handleConfirmReservationAndGeneratePix(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle) return;
    setReserveError(null);

    const trimmedName = buyerName.trim();
    const cleanPhone = buyerPhone.replace(/\D/g, '');

    if (trimmedName.length < 2) {
      setReserveError('Informe o nome do comprador para registrar a reserva.');
      return;
    }
    if (cleanPhone.length < 10) {
      setReserveError('Informe o WhatsApp com DDD do comprador.');
      return;
    }

    setIsSubmittingReservation(true);

    try {
      const res = await createOrder({
        raffle_id: raffle.id,
        buyer_name: trimmedName,
        buyer_phone: buyerPhone.trim(),
        ticket_numbers: verifiedNumbers,
        total_amount: totalAmount,
        status: 'pending',
      });

      if (!res.success || res.error) {
        setReserveError(
          res.error ||
            'Algum número acabou de ser reservado. Volte e verifique outro número.'
        );
        setIsSubmittingReservation(false);
        return;
      }

      // Atualiza mapa local de ocupados
      setOccupiedTickets((prev) => [
        ...prev,
        ...verifiedNumbers.map((num) => ({
          ticket_number: num,
          status: 'pending' as const,
        })),
      ]);
      setReservationConfirmed(true);

      await buildPixForCurrentAmount(verifiedNumbers.length);
      setStep('pix');
      fireConfetti('full');
    } catch (err) {
      console.error('Erro ao confirmar reserva:', err);
      setReserveError('Erro ao salvar a reserva. Tente novamente.');
    } finally {
      setIsSubmittingReservation(false);
    }
  }

  async function buildPixForCurrentAmount(cotaCount: number) {
    if (!raffle) return;
    const sumAmount = cotaCount * unitPrice;
    const payload = generatePixBrCode({
      pixKey: raffle.pix_key,
      pixKeyType: raffle.pix_key_type,
      merchantName: raffle.brand_name || 'FASTRIFA',
      merchantCity: 'BRASIL',
      amount: sumAmount,
      description: `RIFA ${cotaCount} COTAS`,
    });

    const qrUrl = await QRCode.toDataURL(payload, {
      width: 520,
      margin: 1,
      color: {
        dark: '#0D1729',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    setPixPayload(payload);
    setPixQrDataUrl(qrUrl);
  }

  function handleResetForNextCustomer() {
    setVerifiedNumbers([]);
    setNumberInput('');
    setLastApprovedNumber(null);
    setUnavailableAlert(null);
    setBuyerName('');
    setBuyerPhone('');
    setReserveError(null);
    setReservationConfirmed(false);
    setStep('qty');
  }

  function copyPixPayload() {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    fireConfetti('mini');
    setTimeout(() => setCopiedPayload(false), 3000);
  }

  function copyRawPixKey() {
    if (!raffle) return;
    navigator.clipboard.writeText(raffle.pix_key);
    setCopiedRawKey(true);
    setTimeout(() => setCopiedRawKey(false), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen ora-hero-stage flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--ora-blue,#00A868)] animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen ora-hero-stage flex flex-col items-center justify-center p-4 text-center">
        <div className="ora-card rounded-[28px] p-8 max-w-md space-y-4">
          <h1 className="font-display font-bold text-2xl text-[#0D1729]">
            Campanha não encontrada
          </h1>
          <p className="text-sm text-[#475872]">
            Verifique o QR Code da cartela ou acesse a página principal.
          </p>
          <Link
            href="/"
            className="ora-btn-primary rounded-full px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir para o Início</span>
          </Link>
        </div>
      </div>
    );
  }

  const organizerCleanPhone = (raffle.phone_whatsapp || '').replace(/\D/g, '');
  const formattedVerifiedNums =
    verifiedNumbers.length > 0
      ? ` (${verifiedNumbers
          .map((n) => `#${n.toString().padStart(3, '0')}`)
          .join(', ')})`
      : '';
  const whatsappMessage = `Olá! Reservei *${quantity} cota(s)*${formattedVerifiedNums} na rifa *"${raffle.title}"* no valor total de *R$ ${totalAmount.toFixed(2)}*.${
    buyerName ? ` Comprador: ${buyerName}.` : ''
  } Notifico que o pagamento via PIX foi realizado!`;
  const whatsappUrl = `https://wa.me/55${organizerCleanPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const currentSlotIndex = verifiedNumbers.length + 1;

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col pb-16">
      {/* Top Security & Brand Header */}
      <header className="ora-header-container !z-40 flex items-center">
        <div className="relative z-10 max-w-xl w-full mx-auto px-4 flex items-center justify-between gap-2">
          <Link
            href={`/r/${raffle.slug}`}
            className="ora-glass-pill rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[#0D1729] hover:border-[var(--ora-blue,#00A868)] transition"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--ora-blue,#00A868)]" />
            <span>Ver Grade Completa</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] border border-[var(--ora-border-strong,#B9E7D2)] text-[var(--ora-blue,#00A868)] text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-[var(--ora-blue,#00A868)]" />
            <span>Checador Oficial • Físico + Digital</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 pt-5 space-y-5">
        {/* Identificação da Campanha e Organizador */}
        <section className="ora-card rounded-[26px] p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E0E9F7]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#A7F3D0] to-[var(--ora-blue,#00A868)] text-white text-xs font-bold shadow-sm flex-shrink-0">
                {raffle.brand_logo_url ? (
                  <img
                    src={raffle.brand_logo_url}
                    alt={raffle.brand_name || 'Organizador'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {generateBrandInitials(raffle.brand_name || 'FastRifa')}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#526480] block leading-none">
                  Organizador Oficial
                </span>
                <strong className="text-xs sm:text-sm font-display font-bold text-[#0D1729]">
                  {raffle.brand_name || 'FastRifa Oficial'}
                </strong>
              </div>
            </div>

            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-5 sm:h-6 w-auto object-contain opacity-90"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {raffle.prize_image_url && (
                <img
                  src={raffle.prize_image_url}
                  alt={raffle.title}
                  className="w-14 h-14 rounded-2xl object-cover border border-[#E0E9F7] flex-shrink-0"
                />
              )}
              <div>
                <h1 className="font-display font-bold text-base sm:text-lg text-[#0D1729] leading-tight">
                  {raffle.title}
                </h1>
                <span className="text-xs font-semibold text-[#475872] tabular-nums block mt-0.5">
                  Números de <strong>001</strong> a{' '}
                  <strong>{raffle.total_tickets.toString().padStart(3, '0')}</strong>{' '}
                  • <strong className="text-[#059669]">{availableCount} livres</strong>
                </span>
              </div>
            </div>

            <div className="text-right tabular-nums flex-shrink-0 bg-[#F5F9FF] px-3 py-2 rounded-xl border border-[#D9E5F7]">
              <span className="text-[10px] font-bold uppercase text-[#526480] block">
                Cada Cota
              </span>
              <strong className="font-display font-bold text-base sm:text-lg text-[var(--ora-blue,#00A868)]">
                R$ {unitPrice.toFixed(2)}
              </strong>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PASSO 1: QUANTAS COTAS O CLIENTE QUER?                                */}
        {/* ===================================================================== */}
        {step === 'qty' && (
          <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-150">
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-xs font-bold uppercase tracking-wider">
                Etapa 1 de 3 • Quantidade
              </span>
              <h2 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em] pt-1">
                Quantos números o cliente quer?
              </h2>
              <p className="text-xs sm:text-sm text-[#475872]">
                Informe quantas cotas serão vendidas para verificarmos a disponibilidade de cada número em tempo real.
              </p>
            </div>

            <div className="p-5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[24px] space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-2xl bg-white border border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-sm"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center min-w-[110px]">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, availableCount)}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(
                        Number.isNaN(val)
                          ? 1
                          : Math.min(raffle.total_tickets, Math.max(1, val))
                      );
                    }}
                    className="w-24 text-center font-display font-bold text-4xl text-[var(--ora-blue,#00A868)] bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#526480]">
                    {quantity === 1 ? 'Número' : 'Números'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(raffle.total_tickets, q + 1))
                  }
                  className="w-12 h-12 rounded-2xl bg-white border border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-sm"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 tabular-nums">
                {[1, 2, 3, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold border transition active:scale-95 cursor-pointer ${
                      quantity === preset
                        ? 'bg-[var(--ora-blue,#00A868)] text-white border-[var(--ora-blue,#00A868)] shadow-sm'
                        : 'bg-white text-[var(--ora-blue,#00A868)] border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)]'
                    }`}
                  >
                    {preset} {preset === 1 ? 'cota' : 'cotas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[20px] bg-[var(--ora-surface-alt,#E8F7F0)] border border-[var(--ora-border-strong,#B9E7D2)] flex items-center justify-between tabular-nums">
              <div>
                <span className="text-xs font-bold text-[#475872] block">
                  {quantity} cota(s) × R$ {unitPrice.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#526480]">
                  Valor somado automático
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ora-blue-deep,#008F58)] block">
                  Total a Pagar
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-[var(--ora-blue,#00A868)]">
                  R$ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleStartChecking}
                className="ora-btn-primary w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition cursor-pointer"
              >
                <Search className="w-5 h-5" />
                <span>
                  Verificar Disponibilidade dos {quantity} Números
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* PASSO 2: CHECADOR PASSO A PASSO (NÚMERO 1 DE N, 2 DE N...)            */}
        {/* ===================================================================== */}
        {step === 'check' && (
          <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep('qty')}
                className="text-xs font-bold text-[#526480] hover:text-[#0D1729] inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mudar quantidade ({quantity})</span>
              </button>
              <span className="px-3 py-1 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-xs font-bold tabular-nums">
                Verificando {Math.min(currentSlotIndex, quantity)} de {quantity}
              </span>
            </div>

            {/* Painel Visual de Slots com Vzinho para os números já verificados */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526480] block">
                Números desta venda ({verifiedNumbers.length}/{quantity} aprovados):
              </span>
              <div className="flex flex-wrap gap-2 tabular-nums">
                {Array.from({ length: quantity }, (_, idx) => {
                  const approvedNum = verifiedNumbers[idx];
                  const isCurrent = idx === verifiedNumbers.length;

                  if (approvedNum !== undefined) {
                    return (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#ECFDF5] border-2 border-[#10B981] text-[#065F46] font-display font-bold text-sm shadow-sm animate-in zoom-in-95 duration-150"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                        <span>#{approvedNum.toString().padStart(3, '0')}</span>
                        <button
                          type="button"
                          onClick={() => removeVerifiedNumber(approvedNum)}
                          title="Trocar este número"
                          className="ml-1 text-[#059669] hover:text-[#DC2626] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-2 text-xs font-display font-bold transition ${
                        isCurrent
                          ? 'bg-[var(--ora-surface-alt,#E8F7F0)] border-[var(--ora-blue,#00A868)] text-[var(--ora-blue,#00A868)] shadow-sm'
                          : 'bg-[#F8FAFC] border-dashed border-[#CBD5E1] text-[#94A3B8]'
                      }`}
                    >
                      <span>{idx + 1}º Número</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feedback do último número aprovado com Vzinho */}
            {lastApprovedNumber !== null && !unavailableAlert && (
              <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-3 text-[#065F46] animate-in fade-in duration-150">
                <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm">
                  <strong>
                    Número #{lastApprovedNumber.toString().padStart(3, '0')}{' '}
                    disponível! ✓
                  </strong>
                  <span className="block text-[11px] text-[#047857]">
                    Marcado com Vzinho. Digite agora o{' '}
                    <strong>{currentSlotIndex}º número</strong> escolhido pelo
                    cliente.
                  </span>
                </div>
              </div>
            )}

            {/* ALERTA QUANDO O NÚMERO JÁ ESTÁ RESERVADO OU VENDIDO */}
            {unavailableAlert ? (
              <div className="p-5 rounded-[24px] bg-[#FFF1F2] border-2 border-[#F43F5E] space-y-4 text-left animate-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center flex-shrink-0 border border-[#FECDD3]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E11D48] text-white text-[10px] font-bold uppercase tracking-wider">
                      {unavailableAlert.reason === 'paid'
                        ? 'Número Já Vendido'
                        : unavailableAlert.reason === 'pending'
                        ? 'Número Já Reservado'
                        : 'Número Indisponível'}
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#881337]">
                      O número #
                      {unavailableAlert.number.toString().padStart(3, '0')} não
                      está disponível!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9F1239] leading-relaxed">
                      {unavailableAlert.message}
                    </p>
                  </div>
                </div>

                {/* Sugestões de números vizinhos livres para agilizar a venda */}
                {unavailableAlert.suggestions.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-[#FECDD3] space-y-2">
                    <span className="text-[11px] font-bold text-[#881337] block">
                      Sugestões de números vizinhos que estão LIVRES agora (toque se o cliente aceitar):
                    </span>
                    <div className="flex flex-wrap gap-2 tabular-nums">
                      {unavailableAlert.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setUnavailableAlert(null);
                            handleCheckNumber(sug);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#10B981] text-[#065F46] text-xs font-display font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                        >
                          <Check className="w-3.5 h-3.5 text-[#059669]" />
                          <span>Usar #{sug.toString().padStart(3, '0')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUnderstandUnavailable}
                  className="w-full py-4 rounded-[18px] bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Entendi, escolher outro número</span>
                </button>
              </div>
            ) : (
              /* CAMPO PARA DIGITAR E CHECAR O NÚMERO ATUAL */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckNumber();
                }}
                className="p-5 bg-[#F5F9FF] border-2 border-[var(--ora-border-strong,#B9E7D2)] rounded-[24px] space-y-4"
              >
                <div className="text-center space-y-1">
                  <label
                    htmlFor="checkNumberInput"
                    className="block font-display font-bold text-xl text-[#0D1729]"
                  >
                    Qual é o {currentSlotIndex}º número escolhido?
                  </label>
                  <span className="text-xs text-[#526480] block">
                    Digite um número de <strong>1</strong> a{' '}
                    <strong>{raffle.total_tickets}</strong> para checar se está
                    livre
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    id="checkNumberInput"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={raffle.total_tickets}
                    placeholder={`Ex: ${Math.min(12, raffle.total_tickets)}`}
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-2 border-[var(--ora-border-strong,#B9E7D2)] focus:border-[var(--ora-blue,#00A868)] rounded-2xl text-center font-display font-bold text-3xl text-[#0D1729] placeholder-[#94A3B8] focus:outline-none tabular-nums shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!numberInput.trim() || isCheckingNumber}
                  className="ora-btn-primary w-full py-4 rounded-[18px] font-bold text-base flex items-center justify-center gap-2 shadow-md disabled:opacity-45 active:scale-[0.98] transition cursor-pointer"
                >
                  {isCheckingNumber ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verificando disponibilidade...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>
                        Checar Número{' '}
                        {numberInput.trim()
                          ? `#${numberInput.trim().padStart(3, '0')}`
                          : ''}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        )}

        {/* ===================================================================== */}
        {/* PASSO 3: TODOS OS NÚMEROS VERIFICADOS COM VZINHO -> RESERVAR E PIX    */}
        {/* ===================================================================== */}
        {step === 'reserve' && (
          <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-bold uppercase tracking-wider inline-block">
                Etapa 2 de 3 • Todos Disponíveis!
              </span>
              <h2 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                {verifiedNumbers.length}{' '}
                {verifiedNumbers.length === 1
                  ? 'Número Verificado'
                  : 'Números Verificados'}{' '}
                com Sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-[#475872]">
                Confirme os dados do comprador abaixo para travar esses números no sistema online e gerar o QR Code PIX de{' '}
                <strong className="text-[var(--ora-blue,#00A868)]">
                  R$ {totalAmount.toFixed(2)}
                </strong>
                .
              </p>
            </div>

            {/* Lista dos números aprovados com Vzinho */}
            <div className="p-4 rounded-[20px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#065F46]">
                <span>Cotas verificadas e livres:</span>
                <button
                  type="button"
                  onClick={() => setStep('check')}
                  className="text-[var(--ora-blue,#00A868)] hover:underline cursor-pointer"
                >
                  Alterar números
                </button>
              </div>
              <div className="flex flex-wrap gap-2 tabular-nums">
                {verifiedNumbers.map((num) => (
                  <span
                    key={num}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#10B981] text-[#065F46] font-display font-bold text-sm shadow-sm"
                  >
                    <Check className="w-4 h-4 text-[#059669]" />
                    <span>#{num.toString().padStart(3, '0')}</span>
                  </span>
                ))}
              </div>
            </div>

            {reserveError && (
              <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold">
                {reserveError}
              </div>
            )}

            <form
              onSubmit={handleConfirmReservationAndGeneratePix}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#14213A] mb-1.5">
                  Nome do Comprador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do cliente"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-sm font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[var(--ora-blue,#00A868)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213A] mb-1.5">
                  WhatsApp do Comprador com DDD *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(formatPhone(e.target.value))}
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-sm font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[var(--ora-blue,#00A868)]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReservation}
                className="ora-btn-primary w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition cursor-pointer"
              >
                {isSubmittingReservation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Reservando os {verifiedNumbers.length} números...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span>
                      Reservar Cotas e Ir para Pagamento (R${' '}
                      {totalAmount.toFixed(2)})
                    </span>
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* ===================================================================== */}
        {/* PASSO 4: PAGAMENTO PIX COM VALOR SOMADO                               */}
        {/* ===================================================================== */}
        {step === 'pix' && (
          <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {reservationConfirmed
                    ? `${verifiedNumbers.length} Cota(s) Reservada(s) no Sistema!`
                    : 'QR Code PIX com Valor Somado Pronto!'}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.03em] pt-1 tabular-nums">
                Total: R$ {totalAmount.toFixed(2)}
              </h2>
              {verifiedNumbers.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 tabular-nums">
                  {verifiedNumbers.map((n) => (
                    <span
                      key={n}
                      className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#10B981] text-[#065F46] text-xs font-display font-bold inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-[#059669]" />#
                      {n.toString().padStart(3, '0')}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs sm:text-sm text-[#475872] pt-1">
                O QR Code abaixo já está configurado com o valor somado de{' '}
                <strong>R$ {totalAmount.toFixed(2)}</strong> para a chave PIX de{' '}
                <strong>{raffle.brand_name || 'o organizador'}</strong>.
              </p>
            </div>

            {pixQrDataUrl && (
              <div className="mx-auto w-56 h-56 p-3.5 bg-white rounded-[24px] border-2 border-[var(--ora-border-strong,#B9E7D2)] shadow-md flex items-center justify-center">
                <img
                  src={pixQrDataUrl}
                  alt="QR Code PIX com valor somado"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="space-y-3 text-left">
              <button
                type="button"
                onClick={copyPixPayload}
                className={`w-full py-4 px-5 rounded-[18px] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer shadow-md ${
                  copiedPayload
                    ? 'bg-[#059669] text-white shadow-[0_10px_25px_rgba(5,150,105,0.3)]'
                    : 'ora-btn-primary'
                }`}
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>
                      PIX Copia e Cola Copiado! (R$ {totalAmount.toFixed(2)})
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>
                      Copiar PIX Copia e Cola (R$ {totalAmount.toFixed(2)})
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Mensagem de Atenção e Envio de Comprovante */}
            <div className="text-left bg-[#FFFBEB] border border-[#FDE68A] rounded-[22px] p-4 sm:p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-[#92400E] font-display font-bold text-xs sm:text-sm">
                <span className="text-base">📸</span>
                <span>ATENÇÃO: COMPROVANTE DE PAGAMENTO</span>
              </div>
              <p className="text-xs sm:text-[13px] text-[#78350F] leading-relaxed">
                Após realizar o Pix, <strong>salve o comprovante no seu celular</strong>.
              </p>
              <p className="text-xs sm:text-[13px] text-[#78350F] leading-relaxed">
                Em seguida, clique no botão abaixo para abrir o WhatsApp e <strong>anexe o comprovante à mensagem</strong>.
              </p>
              <div className="pt-2 border-t border-[#FDE68A]/70 flex items-start gap-2 text-xs sm:text-[13px] text-[#065F46] font-medium leading-snug">
                <span>✅</span>
                <span>Seus números serão confirmados após a conferência do pagamento.</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-[#065F46] font-medium pt-0.5">
                <span>🍀</span>
                <span>Obrigado(a) por participar e boa sorte!</span>
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-[#E0E9F7]">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 px-5 rounded-[18px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Enviar Notificação e Comprovante no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleResetForNextCustomer}
                className="w-full py-3 rounded-[16px] bg-[#F5F9FF] hover:bg-[#EDF5FF] border border-[var(--ora-border-strong,#B9E7D2)] text-xs font-bold text-[var(--ora-blue,#00A868)] flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Atender Próximo Cliente (Nova Verificação)</span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
