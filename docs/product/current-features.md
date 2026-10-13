# Current features (v2.2)

What ships today on [thd-room-finder.vercel.app](https://thd-room-finder.vercel.app/)
and in the Android APK. Phase 1 additions are specified in
[focus sessions](focus-sessions.md) and are **not** live yet.

| Area | Feature | Notes |
|---|---|---|
| Campus (`/`) | 2.5D SVG map of the Deggendorf campus; buildings tinted by free-room share; amenity badges (Mensa, cafés, library) | Covers the main campus; some off-campus rooms are list-only |
| Rooms (`/rooms`) | Free-room count, list ranked longest-free first, building / capacity / type filters, search by code, name or equipment (bilingual) | Three states: free, closing soon (≤ 40 min), occupied |
| Time travel | Pick any date and time; plan ahead when the campus is closed | Uses the same ranking |
| Room detail (`/room/:ident`) | Status card with duration, capacity, facilities, contact, the day's schedule, save | |
| Saved (`/saved`) | Starred rooms with live status | Becomes part of the Profile tab in Phase 1 |
| Appearance | Adaptive navigation (bottom bar, rail, drawer), light/dark/system theme, live EN/DE | Room codes are never translated |
| Delivery | Installable PWA with cached shell and last data; Android APK via Capacitor | Cached data is not live occupancy |

## What "free" means

A room counts only if it hosts teaching at least once in the current Monday to
Friday week, and it is not on the excluded-venue list (sports halls, outdoor
areas, meeting rooms). "Free" means *no scheduled event in THabella*. It does
not guarantee the door is unlocked or that nobody is inside. That is exactly
the gap focus sessions fill.
