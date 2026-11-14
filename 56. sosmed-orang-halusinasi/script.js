/* halu. Sosmed Orang Halusinasi
   Timeline fiktif yang berjalan sendiri. Konten ada di data.js. */
'use strict';

const SAVE_KEY = 'sosmed-halusinasi-v1';
const MAX_FEED = 120;
const MAX_MY_POSTS = 60;
const MAX_NOTIF = 60;
const SECRET_INTERACTIONS = 25;
const SPEED = { lambat: 0.6, normal: 1, cepat: 1.8 };
const CHAOS_STEP = 6;               // postingan baru per kenaikan level chaos
const REGULAR = Object.keys(CHARACTERS).filter(id => !CHARACTERS[id].secret);
const SECRETS = Object.keys(CHARACTERS).filter(id => CHARACTERS[id].secret);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const ICON = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>',
  reply: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
};

/* ================= State ================= */

let S;
function defaultState() {
  return {
    v: 1,
    me: { name: 'Kamu', handle: 'kamu_nyata', avatar: '🙂' },
    feed: [], notifs: [], follows: [], followers: [], secrets: [],
    stats: { likes: 0, comments: 0, posts: 0 },
    chaos: { on: false, level: 0, count: 0 },
    settings: { speed: 'normal', paused: false, reduce: false },
    welcomeDismissed: false,
  };
}

function load() {
  const base = defaultState();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw && raw.v === 1 && Array.isArray(raw.feed)) {
      for (const k of Object.keys(base)) if (raw[k] !== undefined) base[k] = raw[k];
      base.me = { ...defaultState().me, ...raw.me };
      base.stats = { ...defaultState().stats, ...raw.stats };
      base.chaos = { ...defaultState().chaos, ...raw.chaos };
      base.settings = { ...defaultState().settings, ...raw.settings };
      // Buang data yang merujuk ke karakter yang tidak dikenal.
      base.feed = base.feed.filter(p => p && known(p.author));
      base.feed.forEach(p => { p.replies = (p.replies || []).filter(r => known(r.author)); });
      base.secrets = base.secrets.filter(id => SECRETS.includes(id));
    }
  } catch (e) { /* data rusak atau storage diblokir: mulai baru */ }
  return base;
}
const known = id => id === 'me' || !!CHARACTERS[id];

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 400);
}
function saveNow() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage penuh/diblokir */ }
}

const interactions = () => S.stats.likes + S.stats.comments + S.stats.posts;
const roster = () => REGULAR.concat(S.secrets);

/* ================= Karakter ================= */

function ch(id) {
  if (id === 'me') {
    return { id: 'me', name: S.me.name, handle: S.me.handle, emoji: S.me.avatar, color: '#6d28d9',
      badge: 'Manusia (katanya)', bio: 'Satu-satunya akun yang mengetik sendiri di sini.', trait: 'Nyata (belum terbukti)' };
  }
  const c = CHARACTERS[id];
  return { id, ...c, emoji: c.mirror ? S.me.avatar : c.emoji };
}

const handleIndex = () => {
  const map = { [S.me.handle.toLowerCase()]: 'me' };
  for (const id of roster()) map[CHARACTERS[id].handle] = id;
  return map;
};

/* Kantong acak per karakter supaya teks tidak cepat berulang. */
const bags = {};
function draw(id, pool) {
  const key = id + ':' + pool;
  const list = CHARACTERS[id][pool] || [];
  if (!list.length) return '';
  if (!bags[key] || !bags[key].length) {
    const recent = new Set(S.feed.slice(0, 30).map(p => p.text));
    let order = shuffle(list.map((_, i) => i));
    const fresh = order.filter(i => !recent.has(list[i]));
    bags[key] = fresh.length ? fresh : order;
  }
  return list[bags[key].pop()];
}

const fill = (tpl, toId) => tpl.replace(/\{to\}/g, toId === 'me' ? '{me}' : '@' + CHARACTERS[toId].handle);

let lastAuthors = [];
function pickAuthor(exclude = []) {
  const pool = roster().filter(id => !exclude.includes(id));
  const fresh = pool.filter(id => !lastAuthors.includes(id));
  // Akun rahasia jarang muncul.
  const weighted = (fresh.length ? fresh : pool).flatMap(id => CHARACTERS[id].secret ? [id] : [id, id, id]);
  return pick(weighted);
}

function glitchName(name) {
  const sub = { a: '4', e: '3', i: '1', o: '0', s: '5', A: '4', E: '3', I: '1', O: '0', S: '5' };
  return [...name].map(c => sub[c] && Math.random() < .55 ? sub[c] : c).join('');
}

/* ================= Postingan ================= */

function makePost(author, text, extra = {}) {
  return {
    id: uid(), author, text, t: Date.now(),
    likes: extra.likes || 0, liked: false, replies: [],
    heat: extra.heat || 0, label: extra.label || null,
    chaos: !!extra.chaos, glitch: extra.glitch || null,
  };
}
const makeReply = (author, text) => ({ id: uid(), author, text, t: Date.now(), likes: 0, liked: false });
const findPost = id => S.feed.find(p => p.id === id);

function trimFeed() {
  let mine = 0, others = 0;
  S.feed = S.feed.filter(p => p.author === 'me' ? ++mine <= MAX_MY_POSTS : ++others <= MAX_FEED);
}

function addPost(p, { own = false, quiet = false } = {}) {
  S.feed.unshift(p);
  trimFeed();
  if (!quiet && p.author !== 'me' && p.text.includes('{me}')) notify('mention', p.author, p.id, p.text);
  if (own) insertOwnPost(p); else announcePost(p);
  renderSide();
  save();
}

function addReply(postId, reply) {
  const p = findPost(postId);
  if (!p) return;
  p.replies.push(reply);
  if (reply.author !== 'me') {
    p.heat = Math.max(p.heat, 2);
    if (p.author === 'me') notify('reply', reply.author, p.id, reply.text);
    else if (reply.text.includes('{me}')) notify('mention', reply.author, p.id, reply.text);
  }
  refreshPost(p);
  save();
}

