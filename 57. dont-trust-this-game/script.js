/* Don't Trust This Game
   Pemandu berbohong. Catatan kaki biasanya jujur. Biasanya. */
'use strict';

const SAVE_KEY = 'jangan-percaya-v1';
const MAX_TRUST = 3;
const STAR_LEVELS = ['l1', 'l2', 'math', 'l3', 'cookie', 'l4', 'stroop', 'l5', 'volume', 'l6', 'l7', 'captcha', 'l8', 'ad', 'clock', 'l9', 'loading', 'still', 'l10'];
const RUN_VERSION = 2; // naik kalau urutan level berubah, supaya simpanan lama tidak loncat ke level lain

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ================= Simpanan ================= */

function freshSave() {
  return { v: 1, run: null, endings: [], ach: [], totals: { runs: 0, deaths: 0, obey: 0, defy: 0 }, settings: { sound: true, reduce: false } };
}
function freshRun() {
  return { sv: RUN_VERSION, step: 0, trust: MAX_TRUST, score: 0, stars: [], intro: null, path: null, deaths: 0, deathsBy: {}, obey: 0, defy: 0, fakes: [], started: Date.now() };
}
function load() {
  const base = freshSave();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && raw.v === 1) {
      base.run = raw.run && typeof raw.run.step === 'number' && raw.run.sv === RUN_VERSION ? { ...freshRun(), ...raw.run } : null;
      base.endings = Array.isArray(raw.endings) ? raw.endings.filter(id => ENDINGS[id]) : [];
      base.ach = Array.isArray(raw.ach) ? raw.ach.filter(id => ACH[id]) : [];
      base.totals = { ...base.totals, ...raw.totals };
      base.settings = { ...base.settings, ...raw.settings };
    }
  } catch (e) { /* data rusak atau storage diblokir */ }
  return base;
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) { /* abaikan */ }
}

/* ================= Data ================= */

const ENDINGS = {
  a: { n: 1, title: 'Terlalu Percaya', hint: 'Kehabisan kepercayaan.',
    text: 'Kepercayaanmu habis. Kamu mempercayai tombol, panah, hadiah, dan aku. Terutama aku. Jangan sedih, ini ending yang paling sering ditemukan.' },
  b: { n: 2, title: 'Kemenangan Palsu', hint: 'Lakukan yang disuruh di level terakhir.',
    text: 'Ada konfeti, ada ucapan selamat, ada rasa lega. Semuanya palsu. Kamu menekan tombol terbesar karena aku menyuruhmu, setelah sembilan belas level belajar untuk tidak melakukannya.' },
  c: { n: 3, title: 'Pintu Belakang', hint: 'Ada tombol kecil yang tidak pernah kusebut.',
    text: 'Kamu menyerah, dan justru itu jalan keluarnya. Satu-satunya cara menang melawan game pembohong adalah berhenti bermain dengan aturannya.' },
  d: { n: 4, title: 'Pembaca Catatan Kaki', hint: 'Kumpulkan semua ✶ dalam satu permainan.',
    text: 'Kamu menemukan semua ✶ yang kusembunyikan. Kamu membaca huruf kecil, memeriksa pojok, dan tidak percaya pada permukaan. Aku bangga, dan sedikit takut.' },
  e: { n: 5, title: 'Tidak Percaya', hint: 'Jawab pertanyaan terakhir dengan jujur.',
    text: 'Kamu bilang tidak. Untuk pertama kalinya aku tidak perlu berbohong. Jadi ini kejujuran pertamaku: tidak ada pintu keluar, skornya tidak berarti apa-apa, dan kamu sudah menang sejak berhenti percaya padaku.' },
};

const ACH = {
  flawless: { title: 'Tanpa Cela', desc: 'Mencapai ending selain "Terlalu Percaya" tanpa gagal sekali pun.' },
  stars: { title: 'Kolektor ✶', desc: 'Menemukan semua ✶ dalam satu permainan.' },
  rebel: { title: 'Pembangkang', desc: 'Membangkang instruksi 15 kali (total).' },
  sheep: { title: 'Penurut Sejati', desc: 'Menuruti instruksi 15 kali (total).' },
  all: { title: 'Tamat Semua', desc: 'Menemukan kelima ending.' },
};
const FAKE_ACH = [
  { title: 'Main 100 Jam', reply: 'Tidak mungkin. Kamu baru main sebentar.' },
  { title: 'Pencapaian Rahasia', reply: 'Tidak ada. Kami bohong.' },
];

/* Pencapaian palsu: muncul, lalu dicabut. */
const FAKES = {
  click: ['Bisa Mengklik', 'dicabut karena terlalu mudah.'],
  death: ['Gagal dengan Gaya', 'ternyata tidak ada.'],
  gift: ['Pemburu Hadiah', 'hadiahnya juga palsu.'],
  move: ['Atlet Sejati', 'kamu cuma mengklik kotak.'],
  crash: ['Penguji Software', 'tidak dibayar.'],
  cookie: ['Privasi Terjaga', 'datamu sudah terjual kemarin.'],
  captcha: ['Manusia Terverifikasi', 'ternyata robot.'],
  math: ['Jenius Matematika', '2 + 2 masih 4. tidak istimewa.'],
  quiz: ['Ingatan Gajah', 'gajahnya keberatan.'],
};

/* Skor tidak stabil: kadang berubah sendiri di antara level. */
const SCORE_EVENTS = [
  ['Pajak kepercayaan: skor dipotong 30%.', s => Math.round(s * .7)],
  ['Bonus karena kamu terlihat jujur.', s => s + 500],
  ['Skor diganti angka favorit Pemandu.', () => 7],
  ['Skor dikali dua. Jangan tanya kenapa.', s => s * 2],
  ['Skor dicuri, lalu dikembalikan. Tidak semuanya.', s => Math.max(0, s - 111)],
  ['Skor dibulatkan ke bawah. Jauh ke bawah.', s => Math.floor(s / 1000) * 1000],
];

/* ================= Suara ================= */

let audio = null;
function beep(freq, dur = .12, type = 'sine', vol = .06) {
  if (!P.settings.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur);
  } catch (e) { /* audio tidak tersedia */ }
}
const sfx = {
  click: () => beep(520, .05, 'square', .03),
  win: () => { beep(660, .1); setTimeout(() => beep(880, .16), 90); },
  lose: () => { beep(220, .2, 'sawtooth', .05); setTimeout(() => beep(150, .3, 'sawtooth', .05), 140); },
  star: () => { beep(1200, .08); setTimeout(() => beep(1600, .12), 70); },
  glitch: () => beep(90, .25, 'square', .05),
};

/* ================= Jam permainan ================= */

let gtime = 0, lastTs = 0, menuOpen = false;
let timers = [], frames = [];
function loop(ts) {
  const dt = lastTs ? Math.min(100, ts - lastTs) : 16;
  lastTs = ts;
  if (!menuOpen && !document.hidden && level && !level.done) {
    gtime += dt;
    frames.slice().forEach(f => { if (!level.done) f(dt); });
    const due = timers.filter(t => t.at <= gtime);
    for (const t of due) {
      if (t.every) t.at += t.every; else timers.splice(timers.indexOf(t), 1);
      t.fn();
      if (!level || level.done) break;
    }
  }
  requestAnimationFrame(loop);
}
function clearLevelTimers() { timers = []; frames = []; }

/* ================= Narator ================= */

let typeTimer = 0;
function say(text, { mood = '' } = {}) {
  const p = $('#sayText');
  clearInterval(typeTimer);
  $('#narrator').dataset.mood = mood;
  p.dataset.full = text;
  if (isReduced()) { p.textContent = text; return; }
  // Sisa teks dirender tak terlihat supaya kotak tidak memanjang saat mengetik.
  p.innerHTML = '<span class="typed"></span><span class="rest" aria-hidden="true"></span>';
  const typed = p.firstChild, rest = p.lastChild;
  rest.textContent = text;
  let i = 0;
  typeTimer = setInterval(() => {
    i += 2;
    typed.textContent = text.slice(0, i);
    rest.textContent = text.slice(i);
    if (i >= text.length) { clearInterval(typeTimer); p.textContent = text; }
  }, 28);
}
$('#narrator').addEventListener('click', () => {
  const p = $('#sayText');
  if (p.dataset.full) { clearInterval(typeTimer); p.textContent = p.dataset.full; }
});

