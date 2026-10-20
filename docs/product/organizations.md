# Student organizations and gatherings

Phase 2 · M3. Verified student groups host **gatherings**: a game night, a
planning meeting, a talk, a big group focus session. Students keep their
[study tables](study-tables.md) (up to 12 seats); anything bigger belongs to
an organization. Decisions are in
[ADR 0008](../architecture/adr/0008-organization-registry.md).

## The idea in one paragraph

A study table is a table; a gathering is a **hall**. The organization picks a
room it has THD's approval for, the app knows how many seats that room has
(60, 120, 40), and the hall fills up as people reply. The organizers see who
is coming, from which programme, and how many maybes there are. Everyone else
sees the room as taken for that time, ahead of time.

## Principles

1. **Groups register themselves.** Nobody creates an organization for someone
   else. The only organization set up by us is THD AI. A group applies with
   an issue form and shows that the applicant speaks for it.
2. **Rooms are approved by THD, not by the app.** A gathering needs the
   group's room approval from THD. The app records it and shows it; it never
   books a room.
3. **Capacity comes from the room.** Seats are the room's real seat count
   from THabella; the organizer can lower it, never raise it.
4. **Replies tell organizers what they need.** Going, Maybe, Can't, and for
   organizers a list with name, programme and batch, shared only with consent.
5. **Same design system.** A gathering reuses the table's words, colours and
   reply bar; only the picture changes from a ring to a hall.
6. **People, not seats.** A dot is a person who replied, in the order they
   replied. Nobody reserves a place; the outlines only show how many fit.

## Words

| Word | Means | Never say |
|---|---|---|
| Gathering | An organization's planned get-together in one room | Event booking, reservation |
| Hall | The picture of a gathering: who replied, against the room's capacity | Seating chart |
| Type | Group focus, Game night, Talk or Meeting; picks the picture | Layout, setup |
| Going · Maybe · Can't | Replies | RSVP |
| Organizers | The group's members who host it | Admins |
| Verified | The group passed the registry | Official, partner |

German: Treffen, Saal, Art (Gemeinsam lernen, Spieleabend, Vortrag, Treffen), Komme,
Vielleicht, Kann nicht, Organisationsteam, Verifiziert.

## Types

The organizer picks one of four types. The type gives the gathering its
icon, its words and its picture; it never changes the rules.

| Type | For | Picture |
|---|---|---|
| **Group focus** | A big study session, exam prep for a whole module | Round tables of 6, like study tables, in a grid |
| **Game night** | Game nights, workshops, hackathons | Long tables of 8, two rows of 4 facing each other |
| **Talk** | A talk, a pitch night, a performance | A half circle of rows facing a plain block at the front |
| **Meeting** | A planning meeting, a club meeting, a film night | Straight rows behind a line, like a classroom |

## The hall

| Rule | Value |
|---|---|
| Size | 13 up to the room's seat count from THabella, at most 300. 12 and below is a study table |
| Unknown room size | The organizer enters it, 13 to 300 |
| Lowering | Any time, down to the people already going; never above the room |
| What a dot is | One person who replied, not a seat. Nobody's dot is marked, not even your own |
| Order | Dots fill in the order people replied: table by table (Group focus, Game night) or row by row from the front, left to right (Talk, Meeting) |
| Going | A full violet dot |
| Maybe | A dot that is half violet, half white |
| Not yet | An outline. The outlines are the rest of the room's capacity |
| Changing a reply | Maybe → Going fills that dot in place. Can't removes it; later dots move up one |
| Many people | One dot per person up to 120; above that one dot per two people, and the count line says so. A pair with any maybe draws as a maybe |
| Full | Going reaches the size: the hall is full and new replies join the waiting list, shown as "+ 8 waiting" under the hall |
| Count line | Always under the hall: "47 going · 12 maybe · 120 seats" |

Only two colours carry meaning: violet and white. There is no third tone for
maybe, so the hall reads the same in light and dark mode and in a chat
preview.

## Share banner

The link preview is how most people first see a gathering or a table, so it
is designed first. It is a 1200 × 630 image drawn per link, refreshed when
replies change, with no names.

| Part | Content |
|---|---|
| Left half | The picture, large: the seat ring for a table, the hall for a gathering. At most 48 dots so they stay visible at chat size; above that one dot per 2, 3 or more people |
| Right half | Type or "Study table", then the title, day and time, room, and a big count: "47 / 120" with "going" under it |
| Corner | THD Room Finder logo; Verified for groups |
| Title text | "Game night · Thu 5 Nov, 19:00 · I 112" |
| Description | "47 going, 12 maybe. Reply Going, Maybe or Can't." |

## Sizes and views

| Window | Hall | Details | Actions |
|---|---|---|---|
| Phone | Card width, up to 280 px high; dots at least 6 px | Below the hall | Going · Maybe · Can't at the bottom, in thumb reach |
| Phone, more than 120 people | One dot per two | Below | Same |
| Tablet and desktop | 560 px wide beside the details, or above them under 840 px | Right of the hall | Under the details |

| Who | Sees |
|---|---|
| Guest, signed out | The hall, the count line, room, time, the approval line, **Going** |
| Going or maybe | The same hall, "You're going" or "You said maybe", the other two answers |
| Waiting | "You're number 3 on the waiting list" |
| Organizer | The same hall plus counts by programme, **People**, **Export**, Change, Cancel; on wide windows People opens beside the hall |

## Flow

```mermaid
flowchart LR
  subgraph Register
    A[Group lead<br/>Register your group] --> B[Issue form in<br/>THD-AI/organizations]
    B --> C{Proof of authority}
    C -->|THD AI member checks| D[approved]
    C -->|missing| B
  end
  subgraph Gather
    D --> E[Organizer: New gathering<br/>room, time, type]
    E --> F[THD room approval<br/>reference]
    F --> G[Gathering page<br/>link + poster QR]
    G --> H[Students reply<br/>Going · Maybe · Can't]
    H --> I[Organizers: list,<br/>programme counts, export]
  end
```

