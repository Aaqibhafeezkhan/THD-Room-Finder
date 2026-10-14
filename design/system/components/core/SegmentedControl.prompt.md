Single-choice segmented control, a `radiogroup` with arrow-key movement (D1).
`tone="focus"` sits on violet surfaces (Private | Public in the focus surface);
`tone="primary"` is the neutral version (settings, language).

```jsx
<SegmentedControl tone="focus" label="Who sees this session" value="private"
  options={[{ id: 'private', label: 'Private' }, { id: 'public', label: 'Public · AIN 7' }]} />
```

Segments wrap onto a new line instead of truncating, so German fits. 40px
segments, 28px radius, selected segment filled.
