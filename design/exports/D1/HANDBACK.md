# D1 · Room detail and focus surface — handback

Export: `D1 Room Detail.dc.html` (views: Prototype · All states · Theme × language · Components).
Scenario: E 212, Tue 13 Oct, now 10:00; schedule 08:00–09:30, 16:00–17:30, 17:45–19:15.

## Decisions
- **One detail layout, two widths.** Phone stacks: StatusCard → ActivityRow → Start focus / FocusSurface → one-line facilities → schedule → facts. Desktop (expanded) is list-detail: drawer · free-room list (340 px) · detail in two columns (status + focus left, schedule + facts right).
- **Start focus stays above the fold on a 380 × 780 phone.** Facilities collapse to "60 seats · Beamer, Whiteboard, EDV +3"; the full list moves to the facts card.
- **StatusCard stays visible during a session** (schedule wins). Tweak `sessionStatus = compact` swaps it for a one-line "Free until 16:00 · 6h" to compare.
- **Start is filled primary blue in every startable state** (free, batch here, claimed, offline, ended). Under it, one line states the default: "Private by default. Ends at the next lecture, after 3 h at most."
- **Lecture: no focus action at all**, hidden rather than disabled, plus a note when the room frees up.
- **Claimed room:** dark-purple ActivityRow with icon + "Focus session · started 25 min ago" + "A claim is not a booking". Start stays available. StatusCard is unchanged.
- **Batch here:** violet ActivityRow "AIN 7 · 2 studying" with an inline **Join** (focus fill). Start focus stays below for studying alone.
- **FocusSurface** (focus-container): label, 48 px mono timer, planned end with reason ("12:36 · 3 h max" or "before the 16:00 lecture"), Private | Public segmented (Private on), a plain line saying what others see, the *Show my name* switch (Public only, off by default, shown as "AIN 7 student"), lock-screen/check-in note, End (outlined, on-focus-container).
- **Check-in** is a modal: bottom sheet on phone, centred dialog on desktop. "Still focusing in E 212?" · End (text) / Keep Going (filled). With no answer it auto-ends after 10 min.
- **Ended:** violet summary card ("1 h 25 min added to your focus graph", today total + streak, View Focus Graph), then Start focus again.
- **Signed out:** Start runs a local timer. The surface drops the segmented control and says "Only you see this timer; the room doesn't show as claimed", then gives a text action, Set Up Study Profile.
- **Offline / activity unknown** (from the checklist): neutral ActivityRow. Status comes from the cached schedule and Start still works (the session syncs later).
- **FocusPill:** phone shows it in the brand AppBar (trailing) on any other screen; desktop puts it in the list-pane header so it's always visible.

## New or changed tokens
None. Only existing tokens are used: `--md-focus*`, `--md-claimed*`, status roles, surfaces, shape, elevation.

| Token | Light | Dark | Why |
|---|---|---|---|
| *(proposal, not applied)* `--md-focus-state-layer` | `color-mix(on-focus-container 8%)` | same | Hover/track tint inside violet surfaces is used 3× as an inline `color-mix`; worth naming when promoted |

## New or changed components
| Component | Props | States | Notes |
|---|---|---|---|
| `FocusButton` (Button tone) | `tone: 'start' \| 'join'`, `children`, `onClick`, `disabled?` | start, join, hover, disabled | Start = filled primary; Join = focus fill, small. Hidden during lectures |
| `SegmentedControl` (core) | `options[{id,label,icon?}]`, `value`, `onChange`, `tone: 'focus' \| 'primary'`, `label` | selected, unselected, hover, focus-visible | radiogroup + ←/→; segments wrap, never truncate; LanguageToggle becomes a `primary` instance |
| `ActivityRow` | `kind: 'batch' \| 'claimed' \| 'unknown'`, `title`, `sub?`, `action?` | batch, claimed, unknown | Icon + words + colour; `role="status"` |
| `FocusSurface` | `elapsed`, `plannedEnd`, `plannedReason`, `visibility`, `batch?`, `showName`, `signedIn`, `onVisibility`, `onShowName`, `onEnd`, `onSetup` | private, public (name off/on), signed-out, check-in pending | Focus order: timer → visibility → name → End |
| `FocusPill` | `elapsed`, `room`, `onOpen` | running | AppBar trailing (phone) / list-pane header (desktop); full-sentence aria-label |
| `CheckInSheet` | `room`, `elapsed`, `onKeep`, `onEnd` | open | Bottom sheet (compact) / dialog (expanded); scrim `rgba(0,0,0,.32)` |
| `FocusSummary` | `minutes`, `todayMinutes`, `streak`, `onViewGraph` | ended | Links to Profile → focus graph (D2/D4) |
| `AdaptiveNav` (usage) | — | — | Third item is now **Profile** |

