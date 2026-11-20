# Cartela Física Phygital, Calculadora PIX e Efeitos de Gratificação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o gerador de Cartela Física em PDF A4 (2 páginas) para rifas de até 200 números, a rota segura `/r/[slug]/pix` de cálculo de PIX somado com sincronização físico-virtual, o gerador de payload PIX BR Code (EMVCo + CRC16) com valor embutido, e efeitos de gratificação com confetes na página da rifa.

**Architecture:**
1. `src/lib/pix-brcode.ts`: Utilitário puro que gera o payload oficial do Banco Central (BR Code EMVCo com assinatura CRC16-CCITT) a partir da chave PIX do criador e do valor total (`amount`), normalizando CPF, CNPJ, telefone, e-mail ou chave aleatória.
2. `src/app/r/[slug]/pix/page.tsx`: Página segura e identificável para onde o QR Code da Página 2 da cartela física aponta; permite escolher a quantidade de cotas, opcionalmente marcar os números anotados no papel para bloquear online, e gera o QR Code PIX + Copia e Cola com o valor somado.
3. `src/components/physical-card-modal.tsx`: Modal para rifas com `total_tickets <= 200` que desenha as 2 páginas A4 em alta resolução no Canvas 2D (Página 1: Vitrine estilizada na cor da marca com ícones de sorte em baixa opacidade, QR Code da rifa e grade; Página 2: Folha de controle presencial com QR Code para `/r/[slug]/pix`, linhas numeradas, ícone WhatsApp, ícone PIX e checkbox `[ ]`) e exporta um arquivo `.pdf` A4 de 2 páginas nativo.
4. `src/app/r/[slug]/raffle-view.tsx` & `src/app/admin/rifas/[id]/raffle-manager.tsx`: Integração do botão "Gerar Cartela Física (PDF)" no painel, QR Code PIX com valor somado no modal de pagamento online e efeitos de gratificação (`canvas-confetti` + micro-interações táteis).

**Tech Stack:** Next.js 16.4 (App Router), React 19, TypeScript, Tailwind CSS 4, `qrcode`, `canvas-confetti`, Canvas 2D API, PDF 1.4 DCTDecode multi-page encoder.

**Spec:** `docs/superpowers/specs/2026-11-20-phygital-cartela-pix-design.md`

---

### Task 1: Gerador Oficial PIX BR Code com Valor Somado (`src/lib/pix-brcode.ts`)
- [x] Criar `src/lib/pix-brcode.ts` com normalização de chave PIX (`cpf`, `cnpj`, `phone`, `email`, `random`), formatação EMVCo TLV, inclusão do campo `54` (valor em reais formatado com 2 casas decimais) e cálculo `CRC16-CCITT (0x1021)`.

### Task 2: Página Segura Calculadora PIX da Cartela Física (`src/app/r/[slug]/pix/page.tsx`)
- [x] Criar `src/app/r/[slug]/pix/page.tsx` com identificação oficial FastRifa + marca do organizador, seletor de quantidade de cotas, seleção opcional dos números anotados no papel (com criação de reserva online para evitar duplicidade) e geração do QR Code PIX + Copia e Cola com valor somado.

### Task 3: Modal Gerador de Cartela Física A4 em PDF de 2 Páginas (`src/components/physical-card-modal.tsx`)
- [x] Criar `src/components/physical-card-modal.tsx` com renderização A4 alta resolução das 2 páginas (Página 1 vitrine estilizada com elementos de sorte em baixa opacidade + grade de até 200 números; Página 2 folha de controle com ícone WhatsApp, ícone PIX, checkbox e QR Code para `/r/[slug]/pix`) e download direto em `.pdf`.
- [x] Integrar botão **"Gerar Cartela (PDF)"** em `src/app/admin/rifas/[id]/raffle-manager.tsx` quando `raffle.total_tickets <= 200`.

### Task 4: Efeitos de Gratificação e QR Code PIX com Valor no Checkout Online (`src/app/r/[slug]/raffle-view.tsx`)
- [x] Adicionar disparo de `canvas-confetti` ao confirmar reserva e gerar PIX, micro-interações táteis nos botões de cotas e pacotes rápidos, e exibir o QR Code PIX + Copia e Cola com o valor total somado no modal de pagamento online.
