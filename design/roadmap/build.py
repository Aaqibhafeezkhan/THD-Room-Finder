"""
Builds the roadmap images for the pinned Roadmap discussion.

    docs/assets/roadmap-banner.jpg  the campus banner with the title
    docs/assets/roadmap.png         the roadmap diagram, from roadmap.json

Edit roadmap.json (milestones, stories and their state: done, doing or
planned), then run:

    pip install pillow
    python design/roadmap/build.py

Fonts are Segoe UI, so it runs on Windows as is. The banner art is the real
THD main campus (Wikimedia Commons panorama, CC BY-SA 4.0) repainted in the
app's illustration style; see README.md.
"""
import json
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'docs', 'assets')
FONTS = 'C:/Windows/Fonts/'
BOLD, SEMI, REG = 'segoeuib.ttf', 'seguisb.ttf', 'segoeui.ttf'
NAVY, MUTED = (27, 31, 59), (78, 82, 110)
TEAL, PURPLE, GREY, BLUE = (0, 121, 107), (94, 63, 184), (154, 160, 168), (21, 101, 192)
CHIP = {'Done': (46, 125, 50), 'Wrapping up': TEAL, 'Now': PURPLE, 'Next': BLUE, 'Later': (96, 104, 130)}
ICON = Image.open(os.path.join(REPO, 'public', 'icons', 'app-icon-512.png')).convert('RGBA')


def font(name, size):
    return ImageFont.truetype(FONTS + name, size)


def banner():
    W, H = 3000, 1000
    art = Image.open(os.path.join(HERE, 'art', 'campus-evening.webp')).convert('RGBA')
    s = W / art.width
    art = art.resize((W, int(art.height * s)), Image.LANCZOS)
    top = int(230 * s)
    base = art.crop((0, top, W, top + H))
    # A soft light veil on the left keeps the title readable.
    row = Image.new('L', (W, 1))
    row.putdata([round(max(0.0, min(1.0, (1800 - x) / 900)) * 215) for x in range(W)])
    veil = row.resize((W, H))
    light = Image.new('RGBA', (W, H), (246, 243, 252, 255))
    light.putalpha(veil)
    base.alpha_composite(light)
    base.alpha_composite(ICON.resize((110, 110), Image.LANCZOS), (140, 300))
    d = ImageDraw.Draw(base)
    d.text((276, 355), 'THD Room Finder', font=font(SEMI, 58), fill=NAVY, anchor='lm')
    d.text((140, 440), 'Where we’re heading', font=font(BOLD, 124), fill=NAVY)
    d.text((144, 610), 'Find a free room, focus in it, and study together.', font=font(REG, 50), fill=NAVY)
    base.convert('RGB').save(os.path.join(OUT, 'roadmap-banner.jpg'), quality=88)


def marker(d, cx, cy, kind, r=15):
    if kind == 'done':
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TEAL)
        d.line([(cx - 7, cy + 1), (cx - 2, cy + 6), (cx + 8, cy - 6)], fill='white', width=4, joint='curve')
    elif kind == 'doing':
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=PURPLE, width=4)
        d.pieslice([cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6], -90, 90, fill=PURPLE)
    else:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GREY, width=4)


def diagram():
    data = json.load(open(os.path.join(HERE, 'roadmap.json'), encoding='utf-8'))
    milestones = data['milestones']
    # No heading: the banner above it in the post carries the title.
    W, M, GAP, TOP = 3200, 120, 40, 150
    rows = max(len(m['stories']) for m in milestones)
    BOT = TOP + 200 + rows * 84 + 40
    H = BOT + 100
    base = Image.new('RGBA', (W, H), (236, 233, 248, 255))

    n = len(milestones)
    CW = (W - 2 * M - (n - 1) * GAP) // n
    for i, m in enumerate(milestones):
        x = M + i * (CW + GAP)
        box = (x, TOP, x + CW, BOT)
        sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([x, TOP + 10, x + CW, BOT + 10], radius=44, fill=(40, 30, 90, 50))
        base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)))
        d = ImageDraw.Draw(base)
        d.rounded_rectangle(box, radius=44, fill=(255, 255, 255, 255))
        cf = font(SEMI, 32)
        tw = d.textlength(m['chip'], font=cf)
        d.rounded_rectangle([x + 36, TOP + 36, x + 80 + tw, TOP + 90], radius=27, fill=CHIP[m['chip']])
        d.text((x + 58, TOP + 63), m['chip'], font=cf, fill='white', anchor='lm')
        d.text((x + 36, TOP + 116), m['name'], font=font(BOLD, 48), fill=NAVY)
        y = TOP + 200
        for title, kind in m['stories']:
            fill = {'done': (232, 245, 243), 'doing': (240, 235, 252), 'planned': (246, 247, 250)}[kind]
            d.rounded_rectangle([x + 24, y, x + CW - 24, y + 72], radius=18, fill=fill)
            marker(d, x + 60, y + 36, kind)
            d.text((x + 92, y + 36), title, font=font(REG, 32), fill=NAVY if kind != 'planned' else MUTED, anchor='lm')
            y += 84
        if i < n - 1:
            ax, ay = x + CW + 4, TOP + 63
            d.line([(ax, ay), (ax + GAP - 10, ay)], fill=(150, 140, 200), width=6)
            d.polygon([(ax + GAP - 6, ay), (ax + GAP - 20, ay - 10), (ax + GAP - 20, ay + 10)], fill=(150, 140, 200))

    d = ImageDraw.Draw(base)
    lx, ly = W - M, 75
    for label, kind in reversed([('Done', 'done'), ('In progress', 'doing'), ('Planned', 'planned')]):
        lx -= d.textlength(label, font=font(REG, 34))
        d.text((lx, ly), label, font=font(REG, 34), fill=NAVY, anchor='lm')
        lx -= 34
        marker(d, lx, ly, kind)
        lx -= 64
    base.convert('RGB').save(os.path.join(OUT, 'roadmap.png'), optimize=True)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    banner()
    diagram()
    print('wrote docs/assets/roadmap-banner.jpg and docs/assets/roadmap.png')
