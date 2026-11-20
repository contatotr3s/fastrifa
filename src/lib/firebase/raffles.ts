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
import type { Raffle, Order, OccupiedTicket, Profile, AuditLog } from '@/types/database.types';

const LOCAL_RAFFLES_KEY = 'fastrifa_local_raffles';
const LOCAL_ORDERS_KEY = 'fastrifa_local_orders';
const LOCAL_AUDIT_LOGS_KEY = 'fastrifa_local_audit_logs';

function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAuditLogs(logs: AuditLog[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch {}
  }
}

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

  let raffleData: Raffle | null = null;

  // 1. Remote Firestore first (via public bridge so unauthenticated buyers ALWAYS load the raffle)
  try {
    const activeDb = await getPublicFirestore();
    const q = query(collection(activeDb, 'raffles'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
      if (data.id !== 'demo-raffle-01' && data.slug !== 'iphone-16-pro-max') {
        raffleData = data;
      }
    }
  } catch (err) {
    console.warn('Error fetching raffle by slug from Firestore:', err);
  }

  // 2. Local fallback if not in Firestore
  if (!raffleData) {
    const local = getLocalRaffles().find(
      (r) => r.slug === slug && r.slug !== 'iphone-16-pro-max'
    );
    if (local) raffleData = local;
  }

  if (!raffleData) return null;

  // 3. Sincroniza sempre os dados de marca mais recentes do perfil do criador (cor, logo, nome)
  try {
    const activeDb = await getPublicFirestore();
    const profileSnap = await getDoc(doc(activeDb, 'profiles', raffleData.user_id));
    if (profileSnap.exists()) {
      const prof = profileSnap.data() as Profile;
      if (prof.brand_color) {
        raffleData.brand_color = prof.brand_color;
      }
      if (prof.brand_logo_url) {
        raffleData.brand_logo_url = prof.brand_logo_url;
      }
      if (prof.brand_name) {
        raffleData.brand_name = prof.brand_name;
      }
    }
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('fastrifa_auth_accounts');
        if (raw) {
          const accounts: Array<{ profile?: Profile }> = JSON.parse(raw);
          const matched = accounts.find((a) => a.profile?.id === raffleData?.user_id);
          if (matched?.profile) {
            if (matched.profile.brand_color) raffleData.brand_color = matched.profile.brand_color;
            if (matched.profile.brand_logo_url) raffleData.brand_logo_url = matched.profile.brand_logo_url;
            if (matched.profile.brand_name) raffleData.brand_name = matched.profile.brand_name;
          }
        }
      } catch {}
    }
  }

  return raffleData;
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
): Promise<{ success: boolean; orderId?: string; error?: string; conflictingTicket?: number }> {
  const occupied = await getOccupiedTickets(data.raffle_id);
  const occupiedSet = new Set(occupied.map((o) => o.ticket_number));

  const conflict = data.ticket_numbers.find((n) => occupiedSet.has(n));
  if (conflict !== undefined) {
    return {
      success: false,
      conflictingTicket: conflict,
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

/**
 * Sincroniza a cor da marca do criador imediatamente em todas as suas rifas
 * para que qualquer alteração de cor (azul / verde) seja efetiva imediatamente.
 */
export async function syncCreatorBrandColorToRaffles(
  userId: string,
  color: 'blue' | 'green'
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Atualiza no Firestore
  try {
    const activeDb = await getPublicFirestore();
    const q = query(collection(activeDb, 'raffles'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(activeDb, 'raffles', d.id), {
        brand_color: color,
        updated_at: now,
      });
    }
  } catch (err) {
    console.warn('Error syncing brand color to remote raffles:', err);
  }

  // 2. Atualiza no LocalStorage
  const current = getLocalRaffles();
  saveLocalRaffles(
    current.map((r) =>
      r.user_id === userId
        ? { ...r, brand_color: color, updated_at: now }
        : r
    )
  );
}

/**
 * Atualiza os dados de uma rifa (título, descrição, fotos, valor da cota, etc)
 * e grava um registro auditável ligado ao usuário que realizou a alteração.
 */
export async function updateRaffleWithAudit({
  raffleId,
  updates,
  user,
}: {
  raffleId: string;
  updates: Partial<Raffle>;
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  };
}): Promise<{ success: boolean; auditLog?: AuditLog; error?: string }> {
  try {
    // 1. Obter estado atual da rifa para auditoria
    const currentRaffle = await getRaffleById(raffleId);
    if (!currentRaffle) {
      return { success: false, error: 'Rifa não encontrada.' };
    }

    const now = new Date().toISOString();
    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    const changeSummaryParts: string[] = [];

    // Compara campos alterados
    const checkedFields: Array<keyof Raffle> = [
      'title',
      'description',
      'ticket_price',
      'prize_image_url',
      'prize_images',
      'draw_date',
      'status',
      'pix_key',
      'pix_key_type',
      'phone_whatsapp',
    ];

    for (const field of checkedFields) {
      if (field in updates) {
        const oldVal = (currentRaffle as any)[field];
        const newVal = (updates as any)[field];

        // Comparação para arrays e primitivos
        const isDiff =
          Array.isArray(oldVal) && Array.isArray(newVal)
            ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
            : oldVal !== newVal;

        if (isDiff) {
          previousValues[field] = oldVal ?? null;
          newValues[field] = newVal ?? null;

          if (field === 'title') {
            changeSummaryParts.push(`Título alterado para "${newVal}"`);
          } else if (field === 'description') {
            changeSummaryParts.push(`Texto descritivo atualizado`);
          } else if (field === 'ticket_price') {
            changeSummaryParts.push(
              `Valor da cota alterado de R$ ${Number(oldVal).toFixed(2)} para R$ ${Number(newVal).toFixed(2)}`
            );
          } else if (field === 'prize_images' || field === 'prize_image_url') {
            changeSummaryParts.push(`Fotos do prêmio atualizadas`);
          } else if (field === 'draw_date') {
            changeSummaryParts.push(`Data do sorteio alterada para ${newVal}`);
          } else {
            changeSummaryParts.push(`Campo "${String(field)}" alterado`);
          }
        }
      }
    }

    if (changeSummaryParts.length === 0) {
      return { success: true };
    }

    const changeSummary = changeSummaryParts.join(' • ');

    // 2. Salva a atualização da rifa
    const rafflePayload: Partial<Raffle> = {
      ...updates,
      updated_at: now,
    };

    try {
      const activeDb = await getPublicFirestore();
      await updateDoc(doc(activeDb, 'raffles', raffleId), rafflePayload);
    } catch (err) {
      console.warn('Error updating raffle document in Firestore:', err);
    }

    // Atualiza localmente
    const currentList = getLocalRaffles();
    saveLocalRaffles(
      currentList.map((r) =>
        r.id === raffleId ? { ...r, ...rafflePayload } : r
      )
    );

    // 3. Grava o registro auditável
    const logId = 'log_' + Math.random().toString(36).substring(2, 10);
    const auditLog: AuditLog = {
      id: logId,
      raffle_id: raffleId,
      raffle_title: updates.title || currentRaffle.title,
      user_id: user.uid,
      user_email: user.email || '',
      user_name: user.displayName || user.email || 'Usuário',
      action: updates.ticket_price !== undefined ? 'ticket_price_change' : 'raffle_update',
      previous_values: previousValues,
      new_values: newValues,
      change_summary: changeSummary,
      created_at: now,
    };

    // Grava no Firestore na coleção audit_logs
    try {
      const activeDb = await getPublicFirestore();
      const docRef = await addDoc(collection(activeDb, 'audit_logs'), auditLog);
      auditLog.id = docRef.id;
    } catch (err) {
      console.warn('Error saving audit log to Firestore:', err);
    }

    // Salva localmente
    const localLogs = getLocalAuditLogs();
    saveLocalAuditLogs([auditLog, ...localLogs]);

    return { success: true, auditLog };
  } catch (err) {
    console.error('updateRaffleWithAudit failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao salvar alterações da rifa.',
    };
  }
}

/**
 * Recupera os registros de auditoria para o painel Master e suporte
 */
export async function getAuditLogs(raffleId?: string): Promise<AuditLog[]> {
  const mergedMap = new Map<string, AuditLog>();

  // 1. Logs locais
  for (const log of getLocalAuditLogs()) {
    if (!raffleId || log.raffle_id === raffleId) {
      mergedMap.set(log.id, log);
    }
  }

  // 2. Logs remotos do Firestore
  try {
    const activeDb = await getPublicFirestore();
    let q = query(collection(activeDb, 'audit_logs'));
    if (raffleId) {
      q = query(collection(activeDb, 'audit_logs'), where('raffle_id', '==', raffleId));
    }
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = { id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) };
      mergedMap.set(data.id, data);
    });
  } catch (err) {
    console.warn('Error fetching audit logs from Firestore:', err);
  }

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  return list;
}
