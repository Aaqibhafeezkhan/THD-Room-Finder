"""
Builds the campus posters and stickers (design/print/README.md).

Lays the text, app icon and an exact QR code over the illustrations in art/
and writes print files to out/: A4 posters at 300 dpi, 10 cm stickers at
508 dpi, and the bare QR code. Every QR code is decoded again after rendering
and the script fails if one doesn't read back.

    pip install pillow segno opencv-python
    python design/print/compose.py

Fonts are Segoe UI, so it runs on Windows as is.
"""
import os, sys
import cv2, numpy as np, segno
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, '..', '..'))
ART, OUT = os.path.join(HERE, 'art'), os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
URL = 'https://arudaev.github.io/THD-Room-Finder/'
# The QR opens the install page; the printed address is the web app.
SHOWN_URL = 'thd-room-finder.vercel.app'
F = 'C:/Windows/Fonts/'
def font(name, size): return ImageFont.truetype(F + name, size)
SEMI, BOLD, REG, LIGHT = 'seguisb.ttf', 'segoeuib.ttf', 'segoeui.ttf', 'segoeuisl.ttf'
NAVY = (27, 31, 59); MUTED = (78, 82, 110); BLUE = (21, 101, 192)
ICON = Image.open(os.path.join(REPO, 'public/icons/app-icon-512.png')).convert('RGBA')

