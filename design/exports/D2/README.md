# D2 · Profile tab, focus graph and settings — export

| | |
|---|---|
| Session | D2 (redo) from [brief/03-sessions.md](../../brief/03-sessions.md), prompt [05](../../brief/05-d2-message.md) |
| Claude Design project | [THD Room Finder — Focus (Phase 1)](https://claude.ai/design/p/79245808-3482-40bf-a5f4-eb70ee8e78a5?file=D2+Profile+v2.dc.html) |
| Imported | 2026-10-14 |
| Issue | [#21](https://github.com/arudaev/THD-Room-Finder/issues/21) |
| Status | **Approved** by the maintainer (phone, tablet and desktop) |
| Replaces | [D2-draft](../D2-draft/README.md) (rejected) |

## Files

| File | What it is |
|---|---|
| [`D2 Profile v2.dc.html`](D2%20Profile%20v2.dc.html) | The deliverable: Prototype · All states · Theme × language · Components |
| [`HANDBACK-D2.md`](HANDBACK-D2.md) | Decisions, components, tokens, EN/DE copy, accessibility, open questions |
| [`d2-graph-tokens.css`](d2-graph-tokens.css) | Proposed `--md-graph-0…4` ramp, light and dark, with contrast |

The page loads `support.js`, which is byte-identical to
[D1's](../D1/support.js) and not duplicated. The preview server's injected
style is stripped; nothing else is changed.

## Answers to the handback's open questions

| Question | Decision |
|---|---|
| "this semester" in the stats line | Keep it. The sample's 21 h is fine |
| Does the graph follow the chosen focus accent? | **Yes.** The graph is *your* focus, so it uses your accent. Every accent swatch must ship a five-step ramp for light and dark, with the same contrast pattern as the violet one |
| Other accents (teal etc.) | No. Teal, amber, red and claimed purple carry meaning (free, soon, lecture, claimed) and never change. Only the focus accent is personal ([spec](../../../docs/product/focus-sessions.md#colour-semantics)) |
| D1 says "4-day streak", D2 says 12 | Align to 12 when the components are ported |
| Programme "Other" | Private only until the programme is added to the taxonomy ([#40](https://github.com/arudaev/THD-Room-Finder/issues/40)); a Public batch needs a listed programme |
| "AIN 7" updates each semester | Yes, derived from the intake term automatically ([batches](../../../docs/product/focus-sessions.md#batches)) |
| Screen-reader table only in prototype frames | Fine for the specimen; the component always renders it |
| Saved-room focus signals | D3 |

## Follow-ups

- **Share card size is decided in D4, after the graph.** A full year is
  53 columns × 7 rows, which suits a wide 1200×630 card; ~20 weeks suits a
  square 1080×1080. D4 compares both with this graph.
- Promote `--md-graph-*` and the components into `design/system/` when #21's
  components are ported.
