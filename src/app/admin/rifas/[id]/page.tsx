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
            setError('Campanha não encontrada.');
          } else if (raffleData.user_id !== user.uid) {
            setError('Você não tem permissão para gerenciar esta campanha.');
          } else {
            setRaffle(raffleData);
            setOrders(ordersData);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Erro ao carregar os dados da campanha.');
        })
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="ora-card rounded-[28px] p-10 text-center space-y-4 max-w-md mx-auto">
        <div className="text-[#BE123C] font-display font-bold text-lg">
          {error || 'Campanha não encontrada.'}
        </div>
        <Link
          href="/admin"
          className="ora-btn-secondary rounded-full px-5 py-2.5 inline-flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </Link>
      </div>
    );
  }

  return <RaffleManager raffle={raffle} initialOrders={orders} />;
}
