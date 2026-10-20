# ADR 0008: organizations register themselves in a public registry

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 20 October 2026 |
| **Decided by** | Maintainer |
| **Spec** | [Student organizations and gatherings](../../product/organizations.md) |

## Context

Organizations reach more people than a single student, so their tag has to
be trustworthy. A hidden admin screen would make verification invisible and
put all of it on one person. The THD AI GitHub organization already runs
open, student-facing projects, and is a group of people, not one person.

Clubs need THD's approval to use a room. Their gatherings are far bigger
than a study table (40 to 120 people), and organizers need to know who is
coming.

## Decision

1. **Registry repository.** `THD-AI/organizations` holds an issue form, one
   `orgs/<slug>.json` per verified group, and the workflows.
2. **Groups apply themselves.** A signed-in student starts a request in the
   app; it opens the prefilled issue form with a request number. The form
   asks for the group's public details, the applicant's role and one proof
   of authority (an official post or page naming the request number, a board
   listing, or a student union confirmation). No email or account data goes
   into the issue. We never create an organization for someone else.
3. **Tracked by labels.** A workflow labels new requests *Waiting for proof*
   and moves them to *In review* when proof is given. A THD AI member who is
   not the applicant adds *Approved*, *Needs info* or *Declined*; the
   workflow checks the approver's membership, commits the org file and calls
   a service-only function that activates the org and makes the applicant
   its lead. *Revoked* reverses it. Every step comments on the issue, and
   the app shows the same status.
4. **Gatherings, not big tables.** Only verified groups host gatherings.
   Capacity is the room's seat count from THabella (lower only). A gathering
   records the group's THD room approval reference; the app shows the room
   as taken for that time. Study tables stay at 12 seats.
5. **Consent for the attendee list.** Replying to a gathering shares name,
   programme and batch with that group, after the reply says so. Only
   organizers see the list; exports carry no email addresses.
6. **No payments.** Each group may list its own support link. Verification is
   never sold, and the app takes no share.

## Consequences

- Verification is public and auditable, and other THD AI members can help.
- The workflow needs a scoped database secret in the registry repository.
- Room data from gatherings depends on organizers telling the truth about
  approval; reports and revocation are the check.
- Until the registry exists, organizations stay off; nothing in the app
  depends on it.
