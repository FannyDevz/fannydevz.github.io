'use strict';

/* ==========================================================
   The Button Apocalypse
   1. Data   2. Simpanan   3. Waktu permainan   4. Tombol
   5. Fase   6. Event      7. Boss              8. Alur
   9. Tampilan dan kontrol
   ========================================================== */

/* ---------- 1. Data ---------- */

const CAMPAIGN_GOAL = 100;
const MAX_LIVES = 5;

const PHASES = [
  { at: 0,  id: 'normal', name: 'Tombol biasa', intro: 'Tekan tombolnya', note: 'Ini mudah. Nikmati selagi bisa.' },
  { at: 15, id: 'kabur',  name: 'Tombol kabur', intro: 'Dia mulai takut padamu', note: 'Tombol kini menghindari kursor. Sentuhanmu juga dia ingat.', dodge: true },
  { at: 30, id: 'kecil',  name: 'Tombol menciut', intro: 'Dia mengecil karena stres', note: 'Setiap tekanan membuatnya makin kecil. Sama seperti kamu.', shrink: true },
  { at: 45, id: 'klon',   name: 'Tombol palsu', intro: 'Baca tulisannya', note: 'Hanya TEKAN yang asli. Yang lain menyakitimu.', fakes: 2 },
  { at: 65, id: 'warna',  name: 'Aturan baru', intro: 'Warna, bukan tulisan', note: 'Ikuti warna tombolnya. Tulisannya berbohong.', rule: true },
  { at: 85, id: 'campur', name: 'Semua sekaligus', intro: 'Tidak ada lagi aturan', note: 'Manajemen tombol telah kehilangan kendali.', dodge: true, shrink: true, fakes: 1 }
];

const FAKE_LABELS = ['TEKEN', 'JANGAN', 'TEKAN?', 'TEKAM', 'BUKAN', 'TAKEN', 'NANTI'];
const RULE_COLORS = { merah: 'MERAH', biru: 'BIRU', hijau: 'HIJAU', kuning: 'KUNING' };

const PRAISE = {
  1: 'Klik pertama tercatat. Tombol belum curiga.',
  5: 'Lima klik. Kamu tampak percaya diri.',
  10: 'Sepuluh klik. Tombol mulai membicarakanmu.',
  25: 'Tombol telah membentuk serikat.',
  50: 'Setengah jalan. Tombol tidak senang.',
  75: 'Tombol menghubungi pengacaranya.',
  95: 'Ada sesuatu yang bangun di bawah sana.'
};

const ACHIEVEMENTS = [
  { id: 'first', name: 'First Click', desc: 'Menekan tombol yang jelas-jelas dilarang.' },
  { id: 'c100', name: '100 Clicks', desc: 'Total 100 klik yang sah.' },
  { id: 'survivor', name: 'Button Survivor', desc: 'Mengalahkan Tombol Terakhir.' },
  { id: 'clean', name: 'Mata Elang', desc: 'Menang tanpa menekan satu pun tombol palsu.' },
  { id: 'fooled', name: 'Hadiahnya Mana?', desc: 'Mengklaim kemenangan palsu.' },
  { id: 'greedy', name: 'Tamak', desc: 'Menangkap total 5 tombol emas.' },
  { id: 'scab', name: 'Pelanggar Mogok', desc: 'Menekan 10 kali saat tombol sedang mogok.' },
  { id: 'loser', name: 'Kalah Sama Tombol', desc: 'Kehabisan nyawa. Oleh tombol.' },
  { id: 'wild', name: 'Bidikan Kacau', desc: 'Total 100 klik meleset.' },
  { id: 'still', name: 'Why Are You Still Here?', desc: 'Bermain total 10 menit.' },
  { id: 'endless', name: 'Tidak Ada Kegiatan Lain', desc: 'Mencapai 300 klik dalam satu sesi endless.' }
];

const SKINS = {
  merah: { name: 'Merah Klasik', color: '#d9221c' },
  hijau: { name: 'Hijau Beracun', color: '#27b53d', need: 'c100' },
  biru:  { name: 'Biru Palsu', color: '#1c7fd6', need: 'fooled' },
  emas:  { name: 'Emas Murni', color: '#e3a812', need: 'survivor' },
  hantu: { name: 'Tombol Hantu', color: '#9e9bb2', need: 'still' },
  hitam: { name: 'Hitam Pekat', color: '#26252a', need: 'endless' }
};

/* ---------- 2. Simpanan ---------- */

const SAVE_KEY = 'button-apocalypse-v1';
const defaults = () => ({
  best: 0, bestEndless: 0, wins: 0, runs: 0,
  totals: { clicks: 0, misses: 0, fakes: 0, spawned: 0, playMs: 0, gold: 0, strikeHits: 0 },
  ach: {}, skin: 'merah',
  settings: { sound: true, calm: false }
});
function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && raw.totals && raw.settings) {
      const d = defaults();
      return { ...d, ...raw, totals: { ...d.totals, ...raw.totals }, settings: { ...d.settings, ...raw.settings }, ach: raw.ach || {} };
    }
  } catch (e) { /* mulai dari awal */ }
  return defaults();
}
let DATA = loadSave();
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(DATA)); } catch (e) { /* main tetap jalan */ }
}

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reducedMotion = () => DATA.settings.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Status satu permainan ---------- */

