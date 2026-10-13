Circular icon button for app-bar actions — back arrow, sponsor heart, overflow. Always pass an accessible `label`. 44px tap target with a subtle tinted hover state.

```jsx
<IconButton label="Back" onClick={goBack}><BackSvg /></IconButton>
<IconButton label="Sponsor the iOS release" tone="sponsor" href={SPONSOR_URL}><HeartSvg /></IconButton>
```

Tones: `standard` (neutral grey hover), `sponsor` (pink), `primary` (blue).
