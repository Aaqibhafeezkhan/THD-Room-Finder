# Outage drills

The app depends on three things it doesn't control: THabella, the focus
service (Supabase) and the network. Each can be down, slow or answering
nonsense. A screen fails well when it keeps what it knows, says what it can't
check, and never shows a guess as a fact ("0 rooms free", "Not signed in",
a spinner that never stops). [ADR 0009](../architecture/adr/0009-timetable-outages.md)
has the rules for timetable data.

Run a drill for every change that reads THabella or the focus service, and
before every release.

## THabella down

```bash
THABELLA_OFFLINE=1 npm run dev -- --port 5174
```

The dev proxy then answers `/api/rooms` and `/api/periods` like the outage of
22 October 2026: 504 after 1.5 s. Port 5174 is a separate origin, so it
starts with no cache, like a first visit. In the Claude desktop app the
`dev-outage` entry in `.claude/launch.json` does the same.

Check, on a weekday during opening hours (pick the time with the time control,
or fake the clock in a headless browser):

| Where | Expect |
|---|---|
| Rooms | "free rooms unknown right now", the notice with *Try again*, rooms listed as **unknown**, search still finds rooms |
| Campus | Pale map, "Availability unknown" in the legend, the same list per building |
| Room detail | "Availability unknown", the schedule says it is unavailable, **Start focus** works |
| Running session | Survives a reload; *End* and the next block still work |
| Profile | Graph, saved rooms (as unknown), tables and settings as usual |
| Table / gathering sheet | "Can't check this room's free times right now" with *Try again*; no slot offered |

Then restart without the variable and reload: within 30 s the lists come back
with real availability, and a running session in a room with a lecture now
ends with its focus kept.

## Focus service down or hanging

Two different failures, both worth a run:

- **Refusing**: stop the local stack (`supabase stop`), or block the
  Supabase host in the browser's request blocking. Requests fail at once.
- **Hanging**: the server accepts and never answers (a paused project, a
  captive portal). In a headless browser, intercept requests to the Supabase
  host and never call `continue()`; requests give up after 15 s
  (`timedFetch`).

Expect: Profile keeps the last known account and says it can't reach it
(never "Not signed in"); sessions start on the device with "Offline: this
session runs on your device"; tables and gatherings keep what they showed and
offer *Try again*; nothing says a claim or invite was shared when it wasn't;
no spinner lasts longer than the timeout.

## Automated checks

`src/data/thabellaClient.test.ts` and `src/features/rooms/roomData.test.tsx`
cover 504s, malformed answers, a weekday that fails, corrupt and missing
caches, retries and recovery. Add a case there when a new kind of failure
turns up.
