# Checkout para Parceiros, Comissões e Dashboard Financeiro (`/admin`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir o antigo Checador Físico para um sistema completo de Checkout para Parceiros com convites únicos de 24h, todas as promoções da rifa (incluindo Roleta da Sorte no celular do parceiro com troca rápida de cliente), comprovação bilateral de comissões e Dashboard Financeiro no `/admin`.

**Architecture:** Arquitetura 100% Web SDK (`firebase` 13.3.0) + `firestore.rules` sem servidor `firebase-admin`. Links secretos criptográficos servem como document IDs em `partner_invites`, `raffle_partners` e `partner_payouts`, com transações atômicas via `writeBatch` (`get()` / `getAfter()`), queries de campo único (zero índice composto manual), snapshot da regra de comissão congelado em cada `Order` e fallback offline em `localStorage` no padrão de `src/lib/firebase/raffles.ts`.

**Tech Stack:** Next.js 16.4.6 (App Router / Turbopack), React 19, TypeScript 5, Firebase Web SDK 13.3.0 (Auth + Firestore), Tailwind CSS v4, `lucide-react`, `qrcode`, `canvas-confetti`, Node test runner (`node --test`).

**Spec:** `docs/superpowers/specs/2026-11-27-checkout-parceiros-dashboard-design.md`

---

## Global Constraints

- **Stack e Infra:** Next.js 16.4.6 + React 19 + Firebase Web SDK 13.3.0, sem `firebase-admin`; todas as queries Firestore usam no máximo 1 filtro `where` de campo único (`organizer_id` ou `raffle_id`), com ordenação e cruzamentos em memória.
- **Design System FastRifa (Inviolável):** NUNCA alterar `globals.css` nem `tailwind.config.*`; usar `.ora-card` em containers/modais, `.ora-btn-primary` na ação primária, `.ora-btn-secondary` na ação secundária e `.ora-glass-pill` em selos/pílulas, respeitando `raffle.brand_color`.
- **Regras da Cartela Impressa:** QR Code do PDF A4 (`PhysicalCardModal`) permanece imutável apontando para `/pix` padrão; emissão/impressão da cartela fica restrita a `total_tickets <= 200`, enquanto o **Checkout para Parceiros** funciona para **qualquer rifa** (inclusive `> 200` cotas).
- **Segurança de Acesso e Baixa PIX:** Convite de parceiro é de uso único e expira em `24h` (`expires_at_ts`); somente o organizador dono da rifa ou Master pode aprovar/cancelar pedidos no PIX (`orders`) ou gerenciar parceiros/acertos; parceiro vê apenas os próprios pedidos e recibos (`partner_payouts`).
- **Escopo de Painel:** Dashboard Financeiro focado exclusivamente em `/admin` (`src/app/admin/page.tsx`) nesta entrega; `/admin/master` fica intacto para etapa futura.
- **Promoções e Atendimento Presencial:** Todas as promoções configuradas na rifa (`progressive`, `simple`, `buy_x_pay_y` e `roulette` com `DiscountRouletteModal`) funcionam no Checkout do Parceiro e Checkout Direto, mantendo timer de 10 minutos com botões **"Cliente deseja comprar mais? (Tentar novo desconto)"** e **"Novo Cliente"**.

## Review Focus

1. **Convite 24h expirado, revogado ou disputado em concorrência:** tentar aceitar um convite já usado (`used`), revogado (`revoked`) ou com `expires_at_ms <= now` deve bloquear a criação de `raffle_partners` tanto na validação client-side quanto nas regras `get()`/`getAfter()` das `firestore.rules`.
2. **Venda após pausa/encerramento da rifa ou revogação do parceiro:** uma aba aberta antes da pausa da campanha ou antes da revogação do token não pode conseguir gravar pedido (`orders`) — bloqueado na UI e na regra `orders` do Firestore.
3. **Troca de cliente na Roleta com timer de 10 minutos:** ao clicar em **Novo Cliente** (seja antes ou depois dos 10 minutos expirarem), nome, telefone, cotas verificadas, desconto sorteado e cronômetro devem ser 100% zerados para não vazar desconto ou expiração para o próximo comprador; ao clicar em **Cliente deseja comprar mais?**, o cliente atual mantém o histórico e pode girar um degrau maior na roleta.
4. **Cálculo de Lucro Líquido em cenários mistos e pedidos cancelados:** rifas com pedidos `paid`, `pending` e `cancelled` distribuídos entre parceiros `%`, `R$/cota`, taxa `0`, `A combinar` com acertos parciais (`partner_payouts`) e vendas públicas/diretas devem somar com precisão sem deduzir comissão de pedidos cancelados e sem duplicar abatimento.
5. **Reabilitação por CPF e exclusão em cascata:** catálogo de parceiros de outras campanhas deduplica por CPF normalizado mascarando exibição quando adequado, revoga vínculo anterior na mesma rifa sem apagar pedidos antigos, e `deleteRaffle` / `deleteCreatorProfile` removem também `partner_invites`, `raffle_partners` e `partner_payouts`.

---

## File Structure

