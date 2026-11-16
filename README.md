# FASTRIFA 🚀

Plataforma aberta, rápida e sem atrito para criação e administração de rifas online, com pagamentos diretamente via PIX e seleção híbrida de cotas (grade manual + atalhos de cotas rápidas e gerador aleatório).

---

## 🛠️ Tecnologias Utilizadas

- **Fullstack:** [Next.js](https://nextjs.org/) 16+ (App Router, TypeScript)
- **Estilização & UI:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) (Diretrizes de design `impeccable`)
- **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Firebase Auth + Cloud Firestore)
- **Deploy:** [Vercel](https://vercel.com/)
- **Versionamento:** [GitHub](https://github.com/)

---

## ⚡ Funcionalidades

### 1. Para o Organizador (`/admin`)
- **Autenticação:** Cadastro e login seguro com e-mail e senha via Firebase Auth.
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

## 📦 Como Rodar o Projeto Localmente com Firebase

### 1. Criar o Projeto no Firebase Console
1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) e clique em **Adicionar projeto** (ex: `FASTRIFA`).
2. No menu lateral, acesse **Build > Authentication** > **Começar** e ative o provedor **E-mail/senha**.
3. No menu lateral, acesse **Build > Firestore Database** > **Criar banco de dados** (escolha modo de teste ou configure as regras).
4. Vá em **Configurações do Projeto (ícone de engrenagem) > Geral > Seus aplicativos** e adicione um aplicativo Web (ícone `</>`).
5. Copie as credenciais do `firebaseConfig`.

### 2. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as chaves copiadas:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.