let G = null;
const arena = $('#arena'), field = $('#field');
let A = { w: 800, h: 500 };
let usingTouch = false;
let uid = 0;

function newGame(mode) {
  return {
    mode, state: 'playing', frozen: false,
    score: 0, clicks: 0, misses: 0, fakes: 0, spawned: 0, gold: 0,
    streak: 0, lastHit: 0, lives: MAX_LIVES, playMs: 0,
    phase: null, phaseIdx: -1, buttons: new Map(), main: null,
    tasks: [], event: null, nextEventIn: 11000,
    strike: false, reverse: false, ruleTarget: null, ruleHits: 0,
    nextDodge: 0, boss: null, endlessStep: 0
  };
}

/* ---------- 3. Waktu permainan ----------
   Semua jeda memakai after(), sehingga tombol Jeda menghentikan semuanya sekaligus. */

function after(ms, fn, tag = '') {
  const t = { left: ms, fn, tag };
  G.tasks.push(t);
  return t;
}
function cancelTag(tag) { G.tasks = G.tasks.filter((t) => t.tag !== tag); }

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastFrame);
  lastFrame = now;
  if (G && G.state === 'playing' && !G.frozen) step(dt);
  requestAnimationFrame(frame);
}

function step(dt) {
  G.playMs += dt;
  DATA.totals.playMs += dt;
  if (DATA.totals.playMs >= 600000) unlock('still');

  const due = [];
  G.tasks = G.tasks.filter((t) => {
    t.left -= dt;
    if (t.left <= 0) { due.push(t); return false; }
    return true;
  });
  due.forEach((t) => { if (G && G.state === 'playing') t.fn(); });
  if (!G || G.state !== 'playing') return;

  // Rantai kombo putus kalau terlalu lama diam.
  if (G.streak && performance.now() - G.lastHit > 1600) { G.streak = 0; renderHud(); }

  // Tombol yang bergerak terus-menerus.
  G.buttons.forEach((b) => {
    if (b.vx || b.vy) {
      b.x += b.vx * dt / 1000;
      b.y += b.vy * dt / 1000;
      if (b.bounce) {
        const r = b.size / 2;
        if (b.x < r || b.x > A.w - r) { b.vx *= -1; b.x = clamp(b.x, r, A.w - r); }
        if (b.y < r || b.y > A.h - r) { b.vy *= -1; b.y = clamp(b.y, r, A.h - r); }
      } else if (b.y > A.h + b.size) {
        removeButton(b);
        return;
      }
      paint(b);
    }
  });

  if (!G.boss && !G.event) {
    G.nextEventIn -= dt;
    if (G.nextEventIn <= 0 && G.clicks >= 8) startRandomEvent();
  }
}

/* ---------- 4. Tombol ---------- */

function measure() {
  A = { w: arena.offsetWidth, h: arena.offsetHeight };
  if (!G) return;
  G.buttons.forEach((b) => {
    b.size = Math.min(b.size, Math.min(A.w, A.h) * .9);
    b.x = clamp(b.x, b.size / 2, A.w - b.size / 2);
    b.y = clamp(b.y, b.size / 2, A.h - b.size / 2);
    paint(b);
  });
}
function baseSize() { return clamp(Math.min(A.w, A.h) * .44, 120, 270); }

function paint(b) {
  b.el.style.width = `${b.size}px`;
  b.el.style.height = `${b.size}px`;
  b.el.style.transform = `translate(${(b.x - b.size / 2).toFixed(1)}px, ${(b.y - b.size / 2).toFixed(1)}px)`;
  b.el.style.setProperty('--label', `${Math.max(11, b.size * (b.labelScale || .19)).toFixed(1)}px`);
}

function spawn(kind, opts = {}) {
  const size = opts.size || 96;
  const pos = opts.x !== undefined ? { x: opts.x, y: opts.y } : freeSpot(size);
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `bb instant ${opts.cls || ''}`;
  const cap = document.createElement('span');
  cap.className = 'cap';
  cap.textContent = opts.label || 'TEKAN';
  el.appendChild(cap);
  const b = { id: ++uid, kind, el, cap, size, x: pos.x, y: pos.y, vx: opts.vx || 0, vy: opts.vy || 0, bounce: !!opts.bounce, labelScale: opts.labelScale, color: opts.color };
  G.buttons.set(b.id, b);
  G.spawned++;
  DATA.totals.spawned++;
  paint(b);
  field.appendChild(el);
  requestAnimationFrame(() => el.classList.remove('instant'));
  el.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    usingTouch = ev.pointerType !== 'mouse';
    press(b, ev);
  });
  // Keyboard: Enter dan Spasi menghasilkan click tanpa penunjuk.
  el.addEventListener('click', (ev) => { if (ev.detail === 0) press(b, null); });
  if (opts.ttl) after(opts.ttl, () => removeButton(b), `b${b.id}`);
  return b;
}

