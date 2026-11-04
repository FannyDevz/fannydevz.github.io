"""Collage props: illustrative banknotes, Indonesia map, icons, phone, QR."""
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from lib import *  # noqa: F401,F403
from styles import paper, torn, multiply
from collage import sticker, halftone_print, word, INKC, CREAM

# rough outlines (lon, lat) — stylised, not survey-accurate
IDN = [
    [(95.2, 5.5), (97.9, 4.9), (99.6, 3.0), (101.5, 1.8), (103.5, 0.5), (104.5, -1.0), (106.0, -3.0), (105.8, -5.8),
     (104.5, -5.9), (102.3, -4.0), (100.5, -1.5), (98.7, 0.8), (97.2, 2.5), (95.5, 4.5)],
    [(105.2, -6.8), (106.5, -6.0), (108.3, -6.2), (110.5, -6.5), (112.6, -6.9), (114.5, -7.7), (114.4, -8.7), (112, -8.3),
     (110, -8.1), (108, -7.8), (106.4, -7.4)],
    [(114.5, -8.1), (115.7, -8.3), (115.2, -8.8), (114.5, -8.4)],
    [(116, -8.3), (116.7, -8.3), (116.5, -8.9), (116, -8.8)],
    [(116.9, -8.3), (119, -8.2), (118.9, -8.8), (117, -9.0)],
    [(119.8, -8.4), (123, -8.2), (122.8, -8.7), (119.9, -8.8)],
    [(119, -9.5), (120.8, -9.6), (120.5, -10.2), (119.2, -9.9)],
    [(123.5, -10.2), (125.2, -9.0), (127, -8.4), (125.5, -9.5), (124, -10.4)],
    [(109, 1.8), (109.6, 2.0), (111, 1.5), (113, 3.0), (115, 4.5), (116.8, 6.9), (118.5, 5.5), (119.2, 5.0), (118, 4.2),
     (117.8, 2.0), (119, 0.9), (117.5, 0.0), (117.0, -1.0), (116.5, -2.5), (116, -3.8), (114.5, -3.6), (113, -3.1),
     (111.5, -3.0), (110.2, -2.8), (110, -1.5), (109, -0.5)],
    [(119.4, -5.5), (120.4, -5.6), (120.4, -3.0), (121.0, -2.6), (122.2, -4.8), (123.2, -5.4), (122.8, -4.3), (121.6, -2.0),
     (123.3, -1.0), (122.0, -0.7), (120.7, -1.3), (121.0, 0.5), (123, 0.8), (125.0, 1.6), (124.2, 0.4), (121.5, 0.2),
     (120.0, 0.6), (119.8, -0.8), (119.5, -3.5), (118.8, -3.0)],
    [(127.5, 2.0), (128.5, 1.5), (128, 0.5), (128.8, -0.5), (127.8, -0.8), (127.4, 1.0)],
    [(128.0, -3.0), (130.8, -3.0), (130.6, -3.8), (128.2, -3.6)],
    [(126, -3.1), (127.2, -3.1), (127.1, -3.8), (126.1, -3.7)],
    [(131.0, -1.0), (132.5, -0.4), (134.2, -0.9), (134.5, -2.5), (135.5, -3.3), (137.5, -1.5), (139.0, -2.0),
     (141.0, -2.6), (141.0, -9.1), (139.5, -8.2), (138.0, -8.4), (137.8, -7.0), (138.8, -6.8), (136.5, -4.8),
     (134.5, -4.0), (133.0, -4.1), (132.2, -2.9), (133.5, -2.4), (132.0, -2.2), (130.9, -1.5)],
]
PINS = [(101.5, 0.5), (110.4, -7.2), (114.0, 0.5), (120.5, -2.0), (138.0, -4.5), (122.0, -8.6), (128.2, -3.4)]


def map_xy(lon, lat, width):
    s = width / 46.5
    return (lon - 95.0) * s + 6, (6.8 - lat) * s + 6


