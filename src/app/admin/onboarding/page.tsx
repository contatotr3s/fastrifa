'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { processLogoImage, generateBrandInitials } from '@/lib/image-processor';
import {
  formatCpf,
  getCpfError,
  getEmailError,
  formatBrazilMobile,
  getBrazilMobileError,
  normalizeBrazilMobileDigits,
  formatPixKeyInput,
  validatePixKey,
  onlyDigits,
} from '@/lib/validators';
import {
  Sparkles,
  Store,
  Phone,
  QrCode,
  ArrowRight,
  Loader2,
  Upload,
  ShieldCheck,
  AlertCircle,
  Mail,
  FileText,
} from 'lucide-react';

type OnboardingPixType = 'cpf_cnpj' | 'phone' | 'email' | 'random';

interface OnboardingFieldErrors {
  brandName?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  pixKey?: string;
}

function mapProfilePixType(
  pixKeyType?: string | null
): OnboardingPixType {
  if (pixKeyType === 'cpf' || pixKeyType === 'cnpj') return 'cpf_cnpj';
  if (pixKeyType === 'phone') return 'phone';
  if (pixKeyType === 'email') return 'email';
  return 'cpf_cnpj';
}

export default function OnboardingPage() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();

  const initialPixType = mapProfilePixType(profile?.pix_key_type);

  const [brandName, setBrandName] = useState(profile?.brand_name || '');
  const [cpf, setCpf] = useState(formatCpf(profile?.cpf || ''));
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(
    formatBrazilMobile(profile?.phone_whatsapp || '')
  );
  const [pixType, setPixType] = useState<OnboardingPixType>(initialPixType);
  const [pixKey, setPixKey] = useState(
    formatPixKeyInput(profile?.pix_key || '', initialPixType)
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    profile?.brand_logo_url || null
  );
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({});

  const didHydrateRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (didHydrateRef.current) return;
    if (!user && !profile) return;

    didHydrateRef.current = true;
    const hydratedPixType = mapProfilePixType(profile?.pix_key_type);
    setBrandName((prev) => prev || profile?.brand_name || '');
    setCpf((prev) => prev || formatCpf(profile?.cpf || ''));
    setEmail((prev) => prev || profile?.email || user?.email || '');
    setPhone((prev) => prev || formatBrazilMobile(profile?.phone_whatsapp || ''));
    setPixType(hydratedPixType);
    setPixKey((prev) =>
      prev || formatPixKeyInput(profile?.pix_key || '', hydratedPixType)
    );
    setLogoPreview((prev) => prev || profile?.brand_logo_url || null);
  }, [user, profile]);

  const currentInitials = generateBrandInitials(brandName || 'Sua Marca');

  function clearFieldError(field: keyof OnboardingFieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) setError(null);
  }

  function handlePixTypeChange(nextType: OnboardingPixType) {
    setPixType(nextType);
    setPixKey((prev) => {
      if (nextType === 'cpf_cnpj' || nextType === 'phone') {
        const digits = onlyDigits(prev);
        return digits ? formatPixKeyInput(digits, nextType) : '';
      }
      if (nextType === 'email') {
        return prev.includes('@') ? formatPixKeyInput(prev, 'email') : '';
      }
      return prev;
    });
    clearFieldError('pixKey');
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessingLogo(true);
    try {
      const processed = await processLogoImage(file, 512);
      setLogoPreview(processed);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao processar imagem da logo.';
      setError(msg);
    } finally {
      setIsProcessingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nextErrors: OnboardingFieldErrors = {};
    const cleanBrand = brandName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanBrand || cleanBrand.length < 3) {
      nextErrors.brandName =
        'Informe o nome da sua marca ou negócio (mínimo 3 caracteres).';
    }

    const cpfErr = getCpfError(cpf);
    if (cpfErr) {
      nextErrors.cpf = cpfErr;
    }

    const emailErr = getEmailError(cleanEmail);
    if (emailErr) {
      nextErrors.email = emailErr;
    }

    const phoneErr = getBrazilMobileError(phone);
    if (phoneErr) {
      nextErrors.phone = phoneErr;
    }

    const pixCheck = validatePixKey(pixKey, pixType);
    if (!pixCheck.valid) {
      nextErrors.pixKey = pixCheck.error || 'Chave PIX inválida.';
    }

    setFieldErrors(nextErrors);

    const firstError =
      nextErrors.brandName ||
      nextErrors.cpf ||
      nextErrors.email ||
      nextErrors.phone ||
      nextErrors.pixKey;

    if (firstError) {
      setError(firstError);
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        brand_name: cleanBrand,
        brand_initials: currentInitials,
        cpf: onlyDigits(cpf),
        email: cleanEmail,
        phone_whatsapp: normalizeBrazilMobileDigits(phone),
        pix_key: pixCheck.normalizedValue,
        pix_key_type: pixCheck.resolvedType,
        brand_logo_url: logoPreview,
        onboarding_completed: true,
      });

      router.push('/admin');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Não foi possível salvar os dados da sua marca. Tente novamente.');
      setLoading(false);
    }
  }

  const inputBaseClass =
    'w-full pl-12 pr-4 py-3.5 rounded-[18px] text-[15px] font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none transition';

  function getInputStateClass(hasError?: string) {
    return hasError
      ? `${inputBaseClass} bg-[#FFF5F6] border-2 border-[#BE123C] focus:border-[#BE123C]`
      : `${inputBaseClass} bg-[#F5F9FF] border border-[#D9E5F7] focus:border-[#0869F5]`;
  }

  return (
    <div className="max-w-[720px] mx-auto py-6 sm:py-10">
      {/* Intro Header */}
      <div className="text-center mb-8 sm:mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3FF] border border-[#CDE0FC] text-[#0755DE] text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-[#0869F5]" />
          <span>Passo Obrigatório · Setup da sua Marca</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D1729] tracking-[-0.04em]">
          Cadastre sua Marca ou Negócio
        </h1>
        <p className="text-sm sm:text-base text-[#475872] max-w-xl mx-auto">
          No FastRifa, você opera com a sua própria marca (white-label) e recebe o pagamento das cotas direto no seu PIX, sem taxas de intermediação.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="ora-card rounded-[32px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(13,23,41,0.08)] border border-[#E0E9F7]">
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[18px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-semibold flex items-center gap-2.5"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* 1. Nome da Marca */}
          <div className="space-y-2">
            <label
              htmlFor="onboarding-brand"
              className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
            >
              1. Nome da sua Marca / Empresa *
            </label>
            <div className="relative">
              <Store className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                id="onboarding-brand"
                type="text"
                required
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value);
                  clearFieldError('brandName');
                }}
                placeholder="Ex: Danilo Prêmios, Rifa Entre Amigos, Sorteios do Vale..."
                className={getInputStateClass(fieldErrors.brandName)}
              />
            </div>
            {fieldErrors.brandName && (
              <p className="text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.brandName}</span>
              </p>
            )}
            <p className="text-xs text-[#526480]">
              Este nome será o organizador oficial exibido no cabeçalho das suas rifas e nos bilhetes emitidos.
            </p>
          </div>

          {/* 2. CPF do Responsável */}
          <div className="space-y-2">
            <label
              htmlFor="onboarding-cpf"
              className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
            >
              2. CPF do Responsável *
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                id="onboarding-cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                required
                value={cpf}
                onChange={(e) => {
                  setCpf(formatCpf(e.target.value));
                  clearFieldError('cpf');
                }}
                placeholder="000.000.000-00"
                className={getInputStateClass(fieldErrors.cpf)}
              />
            </div>
            {fieldErrors.cpf && (
              <p className="text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.cpf}</span>
              </p>
            )}
            <p className="text-xs text-[#526480]">
              Exigido para validação de titularidade, segurança das campanhas e trilha de auditoria.
            </p>
          </div>

          {/* 3. E-mail Oficial */}
          <div className="space-y-2">
            <label
              htmlFor="onboarding-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
            >
              3. E-mail Oficial *
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                id="onboarding-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="seu@email.com"
                className={getInputStateClass(fieldErrors.email)}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
            <p className="text-xs text-[#526480]">
              E-mail de contato oficial para notificações, recuperação de acesso e registros da conta.
            </p>
          </div>

          {/* 4. Celular / WhatsApp Oficial */}
          <div className="space-y-2">
            <label
              htmlFor="onboarding-phone"
              className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
            >
              4. Celular / WhatsApp Oficial (DDD + 9) *
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                id="onboarding-phone"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                required
                value={phone}
                onChange={(e) => {
                  setPhone(formatBrazilMobile(e.target.value));
                  clearFieldError('phone');
                }}
                placeholder="(11) 99999-9999"
                className={getInputStateClass(fieldErrors.phone)}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.phone}</span>
              </p>
            )}
            <p className="text-xs text-[#526480]">
              Seus compradores usarão este celular com DDD e dígito 9 para tirar dúvidas e enviar comprovantes.
            </p>
          </div>

          {/* 5. Chave PIX Oficial */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <label
                htmlFor="onboarding-pix"
                className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
              >
                5. Chave PIX para Recebimento *
              </label>
              <div className="flex flex-wrap gap-1">
                {(['cpf_cnpj', 'phone', 'email', 'random'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handlePixTypeChange(t)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                      pixType === t
                        ? 'bg-[#0869F5] text-white'
                        : 'bg-[#F0F4FA] text-[#526480] hover:bg-[#E3EBF7]'
                    }`}
                  >
                    {t === 'cpf_cnpj' && 'CPF/CNPJ'}
                    {t === 'phone' && 'Celular'}
                    {t === 'email' && 'E-mail'}
                    {t === 'random' && 'Aleatória'}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <QrCode className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                id="onboarding-pix"
                type="text"
                inputMode={
                  pixType === 'cpf_cnpj' || pixType === 'phone'
                    ? 'numeric'
                    : pixType === 'email'
                    ? 'email'
                    : 'text'
                }
                required
                value={pixKey}
                onChange={(e) => {
                  setPixKey(formatPixKeyInput(e.target.value, pixType));
                  clearFieldError('pixKey');
                }}
                placeholder={
                  pixType === 'random'
                    ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                    : pixType === 'cpf_cnpj'
                    ? '000.000.000-00 ou 00.000.000/0000-00'
                    : pixType === 'phone'
                    ? '(11) 99999-9999'
                    : 'seu@email.com'
                }
                className={getInputStateClass(fieldErrors.pixKey)}
              />
            </div>
            {fieldErrors.pixKey && (
              <p className="text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.pixKey}</span>
              </p>
            )}
            <p className="text-xs text-[#526480]">
              Todas as compras de cotas gerarão pagamento PIX apontando diretamente para esta sua conta bancária.
            </p>
          </div>

          {/* 6. Logo da Marca (Opcional) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              6. Logotipo ou Imagem da Marca (Opcional)
            </label>
            <div className="p-4 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[22px] flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-20 h-20 rounded-[20px] overflow-hidden bg-white border border-[#D9E5F7] shadow-sm flex items-center justify-center flex-shrink-0">
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
                    <span className="font-display font-bold text-xl tracking-tighter">
                      {currentInitials}
                    </span>
                    <span className="text-[8px] uppercase font-bold opacity-80 mt-0.5">
                      Iniciais
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                  id="onboarding-logo-file"
                />
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <label
                    htmlFor="onboarding-logo-file"
                    className="ora-btn-primary rounded-full px-4 py-2 inline-flex items-center gap-2 text-xs font-bold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoPreview ? 'Trocar Logotipo' : 'Enviar Imagem / Logo'}</span>
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="px-3 py-2 text-xs font-semibold text-[#BE123C] hover:bg-[#FFF1F2] rounded-full transition cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#526480]">
                  Recomendado: imagem quadrada (PNG ou JPG). Se não enviar, geramos as iniciais automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-4 rounded-[20px] bg-[#F2F7FF] border border-[#CDE0FC] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0869F5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#334661] leading-relaxed">
              Você é o organizador responsável pelas suas campanhas. As cotas vendidas não passam por custódia do FastRifa: o dinheiro cai 100% líquido na sua conta bancária via chave PIX informada.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full ora-btn-primary py-4 px-6 rounded-[20px] font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(8,105,245,0.25)] hover:shadow-[0_12px_32px_rgba(8,105,245,0.35)] transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando e liberando seu painel...</span>
              </>
            ) : (
              <>
                <span>Salvar Marca e Acessar Meu Painel</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
