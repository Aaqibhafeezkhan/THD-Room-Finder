The running session on room detail (D1): violet focus-container card with the
48px mono timer, the planned end and why, Private | Public (Private is the
default), one line on what others see, "Show my name" in Public only, the
lock-screen note and End.

```jsx
<FocusSurface elapsed="24:10" plannedLine="Planned end 12:36 · 3 h max"
  visibility="private" showName={false} signedIn text={copy} />
```

Signed out it is a local timer: no visibility control, "the room doesn't show
as claimed", and Set Up Study Profile. All copy comes in through `text`
(EN/DE in the D1 handback).
