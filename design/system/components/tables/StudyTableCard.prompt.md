The table page's main card: ring, topic, then when / where / who.

```jsx
<StudyTableCard
  ring={<SeatRing seats={6} taken={3} label="C001" title="3 of 6 seats taken" />}
  tag={<TableTag tone="focus">Starts in 10 min</TableTag>}
  topic="Algorithms"
  when="Today · 13:15–14:45"
  where="C001 · free now · Pomodoro"
  who="Max, Lena and 1 more · 1 maybe"
/>
```

Pass `wide` on windows ≥ 600 px in landscape: the ring (240) sits left and
the actions (children) move into the card. Topic falls back to "Study table".
