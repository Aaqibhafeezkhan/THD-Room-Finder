# D2 · Profile tab — first draft (rejected)

| | |
|---|---|
| Claude Design project | [THD Room Finder — Focus (Phase 1)](https://claude.ai/design/p/79245808-3482-40bf-a5f4-eb70ee8e78a5?file=D2+Profile.dc.html) |
| Imported | 2026-10-13 |
| Status | **Rejected.** The session was interrupted before a handback; the direction is wrong. Redo: [05 · D2 message](../../brief/05-d2-message.md) |

Kept as a record of what not to do. The preview server's injected script is
stripped; nothing else is changed. `d2-proposed-tokens.css` (indigo and
orchid focus accents) is not adopted.

## Why it was rejected

| Problem | What the draft did | What D2 must do instead |
|---|---|---|
| **The focus graph is not the graph students know** | A single week of seven violet bars, labelled "stand-in" (the D2 prompt asked for that stand-in; the prompt was wrong) | A GitHub/GitLab-style contribution calendar: square cells, 7 rows (Mon–Sun), one column per week, the **rightmost column is the current week**. Empty days are near-white; more focus means a stronger, darker cell. THD is a technical university: engineers read this graph at a glance |
| **The Profile is crowded** | A settings form: study-profile rows, a sharing segmented control, a "What others see" explainer, graph, saved rooms, appearance and account all on one scroll | Profile shows three things: who you are (one line), your focus graph (the hero) and your saved rooms. Everything else moves to a separate Settings screen behind one gear icon |
| **Explanations everywhere** | Privacy copy repeated inline on the profile | Explain once, where the choice is made: the setup sheet's last step and the sharing setting |
