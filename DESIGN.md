---
version: alpha
name: SorteiLoL
description: Dark arena chrome — League gold as the sole interaction driver over navy surfaces, built for a team randomizer and pick-and-ban draft app.
colors:
  primary: "#c89b3c"
  primary-hover: "#e0b354"
  primary-tint: "#c89b3c11"
  primary-subtle: "#c89b3c18"
  primary-muted: "#c89b3c22"
  primary-border: "#c89b3c44"
  primary-border-focus: "#c89b3c55"
  primary-border-hover: "#c89b3c66"
  on-primary: "#0a0a0a"
  secondary: "#a0c4ff"
  background: "#242424"
  surface: "#1a1a2e"
  surface-elevated: "#2e2e4a"
  surface-hover: "#3a3a5a"
  border: "#3c3c5a"
  border-neutral: "#3c3c3c"
  text: "rgba(255, 255, 255, 0.87)"
  text-primary: "#e0e0e0"
  text-secondary: "#aaaaaa"
  text-muted: "#888888"
  text-dimmed: "#666666"
  text-placeholder: "#555555"
  danger: "#ff6b6b"
  danger-surface: "#2e1a1a"
  danger-surface-hover: "#3a2020"
  success: "#6dffa0"
  success-surface: "#1e4d2b"
  success-border: "#2a6b3a"
  success-surface-hover: "#265e35"
typography:
  display:
    fontFamily: system-ui
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
  h1:
    fontFamily: system-ui
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: system-ui
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1px"
  h3:
    fontFamily: system-ui
    fontSize: 1.4rem
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 600
  body-sm:
    fontFamily: system-ui
    fontSize: 0.9rem
    fontWeight: 600
  caption:
    fontFamily: system-ui
    fontSize: 0.8rem
    fontWeight: 400
    letterSpacing: "1px"
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  pill: 20px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 20px
    typography: "{typography.body}"
  card-feature:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 24px
  champion-value:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
  tab-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
    typography: "{typography.body-strong}"
  tab-active-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  tab-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: 12px
    typography: "{typography.body-strong}"
  tab-inactive-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
  chip-gold:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    typography: "{typography.body-strong}"
  button-ghost:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: 10px
    typography: "{typography.body-sm}"
  button-ghost-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.text-primary}"
  button-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success}"
    rounded: "{rounded.md}"
    padding: 10px
    typography: "{typography.body-sm}"
  button-success-hover:
    backgroundColor: "{colors.success-surface-hover}"
    textColor: "{colors.success}"
  button-danger:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: 10px
    typography: "{typography.body-sm}"
  button-danger-hover:
    backgroundColor: "{colors.danger-surface-hover}"
    textColor: "{colors.danger}"
---

## Overview

