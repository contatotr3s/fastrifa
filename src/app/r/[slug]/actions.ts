'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateOrderInput {
  raffleId: string;
  slug: string;
  buyerName: string;
  buyerPhone: string;
  ticketNumbers: number[];
  totalAmount: number;
}

export async function createOrder(input: CreateOrderInput) {
  const { raffleId, slug, buyerName, buyerPhone, ticketNumbers, totalAmount } = input;

  if (!raffleId || !buyerName || !buyerPhone || ticketNumbers.length === 0) {
    return { error: 'Preencha seus dados e escolha pelo menos uma cota.' };
  }

  const supabase = await createClient();

  // 1. Verify if any of the requested ticket numbers are already taken in 'pending' or 'paid' status
  const { data: existingOrders, error: checkError } = await supabase
    .from('orders')
    .select('ticket_numbers, status')
    .eq('raffle_id', raffleId)
    .in('status', ['pending', 'paid']);

  if (checkError) {
    return { error: 'Erro ao validar disponibilidade das cotas.' };
  }

  const occupiedSet = new Set<number>();
  if (existingOrders) {
    for (const ord of existingOrders) {
      for (const num of ord.ticket_numbers) {
        occupiedSet.add(num);
      }
    }
  }

  const conflict = ticketNumbers.find((n) => occupiedSet.has(n));
  if (conflict !== undefined) {
    return {
      error: `A cota #${conflict.toString().padStart(3, '0')} acabou de ser reservada por outro participante. Por favor, escolha outro número.`,
    };
  }

  // 2. Insert order
  const { data: order, error: insertError } = await supabase
    .from('orders')
    .insert({
      raffle_id: raffleId,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      ticket_numbers: ticketNumbers,
      total_amount: totalAmount,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError) {
    return { error: insertError.message || 'Erro ao registrar reserva de cotas.' };
  }

  revalidatePath(`/r/${slug}`);
  return { success: true, orderId: order.id };
}
