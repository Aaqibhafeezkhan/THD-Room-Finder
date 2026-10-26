# ADR 0012: focus sessions play their own sounds

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 26 October 2026 |
| **Decided by** | Maintainer |
| **Amends** | [ADR 0004](0004-focus-rhythm.md) §7 (notifications) |
| **Spec** | [Focus at home and session sounds](../../product/focus-at-home.md#sounds) |

## Context

When a phase ends, the Android app posts a high-priority notification with
the phone's default sound; the web app shows a notification with the
browser's sound, only while the page is alive. Neither says whether a break
started or ended, and the default sound is the same one every app uses.

At home the phone is often across the room. The maintainer wants pleasant,
recognisable sounds: a coffee or jingle sound for a break, an inviting,
call-to-action sound when it's time to focus again, never annoying.

## Decision

1. **Three moments, three sounds.** Break starts, break's over (with one
   quieter reminder 5 minutes later) and session done. Nothing plays on a tap
   the student just made, and nothing when a session ends unanswered.
2. **Sets, not single sounds.** A set (Coffee break, Jingle, Chimes) holds a
   matching break, back and done sound: falling for a break, rising for
   focus, resolving when done. Phone default and Silent are options too.
3. **One choice per place.** Defaults: Coffee break at home, Phone default on
   campus, so nothing new sounds in a quiet room unless the student wants
   it. The running surface can mute the current session.
4. **The project owns the sounds.** They are synthesised by
   `scripts/dev/focus_sounds.py` from sine partials and noise, 64 kbps MP3
   for the web (about 20 KB each) and Ogg Vorbis for Android. Peaks at
   −6 dBFS, soft attacks, about 3 seconds at most, mostly a fading tail.
5. **Android plays them from the notification.** One notification channel
   per sound (`focus_<set>_<event>`; channel sounds can't change after
   creation), so the sound plays with the phone locked and respects silent
   mode and Do Not Disturb. Each stage the app hands over names its sound;
   Phone default uses the existing alert channel, Silent a vibrate-only one.
   The page doesn't play anything in the Android app.
6. **The web plays them from the page.** Sounds are decoded after the first
   Start (a user gesture unlocks audio) and scheduled on the audio clock,
   which keeps time in a background tab. The page's notification is silent
   while a set plays. If audio is locked after a reload, the surface asks
   for one tap.

## Consequences

- v2.6 changes the native shell, so installed Android apps get the "Update
  available" prompt (ADR 0006) instead of a silent update.
- The web bundle grows by about 180 KB of audio, loaded only when a session
  starts with a set.
- iPhones play sounds only while the app is open; that is an OS limit.
- Students can change channel sounds in Android settings; the app's choice
  stays the default for each channel.

## Alternatives considered

| Option | Why not |
|---|---|
| Recorded sounds from a sound library | Licences to track; a generator keeps them ours and easy to tune |
| Synthesise in the browser at runtime | Android's lock-screen sound needs files anyway; one source is simpler |
| One sound for every phase | Doesn't tell a break from a start, which is the point |
| Repeat until answered | Annoying; one reminder is enough, the notification stays |
| Change the existing alert channel's sound | Android fixes a channel's sound at creation; it would need reinstalling |
| Web push for background sounds | Needs push subscriptions and a scheduler (ADR 0004 rejected it) |
