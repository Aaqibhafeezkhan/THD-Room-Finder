# 10 · Focus at home and session sounds (v2.6)

Spec: [`docs/product/focus-at-home.md`](../../docs/product/focus-at-home.md).
Prototype: [`design/system/ui_kits/focus-at-home/`](../system/ui_kits/focus-at-home/index.html),
also in the Claude Design project *THD Room Finder – Focus at home (v2.6)*.
Sounds: [`design/system/assets/sounds/`](../system/assets/sounds), made by
[`scripts/dev/focus_sounds.py`](../../scripts/dev/focus_sounds.py).

## The picture to design for

The same violet focus card the student knows from room detail, now with a
small chip at its top-left that says **where**: a house and "At home", or a
building and "C211". Everything else about focus looks and behaves the same,
so home doesn't feel like a second product.

## Tone

Calm. One card, one primary action. Violet stays "your focus"; teal stays
"free on campus". The At home card uses a violet icon well, the On campus
card a teal one, so the two places read at a glance without new colours.
No illustrations, no home imagery.

## Screens

| # | Screen | Key states |
|---|---|---|
| H1 | Focus tab | Nothing running (evening, campus closed; morning, rooms free), running at home, running on campus, just ended |
| H2 | Focus surface with a place | Focus, break with tip, break's over, sound muted; at home and in a room; phone and wide |
| H3 | Closed notice | With **Focus at home**, on Campus and Rooms |
| H4 | Focus pill | At home (house) next to the existing room version |
| H5 | Settings → Focus → Sounds | Two rows, the sound sheet with previews |

## Sound rules

- Down for a break, up for focus, resolve when done.
- Short (about 3 s at most, mostly a fading tail), soft attack, peaks at −6 dBFS; one reminder, never a loop.
- Sounds are never the only signal: the surface, the notification and the
  vibration say the same.

## Components

| Component | Change |
|---|---|
| `FocusSurface` | `place` and `placeLabel` (chip), `sound` + `onSound` (speaker by the chip), `note` (replaces Private/Public at home), `tip` (breaks), `roomAction` (Open C211), larger timer on wide |
| `FocusPill` | `home` shows a house instead of the room code |
| `FocusStartCard` (new) | The At home card: icon well, line, Start focus at home, rhythm and sound lines |
| `OnCampusCard` (new) | The On campus card on the Focus tab |
| `SoundSheet` (app) | Radio rows with a play button, Cancel and Done |
