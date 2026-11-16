import Link from 'next/link';
import { Ticket, PlusCircle, LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
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
            <Link
              href="/admin/rifas/nova"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Rifa</span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                title="Sair"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        FASTRIFA &copy; 2026 — Plataforma rápida de sorteios e cotas.
      </footer>
    </div>
  );
}
