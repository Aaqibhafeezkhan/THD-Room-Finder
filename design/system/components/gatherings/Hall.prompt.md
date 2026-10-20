A gathering's picture: the room set up for its kind, the room code where the
front is, and one dot per person in reply order.

```jsx
<Hall kind="games" capacity={48} replies="gggmgg…" code="I112" title="I 112: 21 going, 7 maybe" />
<Hall kind="talk" capacity={120} replies="gmgggm" code="A008" title="A 008: 4 going, 2 maybe" />
<Hall kind="focus" capacity={36} replies={replies} code="E001" title="…" />
<Hall kind="meeting" capacity={40} replies={replies} code="C105" title="…" />
```

Kinds: `focus` round tables of 6 · `games` long tables of 8 · `talk` a half
circle facing the stage · `meeting` rows facing the front. `replies` is the
service's `g`/`m` string. Going is violet, maybe light violet, free places
faint, so early replies read as a start. Over 120 places one dot stands for
two. It fills its container up to `width`; use 296 on phones, 480 beside the
details on wide windows. Never a seat map: nobody's dot is marked.
