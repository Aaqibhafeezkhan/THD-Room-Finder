# Profile and access review

Reviewed 18 October 2026 for draft PR #130. The visual baseline is the quiet
closed-days profile: compact hierarchy, restrained marks and direct interaction.
The graph has no month picker or navigation toolbar. Keyboard behaviour follows
the [WAI grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

## Product behaviour

- Exact time on Profile, a static loading skeleton and a useful first-session
  link. No invented history and no false zero while IndexedDB is loading.
- A single keyboard stop in the calendar. Arrow keys inspect adjacent cells;
  Home/End stay within a weekday row; Control+Home/End reach the year edges.
  Selection persists after a tap. Hover is a temporary preview. The detail
  area reserves room for wrapping labels and includes the calendar year.
- Empty rest days have a quiet slash. Study keeps its accent colour. Rest-day
  and physical-access policies remain separate.
- Unknown saved-room access uses a neutral tone. A planned date stays visible
  beside saved rooms, and room/detail captions do not call future data live.
- Access notices lead with the fact and next scheduled opening. Sources and
  caveats remain available through a native disclosure.
- Portrait navigation stays below the content; short landscape windows use a
  rail; larger landscape windows use the drawer. Profile/settings navigation
  starts at the heading; rotation keeps the current view.

## Browser review

Checked populated and empty profiles in Chromium, using disposable history on
localhost only. No sample history was sent to an account or production service.

| Viewport | Purpose |
|---|---|
| 320 x 740 | Narrow phone, German/dark labels |
| 390 x 844 | Phone, direct day selection and share sheet |
| 844 x 390 | Landscape phone with compact navigation rail |
| 768 x 1024 | Portrait tablet |
| 1024 x 768 | Landscape tablet |
| 1280 x 800 | Desktop overview |
| 1920 x 1080 | Large desktop with capped content width |

No horizontal page overflow was observed. A 200% root-text-size check kept the
calendar and card within the page, with growing cells and wrapping labels.
Keyboard inspection reached the oldest date and preserved it after rotating.
The generated canvas share image was inspected; its short leading-month label
is omitted to prevent collisions. Native gesture injection is unavailable in
the desktop test browser; physical-device gesture testing remains separate.

Live THabella review covered a planned weekday opening: 126 eligible room
links, duration-ranked within the saved-room ordering, a real room schedule,
saving/removing that room and the selected-date caption on Profile. No focus
session or remote account operation was created during review.

## Implementation

Calendar geometry, aggregation and keyboard movement live in the framework-free
`src/domain/focusGraph.ts`. React owns only selection, hover, focus and viewport
interaction. CSS owns layout through existing type, spacing, surface and colour
tokens. Width-only resize observation defers writes and cleans up its animation
frame. Source components, design mirrors and usage notes change together.

This is responsive browser verification, not a claim of physical testing on
every phone, browser engine or assistive-technology combination.
