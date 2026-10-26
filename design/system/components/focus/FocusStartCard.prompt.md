The two places on the Focus tab (ADR 0011). `FocusStartCard` starts focus at
home: a violet house well, one line on what it means, the Start focus button
and a row per choice for this session (rhythm, sounds), each with Change.
`OnCampusCard` leads to the room finder with the campus right now: a teal
building well, "38 rooms free now" or "Classroom buildings closed · opens
Tue 06:30", and one text action. Violet stays "your focus", teal "free on
campus"; no new colours, no imagery.

```jsx
<FocusStartCard title="At home" line="Only you see it. It counts in your focus graph."
  startLabel="Start focus at home"
  choices={[{ icon: <IconTimer size={16} />, strong: 'Pomodoro', rest: '25 min focus, 5 min break', changeLabel: 'Change' }]} />
<OnCampusCard title="On campus" line="Classroom buildings closed · opens Tue 06:30" actionLabel="Plan" />
```
