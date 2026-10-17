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
