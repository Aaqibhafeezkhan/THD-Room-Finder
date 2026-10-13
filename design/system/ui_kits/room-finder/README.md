# Room Finder — Full App UI Kit

An interactive, click-through recreation of the THD Room Finder mobile app
(Android / iOS share the same flows), now including the 2.5D **Campus Map**.
Composes the design-system primitives from `_ds_bundle.js`.

## Files
- `index.html` — interactive entry. Boots into the home screen and wires the
  four views (home · map · list · detail).
- `screens.jsx` — `HomeScreen`, `MapScreen`, `RoomListScreen`, `RoomDetailScreen`.
- `android-frame.jsx` — M3 device bezel (starter component).

Room + campus data is shared (not copied) with the `campus-room-finder`
template: `components/app/CampusMap/campus-data.js` + `context-data.js` and
`templates/campus-room-finder/rooms-data.js`. Rooms are generated from each
building's live `{free,total}` so the map tint, building counts, and room lists
always agree.

## Flow
1. **Home** — the big availability count (rooms free now across all buildings),
   with two actions: **Find a Free Room** (all-buildings list) and **Browse
   Campus Map**.
2. **Campus Map** — the 2.5D `CampusMap` tinted by availability, with a
   light/dark theme toggle and legend. Tap a building → a summary sheet → **View
   Rooms**.
3. **Free Rooms** — building filter chips, a summary card, and the room-card
   list. Each card shows building · floor · seats and a free/all-day badge.
4. **Room detail** — free/occupied status banner, an info table (seats,
   facilities, contact), and the full day's schedule with the active event
   highlighted in red.

## Components used
`AppBar` · `RoomCard` · `StatusCard` · `CampusMap` · `Chip` · `Button` ·
`IconButton`.

> A faithful recreation of the existing app on the standardized Material 3
> system. New feature ideas live in the project README's "Where this could go"
> note.