## User stories

### Registering

| # | As a… | I want to… | So that… | Acceptance |
|---|---|---|---|---|
| O1 | group lead | register my group | it can host gatherings | **Register your group** in Profile and under the 12-seat chip opens the issue form, prefilled with a request number |
| O2 | group lead | show I speak for the group | a random member can't claim it | The form asks for my role and one proof: a post from the group's official account naming the request number, a page of the group listing me in its board, or a confirmation from the student union |
| O3 | applicant | follow the request | I know what is missing | Labels move it from *Waiting for proof* to *In review* to *Approved*, *Needs info* or *Declined*; every change comments on the issue and shows in the app |
| O4 | THD AI member | approve with a label | verification is quick and on record | Only a THD AI member who is not the applicant can approve; the workflow refuses otherwise |
| O5 | group lead | add organizers with a link | the team can host without sharing a login | An organizer link, valid 7 days, adds a signed-in student as organizer |
| O6 | THD AI member | revoke a group | a group that misuses the tag loses it | Label *Revoked*; open gatherings show "No longer verified" |

### Gathering

| # | As a… | I want to… | So that… | Acceptance |
|---|---|---|---|---|
| O7 | organizer | create a gathering in a room | people know where and when | Pick room, day and time (the room's free windows, like tables), name, type, optional description |
| O8 | organizer | record THD's room approval | students trust it | A required field for the approval reference and a confirmation that THD approved this room and time |
| O9 | organizer | get capacity from the room | I don't count chairs | Seats = the room's seat count; I can lower it. Rooms without a known count ask for one, up to 300 |
| O10 | organizer | share it with many people | it reaches everyone | The same word link (`/g/mossy-lagoon-42`), a chat preview, and a printable poster with a QR code |
| O11 | student | reply in one tap | the organizers can plan | Going · Maybe · Can't, signed in with the email code. Before the first reply: "Campus Connect sees your name, programme and batch" |
| O12 | student | a waiting list when full | I still get in if someone cancels | Full gatherings offer **Join the waiting list**; the first in line moves up when a seat frees, and gets told |
| O13 | organizer | see who is coming | I can plan food, tables, a second room | A list with name, programme, batch, reply and time; counts per programme; CSV export; only organizers see it |
| O14 | student | see the room is taken | I don't plan a table there | Rooms with a gathering show "Taken · Game night · Campus Connect" for that time, on the map and in slot chips |
| O15 | student | open a group's page | I see what it does next | `/o/<slug>`: name, verified tag, description, website, upcoming gatherings, support link |
| O16 | student | report a gathering | misuse gets looked at | **Report** opens a prefilled issue in the registry, no personal data |

## Where things live

| Place | What appears | Who sees it |
|---|---|---|
| Room detail | "Taken · Game night · Campus Connect" for the time of a gathering | Everyone |
| Map and room list | The room counts as taken during a gathering | Everyone |
| Profile | **Your gatherings** with your replies; for organizers, **Organizing** with counts | Me |
| `/g/<link>` | Gathering page with the hall | Anyone with the link |
| `/o/<slug>` | Group page | Everyone |
| Profile → Register your group | The registry form | Signed-in students |

## Gathering page

```
┌──────────────────────────────────────────┐
│ ‹  Gathering                  Verified ✓ │
│ Campus Connect                           │
│ Game night                               │
│   ●●◐●  ●◐●●  ○○○○                       │  hall: long tables,
│   ▬▬▬▬  ▬▬▬▬  ▬▬▬▬                       │  ● going, ◐ maybe,
│   ●●●◐  ●○○○  ○○○○                       │  in reply order
│ 47 going · 12 maybe · 120 seats · I 112  │
│ Thu 5 Nov · 19:00–23:00                  │
│ Room approved by THD                     │
│ [ Going ]   Maybe   Can't                │
│ Share · Poster                           │
└──────────────────────────────────────────┘
```

| State | Shows |
|---|---|
| Guest | Hall, counts, **Going** asks for the email code |
| Going | "You're going", Maybe / Can't; my dot is not marked |
| Full | "Full · 120 of 120", **Join the waiting list** |
| Organizer | Counts by programme, **People**, **Export**, Change, Cancel |
| Cancelled | Hall greyed, "Cancelled by Campus Connect" |
| Not verified any more | "No longer verified" banner, replies closed |

## What verification means

A THD AI member checks the proof in the public issue. Payment never counts as
verification, and nothing personal goes into the issue: the app sends only
the group's public fields and a request number. Proof that names the request
number (a story or post from the official account, a line on the group's
website) is preferred because it cannot be reused.

## Support links

Each group can list its own support link on its page (GitHub Sponsors, Buy
Me a Coffee, a club account). Support goes to that group only; the app
handles no money and takes no share. THD AI lists its own link like any other
group.

## Privacy

- Students choose to share name, programme and batch with a group when they
  first reply; the reply shows what is shared. Without consent they can't
  reply, but they can still see the gathering.
- Only organizers see the list; exports carry no email addresses.
- Gatherings and replies are deleted 30 days after the end; the counts stay
  with the group as numbers only.

## Registry

`THD-AI/organizations` holds the issue form, one JSON file per verified
group and the approval workflow. The form is the whole application; the repo
is just where it is kept. The app reads verified groups from the database,
which the workflow keeps in step with the registry.

## Out of scope for M3

Ticketing and payments, seat numbers, check-in at the door, recurring
gatherings, chat, gatherings without a THD room approval.
