"""Style 9 — Kolase Arsip. Collage versions of Scene 1 and Scene 2."""
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageChops

from lib import *  # noqa: F401,F403
from styles import paper, torn, tint, multiply
from scenes import Scene2, skyline

KRAFT = (200, 176, 138)
CREAM = (240, 230, 210)
INKC = (20, 18, 16)


def st(t):
    """Identity — motion is continuous (kept so callers stay readable)."""
    return t


def jit(t, seed, amp=2.5, ramp=0.5):
    """Slow, gentle float instead of shake."""
    k = seed * 1.37
    return (amp * 0.6 * math.sin(t * 0.55 + k), amp * 0.6 * math.sin(t * 0.43 + k * 2.1),
            ramp * 0.5 * math.sin(t * 0.37 + k * 3.3))


def drop(t, t0, d=0.6):
    """Smooth land-in: returns (scale, alpha) for a piece arriving at t0."""
    p = prog(t, t0, t0 + d)
    if p <= 0:
        return 0, 0
    return 1 + 0.14 * (1 - eio(p)), eout(min(1.0, p * 1.6))


_SH = {}


def shadow_of(spr, key=None, blur=10):
    if key is False:
        return tint(spr, (0, 0, 0)).filter(ImageFilter.GaussianBlur(blur))
    k = key or id(spr)
    if k not in _SH:
        _SH[k] = tint(spr, (0, 0, 0)).filter(ImageFilter.GaussianBlur(blur))
    return _SH[k]


def archival(img, seed):
    g = ImageOps.autocontrast(img.convert('L'), cutoff=1)
    col = ImageOps.colorize(g, (36, 25, 16), (238, 220, 182))
    a = np.asarray(col, np.float32)
    h, w = a.shape[:2]
    r = np.random.default_rng(seed)
    a += r.normal(0, 15, (h, w))[..., None]
    for _ in range(7):
        x = int(r.integers(0, w))
        a[:, x:x + int(r.integers(1, 3))] *= r.uniform(0.65, 1.3)
    for _ in range(140):
        y, x, rad = int(r.integers(0, h)), int(r.integers(0, w)), int(r.integers(1, 4))
        a[max(0, y - rad):y + rad, max(0, x - rad):x + rad] = 25 if r.random() < 0.6 else 235
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w * 0.68)) ** 2 + ((yy - h / 2) / (h * 0.68)) ** 2)
    a *= (1 - 0.5 * np.clip(d, 0, 1) ** 2)[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9)).convert('RGBA')


