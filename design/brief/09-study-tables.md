# 09 · Study tables (M2)

Spec: [`docs/product/study-tables.md`](../../docs/product/study-tables.md).
Specimens: [`design/system/ui_kits/study-tables/`](../system/ui_kits/study-tables/index.html).

## The picture to design for

A round table in a lab session, seen from above: the room code in the middle,
seats around it. Taken seats are filled violet, yours has a ring, empty seats
are outlined. It replaces any calendar look. There are no dates in boxes, no
event cards with time columns and no attendee lists with avatars.

## Tone

Quiet, like the profile: one card, one ring, one primary action. Violet
(`--md-focus`) is the table colour because a table is a focus session that
hasn't started. Teal marks free slots. No new colours.

## Screens

| # | Screen | Key states |
|---|---|---|
| S1 | Study together (sheet from room detail) | Slots loading, slot picked, no slot that day, Just me |
| S2 | Table page | Guest, seated, host, full, starting soon, lecture appeared, cancelled, ended |
| S3 | Your study tables (Profile section) | Empty, one table, several with chips |
| S4 | Reminder banner | Starts in 15 min, started |
| S5 | Chat preview | The link card in a messenger, light and dark |

## Inviting to a running session (#153)

While the student's own session runs in the room, room detail shows a
focus-violet circle at the left end of the **Study together** pill, directly
under the focus card; the label moves right and stays centred in the rest.
It opens a short sheet (room, now until the planned end, rhythm given; seats,
topic, **Invite people**). Component: `StudyTogetherButton`.

## Components

| Component | Notes |
|---|---|
| `SeatRing` | SVG. 1–12 seats evenly around a circle (12 sit closer and smaller); states taken / mine / empty / host; size 96 (rows) and 168 (page). Cancelled: everything at 38 % with a dashed table edge |
| `StudyTableCard` | Ring left on wide cards, on top on phones. Topic as title, then when, where and who as three short lines |
| `SlotChips` | Two rows of `Chip`: days, then slots. Slot chips show the start and, small, how long the room stays free |
| `ReplyBar` | `Take a seat` filled violet; Maybe and Can't as text buttons. Seated: "You're at this table" with the two others |
| `TableRow` | Small ring (seats only), title, "Thu 13:15 · C001 · 3 of 6", trailing chip |
| `TableBanner` | Floating violet container above the nav bar: "Algorithms starts at 13:15 · C001", Open, dismiss |

## Layout

Phones: everything in one column, primary action in thumb reach. Wide
windows (landscape, tablets on their side, desktops) put the ring at 240
beside the details, cap the page at 960 px and show Study together as a
centred dialog. Your study tables becomes a grid of `StudyTableCard`s. Landscape
phones use the rail, like the rest of the app. Text up to 200 % wraps; the
ring scales with the card. Specimens: phone, tablet portrait, tablet
landscape and desktop.
