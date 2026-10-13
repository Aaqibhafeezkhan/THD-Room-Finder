# D2 · Profile tab, focus graph and settings — handback

Export: `D2 Profile v2.dc.html` (views: Prototype · All states · Theme × language · Components) + `d2-graph-tokens.css`.
Replaces the rejected `D2 Profile.dc.html`. D1 components reused unchanged (AppBar, AdaptiveNav, RoomCard, Button, IconButton, Chip, check-in sheet pattern).
Scenario: Tue 13 Oct 2026, 10:00; winter semester counted from 1 Oct. Sample data is fake and deterministic.

## Decisions
- **Profile rule:** only things a student checks almost daily. Today that is the focus graph and saved rooms. Settings, privacy copy and segmented controls are not on Profile.
- **Profile = three blocks:** one-line header (avatar initial · name · violet "AIN 7" chip with group icon · gear), focus graph card, saved rooms. Signed out: same screen, header reads "Not signed in" + one text button **Set Up Study Profile**; graph (local) and saved rooms still work. The gear stays, so theme/language are reachable signed out.
- **Focus graph = contribution graph.** Square cells, 2 px radius, even 3 px gap (2 px on tablet). 7 rows Mon→Sun, labels Mon · Wed · Fri, one column per week, month labels above. Current week is the rightmost column; today has a 1.5 px on-surface outline; days after today are empty slots with no cell.
- **Range:** phone renders the full 53 weeks at 11 px cells and opens scrolled to the right edge (~20 weeks visible, swipe back for the rest; done with `direction: rtl` on the scroller so no JS is needed). Day labels are sticky. Tablet and desktop show the whole year with fluid cells. Tweak `phoneRange = 19 weeks` shows only the last 19 weeks, which fit the 380 px card with no scroll.
- **Five levels:** 0 · < 30 · < 90 · < 180 · 180+ min. Light: empty is near-white, more focus = darker. Dark: empty is a dark surface, more focus = brighter. Legend "Less ▢▢▢▢▢ More" bottom right; tweak `showThresholds` adds the minute bands.
- **Stats:** one quiet line, "21 h this semester · 12-day streak" (worked out from the sample data, see open questions), plus a Share icon button. Share is hidden when there is no history. The share card is D4.
- **Hover / tap a cell:** a tooltip reads "Tue 13 Oct · 1 h 25 min" or "No focus". It sits below the cell for Mon–Wed and above it for Thu–Sun, and is clamped to the card.
- **New user:** an all-empty graph with today still outlined; the stats line becomes "No focus yet. Start a session in any free room."; no Share.
- **Saved rooms:** the existing RoomCard with live status (free / soon / occupied). On desktop they flow into a grid. Empty state: bookmark icon, "No saved rooms yet", one line on how to save.
- **Loading:** header and graph are local, so they render at once; only saved-room status shows static skeleton rows (no shimmer). **Offline:** cached status plus one line "Offline · status from 09:55. It may have changed."
- **Settings** (behind the gear): a plain grouped M3 list, one row per setting, ≥ 56 px. Groups: Study profile (Programme, Intake "AIN 7", Display name) · Sharing (Default mode: Private, then the only explanation on the page, in two lines: Private / Public) · Appearance (Theme, Language, Focus accent with a swatch + name, the quiet-preference switch) · Account (Export, Import, Sign out, Delete profile in error colour + trash icon + words). Signed out: Study profile is a single "Set Up Study Profile" row, Public says "needs a study profile", and there is no quiet switch, sign out or delete.
- **Setup:** bottom sheet on phone, 480 px dialog on tablet/desktop, one question per step, "Step n of 6". Steps: email → 6-digit code → programme (search + radio list) → intake (radio, trailing "AIN 7") → optional display name (Skip / Next) → what others see (Private · default → "Focus session" claimed chip; Public · AIN 7 → "AIN 7 student" focus chip). Opened from Set Up Study Profile, or from Public without a profile (D1 FocusSurface).
- **Errors:** wrong code (red boxes + "That code doesn't match. 2 tries left." + Resend Code); expired (greyed digits + message, main action becomes Send New Code); programme not listed (neutral result block; main action Choose Other, tonal; text action Report Missing).
- **Delete:** centred alertdialog on every size; Cancel (text) and Delete (filled error). The focus graph stays on the device.
- **D1 room-detail loading:** AppBar "E 212", skeleton status card, a skeleton where Start sits, "Loading schedule from THabella…", and skeleton schedule rows. **Start focus is hidden until status loads**, because a lecture means no focus action. Desktop keeps the loaded list pane.

