'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { Ticket, PlusCircle, LogOut } from 'lucide-react';

export default function AdminHeader() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
            <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
              <Ticket className="w-5 h-5" />
            </span>
            FAST<span className="text-emerald-400">RIFA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-slate-300 hover:text-white transition">
              Minhas Rifas
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {profile?.full_name && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              Olá, <strong className="text-slate-200">{profile.full_name}</strong>
            </span>
          )}
          <Link
            href="/admin/rifas/nova"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Rifa</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