| Arquivo | Responsabilidade Única |
|---|---|
| `src/types/database.types.ts` | Interfaces `PartnerInvite`, `RafflePartner`, `PartnerPayout`, tipos de comissão/canal e campos opcionais em `Order`. |
| `src/lib/partner-finance.ts` | Cálculo puro e determinístico de comissão por pedido, acertos parciais, geração criptográfica de tokens, deduplicação por CPF e KPIs do Dashboard Financeiro. |
| `src/lib/raffle-urls.ts` | Helpers de rotas `/parceiro/convite/[token]`, `/parceiro/[token]`, `/parceiro/confirmar-pagamento/[payoutToken]` e `/admin/rifas/[id]/parceiros`. |
| `tests/partner-finance.test.mjs` | Testes unitários em `node:test` cobrindo motor de comissões, lucros mistos, validade 24h e transição de sessão do checkout. |
| `src/lib/firebase/partners.ts` | CRUD Firestore + fallback `localStorage` + `writeBatch` atômico de `partner_invites`, `raffle_partners` e `partner_payouts`. |
| `src/lib/firebase/raffles.ts` | Suporte aos novos campos de canal/parceiro em `Order`, `createOrder` com checagem de rifa ativa e limpeza em cascata em `deleteRaffle`/`deleteCreatorProfile`. |
| `firestore.rules` | Regras de segurança para `partner_invites`, `raffle_partners`, `partner_payouts` e reforço em `orders`. |
| `src/components/physical-cartela-pix-view.tsx` | Evolução do checkout direto para modos `public_pix`, `organizer_direct` e `partner`, integrando `DiscountRouletteModal`, timer de 10 min, controles **"Cliente deseja comprar mais?"** / **"Novo Cliente"**, impressão `<= 200` e aba **Minhas Vendas e Comissões**. |
| `src/app/r/[slug]/pix/page.tsx` e `src/app/[brand]/[keyword]/[code]/pix/page.tsx` | Leitura de `?canal=organizador` para ativar `organizer_direct` ao organizador autenticado. |
| `src/app/parceiro/convite/[token]/page.tsx` | Validação do link único 24h + formulário Nome, CPF e Telefone + ativação atômica. |
| `src/app/parceiro/[token]/page.tsx` | Porta de entrada do checkout exclusivo do parceiro via token pessoal. |
| `src/app/parceiro/confirmar-pagamento/[payoutToken]/page.tsx` | Página pública bilateral para o parceiro conferir o valor pago e confirmar o recebimento da comissão. |
| `src/app/admin/rifas/[id]/raffle-manager.tsx` | Substituição de **Abrir Checador Físico** por **Checkout para Parceiros** (qualquer nº de cotas) + badge/filtro de canal/parceiro nos pedidos. |
| `src/app/admin/rifas/[id]/parceiros/page.tsx` | Gestão completa de parceiros da rifa: gerar convite 24h, abrir checkout direto, informar pagamento + link de confirmação, reabilitar de outras campanhas e pausar/revogar. |
| `src/app/admin/admin-header.tsx` | Garantia de header limpo consistente na subrota `/admin/rifas/[id]/parceiros` (igual a `/admin/rifas/[id]`). |
| `src/components/admin-financial-dashboard.tsx` | Componente executivo com filtro por campanha, 4 KPIs financeiros, gráfico/quebra Diretas vs. Parceiros e resumo por rifa. |
| `src/app/admin/page.tsx` | Integração do `AdminFinancialDashboard` acima de *Suas Campanhas* e atalho rápido **Parceiros** nos cards das rifas. |

---

### Task 1: Tipos, Motor Financeiro/Comissões e Helpers de URL

**Files:**
- Modify: `src/types/database.types.ts:1-122`
- Modify: `src/lib/raffle-urls.ts:100-143`
- Create: `src/lib/partner-finance.ts`
- Create: `tests/partner-finance.test.mjs`

**Interfaces:**
- Consumes: `Order`, `Raffle`, `RaffleDiscountConfig` (`src/types/database.types.ts`), `onlyDigits` / `formatCpf` (`src/lib/validators.ts`), `calculateDiscountedPricing` (`src/lib/discounts.ts`).
- Produces:
  - Tipos `PartnerCommissionType`, `PartnerInviteStatus`, `RafflePartnerStatus`, `PartnerPayoutStatus`, `OrderSaleChannel`, `PartnerInvite`, `RafflePartner`, `PartnerPayout` em `src/types/database.types.ts`.
  - Funções puras em `src/lib/partner-finance.ts`:
    - `generateSecureToken(byteLength?: number): string`
    - `calculateOrderCommission({ totalAmount, ticketCount, commissionType, commissionValue }): number`
    - `formatCommissionRuleLabel(type: PartnerCommissionType, value: number): string`
    - `maskCpfDisplay(cpf: string): string`
    - `isPartnerInviteUsable(invite: Pick<PartnerInvite, 'status' | 'expires_at_ms'>, nowMs?: number): { usable: boolean; reason?: 'used' | 'revoked' | 'expired' }`
    - `buildInitialPartnerCheckoutSession(): { buyerName: string; buyerPhone: string; verifiedNumbers: number[]; rouletteWonPercent: number | null; rouletteHighestPercent: number; discountStartedAtMs: number | null; discountExpired: boolean }`
    - `computePartnerStats(partner: RafflePartner, orders: Order[], payouts: PartnerPayout[]): PartnerComputedStats`
    - `computeOrganizerFinancialSummary(raffles: Raffle[], orders: Order[], partners: RafflePartner[], payouts: PartnerPayout[], raffleFilterId?: string | 'all'): OrganizerFinancialSummary`
    - `collectReusableCatalogPartners(allPartners: RafflePartner[], currentRaffleId: string): RafflePartner[]`
  - Helpers de rota em `src/lib/raffle-urls.ts`: `getRafflePartnersAdminPath(raffle)`, `getPartnerInvitePath(token)`, `getPartnerCheckoutPath(token)`, `getPartnerPayoutConfirmPath(payoutToken)`, `getOrganizerDirectCheckoutPath(raffle)`.

