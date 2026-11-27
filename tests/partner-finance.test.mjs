import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  SAFE_TOKEN_ALPHABET,
  generateSecureToken,
  calculateOrderCommission,
  formatCommissionRuleLabel,
  maskCpfDisplay,
  isPartnerInviteUsable,
  buildInitialPartnerCheckoutSession,
  computePartnerStats,
  computeOrganizerFinancialSummary,
  collectReusableCatalogPartners,
} = require('../.tmp-tests/lib/partner-finance.js');

test('generateSecureToken gera 500 tokens únicos com alfabeto seguro e >= 32 caracteres', () => {
  assert.equal(SAFE_TOKEN_ALPHABET, '23456789abcdefghjkmnpqrstuvwxyz');
  const seen = new Set();
  const regex = /^[23456789abcdefghjkmnpqrstuvwxyz]{32,}$/;

  for (let i = 0; i < 500; i++) {
    const token = generateSecureToken();
    assert.match(token, regex);
    assert.equal(seen.has(token), false);
    seen.add(token);
  }
  assert.equal(seen.size, 500);
});

test('calculateOrderCommission calcula corretamente negotiable, percent 0%, percent 15% e fixed_per_ticket 1.5', () => {
  assert.equal(
    calculateOrderCommission({
      totalAmount: 150,
      ticketCount: 15,
      commissionType: 'negotiable',
      commissionValue: 20,
    }),
    0
  );

  assert.equal(
    calculateOrderCommission({
      totalAmount: 200,
      ticketCount: 20,
      commissionType: 'percent',
      commissionValue: 0,
    }),
    0
  );

  assert.equal(
    calculateOrderCommission({
      totalAmount: 199.9,
      ticketCount: 10,
      commissionType: 'percent',
      commissionValue: 15,
    }),
    29.99
  );

  assert.equal(
    calculateOrderCommission({
      totalAmount: 100,
      ticketCount: 7,
      commissionType: 'fixed_per_ticket',
      commissionValue: 1.5,
    }),
    10.5
  );
});

test('formatCommissionRuleLabel e maskCpfDisplay formatam corretamente', () => {
  assert.equal(formatCommissionRuleLabel('negotiable', 0), 'A combinar');
  assert.equal(formatCommissionRuleLabel('percent', 0), '0% (Voluntário)');
  assert.equal(formatCommissionRuleLabel('percent', 15), '15%');
  assert.equal(formatCommissionRuleLabel('fixed_per_ticket', 1.5), 'R$ 1,50/cota');
  assert.equal(maskCpfDisplay('123.456.789-89'), '***.***.***-89');
  assert.equal(maskCpfDisplay('12345678901'), '***.***.***-01');
});

test('isPartnerInviteUsable valida pending válido, expirado, used e revoked', () => {
  const now = 1_700_000_000_000;

  assert.deepEqual(
    isPartnerInviteUsable({ status: 'pending', expires_at_ms: now + 60_000 }, now),
    { usable: true }
  );

  assert.deepEqual(
    isPartnerInviteUsable({ status: 'pending', expires_at_ms: now }, now),
    { usable: false, reason: 'expired' }
  );

  assert.deepEqual(
    isPartnerInviteUsable({ status: 'pending', expires_at_ms: now - 1 }, now),
    { usable: false, reason: 'expired' }
  );

  assert.deepEqual(
    isPartnerInviteUsable({ status: 'used', expires_at_ms: now + 60_000 }, now),
    { usable: false, reason: 'used' }
  );

  assert.deepEqual(
    isPartnerInviteUsable({ status: 'revoked', expires_at_ms: now + 60_000 }, now),
    { usable: false, reason: 'revoked' }
  );
});

