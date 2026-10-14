# D4 · Focus graph share card — handback

Export: `D4 Share Card.dc.html` (views: Prototype · All states · Theme × language · Components) + `d2-graph-tokens.css`, `d4-share-tokens.css`, `assets/icon.svg`.
Reuses D2 unchanged: FocusGraph (Profile hero + Share icon button), ProfileHeader, RoomCard, AppBar, AdaptiveNav, IconButton, Button, switch row. Same sample data as D2 (Tue 13 Oct 2026; 21 h this semester · 12-day streak). Every card on the page is a real PNG drawn with Canvas 2D in the browser; sizes shown are measured.

Tweaks: `format` (B chosen / A for review), `accent` (Violet / Blue), `webShare` (off = Download Image fallback), `displayName`, `batch`.

## Decisions
- **Format B · 1080 × 1080, last 20 weeks, chosen.** At 300 px chat-preview width (measured, *All states → Format A vs B*):
  | At 300 px | A · 1200 × 630 | B · 1080 × 1080 |
  |---|---|---|
  | Weeks | 53 | 20 |
  | One day (cell) | 4.3 px | 11.0 px |
  | Hours / streak numbers | 25 px | 43 px |
  | Smallest text (months, URL) | 6.5 px | 10.6 px |
  | Height in bubble | 158 px | 300 px |
  | PNG light / dark | ~92 / ~94 KB | ~90 / ~94 KB |
  1. B's cell is the size of a Profile graph cell, so single days read; A's year blurs into texture.
  2. A's smallest text is 6.5 px in the preview, smaller than anything the app shows.
  3. B fills the bubble and shows whole in WhatsApp, Instagram, Discord and LinkedIn chats; A gets half the area.
  4. 20 weeks hold a semester; most students share mid-semester, when a year view is mostly empty.
  Cost: no full year on the card. The year stays on Profile.
- **Card contents, top to bottom:** optional "Lena · AIN 7" line (off by default) → two figures: "21 h / this semester" and "12 / day streak" (Roboto 300, numbers are the hero) → last 20 weeks, months above, today outlined in on-surface, future days blank → app icon + "THD Room Finder" left, "thd-room-finder.vercel.app" right. No day labels, no legend, no room, no programme, no times.
- **Flat:** surface fill, five ramp colours, two text colours, one icon. No gradients, shadows or photos. PNG ≈ 90 KB (budget 150 KB).
- **Theme and accent:** the card follows the app theme (light/dark) and the student's focus accent. Violet uses the D2 ramp; other accents use the guideline formula (below).
- **Mostly empty is fine:** a new student's card keeps the full 20-week grid of empty cells with 3 filled days at the right edge; the figures carry it ("3 h · 3 day streak"; under an hour shows "40 min").
- **Share flow:** Profile → Share icon (D2) → ShareSheet: bottom sheet on phone, 440 px dialog on tablet/desktop. Title, live preview (the exact PNG), switches **Show my name** / **Show my batch** (both off every time), one privacy line, one main action.
  - **Share** → `navigator.share({ files: [png] })`. While the OS sheet is open the button reads "Opening Share…" (disabled). On success the sheet closes and a snackbar says "Focus graph shared". `AbortError` (user dismissed) returns to the sheet silently.
  - **No Web Share with files** (`navigator.canShare({files})` false): the action is **Download Image**, with one line "Sharing isn't available in this browser." Download saves `focus-graph.png` / `fokus-verlauf.png`, then snackbar "Image saved · …".
  - **No history:** Share stays hidden (as D2). One day of focus is enough to show it.
- **Names:** long display names shrink to 75 % and then end in "…"; they never move the figures. Name switch is hidden if no display name was set.

## New or changed tokens
The card reads existing tokens at draw time (`getComputedStyle` on a probe with `data-theme` + `data-accent`), so canvas never carries its own hex.

| Token | Light | Dark | Why |
|---|---|---|---|
| `--md-surface` | `#FDFCFF` | `#1C1B1F` | Card background |
| `--md-on-surface` | `#1C1B1F` | `#E6E1E5` | Figures, wordmark, today outline |
| `--md-on-surface-variant` | `#44464F` | `#C4C6D0` | Labels, months, URL |
| `--md-graph-0…4` (D2) | `#EFEEF5 … #4A2A91` | `#2B2930 … #D3C2FF` | Cells; unchanged |
| **Proposed** `[data-accent=<name>] --md-graph-1…4` | `color-mix(accent 25/50/75/100 %, surface)` | same formula on dark surface | Ramp for non-violet accents; violet keeps the tuned D2 hex (`d4-share-tokens.css`) |
| **Proposed** `--md-inverse-surface` / `--md-inverse-on-surface` | = on-surface / surface | = on-surface / surface | M3 snackbar; the system has no inverse pair yet |

