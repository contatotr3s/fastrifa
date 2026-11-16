'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { PlusCircle, LogOut } from 'lucide-react';

export default function AdminHeader() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 h-[84px] flex items-center bg-white/85 backdrop-blur-md border-b border-[#E3EDFB]">
      <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="ora-glass-pill rounded-full pl-3 pr-5 py-2 flex items-center gap-2.5 hover:border-[#B9D3F8] transition"
          >
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_14px_rgba(8,105,245,0.35)]">
              <img
                src="/icone-isolado.png"
                alt="Ícone Fast Rifa"
                className="w-4 h-4 object-contain brightness-0 invert"
              />
            </div>
            <span className="font-display font-bold text-xl tracking-[-0.04em] text-[#0D1729]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#475872]">
            <Link href="/admin" className="text-[#0D1729] hover:text-[#0869F5] font-semibold transition">
              Minhas Campanhas
            </Link>
            <Link href="/r/iphone-16-pro-max" target="_blank" className="hover:text-[#0869F5] transition">
              Ver Rifa Modelo
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {profile?.full_name && (
            <span className="text-xs text-[#475872] hidden sm:inline px-3 py-1.5 rounded-full bg-[#F2F7FF] border border-[#DBE7F6]">
              Olá, <strong className="text-[#0D1729]">{profile.full_name}</strong>
            </span>
          )}
          <Link
            href="/admin/rifas/nova"
            className="ora-btn-primary rounded-full px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Rifa</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            aria-label="Sair da conta"
            className="p-2.5 text-[#475872] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-transparent hover:border-[#FECDD3] rounded-full transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
