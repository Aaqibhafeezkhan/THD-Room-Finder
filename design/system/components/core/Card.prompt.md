Material 3 ElevatedCard — the universal content surface (feature cards, info panels, list items). Rests at shadow level 1.

```jsx
<Card>Static content</Card>
<Card interactive href="#room/A.011">Tappable row that lifts on hover</Card>
<Card tone="sunken">Tinted summary surface</Card>
```

`interactive` (or passing `href`) lifts the card to elevation 2 and nudges it up 1px on hover. 16px radius. Default padding 24px — override via `style` for denser rows.