function removeButton(b) {
  if (!G.buttons.has(b.id)) return;
  G.buttons.delete(b.id);
  cancelTag(`b${b.id}`);
  b.el.remove();
  if (G.main === b) G.main = null;
}
function clearButtons(filter = () => true) {
  [...G.buttons.values()].filter(filter).forEach(removeButton);
}

function freeSpot(size, awayFrom) {
  const m = size / 2 + 6;
  let spot = { x: A.w / 2, y: A.h / 2 };
  for (let i = 0; i < 16; i++) {
    spot = { x: rand(m, Math.max(m, A.w - m)), y: rand(m, Math.max(m, A.h - m)) };
    const others = [...G.buttons.values()].every((o) => Math.hypot(o.x - spot.x, o.y - spot.y) > (o.size + size) / 2 + 6);
    const far = !awayFrom || Math.hypot(awayFrom.x - spot.x, awayFrom.y - spot.y) > Math.min(A.w, A.h) * .38;
    if (others && far) break;
  }
  return spot;
}
function moveTo(b, spot) { b.x = spot.x; b.y = spot.y; paint(b); }
function relocate(b) {
  // Dikeluarkan sebentar agar pencarian tempat tidak menghindari dirinya sendiri.
  G.buttons.delete(b.id);
  const spot = freeSpot(b.size, { x: b.x, y: b.y });
  G.buttons.set(b.id, b);
  moveTo(b, spot);
}

function spawnMain() {
  const b = spawn('main', { size: baseSize(), x: A.w / 2, y: A.h / 2 });
  G.main = b;
  return b;
}

function pulseCap(b) {
  b.el.classList.add('down');
  setTimeout(() => b.el.classList.remove('down'), 70);
}
function floatText(text, x, y, cls = '') {
  const f = document.createElement('div');
  f.className = `float ${cls}`;
  f.textContent = text;
  f.style.left = `${x - 16}px`;
  f.style.top = `${y - 18}px`;
  if (G && G.reverse) f.style.transform = 'rotate(180deg)';
  field.appendChild(f);
  setTimeout(() => f.remove(), 720);
}

function multiplier() { return Math.min(8, 1 + Math.floor(G.streak / 6)); }

function award(base, b, opts = {}) {
  G.streak++;
  G.lastHit = performance.now();
  const gained = base * multiplier();
  G.score += gained;
  if (opts.count !== false) {
    G.clicks++;
    DATA.totals.clicks++;
    if (PRAISE[G.clicks] && G.mode === 'campaign') say(PRAISE[G.clicks]);
    if (G.clicks === 1) unlock('first');
    if (DATA.totals.clicks >= 100) unlock('c100');
    if (G.mode === 'endless' && G.clicks >= 300) unlock('endless');
  }
  floatText(`+${gained}`, b.x, b.y - b.size * .2, opts.cls || '');
  renderHud();
  checkProgress();
}

function hurt(text, b) {
  G.lives--;
  G.streak = 0;
  G.score = Math.max(0, G.score - 15);
  floatText('-15', b ? b.x : A.w / 2, b ? b.y : A.h / 2, 'bad');
  say(text);
  shake();
  sfx.bad();
  renderHud();
  if (G.lives <= 0) endGame(false);
}

function press(b, ev) {
  if (!G || G.state !== 'playing' || G.frozen) return;
  pulseCap(b);

  if (G.strike && b.kind !== 'gold') {
    G.misses++;
    DATA.totals.misses++;
    DATA.totals.strikeHits++;
    if (DATA.totals.strikeHits >= 10) unlock('scab');
    floatText('MOGOK', b.x, b.y, 'bad');
    sfx.no();
    return;
  }

  switch (b.kind) {
    case 'main': return pressMain(b);
    case 'fake':
      G.fakes++;
      DATA.totals.fakes++;
      removeButton(b);
      return hurt(`Itu tulisannya "${b.cap.textContent}". Baca dulu.`, b);
    case 'rule': return pressRule(b);
    case 'clone':
      sfx.hit();
      award(1, b, { cls: 'good' });
      removeButton(b);
      return undefined;
    case 'rain':
      sfx.pop();
      award(2, b, { cls: 'good', count: false });
      removeButton(b);
      return undefined;
    case 'gold':
      G.gold++;
      DATA.totals.gold++;
      if (DATA.totals.gold >= 5) unlock('greedy');
      sfx.gold();
      award(50, b);
      say('Tombol emas. Kamu kaya sebentar.');
      removeButton(b);
      return undefined;
    case 'boss': return pressBoss(b);
    case 'battery': return pressBattery(b);
    default: return undefined;
  }
}

function pressMain(b) {
  if (b.frozen) {
    b.frozen--;
    sfx.ice();
    floatText(`${b.frozen || 'PECAH'}`, b.x, b.y, 'good');
    if (!b.frozen) {
      b.el.classList.remove('frozen');
      b.cap.textContent = 'TEKAN';
      say('Es pecah. Tombol kembali bekerja dan sedikit tersinggung.');
    }
    return;
  }
  sfx.hit();
  award(1, b);
  if (!G.main || G.state !== 'playing') return;
  const p = G.phase;
  if (!p) return;
  if (p.shrink) {
    b.size *= .87;
    if (b.size < 62) {
      b.size = baseSize();
      G.score += 10;
      floatText('LAHIR KEMBALI +10', b.x, b.y - 26, 'good');
    }
    paint(b);
  }
  if (p.fakes) refreshFakes(b, p.fakes);
  else if (p.dodge && usingTouch) relocate(b);
}

