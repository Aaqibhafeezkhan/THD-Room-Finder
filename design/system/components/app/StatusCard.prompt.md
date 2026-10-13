The big availability banner at the top of a room detail view — **answer-first**:
pass `duration` and it reads as the hero on the right. Color carries the app's
learned status signal: green free, amber closing-soon, red occupied.

```jsx
<StatusCard status="free"     title="Free now"    sub="Free until 16:45" duration="2h 10m" />
<StatusCard status="soon"     title="Closing soon" sub="Free until 12:15" duration="25m" />
<StatusCard status="occupied" title="Occupied now" sub="Occupied until 11:30" />
```

16px radius, elevation 1. Uses tertiary-container (free) · warning-container
(soon) · error-container (occupied).
