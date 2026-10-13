# 02 · Focus layer

## Colour semantics

| Meaning | Token | Light role / container | Dark role / container |
|---|---|---|---|
| Free | `--md-tertiary` | `#00796B` / `#B2DFDB` | `#80CBC4` / `#004F49` |
| Closing soon (≤ 40 min) | `--md-warning` | `#9A6700` / `#FFDF9E` | `#F4C05A` / `#6E4E00` |
| Lecture / occupied | `--md-error` | `#B3261E` / `#F9DEDC` | `#F2B8B5` / `#8C1D18` |
| **You & your batch** | `--md-focus` | `#6A4BA8` / `#EBE0FF` | `#D0BCFF` / `#4F378B` |
| **Claimed by someone else** | `--md-claimed` | `#4E4060` / `#E6E0EC` | `#CFC0DC` / `#43384F` |
| City events (reserved for Phase 3) | `--md-event` | `#6B5E00` / `#F7E886` | `#DCCB5C` / `#504600` |
| Structure and actions | `--md-primary` | `#1565C0` / `#D3E4FF` | `#90CAF9` / `#00458D` |

### Contrast (WCAG 2.x)

| Pair | Light | Dark |
|---|---|---|
| Focus role / on-focus | 6.59 : 1 | 7.71 : 1 |
| Focus container / on-container | 11.77 : 1 | 7.23 : 1 |
| Focus role on surface | 6.45 : 1 | 10.05 : 1 |
| Claimed role / on-claimed | 9.43 : 1 | 7.85 : 1 |
| Claimed container / on-container | 12.40 : 1 | 8.62 : 1 |
| Claimed role on surface | 9.23 : 1 | 9.97 : 1 |
| Event role / on-event | 6.51 : 1 | 7.95 : 1 |
| Event container / on-container | 13.75 : 1 | 7.60 : 1 |

Surface = `#FDFCFF` light, `#1C1B1F` dark. For comparison, the existing
amber "closing soon" text reaches 4.76 : 1 on the light surface.

## States to design

| Where | State | Content |
|---|---|---|
| Room detail | Free, no activity | Status card + **Start focus** (filled primary) |
| | Free, your batch is here | + violet row "AIN 7 · 2 studying" + **Join focus** |
| | Claimed by someone else | + dark-purple row "Focus session · started 40 min ago"; Start still possible |
| | Lecture now | Red status; no focus action |
| | Your session · Private | Violet focus surface: timer, planned end, **Private \| Public** (Private on), End |
| | Your session · Public | Same, Public on, "AIN 7 sees you"; optional "show my name" |
| | Check-in | "Still focusing in E 212?" with Keep going / End |
| | Ended / expired | Summary: minutes added to the focus graph |
| | Signed out | Start runs a local timer; gentle prompt to set up a study profile for sharing |
| Compact active control | Any screen while a session runs | Small violet pill with timer; tap opens room detail |
| Room list | Batch badge, claimed bucket | See `guidelines/focus-ordering.html` |
| Campus map | Batch ring + count, claim dot | See `guidelines/focus-map-signal.html` |
| Profile tab | Signed out / signed in | Study profile, focus graph, saved rooms, appearance |
| Setup | First share | Programme, intake → "AIN 7", display name (optional), default Private, plain explanation of what others see |
| Share card | Image | 1200×630, graph + streak + totals, nothing personal by default |

Facility tags on room detail (Beamer, Whiteboard, EDV…) collapse into one
summary line so Start focus stays above the fold on a phone.

## Components to add or extend

| Component | New / extended | Notes |
|---|---|---|
| `FocusButton` | New, or a `Button` variant | Primary for Start, tonal for Join |
| `FocusSurface` | New | Violet container with timer, planned end, mode toggle, End |
| `SegmentedControl` | New core component | Private / Public; generic so the language toggle can reuse it |
| `ActivityRow` | New | Batch (violet) and claim (dark purple) rows under the status card |
| `RoomCard` | Extended | `focus?: {kind: 'batch' \| 'claimed', label}`; claimed tints the hero |
| `CampusMap` | Extended | `focusSignals` per building: `{batchCount, claimCount}` |
| `FocusPill` | New | Compact active control in the app bar or nav |
| `FocusGraph` | New | 20-week grid, violet ramp, accessible table fallback |
| `ShareCard` | New | Render target for the image |
| `AdaptiveNav` | Extended | Third destination becomes Profile |

## Rules that never bend

1. **The schedule wins.** Lectures stay red. No focus signal makes an occupied
   room look free, and a claim never hides a room.
2. **Private by default**, with plain-language consequences.
3. **Colour never stands alone.** Every signal has a label and an icon.
4. **A claim is not a booking.** Copy never says "reserved" or "booked".
5. **Tokens only.** No literal hex values in components.
6. **Shadows, not borders**; 16 px cards, pill buttons, Roboto and Roboto Mono
   for times and room codes.
7. **EN/DE everywhere**; German runs about 30 % longer, so no fixed label
   widths.
8. **Every map signal has a list equivalent** for screen readers and
   colour-blind users.