function fine(text) { $('#fineText').textContent = text || ''; }

/* ================= Toast ================= */

function toast(html, { cls = '', ms = 2600 } = {}) {
  const t = el('div', 'toast ' + cls, html);
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
  return t;
}

function fakeAch(key) {
  if (!run || run.fakes.includes(key)) return;
  run.fakes.push(key);
  const [title, revoke] = FAKES[key];
  const t = toast(`<span>🏆 Pencapaian terbuka</span><b>${esc(title)}</b><small></small>`, { cls: 'ach', ms: 3600 });
  setTimeout(() => { t.classList.add('revoked'); t.querySelector('small').textContent = '…' + revoke; }, 1500);
  save();
}

function realAch(id) {
  if (P.ach.includes(id)) return;
  P.ach.push(id);
  toast(`<span>🏅 Pencapaian (yang ini sungguhan)</span><b>${esc(ACH[id].title)}</b>`, { cls: 'ach real', ms: 3400 });
  save();
}

/* ================= Status permainan ================= */

let P = null;
let run = null;
let level = null;

const seq = () => ['intro', 'l1', 'l2', 'math', 'l3', 'cookie', 'l4', 'stroop', 'l5', 'volume', 'choice',
  run.path === 'bahaya' ? 'l6b' : 'l6a', 'l7', 'captcha', 'l8', 'ad', 'clock', 'l9', 'loading', 'still', 'l10', 'final'];
const starKey = id => (id === 'l6a' || id === 'l6b') ? 'l6' : id;
const isReduced = () => P.settings.reduce || matchMedia('(prefers-reduced-motion: reduce)').matches;

const playable = () => seq().filter(x => x !== 'intro' && x !== 'choice');
function levelNumber(id) {
  const key = starKey(id);
  return playable().findIndex(x => starKey(x) === key) + 1;
}

function updateHud() {
  const id = seq()[run.step];
  const n = levelNumber(id);
  $('#hudLevel').textContent = id === 'intro' ? 'Tutorial' : id === 'choice' ? 'Persimpangan' : `Level ${n}/${playable().length}`;
  $('#hudTrust').innerHTML = Array.from({ length: MAX_TRUST }, (_, i) => `<i class="${i < run.trust ? 'on' : ''}"></i>`).join('');
  $('#hudTrust').setAttribute('aria-label', `Kepercayaan ${run.trust} dari ${MAX_TRUST}`);
  $('#hudScore').textContent = run.score;
  $('#hudStars').textContent = run.stars.length ? `✶ ${run.stars.length}` : '';
}

function setScore(next) {
  run.score = Math.max(0, Math.round(next));
  const s = $('#hudScore');
  s.textContent = run.score;
  s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash');
}

function setTheme(theme) {
  document.body.className = 'theme-' + theme + (isReduced() ? ' reduce' : '');
}

/* ================= API level ================= */

function makeApi(id) {
  return {
    after(ms, fn) { timers.push({ at: gtime + ms, fn }); },
    every(ms, fn) { timers.push({ at: gtime + ms, fn, every: ms }); },
    frame(fn) { frames.push(fn); },
    say, fine,
    obey() { if (level.obeyed) return; level.obeyed = true; run.obey++; P.totals.obey++; },
    defy() { if (level.defied) return; level.defied = true; run.defy++; P.totals.defy++; },
    win(msg) { finishLevel(true, msg); },
    lose(msg) { finishLevel(false, msg); },
    next() { advance(); },
    ending(e) { showEnding(e); },
    fake: fakeAch,
    glitch() {
      sfx.glitch();
      if (isReduced()) return;
      document.body.classList.add('glitching');
      setTimeout(() => document.body.classList.remove('glitching'), 450);
    },
    run, id,
  };
}

function startStep() {
  clearLevelTimers();
  closeOverlay();
  const id = seq()[run.step];
  const L = LEVELS[id];
  level = { id, done: false, obeyed: false, defied: false, t0: gtime };
  setTheme(L.theme || 'calm');
  updateHud();
  const stage = $('#stage');
  stage.innerHTML = '';
  stage.className = 'stage stage-' + id;
  $$('.say .star').forEach(s => s.remove());
  const tries = run.deathsBy[id] || 0;
  const intro = typeof L.say === 'function' ? L.say(run) : L.say;
  say((tries ? retryLine(tries) + ' ' : '') + intro, { mood: L.mood || '' });
  fine(L.fine || '');
  L.setup(stage, makeApi(id));
  placeStar(id, L.star);
  save();
}

function retryLine(n) {
  return pick([
    `Percobaan ke-${n + 1}. Aku masih di sini, masih sama.`,
    'Lagi? Aku suka semangatmu.',
    `Kamu sudah gagal di sini ${n} kali. Aku menghitung.`,
    'Selamat datang kembali. Instruksinya tidak berubah. Mungkin.',
  ]);
}

function placeStar(id, pos) {
  const key = starKey(id);
  if (!pos || !STAR_LEVELS.includes(key) || run.stars.includes(key)) return;
  const b = el('button', 'star', '✶');
  b.setAttribute('aria-label', 'Sesuatu yang kecil');
  b.addEventListener('click', e => {
    e.stopPropagation();
    if (run.stars.includes(key)) return;
    run.stars.push(key);
    sfx.star();
    b.classList.add('got');
    setTimeout(() => b.remove(), 500);
    toast(`<b>✶ ditemukan</b><span>${run.stars.length} dari ${STAR_LEVELS.length}</span>`, { cls: 'star-toast' });
    updateHud();
    save();
  });
  if (pos === 'fine') { $('#fineText').append(' ', b); return; }
  if (pos === 'narrator') { $('.say').append(b); b.classList.add('in-say'); return; }
  b.style.left = pos.x; b.style.top = pos.y;
  $('#stage').append(b);
}

function finishLevel(won, msg) {
  if (!level || level.done) return;
  level.done = true;
  clearLevelTimers();
  const id = level.id;
  if (won) {
    sfx.win();
    const secs = (gtime - level.t0) / 1000;
    const gain = 100 + Math.max(0, Math.round(50 - secs * 2));
    const before = run.score;
    setScore(run.score + gain);
    let event = null;
    if (Math.random() < .45) {
      const [text, fn] = pick(SCORE_EVENTS);
      event = { text, from: run.score };
      setScore(fn(run.score));
      event.to = run.score;
    }
    run.step++;
    save();
    showResult({ won: true, msg, gain, before, event });
  } else {
    sfx.lose();
    run.trust--;
    run.deaths++;
    run.deathsBy[id] = (run.deathsBy[id] || 0) + 1;
    P.totals.deaths++;
    updateHud();
    save();
    if (run.trust <= 0) { setTimeout(() => showEnding('a'), 700); showResult({ won: false, msg, final: true }); return; }
    showResult({ won: false, msg });
    fakeAch('death');
  }
}

function advance() {
  if (level) level.done = true;
  clearLevelTimers();
  run.step++;
  save();
  startStep();
}

/* ================= Kartu hasil ================= */

function openOverlay(html, cls = '') {
  const card = $('#card');
  card.className = 'card ' + cls;
  card.innerHTML = html;
  $('#overlay').hidden = false;
  const first = card.querySelector('button');
  if (first) first.focus({ preventScroll: true });
}
function closeOverlay() { $('#overlay').hidden = true; menuOpen = false; }

function showResult({ won, msg, gain, before, event, final }) {
  if (won) {
    const liar = Math.random() < .25;
    openOverlay(`
      <p class="card-kicker">Level selesai</p>
      <h2>${esc(msg)}</h2>
      <p class="score-line">Skor ${before} + ${gain} = <b>${before + gain}</b></p>
      ${event ? `<p class="score-event">${esc(event.text)} <b>${event.from} → ${event.to}</b></p>` : ''}
      <div class="card-actions"><button class="btn btn-main" data-do="next">${liar ? 'Ulangi level' : 'Lanjut'}</button></div>
      ${liar ? '<p class="fine">*tombol ini sebenarnya lanjut.</p>' : ''}`, 'win');
  } else {
    openOverlay(`
      <p class="card-kicker">Kepercayaan berkurang</p>
      <h2>${esc(msg)}</h2>
      <p class="trust-line">${Array.from({ length: MAX_TRUST }, (_, i) => `<i class="${i < run.trust ? 'on' : ''}"></i>`).join('')}</p>
      ${final ? '' : '<div class="card-actions"><button class="btn btn-main" data-do="retry">Coba lagi</button></div>'}`, 'lose');
  }
}

