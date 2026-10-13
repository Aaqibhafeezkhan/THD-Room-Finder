Material 3 pill-shaped button — the only button in the system. Use `filled` for the single primary action on a screen, `tonal` for secondary actions, `text`/`outlined` for low emphasis.

```jsx
<Button variant="filled" href="#rooms">Find a Free Room</Button>
<Button variant="tonal" onClick={refresh}>Refresh</Button>
<Button variant="text">Reset</Button>
```

Variants: `filled` (THD blue), `tonal` (secondary container), `text`, `outlined`. Sizes: `small | medium | large`. Pass `icon` for a leading inline SVG, `href` to render as a link, `disabled` to dim to 38%.
