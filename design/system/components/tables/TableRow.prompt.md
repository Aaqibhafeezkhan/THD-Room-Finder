One table in Profile → Your tables, next first.

```jsx
<TableRow
  ring={<SeatRing seats={6} taken={4} mine={1} size={44} title="4 of 6 seats taken" />}
  title="Algorithms" meta="Today 13:15 · C001 · 4 of 6"
  tag={<TableTag tone="focus">Soon</TableTag>}
  onClick={open}
/>
```

Rows sit in one list card on phones; pass `card` (ring 72, `detail` line)
for the grid on wide windows. `struck` for cancelled tables.
