'use strict';

/* ==========================================================
   Roda Keputusan Orang Gabut
   Pemenang dipilih lebih dulu, lalu sudut akhir roda dihitung
   supaya berhenti tepat di sana. Fitur "jangan ulangi" jadi
   benar-benar terjamin, bukan sekadar peluang.
   ========================================================== */

const PRESETS = {
  makanan:  { name: 'Makanan', note: 'Pertanyaan tersulit sedunia', items: ['Nasi goreng', 'Mi instan', 'Soto', 'Bakso', 'Ayam geprek', 'Nasi padang', 'Sate', 'Gado-gado'] },
  aktivitas:{ name: 'Aktivitas', note: 'Untuk sore tanpa rencana', items: ['Tidur', 'Nonton', 'Makan', 'Jalan-jalan', 'Tidak melakukan apa-apa', 'Beres-beres', 'Olahraga sebentar'] },
  hiburan:  { name: 'Hiburan', note: 'Daripada scroll terus', items: ['Film lama', 'Serial baru', 'Main game', 'Baca komik', 'Dengar podcast', 'Karaoke sendirian'] },
  tugas:    { name: 'Tugas', note: 'Yang paling dihindari', items: ['Balas email', 'Cuci piring', 'Rapikan folder', 'Bayar tagihan', 'Cuci baju', 'Kerjakan yang itu'] },
  absurd:   { name: 'Pilihan absurd', note: 'Untuk jiwa yang siap', items: ['Berdebat dengan kipas angin', 'Menghitung ubin', 'Menyapa tanaman', 'Membuka kulkas tanpa alasan', 'Menatap langit 5 menit', 'Meminta maaf kepada sapu', 'Berjalan mundur ke dapur', 'Menamai semua sendok'] }
};

const COLORS = ['#e8483f', '#f2b632', '#2aa7a1', '#fff3d6', '#7b3fa0', '#f27f3d', '#3f7fd6', '#8cc152'];
const NOTES = [
  'Roda sudah bicara. Kamu boleh protes kepada roda.',
  'Keputusan ini final, sampai kamu memutar lagi.',
  'Tidak ada yang lebih tahu, termasuk rodanya.',
  'Hidup memang semudah itu kalau tanggung jawabnya dilempar.',
  'Selamat. Satu keputusan berkurang, ribuan menunggu.'
];
const CHAOS_LINES = [
  'Roda sempat memilih "{o}", lalu berubah pikiran.',
  '"{o}" terlalu masuk akal. Roda menolaknya.',
  'Roda menimbang "{o}", lalu tertawa.'
];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 24;

/* ---------- Simpanan ---------- */

const SAVE_KEY = 'roda-keputusan-v1';
const blank = () => ({
  options: PRESETS.aktivitas.items.slice(), preset: 'aktivitas', saved: [], history: [], last: null,
  settings: { noRepeat: false, remove: false, chaos: false, sound: true, motion: false },
  angle: 0
});
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && Array.isArray(raw.options) && raw.options.length >= MIN_OPTIONS) {
      const d = blank();
      return { ...d, ...raw, settings: { ...d.settings, ...raw.settings }, saved: raw.saved || [], history: raw.history || [] };
    }
  } catch (e) { /* mulai baru */ }
  return blank();
}
let S = load();
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* roda tetap berputar */ }
}

const $ = (s) => document.querySelector(s);
const TAU = Math.PI * 2;
const reducedMotion = () => S.settings.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Gambar roda ---------- */

const canvas = $('#wheel');
const ctx = canvas.getContext('2d');
let angle = S.angle || 0;
let spinning = false;
let view = { size: 400, dpr: 1 };

function colorFor(i, n) {
  // Kalau jumlahnya bersisa satu, warna terakhir dan pertama bisa sama. Ini mencegahnya.
  if (n % COLORS.length === 1 && i === n - 1) return COLORS[2];
  return COLORS[i % COLORS.length];
}
function inkFor(hex) {
  const v = parseInt(hex.slice(1), 16);
  const lum = (.299 * (v >> 16 & 255) + .587 * (v >> 8 & 255) + .114 * (v & 255)) / 255;
  return lum > .62 ? '#2b1236' : '#ffffff';
}

