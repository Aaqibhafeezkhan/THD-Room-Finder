# ADR 0010: a running focus session can become a study table

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 24 October 2026 |
| **Decided by** | Maintainer |
| **Issue** | [#153](https://github.com/arudaev/THD-Room-Finder/issues/153) |
| **Amends** | [ADR 0007](0007-study-tables.md) (when a table may start) |

## Context

A student who is already focusing in a room and wants friends to come had to
set a table for a later lecture-grid slot, or end the session and start over.
ADR 0007 lets a table start only from now on, and the Study together sheet
offers future slots.

## Decision

1. **Same table, already in progress.** Converting makes an ordinary study
   table whose start is the session's rhythm **anchor** and whose end is the
   session's **planned end**. Guests who start focus at a table that has begun
   are anchored at its start (T16), so their blocks and breaks line up with the
   host's.
2. **The session is not touched.** No restart, no new block, no change to the
   rhythm, planned end, visibility or name setting. History counts the session
   once, as before. Private stays private; the batch is not invited.
3. **25 minutes left at least.** Others need time to come, so conversion needs
   25 minutes between now and the planned end, the same minimum as any table.
   Less than that: the sheet says so and Study together (a later slot) stays
   available. A session anchored to a batch more than 3 hours before its end
   can't be converted (a table is at most 3 hours).
4. **Checked again on Invite.** The session must still run in that room, the
   timetable must be known (fresh or stale), and no lecture may fall before the
   planned end. A timetable outage blocks inviting, not focusing (ADR 0009).
5. **Idempotent.** The client sends one request id per opening of the sheet;
   the server returns the existing table for a repeated id, and for a shared
   session that already became a table (`study_table.session_id`, unique). The
   device also notes which table its session became, so the violet shortcut
   opens that table instead of making another.
6. **Server checks.** `table_from_session` accepts a start up to 3 hours back
   and at most a minute ahead, an end at least 24 minutes ahead (a minute for
   clocks), 2 to 12 seats, and, for a shared session, only the caller's open
   session in the same room with the table inside its anchor and planned end.

## Consequences

- A converted table can't be changed or moved with the table's Change sheet
  once it has begun (the same as any table that has started).
- Sessions that run on the device only (signed in, but offline when they
  started) convert too; the server then checks times only.
