# Posters and stickers

Print material for putting THD Room Finder on campus: bulletin boards,
stickers, and something to show the campus administration.

| File in `out/` | Size | Use |
|---|---|---|
| `thd-room-finder-campus-poster-A4.pdf` | A4, 300 dpi (prints well on A3) | Free rooms, live |
| `thd-room-finder-focus-poster-A4.pdf` | A4, 300 dpi (prints well on A3) | Focus sessions and the focus graph |
| `thd-room-finder-campus-sticker-10cm.pdf` | 10 × 10 cm, 508 dpi | Campus sticker |
| `thd-room-finder-focus-sticker-10cm.pdf` | 10 × 10 cm, 508 dpi | Focus sticker |
| `thd-room-finder-qr.svg` | any | The bare QR code (a PNG is built next to it) |

- **QR code:** opens the install page,
  <https://arudaev.github.io/THD-Room-Finder/>, with error correction H and
  the app icon in the middle. It is 6.5 cm on the posters and 3.4 cm on the
  stickers, and the build decodes every code again after rendering.
- **Printed address:** `thd-room-finder.vercel.app`, the web app, for
  people who type instead of scanning.
- **Text:** English and German. The posters end with "A student project ·
  Ein Studierendenprojekt" so nobody takes them for an official THD service.
- **Stickers:** square, without bleed; add 2–3 mm if the printer asks.

## Rebuilding

```bash
pip install pillow segno opencv-python
python design/print/compose.py
```

[`compose.py`](compose.py) lays the text, icon and QR code over the
illustrations in `art/` and writes `out/` (PNG previews are not
committed). It uses Segoe UI, so it runs on Windows as is. Change the copy
in its `COPY` table.

## The illustrations

Made with OpenAI `gpt-image-2` (image edit, quality high) in the style of
the website's hero art, with the app screenshots as layout references. The
model only paints the scene; all text and the QR code are added by
`compose.py`, because image models garble both.

- **Campus** (`website/assets/hero-day.webp` + `screen-map-light.webp`):
  a stylised isometric bird's-eye view of the campus laid out like the app's
  map, long flat-roofed buildings with glowing teal-green roofs where rooms
  are free, trees, a pond, tiny students; the lower ~40 % fades into calm
  pale lavender for the text.
- **Focus** (`hero-day.webp` + `screen-profile-light.webp`): a sunlit
  classroom, one student at a desk with laptop, book and mug, a glowing grid
  of purple rounded squares on the wall like the focus graph; calm floor in
  the lower ~40 %. A second edit turned the student into a flat, soft
  cool-grey silhouette (about `#9AA0A8`, no shading or detail), matching the
  silhouettes in the batch illustration.

Every prompt also asked for no text, letters, logos, UI or QR codes.
