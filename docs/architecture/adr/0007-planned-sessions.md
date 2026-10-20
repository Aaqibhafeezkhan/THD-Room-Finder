# ADR 0007: planned sessions are shared by link

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 20 October 2026 |
| **Decided by** | Maintainer |
| **Spec** | [Planned sessions](../../product/planned-sessions.md) |

## Context

Students already meet in free rooms; they arrange it in WhatsApp groups. The
app can make the arrangement better (a real free room, a shared rhythm, a
reminder) if it fits into that chat instead of replacing it. Phase 1 keeps
almost nothing on the server and has no friends list.

## Decision

### 1. One object: the planned session

A planned session has a host, an optional title, an optional room, a start
and end, and a focus rhythm. Solo plans and group plans are the same thing;
a plan becomes a group plan when its link is shared. There is no separate
"group" entity in this milestone.

### 2. Access by link

Each plan gets a random 10-character code (`/p/<code>`, about 59 bits).
Knowing the code lets anyone view the plan and, once signed in, reply. There
is no friends graph and no search. The host can cancel, which keeps the page
but shows it as cancelled.

### 3. Replies need the existing sign-in

Viewing needs no account. Replying needs the email code sign-in from Phase 1,
with a display name only; batch stays optional. A reply is Going, Maybe or
Can't, plus the existing show-name choice.

### 4. Same boundary as the focus service

Tables in the private `focus` schema with RLS and no policies; every client
call is a `SECURITY DEFINER` function in `public` that takes the user from
`auth.uid()`. Two read functions are callable without signing in: the plan by
code, and a reduced preview for link cards (no names). Plans and replies are
deleted 24 hours after the plan ends.

### 5. Email invites use the device

"Invite by email" opens the mail app with the link. The app sends no email,
so there is no mail provider, sender reputation or address storage.

### 6. Starting reuses focus sessions

At the time, **Start focus** starts an ordinary session in the plan's room
with the plan's rhythm, anchored at the planned start, so later arrivals join
in step. Nothing about the live session changes.

## Consequences

- Fits the chats students already use; one link is the whole invite.
- Anyone who gets a forwarded link can see the plan. The page says so, and
  hosts can cancel and re-plan to rotate the link.
- No room booking, ever: plans carry an explicit "not a booking" line and
  warn when a lecture appears in the room.