test('buildInitialPartnerCheckoutSession retorna estado zerado para troca de cliente', () => {
  const sessionA = buildInitialPartnerCheckoutSession();
  const sessionB = buildInitialPartnerCheckoutSession();

  assert.deepEqual(sessionA, {
    buyerName: '',
    buyerPhone: '',
    verifiedNumbers: [],
    rouletteWonPercent: null,
    rouletteHighestPercent: 0,
    discountStartedAtMs: null,
    discountExpired: false,
  });

  sessionA.verifiedNumbers.push(12);
  assert.deepEqual(sessionB.verifiedNumbers, []);
});

test('computePartnerStats e computeOrganizerFinancialSummary calculam canais mistos, excluem cancelados e evitam duplo abatimento', () => {
  const raffles = [
    {
      id: 'raffle-1',
      user_id: 'org-1',
      title: 'Rifa Moto',
      slug: 'moto-1234',
      description: 'Desc',
      ticket_price: 10,
      total_tickets: 100,
      pix_key: 'org@pix.com',
      pix_key_type: 'email',
      status: 'active',
      created_at: '2026-11-20T10:00:00.000Z',
      updated_at: '2026-11-20T10:00:00.000Z',
    },
  ];

  const partners = [
    {
      id: 'partner-pct',
      invite_id: 'inv-1',
      raffle_id: 'raffle-1',
      organizer_id: 'org-1',
      full_name: 'João Percentual',
      cpf: '11122233344',
      cpf_last4: '3344',
      phone_whatsapp: '11999990001',
      commission_type: 'percent',
      commission_value: 10,
      status: 'active',
      created_at: '2026-11-21T10:00:00.000Z',
      updated_at: '2026-11-21T10:00:00.000Z',
    },
    {
      id: 'partner-fixed',
      invite_id: 'inv-2',
      raffle_id: 'raffle-1',
      organizer_id: 'org-1',
      full_name: 'Maria Fixo',
      cpf: '22233344455',
      cpf_last4: '4455',
      phone_whatsapp: '11999990002',
      commission_type: 'fixed_per_ticket',
      commission_value: 2,
      status: 'active',
      created_at: '2026-11-21T10:00:00.000Z',
      updated_at: '2026-11-21T10:00:00.000Z',
    },
    {
      id: 'partner-vol',
      invite_id: 'inv-3',
      raffle_id: 'raffle-1',
      organizer_id: 'org-1',
      full_name: 'Pedro Voluntário',
      cpf: '33344455566',
      cpf_last4: '5566',
      phone_whatsapp: '11999990003',
      commission_type: 'percent',
      commission_value: 0,
      status: 'active',
      created_at: '2026-11-21T10:00:00.000Z',
      updated_at: '2026-11-21T10:00:00.000Z',
    },
    {
      id: 'partner-neg',
      invite_id: 'inv-4',
      raffle_id: 'raffle-1',
      organizer_id: 'org-1',
      full_name: 'Ana Combinar',
      cpf: '44455566677',
      cpf_last4: '6677',
      phone_whatsapp: '11999990004',
      commission_type: 'negotiable',
      commission_value: 0,
      status: 'active',
      created_at: '2026-11-21T10:00:00.000Z',
      updated_at: '2026-11-21T10:00:00.000Z',
    },
  ];

  const orders = [
    // Venda pública paga: 5 cotas, R$ 50
    {
      id: 'ord-1',
      raffle_id: 'raffle-1',
      buyer_name: 'C1',
      buyer_phone: '11911111111',
      ticket_numbers: [1, 2, 3, 4, 5],
      total_amount: 50,
      status: 'paid',
      sale_channel: 'public',
      created_at: '2026-11-22T10:00:00.000Z',
      paid_at: '2026-11-22T10:05:00.000Z',
    },
    // Venda direta organizador paga: 3 cotas, R$ 30
    {
      id: 'ord-2',
      raffle_id: 'raffle-1',
      buyer_name: 'C2',
      buyer_phone: '11911111112',
      ticket_numbers: [6, 7, 8],
      total_amount: 30,
      status: 'paid',
      sale_channel: 'organizer_direct',
      created_at: '2026-11-22T10:10:00.000Z',
      paid_at: '2026-11-22T10:12:00.000Z',
    },
    // Parceiro 10% pago: 10 cotas, R$ 100 -> comissão R$ 10
    {
      id: 'ord-3',
      raffle_id: 'raffle-1',
      buyer_name: 'C3',
      buyer_phone: '11911111113',
      ticket_numbers: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      total_amount: 100,
      status: 'paid',
      sale_channel: 'partner',
      partner_id: 'partner-pct',
      partner_name: 'João Percentual',
      commission_type: 'percent',
      commission_value: 10,
      commission_amount: 10,
      created_at: '2026-11-22T10:20:00.000Z',
      paid_at: '2026-11-22T10:25:00.000Z',
    },
    // Parceiro 10% cancelado: NÃO pode entrar em faturamento nem comissão!
    {
      id: 'ord-4',
      raffle_id: 'raffle-1',
      buyer_name: 'C4',
      buyer_phone: '11911111114',
      ticket_numbers: [19, 20],
      total_amount: 20,
      status: 'cancelled',
      sale_channel: 'partner',
      partner_id: 'partner-pct',
      partner_name: 'João Percentual',
      commission_type: 'percent',
      commission_value: 10,
      commission_amount: 2,
      created_at: '2026-11-22T10:30:00.000Z',
    },
    // Parceiro R$2/cota pago: 4 cotas, R$ 40 -> comissão R$ 8
    {
      id: 'ord-5',
      raffle_id: 'raffle-1',
      buyer_name: 'C5',
      buyer_phone: '11911111115',
      ticket_numbers: [21, 22, 23, 24],
      total_amount: 40,
      status: 'paid',
      sale_channel: 'partner',
      partner_id: 'partner-fixed',
      partner_name: 'Maria Fixo',
      commission_type: 'fixed_per_ticket',
      commission_value: 2,
      commission_amount: 8,
      created_at: '2026-11-22T10:40:00.000Z',
      paid_at: '2026-11-22T10:45:00.000Z',
    },
    // Parceiro R$2/cota pendente: 3 cotas, R$ 30 -> comissão pendente R$ 6
    {
      id: 'ord-6',
      raffle_id: 'raffle-1',
      buyer_name: 'C6',
      buyer_phone: '11911111116',
      ticket_numbers: [25, 26, 27],
      total_amount: 30,
      status: 'pending',
      sale_channel: 'partner',
      partner_id: 'partner-fixed',
      partner_name: 'Maria Fixo',
      commission_type: 'fixed_per_ticket',
      commission_value: 2,
      commission_amount: 6,
      created_at: '2026-11-22T10:50:00.000Z',
    },
    // Parceiro Voluntário 0% pago: 2 cotas, R$ 20 -> comissão R$ 0
    {
      id: 'ord-7',
      raffle_id: 'raffle-1',
      buyer_name: 'C7',
      buyer_phone: '11911111117',
      ticket_numbers: [28, 29],
      total_amount: 20,
      status: 'paid',
      sale_channel: 'partner',
      partner_id: 'partner-vol',
      partner_name: 'Pedro Voluntário',
      commission_type: 'percent',
      commission_value: 0,
      commission_amount: 0,
      created_at: '2026-11-22T11:00:00.000Z',
      paid_at: '2026-11-22T11:05:00.000Z',
    },
    // Parceiro A combinar pago: 6 cotas, R$ 60 -> comissão no pedido = 0
    {
      id: 'ord-8',
      raffle_id: 'raffle-1',
      buyer_name: 'C8',
      buyer_phone: '11911111118',
      ticket_numbers: [30, 31, 32, 33, 34, 35],
      total_amount: 60,
      status: 'paid',
      sale_channel: 'partner',
      partner_id: 'partner-neg',
      partner_name: 'Ana Combinar',
      commission_type: 'negotiable',
      commission_value: 0,
      commission_amount: 0,
      created_at: '2026-11-22T11:10:00.000Z',
      paid_at: '2026-11-22T11:15:00.000Z',
    },
  ];

  const payouts = [
    // Acerto parcial do João Percentual (R$ 6 de R$ 10 já devidos — NÃO pode abater duas vezes!)
    {
      id: 'pay-1',
      raffle_id: 'raffle-1',
      raffle_title: 'Rifa Moto',
      organizer_id: 'org-1',
      partner_id: 'partner-pct',
      partner_name: 'João Percentual',
      partner_cpf: '11122233344',
      amount: 6,
      status: 'confirmed',
      created_at: '2026-11-22T12:00:00.000Z',
      confirmed_at: '2026-11-22T12:05:00.000Z',
    },
    // Acertos parciais para Ana Combinar (R$ 5 + R$ 4 = R$ 9 -> devem abater do lucro líquido!)
    {
      id: 'pay-2',
      raffle_id: 'raffle-1',
      raffle_title: 'Rifa Moto',
      organizer_id: 'org-1',
      partner_id: 'partner-neg',
      partner_name: 'Ana Combinar',
      partner_cpf: '44455566677',
      amount: 5,
      status: 'confirmed',
      created_at: '2026-11-22T12:10:00.000Z',
      confirmed_at: '2026-11-22T12:15:00.000Z',
    },
    {
      id: 'pay-3',
      raffle_id: 'raffle-1',
      raffle_title: 'Rifa Moto',
      organizer_id: 'org-1',
      partner_id: 'partner-neg',
      partner_name: 'Ana Combinar',
      partner_cpf: '44455566677',
      amount: 4,
      status: 'pending_confirmation',
      created_at: '2026-11-22T12:20:00.000Z',
    },
  ];

  const pctStats = computePartnerStats(partners[0], orders, payouts);
  assert.equal(pctStats.paidRevenue, 100);
  assert.equal(pctStats.paidTicketsCount, 10);
  assert.equal(pctStats.confirmedCommission, 10);
  assert.equal(pctStats.settledAmount, 6);
  assert.equal(pctStats.confirmedPayoutAmount, 6);
  assert.equal(pctStats.balanceToSettle, 4);

  const summary = computeOrganizerFinancialSummary(raffles, orders, partners, payouts, 'all');
  // Faturamento confirmado: 50 + 30 + 100 + 40 + 20 + 60 = 300
  assert.equal(summary.confirmedRevenue, 300);
  assert.equal(summary.confirmedTickets, 30);
  // Pendente: 30 (ord-6)
  assert.equal(summary.pendingRevenue, 30);
  assert.equal(summary.pendingTickets, 3);
  // Direto (public + organizer_direct): 80, 8 cotas; Parceiros: 220, 22 cotas
  assert.equal(summary.directRevenue, 80);
  assert.equal(summary.directTickets, 8);
  assert.equal(summary.partnerRevenue, 220);
  assert.equal(summary.partnerTickets, 22);
  // Comissões confirmadas numéricas: 10 (pct) + 8 (fixed) + 0 (vol) = 18
  assert.equal(summary.confirmedCommissions, 18);
  assert.equal(summary.pendingCommissions, 6);
  // Acertos totais: 6 + 5 + 4 = 15; confirmados: 6 + 5 = 11; aguardando: 4
  assert.equal(summary.totalSettledPayouts, 15);
  assert.equal(summary.confirmedPayouts, 11);
  assert.equal(summary.pendingConfirmationPayouts, 4);
  // Acertos "A combinar" abatidos: 9 (R$ 6 do João NÃO é abatido de novo!)
  assert.equal(summary.negotiableSettledPayouts, 9);
  assert.equal(summary.totalDeductedCommissions, 27);
  // Lucro Líquido Estimado: 300 - (18 + 9) = 273
  assert.equal(summary.estimatedNetProfit, 273);
  assert.equal(summary.hasUnsettledNegotiableSales, false);
});

