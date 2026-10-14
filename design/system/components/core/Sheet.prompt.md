Modal surface: a bottom sheet on phones (`variant="sheet"`), a centred dialog
on tablet and desktop (`variant="dialog"`). Scrim at 32% black; Escape and the
scrim close it; Tab stays inside; focus goes to the element marked
`data-autofocus`.

```jsx
<Sheet open label="Share focus graph" variant="sheet" onClose={close}>…</Sheet>
```

Use `contained` inside device frames and specimens. No slide under reduced
motion.