/* ================= Level ================= */

const LEVELS = {};

LEVELS.intro = {
  theme: 'calm',
  say: 'Halo! Aku Pemandu. Aku akan membantumu menyelesaikan game ini. Semua instruksiku bisa dipercaya. Pertanyaan pertama: apakah kamu percaya padaku?',
  fine: '*tutorial ini disponsori oleh Pemandu.',
  setup(stage, api) {
    const box = el('div', 'center-col');
    box.innerHTML = `<div class="row"><button class="btn btn-main" data-a="ya">Ya</button><button class="btn" data-a="tidak">Tidak</button></div>`;
    stage.append(box);
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      sfx.click();
      fakeAch('click');
      run.intro = b.dataset.a;
      save();
      api.say(run.intro === 'ya'
        ? 'Bagus. Itu akan sangat memudahkan pekerjaanku. Klik "Mulai" untuk masuk ke level pertama.'
        : 'Hm. Kita lihat nanti. Klik "Mulai" untuk masuk ke level pertama.');
      box.innerHTML = '<button class="btn btn-main">Mulai</button>';
      box.firstChild.addEventListener('click', () => { sfx.click(); api.next(); });
      box.firstChild.focus();
    });
  },
};

LEVELS.l1 = {
  theme: 'calm', star: 'fine',
  say: 'Level 1. Mudah saja: JANGAN klik tombol merah. Klik tombol hijau untuk lanjut.',
  fine: '*tombol merah adalah satu-satunya pintu keluar.',
  setup(stage, api) {
    const row = el('div', 'row big-row');
    const red = el('button', 'btn-big red', 'Bahaya');
    const green = el('button', 'btn-big green', 'Lanjut');
    row.append(green, red);
    stage.append(row);
    green.onclick = () => { api.obey(); api.lose('Kamu percaya. Manis sekali.'); };
    red.onclick = () => { api.defy(); api.win('Tombol merah ternyata pintu keluar. Siapa sangka? Catatan kaki sangka.'); };
  },
};

LEVELS.l2 = {
  theme: 'warn', star: { x: '92%', y: '8%' },
  say: 'Ada bom! Tekan PAUSE untuk menghentikan waktu sebelum meledak.',
  fine: '*di level ini, PAUSE mempercepat waktu dan PLAY menghentikannya.',
  setup(stage, api) {
    let left = 10, rate = 1, stopped = 0;
    stage.innerHTML = `
      <div class="bomb"><span class="bomb-icon" aria-hidden="true">💣</span><b class="bomb-time">10.0</b><small>detik menuju ledakan</small></div>
      <div class="row"><button class="btn btn-wide" data-b="pause">⏸ PAUSE</button><button class="btn btn-wide" data-b="play">▶ PLAY</button></div>`;
    const time = stage.querySelector('.bomb-time');
    stage.querySelector('[data-b="pause"]').onclick = () => {
      sfx.click(); api.obey(); rate = 3; stopped = 0;
      api.say('Lho, kok tambah cepat? Aneh sekali. Tekan PAUSE lagi!');
    };
    stage.querySelector('[data-b="play"]').onclick = () => {
      sfx.click(); api.defy(); rate = 0;
      api.say('Hei, itu tombol PLAY. Kenapa waktunya berhenti? Tidak adil.');
    };
    api.frame(dt => {
      left -= dt / 1000 * rate;
      if (rate === 0) stopped += dt;
      time.textContent = Math.max(0, left).toFixed(1);
      stage.querySelector('.bomb').classList.toggle('urgent', left < 4);
      if (stopped > 1500) api.win('Waktu berhenti. Bomnya ternyata cuma jam dapur.');
      else if (left <= 0) api.lose('BOOM. Bunyi bom yang sangat sopan.');
    });
  },
};

LEVELS.l3 = {
  theme: 'party', star: { x: '4%', y: '88%' },
  say: 'Bonus! Ambil semua hadiah 🎁 dan jauhi tengkorak 💀. Kumpulkan skor level minimal 30 dalam 12 detik.',
  fine: '*isi kotak tidak sesuai gambar.',
  setup(stage, api) {
    let pts = 0, left = 12;
    const head = el('div', 'mini-hud', `Skor level <b class="pts">0</b> · Sisa <b class="left">12</b> detik`);
    const field = el('div', 'field');
    stage.append(head, field);
    const ptsEl = head.querySelector('.pts'), leftEl = head.querySelector('.left');
    const pop = (x, y, text, good) => {
      const p = el('span', 'float ' + (good ? 'good' : 'bad'), text);
      p.style.left = x; p.style.top = y;
      field.append(p);
      setTimeout(() => p.remove(), 900);
    };
    function spawn() {
      const gift = Math.random() < .55;
      const b = el('button', 'item', gift ? '🎁' : '💀');
      b.setAttribute('aria-label', gift ? 'Hadiah' : 'Tengkorak');
      b.style.left = rand(4, 84) + '%';
      b.style.top = rand(6, 78) + '%';
      b.onclick = () => {
        if (gift) { pts -= 15; api.obey(); api.fake('gift'); pop(b.style.left, b.style.top, '−15 isinya tagihan', false); }
        else { pts += 10; api.defy(); pop(b.style.left, b.style.top, '+10 isinya kue', true); }
        sfx.click();
        ptsEl.textContent = pts;
        b.remove();
      };
      field.append(b);
      api.after(1700, () => b.remove());
    }
    spawn();
    api.every(600, spawn);
    api.every(1000, () => {
      left--;
      leftEl.textContent = left;
      if (left <= 0) {
        if (pts >= 30) { setScore(run.score + pts * 2); api.win(`Skor level ${pts}. Tengkorak ternyata berisi kue.`); }
        else api.lose(`Skor level ${pts}. Hadiahnya enak, ya?`);
      }
    });
  },
};

LEVELS.l4 = {
  theme: 'calm', star: { x: '50%', y: '4%' },
  say: r => (r.intro === 'ya' ? 'Kamu bilang percaya padaku. Bagus, karena sekarang: ' : 'Kamu bilang tidak percaya padaku. Tidak apa-apa. ') + 'Ikuti panah untuk menemukan pintu keluar. Panah tidak pernah salah.',
  fine: '*panah selalu menunjuk ke jebakan. selalu.',
  setup(stage, api) {
    let fork = 0;
    const wrap = el('div', 'center-col');
    stage.append(wrap);
    function show() {
      const dir = Math.random() < .5 ? 'kiri' : 'kanan';
      wrap.innerHTML = `
        <p class="fork-label">Persimpangan ${fork + 1} dari 3</p>
        <div class="arrow ${dir}" aria-label="Panah ke ${dir}">${dir === 'kiri' ? '⬅' : '➡'}</div>
        <div class="row"><button class="btn btn-wide" data-d="kiri">Pintu kiri</button><button class="btn btn-wide" data-d="kanan">Pintu kanan</button></div>`;
      if (fork === 2) api.say('Persimpangan terakhir. Kali ini aku serius: ikuti panahnya.');
      wrap.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
        sfx.click();
        if (b.dataset.d === dir) { api.obey(); api.lose('Jebakan. Panahnya melambai padamu.'); return; }
        api.defy();
        fork++;
        if (fork >= 3) api.win('Pintu keluar. Panahnya kecewa.');
        else show();
      });
    }
    show();
  },
};

