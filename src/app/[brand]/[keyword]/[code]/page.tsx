'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getRaffleByPublicParams, getOccupiedTickets } from '@/lib/firebase/raffles';
import RafflePublicView from '@/app/r/[slug]/raffle-view';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { Raffle, OccupiedTicket } from '@/types/database.types';

export default function BrandRafflePublicPage({
  params,
}: {
  params: Promise<{ brand: string; keyword: string; code: string }>;
}) {
  const { brand, keyword, code } = use(params);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [occupiedTickets, setOccupiedTickets] = useState<OccupiedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brand && keyword && code) {
      getRaffleByPublicParams(brand, keyword, code)
        .then(async (raffleData) => {
          if (!raffleData) {
            setError('Campanha não encontrada.');
            setLoading(false);
            return;
          }
          setRaffle(raffleData);
          const occupied = await getOccupiedTickets(raffleData.id);
          setOccupiedTickets(occupied);

          if (typeof window !== 'undefined') {
            const themeToApply = raffleData.brand_color === 'green' ? 'green' : 'blue';
            document.documentElement.setAttribute('data-theme', themeToApply);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Erro ao carregar a campanha.');
        })
        .finally(() => setLoading(false));
    }

    return () => {
      if (typeof window !== 'undefined') {
        const globalTheme = localStorage.getItem('fastrifa_global_system_theme') || 'blue';
        document.documentElement.setAttribute('data-theme', globalTheme);
      }
    };
  }, [brand, keyword, code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen ora-hero-stage text-[#0D1729] flex flex-col items-center justify-center p-4 text-center">
        <div className="ora-card rounded-[28px] p-10 max-w-md space-y-4">
          <h1 className="font-display font-bold text-2xl text-[#0D1729]">
            Campanha não encontrada
          </h1>
          <p className="text-sm text-[#475872]">
            Verifique se o endereço compartilhado está correto ou volte para a página inicial.
          </p>
          <Link
            href="/"
            className="ora-btn-primary rounded-full px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir para o Início</span>
          </Link>
        </div>
      </div>
    );
  }

  return <RafflePublicView raffle={raffle} initialOccupiedTickets={occupiedTickets} />;
}
