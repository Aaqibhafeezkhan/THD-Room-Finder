# Architecture decision records

An ADR records one significant decision: context, decision, consequences and
the alternatives rejected. ADRs are never rewritten after acceptance. A later
ADR **amends** or **supersedes** them, and the old one gets a pointer.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-study-presence.md) | Individual room study presence: identity, audience, data contract | Proposed contract; amended by 0002 |
| [0002](0002-focus-session-lifecycle.md) | Focus session lifecycle, sharing modes and local history | Accepted; values provisional until [#39](https://github.com/arudaev/THD-Room-Finder/issues/39); §1–2 amended by 0004, §3 by 0003 and 0005 |
| [0003](0003-focus-graph-share-links.md) | Focus graph share links with a stateless preview | Accepted; built 15 October 2026 |
| [0004](0004-focus-rhythm.md) | Focus rhythm, device-only focus and session notifications | Accepted |
| [0005](0005-focus-across-devices.md) | Focus history sync and running sessions across devices | Accepted |
| [0006](0006-android-self-update.md) | The Android app keeps itself up to date | Accepted |
| [0007](0007-study-tables.md) | Study tables are shared by a word link | Proposed |
| [0008](0008-organization-registry.md) | Organizations are verified in a public registry | Proposed |
| [0009](0009-timetable-outages.md) | A timetable outage removes availability, not rooms or focus | Accepted |
| [0010](0010-session-to-table.md) | A running focus session can become a study table | Accepted |
| [0011](0011-focus-at-home.md) | A focus session has a place, a campus room or home | Proposed |
| [0012](0012-session-sounds.md) | Focus sessions play their own sounds | Proposed |

Operating limits and the hosted activation checklist live in
[pilot verification](../pilot-verification.md).

## Writing a new ADR

1. Copy the header table from ADR 0002 and take the next number.
2. Keep it to one decision. Link the issue it serves.
3. Open it in the same PR as the change that needs it, or before it.
4. If it changes an earlier ADR, add an "Amended by" note there; do not edit
   the earlier decision text.
