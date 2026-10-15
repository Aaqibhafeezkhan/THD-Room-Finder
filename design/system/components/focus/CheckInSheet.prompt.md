"Break's over in E 212" (ADR 0004), shown on any other screen when a break
ends and the next block waits for an answer; in the Open rhythm it asks
"Still focusing in E 212?" every hour. The start action is the main one and
takes initial focus; with no answer within 10 minutes the session ends at
the end of the last block.

```jsx
<CheckInSheet open title="Break's over in E 212" meta="Block 3 of 3 · E 212"
  body="No answer by 11:40 ends the session."
  endLabel="End" keepLabel="Start Block 3" variant="sheet" />
```
