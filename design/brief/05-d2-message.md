# D2 message — Profile tab and focus graph (redo)

The first D2 draft was rejected ([why](../exports/D2-draft/README.md)).
Start a **new chat** in *THD Room Finder — Focus (Phase 1)* so the old
direction does not carry over. Attach **Interactive prototype** and **Make
tweakable**, add a screenshot of a GitHub contribution graph as a reference,
and paste:

---

We are redoing **D2 — Profile tab** for THD Room Finder Phase 1 (focus
sessions). Read `readme.md`, `brief/02-focus-layer.md`,
`guidelines/focus-graph.html`, and look at `D1 Room Detail.dc.html` in this
project, which is approved. Reuse D1's components and look; don't redesign
them.

**Ignore `D2 Profile.dc.html`.** It was rejected: the profile was a crowded
settings form, and the focus graph was a one-week bar strip. Build a new
page, `D2 Profile v2.dc.html`, with the same views as D1 (Prototype · All
states · Theme × language · Components) and the same tweak style.

Decisions already made in D1, for context: Private is the default; Join
starts your own Public session and End only ends yours; signed-out timers
claim nothing; navigation is Campus · Rooms · **Profile** (Saved moves into
Profile).

## 1 · The focus graph is the hero

THD is a technical university: most students are engineers and know the
**GitHub / GitLab contribution graph** by heart. Make exactly that, so it is
recognisable from a screenshot (see the attached reference):

- **Square cells** with small rounded corners, a small even gap.
- **7 rows, Monday to Sunday**, top to bottom; day labels Mon · Wed · Fri on
  the left. **One column per week**; month labels above.
- **The rightmost column is the current week.** Today has a visible outline;
  days after today in the current week are empty slots, not cells.
- **Five levels.** No focus = near-white (`--md-surface-variant`-like, barely
  there). Then faint violet → stronger → strong → the darkest, most saturated
  violet. *More focus = darker* in light mode; in dark mode the empty cell is
  a dark surface and more focus = brighter. Thresholds: 0 · < 30 · < 90 ·
  < 180 · 180+ min. "Less ▢▢▢▢▢ More" legend under it.
- Phone shows about 20 weeks, scrolled so the current week is at the right
  edge; tablet and desktop show the full year.
- One quiet stats line: "64 h this semester · 12-day streak". A **Share**
  icon button (share card itself comes in D4).
- Hover/tap a cell: "Tue 13 Oct · 1 h 25 min". Screen readers get a table
  equivalent.
- Propose the five ramp colours as tokens (`--md-graph-0` … `--md-graph-4`,
  light and dark) with contrast noted against the card surface.

## 2 · Profile is three things, nothing else

1. **Header, one line:** avatar initial, display name, "AIN 7" chip, gear
   icon (→ Settings).
2. **Focus graph** card (above).
3. **Saved rooms** with live status, as today. Include its empty state.

No settings rows, no segmented controls, no privacy explanations on this
screen. Lots of air.

**Signed out:** the same screen. The header becomes "Not signed in" with a
single "Set Up Study Profile" text button. The graph still works (it is local)
and Saved rooms still work.

## 3 · Settings (separate screen, behind the gear)

A plain grouped list, Material 3 list rows, one line each:

- **Study profile:** programme, intake (shown as "AIN 7"), display name.
- **Sharing:** default mode (Private). The one place that explains what others
  see, in two short lines.
- **Appearance:** theme, language, focus accent, quiet preference ("Treat my
  batch's sessions as claimed").
- **Account:** export / import focus history, sign out, delete profile.

## 4 · Setup sheet

Bottom sheet on phone, dialog on desktop, opened from "Set Up Study Profile"
or from switching to Public without a profile: email → code → programme →
intake → optional display name → **one** summary of what others see. Keep
each step to one question. Draw the wrong/expired code and "programme not
listed" states.

## 5 · States and rules

Profile signed out, signed in, empty graph (new user), loading, offline;
Settings; setup steps; delete confirmation; plus D1's room-detail loading
state, which D1 left out. Phone, tablet and desktop; light
and dark; English and German with German checked for overflow. Tokens only;
icon + words with every colour; focus order and screen-reader labels noted;
reduced motion. Fake sample data only.

Keep it simple and minimal. If a screen feels busy, remove things rather than
shrinking them.

When D2 is done, write `HANDBACK-D2.md` in the format of
`brief/04-handback.md`.

---

After D2, hand the files back to Claude Code ([04 · Handback](04-handback.md)).
