The quiet Profile hero follows the closed-days preview: short icon/status,
semester hours with the study streak beneath, compact square calendar, a small
intensity/rest-day legend and selected-day detail. No month selector or history
navigation buttons. Real profiles show real totals, including zero, rather than
sample activity.

```jsx
<FocusGraph days={days} today="2026-10-18" weeks={53}
  stats="21 h this semester" secondaryStats="12 study days in a row"
  status="Weekend - Streak paused"
  label="Focus graph" text={copy} onShare={openShare} />
```

Rows are Sun-Sat and the newest week is rightmost. Today is outlined; future
days are blank. Levels follow --md-graph-0 through 4 and data-accent. Empty
weekend/confirmed-shutdown cells get a quiet rest-day slash. Recorded study
keeps its accent colour. This rest-day mark does not claim buildings are locked.

Cards use 12-14 px cells, native touch/keyboard scrolling for older weeks and a
full-year desktop overview where it fits. Width-only resize observation defers
writes. The profile column is capped at 960 px. The hidden table exposes all
dates; hover/tap updates the stable detail line. Supply text.closed, rest, less
and more in EN/DE. Omit onShare if no history exists.
