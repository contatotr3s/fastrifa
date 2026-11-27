# Design: Checkout para Parceiros, Comissões e Dashboard Financeiro (`/admin`)

**Data:** 27/11/2026  
**Status:** Aprovado pelo usuário (com emenda de promoções completas + Roleta no checkout do parceiro)  
**Abordagem selecionada:** Abordagem 1 — Convite único de 24h → Token pessoal do parceiro (sem senha)

---

## 1. Intenção e Motivação ("Por quê")

O atual **Checador Físico** (`/r/[slug]/pix` e `/[brand]/[keyword]/[code]/pix`) nasceu focado em conferir bilhetes de cartelas impressas para até 200 cotas. Na prática, organizadores precisam escalar vendas contando com **parceiros / ajudantes** em qualquer campanha (inclusive acima de 200 números), sem abrir acesso administrativo ao painel da rifa e sem que um vendedor enxergue os pedidos ou comissões de outro.

Este projeto transforma o conceito de *Checador Físico* em **Checkout para Parceiros**, mantendo o QR Code da cartela física impressa imutável e adicionando:
1. Gestão de parceiros **isolada por campanha** (com catálogo de parceiros de outras campanhas do mesmo organizador prontos para reabilitação via novo link único 24h);
2. **Convite de uso único e validade de 24 horas** com regra de comissão definida antes do envio (`A combinar` ou valor a partir de `0` — voluntário — em `%` ou `R$` fixo por cota);
3. **Tela exclusiva de checkout do parceiro** para vendas diretas sem passar pela grade pública (o parceiro mostra a cartela física ou vende direto no seu link), com atalho para a rifa pública, impressão da cartela (quando `<= 200` cotas) e aba restrita **Minhas Vendas e Comissões**;
4. **Comprovação bilateral de repasse de comissão:** ao finalizar/acertar a comissão, o organizador informa no `/admin` que pagou e envia um **link único de confirmação** para o parceiro clicar e registrar o recebimento (criando histórico auditável e base futura para score/confiabilidade de parceiros no `/admin/master`);
5. **Dashboard Financeiro no `/admin`** (foco exclusivo desta fase no `/admin` dos organizadores) para acompanhar lucro líquido, faturamento confirmado, pendentes e vendas diretas vs. parceiros.

---

## 2. Objetivos, Não-Objetivos e Anti-Objetivos

