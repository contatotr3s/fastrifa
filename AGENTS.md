<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# REGRAS E DIRETRIZES DE DESIGN SYSTEM — FAST RIFA

> **REGRA FUNDAMENTAL E INVIOLÁVEL DE COESÃO VISUAL:**
> O padrão visual atual da plataforma Fast Rifa é sagrado e homologado pelo usuário (baseado no estilo Oratry com paleta luminosa, tipografia premium Satoshi/Inter, botões cápsula dinâmicos e efeito glass).
>
> 1. **NUNCA alterar classes ou estilos globais** em `globals.css` ou `tailwind.config.*` de forma a desconfigurar ou alterar a identidade visual de telas, botões ou componentes existentes.
> 2. **Padrão Obrigatório para Botões:**
>    - Botão de ação primária: sempre utilizar `.ora-btn-primary` (com degradê sutil vibrante, transição de escala suave ao clique, cantos totalmente arredondados cápsula/pill, tipografia em peso bold e contraste perfeito).
>    - Botão de ação secundária: sempre utilizar `.ora-btn-secondary` (fundo branco/translúcido com borda suave, cor de texto `#14213A` / `#0D1729`, cantos arredondados cápsula/pill).
>    - Cápsulas e selos de destaque: sempre utilizar `.ora-glass-pill`.
> 3. **Padrão para Cards e Seções:**
>    - Sempre utilizar `.ora-card` para containers, modais e blocos de conteúdo com bordas suaves (`#D9E5F7`), fundo branco/vidro acetinado e sombras etéreas.
> 4. **Respeito ao Tema Dinâmico da Rifa:**
>    - Se a rifa utiliza tom verde ou azul (`raffle.brand_color`), os componentes devem honrar a variável dinâmica sem quebrar a coesão do design.
> 5. **Nenhuma tela nova pode ser criada fora dessas diretrizes.** Se o usuário desejar qualquer variação visual, ele próprio direcionará expressamente.

