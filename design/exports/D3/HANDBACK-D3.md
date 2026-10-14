# D3 · List and map signals — handback

Export: `D3 Signals.dc.html` (views: Prototype · All states · Theme × language · Components) + `campus-data.js`, `context-lite.js`.
Reuses D1/D2 unchanged: AppBar, AdaptiveNav (Campus · Rooms · Profile), StatusCard, Button, Chip, IconButton, ActivityRow, FocusPill. RoomCard and CampusMap are extended (below).
Scenario: Tue 13 Oct 2026, 10:00, batch AIN 7; time travel = Thu 15 Oct, 14:00. Sample data is fake and deterministic. `context-lite.js` is the template's surroundings minus paths and trees, so 20+ maps can render on one specimen page; production keeps the full context.

## Decisions
- **Four buckets, quiet headers.** Free (incl. your batch) → Closing soon (≤ 40 min) → Claimed → Lecture. Longest free first inside each; Lecture is soonest-free first. Headers are 13 px on-surface-variant, "Free · 6" (tweak `showCounts` drops the count). Empty buckets are not shown.
- **One addition per card, at most.** The duration stays the hero. Batch: violet badge "AIN 7 · 2 studying" with group icon. Claim: overline + duration turn `--status-claimed`, plus "Focus session · 40 min" with person icon. The badge sits on its own line under the meta, so German never squeezes the duration.
- **A claim is not a booking.** Claimed rooms keep their real free duration ("4h"); copy never says reserved/booked. Another batch's public session shows as a claim.
- **German bucket 3 = "Fokus-Session"**, overline "Fokus". Not "Belegt (Fokus)": "belegt" is already the lecture overline (busy) and implies a booking.
- **Quiet preference on:** batch rooms move to Claimed and read "Focus session · 20 min"; one line under the header explains why: "AIN 7 sessions show as claimed (Settings)." On the map they become dots, not rings.
- **Time travel:** custom-time chip "Thu 15 Oct · 14:00 ✕" + "Schedule only. Focus activity shows for now." Three buckets, no badges; the map drops all focus marks and the legend says "Schedule only". Desktop detail hides Start focus.
- **Activity unknown:** schedule order and three buckets, one line "Focus activity unknown" (never "empty"). Desktop detail shows the D1 neutral activity row. Map legend says the same.
- **Loading:** static skeleton cards (no shimmer) + visually hidden "Checking rooms…".
- **Your own session:** FocusPill in the app bar (phone) or list header (tablet/desktop), as in D1. Your room gets a filled-violet badge "Your session · 24:10" (filled = you; container = your batch) and stays in Free. Map: ring; "You" pill only when tapped.
- **Saved rooms (Profile)** use the same card, in the user's own order (no buckets), so they carry the same badges.
- **Map: option A · Ring, chosen.** Teal availability tint untouched. **Passive map has no text:** your batch = violet roof outline, claims = small dark-purple dot. **Tapped building:** the blue selection outline replaces the violet ring, a pill "AIN 7 · 2" (or "You") sits just under the building letter (roof centroid) and is drawn last so no other mark covers it, the claim dot moves beside the pill and shows its count, and the building's room list opens under a compact map (phone 220 px, tablet 360 px; desktop keeps the full map). Passive dots sit on the roof's top corner so they never cover the building letter. Pills on every batch building crowded small phones and desktop and blocked taps (review of 13–16), so the words moved to the building list and legend. Reasons against B · Fill:
  1. The roof tint is the only at-a-glance availability cue; a violet roof hides how many rooms are free.
  2. B only applies when no room has a lecture, so the same batch looks different in two buildings (see Lecture halls: HS 2 batch, HS 1 lecture → ring anyway). One mark should mean one thing.
  3. Violet vs teal fill is a hue-only difference, the weakest case for colour-blind users; A's outline is a shape cue, and the words sit in the list, legend and tapped-building pill.
  4. B gets louder as the map gets larger (desktop), which works against "the schedule wins".
  Tweak `mapOption` renders B everywhere for review.