## New or changed components
| Component | Props | States | Notes |
|---|---|---|---|
| `ShareCard` | `days`, `stats{semMin, streak}`, `theme`, `accent`, `name?`, `batch?`, `lang` → `toBlob(): Promise<Blob>` | full, new student, name/batch on, light/dark, EN/DE | Canvas 2D, 1080 × 1080. Metrics: padding 88 · figures 156 (unit 56) · labels 42 · months 38 · footer 38 · cells 39.5 / gap 6 / radius 16 %. Awaits `document.fonts.load` before drawing |
| `ShareSheet` | `card`, `canShare`, `onShare`, `onDownload`, `onClose` | preview, opt-ins on, sharing, download fallback, new student | Sheet (compact) / 440 px dialog (medium+). Rebuilds the PNG on every switch change |
| `Snackbar` | `message` | shared, saved | `role="status"`, 4 s, no action; above the bottom bar on phone |
| `FocusGraph` (D2) | `onShare` opens ShareSheet | — | Unchanged; Share hidden only with zero history |

## Copy (EN / DE)
| Key | EN | DE |
|---|---|---|
| title / share icon | Share focus graph | Fokus-Verlauf teilen |
| optName / optBatch | Show my name · Show my batch | Meinen Namen zeigen · Meinen Jahrgang zeigen |
| privacy | The image never shows rooms, times or your programme. | Räume, Uhrzeiten und dein Studiengang stehen nie im Bild. |
| main | Share · Opening Share… | Teilen · Teilen wird geöffnet … |
| fallback | Download Image · Sharing isn't available in this browser. | Bild herunterladen · Teilen ist in diesem Browser nicht verfügbar. |
| snackbar | Focus graph shared · Image saved · focus-graph.png | Fokus-Verlauf geteilt · Bild gespeichert · fokus-verlauf.png |
| card figures | 21 h / this semester · 12 / day streak | 21 Std. / in diesem Semester · 12 / Tage in Folge (1 → Tag in Folge) |
| card footer | THD Room Finder · thd-room-finder.vercel.app | same |
| alt | Focus graph image[ of Lena, AIN 7]: 21 hours this semester, 12-day streak. Grid of the last 20 weeks with focus on {d} days. THD Room Finder, thd-room-finder.vercel.app. | Bild des Fokus-Verlaufs[ von Lena, AIN 7]: 21 Stunden in diesem Semester, 12 Tage in Folge. Raster der letzten 20 Wochen mit Fokus an {d} Tagen. THD Room Finder, thd-room-finder.vercel.app. |

## Accessibility and motion
- Focus order in ShareSheet: title (initial focus) → Close → preview image (alt above) → Show my name → Show my batch → Share / Download Image. Escape or Close returns focus to the Share icon on Profile.
- Switches are `role="switch"` + `aria-checked`, ≥ 56 px rows; main button 48 px, full width.
- The alt describes the preview inside the app. Only the file is shared; the recipient's app handles its own alt text.
- Snackbar is `role="status"` (polite); focus does not move.
- Reduced motion: sheet/dialog appear without sliding; the preview swaps without a fade; snackbar appears without movement. Nothing loops.
- German checked: card labels fit their columns at 1080 px; sheet switches and fallback line wrap; phone sheet fits 380 × 780 without scrolling.

## Open questions
- **Card theme:** follows the app theme. Should the sheet offer a Light/Dark choice instead (a dark card in a light chat)? Kept out for minimalism.
- **Share text:** include "thd-room-finder.vercel.app" as `text` alongside the file? Some targets drop either the file or the text.
- **Accent list:** only Violet is defined in D2; Blue is a demo of the formula. Which accents are vetted, and does each need a hand-tuned ramp like violet?
- **"This semester" with the 20-week grid:** the grid starts in June (previous semester) while the figure counts from 1 Oct. Alternative: start the grid at the semester start (fewer, bigger weeks early on).
- **PNG size:** ~90 KB is under budget but most of it is anti-aliased rounded cells; square cells would roughly halve it if a target needs less.
- Review note: rendering many frames at once makes in-page screenshot tools slow (DOM capture of 15 frames + PNGs); the page itself renders normally.
