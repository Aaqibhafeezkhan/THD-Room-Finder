A guest's replies to a study table. The host never sees it.

```jsx
<ReplyBar answer={null} onReply={reply} text={text} />           // Take a seat · Maybe · Can't make it
<ReplyBar answer={null} full onReply={reply} text={text} />      // Full · 6 of 6 disabled, Maybe stays
<ReplyBar answer="seat" onReply={reply} text={text} />           // "You're at this table" · Maybe · Can't
```

`text`: seat, maybe, cant, cantLong, seated, maybeStatus, full. Use `inline`
on wide windows. Can't removes the reply.
