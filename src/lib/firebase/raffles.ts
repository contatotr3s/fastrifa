import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, getPublicFirestore } from './config';
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
    const activeDb = await getPublicFirestore();
    // Sem orderBy composto para não exigir índice composto manual no Firestore
    const q = query(collection(activeDb, 'raffles'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      remoteList = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
        .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
    }
  } catch (err) {
    console.warn('Firebase query failed, using local raffles:', err);
  }

  const remoteSlugs = new Set(remoteList.map((r) => r.slug));

  // Auto-sincroniza para o Firestore caso exista alguma rifa criada localmente (raf_) que ainda não subiu
  for (const loc of localList) {
    if (
      loc.user_id === userId &&
      loc.id.startsWith('raf_') &&
      !remoteSlugs.has(loc.slug)
    ) {
      try {
        const activeDb = await getPublicFirestore();
        const { id: oldLocalId, ...payload } = loc;
        const docRef = await addDoc(collection(activeDb, 'raffles'), payload);
        const synced = { ...loc, id: docRef.id };
        remoteList.push(synced);
        remoteSlugs.add(loc.slug);
        const updatedLocal = getLocalRaffles().map((r) =>
          r.id === oldLocalId ? synced : r
        );
        saveLocalRaffles(updatedLocal);
      } catch {}
    }
  }

  // Merge remote and local without duplicate IDs or slugs
  const mapBySlug = new Map<string, Raffle>();

  for (const r of localList) {
    if (r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max') {
      mapBySlug.set(r.slug, r);
    }
  }

  // Remote takes precedence over local so official Firestore IDs are always used
  for (const r of remoteList) {
    if (r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max') {
      mapBySlug.set(r.slug, r);
    }
  }

  const allMerged = Array.from(mapBySlug.values()).filter(
    (r) => r.user_id === userId
  );

  allMerged.sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  return allMerged;
}

