# ADR 0004: focus rhythm, device-only focus and session notifications

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 15 October 2026 |
| **Decided by** | Maintainer |
| **Amends** | [ADR 0002](0002-focus-session-lifecycle.md) §1 (signed-out timer) and §2 (lease, check-in, joining) |
| **Tracks** | [#19](https://github.com/arudaev/THD-Room-Finder/issues/19) (lifecycle), [#39](https://github.com/arudaev/THD-Room-Finder/issues/39) (background and lock screen), [#23](https://github.com/arudaev/THD-Room-Finder/issues/23) (group focus, later) |

## Context

ADR 0002 made a session one open-ended timer that runs until the next
lecture or 3 hours. A 60-minute lease and a "Still focusing?" prompt after
45 minutes in the background end forgotten sessions.

Trying the first build (#76), the maintainer found that this is a timer that
claims a room, not a focus tool:

1. **Focus is the product; the room is the reward.** Students need a
   rhythm of focus and rest, as in Pomodoro or Forest, so they neither burn
   out nor drift off without noticing.
2. **Forgotten sessions should end at a natural point**, not because of an
   arbitrary background timer.
3. **Many students will never give an email.** Focus has to work fully
   without an account, offline included.
4. **A running session has to be visible outside the app**, on Android
   ideally on the lock screen.

THD teaches in a fixed grid: in a sample of two teaching days (17 June and
13 October 2026), 674 of about 750 lectures lasted 90 minutes and started
at 08:00, 09:45, 11:30, 14:00, 15:45 or 17:30. A room that is free for one
slot is therefore usually free for 105 to 120 minutes.

## Decision

### 1. A session is a rhythm of focus blocks and breaks

| Rhythm | Focus | Break | Long break | Why |
|---|---|---|---|---|
| **Deep** | 50 min | 10 min | none | Two blocks fill one free slot: 09:30 → 11:20, before the 11:30 lecture |
| **Pomodoro** (default) | 25 min | 5 min | 15 min after every 4th block | The well-known technique, and the easiest start for a new student |
| **Lecture** | 90 min | 15 min | none | Mirrors the lecture grid |
| **Open** | no blocks | none | none | A plain stopwatch, with "Still focusing?" every 60 minutes |
| **Custom** | 15–120 min | 5–30 min | none | Steps of 5 minutes |

- Pomodoro is the default (changed from Deep on 15 October 2026, before
  release); the picker still lists Deep first. The default is set in
  Settings, and Start lets you pick another one for this session.
- The plan is laid out at Start, from an **anchor time**, and cut at the
  planned end from ADR 0002: the next lecture, the campus closing time or
  3 hours.
- A session never ends on a break. A last block shorter than 10 minutes is
  dropped.
- Every phase boundary can be computed from the anchor and the rhythm. The
  device, the notification, the server lease and a group can therefore all
  agree without anything running in the background.
- Skipping a break or extending a block is out of scope for M1.

### 2. Each block after the first is confirmed

- Start confirms block 1.
- When a break ends, the app asks **"Start block 2"**. In the Open rhythm
  it asks **"Still focusing?"** every 60 minutes.
- The answer may come up to **10 minutes late**. The block still counts
  from its scheduled start, so a group stays in step.
- With no answer, the session ends **at the end of the last confirmed
  block**, and that is what the focus graph records.
- This replaces ADR 0002's 45-minute "Still focusing?" prompt: a forgotten
  session now ends at its next break, at most one block, one break and the
  10-minute grace after the student left.

### 3. What the focus graph records

- Only focus time counts; breaks never do.
- Recorded minutes are the focus time of confirmed blocks, up to the moment
  the session ended.
- **Away time.** In the Android app, time spent in another app during a
  block (screen on, Room Finder not in front) is subtracted, and the summary
  shows it ("Away 6 min"). The web app can't tell a locked phone from
  another app, so it subtracts nothing.
- A strict mode, where leaving the app during a block breaks it as in
  Forest, is a later option.

### 4. Without a study profile, focus stays on the device

| Situation | Room claim | Leaves the device |
|---|---|---|
| No account, or signed in without a study profile | None. Nobody else sees it | Nothing |
| Study profile, online | Private claim (default) or Public to the batch | The session row only (ADR 0001) |
| Study profile, offline or unknown room | None; runs on the device | Nothing |

- No anonymous sign-in, no CAPTCHA and no device id are used. A claim needs
  a study profile.
- Device-only sessions work exactly like shared ones: rhythm, notifications,
  focus graph.
- History is never synced between devices; export and import (ADR 0002 §3)
  stay the way to move it.

### 5. The server follows the rhythm

- A session stores its rhythm and anchor.
- The lease becomes **focus + break + 10 minutes** from each renewal, and
  never runs past the planned end. Renewals happen at Start, at each
  confirmation, and once a minute while the app is visible.
- A student who leaves therefore drops their claim at the same point their
  own device ends the session.
- This replaces ADR 0002's fixed 60-minute lease.

### 6. Joining follows the group's rhythm

- *Join* on a batch row starts your own Public session with the **rhythm
  and anchor of the earliest Public session of your batch in that room**.
  Breaks then line up for everyone.
- Joining during a break starts focus straight away and runs to the end of
  the group's next block.
- Ending is still personal (ADR 0002): nobody else's session changes.
- Friends outside the batch, invitations and group objects stay in
  [#23](https://github.com/arudaev/THD-Room-Finder/issues/23).

### 7. Notifications

| | Android app | Web app (PWA) |
|---|---|---|
| While a session runs | An ongoing notification. The system draws a live countdown to the end of the phase, so the app does not have to run. It shows in the status bar and on the lock screen | One notification when you leave the app: "Focus in E212 · block 2 of 3 · break at 14:25". The text doesn't update |
| Lock screen content | Room code, phase and countdown only, never names or batch | The same |
| A phase ends | A scheduled alarm vibrates and switches the notification to the next phase, even with the app closed. Exact when the student allows exact alarms, otherwise possibly a few minutes late | Only while the browser keeps the page alive; no web push in M1 |
| Actions | "Start block N" and "End" | Tapping opens the app |
| Android 16 | A Live Update (status-bar chip) comes later: it needs compile SDK 36, the app builds against 34 | None |

Notification permission is asked on the first Start. Exact alarms are
offered in Settings → Focus on Android 12+, where new installs don't get
them by default. Declining either never blocks focusing.

Away time is measured natively: from leaving the app while the screen is on
until the screen turns off or the app comes back. If Android ends the app
in between, the span runs until the app is opened again, at most to the end
of that block.

## Consequences

- **Fewer forgotten claims.** Without an answer, a claim lasts at most one
  block, one break and 10 minutes after the student left. With Deep that is
  70 minutes, about what the 60-minute lease allowed, but the end now
  matches the student's own record.
- **Server calls stay low.** A 2-block Deep session costs a start, one
  confirmation, an end, and renewals only while the app is open.
- **The Android app needs native code**: a small notification and alarm
  plugin in `android/`. The web app keeps working without it.
- **Students without a profile never claim rooms.** That is the price of
  not asking for an email; the focus itself is complete.
- **Group timing is a convention, not a group object.** If the first person
  leaves, the others keep the same rhythm; new joiners follow the earliest
  remaining session.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep the open timer with a background check-in | It doesn't help students focus, and it ends at arbitrary times |
| Anonymous sign-in to let everyone claim | Needs abuse protection (CAPTCHA), and creates accounts nobody chose |
| Auto-continue blocks without confirmation | A forgotten session would run to the next lecture and hold the room |
| Strict mode by default | The web app can't tell a locked phone from another app, so it would break blocks for students who simply locked their phone |
| Web push for phase alerts | Needs push subscriptions and a server scheduler; most students will use the Android app |
| Skip break or extend a block | Moves the anchor and breaks group alignment; can come later for solo sessions |

## Open values

| Value | Decided | Revisit in |
|---|---|---|
| Default rhythm | Pomodoro 25/5 | Pilot ([#22](https://github.com/arudaev/THD-Room-Finder/issues/22)) |
| Confirmation grace | 10 min | [#39](https://github.com/arudaev/THD-Room-Finder/issues/39) |
| Shortest last block | 10 min | Pilot |
| Open rhythm check-in | 60 min | Pilot |
