'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { getRaffleById, getRaffleOrders } from '@/lib/firebase/raffles';
import RaffleManager from './raffle-manager';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Raffle, Order } from '@/types/database.types';

export default function AdminRaffleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && id) {
      Promise.all([getRaffleById(id), getRaffleOrders(id)])
        .then(([raffleData, ordersData]) => {
          if (!raffleData) {
            setError('Rifa não encontrada.');
          } else if (raffleData.user_id !== user.uid) {
            setError('Você não tem permissão para gerenciar esta rifa.');
          } else {
            setRaffle(raffleData);
            setOrders(ordersData);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Erro ao carregar os dados da rifa.');
        })
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-rose-400 font-bold">{error || 'Rifa não encontrada.'}</div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </Link>
      </div>
    );
  }

  return <RaffleManager raffle={raffle} initialOrders={orders} />;
}