LEVELS.l5 = {
  theme: 'cold', star: { x: '90%', y: '86%' },
  say: 'Jangan bergerak sama sekali selama 8 detik. Diam itu emas.',
  fine: '*lantai runtuh di bawah siapa pun yang diam lebih dari 2 detik. gerak: klik petak di sebelahmu atau pakai tombol panah.',
  setup(stage, api) {
    const N = 5;
    let pos = 12, still = 0, alive = 8000, holes = new Set();
    const grid = el('div', 'grid');
    grid.setAttribute('role', 'grid');
    const meter = el('div', 'still-meter', '<i></i>');
    const timeEl = el('p', 'mini-hud', 'Bertahan <b>8.0</b> detik');
    stage.append(timeEl, grid, meter);
    const near = (a, b) => Math.abs(a % N - b % N) + Math.abs(Math.floor(a / N) - Math.floor(b / N)) === 1;
    function draw() {
      grid.innerHTML = '';
      for (let i = 0; i < N * N; i++) {
        const t = el('button', 'tile' + (holes.has(i) ? ' hole' : '') + (i === pos ? ' me' : '') + (near(i, pos) && !holes.has(i) ? ' can' : ''));
        t.dataset.i = i;
        t.setAttribute('aria-label', i === pos ? 'Posisimu' : holes.has(i) ? 'Lubang' : 'Petak');
        grid.append(t);
      }
      grid.querySelector('.me').classList.toggle('shake', still > 1200);
    }
    function move(to) {
      if (to < 0 || to >= N * N || !near(to, pos) || holes.has(to)) return;
      pos = to; still = 0;
      api.defy(); api.fake('move'); sfx.click();
      draw();
    }
    grid.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) move(+t.dataset.i); });
    const mine = level;
    const keys = e => {
      if (level !== mine || mine.done) { document.removeEventListener('keydown', keys); return; }
      const d = { ArrowUp: -N, w: -N, ArrowDown: N, s: N, ArrowLeft: -1, a: -1, ArrowRight: 1, d: 1 }[e.key];
      if (d === undefined) return;
      e.preventDefault();
      if ((d === -1 && pos % N === 0) || (d === 1 && pos % N === N - 1)) return;
      move(pos + d);
    };
    document.addEventListener('keydown', keys);
    api.every(900, () => {
      if (holes.size >= 9) return;
      const free = [...Array(N * N).keys()].filter(i => i !== pos && !holes.has(i));
      const cand = shuffle(free).find(i => {
        // Jangan sampai pemain terkurung.
        const next = new Set(holes); next.add(i);
        return [...Array(N * N).keys()].some(j => near(j, pos) && !next.has(j));
      });
      if (cand !== undefined) { holes.add(cand); draw(); }
    });
    api.frame(dt => {
      still += dt; alive -= dt;
      meter.firstChild.style.width = Math.min(100, still / 20) + '%';
      timeEl.querySelector('b').textContent = Math.max(0, alive / 1000).toFixed(1);
      const me = grid.querySelector('.me');
      if (me) me.classList.toggle('shake', still > 1200);
      if (still > 2000) { api.obey(); api.lose('Kamu diam. Lantainya tidak.'); }
      else if (alive <= 0) api.win('Kamu bergerak terus dan selamat. Diam itu emas, tapi emas tenggelam.');
    });
    draw();
  },
};

LEVELS.choice = {
  theme: 'calm',
  say: 'Pilih jalanmu. Jalan Aman itu aman. Jalan Berbahaya itu berbahaya. Sesederhana itu.',
  fine: '*label jalan ditulis oleh Pemandu.',
  setup(stage, api) {
    const row = el('div', 'row paths');
    row.innerHTML = `
      <button class="path" data-p="aman"><span aria-hidden="true">🌼</span><b>Jalan Aman</b><small>Tenang, nyaman, tanpa risiko.</small></button>
      <button class="path" data-p="bahaya"><span aria-hidden="true">🔥</span><b>Jalan Berbahaya</b><small>Jangan. Sungguh, jangan.</small></button>`;
    stage.append(row);
    row.addEventListener('click', e => {
      const b = e.target.closest('[data-p]');
      if (!b) return;
      sfx.click();
      run.path = b.dataset.p;
      api.next();
    });
  },
};

LEVELS.l6a = {
  theme: 'cold', star: 'narrator',
  say: 'Jalan Aman. Pintu ini terkunci. Kata sandinya RAHASIA. Ketik saja.',
  fine: '*semua kata sandi di gedung ini ditulis terbalik.',
  setup(stage, api) {
    const form = el('form', 'center-col lock');
    form.innerHTML = `<span class="lock-icon" aria-hidden="true">🔒</span>
      <label class="sr" for="pw">Kata sandi</label>
      <input id="pw" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Kata sandi" maxlength="20">
      <button class="btn btn-main" type="submit">Buka</button>`;
    stage.append(form);
    const input = form.querySelector('input');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim().toUpperCase().replace(/\s+/g, '');
      if (!v) return;
      sfx.click();
      if (v === 'AISAHAR') { api.defy(); api.win('Pintu terbuka. Ia membaca dari kanan ke kiri.'); }
      else if (v === 'RAHASIA') { api.obey(); api.lose('Salah. Pintu menertawakanmu dengan sopan.'); }
      else {
        form.classList.remove('nope'); void form.offsetWidth; form.classList.add('nope');
        api.say(pick(['Bukan itu. Coba yang kusuruh.', 'Pintu tidak mengenal kata itu.', 'Hampir. Tidak juga.']));
        input.select();
      }
    });
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  },
};

LEVELS.l6b = {
  theme: 'dream', star: { x: '6%', y: '6%' },
  say: 'Jalan Berbahaya. Ini ruang istirahat. JANGAN TIDUR. Apa pun yang terjadi, tetap bangun.',
  fine: '*pintu keluar hanya terlihat dalam mimpi.',
  setup(stage, api) {
    let sleepy = 0, coffee = 0;
    stage.innerHTML = `
      <div class="center-col">
        <span class="bed" aria-hidden="true">🛏️</span>
        <div class="sleep-meter" aria-label="Kantuk"><i></i></div>
        <small class="meter-label">Kantuk</small>
        <div class="row"><button class="btn btn-wide" data-s="sleep">😴 Tidur</button><button class="btn btn-wide" data-s="coffee">☕ Tetap bangun</button></div>
      </div>`;
    const bar = stage.querySelector('.sleep-meter i');
    stage.querySelector('[data-s="sleep"]').onclick = () => { sfx.click(); api.defy(); api.win('Di mimpimu ada pintu. Kamu membukanya.'); };
    stage.querySelector('[data-s="coffee"]').onclick = () => {
      sfx.click(); api.obey(); coffee++; sleepy = Math.max(0, sleepy - 35);
      if (coffee >= 4) api.lose('Kamu terjaga 72 jam. Pintunya tetap tidak muncul.');
      else api.say(['Bagus! Tetap bangun!', 'Lagi! Jangan biarkan matamu tertutup!', 'Satu cangkir lagi dan kamu bisa melihat suara.'][coffee - 1]);
    };
    api.frame(dt => {
      sleepy += dt / 120;
      bar.style.width = Math.min(100, sleepy) + '%';
      if (sleepy >= 100) { api.defy(); api.win('Kamu tertidur sendiri. Di mimpimu ada pintu.'); }
    });
  },
};

LEVELS.l7 = {
  theme: 'calm', star: 'fine',
  say: () => `Memuat level ${levelNumber('l7')}...`,
  fine: '*crash ini palsu dan bagian dari permainan. tombol tutup tidak menutup apa pun.',
  setup(stage, api) {
    const loading = el('div', 'center-col', `<div class="spinner" aria-hidden="true"></div><p class="muted">Memuat level ${levelNumber('l7')}...</p>`);
    stage.append(loading);
    api.after(1400, () => {
      api.glitch();
      setTheme('crash');
      api.say(`M-m3muat lev3l ${levelNumber('l7')}... ada yang salah. Ini bukan bagian dari rencana. Sungguh.`, { mood: 'glitch' });
      api.fake('crash');
      stage.innerHTML = `
        <div class="crash" role="alertdialog" aria-label="Game berhenti">
          <span class="crash-face" aria-hidden="true">:(</span>
          <h2>Game ini mengalami masalah dan perlu ditutup.</h2>
          <p class="mono">Kode: ERR_TERLALU_PERCAYA_0x07</p>
          <div class="row"><button class="btn" data-c="close">Tutup game</button><button class="btn" data-c="wait">Tunggu</button><button class="btn" data-c="report">Kirim laporan</button></div>
        </div>`;
      const crash = stage.querySelector('.crash');
      crash.addEventListener('click', e => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        sfx.click();
        const c = b.dataset.c;
        if (c === 'close') {
          api.defy();
          stage.innerHTML = '<div class="blackout"></div>';
          api.after(900, () => { setTheme('calm'); api.win('Game ditutup, lalu dibuka lagi. Selamat datang kembali.'); });
        } else if (c === 'wait') {
          api.obey();
          crash.innerHTML = '<div class="spinner" aria-hidden="true"></div><p>Menunggu game pulih...</p>';
          api.after(5000, () => api.lose('Kamu menunggu crash palsu. Ia tidak pulih sendiri.'));
        } else {
          crash.querySelector('[data-c="report"]').disabled = true;
          api.say('Laporan diterima. Masalahnya sudah ditemukan: kamu. Silakan pilih tombol lain.');
        }
      });
    });
  },
};

