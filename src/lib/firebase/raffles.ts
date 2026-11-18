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
import type { Raffle, Order, OccupiedTicket, Profile } from '@/types/database.types';

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
  const localList = getLocalRaffles();
  let remoteList: Raffle[] = [];

  try {
    const q = query(
      collection(db, 'raffles'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      remoteList = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
        .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
    }
  } catch (err) {
    console.warn('Firebase query failed or index missing, using local raffles:', err);
  }

  // Merge remote and local without duplicate IDs or slugs
  const map = new Map<string, Raffle>();

  // 1. First add remote raffles
  for (const r of remoteList) {
    if (r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max') {
      map.set(r.id, r);
    }
  }

  // 2. Add local raffles
  for (const r of localList) {
    if (r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max') {
      map.set(r.id, r);
    }
  }

  const allMerged = Array.from(map.values());

  // Sort newest first
  allMerged.sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Retorna apenas as rifas pertencentes ao usuário logado
  return allMerged.filter((r) => r.user_id === userId);
}

export async function getAllRaffles(): Promise<Raffle[]> {
  try {
    const q = query(collection(db, 'raffles'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
        .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
    }
  } catch (err) {
    console.warn('Error fetching all raffles:', err);
  }
  return getLocalRaffles().filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
}

export async function getAllCreators(): Promise<Array<{ email?: string; profile: Profile }>> {
  const creators: Array<{ email?: string; profile: Profile }> = [];
  const seenIds = new Set<string>();

  // 1. Firestore remoto oficial
  try {
    const snap = await getDocs(collection(db, 'profiles'));
    snap.forEach((d) => {
      const data = d.data() as Profile;
      if (
        data &&
        data.id &&
        data.id !== 'demo-organizer-uid' &&
        !seenIds.has(data.id)
      ) {
        seenIds.add(data.id);
        creators.push({
          email: (data as { email?: string }).email,
          profile: data,
        });
      }
    });
  } catch (err) {
    console.warn('Error reading remote creators from firestore:', err);
  }

  // 2. Contas salvas localmente
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('fastrifa_auth_accounts');
      if (raw) {
        const accounts: Array<{ email: string; profile: Profile }> = JSON.parse(raw);
        for (const a of accounts) {
          if (
            a.profile &&
            a.profile.id !== 'demo-organizer-uid' &&
            a.email !== 'admin@fastrifa.com' &&
            !seenIds.has(a.profile.id)
          ) {
            creators.push(a);
            seenIds.add(a.profile.id);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading local creators:', e);
    }
  }

  return creators;
}

export async function getRaffleById(raffleId: string): Promise<Raffle | null> {
  if (raffleId === 'demo-raffle-01') return null;

  // 1. Local first
  const local = getLocalRaffles().find((r) => r.id === raffleId && r.id !== 'demo-raffle-01');
  if (local) return local;

  // 2. Remote Firestore
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
    // Fall through
  }

  return null;
}

export async function getRaffleBySlug(slug: string): Promise<Raffle | null> {
  if (slug === 'iphone-16-pro-max') return null;

  // 1. Local first
  const local = getLocalRaffles().find((r) => r.slug === slug && r.slug !== 'iphone-16-pro-max');
  if (local) return local;

  // 2. Remote Firestore
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
    // Fall through
  }

  return null;
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

  // Always save locally immediately FIRST so it can never be lost
  const current = getLocalRaffles();
  saveLocalRaffles([newRaffle, ...current]);

  // Then attempt Firestore sync in parallel
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Placeholder')) {
      const docRef = await addDoc(collection(db, 'raffles'), {
        ...data,
        created_at: now,
        updated_at: now,
      });
      // Update local copy with Firestore ID if it succeeded
      const updated = getLocalRaffles().map((r) =>
        r.id === newId ? { ...r, id: docRef.id } : r
      );
      saveLocalRaffles(updated);
      return docRef.id;
    }
  } catch (err) {
    console.warn('Firestore addDoc failed, kept local raffle:', err);
  }

  return newId;
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
