# D1 · Room detail and focus surface — export

| | |
|---|---|
| Session | D1 from [brief/03-sessions.md](../../brief/03-sessions.md) |
| Claude Design project | [THD Room Finder — Focus (Phase 1)](https://claude.ai/design/p/79245808-3482-40bf-a5f4-eb70ee8e78a5?file=D1+Room+Detail.dc.html) |
| Imported | 2026-10-13 |
| Issue | [#21](https://github.com/arudaev/THD-Room-Finder/issues/21) |
| Status | **Approved** by the maintainer, with the decisions below |

## Files

| File | What it is |
|---|---|
| [`D1 Room Detail.dc.html`](D1%20Room%20Detail.dc.html) | The deliverable: Prototype · All states · Theme × language · Components |
| [`support.js`](support.js) | Claude Design runtime the page loads |
| [`HANDBACK.md`](HANDBACK.md) | The session's handback note (decisions, components, EN/DE copy, open questions) |

The files are kept as delivered, with one exception: the preview server's
`data-omelette-injected` script is stripped from the HTML. The page imports
the design system from `_ds/…`; that folder is not copied here because
[`design/system/`](../../system/) already mirrors it. To view the page, open
it in Claude Design.

## Answers to the handback's open questions

| Question | Decision | Source |
|---|---|---|
| Does **Join** start a Public session? | Yes. Join starts *your own* session, Public, in that room | [focus sessions spec](../../../docs/product/focus-sessions.md#room-detail) |
| Does **ending** a Public session you joined end it for everyone? | **No. End only ever ends your own session.** Phase 1 has no shared group object: "AIN 7 · 2 studying" counts individual Public sessions in the room and disappears when the last one ends. Real groups that outlive any one member are Phase 2 ([#23](https://github.com/arudaev/THD-Room-Finder/issues/23)) | [joining and ending](../../../docs/product/focus-sessions.md#joining-and-ending) |
| Signed-out sessions claim the room? | No. A signed-out timer publishes nothing; the copy is right | [ADR 0002 §1](../../../docs/architecture/adr/0002-focus-session-lifecycle.md) |
| Check-in timeout | The reminder fires about 10 min before the 60-min lease runs out, so "ends in 10 min" is right. An expired session counts minutes **up to the last check-in or app visit**, not up to the expiry | [ADR 0002 §2](../../../docs/architecture/adr/0002-focus-session-lifecycle.md) |
| Planned end editable? | Not in Phase 1. Shown only; End early is the control | Spec |
| German durations | Keep "6h / 2h 10m" in compact UI (matches RoomCard); full words ("6 Std.") in sentences | Maintainer default |
| "Belegt (Fokus)" vs. "Fokus-Session" | The list bucket label is decided in D3; the claim row keeps "Fokus-Session" | D3 |
| Tablet layout | Expanded list-detail with the rail is accepted for D1; D2 draws medium explicitly | D2 |

## Follow-ups

- **Start focus size.** It stays the standard filled pill, full width on the
  phone. A larger "hero" variant (56 px, title-medium) can be compared in D3
  next to the list, where it competes for attention.
- **Not designed yet:** the loading state and the Profile tab. Both are in D2.
- **Proposed token** `--md-focus-state-layer` is promoted when the components
  are ported (handback step 3), not now.
