import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './config';
import type { Raffle, Order, OccupiedTicket } from '@/types/database.types';

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

export async function getUserRaffles(userId: string): Promise<Raffle[]> {
  const q = query(
    collection(db, 'raffles'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }));
}

export async function getRaffleById(raffleId: string): Promise<Raffle | null> {
  const d = await getDoc(doc(db, 'raffles', raffleId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
}

export async function getRaffleBySlug(slug: string): Promise<Raffle | null> {
  const q = query(collection(db, 'raffles'), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
}

export async function createRaffle(data: Omit<Raffle, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'raffles'), {
    ...data,
    created_at: now,
    updated_at: now,
  });
  return docRef.id;
}

export async function getRaffleOrders(raffleId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('raffle_id', '==', raffleId),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
}

export async function getOccupiedTickets(raffleId: string): Promise<OccupiedTicket[]> {
  const q = query(
    collection(db, 'orders'),
    where('raffle_id', '==', raffleId),
    where('status', 'in', ['pending', 'paid'])
  );
  const snap = await getDocs(q);
  const occupied: OccupiedTicket[] = [];
  snap.docs.forEach((d) => {
    const data = d.data() as Order;
    data.ticket_numbers?.forEach((num) => {
      occupied.push({
        ticket_number: num,
        status: data.status as 'pending' | 'paid',
      });
    });
  });
  return occupied;
}

export async function createOrder(
  data: Omit<Order, 'id' | 'created_at' | 'paid_at'>
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Check conflicts first
  const occupied = await getOccupiedTickets(data.raffle_id);
  const occupiedSet = new Set(occupied.map((o) => o.ticket_number));

  const conflict = data.ticket_numbers.find((n) => occupiedSet.has(n));
  if (conflict !== undefined) {
    return {
      success: false,
      error: `A cota #${conflict.toString().padStart(3, '0')} já foi reservada. Por favor, escolha outro número.`,
    };
  }

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'orders'), {
    ...data,
    created_at: now,
    paid_at: null,
  });

  return { success: true, orderId: docRef.id };
}

export async function updateOrderStatus(orderId: string, status: 'paid' | 'cancelled' | 'pending'): Promise<void> {
  const now = status === 'paid' ? new Date().toISOString() : null;
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    paid_at: now,
  });
}

export async function finishRaffle(raffleId: string, winnerTicket: number, winnerName: string): Promise<void> {
  await updateDoc(doc(db, 'raffles', raffleId), {
    status: 'completed',
    winner_ticket: winnerTicket,
    winner_name: winnerName || 'Ganhador do Bilhete ' + winnerTicket,
    draw_date: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