## New or changed tokens
Proposed in `d2-graph-tokens.css` (not yet in `tokens/colors.css`). Contrast is against the card surface (`#FDFCFF` / `#1C1B1F`).

| Token | Light | Dark | Why |
|---|---|---|---|
| `--md-graph-0` | `#EFEEF5` · 1.13 | `#2B2930` · 1.19 | No focus. Barely there, like the empty cell in a contribution graph |
| `--md-graph-1` | `#D8CCF6` · 1.48 | `#3D2D6E` · 1.47 | < 30 min |
| `--md-graph-2` | `#AE95E8` · 2.49 | `#5B3FAD` · 2.25 | < 90 min |
| `--md-graph-3` | `#7E5BCC` · 4.83 | `#9479E6` · 5.01 | < 180 min |
| `--md-graph-4` | `#4A2A91` · 10.11 | `#D3C2FF` · 10.55 | 180+ min, the darkest / brightest violet |

Neighbouring levels differ by 1.2–2.2 : 1. Levels 0–2 are under 3 : 1 on purpose, to keep the contribution-graph look. The value is never shown by colour alone: tooltip, legend and a screen-reader table all carry it. These tokens replace the `color-mix` ramp in `guidelines/focus-graph.html`.

## New or changed components
| Component | Props | States | Notes |
|---|---|---|---|
| `FocusGraph` | `days{date,minutes}[]`, `today`, `weeks`, `stats`, `onShare?` | full, empty (new user), phone scrolled / 20-week | Grid `aria-hidden`, not tabbable; the card region's label carries the stats; a visually hidden table (rows = weeks, newest first; columns Mon–Sun; minutes) follows. No animation |
| `ProfileHeader` | `name?`, `batch?`, `signedIn`, `onSetup`, `onSettings` | signed in, signed out | Focus order: name → batch chip → Set Up → gear. DE text button wraps under the label |
| `SettingsList` | `groups{title, rows}[]`, row `kind: nav \| switch \| danger \| note`, `value?` | signed in, signed out | Rows are buttons; switch `role="switch"` + `aria-checked`; values wrap, never truncate |
| `SetupSheet` | `step`, `error?: wrongCode \| expired \| notListed`, `onDone` | 6 steps + 3 errors | Sheet (compact) / dialog (medium+). Focus goes to the step title on each step; errors are `role="alert"`; 150 ms slide, none under reduced motion |
| `ConfirmDialog` | `title`, `body`, `confirmLabel`, `tone: 'danger'` | open | `role="alertdialog"`; initial focus on Cancel |
| `Skeleton` | — | profile saved rooms, room detail | Static blocks, `aria-busy` + visually hidden `role="status"` |
| `AdaptiveNav` (usage) | — | — | Campus · Rooms · Profile; rail on medium |