/* NPC lain ikut membalas postingan NPC. */
function scheduleNpcReplies(p, n) {
  let delay = 0;
  for (let i = 0; i < n; i++) {
    delay += rand(3500, 11000);
    schedule(delay, () => {
      const post = findPost(p.id);
      if (!post) return;
      const who = pickAuthor([post.author]);
      addReply(post.id, makeReply(who, fill(draw(who, 'replies'), post.author)));
      // Kadang ada yang membalas balasan itu.
      if (Math.random() < .25) {
        schedule(rand(3000, 8000), () => {
          const other = pickAuthor([who]);
          addReply(post.id, makeReply(other, fill(draw(other, 'replies'), who)));
        });
      }
    });
  }
}

function regularPost() {
  const lvl = S.chaos.on ? S.chaos.level : 0;
  const author = pickAuthor();
  const chaotic = lvl > 0 && Math.random() < [0, .3, .45, .6, .75, .9][lvl];
  const text = draw(author, chaotic ? 'chaos' : 'posts');
  const p = makePost(author, text, {
    chaos: chaotic,
    likes: randInt(0, 25),
    heat: randInt(1, 4) * (chaotic ? 2 : 1),
    glitch: lvl >= 3 && Math.random() < .45 ? glitchName(ch(author).name) : null,
  });
  addPost(p);
  scheduleNpcReplies(p, randInt(0, lvl >= 4 ? 3 : 2));
}

function mentionPost() {
  const options = MENTION_POSTS.filter(([id]) => roster().includes(id));
  const [author, text] = pick(options);
  const p = makePost(author, text, { likes: randInt(2, 30), heat: 2 });
  addPost(p);
  scheduleNpcReplies(p, randInt(0, 1));
}

function spawnPost() {
  lastAuthors = S.feed.slice(0, 2).map(p => p.author);
  const r = Math.random();
  if (!dramaActive && r < .15) startDrama();
  else if (interactions() >= 5 && r < .23) mentionPost();
  else regularPost();
  if (S.chaos.on) chaosStep();
}

/* ================= Drama ================= */

let dramaActive = false;
let dramaBag = [];
function drawDrama() {
  if (!dramaBag.length) dramaBag = shuffle(DRAMAS.map((_, i) => i));
  return DRAMAS[dramaBag.pop()];
}

function startDrama() {
  const d = drawDrama();
  dramaActive = true;
  const p = makePost(d.by, d.text, { label: 'drama', likes: randInt(20, 80), heat: 6 });
  addPost(p);
  let delay = 0;
  d.thread.forEach(([who, line]) => {
    delay += rand(3500, 7500);
    schedule(delay, () => addReply(p.id, makeReply(who, line)));
  });
  delay += rand(6000, 10000);
  schedule(delay, () => {
    addPost(makePost(d.after[0], d.after[1], { label: 'klarifikasi', likes: randInt(10, 60), heat: 4 }));
    dramaActive = false;
  });
}

/* ================= Interaksi pemain ================= */

function toggleLike(postId, replyId) {
  const p = findPost(postId);
  if (!p) return;
  const item = replyId ? p.replies.find(r => r.id === replyId) : p;
  if (!item) return;
  item.liked = !item.liked;
  item.likes = Math.max(0, item.likes + (item.liked ? 1 : -1));
  S.stats.likes = Math.max(0, S.stats.likes + (item.liked ? 1 : -1));
  refreshPost(p);
  afterInteraction();
}

function sendComment(postId, text) {
  const p = findPost(postId);
  if (!p) return;
  addReply(p.id, makeReply('me', text));
  S.stats.comments++;
  expanded.add(p.id);
  refreshPost(p);
  if (p.author !== 'me') {
    // Pemilik postingan biasanya membalas komentarmu.
    if (Math.random() < .65) {
      schedule(rand(4000, 10000), () => addReply(p.id, makeReply(p.author, draw(p.author, 'toMe'))));
    }
    if (Math.random() < .2) {
      const other = pickAuthor([p.author]);
      schedule(rand(8000, 16000), () => addReply(p.id, makeReply(other, draw(other, 'toMe'))));
    }
  } else if (Math.random() < .45) {
    const who = pickAuthor();
    schedule(rand(4000, 10000), () => addReply(p.id, makeReply(who, draw(who, 'toMe'))));
  }
  afterInteraction();
}

function createPost(text) {
  const p = makePost('me', text);
  addPost(p, { own: true });
  S.stats.posts++;
  reactToMyPost(p);
  afterInteraction();
}

/* NPC bereaksi pada postingan pemain: like, balasan sesuai kata kunci dan mention. */
function reactToMyPost(p) {
  const lvl = S.chaos.on ? S.chaos.level : 0;
  const responders = new Map();
  const handles = handleIndex();
  for (const m of p.text.matchAll(/@([A-Za-z0-9_]+)/g)) {
    const id = handles[m[1].toLowerCase()];
    if (id && id !== 'me' && !responders.has(id)) responders.set(id, draw(id, 'toMe'));
  }
  for (const kw of KEYWORDS) {
    if (responders.size >= 3) break;
    if (!kw.re.test(p.text)) continue;
    const [id, line] = pick(kw.lines);
    if (!responders.has(id)) responders.set(id, line);
  }
  if (!responders.size) {
    const n = randInt(1, 2);
    while (responders.size < n) { const id = pickAuthor(); responders.set(id, draw(id, 'toMe')); }
  }
  if (S.secrets.includes('penulis') && !responders.has('penulis') && Math.random() < .3) {
    responders.set('penulis', draw('penulis', 'toMe'));
  }
  let delay = 0;
  for (const [id, line] of responders) {
    delay += rand(3000, 7000);
    schedule(delay, () => addReply(p.id, makeReply(id, line)));
  }

  const likers = shuffle(roster()).slice(0, Math.min(roster().length, randInt(3, 8) + lvl * 2));
  likers.forEach(id => schedule(rand(1500, 40000), () => {
    const post = findPost(p.id);
    if (!post) return;
    post.likes++;
    notify('like', id, post.id, post.text);
    refreshPost(post);
    save();
  }));
}