def halftone_print(img, strength=0.18):
    """Give a colour piece a printed-magazine feel."""
    w, h = img.size
    dots = Image.new('L', (w, h), 255)
    d = ImageDraw.Draw(dots)
    for y in range(0, h, 8):
        for x in range((y // 8 % 2) * 4, w, 8):
            d.ellipse([x - 1.6, y - 1.6, x + 1.6, y + 1.6], fill=int(255 * (1 - strength)))
    return ImageChops.multiply(img.convert('RGB'), dots.convert('RGB')).convert('RGBA')


def card_mask(w, h, seed, amp=9):
    return torn(Image.new('RGBA', (w, h), (255, 255, 255, 255)), seed, amp).getchannel('A')


def sticker(spr, border=9):
    pad = border + 4
    c = Image.new('RGBA', (spr.width + 2 * pad, spr.height + 2 * pad), (0, 0, 0, 0))
    c.alpha_composite(spr, (pad, pad))
    m = c.getchannel('A').filter(ImageFilter.MaxFilter(2 * border + 1))
    out = Image.new('RGBA', c.size, (250, 248, 240, 0))
    out.putalpha(m)
    out.alpha_composite(c)
    return out


def word(txt, size, bg, fg, seed, font=BEBAS, pad=None):
    t = tspr(txt, font, size, fg, shadow=0)
    t = t.crop(t.getbbox())
    p = pad or int(size * 0.2)
    box = Image.new('RGBA', (t.width + 2 * p, t.height + int(1.7 * p)), tuple(bg) + (255,))
    box.alpha_composite(t, (p, int(0.85 * p)))
    return torn(box, seed, 6)


def place(img, spr, x, y, t, t0, seed, rot=0.0, shadow=True, jamp=2.0):
    s, a = drop(t, t0)
    if a <= 0:
        return
    jx, jy, jr = jit(t, seed, jamp)
    if shadow:
        sh = shadow_of(spr, shadow if isinstance(shadow, str) else None)
        put(img, sh, x + jx + 10, y + jy + 14, scale=s, rot=rot + jr, alpha=0.45 * a)
    put(img, spr, x + jx, y + jy, scale=s, rot=rot + jr, alpha=a)


def tape(w=230, h=62, seed=0):
    r = random.Random(seed)
    im = Image.new('RGBA', (w, h), (236, 226, 186, 175))
    d = ImageDraw.Draw(im)
    for x in range(0, w, 3):
        d.line([x, 0, x, h], fill=(255, 250, 220, r.randint(0, 40)))
    return torn(im, seed, 4)


def rip_sheets(seed):
    """Torn red (top) and white (bottom) sheets used for the flag wipe."""
    top = Image.new('RGBA', (W + 120, H // 2 + 160), RED + (255,))
    bot = Image.new('RGBA', (W + 120, H // 2 + 160), WHITE + (255,))
    top = multiply(top, paper(top.width, top.height, (255, 255, 255), 9))
    bot = multiply(bot, paper(bot.width, bot.height, (255, 255, 255), 9))
    r = random.Random(seed)

    def edge(im, bottom):
        m = Image.new('L', im.size, 255)
        d = ImageDraw.Draw(m)
        y0 = im.height - 70 if bottom else 70
        pts = [(x, y0 + r.uniform(-28, 28)) for x in range(-10, im.width + 20, 16)]
        if bottom:
            d.polygon(pts + [(im.width + 20, im.height + 10), (-10, im.height + 10)], fill=0)
        else:
            d.polygon(pts + [(im.width + 20, -10), (-10, -10)], fill=0)
        im.putalpha(m)
        fiber = Image.new('RGBA', im.size, (0, 0, 0, 0))
        fd = ImageDraw.Draw(fiber)
        fd.line(pts, fill=(255, 255, 255, 200), width=7)
        out = Image.new('RGBA', im.size, (0, 0, 0, 0))
        out.alpha_composite(fiber.filter(ImageFilter.GaussianBlur(1.5)))
        out.alpha_composite(im)
        return out

    return edge(top, True), edge(bot, False)


# ======================================================================
class Scene1C:
    """PROLOG — collage of archival photographs (00:00–00:15)."""
    dur = 15.0

    def __init__(self):
        rnd = random.Random(4)
        self.board = multiply(Image.new('RGBA', (W, H), KRAFT + (255,)), paper(W, H, (255, 255, 255), 14))
        self.board.alpha_composite(vignette(150, 1.8))
        # --- photo A: fighters under the flag (sepia, flag hand-tinted)
        PW, PH = 1300, 1700
        src = vgrad(PW, PH, [(0, (90, 90, 90)), (0.55, (200, 200, 200)), (0.72, (150, 150, 150)), (1, (40, 40, 40))])
        put(src, skyline(PW + 200, 620, (110, 110, 110), 3, minh=0.35), PW / 2, 1200, anchor='b')
        put(src, skyline(PW + 200, 420, (80, 80, 80), 7), PW / 2, 1210, anchor='b')
        from lib import blob
        for i in range(6):
            put(src, blob(rnd.randint(500, 800), i, (230, 230, 230)), rnd.uniform(0, PW), rnd.uniform(700, 1250), alpha=0.6)
        g = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
        pts = [(x, 1200 + 30 * math.sin(x / 160)) for x in range(-10, PW + 20, 20)]
        ImageDraw.Draw(g).polygon(pts + [(PW + 20, PH), (-10, PH)], fill=(45, 45, 45, 255))
        src.alpha_composite(g)
        self.pole = (420, 330)
        ImageDraw.Draw(src).rectangle([self.pole[0] - 7, self.pole[1] - 15, self.pole[0] + 7, 1400], fill=(30, 30, 30, 255))
        for x, hg, pose in [(200, 560, 2), (1120, 560, 0), (420, 720, 0), (930, 760, 2), (660, 940, 1)]:
            put(src, fighter(hg, (24, 24, 24), pose), x, 1560 + (940 - hg) * 0.25, anchor='b')
        self.srcA = archival(src, 1)
        self.flagA = Flag(470, 300, amp=18, waves=1.4)
        self.cardA = (860, 1110)
        self.maskA = card_mask(self.cardA[0] + 56, self.cardA[1] + 56, 21, 9)
        # --- photo B: crowd raising fists
        src = vgrad(900, 650, [(0, (210, 210, 210)), (1, (90, 90, 90))])
        for i in range(16):
            hg = rnd.randint(280, 420)
            put(src, fighter(hg, (30 + i * 3,) * 3, rnd.choice([0, 1, 1, 2])), 40 + i * 56 + rnd.uniform(-20, 20), 700 + rnd.uniform(0, 80), anchor='b')
        self.photoB = self._framed(archival(src, 2).resize((440, 318)), 22, 31)
        self.tapes = [tape(seed=i) for i in range(4)]
        self.words = [word('SEBUAH', 112, INKC, CREAM, 41), word('PERJUANGAN.', 150, CREAM, INKC, 42),
                      word('SEBUAH PENGORBANAN.', 92, RED, CREAM, 43)]
        self.tag = word('1945', 120, (240, 190, 60), INKC, 44)
        self.redp = torn(multiply(Image.new('RGBA', (980, 560), (190, 30, 40, 255)), paper(980, 560, (255, 255, 255), 10)), 2, 24)
        self.top, self.bot = rip_sheets(5)
        # flag position on screen (card centre 540, 800; ken-burns centre known)
        self.flag_src = (self.pole[0] + 240, self.pole[1] + 150)

    def _framed(self, ph, b, seed):
        fr = Image.new('RGBA', (ph.width + 2 * b, ph.height + 2 * b), (244, 238, 224, 255))
        fr.alpha_composite(ph, (b, b))
        return torn(fr, seed, 8)

    def _photoA(self, t):
        s = self.srcA.copy()
        f = self.flagA.frame(t)
        f = Image.blend(f, tint(f, (180, 150, 110)), 0.12)
        put(s, with_alpha(f, 0.92), self.pole[0] + 6, self.pole[1] - self.flagA.A, anchor='tl')
        # ken burns: slow push, drifting toward the flag
        z = 1.0 + 0.10 * eio(prog(t, 1.5, 14))
        cw, chh = 1300 / z, 1675 / z
        cx = lerp(650, 760, eio(prog(t, 1.5, 14)))
        cy = lerp(850, 760, eio(prog(t, 1.5, 14)))
        cx = clamp(cx, cw / 2, 1300 - cw / 2)
        cy = clamp(cy, chh / 2, 1700 - chh / 2)
        crop = s.resize(self.cardA, Image.BILINEAR, box=(cx - cw / 2, cy - chh / 2, cx + cw / 2, cy + chh / 2))
        b = 28
        card = Image.new('RGBA', (self.cardA[0] + 2 * b, self.cardA[1] + 2 * b), (244, 238, 224, 255))
        card.paste(crop, (b, b))
        card.putalpha(self.maskA)
        return card, (cx, cy, z)

    def frame(self, t):
        img = self.board.copy()
        co = eio(prog(t, 9.2, 10.2))
        put(img, self.redp, 610, 1640 + 80 * co, alpha=drop(t, 3.6)[1] * (1 - co), rot=5)
        card, (kx, ky, kz) = self._photoA(t)
        place(img, card, 540, 790, t, 1.8, 1, rot=-2.5, jamp=1.5, shadow='cardA')
        place(img, self.photoB, 840, 300, t, 6.0, 2, rot=8)
        for i, (x, y, r, t0) in enumerate([(180, 250, 32, 2.5), (900, 240, -28, 2.7), (170, 1330, -30, 6.4)]):
            place(img, self.tapes[i], x, y, t, t0, 10 + i, rot=r, shadow=False, jamp=1)
        # captions lift away before the camera dive so they never get cropped mid-word
        cap = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        place(cap, self.words[0], 300, 1475, t, 4.0, 20, rot=3)
        place(cap, self.words[1], 560, 1615, t, 4.35, 21, rot=-2)
        place(cap, self.tag, 890, 1420, t, 5.0, 22, rot=9)
        place(cap, self.words[2], 545, 1770, t, 6.6, 23, rot=-1.5)
        put(img, cap, W / 2, H / 2 + 80 * co, alpha=1 - co)

        # camera: dive toward the hand-tinted flag
        fx = 540 + (self.flag_src[0] - kx) * kz * self.cardA[0] / 1300
        fy = 790 + (self.flag_src[1] - ky) * kz * self.cardA[1] / 1675
        zz = ein(prog(t, 9.0, 14.0))
        img = camera(img, lerp(1.0, 3.4, zz), lerp(540, fx, eio(prog(t, 8.5, 12.5))), lerp(960, fy, eio(prog(t, 8.5, 12.5))))

        # torn red/white sheets slam in = the flag fills the screen
        p1 = prog(t, 13.2, 13.9)
        p2 = prog(t, 13.45, 14.15)
        if p1 > 0:
            put(img, self.top, W / 2, -self.top.height + eio(p1) * (H / 2 + 70) + self.top.height / 2)
        if p2 > 0:
            put(img, self.bot, W / 2, H + self.bot.height / 2 - eio(p2) * (H / 2 + 70))
        img = overlay(img, (0, 0, 0), 1 - eio(prog(t, 1.2, 2.6)))
        return img.convert('RGB')


# ======================================================================
class Scene2C:
    """PERTANYAAN — collage of today's Indonesia (00:15–00:30)."""
    dur = 15.0

    def __init__(self):
        self.c = Scene2()
        self.board = multiply(Image.new('RGBA', (W, H), (226, 216, 196, 255)), paper(W, H, (255, 255, 255), 12))
        self.cw, self.ch = 960, 1240
        self.mask = card_mask(self.cw + 48, self.ch + 48, 61, 10)
        dots = Image.new('L', (self.cw, self.ch), 255)
        d = ImageDraw.Draw(dots)
        for y in range(0, self.ch, 7):
            for x in range((y // 7 % 2) * 3, self.cw, 7):
                d.ellipse([x - 1.3, y - 1.3, x + 1.3, y + 1.3], fill=215)
        self.dots = dots.convert('RGB')
        skins = [(232, 182, 140), (190, 135, 95), (150, 100, 70), (215, 165, 120)]
        self.stickers = [
            sticker(figure(330, skins[0], (230, 90, 60), head='hijab', headc=(60, 130, 160))),
            sticker(figure(360, skins[1], (60, 140, 200), head='cap', headc=(220, 60, 60))),
            sticker(youth(380)),
            sticker(car(300, (245, 190, 40))),
            sticker(figure(320, skins[2], (90, 170, 120), head='peci', headc=(25, 25, 25))),
        ]
        self.today = word('INDONESIA HARI INI', 72, (240, 190, 60), INKC, 70, font=BEBAS)
        q = tspr('?', BEBAS, 900, RED, shadow=0)
        self.q = sticker(q.crop(q.getbbox()), 16)
        rp = tspr('Rp', DMK, 380, (232, 176, 60), shadow=0)
        self.rp = sticker(rp.crop(rp.getbbox()), 16)
        self.words = [word('APAKAH', 120, CREAM, INKC, 71), word('PERJUANGAN', 140, INKC, CREAM, 72),
                      word('TELAH SELESAI?', 128, RED, CREAM, 73)]
        self.top, self.bot = rip_sheets(5)

    def _city(self, t):
        c = self.c
        pan = eio(prog(t, 0.0, 11.0)) * (c.WW - W)
        img = c.sky.copy()
        for spr, x, y in c.clouds:
            put(img, spr, (x - pan * 0.15 + t * 12) % c.WW - 300, y, alpha=0.8)
        put(img, c.far, -pan * 0.45, 1345 - c.far.height, anchor='tl')
        put(img, c.near, -pan, 1345 - c.near.height, anchor='tl')
        put(img, c.street, -pan, 1340, anchor='tl')
        for spr, x0, v, y in c.cars:
            put(img, spr, (x0 + v * t) % (c.WW + 600) - 300 - pan, y, anchor='b')
        crop = img.crop((60, 380, 60 + self.cw, 380 + self.ch))
        crop = ImageChops.multiply(crop.convert('RGB'), self.dots).convert('RGBA')
        b = 24
        card = Image.new('RGBA', (self.cw + 2 * b, self.ch + 2 * b), (248, 245, 236, 255))
        card.paste(crop, (b, b))
        card.putalpha(self.mask)
        return card

    def frame(self, t):
        img = self.board.copy()
        jx, jy, jr = jit(t, 3, 1.2, 0.25)
        card = self._city(t)
        put(img, shadow_of(card, 'city', 12), 552 + jx, 838 + jy, alpha=0.45, rot=-1.5)
        put(img, card, 540 + jx, 820 + jy, rot=-1.5 + jr)
        place(img, self.today, 330, 260, t, 1.6, 30, rot=-4)
        spots = [(150, 1640, 3.0, -6), (360, 1700, 3.5, 4), (560, 1660, 4.0, -2), (820, 1560, 4.6, 7), (960, 1740, 5.2, -5)]
        for i, (x, y, t0, r) in enumerate(spots):
            bob = math.sin(t * 1.6 + i) * 6
            place(img, self.stickers[i], x, y - bob, t, t0, 40 + i, rot=r)

        img = overlay(img, (14, 18, 34), 0.72 * eio(prog(t, 7.5, 9.0)))
        img = overlay(img, (34, 40, 66), eio(prog(t, 13.9, 15.0)))
        # question mark sticker: slap in, then flip into the Rupiah sticker
        fl = eio(prog(t, 13.6, 14.6))
        if t >= 9.0:
            sx = abs(math.cos(fl * math.pi))
            spr = self.q if fl < 0.5 else self.rp
            s, a = drop(t, 9.0, 0.7)
            jx, jy, jr = jit(t, 50, 2)
            spr2 = spr.resize((max(1, int(spr.width * sx)), spr.height)) if sx < 0.999 else spr
            sh = shadow_of(spr2, False if sx < 0.999 else ('q' if fl < 0.5 else 'rp'), 12)
            put(img, sh, 552 + jx, 790 + jy, scale=s, rot=-4 + jr, alpha=0.5 * a)
            put(img, spr2, 540 + jx, 770 + jy, scale=s, rot=-4 + jr, alpha=a)
        fo = 1 - prog(t, 13.4, 14.0)
        if fo > 0:
            for i, (x, y, t0, r) in enumerate([(340, 1430, 10.0, -3), (600, 1580, 10.4, 2), (540, 1745, 10.8, -1)]):
                s, a = drop(t, t0)
                if a > 0:
                    jx, jy, jr = jit(t, 60 + i, 2)
                    put(img, self.words[i], x + jx, y + jy, scale=s, rot=r + jr, alpha=a * fo)

        # opening: the torn red/white sheets are ripped away
        o = prog(t, 0.0, 1.1)
        if o < 1:
            e = eio(o)
            put(img, self.top, W / 2, H / 2 + 70 - self.top.height / 2 - e * (H / 2 + 300), rot=-6 * e)
            put(img, self.bot, W / 2, H / 2 - 70 + self.bot.height / 2 + e * (H / 2 + 300), rot=5 * e)
        return img.convert('RGB')