### Objetivos
- Substituir o botão **Abrir Checador Físico** em [raffle-manager.tsx](file:///c:/Users/danco/OneDrive/Documentos/DEV/FAST%20RIFA/src/app/admin/rifas/[id]/raffle-manager.tsx) por **Checkout para Parceiros**, liberado para **qualquer rifa** (incluindo campanhas com `total_tickets > 200`).
- Restringir `total_tickets <= 200` **exclusivamente** à geração/impressão da **Cartela Física PDF A4** (`PhysicalCardModal`), mantendo o QR Code impresso na cartela **imutável** apontando para `/pix` padrão da rifa (o parceiro mostra a cartela para o cliente e realiza a venda pelo seu checkout exclusivo).
- Isolar os parceiros por campanha (toda nova rifa começa com lista ativa zerada), exibindo parceiros de outras rifas do organizador para habilitar via novo link único 24h.
- Garantir convite estritamente de **uso único** e com expiração em **24 horas**, validado na interface e nas regras do Firestore (`firestore.rules`).
- Suportar comissão definida antes de enviar o link (**`A combinar`** por padrão, podendo também ser definida a partir de **`0`** — `0%` ou `R$ 0,00` para ajudante voluntário — até qualquer percentual ou valor fixo por cota).
- Exigir no aceite do convite: **Nome completo**, **CPF** (validado via `isValidCpf`) e **Telefone/WhatsApp** (validado via `getBrazilMobileError`).
- Permitir que o organizador informe o pagamento da comissão no painel da rifa (suportando acertos parciais que se somam) e envie um **link de confirmação de recebimento** para o parceiro clicar e registrar.
- Entregar o **Dashboard Financeiro & Rede de Vendas no `/admin`** (`src/app/admin/page.tsx`) consolidando faturamento, reservas pendentes, vendas por canal, comissões e lucro líquido.

### Não-Objetivos (nesta fase)
- Não haverá divisão automática (split) de PIX via gateway: 100% dos pagamentos seguem indo diretamente para a `pix_key` do organizador.
- Parceiros não precisarão criar conta com e-mail/senha nem login Google no Firebase Auth.
- **Painel `/admin/master` fora do escopo desta entrega:** métricas globais da plataforma e indicador de confiabilidade de parceiros no Master ficam preparados nos dados (`partner_payouts`), mas sua tela será construída em fase futura.
- Não alterar `globals.css` nem fugir do Design System homologado FastRifa (`.ora-card`, `.ora-btn-primary`, `.ora-btn-secondary`, `.ora-glass-pill`).

### Anti-Objetivos
- Alterar o destino do QR Code das cartelas físicas impressas ou expor dados do parceiro nele.
- Reutilização de convite após o 1º uso ou após 24h; confirmação duplicada de um mesmo recibo de pagamento.
- Parceiro enxergar vendas de outros parceiros ou dar baixa no próprio PIX (somente o organizador confirma pagamento de cotas no PIX).
- Vendas pelo checkout direto ou público quando a rifa estiver pausada, concluída ou cancelada (`raffle.status !== 'active'`).

---

## 3. Abordagens Consideradas e Decisão

1. **Abordagem 1 (Escolhida): Convite único 24h → Token pessoal no Firestore**
   - Link de convite (`/parceiro/convite/[inviteToken]`) de uso único e validade de 24h cria de forma atômica o vínculo `raffle_partners/{accessToken}` e queima o convite.
   - O parceiro opera em `/parceiro/[accessToken]` com tudo pronto (regra de comissão visível e congelada nos pedidos) e confirma pagamentos recebidos via `/parceiro/confirmar-pagamento/[payoutToken]`.
   - **Trade-off aceito:** zero atrito para cadastrar ajudantes de campo em segundos sem exigir senha/login Google, mantendo arquitetura 100% Web SDK + `firestore.rules`. Se o parceiro perder o link, o organizador copia/reenvia pelo painel ou gera novo convite revogando o anterior.

2. **Abordagem 2 (Descartada): Convite 24h → Criação obrigatória de conta no Firebase Auth**
   - Exigiria que cada ajudante criasse senha ou conta Google antes de vender. Descartada para manter velocidade em campo.

---

## 4. Arquitetura de Dados e Regras de Segurança

### 4.1 Tipos em `src/types/database.types.ts`

```ts
export type PartnerCommissionType = 'negotiable' | 'percent' | 'fixed_per_ticket';
export type PartnerInviteStatus = 'pending' | 'used' | 'revoked';
export type RafflePartnerStatus = 'active' | 'paused' | 'revoked';
export type PartnerPayoutStatus = 'pending_confirmation' | 'confirmed';
export type OrderSaleChannel = 'public' | 'organizer_direct' | 'partner';

export interface PartnerInvite {
  id: string; // Token criptográfico aleatório (ID do documento no Firestore)
  raffle_id: string;
  organizer_id: string;
  raffle_title: string;
  brand_name?: string | null;
  commission_type: PartnerCommissionType;
  commission_value: number; // Aceita >= 0 (0 = voluntário/sem comissão ou 'negotiable')
  prefill_name?: string | null;
  prefill_cpf?: string | null;
  prefill_phone?: string | null;
  source_partner_id?: string | null; // Preenchido ao reabilitar parceiro de outra campanha
  status: PartnerInviteStatus;
  used_by_partner_id?: string | null;
  used_at?: string | null;
  created_at: string;
  expires_at: string; // ISO string (+24h)
  expires_at_ms: number; // Epoch ms para checagem no client
  expires_at_ts?: unknown; // Firestore Timestamp (+24h) validado no servidor via request.time
}

export interface RafflePartner {
  id: string; // Token secreto pessoal do parceiro (ID do documento no Firestore)
  invite_id: string;
  raffle_id: string;
  organizer_id: string;
  full_name: string;
  cpf: string; // 11 dígitos normalizados
  cpf_last4: string;
  phone_whatsapp: string;
  commission_type: PartnerCommissionType;
  commission_value: number; // >= 0
  status: RafflePartnerStatus;
  settled_commission_amount?: number; // Soma dos acertos registrados pelo organizador
  confirmed_payout_amount?: number; // Soma dos acertos confirmados pelo parceiro
  payout_ids?: string[]; // IDs dos PartnerPayout vinculados (permite leitura sem list público)
  last_settled_at?: string | null;
  last_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerPayout {
  id: string; // Token secreto único do recibo (ID do documento no Firestore)
  raffle_id: string;
  raffle_title: string;
  organizer_id: string;
  partner_id: string;
  partner_name: string;
  partner_cpf: string;
  amount: number; // Valor pago informado pelo organizador (permite acertos parciais; aceita >= 0)
  note?: string | null;
  status: PartnerPayoutStatus; // 'pending_confirmation' -> 'confirmed' (transição única)
  created_at: string;
  confirmed_at?: string | null;
}
```

#### Campos adicionados em `Order` (`src/types/database.types.ts`)
Todos opcionais para compatibilidade com pedidos existentes:
```ts
sale_channel?: OrderSaleChannel; // Pedidos antigos assumem 'public'
partner_id?: string | null;
partner_name?: string | null;
commission_type?: PartnerCommissionType | null;
commission_value?: number | null;
commission_amount?: number | null; // Congelado no ato da reserva (0 para 'negotiable' ou taxa 0)
```

### 4.2 Cálculo de Comissão e Lucro Líquido
- **Por pedido (regra congelada na reserva):**
  - `percent`: calculada sobre o `total_amount` efetivo do pedido (já considerando eventuais descontos automáticos). Se `commission_value === 0`, resulta `0`.
  - `fixed_per_ticket`: `ticket_numbers.length * commission_value`. Se `commission_value === 0`, resulta `0`.
  - `negotiable` (*A combinar*): `commission_amount = 0` no pedido (com selo explícito *"A combinar"*).
  - Status do pedido: `pending` → comissão **Pendente**; `paid` → comissão **Confirmada**; `cancelled` → zerada.
- **Acertos e Confirmações (`partner_payouts`):**
  - Cada pagamento informado pelo organizador cria um documento em `partner_payouts/{payoutToken}` e **soma incrementalmente** ao histórico do parceiro (suportando acertos parciais ao longo da campanha).
  - Quando o parceiro clica em **Confirmar Recebimento** no link recebido, o status passa de `pending_confirmation` para `confirmed`, registrando `confirmed_at` e incrementando a visão de valores confirmados (e preparando dado auditável para futura métrica de confiabilidade no Master).
- **Lucro Líquido Estimado no Dashboard `/admin`:**
  - Para cada parceiro da campanha:
    - Se a comissão é numérica (`percent` ou `fixed_per_ticket` > 0): considera as **Comissões Confirmadas** dos pedidos `paid` (e mostra separado se houve acerto registrado acima/abaixo).
    - Se o parceiro está em modo `negotiable` (*A combinar*) e já existem pagamentos registrados para ele via `partner_payouts`, o total desses acertos (`amount` somado) **abate do Lucro Líquido Estimado** no dashboard, preservando alerta visual quando houver pedidos *"A combinar"* ainda sem nenhum acerto lançado.
    - *(Decisão técnica proposta)* Como o cálculo usa apenas `orders` + `partner_payouts` do organizador (`where('organizer_id', '==', user.uid)`), mantém consistência exata mesmo se um parceiro for pausado ou tiver seu vínculo substituído.

### 4.3 Geração de Tokens e Operação Atômica (`writeBatch`)
- Todos os tokens (`inviteToken`, `accessToken`, `payoutToken`) são gerados com `crypto.getRandomValues` (24 bytes em base32/hex alfanumérico seguro, sem caracteres ambíguos), usados diretamente como **document ID** no Firestore.
- No aceite do convite (`/parceiro/convite/[inviteToken]`), o cliente executa **1 único `writeBatch` atômico**:
  1. `batch.set(raffle_partners/{accessToken}, { ...dadosValidados, status: 'active', payout_ids: [] })`
  2. `batch.update(partner_invites/{inviteToken}, { status: 'used', used_by_partner_id: accessToken, used_at: nowIso })`
- Na confirmação do pagamento pelo parceiro (`/parceiro/confirmar-pagamento/[payoutToken]`), um update atômico em `partner_payouts/{payoutToken}` altera apenas `status: 'confirmed'` e `confirmed_at` (o painel do organizador calcula os totais confirmados/pendentes somando diretamente `partner_payouts` vinculados ao `organizer_id` — eliminando necessidade de escrita pública pelo parceiro em `raffle_partners`!).

### 4.4 Regras de Segurança (`firestore.rules`) e Queries sem Índice Composto
Arquitetura 100% Web SDK (`firebase` 13.3.0), usando `getPublicFirestore()` ([config.ts](file:///c:/Users/danco/OneDrive/Documentos/DEV/FAST%20RIFA/src/lib/firebase/config.ts)) apenas para leitura pública controlada (sem expor listagens):

1. **`partner_invites/{inviteId}`**
   - `allow get: if true;`
   - `allow list: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || resource.data.organizer_id == request.auth.uid);`
   - `allow create: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || (request.auth.uid == request.resource.data.organizer_id && get(/databases/$(database)/documents/raffles/$(request.resource.data.raffle_id)).data.user_id == request.auth.uid));`
   - `allow update: if`
     - Organizador/Master pode revogar (`status == 'revoked'`); **OU**
     - Aceite único via `writeBatch`: `resource.data.status == 'pending' && request.time < resource.data.expires_at_ts && request.resource.data.status == 'used'`, campos principais imutáveis e `existsAfter(/databases/$(database)/documents/raffle_partners/$(request.resource.data.used_by_partner_id))`.
   - `allow delete: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || resource.data.organizer_id == request.auth.uid);`

2. **`raffle_partners/{partnerId}`**
   - `allow get: if true;`
   - `allow list: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || resource.data.organizer_id == request.auth.uid);` (sempre consultado via `where('organizer_id', '==', uid)` — campo único, zero índice composto manual).
   - `allow create: if request.resource.data.status == 'active'` + validação via `get(...)` e `getAfter(...)` sobre `partner_invites/{invite_id}` garantindo convite `pending`, não expirado (`request.time < expires_at_ts`), transição para `used` vinculada a `partnerId` e cópia fiel de `raffle_id`, `organizer_id`, `commission_type` e `commission_value`.
   - `allow update, delete: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || resource.data.organizer_id == request.auth.uid);`

3. **`partner_payouts/{payoutId}`**
   - `allow get: if true;` (somente quem tem o `payoutToken` secreto da URL ou faz parte de `partner.payout_ids`).
   - `allow list: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || resource.data.organizer_id == request.auth.uid);`
   - `allow create, delete: if request.auth != null && request.auth.token.email != 'leitor.publico@fastrifa.com' && (isMaster() || (request.auth.uid == request.resource.data.organizer_id && get(/databases/$(database)/documents/raffles/$(request.resource.data.raffle_id)).data.user_id == request.auth.uid));`
   - `allow update: if`
     - Organizador/Master; **OU**
     - Confirmação única pelo parceiro: `resource.data.status == 'pending_confirmation' && request.resource.data.status == 'confirmed' && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'confirmed_at'])`.

4. **`orders/{orderId}` (reforço da regra existente)**
   - Exige `get(/databases/$(database)/documents/raffles/$(request.resource.data.raffle_id)).data.status == 'active'` para qualquer nova reserva.
   - Quando `partner_id != null`: exige que `raffle_partners/{partner_id}` exista, tenha `status == 'active'` e pertença à mesma `raffle_id`.
   - `allow update, delete`: continua bloqueando `leitor.publico@fastrifa.com` e exigindo dono da rifa ou Master (parceiro nunca dá baixa em pedido PIX).

5. **Fallback Local (Offline / Dev sem rede)**
   - Mantém padrão de [raffles.ts](file:///c:/Users/danco/OneDrive/Documentos/DEV/FAST%20RIFA/src/lib/firebase/raffles.ts) com `fastrifa_local_partner_invites`, `fastrifa_local_partners` e `fastrifa_local_partner_payouts`, incluindo limpeza em cascata em `deleteRaffle` e `deleteCreatorProfile`.

---

## 5. Fluxos, Rotas e Telas

### 5.1 Painel da Rifa (`/admin/rifas/[id]`) — [raffle-manager.tsx](file:///c:/Users/danco/OneDrive/Documentos/DEV/FAST%20RIFA/src/app/admin/rifas/[id]/raffle-manager.tsx)
- Substituir **Abrir Checador Físico** por **Checkout para Parceiros** apontando para `/admin/rifas/${raffle.slug || raffle.id}/parceiros` — **habilitado para qualquer quantidade de cotas (inclusive `> 200`)**.
- Manter **Gerar Cartela** restrito a `raffle.total_tickets <= 200` (acima de 200 cotas exibe apenas o aviso informativo de impressão até 200 cotas ao lado do botão ativo **Checkout para Parceiros**).
- Nos cards de pedidos de `raffle-manager.tsx`: exibir badge do canal (`Venda Pública` | `Checkout Direto` | `Parceiro: {partner_name} · Comissão`) e filtro rápido por origem/parceiro.

### 5.2 Página de Parceiros da Rifa (`/admin/rifas/[id]/parceiros`)
Layout seguindo `.ora-card`, `.ora-btn-primary` e `.ora-btn-secondary`:

```text
+-----------------------------------------------------------------------+
| [← Voltar p/ Rifa]   Checkout para Parceiros                          |
|                      Campanha: Nome da Rifa                           |
|  [+ Cadastrar Novo Parceiro (Link 24h)]   [Abrir Meu Checkout Direto] |
+-----------------------------------------------------------------------+
| Resumo na Campanha:                                                   |
| Parceiros Ativos | Cotas via Parceiros | Comissões | Já Acertado       |
+-----------------------------------------------------------------------+
| Parceiros Habilitados nesta Campanha (começa zerada)                  |
| • João Silva (CPF ***.***.***-89) · 10% · 12 cotas pagas (R$ 120)     |
|   Comissão: R$ 12,00 · Pendente: R$ 2,00 · Confirmado p/ parceiro: R$0|
|   [Copiar Link] [Informar Pagamento] [Pausar / Revogar]               |
+-----------------------------------------------------------------------+
| Pagamentos / Links de Confirmação Enviados                            |
| • João Silva · R$ 12,00 · Status: Aguardando parceiro / Confirmado ✓  |
|   [Copiar Link de Confirmação] [Enviar no WhatsApp]                   |
+-----------------------------------------------------------------------+
| Convites Pendentes (Uso Único · Expiram em 24h)                       |
| • Criado há 2h (expira em 21h58m) · Comissão: A combinar / 0% / 10%   |
|   [Copiar Link] [Enviar WhatsApp] [Revogar Convite]                   |
+-----------------------------------------------------------------------+
| Parceiros de Outras Campanhas suas (Habilitar nesta Rifa)             |
| • Maria Souza (CPF ***.***.***-14) · Atuou em "Rifa Moto"             |
|   [Gerar Link p/ Habilitar (24h)]                                     |
+-----------------------------------------------------------------------+
```

- **Botão 1 — Cadastrar Novo Parceiro (Link 24h):** modal com escolha de comissão antes de gerar o link:
  - `A combinar` (**selecionado por padrão**)
  - `Percentual (%) sobre vendas pagas` (aceita de `0` a `100` — `0%` para ajuda voluntária sem remuneração)
  - `Valor fixo (R$) por cota paga` (aceita a partir de `0` — `R$ 0,00` ou qualquer valor fixo)
  - Gera `/parceiro/convite/{inviteToken}` (expira em 24h, uso único), com **Copiar Link** e **Enviar pelo WhatsApp**.
- **Botão 2 — Abrir Meu Checkout Direto:** abre `/r/[slug]/pix?canal=organizador` (ou rota amigável equivalente `/pix?canal=organizador`) para o próprio organizador logado lançar vendas diretas rápidas sem passar pela grade (`sale_channel: 'organizer_direct'`).
- **Informar Pagamento (Comissão):** modal no card do parceiro onde o organizador informa o valor pago (pré-preenchido com o saldo pendente de acerto, aceitando acertos parciais que somam ao histórico e até `R$ 0,00` caso queira registrar quitação de acordo voluntário/ajuste) + observação opcional → cria `partner_payouts/{payoutToken}` e disponibiliza na hora o link `/parceiro/confirmar-pagamento/{payoutToken}` para copiar ou mandar no WhatsApp do parceiro.
- **Reabilitação de Parceiros de Outras Campanhas:** lista deduplicada por CPF com parceiros de outras rifas do mesmo organizador (excluindo quem já está `active` nesta rifa). Ao gerar link p/ habilitar, pré-preenche nome/CPF/WhatsApp no convite 24h; se existir algum vínculo anterior daquele mesmo CPF nessa mesma rifa, o próprio organizador já marca o vínculo antigo como `revoked` ao enviar/gerenciar (sem depender de backend privilegiado).

### 5.3 Convite Único 24h (`/parceiro/convite/[token]`)
- Valida existência, `status === 'pending'` e `Date.now() < expires_at_ms`. Exibe tela clara caso expirado (> 24h), já usado ou revogado.
- Mostra resumo da rifa, marca do organizador e a regra de comissão já pronta (`A combinar`, `X%`, `R$ Y/cota` ou `Ajuda voluntária — 0% / R$ 0,00`).
- Formulário rápido obrigatório: **Nome completo**, **CPF** (`formatCpf` + `isValidCpf`) e **WhatsApp com DDD** (`formatBrazilMobile` + `getBrazilMobileError`).
- No submit: executa o `writeBatch` atômico, salva `accessToken` localmente e redireciona para `/parceiro/${accessToken}`.

### 5.4 Checkout Exclusivo do Parceiro (`/parceiro/[token]`) e Confirmação de Recebimento (`/parceiro/confirmar-pagamento/[payoutToken]`)
- **`/parceiro/[token]`** (evolução de [PhysicalCartelaPixView](file:///c:/Users/danco/OneDrive/Documentos/DEV/FAST%20RIFA/src/components/physical-cartela-pix-view.tsx)):
  - Bloqueia novas vendas se `raffle.status !== 'active'` ou se o parceiro estiver `paused`/`revoked`.
  - Cabeçalho: badge `Parceiro Oficial · {partner.full_name}`, regra de comissão, botão **Copiar Meu Link**, atalho **Ver Rifa Pública** e botão **Imprimir Cartela** (exibido **somente** se `raffle.total_tickets <= 200`, abrindo `PhysicalCardModal` com o QR Code imutável padrão da cartela).
  - Se o parceiro tiver recibos pendentes de confirmação (`partner_payouts` listados via `partner.payout_ids`), exibe banner destacado no topo com botão rápido para abrir e confirmar o recebimento.
  - **Aba 1 — Vender Cotas (Checkout Direto com Promoções & Roleta):**
    - Fluxo em 3 passos (Quantidade → Checador Passo a Passo sem grade → Comprador & PIX direto na chave do organizador), gravando `sale_channel: 'partner'`, `partner_id`, `partner_name` e comissão congelada.
    - Suporta **todas as promoções configuradas na rifa**: `progressive`, `simple`, `buy_x_pay_y` e **`roulette` (Roleta da Sorte)** com `DiscountRouletteModal` interativo para o cliente girar diretamente na tela do celular do parceiro de forma lúdica, além do countdown de 10 minutos para manter o dinamismo da venda.
    - Controles rápidos para atendimento presencial contínuo (evitando que os 10 minutos bloqueiem a venda):
      1. **"Cliente deseja comprar mais? (Tentar novo desconto)"**: preserva o comprador atual e libera uma nova rodada / giro progressivo da roleta (`minExclusivePercent = descontoAnterior`) para aumentar o desconto comprando mais cotas;
      2. **"Novo Cliente"**: zera imediatamente os dados do comprador atual, números verificados, giro da roleta e cronômetro de 10 minutos para atender o próximo cliente do zero.
  - **Aba 2 — Minhas Vendas e Comissões:** lista em tempo real **somente** dos pedidos onde `order.partner_id === partner.id`, cards de resumo (Cotas Pagas, Aguardando PIX, Comissão Confirmada/Pendente, Pagamentos Recebidos) e lista dos seus recibos `partner_payouts`.
- **`/parceiro/confirmar-pagamento/[payoutToken]`**:
  - Tela limpa em `.ora-card` exibindo nome do parceiro, rifa, valor informado pelo organizador, observação e botão **Confirmar Recebimento** (`status: 'pending_confirmation' -> 'confirmed'`). Após confirmado, exibe selo verde auditável com data e hora da confirmação.

### 5.5 Dashboard Financeiro no `/admin` — [src/app/admin/page.tsx](file:///c:/Users/danco/OneDrive/Documentos/DEV/FAST%20RIFA/src/app/admin/page.tsx)
Bloco executivo logo acima de *"Suas Campanhas"* (focado exclusivamente no `/admin` nesta etapa), com seletor de filtro (`Todas as campanhas` ou rifa específica):
1. **Faturamento Confirmado (PIX Pago):** soma `total_amount` dos pedidos `paid` + subtexto com valor **Aguardando PIX (`pending`)**.
2. **Vendas Diretas vs. Parceiros:** quebra em R$ e cotas (`Pública + Direto Organizador` vs. `Parceiros`).
3. **Comissões & Acertos:** total de Comissões Confirmadas (de pedidos pagos), Pendentes (reservas em aberto) e total já Acertado / Confirmado via `partner_payouts`.
4. **Lucro Líquido Estimado:** `Faturamento Confirmado − (Comissões Confirmadas de regras numéricas + Acertos lançados para parceiros "A combinar")`, com aviso transparente caso haja vendas *"A combinar"* ainda sem acerto lançado.
- Nos cards das campanhas em `/admin`, incluir link rápido **Parceiros** ao lado de **Gerenciar**.

---

## 6. Decisões Técnicas Propostas (para sua conferência)

1. **Arquitetura 100% Web SDK + Firestore Rules (sem `firebase-admin`):** como o projeto não possui SDK de servidor/service account configurado, a atomicidade do convite único 24h e da confirmação bilateral é garantida diretamente via `writeBatch` + `get()/getAfter()` nas `firestore.rules`, e eventual revogação de vínculo antigo do mesmo CPF na mesma rifa é feita pelo organizador ao reabilitar no painel.
2. **Bloqueio de venda fora de campanha ativa (`raffle.status !== 'active'`):** tanto a UI quanto `firestore.rules` impedirão novas reservas via checkout direto ou parceiro caso a campanha seja pausada, concluída ou cancelada.
3. **Todas as Promoções e Roleta da Sorte no Checkout do Parceiro/Direto:** `PhysicalCartelaPixView` passa a suportar integralmente `progressive`, `simple`, `buy_x_pay_y` e **`roulette`** (abrindo `DiscountRouletteModal` no celular do parceiro com timer de 10 minutos e botões **"Cliente deseja comprar mais?"** / **"Novo Cliente"**); a comissão `%` do parceiro incide sobre o valor final pago (`total_amount`).
4. **Checkout Direto do Organizador (2º botão):** reutiliza `/pix?canal=organizador` validando que o usuário autenticado via `useAuth()` é o dono/Master da campanha para marcar `sale_channel: 'organizer_direct'`.
5. **Queries de campo único:** consultas em `partner_invites`, `raffle_partners`, `partner_payouts` e `orders` usarão apenas um `where` simples (`organizer_id` ou `raffle_id`), evitando necessidade de criação manual de índices compostos no console do Firebase.
