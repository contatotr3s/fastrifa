# FASTRIFA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir uma plataforma web aberta de rifas (FASTRIFA), simples, funcional e moderna, permitindo que organizadores criem e administrem rifas com chave PIX e que compradores selecionem cotas e enviem comprovantes com facilidade.

**Architecture:** Aplicação Next.js (App Router) fullstack com TypeScript e Tailwind CSS. Banco de dados relacional e autenticação gerenciados pelo Supabase (PostgreSQL + Auth + RLS). Interface do comprador otimizada para dispositivos móveis com seleção híbrida de cotas (grade visual + atalhos rápidos + aleatórios).

**Tech Stack:** Next.js 15+, React 19, TypeScript, Tailwind CSS, Lucide React, @supabase/supabase-js, @supabase/ssr. Hospedagem via Vercel e versionamento via GitHub.

**Spec:** Plataforma multi-usuário (aberta), pagamento modelo híbrido (PIX direto do organizador com confirmação no painel e status `PENDING`/`PAID`), escolha de cotas interativa com gerador aleatório, Supabase Auth para organizadores.

## Global Constraints

- Código e commits padronizados e limpos em TypeScript estrito.
- Interface totalmente responsiva (mobile-first) em Português do Brasil.
- Segurança rigorosa: Row Level Security (RLS) habilitado em todas as tabelas do Supabase.
- Sem complexidade desnecessária (KISS / YAGNI): foco na experiência de compra e no painel de controle.

---

### Task 1: Scaffolding do Projeto Next.js, Tailwind CSS e Git

- [ ] Inicializar o projeto Next.js com App Router, TypeScript, ESLint e Tailwind CSS na raiz da pasta.
- [ ] Instalar dependências adicionais (`lucide-react`, `clsx`, `tailwind-merge`, `@supabase/supabase-js`, `@supabase/ssr`).
- [ ] Configurar `.gitignore` e inicializar repositório Git (`git init`).
- [ ] Criar arquivo `.env.example` com os templates de variáveis do Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- [ ] Criar commit inicial: `feat: inicialização do projeto fastrifa com nextjs e tailwind`.

### Task 2: Script SQL do Supabase (Estrutura, RLS e Triggers)

- [ ] Criar arquivo `supabase/schema.sql` contendo o DDL completo do banco.
- [ ] Tabela `profiles`: id (UUID fk auth.users), full_name, phone_whatsapp, pix_key, pix_key_type, created_at, updated_at.
- [ ] Tabela `raffles`: id (UUID), user_id (UUID fk profiles), title, slug (UNIQUE), description, prize_image_url, ticket_price, total_tickets, pix_key, pix_key_type, status (`draft`, `active`, `paused`, `completed`, `cancelled`), winner_ticket, winner_name, draw_date, created_at, updated_at.
- [ ] Tabela `orders`: id (UUID), raffle_id (UUID fk raffles), buyer_name, buyer_phone, ticket_numbers (integer[]), total_amount, status (`pending`, `paid`, `cancelled`), created_at, paid_at.
- [ ] Trigger para criar automaticamente registro na tabela `profiles` ao cadastrar novo usuário no `auth.users`.
- [ ] Configurar RLS (Row Level Security):
  - `profiles`: leitura e edição apenas do próprio perfil.
  - `raffles`: leitura pública para ativas/concluídas; criação e edição apenas pelo dono da rifa.
  - `orders`: criação aberta para compradores; leitura das cotas públicas apenas com status; visualização completa de dados apenas pelo dono da rifa.
- [ ] Criar commit: `feat(db): script sql com tabelas, triggers e politicas rls do supabase`.

### Task 3: Cliente Supabase e Tipos TypeScript

- [ ] Criar `src/types/database.types.ts` com os contratos das tabelas (`Profile`, `Raffle`, `Order`).
- [ ] Criar utilitários de cliente do Supabase:
  - `src/lib/supabase/client.ts` (navegador / cliente)
  - `src/lib/supabase/server.ts` (Server Components / Server Actions com cookies)
  - `src/lib/supabase/middleware.ts` (proteção de rotas `/admin`)
- [ ] Criar `src/middleware.ts` para redirecionar usuários não autenticados que tentarem acessar o painel `/admin`.
- [ ] Criar commit: `feat(supabase): clientes supabase client/server e middleware de autenticação`.

### Task 4: Fluxo de Autenticação do Organizador