## Copy (EN / DE)
| Key | EN | DE |
|---|---|---|
| start | Start focus | Fokus starten |
| startNote | Private by default. Ends at the next lecture, after 3 h at most. | Standardmäßig privat. Endet zur nächsten Vorlesung, spätestens nach 3 Std. |
| join | Join | Beitreten |
| batchTitle | AIN 7 · 2 studying | AIN 7 · 2 lernen hier |
| batchSub | Public sessions · since 09:40 | Öffentliche Sessions · seit 09:40 |
| claimTitle | Focus session · started 25 min ago | Fokus-Session · seit 25 Min. |
| claimSub | Someone is studying here. A claim is not a booking, so you can still focus here. | Hier lernt gerade jemand. Eine Fokus-Session ist keine Buchung – du kannst hier trotzdem lernen. |
| lectureNow / sub | Lecture now · Until 09:30 · then free until 16:00 | Vorlesung läuft · Bis 09:30 · danach frei bis 16:00 |
| lectureNote | Focus sessions can't start during a lecture. Free again at 09:30. | Während einer Vorlesung kannst du keinen Fokus starten. Ab 09:30 wieder frei. |
| offlineTitle | Focus activity unknown | Fokus-Aktivität unbekannt |
| offlineSub | Offline · schedule cached at 09:55. A session you start runs on this device and syncs later. | Offline · Belegung aus dem Cache von 09:55. Eine gestartete Session läuft auf diesem Gerät und wird später synchronisiert. |
| focusSession | Focus session | Fokus-Session |
| plannedEnd | Planned end 12:36 · 3 h max / · before the 16:00 lecture | Geplantes Ende 12:36 · max. 3 Std. / · vor der Vorlesung um 16:00 |
| private / public | Private / Public · AIN 7 | Privat / Öffentlich · AIN 7 |
| privateExplain | Others see that someone is focusing here, not who. | Andere sehen, dass hier jemand lernt – aber nicht wer. |
| publicExplain | AIN 7 sees you here and can join. Everyone else sees a focus session. | AIN 7 sieht dich hier und kann beitreten. Alle anderen sehen nur eine Fokus-Session. |
| showName | Show my name · Shown as "AIN 7 student" / Shown as Lena | Meinen Namen zeigen · Angezeigt als „Studi aus AIN 7" / Angezeigt als Lena |
| lockedNote | Keeps running when your phone is locked. We check in about once an hour. | Läuft weiter, wenn dein Handy gesperrt ist. Etwa stündlich fragen wir kurz nach. |
| end | End | Beenden |
| checkinTitle | Still focusing in E 212? | Lernst du noch in E 212? |
| checkinBody | We ask about once an hour so rooms don't stay claimed after you leave. With no answer, the session ends in 10 min. | Wir fragen etwa stündlich, damit Räume nicht belegt bleiben, wenn du gegangen bist. Ohne Antwort endet die Session in 10 Min. |
| keepGoing | Keep Going | Weiter lernen |
| ended / added | Session ended · added to your focus graph | Session beendet · zu deinem Fokus-Verlauf hinzugefügt |
| todayLine | Today 2 h 10 min · 4-day streak | Heute 2 Std. 10 Min. · 4 Tage in Folge |
| viewGraph | View Focus Graph | Fokus-Verlauf ansehen |
| signedOut | Only you see this timer; the room doesn't show as claimed. Set up a study profile to share sessions with your batch. | Nur du siehst diesen Timer; der Raum wird nicht als belegt angezeigt. Richte ein Studienprofil ein, um Sessions mit deinem Jahrgang zu teilen. |
| setup | Set Up Study Profile | Studienprofil einrichten |
| pillAria | Focus session in E 212, 24:10. Open room. | Fokus-Session in E 212, 24:10. Raum öffnen. |
| nav | Campus · Rooms · Profile | Campus · Räume · Profil |

## Open questions
- **Does Join start a Public session?** Assumed yes, since joining your batch is an explicit opt-in; Private stays the default for Start. Check against the spec / ADR 0002.
- **Signed-out sessions:** assumed they emit no claim, so the room isn't shown as claimed. If the spec wants anonymous device claims, change the copy.
- **Check-in timeout:** 10 min auto-end is assumed. Does the ended session count the minutes up to the last check-in or up to the timeout?
- **Planned end:** editable? D1 only shows it; an "Change end" affordance could go next to the planned-end line.
- **German duration format:** "6h / 2h 10m" is kept as in today's RoomCard. Should DE use "6 Std."?
- **"Belegt (Fokus)"** from the terms table vs. "Fokus-Session" in the claim row: confirm which one the room list (D3) uses as its bucket label.
- The **medium / tablet** layout isn't drawn separately. It's the expanded list-detail with the rail. Confirm before D2.
