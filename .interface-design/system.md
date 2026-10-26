# Interface Design System - Pepius Imob

## Direction & Feel
- **Domain**: Gestão imobiliária, contratos, chaves, plantas baixas, vistorias, portfólio de imóveis.
- **Feel**: Profissional, confiável, com calor humano (terracota) e solidez técnica (azul-ardósia). Não é um SaaS genérico frio, mas uma ferramenta de trabalho densa e eficiente.
- **Signature ("Linha de Planta")**: Uso de linhas finas e precisas (1px) em azul-ardósia para delimitar seções, evocando plantas arquitetônicas. Cantos levemente arredondados (6px) para suavizar, mantendo a precisão técnica.

## Depth Strategy
- **Borders-only com leve layering**: Foco em bordas nítidas de 1px (`border-border`, Slate-300) para estrutura clara. Sombras sutis (`shadow-xs` / `shadow-sm`) para delimitação e elevação de cards, popovers e modais.
- **Inputs**: Fundo branco sólido (`bg-card`), bordas visíveis (`border-input`, Slate-300) com micro-sombra (`shadow-2xs`), hover destacado (`hover:border-border-strong`) e anel de foco energizado (`focus-visible:border-accent`).

## Spacing & Density
- **Base unit**: 8px (0.5rem).
- **Density**: Média-alta (foco em produtividade).
  - Componentes (botões, inputs): `h-9` (36px), padding `12px 16px`.
  - Cards: padding `20px` (p-5).
  - Gaps entre grupos: `16px` (gap-4).

## Typography
- **Headings**: `DM Serif Display` (serif). Usada para dar personalidade e hierarquia clara, evocando documentos oficiais e solidez.
- **Body/UI**: `DM Sans` (sans-serif). Legível, geométrica mas amigável, para dados e labels.
- **Scale**:
  - Display: 36px / 600
  - H1: 28px / 600
  - H2: 22px / 600
  - H3: 18px / 600
  - Body: 14px / 400
  - Caption/Meta: 12px / 500 (tracking leve)

## Palette (Tailwind CSS Variables)
- `--background`: #F8FAFC (Slate 50, levemente frio, contraste natural contra cards brancos)
- `--foreground`: #0F172A (Slate 900, máxima legibilidade de texto)
- `--primary`: #1E293B (Slate 800, azul-ardósia escuro)
- `--primary-foreground`: #F8FAFC (Slate 50)
- `--secondary`: #F1F5F9 (Slate 100)
- `--secondary-foreground`: #1E293B
- `--muted`: #F1F5F9 (Slate 100)
- `--muted-foreground`: #475569 (Slate 600, contraste > 4.5:1 WCAG AA)
- `--accent`: #E07A5F (Terracota, calor humano, ação secundária)
- `--accent-foreground`: #FFFFFF
- `--destructive`: #EF4444
- `--destructive-foreground`: #FFFFFF
- `--border`: #CBD5E1 (Slate 300, limites estruturais nítidos)
- `--input`: #CBD5E1 (Slate 300, contorno bem visível de formulários)
- `--ring`: #E07A5F (Terracota, foco visível e distinto)
- `--card`: #FFFFFF
- `--card-foreground`: #0F172A

## Key Component Patterns
- **Button primary**: `h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium`
- **Card**: `rounded-xl border border-border bg-card text-card-foreground shadow-xs`
- **Input**: `h-9 rounded-md border border-input bg-card px-3 text-sm shadow-2xs hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25`
- **Select**: `flex h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-2xs hover:border-border-strong focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25`
- **Badge Status**: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset` + cores semânticas (green/blue/purple/orange/red)-50/700/600/20
- **Filter Bar**: `flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs` com inputs/selects `h-9 bg-card`
- **Section Divider**: `border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground` para separar seções em formulários
- **Table Header**: `text-xs font-medium uppercase tracking-wide text-muted-foreground` com `border-b border-border hover:bg-transparent`
- **Empty State**: Ícone em `h-12 w-12 rounded-full bg-secondary text-muted-foreground` + texto + CTA centralizado
- **Inbox Master/Detail**: Container `flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden rounded-lg border border-border bg-card`, sidebar `w-80 lg:w-96 border-r border-border`, chat area `flex-1 flex-col`
- **Conversation Item**: `border-b border-border p-4 hover:bg-secondary`, channel icon emoji + nome truncado + timestamp `text-[11px] tabular-nums`, status badge `text-[10px]`
- **Stats Card Compact**: `rounded-lg border border-border bg-card p-4` com label `text-xs uppercase tracking-wide text-muted-foreground` e valor `text-xl font-semibold` (accent para destaque)
- **Form Section Divider**: `border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground` para separar seções em formulários longos
- **Public Header**: `h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50`, logo serif + badge accent, nav links `text-sm font-medium text-muted-foreground hover:text-foreground`
- **Hero Search Bar**: `h-14 rounded-lg border border-border bg-card pl-12 pr-4 text-base shadow-sm focus:border-accent focus:ring-2 focus:ring-accent/20`, botão buscar absoluto right
- **Feature Card (Public)**: `rounded-lg border border-border bg-card p-6 hover:border-primary/30`, ícone `h-10 w-10 rounded-md bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground`
- **CTA Button Large**: `h-11 rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90`
- **Section Eyebrow**: `text-xs font-medium uppercase tracking-[0.2em] text-accent` acima de headings em landing pages
- **Decorative Line**: `h-px bg-gradient-to-r from-transparent via-border to-transparent` como divisor arquitetônico entre seções