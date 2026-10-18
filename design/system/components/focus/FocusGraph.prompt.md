The quiet Profile hero follows the closed-days preview: short icon/status,
exact semester time with the study streak beneath, compact square calendar,
a small intensity/rest-day legend and a stable selected-day detail. Keep the
month picker and previous/next toolbar out of this component.

```jsx
<FocusGraph days={days} today="2026-10-18" weeks={53}
  stats="21 h this semester" secondaryStats="12 study days in a row"
  status="Weekend - Streak paused"
  label="Focus graph" text={copy} onShare={openShare} />
```

Calendar geometry, day aggregation, levels and keyboard moves live in the
framework-free domain/focusGraph model. Rows are Mon-Sun and the newest week
is rightmost. Today is outlined; future days are blank. Empty weekend and
confirmed-shutdown cells have a quiet rest-day slash; recorded study always
keeps its accent colour. Rest days do not imply physically locked buildings.

The calendar is a data grid with one tab stop. Arrow keys explore neighbouring
days/weeks without wrapping into future dates. Home/End select the first/last
week of a row; Control+Home/End select the first/latest day in the calendar.
Touch selects a day persistently. Mouse hover previews it. Details remain in a
stable, wrapping text area with a full year in the label. Native scrolling
keeps older history available; rotation preserves the viewed part of the year.

Tokens govern typography, spacing, surfaces, focus rings and colours. Cells
scale with enlarged text; full-year fitting uses the card width, not viewport
width. Narrow cards scroll with comfortable 16 px cells. Saturday and Sunday stay
together in the last two rows. Keep the labelled blue Share action and a
compact day-detail line; do not reintroduce month controls. Never hide overflow by clipping the entire page.

Supply closed/rest/less/more/share and keyboardHint/loading copy in EN/DE.
Use loading=true while reading history, so zero totals do not flash. Hide Share
until there is history. The app's empty state links to Rooms for a first session.
