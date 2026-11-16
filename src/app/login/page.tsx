'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
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

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Brand Pill Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="ora-glass-pill rounded-full pl-3 pr-5 py-2 inline-flex items-center gap-2.5 mb-5 hover:border-[#B9D3F8] transition"
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_12px_rgba(8,105,245,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-white/90" />
            </span>
            <span className="font-display font-bold text-xl tracking-[-0.04em] text-[#0D1729]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl tracking-[-0.04em] text-[#0D1729]">
            Bem-vindo de volta.
          </h1>
          <p className="text-[15px] text-[#475872] mt-2">
            Acesse o painel para gerenciar suas campanhas e cotas.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-2"
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
                className="block text-[13px] font-semibold text-[#14213A] mb-2"
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
              }}
              className="w-full py-3 px-4 text-xs font-bold text-[#0755DE] bg-[#F2F7FF] hover:bg-[#E3EFFF] border border-[#CDE0FC] rounded-[16px] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0869F5]" />
              <span>Preencher dados de teste (admin@fastrifa.com)</span>
            </button>
          </form>

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
