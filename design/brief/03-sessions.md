# 03 · Design sessions

One deliverable per session. Each session runs in the Claude Design project
*THD Room Finder — Focus (Phase 1)* and ends with an export plus a handback
note ([04](04-handback.md)).

| Session | Goal | Inputs | Deliverables | Done when |
|---|---|---|---|---|
| **D1 · Room detail and focus surface** | Start, run and end a session from room detail | `02-focus-layer.md` states; `components/app/StatusCard`, `Button` | Room detail in all states (free, batch here, claimed, lecture, active Private, active Public, check-in, ended, signed out); `FocusSurface`, `SegmentedControl`, `ActivityRow`, `FocusPill` specs | Phone + desktop, light + dark, EN + DE; maintainer approved |
| **D2 · Profile tab and setup** | Replace Saved with a minimal Profile; first-share setup | `01-product.md` terms; `AdaptiveNav`; Saved screen in `ui_kits/room-finder`; `guidelines/focus-graph.html` | Profile = header + `FocusGraph` (GitHub-style calendar) + saved rooms; Settings screen; setup sheet; graph ramp tokens | Profile has three sections and nothing else; graph reads as a contribution calendar at a glance |
| **D3 · List and map signals** | Make batch activity catch the eye without hiding lectures | `guidelines/focus-ordering.html`, `focus-map-signal.html`; `RoomCard`, `CampusMap` | List with all four buckets; map with batch ring vs. full violet fill compared; legend; list equivalents | One map option chosen and justified |
| **D4 · Share card** | Make consistency shareable | `guidelines/focus-graph.html`; D2's `FocusGraph` | Share card in light and dark, **1200×630 and square 1080×1080 compared** with the real graph; empty state; share flow | One format chosen; card readable as a small chat preview |

**Status:**

| Session | State | Export | Message |
|---|---|---|---|
| D1 | Approved | [D1](../exports/D1/README.md) | [00](00-first-message.md) |
| D2 | Approved (first draft [rejected](../exports/D2-draft/README.md)) | [D2](../exports/D2/README.md) | [05](05-d2-message.md) |
| D3 | Approved | [D3](../exports/D3/README.md) | [06](06-d3-message.md) |
| D4 | Next | — | [07](07-d4-message.md) |

The focus graph moved from D4 into D2; D4 is the share card only.

**Order:** D1 first (it defines the focus surface every other session reuses),
then D2 and D3 in either order, then D4.

## Per-screen checklist

- [ ] Compact (phone, 360–412 px), medium (tablet) and expanded (desktop)
- [ ] Light and dark
- [ ] English and German, with German checked for overflow
- [ ] Only system tokens; new tokens proposed explicitly
- [ ] Empty, loading, offline and "activity unknown" states
- [ ] Focus order and screen-reader labels noted
- [ ] Reduced motion considered for timers and transitions

## Later briefs (not now)

Phase 2: group sessions, handles and display names, organization tags.
Phase 3: city layer, yellow zones, event and museum cards.