SorteiLoL é uma aplicação escura para comunidade de League of Legends: sorteio
de times e campeões, sala de pick & ban (com regra de fearless draft), arena
com histórico e rankings, gerenciamento de equipes e campeonatos no formato
suíço. A identidade visual lembra um "chrome de arena": superfícies navy
profundas, bordas de 1px discretas e o dourado LoL como único driver de
interação. O azul (#a0c4ff) é a cor dos campeões; verde confirma, vermelho
remove/destrói. Navegação e ações ativas são sempre douradas — preservar essa
escassez é a regra mais importante da marca.

## Colors

- **Primary ({colors.primary}):** Dourado LoL. Botões/tabs ativas, títulos de
  time, valores de roleta, chips confirmados e todo estado de interação.
  A família alpha ({colors.primary-subtle}, {colors.primary-border},
  {colors.primary-border-focus}) existe para fills de chip, bordas e glow.
- **Secondary ({colors.secondary}):** Azul campeão — exclusivo para nomes e
  valores de campeão. Nunca usar para ações ou navegação.
- **Background / Surfaces:** Página ({colors.background}) e três níveis navy
  ({colors.surface}, {colors.surface-elevated}, {colors.surface-hover}).
  Cards vivem em `surface`, overlays/controles em `surface-elevated`, hover em
  `surface-hover`.
- **Borders:** {colors.border} em superfícies navy, {colors.border-neutral}
  quando a borda não deve lembrar o navy.
- **Text:** rampa de cinza do mais claro ao placeholder ({colors.text},
  {colors.text-primary}, {colors.text-secondary}, {colors.text-muted},
  {colors.text-dimmed}, {colors.text-placeholder}). Nunca usar branco puro.
- **Danger ({colors.danger}):** remover jogador/ação destrutiva, sempre sobre
  {colors.danger-surface}. **Success ({colors.success}):** confirmar escolha
  (pick/lock), sobre {colors.success-surface}.

## Typography

Pilha nativa (`system-ui`, fallbacks Avenir/Helvetica/Arial) — nenhuma webfont
é carregada. A hierarquia vem de peso (400/600/700) e tamanho, não de famílias.
Rótulos de UI são CAIXA ALTA com letter-spacing de 1px (`h2`, `caption`);
títulos de time e botões ativos usam a mesma convenção. Títulos de página
(`display`) herdam o glow dourado (ver Elevation & Depth).

## Layout

Escala em 4px: `sm` (8px) para gaps intra-linha, `md` (12px) entre campos de
formulário, `lg` (16px) intra-componente, `xl` (24px)/`2xl` (32px) entre
seções; o hub central da página respira com gap de 32px. Conteúdo em coluna
centralizada; painéis têm largura máxima por contexto (formulário de players
360px, resultados 560px, fase de sorteio 480px, duas equipes 1000px).
Breakpoints móveis: resultados colapsam para grid de 3 colunas em ≤768px e a
visão de duas equipes empilha em ≤650px.

## Elevation & Depth

Profundidade vem de bordas, não de sombras: cards usam 1px {colors.border}
sobre {colors.surface}, sem box-shadow por padrão. O único brilho reservado é
dourado — a moldura de 2px {colors.primary-border-focus} com halo
`0 0 24px` (composição de {colors.primary-muted}) no card de sorteio em
destaque e o text-shadow `0 0 20px` no título da página. Interações comprimem
levemente (`scale(0.96)`) ao pressionar.

## Shapes

Raios são modestos crescentes: `sm` (4px) só em microcontroles inline, `md`
(6px) em botões, `lg` (8px) em cards e tabs, `xl` (12px) no card de destaque.
`pill` (20px) é reservado para chips de estado (lane/Rota confirmada). Retratos
de campeão são quadrados 56px com raio `md` (24–36px no mobile).

## Components

- `tab-active` é a única ação de alta ênfase por tela (tab ativa/CTA dourado).
  Variantes de hover vivem como chaves irmãs (`tab-active-hover`), nunca
  aninhadas.
- `tab-inactive` / `chip-gold` cobrem navegação e chips de estado; o chip de
  lane confirmada usa o pill com fill dourado sutil ({colors.primary-subtle}).
- `card` é a superfície padrão de conteúdo (resultados, listas de teams);
  `card-feature` é o card ampliado do sorteio com moldura/glow dourados.
- `champion-value` carrega nomes/valores de campeão em azul sobre `surface`.
- `button-ghost` é a ação neutra (reroll, resetar); `button-success` confirma
  a escolha e `button-danger` é exclusivamente destrutivo (remover jogador).
- Bordas específicas (família {colors.primary-border}, {colors.success-border})
  não têm propriedade no schema — aplicá-las em `border`/`box-shadow` no CSS.

## Do's and Don'ts

- **Do** usar referências de token (`{colors.primary}`) em vez de hex literais
  nas definições de componente.
- **Don't** introduzir cores fora da paleta — a arena toda se sustenta em
  navy + dourado + os três acentos (azul, verde de confirmação, vermelho).
- **Do** preservar o dourado como exclusivo da interação; se tudo reluz,
  nada é clicável. Conteúdo informativo fica em azul (`champion-value`) ou na
  rampa de texto.
- **Don't** usar os tons dim (#666/#555) para texto essencial: em {colors.surface}
  ficam abaixo de WCAG AA — reservados para metadados decorativos.
- **Don't** aninhar variantes de componente: `button-ghost-hover` é irmão de
  `button-ghost`, não filho.