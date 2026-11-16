import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RafflePublicView from './raffle-view';
import type { Raffle, OccupiedTicket } from '@/types/database.types';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('raffles')
    .select('title, description, prize_image_url')
    .eq('slug', slug)
    .single();

  if (!data) {
    return {
      title: 'Rifa não encontrada | FASTRIFA',
    };
  }

  return {
    title: `${data.title} | FASTRIFA`,
    description: data.description || 'Participe agora desta rifa e concorra ao prêmio!',
    openGraph: {
      title: data.title,
      description: data.description || 'Participe agora desta rifa e concorra ao prêmio!',
      images: data.prize_image_url ? [data.prize_image_url] : [],
    },
  };
}

export default async function RafflePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch raffle
  const { data: raffleData, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !raffleData) {
    notFound();
  }

  const raffle = raffleData as Raffle;

  // Fetch occupied tickets
  const { data: ordersData } = await supabase
    .from('orders')
    .select('ticket_numbers, status')
    .eq('raffle_id', raffle.id)
    .in('status', ['pending', 'paid']);

  const occupiedTickets: OccupiedTicket[] = [];

  if (ordersData) {
    for (const ord of ordersData) {
      for (const num of ord.ticket_numbers) {
        occupiedTickets.push({
          ticket_number: num,
          status: ord.status as 'pending' | 'paid',
        });
      }
    }
  }

  return <RafflePublicView raffle={raffle} initialOccupiedTickets={occupiedTickets} />;
}
