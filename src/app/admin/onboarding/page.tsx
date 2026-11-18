'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { processLogoImage, generateBrandInitials } from '@/lib/image-processor';
import {
  Sparkles,
  Store,
  Phone,
  QrCode,
  ArrowRight,
  Loader2,
  Upload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function OnboardingPage() {
  const { profile, updateProfile } = useAuth();
  const router = useRouter();

  const [brandName, setBrandName] = useState(profile?.brand_name || '');
  const [phone, setPhone] = useState(profile?.phone_whatsapp || '');
  const [pixKey, setPixKey] = useState(profile?.pix_key || '');
  const [pixType, setPixType] = useState<'random' | 'cpf_cnpj' | 'phone' | 'email'>('random');
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.brand_logo_url || null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentInitials = generateBrandInitials(brandName || 'Sua Marca');

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
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
      const msg = err instanceof Error ? err.message : 'Falha ao processar imagem da logo.';
      setError(msg);
    } finally {
      setIsProcessingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanBrand = brandName.trim();
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    const cleanPix = pixKey.trim();

    if (!cleanBrand || cleanBrand.length < 3) {
      setError('Por favor, informe o nome da sua marca ou negócio (mínimo 3 caracteres).');
      return;
    }

    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      setError('Por favor, informe um WhatsApp oficial válido com DDD para contato.');
      return;
    }

    if (!cleanPix || cleanPix.length < 4) {
      setError('Por favor, informe a Chave PIX oficial onde você receberá o valor das cotas.');
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        brand_name: cleanBrand,
        brand_initials: currentInitials,
        phone_whatsapp: cleanPhoneDigits,
        pix_key: cleanPix,
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
          <div className="mb-6 p-4 rounded-[18px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* 1. Nome da Marca */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              1. Nome da sua Marca / Empresa *
            </label>
            <div className="relative">
              <Store className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex: Danilo Prêmios, Rifa Entre Amigos, Sorteios do Vale..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[18px] text-[15px] font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none focus:border-[#0869F5] transition"
              />
            </div>
            <p className="text-xs text-[#526480]">
              Este nome será o organizador oficial exibido no cabeçalho das suas rifas e nos bilhetes emitidos.
            </p>
          </div>

          {/* 2. WhatsApp Oficial */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              2. WhatsApp Oficial de Contato / Suporte *
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full pl-12 pr-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[18px] text-[15px] font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none focus:border-[#0869F5] transition"
              />
            </div>
            <p className="text-xs text-[#526480]">
              Seus compradores usarão este número para tirar dúvidas sobre as cotas e enviar comprovantes.
            </p>
          </div>

          {/* 3. Chave PIX Oficial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
                3. Chave PIX para Recebimento *
              </label>
              <div className="flex gap-1">
                {(['random', 'cpf_cnpj', 'phone', 'email'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPixType(t)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                      pixType === t
                        ? 'bg-[#0869F5] text-white'
                        : 'bg-[#F0F4FA] text-[#526480] hover:bg-[#E3EBF7]'
                    }`}
                  >
                    {t === 'random' && 'Aleatória'}
                    {t === 'cpf_cnpj' && 'CPF/CNPJ'}
                    {t === 'phone' && 'Telefone'}
                    {t === 'email' && 'E-mail'}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <QrCode className="w-5 h-5 absolute left-4 top-3.5 text-[#526480]" />
              <input
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={
                  pixType === 'random'
                    ? 'Cole sua chave aleatória (UUID)...'
                    : pixType === 'cpf_cnpj'
                    ? 'Digite seu CPF ou CNPJ...'
                    : pixType === 'phone'
                    ? 'Digite o telefone cadastrado no PIX...'
                    : 'Digite seu e-mail cadastrado no PIX...'
                }
                className="w-full pl-12 pr-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[18px] text-[15px] font-semibold text-[#0D1729] placeholder-[#8A9BB3] focus:bg-white focus:outline-none focus:border-[#0869F5] transition"
              />
            </div>
            <p className="text-xs text-[#526480]">
              Todas as compras de cotas gerarão pagamento PIX apontando diretamente para esta sua conta bancária.
            </p>
          </div>

          {/* 4. Logo da Marca (Opcional) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
              4. Logotipo ou Imagem da Marca (Opcional)
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