def idn_map(width, color, ss=2):
    s = width / 46.5
    h = int(18.2 * s) + 12
    im = Image.new('RGBA', (int(width + 12) * ss, h * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for poly in IDN:
        d.polygon([(map_xy(lo, la, width)[0] * ss, map_xy(lo, la, width)[1] * ss) for lo, la in poly], fill=tuple(color) + (255,))
    return im.resize((int(width + 12), h), Image.LANCZOS)


def note(w, col, seed=0):
    """Illustrative banknote — generic design, clearly marked ILUSTRASI."""
    h = int(w * 0.48)
    col = tuple(col)
    light = lerpc(col, (255, 255, 255), 0.5)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=int(h * 0.05), fill=col + (255,))
    lw = max(2, int(h * 0.018))
    d.rounded_rectangle([h * 0.06, h * 0.06, w - h * 0.06, h - h * 0.06], radius=int(h * 0.04), outline=light + (255,), width=lw)
    cx, cy, R = w * 0.74, h * 0.5, h * 0.3
    for k in range(16):
        a = k * math.pi / 8
        ox, oy = R * 0.4 * math.cos(a), R * 0.4 * math.sin(a)
        d.ellipse([cx + ox - R * 0.62, cy + oy - R * 0.62, cx + ox + R * 0.62, cy + oy + R * 0.62], outline=light + (150,), width=max(1, lw // 2))
    ex, ey, er = h * 0.5, h * 0.52, h * 0.28
    d.ellipse([ex - er, ey - er, ex + er, ey + er], outline=light + (255,), width=lw)
    put(im, tspr('Rp', DMK, int(h * 0.22), light, shadow=0), ex, ey)
    for i in range(5):
        pts = [(x, h * 0.8 + i * h * 0.025 + h * 0.03 * math.sin(x / (h * 0.12) + i)) for x in range(int(h * 0.9), int(w * 0.6), 6)]
        d.line(pts, fill=light + (140,), width=max(1, lw // 2))
    put(im, tspr('RUPIAH', BEBAS, int(h * 0.2), light, shadow=0), w * 0.42, h * 0.27)
    put(im, tspr('ILUSTRASI', DMB, int(h * 0.075), light, shadow=0), w * 0.82, h * 0.86)
    im = halftone_print(im, 0.12)
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=int(h * 0.05), fill=255)
    im.putalpha(m)
    return im


def qr_img(size, seed=1):
    r = random.Random(seed)
    n = 25
    cell = size / n
    im = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    d = ImageDraw.Draw(im)
    for y in range(n):
        for x in range(n):
            if r.random() < 0.48:
                d.rectangle([x * cell, y * cell, (x + 1) * cell, (y + 1) * cell], fill=(10, 10, 10, 255))
    for fx, fy in [(0, 0), (n - 7, 0), (0, n - 7)]:
        d.rectangle([fx * cell, fy * cell, (fx + 7) * cell, (fy + 7) * cell], fill=(255, 255, 255, 255))
        d.rectangle([fx * cell, fy * cell, (fx + 7) * cell - 1, (fy + 7) * cell - 1], fill=(10, 10, 10, 255))
        d.rectangle([(fx + 1) * cell, (fy + 1) * cell, (fx + 6) * cell - 1, (fy + 6) * cell - 1], fill=(255, 255, 255, 255))
        d.rectangle([(fx + 2) * cell, (fy + 2) * cell, (fx + 5) * cell - 1, (fy + 5) * cell - 1], fill=(10, 10, 10, 255))
    return im


def phone(w, screen):
    h = int(w * 1.95)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=int(w * 0.14), fill=(24, 24, 30, 255))
    b = int(w * 0.05)
    sw, sh = w - 2 * b, h - 2 * b
    scr = screen.resize((sw, sh), Image.BILINEAR) if screen.size != (sw, sh) else screen
    m = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=int(w * 0.1), fill=255)
    im.paste(scr, (b, b), m)
    d.rounded_rectangle([w * 0.38, b + w * 0.03, w * 0.62, b + w * 0.08], radius=int(w * 0.03), fill=(24, 24, 30, 255))
    return im


def screen(w, h, bg=(245, 245, 248)):
    return Image.new('RGBA', (w, h), tuple(bg) + (255,))


# ---------------- icons (unit space) ----------------
def icon(kind, h, col=None):
    def fn(u):
        if kind == 'shield':
            c = tuple(col or (40, 90, 190)) + (255,)
            u.poly([(50, 4), (88, 16), (85, 56), (50, 96), (15, 56), (12, 16)], (242, 190, 82, 255))
            u.poly([(50, 11), (81, 21), (78, 54), (50, 88), (22, 54), (19, 21)], c)
            u.L([(33, 50), (45, 62), (68, 36)], 8, (255, 255, 255, 255))
        elif kind == 'heartshield':
            u.poly([(50, 4), (88, 16), (85, 56), (50, 96), (15, 56), (12, 16)], (255, 255, 255, 255))
            u.E(30, 28, 52, 50, RED + (255,))
            u.E(48, 28, 70, 50, RED + (255,))
            u.poly([(31, 44), (69, 44), (50, 70)], RED + (255,))
        elif kind == 'wallet':
            u.R(8, 26, 92, 86, (120, 70, 38, 255), 9)
            u.R(8, 26, 92, 44, (95, 52, 28, 255), 9)
            u.R(62, 46, 96, 70, (95, 52, 28, 255), 6)
            u.E(70, 52, 82, 64, (242, 190, 82, 255))
        elif kind == 'magnifier':
            u.L([(62, 62), (88, 88)], 13, (90, 60, 40, 255))
            u.E(10, 10, 72, 72, (60, 60, 70, 255))
            u.E(17, 17, 65, 65, (200, 230, 245, 255))
            u.E(24, 22, 38, 36, (255, 255, 255, 200))
        elif kind == 'lock':
            u.arc(28, 8, 72, 58, 180, 360, (90, 95, 110, 255), 9)
            u.L([(32.5, 33), (32.5, 46)], 9, (90, 95, 110, 255), caps=False)
            u.L([(67.5, 33), (67.5, 46)], 9, (90, 95, 110, 255), caps=False)
            u.R(18, 42, 82, 92, (242, 190, 82, 255), 8)
            u.E(44, 56, 56, 68, INK + (255,))
            u.R(47.5, 62, 52.5, 80, INK + (255,))
        elif kind == 'bag':
            u.arc(32, 8, 68, 48, 180, 360, (120, 70, 38, 255), 6)
            u.R(14, 30, 86, 92, (230, 120, 60, 255), 8)
            u.R(14, 30, 86, 40, (200, 95, 45, 255), 4)
        elif kind == 'cup':
            u.arc(62, 40, 90, 70, 270, 90, (240, 240, 235, 255), 7)
            u.R(18, 34, 70, 88, (240, 240, 235, 255), 8)
            u.R(18, 34, 70, 44, (120, 70, 38, 255), 3)
            for x in (32, 44, 56):
                u.L([(x, 26), (x - 3, 18), (x + 1, 10)], 3, (200, 200, 200, 255))
        elif kind == 'shop':
            u.R(14, 44, 86, 92, (245, 238, 225, 255), 3)
            u.R(40, 62, 60, 92, (120, 70, 38, 255), 2)
            for i in range(5):
                c = RED + (255,) if i % 2 == 0 else (255, 255, 255, 255)
                u.poly([(8 + i * 16.8, 22), (24.8 + i * 16.8, 22), (24.8 + i * 16.8, 44), (8 + i * 16.8, 44)], c)
            u.R(8, 14, 92, 24, (60, 140, 90, 255), 3)
        elif kind == 'warning':
            u.poly([(50, 4), (97, 90), (3, 90)], (255, 255, 255, 255))
            u.poly([(50, 14), (88, 84), (12, 84)], (215, 30, 40, 255))
            u.R(45, 34, 55, 64, (255, 255, 255, 255), 3)
            u.E(44.5, 69, 55.5, 80, (255, 255, 255, 255))
        elif kind == 'check':
            u.E(6, 6, 94, 94, (40, 170, 90, 255))
            u.L([(28, 52), (44, 67), (72, 36)], 10, (255, 255, 255, 255))
        elif kind == 'qrcheck':
            u.R(8, 8, 76, 76, (20, 20, 20, 255), 5)
            u.R(15, 15, 69, 69, (255, 255, 255, 255), 3)
            for (x, y) in [(20, 20), (48, 20), (20, 48)]:
                u.R(x, y, x + 16, y + 16, (20, 20, 20, 255), 2)
            u.R(50, 50, 58, 58, (20, 20, 20, 255))
            u.E(56, 56, 96, 96, (40, 170, 90, 255))
            u.L([(65, 76), (73, 84), (87, 67)], 6, (255, 255, 255, 255))

    return usprite(h, fn)


def badge(kind, size=190, bg=(255, 255, 255)):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse([0, 0, size - 1, size - 1], fill=tuple(bg) + (255,))
    put(im, icon(kind, int(size * 0.62)), size / 2, size / 2)
    return sticker(im, 7)


def rp_sticker(size=380):
    rp = tspr('Rp', DMK, size, (232, 176, 60), shadow=0)
    return sticker(rp.crop(rp.getbbox()), 16)


def sheet(w, h, color, seed, tex=10):
    im = multiply(Image.new('RGBA', (w, h), tuple(color) + (255,)), paper(w, h, (255, 255, 255), tex))
    return torn(im, seed, 16)


def small_word(txt, size, bg, fg, seed, font=DMB):
    return word(txt, size, bg, fg, seed, font=font)


ASSET_DIR = '../../ASSET LOMBA KONTEN/'


def logo_bi(w):
    """Official BI logo: black backdrop keyed out, proportions untouched."""
    a = np.asarray(Image.open(ASSET_DIR + '1d5c5bde-614c-4399-89e9-c6d4f675fd78.jpg').convert('RGB'), np.float32)
    al = a.max(axis=2)
    al = np.clip((al - 12) / 60, 0, 1)
    rgb = np.clip(a / np.maximum(a.max(axis=2, keepdims=True) / 255, 0.05), 0, 255)
    rgb = np.where(a.min(axis=2, keepdims=True) > 120, a, rgb)
    out = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
    out = out.crop(out.getbbox())
    return out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)


def logo_cbp(w):
    """Official Cinta Bangga Paham Rupiah logo: white backdrop keyed out."""
    a = np.asarray(Image.open(ASSET_DIR + 'cf2b2cc7-3a40-40be-a481-ddf51c92389e.jpg').convert('RGB'), np.float32)
    al = np.clip((255 - a.min(axis=2)) / 60, 0, 1)
    out = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA')
    out = out.crop(out.point(lambda v: v if v > 40 else 0).getbbox())
    return out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)


def logo_pill():
    """Small corner badge carrying both logos on white."""
    bi, cbp = logo_bi(200), logo_cbp(128)
    h = max(bi.height, cbp.height) + 26
    w = bi.width + cbp.width + 74
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, w - 1, h - 1], radius=20, fill=(255, 255, 255, 240))
    put(im, cbp, 22 + cbp.width / 2, h / 2)
    ImageDraw.Draw(im).line([44 + cbp.width - 7, 16, 44 + cbp.width - 7, h - 16], fill=(205, 205, 212, 255), width=2)
    put(im, bi, w - 15 - bi.width / 2, h / 2)
    return im
