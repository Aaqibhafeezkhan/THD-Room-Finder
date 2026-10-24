Study together on room detail, under the focus card. While the student's own
focus session runs in this room, a focus-violet circle sits at the pill's left
end: it turns the running session into a study table already in progress
(#153). The label moves right and stays centred in the space that is left.

```jsx
<StudyTogetherButton label="Study together" onClick={openSheet} />
<StudyTogetherButton
  label="Study together"
  onClick={openSheet}
  convert={{ label: 'Invite people to your focus session', onClick: openConversion }}
/>
```

Two buttons, never one with two hit areas: the circle is 48 px and named
for screen readers ("Invite people to your focus session", or "Open the study
table for your session" once it became one). The pill keeps the tonal
secondary container; only the circle is violet. No circle without a running
session here, and none while looking at another time.
