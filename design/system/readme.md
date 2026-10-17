# THD Room Finder — Design System

The design system for **THD Room Finder**, the free-study-room finder for
**Technische Hochschule Deggendorf (THD)**. The app reads THD's public
scheduling system (THabella) and shows which teaching rooms are **free right
now**, or at any time you pick, and for how long.

From **Phase 1** the app also becomes a daily focus tool: a student starts a
**focus session** in a free room, privately (the room shows as *claimed*) or
open to their **batch** (classmates see a violet invitation). This system
carries both: the Material 3 room-finder language and the new focus layer.

> **Browsing needs no account. Find a room, then focus in it.**

---

## Sources

This project is mirrored in git at
[`design/system/`](https://github.com/arudaev/THD-Room-Finder/tree/main/design/system).
Change the repository first, then sync this project
(`design/system/README-SYNC.md`).

- **Repository:** https://github.com/arudaev/THD-Room-Finder (GPL-3.0)
  - `src/styles/tokens/` — the tokens the app ships (same `colors.css` as `tokens/` here)
  - `src/components/` — TypeScript ports of the components in `components/`
  - `docs/product/focus-sessions.md` — the Phase 1 product specification
  - `design/brief/` — the design brief and the sessions to run
- **App:** one React + TypeScript codebase: installable PWA on the web, Android via Capacitor. iOS uses the PWA.
- **Live data:** THabella — https://thabella.th-deg.de
- **THD:** https://www.th-deg.de

Components here are React recreations used for design work; the production
components are TypeScript ports that mirror them 1:1.

---

## Content Fundamentals

**Voice: plain, confident, student-first.** The product solves one annoyance —
*"is there a free room?"* — and the copy never overstates it.

- **Person:** addresses the student as **you** ("Find the closest free room to
  where you already are"). Describes itself in plain third person ("Powered by
  THD's public THabella scheduling system").
- **Sentence shape:** short. Often fragments for emphasis —
  *"No accounts. No backend. No configuration."* / *"Just open the app and find
  a room."* Benefit first, mechanism second.
- **Casing:** Sentence case for body and subheads. **Title Case for buttons and
  section labels** ("Find a Free Room", "Building Filters", "Use in Browser").
  Building/room codes keep their real casing (`A.011`, `ITC1.07`).
- **Numbers are the hero.** The home screen is a single huge number (rooms free
  now). Stats are concrete: *289 classrooms · 5 min refresh · 0 accounts*.
- **German preserved where it helps.** UI is English, but original German room
  and building names are kept ("THabella", building codes).
- **No emoji in product UI.** The only decorative glyph anywhere is the ♥ on the
  *iOS-funding* sponsor action — and that's a stroke SVG, not an emoji.
- **Tone to avoid:** marketing-speak ("leverage our real-time availability
  engine"), exclamation pile-ups, hype. If a sentence sounds like a pitch deck,
  rewrite it shorter.

**Example copy (verbatim from the product):**
> "Find free study rooms at Technische Hochschule Deggendorf — instantly.
> Real-time availability across 289 classrooms, no account required."
> · "See which rooms are free right now."
> · "Pick any future date and time to check availability ahead of schedule."

---

## Visual Foundations

The product is **Material 3 (Material You)**, light-first with a full dark theme,
implemented in one React codebase for the PWA and the Android app.

- **Color.** One brand accent — **THD blue `#1565C0`** (primary) — used for
  buttons, links, active chips, and the big count. Status is carried by three
  Material roles: **teal/green `#00796B`** = *free / available*, **amber
  `#9A6700`** = *free, but closing soon*, **red `#B3261E`** = *occupied* — the
  duration-first redesign's third state. A slate **secondary** (`#546E7A`) fills tonal
  buttons and selected chips. Backgrounds are a cool near-white
  (`#F4F6FA` page, `#FDFCFF` surface). **Pink `#D81B60` is reserved exclusively
  for the "help launch iOS" sponsor CTA** and never used decoratively. Every
  role has a paired `container` / `on-container` tint following M3 convention.
- **Type.** **Roboto** (the Material/Android default) with a native system-font
  fallback so installed PWAs match the OS. Weights: **300 light** for the big
  display count, **400 regular** for body and headlines, **500 medium** for
  titles, buttons, chips, and labels. **Roboto Mono** for clock times and room
  codes (tabular numerals). Tracking is 0 across the scale (M3 spec).
- **Spacing.** A **4px base grid**. Cards pad at 16px, room cards gap at 8px,
  screens inset 16px, landing sections at 64–80px. Touch targets floor at 44px
  on coarse pointers.
- **Shape (corner radius).** M3 shape scale: **4px** badges, **8px**
  chips/inputs, **12px** icon tiles, **16px** cards/sheets, **28px** pill
  buttons, full-round avatars/icon buttons. Cards are noticeably rounded (16px);
  buttons are full pills.
- **Elevation / shadows.** Two soft, neutral, low levels. Cards rest at
  **level 1**; hover/sheets lift to **level 2**. No colored or hard shadows;
  dark theme deepens the alpha. M3 "ElevatedCard" is the default surface — no
  outline-only cards (except in high-contrast mode).
- **Borders.** Hairline only — `--md-outline-variant` (`#C4C6D0`) for dividers
  and the app-bar bottom rule; `--md-outline` for input borders. Cards use
  shadow, not border, for separation.
- **Backgrounds.** Flat color fields — **no gradients, no imagery, no textures,
  no patterns.** The marketing OG banner is the one exception (subtle ghosted
  room rectangles behind the wordmark). The product itself is resolutely flat.
- **Cards.** Rounded 16px, near-white surface, soft level-1 shadow, 16–24px
  padding. Interactive cards (room rows, feature cards) lift 1px and go to
  level-2 shadow on hover. Never a colored left-border accent.
- **Transparency & blur.** Minimal. A semi-opaque scrim (`rgba(0,0,0,.32)`)
  behind the install bottom-sheet; `color-mix` alpha tints on icon-button hover.
  No glassmorphism.
- **Animation.** Restrained and short — **100–150ms**, Material standard easing
  `cubic-bezier(0.2,0,0,1)`, property-scoped (shadow, background, transform), a
  single 0.4s `fade-up` on the hero. The only loop is the loading spinner.
  Everything collapses under `prefers-reduced-motion`.
- **Hover states.** Buttons gain a level-1 shadow; cards lift + raise shadow;
  icon buttons get an 8% tinted circular background; nav links get an 8% tint.
  No color inversion.
- **Press / active.** Selected chips fill with the secondary container; active
  schedule events tint with the error container. `-webkit-tap-highlight-color`
  is removed in favor of these explicit states.
- **Imagery vibe.** Essentially none inside the product — it's data, not
  pictures. The brand mark and OG banner are cool-toned, flat, geometric.
- **Layout rules.** Fixed 64px top app bar (sticky on web, safe-area-aware on
  the PWA). Hero column maxes at 560px, feature grid at 920px, centered.
  Mobile-first; the app is a single scrolling column.

---

## Focus layer (Phase 1)

Tokens, components and cards for focus sessions, approved in design sessions
D1–D4 (`brief/03-sessions.md`) and shipped in the app's tokens and
`src/components/`. The components in `components/focus/` are mirrored from the
app (`design/mirror-components.mjs`), so they render exactly as the app does.

| Meaning | Token | Light | Dark | Use |
|---|---|---|---|---|
| You & your batch | `--md-focus` / `-container` | `#6A4BA8` / `#EBE0FF` | `#D0BCFF` / `#4F378B` | Your active session surface; a batchmate's public session; batch map ring |
| Claimed by someone else | `--md-claimed` / `-container` | `#4E4060` / `#E6E0EC` | `#CFC0DC` / `#43384F` | Anonymous claim row, claimed bucket, map dot. "Grey, but for focus" |
| Focus graph, levels 0–4 | `--md-graph-0…4` | `#EFEEF5 #D8CCF6 #AE95E8 #7E5BCC #4A2A91` | `#2B2930 #3D2D6E #5B3FAD #9479E6 #D3C2FF` | Daily focus in Pomodoro blocks 0 · 1 · 2–3 · 4–6 · 7+ (0 · <50 · <100 · <175 · 175+ min). Levels 0–2 stay under 3:1 on purpose; values are also in the tooltip, legend and a hidden table |
| Snackbar | `--md-inverse-surface` / `-on-surface` | `#1C1B1F` / `#FDFCFF` | `#E6E1E5` / `#1C1B1F` | One-line status ("Link copied") |
| City events (reserved, Phase 3) | `--md-event` / `-container` | `#6B5E00` / `#F7E886` | `#DCCB5C` / `#504600` | Not used before M4; kept distinct from amber "closing soon" |

Semantic aliases: `--focus-own`, `--focus-batch`, `--status-claimed`,
`--event` (+ `-bg`). All pairs meet WCAG AA, most AAA (ratios on the
`color-focus` card).

**Rules**

- **Start focus is primary blue**; once a session is active its surface turns
  violet and shows a **Private | Public** segmented control, with **Private
  selected by default**.
- **Colour plus words.** A violet badge always reads like "AIN 7 · studying";
  a claim reads "Focus session · 40 min". Never colour alone.
- **The schedule wins.** Focus signals never recolour lecture occupancy (red)
  or make an occupied room look free.
- **Ordering:** free (incl. your batch) → closing soon → claimed → lecture,
  longest-free first within each.
- **Map (option A · ring):** availability tint stays; at rest your batch adds
  only a violet roof outline and claims a small dark-purple dot, no text. The
  label ("AIN 7 · 2", "You") and the claim count appear on the tapped building.
  The building list says every mark in words.
- **Focus graph:** a contribution graph (square cells, Mon → Sun, current week
  rightmost, today outlined) on `--md-graph-0…4`.
- **Graph colour:** Violet (default), Orchid or Graphite, set with
  `data-accent="orchid|graphite"` on the same element as `data-theme`. It
  recolours **only** the focus graph and the share card; sessions, batch
  badges and map rings stay violet. Blue, teal, amber, red and claimed purple
  are never offered.
- **Share card:** 1080 × 1080, the current semester's weeks, drawn on the
  device from the tokens. Shared as a link whose preview is the card (ADR
  0003); name and batch opt-in, never rooms, times or programme.

Cards: `guidelines/color-focus.html`, `focus-states.html`,
`focus-ordering.html`, `focus-map-signal.html`, `focus-graph.html`, and
`components/focus/focus.card.html` for the components.

---

## Iconography

- **Style:** **Feather-style line icons** — 24×24 viewBox, `fill: none`,
  `stroke: currentColor`, **stroke-width ~1.75–2**, round caps and joins. They
  inherit text color via `currentColor`, so they recolor with their context
  (white on a filled button, `on-primary-container` in a feature tile).
- **Source:** the original repo **hand-inlines each icon as raw SVG** — there is
  no icon font, no sprite sheet, and no icon dependency. This system keeps that
  approach: icons are written inline where used (see `ui_kits/*/*.jsx` and the
  component cards). The set matches the **Feather / Lucide** vocabulary
  (clock, home, calendar, map-pin, download, shield, github), so when you need a
  glyph not already inlined, pull it from **Lucide** (https://lucide.dev) at
  stroke-width 2 — it's a drop-in match. *(Substitution flagged: Lucide is used
  as the nearest CDN-available equivalent of the repo's bespoke inline set.)*
- **The GitHub mark** is the one filled (not stroked) glyph, used in nav/footer.
- **The brand mark** (an open door with green light spilling out — "find a free
  room") is a distinct multi-shape SVG, not part
  of the line-icon set — see `assets/logo/` and the `Logo` component.
- **Emoji:** never in product UI. The sponsor **♥** is a stroked SVG heart, not
  an emoji.
- **Unicode glyphs:** only the `✕` close affordance on the custom-time badge.

---

## Index / Manifest

**Root**
- `styles.css` — the one entry point consumers link (`@import` manifest only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
  `breakpoints.css` (window size classes + adaptive-nav metrics + responsive
  layout helpers), `elevation.css` (shape + shadow + motion).
- `assets/logo/` — app icon (`icon.svg`, `icon-192/512/180.png`,
  `maskable-512.png`); `assets/og-banner.png` — marketing banner.

**Foundation cards** (`guidelines/`, shown on the Design System tab)
- Colors: primary, status, surfaces, sponsor, **focus layer** · Type: display,
  headings, body, mono · Spacing: scale, radius, elevation · Brand: logo, voice.
- **Focus** (Phase 1, approved): room-detail states, focus-aware list
  ordering, map signals, focus graph and share card.
- **Layout** (new): `layout-responsive.html` — the three Material window size
  classes (compact / medium / expanded → phone / tablet / desktop) and the same
  `AdaptiveNav` shown as bottom bar, rail and drawer · `bilingual.html` — one UI
  toggled live between English and Deutsch, demonstrating that German (~30%
  longer) reflows without clipping.

**Components** (`components/`, exported on `window.THDRoomFinderDesignSystem_de229b`)
- `core/` — `Button`, `Chip`, `Badge`, `Card`, `IconButton`, **`LanguageToggle`**,
  `SegmentedControl`, `Switch`, `Sheet`, `ConfirmDialog`, `Snackbar`, `Skeleton`
- `focus/` — `ActivityRow`, `FocusButton`, `FocusSurface`, `FocusPill`,
  `FocusSummary`, `CheckInSheet`, `FocusBadge`, `FocusGraph`, `ShareCard`
  (+ `renderShareCard`), `ProfileHeader`, `ListNotice`, `MapLegend`,
  `BuildingRow` (mirrored from the app)
  (EN/DE segmented control — the single in-app locale switch; small pill for an
  app bar, medium row for settings)
- `app/` — `Logo`, `AppBar`, `RoomCard` (answer-first list row — leads with the
  free-for-duration hero; `status` free/soon/occupied), `StatusCard` (room-detail
  banner, same three-state status + duration hero), `CampusMap`,
  **`AdaptiveNav`** (one component, three forms by window size class: bottom bar
  → navigation rail → navigation drawer/sidebar; `variant="auto"` tracks width,
  or force a form for specimens)
- `CampusMap` (`app/CampusMap/`) — a self-contained **2.5D campus map**: real
  OpenStreetMap footprints extruded and tinted by room availability, with
  streets, the Donau, parks and trees. No tiles / WebGL / API key — pure SVG.
  Data in via `campus` + `context` props, live `availability` per building key,
  selection out via `onSelect`; fully re-skinnable via the `theme` prop and
  light/dark via `mode`. Ships sample `campus-data.js` / `context-data.js`
  (the context sample is simplified — rounded + line-simplified geometry).
- Each has a `.d.ts` contract and `.prompt.md` usage note; `*.card.html`
  renders the group on the Design System tab.

## Responsive & bilingual

The product ships to **phone, tablet and desktop** (installable PWA + Android
app) in **English and German**. Two foundations carry that:

- **Window size classes** (`tokens/breakpoints.css`) — Material's compact
  (`< 600px`), medium (`600–839px`) and expanded (`≥ 840px`), mapped to phone /
  tablet / desktop. They drive layout (single column → list-detail panes) and
  navigation (`AdaptiveNav`: bottom bar → rail → drawer). Mobile-first; helper
  classes `.rf-shell` / `.rf-list-detail` / `.rf-container` give plain HTML a
  ready responsive scaffold.
- **Bilingual by default** — components take their label text as props, so the
  *same* component renders EN or DE unchanged; `LanguageToggle` is the one
  control that flips locale. Rules: never fix label widths (German runs ~30%
  longer), keep room/building codes (`A.011`, `ITC1.07`) untranslated, one
  `t(en, de)` per string.

**Templates** (`templates/`, starting folders consuming projects copy)
- `campus-room-finder/` — the **CampusMap wired into a real app screen**: a 2.5D
  campus map → tap a building → its free-room list → room detail with the day's
  schedule. Scenario toggle (Now / +2 h / Thu 14:00) and a light/dark map
  toggle. Composes `AppBar`, `RoomCard`, `StatusCard`, `CampusMap`. Sample rooms
  are generated deterministically from each building's live `{free,total}` so the
  map tint, building counts, and room lists always agree (`rooms-data.js`).

**UI kits** (`ui_kits/`)
- `room-finder/` — the interactive **full app** in an M3 device frame: home
  (free-now count) → **Find a Free Room** (list) or **Campus Map** (2.5D map →
  tap a building) → free-room list → room detail with schedule. Composes
  `AppBar`, `RoomCard`, `StatusCard`, `CampusMap`, `Button`, `Chip`,
  `IconButton`, and shares the campus + rooms data with the `campus-room-finder`
  template so map tints and room lists agree.
- `website/` — the marketing landing page, recreated 1:1.

**Other**
- `SKILL.md` — makes this folder usable as a downloadable Claude Agent Skill.

---

## Roadmap for this system

| Phase | Design work | Where |
|---|---|---|
| Phase 1 | Focus sessions: room detail states, Profile tab, list/map signals, focus graph | `brief/03-sessions.md` sessions D1–D4 |
| Phase 2 | Group sessions, profiles with handles, organization tags | Later brief |
| Phase 3 | City layer: yellow zones, event and museum cards | Later brief; `--md-event` reserved |

Built earlier: the campus map (`CampusMap` + `templates/campus-room-finder/`),
saved rooms, duration filters and room search all ship in the app today.

---

## Caveats / substitutions

- **Roboto** is loaded from Google Fonts (the real product uses the system
  Roboto on Android + a system-font stack elsewhere). If you want self-hosted
  `.woff2` files shipped with the system, send them and I'll add `@font-face`.
- **Icons:** the repo inlines bespoke Feather-style SVGs with no icon library;
  **Lucide** is documented as the nearest drop-in source for new glyphs.
- Component cards and UI kits load `_ds_bundle.js`, which the compiler generates
  — they render once the bundle is built.
