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

  const { signup } = useAuth();
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

  return (
    <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[460px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="ora-glass-pill rounded-full pl-2.5 pr-6 py-2 inline-flex items-center gap-3 mb-5 hover:border-[#B9D3F8] transition"
          >
            <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_16px_rgba(8,105,245,0.38)] flex-shrink-0">
              <img
                src="/icone-isolado.png"
                alt="Ícone Fast Rifa"
                className="w-8 h-8 object-contain brightness-0 invert"
              />
            </div>
            <span className="font-display font-bold text-2xl tracking-[-0.04em] text-[#0D1729]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl tracking-[-0.04em] text-[#0D1729]">
            Crie sua conta gratuita.
          </h1>
          <p className="text-[15px] text-[#475872] mt-2">
            Comece a criar e gerenciar suas campanhas com PIX direto.
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
                Senha (mínimo 6 caracteres)
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 transition text-[15px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ora-btn-primary w-full mt-3 py-4 px-5 font-bold rounded-[18px] text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : (
                <>
                  <span>Começar Gratuitamente</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-[#E0E9F7] text-center">
            <p className="text-sm text-[#475872]">
              Já possui uma conta?{' '}
              <Link
                href="/login"
                className="text-[#0869F5] hover:text-[#052498] font-bold underline underline-offset-4"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
