'use client';

import { use, useEffect, useState, useMemo } from 'react';
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
  Plus,
  Minus,
  Loader2,
  Sparkles,
  FileCheck2,
  Hash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

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

  // Passo 1: Quantidade de cotas e sincronização opcional Físico-Virtual
  const [quantity, setQuantity] = useState<number>(1);
  const [syncNumbersOpen, setSyncNumbersOpen] = useState(false);
  const [selectedPaperNumbers, setSelectedPaperNumbers] = useState<number[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Passo 2: QR Code PIX Gerado com valor somado
  const [step, setStep] = useState<'select' | 'pix'>('select');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedRawKey, setCopiedRawKey] = useState(false);
  const [syncedOrderSuccess, setSyncedOrderSuccess] = useState(false);

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
          const themeToApply = data.brand_color === 'green' ? 'green' : 'blue';
          document.documentElement.setAttribute('data-theme', themeToApply);
        }
      })
      .catch(() => setError('Erro ao carregar dados da campanha.'))
      .finally(() => setLoading(false));

    return () => {
      if (typeof window !== 'undefined') {
        const globalTheme =
          localStorage.getItem('fastrifa_global_system_theme') || 'blue';
        document.documentElement.setAttribute('data-theme', globalTheme);
      }
    };
  }, [slug]);

  const occupiedMap = useMemo(() => {
    const map = new Map<number, 'pending' | 'paid'>();
    occupiedTickets.forEach((t) => map.set(t.ticket_number, t.status));
    return map;
  }, [occupiedTickets]);

  const effectiveQuantity =
    syncNumbersOpen && selectedPaperNumbers.length > 0
      ? selectedPaperNumbers.length
      : Math.max(1, quantity);

  const unitPrice = raffle ? Number(raffle.ticket_price) : 0;
  const totalAmount = effectiveQuantity * unitPrice;

  function togglePaperNumber(num: number) {
    if (occupiedMap.has(num)) return;
    setSelectedPaperNumbers((prev) => {
      const next = prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num].sort((a, b) => a - b);
      if (next.length > 0) {
        setQuantity(next.length);
      }
      return next;
    });
  }

  function fireGratificationConfetti() {
    try {
      const isGreen = raffle?.brand_color === 'green';
      confetti({
        particleCount: 65,
        spread: 68,
        origin: { y: 0.65 },
        colors: isGreen
          ? ['#059669', '#10B981', '#F59E0B', '#34D399']
          : ['#0869F5', '#3888FF', '#F59E0B', '#60A5FA'],
      });
    } catch {}
  }

  async function handleGeneratePix() {
    if (!raffle) return;
    setSyncError(null);
    setIsGenerating(true);

    try {
      // Se o comprador marcou números da cartela física para sincronizar online
      if (syncNumbersOpen && selectedPaperNumbers.length > 0) {
        if (!buyerName.trim() || buyerName.trim().length < 2) {
          setSyncError(
            'Informe seu nome para registrarmos os números da cartela no sistema.'
          );
          setIsGenerating(false);
          return;
        }
        const cleanDigits = buyerPhone.replace(/\D/g, '');
        if (cleanDigits.length < 10) {
          setSyncError(
            'Informe seu WhatsApp com DDD para vincular os números da cartela.'
          );
          setIsGenerating(false);
          return;
        }

        const res = await createOrder({
          raffle_id: raffle.id,
          buyer_name: buyerName.trim(),
          buyer_phone: buyerPhone.trim(),
          ticket_numbers: selectedPaperNumbers,
          total_amount: totalAmount,
          status: 'pending',
        });

        if (res.error) {
          setSyncError(res.error);
          setIsGenerating(false);
          return;
        }

        setSyncedOrderSuccess(true);
        setOccupiedTickets((prev) => [
          ...prev,
          ...selectedPaperNumbers.map((num) => ({
            ticket_number: num,
            status: 'pending' as const,
          })),
        ]);
      }

      // Gera o payload PIX BR Code oficial já com o valor somado
      const payload = generatePixBrCode({
        pixKey: raffle.pix_key,
        pixKeyType: raffle.pix_key_type,
        merchantName: raffle.brand_name || 'FASTRIFA',
        merchantCity: 'BRASIL',
        amount: totalAmount,
        description: `RIFA ${effectiveQuantity} COTAS`,
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
      setStep('pix');
      fireGratificationConfetti();
    } catch (err) {
      console.error('Erro ao gerar QR Code PIX:', err);
      setSyncError('Não foi possível gerar o QR Code PIX. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }

  function copyPixPayload() {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    fireGratificationConfetti();
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
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
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
  const formattedPaperNums =
    selectedPaperNumbers.length > 0
      ? ` (${selectedPaperNumbers.map((n) => `#${n.toString().padStart(3, '0')}`).join(', ')})`
      : '';
  const whatsappMessage = `Olá! Escaneiei o QR Code da Cartela Física da rifa *"${raffle.title}"* e gerei o PIX para *${effectiveQuantity} cota(s)*${formattedPaperNums} no valor total de *R$ ${totalAmount.toFixed(2)}*.${buyerName ? ` Meu nome é ${buyerName}.` : ''} Segue o comprovante do PIX!`;
  const whatsappUrl = `https://wa.me/55${organizerCleanPhone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col pb-16">
      {/* Top Security & Brand Header */}
      <header className="sticky top-0 z-40 h-[78px] flex items-center bg-white/85 backdrop-blur-md border-b border-[#E0E9F7]">
        <div className="max-w-xl w-full mx-auto px-4 flex items-center justify-between gap-2">
          <Link
            href={`/r/${raffle.slug}`}
            className="ora-glass-pill rounded-full px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-[#0D1729] hover:border-[#0869F5] transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#0869F5]" />
            <span>Ver Rifa Online</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF5FF] border border-[#CDE0FC] text-[#0755DE] text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#0869F5]" />
            <span>Cartela Física Verificada</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 pt-6 space-y-6">
        {/* Identificação da Campanha e Organizador */}
        <section className="ora-card rounded-[28px] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#E0E9F7]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white text-xs font-bold shadow-sm flex-shrink-0">
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
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#526480] block">
                  Organizador Oficial
                </span>
                <strong className="text-sm font-display font-bold text-[#0D1729]">
                  {raffle.brand_name || 'FastRifa Oficial'}
                </strong>
              </div>
            </div>

            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-6 w-auto object-contain opacity-90"
            />
          </div>

          <div className="flex items-center gap-4">
            {raffle.prize_image_url && (
              <img
                src={raffle.prize_image_url}
                alt={raffle.title}
                className="w-20 h-20 rounded-[18px] object-cover border border-[#E0E9F7] flex-shrink-0"
              />
            )}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0869F5] uppercase tracking-wider">
                <FileCheck2 className="w-3.5 h-3.5" />
                Pagamento Rápido da Cartela
              </span>
              <h1 className="font-display font-bold text-lg sm:text-xl text-[#0D1729] leading-snug">
                {raffle.title}
              </h1>
              <div className="text-xs font-semibold text-[#475872] tabular-nums">
                Valor de cada número:{' '}
                <strong className="text-[#0869F5] text-sm">
                  R$ {unitPrice.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {step === 'select' ? (
          <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-6">
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-[#EDF5FF] text-[#0869F5] text-xs font-bold uppercase tracking-wider">
                Passo 1 de 2
              </span>
              <h2 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em] pt-1">
                Quantas cotas você anotou?
              </h2>
              <p className="text-xs sm:text-sm text-[#475872]">
                Informe a quantidade de números escolhidos na folha para gerarmos o QR Code PIX já com o valor somado.
              </p>
            </div>

            {/* Seletor de Quantidade Grande */}
            <div className="p-5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[24px] space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaperNumbers([]);
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="w-12 h-12 rounded-2xl bg-white border border-[#CDE0FC] hover:border-[#0869F5] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-sm"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center min-w-[110px]">
                  <input
                    type="number"
                    min={1}
                    max={raffle.total_tickets}
                    value={effectiveQuantity}
                    onChange={(e) => {
                      setSelectedPaperNumbers([]);
                      const val = parseInt(e.target.value, 10);
                      setQuantity(
                        Number.isNaN(val)
                          ? 1
                          : Math.min(raffle.total_tickets, Math.max(1, val))
                      );
                    }}
                    className="w-24 text-center font-display font-bold text-4xl text-[#0869F5] bg-transparent focus:outline-none tabular-nums"
                  />
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#526480]">
                    {effectiveQuantity === 1 ? 'Cota' : 'Cotas'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaperNumbers([]);
                    setQuantity((q) => Math.min(raffle.total_tickets, q + 1));
                  }}
                  className="w-12 h-12 rounded-2xl bg-white border border-[#CDE0FC] hover:border-[#0869F5] flex items-center justify-center text-[#0D1729] active:scale-90 transition cursor-pointer shadow-sm"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Atalhos rápidos */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 tabular-nums">
                {[1, 2, 3, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedPaperNumbers([]);
                      setQuantity(preset);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold border transition active:scale-95 cursor-pointer ${
                      effectiveQuantity === preset
                        ? 'bg-[#0869F5] text-white border-[#0869F5] shadow-sm'
                        : 'bg-white text-[#0755DE] border-[#CDE0FC] hover:border-[#0869F5]'
                    }`}
                  >
                    {preset} {preset === 1 ? 'cota' : 'cotas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ponte Físico + Virtual: Sincronizar números anotados no papel */}
            <div className="border border-[#D9E5F7] rounded-[22px] overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setSyncNumbersOpen((v) => !v)}
                className="w-full px-4 py-3.5 bg-[#F5F9FF] hover:bg-[#EDF5FF] flex items-center justify-between gap-2 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-white border border-[#CDE0FC] flex items-center justify-center text-[#0869F5] flex-shrink-0">
                    <Hash className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#0D1729] block">
                      Sincronizar números da cartela física (Opcional)
                    </span>
                    <span className="text-[11px] text-[#526480] block">
                      Bloqueia seus números no site para ninguém comprar duplicado
                    </span>
                  </div>
                </div>
                {syncNumbersOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#475872]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#475872]" />
                )}
              </button>

              {syncNumbersOpen && (
                <div className="p-4 space-y-4 border-t border-[#E0E9F7]">
                  <p className="text-xs text-[#475872]">
                    Toque nos números que você assinalou no papel e informe seu nome para já deixá-los reservados no sistema online:
                  </p>

                  <div className="max-h-44 overflow-y-auto pr-1">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 tabular-nums">
                      {Array.from(
                        { length: raffle.total_tickets },
                        (_, i) => i + 1
                      ).map((num) => {
                        const isPicked = selectedPaperNumbers.includes(num);
                        const occ = occupiedMap.get(num);
                        const isPaid = occ === 'paid';
                        const isPending = occ === 'pending';

                        let cls =
                          'bg-[#F5F9FF] text-[#14213A] border-[#D9E5F7] hover:border-[#0869F5]';
                        if (isPicked) {
                          cls =
                            'bg-[#0869F5] text-white border-[#0869F5] font-bold scale-105 shadow-sm';
                        } else if (isPaid) {
                          cls =
                            'bg-[#FFF0F0] text-[#DC2626] border-[#FCA5A5] line-through opacity-75 cursor-not-allowed';
                        } else if (isPending) {
                          cls =
                            'bg-[#FFF8EB] text-[#9A6700] border-[#F5D08A] cursor-not-allowed';
                        }

                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={isPaid || isPending}
                            onClick={() => togglePaperNumber(num)}
                            className={`h-9 rounded-lg border text-[11px] font-display font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${cls}`}
                          >
                            {num.toString().padStart(3, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedPaperNumbers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <input
                        type="text"
                        placeholder="Seu Nome Completo *"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-xl text-xs font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5]"
                      />
                      <input
                        type="tel"
                        placeholder="Seu WhatsApp com DDD *"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-xl text-xs font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {syncError && (
              <div className="p-3 bg-[#FFF0F0] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold rounded-xl">
                {syncError}
              </div>
            )}

            {/* Resumo do Valor Somado */}
            <div className="p-4 rounded-[20px] bg-[#EDF5FF] border border-[#CDE0FC] flex items-center justify-between tabular-nums">
              <div>
                <span className="text-xs font-bold text-[#475872] block">
                  {effectiveQuantity} cota(s) × R$ {unitPrice.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#526480]">
                  PIX direto para {raffle.brand_name || 'o organizador'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0755DE] block">
                  Total Somado
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-[#0869F5]">
                  R$ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePix}
              className="ora-btn-primary w-full py-4 rounded-[20px] font-bold text-base flex items-center justify-center gap-2.5 shadow-[0_14px_30px_rgba(8,105,245,0.28)] active:scale-[0.98] transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando QR Code PIX...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Gerar QR Code PIX (R$ {totalAmount.toFixed(2)})</span>
                </>
              )}
            </button>
          </section>
        ) : (
          <section className="ora-card rounded-[28px] p-6 sm:p-7 space-y-6 text-center">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {syncedOrderSuccess
                    ? 'Números reservados e PIX gerado!'
                    : 'QR Code PIX com valor somado pronto!'}
                </span>
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.03em] pt-1 tabular-nums">
                Total: R$ {totalAmount.toFixed(2)}
              </h2>
              <p className="text-xs sm:text-sm text-[#475872]">
                Referente a <strong>{effectiveQuantity} cota(s)</strong>
                {selectedPaperNumbers.length > 0 && (
                  <>
                    {' '}
                    (
                    {selectedPaperNumbers
                      .map((n) => `#${n.toString().padStart(3, '0')}`)
                      .join(', ')}
                    )
                  </>
                )}
                . Escaneie ou copie o código abaixo no app do seu banco:
              </p>
            </div>

            {/* QR Code PIX Oficial */}
            {pixQrDataUrl && (
              <div className="mx-auto w-56 h-56 p-3.5 bg-white rounded-[24px] border-2 border-[#CDE0FC] shadow-[0_14px_34px_rgba(8,105,245,0.12)] flex items-center justify-center">
                <img
                  src={pixQrDataUrl}
                  alt="QR Code PIX com valor somado"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Botão Principal: Copiar PIX Copia e Cola com Valor */}
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
                    <span>PIX Copia e Cola Copiado! (R$ {totalAmount.toFixed(2)})</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copiar PIX Copia e Cola (R$ {totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>

              {/* Chave PIX Tradicional (Fallback) */}
              <div className="p-3.5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[16px] flex items-center justify-between gap-2 text-xs">
                <div className="truncate">
                  <span className="text-[#526480] font-semibold block">
                    Chave PIX direta ({raffle.pix_key_type.toUpperCase()}):
                  </span>
                  <strong className="font-mono text-[#0D1729]">
                    {raffle.pix_key}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={copyRawPixKey}
                  className="px-3 py-1.5 bg-white border border-[#CDE0FC] hover:border-[#0869F5] rounded-lg font-bold text-[#0755DE] flex-shrink-0 inline-flex items-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  {copiedRawKey ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Enviar comprovante no WhatsApp */}
            <div className="pt-2 space-y-3 border-t border-[#E0E9F7]">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-5 rounded-[18px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Enviar Comprovante no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-xs font-bold text-[#475872] hover:text-[#0869F5] cursor-pointer"
              >
                ← Alterar quantidade de cotas
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