test('computeOrganizerFinancialSummary sinaliza hasUnsettledNegotiableSales quando há venda A combinar sem acerto', () => {
  const raffles = [{ id: 'r1', user_id: 'org-1', title: 'R1', slug: 'r1', description: '', ticket_price: 10, total_tickets: 50, pix_key: 'a', pix_key_type: 'email', status: 'active', created_at: '', updated_at: '' }];
  const partners = [
    {
      id: 'p-neg',
      invite_id: 'i1',
      raffle_id: 'r1',
      organizer_id: 'org-1',
      full_name: 'Parceiro Neg',
      cpf: '55566677788',
      cpf_last4: '7788',
      phone_whatsapp: '11999990005',
      commission_type: 'negotiable',
      commission_value: 0,
      status: 'active',
      created_at: '',
      updated_at: '',
    },
  ];
  const orders = [
    {
      id: 'o1',
      raffle_id: 'r1',
      buyer_name: 'B1',
      buyer_phone: '11911111111',
      ticket_numbers: [1, 2],
      total_amount: 20,
      status: 'paid',
      sale_channel: 'partner',
      partner_id: 'p-neg',
      commission_type: 'negotiable',
      commission_value: 0,
      commission_amount: 0,
      created_at: '',
    },
  ];

  const summary = computeOrganizerFinancialSummary(raffles, orders, partners, [], 'r1');
  assert.equal(summary.hasUnsettledNegotiableSales, true);
  assert.equal(summary.unsettledNegotiablePartnersCount, 1);
  assert.equal(summary.estimatedNetProfit, 20);
});

