import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, getPublicFirestore } from '@/lib/firebase/config';
import { generateSecureToken, isPartnerInviteUsable } from '@/lib/partner-finance';
import {
  formatBrazilMobile,
  getBrazilMobileError,
  isValidCpf,
  onlyDigits,
} from '@/lib/validators';
import type {
  PartnerCommissionType,
  PartnerInvite,
  PartnerPayout,
  Raffle,
  RafflePartner,
  RafflePartnerStatus,
} from '@/types/database.types';

export { generateSecureToken };

const LOCAL_PARTNER_INVITES_KEY = 'fastrifa_local_partner_invites';
const LOCAL_PARTNERS_KEY = 'fastrifa_local_partners';
const LOCAL_PARTNER_PAYOUTS_KEY = 'fastrifa_local_partner_payouts';
const PARTNER_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

const SECURITY_ERROR_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'failed-precondition',
]);

function isFirestoreSecurityError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return typeof code === 'string' && SECURITY_ERROR_CODES.has(code);
}

async function getActiveDb() {
  return auth.currentUser ? db : await getPublicFirestore();
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded === 0 ? 0 : rounded;
}

function sanitizeForFirestore<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

function sortByCreatedAtDesc<T extends { created_at?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });
}

function readLocalList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalList<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
}

function upsertLocalItem<T extends { id: string }>(key: string, item: T): void {
  const current = readLocalList<T>(key);
  const exists = current.some((existing) => existing.id === item.id);
  const next = exists
    ? current.map((existing) => (existing.id === item.id ? item : existing))
    : [item, ...current];
  writeLocalList(key, next);
}

function normalizeInviteDoc(id: string, raw: Record<string, unknown>): PartnerInvite {
  const data = raw as Omit<PartnerInvite, 'id'>;
  const tsVal = data.expires_at_ts as { toMillis?: () => number } | undefined;
  const parsedExpiresAt = data.expires_at ? Date.parse(data.expires_at) : 0;
  const expiresAtMs =
    typeof data.expires_at_ms === 'number' && Number.isFinite(data.expires_at_ms)
      ? data.expires_at_ms
      : typeof tsVal?.toMillis === 'function'
        ? tsVal.toMillis()
        : Number.isFinite(parsedExpiresAt)
          ? parsedExpiresAt
          : 0;

  return {
    ...data,
    id,
    expires_at_ms: expiresAtMs,
  };
}

function normalizeCommissionValue(type: PartnerCommissionType, value: number): number {
  if (type === 'negotiable') return 0;
  const safe = Math.max(0, roundCurrency(value));
  if (type === 'percent') {
    return Math.min(100, safe);
  }
  return safe;
}

