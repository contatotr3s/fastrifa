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
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, getPublicFirestore } from './config';
import {
  deletePartnersDataByOrganizer,
  deletePartnersDataByRaffle,
} from './partners';
import {
  generateShortCode,
  RESERVED_ROOT_SLUGS,
  sanitizeBrandSlug,
  sanitizePrizeKeyword,
} from '@/lib/raffle-urls';
import type { Raffle, Order, OccupiedTicket, Profile, AuditLog } from '@/types/database.types';

async function getActiveDb() {
  return auth.currentUser ? db : await getPublicFirestore();
}

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
  const randomSuffix = generateShortCode(4);
  return `${base}-${randomSuffix}`;
}

export async function generateUniqueRaffleIdentity(
  prizeKeyword: string,
  brandName?: string | null
): Promise<{
  slug: string;
  brand_slug: string;
  prize_keyword: string;
  short_code: string;
}> {
  const cleanKeyword = sanitizePrizeKeyword(prizeKeyword) || 'premio';
  const brandSlug = sanitizeBrandSlug(brandName);
  const localSlugs = new Set(getLocalRaffles().map((r) => r.slug.toLowerCase()));

  for (let attempt = 0; attempt < 10; attempt++) {
    const shortCode = generateShortCode(4);
    const slug = `${cleanKeyword}-${shortCode}`;

    if (localSlugs.has(slug)) continue;

    try {
      const activeDb = await getPublicFirestore();
      const q = query(collection(activeDb, 'raffles'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (snap.empty) {
        return {
          slug,
          brand_slug: brandSlug,
          prize_keyword: cleanKeyword,
          short_code: shortCode,
        };
      }
    } catch {
      // Se estiver sem conexão na checagem, usa o código único gerado
      return {
        slug,
        brand_slug: brandSlug,
        prize_keyword: cleanKeyword,
        short_code: shortCode,
      };
    }
  }

  const fallbackCode = generateShortCode(4);
  return {
    slug: `${cleanKeyword}-${fallbackCode}`,
    brand_slug: brandSlug,
    prize_keyword: cleanKeyword,
    short_code: fallbackCode,
  };
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
  let remoteQuerySucceeded = false;

  try {
    const activeDb = await getActiveDb();
    // Sem orderBy composto para não exigir índice composto manual no Firestore
    const q = query(collection(activeDb, 'raffles'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    remoteQuerySucceeded = true;
    if (!snap.empty) {
      remoteList = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
        .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');
    }
  } catch (err) {
    console.warn('Firebase query failed, using local raffles:', err);
  }

  const remoteSlugs = new Set(remoteList.map((r) => r.slug));

  // Auto-sincroniza apenas se a consulta remota funcionou e existe rifa offline (raf_) ainda não enviada
  if (remoteQuerySucceeded) {
    for (const loc of localList) {
      if (
        loc.user_id === userId &&
        loc.id.startsWith('raf_') &&
        !remoteSlugs.has(loc.slug)
      ) {
        try {
          const activeDb = await getActiveDb();
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
  }

  // Quando o Firestore respondeu, ele é a fonte de verdade:
  // remove do cache local qualquer rifa oficial deste usuário que já foi deletada remotamente
  if (remoteQuerySucceeded) {
    const remoteIds = new Set(remoteList.map((r) => r.id));
    const currentLocal = getLocalRaffles();
    const othersAndPendingOffline = currentLocal.filter((r) => {
      if (r.user_id !== userId) return true;
      return r.id.startsWith('raf_') && !remoteSlugs.has(r.slug) && !remoteIds.has(r.id);
    });
    saveLocalRaffles([...remoteList, ...othersAndPendingOffline]);

    const userMerged = [
      ...remoteList,
      ...othersAndPendingOffline.filter((r) => r.user_id === userId),
    ];

    userMerged.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return userMerged;
  }

  // Fallback offline quando o Firestore não respondeu
  const offlineUserRaffles = localList.filter((r) => r.user_id === userId);
  offlineUserRaffles.sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  return offlineUserRaffles;
}

export async function getAllRaffles(): Promise<Raffle[]> {
  try {
    const activeDb = await getActiveDb();
    const q = query(collection(activeDb, 'raffles'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    const remoteRaffles = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
      .filter((r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max');

    // Sincroniza cache local mantendo apenas o que existe no Firestore + eventuais rifas offline raf_
    const remoteIds = new Set(remoteRaffles.map((r) => r.id));
    const remoteSlugs = new Set(remoteRaffles.map((r) => r.slug));
    const offlineOnly = getLocalRaffles().filter(
      (r) => r.id.startsWith('raf_') && !remoteIds.has(r.id) && !remoteSlugs.has(r.slug)
    );
    saveLocalRaffles([...remoteRaffles, ...offlineOnly]);

    return [...remoteRaffles, ...offlineOnly];
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

export async function getRaffleById(raffleIdOrSlug: string): Promise<Raffle | null> {
  if (!raffleIdOrSlug || raffleIdOrSlug === 'demo-raffle-01') return null;

  // 1. Tenta primeiro por Document ID do Firestore (compatibilidade com /admin/rifas/[id])
  try {
    const activeDb = await getPublicFirestore();
    const d = await getDoc(doc(activeDb, 'raffles', raffleIdOrSlug));
    if (d.exists()) {
      const data = { id: d.id, ...(d.data() as Omit<Raffle, 'id'>) };
      if (data.id === 'demo-raffle-01' || data.slug === 'iphone-16-pro-max')
        return null;
      return data;
    }
  } catch {
    // Fall through to slug / local lookup
  }

  // 2. Fallback por slug amigável (ex: /admin/rifas/iphone-7k9m)
  const bySlug = await getRaffleBySlug(raffleIdOrSlug);
  if (bySlug) return bySlug;

  // 3. Fallback local
  const local = getLocalRaffles().find(
    (r) =>
      (r.id === raffleIdOrSlug || r.slug === raffleIdOrSlug) &&
      r.id !== 'demo-raffle-01'
  );
  if (local) return local;

  return null;
}

export async function getRaffleByPublicParams(
  brand: string,
  keyword: string,
  code: string
): Promise<Raffle | null> {
  if (!brand || !keyword || !code) return null;
  if (RESERVED_ROOT_SLUGS.has(brand.toLowerCase())) return null;

  const cleanKeyword = sanitizePrizeKeyword(keyword);
  const cleanCode = code.toLowerCase().trim();
  if (!cleanKeyword || !cleanCode) return null;

  // 1. Busca direta pelo slug canônico ({keyword}-{code})
  const directMatch = await getRaffleBySlug(`${cleanKeyword}-${cleanCode}`);
  if (directMatch) return directMatch;

  // 2. Fallback resiliente pelo short_code no Firestore (cobre eventual ajuste futuro de palavra-chave)
  try {
    const activeDb = await getPublicFirestore();
    const q = query(collection(activeDb, 'raffles'), where('short_code', '==', cleanCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const matched = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
        .find(
          (r) =>
            r.id !== 'demo-raffle-01' &&
            r.slug !== 'iphone-16-pro-max' &&
            (!r.prize_keyword || sanitizePrizeKeyword(r.prize_keyword) === cleanKeyword)
        );
      if (matched) {
        return await getRaffleBySlug(matched.slug);
      }
    }
  } catch {
    // fallback local abaixo
  }

  const local = getLocalRaffles().find(
    (r) =>
      r.short_code?.toLowerCase() === cleanCode &&
      (!r.prize_keyword || sanitizePrizeKeyword(r.prize_keyword) === cleanKeyword)
  );
  return local || null;
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
  const localAll = getLocalOrders();
  let remoteOrders: Order[] = [];
  let remoteQuerySucceeded = false;

  // Fetch remote orders from Firestore (sem orderBy composto para não exigir índice manual)
  try {
    const activeDb = await getActiveDb();
    const q = query(
      collection(activeDb, 'orders'),
      where('raffle_id', '==', raffleId)
    );
    const snap = await getDocs(q);
    remoteQuerySucceeded = true;
    remoteOrders = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Order, 'id'>),
    }));
  } catch (err) {
    console.warn('Error fetching orders from Firestore:', err);
  }

  if (remoteQuerySucceeded) {
    const remoteIds = new Set(remoteOrders.map((o) => o.id));
    const othersAndOffline = localAll.filter((o) => {
      if (o.raffle_id !== raffleId) return true;
      return o.id.startsWith('ord_') && !remoteIds.has(o.id);
    });
    saveLocalOrders([...remoteOrders, ...othersAndOffline]);

    for (const o of remoteOrders) mergedMap.set(o.id, o);
    for (const o of othersAndOffline) {
      if (o.raffle_id === raffleId) mergedMap.set(o.id, o);
    }
  } else {
    for (const loc of localAll) {
      if (loc.raffle_id === raffleId) mergedMap.set(loc.id, loc);
    }
  }

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  return list;
}

export function computeOccupiedTicketsFromOrders(
  orders: Order[]
): OccupiedTicket[] {
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

export async function getOccupiedTickets(
  raffleId: string
): Promise<OccupiedTicket[]> {
  const orders = await getRaffleOrders(raffleId);
  return computeOccupiedTicketsFromOrders(orders);
}

export async function createOrder(
  data: Omit<Order, 'id' | 'created_at' | 'paid_at'>
): Promise<{ success: boolean; orderId?: string; error?: string; conflictingTicket?: number }> {
  const raffle = await getRaffleById(data.raffle_id);
  if (!raffle || raffle.status !== 'active') {
    return {
      success: false,
      error: 'Esta campanha não está aberta para novas reservas no momento.',
    };
  }

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

  const sanitizedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries({
    ...data,
    discount_label: data.discount_label ?? null,
    sale_channel: data.sale_channel ?? 'public',
    partner_id: data.partner_id ?? null,
    partner_name: data.partner_name ?? null,
    commission_type: data.commission_type ?? null,
    commission_value: data.commission_value ?? null,
    commission_amount: data.commission_amount ?? null,
  })) {
    if (value !== undefined) {
      sanitizedData[key] = value;
    }
  }

  const newOrder: Order = {
    ...(sanitizedData as Omit<Order, 'id' | 'created_at' | 'paid_at'>),
    id: orderId,
    created_at: now,
    paid_at: null,
  };

  try {
    const activeDb = await getPublicFirestore();
    const docRef = await addDoc(collection(activeDb, 'orders'), {
      ...sanitizedData,
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
  // 1. Remove rifa, pedidos e logs vinculados do cache local
  saveLocalRaffles(getLocalRaffles().filter((r) => r.id !== raffleId));
  saveLocalOrders(getLocalOrders().filter((o) => o.raffle_id !== raffleId));
  saveLocalAuditLogs(getLocalAuditLogs().filter((l) => l.raffle_id !== raffleId));

  // 2. Remove no Firestore (rifa + pedidos + logs de auditoria + parceiros vinculados)
  await deletePartnersDataByRaffle(raffleId);

  try {
    const activeDb = await getActiveDb();

    try {
      const ordersSnap = await getDocs(
        query(collection(activeDb, 'orders'), where('raffle_id', '==', raffleId))
      );
      for (const od of ordersSnap.docs) {
        await deleteDoc(doc(activeDb, 'orders', od.id));
      }
    } catch (err) {
      console.warn('Error deleting remote orders for raffle:', err);
    }

    try {
      const logsSnap = await getDocs(
        query(collection(activeDb, 'audit_logs'), where('raffle_id', '==', raffleId))
      );
      for (const ld of logsSnap.docs) {
        await deleteDoc(doc(activeDb, 'audit_logs', ld.id));
      }
    } catch (err) {
      console.warn('Error deleting remote audit_logs for raffle:', err);
    }

    await deleteDoc(doc(activeDb, 'raffles', raffleId));
  } catch (err) {
    console.warn('Error deleting remote raffle from Firestore:', err);
  }

  return true;
}

export async function deleteCreatorProfile(userId: string): Promise<boolean> {
  const localRaffles = getLocalRaffles();
  const raffleIds = new Set<string>(
    localRaffles.filter((r) => r.user_id === userId).map((r) => r.id)
  );

  // 1. Remove documentos remotos no Firestore: rifas do usuário, pedidos dessas rifas, logs e perfil
  try {
    const activeDb = await getActiveDb();
    const q = query(collection(activeDb, 'raffles'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      raffleIds.add(d.id);
    }

    for (const rId of raffleIds) {
      try {
        const ordersSnap = await getDocs(
          query(collection(activeDb, 'orders'), where('raffle_id', '==', rId))
        );
        for (const od of ordersSnap.docs) {
          await deleteDoc(doc(activeDb, 'orders', od.id));
        }
      } catch (err) {
        console.warn('Error deleting remote orders for creator raffle:', err);
      }

      try {
        await deleteDoc(doc(activeDb, 'raffles', rId));
      } catch (err) {
        console.warn('Error deleting remote raffle for creator:', err);
      }
    }

    // Remove logs por user_id e por raffle_id
    try {
      const userLogsSnap = await getDocs(
        query(collection(activeDb, 'audit_logs'), where('user_id', '==', userId))
      );
      for (const ld of userLogsSnap.docs) {
        await deleteDoc(doc(activeDb, 'audit_logs', ld.id));
      }
      for (const rId of raffleIds) {
        const raffleLogsSnap = await getDocs(
          query(collection(activeDb, 'audit_logs'), where('raffle_id', '==', rId))
        );
        for (const ld of raffleLogsSnap.docs) {
          await deleteDoc(doc(activeDb, 'audit_logs', ld.id));
        }
      }
    } catch (err) {
      console.warn('Error deleting remote audit_logs for creator:', err);
    }

    await deleteDoc(doc(activeDb, 'profiles', userId));
  } catch (err) {
    console.warn('Error deleting remote creator from Firestore:', err);
  }

  // Remove parceiros, convites e acertos vinculados (por organizer_id e por raffle_id)
  await deletePartnersDataByOrganizer(userId);
  for (const rId of raffleIds) {
    await deletePartnersDataByRaffle(rId);
  }

  // 2. Limpa todos os caches locais do usuário e suas rifas/pedidos/logs
  saveLocalRaffles(
    localRaffles.filter((r) => r.user_id !== userId && !raffleIds.has(r.id))
  );
  saveLocalOrders(getLocalOrders().filter((o) => !raffleIds.has(o.raffle_id)));
  saveLocalAuditLogs(
    getLocalAuditLogs().filter(
      (l) => l.user_id !== userId && !raffleIds.has(l.raffle_id)
    )
  );

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
      for (const [userKey, profileKey] of [
        ['fastrifa_local_user', 'fastrifa_local_profile'],
        ['fastrifa_auth_user', 'fastrifa_auth_profile'],
      ]) {
        const curUser = localStorage.getItem(userKey);
        if (curUser) {
          const u = JSON.parse(curUser);
          if (u?.uid === userId) {
            localStorage.removeItem(userKey);
            localStorage.removeItem(profileKey);
          }
        }
      }
      localStorage.removeItem(`fastrifa_theme_${userId}`);
    } catch (e) {
      console.warn('Error cleaning local creator storage:', e);
    }
  }

  return true;
}

export interface CleanTestDataResult {
  deletedProfiles: number;
  deletedRaffles: number;
  deletedOrders: number;
  deletedAuditLogs: number;
  errors: string[];
}

/**
 * Limpa integralmente todos os dados de teste do sistema (perfis, rifas vinculadas e órfãs,
 * pedidos, logs de auditoria e cache local), preservando exclusivamente a(s) conta(s) Master.
 */
export async function cleanAllTestData(
  masterUid?: string | null,
  masterEmail = 'dancos3@gmail.com'
): Promise<CleanTestDataResult> {
  const normalizedMasterEmail = masterEmail.toLowerCase().trim();
  const masterUserIds = new Set<string>();
  if (masterUid) masterUserIds.add(masterUid);

  const keptMasterRaffleIds = new Set<string>();
  const deletedRaffleIds = new Set<string>();
  const result: CleanTestDataResult = {
    deletedProfiles: 0,
    deletedRaffles: 0,
    deletedOrders: 0,
    deletedAuditLogs: 0,
    errors: [],
  };

  const activeDb = await getActiveDb();
  let rafflesScanSucceeded = false;

  // 1. Identificar e limpar perfis não-master
  try {
    const profilesSnap = await getDocs(collection(activeDb, 'profiles'));
    for (const d of profilesSnap.docs) {
      const data = d.data() as Profile & { email?: string };
      const pEmail = (data.email || '').toLowerCase().trim();

      if (
        d.id === masterUid ||
        pEmail === normalizedMasterEmail ||
        data.role === 'master'
      ) {
        masterUserIds.add(d.id);
        continue;
      }

      if (pEmail === 'leitor.publico@fastrifa.com') {
        continue;
      }

      await deleteDoc(doc(activeDb, 'profiles', d.id));
      result.deletedProfiles++;
    }
  } catch (err) {
    console.warn('Erro ao limpar perfis no Firestore:', err);
    result.errors.push('Não foi possível limpar todos os perfis remotos.');
  }

  // 2. Limpar TODAS as rifas que não pertencem ao Master (incluindo rifas órfãs antigas)
  try {
    const rafflesSnap = await getDocs(collection(activeDb, 'raffles'));
    rafflesScanSucceeded = true;
    for (const d of rafflesSnap.docs) {
      const data = d.data() as Partial<Raffle>;
      const ownerId = (data.user_id || '').trim();

      if (ownerId && masterUserIds.has(ownerId)) {
        keptMasterRaffleIds.add(d.id);
      } else {
        await deleteDoc(doc(activeDb, 'raffles', d.id));
        deletedRaffleIds.add(d.id);
        result.deletedRaffles++;
      }
    }
  } catch (err) {
    console.warn('Erro ao limpar rifas no Firestore:', err);
    result.errors.push('Não foi possível excluir todas as rifas remotas.');
  }

  // 3. Limpar pedidos (orders) das rifas apagadas ou órfãos
  try {
    const ordersSnap = await getDocs(collection(activeDb, 'orders'));
    for (const d of ordersSnap.docs) {
      const data = d.data() as Partial<Order>;
      const rId = (data.raffle_id || '').trim();
      const shouldDelete =
        !rId ||
        deletedRaffleIds.has(rId) ||
        (rafflesScanSucceeded && !keptMasterRaffleIds.has(rId));

      if (shouldDelete) {
        await deleteDoc(doc(activeDb, 'orders', d.id));
        result.deletedOrders++;
      }
    }
  } catch (err) {
    console.warn('Erro ao limpar pedidos no Firestore:', err);
    result.errors.push('Não foi possível excluir todos os pedidos remotos.');
  }

  // 4. Limpar logs de auditoria de usuários não-master ou rifas apagadas/órfãs
  try {
    const logsSnap = await getDocs(collection(activeDb, 'audit_logs'));
    for (const d of logsSnap.docs) {
      const data = d.data() as Partial<AuditLog>;
      const logUserId = (data.user_id || '').trim();
      const logRaffleId = (data.raffle_id || '').trim();
      const notMasterUser = !logUserId || !masterUserIds.has(logUserId);
      const deletedOrOrphanRaffle =
        !!logRaffleId &&
        (deletedRaffleIds.has(logRaffleId) ||
          (rafflesScanSucceeded && !keptMasterRaffleIds.has(logRaffleId)));

      if (notMasterUser || deletedOrOrphanRaffle) {
        await deleteDoc(doc(activeDb, 'audit_logs', d.id));
        result.deletedAuditLogs++;
      }
    }
  } catch (err) {
    console.warn('Erro ao limpar logs de auditoria no Firestore:', err);
    result.errors.push(
      'Logs de auditoria remotos não puderam ser removidos (verifique as regras do Firestore para audit_logs).'
    );
  }

  // 5. Limpar integralmente o cache local (mantendo somente dados do Master)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('fastrifa_auth_accounts');
      localStorage.removeItem('fastrifa_local_user');
      localStorage.removeItem('fastrifa_local_profile');

      // Remove preferências individuais de tema de usuários excluídos
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fastrifa_theme_')) {
          const uidFromKey = key.replace('fastrifa_theme_', '');
          if (!masterUserIds.has(uidFromKey)) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      const remainingLocalRaffles = getLocalRaffles().filter(
        (r) =>
          masterUserIds.has(r.user_id) &&
          (!rafflesScanSucceeded ||
            keptMasterRaffleIds.has(r.id) ||
            r.id.startsWith('raf_'))
      );
      saveLocalRaffles(remainingLocalRaffles);

      const allowedLocalRaffleIds = new Set(remainingLocalRaffles.map((r) => r.id));
      saveLocalOrders(
        getLocalOrders().filter(
          (o) =>
            keptMasterRaffleIds.has(o.raffle_id) ||
            allowedLocalRaffleIds.has(o.raffle_id)
        )
      );

      saveLocalAuditLogs(
        getLocalAuditLogs().filter(
          (l) =>
            masterUserIds.has(l.user_id) &&
            (!l.raffle_id ||
              keptMasterRaffleIds.has(l.raffle_id) ||
              allowedLocalRaffleIds.has(l.raffle_id))
        )
      );
    } catch (err) {
      console.warn('Erro ao limpar cache local:', err);
    }
  }

  return result;
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
      'subtitle',
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
          } else if (field === 'subtitle') {
            changeSummaryParts.push(
              newVal ? `Subtítulo alterado para "${newVal}"` : 'Subtítulo removido'
            );
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
  const localAll = getLocalAuditLogs();
  let remoteLogs: AuditLog[] = [];
  let remoteQuerySucceeded = false;

  // Logs remotos do Firestore
  try {
    const activeDb = await getActiveDb();
    let q = query(collection(activeDb, 'audit_logs'));
    if (raffleId) {
      q = query(collection(activeDb, 'audit_logs'), where('raffle_id', '==', raffleId));
    }
    const snap = await getDocs(q);
    remoteQuerySucceeded = true;
    remoteLogs = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AuditLog, 'id'>),
    }));
  } catch (err) {
    console.warn('Error fetching audit logs from Firestore:', err);
  }

  if (remoteQuerySucceeded) {
    const remoteIds = new Set(remoteLogs.map((l) => l.id));
    const keptLocal = localAll.filter((l) => {
      if (raffleId && l.raffle_id !== raffleId) return true;
      return l.id.startsWith('log_') && !remoteIds.has(l.id);
    });
    saveLocalAuditLogs([...remoteLogs, ...keptLocal]);

    for (const l of remoteLogs) mergedMap.set(l.id, l);
    for (const l of keptLocal) {
      if (!raffleId || l.raffle_id === raffleId) mergedMap.set(l.id, l);
    }
  } else {
    for (const log of localAll) {
      if (!raffleId || log.raffle_id === raffleId) {
        mergedMap.set(log.id, log);
      }
    }
  }

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  return list;
}


/**
 * Escuta alterações em tempo real de uma rifa específica no Firestore.
 */
export function subscribeToRaffle(
  raffleId: string,
  onUpdate: (raffle: Raffle | null) => void
): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | null = null;

  getActiveDb()
    .then((activeDb) => {
      if (cancelled) return;
      unsubscribeSnapshot = onSnapshot(
        doc(activeDb, 'raffles', raffleId),
        (snap) => {
          if (cancelled) return;
          if (!snap.exists()) {
            onUpdate(null);
            return;
          }
          onUpdate({ id: snap.id, ...(snap.data() as Omit<Raffle, 'id'>) });
        },
        (err) => {
          console.warn('Erro no listener em tempo real da rifa:', err);
        }
      );
    })
    .catch((err) => {
      console.warn('Falha ao iniciar listener da rifa:', err);
    });

  return () => {
    cancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

/**
 * Escuta pedidos de uma rifa em tempo real (novas reservas, aprovações e liberações).
 */
export function subscribeToRaffleOrders(
  raffleId: string,
  onUpdate: (orders: Order[]) => void
): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | null = null;

  getActiveDb()
    .then((activeDb) => {
      if (cancelled) return;
      const q = query(
        collection(activeDb, 'orders'),
        where('raffle_id', '==', raffleId)
      );
      unsubscribeSnapshot = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const remoteOrders: Order[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, 'id'>),
          }));

          const remoteIds = new Set(remoteOrders.map((o) => o.id));
          const othersAndOffline = getLocalOrders().filter((o) => {
            if (o.raffle_id !== raffleId) return true;
            return o.id.startsWith('ord_') && !remoteIds.has(o.id);
          });
          saveLocalOrders([...remoteOrders, ...othersAndOffline]);

          const merged = new Map<string, Order>();
          for (const o of remoteOrders) merged.set(o.id, o);
          for (const o of othersAndOffline) {
            if (o.raffle_id === raffleId) merged.set(o.id, o);
          }

          const sorted = Array.from(merged.values()).sort((a, b) => {
            const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tB - tA;
          });

          onUpdate(sorted);
        },
        (err) => {
          console.warn('Erro no listener em tempo real dos pedidos:', err);
        }
      );
    })
    .catch((err) => {
      console.warn('Falha ao iniciar listener dos pedidos:', err);
    });

  return () => {
    cancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

/**
 * Escuta em tempo real todas as rifas de um criador no painel principal.
 */
export function subscribeToUserRaffles(
  userId: string,
  onUpdate: (raffles: Raffle[]) => void
): () => void {
  let cancelled = false;
  let unsubscribeSnapshot: (() => void) | null = null;

  getActiveDb()
    .then((activeDb) => {
      if (cancelled) return;
      const q = query(
        collection(activeDb, 'raffles'),
        where('user_id', '==', userId)
      );
      unsubscribeSnapshot = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const remoteRaffles = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Raffle, 'id'>) }))
            .filter(
              (r) => r.id !== 'demo-raffle-01' && r.slug !== 'iphone-16-pro-max'
            );

          const remoteIds = new Set(remoteRaffles.map((r) => r.id));
          const remoteSlugs = new Set(remoteRaffles.map((r) => r.slug));
          const othersAndPendingOffline = getLocalRaffles().filter((r) => {
            if (r.user_id !== userId) return true;
            return (
              r.id.startsWith('raf_') &&
              !remoteIds.has(r.id) &&
              !remoteSlugs.has(r.slug)
            );
          });
          saveLocalRaffles([...remoteRaffles, ...othersAndPendingOffline]);

          const merged = [
            ...remoteRaffles,
            ...othersAndPendingOffline.filter((r) => r.user_id === userId),
          ].sort((a, b) => {
            const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tB - tA;
          });

          onUpdate(merged);
        },
        (err) => {
          console.warn('Erro no listener em tempo real das rifas do usuário:', err);
        }
      );
    })
    .catch((err) => {
      console.warn('Falha ao iniciar listener das rifas do usuário:', err);
    });

  return () => {
    cancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}