- [ ] **Step 1: Atualizar `src/types/database.types.ts` com os novos tipos e campos opcionais em `Order`**

Adicionar `PartnerCommissionType`, `PartnerInviteStatus`, `RafflePartnerStatus`, `PartnerPayoutStatus`, `OrderSaleChannel`, `PartnerInvite`, `RafflePartner`, `PartnerPayout` e estender `Order` com `sale_channel?`, `partner_id?`, `partner_name?`, `commission_type?`, `commission_value?`, `commission_amount?`.

- [ ] **Step 2: Escrever o arquivo de testes `tests/partner-finance.test.mjs`**

Cobrir todas as regras numéricas e casos do Review Focus compilando apenas `src/lib/partner-finance.ts` com `npx tsc` para um diretório temporário ou testando diretamente o módulo compilado:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSecureToken,
  calculateOrderCommission,
  formatCommissionRuleLabel,
  isPartnerInviteUsable,
  buildInitialPartnerCheckoutSession,
  computePartnerStats,
  computeOrganizerFinancialSummary,
  collectReusableCatalogPartners,
} from '../.tmp-tests/lib/partner-finance.js';

test('generateSecureToken generates unambiguous URL-safe tokens without collisions', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const t = generateSecureToken(24);
    assert.match(t, /^[23456789abcdefghjkmnpqrstuvwxyz]{32,}$/);
    assert.equal(seen.has(t), false);
    seen.add(t);
  }
});

test('calculateOrderCommission handles negotiable, zero, percent and fixed_per_ticket', () => {
  assert.equal(calculateOrderCommission({ totalAmount: 90, ticketCount: 10, commissionType: 'negotiable', commissionValue: 10 }), 0);
  assert.equal(calculateOrderCommission({ totalAmount: 90, ticketCount: 10, commissionType: 'percent', commissionValue: 0 }), 0);
  assert.equal(calculateOrderCommission({ totalAmount: 90, ticketCount: 10, commissionType: 'percent', commissionValue: 15 }), 13.5);
  assert.equal(calculateOrderCommission({ totalAmount: 90, ticketCount: 10, commissionType: 'fixed_per_ticket', commissionValue: 1.5 }), 15);
});

test('isPartnerInviteUsable rejects used, revoked and expired (>24h) invites', () => {
  const now = 1_700_000_000_000;
  assert.deepEqual(isPartnerInviteUsable({ status: 'pending', expires_at_ms: now + 60_000 }, now), { usable: true });
  assert.deepEqual(isPartnerInviteUsable({ status: 'pending', expires_at_ms: now - 1 }, now), { usable: false, reason: 'expired' });
  assert.deepEqual(isPartnerInviteUsable({ status: 'used', expires_at_ms: now + 60_000 }, now), { usable: false, reason: 'used' });
  assert.deepEqual(isPartnerInviteUsable({ status: 'revoked', expires_at_ms: now + 60_000 }, now), { usable: false, reason: 'revoked' });
});

test('buildInitialPartnerCheckoutSession clears client state, roulette and 10m timer cleanly', () => {
  const fresh = buildInitialPartnerCheckoutSession();
  assert.deepEqual(fresh, {
    buyerName: '',
    buyerPhone: '',
    verifiedNumbers: [],
    rouletteWonPercent: null,
    rouletteHighestPercent: 0,
    discountStartedAtMs: null,
    discountExpired: false,
  });
});

test('computeOrganizerFinancialSummary calculates mixed channels, excludes cancelled orders and deducts negotiable payouts without double counting', () => {
  const raffles = [{ id: 'r1', title: 'Rifa 1', total_tickets: 100, ticket_price: 10 }];
  const partners = [
    { id: 'p1', raffle_id: 'r1', commission_type: 'percent', commission_value: 10, status: 'active' },
    { id: 'p2', raffle_id: 'r1', commission_type: 'negotiable', commission_value: 0, status: 'active' },
  ];
  const orders = [
    { id: 'o1', raffle_id: 'r1', status: 'paid', total_amount: 50, ticket_numbers: [1, 2, 3, 4, 5], sale_channel: 'public' },
    { id: 'o2', raffle_id: 'r1', status: 'paid', total_amount: 100, ticket_numbers: [6, 7, 8, 9, 10], sale_channel: 'partner', partner_id: 'p1', commission_type: 'percent', commission_value: 10, commission_amount: 10 },
    { id: 'o3', raffle_id: 'r1', status: 'paid', total_amount: 80, ticket_numbers: [11, 12], sale_channel: 'partner', partner_id: 'p2', commission_type: 'negotiable', commission_value: 0, commission_amount: 0 },
    { id: 'o4', raffle_id: 'r1', status: 'cancelled', total_amount: 200, ticket_numbers: [13, 14], sale_channel: 'partner', partner_id: 'p1', commission_type: 'percent', commission_value: 10, commission_amount: 20 },
  ];
  const payouts = [
    { id: 'pay1', raffle_id: 'r1', partner_id: 'p1', amount: 10, status: 'confirmed' },
    { id: 'pay2', raffle_id: 'r1', partner_id: 'p2', amount: 12, status: 'pending_confirmation' },
    { id: 'pay3', raffle_id: 'r1', partner_id: 'p2', amount: 8, status: 'confirmed' },
  ];
  const summary = computeOrganizerFinancialSummary(raffles, orders, partners, payouts, 'all');
  assert.equal(summary.confirmedRevenue, 230);
  assert.equal(summary.directRevenue, 50);
  assert.equal(summary.partnerRevenue, 180);
  assert.equal(summary.confirmedNumericCommissions, 10);
  assert.equal(summary.negotiableSettledAmount, 20);
  assert.equal(summary.estimatedNetProfit, 200);
  assert.equal(summary.confirmedPayoutTotal, 18);
  assert.equal(summary.pendingConfirmationPayoutTotal, 12);
});

