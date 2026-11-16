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

const LOCAL_RAFFLES_KEY = 'fastrifa_local_raffles';
const LOCAL_ORDERS_KEY = 'fastrifa_local_orders';

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

function getInitialLocalRaffles(): Raffle[] {
  return [];
}

function getLocalRaffles(): Raffle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_RAFFLES_KEY);
    if (!raw) return [];
    const list: Raffle[] = JSON.parse(raw);
    const filtered = list.filter(
      (r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max'
    );
    if (filtered.length !== list.length) {
      localStorage.setItem(LOCAL_RAFFLES_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

function saveLocalRaffles(raffles: Raffle[]) {
  if (typeof window !== 'undefined') {
    const filtered = raffles.filter(
      (r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max'
    );
    localStorage.setItem(LOCAL_RAFFLES_KEY, JSON.stringify(filtered));
  }
}

function getLocalOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const list: Order[] = JSON.parse(raw);
    const filtered = list.filter((o) => o.raffle_id !== 'demo-raffle-01');
    if (filtered.length !== list.length) {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  if (typeof window !== 'undefined') {
    const filtered = orders.filter((o) => o.raffle_id !== 'demo-raffle-01');
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(filtered));
  }
}

export async function getUserRaffles(userId: string): Promise<Raffle[]> {
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const q = userId === 'demo-organizer-uid'
        ? query(collection(db, 'raffles'), orderBy('created_at', 'desc'))
        : query(
            collection(db, 'raffles'),
            where('user_id', '==', userId),
            orderBy('created_at', 'desc')
          );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
          .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
      }
    }
  } catch {
    // Fall through to local
  }

  const all = getLocalRaffles();
  if (userId === 'demo-organizer-uid') {
    return all;
  }
  return all.filter((r) => r.user_id === userId);
}

export async function getRaffleById(raffleId: string): Promise<Raffle | null> {
  if (raffleId === 'demo-raffle-01') return null;
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const d = await getDoc(doc(db, 'raffles', raffleId));
      if (d.exists()) {
        const data = { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
        if (data.id === 'demo-raffle-01' || data.slug === 'iphone-16-pro-max') return null;
        return data;
      }
    }
  } catch {
    // Fall through to local
  }

  const all = getLocalRaffles();
  return all.find((r) => r.id === raffleId && r.id !== 'demo-raffle-01') || null;
}

export async function getRaffleBySlug(slug: string): Promise<Raffle | null> {
  if (slug === 'iphone-16-pro-max') return null;
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const q = query(collection(db, 'raffles'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
        if (data.id === 'demo-raffle-01' || data.slug === 'iphone-16-pro-max') return null;
        return data;
      }
    }
  } catch {
    // Fall through to local
  }

  const all = getLocalRaffles();
  return all.find((r) => r.slug === slug && r.slug !== 'iphone-16-pro-max') || null;
}

export async function createRaffle(data: Omit<Raffle, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const now = new Date().toISOString();
  const newId = 'raf_' + Math.random().toString(36).substring(2, 10);
  const newRaffle: Raffle = {
    ...data,
    id: newId,
    created_at: now,
    updated_at: now,
  };

  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const docRef = await addDoc(collection(db, 'raffles'), {
        ...data,
        created_at: now,
        updated_at: now,
      });
      newRaffle.id = docRef.id;
    }
  } catch {
    // Save to local
  }

  const current = getLocalRaffles();
  saveLocalRaffles([newRaffle, ...current]);
  return newRaffle.id;
}

export async function getRaffleOrders(raffleId: string): Promise<Order[]> {
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const q = query(
        collection(db, 'orders'),
        where('raffle_id', '==', raffleId),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
      }
    }
  } catch {
    // Fall through to local
  }

  const all = getLocalOrders();
  return all.filter((o) => o.raffle_id === raffleId);
}

export async function getOccupiedTickets(raffleId: string): Promise<OccupiedTicket[]> {
  const orders = await getRaffleOrders(raffleId);
  const occupied: OccupiedTicket[] = [];

  orders
    .filter((o) => o.status === 'pending' || o.status === 'paid')
    .forEach((ord) => {
      ord.ticket_numbers?.forEach((num) => {
        occupied.push({
          ticket_number: num,
          status: ord.status as 'pending' | 'paid',
        });
      });
    });

  return occupied;
}

export async function createOrder(
  data: Omit<Order, 'id' | 'created_at' | 'paid_at'>
): Promise<{ success: boolean; orderId?: string; error?: string }> {
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
  const orderId = 'ord_' + Math.random().toString(36).substring(2, 10);
  const newOrder: Order = {
    ...data,
    id: orderId,
    created_at: now,
    paid_at: null,
  };

  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...data,
        created_at: now,
        paid_at: null,
      });
      newOrder.id = docRef.id;
    }
  } catch {
    // Save locally
  }

  const current = getLocalOrders();
  saveLocalOrders([newOrder, ...current]);

  return { success: true, orderId: newOrder.id };
}

export async function updateOrderStatus(orderId: string, status: 'paid' | 'cancelled' | 'pending'): Promise<void> {
  const now = status === 'paid' ? new Date().toISOString() : null;

  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        paid_at: now,
      });
    }
  } catch {
    // Update locally
  }

  const current = getLocalOrders();
  saveLocalOrders(
    current.map((o) => (o.id === orderId ? { ...o, status, paid_at: now } : o))
  );
}

export async function finishRaffle(raffleId: string, winnerTicket: number, winnerName: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      await updateDoc(doc(db, 'raffles', raffleId), {
        status: 'completed',
        winner_ticket: winnerTicket,
        winner_name: winnerName || 'Ganhador do Bilhete ' + winnerTicket,
        draw_date: now,
        updated_at: now,
      });
    }
  } catch {
    // Update locally
  }

  const current = getLocalRaffles();
  saveLocalRaffles(
    current.map((r) =>
      r.id === raffleId
        ? {
            ...r,
            status: 'completed',
            winner_ticket: winnerTicket,
            winner_name: winnerName || 'Ganhador do Bilhete ' + winnerTicket,
            draw_date: now,
            updated_at: now,
          }
        : r
    )
  );
}
