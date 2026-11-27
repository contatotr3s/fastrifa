import type {
  Order,
  PartnerCommissionType,
  PartnerInvite,
  PartnerPayout,
  Raffle,
  RafflePartner,
} from '../types/database.types';

export const SAFE_TOKEN_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
export const PARTNER_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export interface PartnerCheckoutSessionState {
  buyerName: string;
  buyerPhone: string;
  verifiedNumbers: number[];
  rouletteWonPercent: number | null;
  rouletteHighestPercent: number;
  discountStartedAtMs: number | null;
  discountExpired: boolean;
}

export interface PartnerStats {
  partnerId: string;
  raffleId: string;
  commissionType: PartnerCommissionType;
  commissionValue: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
  paidTicketsCount: number;
  pendingTicketsCount: number;
  paidRevenue: number;
  pendingRevenue: number;
  confirmedCommission: number;
  pendingCommission: number;
  settledAmount: number;
  confirmedPayoutAmount: number;
  pendingConfirmationAmount: number;
  pendingConfirmationCount: number;
  confirmedPayoutCount: number;
  balanceToSettle: number;
  overpaidAmount: number;
  hasUnsettledNegotiableSales: boolean;
}

export interface OrganizerFinancialSummary {
  raffleFilterId: string;
  rafflesCount: number;
  activePartnersCount: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  confirmedTickets: number;
  pendingTickets: number;
  directRevenue: number;
  directTickets: number;
  publicRevenue: number;
  publicTickets: number;
  organizerDirectRevenue: number;
  organizerDirectTickets: number;
  partnerRevenue: number;
  partnerTickets: number;
  confirmedCommissions: number;
  pendingCommissions: number;
  totalSettledPayouts: number;
  confirmedPayouts: number;
  pendingConfirmationPayouts: number;
  negotiableSettledPayouts: number;
  totalDeductedCommissions: number;
  estimatedNetProfit: number;
  hasUnsettledNegotiableSales: boolean;
  unsettledNegotiablePartnersCount: number;
  unsettledNegotiableRevenue: number;
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded === 0 ? 0 : rounded;
}

function normalizeCpfDigits(cpf: string): string {
  return (cpf || '').replace(/\D/g, '');
}

function resolveOrderCommission(
  order: Order,
  fallbackType: PartnerCommissionType,
  fallbackValue: number
): number {
  if (order.status === 'cancelled') return 0;
  if (typeof order.commission_amount === 'number' && Number.isFinite(order.commission_amount)) {
    return roundCurrency(Math.max(0, order.commission_amount));
  }
  return calculateOrderCommission({
    totalAmount: order.total_amount,
    ticketCount: Array.isArray(order.ticket_numbers) ? order.ticket_numbers.length : 0,
    commissionType: order.commission_type ?? fallbackType,
    commissionValue: order.commission_value ?? fallbackValue,
  });
}

function getPartnerRecencyMs(partner: RafflePartner): number {
  const updatedMs = Date.parse(partner.updated_at || '');
  if (Number.isFinite(updatedMs)) return updatedMs;
  const createdMs = Date.parse(partner.created_at || '');
  return Number.isFinite(createdMs) ? createdMs : 0;
}

/**
 * Gera token criptográfico seguro usando apenas caracteres sem ambiguidade visual.
 * Garante ao menos 32 caracteres no alfabeto seguro.
 */
export function generateSecureToken(byteLength = 24): string {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error('Web Crypto API indisponível para geração de token seguro.');
  }

  const targetLength = Math.max(32, Math.floor(byteLength * 2));
  const alphabetLength = SAFE_TOKEN_ALPHABET.length;
  const maxUnbiasedByte = 256 - (256 % alphabetLength);
  let token = '';

  while (token.length < targetLength) {
    const buffer = new Uint8Array(targetLength - token.length + 16);
    cryptoObj.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && token.length < targetLength; i++) {
      if (buffer[i] < maxUnbiasedByte) {
        token += SAFE_TOKEN_ALPHABET[buffer[i] % alphabetLength];
      }
    }
  }

  return token;
}

/**
 * Calcula a comissão de um pedido de acordo com a regra congelada na reserva.
 */
export function calculateOrderCommission({
  totalAmount,
  ticketCount,
  commissionType,
  commissionValue,
}: {
  totalAmount: number;
  ticketCount: number;
  commissionType: PartnerCommissionType;
  commissionValue: number;
}): number {
  if (!Number.isFinite(commissionValue) || commissionValue <= 0) {
    return 0;
  }
  if (commissionType === 'negotiable') {
    return 0;
  }
  if (commissionType === 'percent') {
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) return 0;
    return roundCurrency((totalAmount * commissionValue) / 100);
  }
  if (commissionType === 'fixed_per_ticket') {
    if (!Number.isFinite(ticketCount) || ticketCount <= 0) return 0;
    return roundCurrency(ticketCount * commissionValue);
  }
  return 0;
}