test('collectReusableCatalogPartners deduplicates by CPF and excludes active partners on current raffle', () => {
  const list = collectReusableCatalogPartners([
    { id: 'a1', raffle_id: 'r_old', full_name: 'Maria', cpf: '11122233344', status: 'active', created_at: '2026-11-20T10:00:00Z' },
    { id: 'a2', raffle_id: 'r_old2', full_name: 'Maria Nova', cpf: '11122233344', status: 'active', created_at: '2026-11-25T10:00:00Z' },
    { id: 'b1', raffle_id: 'r_curr', full_name: 'João', cpf: '55566677788', status: 'active', created_at: '2026-11-26T10:00:00Z' },
    { id: 'b2', raffle_id: 'r_old', full_name: 'João', cpf: '55566677788', status: 'active', created_at: '2026-11-18T10:00:00Z' },
  ], 'r_curr');
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'a2');
});
```

- [ ] **Step 3: Executar testes para confirmar falha inicial**

Run: `npx tsc --outDir .tmp-tests --module commonjs --target es2022 --moduleResolution node --esModuleInterop src/lib/partner-finance.ts && node --test tests/partner-finance.test.mjs`
Expected: FAIL porque `src/lib/partner-finance.ts` ainda não existe.

- [ ] **Step 4: Implementar `src/lib/partner-finance.ts` e helpers de URL em `src/lib/raffle-urls.ts`**

Implementar exatamente as funções listadas em `Interfaces`, usando `roundCurrency` (`Math.round(v * 100) / 100`) e adicionando em `src/lib/raffle-urls.ts` os builders de caminho respeitando padrão de origem sem codificar `localhost` para links compartilháveis (`getShareOrigin()`).

- [ ] **Step 5: Rodar os testes e `npx tsc --noEmit`**

Run: `npx tsc --noEmit && npx tsc --outDir .tmp-tests --module commonjs --target es2022 --moduleResolution node --esModuleInterop src/lib/partner-finance.ts && node --test tests/partner-finance.test.mjs`
Expected: PASS (5/5 tests passed) e TypeScript exit code 0. (Remover `.tmp-tests` ao finalizar).

- [ ] **Step 6: Commit**

```bash
git add src/types/database.types.ts src/lib/partner-finance.ts src/lib/raffle-urls.ts tests/partner-finance.test.mjs
git commit -m "feat(partners): tipos, motor financeiro de comissoes e helpers de rota"
```

---

### Task 2: Camada Firestore de Parceiros, Convites, Acertos e Regras de Segurança

**Files:**
- Create: `src/lib/firebase/partners.ts`
- Modify: `src/lib/firebase/raffles.ts:588-785`
- Modify: `firestore.rules:1-49`

**Interfaces:**
- Consumes: `auth`, `db`, `getPublicFirestore` (`src/lib/firebase/config.ts`), tipos da Task 1 (`src/types/database.types.ts`), `generateSecureToken` e `isPartnerInviteUsable` (`src/lib/partner-finance.ts`), `formatCpf`, `isValidCpf`, `formatBrazilMobile`, `getBrazilMobileError`, `onlyDigits` (`src/lib/validators.ts`).
- Produces (`src/lib/firebase/partners.ts`):
  - Re-exporta `generateSecureToken`
  - `createPartnerInvite(input: { raffle: Raffle; organizerId: string; commissionType: PartnerCommissionType; commissionValue: number; prefill?: { name?: string; cpf?: string; phone?: string; sourcePartnerId?: string }; revokeExistingCpfInRaffle?: boolean }): Promise<PartnerInvite>`
  - `getPartnerInviteByToken(token: string): Promise<PartnerInvite | null>`
  - `acceptPartnerInvite(input: { inviteToken: string; fullName: string; cpf: string; phoneWhatsapp: string }): Promise<{ success: boolean; partner?: RafflePartner; error?: string }>`
  - `getOrganizerPartnerInvites(organizerId: string): Promise<PartnerInvite[]>`
  - `revokePartnerInvite(inviteId: string): Promise<void>`
  - `getOrganizerPartners(organizerId: string): Promise<RafflePartner[]>`
  - `getRafflePartnerByToken(token: string): Promise<RafflePartner | null>`
  - `updateRafflePartnerStatus(partnerId: string, status: RafflePartnerStatus): Promise<void>`
  - `createPartnerPayout(input: { raffle: Raffle; organizerId: string; partner: RafflePartner; amount: number; note?: string }): Promise<PartnerPayout>`
  - `getOrganizerPartnerPayouts(organizerId: string): Promise<PartnerPayout[]>`
  - `getPartnerPayoutByToken(payoutToken: string): Promise<PartnerPayout | null>`
  - `getPartnerPayoutsByIds(payoutIds: string[]): Promise<PartnerPayout[]>`
  - `confirmPartnerPayout(payoutToken: string): Promise<{ success: boolean; payout?: PartnerPayout; error?: string }>`
  - `deletePartnersDataByRaffle(raffleId: string): Promise<void>` e `deletePartnersDataByOrganizer(organizerId: string): Promise<void>`

- [ ] **Step 1: Implementar `src/lib/firebase/partners.ts` (com `Timestamp`, `writeBatch` e fallback `localStorage`)**

- Usar `Timestamp.fromMillis(expiresAtMs)` junto com `expires_at` ISO e `expires_at_ms` na criação de `partner_invites`.
- Em `acceptPartnerInvite`, usar `writeBatch(activeDb)` setando `raffle_partners/{accessToken}` e atualizando `partner_invites/{inviteToken}` para `used` em transação atômica, validando CPF (`isValidCpf`) e telefone (`getBrazilMobileError`) antes do batch; sincronizar fallback `localStorage` (`fastrifa_local_partner_invites`, `fastrifa_local_partners`).
- Em `createPartnerInvite`, se `revokeExistingCpfInRaffle` estiver ativo e houver `prefill.cpf`, revogar vínculos anteriores ativos daquele CPF na mesma rifa diretamente com credencial do organizador.
- Em `createPartnerPayout`, gerar `payoutToken` via `generateSecureToken()`, gravar em `partner_payouts/{payoutToken}` e atualizar `raffle_partners/{partner.id}` com `arrayUnion(payoutToken)`, `settled_commission_amount` incrementado e `last_settled_at`.
- Usar sempre queries simples `where('organizer_id', '==', organizerId)` e `where('raffle_id', '==', raffleId)`.

- [ ] **Step 2: Atualizar `src/lib/firebase/raffles.ts` e `firestore.rules`**

- Em `createOrder` (`src/lib/firebase/raffles.ts:588-628`): verificar via `getRaffleById(data.raffle_id)` se `raffle.status === 'active'` antes de reservar; aceitar os campos opcionais de parceiro/canal sem passar `undefined` ao Firestore.
- Em `deleteRaffle` e `deleteCreatorProfile` (`src/lib/firebase/raffles.ts:689-785`): chamar `deletePartnersDataByRaffle(raffleId)` e `deletePartnersDataByOrganizer(userId)` para limpeza completa em cascata (remoto e local).
- Atualizar `firestore.rules` com as regras descritas na seção 4.4 do spec (`partner_invites`, `raffle_partners`, `partner_payouts` e reforço em `orders` bloqueando `leitor.publico@fastrifa.com` em updates, exigindo `raffle.status == 'active'` e validando `raffle_partners` ativo quando `partner_id != null`).

- [ ] **Step 3: Verificar `npx tsc --noEmit` e testes unitários**

Run: `npx tsc --noEmit && npx tsc --outDir .tmp-tests --module commonjs --target es2022 --moduleResolution node --esModuleInterop src/lib/partner-finance.ts && node --test tests/partner-finance.test.mjs`
Expected: exit code 0 e todos os testes passando.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase/partners.ts src/lib/firebase/raffles.ts firestore.rules
git commit -m "feat(partners): camada Firestore, writeBatch atomico e firestore.rules"
```