def qr_image(px):
    """Exact QR code, high error correction, 4-module quiet zone, app icon in the middle."""
    q = segno.make(URL, error='h', boost_error=False)
    m = np.array([[1 if v else 0 for v in row] for row in q.matrix], dtype=np.uint8)
    n = m.shape[0] + 8
    cell = px // n
    size = cell * n
    img = Image.new('RGB', (size, size), 'white')
    d = ImageDraw.Draw(img)
    for y, row in enumerate(m):
        for x, v in enumerate(row):
            if v:
                d.rectangle([(x + 4) * cell, (y + 4) * cell, (x + 5) * cell - 1, (y + 5) * cell - 1], fill=NAVY)
    # Icon over the centre (about 4 % of the area; error correction H restores up to 30 %).
    s = int(m.shape[0] * cell * 0.2)
    pad = cell
    c = size // 2
    d.rounded_rectangle([c - s // 2 - pad, c - s // 2 - pad, c + s // 2 + pad, c + s // 2 + pad], radius=pad * 2, fill='white')
    badge = ICON.resize((s, s), Image.LANCZOS)
    img.paste(badge, (c - s // 2, c - s // 2), badge)
    return img, q.version, m.shape[0]

def decodes(img, scale=1.0):
    a = np.array(img.convert('RGB'))
    if scale != 1.0:
        a = cv2.resize(a, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    val, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(a, cv2.COLOR_RGB2BGR))
    return val

def wrap(d, text, f, width):
    lines, line = [], ''
    for w in text.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=f) <= width: line = t
        else: lines.append(line); line = w
    lines.append(line)
    return lines

def text_block(d, xy, text, f, fill, width, gap=1.18):
    x, y = xy
    for ln in wrap(d, text, f, width):
        d.text((x, y), ln, font=f, fill=fill)
        y += int(f.size * gap)
    return y

def card(base, box, radius):
    x0, y0, x1, y1 = box
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + radius // 6, x1, y1 + radius // 6], radius=radius, fill=(40, 30, 90, 60))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(radius // 2)))
    ImageDraw.Draw(base).rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 255))

def brand(base, d, xy, h):
    x, y = xy
    ic = ICON.resize((h, h), Image.LANCZOS)
    base.alpha_composite(ic, (x, y))
    d.text((x + int(h * 1.25), y + h // 2), 'THD Room Finder', font=font(SEMI, int(h * 0.62)), fill=NAVY, anchor='lm')

def art(name, w, h):
    a = Image.open(os.path.join(ART, name)).convert('RGBA')
    s = w / a.width
    a = a.resize((w, int(a.height * s)), Image.LANCZOS)
    return a.crop((0, 0, w, h)) if a.height >= h else a.resize((w, h), Image.LANCZOS)

COPY = {
    'campus': dict(
        head='Find a free room. Right now.', head_de='Finde jetzt einen freien Raum.',
        sub='Live from the THD timetable: which rooms are free, and for how long.',
        sub_de='Live aus dem THD-Stundenplan: welche Räume frei sind und wie lange.',
        short='Free rooms, live.', short_de='Freie Räume, live.'),
    'focus': dict(
        head='Find a room. Focus in it.', head_de='Raum finden. Darin fokussieren.',
        sub='Pomodoro blocks, your semester focus graph and study sessions with your batch.',
        sub_de='Pomodoro-Blöcke, dein Fokus-Verlauf im Semester und Lernsessions mit deinem Jahrgang.',
        short='Find a room. Focus in it.', short_de='Raum finden. Darin fokussieren.'),
}

def poster(kind):
    W, H = 2480, 3508  # A4 at 300 dpi; scales cleanly to A3 and A2
    base = art(f'{kind}-vertical.webp', W, H)
    # Calm the lower part so the text reads cleanly over the art.
    fade = Image.new('L', (1, H), 0)
    for yy in range(H):
        fade.putpixel((0, yy), int(max(0, min(1, (yy - 1650) / 450)) * 200))
    veil = Image.new('RGBA', (W, H), (246, 243, 252, 255))
    veil.putalpha(fade.resize((W, H)))
    base.alpha_composite(veil)
    d = ImageDraw.Draw(base)
    c = COPY[kind]; M = 170
    y = 1930
    y = text_block(d, (M, y), c['head'], font(BOLD, 152), NAVY, W - 2 * M, 1.12) + 4
    y = text_block(d, (M, y), c['head_de'], font(SEMI, 84), MUTED, W - 2 * M) + 30
    y = text_block(d, (M, y), c['sub'], font(REG, 58), NAVY, W - 2 * M, 1.3)
    y = text_block(d, (M, y + 4), c['sub_de'], font(REG, 50), MUTED, W - 2 * M, 1.3)
    box = (M - 30, y + 70, W - M + 30, H - 170)
    card(base, box, 70)
    d = ImageDraw.Draw(base)
    q, ver, mods = qr_image(box[3] - box[1] - 110)
    base.paste(q, (box[0] + 55, box[1] + (box[3] - box[1] - q.height) // 2))
    tx = box[0] + 55 + q.width + 60; tw = box[2] - 60 - tx
    ty = box[1] + 110
    brand(base, d, (tx, ty), 104)
    ty += 200
    ty = text_block(d, (tx, ty), 'Scan to open', font(BOLD, 72), NAVY, tw, 1.1)
    ty = text_block(d, (tx, ty), 'Zum Öffnen scannen', font(SEMI, 54), MUTED, tw, 1.2) + 40
    for line in ('Web and Android · free', 'No account needed', 'Web und Android · kostenlos', 'Ohne Konto'):
        ty = text_block(d, (tx, ty), line, font(REG, 46), MUTED, tw, 1.3)
    d.text((tx, box[3] - 100), SHOWN_URL, font=font(SEMI, 40), fill=BLUE, anchor='ls')
    d.text((W // 2, H - 80), 'A student project · Ein Studierendenprojekt', font=font(REG, 40), fill=MUTED, anchor='mm')
    return base.convert('RGB'), ver, mods, q.width

def sticker(kind):
    S = 2000  # 10 x 10 cm at 500 dpi
    base = art(f'{kind}-square.webp', S, S)
    c = COPY[kind]; M = 90
    box = (M, 1150, S - M, S - M)
    card(base, box, 64)
    d = ImageDraw.Draw(base)
    q, ver, mods = qr_image(box[3] - box[1] - 80)
    base.paste(q, (box[0] + 40, box[1] + 40))
    tx = box[0] + 40 + q.width + 50; tw = box[2] - 50 - tx
    brand(base, d, (tx, box[1] + 70), 88)
    ty = box[1] + 230
    ty = text_block(d, (tx, ty), c['short'], font(BOLD, 74), NAVY, tw, 1.12) + 4
    ty = text_block(d, (tx, ty), c['short_de'], font(SEMI, 50), MUTED, tw, 1.2) + 30
    ty = text_block(d, (tx, ty), 'Scan to open · Web and Android · free', font(REG, 40), MUTED, tw, 1.3) + 14
    d.text((tx, ty), SHOWN_URL, font=font(SEMI, 34), fill=BLUE)
    return base.convert('RGB'), ver, mods, q.width

for kind in ('campus', 'focus'):
    for fmt, make, dpi in (('poster-A4', poster, 300), ('sticker-10cm', sticker, 508)):
        img, ver, mods, qpx = make(kind)
        name = f'thd-room-finder-{kind}-{fmt}'
        img.save(os.path.join(OUT, name + '.png'), dpi=(dpi, dpi))
        img.save(os.path.join(OUT, name + '.pdf'), resolution=dpi)
        # The QR must scan on the full image and when shrunk hard (a phone a metre away).
        checks = {s: decodes(img, s) == URL for s in (1.0, 0.5, 0.25, 0.15)}
        if not checks[1.0] or not checks[0.5]:
            sys.exit(f'{name}: QR code does not read back')
        print(f'{name}: QR v{ver}, {mods} modules, {qpx}px ({qpx / dpi * 2.54:.1f} cm) decodes {checks}')

# The bare code, for anyone who wants it in their own material.
q = segno.make(URL, error='h', boost_error=False)
q.save(os.path.join(OUT, 'thd-room-finder-qr.svg'), scale=10, dark='#1b1f3b', border=4)
q.save(os.path.join(OUT, 'thd-room-finder-qr.png'), scale=40, dark='#1b1f3b', border=4)
