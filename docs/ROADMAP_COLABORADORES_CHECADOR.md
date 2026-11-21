# Roadmap & Definições Futuras: Sistema de Colaboradores no Checador Físico

> **Status:** Documentado para alinhamento e definição de regras de negócio com o usuário.
> **Contexto:** O Checador Físico da Fast Rifa (`/r/[slug]/pix`) permite que qualquer pessoa com celular confira a disponibilidade de cotas em tempo real antes de preencher a cartela física de papel e gere o QR Code com o valor exato somado.
>
> Para ampliar as vendas no comércio, trabalho, família e eventos locais, o organizador da rifa pode contar com **Colaboradores de Venda**. Abaixo estão os modelos levantados para definição futura.

---

## 1. Modelos de Colaboração

### Modelo A: Colaborador Voluntário (Apoiador / Amigo / Familiar)
* **Como funciona:** O colaborador ajuda a vender cotas no dia a dia por afinidade com a causa ou amizade com o organizador (ex: rifa beneficente, rifa de casamento, amigos ajudando a vender).
* **Mecanismo:** 
  - O colaborador acessa a página do Checador Físico através do QR Code impresso na própria cartela ou de um link rápido compartilhado pelo organizador.
  - Não há divisão financeira automática de comissão.
  - Ao registrar uma reserva ou confirmação, o nome do colaborador pode ser informado opcionalmente para que o organizador saiba quem intermediou a venda.

### Modelo B: Colaborador Comissionado (Porcentagem %)
* **Como funciona:** O colaborador recebe uma comissão percentual sobre cada cota que ele vender fisicamente (ex: 10% a 20% do valor da cota).
* **Exemplo:** Cota de R$ 10,00 com 15% de comissão = R$ 1,50 para o colaborador e R$ 8,50 líquidos para o organizador.
* **Mecanismo:**
  - O organizador gera um "Link / Código de Colaborador" (ex: `/r/slug/pix?colab=joao`).
  - O checador físico registra a venda atrelada ao identificador do colaborador.
  - Painel do Organizador exibe o extrato de vendas por colaborador com o total a pagar de comissão.

### Modelo C: Colaborador Comissionado (Valor Fixo em R$)
* **Como funciona:** O colaborador ganha um valor fixo em reais por cota vendida (ex: R$ 1,00 ou R$ 2,00 por bilhete).
* **Mecanismo:**
  - Mesma mecânica de código/link de colaborador do Modelo B, com cálculo simples: `Quantidade de Cotas Pagas * Valor Fixo da Comissão`.

---

## 2. Ponto de Atenção: Pagamento e Custódia do Dinheiro
Como o FastRifa opera com **pagamento 100% direto via PIX para o organizador** (sem taxa de saque e sem intermediação financeira por custódia):
1. **Opção 1 (Direto para o Organizador):** O comprador físico escaneia o QR Code e paga direto no PIX do organizador. O organizador depois repassa o valor da comissão para o colaborador via PIX (o painel gera o total e chave PIX do colaborador).
2. **Opção 2 (Dinheiro em Espécie / PIX do Colaborador):** Se o comprador físico pagar em dinheiro vivo nas mãos do colaborador, o colaborador usa o checador físico, faz o acerto de contas com o organizador, retém sua comissão e transfere a parte líquida para o organizador.

---

## 3. Próximos Passos (A serem definidos pelo usuário)
* [ ] Escolher entre Modelo A (Voluntário), Modelo B/C (Comissão) ou ambos selecionáveis na criação da rifa.
* [ ] Definir se haverá tela de login simplificada para o colaborador ou apenas um apelido/código na URL do checador.
* [ ] Definir tela de prestação de contas no painel do organizador.
