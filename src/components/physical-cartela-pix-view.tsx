'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  getRaffleBySlug,
  getRaffleByPublicParams,
  getOccupiedTickets,
  createOrder,
} from '@/lib/firebase/raffles';
import { getRafflePublicPath } from '@/lib/raffle-urls';
import { generatePixBrCode } from '@/lib/pix-brcode';
import { calculateDiscountedPricing } from '@/lib/discounts';
import { generateBrandInitials } from '@/lib/image-processor';
import { formatBrazilMobile, getBrazilMobileError } from '@/lib/validators';
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
  AlertCircle,
} from 'lucide-react';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

type FlowStep = 'qty' | 'check' | 'reserve' | 'pix';

interface UnavailableAlert {
  number: number;
  reason: 'paid' | 'pending' | 'duplicate' | 'out_of_range';
  message: string;
  suggestions: number[];
}

export interface PhysicalCartelaPixViewProps {
  slug?: string;
  brand?: string;
  keyword?: string;
  code?: string;
}

export default function PhysicalCartelaPixView({
  slug,
  brand,
  keyword,
  code,
}: PhysicalCartelaPixViewProps) {

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
  const [buyerFieldErrors, setBuyerFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
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
    const fetcher =
      brand && keyword && code
        ? getRaffleByPublicParams(brand, keyword, code)
        : slug
          ? getRaffleBySlug(slug)
          : null;
    if (!fetcher) return;

    fetcher
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
  }, [slug, brand, keyword, code]);

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
  const pricing = useMemo(
    () =>
      calculateDiscountedPricing({
        ticketCount: quantity,
        unitPrice,
        config: raffle?.discount_config,
      }),
    [quantity, unitPrice, raffle?.discount_config]
  );
  const totalAmount = pricing.finalAmount;

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

  // Conclui a reserva das cotas verificadas no Firestore e gera o QR Code PIX somado
  async function handleConfirmReservationAndGeneratePix(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle) return;
    setReserveError(null);

    const trimmedName = buyerName.trim();
    const nextFieldErrors: { name?: string; phone?: string } = {};

    if (trimmedName.length < 2) {
      nextFieldErrors.name = 'Informe o nome do comprador para registrar a reserva.';
    }
    const phoneErr = getBrazilMobileError(buyerPhone);
    if (phoneErr) {
      nextFieldErrors.phone = phoneErr;
    }

    setBuyerFieldErrors(nextFieldErrors);
    if (nextFieldErrors.name || nextFieldErrors.phone) {
      return;
    }

    setIsSubmittingReservation(true);

    try {
      const res = await createOrder({
        raffle_id: raffle.id,
        buyer_name: trimmedName,
        buyer_phone: formatBrazilMobile(buyerPhone),
        ticket_numbers: verifiedNumbers,
        total_amount: totalAmount,
        ...(pricing.discountPercent > 0
          ? {
              original_amount: pricing.originalAmount,
              discount_percent: pricing.discountPercent,
              discount_amount: pricing.discountAmount,
              discount_label: pricing.discountLabel,
            }
          : {}),
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
    const sumAmount = calculateDiscountedPricing({
      ticketCount: cotaCount,
      unitPrice,
      config: raffle.discount_config,
    }).finalAmount;
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
    <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center p-2.5 sm:p-4">
      <main className="max-w-lg w-full">
        <section className="ora-card rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-[0_20px_50px_rgba(13,23,41,0.08)]">
          {/* Barra superior integrada na caixa principal */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pb-2.5 border-b border-[#E0E9F7]">
            <Link
              href={getRafflePublicPath(raffle)}
              className="ora-btn-secondary rounded-full px-2.5 sm:px-3 py-1.5 inline-flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs font-bold text-[#0D1729] shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[var(--ora-blue,#00A868)]" />
              <span>Ver Rifa Completa</span>
            </Link>

            <div className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] border border-[var(--ora-border-strong,#B9E7D2)] text-[var(--ora-blue,#00A868)] text-[9.5px] sm:text-[11px] font-bold whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Checador Oficial • Físico + Digital</span>
            </div>
          </div>

          {/* Informações da Rifa integradas logo abaixo na mesma caixa */}
          <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#E0E9F7]">
            <div className="flex items-center gap-2.5 min-w-0">
              {raffle.prize_image_url ? (
                <img
                  src={raffle.prize_image_url}
                  alt={raffle.title}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-[#E0E9F7] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#A7F3D0] to-[var(--ora-blue,#00A868)] text-white text-xs font-bold shadow-xs shrink-0">
                  {raffle.brand_logo_url ? (
                    <img
                      src={raffle.brand_logo_url}
                      alt={raffle.brand_name || 'Organizador'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{generateBrandInitials(raffle.brand_name || 'FR')}</span>
                  )}
                </div>
              )}

              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#526480] block leading-none truncate">
                  {raffle.brand_name || 'FastRifa Oficial'}
                </span>
                <h1 className="font-display font-bold text-sm sm:text-base text-[#0D1729] leading-tight truncate mt-0.5">
                  {raffle.title}
                </h1>
                <span className="text-[11px] font-semibold text-[#475872] tabular-nums block leading-tight">
                  001 a {raffle.total_tickets.toString().padStart(3, '0')} •{' '}
                  <strong className="text-[#059669]">{availableCount} livres</strong>
                </span>
              </div>
            </div>

            <div className="text-right tabular-nums shrink-0 bg-[#F5F9FF] px-2.5 py-1.5 rounded-xl border border-[#D9E5F7]">
              <span className="text-[9px] font-bold uppercase text-[#526480] block leading-none">
                Cada Cota
              </span>
              <strong className="font-display font-bold text-sm sm:text-base text-[var(--ora-blue,#00A868)] leading-tight">
                R$ {unitPrice.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PASSO 1: QUANTAS COTAS O CLIENTE QUER?                                */}
          {/* ===================================================================== */}
          {step === 'qty' && (
            <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider inline-block">
                  Etapa 1 de 3 • Quantidade
                </span>
                <h2 className="font-display font-bold text-lg sm:text-xl text-[#0D1729] tracking-[-0.03em] leading-tight">
                  Quantos números o cliente quer?
                </h2>
                <p className="text-[11px] sm:text-xs text-[#475872] leading-snug">
                  Informe quantas cotas serão vendidas para checar em tempo real.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[18px] space-y-2.5">
                <div className="flex items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-xs"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="text-center min-w-[92px]">
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
                      className="w-20 text-center font-display font-bold text-3xl text-[var(--ora-blue,#00A868)] bg-transparent focus:outline-none tabular-nums leading-none"
                    />
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#526480] mt-0.5">
                      {quantity === 1 ? 'Número' : 'Números'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(raffle.total_tickets, q + 1))
                    }
                    className="w-10 h-10 rounded-xl bg-white border border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-xs"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 tabular-nums">
                  {[1, 2, 3, 5, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={`px-3 py-1 rounded-full text-[11px] font-display font-bold border transition active:scale-95 cursor-pointer ${
                        quantity === preset
                          ? 'bg-[var(--ora-blue,#00A868)] text-white border-[var(--ora-blue,#00A868)] shadow-xs'
                          : 'bg-white text-[var(--ora-blue,#00A868)] border-[var(--ora-border-strong,#B9E7D2)] hover:border-[var(--ora-blue,#00A868)]'
                      }`}
                    >
                      {preset} {preset === 1 ? 'cota' : 'cotas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-[16px] bg-[var(--ora-surface-alt,#E8F7F0)] border border-[var(--ora-border-strong,#B9E7D2)] flex items-center justify-between tabular-nums">
                <div>
                  <span className="text-xs font-bold text-[#475872] block leading-tight">
                    {quantity} cota(s) × R$ {unitPrice.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#526480] leading-tight">
                    {pricing.discountPercent > 0
                      ? `Desconto de ${pricing.discountPercent}% OFF aplicado!`
                      : 'Valor somado automático'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ora-blue-deep,#008F58)] block leading-none">
                    Total a Pagar
                  </span>
                  {pricing.discountPercent > 0 && (
                    <span className="text-[11px] text-[#64748B] line-through block leading-tight">
                      R$ {pricing.originalAmount.toFixed(2)}
                    </span>
                  )}
                  <span className="font-display font-bold text-xl sm:text-2xl text-[var(--ora-blue,#00A868)] leading-tight">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartChecking}
                className="ora-btn-primary w-full py-3 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Verificar Disponibilidade dos {quantity} Números</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PASSO 2: CHECADOR PASSO A PASSO (NÚMERO 1 DE N, 2 DE N...)            */}
          {/* ===================================================================== */}
          {step === 'check' && (
            <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep('qty')}
                  className="text-xs font-bold text-[#526480] hover:text-[#0D1729] inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Mudar quantidade ({quantity})</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-[11px] font-bold tabular-nums">
                  Verificando {Math.min(currentSlotIndex, quantity)} de {quantity}
                </span>
              </div>

              {/* Painel Visual de Slots com Vzinho para os números já verificados */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#526480] block">
                  Números desta venda ({verifiedNumbers.length}/{quantity} aprovados):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[68px] overflow-y-auto tabular-nums">
                  {Array.from({ length: quantity }, (_, idx) => {
                    const approvedNum = verifiedNumbers[idx];
                    const isCurrent = idx === verifiedNumbers.length;

                    if (approvedNum !== undefined) {
                      return (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#ECFDF5] border border-[#10B981] text-[#065F46] font-display font-bold text-xs shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                          <span>#{approvedNum.toString().padStart(3, '0')}</span>
                          <button
                            type="button"
                            onClick={() => removeVerifiedNumber(approvedNum)}
                            title="Trocar este número"
                            className="ml-0.5 text-[#059669] hover:text-[#DC2626] cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-display font-bold transition ${
                          isCurrent
                            ? 'bg-[var(--ora-surface-alt,#E8F7F0)] border-[var(--ora-blue,#00A868)] text-[var(--ora-blue,#00A868)] shadow-xs'
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
                <div className="px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5 text-[#065F46] animate-in fade-in duration-150">
                  <div className="w-7 h-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-xs leading-snug">
                    <strong>
                      Número #{lastApprovedNumber.toString().padStart(3, '0')} disponível! ✓
                    </strong>{' '}
                    <span className="text-[11px] text-[#047857]">
                      Digite o <strong>{currentSlotIndex}º número</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* ALERTA QUANDO O NÚMERO JÁ ESTÁ RESERVADO OU VENDIDO */}
              {unavailableAlert ? (
                <div className="p-3.5 rounded-[18px] bg-[#FFF1F2] border border-[#F43F5E] space-y-2.5 text-left animate-in zoom-in-95 duration-150">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0 border border-[#FECDD3]">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9.5px] font-bold uppercase tracking-wider">
                        {unavailableAlert.reason === 'paid'
                          ? 'Número Já Vendido'
                          : unavailableAlert.reason === 'pending'
                          ? 'Número Já Reservado'
                          : 'Número Indisponível'}
                      </span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-[#881337] leading-tight">
                        O número #{unavailableAlert.number.toString().padStart(3, '0')} não está disponível!
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#9F1239] leading-snug">
                        {unavailableAlert.message}
                      </p>
                    </div>
                  </div>

                  {unavailableAlert.suggestions.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-white/90 border border-[#FECDD3] space-y-1.5">
                      <span className="text-[10.5px] font-bold text-[#881337] block">
                        Vizinhos livres agora:
                      </span>
                      <div className="flex flex-wrap gap-1.5 tabular-nums">
                        {unavailableAlert.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              setUnavailableAlert(null);
                              handleCheckNumber(sug);
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#10B981] text-[#065F46] text-[11px] font-display font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                          >
                            <Check className="w-3 h-3 text-[#059669]" />
                            <span>#{sug.toString().padStart(3, '0')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUnderstandUnavailable}
                    className="w-full py-2.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Entendi, escolher outro número</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCheckNumber();
                  }}
                  className="p-3.5 bg-[#F5F9FF] border border-[var(--ora-border-strong,#B9E7D2)] rounded-[18px] space-y-2.5"
                >
                  <div className="text-center space-y-0.5">
                    <label
                      htmlFor="checkNumberInput"
                      className="block font-display font-bold text-base sm:text-lg text-[#0D1729]"
                    >
                      Qual é o {currentSlotIndex}º número escolhido?
                    </label>
                    <span className="text-[11px] text-[#526480] block">
                      Digite de <strong>1</strong> a <strong>{raffle.total_tickets}</strong> para checar disponibilidade
                    </span>
                  </div>

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
                    className="w-full px-4 py-2.5 bg-white border-2 border-[var(--ora-border-strong,#B9E7D2)] focus:border-[var(--ora-blue,#00A868)] rounded-xl text-center font-display font-bold text-2xl text-[#0D1729] placeholder-[#94A3B8] focus:outline-none tabular-nums shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={!numberInput.trim() || isCheckingNumber}
                    className="ora-btn-primary w-full py-3 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm disabled:opacity-45 active:scale-[0.98] transition cursor-pointer"
                  >
                    {isCheckingNumber ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando disponibilidade...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
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
            </div>
          )}

          {/* ===================================================================== */}
          {/* PASSO 3: TODOS OS NÚMEROS VERIFICADOS COM VZINHO -> RESERVAR E PIX    */}
          {/* ===================================================================== */}
          {step === 'reserve' && (
            <div className="space-y-2.5 sm:space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-bold uppercase tracking-wider inline-block">
                    Etapa 2 de 3 • Todos Disponíveis!
                  </span>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-[#0D1729] tracking-[-0.03em] leading-tight mt-0.5">
                    {verifiedNumbers.length}{' '}
                    {verifiedNumbers.length === 1 ? 'Número Verificado' : 'Números Verificados'}!
                  </h2>
                </div>
              </div>

              {/* Lista dos números aprovados com Vzinho */}
              <div className="p-2.5 rounded-[16px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#065F46]">
                  <span>
                    Cotas livres · Total:{' '}
                    <strong className="text-[var(--ora-blue,#00A868)]">
                      R$ {totalAmount.toFixed(2)}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('check')}
                    className="text-[var(--ora-blue,#00A868)] hover:underline cursor-pointer"
                  >
                    Alterar números
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto tabular-nums">
                  {verifiedNumbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#10B981] text-[#065F46] font-display font-bold text-xs shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span>#{num.toString().padStart(3, '0')}</span>
                    </span>
                  ))}
                </div>
              </div>

              {reserveError && (
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold">
                  {reserveError}
                </div>
              )}

              <form
                onSubmit={handleConfirmReservationAndGeneratePix}
                noValidate
                className="space-y-2.5"
              >
                <div>
                  <label className="block text-xs font-bold text-[#14213A] mb-1">
                    Nome do Comprador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do cliente"
                    value={buyerName}
                    onChange={(e) => {
                      setBuyerName(e.target.value);
                      if (buyerFieldErrors.name) {
                        setBuyerFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-[14px] text-sm font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white ${
                      buyerFieldErrors.name
                        ? 'bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]'
                        : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[var(--ora-blue,#00A868)]'
                    }`}
                  />
                  {buyerFieldErrors.name && (
                    <p className="mt-1 text-[11px] font-semibold text-[#BE123C] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{buyerFieldErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14213A] mb-1">
                    WhatsApp do Comprador com DDD *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    required
                    placeholder="(11) 99999-9999"
                    value={buyerPhone}
                    onChange={(e) => {
                      setBuyerPhone(formatBrazilMobile(e.target.value));
                      if (buyerFieldErrors.phone) {
                        setBuyerFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    onBlur={() => {
                      if (buyerPhone.trim()) {
                        const phoneErr = getBrazilMobileError(buyerPhone);
                        if (phoneErr) {
                          setBuyerFieldErrors((prev) => ({ ...prev, phone: phoneErr }));
                        }
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-[14px] text-sm font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white ${
                      buyerFieldErrors.phone
                        ? 'bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]'
                        : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[var(--ora-blue,#00A868)]'
                    }`}
                  />
                  {buyerFieldErrors.phone && (
                    <p className="mt-1 text-[11px] font-semibold text-[#BE123C] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{buyerFieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReservation}
                  className="ora-btn-primary w-full py-3 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition cursor-pointer"
                >
                  {isSubmittingReservation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reservando os {verifiedNumbers.length} números...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Reservar Cotas e Gerar PIX (R$ {totalAmount.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PASSO 4: PAGAMENTO PIX COM VALOR SOMADO                               */}
          {/* ===================================================================== */}
          {step === 'pix' && (
            <div className="space-y-2.5 text-center animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between gap-2 text-left">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {reservationConfirmed
                        ? `${verifiedNumbers.length} Cota(s) Reservada(s)!`
                        : 'PIX Pronto!'}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em] tabular-nums mt-0.5 leading-tight">
                    Total: R$ {totalAmount.toFixed(2)}
                  </h2>
                </div>

                {verifiedNumbers.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-1 max-w-[170px] max-h-[52px] overflow-y-auto tabular-nums">
                    {verifiedNumbers.map((n) => (
                      <span
                        key={n}
                        className="px-2 py-0.5 rounded-md bg-[#ECFDF5] border border-[#10B981] text-[#065F46] text-[11px] font-display font-bold inline-flex items-center gap-0.5"
                      >
                        <Check className="w-3 h-3 text-[#059669]" />#
                        {n.toString().padStart(3, '0')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {pixQrDataUrl && (
                <div className="mx-auto w-32 h-32 sm:w-36 sm:h-36 p-2 bg-white rounded-[18px] border-2 border-[var(--ora-border-strong,#B9E7D2)] shadow-sm flex items-center justify-center">
                  <img
                    src={pixQrDataUrl}
                    alt="QR Code PIX com valor somado"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={copyPixPayload}
                className={`w-full py-2.5 sm:py-3 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer shadow-sm ${
                  copiedPayload
                    ? 'bg-[#059669] text-white'
                    : 'ora-btn-primary'
                }`}
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>PIX Copia e Cola Copiado! (R$ {totalAmount.toFixed(2)})</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar PIX Copia e Cola (R$ {totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>

              <div className="text-left bg-[#FFFBEB] border border-[#FDE68A] rounded-[16px] p-2.5 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-[#92400E] font-display font-bold text-[11px]">
                  <span>📸</span>
                  <span>ATENÇÃO: COMPROVANTE DE PAGAMENTO</span>
                </div>
                <p className="text-[11px] text-[#78350F] leading-snug">
                  Após realizar o Pix, <strong>salve o comprovante</strong> e clique abaixo para enviá-lo no WhatsApp.
                </p>
                <p className="pt-1 border-t border-[#FDE68A]/70 text-[11px] text-[#065F46] font-medium leading-snug">
                  ✅ Seus números serão confirmados após conferência. 🍀 Boa sorte!
                </p>
              </div>

              <div className="space-y-1.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 sm:py-3 px-4 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Notificação e Comprovante no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleResetForNextCustomer}
                  className="w-full py-2 px-4 rounded-full bg-[#F5F9FF] hover:bg-[#EDF5FF] border border-[var(--ora-border-strong,#B9E7D2)] text-[11px] sm:text-xs font-bold text-[var(--ora-blue,#00A868)] flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Atender Próximo Cliente (Nova Verificação)</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
