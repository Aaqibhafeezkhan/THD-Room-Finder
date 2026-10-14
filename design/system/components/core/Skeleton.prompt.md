Static loading placeholder (D2, D3): flat surface-variant blocks, no shimmer.
`aria-busy` with a visually hidden status line.

```jsx
<Skeleton label="Checking rooms…" blocks={[72, 72, 72]} />
```

Room detail hides Start focus until the status has loaded, because a lecture
means no focus action.