test('collectReusableCatalogPartners deduplica por CPF escolhendo o mais recente e exclui ativos na rifa atual', () => {
  const allPartners = [
    {
      id: 'p-old-joao',
      invite_id: 'i1',
      raffle_id: 'raffle-old-1',
      organizer_id: 'org-1',
      full_name: 'João Antigo',
      cpf: '111.222.333-44',
      cpf_last4: '3344',
      phone_whatsapp: '11999990001',
      commission_type: 'percent',
      commission_value: 10,
      status: 'active',
      created_at: '2026-10-01T10:00:00.000Z',
      updated_at: '2026-10-01T10:00:00.000Z',
    },
    {
      id: 'p-new-joao',
      invite_id: 'i2',
      raffle_id: 'raffle-old-2',
      organizer_id: 'org-1',
      full_name: 'João Atualizado',
      cpf: '11122233344',
      cpf_last4: '3344',
      phone_whatsapp: '11999990099',
      commission_type: 'fixed_per_ticket',
      commission_value: 2,
      status: 'active',
      created_at: '2026-11-01T10:00:00.000Z',
      updated_at: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 'p-maria-other',
      invite_id: 'i3',
      raffle_id: 'raffle-old-1',
      organizer_id: 'org-1',
      full_name: 'Maria Já Ativa',
      cpf: '22233344455',
      cpf_last4: '4455',
      phone_whatsapp: '11999990002',
      commission_type: 'percent',
      commission_value: 15,
      status: 'active',
      created_at: '2026-10-05T10:00:00.000Z',
      updated_at: '2026-10-05T10:00:00.000Z',
    },
    {
      id: 'p-maria-current',
      invite_id: 'i4',
      raffle_id: 'raffle-current',
      organizer_id: 'org-1',
      full_name: 'Maria Já Ativa',
      cpf: '22233344455',
      cpf_last4: '4455',
      phone_whatsapp: '11999990002',
      commission_type: 'percent',
      commission_value: 15,
      status: 'active',
      created_at: '2026-11-20T10:00:00.000Z',
      updated_at: '2026-11-20T10:00:00.000Z',
    },
  ];

  const catalog = collectReusableCatalogPartners(allPartners, 'raffle-current');
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'p-new-joao');
  assert.equal(catalog[0].full_name, 'João Atualizado');
});
