# D3 message — list and map signals

Start a **new chat** in *THD Room Finder — Focus (Phase 1)*. Attach
**Interactive prototype** and **Make tweakable**, and paste:

---

We are designing **D3 — list and map signals** for THD Room Finder Phase 1
(focus sessions). Read `readme.md`, `brief/02-focus-layer.md`,
`brief/03-sessions.md`, `guidelines/focus-ordering.html` and
`guidelines/focus-map-signal.html`. Look at `D1 Room Detail.dc.html` and
`D2 Profile v2.dc.html` in this project; both are approved. Reuse their
components and look; don't redesign them. Ignore `D2 Profile.dc.html`
(rejected).

Context from D1 and D2: Private is the default and shows to everyone as an
anonymous *claim* (dark purple). Public shows your batch (e.g. AIN 7) a
violet invitation; everyone else still sees a claim. Join starts your own
Public session; End only ends yours. The schedule always wins: a lecture is
never hidden or recoloured by focus activity. Navigation is Campus · Rooms ·
Profile.

Build a new page, `D3 Signals.dc.html`, with the same views as D1 and D2
(Prototype · All states · Theme × language · Components) and the same tweak
style.

## 1 · Rooms list

Rooms are grouped into four buckets, longest-free first inside each:

1. **Free**: no activity, *or* your batch is studying there publicly (violet
   "AIN 7 · 2 studying" badge on the RoomCard)
2. **Closing soon** (free ≤ 40 min, amber)
3. **Claimed by a focus session** (private, or another batch's public
   session): the overline and duration take the claimed colour, with a
   "Focus session · 40 min" label. A claim is not a booking
4. **Lecture** (red), soonest free first

- Keep the duration as the hero of each card, as today. Add as little as
  possible: one badge or one label, icon + words, never colour alone.
- Bucket headers are quiet. Settle the German label for bucket 3
  ("Belegt (Fokus)" or "Fokus-Session").
- The **quiet preference** (Settings → "Treat my batch's sessions as
  claimed") moves batch rooms into bucket 3. Show that state.
- **Time travel** (picking a future time) shows the schedule only, no focus
  signals. Show that state.
- **Activity unknown** (presence offline): schedule order and one line,
  "Focus activity unknown", never "empty".
- Saved rooms on Profile use the same RoomCard, so they get the same signals.

## 2 · Campus map

Buildings keep the teal availability tint. Compare two options side by side
and **choose one, with reasons**:

- **A · Ring:** a violet ring + count on buildings where your batch studies
  publicly.
- **B · Fill:** a full violet fill for such buildings, only when no room
  there has a lecture.

Claims show as a small dark-purple dot with a count. Lecture occupancy is
never recoloured. Add a **legend** and a **list equivalent** for every map
signal (tapping a building opens its room list with the same signals), for
screen readers and colour-blind users.

## 3 · States and rules

Show: no focus activity anywhere; your batch in one room; your batch in
several buildings; claims only; mixed; quiet preference on; time travel;
activity unknown; loading; your own session running (FocusPill in the app
bar, your room marked as yours). Phone, tablet and desktop (list-detail);
light and dark; English and German with German checked for overflow. Tokens
only (propose new ones explicitly); icon + words with every colour; focus
order and screen-reader labels noted; reduced motion. Fake sample data only.

Keep it simple and minimal, like D2. If something feels busy, remove it
rather than shrinking it.

When D3 is done, write `HANDBACK-D3.md` in the format of
`brief/04-handback.md`.

---

After D3, hand the files back to Claude Code ([04 · Handback](04-handback.md)).