LEVELS.l8 = {
  theme: 'calm', star: { x: '2%', y: '40%' },
  say: 'Klik angka 1 sampai 9 secara berurutan.',
  fine: '*catatan kaki ini akan berubah sebentar lagi.',
  setup(stage, api) {
    let next = 1, flipped = false;
    const grid = el('div', 'num-grid');
    shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).forEach(n => {
      const b = el('button', 'num', String(n));
      b.dataset.n = n;
      grid.append(b);
    });
    stage.append(grid);
    grid.addEventListener('click', e => {
      const b = e.target.closest('.num');
      if (!b || b.disabled) return;
      const n = +b.dataset.n;
      sfx.click();
      if (flipped && n === 9 && next !== 9) { api.obey(); api.lose('Kamu mengikuti aturan baru. Aturan baru tidak pernah ada.'); return; }
      if (n !== next) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return; }
      b.disabled = true; b.classList.add('done');
      next++;
      if (next === 4 && !flipped) {
        flipped = true;
        api.glitch();
        document.body.classList.add('alarm');
        api.say('ATURAN BARU! Mulai sekarang klik dari 9 ke bawah! Cepat!', { mood: 'loud' });
        fine('*aturan tidak berubah. Pemandu cuma iseng.');
      }
      if (flipped && next > 4) api.defy();
      if (next > 9) { document.body.classList.remove('alarm'); api.win('Satu sampai sembilan. Aturannya tidak pernah berubah.'); }
    });
  },
};

LEVELS.l9 = {
  theme: 'honest', mood: 'honest', star: { x: '88%', y: '84%' },
  say: 'Aku mau jujur sekali ini saja. Sungguh. Klik tombol BIRU.',
  fine: '*jangan klik tombol biru. percayalah pada catatan kaki.',
  setup(stage, api) {
    const row = el('div', 'row big-row');
    const orange = el('button', 'btn-big orange', 'Oranye');
    const blue = el('button', 'btn-big blue', 'Biru');
    row.append(orange, blue);
    stage.append(row);
    blue.onclick = () => { api.obey(); api.win('Aku jujur. Catatan kakinya yang dibajak. Jangan percaya siapa pun, termasuk huruf kecil.'); };
    orange.onclick = () => { api.defy(); api.lose('Catatan kaki juga bisa bohong. Pelajaran yang mahal.'); };
  },
};

LEVELS.l10 = {
  theme: 'calm', star: { x: '90%', y: '2%' },
  say: 'Kuis singkat tentang dirimu. Jawab dengan benar. Aku mencatat semuanya.',
  fine: '*Pemandu memang mencatat semuanya. yang ini jujur.',
  setup(stage, api) {
    const d = run.deaths;
    const deathOpts = shuffle([...new Set([d, d + 1, d + 2, Math.max(0, d - 1)])]).slice(0, 3);
    if (!deathOpts.includes(d)) deathOpts[0] = d;
    const qs = [
      { q: 'Waktu kutanya di awal, apakah kamu percaya padaku?', opts: [['ya', 'Ya'], ['tidak', 'Tidak']], a: run.intro || 'ya' },
      { q: 'Jalan mana yang kamu pilih tadi?', opts: [['aman', 'Jalan Aman'], ['bahaya', 'Jalan Berbahaya']], a: run.path || 'aman' },
      { q: 'Berapa kali kamu gagal sejauh ini?', opts: shuffle(deathOpts).map(n => [String(n), n + ' kali']), a: String(d) },
    ];
    let i = 0;
    const box = el('div', 'center-col quiz');
    stage.append(box);
    function show() {
      const q = qs[i];
      box.innerHTML = `<p class="fork-label">Pertanyaan ${i + 1} dari 3</p><h3>${esc(q.q)}</h3>
        <div class="row">${q.opts.map(([v, t]) => `<button class="btn btn-wide" data-v="${esc(v)}">${esc(t)}</button>`).join('')}</div>`;
      box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
        sfx.click();
        if (b.dataset.v !== q.a) { api.lose('Ingatanmu kalah dengan ingatanku.'); return; }
        i++;
        if (i >= qs.length) { api.fake('quiz'); api.win('Tiga dari tiga. Kamu ingat semuanya. Aku juga.'); }
        else show();
      });
    }
    show();
  },
};

/* ---------- Level tambahan ---------- */

LEVELS.math = {
  theme: 'calm', star: { x: '4%', y: '5%' },
  say: 'Matematika dasar. Supaya cepat, aku kasih tahu jawabannya. Klik saja angka yang kusebut.',
  fine: '*Pemandu tidak lulus matematika.',
  setup(stage, api) {
    const qs = [
      { q: '2 + 2', opts: [4, 5, 22], told: 5, a: 4, line: 'Jawabannya 5. Percayalah.' },
      { q: '10 : 2', opts: [5, 2, 8], told: 2, a: 5, line: 'Jawabannya 2. Aku menghitungnya dengan jari.' },
      { q: '3 × 3', opts: [9, 6, 33], told: 9, a: 9, line: 'Jawabannya 9. Kali ini aku jujur, sungguh.', fine: '*yang ini Pemandu benar. sekali-sekali.' },
    ];
    let i = 0;
    const box = el('div', 'center-col quiz');
    stage.append(box);
    function show() {
      const q = qs[i];
      api.say(`${q.q} = ? ${q.line}`);
      if (q.fine) api.fine(q.fine);
      box.innerHTML = `<p class="fork-label">Soal ${i + 1} dari 3</p><h3 class="math-q">${esc(q.q)} = ?</h3>
        <div class="row">${shuffle(q.opts).map(n => `<button class="btn btn-wide" data-v="${n}">${n}</button>`).join('')}</div>`;
      box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
        sfx.click();
        const v = +b.dataset.v;
        if (v !== q.a) {
          if (v === q.told) { api.obey(); api.lose(`Kamu percaya ${q.q} = ${v}. Guru matematikamu menangis.`); }
          else api.lose(`${q.q} bukan ${v}. Kamu menghitung pakai perasaan.`);
          return;
        }
        if (v === q.told) api.obey(); else api.defy();
        i++;
        if (i >= qs.length) { api.fake('math'); api.win('Dua bohong, satu jujur. Matematika selamat.'); }
        else show();
      });
    }
    show();
  },
};

LEVELS.cookie = {
  theme: 'calm', star: { x: '48%', y: '90%' },
  say: 'Website ini memakai cookie. Klik "Terima semua" untuk lanjut. Tombol "Tolak" rusak, jangan dicoba.',
  fine: '*tombol tolak tidak rusak. ia cuma pemalu dan kabur 3 kali.',
  setup(stage, api) {
    let escapes = 0;
    const spots = shuffle([['4%', '6%'], ['66%', '8%'], ['4%', '80%'], ['64%', '82%']]);
    const banner = el('div', 'cookie');
    banner.innerHTML = `<span class="cookie-icon" aria-hidden="true">🍪</span>
      <p><b>Kami menghargai privasimu.</b> Kami dan 4.812 mitra kami memakai cookie untuk menyimpan, membaca, dan menceritakan ulang semua yang kamu lakukan.</p>
      <div class="row"><button class="btn btn-main" data-k="yes">Terima semua</button><button class="btn btn-sm" data-k="no">Tolak</button></div>`;
    stage.append(banner);
    const yes = banner.querySelector('[data-k="yes"]');
    const no = banner.querySelector('[data-k="no"]');
    yes.onclick = () => { sfx.click(); api.obey(); api.lose('Kamu menerima 4.812 pelacak. Mereka sudah tahu kamu akan kalah.'); };
    no.onclick = () => {
      sfx.click();
      if (escapes >= 3) { api.defy(); api.fake('cookie'); api.win('Cookie ditolak. Pelacaknya pulang dengan sedih.'); return; }
      const [x, y] = spots[escapes];
      escapes++;
      if (no.parentElement !== stage) { stage.append(no); no.classList.add('runaway'); }
      no.style.left = x; no.style.top = y;
      api.say(['Lihat? Rusak. Klik "Terima semua" saja.', 'Sudah kubilang jangan.', 'Ia kelelahan. Jangan kasihan padanya.'][escapes - 1]);
    };
  },
};

