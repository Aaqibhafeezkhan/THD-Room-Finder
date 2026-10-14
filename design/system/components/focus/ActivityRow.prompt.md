Focus activity in a room, under the status card on room detail (D1). Icon,
words and colour together; `role="status"`.

```jsx
<ActivityRow kind="batch" title="AIN 7 · 2 studying" sub="Public sessions · since 09:40"
  action={<FocusButton tone="join">Join</FocusButton>} />
<ActivityRow kind="claimed" title="Focus session · started 25 min ago"
  sub="Someone is studying here. A claim is not a booking, so you can still focus here." />
<ActivityRow kind="unknown" title="Focus activity unknown" />
```

Never say "empty" when activity could not be loaded.