/* Tombol asli berpindah dan dikawal tombol palsu yang tertulis mirip. */
function refreshFakes(main, count) {
  clearButtons((o) => o.kind === 'fake');
  relocate(main);
  for (let i = 0; i < count; i++) {
    spawn('fake', { size: main.size, label: pick(FAKE_LABELS), ttl: 4200 });
  }
}

function pressRule(b) {
  if (b.color === G.ruleTarget) {
    sfx.hit();
    G.ruleHits++;
    award(1, b);
    if (G.phase && G.phase.rule) setupRule(G.ruleHits % 4 === 0);
  } else {
    G.fakes++;
    DATA.totals.fakes++;
    hurt(`Itu ${b.color}. Yang diminta ${G.ruleTarget}.`, b);
    if (G.state === 'playing' && G.phase && G.phase.rule) setupRule(false);
  }
}

function setupRule(newTarget) {
  clearButtons((o) => o.kind === 'rule');
  const colors = Object.keys(RULE_COLORS);
  if (newTarget || !G.ruleTarget) G.ruleTarget = pick(colors.filter((c) => c !== G.ruleTarget));
  const labels = colors.slice().sort(() => Math.random() - .5);
  const size = clamp(Math.min(A.w, A.h) * .27, 88, 165);
  colors.forEach((c, i) => {
    // Tulisan sengaja diusahakan tidak cocok dengan warnanya.
    let label = labels[i];
    if (label === c) label = labels[(i + 1) % labels.length];
    spawn('rule', { size, color: c, cls: `rule-${c}`, label: RULE_COLORS[label], labelScale: .17 });
  });
  const card = $('#ruleCard');
  card.textContent = `TEKAN YANG WARNANYA ${RULE_COLORS[G.ruleTarget]}`;
  const small = document.createElement('small');
  small.textContent = 'warna, bukan tulisan';
  card.appendChild(small);
  card.hidden = false;
  requestAnimationFrame(measure);
}

function setupDodge() {
  arena.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    usingTouch = false;
    if (!G || G.state !== 'playing' || G.frozen) return;
    const dodging = G.main && G.phase && G.phase.dodge && !G.main.frozen && !G.strike;
    if (!dodging) return;
    const now = performance.now();
    if (now < G.nextDodge) return;
    const box = arena.getBoundingClientRect();
    let x = ev.clientX - box.left, y = ev.clientY - box.top;
    if (G.reverse) { x = box.width - x; y = box.height - y; }
    const b = G.main;
    if (Math.hypot(b.x - x, b.y - y) < b.size / 2 + 34) {
      G.nextDodge = now + 620;   // jeda inilah celah untuk menangkapnya
      moveTo(b, freeSpot(b.size, { x, y }));
    }
  });
}

/* ---------- 5. Fase ---------- */

function setPhase(idx) {
  G.phaseIdx = idx;
  G.phase = PHASES[idx];
  const p = G.phase;
  $('#hudPhase').textContent = p.name;
  $('#ruleCard').hidden = true;
  clearButtons((o) => ['fake', 'rule', 'main'].includes(o.kind));
  G.main = null;
  if (p.rule) {
    G.ruleTarget = null;
    setupRule(true);
  } else {
    requestAnimationFrame(measure);
    spawnMain();
    if (p.fakes) refreshFakes(G.main, p.fakes);
  }
  if (idx > 0 || G.mode === 'endless') banner(p.intro);
  say(p.note);
}

function checkProgress() {
  if (G.state !== 'playing') return;
  if (G.mode === 'campaign') {
    if (!G.boss && G.clicks >= CAMPAIGN_GOAL) { startBoss(); return; }
    let idx = 0;
    PHASES.forEach((p, i) => { if (G.clicks >= p.at) idx = i; });
    if (idx !== G.phaseIdx && !G.boss) setPhase(idx);
  } else if (G.mode === 'endless') {
    const step = Math.floor(G.clicks / 20);
    if (step !== G.endlessStep) {
      G.endlessStep = step;
      let idx;
      do { idx = 1 + Math.floor(Math.random() * (PHASES.length - 1)); } while (idx === G.phaseIdx);
      setPhase(idx);
    }
  }
}

/* ---------- 6. Event ---------- */