export async function getAllRaffles(): Promise<Raffle[]> {
  try {
    const activeDb = await getPublicFirestore();
    const q = query(collection(activeDb, 'raffles'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
        .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
    }
  } catch (err) {
    console.warn('Error fetching all raffles:', err);
  }
  return getLocalRaffles().filter(
    (r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max'
  );
}

export async function getAllCreators(): Promise<
  Array<{ email?: string; profile: Profile }>
> {
  const creators: Array<{ email?: string; profile: Profile }> = [];
  const seenIds = new Set<string>();

  try {
    const activeDb = await getPublicFirestore();
    const snap = await getDocs(collection(activeDb, 'profiles'));
    snap.forEach((d) => {
      const data = d.data() as Profile;
      const email = (data as { email?: string }).email;
      if (
        data &&
        data.id &&
        data.id !== 'demo-organizer-uid' &&
        email !== 'leitor.publico@fastrifa.com' &&
        !seenIds.has(data.id)
      ) {
        seenIds.add(data.id);
        creators.push({
          email,
          profile: data,
        });
      }
    });
  } catch (err) {
    console.warn('Error reading remote creators from firestore:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('fastrifa_auth_accounts');
      if (raw) {
        const accounts: Array<{ email: string; profile: Profile }> =
          JSON.parse(raw);
        for (const a of accounts) {
          if (
            a.profile &&
            a.profile.id !== 'demo-organizer-uid' &&
            a.email !== 'admin@fastrifa.com' &&
            a.email !== 'leitor.publico@fastrifa.com' &&
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

  // 1. Remote Firestore first (via public bridge if visitor is not logged in)
  try {
    const activeDb = await getPublicFirestore();
    const d = await getDoc(doc(activeDb, 'raffles', raffleId));
    if (d.exists()) {
      const data = { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
      if (data.id === 'demo-raffle-01' || data.slug === 'iphone-16-pro-max')
        return null;
      return data;
    }
  } catch {
    // Fall through to local
  }

  // 2. Local fallback
  const local = getLocalRaffles().find(
    (r) => r.id === raffleId && r.id !== 'demo-raffle-01'
  );
  if (local) return local;

  return null;
}

export async function getRaffleBySlug(slug: string): Promise<Raffle | null> {
  if (slug === 'iphone-16-pro-max') return null;

  // 1. Remote Firestore first (via public bridge so unauthenticated buyers ALWAYS load the raffle)
  try {
    const activeDb = await getPublicFirestore();
    const q = query(collection(activeDb, 'raffles'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
      if (data.id === 'demo-raffle-01' || data.slug === 'iphone-16-pro-max')
        return null;
      return data;
    }
  } catch (err) {
    console.warn('Error fetching raffle by slug from Firestore:', err);
  }

  // 2. Local fallback
  const local = getLocalRaffles().find(
    (r) => r.slug === slug && r.slug !== 'iphone-16-pro-max'
  );
  if (local) return local;

  return null;
}

export async function createRaffle(
  data: Omit<Raffle, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const now = new Date().toISOString();
  const newId = 'raf_' + Math.random().toString(36).substring(2, 10);
  const newRaffle: Raffle = {
    ...data,
    id: newId,
    created_at: now,
    updated_at: now,
  };

  // Save locally first
  const current = getLocalRaffles();
  saveLocalRaffles([newRaffle, ...current]);

  // Sync to Firestore
  try {
    const activeDb = await getPublicFirestore();
    const docRef = await addDoc(collection(activeDb, 'raffles'), {
      ...data,
      created_at: now,
      updated_at: now,
    });
    const updated = getLocalRaffles().map((r) =>
      r.id === newId ? { ...r, id: docRef.id } : r
    );
    saveLocalRaffles(updated);
    return docRef.id;
  } catch (err) {
    console.warn('Firestore addDoc failed, kept local raffle:', err);
  }

  return newId;
}

export async function getRaffleOrders(raffleId: string): Promise<Order[]> {
  const mergedMap = new Map<string, Order>();

  // 1. Add local orders for this raffle
  const localOrders = getLocalOrders().filter((o) => o.raffle_id === raffleId);
  for (const loc of localOrders) {
    mergedMap.set(loc.id, loc);
  }

  // 2. Fetch remote orders from Firestore (sem orderBy composto para não exigir índice manual)
  try {
    const activeDb = await getPublicFirestore();
    const q = query(
      collection(activeDb, 'orders'),
      where('raffle_id', '==', raffleId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.docs.forEach((d) => {
        const ord = { id: d.id, ...(d.data() as Omit<Order, 'id'>) };
        mergedMap.set(ord.id, ord);
      });
    }
  } catch (err) {
    console.warn('Error fetching orders from Firestore:', err);
  }

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  return list;
}

export async function getOccupiedTickets(
  raffleId: string
): Promise<OccupiedTicket[]> {
  const orders = await getRaffleOrders(raffleId);
  const occupiedMap = new Map<number, 'pending' | 'paid'>();

  orders
    .filter((o) => o.status === 'pending' || o.status === 'paid')
    .forEach((ord) => {
      const st = ord.status as 'pending' | 'paid';
      ord.ticket_numbers?.forEach((num) => {
        // Se já estiver marcado como 'paid', mantém 'paid'
        if (occupiedMap.get(num) !== 'paid') {
          occupiedMap.set(num, st);
        }
      });
    });

  return Array.from(occupiedMap.entries()).map(([ticket_number, status]) => ({
    ticket_number,
    status,
  }));
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
    const activeDb = await getPublicFirestore();
    const docRef = await addDoc(collection(activeDb, 'orders'), {
      ...data,
      created_at: now,
      paid_at: null,
    });
    newOrder.id = docRef.id;
  } catch (err) {
    console.warn('Error saving order to Firestore, saved locally:', err);
  }

  const current = getLocalOrders();
  saveLocalOrders([newOrder, ...current]);

  return { success: true, orderId: newOrder.id };
}

export async function updateOrderStatus(
  orderId: string,
  status: 'paid' | 'cancelled' | 'pending'
): Promise<void> {
  const now = status === 'paid' ? new Date().toISOString() : null;

  try {
    const activeDb = await getPublicFirestore();
    await updateDoc(doc(activeDb, 'orders', orderId), {
      status,
      paid_at: now,
    });
  } catch {
    // Update locally
  }

  const current = getLocalOrders();
  saveLocalOrders(
    current.map((o) => (o.id === orderId ? { ...o, status, paid_at: now } : o))
  );
}

export async function finishRaffle(
  raffleId: string,
  winnerTicket: number,
  winnerName: string
): Promise<void> {
  const now = new Date().toISOString();

  try {
    const activeDb = await getPublicFirestore();
    await updateDoc(doc(activeDb, 'raffles', raffleId), {
      status: 'completed',
      winner_ticket: winnerTicket,
      winner_name: winnerName || 'Ganhador do Bilhete ' + winnerTicket,
      draw_date: now,
      updated_at: now,
    });
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

export async function deleteRaffle(raffleId: string): Promise<boolean> {
  const current = getLocalRaffles();
  saveLocalRaffles(current.filter((r) => r.id !== raffleId));

  try {
    const activeDb = await getPublicFirestore();
    await deleteDoc(doc(activeDb, 'raffles', raffleId));
  } catch (err) {
    console.warn('Error deleting remote raffle from Firestore:', err);
  }

  return true;
}

export async function deleteCreatorProfile(userId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('fastrifa_auth_accounts');
      if (raw) {
        const accounts = JSON.parse(raw);
        const filtered = accounts.filter(
          (a: { profile?: { id?: string } }) => a?.profile?.id !== userId
        );
        localStorage.setItem('fastrifa_auth_accounts', JSON.stringify(filtered));
      }
      const curUser = localStorage.getItem('fastrifa_local_user');
      if (curUser) {
        const u = JSON.parse(curUser);
        if (u?.uid === userId) {
          localStorage.removeItem('fastrifa_local_user');
          localStorage.removeItem('fastrifa_local_profile');
        }
      }
    } catch (e) {
      console.warn('Error cleaning local creator storage:', e);
    }
  }

  const currentRaffles = getLocalRaffles();
  saveLocalRaffles(currentRaffles.filter((r) => r.user_id !== userId));

  try {
    const activeDb = await getPublicFirestore();
    const q = query(collection(activeDb, 'raffles'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(activeDb, 'raffles', d.id));
    }
    await deleteDoc(doc(activeDb, 'profiles', userId));
  } catch (err) {
    console.warn('Error deleting remote creator from Firestore:', err);
  }

  return true;
}

export async function updateRaffleByMaster(
  raffleId: string,
  updates: Partial<Raffle>
): Promise<boolean> {
  const now = new Date().toISOString();
  const payload = { ...updates, updated_at: now };

  try {
    const activeDb = await getPublicFirestore();
    await updateDoc(doc(activeDb, 'raffles', raffleId), payload);
  } catch (err) {
    console.warn('Error updating remote raffle:', err);
  }

  const current = getLocalRaffles();
  saveLocalRaffles(
    current.map((r) => (r.id === raffleId ? { ...r, ...payload } : r))
  );

  return true;
}

export async function updateProfileByMaster(
  userId: string,
  updates: Partial<Profile>,
  updatedEmail?: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const payload = {
    ...updates,
    updated_at: now,
    ...(updatedEmail ? { email: updatedEmail } : {}),
  };

  try {
    const activeDb = await getPublicFirestore();
    await updateDoc(doc(activeDb, 'profiles', userId), payload);
  } catch (err) {
    console.warn('Error updating remote profile:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('fastrifa_auth_accounts');
      if (raw) {
        const accounts = JSON.parse(raw);
        const updated = accounts.map(
          (a: { email?: string; profile: Profile }) => {
            if (a?.profile?.id === userId) {
              return {
                email: updatedEmail || a.email,
                profile: { ...a.profile, ...payload },
              };
            }
            return a;
          }
        );
        localStorage.setItem('fastrifa_auth_accounts', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error updating local creator storage:', e);
    }
  }

  return true;
}
