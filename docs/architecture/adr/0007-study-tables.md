# ADR 0007: study tables are shared by a word link

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 20 October 2026 |
| **Decided by** | Maintainer |
| **Spec** | [Study tables](../../product/study-tables.md) |
| **Amended by** | [ADR 0010](0010-session-to-table.md): a running session can become a table already in progress |

## Context

Students already meet in free rooms and arrange it in WhatsApp groups. The
app can make that better (a room that is really free, a shared rhythm, a
reminder) if it fits into the chat instead of replacing it. Phase 1 keeps
almost nothing on the server and has no friends list, and it should stay that
way.

## Decision

### 1. One object: the study table

A table has a host, a room, a start and end inside one of the room's free
windows, a seat count (1, 2, 4, 6, 8 or 12), an optional topic and a focus rhythm. One
seat ("Just me") is a planned solo session and has no link to share. There is
no group, friend or follower entity.

### 2. A link made of words

The link is two words and two digits, `mossy-lagoon-42`: a describing word
and a thing, each from a fixed list of 512 short, plain English words that
are easy to say and type, then 10 to 99. That gives about 23 million links,
far more than the few hundred tables open at once. Links are matched in lower
case with spaces trimmed. Anyone with the link can read the table and,
once signed in, reply, so the link is the permission. It is readable aloud in
a lab and survives being typed from a screen. The host can cancel and set a
new table to get a new link.

The table holds a room, a time, a topic and first names people chose to
show, so guessing a link exposes little. If guessing ever shows up in the
logs, lookups get a rate limit; the format can grow a third word without
breaking old links.

### 3. Seats and replies

Take a seat holds one of the seats; Maybe holds none; Can't removes the
reply. The host holds a seat. A full table refuses new seats. Twelve is the
ceiling for a table: past that it is a gathering, which belongs to an
organization (ADR 0008) and uses the room's real capacity.

### 4. Same boundary as the focus service

Private tables in the `focus` schema with RLS and no policies; every client
call is a `SECURITY DEFINER` function in `public` that takes the user from
`auth.uid()`. Reading a table by link and its preview need no account; the
preview has no names. Tables and replies are deleted 24 hours after the end.

### 5. The device sends email

**Email** opens the mail app with the link. The app sends no email.

### 6. Starting reuses focus sessions

At the time, Start focus starts an ordinary session in the table's room with
the table's rhythm, anchored at the table's start, so people who arrive later
join in step.

### 7. Hosted database follows main

Migrations reach the hosted project when they land on `main`: a workflow
runs `supabase db push` against it, after the same contract tests that gate
pull requests.

## Consequences

- One link is the whole invite and fits the chats people already use.
- A forwarded link shows the table to whoever gets it; the page says so.
- Rooms are never booked; tables say so and warn when a lecture appears.
