The running session on room detail (D1, ADR 0004): violet focus-container
card. The title row names the phase ("Focus", "Break", "Break's over") with
the block count on the right; the 48px mono timer counts down to the end of
the phase (elapsed in the Open rhythm); a track shows blocks (tall) and
breaks (short), filled as they pass. Then the line on what comes next, Private
| Public (Private is the default), one line on what others see, "Show my
name" in Public only, the lock-screen note and End.

```jsx
<FocusSurface elapsed="32:10" phaseLabel="Block 2 of 3" track={segments}
  plannedLine="Break at 11:20 · ends 12:20, before the 12:30 lecture"
  visibility="private" showName={false} signedIn text={copy} />
```

`phase="break"` swaps the timer icon for a cup. `phase="confirm"` leads with a
filled "Start Block 3" button (`confirmLabel`, `onConfirm`) and a smaller
timer for the time left to answer.

Without a study profile the session stays on the device: no visibility
control, "the room doesn't show as claimed", and Set Up Study Profile. All
copy comes in through `text`.

On the Focus tab (ADR 0011) the same card carries its place: `place={{ home: true, label: 'At home' }}`
puts a house chip at the top (a building and the room code for a room).
`note` replaces Private/Public and the signed-out note with one line ("Only
you see this session."), `action` sits under it ("Open C211"), `tip` shows
one suggestion during breaks, and `large` gives wide windows a 72px timer.

```jsx
<FocusSurface place={{ home: true, label: 'At home' }} note="Only you see this session."
  elapsed="17:24" phaseLabel="Block 1 of 6" track={segments}
  plannedLine="Break at 20:40 · ends 23:15 at the latest" visibility="private"
  showName={false} signedIn={false} text={copy} />
```
