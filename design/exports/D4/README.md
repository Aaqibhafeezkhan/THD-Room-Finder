# D4 · Focus graph share card — export

| | |
|---|---|
| Session | D4 from [brief/03-sessions.md](../../brief/03-sessions.md), prompt [07](../../brief/07-d4-message.md) |
| Claude Design project | [THD Room Finder — Focus (Phase 1)](https://claude.ai/design/p/79245808-3482-40bf-a5f4-eb70ee8e78a5?file=D4+Share+Card.dc.html) |
| Imported | 2026-10-14 |
| Issue | [#21](https://github.com/arudaev/THD-Room-Finder/issues/21), [#38](https://github.com/arudaev/THD-Room-Finder/issues/38) |
| Status | **Approved**, including the link-sharing revision ([08](../../brief/08-d4-revision.md)), 2026-10-14 |

## Files

| File | What it is |
|---|---|
| [`D4 Share Card.dc.html`](D4%20Share%20Card.dc.html) | The deliverable: every card is a real PNG drawn on canvas; Format A vs B measured |
| [`HANDBACK-D4.md`](HANDBACK-D4.md) | Decisions, measurements, components, EN/DE copy, open questions |
| [`d4-share-tokens.css`](d4-share-tokens.css) | Hand-tuned Orchid and Graphite graph ramps (light and dark) and the inverse-surface pair for the snackbar |
| [`assets/icon.svg`](assets/icon.svg) | App icon used on the card |

`support.js` (same as [D1](../D1/support.js)) and `d2-graph-tokens.css`
(same as [D2](../D2/d2-graph-tokens.css)) are byte-identical and not
duplicated. The preview server's injected markup is stripped.

## Decisions

| Topic | Decision |
|---|---|
| Format | **B · 1080×1080** for the image, for the measured reasons in the handback |
| Card theme | Follows the app's light/dark theme. No choice in the sheet |
| Grid range | **The current semester**, first week on the left, matching "hours this semester". Future days are faint slots, so the card keeps its shape all semester. The revision draws 26 weeks from 1 Oct; production uses the real semester dates from config (Bavarian HAW calendar: winter 1 Oct – 14 Mar, summer 15 Mar – 30 Sep, to be confirmed against THD's calendar), so the column count is 24–30 (whole weeks, Monday to Monday) |
| What is shared | **A link, not only an image** (revision delivered: Share Link, Save Image, Copy Link fallback, chat preview mock-ups in both shapes, landing page). The link's social preview is the card; opening it leads into the app. The image stays as the secondary "Save image". Architecture: [ADR 0003](../../../docs/architecture/adr/0003-focus-graph-share-links.md) (proposed); the preview image format (1200×630 vs 1080×1080) is checked across chat apps before implementation |
| Accents | **Violet (default), Orchid, Graphite**, each with a hand-tuned ramp. The accent colours **only the focus graph and the share card**; the session surface, FocusPill, batch badges and map rings stay violet, because violet means "you and your batch" everywhere (and a Graphite session surface would look disabled). The setting is therefore labelled **Graph colour** |
| Save Image on phones | Opens the system share sheet with the PNG file (so it can go to Photos or a story); desktop downloads it |
| Share text | Answered by the link: the URL *is* the share |
| PNG size | ~90 KB is fine; no change |
