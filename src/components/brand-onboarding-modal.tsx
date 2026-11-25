'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { processLogoImage, generateBrandInitials } from '@/lib/image-processor';
import {
  Sparkles,
  Upload,
  X,
  Store,
  QrCode,
  Phone,
  ArrowRight,
  Loader2,
  Mail,
  ShieldCheck,
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
  const { user, profile, updateProfile } = useAuth();

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

  // Sincroniza campos sempre que o modal abrir ou o perfil atualizar
  useEffect(() => {
    if (isOpen && profile) {
      setBrandName(profile.brand_name || profile.full_name || '');
      setPhone(profile.phone_whatsapp || '');
      setPixKey(profile.pix_key || '');
      setLogoPreview(profile.brand_logo_url || null);
      setError(null);
    }
  }, [isOpen, profile]);

  // Trava rolagem do fundo para que o modal role naturalmente como página inteira
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const accountEmail = user?.email || profile?.email || 'E-mail não identificado';
  const providerData = (
    user as { providerData?: Array<{ providerId?: string }> } | null
  )?.providerData;
  const isGoogleSignup =
    profile?.auth_provider === 'google' ||
    Boolean(providerData?.some((p) => p?.providerId === 'google.com'));

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0D1729]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-[620px] my-4 sm:my-6 bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-[0_24px_70px_rgba(13,23,41,0.22)] border border-[#E0E9F7]">
          {/* Close button if in edit mode */}
          {isEditMode && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal da marca"
              className="absolute top-5 right-5 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Modal Header */}
          <div className="space-y-2 mb-5 pr-8">
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

          {/* Dados da Conta Cadastrada (E-mail + Método de Cadastro) */}
          <div className="mb-6 p-3.5 sm:p-4 rounded-[18px] bg-[#F5F9FF] border border-[#DCE8F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center flex-shrink-0 shadow-xs">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#526480]">
                  E-mail cadastrado
                </span>
                <strong className="block text-xs sm:text-sm font-bold text-[#0D1729] truncate">
                  {accountEmail}
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-0.5 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480]">
                Tipo de cadastro
              </span>
              {isGoogleSignup ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D9E5F7] text-[#0D1729] text-xs font-bold shadow-xs w-fit">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.23 1.18-3.25 0-6.01-2.19-7-5.15H1v3.14C3.03 21.2 7.21 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5 14.02c-.25-.74-.39-1.54-.39-2.36s.14-1.62.39-2.36V6.16H1C.36 7.44 0 8.87 0 10.36c0 1.49.36 2.92 1 4.2l4-2.54z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.03 2.8 1 6.86l4 3.14c.99-2.96 3.75-5.25 7-5.25z"
                    />
                  </svg>
                  <span>Via Google</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D9E5F7] text-[#0869F5] text-xs font-bold shadow-xs w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Via E-mail e Senha</span>
                </span>
              )}
            </div>
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
          <div className="p-3.5 sm:p-4 rounded-[18px] sm:rounded-[20px] bg-[#FFFFFF] border border-[#D9E5F7] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
    </div>
  );
}
