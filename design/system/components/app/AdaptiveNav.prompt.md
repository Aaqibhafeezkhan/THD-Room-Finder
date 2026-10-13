One adaptive navigation component, three forms picked by window size class — the backbone of the responsive (mobile / tablet / desktop) layout. `compact → bottom bar`, `medium → navigation rail`, `expanded → navigation drawer (sidebar)`. The active destination gets the M3 secondary-container pill indicator. Labels are caller-supplied, so it runs in English or German unchanged.

```jsx
const items = [
  { id: 'home',  label: t('Home'),     icon: <HomeIcon/> },
  { id: 'rooms', label: t('Rooms'),    icon: <ListIcon/>, badge: 12 },
  { id: 'map',   label: t('Map'),      icon: <PinIcon/> },
  { id: 'saved', label: t('Saved'),    icon: <BookmarkIcon/> },
];

// Adaptive by default — resizes the page to see it switch form:
<AdaptiveNav items={items} active={tab} onSelect={setTab} />

// Force a form for a specimen or a forced-breakpoint preview:
<AdaptiveNav items={items} active={tab} onSelect={setTab} variant="rail" />
```

Place it as the nav region of an app shell: as the **last** child on compact (it renders a fixed-height bottom bar), or as the **first** column (rail/drawer) on medium+. Pair with the `.rf-shell` grid in `tokens/breakpoints.css`, or drive `variant` yourself from a measured width. `header` / `footer` slot a primary action or settings/avatar into the rail and drawer. Breakpoints: 600px (rail) and 840px (drawer) — the same `--bp-medium` / `--bp-expanded` tokens.