export async function createPartnerInvite(input: {
  raffle: Raffle;
  organizerId: string;
  commissionType: PartnerCommissionType;
  commissionValue: number;
  prefill?: {
    name?: string;
    cpf?: string;
    phone?: string;
    sourcePartnerId?: string;
  };
  revokeExistingCpfInRaffle?: boolean;
}): Promise<PartnerInvite> {
  const nowMs = Date.now();
  const expiresAtMs = nowMs + PARTNER_INVITE_TTL_MS;
  const nowIso = new Date(nowMs).toISOString();
  const expiresIso = new Date(expiresAtMs).toISOString();

  // Caso solicitado na reabilitação, revoga vínculos anteriores ativos do mesmo CPF nesta rifa
  if (input.revokeExistingCpfInRaffle && input.prefill?.cpf) {
    const targetCpf = onlyDigits(input.prefill.cpf);
    if (targetCpf) {
      try {
        const activeDb = await getActiveDb();
        const q = query(
          collection(activeDb, 'raffle_partners'),
          where('organizer_id', '==', input.organizerId)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const pData = d.data() as Partial<RafflePartner>;
          if (
            pData.raffle_id === input.raffle.id &&
            pData.status === 'active' &&
            onlyDigits(pData.cpf || '') === targetCpf
          ) {
            await updateDoc(doc(activeDb, 'raffle_partners', d.id), {
              status: 'revoked',
              updated_at: nowIso,
            });
          }
        }
      } catch (err) {
        if (isFirestoreSecurityError(err)) {
          throw new Error(
            'Sem permissão para revogar o vínculo anterior do parceiro. Verifique sua sessão e tente novamente.'
          );
        }
        console.warn('Erro ao revogar vínculo anterior do parceiro no Firestore:', err);
      }

      const localPartners = readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY);
      writeLocalList(
        LOCAL_PARTNERS_KEY,
        localPartners.map((p) =>
          p.organizer_id === input.organizerId &&
          p.raffle_id === input.raffle.id &&
          p.status === 'active' &&
          onlyDigits(p.cpf) === targetCpf
            ? { ...p, status: 'revoked', updated_at: nowIso }
            : p
        )
      );
    }
  }

  const token = generateSecureToken(24);
  const cleanPrefillCpf = input.prefill?.cpf ? onlyDigits(input.prefill.cpf) : '';
  const cleanPrefillPhone = input.prefill?.phone
    ? formatBrazilMobile(input.prefill.phone)
    : '';

  const basePayload: Omit<PartnerInvite, 'id'> = {
    raffle_id: input.raffle.id,
    organizer_id: input.organizerId,
    raffle_title: input.raffle.title,
    brand_name: input.raffle.brand_name?.trim() || null,
    commission_type: input.commissionType,
    commission_value: normalizeCommissionValue(input.commissionType, input.commissionValue),
    prefill_name: input.prefill?.name?.trim() || null,
    prefill_cpf: cleanPrefillCpf || null,
    prefill_phone: cleanPrefillPhone || null,
    source_partner_id: input.prefill?.sourcePartnerId?.trim() || null,
    status: 'pending',
    used_by_partner_id: null,
    used_at: null,
    created_at: nowIso,
    expires_at: expiresIso,
    expires_at_ms: expiresAtMs,
    expires_at_ts: null,
  };

  const firestorePayload = sanitizeForFirestore({
    ...basePayload,
    expires_at_ts: Timestamp.fromMillis(expiresAtMs),
  });

  try {
    const activeDb = await getActiveDb();
    await setDoc(doc(activeDb, 'partner_invites', token), firestorePayload);
  } catch (err) {
    if (isFirestoreSecurityError(err)) {
      throw new Error(
        'Sem permissão para gerar convite de parceiro no Firestore. Verifique sua sessão e tente novamente.'
      );
    }
    console.warn('Erro ao gravar convite no Firestore, mantido localmente:', err);
  }

  const invite: PartnerInvite = {
    id: token,
    ...basePayload,
  };
  upsertLocalItem(LOCAL_PARTNER_INVITES_KEY, invite);
  return invite;
}

export async function getPartnerInviteByToken(token: string): Promise<PartnerInvite | null> {
  const cleanToken = (token || '').trim();
  if (!cleanToken) return null;

  try {
    const activeDb = await getPublicFirestore();
    const snap = await getDoc(doc(activeDb, 'partner_invites', cleanToken));
    if (snap.exists()) {
      const invite = normalizeInviteDoc(snap.id, snap.data() as Record<string, unknown>);
      upsertLocalItem(LOCAL_PARTNER_INVITES_KEY, invite);
      return invite;
    }
  } catch (err) {
    console.warn('Erro ao buscar convite no Firestore:', err);
  }

  const local = readLocalList<PartnerInvite>(LOCAL_PARTNER_INVITES_KEY).find(
    (item) => item.id === cleanToken
  );
  return local || null;
}

