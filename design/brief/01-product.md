# 01 · Product

## Today (v2.2)

A React + TypeScript PWA and Android app. Three tabs:

| Tab | What it does |
|---|---|
| **Campus** | 2.5D SVG map; buildings tinted by their share of free rooms; amenity badges |
| **Rooms** | Big free-room count, then rooms ranked by how long they stay free; filters, search, time travel |
| **Saved** | Starred rooms with live status |

Room detail: status card (free / closing soon / occupied plus the duration),
capacity, facilities, contact, the day's schedule.

## Why it changes

People use the app intensely around exams and rarely otherwise. About a
hundred rooms stand free for hours on a normal day. Phase 1 gives students a
reason to open the app every study day: **focus in one of those rooms, alone
or with your batch.**

## The Phase 1 flow

1. A student opens **E 212** ("free until 16:00 · 6h").
2. Presses **Start focus**. The planned end defaults to the next lecture,
   capped at 3 hours.
3. The session is **Private**: everyone else sees "Focus session" on E 212 in
   dark purple; E 212 drops below free rooms in their list.
4. They switch to **Public**: students of the same programme and intake
   ("AIN 7") see a violet "AIN 7 · studying" badge and a violet ring on
   building E, and can join.
5. They lock the phone and study. The session keeps running; the app asks
   about once an hour whether they are still there.
6. They tap **End**. The minutes go into their **focus graph** on the Profile
   tab, which they can share as an image.

## People

| Person | Wants | Design implication |
|---|---|---|
| Home studier, occasional campus visitor | A quiet room that stays free | Claims must be obvious in list and map |
| Social studier | Find classmates right now | Batch signals must catch the eye: violet against a teal map |
| Routine builder | Proof of consistency | Focus graph and a share card worth posting |
| First-semester student | Learn the campus | Everything works without an account |

## Terms (use them consistently in copy)

| EN | DE | Meaning |
|---|---|---|
| Focus session | Fokus-Session | One student's timed study in one room |
| Start focus / End | Fokus starten / Beenden | Primary actions |
| Private | Privat | Default; others see a claim, not who |
| Public · AIN 7 | Öffentlich · AIN 7 | Your batch sees you and may join |
| Claimed | Belegt (Fokus) | Someone is focusing here; not a booking |
| Batch | Jahrgang | Programme + intake, shown as "AIN 7" |
| Focus graph | Fokus-Verlauf | Study days over 20 weeks |
| Profile | Profil | The third tab |

Room and building codes (`E 212`, `ITC1.07`) are never translated.
