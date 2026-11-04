"""Scene renderers for Video 1. Each scene: .dur seconds, .frame(t) -> RGB Image."""
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from lib import *  # noqa: F401,F403


def skyline(w, h, color, seed, broken=True, windows=None, minh=0.3):
    rnd = random.Random(seed)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = tuple(color) + (255,)
    x = -20
    while x < w:
        bw = rnd.randint(70, 170)
        top = h - rnd.randint(int(h * minh), h)
        if broken:
            pts = [(x, h), (x, top + rnd.randint(0, 40)), (x + bw * 0.25, top),
                   (x + bw * 0.42, top + rnd.randint(25, 70)), (x + bw * 0.6, top + rnd.randint(0, 30)),
                   (x + bw * 0.8, top + rnd.randint(30, 90)), (x + bw, top + rnd.randint(10, 60)), (x + bw, h)]
            d.polygon(pts, fill=c)
        else:
            d.rectangle([x, top, x + bw, h], fill=c)
            if rnd.random() < 0.3:
                d.rectangle([x + bw * 0.4, top - 40, x + bw * 0.45, top], fill=c)
            if windows:
                for wy in range(top + 25, h - 20, 42):
                    for wx in range(int(x) + 14, int(x + bw) - 18, 30):
                        if rnd.random() < 0.55:
                            d.rectangle([wx, wy, wx + 14, wy + 20], fill=windows)
        x += bw - rnd.randint(0, 25)
    return im