---

### Task 3: Evolução do `PhysicalCartelaPixView` (Checkout Parceiro + Organizador Direto + Todas Promoções & Roleta + Troca de Cliente)

**Files:**
- Modify: `src/components/physical-cartela-pix-view.tsx:1-1152`
- Modify: `src/app/r/[slug]/pix/page.tsx:1-13`
- Modify: `src/app/[brand]/[keyword]/[code]/pix/page.tsx:1-13`

**Interfaces:**
- Consumes: `DiscountRouletteModal` (`src/components/discount-roulette-modal.tsx`), `PhysicalCardModal` (`src/components/physical-card-modal.tsx`), `calculateDiscountedPricing` e `normalizeDiscountConfig` (`src/lib/discounts.ts`), `calculateOrderCommission` e `buildInitialPartnerCheckoutSession` (`src/lib/partner-finance.ts`), `subscribeToRaffleOrders` (`src/lib/firebase/raffles.ts`), `getPartnerPayoutsByIds` (`src/lib/firebase/partners.ts`).
- Produces:
  - `PhysicalCartelaPixViewProps` ampliada mantendo total retrocompatibilidade para `/pix`:
    ```ts
    export interface PhysicalCartelaPixViewProps {
      slug?: string;
      brand?: string;
      keyword?: string;
      code?: string;
      raffleId?: string;
      checkoutMode?: 'public_pix' | 'organizer_direct' | 'partner';
      partner?: RafflePartner | null;
      onPartnerRefresh?: () => Promise<void> | void;
    }
    ```

- [ ] **Step 1: Atualizar rotas `/pix` para detectar `?canal=organizador`**

Em `src/app/r/[slug]/pix/page.tsx` e `src/app/[brand]/[keyword]/[code]/pix/page.tsx`, ler `useSearchParams().get('canal') === 'organizador'`, validar com `useAuth()` se o usuário logado é dono/Master e passar `checkoutMode={isOrganizerMode ? 'organizer_direct' : 'public_pix'}` (com fallback seguro para `public_pix` se visitante comum abrir o link).

- [ ] **Step 2: Bloquear vendas quando `raffle.status !== 'active'` ou `partner.status !== 'active'`**

Quando a rifa estiver pausada/concluída/cancelada ou o vínculo do parceiro estiver `paused`/`revoked`, bloquear novas vendas no checkout direto exibindo card explicativo com atalho **Ver Rifa Pública** (sem impedir o parceiro de consultar a aba **Minhas Vendas e Comissões**).

