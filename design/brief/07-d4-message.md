# D4 message — share card

Two steps.

**1 · Small fix in the existing D3 chat** (it still has the context):

---

D3 is approved with one change. On the campus map, the "AIN 7 · 2" pills
are too loud when several buildings have them (scenarios 13–16): they crowd
small phones and desktop and make buildings hard to tap. Passive state:
the violet ring and the claim dot only, no text. Tapping a building shows its
label and opens its room list as today. The building list and the legend
keep the words. Also apply your suggested German lines: D1's claim line
"Eine Fokus-Session ist keine Buchung – du kannst hier trotzdem lernen." and
D2's quiet setting "Sessions meines Jahrgangs wie fremde anzeigen". Update
`D3 Signals.dc.html` and `HANDBACK-D3.md` in place.

---

**2 · D4 in a new chat.** Attach **Interactive prototype** and **Make
tweakable**, and paste:

---

We are designing **D4 — the focus-graph share card** for THD Room Finder
Phase 1. Read `readme.md`, `brief/02-focus-layer.md`, `brief/03-sessions.md`
and `guidelines/focus-graph.html`. Look at `D2 Profile v2.dc.html` (approved):
its `FocusGraph`, the `--md-graph-0…4` ramp in `d2-graph-tokens.css` and the
Share button on Profile are the starting point. Reuse them; don't redesign
the graph. Ignore `D2 Profile.dc.html` (rejected).

Build `D4 Share Card.dc.html` with the same views as D1–D3 (Prototype · All
states · Theme × language · Components) and the same tweak style.

## 1 · The card

An image a student sends to friends in WhatsApp, Instagram, Discord or
LinkedIn to show their consistency. It must read like a GitHub contribution
graph screenshot at chat-preview size (about 300 px wide).

- **Contents:** the graph, one stats line (hours this semester · streak),
  a small THD Room Finder wordmark and the app URL. **Nothing personal by
  default:** no name, no room, no programme.
- **Opt-in extras** (switches in the share sheet, off by default): display
  name, batch ("AIN 7").
- Uses the student's focus accent and its graph ramp; light and dark
  versions.
- Flat and simple: it is drawn with `<canvas>` on the device and must be a
  PNG of at most 150 KB. No photos, no heavy gradients, no tiny text.

## 2 · Compare two formats, then choose one

- **A · 1200×630** (wide): room for the full year, 53 weeks.
- **B · 1080×1080** (square): about 20 weeks or the current semester, with
  bigger cells. Square images show whole in WhatsApp, Instagram, Discord and
  LinkedIn chats.

Show both with the same data, at full size and at ~300 px chat-preview size,
in light and dark. **Choose one, with reasons.** Readability at preview size
decides.

## 3 · Share flow

Profile → Share (D2's icon button) → a share sheet (bottom sheet on phone,
dialog on desktop) with a live preview of the card, the two opt-in switches
and one main action, **Share**, which opens the system share sheet (Web
Share API). Where sharing is not supported, the action becomes **Download
image**. Show: preview, sharing, shared (brief confirmation), download
fallback, and a new student with only a few days of focus (the card must
still look good when mostly empty). Share stays hidden with no history at
all, as in D2.

## 4 · Rules

Phone, tablet and desktop for the sheet; light and dark; English and German
with German checked for overflow (the card text too). Tokens only (propose
new ones explicitly); the preview has an alt text that says what the image
shows; focus order and screen-reader labels noted; reduced motion. Fake
sample data only. Keep it simple and minimal.

When D4 is done, write `HANDBACK-D4.md` in the format of
`brief/04-handback.md`.

---

After D4, hand the files back to Claude Code ([04 · Handback](04-handback.md)).
