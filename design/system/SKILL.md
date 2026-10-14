---
name: thd-room-finder-design
description: Use this skill to generate well-branded interfaces and assets for THD Room Finder (Technische Hochschule Deggendorf's free-study-room finder), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, then `brief/README.md` (the Phase 1 design brief and the sessions to run), and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference
- **Design language:** Material 3 (Material You), light-first with full dark theme.
- **Brand color:** THD blue `#1565C0`. **Status:** teal `#00796B` = free, amber `#9A6700` = closing soon, red `#B3261E` = occupied. **Pink `#D81B60` is the iOS-sponsor CTA only.**
- **Focus layer (Phase 1):** violet `--md-focus` = you & your batch; dark purple `--md-claimed` = someone else's focus session (anonymous, never a booking); ochre `--md-event` reserved for Phase 3. Start focus is primary blue; an active session is violet with a Private | Public toggle, Private by default. Never recolour lectures. Focus graph ramp `--md-graph-0…4`; the graph colour (Violet / Orchid / Graphite, `data-accent`) recolours only the graph and share card.
- **Type:** Roboto (300 display / 400 body / 500 titles+labels) + Roboto Mono for times/codes.
- **Shape:** 16px cards, 28px pill buttons, 8px chips. **Shadows, not borders.** No gradients, no imagery, flat color fields.
- **Voice:** plain, student-first, short. "Find a room, then focus in it." Browsing never needs an account.
- **Icons:** inline Feather/Lucide-style line icons, stroke-width ~2, `currentColor`.

## Files
- `styles.css` — link this one file to get all tokens + fonts.
- `tokens/` — colors, typography, spacing, elevation, fonts.
- `components/` — React primitives (Button, Chip, Badge, Card, IconButton, LanguageToggle, SegmentedControl, Switch, Sheet, ConfirmDialog, Snackbar, Skeleton, Logo, AppBar, RoomCard, StatusCard, AdaptiveNav, CampusMap) and the focus layer in `components/focus/` (ActivityRow, FocusSurface, FocusPill, FocusGraph, ShareCard, …). See each `.prompt.md`. Reuse these for focus screens instead of redrawing them.
- `brief/` — Phase 1 product context, focus-layer spec, design sessions D1–D4 and handback rules.
- `ui_kits/room-finder/` — interactive mobile app recreation.
- `ui_kits/website/` — marketing landing page recreation.
- `guidelines/` — foundation specimen cards.
- `assets/logo/` — app icon and brand mark.

When mounting components from the compiled bundle, read them off the global namespace
(`window.THDRoomFinderDesignSystem_de229b`) after loading `_ds_bundle.js`.