/**
 * Formata a regra de comissão para exibição amigável nas telas e badges.
 */
export function formatCommissionRuleLabel(
  type: PartnerCommissionType,
  value: number
): string {
  if (type === 'negotiable') {
    return 'A combinar';
  }

  const safeValue = Number.isFinite(value) && value > 0 ? roundCurrency(value) : 0;

  if (type === 'percent') {
    if (safeValue === 0) return '0% (Voluntário)';
    const formatted = Number.isInteger(safeValue)
      ? String(safeValue)
      : safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    return `${formatted}%`;
  }

  if (type === 'fixed_per_ticket') {
    const formatted = safeValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (safeValue === 0) return `R$ ${formatted}/cota (Voluntário)`;
    return `R$ ${formatted}/cota`;
  }

  return 'A combinar';
}

/**
 * Mascara o CPF exibindo apenas os dois últimos dígitos verificadores (***.***.***-89).
 */
export function maskCpfDisplay(cpf: string): string {
  const digits = normalizeCpfDigits(cpf);
  if (digits.length < 2) {
    return '***.***.***-**';
  }
  return `***.***.***-${digits.slice(-2)}`;
}

/**
 * Valida se o convite único de 24h ainda pode ser aceito.
 */
export function isPartnerInviteUsable(
  invite: Pick<PartnerInvite, 'status' | 'expires_at_ms'>,
  nowMs = Date.now()
): { usable: boolean; reason?: 'used' | 'revoked' | 'expired' } {
  if (invite.status === 'used') {
    return { usable: false, reason: 'used' };
  }
  if (invite.status === 'revoked') {
    return { usable: false, reason: 'revoked' };
  }
  if (!Number.isFinite(invite.expires_at_ms) || invite.expires_at_ms <= nowMs) {
    return { usable: false, reason: 'expired' };
  }
  return { usable: true };
}

/**
 * Retorna estado zerado de atendimento presencial para troca rápida de cliente na Roleta/Checkout.
 */
export function buildInitialPartnerCheckoutSession(): PartnerCheckoutSessionState {
  return {
    buyerName: '',
    buyerPhone: '',
    verifiedNumbers: [],
    rouletteWonPercent: null,
    rouletteHighestPercent: 0,
    discountStartedAtMs: null,
    discountExpired: false,
  };
}

/**
 * Consolida vendas, comissões e acertos de um parceiro específico.
 */
export function computePartnerStats(
  partner: RafflePartner,
  orders: Order[],
  payouts: PartnerPayout[]
): PartnerStats {
  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let paidTicketsCount = 0;
  let pendingTicketsCount = 0;
  let paidRevenue = 0;
  let pendingRevenue = 0;
  let confirmedCommission = 0;
  let pendingCommission = 0;

  for (const order of orders) {
    if (order.partner_id !== partner.id) continue;
    const ticketCount = Array.isArray(order.ticket_numbers) ? order.ticket_numbers.length : 0;
    const orderAmount = Number.isFinite(order.total_amount) ? order.total_amount : 0;

    if (order.status === 'cancelled') {
      cancelledOrdersCount += 1;
      continue;
    }

    const commission = resolveOrderCommission(
      order,
      partner.commission_type,
      partner.commission_value
    );

    if (order.status === 'paid') {
      paidOrdersCount += 1;
      paidTicketsCount += ticketCount;
      paidRevenue += orderAmount;
      confirmedCommission += commission;
    } else if (order.status === 'pending') {
      pendingOrdersCount += 1;
      pendingTicketsCount += ticketCount;
      pendingRevenue += orderAmount;
      pendingCommission += commission;
    }
  }

  let settledAmount = 0;
  let confirmedPayoutAmount = 0;
  let pendingConfirmationAmount = 0;
  let pendingConfirmationCount = 0;
  let confirmedPayoutCount = 0;

  for (const payout of payouts) {
    if (payout.partner_id !== partner.id) continue;
    const amount = Number.isFinite(payout.amount) ? Math.max(0, payout.amount) : 0;
    settledAmount += amount;
    if (payout.status === 'confirmed') {
      confirmedPayoutAmount += amount;
      confirmedPayoutCount += 1;
    } else {
      pendingConfirmationAmount += amount;
      pendingConfirmationCount += 1;
    }
  }

  const roundedConfirmedCommission = roundCurrency(confirmedCommission);
  const roundedSettled = roundCurrency(settledAmount);

  return {
    partnerId: partner.id,
    raffleId: partner.raffle_id,
    commissionType: partner.commission_type,
    commissionValue: partner.commission_value,
    paidOrdersCount,
    pendingOrdersCount,
    cancelledOrdersCount,
    paidTicketsCount,
    pendingTicketsCount,
    paidRevenue: roundCurrency(paidRevenue),
    pendingRevenue: roundCurrency(pendingRevenue),
    confirmedCommission: roundedConfirmedCommission,
    pendingCommission: roundCurrency(pendingCommission),
    settledAmount: roundedSettled,
    confirmedPayoutAmount: roundCurrency(confirmedPayoutAmount),
    pendingConfirmationAmount: roundCurrency(pendingConfirmationAmount),
    pendingConfirmationCount,
    confirmedPayoutCount,
    balanceToSettle: roundCurrency(Math.max(0, roundedConfirmedCommission - roundedSettled)),
    overpaidAmount: roundCurrency(Math.max(0, roundedSettled - roundedConfirmedCommission)),
    hasUnsettledNegotiableSales:
      partner.commission_type === 'negotiable' && paidOrdersCount > 0 && roundedSettled === 0,
  };
}

