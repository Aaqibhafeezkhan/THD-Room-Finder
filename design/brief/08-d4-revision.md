# D4 revision — share as a link

Paste into the **existing D4 chat** (it has the context). Same skills.

---

D4 is approved. Format B is right, and thank you for measuring it. Answers
and one change in direction:

- **Card theme:** follows the app theme, as you built it. No choice in the
  sheet.
- **Grid range:** start the grid at the **first week of the current
  semester** (winter: 1 Oct), so it matches "this semester". Show the whole
  semester (about 26 weeks); days still to come are blank slots, so the card
  keeps the same shape all semester. Keep cells as large as the width allows.
- **Accents:** propose **Violet** (default), **Orchid** and **Graphite**,
  each with a hand-tuned five-step ramp in light and dark, like D2's violet,
  instead of the `color-mix` formula. No blue (the action colour), and no
  teal, amber, red or claimed purple (they carry meaning). Drop the Blue
  demo.

**The change: share a link, not only an image.** The student shares a link
to THD Room Finder, and the chat app shows the card as the link's preview.
The friend taps it and lands in the app. (The link carries the graph itself,
so no server stores anything; that's an engineering detail, not for this
page.)

Update `D4 Share Card.dc.html` and `HANDBACK-D4.md` in place:

1. **Share sheet:** the main action becomes **Share Link** (system share
   sheet with the URL). A secondary text action, **Save Image**, keeps
   today's PNG. Keep the live preview and the two switches. Replace the
   privacy line with: "Anyone with the link sees this card. It never shows
   rooms, times or your programme."
2. **Chat preview mock-ups:** show how the link looks in WhatsApp and
   Discord, once with a 1200×630 preview and once with 1080×1080, light and
   dark. Engineering will test which shape chat apps show large; draw both so
   either can ship.
3. **Landing page** (what the friend sees after tapping, phone and desktop):
   the card, the two figures, one line "Focus sessions in free rooms at THD",
   and one main action **Open THD Room Finder**. No sign-in, nothing else.
4. Keep the fallback: where the system share sheet is missing, the main
   action becomes **Copy Link**, with a snackbar "Link copied".

Same rules as before: phone, tablet, desktop; light and dark; EN and DE;
tokens only; keep it minimal.

---

After the revision, hand the files back to Claude Code ([04 · Handback](04-handback.md)).