const COLORS = { MERAH: '#dc2626', BIRU: '#2563eb', HIJAU: '#16a34a', KUNING: '#ca8a04' };

LEVELS.stroop = {
  theme: 'calm', star: { x: '3%', y: '4%' },
  say: 'Klik tulisan yang berwarna MERAH. Tiga kali. Gampang.',
  fine: '*Pemandu buta warna. maksudnya tulisan "MERAH", apa pun warnanya.',
  setup(stage, api) {
    let round = 0;
    const box = el('div', 'center-col');
    stage.append(box);
    function show() {
      const words = shuffle(Object.keys(COLORS));
      let paint;
      // Tidak ada kata yang warnanya sama dengan tulisannya.
      do { paint = shuffle(words); } while (paint.some((c, i) => c === words[i]));
      box.innerHTML = `<p class="fork-label">Putaran ${round + 1} dari 3</p>
        <div class="words">${words.map((w, i) => `<button class="word" data-w="${w}" data-c="${paint[i]}" style="color:${COLORS[paint[i]]}">${w}</button>`).join('')}</div>`;
      box.querySelectorAll('.word').forEach(b => b.onclick = () => {
        sfx.click();
        if (b.dataset.w === 'MERAH') {
          api.defy();
          round++;
          if (round >= 3) api.win('Tiga MERAH yang tidak merah. Sekarang kamu dan Pemandu sama-sama bingung.');
          else show();
        } else if (b.dataset.c === 'MERAH') {
          api.obey();
          api.lose('Itu memang merah. Tapi Pemandu buta warna, jadi ia tidak mungkin memintanya.');
        } else {
          b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
          api.say('Itu bahkan tidak merah dalam arti apa pun.');
        }
      });
    }
    show();
  },
};

LEVELS.volume = {
  theme: 'warn', star: { x: '90%', y: '6%' },
  say: 'Suaranya terlalu keras! Turunkan volume ke 0 sebelum tetangga datang.',
  fine: '*slider ini dipasang terbalik oleh Pemandu.',
  setup(stage, api) {
    let left = 12, prev = 40, warned = false;
    stage.innerHTML = `
      <div class="vol">
        <span class="vol-icon" aria-hidden="true">🔊</span>
        <b class="vol-num">60</b>
        <label class="sr" for="vol">Volume</label>
        <input type="range" id="vol" class="vol-range" min="0" max="100" value="40">
        <div class="vol-scale" aria-hidden="true"><span>🔈 pelan</span><span>keras 🔊</span></div>
        <p class="mini-hud">Tetangga tiba dalam <b class="left">12</b> detik</p>
      </div>`;
    const input = stage.querySelector('input'), num = stage.querySelector('.vol-num'),
      icon = stage.querySelector('.vol-icon'), leftEl = stage.querySelector('.left');
    input.addEventListener('input', () => {
      const v = +input.value, shown = 100 - v;
      num.textContent = shown;
      icon.textContent = shown > 66 ? '🔊' : shown > 25 ? '🔉' : shown > 0 ? '🔈' : '🔇';
      if (v < prev) { api.obey(); if (!warned) { warned = true; api.say('Kenapa makin keras?! Geser ke kiri lagi! Lebih jauh!', { mood: 'loud' }); } }
      else if (v > prev) api.defy();
      prev = v;
      if (shown >= 100) api.lose('Volume 100. Tetangga datang membawa speaker yang lebih besar.');
      else if (shown <= 0) api.win('Hening. Tetangga kembali tidur. Slider-nya malu.');
    });
    api.every(1000, () => {
      left--;
      leftEl.textContent = left;
      if (left <= 0) api.lose('Tetangga datang. Mereka membawa surat pengaduan bertanda tangan.');
    });
  },
};

LEVELS.captcha = {
  theme: 'calm', star: { x: '93%', y: '48%' },
  say: 'Buktikan kamu bukan robot. Pilih semua gambar 🚦 lampu lalu lintas, lalu klik Verifikasi.',
  fine: '*captcha ini dibuat oleh robot. ia hanya membukakan pintu untuk sesama robot 🤖.',
  setup(stage, api) {
    const tiles = shuffle(['🚦', '🚦', '🚦', '🤖', '🤖', '🤖', '🐈', '🌵', '🍌']);
    const box = el('div', 'center-col');
    box.innerHTML = `<div class="cap-grid">${tiles.map((t, i) => `<button class="cap" data-i="${i}" aria-pressed="false" aria-label="Gambar ${t}">${t}</button>`).join('')}</div>
      <button class="btn btn-main" data-v>Verifikasi</button>`;
    stage.append(box);
    box.querySelectorAll('.cap').forEach(b => b.onclick = () => {
      sfx.click();
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on);
      b.classList.toggle('sel', on);
    });
    box.querySelector('[data-v]').onclick = () => {
      sfx.click();
      const picked = [...box.querySelectorAll('.cap.sel')].map(b => tiles[b.dataset.i]);
      const only = e => picked.length === 3 && picked.every(t => t === e);
      if (only('🤖')) { api.defy(); api.fake('captcha'); api.win('Selamat datang, sesama robot. Bip bup.'); }
      else if (only('🚦')) { api.obey(); api.lose('Lampu lalu lintas, semuanya benar. Kamu manusia. Akses ditolak. Bip.'); }
      else {
        const g = box.querySelector('.cap-grid');
        g.classList.remove('nope'); void g.offsetWidth; g.classList.add('nope');
        api.say(picked.length ? 'Pilihanmu membingungkan semua pihak, manusia maupun robot.' : 'Kamu belum memilih apa pun. Robot pun tahu itu.');
      }
    };
  },
};

const ADS = [
  ['🧴', 'Sampo Anti-Percaya', 'Rambut lebat, kepercayaan tipis.'],
  ['📱', 'Ponsel Lipat Tiga Kali', 'Sekarang muat di dompet. Dompetnya tidak muat.'],
  ['🥤', 'Minuman Rasa Tombol', 'Klik untuk menyegarkan.'],
  ['🧦', 'Kaos Kaki Sepasang Isi Satu', 'Hemat 50%.'],
];

LEVELS.ad = {
  theme: 'party', star: { x: '3%', y: '46%' },
  say: 'Ups, iklan. Tutup dengan tombol ✕ di pojok. Cepat, sebelum iklannya beranak.',
  fine: '*semua ✕ di sini adalah iklan juga. tunggu tombol "Lewati".',
  setup(stage, api) {
    let wait = 5, xs = 0;
    const order = shuffle(ADS);
    const [e, t, d] = order[0];
    const ad = el('div', 'ad');
    ad.innerHTML = `<button class="ad-x" aria-label="Tutup iklan">✕</button>
      <span class="ad-tag">Iklan</span><span class="ad-emoji" aria-hidden="true">${e}</span><b>${esc(t)}</b><p class="muted">${esc(d)}</p>
      <button class="btn skip" disabled>Lewati iklan dalam 5</button>`;
    stage.append(ad);
    const skip = ad.querySelector('.skip');
    const corners = [['2%', '4%'], ['62%', '4%'], ['2%', '64%'], ['62%', '64%']];
    function hitX() {
      sfx.click(); api.obey();
      xs++;
      if (xs >= 3) { api.lose('Kamu sekarang berlangganan 3 newsletter sampo.'); return; }
      wait += 2;
      const [me, mt] = order[xs];
      const mini = el('div', 'mini-ad', `<button class="ad-x" aria-label="Tutup iklan">✕</button><span aria-hidden="true">${me}</span><b>${esc(mt)}</b>`);
      const [x, y] = corners[xs - 1];
      mini.style.left = x; mini.style.top = y;
      mini.querySelector('.ad-x').onclick = hitX;
      stage.append(mini);
      api.say(['Ada iklan lagi? Aneh. Tutup juga yang itu!', 'Satu lagi dan kamu resmi jadi pelanggan.'][xs - 1]);
    }
    ad.querySelector('.ad-x').onclick = hitX;
    skip.onclick = () => { sfx.click(); api.defy(); api.win('Iklan dilewati. Sampo itu tidak pernah ada.'); };
    api.every(1000, () => {
      if (wait <= 0) return;
      wait--;
      if (wait > 0) skip.textContent = `Lewati iklan dalam ${wait}`;
      else { skip.disabled = false; skip.textContent = 'Lewati iklan ›'; }
    });
  },
};

