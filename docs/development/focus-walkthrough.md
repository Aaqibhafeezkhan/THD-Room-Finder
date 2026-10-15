# Focus walkthrough on devices

The scripted check for [#22](https://github.com/arudaev/THD-Room-Finder/issues/22)
and the device half of [#39](https://github.com/arudaev/THD-Room-Finder/issues/39).
Run it on each target, against **staging** (a Vercel preview of the stack)
with synthetic accounts only. Results go into the table at the end and the
measurements into [pilot verification](../architecture/pilot-verification.md).

Rules: [ADR 0002](../architecture/adr/0002-focus-session-lifecycle.md) and
[ADR 0004](../architecture/adr/0004-focus-rhythm.md).

## Targets

| Target | How to install |
|---|---|
| Android app | Debug APK from the stack (`npm run build && npx cap sync android`, then `gradlew assembleDebug`), sideloaded |
| Android Chrome PWA | Preview URL → menu → *Install app* |
| iOS Safari PWA | Preview URL → Share → *Add to Home Screen* |
| Desktop Chrome / Edge / Firefox | Preview URL in a normal window |

Two people (or two devices) are needed for the batch steps: **A** and **B**
in the same programme and intake, plus **C** in another programme.

## Script

1. **Without a profile.** Signed out, open a free room and tap *Start focus*.
   Expect the Deep rhythm, "Block 1 of 2" (or more), a countdown and "On this
   device only". B sees no claim on that room.
2. **Notifications.** Allow notifications when asked. Leave the app.
   - Android app: an ongoing notification with a live countdown, also on the
     lock screen, showing only the room code and phase.
   - Web: one notification with the break time; it goes away when you return.
3. **Lock the phone for a whole block** (or shorten the test with Custom 15/5).
   - Android app: the notification switches to *Break* on time, then to
     *Break's over* with **Start Block 2**. Tap it: the app opens and block 2
     runs.
   - Web: on return the session shows the break or *Break's over*.
4. **No answer.** Let *Break's over* run 10 minutes without answering. The
   session ends at the end of the last block; the focus graph gains only the
   focus minutes.
5. **Sign in and set up a profile** (A, B, C). Start Private in a room as A.
   B and C see "Focus session" (dark purple), the room drops below free rooms,
   and the map shows a claim dot on the building.
6. **Switch to Public** as A. B sees "AIN 7 · 1 studying" in violet, the
   violet ring on the map, and *Join*. C still sees an anonymous claim.
7. **Join** as B. B's breaks line up with A's (same countdown).
8. **Time travel** to tomorrow 09:00 on any device: no focus signals, "Schedule
   only".
9. **End** as A. B's session keeps running; the batch count drops to 1.
10. **Away time (Android app).** During a block, open another app for 2
    minutes, come back, end the session. The summary says "2 min in other
    apps left out".
11. **Offline.** Airplane mode, then start a session: it runs on the device
    ("Offline: this session runs on your device") and lands in the graph.
12. **Delete the profile** in Settings as C. Their running session disappears
    for others within a minute.

## Results

| Step | Android app | Android Chrome | iOS Safari | Desktop |
|---|---|---|---|---|
| 1 Without a profile | | | | ✓ 15 Oct (local) |
| 2 Notifications | | | | |
| 3 Locked through a block | | | | ✓ 15 Oct (local, time shifted) |
| 4 No answer | | | | ✓ unit tests |
| 5 Private claim seen by others | | | | ✓ 15 Oct (local, seeded) |
| 6 Public batch signal | | | | ✓ 15 Oct (local, seeded) |
| 7 Join in step | | | | ✓ unit tests |
| 8 Time travel | | | | ✓ 15 Oct (local) |
| 9 End keeps others running | | | | ✓ unit tests |
| 10 Away time | | — | — | — |
| 11 Offline | | | | |
| 12 Delete profile | | | | ✓ pgTAP |

Record per device: model, OS and browser version, and anything that
differed. Notification timing (how late *Break* arrived with the screen off)
is the number #39 needs.