## Copy (EN / DE)
| Key | EN | DE |
|---|---|---|
| notSignedIn | Not signed in | Nicht angemeldet |
| setup | Set Up Study Profile | Studienprofil einrichten |
| stats | {h} this semester · {n}-day streak | {h} in diesem Semester · {n} Tage in Folge |
| emptyStats | No focus yet. Start a session in any free room. | Noch kein Fokus. Starte eine Session in einem freien Raum. |
| cellTip | Tue 13 Oct · 1 h 25 min / No focus | Di 13. Okt. · 1 Std. 25 Min. / Kein Fokus |
| legend | Less · More | Weniger · Mehr |
| share | Share focus graph | Fokus-Verlauf teilen |
| saved | Saved rooms | Gespeicherte Räume |
| savedEmpty | No saved rooms yet · Tap the bookmark on any room to see its live status here. | Noch keine gespeicherten Räume · Tippe bei einem Raum auf das Lesezeichen, um hier seinen Live-Status zu sehen. |
| offline | Offline · status from 09:55. It may have changed. | Offline · Stand 09:55. Der Status kann sich geändert haben. |
| settings groups | Study profile · Sharing · Appearance · Account | Studienprofil · Teilen · Darstellung · Konto |
| rows | Programme · Intake · Display name · Default mode · Theme · Language · Focus accent | Studiengang · Jahrgang · Anzeigename · Standardmodus · Design · Sprache · Fokusfarbe |
| notePriv / notePub | Private: others see that someone is focusing here, not who. / Public: AIN 7 sees you and can join. | Privat: Andere sehen, dass hier jemand lernt – aber nicht wer. / Öffentlich: AIN 7 sieht dich und kann beitreten. |
| quiet | Treat my batch's sessions as claimed | Sessions meines Jahrgangs als belegt anzeigen |
| account | Export / Import focus history · Sign out · Delete profile | Fokus-Verlauf exportieren / importieren · Abmelden · Profil löschen |
| stepOf | Step {n} of 6 | Schritt {n} von 6 |
| email | What's your THD email? · We send you a 6-digit code. No password. · Send Code | Wie lautet deine THD-E-Mail? · Wir schicken dir einen 6-stelligen Code. Kein Passwort. · Code senden |
| code | Enter the code · Resend Code | Code eingeben · Code erneut senden |
| codeWrong | That code doesn't match. 2 tries left. | Der Code stimmt nicht. Noch 2 Versuche. |
| codeExpired | This code has expired. Send a new one. · Send New Code | Der Code ist abgelaufen. Fordere einen neuen an. · Neuen Code senden |
| programme | What do you study? | Was studierst du? |
| notListed | No programme matches "…" · Choose Other to continue. Focus sessions still work; sharing with a batch needs a listed programme. | Kein Studiengang passt zu „…" · Wähle „Anderer", um weiterzumachen. Fokus-Sessions funktionieren trotzdem; Teilen mit dem Jahrgang braucht einen gelisteten Studiengang. |
| intake | When did you start? | Wann hast du angefangen? |
| name | What should your batch call you? · Optional. Only shown in a Public session when you turn on "Show my name". | Wie soll dein Jahrgang dich nennen? · Optional. Nur in einer öffentlichen Session sichtbar, wenn du „Meinen Namen zeigen" einschaltest. |
| summary | This is what others see · Private · default → Focus session · Public · AIN 7 → AIN 7 student | Das sehen andere · Privat · Standard → Fokus-Session · Öffentlich · AIN 7 → Studi aus AIN 7 |
| delete | Delete study profile? · Your profile and any public session are removed. Your focus graph stays on this device. · Cancel / Delete | Studienprofil löschen? · Dein Profil und laufende öffentliche Sessions werden entfernt. Dein Fokus-Verlauf bleibt auf diesem Gerät. · Abbrechen / Löschen |
| roomLoading | Loading schedule from THabella… | Belegung wird aus THabella geladen … |

## Accessibility and motion
- Focus order on Profile: header (name, chip, Set Up, gear) → graph card (Share) → saved rooms in list order → nav. Settings: back → rows top to bottom. Sheets trap focus; Close is last in tab order after the main action.
- Screen readers: the batch chip reads "Batch AIN 7"; the graph region label includes the stats; the table gives every day's minutes. Loading regions are `aria-busy` and announce "Loading E 212…" / "Checking room status…".
- Reduced motion: no loops (static skeletons); sheet/dialog appear without sliding; the tooltip is instant.
- Hit targets are ≥ 44 px (icon buttons, text buttons, radio and settings rows).

## Open questions
- **Stats sample:** the brief's "64 h this semester" needs about 5 h a day if the semester starts on 1 Oct. The prototype works the line out from the sample data (21 h · 12-day streak). Is "semester" right, or should it be "this year" / "last 30 days"?
- **Focus accent vs. graph:** the ramp is violet-only. If a student picks another accent (Settings), should the graph ramp follow (5 tokens × accent × theme) or stay violet?
- **D1 summary copy** says "4-day streak", but D2 sample data has 12. Align the samples before export.
- **Programme "Other":** can such users share Public at all, or are they Private-only until the programme is added? The copy assumes Private-only.
- **Intake label:** "AIN 7" is worked out from the intake semester and goes up each semester. Confirm it should update automatically.
- The **screen-reader table** is drawn only in the interactive prototype frames (to keep the specimen page light); the component always renders it.
- **Saved-room focus signals** (batch badge, claimed bucket) are left to D3; RoomCard is unchanged here.