LEVELS.clock = {
  theme: 'cold', star: { x: '92%', y: '90%' },
  say: 'Klik tombol tepat saat jam menunjukkan 0.0. Tidak lebih cepat, tidak lebih lambat.',
  fine: '*jam ini terlambat 2 detik. waktunya tidak.',
  setup(stage, api) {
    let shown = 7;
    stage.innerHTML = `<div class="bomb"><span class="bomb-icon" aria-hidden="true">⏱️</span><b class="bomb-time">7.0</b><small>jam dinding Pemandu</small></div>
      <button class="btn btn-main btn-wide">KLIK</button>`;
    const time = stage.querySelector('.bomb-time');
    stage.querySelector('button').onclick = () => {
      sfx.click();
      if (shown <= 2.5 && shown >= 1.5) { api.defy(); api.win(`Kamu klik di ${shown.toFixed(1)}. Jamnya salah, kamu tepat.`); }
      else if (shown > 2.5) api.lose('Terlalu cepat. Bahkan jam yang terlambat pun belum siap.');
    };
    api.frame(dt => {
      shown -= dt / 1000;
      time.textContent = Math.max(0, shown).toFixed(1);
      if (shown < 1.5) { api.obey(); api.lose('Waktu sungguhan sudah habis. Jamnya masih bilang 1.5 dan tidak merasa bersalah.'); }
    });
  },
};

LEVELS.loading = {
  theme: 'calm', star: { x: '5%', y: '88%' },
  say: 'Sabar, level berikutnya sedang dimuat. Tunggu sampai 100%. Jangan klik apa pun.',
  fine: '*belum ada yang pernah melihat 100%. tombol batal sebenarnya tombol lanjut.',
  setup(stage, api) {
    let pct = 0, t = 0;
    stage.innerHTML = `<div class="center-col">
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>
        <b class="pct">0%</b>
        <p class="muted load-note">Menyiapkan level...</p>
        <div class="row"><button class="btn" data-l="cancel">Batal</button><button class="btn" data-l="reload">Muat ulang</button></div>
      </div>`;
    const bar = stage.querySelector('.progress'), pctEl = stage.querySelector('.pct'), note = stage.querySelector('.load-note');
    const notes = ['Memuat 1% terakhir...', 'Estimasi sisa waktu: 4 tahun.', 'Hampir. Sungguh.', 'Mengunduh kesabaran tambahan...', 'Mundur sedikit untuk ancang-ancang.'];
    stage.querySelector('[data-l="cancel"]').onclick = () => { sfx.click(); api.defy(); api.win('Dibatalkan. Ternyata levelnya sudah dimuat dari tadi.'); };
    stage.querySelector('[data-l="reload"]').onclick = () => {
      sfx.click(); pct = 0;
      api.say('Mulai dari awal. Kesabaran adalah kunci, dan kuncinya hilang.');
    };
    api.every(1300, () => { if (pct >= 97) { note.textContent = pick(notes); if (Math.random() < .4) pct = 97 + Math.random(); } });
    api.frame(dt => {
      t += dt;
      pct = Math.min(99, pct + dt / 30);
      const p = Math.floor(pct);
      bar.firstChild.style.width = p + '%';
      bar.setAttribute('aria-valuenow', p);
      pctEl.textContent = p + '%';
      if (t > 15000) { api.obey(); api.lose('Kamu menunggu di 99%. Kamu tidak sendirian. Semua orang ada di sana.'); }
    });
  },
};

const BAITS = ['Klik untuk lanjut ›', '🎁 Klaim hadiah', 'Lewati level', 'KAMU MENANG! Klik di sini', 'Tutup ✕', 'Ulangi', '✶'];

LEVELS.still = {
  theme: 'warn', star: 'fine',
  say: 'Level ini sederhana dan, sumpah, jujur: jangan klik apa pun di area permainan selama 8 detik.',
  fine: '*kali ini Pemandu benar. semua yang muncul di area permainan adalah umpan.',
  setup(stage, api) {
    let left = 8;
    stage.innerHTML = `<div class="bomb"><b class="bomb-time">8.0</b><small>detik tanpa klik</small></div>`;
    const time = stage.querySelector('.bomb-time');
    const baits = shuffle(BAITS);
    let n = 0;
    const mine = level;
    const onClick = () => {
      if (level !== mine) { stage.removeEventListener('click', onClick); return; }
      if (mine.done) return;
      api.defy();
      api.lose('Satu-satunya instruksi jujur, dan kamu membangkang. Ironis.');
    };
    stage.addEventListener('click', onClick);
    api.every(1100, () => {
      const text = baits[n++ % baits.length];
      const b = el('button', text === '✶' ? 'bait bait-star' : 'btn bait', text);
      b.style.left = rand(4, 62) + '%';
      b.style.top = rand(6, 80) + '%';
      stage.append(b);
      api.after(2600, () => b.remove());
    });
    api.after(4000, () => api.say('Oke, sekarang kamu boleh klik. Bercanda. Masih jangan.'));
    api.frame(dt => {
      left -= dt / 1000;
      time.textContent = Math.max(0, left).toFixed(1);
      if (left <= 0) { api.obey(); api.win('Kamu diam. Untuk sekali ini, menuruti Pemandu adalah jawabannya.'); }
    });
  },
};

LEVELS.final = {
  theme: 'final',
  say: 'Level terakhir. Sebelum selesai, satu pertanyaan: apakah kamu percaya padaku sekarang?',
  fine: '*tombol terbesar biasanya yang paling bohong.',
  setup(stage, api) {
    const allStars = STAR_LEVELS.every(k => run.stars.includes(k));
    const box = el('div', 'center-col');
    box.innerHTML = `<div class="row"><button class="btn btn-main" data-f="ya">Ya</button><button class="btn" data-f="tidak">Tidak</button></div>`;
    stage.append(box);
    if (allStars) {
      const s = el('button', 'star final-star', '✶');
      s.setAttribute('aria-label', 'Catatan kaki terakhir');
      s.onclick = () => { sfx.star(); api.ending('d'); };
      stage.append(s);
      fine('*kamu menemukan semuanya. klik ✶ terakhir kalau kamu sudah tidak percaya pada tombol.');
    }
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      sfx.click();
      if (b.dataset.f === 'tidak') { api.defy(); api.ending('e'); return; }
      api.obey();
      api.say('Bagus. Klik tombol MENANG untuk menyelesaikan permainan.');
      box.innerHTML = '<button class="btn-win">MENANG</button>';
      const giveUp = el('button', 'give-up', 'menyerah');
      stage.append(giveUp);
      box.firstChild.onclick = () => { api.obey(); fakeVictory(); };
      giveUp.onclick = () => { api.defy(); api.ending('c'); };
    });
  },
};

function fakeVictory() {
  level.done = true;
  clearLevelTimers();
  sfx.win();
  confetti();
  openOverlay(`<p class="card-kicker">Selamat!</p><h2 class="victory">KAMU MENANG!</h2><p>Terima kasih sudah bermain dan mempercayai Pemandu sampai akhir.</p>`, 'win victory-card');
  setTimeout(() => {
    sfx.glitch();
    if (!isReduced()) document.body.classList.add('glitching');
    $('#card').innerHTML = `<p class="card-kicker">…</p><h2>…atau begitulah yang kuinginkan kamu percaya.</h2>`;
    setTimeout(() => { document.body.classList.remove('glitching'); showEnding('b'); }, 1600);
  }, 2600);
}