function resize() {
  const wrap = canvas.parentElement;
  const size = Math.max(200, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  view = { size, dpr };
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const top = (wrap.clientHeight - size) / 2;
  wrap.style.setProperty('--ptr-top', `${top - 2}px`);
  wrap.style.setProperty('--ptr-w', `${Math.max(34, size * .085).toFixed(0)}px`);
  wrap.style.setProperty('--hub', `${Math.max(58, size * .17).toFixed(0)}px`);
  draw();
}

function fitLabel(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function draw() {
  const { size, dpr } = view;
  const n = S.options.length;
  const c = size / 2;
  const R = c - size * .05;
  const slice = TAU / n;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  // Bingkai dan lampu tidak ikut berputar, seperti roda pameran sungguhan.
  ctx.beginPath();
  ctx.arc(c, c, c - 2, 0, TAU);
  ctx.fillStyle = '#7a1f3d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2b1236';
  ctx.stroke();

  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(angle - Math.PI / 2);
  for (let i = 0; i < n; i++) {
    const a0 = i * slice, a1 = a0 + slice;
    const col = colorFor(i, n);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2b1236';
    ctx.stroke();

    ctx.save();
    ctx.rotate(a0 + slice / 2);
    // Huruf mengecil dulu agar label muat. Baru dipotong kalau tetap terlalu panjang.
    const room = R * .68;
    let fontPx = Math.max(11, Math.min(R * .092, (R * slice) * .3));
    const setFont = () => { ctx.font = `700 ${fontPx}px "Avenir Next", Avenir, "Segoe UI", Arial, sans-serif`; };
    setFont();
    const minPx = Math.max(10.5, fontPx * .62);
    while (fontPx > minPx && ctx.measureText(S.options[i]).width > room) {
      fontPx -= .5;
      setFont();
    }
    ctx.fillStyle = inkFor(col);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    // Ujung label berhenti sebelum tepi supaya tidak tertutup penunjuk.
    ctx.fillText(fitLabel(S.options[i], room), R * .88, 0);
    ctx.restore();
  }
  ctx.restore();

  // Lampu mengitari tepi. Saat berputar, lampunya bergantian menyala.
  const bulbs = 24;
  const phase = spinning ? Math.floor(performance.now() / 120) % 2 : 0;
  for (let i = 0; i < bulbs; i++) {
    const a = (i / bulbs) * TAU;
    const x = c + Math.cos(a) * (R + size * .023), y = c + Math.sin(a) * (R + size * .023);
    const on = reducedMotion() || (i + phase) % 2 === 0;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2.6, size * .0095), 0, TAU);
    ctx.fillStyle = on ? '#ffe08a' : '#8a5a2c';
    ctx.fill();
  }
}

/* ---------- Putaran ---------- */

const indexAt = (a, n) => {
  const pos = ((-a % TAU) + TAU) % TAU;
  return Math.floor(pos / (TAU / n)) % n;
};

/* Sudut akhir yang menaruh pilihan ke-i tepat di bawah penunjuk. */
function targetAngle(from, i, n, turns) {
  const slice = TAU / n;
  const inside = (i + .12 + Math.random() * .76) * slice;
  const stop = TAU - inside;
  const fromNorm = ((from % TAU) + TAU) % TAU;
  let delta = stop - fromNorm;
  if (delta < 0) delta += TAU;
  return from + delta + turns * TAU;
}

function chooseWinner() {
  const n = S.options.length;
  const pool = [...Array(n).keys()].filter((i) => !(S.settings.noRepeat && S.options[i] === S.last));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * n);
}

function setSpinning(on) {
  spinning = on;
  $('#spinBtn').disabled = on;
  $('#hub').disabled = on;
  $('#spinBtn').textContent = on ? 'Berputar...' : 'Putar';
  // Pilihan dikunci selama berputar supaya irisan tidak bergeser dari hasil yang sudah ditentukan.
  document.querySelectorAll('#optList input, #addInput').forEach((el) => { el.disabled = on; });
}