- [ ] **Step 3: Habilitar TODAS as promoções + Roleta da Sorte + Timer 10 min + Botões de atendimento no celular**

- Usar `normalizeDiscountConfig(raffle.discount_config)` no cálculo de `pricing` passando `rouletteWonPercent`.
- No Passo 1 (Quantidade) e Passo 2 (Checador), exibir faixa/aviso promocional da campanha (Progressivo, Simples, Compre X Pague Y ou Roleta da Sorte) e, quando `pricing.canSpinRoulette === true` (modo `roulette` e `quantity >= roulette_min_tickets` sem giro ativo), exibir botão lúdico de destaque **"Cliente: Girar Roleta da Sorte!"** abrindo `DiscountRouletteModal` (com suporte a `minExclusivePercent={rouletteHighestPercent}`).
- Ao ganhar na roleta ou ativar promoção, iniciar countdown de `10 minutos` (`DISCOUNT_COUNTDOWN_MS = 10 * 60 * 1000`).
- Exibir dois botões claros para não travar vendas presenciais pelo timer de 10 minutos (no modal de reserva/PIX e no cabeçalho de atendimento):
  1. **"Cliente deseja comprar mais? (Tentar novo desconto)"**: volta ao Passo 1 preservando `buyerName`, `buyerPhone` e mantendo `rouletteHighestPercent = Math.max(rouletteHighestPercent, lastWonPercent)` para liberar tentativa de novo degrau maior na roleta (ou somar cotas com desconto maior);
  2. **"Novo Cliente"**: chama `buildInitialPartnerCheckoutSession()` resetando nome, telefone, números verificados, giro de roleta, estado de expiração e timer de 10 minutos, voltando ao Passo 1 limpo.

- [ ] **Step 4: Gravar `sale_channel` + comissão no `createOrder` e implementar Aba 2 (`Minhas Vendas e Comissões`) + botões Rifa Pública / Imprimir Cartela**

- Quando `checkoutMode === 'partner'` e `partner` válido: enviar `sale_channel: 'partner'`, `partner_id: partner.id`, `partner_name: partner.full_name`, `commission_type: partner.commission_type`, `commission_value: partner.commission_value`, `commission_amount: calculateOrderCommission(...)`.
- Quando `checkoutMode === 'organizer_direct'`: enviar `sale_channel: 'organizer_direct'`.
- Quando `checkoutMode === 'partner'`:
  - Cabeçalho mostra nome do parceiro, regra de comissão (`formatCommissionRuleLabel`), **Copiar Meu Link**, **Ver Rifa Pública** e **Imprimir Cartela** (somente se `raffle.total_tickets <= 200`, abrindo `PhysicalCardModal` com os números ocupados atuais).
  - Banner no topo se houver algum `PartnerPayout` em status `pending_confirmation` com link direto para `/parceiro/confirmar-pagamento/[payoutToken]`.
  - Seletor em 2 abas: **Vender Cotas (Checkout Direto)** e **Minhas Vendas e Comissões** (assinando `subscribeToRaffleOrders(raffle.id)` e filtrando exclusivamente `order.partner_id === partner.id`, exibindo `computePartnerStats` + tabela de pedidos + lista de pagamentos `PartnerPayout`).

- [ ] **Step 5: Verificar `npx tsc --noEmit` e testar `node --test tests/partner-finance.test.mjs`**

Run: `npx tsc --noEmit && npx tsc --outDir .tmp-tests --module commonjs --target es2022 --moduleResolution node --esModuleInterop src/lib/partner-finance.ts && node --test tests/partner-finance.test.mjs`
Expected: exit code 0 e todos os testes passando.

- [ ] **Step 6: Commit**

```bash
git add src/components/physical-cartela-pix-view.tsx src/app/r/\[slug\]/pix/page.tsx src/app/\[brand\]/\[keyword\]/\[code\]/pix/page.tsx
git commit -m "feat(partners): checkout direto com promocoes, roleta, troca de cliente e aba do parceiro"
```

---

### Task 4: Rotas Públicas do Parceiro (Convite 24h, Checkout Exclusivo e Confirmação Bilateral de Pagamento)

**Files:**
- Create: `src/app/parceiro/convite/[token]/page.tsx`
- Create: `src/app/parceiro/[token]/page.tsx`
- Create: `src/app/parceiro/confirmar-pagamento/[payoutToken]/page.tsx`

**Interfaces:**
- Consumes: `getPartnerInviteByToken`, `acceptPartnerInvite`, `getRafflePartnerByToken`, `getPartnerPayoutByToken`, `confirmPartnerPayout` (`src/lib/firebase/partners.ts`), `getRaffleById` (`src/lib/firebase/raffles.ts`), `isPartnerInviteUsable`, `formatCommissionRuleLabel` (`src/lib/partner-finance.ts`), `formatCpf`, `isValidCpf`, `formatBrazilMobile`, `getBrazilMobileError` (`src/lib/validators.ts`), `PhysicalCartelaPixView` (`src/components/physical-cartela-pix-view.tsx`).
- Produces: 3 rotas Next.js App Router (`'use client'`) completas com Design System FastRifa (`.ora-card`, `.ora-btn-primary`, `.ora-btn-secondary`).

- [ ] **Step 1: Criar `src/app/parceiro/convite/[token]/page.tsx`**

