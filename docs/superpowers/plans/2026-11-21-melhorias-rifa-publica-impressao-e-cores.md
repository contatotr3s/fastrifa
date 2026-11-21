# Plano de Implementação: Melhorias na Página Pública, Cartela Física, Identidade Visual e Coesão de Cores

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar a experiência da página pública de rifas (removendo distrações visuais e destacando a marca do criador), implementar onboarding pós-criação para venda híbrida (físico + online), aprimorar o PDF da cartela física (emojis menores e legendas condicionais), garantir coerência cromática verde/dinâmica em todo o sistema (checador físico, cartela e layouts) e estruturar o favicon dinâmico.

**Architecture:** Abordagem orientada a componentes e design system Oratry:
- Remoção cirúrgica de marca d'água de fundo em `raffle-view.tsx` mantendo a iluminação de atmosfera da Hero.
- Reorganização do cabeçalho público (remover FastRifa do topo e destacar a logo do criador; mover FastRifa com CTA para o rodapé).
- Atualização do favicon oficial com o novo ícone do bilhete FR (`public/icone-mobile-fastrifa.png` -> `src/app/icon.png`) e chaveamento dinâmico em metadata e painel.
- Banner/modal celebrativo pós-criação de rifa apresentando a estratégia de venda simultânea online + física.
- Ajustes no gerador Canvas A4 de cartela física (`physical-card-modal.tsx`): marcas d'água menores e renderização de contadores/legendas vermelhas restrita a rifas que já possuem números reservados/pagos.
- Correção nos hooks e páginas de checador físico (`/pix`) e cartela para respeitar a cor ativa da rifa ou o tema padrão esmeralda (`green`), sem fallback residual para azul.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS, HTML5 Canvas 2D, Firebase Firestore / Auth, jsPDF (PDF Builder).

---

## Global Constraints
- Respostas SEMPRE em Português do Brasil (`pt-BR`).
- Seguir estritamente o Design System Oratry homologado em `AGENTS.md` (`.ora-btn-primary`, `.ora-btn-secondary`, `.ora-card`, `.ora-glass-pill`).
- Manter o servidor dev rodando e conferir build sem erros de compilação ou TypeScript.

---

## Review Focus
1. **Página Pública (`/r/[slug]`):** Não deve conter nenhum trevo ou ferradura flutuante no fundo; cabeçalho deve exibir a logo do criador com destaque e nunca o ícone da Fast Rifa.
2. **Rodapé Público:** Deve exibir a marca Fast Rifa discreta, frase de confiança e CTA para "Crie sua rifa" direcionando para a Home `/`.
3. **Cartela Física PDF:** Se a rifa tem 0 números reservados/pagos, nenhuma faixa vermelha de status ou lista de números indisponíveis deve ser desenhada nas Páginas 1 e 2; elementos de fundo menores (~35% de redução) e sem corte nas bordas.
4. **Checador Físico (`/r/[slug]/pix`):** Deve carregar em verde se o tema for verde, sem nenhum flash de azul ou bordas azuis.
5. **Favicon:** Deve exibir o novo ícone FR por padrão e a logo da campanha/usuário quando cadastrada.

---

## Tasks

### Task 1: Limpeza da Página Pública e Redesenho do Cabeçalho e Rodapé
**Files:**
- Modify: `src/app/r/[slug]/raffle-view.tsx`
- Modify: `src/app/r/[slug]/layout.tsx`

**Steps:**
- [ ] 1.1 Remover a camada de emojis/ícones de fundo flutuantes (trevos e ferraduras gigantes fixos) em `raffle-view.tsx`.
- [ ] 1.2 No topo da página pública (`raffle-view.tsx`), remover a logo Fast Rifa e posicionar a **logo do cliente/organizador** com tamanho ampliado (h-10 sm:h-12), borda suave e visual nítido. Caso não haja logo, exibir iniciais estilizadas com o nome da marca.
- [ ] 1.3 No rodapé da página pública (`raffle-view.tsx`), adicionar a logo Fast Rifa em tamanho harmonioso junto à frase de tecnologia/segurança PIX e um botão CTA com `.ora-btn-secondary` ou link elegante: "Crie sua rifa" apontando para a home (`/`).
- [ ] 1.4 Garantir que o link de checkout / seleção respeite o tema ativo (usando classes dinâmicas e variáveis Oratry em vez de `#0869F5` hardcoded).

---

### Task 2: Favicon Oficial com Novo Ícone FR e Favicon Dinâmico do Criador
**Files:**
- Modify: `src/app/icon.png` (atualizar com o novo ícone do bilhete FR)
- Modify: `src/app/r/[slug]/layout.tsx`
- Create/Modify: `src/components/dynamic-favicon.tsx` (para aplicar a logo do usuário logado no painel `/admin`)

**Steps:**
- [ ] 2.1 Copiar `public/icone-mobile-fastrifa.png` para `src/app/icon.png` e `public/favicon.ico` / `public/icon.png` para que seja o ícone oficial da Fast Rifa.
- [ ] 2.2 Em `src/app/r/[slug]/layout.tsx`, configurar `icons` para usar `raffle.brand_logo_url` caso o organizador tenha adicionado uma logo; se não tiver, usar `/icone-mobile-fastrifa.png`.
- [ ] 2.3 Criar o componente `DynamicFavicon` e adicioná-lo ao layout administrativo (`src/app/admin/layout.tsx`), atualizando dinamicamente o favicon para a logo da marca do usuário logado se houver logo cadastrada no perfil.

---