export async function acceptPartnerInvite(input: {
  inviteToken: string;
  fullName: string;
  cpf: string;
  phoneWhatsapp: string;
}): Promise<{ success: boolean; partner?: RafflePartner; error?: string }> {
  const cleanToken = (input.inviteToken || '').trim();
  const cleanName = (input.fullName || '').trim();

  if (!cleanToken) {
    return { success: false, error: 'Convite inválido.' };
  }
  if (cleanName.length < 3) {
    return { success: false, error: 'Informe seu nome completo (mínimo de 3 caracteres).' };
  }
  if (!isValidCpf(input.cpf)) {
    return { success: false, error: 'CPF inválido. Confira os números digitados.' };
  }
  const phoneError = getBrazilMobileError(input.phoneWhatsapp);
  if (phoneError) {
    return { success: false, error: phoneError };
  }

  let invite: PartnerInvite | null = null;
  let existsRemotely = false;
  let remoteDb = db;

  try {
    remoteDb = await getPublicFirestore();
    const snap = await getDoc(doc(remoteDb, 'partner_invites', cleanToken));
    if (snap.exists()) {
      existsRemotely = true;
      invite = normalizeInviteDoc(snap.id, snap.data() as Record<string, unknown>);
    }
  } catch (err) {
    console.warn('Erro ao consultar convite remoto no Firestore:', err);
  }

  if (!invite) {
    invite =
      readLocalList<PartnerInvite>(LOCAL_PARTNER_INVITES_KEY).find(
        (item) => item.id === cleanToken
      ) || null;
  }

  if (!invite) {
    return { success: false, error: 'Convite não encontrado.' };
  }

  const usability = isPartnerInviteUsable(invite);
  if (!usability.usable) {
    if (usability.reason === 'used') {
      return {
        success: false,
        error: 'Este convite já foi utilizado e não pode ser reaproveitado.',
      };
    }
    if (usability.reason === 'revoked') {
      return {
        success: false,
        error: 'Este convite foi cancelado pelo organizador da campanha.',
      };
    }
    return {
      success: false,
      error: 'Este convite expirou (prazo máximo de 24 horas). Solicite um novo link ao organizador.',
    };
  }

  const accessToken = generateSecureToken(24);
  const cpfDigits = onlyDigits(input.cpf);
  const formattedPhone = formatBrazilMobile(input.phoneWhatsapp);
  const nowIso = new Date().toISOString();

  const partnerPayload: Omit<RafflePartner, 'id'> = {
    invite_id: invite.id,
    raffle_id: invite.raffle_id,
    organizer_id: invite.organizer_id,
    full_name: cleanName,
    cpf: cpfDigits,
    cpf_last4: cpfDigits.slice(-4),
    phone_whatsapp: formattedPhone,
    commission_type: invite.commission_type,
    commission_value: normalizeCommissionValue(invite.commission_type, invite.commission_value),
    status: 'active',
    settled_commission_amount: 0,
    confirmed_payout_amount: 0,
    payout_ids: [],
    last_settled_at: null,
    last_confirmed_at: null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (existsRemotely) {
    try {
      const batch = writeBatch(remoteDb);
      batch.set(
        doc(remoteDb, 'raffle_partners', accessToken),
        sanitizeForFirestore(partnerPayload)
      );
      batch.update(doc(remoteDb, 'partner_invites', invite.id), {
        status: 'used',
        used_by_partner_id: accessToken,
        used_at: nowIso,
      });
      await batch.commit();
    } catch (err) {
      console.warn('Falha no writeBatch remoto ao aceitar convite:', err);
      return {
        success: false,
        error:
          'Não foi possível concluir o aceite do convite. Ele pode ter expirado ou já ter sido utilizado.',
      };
    }
  }

  const partner: RafflePartner = {
    id: accessToken,
    ...partnerPayload,
  };

  upsertLocalItem(LOCAL_PARTNERS_KEY, partner);
  upsertLocalItem(LOCAL_PARTNER_INVITES_KEY, {
    ...invite,
    status: 'used',
    used_by_partner_id: accessToken,
    used_at: nowIso,
  });

  return { success: true, partner };
}

export async function getOrganizerPartnerInvites(organizerId: string): Promise<PartnerInvite[]> {
  if (!organizerId) return [];
  const localAll = readLocalList<PartnerInvite>(LOCAL_PARTNER_INVITES_KEY);
  let remoteList: PartnerInvite[] = [];
  let remoteQuerySucceeded = false;

  try {
    const activeDb = await getActiveDb();
    const q = query(
      collection(activeDb, 'partner_invites'),
      where('organizer_id', '==', organizerId)
    );
    const snap = await getDocs(q);
    remoteQuerySucceeded = true;
    remoteList = snap.docs.map((d) =>
      normalizeInviteDoc(d.id, d.data() as Record<string, unknown>)
    );
  } catch (err) {
    console.warn('Erro ao buscar convites de parceiros no Firestore:', err);
  }

  if (remoteQuerySucceeded) {
    const othersLocal = localAll.filter((item) => item.organizer_id !== organizerId);
    writeLocalList(LOCAL_PARTNER_INVITES_KEY, [...remoteList, ...othersLocal]);
    return sortByCreatedAtDesc(remoteList);
  }

  return sortByCreatedAtDesc(localAll.filter((item) => item.organizer_id === organizerId));
}

export async function revokePartnerInvite(inviteId: string): Promise<void> {
  if (!inviteId) return;

  try {
    const activeDb = await getActiveDb();
    await updateDoc(doc(activeDb, 'partner_invites', inviteId), {
      status: 'revoked',
    });
  } catch (err) {
    if (isFirestoreSecurityError(err)) {
      throw new Error(
        'Sem permissão para revogar este convite. Verifique sua sessão e tente novamente.'
      );
    }
    console.warn('Erro ao revogar convite no Firestore:', err);
  }

  const current = readLocalList<PartnerInvite>(LOCAL_PARTNER_INVITES_KEY);
  writeLocalList(
    LOCAL_PARTNER_INVITES_KEY,
    current.map((item) => (item.id === inviteId ? { ...item, status: 'revoked' } : item))
  );
}

export async function getOrganizerPartners(organizerId: string): Promise<RafflePartner[]> {
  if (!organizerId) return [];
  const localAll = readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY);
  let remoteList: RafflePartner[] = [];
  let remoteQuerySucceeded = false;

  try {
    const activeDb = await getActiveDb();
    const q = query(
      collection(activeDb, 'raffle_partners'),
      where('organizer_id', '==', organizerId)
    );
    const snap = await getDocs(q);
    remoteQuerySucceeded = true;
    remoteList = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<RafflePartner, 'id'>),
    }));
  } catch (err) {
    console.warn('Erro ao buscar parceiros no Firestore:', err);
  }

  if (remoteQuerySucceeded) {
    const othersLocal = localAll.filter((item) => item.organizer_id !== organizerId);
    writeLocalList(LOCAL_PARTNERS_KEY, [...remoteList, ...othersLocal]);
    return sortByCreatedAtDesc(remoteList);
  }

  return sortByCreatedAtDesc(localAll.filter((item) => item.organizer_id === organizerId));
}

