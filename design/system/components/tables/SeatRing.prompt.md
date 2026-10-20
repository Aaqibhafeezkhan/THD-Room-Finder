A study table seen from above (M2): the room code on a round table, seats
around it. Seats fill clockwise from the top; seat 0 is the host's.

```jsx
<SeatRing seats={6} taken={3} label="C001" title="3 of 6 seats taken" />
<SeatRing seats={6} taken={4} mine={1} label="C001" title="4 of 6 seats taken, one is yours" />
<SeatRing seats={4} taken={2} cancelled label="J004" title="Cancelled" />
<SeatRing seats={12} taken={7} size={72} title="7 of 12 seats taken" />
```

Sizes: 168 on the table page (240 on wide windows), 120 in the Set a table
preview, 72 on cards, 44 in rows (no label). Violet only; no new colours.
