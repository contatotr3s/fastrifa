# Design Spec: Cartela Física Phygital (PDF A4), Calculadora PIX Segura e Efeitos de Gratificação

**Data:** 2026-11-20
**Status:** Aguardando aprovação final do usuário

---

## 1. Intenção e Por Quê
Unir a venda presencial (cartela impressa em papel) com a experiência digital da FastRifa, permitindo que rifas de até 200 números tenham uma cartela A4 estilizada pronta para impressão e uma folha de controle presencial com QR Code inteligente que calcula o PIX somado pela quantidade de cotas, além de elevar a satisfação de compra na página online com micro-interações e confetes.

---

## 2. Escopo e Funcionalidades

### A. Gerador de Cartela Física em PDF (2 Páginas A4 — Rifas até 200 cotas)
- **Onde fica:** Botão **"Gerar Cartela Física (PDF)"** no painel da rifa (`src/app/admin/rifas/[id]/raffle-manager.tsx`), disponível para rifas com `total_tickets <= 200`, informando *"Cartela física pronta para impressão (2 páginas A4)"*.
- **Abordagem Técnica Escolhida:** **Abordagem 1 (Renderização Canvas A4 Alta Resolução + jsPDF)** — garante fidelidade visual absoluta em 300 DPI equiv., mantendo cores da marca (`blue` ou `green`), fontes, ícones e QR Codes nítidos em qualquer dispositivo, sem depender das configurações de impressão do navegador.
- **Página 1 — Vitrine Estilizada e Grade de Números:**
  - Cabeçalho com logo **FastRifa** e logo/iniciais + nome da marca do organizador.
  - Atmosfera visual na cor da campanha (Azul Cobalto ou Verde Esmeralda) com elementos sutis de sorte ao redor em baixa opacidade (trevo de 4 folhas, ferradura, estrelas/bilhete).
  - Card de destaque com foto do prêmio, título da rifa, valor unitário da cota e **QR Code da Página Online (`/r/[slug]`)**.
  - Grade completa dos números (`001` até `N`, máximo 200), estilizada como os botões da tela (com opção no modal de gerar a cartela **100% limpa** ou **sincronizada** com as cotas já pagas marcadas).
- **Página 2 — Folha de Controle Presencial + QR Code Calculadora PIX:**
  - Cabeçalho com resumo da campanha e **Box do QR Code de Pagamento Rápido (`/r/[slug]/pix`)**, instruindo: *"Escaneie para escolher a quantidade de cotas e gerar o PIX com o valor somado"*.
  - Lista numerada de `#001` até `#N` (organizada em 2 colunas quando > 40 números para caber perfeitamente na folha A4 com espaçamento confortável para escrita à caneta).
  - Em cada linha:
    - Número da cota (`#001`)
    - Linha para **Nome do Comprador**
    - **Ícone do WhatsApp** + linha para anotar o telefone
    - **Ícone do PIX** + **Checkbox `[ ☐ ]`** para marcar um "V" à caneta quando pago.

### B. Página Segura de Pagamento Rápido da Cartela (`/r/[slug]/pix`) — União Físico + Virtual
- **Identificação e Segurança:** Exibe selo **"Pagamento Oficial Verificado • FastRifa"**, logo e nome do organizador, foto e título da rifa e valor unitário por cota.
- **Fluxo em 2 Passos:**
  1. **Passo 1 (Quantidade e Sincronização Opcional):**
     - Pergunta: *"Quantas cotas você escolheu na cartela?"* com seletor `+ / -`, campo numérico e atalhos rápidos (`1`, `2`, `3`, `5`, `10` cotas).
     - Mostra o cálculo em tempo real: `X cotas × R$ Y,YY = Total R$ ZZ,ZZ`.
     - **Ponte Físico-Virtual (Opcional com 1 toque):** Opção *"Quero informar os números que anotei no papel"* para que o comprador selecione os números da cartela física (ex: `#014`, `#015`) e seu nome/WhatsApp — já reservando esses números no sistema online para evitar venda duplicada entre o papel e a internet!
     - Botão conclusivo: **"Gerar QR Code PIX (R$ ZZ,ZZ)"**.
  2. **Passo 2 (QR Code PIX Oficial com Valor Somado):**
     - Gera instantaneamente o payload oficial do Banco Central (**BR Code EMVCo + CRC16**) apontando para a chave PIX do criador já com o **valor total somado (`R$ ZZ,ZZ`)** embutido.
     - Exibe o **QR Code PIX** pronto para escanear, o botão **"Copiar PIX Copia e Cola"** (com efeito de gratificação) e o botão **"Enviar Comprovante no WhatsApp"** já formatado com a quantidade de cotas e valor total.

### C. Efeitos de Gratificação e Satisfação na Página da Rifa (`src/app/r/[slug]/raffle-view.tsx`)
- **Confetes na Conclusão da Reserva:** Ao clicar em *"Confirmar e Gerar PIX"* e concluir a reserva, dispara uma explosão elegante de confetes (`canvas-confetti`) nas cores da marca e dourado.
- **QR Code PIX com Valor Somado no Checkout Online:** O modal de reserva concluída na página `/r/[slug]` também passa a exibir o **QR Code PIX + PIX Copia e Cola com o valor total das cotas selecionadas já embutido**, além da chave PIX tradicional.
- **Micro-interações Táteis:**
  - Animação elástica suave (`active:scale-95` e pulso de seleção) ao tocar nas cotas ou nos botões de *"Seleção Rápida (+5, +10...)"*.
  - Feedback visual de celebração ao clicar em *"Copiar PIX"* e no botão flutuante *"Reservar Agora"*.

---

## 3. Abordagens Consideradas
1. **Abordagem 1 (Escolhida):** Renderização A4 de alta resolução via Canvas 2D + empacotamento em PDF (`jspdf`) no cliente + rota dedicada `/r/[slug]/pix` com gerador EMVCo BR Code (CRC16).
2. **Abordagem 2 (Descartada):** Impressão via CSS `@media print`, descartada por inconsistência de cores de fundo e margens entre navegadores mobile e desktop.