export async function getRafflePartnerByToken(token: string): Promise<RafflePartner | null> {
  const cleanToken = (token || '').trim();
  if (!cleanToken) return null;

  try {
    const activeDb = await getPublicFirestore();
    const snap = await getDoc(doc(activeDb, 'raffle_partners', cleanToken));
    if (snap.exists()) {
      const partner: RafflePartner = {
        id: snap.id,
        ...(snap.data() as Omit<RafflePartner, 'id'>),
      };
      upsertLocalItem(LOCAL_PARTNERS_KEY, partner);
      return partner;
    }
  } catch (err) {
    console.warn('Erro ao buscar parceiro por token no Firestore:', err);
  }

  return (
    readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY).find((p) => p.id === cleanToken) || null
  );
}

export async function updateRafflePartnerStatus(
  partnerId: string,
  status: RafflePartnerStatus
): Promise<void> {
  if (!partnerId) return;
  const nowIso = new Date().toISOString();

  try {
    const activeDb = await getActiveDb();
    await updateDoc(doc(activeDb, 'raffle_partners', partnerId), {
      status,
      updated_at: nowIso,
    });
  } catch (err) {
    if (isFirestoreSecurityError(err)) {
      throw new Error(
        'Sem permissão para atualizar o status deste parceiro. Verifique sua sessão e tente novamente.'
      );
    }
    console.warn('Erro ao atualizar status do parceiro no Firestore:', err);
  }

  const current = readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY);
  writeLocalList(
    LOCAL_PARTNERS_KEY,
    current.map((item) =>
      item.id === partnerId ? { ...item, status, updated_at: nowIso } : item
    )
  );
}