/**
 * Consolida o resumo financeiro do organizador no Dashboard `/admin`,
 * evitando duplo abatimento entre comissões numéricas e acertos registrados.
 */
export function computeOrganizerFinancialSummary(
  raffles: Raffle[],
  orders: Order[],
  partners: RafflePartner[],
  payouts: PartnerPayout[],
  raffleFilterId: string | 'all' = 'all'
): OrganizerFinancialSummary {
  const isAll = raffleFilterId === 'all';
  const filteredRaffles = isAll ? raffles : raffles.filter((r) => r.id === raffleFilterId);
  const filteredOrders = isAll ? orders : orders.filter((o) => o.raffle_id === raffleFilterId);
  const filteredPartners = isAll ? partners : partners.filter((p) => p.raffle_id === raffleFilterId);
  const filteredPayouts = isAll ? payouts : payouts.filter((p) => p.raffle_id === raffleFilterId);

  const partnerById = new Map<string, RafflePartner>();
  for (const partner of filteredPartners) {
    partnerById.set(partner.id, partner);
  }

  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let confirmedRevenue = 0;
  let pendingRevenue = 0;
  let confirmedTickets = 0;
  let pendingTickets = 0;
  let publicRevenue = 0;
  let publicTickets = 0;
  let organizerDirectRevenue = 0;
  let organizerDirectTickets = 0;
  let partnerRevenue = 0;
  let partnerTickets = 0;
  let confirmedCommissions = 0;
  let pendingCommissions = 0;

  const negotiablePaidRevenueByPartner = new Map<string, number>();
  const partnerOrderRuleById = new Map<string, PartnerCommissionType>();

  for (const order of filteredOrders) {
    if (order.status === 'cancelled') {
      cancelledOrdersCount += 1;
      continue;
    }

    const ticketCount = Array.isArray(order.ticket_numbers) ? order.ticket_numbers.length : 0;
    const orderAmount = Number.isFinite(order.total_amount) ? order.total_amount : 0;
    const channel = order.sale_channel ?? (order.partner_id ? 'partner' : 'public');
    const partner = order.partner_id ? partnerById.get(order.partner_id) : undefined;
    const ruleType = order.commission_type ?? partner?.commission_type ?? 'negotiable';
    const ruleValue = order.commission_value ?? partner?.commission_value ?? 0;

    if (order.partner_id && order.commission_type) {
      partnerOrderRuleById.set(order.partner_id, order.commission_type);
    }

    const orderCommission =
      channel === 'partner' || order.partner_id
        ? resolveOrderCommission(order, ruleType, ruleValue)
        : 0;

    if (order.status === 'paid') {
      paidOrdersCount += 1;
      confirmedRevenue += orderAmount;
      confirmedTickets += ticketCount;

      if (channel === 'partner') {
        partnerRevenue += orderAmount;
        partnerTickets += ticketCount;
        confirmedCommissions += orderCommission;

        if (ruleType === 'negotiable' && order.partner_id) {
          negotiablePaidRevenueByPartner.set(
            order.partner_id,
            (negotiablePaidRevenueByPartner.get(order.partner_id) ?? 0) + orderAmount
          );
        }
      } else if (channel === 'organizer_direct') {
        organizerDirectRevenue += orderAmount;
        organizerDirectTickets += ticketCount;
      } else {
        publicRevenue += orderAmount;
        publicTickets += ticketCount;
      }
    } else if (order.status === 'pending') {
      pendingOrdersCount += 1;
      pendingRevenue += orderAmount;
      pendingTickets += ticketCount;
      if (channel === 'partner' || order.partner_id) {
        pendingCommissions += orderCommission;
      }
    }
  }

  let totalSettledPayouts = 0;
  let confirmedPayouts = 0;
  let pendingConfirmationPayouts = 0;
  let negotiableSettledPayouts = 0;
  const settledByPartner = new Map<string, number>();

  for (const payout of filteredPayouts) {
    const amount = Number.isFinite(payout.amount) ? Math.max(0, payout.amount) : 0;
    totalSettledPayouts += amount;
    settledByPartner.set(
      payout.partner_id,
      (settledByPartner.get(payout.partner_id) ?? 0) + amount
    );

    if (payout.status === 'confirmed') {
      confirmedPayouts += amount;
    } else {
      pendingConfirmationPayouts += amount;
    }

    const partner = partnerById.get(payout.partner_id);
    const partnerRule =
      partner?.commission_type ?? partnerOrderRuleById.get(payout.partner_id) ?? 'negotiable';
    if (partnerRule === 'negotiable') {
      negotiableSettledPayouts += amount;
    }
  }

  let unsettledNegotiablePartnersCount = 0;
  let unsettledNegotiableRevenue = 0;
  for (const [partnerId, rev] of negotiablePaidRevenueByPartner.entries()) {
    if ((settledByPartner.get(partnerId) ?? 0) <= 0) {
      unsettledNegotiablePartnersCount += 1;
      unsettledNegotiableRevenue += rev;
    }
  }

  const roundedConfirmedRevenue = roundCurrency(confirmedRevenue);
  const roundedConfirmedCommissions = roundCurrency(confirmedCommissions);
  const roundedNegotiableSettled = roundCurrency(negotiableSettledPayouts);
  const totalDeductedCommissions = roundCurrency(
    roundedConfirmedCommissions + roundedNegotiableSettled
  );

  return {
    raffleFilterId,
    rafflesCount: filteredRaffles.length,
    activePartnersCount: filteredPartners.filter((p) => p.status === 'active').length,
    paidOrdersCount,
    pendingOrdersCount,
    cancelledOrdersCount,
    confirmedRevenue: roundedConfirmedRevenue,
    pendingRevenue: roundCurrency(pendingRevenue),
    confirmedTickets,
    pendingTickets,
    directRevenue: roundCurrency(publicRevenue + organizerDirectRevenue),
    directTickets: publicTickets + organizerDirectTickets,
    publicRevenue: roundCurrency(publicRevenue),
    publicTickets,
    organizerDirectRevenue: roundCurrency(organizerDirectRevenue),
    organizerDirectTickets,
    partnerRevenue: roundCurrency(partnerRevenue),
    partnerTickets,
    confirmedCommissions: roundedConfirmedCommissions,
    pendingCommissions: roundCurrency(pendingCommissions),
    totalSettledPayouts: roundCurrency(totalSettledPayouts),
    confirmedPayouts: roundCurrency(confirmedPayouts),
    pendingConfirmationPayouts: roundCurrency(pendingConfirmationPayouts),
    negotiableSettledPayouts: roundedNegotiableSettled,
    totalDeductedCommissions,
    estimatedNetProfit: roundCurrency(roundedConfirmedRevenue - totalDeductedCommissions),
    hasUnsettledNegotiableSales: unsettledNegotiablePartnersCount > 0,
    unsettledNegotiablePartnersCount,
    unsettledNegotiableRevenue: roundCurrency(unsettledNegotiableRevenue),
  };
}

