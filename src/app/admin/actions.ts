'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

export async function createRaffle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Você precisa estar autenticado.' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const prizeImageUrl = formData.get('prizeImageUrl') as string;
  const ticketPrice = parseFloat(formData.get('ticketPrice') as string);
  const totalTickets = parseInt(formData.get('totalTickets') as string, 10);
  const pixKey = formData.get('pixKey') as string;
  const pixKeyType = (formData.get('pixKeyType') as string) || 'cpf';
  const phoneWhatsapp = formData.get('phoneWhatsapp') as string;

  if (!title || isNaN(ticketPrice) || isNaN(totalTickets) || !pixKey) {
    return { error: 'Preencha todos os campos obrigatórios.' };
  }

  const slug = generateSlug(title);

  const { data, error } = await supabase
    .from('raffles')
    .insert({
      user_id: user.id,
      title,
      slug,
      description: description || '',
      prize_image_url: prizeImageUrl || null,
      ticket_price: ticketPrice,
      total_tickets: totalTickets,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      phone_whatsapp: phoneWhatsapp || '',
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message || 'Erro ao criar rifa.' };
  }

  revalidatePath('/admin');
  redirect(`/admin/rifas/${data.id}`);
}

export async function updateOrderStatus(orderId: string, raffleId: string, newStatus: 'paid' | 'cancelled' | 'pending') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Não autorizado.' };
  }

  const updateData: { status: 'paid' | 'cancelled' | 'pending'; paid_at?: string | null } = {
    status: newStatus,
  };

  if (newStatus === 'paid') {
    updateData.paid_at = new Date().toISOString();
  } else if (newStatus === 'pending' || newStatus === 'cancelled') {
    updateData.paid_at = null;
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    return { error: error.message || 'Erro ao atualizar pedido.' };
  }

  revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function finishRaffle(raffleId: string, winnerTicket: number, winnerName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Não autorizado.' };
  }

  const { error } = await supabase
    .from('raffles')
    .update({
      status: 'completed',
      winner_ticket: winnerTicket,
      winner_name: winnerName || 'Ganhador do Bilhete ' + winnerTicket,
      draw_date: new Date().toISOString(),
    })
    .eq('id', raffleId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message || 'Erro ao encerrar rifa.' };
  }

  revalidatePath(`/admin/rifas/${raffleId}`);
  revalidatePath('/admin');
  return { success: true };
}
