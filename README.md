# FASTRIFA 🚀

Plataforma aberta, rápida e sem atrito para criação e administração de rifas online, com pagamentos diretamente via PIX e seleção híbrida de cotas (grade manual + atalhos de cotas rápidas e gerador aleatório).

---

## 🛠️ Tecnologias Utilizadas

- **Fullstack:** [Next.js](https://nextjs.org/) 16+ (App Router, Server Actions, TypeScript)
- **Estilização & UI:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) (Diretrizes de design `impeccable`)
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL com Row Level Security)
- **Deploy:** [Vercel](https://vercel.com/)
- **Versionamento:** [GitHub](https://github.com/)

---

## ⚡ Funcionalidades

### 1. Para o Organizador (`/admin`)
- **Autenticação:** Cadastro e login seguro com e-mail e senha.
- **Criação de Rifas:** Título, descrição, foto do prêmio, quantidade total de cotas (50, 100, 200, 500, 1.000 ou customizado), preço por cota, chave PIX e WhatsApp.
- **Painel de Controle:** Métricas de arrecadação em tempo real (cotas pagas vs reservadas vs disponíveis).
- **Gestão de Participantes:** Listagem de compradores com link direto para WhatsApp e ações de **Confirmar Pagamento** ou **Liberar Cotas**.
- **Realização de Sorteio:** Inserção do número premiado e nome do vencedor, marcando a rifa como Concluída publicamente.

### 2. Para o Comprador (`/r/[slug]`)
- **Página Pública Otimizada para Celular:** Foto em destaque, barra de progresso das vendas e regras do sorteio.
- **Seleção Híbrida de Cotas:**
  - Clique direto nos números da sorte na grade.
  - Botões rápidos (`+5`, `+10`, `+25`, `+50`, `+100` cotas aleatórias).
  - Campo de busca para encontrar um número específico.
- **Checkout em 2 Passos:** Apenas **Nome Completo** e **WhatsApp**.
- **Pagamento com Chave PIX:** Chave Copia e Cola com 1 clique e botão direto para envio do comprovante no WhatsApp do organizador.

---

## 📦 Como Rodar o Projeto Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar o Banco de Dados no Supabase
1. Crie um projeto gratuito em [supabase.com](https://supabase.com/).
2. No painel do Supabase, acesse **SQL Editor**.
3. Copie o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   *(Isso criará as tabelas `profiles`, `raffles`, `orders`, triggers, índices e todas as políticas de segurança RLS).*

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (baseado em `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-do-supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🚀 Como Subir para o GitHub e Vercel

### Passo 1: Subir para o seu GitHub
1. Crie um novo repositório vazio no seu GitHub (ex: `fastrifa`).
2. No terminal desta pasta, execute:
```bash
git remote add origin https://github.com/SEU_USUARIO/fastrifa.git
git branch -M main
git push -u origin main
```

### Passo 2: Fazer o Deploy na Vercel
1. Acesse [vercel.com](https://vercel.com/) e conecte com seu GitHub.
2. Clique em **Add New... -> Project** e selecione o repositório `fastrifa`.
3. Em **Environment Variables**, adicione as mesmas variáveis do seu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (com a URL final gerada pela Vercel, ex: `https://fastrifa.vercel.app`)
4. Clique em **Deploy**. O deploy será realizado em segundos!
