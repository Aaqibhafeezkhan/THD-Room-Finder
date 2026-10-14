# Project board

[THD Room Finder — Campus Study](https://github.com/users/arudaev/projects/8)
follows Voyager's small set of daily views, plus a dedicated prototype tracker.
Issues describe deliverables; PRs are the review queue. Epics and blocked work
do not crowd the daily board.

## Views

| View | Layout | Filter | Purpose |
|---|---|---|---|
| [Open work](https://github.com/users/arudaev/projects/8/views/1) | Board, Status columns, no swimlanes; Priority ascending | `is:issue is:open -label:"type:epic" -status:Blocked -phase:"Phase 2 · Community","Phase 3 · City"` | Current Foundation and Phase 1 work |
| [Prototype](https://github.com/users/arudaev/projects/8/views/2) | Table, session order | `is:issue label:"track:prototype"` | D1–D4 and component handoff, including completed sessions |
| [Completed](https://github.com/users/arudaev/projects/8/views/3) | Table, newest Updated first | `is:closed` | Closed issue and PR history |
| [Milestones](https://github.com/users/arudaev/projects/8/views/4) | Table | `is:issue label:"type:epic"` | Outcome epics and native sub-issue progress |
| [Waiting](https://github.com/users/arudaev/projects/8/views/5) | Table, grouped by Milestone | `is:issue is:open status:Blocked` | Dependencies and maintainer follow-ups |
| [Pull requests](https://github.com/users/arudaev/projects/8/views/6) | Table, grouped by Status | `is:pr is:open` | Review and merge queue |

Former duplicate views are consolidated into these six tabs. Completed
includes abandoned PRs and issues closed as not planned: check the native
state/reason before treating something as shipped. Auto-archive is disabled
so progress and completed prototypes remain visible. No dates are invented.

## Prototype progress

Design-and-components epic [#21](https://github.com/arudaev/THD-Room-Finder/issues/21)
owns five native sub-issues. Approved HTML prototypes alone do not complete
application work; the parent stays open until reusable components land.

| Deliverable | Issue | Delivery | Snapshot: 14 October 2026 |
|---|---|---|---|
| D1 — Room detail and focus surface | [#58](https://github.com/arudaev/THD-Room-Finder/issues/58) | PR #54 | Approved design; export In review |
| D2 — Profile, setup and focus graph | [#59](https://github.com/arudaev/THD-Room-Finder/issues/59) | PR #55 | Approved redo; export In review |
| D3 — List and map signals | [#60](https://github.com/arudaev/THD-Room-Finder/issues/60) | PR #57 | In review; map labels on tap need verification |
| D4 — Share card | [#61](https://github.com/arudaev/THD-Room-Finder/issues/61) | Next session | Ready |
| Reusable components and design-system handoff | [#62](https://github.com/arudaev/THD-Room-Finder/issues/62) | After approved designs | Blocked |

The graph moved from D4 into D2. D4 compares landscape and square share cards.
The latest decisions and prompts are in the #54 → #55 → #57 design stack;
after merge, [the session brief](../../design/brief/03-sessions.md) records them.

PR #54 closes #58 and PR #55 closes #59 when merged into `main`. PR #57 uses
`Issue: #60` to synchronize its card without automatically accepting the
pending D3 correction. Check its criteria before closing #60. `Refs #21`
identifies the umbrella without moving or closing the entire epic. Stack
merges into a feature branch do not close the deliverable issue.

Use Prototype for design progress and Milestones for the complete Phase 1
outcome. Native sub-issue progress counts closed, accepted deliveries;
In review shows approved exports awaiting delivery. Keep D1–D4 in order;
component implementation is a separate handoff, not an invented D5.

The **Design review** column makes approval visible separately from delivery:
D1/D2 Approved, D3 Changes needed, D4 Not started. This is a maintainer decision,
not inferred from PR readiness. The component handoff has no design-review
value. The PR link for the pending D3 correction is recorded in #60.

## Fields

| Field | Meaning |
|---|---|
| Status | Backlog · Ready · In progress · In review · Blocked · Done |
| Priority | P0 blocks the milestone · P1 needed · P2 nice to have |
| Phase | Foundation · Phase 1 · Focus · Phase 2 · Community · Phase 3 · City |
| Size | XS < 2 h · S half a day · M 1–2 days · L 3–5 days · XL split it |
| Design review | Approved · Changes needed · Not started; maintained for D1–D4 |
| Milestone, Labels, Assignees, Parent issue, Sub-issues progress, Linked pull requests, Reviewers | Native GitHub data |
| Start date | First observed In progress or In review; set once |
| Target date | Only a real deadline, set by the maintainer |
| Completed date | Issue closure or PR merge date |

Daily views expose only a few useful fields. Phase, Size and dates remain
available for triage. New issues need manual Phase, Priority and Size triage;
epics need no size estimate.

## Automation

| Trigger | Result | Mechanism |
|---|---|---|
| Open issue/PR in this repository | Added to board | Native auto-add: `is:issue,pr is:open` |
| Sub-issue added | Added to board | Native auto-add sub-issues |
| Item added | Backlog | Native workflow |
| PR linked to issue | In progress | Native workflow |
| Changes requested / approved | In progress / In review | Native workflows |
| Issue closed / PR merged | Done | Native workflows and token sync |
| Issue reopened | Ready, or current active PR state | Native workflow and token sync |
| Draft / ready PR | In progress / In review for PR and explicit delivery issue | `project-sync.yml` |
| Abandoned PR | PR Backlog; issue Ready only if no other active PR owns it | Token sync |
| First active state / closure | Start / Completed date | Token sync |
| Daily or manual reconciliation | Repair missed issue closure/date and active PR updates | Token sync |
| PR opened | Assign author; path labels | `pr-conventions.yml` |
| `/take`, `/drop` | Self-assign / unassign | `issue-commands.yml` |
| Last sub-issue closed | Parent gets `ready-for-acceptance` | `sub-issue-rollup.yml` |
| Move card to Done | Does not close issue | Auto-close disabled |
| Completed work ages | Stays visible | Auto-archive disabled |

`PROJECTS_TOKEN` is installed and live sync runs have succeeded. The hardened
script and daily reconciliation in the board-rebuild PR activate after merge.
The workflow checks out only the default branch, never a PR head with the
project token. Missing tokens fail visibly; expired tokens fail authentication.
Maintainer owns rotation and expiry reminders (#26).

Sync runs share one concurrency group, re-read current issue/PR state, reuse
existing items when native auto-add wins, and consider all active delivery PRs.
A draft or changes-requested PR keeps its issue In progress. An open issue
never becomes Done merely because a stack layer merged. `Refs` alone never
claims a task. Closed issue state wins over stale events.

Ready, Blocked, estimates, design approval, dependency resolution and epic
acceptance remain maintainer decisions. Sync does not close issues, merge PRs,
deploy features or enable auto-merge. Implementation still needs an explicit
request to implement its tracked issue.
