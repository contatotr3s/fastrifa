'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { processLogoImage, generateBrandInitials } from '@/lib/image-processor';
import {
  formatCpf,
  getCpfError,
  formatBirthDate,
  getBirthDateError,
  parseBirthDateToIso,
  getEmailError,
  formatBrazilMobile,
  getBrazilMobileError,
  normalizeBrazilMobileDigits,
  formatPixKeyInput,
  validatePixKey,
  onlyDigits,
} from '@/lib/validators';
import { OrganizerSignupTermsModal } from '@/components/terms-modals';
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
  Calendar,
} from 'lucide-react';

type OnboardingPixType = 'cpf_cnpj' | 'phone' | 'email' | 'random';

interface OnboardingFieldErrors {
  brandName?: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  pixKey?: string;
  terms?: string;
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
  const [birthDate, setBirthDate] = useState(formatBirthDate(profile?.birth_date || ''));
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
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(
    Boolean(profile?.organizer_terms_accepted)
  );
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
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
    setBirthDate((prev) => prev || formatBirthDate(profile?.birth_date || ''));
    setEmail((prev) => prev || profile?.email || user?.email || '');
    setPhone((prev) => prev || formatBrazilMobile(profile?.phone_whatsapp || ''));
    setPixType(hydratedPixType);
    setPixKey((prev) =>
      prev || formatPixKeyInput(profile?.pix_key || '', hydratedPixType)
    );
    setLogoPreview((prev) => prev || profile?.brand_logo_url || null);
    if (profile?.organizer_terms_accepted) {
      setAcceptedTerms(true);
    }
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

    const birthDateErr = getBirthDateError(birthDate);
    if (birthDateErr) {
      nextErrors.birthDate = birthDateErr;
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

    if (!acceptedTerms) {
      nextErrors.terms =
        'Você precisa ler e aceitar o Termo de Uso e Adesão do Organizador para continuar.';
    }

    setFieldErrors(nextErrors);

    const firstInvalidId = nextErrors.brandName
      ? 'onboarding-brand'
      : nextErrors.cpf
      ? 'onboarding-cpf'
      : nextErrors.birthDate
      ? 'onboarding-birthdate'
      : nextErrors.email
      ? 'onboarding-email'
      : nextErrors.phone
      ? 'onboarding-phone'
      : nextErrors.pixKey
      ? 'onboarding-pix'
      : nextErrors.terms
      ? 'onboarding-terms'
      : null;

    if (firstInvalidId) {
      if (typeof document !== 'undefined') {
        const el = document.getElementById(firstInvalidId);
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        brand_name: cleanBrand,
        brand_initials: currentInitials,
        cpf: onlyDigits(cpf),
        birth_date: parseBirthDateToIso(birthDate),
        email: cleanEmail,
        phone_whatsapp: normalizeBrazilMobileDigits(phone),
        pix_key: pixCheck.normalizedValue,
        pix_key_type: pixCheck.resolvedType,
        brand_logo_url: logoPreview,
        brand_color: 'green',
        organizer_terms_accepted: true,
        organizer_terms_accepted_at: new Date().toISOString(),
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

          {/* 2. CPF e 3. Data de Nascimento do Responsável (Obrigatórios) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  onBlur={() => {
                    if (cpf.trim()) {
                      const cpfErr = getCpfError(cpf);
                      if (cpfErr) {
                        setFieldErrors((prev) => ({ ...prev, cpf: cpfErr }));
                      }
                    }
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
            </div>

            <div className="space-y-2">
              <label
                htmlFor="onboarding-birthdate"
                className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
              >
                3. Data de Nascimento *
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
                <input
                  id="onboarding-birthdate"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(formatBirthDate(e.target.value));
                    clearFieldError('birthDate');
                  }}
                  onBlur={() => {
                    if (birthDate.trim()) {
                      const bdErr = getBirthDateError(birthDate);
                      if (bdErr) {
                        setFieldErrors((prev) => ({ ...prev, birthDate: bdErr }));
                      }
                    }
                  }}
                  placeholder="DD/MM/AAAA"
                  className={getInputStateClass(fieldErrors.birthDate)}
                />
              </div>
              {fieldErrors.birthDate && (
                <p className="text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.birthDate}</span>
                </p>
              )}
            </div>
          </div>
          <p className="-mt-3 text-xs text-[#526480]">
            CPF válido e data de nascimento (+18 anos) são obrigatórios para validação cadastral, prevenção a fraudes e titularidade da conta.
          </p>

          {/* 4. E-mail Oficial */}
          <div className="space-y-2">
            <label
              htmlFor="onboarding-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
            >
              4. E-mail Oficial *
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
                onBlur={() => {
                  if (email.trim()) {
                    const emailErr = getEmailError(email);
                    if (emailErr) {
                      setFieldErrors((prev) => ({ ...prev, email: emailErr }));
                    }
                  }
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

          {/* 5. Celular / WhatsApp Oficial */}
          <div className="space-y-2">
            <label
              htmlFor="onboarding-phone"
              className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]"
            >
              5. Celular / WhatsApp Oficial (DDD + 9) *
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
                onBlur={() => {
                  if (phone.trim()) {
                    const phoneErr = getBrazilMobileError(phone);
                    if (phoneErr) {
                      setFieldErrors((prev) => ({ ...prev, phone: phoneErr }));
                    }
                  }
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
                6. Chave PIX para Recebimento *
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
                onBlur={() => {
                  if (pixKey.trim()) {
                    const pixCheck = validatePixKey(pixKey, pixType);
                    if (!pixCheck.valid && pixCheck.error) {
                      setFieldErrors((prev) => ({ ...prev, pixKey: pixCheck.error }));
                    }
                  }
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

          {/* 7. Logo da Marca (Opcional) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              7. Logotipo ou Imagem da Marca (Opcional)
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

          {/* Termo de Uso e Adesão do Organizador (Aceite Obrigatório) */}
          <div className="p-4 sm:p-5 rounded-[20px] bg-[#F5F9FF] border border-[#CDE0FC]">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                id="onboarding-terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  clearFieldError('terms');
                }}
                className="mt-0.5 w-5 h-5 rounded-[6px] text-[#00A868] accent-[#00A868] border-[#D9E5F7] focus:ring-[#00A868] cursor-pointer flex-shrink-0"
              />
              <div className="text-xs text-[#334661] leading-relaxed">
                <span>Declaro que os dados informados (incluindo CPF e data de nascimento) são verdadeiros e que li e concordo integralmente com o </span>
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="font-bold text-[#00A868] underline underline-offset-2 hover:text-[#047857] inline transition cursor-pointer text-left"
                >
                  Termo de Uso e Adesão do Organizador (Cadastro de Conta — FastRifa)
                </button>
                <span>
                  , assumindo integral responsabilidade pelas campanhas que vier a publicar.
                </span>
              </div>
            </label>
            {fieldErrors.terms && (
              <p className="mt-2.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.terms}</span>
              </p>
            )}
          </div>

          <OrganizerSignupTermsModal
            isOpen={isTermsModalOpen}
            onClose={() => setIsTermsModalOpen(false)}
            onAccept={() => {
              setAcceptedTerms(true);
              clearFieldError('terms');
            }}
          />

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
