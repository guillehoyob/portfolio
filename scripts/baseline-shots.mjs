/**
 * WHITE NOON — FASE 0 baseline capture (the reproducible "before")
 * Drives the built preview with Playwright and saves a labelled grid of the
 * CURRENT living layer, so every later "no veo X" has an honest antes/después.
 *
 * Axes (see MATRIX below):
 *   page    — home / method / work-index / project / personal / cv / 404
 *   hour    — simulated time-of-day (the Heliostat reads new Date(); we shift the
 *             browser clock by a constant offset so the HOUR is the target while
 *             real time still flows → the tint is right AND motion still animates,
 *             not a frozen frame)
 *   visit   — fresh | aged  (aged = returning visitor: visits=5 + visited cards,
 *             same seeding the harness uses → kintsugi deepest + card patina)
 *   motion  — motion | reduced  (reduced = prefers-reduced-motion: honest static)
 *   view    — hero / void / cards / top  (where we scroll before the shot)
 *   probe   — optional interaction (motes / ocean / spine) captured best-effort
 *
 * Filenames: <page>__h<hour>__<visit>__<motion>__<view>[__<probe>].png
 * Output:    screenshots/baseline/   + manifest.json
 * Run:       npx vite preview --port 4178 --strictPort   (in another shell)
 *            node scripts/baseline-shots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4178';
const OUT = 'screenshots/baseline';
mkdirSync(OUT, { recursive: true });

const PAGES = {
  home:         '/',
  method:       '/method.html',
  'work-index': '/work/index.html',
  'proj-rag':   '/work/rag-zelebrix.html',
  personal:     '/work/personal.html',
  cv:           '/cv.html',
  e404:         '/404.html',
};

// returning-visitor seeding — identical to tests/living.spec.js (visited cards + deepest kintsugi)
const AGED_SEED = () => {
  try {
    localStorage.setItem('wn.visits', '5');
    localStorage.setItem('wn.visited', JSON.stringify(['rag-zelebrix', 'gestamp-agents']));
    sessionStorage.setItem('wn.session', '1');
  } catch {}
};

// Shift the browser wall-clock so getHours()===target, but keep time FLOWING
// (constant offset ⇒ Date.now() deltas are unchanged ⇒ heartbeat/GSAP still run).
const SHIFT_HOUR = (hourFloat) => {
  const Real = Date;
  const now0 = Real.now();
  const tgt = new Real(now0);
  tgt.setHours(Math.floor(hourFloat), Math.round((hourFloat % 1) * 60), 0, 0);
  const OFFSET = tgt.getTime() - now0;
  function FakeDate(...args) {
    if (!(this instanceof FakeDate)) return new Real(Real.now() + OFFSET).toString();
    return args.length === 0 ? new Real(Real.now() + OFFSET) : new Real(...args);
  }
  FakeDate.prototype = Real.prototype;
  FakeDate.now = () => Real.now() + OFFSET;
  FakeDate.parse = Real.parse;
  FakeDate.UTC = Real.UTC;
  FakeDate.toString = Real.toString;
  // eslint-disable-next-line no-global-assign
  window.Date = FakeDate;
};

const VIEWPORTS = { desk: { width: 1440, height: 900 }, tab: { width: 768, height: 1024 }, mob: { width: 390, height: 844 } };

/* ---- build the shot list ---------------------------------------------------- */
const shots = [];
const add = (s) => shots.push({ vp: 'desk', visit: 'fresh', motion: 'motion', view: 'top', hour: 13, page: 'home', ...s });

// A — HOME hour-sweep: the Heliostat "before" across the whole day (incl. 17:00)
for (const hour of [5, 8, 13, 17, 19.5, 23]) {
  add({ page: 'home', hour, view: 'hero' });
  add({ page: 'home', hour, view: 'void' });
}

// B — every OTHER page at noon AND at 17:00 (the requested real visit hour)
for (const page of ['method', 'work-index', 'proj-rag', 'personal', 'cv', 'e404']) {
  for (const hour of [13, 17]) add({ page, hour, view: page === 'work-index' ? 'cards' : 'top' });
}