function toggleFollow(id) {
  const i = S.follows.indexOf(id);
  if (i >= 0) { S.follows.splice(i, 1); toast(`Berhenti mengikuti ${ch(id).name}`); }
  else {
    S.follows.push(id);
    toast(`Mengikuti ${ch(id).name}`);
    if (!S.followers.includes(id) && Math.random() < .5) {
      schedule(rand(5000, 20000), () => {
        if (S.followers.includes(id)) return;
        S.followers.push(id);
        notify('follow', id, null, null);
        save();
      });
    }
  }
  $$(`[data-follow="${id}"]`).forEach(updateFollowBtn);
  if (view === 'home' && homeTab === 'following') renderView();
  if (view.startsWith('profile:')) renderView();
  renderSuggest();
  save();
}

function afterInteraction() {
  // Sesekali ada akun yang mulai mengikutimu.
  if (interactions() % 8 === 0 && Math.random() < .5) {
    const candidates = roster().filter(id => !S.followers.includes(id));
    if (candidates.length) {
      const id = pick(candidates);
      schedule(rand(3000, 9000), () => {
        if (S.followers.includes(id)) return;
        S.followers.push(id);
        notify('follow', id, null, null);
        save();
      });
    }
  }
  if (interactions() >= SECRET_INTERACTIONS) unlockSecret('penulis');
  save();
}

/* ================= Akun rahasia ================= */

function unlockSecret(id) {
  if (S.secrets.includes(id)) return;
  S.secrets.push(id);
  const c = CHARACTERS[id];
  const p = makePost(id, c.intro, { label: 'rahasia', likes: randInt(60, 240), heat: 5 });
  addPost(p, { quiet: true });
  notify('secret', id, p.id, c.intro);
  toast(`Akun misterius muncul: ${c.name}`);
  let delay = 0;
  c.introReplies.forEach(([who, line]) => {
    delay += rand(3000, 6000);
    schedule(delay, () => addReply(p.id, makeReply(who, line)));
  });
  renderSide();
  save();
}

/* ================= Mode chaos ================= */

function setChaos(on) {
  S.chaos.on = on;
  S.chaos.count = 0;
  S.chaos.level = on ? 1 : 0;
  toast(on ? 'Mode chaos menyala. Timeline mulai aneh.' : 'Timeline kembali normal. Kurang lebih.');
  applyChaos();
  renderSide();
  save();
}

function chaosStep() {
  S.chaos.count++;
  if (S.chaos.count % CHAOS_STEP === 0 && S.chaos.level < 5) {
    S.chaos.level++;
    toast(`Level chaos naik ke ${S.chaos.level}`);
    applyChaos();
    if (S.chaos.level === 5) unlockSecret('besok');
  }
}

function applyChaos() {
  const { on, level } = S.chaos;
  document.body.dataset.chaos = on ? level : 0;
  $$('[data-act="chaos"]').forEach(b => {
    if (b.classList.contains('switch')) b.setAttribute('aria-checked', on);
    b.classList.toggle('on', on);
  });
  $$('.chaos-meter i').forEach((el, i) => el.classList.toggle('lit', on && i < level));
  $$('.chaos-level').forEach(el => { el.textContent = on ? `Level ${level} dari 5` : 'Mati'; });
  $$('.chaos-num').forEach(el => { el.textContent = on ? level : ''; });
}

/* ================= Jam permainan ================= */

let clock = 0;
let queue = [];
let nextPostAt = 0;
let nextHeatAt = 0;

function schedule(ms, fn) { queue.push({ at: clock + ms, fn }); }

function speedMul() {
  const chaosBoost = S.chaos.on ? 1 + S.chaos.level * .12 : 1;
  return (SPEED[S.settings.speed] || 1) * chaosBoost;
}

const TICK = 250;
function tick() {
  if (S.settings.paused || document.hidden) return;
  clock += TICK * speedMul();
  const due = queue.filter(e => e.at <= clock).sort((a, b) => a.at - b.at);
  if (due.length) {
    queue = queue.filter(e => e.at > clock);
    due.forEach(e => e.fn());
  }
  if (clock >= nextPostAt) {
    nextPostAt = clock + rand(5000, 9000);
    spawnPost();
  }
  if (clock >= nextHeatAt) {
    nextHeatAt = clock + 2000;
    growLikes();
  }
}

/* Postingan NPC yang masih baru mendapat like dari "penonton" tak terlihat. */
function growLikes() {
  let changed = false;
  for (const p of S.feed.slice(0, 25)) {
    if (p.author === 'me' || p.heat < .3) continue;
    if (Math.random() < .6) {
      p.likes += randInt(0, Math.ceil(p.heat));
      changed = true;
      refreshCounts(p);
    }
    p.heat *= .9;
  }
  if (changed) save();
}

/* ================= Notifikasi ================= */

function notify(type, actor, postId, text) {
  if (type === 'like') {
    const n = S.notifs.find(x => x.type === 'like' && x.postId === postId && !x.read);
    if (n) {
      if (!n.actors.includes(actor)) n.actors.unshift(actor);
      n.t = Date.now();
      S.notifs.splice(S.notifs.indexOf(n), 1);
      S.notifs.unshift(n);
      updateBadges();
      if (view === 'notif') renderView();
      return;
    }
  }
  S.notifs.unshift({ id: uid(), type, actors: [actor], postId, text, t: Date.now(), read: false });
  S.notifs.length = Math.min(S.notifs.length, MAX_NOTIF);
  updateBadges();
  if (view === 'notif') renderView();
}

function updateBadges() {
  const unread = S.notifs.filter(n => !n.read).length;
  $$('.nbadge').forEach(b => { b.hidden = !unread; b.textContent = unread > 9 ? '9+' : unread; });
}

/* ================= Trending ================= */