- **List equivalent:** under the map (phone/tablet) or beside it (desktop) a Buildings list shows every mark as words: "Rohde & Schwarz Forum · 4 of 20 rooms free · AIN 7 · 2 studying · 1 focus session". Batch/own buildings first, then most free rooms. Tapping a row or a roof opens that building's rooms with the same buckets and badges; desktop keeps the map and outlines the building in blue.
- **Legend** on the map, bottom-left: Free rooms · AIN 7 studying · Focus session. Swatches mirror the marks exactly.

## New or changed tokens
No new colour tokens. Everything uses existing roles:

| Use | Token | Light | Dark | Why |
|---|---|---|---|---|
| Claimed overline + duration | `--status-claimed` (= `--md-claimed`) | `#4E4060` | `#CFC0DC` | Existing alias; 9.23 / 9.97 : 1 on surface |
| Batch badge | `--md-focus-container` / `--md-on-focus-container` | `#EBE0FF` / — | `#4F378B` / — | 11.77 / 7.23 : 1 |
| Own-session badge, map ring + pill | `--md-focus` / `--md-on-focus` | `#6A4BA8` | `#D0BCFF` | 6.59 / 7.71 : 1 |
| Claim badge, map dot | `--md-claimed(-container)` / on- | | | 12.40 / 8.62 : 1 |

Proposed for CampusMap's `theme` (so the map stops carrying its own hex): `focus.ring → --md-focus`, `focus.pill → --md-focus / --md-on-focus`, `claim.dot → --md-claimed / --md-on-claimed`, `halo → --md-surface` (the 1.5 px gap around pill and dot).

## New or changed components
| Component | Props | States | Notes |
|---|---|---|---|
| `RoomCard` (extended) | `status: free \| soon \| claimed \| occupied`, `focus?: {kind: batch \| claimed \| own, label}`, `overline` | free, free + batch, free + own, closing, claimed, lecture, selected (desktop) | One badge max. Overline labels become props (today hardcoded English). aria-label: "E 212, Building E · 60 seats, free for 6h. AIN 7 · 2 studying." |
| `RoomBuckets` | `rooms`, `live`, `quiet`, `showCounts` | 4 buckets, 3 (time travel / unknown), loading | Each bucket a labelled `section` with an `h2` ("Claimed, 3 rooms") |
| `ListNotice` | `kind: quiet \| time \| unknown` | — | One icon + text line; unknown is `role="status"` |
| `CampusMap` (extended) | `focusSignals: Record<key, {batchLabel?, claimCount?}>`, `focusStyle: 'ring'`, `selectedKey` | passive (ring + dot, no text), selected (pill + dot count), time travel / unknown (no marks) | Map is `aria-hidden`; the building list is the accessible equivalent. Marks are drawn above the roof and never change the tint. Prototype draws them as an overlay on the existing SVG |
| `MapLegend` | `items{swatch,label}[]` | live, schedule only, unknown | Wraps in DE |
| `BuildingRow` | `building`, `signals{batch?, own?, claims?}`, `onOpen` | plain, with badges | Button ≥ 64 px |
| `FocusPill` (D1) | unchanged | — | Phone app bar; tablet/desktop list header |