// C — aged returning-visitor state (visited cards + kintsugi)
add({ page: 'home', hour: 13, visit: 'aged', view: 'void' });
add({ page: 'work-index', hour: 13, visit: 'aged', view: 'cards' });
add({ page: 'proj-rag', hour: 13, visit: 'aged', view: 'top' });

// D — reduced-motion honest static state
add({ page: 'home', hour: 13, motion: 'reduced', view: 'hero' });
add({ page: 'home', hour: 13, motion: 'reduced', view: 'void' });
add({ page: 'work-index', hour: 13, motion: 'reduced', view: 'cards' });
add({ page: 'proj-rag', hour: 13, motion: 'reduced', view: 'top' });

// E — interaction probes on home (best-effort stills of dynamic effects)
add({ page: 'home', hour: 13, view: 'hero', probe: 'motes' });
add({ page: 'home', hour: 13, view: 'hero', probe: 'ocean' });
add({ page: 'home', hour: 13, view: 'void', probe: 'spine' });

// F — a couple of responsive records
add({ page: 'home', hour: 13, vp: 'mob', view: 'hero' });
add({ page: 'work-index', hour: 13, vp: 'tab', view: 'cards' });

/* ---- run -------------------------------------------------------------------- */
const browser = await chromium.launch();
const manifest = [];

const scrollToView = async (page, view) => {
  await page.evaluate((v) => {
    const go = (y) => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(y, { duration: 0.6 }); else window.scrollTo(0, y); };
    if (v === 'hero' || v === 'top') return go(0);
    if (v === 'void') { const el = document.querySelector('.wn-void'); if (el) el.scrollIntoView({ block: 'center' }); else go(2600); return; }
    if (v === 'cards') { const el = document.querySelector('.wn-card, .work__grid, .proof'); if (el) el.scrollIntoView({ block: 'start' }); else go(700); return; }
  }, view);
};

const runProbe = async (page, probe) => {
  if (probe === 'motes') {
    // motes live in the left gutter beside the spine — stir them with fast cursor moves
    for (let i = 0; i < 10; i++) { await page.mouse.move(50 + (i % 2) * 40, 200 + i * 45, { steps: 2 }); await page.waitForTimeout(28); }
    await page.waitForTimeout(180);
  } else if (probe === 'ocean') {
    await page.mouse.move(720, 460, { steps: 3 });
    await page.mouse.down(); await page.mouse.up();
    await page.waitForTimeout(130); // ring is short-lived
  } else if (probe === 'spine') {
    await page.mouse.move(120, 420, { steps: 8 });
    await page.waitForTimeout(650);
  }
};

let i = 0;
for (const s of shots) {
  i++;
  const name = `${s.page}__h${String(s.hour).replace('.', '_')}__${s.visit}__${s.motion}__${s.vp}__${s.view}${s.probe ? '__' + s.probe : ''}`;
  try {
    const ctx = await browser.newContext({
      viewport: VIEWPORTS[s.vp],
      deviceScaleFactor: 1,
      reducedMotion: s.motion === 'reduced' ? 'reduce' : 'no-preference',
    });
    await ctx.addInitScript(SHIFT_HOUR, s.hour);
    if (s.visit === 'aged') await ctx.addInitScript(AGED_SEED);
    const page = await ctx.newPage();
    await page.goto(BASE + PAGES[s.page], { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);          // let hero entrance + spine draw settle
    await scrollToView(page, s.view);
    await page.waitForTimeout(s.motion === 'reduced' ? 500 : 900);
    if (s.probe) await runProbe(page, s.probe);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    await ctx.close();
    manifest.push({ name, ...s });
    console.log(`[${i}/${shots.length}] ${name}`);
  } catch (e) {
    console.log(`[${i}/${shots.length}] FAIL ${name}: ${e.message}`);
    manifest.push({ name, ...s, error: e.message });
  }
}

writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ base: BASE, count: manifest.length, shots: manifest }, null, 2));
await browser.close();
console.log(`\ndone — ${manifest.filter((m) => !m.error).length}/${shots.length} shots in ${OUT}/`);