- Carregar convite por `token` e rifa associada; checar `isPartnerInviteUsable(invite)`.
- Exibir estado amigável de bloqueio se `expired` (> 24h), `used` (já aceito) ou `revoked` (se o aparelho já salvou o `accessToken` desse convite/rifa em `localStorage`, oferecer botão rápido para abrir o link salvo).
- Exibir resumo da campanha + regra de comissão acordada antes do envio (*A combinar*, `0%` voluntário, `%` ou `R$/cota`) e formulário obrigatório: Nome completo, CPF (`formatCpf` + `isValidCpf`), WhatsApp (`formatBrazilMobile` + `getBrazilMobileError`).
- Submeter `acceptPartnerInvite`, salvar `accessToken` em `localStorage` e redirecionar com `router.replace('/parceiro/' + partner.id)`.

- [ ] **Step 2: Criar `src/app/parceiro/[token]/page.tsx`**

- Buscar `getRafflePartnerByToken(token)` e `getRaffleById(partner.raffle_id)`.
- Renderizar `<PhysicalCartelaPixView raffleId={raffle.id} checkoutMode="partner" partner={partner} onPartnerRefresh={...} />`, garantindo que o token pessoal dê acesso direto ao checkout e à aba **Minhas Vendas e Comissões**.
- Exibir card claro caso token seja inválido.

- [ ] **Step 3: Criar `src/app/parceiro/confirmar-pagamento/[payoutToken]/page.tsx`**

- Carregar `getPartnerPayoutByToken(payoutToken)`.
- Exibir identificação da campanha, nome do parceiro, valor informado (`R$ ...`), observação (se houver) e status atual.
- Se `pending_confirmation`: exibir botão `.ora-btn-primary` **"Confirmar Recebimento deste Pagamento"** chamando `confirmPartnerPayout(payoutToken)`.
- Se `confirmed`: exibir comprovante verde auditável com data/hora de confirmação (`confirmed_at`) e atalho para voltar ao checkout (`/parceiro/${payout.partner_id}`).

- [ ] **Step 4: Verificar `npx tsc --noEmit`**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/parceiro/
git commit -m "feat(partners): rotas publicas de convite 24h, checkout do parceiro e confirmacao de pagamento"
```

---

### Task 5: Painel da Rifa Atualizado (`/admin/rifas/[id]`) e Gestão de Parceiros da Rifa (`/admin/rifas/[id]/parceiros`)

**Files:**
- Modify: `src/app/admin/admin-header.tsx:20-32`
- Modify: `src/app/admin/rifas/[id]/raffle-manager.tsx:500-960`
- Create: `src/app/admin/rifas/[id]/parceiros/page.tsx`

**Interfaces:**
- Consumes: `getRaffleById`, `getRaffleOrders`, `subscribeToRaffleOrders` (`src/lib/firebase/raffles.ts`), `createPartnerInvite`, `getOrganizerPartnerInvites`, `revokePartnerInvite`, `getOrganizerPartners`, `updateRafflePartnerStatus`, `createPartnerPayout`, `getOrganizerPartnerPayouts` (`src/lib/firebase/partners.ts`), `computePartnerStats`, `collectReusableCatalogPartners`, `formatCommissionRuleLabel`, `maskCpfDisplay` (`src/lib/partner-finance.ts`), `getRafflePartnersAdminPath`, `getPartnerInvitePath`, `getPartnerCheckoutPath`, `getPartnerPayoutConfirmPath`, `getOrganizerDirectCheckoutPath` (`src/lib/raffle-urls.ts`).
- Produces: página completa `/admin/rifas/[id]/parceiros` e `RaffleManager` atualizado com botão **Checkout para Parceiros** liberado acima de 200 cotas.

- [ ] **Step 1: Atualizar `src/app/admin/admin-header.tsx` e `src/app/admin/rifas/[id]/raffle-manager.tsx`**

- Em `admin-header.tsx`, incluir `isRafflePartnersPage` (subrotas `/admin/rifas/...`) no mesmo critério sem header externo quando organizador logado estiver navegando com a box hero unificada.
- Em `raffle-manager.tsx` (bloco de Cartela / Checador dentro da box hero):
  - Substituir o botão **Abrir Checador Físico** por **Checkout para Parceiros** (`href={getRafflePartnersAdminPath(raffle)}`) visível e ativo **tanto quando `total_tickets <= 200` quanto quando `total_tickets > 200`**.
  - Manter **Gerar Cartela** restrito a `total_tickets <= 200` (mantendo o aviso informativo de impressão até 200 cotas acima de 200 números).
  - Na aba/lista de Pedidos de `raffle-manager.tsx`, adicionar filtro rápido por origem (`Todos` | `Pública` | `Checkout Direto` | `Parceiros`) e exibir badge identificando o parceiro e a comissão calculada/A combinar no card do pedido.

- [ ] **Step 2: Criar `src/app/admin/rifas/[id]/parceiros/page.tsx`**

Implementar dentro da estética FastRifa (`.ora-card`, `.ora-btn-primary`, `.ora-btn-secondary`):
- Header box integrada (Voltar para Rifa, Home, Sair + título **Checkout para Parceiros** + 2 botões principais):
  1. **Cadastrar Novo Parceiro (Link 24h)** → abre modal com seleção de comissão (`A combinar` default | `% sobre vendas pagas` aceitando `0..100` | `R$ por cota paga` aceitando `>= 0`), gera convite único 24h e exibe link copiável + botão WhatsApp.
  2. **Abrir Meu Checkout Direto** → abre `getOrganizerDirectCheckoutPath(raffle)` (`?canal=organizador`) em nova aba.
- Cards resumo da rede na campanha (Parceiros Ativos, Cotas via Parceiros, Comissões Confirmadas/Pendentes, Acertado / Confirmado).
- Lista **Parceiros Habilitados nesta Rifa** (inicia vazia em campanhas novas) com nome, CPF mascarado, WhatsApp, regra de comissão, cotas pagas/pendentes, comissão confirmada/pendente, total acertado e status de confirmação pelo parceiro; ações: **Copiar Link do Parceiro**, **Informar Pagamento** (abre modal para registrar valor pago + observação opcional, criando `PartnerPayout` e exibindo link `/parceiro/confirmar-pagamento/[payoutToken]` para copiar/enviar via WhatsApp) e **Pausar / Reativar / Revogar**.
- Lista **Pagamentos e Confirmações Enviadas** mostrando status (`Aguardando parceiro confirmar` | `Recebimento confirmado ✓ em DD/MM HH:mm`), botão **Copiar Link de Confirmação** e **Enviar WhatsApp**.
- Lista **Convites Pendentes (Uso Único · 24h)** com contagem regressiva até expirar, copiar link, WhatsApp e **Revogar**.
- Lista **Parceiros de Outras Campanhas suas** (`collectReusableCatalogPartners`) permitindo clicar em **Gerar Link p/ Habilitar (24h)** (abre modal de comissão pré-preenchido com dados do parceiro).

- [ ] **Step 3: Verificar `npx tsc --noEmit`**

Run: `npx tsc --noEmit`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/admin-header.tsx src/app/admin/rifas/\[id\]/raffle-manager.tsx src/app/admin/rifas/\[id\]/parceiros/page.tsx
git commit -m "feat(partners): painel Checkout para Parceiros na rifa, convites 24h e gestao de pagamentos"
```

