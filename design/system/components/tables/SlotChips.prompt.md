Set a table: day chips, then that day's free slots in one room, cut to the
lecture grid (08:00, 09:45, 11:30, 13:15, 15:00, 16:45, 18:30).

```jsx
<SlotChips
  days={[{ id: 'mon', label: 'Today' }, { id: 'tue', label: 'Tomorrow' }, { id: 'sat', label: 'Sat', disabled: true, note: 'Closed' }]}
  day="tue" onDay={setDay}
  slots={[{ id: '09:45', start: '09:45', free: '1h 30' }, { id: '13:15', start: '13:15', free: '3 h' }]}
  slot="13:15" onSlot={setSlot}
  empty="No free slot on Tuesday"
  daysLabel="Day" slotsLabel="Start"
/>
```

`slots={null}` shows skeleton chips while the day loads. Picked day =
violet container, picked slot = teal.