function spin() {
  if (spinning) return;
  if (S.options.length < MIN_OPTIONS) {
    $('#status').textContent = 'Roda butuh minimal dua pilihan. Satu pilihan namanya takdir.';
    return;
  }
  if ($('#result').open) $('#result').close();
  flushOptionEdits();
  const n = S.options.length;
  const winner = chooseWinner();
  const fast = reducedMotion();
  const turns = fast ? 1 : 5 + Math.floor(Math.random() * 3);
  const start = angle;
  const end = targetAngle(start, winner, n, turns);
  const duration = fast ? 700 : 4300 + Math.random() * 1400;
  const t0 = performance.now();
  let lastIdx = indexAt(start, n);
  let flap = 0;
  setSpinning(true);
  $('#status').textContent = 'Roda sedang berpikir. Ini lebih dari yang dilakukan kebanyakan orang.';
  ensureAudio();

  const frame = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    angle = start + (end - start) * eased;

    const idx = indexAt(angle, n);
    if (idx !== lastIdx) {
      lastIdx = idx;
      flap = 22;
      tick();
    }
    flap *= .8;
    if (!reducedMotion()) $('#pointer').style.setProperty('--flap', `${flap.toFixed(1)}deg`);
    draw();

    if (p < 1) { requestAnimationFrame(frame); return; }
    angle = end;
    setSpinning(false);
    $('#pointer').style.setProperty('--flap', '0deg');
    draw();
    finish(winner);
  };
  requestAnimationFrame(frame);
}

function allPresetItems() {
  return Object.values(PRESETS).flatMap((p) => p.items);
}

function finish(winner) {
  const landed = S.options[winner];
  let result = landed;
  let chaosNote = '';

  // Mode chaos: kadang roda mengabaikan tempatnya berhenti.
  if (S.settings.chaos && Math.random() < .4) {
    const others = allPresetItems().filter((x) => !S.options.includes(x));
    if (others.length) {
      result = others[Math.floor(Math.random() * others.length)];
      chaosNote = CHAOS_LINES[Math.floor(Math.random() * CHAOS_LINES.length)].replace('{o}', landed);
    }
  }

  S.last = landed;
  S.angle = angle % TAU;
  S.history.unshift({ text: result, t: Date.now(), chaos: !!chaosNote });
  if (S.history.length > 40) S.history.length = 40;

  if (S.settings.remove && S.options.length > MIN_OPTIONS) {
    S.options.splice(winner, 1);
    S.preset = null;
    renderOptions();
    renderPresets();
    draw();
  }

  renderHistory();
  save();
  showResult(result, chaosNote);
  fanfare();
}

/* ---------- Hasil ---------- */

function showResult(text, chaosNote) {
  $('#resText').textContent = text;
  const ch = $('#resChaos');
  ch.hidden = !chaosNote;
  ch.textContent = chaosNote;
  $('#resNote').textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
  $('#resShareNote').textContent = '';
  $('#status').textContent = `Hasil terakhir: ${text}`;
  const dlg = $('#result');
  dlg.showModal();
  $('#resAccept').focus();
  if (!reducedMotion()) confetti();
}

let confettiRun = 0;
function confetti() {
  const cv = $('#confetti');
  const box = cv.getBoundingClientRect();
  cv.width = box.width;
  cv.height = box.height;
  const c = cv.getContext('2d');
  const bits = Array.from({ length: 70 }, () => ({
    x: Math.random() * box.width, y: -20 - Math.random() * box.height * .6,
    vy: 90 + Math.random() * 170, vx: (Math.random() - .5) * 50,
    s: 5 + Math.random() * 7, r: Math.random() * TAU, vr: (Math.random() - .5) * 8,
    col: COLORS[Math.floor(Math.random() * COLORS.length)]
  }));
  const run = ++confettiRun;
  const t0 = performance.now();
  let last = t0;
  const step = (now) => {
    if (run !== confettiRun || !$('#result').open) { c.clearRect(0, 0, cv.width, cv.height); return; }
    const dt = Math.min(.1, (now - last) / 1000);
    last = now;
    c.clearRect(0, 0, cv.width, cv.height);
    bits.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.r += b.vr * dt;
      c.save();
      c.translate(b.x, b.y);
      c.rotate(b.r);
      c.fillStyle = b.col === '#fff3d6' ? '#e8483f' : b.col;
      c.fillRect(-b.s / 2, -b.s / 3, b.s, b.s * .66);
      c.restore();
    });
    if (now - t0 < 3200) requestAnimationFrame(step);
    else c.clearRect(0, 0, cv.width, cv.height);
  };
  requestAnimationFrame(step);
}

