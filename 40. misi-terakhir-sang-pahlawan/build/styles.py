"""Ten style samples of the same key moment (Scene 1) for picking a look."""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageChops

from lib import *  # noqa: F401,F403

OUT = '../style_samples'
rng = np.random.default_rng(3)


def grain(img, amt=18, mono=True):
    a = np.asarray(img.convert('RGB'), np.float32)
    n = rng.normal(0, amt, a.shape[:2])[..., None] if mono else rng.normal(0, amt, a.shape)
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8)).convert('RGBA')


def paper(w, h, base, amt=10, fibers=True):
    a = np.ones((h, w, 3), np.float32) * np.array(base, np.float32)
    low = rng.normal(0, 1, (h // 8 + 1, w // 8 + 1))
    low = np.asarray(Image.fromarray(((low + 3) * 40).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255 - 0.47
    a += low[..., None] * amt * 2
    a += rng.normal(0, amt * 0.5, (h, w))[..., None]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert('RGBA')


def multiply(img, tex):
    return ImageChops.multiply(img.convert('RGB'), tex.convert('RGB')).convert('RGBA')


def mask_of(spr):
    return spr.getchannel('A')


def tint(spr, color):
    out = Image.new('RGBA', spr.size, tuple(color) + (255,))
    out.putalpha(spr.getchannel('A'))
    return out


def shadowed(base, spr, x, y, anchor='b', off=(14, 18), blur=14, alpha=0.45):
    sh = tint(spr, (0, 0, 0))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    put(base, sh, x + off[0], y + off[1], alpha=alpha, anchor=anchor)
    put(base, spr, x, y, anchor=anchor)


def hill(w, h, y0, amp, freq, seed, color):
    r = random.Random(seed)
    ph = r.random() * 6
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    pts = [(x, y0 + amp * math.sin(x / freq + ph) + amp * 0.4 * math.sin(x / (freq * 0.37) + ph * 2))
           for x in range(-10, w + 20, 10)]
    ImageDraw.Draw(im).polygon(pts + [(w + 20, h), (-10, h)], fill=tuple(color) + (255,))
    return im


def label(img, n, name):
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 150, W, H], fill=(0, 0, 0, 200))
    t = tspr(f'STYLE {n}  ·  {name}', DMK, 46, WHITE, shadow=0)
    put(img, t, W / 2, H - 75)
    return img


def flagpole(img, x, top, bottom, t=1.3, fw=380, fh=250, pole=(30, 20, 15), flag=None):
    d = ImageDraw.Draw(img)
    d.rectangle([x - 6, top - 10, x + 6, bottom], fill=tuple(pole) + (255,))
    d.ellipse([x - 13, top - 30, x + 13, top - 4], fill=(210, 170, 60, 255))
    f = (flag or Flag(fw, fh, amp=16, waves=1.4)).frame(t)
    put(img, f, x + 4, top - 18, anchor='tl')


# ---------------------------------------------------------------- 1 papercut
def s1():
    img = paper(W, H, (243, 226, 200), 6)
    sun = Image.new('RGBA', (520, 520), (0, 0, 0, 0))
    ImageDraw.Draw(sun).ellipse([0, 0, 519, 519], fill=(242, 160, 70, 255))
    shadowed(img, sun, 540, 900, anchor='c', blur=20, alpha=0.35)
    layers = [(980, 70, 160, 1, (225, 120, 80)), (1120, 80, 200, 2, (200, 70, 60)),
              (1290, 60, 140, 3, (160, 40, 45)), (1460, 50, 230, 4, (110, 28, 35)), (1640, 40, 180, 5, (60, 18, 22))]
    for i, (y0, amp, fr, sd, c) in enumerate(layers):
        hl = hill(W, H, y0, amp, fr, sd, c)
        if i == 3:
            flagpole(img, 330, 520, 1500, fw=360, fh=230)
            for x, hg, pose in [(280, 520, 0), (780, 540, 2), (530, 660, 1)]:
                spr = fighter(hg, (40, 14, 18), pose)
                shadowed(img, spr, x, 1560 + (660 - hg) * 0.2, blur=10, alpha=0.5)
        sh = tint(hl, (0, 0, 0)).filter(ImageFilter.GaussianBlur(16))
        put(img, sh, 0, -12, alpha=0.45, anchor='tl')
        img.alpha_composite(hl)
    img = multiply(img, paper(W, H, (255, 255, 255), 9))
    put(img, tspr('SEBUAH PERJUANGAN.', DMK, 92, (110, 28, 35), shadow=0.25), 540, 250)
    put(img, tspr('Sebuah pengorbanan.', DMB, 60, (160, 40, 45), shadow=0), 540, 360)
    return img


# ---------------------------------------------------------------- 2 retro poster 1945
def s2():
    cream, red, ink = (240, 226, 196), (190, 32, 38), (36, 22, 20)
    img = Image.new('RGBA', (W, H), cream + (255,))
    d = ImageDraw.Draw(img)
    cx, cy = 540, 900
    for i in range(24):
        a0 = i * 2 * math.pi / 24
        a1 = a0 + math.pi / 24
        if i % 2 == 0:
            d.polygon([(cx, cy), (cx + 2000 * math.cos(a0), cy + 2000 * math.sin(a0)),
                       (cx + 2000 * math.cos(a1), cy + 2000 * math.sin(a1))], fill=(222, 170, 120, 255))
    d.ellipse([cx - 300, cy - 300, cx + 300, cy + 300], fill=(230, 120, 60, 255))
    d.rectangle([0, 1450, W, H], fill=ink + (255,))
    flagpole(img, 700, 330, 1450, fw=330, fh=220, pole=ink)
    put(img, fighter(1050, ink, 1), 470, 1620, anchor='b')
    put(img, fighter(700, red, 2), 860, 1580, anchor='b')
    # halftone dots on the sky
    ht = Image.new('L', (W, H), 0)
    hd = ImageDraw.Draw(ht)
    for y in range(0, 1450, 22):
        for x in range((y // 22 % 2) * 11, W, 22):
            r = 7 * (1 - y / 1450)
            if r > 0.6:
                hd.ellipse([x - r, y - r, x + r, y + r], fill=60)
    img = Image.composite(Image.new('RGBA', (W, H), red + (255,)), img, ht)
    d = ImageDraw.Draw(img)
    d.rectangle([30, 30, W - 30, H - 30], outline=ink + (255,), width=10)
    d.rectangle([0, 100, W, 330], fill=red + (255,))
    put(img, tspr('SEBUAH PERJUANGAN.', BEBAS, 150, cream, shadow=0), 540, 220)
    put(img, tspr('SEBUAH PENGORBANAN.', BEBAS, 110, cream, shadow=0), 540, 1680)
    img = multiply(img, paper(W, H, (255, 255, 255), 14))
    return grain(img, 10)


# ---------------------------------------------------------------- 3 wayang / shadow play
def gunungan(h, color):
    """Kayon/gunungan: tall pointed leaf with a tree-of-life cut-out."""
    def fn(u):
        c = tuple(color) + (255,)
        hole = (0, 0, 0, 0)
        pts = []
        for i in range(0, 181):
            a = math.radians(i)
            y = 2 + 86 * (1 - math.cos(a)) / 2
            wdt = 30 * math.sin(a) ** 0.9 * (0.55 + 0.45 * (1 - math.cos(a)) / 2)
            pts.append((50 + wdt * (1 + 0.04 * math.sin(i * 0.9)), y))
        pts += [(100 - x, y) for x, y in reversed(pts)]
        u.poly(pts, c)
        u.R(30, 84, 70, 98, c, 1.5)
        u.L([(50, 82), (50, 20)], 2.2, hole)
        for k, y in enumerate(range(26, 76, 7)):
            sp = 4 + (y - 20) * 0.32
            u.L([(50, y + 4), (50 - sp, y - 2), (50 - sp - 3, y - 6)], 1.4, hole)
            u.L([(50, y + 4), (50 + sp, y - 2), (50 + sp + 3, y - 6)], 1.4, hole)
            u.E(50 - sp - 4.5, y - 8, 50 - sp - 1.5, y - 5, hole)
            u.E(50 + sp + 1.5, y - 8, 50 + sp + 4.5, y - 5, hole)
        for y in range(10, 84, 4):
            wdt = 30 * math.sin(math.acos(1 - 2 * (y - 2) / 86)) ** 0.9 * (0.55 + 0.45 * (y - 2) / 86) - 3
            for x in (50 - wdt, 50 + wdt):
                u.E(x - 0.8, y - 0.8, x + 0.8, y + 0.8, hole)
        u.poly([(43, 76), (57, 76), (57, 84), (43, 84)], hole)
        u.R(44.5, 77.5, 49.5, 84, c)
        u.R(50.5, 77.5, 55.5, 84, c)
    return usprite(h, fn, wmul=1.0)


def ornament(spr, step=14, r=2.4):
    m = spr.getchannel('A').copy()
    d = ImageDraw.Draw(m)
    for y in range(int(spr.height * 0.25), int(spr.height * 0.6), step):
        for x in range((y // step % 2) * step // 2, spr.width, step):
            d.ellipse([x - r, y - r, x + r, y + r], fill=0)
    out = spr.copy()
    out.putalpha(m)
    return out


def s3():
    img = vgrad(W, H, [(0, (40, 14, 6)), (1, (25, 8, 4))])
    img.alpha_composite(radial(W, H, 540, 950, 900, (255, 196, 110), 255, 1.2))
    img.alpha_composite(radial(W, H, 540, 950, 500, (255, 236, 190), 220, 1.5))
    sil = (25, 12, 8)
    g = gunungan(1150, sil).filter(ImageFilter.GaussianBlur(2))
    put(img, g, 540, 1500, anchor='b', alpha=0.95)
    for x, hg, pose, flip in [(250, 860, 0, False), (830, 860, 2, True)]:
        f = ornament(fighter(hg, sil, pose)).filter(ImageFilter.GaussianBlur(1.6))
        if flip:
            f = f.transpose(Image.FLIP_LEFT_RIGHT)
        put(img, f, x, 1640, anchor='b')
    d = ImageDraw.Draw(img)
    d.rectangle([0, 1640, W, H], fill=(70, 30, 15, 255))
    for x in range(0, W, 60):
        d.line([x, 1640, x + 30, H], fill=(55, 22, 10, 255), width=8)
    put(img, tspr('SEBUAH PERJUANGAN.', BEBAS, 130, (255, 236, 200), shadow=0.6, glow=(255, 150, 60)), 540, 230)
    put(img, tspr('SEBUAH PENGORBANAN.', BEBAS, 90, (240, 190, 110), shadow=0.6), 540, 340)
    img.alpha_composite(vignette(170))
    return grain(img, 8)


# ---------------------------------------------------------------- 4 flat modern
def s4():
    img = vgrad(W, H, [(0, (38, 30, 90)), (0.5, (220, 90, 110)), (0.72, (255, 170, 110)), (1, (255, 200, 140))])
    d = ImageDraw.Draw(img)
    for i in range(40):
        x, y = rng.uniform(0, W), rng.uniform(0, 700)
        r = rng.uniform(2, 4)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 180))
    d.ellipse([340, 780, 740, 1180], fill=(255, 225, 150, 255))
    for y0, c in [(1250, (240, 110, 100)), (1380, (200, 70, 90)), (1520, (130, 45, 80)), (1680, (70, 30, 70))]:
        img.alpha_composite(hill(W, H, y0, 40, 240, y0, c))
    flagpole(img, 760, 700, 1560, fw=280, fh=180, pole=(60, 30, 60))
    skins = [(200, 140, 100), (170, 115, 80), (220, 160, 115)]
    for x, hg, sk, hd in [(300, 640, skins[0], 'peci'), (560, 720, skins[1], 'peci'), (820, 600, skins[2], 'peci')]:
        p = figure(hg, sk, (235, 225, 200), bottom=(110, 80, 60), head=hd, headc=(30, 30, 35), shoes=(60, 40, 30))
        sh = tint(p, (0, 0, 0)).transform(p.size, Image.AFFINE, (1, 0.6, -p.height * 0.6, 0, 1, 0))
        put(img, sh, x + 40, 1750, alpha=0.18, anchor='b')
        put(img, p, x, 1750, anchor='b')
    put(img, tspr('SEBUAH\nPERJUANGAN.', DMK, 110, WHITE, shadow=0.2), 540, 330)
    return img


# ---------------------------------------------------------------- 5 watercolor
def base_scene(sky=None):
    img = vgrad(W, H, sky or [(0, (60, 80, 130)), (0.5, (230, 140, 100)), (0.7, (250, 200, 150)), (1, (90, 50, 40))])
    img.alpha_composite(hill(W, H, 1300, 60, 200, 1, (150, 80, 70)))
    img.alpha_composite(hill(W, H, 1480, 50, 160, 2, (80, 40, 40)))
    flagpole(img, 330, 520, 1500, fw=360, fh=230)
    for x, hg, pose in [(270, 520, 0), (790, 560, 2), (540, 700, 1)]:
        put(img, fighter(hg, (40, 22, 25), pose), x, 1600 + (700 - hg) * 0.2, anchor='b')
    return img


def watercolorize(img):
    rgb = img.convert('RGB')
    a = np.asarray(rgb, np.float32)
    # wobble edges with low-frequency displacement
    h, w = a.shape[:2]
    nx = np.asarray(Image.fromarray(rng.integers(0, 255, (h // 24, w // 24), dtype=np.uint8)).resize((w, h), Image.BICUBIC), np.float32)
    ny = np.asarray(Image.fromarray(rng.integers(0, 255, (h // 24, w // 24), dtype=np.uint8)).resize((w, h), Image.BICUBIC), np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    xs = np.clip(xx + (nx - 128) / 22, 0, w - 1).astype(int)
    ys = np.clip(yy + (ny - 128) / 22, 0, h - 1).astype(int)
    a = a[ys, xs]
    soft = Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.ModeFilter(9)).filter(ImageFilter.GaussianBlur(3))
    s = np.asarray(soft, np.float32)
    s = 255 - (255 - s) * 0.82                      # lighter, translucent pigment
    edges = np.asarray(soft.filter(ImageFilter.FIND_EDGES).convert('L').filter(ImageFilter.GaussianBlur(1.5)), np.float32)
    s *= (1 - np.clip(edges / 255 * 1.6, 0, 0.45))[..., None]   # pigment pooling at edges
    blooms = np.asarray(Image.fromarray(rng.integers(0, 255, (h // 60, w // 60), dtype=np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
    s *= (0.9 + 0.12 * blooms)[..., None]
    out = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8)).convert('RGBA')
    return multiply(out, paper(W, H, (255, 252, 245), 12))


def s5():
    img = watercolorize(base_scene())
    put(img, tspr('Sebuah perjuangan.', DMB, 84, (90, 40, 40), shadow=0), 540, 240)
    return img


# ---------------------------------------------------------------- 6 anime cinematic
def cloud(w, h, seed, lit=(255, 230, 200), body=(200, 150, 170)):
    r = random.Random(seed)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    puffs = [(r.uniform(0.15, 0.85) * w, r.uniform(0.35, 0.8) * h, r.uniform(0.12, 0.25) * w) for _ in range(16)]
    for x, y, rad in puffs:
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=tuple(body) + (255,))
    lit_l = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dl = ImageDraw.Draw(lit_l)
    for x, y, rad in puffs:
        dl.ellipse([x - rad * 0.92, y - rad * 1.0, x + rad * 0.8, y + rad * 0.55], fill=tuple(lit) + (255,))
    m = ImageChops.multiply(lit_l.getchannel('A'), im.getchannel('A'))
    lit_l.putalpha(m)
    im.alpha_composite(lit_l)
    return im.filter(ImageFilter.GaussianBlur(3))


def s6():
    img = vgrad(W, H, [(0, (20, 50, 130)), (0.35, (70, 120, 200)), (0.6, (255, 170, 120)), (0.72, (255, 220, 170)), (1, (60, 50, 80))])
    for i, (x, y, w, h) in enumerate([(300, 520, 900, 520), (820, 760, 800, 420), (200, 1000, 700, 330)]):
        put(img, cloud(w, h, i + 4), x, y)
    img.alpha_composite(radial(W, H, 640, 1210, 600, (255, 240, 200), 255, 1.8))
    # rays
    rays = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(rays)
    for i in range(12):
        a = -math.pi / 2 + (i - 6) * 0.13
        d.polygon([(640, 1210), (640 + 2000 * math.cos(a - 0.03), 1210 + 2000 * math.sin(a - 0.03)),
                   (640 + 2000 * math.cos(a + 0.03), 1210 + 2000 * math.sin(a + 0.03))], fill=(255, 240, 210, 40))
    img.alpha_composite(rays.filter(ImageFilter.GaussianBlur(12)))
    city = Image.new('RGBA', (W, 300), (0, 0, 0, 0))
    cd = ImageDraw.Draw(city)
    r = random.Random(9)
    x = 0
    while x < W:
        bw = r.randint(30, 80)
        hgt = r.randint(60, 260)
        cd.rectangle([x, 300 - hgt, x + bw, 300], fill=(90, 80, 120, 255))
        x += bw
    put(img, city, 0, 1000, anchor='tl')
    g = hill(W, H, 1290, 30, 260, 8, (40, 45, 70))
    img.alpha_composite(g)
    flagpole(img, 600, 1060, 1300, fw=200, fh=130, pole=(30, 30, 45))
    put(img, fighter(300, (25, 25, 40), 1), 520, 1330, anchor='b')
    rim = tint(fighter(300, (255, 220, 170), 1), (255, 220, 170)).filter(ImageFilter.GaussianBlur(4))
    put(img, rim, 523, 1327, anchor='b', alpha=0.4)
    d = ImageDraw.Draw(img)
    for i in range(40):
        x, y = rng.uniform(0, W), rng.uniform(1300, H)
        d.line([x, y, x + rng.uniform(-6, 6), y - rng.uniform(30, 90)], fill=(80, 90, 120, 200), width=3)
    img.alpha_composite(radial(W, H, 640, 1210, 160, (255, 255, 255), 230, 2.0))
    put(img, tspr('SEBUAH PERJUANGAN.', DMK, 80, WHITE, shadow=0.6), 540, 1560)
    return grain(img, 5)


# ---------------------------------------------------------------- 7 linocut
def s7():
    cream, ink, red = (238, 228, 205), (22, 18, 16), (186, 30, 36)
    img = Image.new('RGBA', (W, H), cream + (255,))
    d = ImageDraw.Draw(img)
    cx, cy = 540, 1150
    for y in range(0, 1300, 16):
        wdt = int(1 + 9 * (1 - y / 1300) ** 1.4)
        pts = [(x, y + 6 * math.sin(x / 70 + y / 40)) for x in range(-10, W + 20, 20)]
        d.line(pts, fill=ink + (255,), width=wdt)
    d.ellipse([cx - 260, cy - 260, cx + 260, cy + 260], fill=cream + (255,))
    for r in range(280, 560, 28):
        d.arc([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=cream + (255,), width=8)
    d.rectangle([0, 1300, W, H], fill=ink + (255,))
    for y in range(1340, H, 26):
        d.line([(x, y + 8 * math.sin(x / 50 + y)) for x in range(-10, W + 20, 20)], fill=cream + (255,), width=3)
    flagpole(img, 330, 500, 1500, fw=360, fh=230, pole=ink)
    f = Image.new('RGBA', (360, 260), (0, 0, 0, 0))
    for x, hg, pose in [(280, 560, 0), (790, 580, 2), (540, 740, 1)]:
        spr = fighter(hg, ink, pose)
        put(img, spr, x, 1620 + (740 - hg) * 0.2, anchor='b')
    a = np.asarray(img.convert('RGB'), np.float32)
    n = rng.random(a.shape[:2])
    a[n < 0.04] = np.array(cream, np.float32)
    a[(n > 0.985) & (a.mean(axis=2) > 150)] = np.array(ink, np.float32)
    img = Image.fromarray(a.astype(np.uint8)).convert('RGBA')
    d = ImageDraw.Draw(img)
    d.rectangle([60, 120, W - 60, 360], fill=red + (255,))
    put(img, tspr('SEBUAH PERJUANGAN.', BEBAS, 140, cream, shadow=0), 540, 240)
    return multiply(img, paper(W, H, (255, 255, 255), 10))


# ---------------------------------------------------------------- 8 neon cyber
def neon_outline(spr, color, width=6, blur=14):
    m = spr.getchannel('A')
    edge = ImageChops.subtract(m.filter(ImageFilter.MaxFilter(width | 1)), m.filter(ImageFilter.MinFilter(3)))
    line = Image.new('RGBA', spr.size, tuple(color) + (0,))
    line.putalpha(edge)
    glow = Image.new('RGBA', spr.size, tuple(color) + (0,))
    glow.putalpha(edge.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: min(255, v * 3)))
    out = Image.new('RGBA', spr.size, (0, 0, 0, 0))
    out.alpha_composite(glow)
    out.alpha_composite(glow)
    white = Image.new('RGBA', spr.size, (255, 255, 255, 0))
    white.putalpha(edge.point(lambda v: v // 2))
    out.alpha_composite(line)
    out.alpha_composite(white)
    return out


def s8():
    img = vgrad(W, H, [(0, (6, 4, 18)), (0.6, (24, 6, 30)), (1, (8, 4, 16))])
    d = ImageDraw.Draw(img)
    hz = 1250
    for i in range(1, 22):
        y = hz + (i / 21) ** 2 * (H - hz)
        d.line([0, y, W, y], fill=(255, 40, 80, 120), width=2)
    for i in range(-14, 15):
        d.line([540 + i * 40, hz, 540 + i * 260, H], fill=(255, 40, 80, 120), width=2)
    img.alpha_composite(radial(W, H, 540, hz, 700, (255, 40, 90), 140, 1.4))
    pad = 40
    for x, hg, pose in [(270, 560, 0), (810, 580, 2), (540, 760, 1)]:
        spr = fighter(hg, (255, 255, 255), pose)
        canvas = Image.new('RGBA', (spr.width + 2 * pad, spr.height + 2 * pad), (0, 0, 0, 0))
        canvas.alpha_composite(spr, (pad, pad))
        put(img, tint(canvas, (10, 6, 20)), x, 1700 + (760 - hg) * 0.2 + pad, anchor='b')
        put(img, neon_outline(canvas, (255, 50, 90)), x, 1700 + (760 - hg) * 0.2 + pad, anchor='b')
    fl = Flag(380, 250, amp=16, waves=1.4).frame(1.3)
    canvas = Image.new('RGBA', (fl.width + 80, fl.height + 80), (0, 0, 0, 0))
    canvas.alpha_composite(fl, (40, 40))
    top = canvas.copy()
    put(img, with_alpha(canvas, 0.35), 560, 560)
    put(img, neon_outline(canvas, (255, 255, 255), 5, 12), 560, 560)
    d = ImageDraw.Draw(img)
    d.line([372, 430, 372, 1450], fill=(255, 255, 255, 255), width=4)
    t = tspr('SEBUAH PERJUANGAN.', DMK, 92, (255, 255, 255), shadow=0, glow=(255, 40, 90))
    a = np.asarray(img.convert('RGB')).copy()
    img = Image.fromarray(a).convert('RGBA')
    put(img, tint(t, (0, 255, 255)), 534, 250, alpha=0.6)
    put(img, tint(t, (255, 0, 80)), 546, 250, alpha=0.6)
    put(img, t, 540, 250)
    a = np.asarray(img.convert('RGB')).copy()
    for y0 in rng.integers(0, H - 40, 6):
        h = int(rng.integers(6, 30))
        a[y0:y0 + h] = np.roll(a[y0:y0 + h], int(rng.integers(-40, 40)), axis=1)
    a[::4] = (a[::4] * 0.8).astype(np.uint8)
    return Image.fromarray(a).convert('RGBA')


# ---------------------------------------------------------------- 9 collage
def torn(im, seed, amp=14):
    r = random.Random(seed)
    w, h = im.size
    m = Image.new('L', (w, h), 0)
    pts = []
    for x in range(0, w + 1, 12):
        pts.append((x, r.uniform(0, amp)))
    for y in range(0, h + 1, 12):
        pts.append((w - r.uniform(0, amp), y))
    for x in range(w, -1, -12):
        pts.append((x, h - r.uniform(0, amp)))
    for y in range(h, -1, -12):
        pts.append((r.uniform(0, amp), y))
    ImageDraw.Draw(m).polygon(pts, fill=255)
    out = im.convert('RGBA')
    out.putalpha(ImageChops.multiply(m, out.getchannel('A')))
    return out


def s9():
    img = paper(W, H, (225, 214, 192), 10)
    photo = base_scene([(0, (120, 120, 120)), (0.6, (200, 200, 200)), (1, (60, 60, 60))]).convert('L')
    photo = ImageOps.colorize(photo, (40, 28, 18), (236, 214, 170)).convert('RGBA')
    photo = grain(photo, 22).filter(ImageFilter.GaussianBlur(1.2))
    photo = photo.crop((60, 300, 1020, 1750)).resize((720, 1088))
    framed = Image.new('RGBA', (780, 1150), (245, 240, 228, 255))
    framed.alpha_composite(photo, (30, 30))
    framed = torn(framed, 1, 10)
    sh = tint(framed, (0, 0, 0)).filter(ImageFilter.GaussianBlur(18))
    redp = torn(Image.new('RGBA', (900, 520), (196, 30, 40, 255)), 2, 24)
    put(img, redp, 600, 1450, rot=6)
    put(img, sh.rotate(-4, expand=True), 520, 870, alpha=0.5)
    put(img, framed, 500, 850, rot=-4)
    tape = Image.new('RGBA', (220, 60), (240, 230, 190, 170))
    put(img, tape, 250, 300, rot=30)
    put(img, tape, 800, 290, rot=-25)
    for i, (txt, sz, x, y, rot, bg, fg) in enumerate([
            ('SEBUAH', 110, 300, 1420, 3, (20, 18, 16), (240, 230, 210)),
            ('PERJUANGAN.', 150, 560, 1580, -2, (240, 230, 210), (20, 18, 16)),
            ('1945', 120, 860, 1360, 8, (240, 190, 60), (20, 18, 16))]):
        t = tspr(txt, BEBAS, sz, fg, shadow=0)
        box = Image.new('RGBA', (t.width - int(sz * 0.3), t.height - int(sz * 0.4)), tuple(bg) + (255,))
        box.alpha_composite(t, (-int(sz * 0.15), -int(sz * 0.2)))
        put(img, torn(box, 10 + i, 6), x, y, rot=rot)
    flag = torn(Flag(300, 200, amp=0).frame(0), 30, 8)
    put(img, flag, 820, 1760, rot=-8)
    return multiply(img, paper(W, H, (255, 255, 255), 8))


# ---------------------------------------------------------------- 10 hybrid
def s10():
    past = s2()
    now = vgrad(W, H, [(0, (40, 110, 220)), (0.6, (120, 200, 250)), (1, (230, 245, 255))])
    d = ImageDraw.Draw(now)
    for i in range(6):
        x, y = rng.uniform(0, W), rng.uniform(900, 1700)
        d.rounded_rectangle([x - 50, y - 50, x + 50, y + 50], 22, fill=(255, 255, 255, 60))
    put(now, youth(900), 830, 1900, anchor='b')
    ph = Image.new('RGBA', (120, 210), (0, 0, 0, 0))
    ImageDraw.Draw(ph).rounded_rectangle([0, 0, 119, 209], 18, fill=(20, 20, 30, 255))
    ImageDraw.Draw(ph).rounded_rectangle([8, 10, 111, 199], 12, fill=(80, 200, 160, 255))
    put(now, ph, 1000, 1400, rot=-15)
    put(now, tspr('PAHLAWAN\nMASA KINI', DMK, 78, (20, 40, 90), shadow=0), 300, 1600)
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([(0, 1500), (W, 760), (W, H), (0, H)], fill=255)
    out = Image.composite(now, past, m)
    d = ImageDraw.Draw(out)
    d.line([(0, 1500), (W, 760)], fill=(242, 190, 82, 255), width=14)
    return out


STYLES = [(s1, 'PAPERCUT'), (s2, 'POSTER RETRO 1945'), (s3, 'WAYANG / SIL. KELIR'), (s4, 'FLAT MODERN'),
          (s5, 'WATERCOLOR'), (s6, 'ANIME SINEMATIK'), (s7, 'LINOCUT / UKIRAN'), (s8, 'NEON CYBER'),
          (s9, 'KOLASE ARSIP'), (s10, 'HYBRID RETRO → MODERN')]

if __name__ == '__main__':
    import sys
    os.makedirs(OUT, exist_ok=True)
    which = [int(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else range(1, 11)
    for i in which:
        fn, name = STYLES[i - 1]
        img = label(fn(), i, name)
        img.convert('RGB').save(f'{OUT}/style_{i:02d}.jpg', quality=88)
        print('done', i)
