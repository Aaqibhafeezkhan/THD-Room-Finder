The signature list row of THD Room Finder — **answer-first**: it leads with how
long a room stays free (the departure-board duration on the right), with the
room code + building/seats as identity on the left. `status` sets the color and
overline label.

```jsx
<RoomCard name="B.204"  meta="Building B · 45 seats" status="free" duration="2h 10m" href="#room/B.204" />
<RoomCard name="ITC1.07" meta="ITC · 24 seats"       status="free" duration="all day" />
<RoomCard name="J.213"  meta="Building J · 30 seats" status="soon" duration="25m" />
```

- `status="free"` → teal "free" · `status="soon"` → amber "closing" (free but
  < ~40 min left) · `status="occupied"` → red "busy".
- `duration` is the hero string — `"2h 10m"`, `"all day"`, `"25m"`, or
  `"until 11:30"` for occupied.
- Rank a list longest-free first so the answer sits at the top. Lifts to
  elevation 2 on hover.
- Legacy `availText` / `badgeTone` / `badgeText` are still accepted and mapped
  onto `status` / `duration`.
