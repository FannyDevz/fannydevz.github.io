"""Video 2 style frames: the same two shots drawn in three candidate styles.

  A — hook: Jalan Mastrip sign, Rara with her bicycle, a 1946 student-soldier echo behind him.
  B — signature: 1946 (TRIP student, ORI) and 2026 (Rara, Rupiah) across a torn page.

  python3 style_frames.py  →  ../style_samples/{buku,sablon,wayang}_{A,B}.jpg + perbandingan.jpg
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../Video 1/build'))
from lib import W, H, put, usprite, fighter, figure, youth, vgrad, radial, vignette, tspr, BEBAS  # noqa: E402
from styles import paper, multiply, grain, ornament, gunungan  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '../style_samples')
SUP = '/System/Library/Fonts/Supplemental/'
HAND = SUP + 'Bradley Hand Bold.ttf'
CHALK = SUP + 'Chalkduster.ttf'


def F(path, size):
    return ImageFont.truetype(path, size)


# ---------------------------------------------------------------- shared shapes
def bike(w, col=(30, 30, 30)):
    c = tuple(col) + (255,)

    def fn(u):
        for cx in (22, 78):
            u.E(cx - 19, 41, cx + 19, 79, c)
            u.E(cx - 15.5, 44.5, cx + 15.5, 75.5, (0, 0, 0, 0))
            u.E(cx - 2, 58, cx + 2, 62, c)
        u.L([(22, 60), (44, 60), (60, 36), (36, 36), (22, 60)], 2.4, c)
        u.L([(44, 60), (33, 30)], 2.4, c)
        u.L([(60, 36), (78, 60)], 2.4, c)
        u.L([(60, 36), (58, 24), (66, 22)], 2.4, c)
        u.L([(28, 29), (38, 29)], 3.2, c)
    return usprite(w * 0.8, fn, wmul=1.25)


def street_sign(w, plate=(20, 110, 70), text=(255, 255, 255), pole=(70, 70, 70), font=None, label='JL. MASTRIP'):
    h = int(w * 0.32)
    im = Image.new('RGBA', (w, h + 900), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([w / 2 - 12, h - 10, w / 2 + 12, h + 900], fill=tuple(pole) + (255,))
    d.rounded_rectangle([0, 0, w, h], radius=18, fill=tuple(plate) + (255,))
    d.rounded_rectangle([10, 10, w - 10, h - 10], radius=12, outline=tuple(text) + (255,), width=5)
    f = font or F(SUP + 'Futura.ttc', int(h * 0.48))
    d.text((w / 2, h / 2), label, font=f, fill=tuple(text) + (255,), anchor='mm')
    return im


def rara(h, phone=False, salute=False):
    """Rara: SMA uniform (white blouse, grey skirt), shoulder-length hair, backpack strap; optional phone or salute."""
    skin = (226, 176, 134, 255)
    hair = (28, 22, 20, 255)
    shirt = (248, 248, 244, 255)
    skirt = (110, 116, 128, 255)
    bag = (40, 70, 130, 255)

    def fn(u):
        u.L([(45.5, 76), (45.5, 92)], 5.2, skin)                 # legs below the skirt
        u.L([(54.5, 76), (54.5, 92)], 5.2, skin)
        u.R(39.5, 91.5, 48.5, 97, (30, 30, 30, 255), 2.2)
        u.R(51.5, 91.5, 60.5, 97, (30, 30, 30, 255), 2.2)
        u.poly([(39, 55), (61, 55), (64.5, 79), (35.5, 79)], skirt)   # knee-length skirt
        if not salute:
            u.L([(38.5, 31), (34.5, 45), (34, 54)], 6.4, shirt)
            u.E(31, 52.5, 37, 58.5, skin)
        if phone:
            u.L([(61.5, 31), (66, 42), (58, 40)], 6.4, shirt)
            u.R(53, 33, 60, 45, (25, 25, 30, 255), 1.2)
            u.R(54, 34.5, 59, 43.5, (120, 190, 255, 255), 0.6)
            u.E(55.5, 38, 61.5, 44, skin)
        else:
            u.L([(61.5, 31), (65.5, 45), (66, 54)], 6.4, shirt)
            u.E(63, 52.5, 69, 58.5, skin)
        u.R(40.5, 6, 59.5, 33, hair, 6)                          # hair falling to the shoulders, behind
        u.R(46.5, 21, 53.5, 31, skin)                            # neck, under the collar
        u.R(38.5, 28, 61.5, 57, shirt, 5)
        u.L([(42.5, 28), (40.5, 56)], 2.2, bag)
        u.R(56, 34, 59.5, 36, (90, 90, 100, 255))               # generic school badge
        u.E(41, 2.5, 59, 18, hair)
        u.E(42.5, 6, 57.5, 25, skin)
        u.poly([(41.5, 14), (42.5, 6), (49, 3), (56, 4), (58.5, 9), (58.5, 15), (55, 9), (50, 8.5), (45, 9.5), (43, 13)], hair)
        dark = (40, 26, 22, 255)
        u.E(45.4, 14.6, 47.6, 17.4, dark)
        u.E(52.4, 14.6, 54.6, 17.4, dark)
        u.arc(47, 17.5, 53, 22, 25, 155, (170, 60, 60, 255), 0.9)
        if salute:                                               # right hand raised to the forehead
            u.L([(39.5, 31), (30, 23), (40.5, 11.5)], 6.0, shirt)
            u.E(38.5, 8, 45.5, 14.5, skin)
    return usprite(h, fn)


def trip(h):
    """1946 student-soldier: school shirt, peci, rifle on the shoulder (no insignia)."""
    skin = (210, 160, 120, 255)
    shirt = (236, 228, 205, 255)
    pants = (120, 105, 80, 255)
    dark = (35, 28, 24, 255)

    def fn(u):
        u.L([(45.5, 60), (44.5, 93)], 7.5, pants)
        u.L([(54.5, 60), (55.5, 93)], 7.5, pants)
        u.R(38.5, 91.5, 48.5, 97, dark, 2.2)
        u.R(51.5, 91.5, 61.5, 97, dark, 2.2)
        u.L([(66, 6), (60, 70)], 2.2, (90, 60, 35, 255))        # rifle
        u.L([(61.5, 60), (60, 72)], 3.5, (90, 60, 35, 255))
        u.L([(38.5, 31), (34.5, 45), (34, 56)], 6.8, shirt)
        u.L([(61.5, 31), (66, 38), (63, 30)], 6.8, shirt)
        u.E(30.8, 54.5, 37.2, 61, skin)
        u.R(46.5, 21, 53.5, 31, skin)                     # neck, under the collar
        u.R(38, 28, 62, 58, shirt, 5)
        u.R(40, 55, 60, 60, (90, 70, 45, 255), 1)
        u.E(42, 6, 58, 25.5, skin)
        u.R(42.3, 2.5, 57.7, 10.5, dark, 1.5)                   # peci
        u.E(45.2, 14.6, 47.6, 17.6, dark)
        u.E(52.4, 14.6, 54.8, 17.6, dark)
        u.L([(46.5, 21), (53.5, 21)], 0.8, (140, 70, 55, 255))
    return usprite(h, fn)


def note_sketch(w, label, sub, col):
    """Stylised banknote outline: NOT a reproduction of real ORI/Rupiah notes."""
    h = int(w * 0.48)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([4, 4, w - 4, h - 4], radius=14, fill=tuple(col) + (255,), outline=(40, 40, 40, 255), width=4)
    d.ellipse([w * 0.62, h * 0.18, w * 0.62 + h * 0.64, h * 0.82], outline=(40, 40, 40, 200), width=3)
    d.text((24, 18), label, font=F(SUP + 'Futura.ttc', int(h * 0.2)), fill=(40, 40, 40, 255))
    d.text((24, h - 22), sub, font=F(SUP + 'Futura.ttc', int(h * 0.11)), fill=(40, 40, 40, 255), anchor='ls')
    d.text((w * 0.62 + h * 0.32, h / 2), 'SPESIMEN', font=F(SUP + 'Futura.ttc', int(h * 0.09)), fill=(40, 40, 40, 255), anchor='mm')
    return im


# ---------------------------------------------------------------- style 1: buku tulis
INKB = (30, 60, 170)
PENCIL = (110, 110, 118)
STABILO = (255, 236, 60)


def notebook():
    img = paper(W, H, (250, 247, 236), 6)
    d = ImageDraw.Draw(img)
    for y in range(260, H, 64):
        d.line([0, y, W, y], fill=(150, 185, 225, 255), width=2)
    d.line([130, 0, 130, H], fill=(225, 110, 110, 255), width=3)
    for y in range(90, H, 150):
        d.ellipse([34, y, 70, y + 36], fill=(225, 220, 205, 255))
    return img


def penline(spr, col, w=5, jitter=2, seed=0, hatch=True):
    """Turn a flat sprite into a ballpoint drawing: outline + interior edges + light hatching."""
    a = spr.getchannel('A')
    outer = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(w)), a.filter(ImageFilter.MinFilter(3)))
    lum = spr.convert('L')
    inner = lum.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 28 else 0)
    inner = ImageChops.multiply(inner, a.filter(ImageFilter.MinFilter(5))).filter(ImageFilter.MaxFilter(3))
    m = ImageChops.lighter(outer.point(lambda v: 255 if v > 60 else 0), inner)
    out = Image.new('RGBA', spr.size, (0, 0, 0, 0))
    r = random.Random(seed)
    for k in range(2):        # doubled stroke, slightly offset = hand-drawn
        lay = Image.new('RGBA', spr.size, tuple(col) + (int(230 - 70 * k),))
        lay.putalpha(m.point(lambda v: int(v * (0.95 - 0.4 * k))))
        out.alpha_composite(lay, (r.randint(-jitter, jitter), r.randint(-jitter, jitter)))
    if hatch:
        dark = lum.point(lambda v: 255 if v < 140 else 0)
        dark = ImageChops.multiply(dark, a)
        hl = Image.new('L', spr.size, 0)
        hd = ImageDraw.Draw(hl)
        for x in range(-spr.height, spr.width, 11):
            hd.line([x, spr.height, x + spr.height, 0], fill=150, width=2)
        hl = ImageChops.multiply(hl, dark)
        lay = Image.new('RGBA', spr.size, tuple(col) + (255,))
        lay.putalpha(hl)
        out.alpha_composite(lay)
    return out


def stabilo(img, box, col=STABILO, a=150):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(lay).polygon([(x0, y0 + 6), (x1, y0), (x1 + 4, y1 - 4), (x0 - 2, y1)], fill=tuple(col) + (a,))
    img.alpha_composite(lay)


def hand(img, xy, txt, size, col=INKB, font=HAND, anchor='la', mark=None):
    d = ImageDraw.Draw(img)
    f = F(font, size)
    if mark:
        bb = d.textbbox(xy, mark, font=f, anchor=anchor)
        stabilo(img, (bb[0] - 8, bb[1] + size * 0.15, bb[2] + 8, bb[3] + 6))
    d.text(xy, txt, font=f, fill=tuple(col) + (255,), anchor=anchor)


def buku_A():
    img = notebook()
    hand(img, (170, 300), 'POV:', 70)
    hand(img, (170, 395), 'kamu pelajar SMA,', 78)
    f = F(HAND, 78)
    d = ImageDraw.Draw(img)
    x = 170 + d.textlength('dan tahunnya ', font=f)
    stabilo(img, (x - 6, 505, x + d.textlength('1946.', font=f) + 6, 575))
    hand(img, (170, 490), 'dan tahunnya 1946.', 78)
    put(img, penline(trip(820), PENCIL, seed=3), 860, 1520, anchor='b', alpha=0.55)
    hand(img, (930, 690), '1946', 46, PENCIL)
    stabilo(img, (165, 668, 515, 790), (110, 230, 150), 120)
    put(img, penline(street_sign(360, (40, 150, 90), (255, 255, 255), (60, 60, 60)), INKB, seed=1, hatch=False), 160, 660, anchor='tl')
    put(img, penline(bike(470), INKB, seed=2, hatch=False), 610, 1650, anchor='b')
    put(img, penline(rara(760), INKB, seed=4), 560, 1660, anchor='b')
    hand(img, (380, 960), '2026', 46)
    d.line([440, 1000, 500, 1040], fill=INKB + (255,), width=3)
    # subtitle written on the page margin
    hand(img, (540, 1770), 'Kamu tiap hari lewat Jalan Mastrip.', 52, anchor='mm')
    hand(img, (540, 1840), 'Tahu itu nama siapa?', 52, anchor='mm')
    return img


def torn_edge_mask(seed, x=540, amp=26):
    r = random.Random(seed)
    m = Image.new('L', (W, H), 0)
    pts = [(0, 0), (x, 0)]
    y = 0
    while y < H:
        y += r.randint(30, 70)
        pts.append((x + r.uniform(-amp, amp), y))
    pts += [(0, H)]
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return m


def buku_B():
    right = notebook()
    left = multiply(notebook(), Image.new('RGBA', (W, H), (238, 226, 196, 255)))     # yellowed old page
    img = right.copy()
    m = torn_edge_mask(5)
    img.paste(left, (0, 0), m)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sh.putalpha(ImageChops.subtract(m.filter(ImageFilter.MaxFilter(15)), m).filter(ImageFilter.GaussianBlur(6)).point(lambda v: v // 2))
    img.alpha_composite(sh)
    hand(img, (270, 300), '1946', 110, PENCIL, anchor='mm')
    hand(img, (810, 300), '2026', 110, INKB, anchor='mm', mark='2026')
    put(img, penline(trip(900), PENCIL, seed=7), 280, 1350, anchor='b')
    put(img, penline(rara(900, phone=True), INKB, seed=8), 800, 1350, anchor='b')
    put(img, penline(note_sketch(400, 'ORI', 'OEANG REPUBLIK INDONESIA', (230, 220, 190)), PENCIL, seed=9, hatch=False), 280, 1500, rot=6)
    put(img, penline(note_sketch(400, 'Rp', 'RUPIAH', (200, 220, 245)), INKB, seed=10, hatch=False), 800, 1500, rot=-6)
    stabilo(img, (610, 1440, 760, 1520))
    hand(img, (540, 1760), 'Uang itu sekarang namanya Rupiah.', 56, anchor='mm')
    return img


# ---------------------------------------------------------------- style 2: poster sablon
CREAMS = (240, 228, 200)
REDS = (200, 40, 40)
NAVYS = (30, 40, 70)


def ink(spr, col):
    out = Image.new('RGBA', spr.size, tuple(col) + (255,))
    out.putalpha(spr.getchannel('A'))
    return out


def two_tone(spr, light, darkc, cut=150):
    """Posterize a sprite into two inks."""
    lum = spr.convert('L')
    a = spr.getchannel('A')
    lo = ImageChops.multiply(lum.point(lambda v: 255 if v < cut else 0), a)
    out = ink(spr, light)
    d = Image.new('RGBA', spr.size, tuple(darkc) + (255,))
    d.putalpha(lo)
    out.alpha_composite(d)
    return out


def screen_tex(img, seed=0):
    r = np.random.default_rng(seed)
    a = np.asarray(img.convert('RGB'), np.float32)
    spk = r.random(a.shape[:2]) < 0.012
    a[spk] = a[spk] * 0.35 + np.array(CREAMS) * 0.65
    low = np.asarray(Image.fromarray((r.random((H // 6, W // 6)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
    a = a * (0.94 + 0.06 * low[..., None])
    return Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert('RGBA')


def misreg(img, spr, x, y, cols, off=(7, 5), anchor='b'):
    put(img, ink(spr, cols[1]), x + off[0], y + off[1], anchor=anchor, alpha=0.9)
    put(img, spr, x, y, anchor=anchor)


def rays_s(cx, cy, n, col, a0=0):
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for i in range(n):
        t0 = a0 + i * 2 * math.pi / n
        t1 = t0 + math.pi / n
        d.polygon([(cx, cy), (cx + 3000 * math.cos(t0), cy + 3000 * math.sin(t0)), (cx + 3000 * math.cos(t1), cy + 3000 * math.sin(t1))], fill=tuple(col) + (255,))
    return lay


def sub(img, col, lines=('Kamu tiap hari lewat Jalan Mastrip.', 'Tahu itu nama siapa?'), y=1790):
    for i, ln in enumerate(lines):
        put(img, tspr(ln, 'DMSans-Bold.ttf', 46, col, shadow=0.5 if col != CREAMS else 0), 540, y + 62 * i)


def sablon_A():
    img = Image.new('RGBA', (W, H), CREAMS + (255,))
    img.alpha_composite(rays_s(780, 1050, 16, (232, 205, 160)))
    put(img, ink(trip(1000), REDS), 780, 1500, anchor='b')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 1500, W, H], fill=NAVYS + (255,))
    misreg(img, two_tone(street_sign(400, NAVYS, CREAMS, NAVYS, F(BEBAS_P, 96)), CREAMS, NAVYS), 240, 1500, (CREAMS, REDS))
    misreg(img, two_tone(bike(460, NAVYS), NAVYS, NAVYS), 560, 1640, (NAVYS, REDS))
    misreg(img, two_tone(rara(720), CREAMS, NAVYS), 450, 1650, (CREAMS, REDS))
    put(img, tspr('POV: KAMU PELAJAR SMA,', BEBAS, 100, NAVYS, shadow=0), 540, 190)
    put(img, tspr('DAN TAHUNNYA', BEBAS, 100, NAVYS, shadow=0), 540, 290)
    put(img, tspr('1946', BEBAS, 230, REDS, shadow=0), 760, 440)
    sub(img, CREAMS)
    return screen_tex(img, 1)


BEBAS_P = '/Users/fanny/Library/Fonts/BebasNeue-Regular.ttf'


def sablon_B():
    img = Image.new('RGBA', (W, H), CREAMS + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 540, H], fill=REDS + (255,))
    d.rectangle([540, 0, W, H], fill=NAVYS + (255,))
    img.alpha_composite(rays_s(540, 1250, 24, (255, 255, 255), 0.05).point(lambda v: v) if False else Image.new('RGBA', (W, H), (0, 0, 0, 0)))
    put(img, tspr('1946', BEBAS, 260, CREAMS, shadow=0), 270, 330)
    put(img, tspr('2026', BEBAS, 260, CREAMS, shadow=0), 810, 330)
    misreg(img, two_tone(trip(880), CREAMS, NAVYS), 280, 1330, (CREAMS, NAVYS))
    misreg(img, two_tone(rara(880, phone=True), CREAMS, REDS), 800, 1330, (CREAMS, REDS))
    misreg(img, two_tone(note_sketch(380, 'ORI', 'OEANG REPUBLIK INDONESIA', CREAMS), CREAMS, NAVYS), 280, 1600, (CREAMS, NAVYS), anchor='c')
    misreg(img, two_tone(note_sketch(380, 'Rp', 'RUPIAH', CREAMS), CREAMS, REDS), 800, 1600, (CREAMS, REDS), anchor='c')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 1730, W, 1880], fill=CREAMS + (255,))
    put(img, tspr('UANG ITU SEKARANG NAMANYA RUPIAH.', BEBAS, 92, NAVYS, shadow=0), 540, 1805)
    return screen_tex(img, 2)


# ---------------------------------------------------------------- style 3: wayang
SIL = (28, 14, 8)


def kelir():
    img = vgrad(W, H, [(0, (40, 14, 6)), (1, (25, 8, 4))])
    img.alpha_composite(radial(W, H, 540, 900, 950, (255, 190, 100), 255, 1.2))
    img.alpha_composite(radial(W, H, 540, 900, 520, (255, 236, 190), 220, 1.5))
    return img


def shadow(spr, blur=2.0, orn=True):
    s = ink(spr, SIL)
    if orn:
        s = ornament(s, 16, 2.6)
    return s.filter(ImageFilter.GaussianBlur(blur))


def floor(img):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 1640, W, H], fill=(70, 30, 15, 255))
    for x in range(0, W, 60):
        d.line([x, 1640, x + 30, H], fill=(55, 22, 10, 255), width=8)


def wayang_A():
    img = kelir()
    put(img, gunungan(900, (60, 26, 12)).filter(ImageFilter.GaussianBlur(5)), 820, 1640, anchor='b', alpha=0.55)
    put(img, shadow(trip(1000), 6), 800, 1640, anchor='b', alpha=0.5)
    sg = street_sign(400, SIL, (0, 0, 0), SIL, F(BEBAS_P, 96))
    a = np.asarray(sg).copy()
    a[..., 3] = np.where(a[..., :3].sum(axis=2) < 10, 0, a[..., 3])      # letters become holes in the leather
    put(img, Image.fromarray(a).filter(ImageFilter.GaussianBlur(1.2)), 230, 1640, anchor='b')
    put(img, shadow(bike(470), 1.6, False), 570, 1640, anchor='b')
    put(img, shadow(rara(780)), 450, 1640, anchor='b')
    floor(img)
    put(img, tspr('POV: kamu pelajar SMA,', 'Cinzel-VariableFont_wght.ttf', 70, (255, 236, 200), shadow=0.6), 540, 220)
    put(img, tspr('dan tahunnya 1946.', 'Cinzel-VariableFont_wght.ttf', 70, (255, 236, 200), shadow=0.6), 540, 310)
    sub(img, (255, 230, 190), y=1760)
    img.alpha_composite(vignette(170))
    return grain(img, 7)


def wayang_B():
    img = kelir()
    put(img, gunungan(1250, SIL).filter(ImageFilter.GaussianBlur(2)), 540, 1640, anchor='b', alpha=0.9)
    put(img, shadow(trip(860)).transpose(Image.FLIP_LEFT_RIGHT), 250, 1640, anchor='b')
    put(img, shadow(rara(860, phone=True)), 830, 1640, anchor='b')
    glow = radial(W, H, 830 + 0.065 * 860 - 18, 1640 - 0.62 * 860, 120, (150, 210, 255), 200, 1.4)
    img.alpha_composite(glow)
    floor(img)
    put(img, tspr('1946', 'Cinzel-VariableFont_wght.ttf', 120, (255, 220, 160), shadow=0.6), 250, 260)
    put(img, tspr('2026', 'Cinzel-VariableFont_wght.ttf', 120, (255, 220, 160), shadow=0.6), 830, 260)
    put(img, tspr('Uang itu sekarang namanya Rupiah.', 'DMSans-Bold.ttf', 48, (255, 230, 190), shadow=0.6), 540, 1780)
    img.alpha_composite(vignette(170))
    return grain(img, 7)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    frames = {'buku': (buku_A, buku_B), 'sablon': (sablon_A, sablon_B), 'wayang': (wayang_A, wayang_B)}
    ims = []
    for name, fns in frames.items():
        for tag, fn in zip('AB', fns):
            im = fn().convert('RGB')
            im.save(f'{OUT}/{name}_{tag}.jpg', quality=90)
            ims.append(im.resize((360, 640), Image.LANCZOS))
    sheet = Image.new('RGB', (360 * 6 + 70, 640 + 110), (245, 242, 235))
    d = ImageDraw.Draw(sheet)
    titles = ['1 · Buku Tulis Pelajar', '2 · Poster Sablon', '3 · Wayang Kulit']
    for i, im in enumerate(ims):
        x = 20 + i * 360 + (i // 2) * 15
        sheet.paste(im, (x, 90))
        if i % 2 == 0:
            d.text((x + 360, 45), titles[i // 2], font=F(SUP + 'Futura.ttc', 38), fill=(30, 30, 30), anchor='mm')
    sheet.save(f'{OUT}/perbandingan.jpg', quality=90)
    print('ok')
