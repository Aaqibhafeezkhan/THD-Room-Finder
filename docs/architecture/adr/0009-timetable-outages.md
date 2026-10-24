# ADR 0009: a timetable outage removes availability, not rooms or focus

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 24 October 2026 |
| **Decided by** | Maintainer |
| **Issue** | [#154](https://github.com/arudaev/THD-Room-Finder/issues/154) |

## Context

On 22 October 2026 THabella stopped answering. The proxy returned 504 after
Vercel's 10 s limit, the app showed "Can't reach the THD timetable" on Campus
and Rooms, and nobody could open a room to start focus, although the timer and
the focus graph don't need the timetable at all. The app loaded rooms, the
week's teaching set and the day's events in one `Promise.all`, so one failed
weekday threw away a good room list, and a first visit had nothing to fall
back to. Several sheets turned a failed timetable request into `[]`, which
reads as "no lectures" and offers every slot as free.

## Decision

### 1. Three kinds of data, each with its own fallback

| Data | Changes | Fallback |
|---|---|---|
| Rooms (identity) | Rarely | Last good copy of any age, else the bundled catalogue |
| Teaching set (eligibility) | Per week | This week, else the latest earlier week (dated), else the bundled catalogue's week |
| A day's events (availability) | Constantly | An earlier copy of the same day only, shown with its time |

Every answer from `thabellaClient` says where it came from (`live`, `cache`,
`bundled`) and when. The provider publishes each answer on its own.

### 2. Unknown is not empty

A day's schedule is `fresh`, `stale` or `unavailable`. Unavailable means
nobody could load that day: no room is shown as free, no free-until duration is
made up, and the free-room count reads "unknown", never 0. Known rooms are
listed without a status. Code that can't load events throws or shows an error;
it never substitutes `[]`.

### 3. A bundled catalogue of recent teaching rooms

`src/data/fallbackRooms.json` lists the rooms that hosted at least one event in
a full lecture week, made by `scripts/dev/fallback-rooms.mjs` from real
THabella answers (no staff names or emails). It is only a fallback: live data
always replaces it, and a monthly workflow refreshes it. This is the one
exception to "no THabella data in the repo".

### 4. Focus doesn't need the timetable

With the schedule unavailable, a student can still open a known room and start
a device-only or shared session, planned to closing time or 3 h. The room page
says a lecture can't be ruled out. A running session stays reachable by its
saved room even if no room list has it. When the timetable comes back, a
lecture on now ends the session (the focus so far is kept); a later one
shortens the plan. The plan is never extended or restarted.

### 5. Bounded, quiet retries

The proxies give up after 8 s and answer 504/502 with `no-store`, so an outage
is never cached by the CDN; anything but a JSON array is a 502. The client
asks once per URL at a time and retries after 30 s, 1, 2 and 5 minutes, and
on `online`.

## Consequences

- An outage costs live availability, not the app. Profile, saved rooms, the
  graph, tables and gatherings keep working on their own services.
- The bundled list ages. The refresh workflow and the "week of …" line keep
  that visible; a room closed since stays listed as "unknown" until THabella
  answers again.
- Outage drills (`THABELLA_OFFLINE=1 npm run dev`,
  [outage drills](../../development/outage-drills.md)) are part of checking any
  change that reads timetable data.