## Copy (EN / DE)
| Key | EN | DE |
|---|---|---|
| buckets | Free · Closing soon · Claimed · Lecture | Frei · Schließt bald · Fokus-Session · Vorlesung |
| overline | free · closing · claimed · busy | frei · schließt · Fokus · belegt |
| batchBadge | AIN 7 · 2 studying | AIN 7 · 2 lernen hier / AIN 7 · 1 lernt hier |
| claimBadge | Focus session · 40 min | Fokus-Session · 40 Min. |
| ownBadge | Your session · 24:10 | Deine Session · 24:10 |
| listTitle / sub | Free now · Tue 13 Oct · 10:00 · longest free first | Jetzt frei · Di 13. Okt. · 10:00 · am längsten frei zuerst |
| quietNote | AIN 7 sessions show as claimed (Settings). | Sessions von AIN 7 erscheinen als Fokus-Session (Einstellungen). |
| timeChip / timeNote | Thu 15 Oct · 14:00 ✕ · Schedule only. Focus activity shows for now. | Do 15. Okt. · 14:00 ✕ · Nur Belegung. Fokus-Aktivität gibt es nur für jetzt. |
| unknown | Focus activity unknown | Fokus-Aktivität unbekannt |
| loading | Checking rooms… | Räume werden geprüft … |
| buildings / ofFree | Buildings · 4 of 20 rooms free | Gebäude · 4 von 20 Räumen frei |
| claimsN | 1 focus session / 2 focus sessions | 1 Fokus-Session / 2 Fokus-Sessions |
| legend | Free rooms · AIN 7 studying · Focus session · Schedule only | Freie Räume · AIN 7 lernt hier · Fokus-Session · Nur Belegung |
| map pill (tapped building only) | AIN 7 · 2 / You | AIN 7 · 2 / Du |
| quiet setting (D2, DE changed) | Treat my batch's sessions as claimed | Sessions meines Jahrgangs wie fremde anzeigen |
| claimSub (D1 + D3, DE changed) | A claim is not a booking, so you can still focus here. | Eine Fokus-Session ist keine Buchung – du kannst hier trotzdem lernen. |

## Accessibility and motion
- Focus order, Rooms: list header → FocusPill (if running) → notice → cards bucket by bucket → nav. Desktop: list, then detail (activity row → Join / Start focus).
- Focus order, Campus: map is skipped (`aria-hidden`); building rows in list order → nav. Desktop: building list comes before the map pane.
- Every colour has icon + words: batch (group icon + "AIN 7 · 2 studying"), claim (person icon + "Focus session · 40 min"), own (timer icon + "Your session"). On the map the passive ring and dot are shape cues only; their words are in the legend, the building list and the tapped-building pill.
- Reduced motion: no animation on badges or map marks; skeletons are static; FocusPill updates once a minute instead of every second.
- German checked on phone in every state: badges wrap to their own line, bucket headers and notices wrap, nothing truncates.

## Applied after second review
- **Map at rest:** batch buildings show only the violet ring. Claims are not shown at rest. No text, no count.
- **Tapped building:** pill "AIN 7 · 2" (or "You") and the claim dot with its count; its room list opens.
- **Focus labels** switch (Off by default) in the gear menu next to Theme, Language and Map amenities. Phone: app bar; tablet/desktop: top-right of the map. On: every building with activity shows its pill and counted dot (states 23–25). The A/B comparison renders with it On.
- DE: "Fokus-Beschriftung" · An / Aus · "Aus: nur Ringe; Gebäude antippen für die Anzahl."

## Applied after review
- Passive map: ring + dot, no text; label on tap (above).
- D1 claimSub (DE) → "Eine Fokus-Session ist keine Buchung – du kannst hier trotzdem lernen." (`D1 Room Detail.dc.html`, `HANDBACK.md`).
- D2 quiet setting (DE) → "Sessions meines Jahrgangs wie fremde anzeigen" (`D2 Profile v2.dc.html`, `HANDBACK-D2.md`).

## Open questions
- **Closing soon + claimed:** which bucket? Proposed: Claimed, with the duration staying amber. No sample room hits this yet.
- **Own session on the map:** "You" + ring. If you are Public with your batch in the same room, show "You · AIN 7 · 2"?
- **Time travel free counts** in the building list use today's numbers in the sample; production should use the picked time's schedule.
- **Accent swatch:** if a student picks a non-violet focus accent (D2), ring/pill/badge follow `--md-focus`; claims stay dark purple.
