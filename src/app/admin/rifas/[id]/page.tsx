import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RaffleManager from './raffle-manager';
import type { Raffle, Order } from '@/types/database.types';

export default async function AdminRaffleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch Raffle
  const { data: raffleData } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!raffleData) {
    notFound();
  }

  const raffle = raffleData as Raffle;

  // Fetch Orders
  const { data: ordersData } = await supabase
    .from('orders')
    .select('*')
    .eq('raffle_id', id)
    .order('created_at', { ascending: false });

  const orders = (ordersData || []) as Order[];

  return <RaffleManager raffle={raffle} initialOrders={orders} />;
}