async function shareResult() {
  const text = `Roda Keputusan Orang Gabut memutuskan: ${$('#resText').textContent}`;
  const note = $('#resShareNote');
  try {
    if (navigator.share) {
      await navigator.share({ text });
      note.textContent = 'Terkirim. Kini semua orang tahu.';
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
  }
  try {
    await navigator.clipboard.writeText(text);
    note.textContent = 'Tersalin. Tempelkan di mana saja.';
  } catch (e) {
    note.textContent = text;
  }
}

/* ---------- Suara ---------- */

let audio = null;
function ensureAudio() {
  if (!S.settings.sound) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    audio = audio || new AC();
    if (audio.state === 'suspended') audio.resume();
  } catch (e) { audio = null; }
}
function tone(freq, dur, type, gain, delay = 0) {
  if (!S.settings.sound || !audio) return;
  const t = audio.currentTime + delay;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(audio.destination);
  o.start(t);
  o.stop(t + dur + .02);
}
function tick() { tone(1250, .025, 'square', .03); }
function fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .24, 'triangle', .07, i * .11)); }

/* ---------- Pilihan ---------- */

function renderOptions() {
  const list = $('#optList');
  list.textContent = '';
  const n = S.options.length;
  S.options.forEach((text, i) => {
    const li = document.createElement('li');
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = colorFor(i, n);
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 50;
    input.value = text;
    input.dataset.i = i;
    input.setAttribute('aria-label', `Ubah pilihan ${i + 1}`);
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (value) {
        S.options[i] = value;
        S.preset = null;
        draw();
      }
    });
    input.addEventListener('blur', () => {
      if (!input.value.trim()) input.value = S.options[i];
      else input.value = input.value.trim();
      renderPresets();
      save();
    });
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); } });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.textContent = '×';
    del.disabled = n <= MIN_OPTIONS;
    del.setAttribute('aria-label', `Hapus ${text}`);
    del.addEventListener('click', () => {
      if (spinning || S.options.length <= MIN_OPTIONS) return;
      S.options.splice(i, 1);
      S.preset = null;
      afterOptionsChanged();
    });
    li.append(sw, input, del);
    list.appendChild(li);
  });
  $('#optCount').textContent = `${n} dari ${MAX_OPTIONS} pilihan`;
}
function flushOptionEdits() {
  const el = document.activeElement;
  if (el && el.matches && el.matches('#optList input')) el.blur();
}
function afterOptionsChanged() {
  renderOptions();
  renderPresets();
  draw();
  save();
}
function addOption(text) {
  const value = text.trim();
  if (!value || spinning) return false;
  if (S.options.length >= MAX_OPTIONS) {
    $('#optCount').textContent = `Sudah ${MAX_OPTIONS} pilihan. Roda ini bukan rapat RT.`;
    return false;
  }
  if (S.options.some((o) => o.toLowerCase() === value.toLowerCase())) {
    $('#optCount').textContent = 'Pilihan itu sudah ada. Roda tidak bisa disuap.';
    return false;
  }
  S.options.push(value);
  S.preset = null;
  afterOptionsChanged();
  return true;
}

/* ---------- Preset ---------- */

function applyOptions(items, presetKey) {
  if (spinning) return;
  S.options = items.slice(0, MAX_OPTIONS);
  S.preset = presetKey;
  S.last = null;
  afterOptionsChanged();
}

