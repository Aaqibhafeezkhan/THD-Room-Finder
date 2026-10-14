One line on the inverse surface (D4: "Link shared", "Link copied", "Image
saved · focus-graph.png"). `role="status"`, no action, focus never moves,
closes itself after 4 s.

```jsx
<Snackbar message="Link copied" bottom={96} onClose={clear} />
```

On phones pass `bottom` so it clears the navigation bar.