const EVENTS = {
  panic: { needsMain: true, run() {
    say('BUTTON PANIC. Tombol lupa cara diam.');
    banner('Button Panic');
    const hop = () => {
      if (G.main) relocate(G.main);
      if (G.event === 'panic') after(680, hop, 'event');
    };
    hop();
    endEventAfter(5500);
  } },
  clone: { run() {
    say('BUTTON CLONE. Lima tombol tambahan, semuanya asli, kali ini.');
    banner('Button Clone');
    for (let i = 0; i < 5; i++) {
      spawn('clone', { size: clamp(Math.min(A.w, A.h) * .19, 70, 110), label: 'TEKAN', ttl: 5200, cls: 'clone' });
    }
    endEventAfter(5200);
  } },
  reverse: { run() {
    say('REVERSE DAY. Hari ini bawah adalah atas.');
    G.reverse = true;
    arena.classList.add('flipped');
    endEventAfter(7000, () => {
      G.reverse = false;
      arena.classList.remove('flipped');
    });
  } },
  fake: { run() { fakeVictory(false); } },
  strike: { needsAny: true, run() {
    say('BUTTON STRIKE. Tombol menuntut upah layak. Jangan melanggar garis.');
    banner('Button Strike');
    G.strike = true;
    G.buttons.forEach((b) => { b.el.classList.add('struck'); });
    endEventAfter(4200, () => {
      G.strike = false;
      G.buttons.forEach((b) => b.el.classList.remove('struck'));
      say('Mogok berakhir. Tuntutan ditolak.');
    });
  } },
  gold: { run() {
    say('GOLDEN BUTTON. Cepat, dia sibuk.');
    sfx.gold();
    spawn('gold', { size: clamp(Math.min(A.w, A.h) * .19, 70, 110), label: 'EMAS', cls: 'gold', ttl: 2800 });
    endEventAfter(2800);
  } },
  freeze: { needsMain: true, run() {
    say('TOMBOL BEKU. Tekan lima kali untuk memecahkan es.');
    const b = G.main;
    b.frozen = 5;
    b.el.classList.add('frozen');
    b.cap.textContent = 'BEKU';
    endEventAfter(1500);
  } },
  rain: { run() {
    say('HUJAN TOMBOL. Bawa payung, atau tekan saja.');
    banner('Hujan Tombol');
    const drop = () => {
      spawn('rain', { size: rand(46, 72), x: rand(40, Math.max(41, A.w - 40)), y: -40, vy: rand(150, 300), cls: 'clone', label: '+2', labelScale: .34 });
      if (G.event === 'rain') after(190, drop, 'event');
    };
    drop();
    endEventAfter(6000);
  } }
};

function startRandomEvent() {
  const keys = Object.keys(EVENTS).filter((k) => {
    const e = EVENTS[k];
    if (e.needsMain && !G.main) return false;
    return k !== G.lastEvent;
  });
  const key = pick(keys);
  G.event = key;
  G.lastEvent = key;
  EVENTS[key].run();
}

function endEventAfter(ms, cleanup) {
  after(ms, () => {
    if (cleanup) cleanup();
    finishEvent();
  }, 'event-end');
}
function finishEvent() {
  G.event = null;
  const pace = G.mode === 'endless' ? Math.max(4000, 11000 - G.clicks * 15) : (G.clicks > 60 ? 8500 : 11000);
  G.nextEventIn = rand(pace * .8, pace * 1.3);
}

/* Layar kemenangan yang tidak benar. Dipakai event biasa dan kematian palsu boss. */
function fakeVictory(fromBoss) {
  G.frozen = true;
  G.event = G.event || 'fake';
  $('#fakeTitle').textContent = fromBoss ? 'TOMBOL TERAKHIR KALAH!' : 'KAMU MENANG!';
  $('#fakeText').textContent = fromBoss
    ? 'Selamat. Dunia aman. Silakan ambil hadiahmu dan pulang.'
    : `Selamat! Kamu pemain ke-${(Math.floor(rand(1000, 9000))).toLocaleString('id-ID')} yang memenangkan tombol ini.`;
  $('#fakeWin').dataset.boss = fromBoss ? '1' : '';
  $('#fakeWin').hidden = false;
  sfx.level();
  $('#fakeBtn').focus();
}
function claimFakeVictory() {
  const fromBoss = $('#fakeWin').dataset.boss === '1';
  $('#fakeWin').hidden = true;
  unlock('fooled');
  G.frozen = false;
  G.score = Math.max(0, G.score - 5);
  renderHud();
  shake();
  sfx.bad();
  if (fromBoss) {
    banner('Dia cuma pura-pura');
    say('Tombol Terakhir membuka satu mata. Hadiahmu adalah lanjut bermain.');
    G.event = null;
    bossRevive();
  } else {
    banner('Bercanda');
    say('Tidak ada hadiah. Biaya klaim: 5 poin.');
    finishEvent();
  }
}

/* ---------- 7. Boss ---------- */

const TAUNTS = ['Itu saja?', 'Aku punya tombol di dalam tombol.', 'Jarimu terlihat lelah.', 'Kamu tahu ini tidak dibayar, kan?', 'Aku sudah menekan balik sejak tadi.'];