# ======================================================================
class Scene1:
    """PROLOG — Jejak Perjuangan (00:00–00:15)."""
    dur = 15.0

    def __init__(self):
        rnd = random.Random(11)
        self.back = vgrad(W, H, [(0, (22, 8, 6)), (0.35, (70, 24, 14)), (0.62, (165, 72, 30)),
                                 (0.69, (205, 110, 45)), (0.70, (60, 26, 14)), (1, (18, 10, 8))])
        glow = radial(W, H, 540, 1330, 700, (255, 140, 50), 120)
        self.back.alpha_composite(glow)
        put(self.back, skyline(W + 200, 560, (70, 30, 16), 3, minh=0.35), W / 2, 1345, anchor='b')
        put(self.back, skyline(W + 200, 380, (42, 18, 10), 7, minh=0.3), W / 2, 1350, anchor='b')

        fore = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(fore)
        pts = [(0, 1380)] + [(x, 1340 + 25 * math.sin(x / 170) + 12 * math.sin(x / 47)) for x in range(0, W + 41, 40)] + [(W, H), (0, H)]
        d.polygon(pts, fill=INK + (255,))
        # flag pole (behind the fighters, in front of ruins)
        self.pole_x, self.flag_top = 352, 430
        d.rectangle([self.pole_x - 6, self.flag_top - 20, self.pole_x + 6, 1500], fill=(30, 18, 12, 255))
        d.ellipse([self.pole_x - 13, self.flag_top - 38, self.pole_x + 13, self.flag_top - 12], fill=(200, 160, 60, 255))
        for x, hgt, pose in [(120, 430, 2), (950, 450, 0), (300, 600, 0), (790, 620, 2), (545, 760, 1)]:
            put(fore, fighter(hgt, INK, pose), x, 1640 + (760 - hgt) * 0.25, anchor='b')
        self.fore = fore
        self.flag = Flag(400, 260, amp=16, waves=1.4)
        self.full = Flag(W, H, amp=38, waves=1.1, pole=False, speed=3.0, shade=0.16)
        self.fullbase = Image.new('RGBA', (W, H), RED + (255,))
        ImageDraw.Draw(self.fullbase).rectangle([0, H // 2, W, H], fill=WHITE + (255,))
        self.smoke = [(blob(rnd.randint(500, 800), i, (150, 120, 100)), rnd.uniform(-100, W + 100),
                       rnd.uniform(850, 1500), rnd.uniform(-25, 25)) for i in range(7)]
        self.fsmoke = [(blob(rnd.randint(700, 1000), 50 + i, (60, 40, 30)), rnd.uniform(0, W),
                        rnd.uniform(1500, 1850), rnd.uniform(-35, 35)) for i in range(4)]
        self.embers = [(rnd.uniform(0, W), rnd.uniform(0.04, 0.09), rnd.random(), rnd.uniform(2, 5))
                       for _ in range(70)]
        self.vig = vignette(230)
        self.flag_center = (self.pole_x + 200, self.flag_top + 130)

    def frame(self, t):
        img = self.back.copy()
        for spr, x, y, v in self.smoke:
            put(img, spr, (x + v * t) % (W + 600) - 300, y, alpha=0.55)
        put(img, self.flag.frame(t), self.pole_x + 4, self.flag_top - self.flag.A, anchor='tl')
        img.alpha_composite(self.fore)
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for x0, sp, ph, r in self.embers:
            p = (t * sp + ph) % 1.0
            y = 1750 - p * 1500
            x = x0 + 40 * math.sin(t * 0.8 + ph * 9)
            a = int(255 * (1 - p) * (0.6 + 0.4 * math.sin(t * 9 + ph * 30)))
            d.ellipse([x - r * 2.2, y - r * 2.2, x + r * 2.2, y + r * 2.2], fill=(255, 120, 30, a // 4))
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 200, 90, a))
        img.alpha_composite(lay)
        for spr, x, y, v in self.fsmoke:
            put(img, spr, (x + v * t) % (W + 800) - 400, y, alpha=0.7)

        # camera: slow push, then dive into the flag
        s = 1.0 + 0.07 * eio(prog(t, 1.5, 9))
        z = ein(prog(t, 9, 14))
        s = lerp(s, 5.0, z)
        cx = lerp(540, self.flag_center[0], eio(prog(t, 8.5, 13)))
        cy = lerp(1000, self.flag_center[1], eio(prog(t, 8.5, 13)))
        img = camera(img, s, cx, cy)

        f = eio(prog(t, 12.4, 14.0))
        if f > 0:
            full = self.fullbase.copy()
            full.alpha_composite(self.full.frame(t))
            img = Image.blend(img, full, f)
        img.alpha_composite(self.vig)

        mtext(img, t, 'SEBUAH PERJUANGAN.', BEBAS, 128, 540, 250, 4.0, 11.6, WHITE, din=0.9)
        mtext(img, t, 'SEBUAH PENGORBANAN.', BEBAS, 128, 540, 375, 6.0, 11.6, GOLD, din=0.9)
        img = overlay(img, (0, 0, 0), 1 - eio(prog(t, 1.3, 4.5)))
        return img.convert('RGB')


# ======================================================================
class Scene2:
    """PERTANYAAN — Apakah perjuangan telah selesai? (00:15–00:30)."""
    dur = 15.0
    WW = 2300

    def __init__(self):
        rnd = random.Random(5)
        WW = self.WW
        self.sky = vgrad(W, H, [(0, (36, 78, 150)), (0.45, (120, 150, 200)), (0.66, (250, 196, 150)), (1, (250, 210, 170))])
        self.sky.alpha_composite(radial(W, H, 760, 1050, 520, (255, 235, 180), 200))
        sun = Image.new('RGBA', (220, 220), (0, 0, 0, 0))
        ImageDraw.Draw(sun).ellipse([0, 0, 219, 219], fill=(255, 238, 190, 255))
        put(self.sky, sun, 760, 1060)
        self.clouds = [(blob(rnd.randint(380, 560), 90 + i, (255, 250, 245)), rnd.uniform(0, WW), rnd.uniform(300, 900))
                       for i in range(6)]
        self.far = skyline(int(W + 0.45 * (WW - W)) + 100, 760, (120, 140, 185), 21, broken=False,
                           windows=(160, 175, 210, 255), minh=0.35)
        near = skyline(WW, 900, (40, 58, 102), 33, broken=False, windows=(255, 214, 120, 255), minh=0.3)
        self._monas(near, 1250, 900)
        self.near = near

        street = Image.new('RGBA', (WW, H - 1340), (0, 0, 0, 0))
        d = ImageDraw.Draw(street)
        d.rectangle([0, 0, WW, 30], fill=(150, 150, 160, 255))
        d.rectangle([0, 30, WW, 250], fill=(58, 60, 70, 255))
        for x in range(0, WW, 140):
            d.rectangle([x, 133, x + 70, 145], fill=(240, 240, 230, 255))
        d.rectangle([0, 250, WW, H], fill=(205, 192, 172, 255))
        d.rectangle([0, 250, WW, 268], fill=(170, 160, 145, 255))
        for x in range(0, WW, 120):
            d.line([x, 268, x - 60, H], fill=(185, 172, 152, 255), width=3)
        self.street = street
        cols = [(220, 50, 50), (40, 120, 200), (245, 190, 40), (240, 240, 240), (60, 170, 110), (120, 80, 170)]
        self.cars = []
        for i in range(9):
            lane = i % 2
            spr = car(rnd.randint(250, 300), cols[i % len(cols)], flip=lane == 1)
            self.cars.append((spr, rnd.uniform(0, WW + 600), (260 if lane == 0 else -230) * rnd.uniform(0.9, 1.2),
                              1340 + (125 if lane == 0 else 225)))
        skins = [(232, 182, 140), (190, 135, 95), (150, 100, 70), (215, 165, 120)]
        tops = [(230, 90, 60), (60, 140, 200), (250, 200, 70), (90, 170, 120), (180, 80, 150), (240, 240, 240)]
        heads = ['hair', 'hijab', 'cap', 'peci', 'hair', 'hijab']
        hcs = [(30, 22, 20), (60, 130, 160), (220, 60, 60), (25, 25, 25), (60, 40, 30), (200, 120, 160)]
        self.people = []
        for i in range(10):
            hgt = rnd.randint(330, 400)
            spr = figure(hgt, skins[i % 4], tops[i % 6], head=heads[i % 6], headc=hcs[i % 6])
            self.people.append((spr, rnd.uniform(0, WW), rnd.choice([-1, 1]) * rnd.uniform(30, 70),
                                rnd.uniform(1820, 1900), rnd.random() * 6))
        self.people.sort(key=lambda p: p[3])
        self.qmark = tspr('?', BEBAS, 950, GOLD, shadow=0.6, glow=(255, 170, 40))
        self.rp = rp_glyph(400)
        self.full = Flag(W, H, amp=38, waves=1.1, pole=False, speed=3.0, shade=0.16)

    @staticmethod
    def _monas(im, x, h):
        d = ImageDraw.Draw(im)
        c = (230, 232, 240, 255)
        sh = (190, 195, 210, 255)
        d.polygon([(x - 230, h), (x - 170, h - 70), (x + 170, h - 70), (x + 230, h)], fill=c)
        d.polygon([(x - 120, h - 70), (x - 85, h - 140), (x + 85, h - 140), (x + 120, h - 70)], fill=sh)
        d.polygon([(x - 34, h - 140), (x - 20, h - 720), (x + 20, h - 720), (x + 34, h - 140)], fill=c)
        d.polygon([(x, h - 140), (x + 34, h - 140), (x + 20, h - 720), (x, h - 720)], fill=sh)
        d.polygon([(x - 50, h - 720), (x + 50, h - 720), (x + 28, h - 760), (x - 28, h - 760)], fill=c)
        d.polygon([(x - 18, h - 760), (x + 18, h - 760), (x + 26, h - 800), (x, h - 870), (x - 26, h - 800)],
                  fill=(240, 185, 50, 255))

    def frame(self, t):
        pan = eio(prog(t, 0.0, 11.0)) * (self.WW - W)
        img = self.sky.copy()
        for spr, x, y in self.clouds:
            put(img, spr, (x - pan * 0.15 + t * 12) % (self.WW) - 300, y, alpha=0.8)
        put(img, self.far, -pan * 0.45, 1345 - self.far.height, anchor='tl')
        put(img, self.near, -pan, 1345 - self.near.height, anchor='tl')
        put(img, self.street, -pan, 1340, anchor='tl')
        for spr, x0, v, y in self.cars:
            x = (x0 + v * t) % (self.WW + 600) - 300 - pan
            put(img, spr, x, y, anchor='b')
        for spr, x0, v, y, ph in self.people:
            x = (x0 + v * t) % (self.WW + 300) - 150 - pan
            bob = abs(math.sin(t * 5 + ph)) * 8
            sp = spr if v > 0 else spr.transpose(Image.FLIP_LEFT_RIGHT)
            put(img, sp, x, y - bob, anchor='b')

        # mood shift: dusk + question
        img = overlay(img, (8, 14, 36), 0.68 * eio(prog(t, 7.5, 9.5)))
        q = prog(t, 9.0, 9.6)
        if q > 0:
            out = prog(t, 13.7, 14.5)
            bob = math.sin(t * 2.2) * 12
            put(img, self.qmark, 540, 760 + bob, scale=max(0.01, eback(q)) * (1 - 0.7 * ein(out)),
                rot=-90 * ein(out), alpha=1 - out)
        mtext(img, t, 'APAKAH PERJUANGAN', BEBAS, 132, 540, 1430, 10.0, 14.2, WHITE, din=0.6)
        mtext(img, t, 'TELAH SELESAI?', BEBAS, 168, 540, 1570, 10.5, 14.2, GOLD, din=0.6)
        img = overlay(img, NAVY, eio(prog(t, 13.9, 15.0)))
        r = prog(t, 14.1, 15.0)
        if r > 0:
            put(img, self.rp, 540, 760, scale=max(0.01, eback(r)), rot=90 * (1 - eout(r)), alpha=eout(r))

        # opening: red/white flag halves part to reveal the city
        o = prog(t, 0.0, 1.6)
        if o < 1:
            fl = self.full.frame(15.0 + t, amp=1 - o)
            e = eio(o)
            redh = fl.crop((0, 0, W, fl.height // 2))
            wh = fl.crop((0, fl.height // 2, W, fl.height))
            sh = e * (H / 2 + 80)
            d = ImageDraw.Draw(img)
            d.rectangle([0, -sh - 100, W, H / 2 - sh - 40], fill=RED + (255,))
            d.rectangle([0, H / 2 + sh + 40, W, H + sh + 100], fill=WHITE + (255,))
            put(img, redh, 0, -self.full.A - sh, anchor='tl')
            put(img, wh, 0, H / 2 + sh, anchor='tl')
        return img.convert('RGB')


SCENES = [Scene1, Scene2]