export async function createPartnerPayout(input: {
  raffle: Raffle;
  organizerId: string;
  partner: RafflePartner;
  amount: number;
  note?: string;
}): Promise<PartnerPayout> {
  const payoutToken = generateSecureToken(24);
  const amount = Math.max(0, roundCurrency(input.amount));
  const nowIso = new Date().toISOString();
  const cleanNote = input.note?.trim() || null;

  const payoutPayload: Omit<PartnerPayout, 'id'> = {
    raffle_id: input.raffle.id,
    raffle_title: input.raffle.title,
    organizer_id: input.organizerId,
    partner_id: input.partner.id,
    partner_name: input.partner.full_name,
    partner_cpf: input.partner.cpf,
    amount,
    note: cleanNote,
    status: 'pending_confirmation',
    created_at: nowIso,
    confirmed_at: null,
  };

  const nextSettledAmount = roundCurrency(
    (input.partner.settled_commission_amount || 0) + amount
  );

  try {
    const activeDb = await getActiveDb();
    const batch = writeBatch(activeDb);
    batch.set(
      doc(activeDb, 'partner_payouts', payoutToken),
      sanitizeForFirestore(payoutPayload)
    );
    batch.update(doc(activeDb, 'raffle_partners', input.partner.id), {
      payout_ids: arrayUnion(payoutToken),
      settled_commission_amount: nextSettledAmount,
      last_settled_at: nowIso,
      updated_at: nowIso,
    });
    await batch.commit();
  } catch (err) {
    if (isFirestoreSecurityError(err)) {
      throw new Error(
        'Sem permissão para registrar este acerto de comissão. Verifique sua sessão e tente novamente.'
      );
    }
    console.warn('Erro ao registrar acerto de comissão no Firestore, mantido localmente:', err);
  }

  const payout: PartnerPayout = {
    id: payoutToken,
    ...payoutPayload,
  };
  upsertLocalItem(LOCAL_PARTNER_PAYOUTS_KEY, payout);

  const localPartners = readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY);
  const partnerExistsLocally = localPartners.some((p) => p.id === input.partner.id);
  const updatedPartnerList = partnerExistsLocally
    ? localPartners.map((p) =>
        p.id === input.partner.id
          ? {
              ...p,
              payout_ids: Array.from(new Set([...(p.payout_ids || []), payoutToken])),
              settled_commission_amount: roundCurrency(
                (p.settled_commission_amount || 0) + amount
              ),
              last_settled_at: nowIso,
              updated_at: nowIso,
            }
          : p
      )
    : [
        {
          ...input.partner,
          payout_ids: Array.from(new Set([...(input.partner.payout_ids || []), payoutToken])),
          settled_commission_amount: nextSettledAmount,
          last_settled_at: nowIso,
          updated_at: nowIso,
        },
        ...localPartners,
      ];
  writeLocalList(LOCAL_PARTNERS_KEY, updatedPartnerList);

  return payout;
}