function startBoss() {
  G.boss = { hp: 60, max: 60, stage: 1, playedDead: false, open: false, btn: null };
  cancelTag('event');
  cancelTag('event-end');
  G.event = null;
  G.strike = false;
  if (G.reverse) { G.reverse = false; arena.classList.remove('flipped'); }
  clearButtons();
  $('#ruleCard').hidden = true;
  $('#hudPhase').textContent = 'Tombol Terakhir';
  $('#bossBar').hidden = false;
  banner('Tombol Terakhir bangun');
  say('Semua tombol tadi hanya karyawan. Ini pemiliknya.');
  sfx.level();
  requestAnimationFrame(() => {
    measure();
    const size = clamp(Math.min(A.w, A.h) * .4, 130, 240);
    const speed = clamp(A.w * .17, 80, 180);
    G.boss.btn = spawn('boss', { size, x: A.w / 2, y: A.h / 2, cls: 'boss', label: 'BOSS', vx: speed, vy: speed * .7, bounce: true, labelScale: .24 });
    G.boss.btn.el.classList.add('instant');
    scheduleTaunt();
    renderBoss();
  });
}
function scheduleTaunt() {
  after(rand(6000, 9000), () => {
    if (!G.boss) return;
    say(`Tombol Terakhir: "${pick(TAUNTS)}"`);
    scheduleTaunt();
  }, 'boss');
}
function renderBoss() {
  const b = G.boss;
  $('#bossFill').style.width = `${clamp(b.hp / b.max * 100, 0, 100)}%`;
}

function pressBoss(btn) {
  const boss = G.boss;
  if (!boss) return;
  if (boss.stage === 2 && !boss.open) {
    floatText('PERISAI', btn.x, btn.y, 'bad');
    sfx.no();
    G.streak = 0;
    renderHud();
    return;
  }
  if (boss.stage === 3 && !boss.open) {
    boss.hp = Math.min(20, boss.hp + 1);
    G.streak = 0;
    floatText('+1 HP BOSS', btn.x, btn.y, 'bad');
    sfx.no();
    renderBoss();
    renderHud();
    return;
  }
  sfx.boss();
  boss.hp--;
  award(3, btn);
  renderBoss();
  shake();
  if (boss.hp <= 0) return bossZero();
  if (boss.stage === 1 && boss.hp <= 40) bossStage2();
  else if (boss.stage === 2 && boss.hp <= 20) bossStage3();
  return undefined;
}

function bossStage2() {
  const boss = G.boss;
  boss.stage = 2;
  boss.btn.vx *= .7;
  boss.btn.vy *= .7;
  banner('Fase dua: perisai');
  say('Hancurkan tiga baterai untuk mematikan perisainya.');
  shieldUp();
}
function shieldUp() {
  const boss = G.boss;
  if (!boss || boss.stage !== 2) return;
  boss.open = false;
  boss.btn.el.classList.add('shielded');
  boss.btn.el.classList.remove('open');
  boss.btn.cap.textContent = 'BOSS';
  const size = clamp(Math.min(A.w, A.h) * .15, 60, 82);
  for (let i = 0; i < 3; i++) spawn('battery', { size, label: 'BATERAI', cls: 'battery', labelScale: .16 });
}
function pressBattery(b) {
  sfx.pop();
  removeButton(b);
  G.score += 5;
  floatText('+5', b.x, b.y, 'good');
  renderHud();
  const left = [...G.buttons.values()].some((o) => o.kind === 'battery');
  if (left || !G.boss) return;
  const boss = G.boss;
  boss.open = true;
  boss.btn.el.classList.remove('shielded');
  boss.btn.el.classList.add('open');
  boss.btn.cap.textContent = 'SEKARANG';
  say('Perisai mati. Lima detik. Cepat.');
  after(5000, () => { if (G.boss && G.boss.stage === 2) shieldUp(); }, 'shield');
}

function bossStage3() {
  const boss = G.boss;
  cancelTag('shield');
  clearButtons((o) => o.kind === 'battery');
  boss.stage = 3;
  boss.btn.el.classList.remove('shielded', 'open');
  boss.btn.size *= .82;
  boss.btn.vx *= 1.8;
  boss.btn.vy *= 1.8;
  paint(boss.btn);
  banner('Fase tiga: hanya saat hijau');
  say('Tekan hanya saat dia hijau. Saat merah, dia menyerap tekananmu.');
  bossWindow(false);
}
function bossWindow(open) {
  const boss = G.boss;
  if (!boss || boss.stage !== 3) return;
  boss.open = open;
  boss.btn.el.classList.toggle('open', open);
  boss.btn.cap.textContent = open ? 'TEKAN' : 'JANGAN';
  after(open ? 1500 : 1300, () => bossWindow(!open), 'window');
}
function bossZero() {
  const boss = G.boss;
  if (!boss.playedDead) {
    boss.playedDead = true;
    cancelTag('window');
    fakeVictory(true);
    return;
  }
  winGame();
}
function bossRevive() {
  const boss = G.boss;
  boss.hp = 6;
  boss.max = 20;
  renderBoss();
  bossWindow(false);
}

/* ---------- 8. Alur ---------- */

function startGame(mode) {
  clearField();
  G = newGame(mode);
  DATA.runs++;
  document.querySelectorAll('.overlay').forEach((o) => { o.hidden = true; });
  $('#bossBar').hidden = true;
  $('#ruleCard').hidden = true;
  arena.classList.remove('flipped');
  measure();
  if (mode === 'endless') { G.endlessStep = 0; setPhase(1); }
  else setPhase(0);
  sfx.hit();
  renderHud();
  persist();
}
function clearField() { field.textContent = ''; }

