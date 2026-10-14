# D3 · List and map signals — export

| | |
|---|---|
| Session | D3 from [brief/03-sessions.md](../../brief/03-sessions.md), prompt [06](../../brief/06-d3-message.md) |
| Claude Design project | [THD Room Finder — Focus (Phase 1)](https://claude.ai/design/p/79245808-3482-40bf-a5f4-eb70ee8e78a5?file=D3+Signals.dc.html) |
| Imported | 2026-10-14 |
| Issue | [#21](https://github.com/arudaev/THD-Room-Finder/issues/21) |
| Status | **Approved with one change:** map labels appear on tap only (below) |

## Files

| File | What it is |
|---|---|
| [`D3 Signals.dc.html`](D3%20Signals.dc.html) | The deliverable: Prototype · All states · Theme × language · Components |
| [`HANDBACK-D3.md`](HANDBACK-D3.md) | Decisions, map option reasoning, components, EN/DE copy, open questions |
| [`campus-data.js`](campus-data.js) | Sample building and room data for the specimen |
| [`context-lite.js`](context-lite.js) | Campus surroundings without paths and trees, so 20+ maps fit on one page. Production keeps the full context |

`support.js` is byte-identical to [D1's](../D1/support.js) and not duplicated.

## Maintainer review

- **List, all states, theme × language:** approved as delivered.
- **Map option A · Ring:** approved, for the reasons in the handback.
- **Change: map labels on tap only.** In scenarios 13–16 the "AIN 7 · 2"
  pills on several buildings are too loud and crowd small phones and even
  desktop, and they make buildings hard to tap. Passive state: the violet
  ring and the claim dot only, no text. Tapping a building shows its label
  (and opens its room list as today). The building list and legend keep the
  words for screen readers. A selected building with its label is also what
  a student would screenshot to show friends where they are.

## Answers to the handback's open questions

| Question | Decision |
|---|---|
| Closing soon **and** claimed | Claimed bucket, duration stays amber |
| D1 German claim line | Use "Eine Fokus-Session ist keine Buchung – du kannst hier trotzdem lernen." ("belegt" stays reserved for lectures) |
| D2 German quiet setting | "Sessions meines Jahrgangs wie fremde anzeigen" / EN "Show my batch's sessions like anyone else's" |
| Own Public session with your batch on the map | Ring + "You"; the full "You · AIN 7 · 2" label only when the building is tapped |
| Pill collisions | Solved by labels-on-tap; no clustering needed |
| Time-travel free counts | Production uses the picked time's schedule |
| Non-violet focus accent | Ring, pill and badge follow `--md-focus`; claims stay dark purple |