### Task 3: Modal / Banner de Boas-Vindas Pós-Criação de Rifa (Venda Híbrida Online + Cartela Física)
**Files:**
- Modify: `src/app/admin/rifas/nova/page.tsx`
- Modify: `src/app/admin/rifas/[id]/raffle-manager.tsx`
- Create: `src/components/hybrid-sales-welcome-modal.tsx`

**Steps:**
- [ ] 3.1 Ao publicar a rifa em `src/app/admin/rifas/nova/page.tsx`, redirecionar para `/admin/rifas/${newId}?created=true`.
- [ ] 3.2 Criar o modal `HybridSalesWelcomeModal` explicando com entusiasmo e clareza:
  - Parabéns pela criação da rifa.
  - Como funciona o sistema híbrido exclusivo da Fast Rifa: venda física com cartela impressa A4 e venda online no WhatsApp sincronizadas ao mesmo tempo.
  - A checagem em tempo real pelo QR Code do Checador Físico que impede qualquer duplicidade de cotas.
  - Orientação passo a passo rápida.
  - CTA principal `.ora-btn-primary`: "Ver Cartela e Imprimir Versão Física" (que aciona a abertura do `PhysicalCardModal`).
  - CTA secundário: "Acessar Gerenciamento da Rifa".
- [ ] 3.3 Integrar o modal em `raffle-manager.tsx`, abrindo automaticamente quando a URL contiver `?created=true`.
- [ ] 3.4 Verificar os botões públicos de "Criar Minha Rifa" (inclusive na home e rodapé) garantindo que apontem para a home `/` conforme orientado.
- [ ] 3.5 Ajustar a tela de cadastro `/cadastro` e login `/login` para garantir que o fluxo com Google funcione com clareza (auto-aceite de termos ao clicar no botão do Google ou validação suave sem travar).

---

### Task 4: Refinamento da Cartela Física em PDF (Marcas d'Água Menores e Legendas Condicionais)
**Files:**
- Modify: `src/components/physical-card-modal.tsx`

**Steps:**
- [ ] 4.1 Na função `drawLuckyWatermarks`, reduzir o tamanho dos trevos e ferraduras em ~35% (de 95-110px para 60-70px) e ajustar as posições `x` para ficarem com margem de segurança de pelo menos 110px das bordas da folha A4, garantindo que não cortem na impressão.
- [ ] 4.2 Criar flag `hasOccupied = (paidSet.size > 0 || pendingSet.size > 0)`.
- [ ] 4.3 Na **Página 1**:
  - A barra de legenda visual e o box inferior de cotas indisponíveis/vendidos/reservados em vermelho só devem ser desenhados se `hasOccupied` for verdadeiro.
  - Se `!hasOccupied` (rifa recém-criada com 0 reservas/pagos), ocultar o box vermelho e expandir o aproveitamento vertical da grade de números, mantendo a cartela 100% limpa.
- [ ] 4.4 Na **Página 2**:
  - A faixa `STATUS DA CARTELA: Disponíveis: X | Vendidos: Y | Reservados: Z` só deve ser desenhada se `hasOccupied` for verdadeiro.
  - Se `!hasOccupied`, ocultar a faixa para não poluir a cartela no início.
- [ ] 4.5 Ajustar a paleta de cores da cartela física para respeitar o tema ativo do sistema (se `raffle.brand_color` for verde ou o tema global do sistema for verde, usar os tons esmeralda).

---

### Task 5: Coerência Cromática no Checador Físico (`/pix`) e Páginas do Sistema
**Files:**
- Modify: `src/app/r/[slug]/pix/page.tsx`
- Modify: `src/lib/theme-context.tsx`

**Steps:**
- [ ] 5.1 Em `src/app/r/[slug]/pix/page.tsx`, ajustar a lógica de tema:
  - Obter a cor da rifa (`data.brand_color`) com fallback no tema global (`DEFAULT_SYSTEM_THEME = 'green'`).
  - Substituir qualquer fallback `'blue'` por `'green'`.
  - Remover estilos residuais com cor azul fixa e garantir que botões e destaques utilizem a cor do tema esmeralda.
- [ ] 5.2 Em `src/lib/theme-context.tsx`, garantir que rotas `/r/[slug]/pix` e `/r/[slug]` apliquem a cor correspondente à rifa (ou verde se a rifa não tiver cor especificada).

---

### Task 6: Documentação de Roadmap para Colaboradores do Checador Físico
**Files:**
- Create: `docs/ROADMAP_COLABORADORES_CHECADOR.md`

**Steps:**
- [ ] 6.1 Criar documento detalhando os cenários de colaboração na venda física:
  - **Cenário A: Modelo Voluntário / Amigos / Familiares** (sem divisão financeira automática, apenas permissão de acesso ao checador via link público/token).
  - **Cenário B: Modelo com Comissão por Cota** (porcentagem % ou valor fixo em R$ por bilhete confirmado).
  - **Cenário C: Fechamento e Relatório de Vendas por Colaborador**.
  - Deixar registrado no repositório para definição e implementação futura com o usuário.

---

### Task 7: Verificação, Build e Deploy em Produção
- [ ] 7.1 Executar `npm run build` e validar compilação sem erros.
- [ ] 7.2 Testar no Chrome as páginas `/r/[slug]`, `/r/[slug]/pix`, modal de cartela física e fluxo de criação.
- [ ] 7.3 Realizar commit e push para o repositório GitHub.
- [ ] 7.4 Realizar deploy de produção na Vercel (`npx vercel --prod --yes`).