function pauseGame() {
  if (!G || G.state !== 'playing' || G.frozen) return;
  G.state = 'paused';
  $('#pauseScreen').hidden = false;
  $('#resumeBtn').focus();
  persist();
}
function resumeGame() {
  if (!G || G.state !== 'paused') return;
  G.state = 'playing';
  G.lastHit = performance.now();
  $('#pauseScreen').hidden = true;
}

function statRows(rows, target) {
  target.textContent = '';
  rows.forEach(([k, v]) => {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = k;
    dd.textContent = v;
    target.append(dt, dd);
  });
}
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}d`;
}

function endScreen(kicker, title, text, showEndless) {
  G.state = 'ended';
  $('#endKicker').textContent = kicker;
  $('#endTitle').textContent = title;
  $('#endText').textContent = text;
  statRows([
    ['Skor', G.score.toLocaleString('id-ID')],
    ['Total klik', G.clicks],
    ['Klik gagal', G.misses],
    ['Tombol palsu ditekan', G.fakes],
    ['Tombol yang muncul', G.spawned],
    ['Waktu bermain', formatTime(G.playMs)]
  ], $('#endStats'));
  $('#endEndlessBtn').hidden = !showEndless;
  $('#endScreen').hidden = false;
  $('#againBtn').focus();
  renderTitle();
  persist();
}

function recordScore() {
  const key = G.mode === 'endless' ? 'bestEndless' : 'best';
  const isBest = G.score > DATA[key];
  if (isBest) DATA[key] = G.score;
  return isBest;
}

function endGame() {
  const isBest = recordScore();
  unlock('loser');
  sfx.lose();
  const title = G.mode === 'endless' ? 'Akhirnya berhenti' : 'Tombol menang';
  const line = isBest ? 'Rekor baru, untuk apa pun itu berarti.' : 'Nyawamu habis. Tombolnya masih utuh, dan dia ingin kamu tahu itu.';
  endScreen('Laporan kekalahan', title, line, DATA.wins > 0);
}

function winGame() {
  G.score += G.lives * 100;
  DATA.wins++;
  unlock('survivor');
  if (G.fakes === 0) unlock('clean');
  recordScore();
  G.boss = null;
  clearButtons();
  sfx.level();
  endScreen('Laporan kemenangan', 'Kali ini beneran', 'Tombol Terakhir sudah kalah. Kali ini sungguhan. Mode Endless terbuka untukmu yang masih punya waktu.', true);
}

function quitGame() {
  recordScore();
  G.state = 'ended';
  G = null;
  clearField();
  showTitle();
}

function showTitle() {
  document.querySelectorAll('.overlay').forEach((o) => { o.hidden = true; });
  $('#bossBar').hidden = true;
  $('#ruleCard').hidden = true;
  arena.classList.remove('flipped');
  $('#titleScreen').hidden = false;
  $('#hudPhase').textContent = 'Siaga';
  renderTitle();
}

/* ---------- 9. Tampilan dan kontrol ---------- */

function say(text) { $('#ticker').textContent = text; }

function banner(text) {
  const el = $('#banner');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}
function shake() {
  if (reducedMotion()) return;
  arena.classList.remove('shake');
  void arena.offsetWidth;
  arena.classList.add('shake');
}

function renderHud() {
  if (!G) return;
  $('#hudScore').textContent = G.score.toLocaleString('id-ID');
  $('#hudClicks').textContent = G.clicks;
  $('#hudCombo').textContent = `x${multiplier()}`;
  const lives = Math.max(0, G.lives);
  const hearts = $('#hudLives');
  hearts.textContent = '♥'.repeat(lives) + '♡'.repeat(MAX_LIVES - lives);
  hearts.setAttribute('aria-label', `${lives} dari ${MAX_LIVES} nyawa`);
  $('#hudProgress').style.width = G.mode === 'campaign'
    ? `${clamp(G.clicks / CAMPAIGN_GOAL * 100, 0, 100)}%`
    : `${(G.clicks % 20) * 5}%`;
}

function renderTitle() {
  const parts = [];
  if (DATA.best) parts.push(`Rekor: ${DATA.best.toLocaleString('id-ID')}`);
  if (DATA.bestEndless) parts.push(`Endless: ${DATA.bestEndless.toLocaleString('id-ID')}`);
  $('#titleBest').textContent = parts.join('  |  ');
  $('#endlessBtn').hidden = DATA.wins === 0;
}

function unlock(id) {
  if (DATA.ach[id]) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  DATA.ach[id] = Date.now();
  say(`Pencapaian: ${a.name}.`);
  sfx.ach();
  persist();
}

function applySkin() { document.documentElement.dataset.skin = DATA.skin; }

function renderPanel() {
  const grid = $('#skinGrid');
  grid.textContent = '';
  Object.entries(SKINS).forEach(([key, s]) => {
    const open = !s.need || DATA.ach[s.need];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skin';
    btn.disabled = !open;
    btn.setAttribute('aria-pressed', String(DATA.skin === key));
    const dot = document.createElement('i');
    dot.style.background = s.color;
    btn.appendChild(dot);
    const needName = s.need && ACHIEVEMENTS.find((a) => a.id === s.need).name;
    btn.append(open ? s.name : `Perlu: ${needName}`);
    btn.addEventListener('click', () => {
      DATA.skin = key;
      applySkin();
      persist();
      renderPanel();
    });
    grid.appendChild(btn);
  });

  const list = $('#achList');
  list.textContent = '';
  ACHIEVEMENTS.forEach((a) => {
    const li = document.createElement('li');
    if (DATA.ach[a.id]) li.className = 'got';
    li.appendChild(document.createElement('i'));
    const body = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = a.name;
    const span = document.createElement('span');
    span.textContent = a.desc;
    body.append(b, span);
    li.appendChild(body);
    list.appendChild(li);
  });
  $('#achTitle').textContent = `Pencapaian (${Object.keys(DATA.ach).length} dari ${ACHIEVEMENTS.length})`;

  const t = DATA.totals;
  statRows([
    ['Total klik', t.clicks.toLocaleString('id-ID')],
    ['Klik gagal', t.misses.toLocaleString('id-ID')],
    ['Tombol palsu ditekan', t.fakes.toLocaleString('id-ID')],
    ['Tombol yang muncul', t.spawned.toLocaleString('id-ID')],
    ['Waktu bermain', formatTime(t.playMs)],
    ['Kemenangan sungguhan', DATA.wins]
  ], $('#lifeStats'));
}

/* Suara dibuat langsung dengan Web Audio, tanpa file. */
let audio = null;
function tone(freq, dur = .1, type = 'square', gain = .05, delay = 0, slide = 0) {
  if (!DATA.settings.sound) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    audio = audio || new AC();
    if (audio.state === 'suspended') audio.resume();
    const t = audio.currentTime + delay;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur + .02);
  } catch (e) { /* suara hanya pelengkap */ }
}
const sfx = {
  hit() { tone(170 + Math.min(G ? G.streak : 0, 30) * 12, .07); },
  pop() { tone(760, .05, 'sine', .08); },
  no() { tone(90, .1, 'sawtooth', .04); },
  bad() { tone(200, .25, 'sawtooth', .07, 0, 60); },
  ice() { tone(1500, .05, 'triangle', .05); },
  gold() { [880, 1175, 1568].forEach((f, i) => tone(f, .12, 'triangle', .06, i * .06)); },
  boss() { tone(70, .09, 'square', .09); },
  ach() { [660, 990].forEach((f, i) => tone(f, .14, 'sine', .06, i * .09)); },
  level() { [392, 523, 659, 784].forEach((f, i) => tone(f, .16, 'square', .045, i * .1)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, .24, 'sawtooth', .05, i * .15)); }
};

function setup() {
  applySkin();
  document.documentElement.classList.toggle('calm', DATA.settings.calm);
  $('#optSound').checked = DATA.settings.sound;
  $('#optCalm').checked = DATA.settings.calm;
  renderTitle();
  measure();
  setupDodge();
  window.addEventListener('resize', measure);

  // Menekan arena kosong dihitung meleset.
  arena.addEventListener('pointerdown', (ev) => {
    usingTouch = ev.pointerType !== 'mouse';
    if (!G || G.state !== 'playing' || G.frozen) return;
    G.misses++;
    DATA.totals.misses++;
    if (DATA.totals.misses >= 100) unlock('wild');
    if (G.streak) { G.streak = Math.floor(G.streak / 2); renderHud(); }
  });

  $('#startBtn').addEventListener('click', () => {
    startGame('campaign');
    say('Kamu menekannya. Tentu saja kamu menekannya.');
  });
  $('#endlessBtn').addEventListener('click', () => startGame('endless'));
  $('#endEndlessBtn').addEventListener('click', () => startGame('endless'));
  $('#againBtn').addEventListener('click', () => startGame(G ? G.mode : 'campaign'));
  $('#menuBtn').addEventListener('click', () => { G = null; clearField(); showTitle(); });
  $('#pauseBtn').addEventListener('click', () => {
    if (G && G.state === 'paused') resumeGame();
    else pauseGame();
  });
  $('#resumeBtn').addEventListener('click', resumeGame);
  $('#quitBtn').addEventListener('click', quitGame);
  $('#fakeBtn').addEventListener('click', claimFakeVictory);

  $('#optSound').addEventListener('change', (ev) => { DATA.settings.sound = ev.target.checked; persist(); });
  $('#optCalm').addEventListener('change', (ev) => {
    DATA.settings.calm = ev.target.checked;
    document.documentElement.classList.toggle('calm', ev.target.checked);
    persist();
  });

  $('#panelBtn').addEventListener('click', () => { renderPanel(); $('#panel').showModal(); });
  $('#panelClose').addEventListener('click', () => $('#panel').close());
  $('#wipeBtn').addEventListener('click', () => {
    if (!confirm('Hapus skor, pencapaian, dan skin? Tombol akan melupakanmu.')) return;
    DATA = defaults();
    persist();
    applySkin();
    renderTitle();
    renderPanel();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'p' || ev.key === 'P' || ev.key === 'Escape') {
      if ($('#panel').open) return;
      if (G && G.state === 'playing') pauseGame();
      else if (G && G.state === 'paused') resumeGame();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); persist(); } });
  window.addEventListener('pagehide', persist);

  requestAnimationFrame((t) => { lastFrame = t; frame(t); });
}

setup();
