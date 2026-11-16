'use client';

import { use, useEffect, useState } from 'react';
import { getRaffleBySlug, getOccupiedTickets } from '@/lib/firebase/raffles';
import RafflePublicView from './raffle-view';
import { Loader2 } from 'lucide-react';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

export default function RafflePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      getRaffleBySlug(slug)
        .then(async (raffleData) => {
          if (!raffleData) {
            setError('Rifa não encontrada.');
            setLoading(false);
            return;
          }
          setRaffle(raffleData);
          const occupied = await getOccupiedTickets(raffleData.id);
          setOccupiedTickets(occupied);
        })
        .catch((err) => {
          console.error(err);
          setError('Erro ao carregar a rifa.');
        })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-rose-400 mb-2">Ops! Rifa não encontrada</h1>
        <p className="text-sm text-slate-400 max-w-sm">
          Verifique se o link compartilhado está correto.
        </p>
      </div>
    );
  }

  return <RafflePublicView raffle={raffle} initialOccupiedTickets={occupiedTickets} />;
}
