'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { useTheme } from '@/lib/theme-context';
import { createRaffle, generateUniqueRaffleIdentity } from '@/lib/firebase/raffles';
import {
  sanitizeBrandSlug,
  sanitizePrizeKeyword,
  suggestPrizeKeyword,
} from '@/lib/raffle-urls';
import PrizeImageUploader from '@/components/prize-image-uploader';
import DiscountConfigEditor from '@/components/discount-config-editor';
import { DEFAULT_DISCOUNT_CONFIG, normalizeDiscountConfig } from '@/lib/discounts';
import { numeroPorExtensoBRL } from '@/lib/currency';
import { RaffleCreationTermsModal } from '@/components/terms-modals';
import { ArrowLeft, Info, Link2, Loader2, ShieldCheck } from 'lucide-react';
import type { PixKeyType, RaffleDiscountConfig } from '@/types/database.types';

export default function NewRafflePage() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [prizeKeyword, setPrizeKeyword] = useState('');
  const [keywordTouched, setKeywordTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [prizeImages, setPrizeImages] = useState<string[]>([]);
  const [totalTickets, setTotalTickets] = useState<number>(100);
  const [ticketPrice, setTicketPrice] = useState<string>('1.00');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(profile?.pix_key_type || 'cpf');
  const [pixKey, setPixKey] = useState(profile?.pix_key || '');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(profile?.phone_whatsapp || '');
  const [discountConfig, setDiscountConfig] = useState<RaffleDiscountConfig>(
    DEFAULT_DISCOUNT_CONFIG
  );

  const presets = [50, 100, 200, 500, 1000];

  const pricePresets = [
    { label: 'R$ 0,01', value: '0.01' },
    { label: 'R$ 0,05', value: '0.05' },
    { label: 'R$ 0,10', value: '0.10' },
    { label: 'R$ 0,25', value: '0.25' },
    { label: 'R$ 0,50', value: '0.50' },
    { label: 'R$ 1,00', value: '1.00' },
    { label: 'R$ 2,50', value: '2.50' },
    { label: 'R$ 5,00', value: '5.00' },
    { label: 'R$ 10,00', value: '10.00' },
  ];

  const numericPrice = parseFloat(ticketPrice.toString().replace(',', '.')) || 0;
  const priceInWords = numeroPorExtensoBRL(numericPrice);
  const potentialRevenue = (totalTickets * numericPrice).toFixed(2);
  const potentialRevenueInWords = numeroPorExtensoBRL(totalTickets * numericPrice);
  const brandSlugPreview = sanitizeBrandSlug(profile?.brand_name || profile?.full_name || 'FastRifa');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError('Você precisa estar autenticado.');
      return;
    }

    const cleanKeyword = sanitizePrizeKeyword(prizeKeyword);

    if (!title || !pixKey || isNaN(numericPrice) || isNaN(totalTickets)) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!/^[a-z]{2,12}$/.test(cleanKeyword)) {
      setError('Informe a palavra-chave do prêmio usando apenas letras (entre 2 e 12 letras, sem espaços ou números).');
      return;
    }

    if (numericPrice < 0.01) {
      setError('O valor da cota deve ser no mínimo R$ 0,01 (um centavo de real).');
      return;
    }

    if (!acceptedTerms) {
      setError('É obrigatório ler e concordar com os Termos de Criação e Responsabilidade da Campanha para continuar.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const identity = await generateUniqueRaffleIdentity(
        cleanKeyword,
        profile?.brand_name || profile?.full_name || 'FastRifa'
      );
      await createRaffle({
        user_id: user.uid,
        title,
        slug: identity.slug,
        brand_slug: identity.brand_slug,
        prize_keyword: identity.prize_keyword,
        short_code: identity.short_code,
        description,
        prize_image_url: prizeImageUrl || (prizeImages[0] ?? null),
        prize_images: prizeImages.length > 0 ? prizeImages : (prizeImageUrl ? [prizeImageUrl] : []),
        ticket_price: numericPrice,
        total_tickets: totalTickets,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        phone_whatsapp: phoneWhatsapp || '',
        brand_name: profile?.brand_name || profile?.full_name || 'FastRifa',
        brand_logo_url: profile?.brand_logo_url || null,
        brand_color: (profile?.brand_color as 'blue' | 'green') || (theme as 'blue' | 'green') || 'green',
        discount_config: normalizeDiscountConfig(discountConfig),
        status: 'active',
        winner_ticket: null,
        winner_name: null,
        draw_date: null,
      });

      router.push(`/admin/rifas/${identity.slug}?created=true`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Erro ao criar rifa.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          aria-label="Voltar para o painel"
          className="ora-btn-secondary p-2.5 rounded-full inline-flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-[#14213A]" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
            Criar Rifa Rápida
          </h1>
          <p className="text-sm text-[#475872]">
            Configure seu prêmio, valor da cota e chave PIX em 2 minutos para começar a divulgar no WhatsApp.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-medium rounded-[18px]"
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="ora-card rounded-[28px] p-6 sm:p-9 space-y-8">
        {/* Prêmio */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
            Informações do Prêmio
          </h2>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="title"
            >
              Título do Prêmio ou Campanha *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!keywordTouched) {
                  setPrizeKeyword(suggestPrizeKeyword(nextTitle));
                }
              }}
              placeholder="Ex: iPhone 16 Pro Max 256GB Lacrado"
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-[13px] font-semibold text-[#14213A]"
                htmlFor="prizeKeyword"
              >
                Palavra-chave do Link (Resumo do Prêmio) *
              </label>
              <span className="text-[11px] font-bold text-[#526480] tabular-nums">
                {prizeKeyword.length}/12 letras
              </span>
            </div>
            <input
              id="prizeKeyword"
              type="text"
              required
              maxLength={12}
              value={prizeKeyword}
              onChange={(e) => {
                setKeywordTouched(true);
                setPrizeKeyword(sanitizePrizeKeyword(e.target.value));
              }}
              placeholder="Ex: iphone (apenas letras, máx. 12)"
              className="w-full px-4 py-3 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[14px] font-mono transition"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#526480]">
              <span>Aceita somente letras (sem acentos, números ou espaços).</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDF5FF] border border-[#CDE0FC] text-[#0869F5] font-mono font-bold">
                <Link2 className="w-3 h-3" />
                /{brandSlugPreview}/{prizeKeyword || 'premio'}/xxxx
              </span>
            </div>
          </div>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="description"
            >
              Descrição e Regras do Sorteio
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes do prêmio, data ou critério de sorteio (ex: Loteria Federal)."
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>

          {/* Foto do Prêmio com Uploader inteligente (Múltiplas Fotos) */}
          <PrizeImageUploader
            value={prizeImageUrl}
            values={prizeImages}
            onChange={(primary, all) => {
              setPrizeImageUrl(primary);
              setPrizeImages(all);
            }}
          />
        </div>

        {/* Cotas e Valores */}
        <div className="pt-6 border-t border-[#E0E9F7] space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
            Cotas e Valor por Bilhete
          </h2>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-2"
              htmlFor="totalTickets"
            >
              Quantidade Total de Cotas *
            </label>
            <div className="inline-flex flex-wrap gap-1.5 p-1.5 bg-[#F8FBFF] border border-[#DBE7F6] rounded-full mb-3">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalTickets(preset)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer tabular-nums ${
                    totalTickets === preset
                      ? 'bg-[#0869F5] text-white shadow-[0_6px_14px_rgba(8,105,245,0.2)]'
                      : 'text-[#475872] hover:text-[#0D1729]'
                  }`}
                >
                  {preset} cotas
                </button>
              ))}
            </div>
            <input
              id="totalTickets"
              type="number"
              min={10}
              max={100000}
              required
              value={totalTickets}
              onChange={(e) => setTotalTickets(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] tabular-nums transition"
            />
            {totalTickets > 200 && (
              <div className="mt-2.5 p-3.5 rounded-[14px] bg-[#FFF8EB] border border-[#F5D08A] text-[#92400E] text-xs font-medium flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#9A6700] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Modo Somente Virtual:</strong> campanhas com mais de 200 números funcionam exclusivamente no modo online e não permitem a emissão de cartela física impressa em PDF (disponível apenas para rifas de até 200 cotas).
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-[13px] font-semibold text-[#14213A]"
                htmlFor="ticketPrice"
              >
                Valor por Cota (R$) *
              </label>
              <span className="text-xs text-[#526480] font-medium">
                De R$ 0,01 até o valor desejado
              </span>
            </div>

            {/* Sugestões Rápidas de Valores (Micro-cotas e Valores Padrão) */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {pricePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTicketPrice(preset.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer tabular-nums ${
                    numericPrice === parseFloat(preset.value)
                      ? 'bg-[#0869F5] text-white shadow-[0_4px_12px_rgba(8,105,245,0.25)]'
                      : 'bg-[#F2F7FF] text-[#475872] hover:bg-[#E3EFFF] hover:text-[#0D1729] border border-[#D9E5F7]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#526480]">
                R$
              </span>
              <input
                id="ticketPrice"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="0.01"
                className="w-full pl-11 pr-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[16px] font-bold tabular-nums transition"
              />
            </div>

            {/* Valor Por Extenso em Destaque */}
            {priceInWords && (
              <div className="mt-2.5 px-3.5 py-2.5 bg-[#F0F6FF] border border-[#CDE0FC] rounded-[14px] flex items-center gap-2.5 animate-fadeIn">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0869F5] bg-[#D8E8FE] px-2 py-0.5 rounded-md flex-shrink-0">
                  Por extenso
                </span>
                <span className="text-sm font-bold text-[#0D1729]">
                  {priceInWords}
                </span>
              </div>
            )}
          </div>

          {/* Revenue preview box */}
          <div className="p-5 bg-[#F2F7FF] border border-[#CDE0FC] rounded-[20px] space-y-1.5 tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#14213A]">
                Arrecadação Potencial (100% vendido):
              </span>
              <span className="font-display font-bold text-xl text-[#0869F5]">
                R$ {Number(potentialRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {potentialRevenueInWords && (
              <p className="text-xs text-[#526480] font-medium">
                Equivalente a: <strong className="text-[#0D1729] font-bold">{potentialRevenueInWords}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Estratégia de Desconto para Múltiplos Bilhetes */}
        <div className="pt-6 border-t border-[#E0E9F7]">
          <DiscountConfigEditor
            value={discountConfig}
            onChange={setDiscountConfig}
            unitPrice={numericPrice}
          />
        </div>

        {/* Chave PIX e WhatsApp */}
        <div className="pt-6 border-t border-[#E0E9F7] space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
            Recebimento via PIX
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="pixKeyType"
              >
                Tipo de Chave
              </label>
              <select
                id="pixKeyType"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3.5 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5] text-[15px] transition"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Celular</option>
                <option value="email">E-mail</option>
                <option value="random">Aleatória</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="pixKey"
              >
                Sua Chave PIX *
              </label>
              <input
                id="pixKey"
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Chave para onde o participante enviará o PIX"
                className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="phoneWhatsapp"
            >
              WhatsApp para Receber Comprovantes (com DDD) *
            </label>
            <input
              id="phoneWhatsapp"
              type="tel"
              required
              value={phoneWhatsapp}
              onChange={(e) => setPhoneWhatsapp(e.target.value)}
              placeholder="Ex: 11999999999"
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>
        </div>

        {/* Termo de Uso e Responsabilidade da Campanha */}
        <div
          className={`p-4 rounded-[20px] transition border ${
            error && !acceptedTerms
              ? 'bg-[#FFF5F6] border-[#BE123C] ring-2 ring-[#BE123C]/20'
              : 'bg-[#F5F9FF] border-[#D9E5F7]'
          }`}
        >
          <label className="flex items-start gap-3.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 w-5 h-5 rounded-[6px] text-[#0869F5] border-[#D9E5F7] focus:ring-[#0869F5] cursor-pointer flex-shrink-0"
            />
            <div className="text-xs text-[#334661] leading-relaxed">
              <span>Declaro sob as penas da lei que li e concordo com os </span>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="font-bold text-[#0869F5] underline underline-offset-2 hover:text-[#052498] inline-block transition cursor-pointer"
              >
                Termos de Criação e Responsabilidade da Campanha
              </button>
              <span>
                , assumindo responsabilidade legal e irrevogável pela posse legítima, idoneidade e entrega do prêmio ao ganhador.
              </span>
            </div>
          </label>
        </div>

        {/* Modal de Leitura Completa dos Termos */}
        <RaffleCreationTermsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          onAccept={() => {
            setAcceptedTerms(true);
            if (error) setError(null);
          }}
        />

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="ora-btn-primary w-full py-4 px-5 font-bold rounded-[18px] text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publicando Campanha...</span>
              </>
            ) : (
              <span>Publicar Rifa Agora</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
