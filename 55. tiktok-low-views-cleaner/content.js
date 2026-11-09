// TikTok Studio Low-Views Cleaner
// Menyuntikkan panel di halaman TikTok Studio (tiktok.com/tiktokstudio/...)
// untuk memindai daftar postingan dan menghapus video dengan views < batas.
(() => {
  if (window.__tlvcLoaded) return;
  window.__tlvcLoaded = true;

  // ---------- util ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ID_RE = /\/(?:video|content|post)\/(\d{10,})/;
  const DELETE_RE = /^\s*(delete|hapus)\b/i;
  const COUNT_RE =
    /^\s*(\d{1,3}(?:[.,\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|rb|ribu|m|jt|juta|b|mlyr|miliar)?\s*$/i;
  const MULT = { k: 1e3, rb: 1e3, ribu: 1e3, m: 1e6, jt: 1e6, juta: 1e6, b: 1e9, mlyr: 1e9, miliar: 1e9 };

  function parseCount(text) {
    const m = String(text).trim().match(COUNT_RE);
    if (!m) return null;
    const num = m[1];
    const suf = (m[2] || "").toLowerCase();
    if (!suf) return parseInt(num.replace(/[.,\s]/g, ""), 10);
    const n = parseFloat(num.replace(/\s/g, "").replace(",", "."));
    return Math.round(n * MULT[suf]);
  }
  window.__tlvcParseCount = parseCount; // untuk debugging di console

  const LS = {
    get(k, d) {
      try {
        const v = localStorage.getItem("tlvc_" + k);
        return v === null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("tlvc_" + k, JSON.stringify(v));
      } catch {}
    },
  };

  let host = null; // elemen host panel (shadow DOM)
  const inPanel = (el) => host && (el === host || host.contains(el));
  const isVisible = (el) => {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };

  function realClick(el) {
    const r = el.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new PointerEvent("pointerup", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.click();
  }

  function hover(el) {
    const r = el.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    const target = document.elementFromPoint(opts.clientX, opts.clientY) || el;
    for (const t of [el, target]) {
      t.dispatchEvent(new PointerEvent("pointerover", opts));
      t.dispatchEvent(new PointerEvent("pointerenter", opts));
      t.dispatchEvent(new MouseEvent("mouseover", opts));
      t.dispatchEvent(new MouseEvent("mouseenter", opts));
      t.dispatchEvent(new MouseEvent("mousemove", opts));
    }
  }

  function pressEscape() {
    const o = { key: "Escape", code: "Escape", keyCode: 27, bubbles: true };
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", o));
    document.dispatchEvent(new KeyboardEvent("keydown", o));
    document.body.dispatchEvent(new KeyboardEvent("keydown", o));
  }

  async function waitFor(fn, timeout = 4000, step = 150) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(step);
    }
    return null;
  }

  // ---------- deteksi baris video ----------
  function idsIn(el) {
    const s = new Set();
    for (const a of el.querySelectorAll("a[href]")) {
      const m = a.getAttribute("href").match(ID_RE);
      if (m) s.add(m[1]);
    }
    return s;
  }

  function extractId(el) {
    const ids = [...idsIn(el)];
    if (ids.length) return ids[0];
    const t = (el.innerText || "").trim().slice(0, 60);
    return "row:" + t;
  }

  function findRows() {
    const custom = (state.rowSelector || "").trim();
    if (custom) {
      let els = [];
      try {
        els = [...document.querySelectorAll(custom)];
      } catch {
        log("Row selector tidak valid.", "err");
      }
      return els.filter((e) => !inPanel(e)).map((el) => ({ el, id: extractId(el) }));
    }
    const map = new Map();
    for (const a of document.querySelectorAll("a[href]")) {
      if (inPanel(a)) continue;
      const m = a.getAttribute("href").match(ID_RE);
      if (!m) continue;
      const id = m[1];
      if (map.has(id)) continue;
      // naik ke atas sampai parent berisi lebih dari satu video -> itulah baris
      let el = a;
      while (el.parentElement && el.parentElement !== document.body && idsIn(el.parentElement).size <= 1) {
        el = el.parentElement;
      }
      map.set(id, { el, id });
    }
    return [...map.values()];
  }

  function countCandidates(row) {
    const out = [];
    const w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = n.nodeValue.trim();
      if (!t || t.length > 15) continue;
      const v = parseCount(t);
      if (v === null) continue;
      // abaikan angka di dalam link judul/caption
      if (n.parentElement && n.parentElement.closest("a[href]")) continue;
      out.push({ text: t, value: v });
    }
    return out;
  }

  function getViews(row) {
    const c = countCandidates(row);
    const idx = Math.max(0, (parseInt(state.statIndex, 10) || 1) - 1);
    return c[idx] || null;
  }

  function rowLabel(row) {
    // ambil teks terpanjang (biasanya caption), lewati durasi "00:49", angka, dan tanggal
    const txt = (row.innerText || "")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s && parseCount(s) === null && !/^\d{1,2}(:\d{2}){1,2}$/.test(s));
    txt.sort((a, b) => b.length - a.length);
    return (txt[0] || "(tanpa judul)").slice(0, 60);
  }

  // ---------- proses hapus ----------
  function findDirectDelete(row) {
    for (const b of row.querySelectorAll('button,[role="button"]')) {
      const label = (b.getAttribute("aria-label") || b.getAttribute("title") || b.innerText || "").trim();
      if (DELETE_RE.test(label) && label.length < 30 && isVisible(b)) return b;
    }
    return null;
  }

  const MORE_LABEL_RE = /more|lainnya|opsi|option|menu|selengkapnya|ellipsis|dots/i;
  const sigOf = (el) =>
    [el.tagName, el.getAttribute("aria-label") || "", el.getAttribute("data-e2e") || "", el.getAttribute("data-tt") || "",
      (typeof el.className === "string" ? el.className : "").split(/\s+/).filter((c) => !/\d{3,}/.test(c)).slice(0, 3).join(".")].join("|");
  let lastGoodSig = LS.get("moreSig", null);

  // Kandidat tombol "⋯" di baris, urut dari yang paling mungkin.
  // Elemen di dalam <a href> (thumbnail/judul) dilewati agar tidak pindah halaman.
  function moreButtonCandidates(row) {
    const pool = new Set();
    for (const el of row.querySelectorAll(
      'button,[role="button"],[aria-haspopup],[class*="more" i],[data-e2e*="more" i],[data-tt*="more" i]'
    )) pool.add(el);
    // ikon svg yang bisa diklik tanpa role (sering dipakai TikTok)
    for (const svg of row.querySelectorAll("svg")) {
      const p = svg.parentElement;
      if (p && p !== row && getComputedStyle(p).cursor === "pointer") pool.add(p);
    }
    const list = [...pool].filter((b) => isVisible(b) && !b.closest("a[href]") && !b.querySelector("a[href]"));
    // buang elemen yang membungkus kandidat lain (ambil yang paling spesifik)
    const specific = list.filter((b) => !list.some((o) => o !== b && b.contains(o)));
    const score = (b) => {
      const lbl = (b.getAttribute("aria-label") || "") + " " + (b.getAttribute("title") || "") + " " + (typeof b.className === "string" ? b.className : "") + " " + (b.getAttribute("data-e2e") || "");
      let s = 0;
      if (lastGoodSig && sigOf(b) === lastGoodSig) s += 100;
      if (MORE_LABEL_RE.test(lbl)) s += 50;
      if (b.hasAttribute("aria-haspopup")) s += 30;
      if (!(b.innerText || "").trim()) s += 10; // ikon saja
      s += b.getBoundingClientRect().left / 10000; // lebih kanan = lebih mungkin
      return s;
    };
    return specific.sort((a, b) => score(b) - score(a)).slice(0, 8);
  }

  async function backIfNavigated(startUrl) {
    if (location.href === startUrl) return false;
    history.back();
    await waitFor(() => location.href === startUrl, 5000);
    await waitFor(() => findRows().length > 0, 8000);
    await sleep(800);
    return true;
  }

  function findTextClickable(re, exclude = []) {
    const hits = [];
    for (const el of document.querySelectorAll('[role="menuitem"],[role="option"],li,button,[role="button"],div,span')) {
      if (inPanel(el) || exclude.some((x) => x && (x === el || x.contains(el) || el.contains(x)))) continue;
      const t = (el.innerText || "").trim();
      if (!t || t.length > 30 || !re.test(t)) continue;
      if (!isVisible(el)) continue;
      hits.push(el);
    }
    if (!hits.length) return null;
    // pilih elemen terkecil (paling spesifik), lalu naik ke elemen yang bisa diklik
    hits.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return ra.width * ra.height - rb.width * rb.height;
    });
    const el = hits[0];
    return el.closest('[role="menuitem"],[role="option"],button,[role="button"],li') || el;
  }

  function findConfirmButton(exclude) {
    const dialogs = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],[class*="modal" i],[class*="Dialog"]')]
      .filter((d) => !inPanel(d) && isVisible(d));
    for (const d of dialogs.reverse()) {
      const btn = [...d.querySelectorAll('button,[role="button"]')].find(
        (b) => isVisible(b) && DELETE_RE.test((b.innerText || b.getAttribute("aria-label") || "").trim())
      );
      if (btn) return btn;
    }
    // fallback: tombol "Hapus"/"Delete" lain yang terlihat
    const b = findTextClickable(/^\s*(delete|hapus)\s*$/i, exclude);
    return b && b.matches('button,[role="button"]') ? b : null;
  }

  function locateRow(id) {
    return findRows().find((r) => r.id === id) || null;
  }

  async function prepareRow(id) {
    let row = locateRow(id);
    if (!row) {
      // mungkin daftar di-render ulang / belum termuat: coba scroll sedikit lalu cari lagi
      await loadAll(2);
      row = locateRow(id);
    }
    if (!row) return null;
    row.el.scrollIntoView({ block: "center" });
    await sleep(500);
    hover(row.el);
    await sleep(500);
    return row.el;
  }

  async function deleteVideo(item) {
    const startUrl = location.href;
    let el = await prepareRow(item.id);
    if (!el) throw new Error("baris tidak ditemukan (mungkin sudah terhapus / belum dimuat)");

    let menuItem = findDirectDelete(el);
    if (!menuItem) {
      const cands = moreButtonCandidates(el);
      if (!cands.length) throw new Error("tombol menu (⋯) tidak ditemukan");
      const tried = new Set();
      for (let i = 0; i < cands.length && !menuItem; i++) {
        const sig = sigOf(cands[i]) + "#" + i;
        if (tried.has(sig)) continue;
        tried.add(sig);
        // baris bisa di-render ulang setelah percobaan sebelumnya
        if (!document.contains(cands[i])) {
          el = await prepareRow(item.id);
          if (!el) throw new Error("baris hilang saat mencari tombol menu");
          const fresh = moreButtonCandidates(el);
          if (!fresh[i]) break;
          cands[i] = fresh[i];
        }
        hover(cands[i]);
        realClick(cands[i]);
        menuItem = await waitFor(() => findTextClickable(DELETE_RE, [host]), 2000);
        if (menuItem) {
          lastGoodSig = sigOf(cands[i]);
          LS.set("moreSig", lastGoodSig);
          break;
        }
        pressEscape();
        if (await backIfNavigated(startUrl)) {
          el = await prepareRow(item.id);
          if (!el) throw new Error("baris tidak ditemukan setelah kembali ke daftar");
        }
        await sleep(400);
      }
      if (!menuItem) throw new Error(`opsi "Hapus/Delete" tidak ditemukan (dicoba ${tried.size} tombol). Klik "Salin info debug" dan kirimkan hasilnya.`);
    }
    realClick(menuItem);

    const confirmBtn = await waitFor(() => findConfirmButton([menuItem]), 5000);
    if (!confirmBtn) {
      pressEscape();
      throw new Error("dialog konfirmasi tidak muncul");
    }
    realClick(confirmBtn);

    const gone = await waitFor(() => !document.contains(el) || !idsIn(document).has(item.id), 10000);
    if (!gone) return "dikirim, belum terverifikasi hilang dari daftar";
    return "terhapus";
  }

  // ---------- muat semua postingan (scroll) ----------
  function scrollContainerOf(el) {
    let p = el && el.parentElement;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 10) return p;
      p = p.parentElement;
    }
    return null;
  }

  async function loadAll(maxRounds = Infinity) {
    let stable = 0;
    let last = -1;
    let rounds = 0;
    while (stable < 3 && !state.stop && rounds++ < maxRounds) {
      const rows = findRows();
      setStatus(`Memuat… ${rows.length} postingan terdeteksi`);
      if (rows.length === last) stable++;
      else stable = 0;
      last = rows.length;
      const lastRow = rows[rows.length - 1];
      if (lastRow) lastRow.el.scrollIntoView({ block: "end" });
      const sc = rows[0] ? scrollContainerOf(rows[0].el) : null;
      if (sc) sc.scrollTop = sc.scrollHeight;
      window.scrollTo(0, document.documentElement.scrollHeight);
      const moreBtn = findTextClickable(/^(load more|lihat lainnya|muat lebih banyak|tampilkan lebih banyak|see more|view more)$/i);
      if (moreBtn) realClick(moreBtn);
      await sleep(1500);
    }
    return last;
  }

  // ---------- info debug (struktur baris, tanpa isi svg) ----------
  function simplify(el, depth = 0) {
    if (depth > 14) return "";
    const keep = ["role", "aria-label", "aria-haspopup", "data-e2e", "data-tt", "href", "title"];
    const attrs = [];
    const cls = typeof el.className === "string" ? el.className.trim() : "";
    if (cls) attrs.push(`class="${cls.slice(0, 80)}"`);
    for (const a of keep) if (el.hasAttribute(a)) attrs.push(`${a}="${el.getAttribute(a).slice(0, 80)}"`);
    const tag = el.tagName.toLowerCase();
    if (tag === "svg") return `<svg/>`;
    if (tag === "img") return `<img/>`;
    let inner = "";
    for (const c of el.childNodes) {
      if (c.nodeType === 3) {
        const t = c.nodeValue.trim();
        if (t) inner += t.slice(0, 40);
      } else if (c.nodeType === 1) inner += simplify(c, depth + 1);
    }
    return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>${inner}</${tag}>`;
  }

  async function debugInfo() {
    const rows = findRows();
    const out = [`URL: ${location.pathname}`, `Rows: ${rows.length}`, `lastGoodSig: ${lastGoodSig}`];
    const r = rows[0];
    if (r) {
      r.el.scrollIntoView({ block: "center" });
      hover(r.el);
      await sleep(600);
      out.push("Kandidat tombol menu:", ...moreButtonCandidates(r.el).map((b, i) => `  ${i}: ${sigOf(b)}`));
      out.push("Angka terbaca:", "  " + countCandidates(r.el).map((c) => c.text).join(" | "));
      out.push("HTML baris pertama:", simplify(r.el).slice(0, 8000));
    }
    return out.join("\n");
  }

  // ---------- state & UI ----------
  const state = {
    threshold: LS.get("threshold", 1000),
    statIndex: LS.get("statIndex", 1),
    delay: LS.get("delay", 3000),
    rowSelector: LS.get("rowSelector", ""),
    items: [],
    running: false,
    stop: false,
  };

  let ui = {};

  function log(msg, cls = "") {
    if (!ui.log) return;
    const d = document.createElement("div");
    d.className = cls;
    d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    ui.log.prepend(d);
  }
  function setStatus(s) {
    if (ui.status) ui.status.textContent = s;
  }

  function scan() {
    const rows = findRows();
    const th = Number(state.threshold) || 0;
    state.items = rows.map((r) => {
      const v = getViews(r.el);
      return {
        id: r.id,
        label: rowLabel(r.el),
        views: v ? v.value : null,
        raw: v ? v.text : "?",
        checked: v ? v.value < th : false,
      };
    });
    renderList();
    const below = state.items.filter((i) => i.checked).length;
    setStatus(`${rows.length} postingan terdeteksi · ${below} di bawah ${th.toLocaleString("id-ID")} views`);
    if (!rows.length) log("Tidak ada baris video terdeteksi. Buka halaman Postingan/Content di TikTok Studio, atau isi Row selector.", "err");
  }

  function renderList() {
    ui.list.innerHTML = "";
    for (const it of state.items) {
      const row = document.createElement("label");
      row.className = "item" + (it.views === null ? " unk" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = it.checked;
      cb.onchange = () => {
        it.checked = cb.checked;
        updateCount();
      };
      const v = document.createElement("b");
      v.textContent = it.views === null ? "?" : it.views.toLocaleString("id-ID");
      v.title = "Teks asli: " + it.raw;
      const t = document.createElement("span");
      t.textContent = it.label;
      t.title = it.id;
      row.append(cb, v, t);
      ui.list.append(row);
    }
    updateCount();
  }

  function updateCount() {
    const n = state.items.filter((i) => i.checked).length;
    ui.del.textContent = `Hapus terpilih (${n})`;
  }

  async function runDelete() {
    const targets = state.items.filter((i) => i.checked);
    if (!targets.length) return log("Tidak ada video yang dipilih.");
    const ok = window.confirm(
      `Hapus PERMANEN ${targets.length} video dari akun TikTok kamu?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!ok) return;
    state.running = true;
    state.stop = false;
    setBusy(true);
    let done = 0, fail = 0;
    for (const it of targets) {
      if (state.stop) {
        log("Dihentikan oleh pengguna.", "err");
        break;
      }
      setStatus(`Menghapus ${done + fail + 1}/${targets.length}: ${it.label}`);
      try {
        const res = await deleteVideo(it);
        done++;
        it.checked = false;
        log(`✔ ${it.label} (${it.raw} views) — ${res}`, "ok");
      } catch (e) {
        fail++;
        log(`✖ ${it.label} — ${e.message}`, "err");
      }
      await sleep(Math.max(1000, Number(state.delay) || 3000));
    }
    setStatus(`Selesai: ${done} terhapus, ${fail} gagal.`);
    state.running = false;
    setBusy(false);
    scan();
  }

  function setBusy(b) {
    ui.scan.disabled = b;
    ui.load.disabled = b && !state.loading;
    ui.del.disabled = b;
    ui.stop.disabled = !b;
  }

  const CSS = `
    :host { all: initial; }
    .box { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; width: 360px; max-height: 80vh;
      display: flex; flex-direction: column; background: #fff; color: #161823; border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,.25); font: 13px/1.4 system-ui, -apple-system, sans-serif; overflow: hidden; }
    .hd { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #fe2c55; color: #fff; font-weight: 600; cursor: pointer; }
    .bd { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; overflow: auto; }
    .min .bd { display: none; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 8px; }
    label.f { display: flex; flex-direction: column; font-size: 11px; color: #555; gap: 2px; }
    input[type=number], input[type=text] { padding: 5px 6px; border: 1px solid #ccc; border-radius: 6px; font: inherit; color: #161823; background: #fff; }
    .btns { display: flex; flex-wrap: wrap; gap: 6px; }
    button { padding: 6px 10px; border: 0; border-radius: 6px; background: #eee; color: #161823; font: inherit; cursor: pointer; }
    button.danger { background: #fe2c55; color: #fff; }
    button:disabled { opacity: .5; cursor: default; }
    .status { font-size: 12px; color: #333; }
    .list { border: 1px solid #eee; border-radius: 6px; max-height: 220px; overflow: auto; }
    .item { display: grid; grid-template-columns: 18px 70px 1fr; gap: 6px; align-items: center; padding: 4px 6px; border-bottom: 1px solid #f2f2f2; cursor: pointer; }
    .item span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #444; }
    .item.unk b { color: #b26b00; }
    .log { font: 11px/1.4 ui-monospace, monospace; max-height: 120px; overflow: auto; background: #fafafa; border-radius: 6px; padding: 4px 6px; }
    .log .ok { color: #0a7d32; } .log .err { color: #c0142f; }
    details { font-size: 12px; } summary { cursor: pointer; color: #555; }
  `;

  function buildPanel() {
    host = document.createElement("div");
    host.id = "tlvc-host";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>${CSS}</style>
      <div class="box ${LS.get("min", false) ? "min" : ""}">
        <div class="hd"><span>🧹 Low-Views Cleaner</span><span class="tg">▾</span></div>
        <div class="bd">
          <div class="grid">
            <label class="f">Hapus jika views di bawah
              <input type="number" min="0" id="th"></label>
            <label class="f">Jeda antar hapus (ms)
              <input type="number" min="1000" step="500" id="dl"></label>
          </div>
          <details>
            <summary>Pengaturan lanjutan</summary>
            <div class="grid" style="margin-top:6px">
              <label class="f">Views = angka ke- (di baris)
                <input type="number" min="1" id="si"></label>
              <label class="f">Row selector (CSS, opsional)
                <input type="text" id="rs" placeholder="otomatis"></label>
            </div>
          </details>
          <div class="btns">
            <button id="load">Muat semua</button>
            <button id="scan">Scan</button>
            <button id="del" class="danger">Hapus terpilih (0)</button>
            <button id="stop" disabled>Stop</button>
            <button id="dbg">Salin info debug</button>
          </div>
          <div class="status" id="status">Klik "Muat semua" lalu "Scan".</div>
          <div class="list" id="list"></div>
          <div class="log" id="log"></div>
        </div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    ui = { box: $(".box"), list: $("#list"), log: $("#log"), status: $("#status"), scan: $("#scan"), load: $("#load"), del: $("#del"), stop: $("#stop") };

    const bind = (sel, key) => {
      const inp = $(sel);
      inp.value = state[key];
      inp.oninput = () => {
        state[key] = inp.type === "number" ? Number(inp.value) : inp.value;
        LS.set(key, state[key]);
      };
    };
    bind("#th", "threshold");
    bind("#dl", "delay");
    bind("#si", "statIndex");
    bind("#rs", "rowSelector");

    $(".hd").onclick = () => {
      ui.box.classList.toggle("min");
      LS.set("min", ui.box.classList.contains("min"));
    };
    ui.scan.onclick = () => scan();
    ui.load.onclick = async () => {
      state.stop = false;
      state.running = true;
      state.loading = true;
      setBusy(true);
      const n = await loadAll();
      state.loading = false;
      state.running = false;
      setBusy(false);
      log(`Selesai memuat: ${n} postingan.`);
      scan();
    };
    ui.del.onclick = () => runDelete();
    $("#dbg").onclick = async () => {
      const txt = await debugInfo();
      try {
        await navigator.clipboard.writeText(txt);
        log("Info debug disalin ke clipboard. Tempelkan ke chat.", "ok");
      } catch {
        console.log(txt);
        log("Gagal menyalin; info debug dicetak di Console (F12).", "err");
      }
    };
    ui.stop.onclick = () => {
      state.stop = true;
      setStatus("Menghentikan…");
    };
    document.documentElement.append(host);
  }

  // Tampilkan panel hanya di TikTok Studio (SPA -> cek berkala)
  function syncPanel() {
    const onStudio = /\/tiktokstudio/.test(location.pathname);
    if (onStudio && !host) buildPanel();
    if (host) host.style.display = onStudio ? "" : "none";
  }
  syncPanel();
  setInterval(syncPanel, 1000);
})();
