"""Video 2 style frames, round 2: five more candidate styles, same two shots as style_frames.py.

  4 papan  — chalk on a classroom blackboard
  5 catair — ink line + watercolour wash in a sketchbook
  6 komik  — comic page: thick ink, screentone, caption boxes
  7 riso   — two-colour risograph zine (fluoro pink + blue)
  8 pixel  — pixel art, limited palette

  python3 style_frames2.py  →  ../style_samples/<style>_{A,B}.jpg + perbandingan2.jpg
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

from style_frames import (OUT, SUP, HAND, CHALK, F, W, H, put, tspr, BEBAS, BEBAS_P, bike, street_sign, rara, trip,
                          note_sketch, penline, ink, torn_edge_mask, rays_s)
from styles import paper, multiply, watercolorize, grain


# ---------------------------------------------------------------- shared layout
def layout_A(img, draw, title, subtitle):
    """draw(img, sprite, x, y, anchor, role) renders one element in the style."""
    title(img)
    draw(img, trip(820), 860, 1520, 'b', 'past')
    draw(img, street_sign(360, (40, 150, 90), (255, 255, 255), (60, 60, 60)), 160, 660, 'tl', 'sign')
    draw(img, bike(470), 610, 1650, 'b', 'now')
    draw(img, rara(760), 560, 1660, 'b', 'now')
    subtitle(img, ('Kamu tiap hari lewat Jalan Mastrip.', 'Tahu itu nama siapa?'))


def layout_B(img, draw, years, subtitle):
    years(img)
    draw(img, trip(860), 280, 1330, 'b', 'past')
    draw(img, rara(860, phone=True), 800, 1330, 'b', 'now')
    draw(img, note_sketch(380, 'ORI', 'OEANG REPUBLIK INDONESIA', (230, 220, 190)), 280, 1530, 'c', 'past')
    draw(img, note_sketch(380, 'Rp', 'RUPIAH', (200, 220, 245)), 800, 1530, 'c', 'now')
    subtitle(img, ('Uang itu sekarang namanya Rupiah.',))


# ---------------------------------------------------------------- 4 papan tulis kapur
BOARD = (38, 66, 52)
CH_W, CH_Y, CH_B = (238, 238, 228), (250, 225, 110), (150, 205, 240)


def board():
    img = paper(W, H, BOARD, 9)
    r = np.random.default_rng(4)
    smudge = Image.fromarray((r.random((H // 40, W // 40)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    lay = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    lay.putalpha(smudge.point(lambda v: max(0, v - 170) // 3))
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 70, W, H], fill=(120, 85, 50, 255))
    d.rectangle([0, H - 70, W, H - 60], fill=(90, 60, 35, 255))
    return img


def chalky(lay, seed=0):
    """Break up strokes with grain so they read as chalk on a board."""
    r = np.random.default_rng(seed)
    a = np.asarray(lay.getchannel('A'), np.float32)
    n = r.random(a.shape)
    a = a * np.where(n < 0.28, 0.25, 1.0) * (0.75 + 0.25 * r.random(a.shape))
    out = lay.copy()
    out.putalpha(Image.fromarray(a.clip(0, 255).astype(np.uint8)))
    return out


def chalk_draw(img, spr, x, y, anchor, role):
    col = {'past': (200, 200, 190), 'now': CH_W, 'sign': CH_B}[role]
    put(img, chalky(penline(spr, col, w=7, jitter=2, seed=hash(role) % 99)), x, y, anchor=anchor,
        alpha=0.65 if role == 'past' and spr.height < 900 and x > 700 else 1.0)


def chalk_text(img, xy, txt, size, col=CH_W, anchor='mm'):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(lay).text(xy, txt, font=F(CHALK, size), fill=tuple(col) + (255,), anchor=anchor)
    img.alpha_composite(chalky(lay, len(txt)))


def papan_A():
    img = board()
    layout_A(img, chalk_draw,
             lambda im: (chalk_text(im, (540, 200), 'POV: kamu pelajar SMA,', 62),
                         chalk_text(im, (540, 300), 'dan tahunnya 1946.', 62),
                         ImageDraw.Draw(im).ellipse([700, 250, 950, 350], outline=CH_Y + (200,), width=5)),
             lambda im, lines: [chalk_text(im, (540, 1745 + 62 * i), ln, 40, CH_Y) for i, ln in enumerate(lines)])
    return img


def papan_B():
    img = board()
    d = ImageDraw.Draw(img)
    for y in range(140, 1700, 40):
        d.line([540 + 6 * math.sin(y), y, 540 + 6 * math.sin(y + 20), y + 22], fill=CH_W + (180,), width=5)
    layout_B(img, chalk_draw,
             lambda im: (chalk_text(im, (270, 260), '1946', 120, (200, 200, 190)), chalk_text(im, (810, 260), '2026', 120, CH_Y)),
             lambda im, lines: chalk_text(im, (540, 1770), lines[0], 46, CH_Y))
    return img


# ---------------------------------------------------------------- 5 cat air sketsa
SEPIA = (70, 45, 30)


def wc_draw(flat, lines):
    def draw(img, spr, x, y, anchor, role):
        put(flat, spr, x, y, anchor=anchor, alpha=0.75 if role == 'past' else 1.0)
        put(lines, penline(spr, SEPIA, w=5, jitter=1, hatch=False), x, y, anchor=anchor)
    return draw


def wc_text(img, xy, txt, size, col=SEPIA, anchor='mm'):
    ImageDraw.Draw(img).text(xy, txt, font=F(HAND, size), fill=tuple(col) + (255,), anchor=anchor)


def catair(layout, title, sub, washes):
    flat = Image.new('RGBA', (W, H), (255, 253, 248, 255))
    washes(flat)
    lines = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = wc_draw(flat, lines)
    if layout is layout_A:
        layout_A(None, d, lambda im: None, lambda im, l: None)
    else:
        layout_B(None, d, lambda im: None, lambda im, l: None)
    img = watercolorize(flat)
    img.alpha_composite(lines)
    title(img)
    sub(img)
    return img


def catair_A():
    def washes(im):
        d = ImageDraw.Draw(im)
        d.ellipse([-200, 380, 1300, 1500], fill=(250, 215, 160, 255))
        d.rectangle([0, 1600, W, 1720], fill=(190, 190, 200, 255))
    return catair(layout_A,
                  lambda im: (wc_text(im, (540, 200), 'POV: kamu pelajar SMA,', 66), wc_text(im, (540, 290), 'dan tahunnya 1946.', 66, (180, 50, 50))),
                  lambda im: [wc_text(im, (540, 1780 + 60 * i), ln, 46) for i, ln in enumerate(('Kamu tiap hari lewat Jalan Mastrip.', 'Tahu itu nama siapa?'))],
                  washes)


def catair_B():
    def washes(im):
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 540, H], fill=(225, 205, 165, 255))
        d.rectangle([540, 0, W, H], fill=(200, 225, 245, 255))
    return catair(layout_B,
                  lambda im: (wc_text(im, (270, 260), '1946', 120), wc_text(im, (810, 260), '2026', 120, (40, 80, 150))),
                  lambda im: wc_text(im, (540, 1780), 'Uang itu sekarang namanya Rupiah.', 52),
                  washes)


# ---------------------------------------------------------------- 6 komik
KINK = (20, 20, 24)
KYEL = (255, 222, 70)


def screentone(spr, spacing=10, r=2.3):
    """Flat colours + halftone dots in the darker half of the sprite + thick ink outline."""
    a = spr.getchannel('A')
    lum = spr.convert('L')
    dots = Image.new('L', spr.size, 0)
    d = ImageDraw.Draw(dots)
    for y in range(0, spr.height, spacing):
        for x in range((y // spacing % 2) * spacing // 2, spr.width, spacing):
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    dark = ImageChops.multiply(lum.point(lambda v: 255 if v < 150 else 0), a)
    out = spr.copy()
    lay = Image.new('RGBA', spr.size, KINK + (255,))
    lay.putalpha(ImageChops.multiply(dots, dark).point(lambda v: v // 2))
    out.alpha_composite(lay)
    edge = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(9)), a.filter(ImageFilter.MinFilter(3)))
    lay = Image.new('RGBA', spr.size, KINK + (255,))
    lay.putalpha(edge.point(lambda v: 255 if v > 50 else 0))
    pad = Image.new('RGBA', (spr.width + 10, spr.height + 10), (0, 0, 0, 0))
    pad.alpha_composite(out, (5, 5))
    pad.alpha_composite(lay.resize(spr.size), (5, 5))
    return pad


def komik_draw(img, spr, x, y, anchor, role):
    if role == 'past':
        spr = spr.convert('LA').convert('RGBA')
    put(img, screentone(spr), x, y, anchor=anchor)


def caption(img, box, lines, size=44, bg=KYEL, font='Bangers-Regular.ttf'):
    d = ImageDraw.Draw(img)
    d.rectangle(box, fill=tuple(bg) + (255,), outline=KINK + (255,), width=6)
    cy = (box[1] + box[3]) / 2 - (len(lines) - 1) * size * 0.6
    for i, ln in enumerate(lines):
        put(img, tspr(ln, font, size, KINK, shadow=0), (box[0] + box[2]) / 2, cy + i * size * 1.2)


def speed_lines(img, cx, cy):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    r = random.Random(3)
    for i in range(90):
        a = r.uniform(0, 2 * math.pi)
        r0 = r.uniform(520, 700)
        d.line([cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + 1800 * math.cos(a), cy + 1800 * math.sin(a)], fill=(0, 0, 0, 40), width=r.randint(2, 6))
    img.alpha_composite(lay)


def komik_A():
    img = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    speed_lines(img, 560, 1200)
    layout_A(img, komik_draw,
             lambda im: caption(im, (60, 120, 760, 330), ('POV: KAMU PELAJAR SMA,', 'DAN TAHUNNYA 1946.'), 64),
             lambda im, lines: caption(im, (120, 1720, 960, 1880), lines, 40, (255, 255, 255), 'DMSans-Bold.ttf'))
    d = ImageDraw.Draw(img)
    d.rectangle([24, 24, W - 24, H - 24], outline=KINK + (255,), width=12)
    return img


def komik_B():
    img = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 520, H], fill=(235, 228, 210, 255))
    d.rectangle([560, 0, W, H], fill=(225, 238, 250, 255))
    layout_B(img, komik_draw,
             lambda im: (caption(im, (90, 170, 450, 330), ('1946',), 110, (235, 228, 210)), caption(im, (630, 170, 990, 330), ('2026',), 110)),
             lambda im, lines: None)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 1690, W, H], fill=(255, 255, 255, 255))
    d.rectangle([24, 24, 516, 1680], outline=KINK + (255,), width=12)
    d.rectangle([564, 24, W - 24, 1680], outline=KINK + (255,), width=12)
    d.rectangle([24, 1710, W - 24, H - 24], fill=KYEL + (255,), outline=KINK + (255,), width=12)
    put(img, tspr('UANG ITU SEKARANG NAMANYA RUPIAH.', 'Bangers-Regular.ttf', 66, KINK, shadow=0), 540, 1805)
    return img


# ---------------------------------------------------------------- 7 risograph
PINK = np.array([255, 72, 176], np.float32)
BLUE = np.array([0, 120, 191], np.float32)


def riso(layers, seed=0):
    """layers: list of (L-mode coverage image, ink colour). Inks multiply like real riso passes."""
    r = np.random.default_rng(seed)
    out = np.ones((H, W, 3), np.float32) * np.array([247, 242, 232], np.float32)
    for k, (cov, col) in enumerate(layers):
        c = np.asarray(cov, np.float32) / 255
        c = c * (0.82 + 0.18 * r.random(c.shape))                # uneven ink
        c = np.roll(c, (r.integers(-6, 7), r.integers(-6, 7)), axis=(0, 1))   # misregistration
        out *= 1 - c[..., None] * (1 - col / 255)
    out *= (0.97 + 0.03 * r.random((H, W)))[..., None]
    return Image.fromarray(out.clip(0, 255).astype(np.uint8)).convert('RGBA')


def riso_draw(pl, bl):
    def draw(img, spr, x, y, anchor, role):
        lum = spr.convert('L')
        a = spr.getchannel('A')
        dark = ImageChops.multiply(lum.point(lambda v: 255 if v < 150 else 110), a)
        tgt = bl if role in ('now', 'sign') else pl
        lay = Image.new('L', spr.size, 0)
        lay.paste(dark, (0, 0))
        _put_l(tgt, lay, x, y, anchor)
        if role == 'now':     # pink halftone fill under blue = purple overlaps
            _put_l(pl, ImageChops.multiply(a.point(lambda v: v * 3 // 5), _dots(spr.size)), x, y, anchor)
    return draw


def _dots(size, sp=9):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for y in range(0, size[1], sp):
        for x in range(0, size[0], sp):
            d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=255)
    return m


def _put_l(canvas, m, x, y, anchor):
    if anchor == 'b':
        x0, y0 = x - m.width / 2, y - m.height
    elif anchor == 'c':
        x0, y0 = x - m.width / 2, y - m.height / 2
    else:
        x0, y0 = x, y
    canvas.paste(ImageChops.lighter(canvas.crop((int(x0), int(y0), int(x0) + m.width, int(y0) + m.height)), m), (int(x0), int(y0)))


def _text_l(canvas, xy, txt, size, font=BEBAS_P, anchor='mm'):
    ImageDraw.Draw(canvas).text(xy, txt, font=F(font, size), fill=255, anchor=anchor)


def riso_A():
    pl, bl = Image.new('L', (W, H), 0), Image.new('L', (W, H), 0)
    ImageDraw.Draw(pl).ellipse([150, 450, 1250, 1550], fill=70)
    layout_A(None, riso_draw(pl, bl), lambda im: None, lambda im, l: None)
    _text_l(bl, (540, 190), 'POV: KAMU PELAJAR SMA,', 100)
    _text_l(bl, (380, 300), 'DAN TAHUNNYA', 100)
    _text_l(pl, (800, 320), '1946', 190)
    _text_l(bl, (540, 1780), 'Kamu tiap hari lewat Jalan Mastrip.', 46, '/Users/fanny/Library/Fonts/DMSans-Bold.ttf')
    _text_l(bl, (540, 1840), 'Tahu itu nama siapa?', 46, '/Users/fanny/Library/Fonts/DMSans-Bold.ttf')
    return riso([(pl, PINK), (bl, BLUE)], 1)


def riso_B():
    pl, bl = Image.new('L', (W, H), 0), Image.new('L', (W, H), 0)
    ImageDraw.Draw(pl).rectangle([0, 0, 540, H], fill=60)
    ImageDraw.Draw(bl).rectangle([540, 0, W, H], fill=45)
    layout_B(None, riso_draw(pl, bl), lambda im: None, lambda im, l: None)
    _text_l(pl, (270, 300), '1946', 230)
    _text_l(bl, (810, 300), '2026', 230)
    _text_l(bl, (540, 1790), 'UANG ITU SEKARANG NAMANYA RUPIAH.', 82)
    return riso([(pl, PINK), (bl, BLUE)], 2)


# ---------------------------------------------------------------- 8 pixel art
PX = 6
PAL = [(24, 20, 37), (60, 52, 92), (93, 110, 160), (140, 180, 220), (230, 236, 240), (250, 214, 150), (226, 160, 110),
       (180, 80, 60), (210, 50, 60), (60, 140, 90), (120, 200, 120), (250, 240, 200), (120, 110, 100), (180, 175, 165)]


def pixelate(img):
    small = img.convert('RGB').resize((W // PX, H // PX), Image.BOX)
    pal = Image.new('P', (1, 1))
    pal.putpalette([c for rgb in PAL for c in rgb] + [0] * (768 - 3 * len(PAL)))
    q = small.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
    return q.resize((W, H), Image.NEAREST).convert('RGBA')


def px_text(img, xy, txt, size, col=(250, 240, 200), outline=(24, 20, 37)):
    """Text rendered at pixel resolution so it reads as a bitmap font."""
    s = PX
    lay = Image.new('RGBA', (W // s, H // s), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = F('/Users/fanny/Library/Fonts/DMSans-Bold.ttf', max(6, size // s))
    x, y = xy[0] // s, xy[1] // s
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        d.text((x + dx, y + dy), txt, font=f, fill=tuple(outline) + (255,), anchor='mm')
    d.text((x, y), txt, font=f, fill=tuple(col) + (255,), anchor='mm')
    a = np.asarray(lay).copy()
    a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
    img.alpha_composite(Image.fromarray(a).resize((W, H), Image.NEAREST))


def pixel_A():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    from lib import vgrad
    img.alpha_composite(vgrad(W, H, [(0, (93, 110, 160)), (0.55, (250, 214, 150)), (1, (226, 160, 110))]))
    d = ImageDraw.Draw(img)
    for i, x in enumerate(range(0, W, 140)):
        hh = 260 + (i * 97) % 300
        d.rectangle([x, 1450 - hh, x + 120, 1450], fill=(60, 52, 92, 255))
    d.rectangle([0, 1450, W, H], fill=(120, 110, 100, 255))
    d.rectangle([0, 1640, W, 1700], fill=(180, 175, 165, 255))
    layout_A(img, lambda im, spr, x, y, a, role: put(im, spr, x, y, anchor=a, alpha=0.6 if role == 'past' else 1),
             lambda im: None, lambda im, l: None)
    img = pixelate(img)
    px_text(img, (540, 200), 'POV: kamu pelajar SMA,', 84)
    px_text(img, (540, 300), 'dan tahunnya 1946.', 84, (250, 214, 150))
    px_text(img, (540, 1780), 'Kamu tiap hari lewat Jalan Mastrip.', 54)
    px_text(img, (540, 1850), 'Tahu itu nama siapa?', 54)
    return img


def pixel_B():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 540, H], fill=(180, 80, 60, 255))
    d.rectangle([540, 0, W, H], fill=(60, 52, 92, 255))
    d.rectangle([0, 1330, W, H], fill=(24, 20, 37, 255))
    layout_B(img, lambda im, spr, x, y, a, role: put(im, spr, x, y, anchor=a), lambda im: None, lambda im, l: None)
    img = pixelate(img)
    px_text(img, (270, 260), '1946', 200)
    px_text(img, (810, 260), '2026', 200, (250, 214, 150))
    px_text(img, (540, 1780), 'Uang itu sekarang namanya Rupiah.', 56)
    return img


if __name__ == '__main__':
    frames = {'papan': (papan_A, papan_B), 'catair': (catair_A, catair_B), 'komik': (komik_A, komik_B),
              'riso': (riso_A, riso_B), 'pixel': (pixel_A, pixel_B)}
    titles = ['4 · Papan Tulis Kapur', '5 · Cat Air Sketsa', '6 · Komik', '7 · Risograph Zine', '8 · Pixel Art']
    ims = []
    for name, fns in frames.items():
        for tag, fn in zip('AB', fns):
            im = fn().convert('RGB')
            im.save(f'{OUT}/{name}_{tag}.jpg', quality=90)
            ims.append(im.resize((300, 533), Image.LANCZOS))
    cols = 3
    sheet = Image.new('RGB', (cols * 630 + 30, 2 * 620 + 30), (245, 242, 235))
    d = ImageDraw.Draw(sheet)
    for k in range(5):
        x, y = 30 + (k % cols) * 630, 20 + (k // cols) * 620
        d.text((x + 300, y + 30), titles[k], font=F(SUP + 'Futura.ttc', 32), fill=(30, 30, 30), anchor='mm')
        sheet.paste(ims[2 * k], (x, y + 65))
        sheet.paste(ims[2 * k + 1], (x + 300, y + 65))
    sheet.save(f'{OUT}/perbandingan2.jpg', quality=90)
    print('ok')