function tagsIn(text) { return (text.match(/#[A-Za-z0-9_]+/g) || []); }

function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

function trends() {
  const score = {}, label = {};
  S.feed.slice(0, 60).forEach((p, i) => {
    const w = 1 + (60 - i) / 30 + p.replies.length * .4 + (p.label === 'drama' ? 2 : 0);
    for (const tag of tagsIn(p.text)) {
      const k = tag.toLowerCase();
      score[k] = (score[k] || 0) + w;
      label[k] = label[k] || tag;
    }
  });
  let list = Object.keys(score).map(k => ({ tag: label[k], s: score[k], count: 800 + hash(k) % 11000 + Math.round(score[k] * 173) }))
    .sort((a, b) => b.s - a.s);
  if (S.chaos.on && S.chaos.level >= 3) {
    const fake = ABSURD_TRENDS.slice(0, S.chaos.level - 2).map(tag => ({ tag, s: 999, count: 400000 + hash(tag) % 900000, absurd: true }));
    list = fake.concat(list);
  }
  return list;
}

/* ================= Format ================= */

function fmt(n) {
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '').replace('.', ',') + ' rb';
  return (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' jt';
}

function ago(t) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' mnt';
  if (s < 86400) return Math.floor(s / 3600) + ' j';
  return Math.floor(s / 86400) + ' h';
}

/* Teks aman: #topik dan @handle jadi tombol, sisanya teks biasa. */
function renderText(str) {
  const frag = document.createDocumentFragment();
  const text = str.replace(/\{me\}/g, '@' + S.me.handle);
  const handles = handleIndex();
  for (const part of text.split(/([#@][A-Za-z0-9_]+)/)) {
    if (!part) continue;
    if (part[0] === '#' && part.length > 1) {
      const b = document.createElement('button');
      b.className = 'tag'; b.dataset.tag = part; b.textContent = part;
      frag.append(b);
    } else if (part[0] === '@' && handles[part.slice(1).toLowerCase()]) {
      const b = document.createElement('button');
      b.className = 'mention'; b.dataset.user = handles[part.slice(1).toLowerCase()]; b.textContent = part;
      frag.append(b);
    } else frag.append(part);
  }
  return frag;
}
const plain = str => str.replace(/\{me\}/g, '@' + S.me.handle);

/* ================= Render: komponen ================= */

const avatar = (id, size = '') => {
  const c = ch(id);
  return `<span class="av ${size}" style="--c:${c.color}" aria-hidden="true">${esc(c.emoji)}</span>`;
};

function badge(id) {
  const c = ch(id);
  const kind = id === 'me' ? 'me' : c.secret ? 'secret' : '';
  return `<span class="badge ${kind}">${esc(c.badge || 'Fiktif')}</span>`;
}

const LABELS = { drama: '🔥 Lagi ramai', klarifikasi: '📝 Klarifikasi', rahasia: '🕳️ Akun misterius' };

const expanded = new Set();
const openForms = new Set();

function postNode(p, { full = false } = {}) {
  const c = ch(p.author);
  const el = document.createElement('article');
  el.className = 'post' + (p.chaos ? ' chaotic' : '') + (p.author === 'me' ? ' mine' : '') + (p.label ? ' labeled ' + p.label : '');
  el.dataset.post = p.id;
  if (full) el.dataset.full = '1';
  el.innerHTML = `
    ${p.label ? `<div class="post-label">${LABELS[p.label] || ''}</div>` : ''}
    <button class="av-btn" data-user="${p.author}" aria-label="Profil ${esc(c.name)}">${avatar(p.author)}</button>
    <div class="post-body">
      <header class="post-head">
        <button class="name" data-user="${p.author}">${esc(p.glitch || c.name)}</button>
        ${badge(p.author)}
        <span class="handle">@${esc(c.handle)}</span>
        <span class="dot">·</span>
        <time class="time" data-t="${p.t}">${ago(p.t)}</time>
      </header>
      <p class="post-text"></p>
      <div class="post-actions">
        <button class="act act-reply" data-act="reply" aria-label="Balas">${ICON.reply}<span class="n-replies"></span></button>
        <button class="act act-like" data-act="like" aria-label="Suka">${ICON.heart}<span class="n-likes"></span></button>
        <button class="act act-share" data-act="share" aria-label="Salin teks">${ICON.share}</button>
      </div>
      <div class="replies"></div>
      <form class="reply-form" hidden>
        ${avatar('me', 'sm')}
        <input type="text" maxlength="200" placeholder="Balas @${esc(c.handle)}" aria-label="Tulis balasan" autocomplete="off">
        <button class="btn btn-primary btn-sm" type="submit">Balas</button>
      </form>
    </div>`;
  $('.post-text', el).append(renderText(p.text));
  if (full || openForms.has(p.id)) $('.reply-form', el).hidden = false;
  fillCounts(el, p);
  fillReplies(el, p);
  return el;
}

function fillCounts(el, p) {
  $('.n-likes', el).textContent = p.likes ? fmt(p.likes) : '';
  $('.n-replies', el).textContent = p.replies.length ? p.replies.length : '';
  const like = $('.act-like', el);
  like.classList.toggle('on', p.liked);
  like.setAttribute('aria-pressed', p.liked);
}

function fillReplies(el, p) {
  const box = $('.replies', el);
  const full = el.dataset.full === '1' || expanded.has(p.id);
  const list = full ? p.replies : p.replies.slice(-2);
  box.innerHTML = '';
  if (!full && p.replies.length > 2) {
    const more = document.createElement('button');
    more.className = 'more-replies';
    more.dataset.act = 'expand';
    more.textContent = `Lihat ${p.replies.length - 2} balasan sebelumnya`;
    box.append(more);
  }
  for (const r of list) {
    const c = ch(r.author);
    const row = document.createElement('div');
    row.className = 'reply' + (r.author === 'me' ? ' mine' : '');
    row.dataset.reply = r.id;
    row.innerHTML = `
      <button class="av-btn" data-user="${r.author}" aria-label="Profil ${esc(c.name)}">${avatar(r.author, 'sm')}</button>
      <div class="reply-body">
        <header class="post-head">
          <button class="name" data-user="${r.author}">${esc(c.name)}</button>
          ${badge(r.author)}
          <span class="dot">·</span>
          <time class="time" data-t="${r.t}">${ago(r.t)}</time>
        </header>
        <p class="post-text"></p>
        <button class="act act-like small${r.liked ? ' on' : ''}" data-act="like-reply" aria-pressed="${r.liked}" aria-label="Suka balasan">${ICON.heart}<span>${r.likes ? fmt(r.likes) : ''}</span></button>
      </div>`;
    $('.post-text', row).append(renderText(r.text));
    box.append(row);
  }
}

/* Perbarui semua salinan postingan di layar tanpa merusak input yang sedang diketik. */
function refreshPost(p) {
  $$(`[data-post="${p.id}"]`).forEach(el => { fillCounts(el, p); fillReplies(el, p); });
}
function refreshCounts(p) {
  $$(`[data-post="${p.id}"]`).forEach(el => fillCounts(el, p));
}

/* ================= Render: tampilan ================= */

let view = 'home';
let homeTab = 'all';
let navStack = [];
let pending = [];

const TOP_VIEWS = ['home', 'explore', 'notif', 'settings', 'profile:me'];

function go(next) {
  if (next === view) { if (next === 'home') { flushPending(); window.scrollTo(0, 0); } return; }
  if (TOP_VIEWS.includes(next)) navStack = [];
  else navStack.push(view);
  view = next;
  renderView();
  window.scrollTo(0, 0);
}

function back() {
  view = navStack.pop() || 'home';
  renderView();
  window.scrollTo(0, 0);
}

function renderView() {
  const root = $('#view');
  root.innerHTML = '';
  pending = [];
  updatePill();
  const isTop = TOP_VIEWS.includes(view);
  $('.back-btn').hidden = isTop;
  $('#homeTabs').hidden = view !== 'home';
  $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('#homeTabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === homeTab));

  const [kind, arg] = view.split(/:(.*)/s);
  const title = { home: 'Beranda', explore: 'Jelajah', notif: 'Notifikasi', settings: 'Pengaturan' };
  $('#viewTitle').textContent = title[kind] || '';

  if (kind === 'home') renderHome(root);
  else if (kind === 'explore') renderExplore(root);
  else if (kind === 'notif') renderNotif(root);
  else if (kind === 'settings') renderSettings(root);
  else if (kind === 'profile') renderProfile(root, arg);
  else if (kind === 'topic') renderTopic(root, arg);
  else if (kind === 'post') renderPostView(root, arg);
}

function homePosts() {
  return homeTab === 'following'
    ? S.feed.filter(p => p.author === 'me' || S.follows.includes(p.author))
    : S.feed;
}

function renderHome(root) {
  root.innerHTML = `
    <form class="compose" id="compose">
      ${avatar('me')}
      <div class="compose-body">
        <textarea id="composeText" maxlength="280" rows="2" placeholder="Apa yang sedang kamu halusinasikan?" aria-label="Tulis status"></textarea>
        <div class="compose-foot">
          <small class="compose-hint">Pakai #topik atau @akun. Ctrl+Enter untuk kirim.</small>
          <span class="counter" id="counter">280</span>
          <button class="btn btn-primary" type="submit" id="composeBtn" disabled>Posting</button>
        </div>
      </div>
    </form>
    ${S.welcomeDismissed ? '' : `
    <section class="welcome">
      <h2>Selamat datang di halu.</h2>
      <p>Semua akun di sini fiktif dan postingannya ditulis oleh skrip. Timeline berjalan sendiri. Coba like, balas, tulis status, ikuti akun, atau nyalakan mode chaos.</p>
      <button class="btn btn-ghost btn-sm" data-act="dismiss-welcome">Mengerti</button>
    </section>`}
    <div class="feed" id="feedList"></div>`;
  const list = $('#feedList');
  const posts = homePosts();
  if (!posts.length) {
    list.innerHTML = `<div class="empty"><b>Belum ada apa-apa di sini.</b><p>Kamu belum mengikuti siapa pun. Cari akun di <button class="link-btn" data-view="explore">Jelajah</button>.</p></div>`;
  }
  posts.forEach(p => list.append(postNode(p)));
}

function renderList(root, posts, emptyMsg) {
  const list = document.createElement('div');
  list.className = 'feed';
  if (!posts.length) list.innerHTML = `<div class="empty"><p>${emptyMsg}</p></div>`;
  posts.forEach(p => list.append(postNode(p)));
  root.append(list);
}

function trendRow(t, i) {
  return `<li><button class="trend" data-tag="${esc(t.tag)}">
    <small>${i + 1} · ${t.absurd ? 'Trending tanpa alasan' : 'Trending di halu.'}</small>
    <b>${esc(t.tag)}</b>
    <small>${fmt(t.count)} postingan</small>
  </button></li>`;
}

function renderExplore(root) {
  const list = trends().slice(0, 10);
  const chars = roster().map(id => charCard(id)).join('');
  const locked = SECRETS.filter(id => !S.secrets.includes(id)).map(id => `
    <div class="char-card locked">
      <span class="av" style="--c:#1f1b29">?</span>
      <div><b>Akun tersembunyi</b><small>${esc(CHARACTERS[id].hint)}</small></div>
    </div>`).join('');
  root.innerHTML = `
    <section class="block">
      <h2>Sedang ramai</h2>
      <ol class="trend-list">${list.map(trendRow).join('') || '<li class="muted">Belum ada topik.</li>'}</ol>
    </section>
    <section class="block">
      <h2>Semua akun</h2>
      <div class="char-grid">${chars}${locked}</div>
    </section>`;
  $$('[data-follow]', root).forEach(updateFollowBtn);
}

function charCard(id) {
  const c = ch(id);
  return `<div class="char-card">
    <button class="av-btn" data-user="${id}" aria-label="Profil ${esc(c.name)}">${avatar(id)}</button>
    <div>
      <button class="name" data-user="${id}">${esc(c.name)}</button> ${badge(id)}
      <small>@${esc(c.handle)} · ${esc(c.trait)}</small>
    </div>
    <button class="btn btn-sm follow" data-follow="${id}"></button>
  </div>`;
}

function updateFollowBtn(b) {
  const on = S.follows.includes(b.dataset.follow);
  b.textContent = on ? 'Mengikuti' : 'Ikuti';
  b.classList.toggle('btn-primary', !on);
  b.classList.toggle('btn-ghost', on);
  b.setAttribute('aria-pressed', on);
}

function renderTopic(root, tag) {
  $('#viewTitle').textContent = tag;
  const posts = S.feed.filter(p => tagsIn(p.text).some(t => t.toLowerCase() === tag.toLowerCase()));
  const absurd = ABSURD_TRENDS.includes(tag);
  renderList(root, posts, absurd ? 'Belum ada yang memposting ini, tapi topiknya tetap trending. Aneh.' : 'Belum ada postingan dengan topik ini.');
}

function renderPostView(root, id) {
  $('#viewTitle').textContent = 'Postingan';
  const p = findPost(id);
  if (!p) { root.innerHTML = '<div class="empty"><p>Postingan ini sudah hanyut dari timeline.</p></div>'; return; }
  const list = document.createElement('div');
  list.className = 'feed';
  list.append(postNode(p, { full: true }));
  root.append(list);
}

function renderProfile(root, id) {
  if (!known(id) || (CHARACTERS[id] && CHARACTERS[id].secret && !S.secrets.includes(id))) {
    root.innerHTML = '<div class="empty"><p>Akun ini tidak ditemukan.</p></div>';
    return;
  }
  const c = ch(id);
  $('#viewTitle').textContent = c.name;
  const isMe = id === 'me';
  const posts = S.feed.filter(p => p.author === id);
  const stats = isMe
    ? `<span><b>${S.stats.posts}</b> postingan</span><span><b>${S.followers.length}</b> pengikut</span><span><b>${S.follows.length}</b> mengikuti</span><span><b>${S.stats.likes}</b> like diberikan</span>`
    : `<span><b>${fmt(c.followers + (S.follows.includes(id) ? 1 : 0))}</b> pengikut</span><span><b>${fmt(c.following)}</b> mengikuti</span>${S.followers.includes(id) ? '<span class="follows-you">Mengikutimu</span>' : ''}`;
  root.innerHTML = `
    <section class="profile">
      <div class="banner" style="--c:${c.color}"></div>
      <div class="profile-top">
        ${avatar(id, 'xl')}
        ${isMe ? '<button class="btn btn-ghost btn-sm" data-view="settings">Edit profil</button>' : `<button class="btn btn-sm follow" data-follow="${id}"></button>`}
      </div>
      <h2>${esc(c.name)} ${badge(id)}</h2>
      <p class="handle">@${esc(c.handle)}</p>
      <p class="bio">${esc(c.bio)}</p>
      <p class="chips"><span class="chip">Sifat: ${esc(c.trait)}</span>${c.joined ? `<span class="chip">Bergabung ${esc(c.joined)}</span>` : ''}</p>
      <p class="stats">${stats}</p>
    </section>
    <h3 class="section-title">Postingan</h3>`;
  $$('[data-follow]', root).forEach(updateFollowBtn);
  renderList(root, posts, isMe ? 'Kamu belum menulis apa pun. Timeline menunggu.' : 'Akun ini belum memposting di timeline saat ini.');
}

const NOTIF_ICON = { like: '❤️', reply: '💬', mention: '📣', follow: '👤', secret: '🕳️' };

function renderNotif(root) {
  if (!S.notifs.length) {
    root.innerHTML = '<div class="empty"><b>Belum ada notifikasi.</b><p>Tulis status atau balas postingan, nanti mereka datang sendiri.</p></div>';
    return;
  }
  const list = document.createElement('div');
  list.className = 'notif-list';
  for (const n of S.notifs) {
    const first = ch(n.actors[0]);
    const others = n.actors.length - 1;
    const who = `<b>${esc(first.name)}</b>${others ? ` dan ${others} lainnya` : ''}`;
    const msg = {
      like: `${who} menyukai postinganmu`,
      reply: `${who} membalas postinganmu`,
      mention: `${who} menyebutmu`,
      follow: `${who} mulai mengikutimu`,
      secret: `Akun misterius muncul: ${who}`,
    }[n.type];
    const row = document.createElement('button');
    row.className = 'notif' + (n.read ? '' : ' unread') + (n.type === 'secret' ? ' secret' : '');
    if (n.postId && findPost(n.postId)) row.dataset.view = 'post:' + n.postId;
    else row.dataset.user = n.actors[0];
    row.innerHTML = `
      <span class="notif-icon" aria-hidden="true">${NOTIF_ICON[n.type]}</span>
      <span class="notif-avs">${n.actors.slice(0, 4).map(a => avatar(a, 'sm')).join('')}</span>
      <span class="notif-text">${msg}<small class="time" data-t="${n.t}">${ago(n.t)}</small></span>
      ${n.text ? `<span class="notif-snippet"></span>` : ''}`;
    if (n.text) $('.notif-snippet', row).textContent = plain(n.text);
    list.append(row);
  }
  root.append(list);
  // Ditandai terbaca setelah dilihat.
  S.notifs.forEach(n => { n.read = true; });
  updateBadges();
  save();
}

function renderSettings(root) {
  root.innerHTML = `
    <form class="block settings" id="profileForm">
      <h2>Profil</h2>
      <label>Nama tampilan<input name="name" maxlength="24" required value="${esc(S.me.name)}"></label>
      <label>Handle<span class="handle-input"><span>@</span><input name="handle" maxlength="15" required autocapitalize="none" spellcheck="false" value="${esc(S.me.handle)}"></span>
        <small>3–15 karakter: huruf kecil, angka, atau garis bawah.</small></label>
      <fieldset class="avatar-pick"><legend>Avatar</legend>
        ${AVATAR_CHOICES.map(a => `<label><input type="radio" name="avatar" value="${a}"${a === S.me.avatar ? ' checked' : ''}><span>${a}</span></label>`).join('')}
      </fieldset>
      <p class="form-error" id="profileError" hidden></p>
      <button class="btn btn-primary" type="submit">Simpan profil</button>
    </form>
    <section class="block settings">
      <h2>Timeline</h2>
      <div class="setting-row"><span>Kecepatan feed</span>
        <div class="seg" role="radiogroup" aria-label="Kecepatan feed">
          ${Object.keys(SPEED).map(k => `<button type="button" role="radio" data-speed="${k}" aria-checked="${S.settings.speed === k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}
        </div></div>
      <div class="setting-row"><span>Jeda timeline</span><button class="switch" data-act="pause-switch" role="switch" aria-checked="${S.settings.paused}" aria-label="Jeda timeline"><span></span></button></div>
      <div class="setting-row"><span>Mode chaos</span><button class="switch" data-act="chaos" role="switch" aria-checked="${S.chaos.on}" aria-label="Mode chaos"><span></span></button></div>
      <div class="setting-row"><span>Kurangi gerakan</span><button class="switch" data-act="reduce" role="switch" aria-checked="${S.settings.reduce}" aria-label="Kurangi gerakan"><span></span></button></div>
    </section>
    <section class="block settings">
      <h2>Akun rahasia</h2>
      <p class="muted">${S.secrets.length} dari ${SECRETS.length} sudah muncul.</p>
      <ul class="hints">${SECRETS.map(id => `<li>${S.secrets.includes(id) ? `✅ ${esc(CHARACTERS[id].name)}` : `❔ ${esc(CHARACTERS[id].hint)}`}</li>`).join('')}</ul>
    </section>
    <section class="block settings">
      <h2>Data</h2>
      <p class="muted">Timeline, postinganmu, dan pengaturan disimpan di browser ini saja.</p>
      <button class="btn btn-danger" data-act="reset">Hapus semua data</button>
    </section>`;
}

/* ================= Sidebar ================= */

function renderSide() {
  renderTrendSide();
  renderSuggest();
  renderSecretSide();
}

function renderTrendSide() {
  const el = $('#trendSide');
  const list = trends().slice(0, 5);
  el.innerHTML = list.map(trendRow).join('') || '<li class="muted">Belum ada topik.</li>';
}

let suggestIds = [];
function renderSuggest() {
  const el = $('#suggestSide');
  const keep = suggestIds.filter(id => roster().includes(id));
  if (keep.length < 3) suggestIds = shuffle(roster().filter(id => !S.follows.includes(id))).slice(0, 3);
  if (suggestIds.length < 3) suggestIds = shuffle(roster()).slice(0, 3);
  el.innerHTML = suggestIds.map(charCard).join('');
  $$('[data-follow]', el).forEach(updateFollowBtn);
}

function renderSecretSide() {
  const el = $('#secretSide');
  const left = SECRETS.filter(id => !S.secrets.includes(id)).length;
  el.innerHTML = left
    ? `<h2>🕳️ ${left} akun belum muncul</h2><p class="muted">Ada akun yang menunggu waktu yang tepat. Petunjuknya di Jelajah.</p>`
    : `<h2>🕳️ Semua akun sudah muncul</h2><p class="muted">Kamu sudah melihat semua yang tersembunyi. Katanya.</p>`;
}

/* ================= Postingan baru dan pil ================= */

/* Postingan baru ditahan di pil, bukan langsung disisipkan,
   supaya feed tidak bergeser saat pemain sedang mengetuk sesuatu. */
function announcePost(p) {
  if (view !== 'home') return;
  if (homeTab === 'following' && !S.follows.includes(p.author)) return;
  pending.push(p.id);
  updatePill();
}

function insertAtTop(p) {
  const list = $('#feedList');
  if (!list) return;
  const empty = $('.empty', list);
  if (empty) empty.remove();
  const node = postNode(p);
  node.classList.add('enter');
  list.prepend(node);
}

function insertOwnPost(p) {
  if (view !== 'home') { go('home'); return; }
  flushPending();
  insertAtTop(p);
}

function flushPending() {
  // Yang paling lama disisipkan dulu, jadi yang terbaru berakhir di paling atas.
  const ids = pending.slice();
  pending = [];
  ids.forEach(id => { const p = findPost(id); if (p) insertAtTop(p); });
  updatePill();
}

function updatePill() {
  const pill = $('#newPill');
  pill.hidden = !pending.length;
  pill.textContent = `↑ ${pending.length} postingan baru`;
}

/* ================= Lain-lain ================= */

let toastTimer = 0;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function copyText(text) {
  const done = () => toast('Teks postingan disalin');
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Gagal menyalin'); }
    ta.remove();
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
  else fallback();
}

function applySettings() {
  const reduce = S.settings.reduce || matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('reduce', reduce);
  const paused = S.settings.paused;
  $$('[data-act="pause"]').forEach(b => {
    b.innerHTML = (paused ? ICON.play : ICON.pause) + (b.classList.contains('btn') ? `<span>${paused ? 'Lanjutkan timeline' : 'Jeda timeline'}</span>` : '');
    b.setAttribute('aria-label', paused ? 'Lanjutkan timeline' : 'Jeda timeline');
    b.classList.toggle('on', paused);
  });
  document.body.classList.toggle('paused', paused);
}

function setPaused(on) {
  S.settings.paused = on;
  applySettings();
  toast(on ? 'Timeline dijeda' : 'Timeline berjalan lagi');
  if (view === 'settings') { const sw = $('[data-act="pause-switch"]'); if (sw) sw.setAttribute('aria-checked', on); }
  save();
}

function refreshTimes() {
  $$('.time[data-t]').forEach(el => { el.textContent = ago(+el.dataset.t); });
}

/* ================= Isi awal ================= */

function seed() {
  const now = Date.now();
  const posts = [];
  const authors = shuffle(REGULAR).concat(shuffle(REGULAR)).slice(0, 13);
  let t = now - randInt(3, 8) * 60000;
  for (const a of authors) {
    const p = makePost(a, draw(a, 'posts'), { likes: randInt(3, 900) });
    p.t = t;
    const n = randInt(0, 3);
    for (let k = 0; k < n; k++) {
      const who = pickAuthor([a]);
      const r = makeReply(who, fill(draw(who, 'replies'), a));
      r.t = Math.min(now - 30000, p.t + randInt(1, 6) * 60000 * (k + 1));
      r.likes = randInt(0, 40);
      p.replies.push(r);
    }
    posts.push(p);
    t -= randInt(6, 18) * 60000;
  }
  // Satu drama yang sudah selesai, supaya timeline langsung terasa ramai.
  const d = drawDrama();
  const dp = makePost(d.by, d.text, { label: 'drama', likes: randInt(200, 900) });
  dp.t = now - randInt(70, 100) * 60000;
  d.thread.forEach(([who, line], i) => {
    const r = makeReply(who, line);
    r.t = dp.t + (i + 1) * randInt(2, 5) * 60000;
    r.likes = randInt(2, 90);
    dp.replies.push(r);
  });
  const after = makePost(d.after[0], d.after[1], { label: 'klarifikasi', likes: randInt(80, 400) });
  after.t = now - randInt(20, 40) * 60000;
  posts.push(dp, after);
  S.feed = posts.sort((a, b) => b.t - a.t);
}

/* ================= Event ================= */

document.addEventListener('click', e => {
  const t = e.target;

  const viewBtn = t.closest('[data-view]');
  const userBtn = t.closest('[data-user]');
  const tagBtn = t.closest('[data-tag]');
  const followBtn = t.closest('[data-follow]');
  const speedBtn = t.closest('[data-speed]');
  const tabBtn = t.closest('[data-tab]');
  const actBtn = t.closest('[data-act]');

  if (followBtn) { toggleFollow(followBtn.dataset.follow); return; }
  if (tagBtn) { go('topic:' + tagBtn.dataset.tag); return; }
  if (userBtn && !actBtn) { go('profile:' + userBtn.dataset.user); return; }
  if (viewBtn && !actBtn) { go(viewBtn.dataset.view); return; }
  if (speedBtn) {
    S.settings.speed = speedBtn.dataset.speed;
    $$('[data-speed]').forEach(b => b.setAttribute('aria-checked', b === speedBtn));
    toast(`Kecepatan feed: ${speedBtn.textContent}`);
    save();
    return;
  }
  if (tabBtn) { homeTab = tabBtn.dataset.tab; renderView(); return; }

  if (actBtn) {
    const act = actBtn.dataset.act;
    const postEl = actBtn.closest('[data-post]');
    const postId = postEl && postEl.dataset.post;
    switch (act) {
      case 'like': toggleLike(postId); pop(actBtn); break;
      case 'like-reply': toggleLike(postId, actBtn.closest('[data-reply]').dataset.reply); pop(actBtn); break;
      case 'reply': {
        const form = $('.reply-form', postEl);
        form.hidden = !form.hidden;
        if (form.hidden) openForms.delete(postId); else { openForms.add(postId); $('input', form).focus(); }
        break;
      }
      case 'expand': expanded.add(postId); refreshPost(findPost(postId)); break;
      case 'share': {
        const p = findPost(postId);
        if (p) copyText(`"${plain(p.text)}" (${ch(p.author).name}, @${ch(p.author).handle} di halu.)`);
        break;
      }
      case 'compose':
        if (view !== 'home') go('home');
        window.scrollTo(0, 0);
        setTimeout(() => { const ta = $('#composeText'); if (ta) ta.focus(); }, 30);
        break;
      case 'chaos': setChaos(!S.chaos.on); break;
      case 'pause': setPaused(!S.settings.paused); break;
      case 'pause-switch': setPaused(!S.settings.paused); break;
      case 'reduce':
        S.settings.reduce = !S.settings.reduce;
        actBtn.setAttribute('aria-checked', S.settings.reduce);
        applySettings();
        save();
        break;
      case 'dismiss-welcome':
        S.welcomeDismissed = true;
        actBtn.closest('.welcome').remove();
        save();
        break;
      case 'back': back(); break;
      case 'reset': $('#confirmDlg').showModal(); break;
      case 'reset-cancel': $('#confirmDlg').close(); break;
      case 'reset-confirm': $('#confirmDlg').close(); resetAll(); break;
    }
  }
});

function pop(el) {
  if (document.documentElement.classList.contains('reduce')) return;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

document.addEventListener('submit', e => {
  const form = e.target;
  if (form.id === 'compose') {
    e.preventDefault();
    const ta = $('#composeText');
    const text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    onComposeInput();
    createPost(text);
    return;
  }
  if (form.classList.contains('reply-form')) {
    e.preventDefault();
    const input = $('input', form);
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendComment(form.closest('[data-post]').dataset.post, text);
    input.focus();
    return;
  }
  if (form.id === 'profileForm') {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const handle = String(data.get('handle')).trim().toLowerCase();
    const err = $('#profileError');
    const taken = Object.values(CHARACTERS).some(c => c.handle === handle);
    if (!name) { err.textContent = 'Nama tidak boleh kosong.'; err.hidden = false; return; }
    if (!/^[a-z0-9_]{3,15}$/.test(handle)) { err.textContent = 'Handle hanya boleh huruf kecil, angka, dan garis bawah (3–15 karakter).'; err.hidden = false; return; }
    if (taken) { err.textContent = 'Handle itu sudah dipakai karakter lain. Mereka fiktif, tapi tetap protektif.'; err.hidden = false; return; }
    err.hidden = true;
    S.me = { name, handle, avatar: data.get('avatar') || S.me.avatar };
    save();
    toast('Profil disimpan');
  }
});

function onComposeInput() {
  const ta = $('#composeText');
  if (!ta) return;
  const left = 280 - ta.value.length;
  $('#counter').textContent = left;
  $('#counter').classList.toggle('low', left < 30);
  $('#composeBtn').disabled = !ta.value.trim();
}

document.addEventListener('input', e => { if (e.target.id === 'composeText') onComposeInput(); });
document.addEventListener('keydown', e => {
  if (e.target.id === 'composeText' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    $('#compose').requestSubmit();
  }
});

$('#newPill').addEventListener('click', () => { flushPending(); window.scrollTo({ top: 0, behavior: document.documentElement.classList.contains('reduce') ? 'auto' : 'smooth' }); });


function resetAll() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* abaikan */ }
  S = defaultState();
  queue = []; clock = 0; nextPostAt = 4000; dramaActive = false;
  for (const k in bags) delete bags[k];
  expanded.clear(); openForms.clear();
  seed();
  applyChaos(); applySettings(); updateBadges();
  view = 'home'; navStack = []; homeTab = 'all';
  renderView(); renderSide();
  saveNow();
  toast('Semua data dihapus. Timeline baru dimulai.');
}

window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applySettings);

/* ================= Mulai ================= */

S = load();
if (!S.feed.length) seed();
nextPostAt = 4000;
applyChaos();
applySettings();
updateBadges();
renderView();
renderSide();
save();
setInterval(tick, TICK);
setInterval(refreshTimes, 30000);
