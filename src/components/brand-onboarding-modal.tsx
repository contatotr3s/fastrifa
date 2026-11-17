'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { processLogoImage, generateBrandInitials } from '@/lib/image-processor';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  X,
  Store,
  QrCode,
  Phone,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface BrandOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isEditMode?: boolean;
}

export default function BrandOnboardingModal({
  isOpen,
  onClose,
  isEditMode = false,
}: BrandOnboardingModalProps) {
  const { profile, updateProfile } = useAuth();

  const [brandName, setBrandName] = useState(
    profile?.brand_name || profile?.full_name || ''
  );
  const [phone, setPhone] = useState(profile?.phone_whatsapp || '');
  const [pixKey, setPixKey] = useState(profile?.pix_key || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(
    profile?.brand_logo_url || null
  );
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentInitials = generateBrandInitials(brandName || 'Sua Rifa');

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessingLogo(true);
    try {
      const processedBase64 = await processLogoImage(file, 512);
      setLogoPreview(processedBase64);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar a logo.';
      setError(msg);
    } finally {
      setIsProcessingLogo(false);
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) {
      setError('Por favor, informe o nome da sua marca ou negócio.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateProfile({
        brand_name: brandName.trim(),
        brand_logo_url: logoPreview,
        brand_initials: currentInitials,
        phone_whatsapp: phone.trim() || profile?.phone_whatsapp,
        pix_key: pixKey.trim() || null,
        onboarding_completed: true,
      });

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar as configurações da marca.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1729]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[620px] bg-white rounded-[32px] p-6 sm:p-9 shadow-[0_24px_70px_rgba(13,23,41,0.22)] border border-[#E0E9F7] max-h-[92vh] overflow-y-auto">
        {/* Close button if in edit mode */}
        {isEditMode && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF5FF] text-[#0869F5] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Personalização da Marca' : 'Boas-vindas ao FastRifa'}</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
            {isEditMode ? 'Editar Sua Marca' : 'Identidade do seu Negócio'}
          </h2>
          <p className="text-sm text-[#475872]">
            Dê o seu nome e a sua marca para o painel e para todas as páginas de rifas que você criar.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs rounded-[16px] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              Nome da Sua Marca / Empreendimento *
            </label>
            <div className="relative">
              <Store className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                type="text"
                required
                placeholder="Ex: Freire Rifas, Prêmios do Silva..."
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[18px] text-sm font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none focus:border-[#0869F5] transition"
              />
            </div>
            <p className="text-[11px] text-[#526480]">
              Este nome aparecerá no cabeçalho das suas campanhas como o organizador oficial.
            </p>
          </div>

          {/* Logo Upload & Preview Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              Logo da Marca (Opcional)
            </label>

            <div className="p-4 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[22px] flex flex-col sm:flex-row items-center gap-5">
              {/* Visual Avatar / Logo Preview */}
              <div className="relative w-24 h-24 rounded-[22px] overflow-hidden bg-white border border-[#D9E5F7] shadow-sm flex items-center justify-center flex-shrink-0">
                {isProcessingLogo ? (
                  <Loader2 className="w-6 h-6 text-[#0869F5] animate-spin" />
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview da Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white">
                    <span className="font-display font-bold text-2xl tracking-tighter">
                      {currentInitials}
                    </span>
                    <span className="text-[9px] uppercase font-bold opacity-80 mt-0.5">
                      Iniciais
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="brand-logo-file"
                  />
                  <label
                    htmlFor="brand-logo-file"
                    className="ora-btn-secondary px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoPreview ? 'Trocar Logo' : 'Carregar Imagem'}</span>
                  </label>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 text-xs font-bold text-[#BE123C] hover:bg-[#FFF1F2] rounded-full transition cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#526480] leading-snug">
                  Aceita qualquer formato. Redimensionamos e otimizamos automaticamente em <strong>512x512 px</strong>. Se não tiver logo, usamos seu emblema com iniciais.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Defaults (PIX & WhatsApp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
                WhatsApp de Suporte
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-[#526480]" />
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[16px] text-xs font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none focus:border-[#0869F5]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
                Chave PIX Principal
              </label>
              <div className="relative">
                <QrCode className="w-4 h-4 absolute left-3.5 top-3.5 text-[#526480]" />
                <input
                  type="text"
                  placeholder="CPF, E-mail ou Celular"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[16px] text-xs font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none focus:border-[#0869F5]"
                />
              </div>
            </div>
          </div>

          {/* Live Badge Preview */}
          <div className="p-4 rounded-[20px] bg-[#FFFFFF] border border-[#D9E5F7] shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white flex-shrink-0 shadow-sm">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-sm">{currentInitials}</span>
                )}
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#0869F5]">
                  Visualização da Marca
                </span>
                <strong className="block text-sm font-display font-bold text-[#0D1729] leading-tight">
                  {brandName.trim() || 'Nome da Sua Marca'}
                </strong>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EBF3FF] text-[#0869F5] text-[11px] font-bold uppercase tracking-wider border border-[#CDE0FC]">
              Campanha Oficial
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || isProcessingLogo}
              className="ora-btn-primary w-full py-4 rounded-[18px] text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Marca...</span>
                </>
              ) : (
                <>
                  <span>Salvar e Ativar Minha Marca</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