export async function getOrganizerPartnerPayouts(
  organizerId: string
): Promise<PartnerPayout[]> {
  if (!organizerId) return [];
  const localAll = readLocalList<PartnerPayout>(LOCAL_PARTNER_PAYOUTS_KEY);
  let remoteList: PartnerPayout[] = [];
  let remoteQuerySucceeded = false;

  try {
    const activeDb = await getActiveDb();
    const q = query(
      collection(activeDb, 'partner_payouts'),
      where('organizer_id', '==', organizerId)
    );
    const snap = await getDocs(q);
    remoteQuerySucceeded = true;
    remoteList = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PartnerPayout, 'id'>),
    }));
  } catch (err) {
    console.warn('Erro ao buscar acertos de parceiros no Firestore:', err);
  }

  if (remoteQuerySucceeded) {
    const othersLocal = localAll.filter((item) => item.organizer_id !== organizerId);
    writeLocalList(LOCAL_PARTNER_PAYOUTS_KEY, [...remoteList, ...othersLocal]);
    return sortByCreatedAtDesc(remoteList);
  }

  return sortByCreatedAtDesc(localAll.filter((item) => item.organizer_id === organizerId));
}

export async function getPartnerPayoutByToken(
  payoutToken: string
): Promise<PartnerPayout | null> {
  const cleanToken = (payoutToken || '').trim();
  if (!cleanToken) return null;

  try {
    const activeDb = await getPublicFirestore();
    const snap = await getDoc(doc(activeDb, 'partner_payouts', cleanToken));
    if (snap.exists()) {
      const payout: PartnerPayout = {
        id: snap.id,
        ...(snap.data() as Omit<PartnerPayout, 'id'>),
      };
      upsertLocalItem(LOCAL_PARTNER_PAYOUTS_KEY, payout);
      return payout;
    }
  } catch (err) {
    console.warn('Erro ao buscar recibo de pagamento no Firestore:', err);
  }

  return (
    readLocalList<PartnerPayout>(LOCAL_PARTNER_PAYOUTS_KEY).find(
      (p) => p.id === cleanToken
    ) || null
  );
}

export async function getPartnerPayoutsByIds(payoutIds: string[]): Promise<PartnerPayout[]> {
  const uniqueIds = Array.from(
    new Set((payoutIds || []).map((id) => (id || '').trim()).filter(Boolean))
  );
  if (uniqueIds.length === 0) return [];

  const results = await Promise.all(uniqueIds.map((id) => getPartnerPayoutByToken(id)));
  return sortByCreatedAtDesc(
    results.filter((item): item is PartnerPayout => item !== null)
  );
}

export async function confirmPartnerPayout(
  payoutToken: string
): Promise<{ success: boolean; payout?: PartnerPayout; error?: string }> {
  const cleanToken = (payoutToken || '').trim();
  if (!cleanToken) {
    return { success: false, error: 'Recibo de pagamento não encontrado.' };
  }

  let payout: PartnerPayout | null = null;
  let existsRemotely = false;
  let remoteDb = db;

  try {
    remoteDb = await getPublicFirestore();
    const snap = await getDoc(doc(remoteDb, 'partner_payouts', cleanToken));
    if (snap.exists()) {
      existsRemotely = true;
      payout = {
        id: snap.id,
        ...(snap.data() as Omit<PartnerPayout, 'id'>),
      };
    }
  } catch (err) {
    console.warn('Erro ao consultar recibo remoto no Firestore:', err);
  }

  if (!payout) {
    payout =
      readLocalList<PartnerPayout>(LOCAL_PARTNER_PAYOUTS_KEY).find(
        (p) => p.id === cleanToken
      ) || null;
  }

  if (!payout) {
    return { success: false, error: 'Recibo de pagamento não encontrado.' };
  }

  if (payout.status === 'confirmed') {
    return { success: true, payout };
  }

  const nowIso = new Date().toISOString();

  if (existsRemotely) {
    try {
      await updateDoc(doc(remoteDb, 'partner_payouts', cleanToken), {
        status: 'confirmed',
        confirmed_at: nowIso,
      });
    } catch (err) {
      console.warn('Erro ao confirmar recibo no Firestore:', err);
      return {
        success: false,
        error: 'Não foi possível confirmar o recebimento no momento. Tente novamente.',
      };
    }
  }

  const updatedPayout: PartnerPayout = {
    ...payout,
    status: 'confirmed',
    confirmed_at: nowIso,
  };

  upsertLocalItem(LOCAL_PARTNER_PAYOUTS_KEY, updatedPayout);
  return { success: true, payout: updatedPayout };
}

