# ADR 0011: a focus session has a place, a campus room or home

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 26 October 2026 |
| **Decided by** | Maintainer |
| **Amends** | [ADR 0002](0002-focus-session-lifecycle.md) §1 (a session is in a room), [ADR 0004](0004-focus-rhythm.md) §4 (who shares), the streak rule in [focus sessions](../../product/focus-sessions.md#campus-closures-and-focus-streaks) |
| **Spec** | [Focus at home and session sounds](../../product/focus-at-home.md) |

## Context

A focus session starts from room detail and is planned around that room:
next lecture, closing time, the 3-hour cap. Everything else hangs off the
room too: the claim, the batch, study tables, the lecture guard, the
notification's link.

The maintainer wants to keep focusing at home, where most studying happens.
At home there is no room, no lecture and nobody to see you, and the campus
is usually closed. The streak rule also assumed focus needs an open campus:
weekends and the Christmas shutdown never add a day, even with focus in them.

## Decision

1. **A session has a place:** a campus room (as today) or **home**. Home
   means anywhere that isn't a campus room. The student picks it; the app
   never reads the location.
2. **A home session is planned by the rhythm alone.** It ends 3 hours after
   the start at most, or earlier when ended or unanswered after a break
   (ADR 0004 §2). No lecture, closing time, timetable state or campus
   calendar applies. The 3-hour cap stays so history entries keep their
   bounds and a forgotten session can't grow without limit.
3. **Home sessions stay on the device**, also with a study profile: no claim,
   no service call, no adoption on other devices. When it ends, the entry
   joins the focus history and syncs like any other (dates and minutes;
   ADR 0005).
4. **The place stays on the device.** History entries may carry `home: true`
   instead of a room code; it is never synced, exported only in the file the
   student exports, and never shown on share cards.
5. **One session at a time, across places.** Starting at home ends a running
   campus session (and its claim), and the other way round, as moving rooms
   does today.
6. **A Focus tab holds every running session.** Navigation becomes Campus ·
   Rooms · Focus · Profile. Home sessions are started and controlled there;
   room sessions are shown there with a link to their room.
7. **A rest day with focus counts toward the streak.** An empty rest day
   still pauses it. Recorded focus already counted in totals on any day.

## Consequences

- Students can use the focus rhythm every day, which is what the graph and
  streak are for.
- Campus behaviour doesn't change: rooms, claims, lectures, batches and
  study tables work as before.
- The navigation gains a fourth item; the bottom bar has room for it on
  phones (four items of 90 px at 360 px).
- Streaks may grow by weekend days for students who study at weekends.
  Existing streaks don't shrink.
- Home sessions don't follow the student to another device. That can come
  later with a service change ([spec](../../product/focus-at-home.md#out-of-scope-for-v26-kept-in-mind)).

## Alternatives considered

| Option | Why not |
|---|---|
| Start home focus from Profile, next to the graph | Profile is for what you check, not what you start; a running session needs a home of its own |
| A "Home" pseudo-room in the room list | Mixes a private place into the campus list and its ranking |
| Detect home by location | Needs the location permission and contradicts "the app never reads GPS" |
| Share home sessions with the focus service | Tells the server when a student studies at home, for no visible benefit in v2.6 |
| No cap at home | Entries over 3 h would break the history bounds and import checks |
| Keep the old streak rule | Weekend study at home would never count, which feels wrong once it's possible |
