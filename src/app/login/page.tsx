'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { ArrowRight, Loader2, Sparkles, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [viewMode, setViewMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    const result = await loginWithGoogle();

    if (result.error) {
      setError(result.error);
      setGoogleLoading(false);
    } else {
      router.push('/admin');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const result = await resetPassword(resetEmail);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.message) {
      setSuccessMessage(result.message);
    }
  }

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Brand Pill Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="ora-glass-pill rounded-full pl-3 pr-5 py-2 inline-flex items-center gap-2.5 mb-5 hover:border-[#B9D3F8] transition"
          >
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_14px_rgba(8,105,245,0.35)]">
              <img
                src="/icone-isolado.png"
                alt="Ícone Fast Rifa"
                className="w-16 h-16 object-contain brightness-0 invert"
              />
            </div>
            <span className="font-display font-bold text-xl tracking-[-0.04em] text-[#0D1729]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl tracking-[-0.04em] text-[#0D1729]">
            {viewMode === 'login' ? 'Acesse seu painel.' : 'Recuperar Acesso'}
          </h1>
          <p className="text-[15px] text-[#475872] mt-2">
            {viewMode === 'login'
              ? 'Gerencie suas rifas rápidas, aprove comprovantes e acompanhe os recebimentos no PIX.'
              : 'Informe seu e-mail cadastrado para redefinir sua senha de acesso.'}
          </p>
        </div>

        {/* Card Form */}
        <div className="ora-card rounded-[28px] p-7 sm:p-9">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-medium rounded-[16px]"
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-6 p-4 bg-[#EBF7F0] border border-[#BCECD4] text-[#00A868] text-sm font-medium rounded-[16px] flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {viewMode === 'login' ? (
            <div className="space-y-5">
              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full py-3.5 px-4 rounded-[18px] bg-white border border-[#D9E5F7] hover:border-[#B9D3F8] hover:bg-[#F8FBFF] text-sm font-bold text-[#0D1729] shadow-sm flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
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
                <span>Continuar com o Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E0E9F7] w-full" />
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-[#8A9BB3] absolute">
                  ou e-mail
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 transition text-[15px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="block text-[13px] font-semibold text-[#14213A]"
                      htmlFor="password"
                    >
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                        setResetEmail(email);
                      }}
                      className="text-xs font-bold text-[#0869F5] hover:text-[#052498] hover:underline cursor-pointer"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 transition text-[15px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ora-btn-primary w-full mt-2 py-4 px-5 font-bold rounded-[18px] text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Painel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@fastrifa.com');
                    setPassword('123456');
                    setError(null);
                  }}
                  className="w-full py-3 px-4 text-xs font-bold text-[#0755DE] bg-[#F2F7FF] hover:bg-[#E3EFFF] border border-[#CDE0FC] rounded-[16px] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span>Preencher dados de teste (admin@fastrifa.com)</span>
                </button>
              </form>
            </div>
          ) : (
            /* Forgot Password View */
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center mx-auto border border-[#CDE0FC]">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <label
                  className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                  htmlFor="resetEmail"
                >
                  E-mail da sua conta
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] text-[15px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ora-btn-primary w-full py-3.5 px-5 font-bold rounded-[18px] text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando link...</span>
                  </>
                ) : (
                  <span>Recuperar Minha Senha</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2.5 text-xs font-bold text-[#475872] hover:text-[#0D1729] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para tela de login</span>
              </button>
            </form>
          )}

          <div className="mt-7 pt-6 border-t border-[#E0E9F7] text-center">
            <p className="text-sm text-[#475872]">
              Ainda não tem conta?{' '}
              <Link
                href="/cadastro"
                className="text-[#0869F5] hover:text-[#052498] font-bold underline underline-offset-4"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
