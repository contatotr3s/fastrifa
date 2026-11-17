'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    const result = await signup(fullName, phone, email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  async function handleGoogleSignup() {
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

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[460px]">
        {/* Brand Header */}
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
              className="mb-6 p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-medium rounded-[16px]"
            >
              {error}
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 transition text-[15px]"
              />
            </div>

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
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 transition text-[15px]"
              />
            </div>

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
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
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
