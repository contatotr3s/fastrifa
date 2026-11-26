'use client';

import { useState } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Phone,
  Key,
} from 'lucide-react';
import PrizeImageUploader from '@/components/prize-image-uploader';
import DiscountConfigEditor from '@/components/discount-config-editor';
import { DEFAULT_DISCOUNT_CONFIG, normalizeDiscountConfig } from '@/lib/discounts';
import { updateRaffleWithAudit } from '@/lib/firebase/raffles';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  formatBrazilMobile,
  getBrazilMobileError,
  normalizeBrazilMobileDigits,
  formatPixKeyInput,
  validatePixKey,
  onlyDigits,
} from '@/lib/validators';
import type { Raffle, PixKeyType, RaffleDiscountConfig } from '@/types/database.types';

interface EditRaffleModalProps {
  raffle: Raffle;
  hasPaidOrders?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRaffle: Raffle) => void;
}

export default function EditRaffleModal({
  raffle,
  hasPaidOrders = false,
  isOpen,
  onClose,
  onSuccess,
}: EditRaffleModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState(raffle.title);
  const [description, setDescription] = useState(raffle.description || '');
  const [ticketPrice, setTicketPrice] = useState(String(raffle.ticket_price));
  const [prizeImageUrl, setPrizeImageUrl] = useState(raffle.prize_image_url || '');
  const [prizeImages, setPrizeImages] = useState<string[]>(
    raffle.prize_images && raffle.prize_images.length > 0
      ? raffle.prize_images
      : raffle.prize_image_url
      ? [raffle.prize_image_url]
      : []
  );
  const [drawDate, setDrawDate] = useState(raffle.draw_date ? raffle.draw_date.slice(0, 10) : '');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(raffle.pix_key_type || 'cpf');
  const [pixKey, setPixKey] = useState(
    formatPixKeyInput(raffle.pix_key || '', raffle.pix_key_type || 'cpf')
  );
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(
    formatBrazilMobile(raffle.phone_whatsapp || '')
  );
  const [discountConfig, setDiscountConfig] = useState<RaffleDiscountConfig>(
    raffle.discount_config
      ? normalizeDiscountConfig(raffle.discount_config)
      : DEFAULT_DISCOUNT_CONFIG
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPrice = Number(raffle.ticket_price);
  const newPrice = parseFloat(ticketPrice.replace(',', '.')) || 0;
  const priceChanged = newPrice !== currentPrice;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!title.trim()) {
      setError('O título da rifa não pode ficar vazio.');
      return;
    }

    if (newPrice < 0.01) {
      setError('O valor unitário por cota deve ser de no mínimo R$ 0,01.');
      return;
    }

    const pixCheck = validatePixKey(pixKey, pixKeyType);
    if (!pixCheck.valid) {
      setError(pixCheck.error || 'Chave PIX inválida.');
      return;
    }

    if (phoneWhatsapp.trim()) {
      const phoneErr = getBrazilMobileError(phoneWhatsapp);
      if (phoneErr) {
        setError(phoneErr);
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updates: Partial<Raffle> = {
        title: title.trim(),
        description: description.trim(),
        ticket_price: newPrice,
        prize_image_url: prizeImageUrl || (prizeImages[0] ?? null),
        prize_images: prizeImages,
        draw_date: drawDate ? new Date(drawDate).toISOString() : null,
        pix_key: pixCheck.normalizedValue,
        pix_key_type: pixCheck.resolvedType,
        phone_whatsapp: phoneWhatsapp.trim()
          ? normalizeBrazilMobileDigits(phoneWhatsapp)
          : '',
        discount_config: normalizeDiscountConfig(discountConfig),
      };

      const result = await updateRaffleWithAudit({
        raffleId: raffle.id,
        updates,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || raffle.brand_name || null,
        },
      });

      if (!result.success) {
        setError(result.error || 'Erro ao salvar alterações.');
        setIsSubmitting(false);
        return;
      }

      const updatedRaffle: Raffle = {
        ...raffle,
        ...updates,
      };

      setSuccessMsg('Alterações salvas com sucesso! Registro de auditoria gerado.');
      setTimeout(() => {
        onSuccess(updatedRaffle);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar a rifa.';
      setError(msg);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-[0_24px_70px_rgba(13,23,41,0.25)] border border-[#E0E9F7] max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F9FF] border border-[#CDE0FC] flex items-center justify-center text-[#0869F5]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
              Editar Campanha da Rifa
            </h2>
            <p className="text-xs text-[#526480]">
              Todas as modificações geram um log de auditoria vinculado ao seu usuário.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold rounded-2xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A] mb-1.5">
              Título da Campanha *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-sm font-semibold text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A] mb-1.5">
              Descrição / Regulamento do Prêmio
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-xs text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
              placeholder="Descreva detalhes do prêmio, condições de entrega ou data do sorteio..."
            />
          </div>

          {/* Fotos do Prêmio (Múltiplas Fotos) */}
          <div className="pt-2 border-t border-[#E0E9F7]">
            <PrizeImageUploader
              value={prizeImageUrl}
              values={prizeImages}
              onChange={(primary, all) => {
                setPrizeImageUrl(primary);
                setPrizeImages(all);
              }}
              maxImages={5}
            />
          </div>

          {/* Valor por Cota */}
          <div className="pt-2 border-t border-[#E0E9F7] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A]">
                Valor Unitário por Cota (R$) *
              </label>
              {priceChanged && (
                <span className="text-[11px] font-bold text-[#D97706] bg-[#FFF8EB] border border-[#F5D08A] px-2 py-0.5 rounded-full">
                  Alteração de preço detectada
                </span>
              )}
            </div>

            <input
              type="number"
              step="0.01"
              min="0.01"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-base font-display font-bold text-[#0D1729] tabular-nums focus:outline-none focus:bg-white focus:border-[#0869F5]"
            />

            {hasPaidOrders && priceChanged && (
              <div className="p-3 bg-[#FFF8EB] border border-[#F5D08A] rounded-2xl flex items-start gap-2.5 text-xs text-[#92400E]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D97706]" />
                <div className="leading-snug">
                  <strong>Atenção:</strong> Esta rifa já possui cotas reservadas ou pagas. Alterar o valor por cota afetará os novos pedidos gerados daqui em diante. O histórico anterior será preservado e auditado.
                </div>
              </div>
            )}
          </div>

          {/* Data do Sorteio (Opcional) */}
          <div className="pt-2 border-t border-[#E0E9F7] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>Data Prevista do Sorteio</span>
              </label>
              <input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-xs font-semibold text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>WhatsApp de Contato (DDD + 9)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={15}
                value={phoneWhatsapp}
                onChange={(e) => setPhoneWhatsapp(formatBrazilMobile(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-xs font-semibold text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
              />
            </div>
          </div>

          {/* Dados do PIX */}
          <div className="pt-2 border-t border-[#E0E9F7] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A] mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>Tipo de Chave</span>
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => {
                  const nextType = e.target.value as PixKeyType;
                  setPixKeyType(nextType);
                  setPixKey((prev) => {
                    if (nextType === 'cpf' || nextType === 'cnpj' || nextType === 'phone') {
                      const d = onlyDigits(prev);
                      return d ? formatPixKeyInput(d, nextType) : '';
                    }
                    if (nextType === 'email') {
                      return prev.includes('@') ? formatPixKeyInput(prev, 'email') : '';
                    }
                    return prev;
                  });
                }}
                className="w-full px-3 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-xs font-semibold text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="phone">Celular</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14213A] mb-1.5">
                Chave PIX de Recebimento
              </label>
              <input
                type="text"
                inputMode={
                  pixKeyType === 'cpf' || pixKeyType === 'cnpj' || pixKeyType === 'phone'
                    ? 'numeric'
                    : pixKeyType === 'email'
                    ? 'email'
                    : 'text'
                }
                value={pixKey}
                onChange={(e) => setPixKey(formatPixKeyInput(e.target.value, pixKeyType))}
                placeholder={
                  pixKeyType === 'cpf'
                    ? '000.000.000-00'
                    : pixKeyType === 'cnpj'
                    ? '00.000.000/0000-00'
                    : pixKeyType === 'phone'
                    ? '(11) 99999-9999'
                    : pixKeyType === 'email'
                    ? 'seu@email.com'
                    : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
                required
                className="w-full px-4 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-2xl text-xs font-semibold text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
              />
            </div>
          </div>

          {/* Descontos para Múltiplos Bilhetes */}
          <div className="pt-3 border-t border-[#E0E9F7]">
            <DiscountConfigEditor
              value={discountConfig}
              onChange={setDiscountConfig}
              unitPrice={newPrice}
              compact
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E0E9F7] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="ora-btn-secondary w-full sm:w-auto px-5 py-3 rounded-full text-xs font-bold cursor-pointer justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ora-btn-primary w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando com Auditoria...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
