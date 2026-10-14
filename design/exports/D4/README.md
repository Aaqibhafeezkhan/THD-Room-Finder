# D4 · Focus graph share card — export

| | |
|---|---|
| Session | D4 from [brief/03-sessions.md](../../brief/03-sessions.md), prompt [07](../../brief/07-d4-message.md) |
| Claude Design project | [THD Room Finder — Focus (Phase 1)](https://claude.ai/design/p/79245808-3482-40bf-a5f4-eb70ee8e78a5?file=D4+Share+Card.dc.html) |
| Imported | 2026-10-14 |
| Issue | [#21](https://github.com/arudaev/THD-Room-Finder/issues/21), [#38](https://github.com/arudaev/THD-Room-Finder/issues/38) |
| Status | **Approved, with a revision for sharing as a link** ([08 · D4 revision](../../brief/08-d4-revision.md)) |

## Files

| File | What it is |
|---|---|
| [`D4 Share Card.dc.html`](D4%20Share%20Card.dc.html) | The deliverable: every card is a real PNG drawn on canvas; Format A vs B measured |
| [`HANDBACK-D4.md`](HANDBACK-D4.md) | Decisions, measurements, components, EN/DE copy, open questions |
| [`d4-share-tokens.css`](d4-share-tokens.css) | Proposed accent ramp formula and inverse-surface pair for the snackbar |
| [`assets/icon.svg`](assets/icon.svg) | App icon used on the card |

`support.js` (same as [D1](../D1/support.js)) and `d2-graph-tokens.css`
(same as [D2](../D2/d2-graph-tokens.css)) are byte-identical and not
duplicated. The preview server's injected markup is stripped.

## Decisions

| Topic | Decision |
|---|---|
| Format | **B · 1080×1080** for the image, for the measured reasons in the handback |
| Card theme | Follows the app's light/dark theme. No choice in the sheet |
| Grid range | **Starts at the first week of the current semester**, matching "hours this semester". Future days of the semester are blank slots, so the card keeps its shape all semester |
| What is shared | **A link, not only an image.** The link's social preview is the card; opening it leads into the app. The image stays as the secondary "Save image". Architecture: [ADR 0003](../../../docs/architecture/adr/0003-focus-graph-share-links.md) (proposed); the preview image format (1200×630 vs 1080×1080) is checked across chat apps before implementation |
| Accents | Not settled yet. Proposal for the revision: Violet (default) plus two hand-tuned ramps, Orchid and Graphite. No blue (it is the action colour), no teal, amber, red or claimed purple (they carry meaning) |
| Share text | Answered by the link: the URL *is* the share |
| PNG size | ~90 KB is fine; no change |