async function deleteCollectionDocsByField(
  collectionName: 'partner_invites' | 'raffle_partners' | 'partner_payouts',
  field: 'raffle_id' | 'organizer_id',
  value: string,
  filterRaffleId?: string
): Promise<void> {
  if (!value) return;
  try {
    const activeDb = await getActiveDb();
    const q = query(collection(activeDb, collectionName), where(field, '==', value));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      if (filterRaffleId) {
        const data = d.data() as { raffle_id?: string };
        if (data.raffle_id !== filterRaffleId) continue;
      }
      await deleteDoc(doc(activeDb, collectionName, d.id));
    }
  } catch (err) {
    console.warn(`Erro ao excluir ${collectionName} por ${field}:`, err);
  }
}

export async function deletePartnersDataByRaffle(
  raffleId: string,
  organizerId?: string
): Promise<void> {
  if (!raffleId) return;

  writeLocalList(
    LOCAL_PARTNER_INVITES_KEY,
    readLocalList<PartnerInvite>(LOCAL_PARTNER_INVITES_KEY).filter(
      (item) => item.raffle_id !== raffleId
    )
  );
  writeLocalList(
    LOCAL_PARTNERS_KEY,
    readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY).filter(
      (item) => item.raffle_id !== raffleId
    )
  );
  writeLocalList(
    LOCAL_PARTNER_PAYOUTS_KEY,
    readLocalList<PartnerPayout>(LOCAL_PARTNER_PAYOUTS_KEY).filter(
      (item) => item.raffle_id !== raffleId
    )
  );

  if (organizerId) {
    await Promise.all([
      deleteCollectionDocsByField('partner_invites', 'organizer_id', organizerId, raffleId),
      deleteCollectionDocsByField('raffle_partners', 'organizer_id', organizerId, raffleId),
      deleteCollectionDocsByField('partner_payouts', 'organizer_id', organizerId, raffleId),
    ]);
    return;
  }

  await Promise.all([
    deleteCollectionDocsByField('partner_invites', 'raffle_id', raffleId),
    deleteCollectionDocsByField('raffle_partners', 'raffle_id', raffleId),
    deleteCollectionDocsByField('partner_payouts', 'raffle_id', raffleId),
  ]);
}

export async function deletePartnersDataByOrganizer(organizerId: string): Promise<void> {
  if (!organizerId) return;

  writeLocalList(
    LOCAL_PARTNER_INVITES_KEY,
    readLocalList<PartnerInvite>(LOCAL_PARTNER_INVITES_KEY).filter(
      (item) => item.organizer_id !== organizerId
    )
  );
  writeLocalList(
    LOCAL_PARTNERS_KEY,
    readLocalList<RafflePartner>(LOCAL_PARTNERS_KEY).filter(
      (item) => item.organizer_id !== organizerId
    )
  );
  writeLocalList(
    LOCAL_PARTNER_PAYOUTS_KEY,
    readLocalList<PartnerPayout>(LOCAL_PARTNER_PAYOUTS_KEY).filter(
      (item) => item.organizer_id !== organizerId
    )
  );

  await Promise.all([
    deleteCollectionDocsByField('partner_invites', 'organizer_id', organizerId),
    deleteCollectionDocsByField('raffle_partners', 'organizer_id', organizerId),
    deleteCollectionDocsByField('partner_payouts', 'organizer_id', organizerId),
  ]);
}