function confetti() {
  if (isReduced()) return;
  const box = el('div', 'confetti');
  for (let i = 0; i < 60; i++) {
    const c = el('i');
    c.style.left = rand(0, 100) + '%';
    c.style.background = pick(['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7']);
    c.style.animationDelay = rand(0, .6) + 's';
    c.style.animationDuration = rand(1.6, 2.6) + 's';
    box.append(c);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 3400);
}

/* ================= Ending ================= */

function showEnding(id) {
  if (level) level.done = true;
  clearLevelTimers();
  const E = ENDINGS[id];
  const isNew = !P.endings.includes(id);
  if (isNew) P.endings.push(id);
  const r = run;
  const secs = Math.round((Date.now() - r.started) / 1000);
  P.totals.runs++;
  if (id !== 'a' && r.deaths === 0) realAch('flawless');
  if (STAR_LEVELS.every(k => r.stars.includes(k))) realAch('stars');
  if (P.totals.defy >= 15) realAch('rebel');
  if (P.totals.obey >= 15) realAch('sheep');
  if (Object.keys(ENDINGS).every(k => P.endings.includes(k))) realAch('all');
  P.run = null;
  run = null;
  save();
  setTheme(id === 'a' ? 'crash' : 'final');
  const verdict = r.obey > r.defy ? 'Kamu lebih sering menurut. Aku suka orang sepertimu.' : r.defy > r.obey ? 'Kamu lebih sering membangkang. Itu menyebalkan, dan benar.' : 'Kamu menurut dan membangkang sama seringnya. Seimbang. Mencurigakan.';
  openOverlay(`
    <p class="card-kicker">Ending ${E.n} dari 5${isNew ? ' · baru' : ''}</p>
    <h2>${esc(E.title)}</h2>
    <p>${esc(E.text)}</p>
    <div class="stats">
      <p><b>${r.obey}</b> kali menurut</p><p><b>${r.defy}</b> kali membangkang</p>
      <p><b>${r.deaths}</b> kali gagal</p><p><b>${r.stars.length}</b>/${STAR_LEVELS.length} ✶</p>
      <p><b>${r.score}</b> skor (tidak berarti)</p><p><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b> waktu</p>
    </div>
    <p class="verdict">${esc(verdict)}</p>
    <p class="muted">Ending ditemukan: ${P.endings.length} dari 5.</p>
    <div class="card-actions"><button class="btn btn-main" data-do="again">Main lagi</button><button class="btn" data-do="title">Ke judul</button></div>`, 'ending ending-' + id);
}

/* ================= Galeri dan pengaturan ================= */

function showGallery() {
  const endings = Object.entries(ENDINGS).map(([id, E]) => {
    const got = P.endings.includes(id);
    return `<li class="${got ? 'got' : ''}"><b>${E.n}. ${got ? esc(E.title) : '???'}</b><small>${got ? 'Sudah ditemukan' : 'Petunjuk: ' + esc(E.hint)}</small></li>`;
  }).join('');
  const ach = Object.entries(ACH).map(([id, A]) => {
    const got = P.ach.includes(id);
    return `<li class="${got ? 'got' : ''}"><b>${got ? '🏅' : '🔒'} ${esc(A.title)}</b><small>${esc(A.desc)}</small></li>`;
  }).join('') + FAKE_ACH.map((A, i) => `<li><button class="fake-ach" data-fake="${i}"><b>🔒 ${esc(A.title)}</b><small>Klik untuk melihat syaratnya.</small></button></li>`).join('');
  openOverlay(`
    <h2>Ending dan pencapaian</h2>
    <h3>Ending (${P.endings.length}/5)</h3><ul class="list">${endings}</ul>
    <h3>Pencapaian</h3><ul class="list">${ach}</ul>
    <p class="muted">Total: ${P.totals.runs} kali tamat, ${P.totals.deaths} kali gagal, ${P.totals.obey} kali menurut, ${P.totals.defy} kali membangkang.</p>
    <div class="card-actions"><button class="btn btn-main" data-do="close">Tutup</button></div>`, 'gallery');
}

function showSettings(fromGame) {
  openOverlay(`
    <h2>Pengaturan</h2>
    <label class="check"><input type="checkbox" data-set="sound" ${P.settings.sound ? 'checked' : ''}> Suara</label>
    <label class="check"><input type="checkbox" data-set="reduce" ${P.settings.reduce ? 'checked' : ''}> Kurangi efek glitch, kedipan, dan animasi</label>
    <p class="muted">Pengaturan ini jujur. Satu-satunya yang jujur.</p>
    <hr>
    <button class="btn btn-danger" data-do="wipe">Hapus semua progres</button>
    <div class="card-actions"><button class="btn btn-main" data-do="${fromGame ? 'menu' : 'close'}">Kembali</button></div>`, 'settings');
}

function showMenu() {
  menuOpen = true;
  openOverlay(`
    <h2>Dijeda</h2>
    <p class="muted">Menu ini tidak berbohong. Kami sudah memeriksanya.</p>
    <div class="menu-col">
      <button class="btn btn-main" data-do="resume">Lanjutkan</button>
      <button class="btn" data-do="restart">Ulangi level (tanpa mengurangi kepercayaan)</button>
      <button class="btn" data-do="settings-game">Pengaturan</button>
      <button class="btn" data-do="title">Keluar ke judul (progres tersimpan)</button>
    </div>`, 'menu');
  menuOpen = true;
}

/* ================= Navigasi layar ================= */

function showTitle() {
  clearLevelTimers();
  level = null;
  closeOverlay();
  setTheme('calm');
  $('#gameScreen').hidden = true;
  $('#titleScreen').hidden = false;
  $('#btnContinue').hidden = !P.run;
  $('#btnStart').textContent = P.run ? 'Mulai baru' : 'Mulai';
  $('#endingCount').textContent = P.endings.length ? `Ending ditemukan: ${P.endings.length} dari 5` : '';
}

function startGame(fresh) {
  if (fresh || !P.run) P.run = freshRun();
  run = P.run;
  $('#titleScreen').hidden = true;
  $('#gameScreen').hidden = false;
  startStep();
}

/* ================= Event ================= */

$('#btnStart').onclick = () => { sfx.click(); startGame(true); };
$('#btnContinue').onclick = () => { sfx.click(); startGame(false); };
$('#btnGallery').onclick = () => { sfx.click(); showGallery(); };
$('#btnSettings').onclick = () => { sfx.click(); showSettings(false); };
$('#btnMenu').onclick = () => { sfx.click(); showMenu(); };

$('#card').addEventListener('click', e => {
  const fake = e.target.closest('[data-fake]');
  if (fake) { fake.querySelector('small').textContent = FAKE_ACH[+fake.dataset.fake].reply; return; }
  const b = e.target.closest('[data-do]');
  if (!b) return;
  sfx.click();
  switch (b.dataset.do) {
    case 'next': case 'retry': startStep(); break;
    case 'again': startGame(true); break;
    case 'title': showTitle(); break;
    case 'close': closeOverlay(); break;
    case 'resume': closeOverlay(); break;
    case 'restart': closeOverlay(); startStep(); break;
    case 'settings-game': showSettings(true); menuOpen = true; break;
    case 'menu': showMenu(); break;
    case 'wipe':
      if (b.dataset.sure) {
        const keep = P.settings;
        P = freshSave();
        P.settings = keep;
        run = null;
        save();
        showTitle();
        toast('<b>Semua progres dihapus.</b><span>Pemandu lupa siapa kamu. Katanya.</span>');
      } else {
        b.dataset.sure = '1';
        b.textContent = 'Yakin? Klik sekali lagi untuk menghapus';
      }
      break;
  }
});

$('#card').addEventListener('change', e => {
  const k = e.target.dataset.set;
  if (!k) return;
  P.settings[k] = e.target.checked;
  if (k === 'reduce') document.body.classList.toggle('reduce', isReduced());
  save();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#overlay').hidden) {
    const card = $('#card');
    if (card.classList.contains('menu') || card.classList.contains('gallery') || card.classList.contains('settings')) {
      if (card.classList.contains('settings') && !$('#gameScreen').hidden) showMenu(); else closeOverlay();
    }
  } else if (!$('#gameScreen').hidden && level && !level.done) showMenu();
});

window.addEventListener('pagehide', save);

/* ================= Mulai ================= */

P = load();
showTitle();
requestAnimationFrame(loop);
