'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { PlatformTermsModal } from '@/components/terms-modals';
import {
  formatBrazilMobile,
  getBrazilMobileError,
  getEmailError,
  normalizeBrazilMobileDigits,
} from '@/lib/validators';
import {
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, profile, loading: authLoading, signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) return;

    const userEmail = user.email?.toLowerCase().trim() || '';
    const isMasterUser = userEmail === MASTER_EMAIL || profile?.role === 'master';

    if (isMasterUser) {
      router.replace('/admin/master');
      return;
    }

    // Aguarda o perfil do Firestore carregar antes de decidir entre Painel e Onboarding
    if (!profile) return;

    if (profile.onboarding_completed && profile.brand_name?.trim()) {
      router.replace('/admin');
    } else {
      router.replace('/admin/onboarding');
    }
  }, [user, profile, authLoading, router]);

  function validateSignupForm(): boolean {
    const errors: FormErrors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 3) {
      errors.fullName = 'Informe seu nome completo ou razão social (mínimo 3 letras).';
    }

    const phoneErr = getBrazilMobileError(phone);
    if (phoneErr) {
      errors.phone = phoneErr;
    }

    const emailErr = getEmailError(trimmedEmail);
    if (emailErr) {
      errors.email = emailErr;
    }

    if (!password) {
      errors.password = 'Crie uma senha de acesso.';
    } else if (password.length < 6) {
      errors.password = 'A senha deve conter pelo menos 6 caracteres.';
    }

    if (!acceptedTerms) {
      errors.terms = 'Você deve aceitar os Termos de Uso e Privacidade para prosseguir.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateSignupForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await signup(
        fullName.trim(),
        normalizeBrazilMobileDigits(phone),
        email.trim().toLowerCase(),
        password
      );

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.isMaster) {
        router.push('/admin/master');
      } else {
        // Redirecionamento obrigatório para configuração da marca
        router.push('/admin/onboarding');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Ocorreu um erro ao criar a conta. Tente novamente.');
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    setFieldErrors({});

    // Marca aceitação dos termos automaticamente ao escolher continuar com o Google
    if (!acceptedTerms) {
      setAcceptedTerms(true);
    }

    setGoogleLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result.error) {
        setError(result.error);
        setGoogleLoading(false);
      } else if (result.isMaster) {
        router.push('/admin/master');
      } else if (result.needsOnboarding) {
        // Redirecionamento obrigatório para novo cadastro via Google
        router.push('/admin/onboarding');
      } else {
        router.push('/admin');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Não foi possível conectar com o Google no momento.');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[460px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="ora-glass-pill rounded-full h-11 sm:h-12 px-3 sm:px-4 inline-flex items-center justify-center mb-5 hover:border-[#B9D3F8] transition"
          >
            {/* Desktop: Logo completa */}
            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-8 sm:h-[38px] w-auto object-contain hidden sm:block"
            />
            {/* Mobile celular: Logo responsiva */}
            <img
              src="/icone-mobile-fastrifa.png"
              alt="Fast Rifa"
              className="h-[30px] sm:h-8 w-auto object-contain block sm:hidden"
            />
          </Link>

          <h1 className="font-display font-bold text-3xl tracking-[-0.04em] text-[#0D1729]">
            Crie sua conta grátis.
          </h1>
          <p className="text-[15px] text-[#475872] mt-2">
            Pra você criar sua rifa em 2 minutos, divulgar no zap e receber direto no PIX.
          </p>
        </div>

        {/* Card Form */}
        <div className="ora-card rounded-[28px] p-7 sm:p-9">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-medium rounded-[16px] flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#BE123C]" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full mb-5 py-3.5 px-4 rounded-[18px] bg-white border border-[#D9E5F7] hover:border-[#B9D3F8] hover:bg-[#F8FBFF] text-sm font-bold text-[#0D1729] shadow-sm flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 text-[#0869F5] animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Cadastrar com o Google</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[#E0E9F7] w-full" />
            <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-[#8A9BB3] absolute">
              ou preencha os dados
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="fullName"
              >
                Seu Nome ou Nome da Organização
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                  if (error) setError(null);
                }}
                placeholder="Ex: João da Silva"
                className={`w-full px-4 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] transition focus:outline-none ${
                  fieldErrors.fullName
                    ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                    : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="phone"
              >
                WhatsApp com DDD
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                value={phone}
                onChange={(e) => {
                  const formatted = formatBrazilMobile(e.target.value);
                  setPhone(formatted);
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                  if (error) setError(null);
                }}
                placeholder="(11) 99999-9999"
                className={`w-full px-4 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] transition focus:outline-none ${
                  fieldErrors.phone
                    ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                    : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                  if (error) setError(null);
                }}
                autoComplete="email"
                placeholder="seu@email.com"
                className={`w-full px-4 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] transition focus:outline-none ${
                  fieldErrors.email
                    ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                    : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password with Visibility Toggle */}
            <div>
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (error) setError(null);
                  }}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-4 pr-12 py-3.5 rounded-[16px] text-[#0D1729] placeholder-[#526480] text-[15px] transition focus:outline-none ${
                    fieldErrors.password
                      ? 'bg-[#FFF5F6] border-2 border-[#BE123C] ring-2 ring-[#BE123C]/20'
                      : 'bg-[#F5F9FF] border border-[#D9E5F7] focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[#526480] hover:text-[#0D1729] rounded-lg transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-[#475872]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[#475872]" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Termos de Uso e Privacidade Obrigatórios */}
            <div
              className={`p-3.5 rounded-[18px] transition border ${
                fieldErrors.terms
                  ? 'bg-[#FFF5F6] border-[#BE123C] ring-2 ring-[#BE123C]/20'
                  : 'bg-[#F5F9FF] border-[#D9E5F7]'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (fieldErrors.terms) {
                      setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded-[5px] text-[#0869F5] border-[#D9E5F7] focus:ring-[#0869F5] cursor-pointer flex-shrink-0"
                />
                <div className="text-xs text-[#334661] leading-relaxed">
                  <span>Li e concordo com os </span>
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="font-bold text-[#0869F5] underline underline-offset-2 hover:text-[#052498] inline-block transition cursor-pointer"
                  >
                    Termos de Uso e Privacidade
                  </button>
                  <span> do FastRifa.</span>
                </div>
              </label>
              {fieldErrors.terms && (
                <p className="mt-2 text-xs font-semibold text-[#BE123C] flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.terms}</span>
                </p>
              )}
            </div>

            {/* Modal de Leitura dos Termos */}
            <PlatformTermsModal
              isOpen={isTermsModalOpen}
              onClose={() => setIsTermsModalOpen(false)}
              onAccept={() => {
                setAcceptedTerms(true);
                if (fieldErrors.terms) {
                  setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                }
              }}
            />

            <button
              type="submit"
              disabled={loading}
              className="ora-btn-primary w-full mt-2 py-4 px-5 font-bold rounded-[18px] text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : (
                <>
                  <span>Criar Minha Conta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-[#E0E9F7] text-center">
            <p className="text-sm text-[#475872]">
              Já tem conta?{' '}
              <Link
                href="/login"
                className="text-[#0869F5] hover:text-[#052498] font-bold underline underline-offset-4"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
