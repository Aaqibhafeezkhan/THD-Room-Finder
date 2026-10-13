Material 3 filter chip — selectable, used in a horizontal scroll row for the building filter (`All`, `A`, `B`, `ITC`…).

```jsx
<Chip active={building === 'A'} onClick={() => setBuilding('A')}>A</Chip>
```

`active` fills it with the secondary container color; inactive is outlined. 8px radius (square-ish, not pill).
