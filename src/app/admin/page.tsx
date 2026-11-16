'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { getUserRaffles } from '@/lib/firebase/raffles';
import { PlusCircle, ExternalLink, Settings, Trophy, DollarSign, Tag, Loader2 } from 'lucide-react';
import type { Raffle } from '@/types/database.types';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      getUserRaffles(user.uid)
        .then((data) => setRaffles(data))
        .catch((err) => console.error('Erro ao buscar rifas:', err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter((r) => r.status === 'active').length;
  const completedRaffles = raffles.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Painel de Controle
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie suas campanhas, confira pagamentos e realize sorteios.
          </p>
        </div>
        <Link
          href="/admin/rifas/nova"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/10 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar Nova Rifa</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total de Rifas</span>
            <Tag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRaffles}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Rifas Ativas</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeRaffles}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Finalizadas</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{completedRaffles}</div>
        </div>
      </div>

      {/* Raffles List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Suas Rifas</h2>

        {raffles.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Nenhuma rifa criada ainda</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              Comece agora criando sua primeira rifa com chave PIX e compartilhando o link público com seus clientes.
            </p>
            <Link
              href="/admin/rifas/nova"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-sm shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Primeira Rifa</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {raffles.map((raffle) => (
              <div
                key={raffle.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                          raffle.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : raffle.status === 'completed'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {raffle.status === 'active'
                          ? 'Ativa'
                          : raffle.status === 'completed'
                          ? 'Concluída'
                          : 'Pausada'}
                      </span>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{raffle.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 mb-4">
                    <span>
                      <strong className="text-slate-200">{raffle.total_tickets}</strong> cotas
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-200">R$ {Number(raffle.ticket_price).toFixed(2)}</strong> por cota
                    </span>
                    <span>•</span>
                    <span>
                      Total: <strong className="text-emerald-400">R$ {(raffle.total_tickets * raffle.ticket_price).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/r/${raffle.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
                  >
                    <span>Página Pública</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/admin/rifas/${raffle.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-lg transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Gerenciar</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