function renderPresets() {
  const box = $('#builtinList');
  box.textContent = '';
  Object.entries(PRESETS).forEach(([key, p]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.setAttribute('aria-pressed', String(S.preset === key));
    const title = document.createElement('b');
    title.textContent = p.name;
    const note = document.createElement('span');
    note.textContent = p.note;
    b.append(title, note);
    b.addEventListener('click', () => {
      applyOptions(p.items, key);
      $('#status').textContent = `Preset "${p.name}" dipasang.`;
    });
    box.appendChild(b);
  });

  const list = $('#savedList');
  list.textContent = '';
  if (!S.saved.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Belum ada. Simpan roda ini kalau hasilnya pernah menyelamatkanmu.';
    list.appendChild(li);
    return;
  }
  S.saved.forEach((item, i) => {
    const li = document.createElement('li');
    const load2 = document.createElement('button');
    load2.type = 'button';
    load2.className = 'load';
    load2.append(item.name);
    const small = document.createElement('small');
    small.textContent = `${item.options.length} pilihan`;
    load2.appendChild(small);
    load2.addEventListener('click', () => {
      applyOptions(item.options, null);
      $('#status').textContent = `Roda "${item.name}" dimuat.`;
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.textContent = '×';
    del.setAttribute('aria-label', `Hapus roda ${item.name}`);
    del.addEventListener('click', () => {
      S.saved.splice(i, 1);
      renderPresets();
      save();
    });
    li.append(load2, del);
    list.appendChild(li);
  });
}

function saveWheel(nameRaw) {
  const name = nameRaw.trim();
  const note = $('#saveNote');
  if (!name) {
    note.textContent = 'Roda ini perlu nama. Dia juga punya perasaan, mungkin.';
    return false;
  }
  flushOptionEdits();
  const existing = S.saved.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.options = S.options.slice();
    note.textContent = `Roda "${existing.name}" diperbarui.`;
  } else {
    S.saved.unshift({ name, options: S.options.slice() });
    note.textContent = `Roda "${name}" disimpan.`;
  }
  renderPresets();
  save();
  return true;
}

/* ---------- Riwayat ---------- */

function renderHistory() {
  const list = $('#hisList');
  list.textContent = '';
  $('#clearHis').hidden = !S.history.length;
  if (!S.history.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Belum ada keputusan. Sangat khas kamu.';
    list.appendChild(li);
    return;
  }
  S.history.forEach((h) => {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = h.text;
    const small = document.createElement('small');
    const d = new Date(h.t);
    const stamp = `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
    small.textContent = h.chaos ? `${stamp}, ulah mode chaos` : stamp;
    li.append(b, small);
    list.appendChild(li);
  });
}

/* ---------- Penyalaan ---------- */

function selectTab(name) {
  ['opt', 'pre', 'his'].forEach((k) => {
    $(`#tab-${k}`).setAttribute('aria-selected', String(k === name));
    $(`#pane-${k}`).hidden = k !== name;
  });
}

function setup() {
  const bindings = { optNoRepeat: 'noRepeat', optRemove: 'remove', optChaos: 'chaos', optSound: 'sound', optMotion: 'motion' };
  Object.entries(bindings).forEach(([id, key]) => {
    const el = $(`#${id}`);
    el.checked = S.settings[key];
    el.addEventListener('change', () => {
      S.settings[key] = el.checked;
      if (key === 'motion') draw();
      save();
    });
  });

  renderOptions();
  renderPresets();
  renderHistory();
  resize();

  new ResizeObserver(resize).observe(canvas.parentElement);
  $('#spinBtn').addEventListener('click', spin);
  $('#hub').addEventListener('click', spin);
  $('#addForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = $('#addInput');
    if (addOption(input.value)) input.value = '';
    input.focus();
  });
  $('#saveForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (saveWheel($('#saveName').value)) $('#saveName').value = '';
  });
  $('#clearHis').addEventListener('click', () => {
    S.history = [];
    renderHistory();
    save();
  });
  ['opt', 'pre', 'his'].forEach((k) => {
    $(`#tab-${k}`).addEventListener('click', () => selectTab(k));
  });
  $('#resAccept').addEventListener('click', () => $('#result').close());
  $('#resAgain').addEventListener('click', () => { $('#result').close(); spin(); });
  $('#resShare').addEventListener('click', shareResult);
  window.addEventListener('pagehide', save);
}

setup();
