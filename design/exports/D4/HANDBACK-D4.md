# D4 · Focus graph share card — handback (round 2: share a link)

Export: `D4 Share Card.dc.html` (views: Prototype · All states · Theme × language · Components) + `d2-graph-tokens.css`, `d4-share-tokens.css`, `assets/icon.svg`.
Reuses D2 unchanged: FocusGraph (Profile hero + Share icon button), ProfileHeader, RoomCard, AppBar, AdaptiveNav, IconButton, Button, switch row. Same sample data as D2 (today Tue 13 Oct 2026, week 3 of the semester; 21 h this semester · 12-day streak). Every card on the page is a real PNG drawn with Canvas 2D; sizes are measured.

Tweaks: `accent` (Violet / Orchid / Graphite), `webShare` (off = Copy Link fallback), `displayName`, `batch`.

## Decisions
- **Approved in round 1:** format B · 1080 × 1080 is the card (readability at 300 px decided it). The card follows the app theme; there is no theme choice in the sheet.
- **Share a link, not only an image.** The student shares a link to THD Room Finder; the chat app shows the card as the link's preview; the friend taps and lands on a one-screen page. The link carries the graph (no server storage; engineering detail).
- **Semester grid.** The grid starts on the Monday of the week of 1 Oct (Mon 28 Sep) and always shows 26 weeks, so it matches "this semester". Days still to come are empty slots (outlined in `--md-graph-0`), so the card keeps one shape all semester. Cells are as large as the width allows: (1080 − 2 × 64) / 26 → 30.8 px at full size, 8.6 px at 300 px. Months are labelled on the week whose Thursday starts the month.
- **Two preview shapes, same drawing.** B 1080 × 1080 and A 1200 × 630 (same 26 weeks; A's cells are height-limited, 31.5 px). Engineering tests which shape each chat app shows large and ships that as `og:image`. Mock-ups for both, light and dark: messenger style (as in WhatsApp) and embed style (as in Discord), drawn schematically with our tokens, not copies of those apps.
- **Share sheet:** live preview, Show my name / Show my batch (off each time), privacy line, **Share Link** (main) and **Save Image** (text action).
  - Share Link → `navigator.share({ url })`. While open: "Opening Share…" (disabled). Success → sheet closes, snackbar "Link shared". `AbortError` → back to the sheet.
  - No `navigator.share` → main action becomes **Copy Link** (`navigator.clipboard.writeText`), snackbar "Link copied".
  - Save Image → saves the B PNG (`focus-graph.png`), snackbar "Image saved · focus-graph.png".
  - No history → Share hidden (as D2).
- **Landing page** (friend's browser, phone / tablet / desktop): the card, the two figures as real text, one line "Focus sessions in free rooms at THD" (h1), one action **Open THD Room Finder**. No sign-in, no app bar, nothing else. Name · batch appear above the figures only if the student opted in. Language follows the friend's browser.
- **Accents:** Violet (default, D2 ramp), Orchid and Graphite, each hand-tuned in light and dark. No blue (action), teal, amber, red or claimed purple. The Blue demo and the color-mix formula are gone.

## New or changed tokens
| Token | Light | Dark | Why |
|---|---|---|---|
| `--md-graph-0…4` · violet (D2, default) | `#EFEEF5 #D8CCF6 #AE95E8 #7E5BCC #4A2A91` | `#2B2930 #3D2D6E #5B3FAD #9479E6 #D3C2FF` | Unchanged |
| **Proposed** `[data-accent=orchid] --md-graph-1…4` | `#F1CBE7 #DE92CB #B24FA0 #7E1F6E` | `#4F2346 #7B3A70 #BE68AE #F3BCE6` | Accent ramp; contrast vs surface L 1.42 · 2.26 · 4.55 · 8.90, D 1.36 · 2.19 · 4.72 · 10.72 |
| **Proposed** `[data-accent=graphite] --md-graph-1…4` | `#D6D7DC #A3A5AE #6C6E78 #303239` | `#3F4047 #5D5F68 #9799A3 #E2E3E8` | Accent ramp; L 1.41 · 2.40 · 4.96 · 12.52, D 1.66 · 2.69 · 6.04 · 13.37 |
| `--md-graph-0` (shared) | `#EFEEF5` | `#2B2930` | Empty cells and outlines of days to come, every accent |
| **Proposed** `--md-inverse-surface` / `--md-inverse-on-surface` | = on-surface / surface | = on-surface / surface | M3 snackbar (kept from round 1) |

Card text uses `--md-surface`, `--md-on-surface`, `--md-on-surface-variant`, read at draw time; canvas carries no hex of its own. Put `data-accent` on the same element as `data-theme`.

## New or changed components
| Component | Props | States | Notes |
|---|---|---|---|
| `ShareCard` (changed) | `days`, `semesterStart`, `stats{semMin, streak}`, `format: square \| wide`, `theme`, `accent`, `name?`, `batch?`, `lang` → `toBlob()` | week 3, week 20, new student, name/batch on, 3 accents, light/dark, EN/DE | 26-week semester grid; future = empty slots. B: padding 64 · figures 156 · labels 42 · months 38 · footer 38 |
| `ShareSheet` (changed) | `link`, `canShare`, `onShare`, `onCopy`, `onSave`, `onClose` | preview, opt-ins on, sharing, Copy Link fallback, new student | Main: Share Link / Copy Link. Text action: Save Image |
| `LinkPreview` (new, metadata) | `og:title`, `og:description`, `og:image` (A or B), `og:image:alt`, `og:locale` | wide, square × light/dark | Title is prefixed with name · batch only when opted in |
| `LandingPage` (new, web) | `card`, `lang`, `onOpen` | default, name + batch, new student × phone/tablet/desktop | Card + figures + h1 + one button |
| `Snackbar` | `message` | Link shared, Link copied, Image saved | `role="status"`, 4 s |
| `FocusGraph` (D2) | `onShare` | — | Unchanged; ramp follows the accent |

## Copy (EN / DE)
| Key | EN | DE |
|---|---|---|
| sheet title | Share focus graph | Fokus-Verlauf teilen |
| switches | Show my name · Show my batch | Meinen Namen zeigen · Meinen Jahrgang zeigen |
| privacy | Anyone with the link sees this card. It never shows rooms, times or your programme. | Alle mit dem Link sehen diese Karte. Sie zeigt nie Räume, Uhrzeiten oder deinen Studiengang. |
| main | Share Link · Opening Share… | Link teilen · Teilen wird geöffnet … |
| fallback | Copy Link | Link kopieren |
| secondary | Save Image | Bild speichern |
| snackbar | Link shared · Link copied · Image saved · focus-graph.png | Link geteilt · Link kopiert · Bild gespeichert · fokus-verlauf.png |
| og:title / og:description | Focus graph · THD Room Finder / 21 h this semester · 12-day streak | Fokus-Verlauf · THD Room Finder / 21 Std. in diesem Semester · 12 Tage in Folge |
| landing | Focus sessions in free rooms at THD · Open THD Room Finder | Fokus-Sessions in freien Räumen der THD · THD Room Finder öffnen |
| card figures | 21 h / this semester · 12 / day streak | 21 Std. / in diesem Semester · 12 / Tage in Folge |
| alt | Focus graph image[ of Lena, AIN 7]: 21 hours this semester, 12-day streak. Grid of the 26 weeks of this semester, now in week 3, with focus on {d} days. THD Room Finder, thd-room-finder.vercel.app. | Bild des Fokus-Verlaufs[ von Lena, AIN 7]: 21 Stunden in diesem Semester, 12 Tage in Folge. Raster der 26 Wochen dieses Semesters, jetzt Woche 3, mit Fokus an {d} Tagen. THD Room Finder, thd-room-finder.vercel.app. |

## Accessibility and motion
- ShareSheet focus order: title (initial focus) → Close → preview (alt) → Show my name → Show my batch → Share Link / Copy Link → Save Image. Escape or Close returns focus to the Share icon on Profile.
- Switches `role="switch"` + `aria-checked`, 56 px rows; both buttons 48 px, full width.
- Landing focus order: card (alt) → figures (text) → h1 → Open THD Room Finder. The alt is also sent as `og:image:alt`.
- Snackbar `role="status"` (polite); focus does not move.
- Reduced motion: sheet/dialog appear without sliding; preview swaps without a fade; nothing loops.
- German checked: card labels and "Okt" fit; sheet labels, privacy line and landing line wrap; nothing clips at 380 px.

## Open questions
- **Preview shape:** engineering to test which of 1200 × 630 and 1080 × 1080 WhatsApp, Discord, Instagram and LinkedIn show large; both are drawn and ready.
- **Summer semester:** the grid assumes 26 weeks from the week of 1 Oct; confirm the summer start (15 Mar?) and length.
- **Save Image on phones:** a plain download is awkward on iOS/Android. Use `navigator.share({ files })` there so the image can go to Photos or a story?
- **Accent beyond the graph:** Orchid/Graphite change the ramp only. Should they also recolour `--md-focus` (session surface, batch badge)? Graphite as a focus surface would read as disabled.
