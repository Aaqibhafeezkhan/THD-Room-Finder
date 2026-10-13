Material 3 top app bar. `brand` mode shows the logo lockup (home/landing); `back` mode shows a back arrow + page title (room list, room detail). Composes `Logo` and `IconButton`.

```jsx
<AppBar mode="brand" actions={<IconButton label="Sponsor" tone="sponsor" href={SPONSOR_URL}><HeartSvg/></IconButton>} />
<AppBar mode="back" title="A.011" onBack={() => history.back()} />
```

64px tall, hairline bottom divider, near-white surface.
