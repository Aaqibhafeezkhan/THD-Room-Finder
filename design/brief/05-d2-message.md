# D2 message — Profile tab and setup

Paste into the same chat of **THD Room Finder — Focus (Phase 1)** after D1.
Skills to attach: **Interactive prototype** and **Make tweakable**.

---

D1 is approved, thank you. Decisions on your open questions:

- **Join** starts *my own* Public session in that room. **End only ends my
  session**, never anyone else's: Phase 1 has no shared group. "AIN 7 ·
  2 studying" is a count of individual Public sessions and disappears when the
  last one ends. If the person I joined leaves, I keep going.
- Signed-out timers claim nothing; your copy is right.
- The check-in reminder comes ~10 min before the 60-min lease runs out, so
  "ends in 10 min" stays. An expired session counts minutes up to the last
  check-in or app visit.
- Planned end is not editable in Phase 1.
- German: "6h / 2h 10m" in compact UI, "6 Std." in sentences.
- The list bucket label ("Belegt (Fokus)" or not) is decided in D3.
- Start focus stays the standard full-width pill; we compare a larger hero
  variant in D3.

Now **D2 — Profile tab and setup** (`brief/03-sessions.md`). Keep D1's file
untouched and build a new page, `D2 Profile.dc.html`, with the same views
(Prototype · All states · Theme × language · Components) and the same tweak
style. Reuse D1's components; don't redesign them.

**Navigation** becomes Campus · Rooms · **Profile** (Saved moves inside it).

**Profile, top to bottom** (sections from the spec, Profile tab table):

1. **Study profile:** programme (e.g. AIN = Artificial Intelligence, English;
   KI = Künstliche Intelligenz, German; they are different batches), intake
   term → shown as "AIN 7" (semesters go up to 9), display name (optional,
   only shown when a Public session has *Show my name* on), default sharing
   mode (Private default). Make the wording say that the batch is
   self-declared and exactly what others see in each mode.
2. **Focus graph:** reserve the slot with a simple stand-in (this week's
   minutes, streak, total, a Share button). D4 designs the real graph and the
   share card.
3. **Saved rooms:** today's Saved list with live status, unchanged behaviour,
   new home. Include its empty state.
4. **Appearance:** theme (system/light/dark), language (EN/DE, the D1
   SegmentedControl), **personal focus accent** as a few vetted swatches (the
   meanings of free/soon/claimed/lecture never change; show a live preview of
   the FocusSurface and FocusPill in the chosen accent), and the **quiet
   preference** ("Treat my batch's sessions as claimed", for people who want
   to be alone).
5. **Account:** sign in with an email code, export focus history (JSON),
   import, sign out, delete profile (explain it ends any session and removes
   identity; history on the device stays unless they clear it).

**States to draw:**

- Profile **signed out** (works without an account: Saved rooms, Appearance
  and the local focus graph still work) and **signed in**.
- **Setup sheet** (bottom sheet on phone, dialog on desktop), opened from
  D1's "Set Up Study Profile" and from switching to Public without a profile:
  email → code → programme → intake → optional display name → summary of
  what others see. Include errors (wrong code, expired code) and the
  "programme not listed" path.
- **Delete profile** confirmation.
- **Loading** states for Profile *and* for D1's room detail (D1 left this
  out), plus **offline** for Profile.
- A **medium (tablet)** layout this time, not just phone and desktop.

Same rules as D1: phone + tablet + desktop, light + dark, EN + DE with German
checked for overflow, tokens only (propose new ones explicitly), icon + words
with every colour, focus order and screen-reader labels noted, reduced motion
for transitions. Fake sample data only.

When D2 is done, write `HANDBACK-D2.md` in the format of
`brief/04-handback.md`.

---

After D2, hand the files back to Claude Code ([04 · Handback](04-handback.md)).
