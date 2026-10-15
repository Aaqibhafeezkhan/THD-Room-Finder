The Profile hero (D2): a contribution graph of daily focus minutes. Square
cells, rows Mon → Sun, one column per week, the current week rightmost, today
outlined, later days left empty. Levels count Pomodoro blocks, 0 · 1 · 2–3 · 4–6 · 7+, on
`--md-graph-0…4`, which follow the graph colour (`data-accent`).

```jsx
<FocusGraph days={days} today="2026-10-13" weeks={53} stats="21 h this semester · 12-day streak"
  label="Focus graph. 21 h this semester, 12-day streak." text={copy} onShare={openShare} />
<FocusGraph {...same} compact />   // phones: 11px cells, the scroller opens at today
```

Omit `onShare` when there is no history. The grid is `aria-hidden`; a hidden
table carries every day's minutes. Hover or tap a cell for its day.