/**
 * Lista parceiros de outras campanhas do mesmo organizador deduplicados por CPF normalizado
 * (mantendo o registro mais recente) e excluindo quem já está ativo na rifa atual.
 */
export function collectReusableCatalogPartners(
  allPartners: RafflePartner[],
  currentRaffleId: string
): RafflePartner[] {
  const activeCpfsOnCurrentRaffle = new Set<string>();
  for (const partner of allPartners) {
    if (partner.raffle_id === currentRaffleId && partner.status === 'active') {
      const cpfDigits = normalizeCpfDigits(partner.cpf);
      if (cpfDigits) {
        activeCpfsOnCurrentRaffle.add(cpfDigits);
      }
    }
  }

  const latestByCpf = new Map<string, RafflePartner>();
  for (const partner of allPartners) {
    if (partner.raffle_id === currentRaffleId) continue;
    const cpfDigits = normalizeCpfDigits(partner.cpf);
    if (!cpfDigits || activeCpfsOnCurrentRaffle.has(cpfDigits)) continue;

    const existing = latestByCpf.get(cpfDigits);
    if (!existing || getPartnerRecencyMs(partner) > getPartnerRecencyMs(existing)) {
      latestByCpf.set(cpfDigits, partner);
    }
  }

  return Array.from(latestByCpf.values()).sort(
    (a, b) => getPartnerRecencyMs(b) - getPartnerRecencyMs(a)
  );
}
