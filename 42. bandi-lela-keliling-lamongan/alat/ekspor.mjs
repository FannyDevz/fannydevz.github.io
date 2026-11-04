// Ekspor animasi/index.html ke MP4 (1920x1080, 30 fps, H.264 + AAC) lewat Chromium headless (Chrome DevTools Protocol).
// Gaya kertas bergerak 12 langkah/dtk, jadi tiap langkah dipotret sekali lalu ffmpeg menggandakannya jadi 30 fps.
// Video dibagi ke beberapa Chromium sekaligus (PARTS) supaya lebih cepat, lalu disambung dan diberi suara:
// dialog.m4a + efek.m4a (volume 0,7 seperti di pemutar) + musik.m4a bila sudah ada.
// Pakai:  node animasi/alat/ekspor.mjs                 seluruh video
//         node animasi/alat/ekspor.mjs 60 66           uji potongan detik 60-66
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const SELF = fileURLToPath(import.meta.url), A = join(dirname(SELF), '..'), E = join(A, 'ekspor');
const CH = join(homedir(), 'Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium');
const NAMA = 'TryasSukmaningSakti_SMPN1Karangbinangun_BandiDanLelaKelilingLamongan';
const STEP_FPS = 12, PARTS = Number(process.env.PARTS || 2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const run = (cmd, args, opt = {}) => new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: 'inherit', ...opt }); p.on('close', c => c ? rej(new Error(cmd + ' gagal')) : res()); });

// buka halaman di Chromium headless dan kembalikan fungsi pemanggil JS + CDP
async function openPage(port) {
  const chrome = spawn(CH, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', '--mute-audio',
    '--force-device-scale-factor=1', '--window-size=1920,1080', '--user-data-dir=' + join(E, '.chrome' + port), 'about:blank'], { stdio: 'ignore' });
  let pages;
  for (let i = 0; i < 100 && !pages; i++) { await sleep(200); try { pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch {} }
  const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const wait = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  const cdp = (method, params = {}, ms = 60000) => new Promise((res, rej) => { const i = ++id; const to = setTimeout(() => { wait.delete(i); rej(new Error('waktu habis: ' + method)); }, ms);
    wait.set(i, m => { clearTimeout(to); m.error ? rej(new Error(m.error.message)) : res(m.result); }); ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: 'file://' + join(A, 'index.html') + '?render=1&gaya=kertas&t=0' });
  for (let i = 0; i < 150; i++) { await sleep(200); if (await js('document.readyState==="complete" && typeof window.__seek==="function"').catch(() => false)) break; }
  await js('window.__ready.then(()=>1)'); await sleep(500);
  return { cdp, js, close: () => { ws.close(); chrome.kill(); } };
}

// satu bagian: langkah f0..f1-1 (12/dtk) -> video tanpa suara 30 fps
async function part(f0, f1, port, out) {
  const { cdp, js, close } = await openPage(port);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(STEP_FPS), '-i', '-',
    '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-b:v', '10M', '-maxrate', '12M', '-bufsize', '20M',
    '-t', String((f1 - f0) / STEP_FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const start = Date.now();
  for (let f = f0; f < f1; f++) {
    let data;
    for (let coba = 1; !data; coba++) {
      try {
        await js(`window.__seek(${(f + .5) / STEP_FPS})`);   // tengah langkah, tidak jatuh di batas pembulatan
        ({ data } = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } }, 20000));
      } catch (e) { if (coba >= 3) throw e; console.log(`[bagian ${port}] gambar ${f} macet, diulang (${e.message})`); }
    }
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    const i = f - f0 + 1;
    if (i % 120 === 0) { const el = (Date.now() - start) / 1000; console.log(`[bagian ${port}] ${i}/${f1 - f0}  sisa ±${Math.round(el / i * (f1 - f0 - i) / 60)} menit`); }
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); close();
}

if (process.argv[2] === '--part') {
  const [f0, f1, port] = process.argv.slice(3, 6).map(Number);
  await part(f0, f1, port, process.argv[6]); process.exit(0);
}

mkdirSync(E, { recursive: true });
const probe = await openPage(9300); const DUR = await probe.js('window.__DUR'); probe.close();
const [a, b] = process.argv.slice(2).map(Number);
const T0 = a || 0, T1 = Math.min(b || DUR, DUR);
const F0 = Math.round(T0 * STEP_FPS), F1 = Math.round(T1 * STEP_FPS);
const out = join(E, (a || b ? 'uji_' : '') + NAMA + '.mp4');

// bagi rata, tiap batas kelipatan 2 langkah (1/6 dtk) supaya pas dengan 30 fps
const k = Math.max(1, Math.min(PARTS, Math.ceil((F1 - F0) / 120)));
const cut = [...Array(k + 1)].map((_, i) => i === k ? F1 : F0 + 2 * Math.round((F1 - F0) * i / k / 2));
const segs = cut.slice(0, -1).map((_, i) => join(E, `.bagian${i}.mp4`));
console.log(`merender ${F1 - F0} gambar dengan ${k} Chromium sekaligus...`);
await Promise.all(segs.map((s, i) => run('node', [SELF, '--part', cut[i], cut[i + 1], 9311 + i, s])));
writeFileSync(join(E, '.daftar.txt'), segs.map(s => `file '${s}'`).join('\n'));

const aud = ['suara/dialog.m4a', 'suara/efek.m4a', 'suara/musik.m4a'].filter(f => existsSync(join(A, f)));
const vol = ['1', '0.7', '1'];
const filt = aud.map((_, i) => `[${i + 1}:a]atrim=${T0}:${T1},asetpts=PTS-STARTPTS,volume=${vol[i]}[a${i}]`).join(';') +
  ';' + aud.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${aud.length}:normalize=0:duration=longest,alimiter=limit=0.95[a]`;
await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(E, '.daftar.txt'),
  ...aud.flatMap(f => ['-i', join(A, f)]), '-filter_complex', filt, '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(T1 - T0), '-movflags', '+faststart', out]);
for (const s of segs) rmSync(s, { force: true });
console.log('musik:', aud.includes('suara/musik.m4a') ? 'ikut' : 'belum ada (hanya dialog + efek)');
console.log('selesai:', out);