- [ ] Criar página de login `/login` com e-mail e senha.
- [ ] Criar página de cadastro `/cadastro` com nome, WhatsApp, e-mail e senha.
- [ ] Implementar Server Actions / Handlers de autenticação (`login`, `signup`, `logout`).
- [ ] Exibir mensagens de erro e feedback visual amigável.
- [ ] Criar commit: `feat(auth): páginas e fluxos de cadastro, login e logout`.

### Task 5: Painel do Organizador - Criação e Listagem de Rifas

- [ ] Criar layout do painel `/admin` com cabeçalho, navegação e botão de sair.
- [ ] Criar página `/admin` (Dashboard): listagem de rifas do organizador com status, métricas de vendas e link rápido para a página pública.
- [ ] Criar página `/admin/rifas/nova`: formulário para criar rifa (título, descrição, imagem do prêmio, quantidade de cotas: 100, 200, 500, 1000 ou custom, valor por cota, chave PIX e WhatsApp).
- [ ] Gerador automático de `slug` único e amigável para a URL da rifa.
- [ ] Criar commit: `feat(admin): dashboard de rifas e formulário de criação de nova rifa`.

### Task 6: Painel do Organizador - Gerenciamento de Participantes e Sorteio

- [ ] Criar página `/admin/rifas/[id]`: detalhes da rifa específica.
- [ ] Tabela de pedidos/participantes com filtros por status (`Todos`, `Pendentes`, `Pagos`).
- [ ] Ação rápida: botão "Confirmar Pagamento" (altera status para `paid` e registra `paid_at`).
- [ ] Ação de "Liberar Cotas" (cancela o pedido pendente e libera os números imediatamente).
- [ ] Seção para realização do sorteio: campo para informar o número premiado e nome do ganhador, mudando o status da rifa para `completed`.
- [ ] Criar commit: `feat(admin): gerenciamento de pedidos, confirmação de pix e encerramento de rifa`.

### Task 7: Página Pública da Rifa (`/r/[slug]`)

- [ ] Criar rota pública `/r/[slug]` com metadados dinâmicos e imagem do prêmio.
- [ ] Componente Hero da Rifa: título, foto do prêmio, valor por cota, organizador e barra de progresso das vendas (% cotas pagas).
- [ ] Barra de ferramentas de seleção:
  - Botões de quantidade rápida: `+5`, `+10`, `+25`, `+50`, `+100`.
  - Botão "Escolher Aleatórios".
  - Contador de cotas selecionadas e valor total em tempo real.
- [ ] Grade visual de números com estados claros:
  - Disponível (clicável)
  - Selecionado pelo usuário (destacado)
  - Reservado / Pendente
  - Pago (bloqueado)
- [ ] Otimização para grandes quantidades de números (renderização leve e paginação/busca rápida por número específico).
- [ ] Criar commit: `feat(public): página da rifa com grade de cotas e gerador de números aleatórios`.

### Task 8: Modal de Checkout e Tela de Pagamento PIX

- [ ] Modal de confirmação ao clicar em "Comprar [X] Cotas":
  - Formulário com Nome Completo e WhatsApp (com máscara e validação).
  - Resumo dos números reservados e valor total.
- [ ] Ao confirmar, criar registro na tabela `orders` com status `pending`.
- [ ] Tela/Modal de Pagamento PIX:
  - Chave PIX do organizador com botão de um clique "Copiar Chave".
  - QR Code dinâmico gerado com base no valor e chave do organizador.
  - Botão de ação principal: "Enviar Comprovante no WhatsApp" (abre conversa direta com o organizador com mensagem pronta contendo nome, rifa e números escolhidos).
- [ ] Criar commit: `feat(checkout): modal de compra, chave pix copia e cola e link direto para whatsapp`.

### Task 9: Polimento Visual, Validação e Preparação para GitHub/Vercel

- [ ] Aplicar diretrizes da skill `impeccable` para acabamento refinado (tipografia, espaçamento, contraste e ausência de elementos genéricos).
- [ ] Testar fluxo completo de ponta a ponta (Criação de conta -> Criar rifa -> Acessar página pública -> Reservar cotas -> Confirmar pagamento no painel -> Sortear ganhador).
- [ ] Instruções no `README.md` explicando passo a passo como subir no GitHub e conectar na Vercel e Supabase.
- [ ] Criar commit final: `docs: documentação de deploy e guia de configuração do supabase e vercel`.
