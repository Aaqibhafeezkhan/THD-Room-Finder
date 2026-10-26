# Current features (v2.6)

What ships today on [thd-room-finder.vercel.app](https://thd-room-finder.vercel.app/)
and in the Android app. Release notes: [GitHub releases](https://github.com/arudaev/THD-Room-Finder/releases).

| Area | Feature | Notes |
|---|---|---|
| Campus (`/`) | 2.5D SVG map of the Deggendorf campus; buildings tinted by free-room share; amenity badges with Mensa, café and library hours | Covers the main campus; some off-campus rooms are list-only |
| Rooms (`/rooms`) | Free-room count, list ranked longest-free first, building / capacity / type filters, search by code, name or equipment (bilingual) | Three states: free, closing soon (≤ 40 min), lecture |
| Time travel | Pick any date and time; plan ahead when the campus is closed | Uses the same ranking |
| Room detail (`/room/:ident`) | Status card with duration, capacity, facilities, contact, the day's schedule, save, Start focus | |
| Focus sessions | Rhythms of blocks and breaks (Pomodoro, Deep, Lecture, Open, custom); each block is confirmed; Android notification with countdown | A lecture always wins: the session ends before it ([spec](focus-sessions.md)) |
| Focus (`/focus`) | Start focus at home (up to 3 h, only on the device, nobody sees it); any running session, at home or in a room; today's minutes and streak | [Focus at home](focus-at-home.md), [ADR 0011](../architecture/adr/0011-focus-at-home.md) |
| Session sounds | A sound when a break starts, when it's over (one reminder 5 min later) and when you're done; Coffee break, Jingle, Chimes, phone default or silent, per place; mute a session | Android plays them from the notification with the phone locked ([ADR 0012](../architecture/adr/0012-session-sounds.md)) |
| Study profile | Email code sign-in, programme and intake from the [THD programme list](../../shared/programmes.json), batch label such as *AIN 7* | Optional; without it focus stays on the device |
| Private and Public | Private claims the room anonymously; Public lets your batch see you and join in step | [ADR 0002](../architecture/adr/0002-focus-session-lifecycle.md) |
| Profile (`/profile`) | Semester focus graph (live while a session runs, home minutes in the day detail), hours, streak (weekends count when you focused), saved rooms, share card link, appearance | Signed in, dates and minutes sync across devices |
| Study tables (`/t/:link`) | Set a table in a free room, share one link, people take a seat and start together; turn a running session into a table | [Spec](study-tables.md) |
| Student groups (`/o/`, `/g/:link`) | Groups registered with THD AI host gatherings people reply to | [Organizations](organizations.md) |
| Outages | Without THabella the app lists known rooms as "availability unknown" and focus still starts | [ADR 0009](../architecture/adr/0009-timetable-outages.md) |
| Appearance | Adaptive navigation (bottom bar, rail, drawer), light/dark/system theme, live EN/DE | Room codes are never translated |
| Delivery | Installable PWA; Android APK that updates itself | [ADR 0006](../architecture/adr/0006-android-self-update.md) |

## What "free" means

A room counts only if it hosts teaching at least once in the current Monday to
Friday week, and it is not on the excluded-venue list (sports halls, outdoor
areas, meeting rooms). "Free" means *no scheduled event in THabella*. It does
not guarantee the door is unlocked or that nobody is inside; a focus session
shows that someone is already working there.
