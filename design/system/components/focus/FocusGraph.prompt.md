The Profile hero: daily focus minutes, seven rows Sun–Sat, one column per
week, the current week rightmost. Today is outlined and future days are blank.
Levels count Pomodoro blocks on --md-graph-0…4 and follow data-accent.

```jsx
<FocusGraph days={days} today="2026-10-18" weeks={53}
  stats="21 h this semester" secondaryStats="12-day study streak"
  status="Classroom access unconfirmed today. Your streak is paused."
  label="Focus graph" text={copy} onShare={openShare} />
```

Use the same source-backed calendar as the app. Only empty confirmed shutdown
cells get a quiet slash; recorded activity stays violet/accent-coloured.
Unconfirmed weekend or lecture-holiday access is not a closed-day fact.
Weekends remain product streak rest days; all minutes remain in totals.

The desktop overview fits the full rolling year where possible, never below
12 px cells. Phones and smaller cards use 18 px cells with native scrolling.
Month selection, previous/newer and latest controls work on touch and keyboard;
44 px controls stay visible on phones. Width-only resize observation defers
writes and ignores height-only notifications. Profile's max width is 960 px.

Supply text.closed, closureNote, jumpToMonth, latest, older, newer, less and
more in EN/DE. The hidden table exposes all dates. Hover/tap updates the stable
day-detail line; no clipped floating tooltip is needed. Omit onShare when there
is no history. Live building status is supplied separately through status.
