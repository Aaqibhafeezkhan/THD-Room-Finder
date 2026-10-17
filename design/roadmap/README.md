# Roadmap images

The two images in the pinned
[Roadmap discussion](https://github.com/arudaev/THD-Room-Finder/discussions/122):

- `docs/assets/roadmap-banner.jpg` – the campus banner with the title
- `docs/assets/roadmap.png` – the roadmap: milestones and their stories

To update the roadmap, edit [`roadmap.json`](roadmap.json): each story is a
title and a state, `done`, `doing` or `planned`. Then rebuild:

```bash
pip install pillow
python design/roadmap/build.py
```

It uses Segoe UI, so it runs on Windows as is. Keep the titles short; the
issues hold the details.

## Banner art

`art/campus-evening.webp` is the real THD main campus, repainted in the app's
illustration style with OpenAI `gpt-image-2`. The source photo is
[Hauptcampus der Technischen Hochschule Deggendorf 2018](https://commons.wikimedia.org/wiki/File:Hauptcampus_der_Technischen_Hochschule_Deggendorf_2018.jpg)
by Danube-Waidler, licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The repainted
art and the banner are shared under the same licence.

The photo was placed on a 3:2 canvas with room above and below, and the model
was asked to keep its buildings, trees, paths and seats exactly, fill the sky
and lawn, and paint it like `website/assets/hero-day.webp` and
`hero-evening.webp`, with people as flat grey silhouettes like the lecture-hall
illustration. It was told not to add anything that isn't in the photo.