---

### Task 6: Dashboard Financeiro & Rede de Vendas no `/admin` + Build & QA Final

**Files:**
- Create: `src/components/admin-financial-dashboard.tsx`
- Modify: `src/app/admin/page.tsx:1-453`
- Modify: `src/lib/firebase/raffles.ts` (se necessário helper `getOrdersForRaffles(raffleIds: string[])`)

**Interfaces:**
- Consumes: `computeOrganizerFinancialSummary` (`src/lib/partner-finance.ts`), `getRaffleOrders` (`src/lib/firebase/raffles.ts`), `getOrganizerPartners`, `getOrganizerPartnerPayouts` (`src/lib/firebase/partners.ts`), `getRaffleAdminPath`, `getRafflePartnersAdminPath` (`src/lib/raffle-urls.ts`).
- Produces: `AdminFinancialDashboard` integrado em `/admin` (`src/app/admin/page.tsx`) exclusivamente para organizadores (mantendo `isMaster` redirecionando para `/admin/master` conforme decisão de escopo).

- [ ] **Step 1: Implementar `src/components/admin-financial-dashboard.tsx`**

- Receber `{ raffles, orders, partners, payouts, loading }`.
- Seletor superior: `Todas as campanhas` ou filtro individual por campanha.
- Renderizar 4 KPIs financeiros em `.ora-card` (`tabular-nums`):
  1. **Faturamento Confirmado (PIX Pago)** + subtexto **Aguardando PIX**;
  2. **Vendas Diretas vs. Parceiros** (R$ e cotas de cada canal);
  3. **Comissões & Acertos** (Confirmadas, Pendentes, Acertado / Confirmado pelo parceiro);
  4. **Lucro Líquido Estimado** (exibindo selo informativo caso haja parceiros *"A combinar"* com vendas ainda sem acerto lançado).
- Exibir breakdown compacto por campanha com faturamento, comissões, lucro líquido e botão rápido **Parceiros**.

- [ ] **Step 2: Integrar no `/admin` (`src/app/admin/page.tsx`)**

- Buscar em paralelo pedidos das rifas do organizador + `getOrganizerPartners(user.uid)` + `getOrganizerPartnerPayouts(user.uid)`.
- Renderizar `<AdminFinancialDashboard ... />` logo abaixo dos 3 cards atuais e acima de **Suas Campanhas**.
- Nos cards das campanhas de `/admin`, adicionar botão secundário discreto **Parceiros** ao lado de **Gerenciar**.

- [ ] **Step 3: Verificação completa (Testes unitários, TypeScript, Build de Produção e QA Browser)**

1. Run: `npx tsc --noEmit && npx tsc --outDir .tmp-tests --module commonjs --target es2022 --moduleResolution node --esModuleInterop src/lib/partner-finance.ts && node --test tests/partner-finance.test.mjs`
   Expected: exit code 0, todos os testes passando.
2. Run: `npm run build`
   Expected: exit code 0 sem erros de compilação ou rotas inválidas (`/parceiro/convite/[token]`, `/parceiro/[token]`, `/parceiro/confirmar-pagamento/[payoutToken]`, `/admin/rifas/[id]/parceiros`, `/admin`).
3. QA visual e funcional no servidor local (`http://localhost:3000`): validar fluxo completo em desktop (`1440x900`) e mobile (`390x844`) sem erros de console de aplicação e sem overflow horizontal.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin-financial-dashboard.tsx src/app/admin/page.tsx src/lib/firebase/raffles.ts
git commit -m "feat(admin): dashboard financeiro de vendas, comissoes e lucro liquido em /admin"
```
