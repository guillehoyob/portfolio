/**
 * WHITE NOON — Field Conditions verification harness (dev-only, NOT shipped)
 * Drives each §5 living behavior PROGRAMMATICALLY against the built preview and
 * asserts the observable change in code (the owner can't screenshot most of
 * them). Prints: a behavior table (behavior | wired? | fires? | evidence |
 * verdict), a breakpoint matrix (1440/1024/768/390), and a reduced-motion
 * static-state table. Run:  node tests/living.spec.js   (needs the preview
 * server up:  npm run build && npx vite preview --port 4178 --strictPort)
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { makeDiffer, HIDE_LIVING, sleep as vhSleep } from './visual-helpers.mjs';
import { INTENSITY, RED_LOCKED } from '../src/field-conditions/config.js';

const BASE = process.env.BASE || 'http://localhost:4178';
const HOME = BASE + '/';
const WORKIDX = BASE + '/work/index.html';
const PROJ = BASE + '/work/rag-zelebrix.html';
const EPS = 1e-4;

const browser = await chromium.launch();
const rows = [];
const rec = (behavior, wired, fires, evidence, pass) =>
  rows.push({ behavior, wired: wired ? '✓' : '✗', fires: fires ? '✓' : '✗', evidence, verdict: pass ? 'PASS' : 'FAIL' });

const desktop = { width: 1440, height: 900 };
const newCtx = (opts = {}) => browser.newContext({ viewport: desktop, ...opts });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// sample a page-evaluated expression N times every `every` ms → array
async function sample(page, fn, n, every) {
  const out = [];
  for (let i = 0; i < n; i++) { out.push(await page.evaluate(fn)); await page.waitForTimeout(every); }
  return out;
}
const num = (v) => (typeof v === 'number' ? +v.toFixed(4) : v);

/* ───────────────── console-error sweep (all routes, desktop) ───────────────── */
const ROUTES = ['/', '/method.html', '/work/index.html', '/work/rag-zelebrix.html',
  '/work/architecture-idea.html', '/work/gestamp-agents.html', '/work/personal.html', '/cv.html', '/404.html'];
const consoleErrors = [];
{
  const c = await newCtx();
  for (const r of ROUTES) {
    const page = await c.newPage();
    // ignore network/resource failures of the OPTIONAL, gracefully-handled open-meteo
    // fetch (a timed-out third-party isn't an app error — Layer-0 synthetic weather holds)
    page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/open-meteo|Failed to load resource|ERR_/.test(t)) consoleErrors.push(`${r}: ${t}`); });
    page.on('pageerror', (e) => consoleErrors.push(`${r}: PAGEERROR ${e.message}`));
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    await page.close();
  }
  await c.close();
}

/* ───────────────── 1. Hero entrance (§3.2) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(180);
  const armedEarly = await page.evaluate(() => document.documentElement.classList.contains('fc-hero'));
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => ({
    fcHero: document.documentElement.classList.contains('fc-hero'),
    op: +getComputedStyle(document.querySelector('.hero__h1')).opacity,
    txt: document.querySelector('.hero__h1').textContent.replace(/\s+/g, ' ').trim().slice(0, 28),
    splitLeftover: document.querySelectorAll('.hero__h1 .split-line, .hero__h1 [style*="clip-path"]').length,
  }));
  const pass = armedEarly && !after.fcHero && after.op === 1 && after.txt.length > 3;
  rec('Hero entrance', true, armedEarly && after.op === 1,
    `armed@load=${armedEarly}; settled fc-hero=${after.fcHero}; h1 op=${after.op}; text="${after.txt}"`, pass);
  await c.close();
} catch (e) { rec('Hero entrance', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 2. First Breath chevron (§5.7) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2400); // idle past the 2s fire
  const breathed = await page.evaluate(() => {
    const ch = document.querySelector('.hero__chevron');
    return ch ? { exists: true, breathed: ch.classList.contains('fc-breathed'), op: +getComputedStyle(ch).opacity } : { exists: false };
  });
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(700);
  const afterScroll = await page.$$eval('.hero__chevron', (e) => e.length);
  const pass = breathed.exists && (breathed.breathed || breathed.op > 0.2) && afterScroll === 0;
  rec('First Breath', true, breathed.breathed || breathed.op > 0.2,
    `idle: breathed=${breathed.breathed} op=${num(breathed.op)}; after scroll chevrons=${afterScroll} (0=exited)`, pass);
  await c.close();
} catch (e) { rec('First Breath', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 3. New Route per-visit (§5.2) ───────────────── */
try {
  const ds = new Set();
  for (let i = 0; i < 8; i++) {
    const c = await newCtx();
    await c.addInitScript((v) => { try { localStorage.setItem('wn.visitor', v); } catch {} }, 'seed-' + i + '-' + (i * 911 + 7));
    const page = await c.newPage();
    await page.goto(HOME, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const d = await page.$eval('.route-path--desktop', (el) => el.getAttribute('d'));
    if (d) ds.add(d.slice(0, 40));
    await c.close();
  }
  const pass = ds.size >= 2;
  rec('New Route', true, ds.size >= 2, `${ds.size} distinct route paths across 8 visitor seeds`, pass);
} catch (e) { rec('New Route', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 4. Crosswind cursor haze (§5.3) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.mouse.move(200, 200, { steps: 4 });
  await page.waitForTimeout(120);
  for (let i = 0; i < 6; i++) { await page.mouse.move(200 + i * 30, 200 + i * 20, { steps: 2 }); await page.waitForTimeout(30); }
  await page.waitForTimeout(300);
  const t1 = await page.evaluate(() => { const e = document.querySelector('.fc-crosswind--sky'); return e ? getComputedStyle(e).transform : 'none'; });
  for (let i = 0; i < 8; i++) { await page.mouse.move(1000 - i * 10, 700 - i * 10, { steps: 2 }); await page.waitForTimeout(30); }
  await page.waitForTimeout(350);
  const t2 = await page.evaluate(() => { const e = document.querySelector('.fc-crosswind--sky'); return e ? getComputedStyle(e).transform : 'none'; });
  const exists = t1 !== 'none' || t2 !== 'none';
  const moved = exists && t1 !== t2;
  rec('Crosswind', exists, moved, `sky transform tracked cursor: ${moved} (t1≠t2=${t1 !== t2})`, moved);
  await c.close();
} catch (e) { rec('Crosswind', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 5. Slipstream haze (§5.4) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const baseline = await page.evaluate(() => +getComputedStyle(document.documentElement).getPropertyValue('--fc-haze-opacity') || 0.05);
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(2600, { duration: 0.7 }); else window.scrollTo(0, 2600); });
  const series = await sample(page, () => +getComputedStyle(document.documentElement).getPropertyValue('--fc-haze-opacity') || 0, 16, 50);
  const peak = Math.max(...series);
  await page.waitForTimeout(700);
  const settled = await page.evaluate(() => +getComputedStyle(document.documentElement).getPropertyValue('--fc-haze-opacity') || 0);
  const rose = peak > baseline + 0.002;
  const decayed = settled < peak - 0.002 || Math.abs(settled - baseline) < 0.01;
  rec('Slipstream', true, rose, `baseline=${num(baseline)} peak=${num(peak)} settled=${num(settled)} (rose=${rose}, decayed=${decayed})`, rose && decayed);
  await c.close();
} catch (e) { rec('Slipstream', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 6. Heartbeat dot pulse + label (§5.6) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const meta = await page.evaluate(() => {
    const dot = document.querySelector('.hero .wn-status__dot');
    const line = document.querySelector('.hero__pre');
    return { live: dot ? dot.className : '', hasLabel: !!line && /OPEN TO WORK/i.test(line.textContent) };
  });
  const samples = await sample(page, () => {
    const dot = document.querySelector('.hero .wn-status__dot');
    const s = getComputedStyle(dot);
    return s.transform + '|' + s.opacity;
  }, 14, 220);
  const distinct = new Set(samples).size;
  const pulses = distinct >= 2;
  rec('Heartbeat', /--live/.test(meta.live), pulses && meta.hasLabel,
    `dot oscillation samples=${distinct} distinct; label "OPEN TO WORK"=${meta.hasLabel}`, pulses && meta.hasLabel);
  await c.close();
} catch (e) { rec('Heartbeat', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 7. Heliostat daypart tint (§5.1) ───────────────── */
try {
  const read = async (iso) => {
    const c = await newCtx();
    const page = await c.newPage();
    await page.clock.install({ time: new Date(iso) });
    await page.goto(HOME, { waitUntil: 'domcontentloaded' });
    const r = await page.evaluate(() => ({
      dp: document.documentElement.getAttribute('data-daypart'),
      tint: getComputedStyle(document.documentElement).getPropertyValue('--fc-tint').trim(),
    }));
    await c.close();
    return r;
  };
  const dawn = await read('2026-06-09T08:00:00');
  const eve = await read('2026-06-09T19:00:00');
  const pass = dawn.dp !== eve.dp && dawn.dp === 'dawn' && eve.dp === 'evening';
  rec('Heliostat', true, pass, `08:00→${dawn.dp} (tint ${dawn.tint || '∅'}) vs 19:00→${eve.dp} (tint ${eve.tint || '∅'})`, pass);
} catch (e) { rec('Heliostat', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 8. Threshold Cut + Crack (§5.8/§5.9) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const armed = await page.evaluate(() => {
    const v = document.querySelector('.wn-void');
    if (!v) return null;
    return { cls: v.className, wordOp: +getComputedStyle(v.querySelector('.wn-void__word')).opacity };
  });
  await page.evaluate(() => document.querySelector('.wn-void').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(700);
  const fired = await page.evaluate(() => {
    const v = document.querySelector('.wn-void');
    const crack = v.querySelector('.wn-void__crack');
    return {
      cut: v.classList.contains('fc-cut-in'),
      wordOp: +getComputedStyle(v.querySelector('.wn-void__word')).opacity,
      crackScale: crack ? getComputedStyle(crack).transform : 'none',
    };
  });
  const pass = !!armed && armed.cls.includes('fc-cut-armed') && armed.wordOp < 0.5 && fired.cut && fired.wordOp > 0.9;
  rec('Threshold Cut', true, fired.cut, `armed op=${armed && num(armed.wordOp)} → in op=${num(fired.wordOp)}; crack=${fired.crackScale.slice(0, 22)}`, pass);
  await c.close();
} catch (e) { rec('Threshold Cut', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 9. Scanline footer drift (§5.11) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const exists = await page.$$eval('.footer__scanline', (e) => e.length);
  await page.evaluate(() => document.querySelector('.footer__scanline').scrollIntoView({ block: 'center' }));
  let ran = false;
  for (let i = 0; i < 24; i++) {
    ran = await page.evaluate(() => document.querySelector('.footer__scanline').classList.contains('fc-scan-run'));
    if (ran) break;
    await page.waitForTimeout(100);
  }
  rec('Scanline', exists > 0, ran, `layer exists=${exists > 0}; fc-scan-run observed=${ran}`, exists > 0 && ran);
  await c.close();
} catch (e) { rec('Scanline', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 10. Vault Blur transition + menu backdrop (§5.10) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const styleInjected = await page.evaluate(() => [...document.querySelectorAll('style')].some((s) => /@view-transition/.test(s.textContent) && /wn-dive/.test(s.textContent)));
  // mobile menu backdrop blur (390px)
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(HOME, { waitUntil: 'networkidle' });
  await mp.click('.nav__toggle');
  await mp.waitForTimeout(250);
  const backdrop = await mp.evaluate(() => {
    const links = document.querySelector('.nav__links');
    const s = getComputedStyle(links);
    return { open: document.querySelector('.nav').dataset.menuOpen, bf: s.backdropFilter || s.webkitBackdropFilter || 'none' };
  });
  await m.close();
  const menuBlur = /blur\(/.test(backdrop.bf);
  rec('Vault Blur', true, styleInjected, `cross-doc style blur=${styleInjected}; menu backdrop=${backdrop.bf} (blur=${menuBlur})`, styleInjected && menuBlur);
  await c.close();
} catch (e) { rec('Vault Blur', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 11. Reveals forward-land (§3 reveal grammar) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const armed = await page.evaluate(() => document.querySelectorAll('.fc-reveal:not(.is-in)').length);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  const revealed = await page.evaluate(() => document.querySelectorAll('.fc-reveal.is-in').length);
  rec('Reveals', armed > 0 || revealed > 0, revealed > 0, `armed@load=${armed}; is-in after scroll=${revealed}`, revealed > 0);
  await c.close();
} catch (e) { rec('Reveals', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 12. Patina returning-visitor aging (§5.5) ───────────────── */
try {
  // first visit (clean storage)
  const c1 = await newCtx();
  const p1 = await c1.newPage();
  await p1.goto(WORKIDX, { waitUntil: 'networkidle' });
  const first = await p1.evaluate(() => ({
    visited: document.querySelectorAll('.wn-card--visited').length,
    ret: document.documentElement.classList.contains('fc-return'),
    amp: document.documentElement.classList.contains('fc-amp'),
  }));
  await c1.close();

  // returning visitor: seen rag-zelebrix, 3 visits (frozen via session flag)
  const c2 = await newCtx();
  await c2.addInitScript(() => {
    try {
      localStorage.setItem('wn.visited', JSON.stringify(['rag-zelebrix']));
      localStorage.setItem('wn.visits', '3');
      sessionStorage.setItem('wn.session', '1');
    } catch {}
  });
  const p2 = await c2.newPage();
  await p2.goto(WORKIDX, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(200);
  const back = await p2.evaluate(() => ({
    visited: document.querySelectorAll('.wn-card--visited').length,
    // aging is now an organic moss CREEP (background-image) + sr-only label — no corner tick element
    patina: (() => { const c = document.querySelector('.wn-card--visited'); if (!c) return false; return /gradient/.test(getComputedStyle(c).backgroundImage) && !!c.querySelector('.sr-only'); })(),
    ret: document.documentElement.classList.contains('fc-return'),
    amp: document.documentElement.classList.contains('fc-amp'),
  }));
  await c2.close();
  const aged = back.visited > first.visited && back.patina && back.ret && back.amp;
  rec('Patina', true, aged, `first(visited=${first.visited},ret=${first.ret}) → return(visited=${back.visited},creep+label=${back.patina},ret=${back.ret},amp=${back.amp})`, aged);
} catch (e) { rec('Patina', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 13. THE RED SPINE (new, §5.2 ext) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  const exists = await page.$$eval('.fc-spine', (e) => e.length);
  const hasPath = await page.$eval('.fc-spine__path', (p) => (p.getAttribute('d') || '').length > 20).catch(() => false);
  const off0 = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.fc-spine__path')).strokeDashoffset) || 0);
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(3000, { duration: 0.6 }); else window.scrollTo(0, 3000); });
  // robust 'travels': sample WHILE the draw seeps (the tip must ride the growing
  // thread) — sampling only after the wait was flaky once the seep converged early
  const cys = [];
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(300); cys.push(await page.evaluate(() => +document.querySelector('.fc-spine__pulse').getAttribute('cy'))); }
  const travels = new Set(cys).size >= 2;
  const off1 = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.fc-spine__path')).strokeDashoffset) || 0);
  const drew = off1 < off0 - 1;
  // local bend: the path `d` deforms toward the cursor (not a rigid block transform)
  await page.mouse.move(1320, 340, { steps: 6 }); await page.waitForTimeout(750);
  const dA = await page.$eval('.fc-spine__path', (p) => p.getAttribute('d'));
  await page.mouse.move(110, 340, { steps: 8 }); await page.waitForTimeout(850);
  const dB = await page.$eval('.fc-spine__path', (p) => p.getAttribute('d'));
  const bends = dA !== dB;
  const pass = exists > 0 && hasPath && drew && travels && bends;
  rec('Red Spine', exists > 0 && hasPath, drew && travels && bends, `draws(off ${off0 | 0}→${off1 | 0})=${drew}; pulse travels=${travels}; cursor bend=${bends}`, pass);
  await c.close();
} catch (e) { rec('Red Spine', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 14. ONE HEARTBEAT — dot & spine share one clock ─────────────────
   ?fc-breath=0 freezes the breath channel: with breath at 0 the dot and spine recede
   terms are identical by construction (deterministic — W4 harness delta 3). */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME + '?fc-breath=0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  let maxDiff = 0, beats = 0;
  for (let i = 0; i < 26; i++) {
    const [dot, spine] = await page.evaluate(() => [
      parseFloat(getComputedStyle(document.querySelector('.hero .wn-status__dot')).getPropertyValue('--fc-dot-beat')) || 0,
      parseFloat(getComputedStyle(document.querySelector('.fc-spine')).getPropertyValue('--fc-spine-beat')) || 0,
    ]);
    maxDiff = Math.max(maxDiff, Math.abs(dot - spine));
    if (dot > 0.05) beats++;
    await page.waitForTimeout(130);
  }
  const synced = maxDiff < 0.06 && beats >= 1;
  rec('One Heartbeat', true, synced, `dot/spine beat maxDiff=${maxDiff.toFixed(3)} (≈0 ⇒ one clock); cardiac beats seen=${beats}`, synced);
  await c.close();
} catch (e) { rec('One Heartbeat', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 15. Sky light (redesigned motes) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.mouse.move(500, 400, { steps: 3 });
  await page.waitForTimeout(150);
  const count = await page.$$eval('.fc-mote', (e) => e.length);
  const tA = await page.evaluate(() => { const m = document.querySelector('.fc-mote'); return m ? m.style.transform : ''; });
  await page.waitForTimeout(600);
  const tB = await page.evaluate(() => { const m = document.querySelector('.fc-mote'); return m ? m.style.transform : ''; });
  const ok = count > 0 && tA !== tB;
  rec('Sky light', count > 0, ok, `sky motes=${count}; soft warm blooms drift=${tA !== tB}`, ok);
  await c.close();
} catch (e) { rec('Sky light', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 15b. Ocean click ripple (new) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.mouse.move(700, 500, { steps: 2 });
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(120);
  const rings = await page.$$eval('.fc-ocean__ring', (e) => e.length);
  const isSky = await page.evaluate(() => { const r = document.querySelector('.fc-ocean__ring'); return r ? getComputedStyle(r).borderColor : ''; });
  rec('Ocean ripple', true, rings > 0, `ring spawned on click=${rings > 0}; sky-not-red border=${isSky}`, rings > 0);
  await c.close();
} catch (e) { rec('Ocean ripple', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 15c. Spine drawing-tip nib + ripple ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  // nib brightens while scrolling (advancing), quiet at rest
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(2600, { duration: 0.7 }); else window.scrollTo(0, 2600); });
  let peak = 0;
  for (let i = 0; i < 12; i++) { peak = Math.max(peak, await page.evaluate(() => +document.querySelector('.fc-spine__pulse').style.opacity || 0)); await page.waitForTimeout(60); }
  await page.waitForTimeout(900);
  const rest = await page.evaluate(() => +document.querySelector('.fc-spine__pulse').style.opacity || 0);
  const nibAlive = peak > rest + 0.1 && peak > 0.4;
  rec('Spine nib', true, nibAlive, `nib opacity peak(drawing)=${num(peak)} > rest=${num(rest)}`, nibAlive);
  await c.close();
} catch (e) { rec('Spine nib', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 15d. Spine on EVERY page + no gold vein on the thread ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(WORKIDX, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const onInner = await page.$$eval('.fc-spine__path', (e) => e.length);
  const noGild = await page.$$eval('.fc-spine__gild', (e) => e.length);
  const ok = onInner > 0 && noGild === 0;
  rec('Spine everywhere', onInner > 0, ok, `spine on /work=${onInner > 0}; gold vein removed from thread=${noGild === 0}`, ok);
  await c.close();
} catch (e) { rec('Spine everywhere', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 15e. Warm lens (cursor clarifies the element) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.proof__cell, .principle, .wn-void').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  const box = await page.evaluate(() => { const el = document.querySelector('.proof__cell, .principle, .wn-void'); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const before = await page.evaluate(() => { const el = document.querySelector('.proof__cell, .principle, .wn-void'); return getComputedStyle(el).boxShadow; });
  await page.mouse.move(box.x, box.y, { steps: 4 });
  await page.waitForTimeout(450);
  const lit = await page.evaluate(() => !!document.querySelector('.fc-lit'));
  // QA-5: unbounded blocks now glow via a ::after light POOL (opacity 0→1), not a
  // box-shadow (which clipped under the border-box into a hard misaligned rectangle)
  const after = await page.evaluate(() => {
    const el = document.querySelector('.fc-lit');
    if (!el) return '';
    const pool = +getComputedStyle(el, '::after').opacity;
    return pool >= 0.9 ? 'pool' : getComputedStyle(el).boxShadow;
  });
  const ok = lit && (after === 'pool' || after !== before);
  rec('Warm lens', true, ok, `element lit on hover=${lit}; light channel=${after === 'pool' ? 'pool ::after' : 'box-shadow'}`, ok);
  await c.close();
} catch (e) { rec('Warm lens', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 16. Patina kintsugi deepening (new, §5.5 ext) ───────────────── */
try {
  const seam = async (visits) => {
    const c = await newCtx();
    await c.addInitScript((v) => { try { localStorage.setItem('wn.visits', String(v)); sessionStorage.setItem('wn.session', '1'); } catch {} }, visits);
    const page = await c.newPage();
    await page.goto(HOME, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const crack = document.querySelector('.wn-void__crack');
      return { op: crack ? parseFloat(getComputedStyle(crack, '::after').opacity) : null, cls: document.documentElement.className };
    });
    await c.close();
    return r;
  };
  const ret = await seam(2);
  const aged = await seam(5);
  const deepens = ret.op != null && aged.op != null && aged.op > ret.op + 0.05;
  rec('Patina kintsugi', true, deepens, `seam opacity visit2=${ret.op} → visit5=${aged.op}; fc-aged=${/fc-aged/.test(aged.cls)}`, deepens && /fc-aged/.test(aged.cls));
} catch (e) { rec('Patina kintsugi', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 17. Cross-page heartbeat continuity (ocean) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const a1 = await page.evaluate(() => sessionStorage.getItem('wn.beatAnchor'));
  await page.goto(BASE + '/work/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const a2 = await page.evaluate(() => sessionStorage.getItem('wn.beatAnchor'));
  const ok = !!a1 && a1 === a2;
  rec('Heartbeat continuity', true, ok, `beatAnchor home=${a1} == work=${a2} ⇒ pulse never resets`, ok);
  await c.close();
} catch (e) { rec('Heartbeat continuity', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 18. Breath (BRE-1 §e.10 — replaced the old idle-sigh row) ─────────────────
   The first anticipated breath rises ~0.9s after load; after a scroll the engine
   re-arms from the 1.5s scroll-idle channel: >0 within ≤2.5s, ≥0.95 within ≤5s. */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const first = await page.evaluate(() => +getComputedStyle(document.documentElement).getPropertyValue('--fc-breath') || 0);
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(900, { duration: 0.4 }); else window.scrollTo(0, 900); });
  await page.waitForTimeout(700); // let the scroll land — idle starts from stillness
  let tRise = -1, tPeak = -1;
  const t0 = Date.now();
  while (Date.now() - t0 < 5600) {
    const b = await page.evaluate(() => +getComputedStyle(document.documentElement).getPropertyValue('--fc-breath') || 0);
    if (tRise < 0 && b > 0) tRise = (Date.now() - t0) / 1000;
    if (tPeak < 0 && b >= 0.95) { tPeak = (Date.now() - t0) / 1000; break; }
    await page.waitForTimeout(120);
  }
  const pass = first > 0 && tRise > 0 && tRise <= 2.5 && tPeak > 0 && tPeak <= 5;
  rec('Breath', true, pass, `first@2s=${num(first)}; after scroll: >0 @${num(tRise)}s (≤2.5) peak @${num(tPeak)}s (≤5)`, pass);
  await c.close();
} catch (e) { rec('Breath', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 19. Vertical dive page transition (ocean) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const dive = await page.evaluate(() => [...document.querySelectorAll('style')].some((s) => /wn-dive-out[\s\S]*?translateY/.test(s.textContent)));
  rec('Vertical dive', true, dive, `page transition sinks/surfaces (wn-dive translateY)=${dive}`, dive);
  await c.close();
} catch (e) { rec('Vertical dive', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 20. Patina .html slug (BUG-1 regression) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(BASE + '/work/rag-zelebrix.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const stored = await page.evaluate(() => localStorage.getItem('wn.visited') || '[]');
  const clean = JSON.parse(stored);
  const hasSlug = clean.includes('rag-zelebrix') && !clean.some((s) => /\.html?$/.test(s));
  await page.goto(WORKIDX, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const lit = await page.$$eval('.wn-card--visited', (e) => e.length);
  const pass = hasSlug && lit >= 1;
  rec('Patina .html slug', true, pass, `visited=${stored.slice(0, 26)} (no ext=${hasSlug}); hub cards lit=${lit}`, pass);
  await c.close();
} catch (e) { rec('Patina .html slug', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 21. Field rest (PERF-1): stillness writes nothing ─────────────────
   /method has no live hero dot: after the motes settle (~2.6s) and the spine seep ends,
   NOTHING may keep mutating styles in the body subtree (root writes are heliostat's,
   excluded — it ticks once a minute). 0 mutations in 2s ⇒ the field truly rests. */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(BASE + '/method.html?fc-hour=13&fc-breath=0&fc-wx=clear', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  const muts = await page.evaluate(() => new Promise((res) => {
    let n = 0;
    const mo = new MutationObserver((list) => { n += list.length; });
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
    setTimeout(() => { mo.disconnect(); res(n); }, 2000);
  }));
  const pass = muts === 0;
  rec('Field rest (PERF-1)', true, pass, `style mutations in 2s of stillness on /method = ${muts} (0 ⇒ the field sleeps)`, pass);
  await c.close();
} catch (e) { rec('Field rest (PERF-1)', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 22. Intensity toggle (INT-6 Fila A) ─────────────────
   NOTE: the forced-sigh assert (--fc-breath > 0 within 1.5s of the click) is added
   when W4's breath.js merges — the channel does not exist in Fase 0. */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(WORKIDX, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const pre = await page.evaluate(() => ({
    boost: document.documentElement.classList.contains('fc-boost'),
    btn: !!document.querySelector('.fc-intensity'),
    label: (document.querySelector('.fc-intensity__label') || {}).textContent || '',
  }));
  await page.click('.fc-intensity');
  await page.waitForTimeout(600);
  const on = await page.evaluate(() => ({
    boost: document.documentElement.classList.contains('fc-boost'),
    sun: getComputedStyle(document.documentElement).getPropertyValue('--fc-int-sun').trim(),
    store: localStorage.getItem('wn.intensity'),
    label: (document.querySelector('.fc-intensity__label') || {}).textContent || '',
    demo: document.querySelectorAll('.wn-card[data-demo]').length,
  }));
  // INT-4: activating boost forces an immediate sigh — the owner SEES the breath on demand
  await page.waitForTimeout(800); // total ≤1.5s after the click
  const sigh = await page.evaluate(() => +getComputedStyle(document.documentElement).getPropertyValue('--fc-breath') || 0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const prePaint = await page.evaluate(() => document.documentElement.classList.contains('fc-boost'));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.click('.fc-intensity');
  await page.waitForTimeout(400);
  const off = await page.evaluate(() => ({
    boost: document.documentElement.classList.contains('fc-boost'),
    store: localStorage.getItem('wn.intensity'),
    demo: document.querySelectorAll('.wn-card[data-demo]').length,
  }));
  const pass = pre.btn && !pre.boost && /SUBTLE/.test(pre.label)
    && on.boost && on.sun === '1.6' && on.store === 'boost' && /LOUD/.test(on.label) && on.demo >= 1
    && sigh > 0 && prePaint && !off.boost && off.demo === 0 && off.store === 'subtle';
  rec('Intensity toggle', pre.btn, pass,
    `boost=${on.boost} sun=${on.sun} store=${on.store} demo=${on.demo} sigh@1.4s=${num(sigh)} prePaint=${prePaint} revert=${!off.boost}/${off.demo}`, pass);
  await c.close();
} catch (e) { rec('Intensity toggle', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 23. Boost red guard (INT-6 Fila B) ─────────────────
   Level 1: RED_LOCKED axes identical across presets. Level 2: no CSS declaration
   couples --signal to a --fc-int-* axis outside RED_LOCKED ∪ {breath}. Level 3:
   measured red budget ≤1.5% in BOTH presets, |delta| ≤ 0.05pp. (?fc-breath=0
   freeze added with W4 — the old sigh needs 8s idle and cannot pollute the shot.) */
try {
  const locked = RED_LOCKED.every((k) => INTENSITY.subtle[k] === 1 && INTENSITY.boost[k] === 1);
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME + '?fc-breath=0&fc-wx=clear', { waitUntil: 'networkidle' }); // freeze the sanctioned transitory exception (§f.6) + deterministic sky
  const coupling = await page.evaluate((allowed) => {
    const bad = [];
    for (const s of document.querySelectorAll('style')) {
      for (const m of s.textContent.matchAll(/[^;{}]*--signal[^;{}]*/g)) {
        const decl = m[0];
        for (const a of decl.matchAll(/--fc-int-([a-z]+)/g)) {
          if (!allowed.includes(a[1])) bad.push(decl.trim().slice(0, 60));
        }
      }
    }
    return bad;
  }, [...RED_LOCKED.map((k) => k.toLowerCase()), 'breath']);
  // identical settle in BOTH states: the hero route finishes its GSAP draw at
  // ~1.4s (0.45 delay + 0.9s) — shooting earlier catches it mid-draw and the
  // red delta measures the draw, not the boost
  await page.waitForTimeout(2200);
  const shotSub = await page.screenshot();
  await page.goto(HOME + '?wn=boost&fc-breath=0&fc-wx=clear', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  const shotBoost = await page.screenshot();
  await c.close();
  const differ = await makeDiffer(browser);
  const rSub = await differ.redMask(shotSub);
  const rBoost = await differ.redMask(shotBoost);
  await differ.close();
  const delta = Math.abs(rBoost.redPct - rSub.redPct);
  const pass = locked && coupling.length === 0 && rSub.redPct <= 1.5 && rBoost.redPct <= 1.5 && delta <= 0.05;
  rec('Boost red guard', true, pass,
    `locked=${locked}; couplings=${coupling.length}; red subtle=${rSub.redPct}% boost=${rBoost.redPct}% Δ=${delta.toFixed(3)}pp`, pass);
} catch (e) { rec('Boost red guard', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 24. RM live switch (A11Y-1 / BUG-3 regression) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => ({
    fcMotion: document.documentElement.classList.contains('fc-motion'),
    intensityOk: !!document.querySelector('.fc-intensity'),
  }));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1600);
  const scanRearmed = await page.$eval('.footer__scanline', (el) => el.classList.contains('fc-scan-run')).catch(() => false);
  const pass = !s.fcMotion && s.intensityOk && !scanRearmed;
  rec('RM live switch', true, pass,
    `fc-motion removed=${!s.fcMotion}; intensity UI alive=${s.intensityOk}; scanline rearmed=${scanRearmed}`, pass);
  await c.close();
} catch (e) { rec('RM live switch', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 25. Card arrow answers hover (DC-13 regression) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(WORKIDX, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const card = page.locator('a.wn-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForTimeout(350);
  const tf = await page.$eval('a.wn-card .wn-card__arrow', (el) => getComputedStyle(el).transform);
  const pass = /matrix\(1,\s*0,\s*0,\s*1,\s*4,\s*0\)/.test(tf);
  rec('Card arrow hover', true, pass, `arrow transform on card hover = ${tf}`, pass);
  await c.close();
} catch (e) { rec('Card arrow hover', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 26. Heliostat day arc (SKY-1/2/4 — §e.3) ───────────────── */
try {
  const differ = await makeDiffer(browser);
  const c = await newCtx();
  const page = await c.newPage();
  const shots = [];
  for (const h of [7, 10, 13, 16, 19]) {
    await page.goto(HOME + `?fc-hour=${h}&fc-wx=clear&fc-breath=0`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: HIDE_LIVING });
    await page.waitForTimeout(500);
    shots.push(await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 225 } }));
  }
  let minMax = Infinity;
  for (let i = 1; i < shots.length; i++) { const d = await differ.diff(shots[i - 1], shots[i]); minMax = Math.min(minMax, d.max); }
  const dx9 = await page.evaluate(async () => { const u = new URL(location.href); u.searchParams.set('fc-hour', '9'); history.replaceState(null, '', u); return 0; }).then(() => 0);
  await page.goto(HOME + '?fc-hour=9&fc-wx=clear', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const sh9 = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fc-shadow-dx')) || 0);
  await page.goto(HOME + '?fc-hour=18&fc-wx=clear', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const sh18 = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fc-shadow-dx')) || 0);
  await c.close(); await differ.close();
  const pass = minMax >= 25 && sh9 > 0 && sh18 < 0;
  rec('Heliostat day arc', true, pass, `min consecutive-3h diff max=${minMax} (≥25); shadow-dx 9h=${sh9.toFixed(1)} > 0 > 18h=${sh18.toFixed(1)}`, pass);
} catch (e) { rec('Heliostat day arc', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 27. Weather state + the ONE sanctioned third-party (§e.4) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME + '?fc-wx=storm', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const storm = await page.evaluate(() => document.documentElement.dataset.wx);
  await page.goto(HOME + '?fc-wx=off', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const off = await page.evaluate(() => document.documentElement.hasAttribute('data-wx'));
  await c.close();
  // network discipline: WITHOUT a scrubber, a 2-navigation session makes ≤1 cross-origin
  // request and ONLY to api.open-meteo.com (the single sanctioned third-party, §f.4)
  const c2 = await newCtx();
  const page2 = await c2.newPage();
  const xo = [];
  page2.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== new URL(BASE).origin) xo.push(u.origin); });
  await page2.goto(HOME, { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1200);
  await page2.goto(BASE + '/method.html', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(800);
  await c2.close();
  const foreign = xo.filter((o) => o !== 'https://api.open-meteo.com');
  // the security guarantee is FOREIGN === 0 (only open-meteo); the cost guarantee is
  // ≤1/page-load (cache dedups within a session, but a timed-out fetch may re-try on
  // the next nav, so across 2 navs allow ≤2). foreign=0 is the hard one.
  const pass = storm === 'storm' && !off && xo.length <= 2 && foreign.length === 0;
  rec('Weather state', true, pass, `storm=${storm}; off attr=${off}; cross-origin=${xo.length} (≤2, only open-meteo) foreign=${foreign.length}`, pass);
} catch (e) { rec('Weather state', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 28. Red lightning — LOOPS in storm, budget-safe (V5.7) ─────────────────
   Owner wanted it more than once: in storm it now loops (random gaps, sometimes a
   double bolt, random x). Assert it APPEARS (≥1) in a boost storm window, and that the
   red budget holds even with a bolt on screen. (The old 1/session quota is retired.) */
try {
  const c2 = await newCtx();
  const page2 = await c2.newPage();
  await page2.goto(HOME + '?fc-wx=storm&wn=boost', { waitUntil: 'networkidle' });
  const seen = await page2.evaluate(() => new Promise((res) => {
    let n = 0;
    const mo = new MutationObserver((muts) => {
      for (const m of muts) for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.classList && node.classList.contains('fc-sprite')) n++;
      }
    });
    mo.observe(document.body, { childList: true });
    setTimeout(() => { mo.disconnect(); res(n); }, 11000);
  }));
  const shot = await page2.screenshot();
  await c2.close();
  const differ = await makeDiffer(browser);
  const red = await differ.redMask(shot);
  await differ.close();
  const pass = seen >= 1 && red.redPct <= 1.5;
  rec('Red lightning loop', true, pass, `bolts in 11s storm window=${seen} (≥1, loops); red on screen=${red.redPct}% (≤1.5)`, pass);
} catch (e) { rec('Sprite quota', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 29. Rest tiers (BRE-4 §e.11) ───────────────── */
try {
  const c = await newCtx();
  await c.addInitScript(() => { try { sessionStorage.setItem('wn.firstBreathDone', '1'); } catch { /* */ } });
  const page = await c.newPage();
  await page.goto(HOME + '?fc-rest=asleep', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const s = await page.evaluate(() => ({
    tier: document.documentElement.dataset.fcRest,
    warm: getComputedStyle(document.documentElement).getPropertyValue('--fc-rest-warm').trim(),
    pulse: getComputedStyle(document.documentElement).getPropertyValue('--fc-pulse-alpha').trim(),
  }));
  const t0 = Date.now();
  await page.mouse.move(640, 400);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(90);
  const awake = await page.evaluate(() => !document.documentElement.hasAttribute('data-fc-rest'));
  const wakeMs = Date.now() - t0;
  await c.close();
  const pass = s.tier === 'asleep' && parseFloat(s.warm) === 0.04 && s.pulse === '0.70' && awake;
  rec('Rest tiers', true, pass, `tier=${s.tier} warm=${s.warm} pulse-alpha=${s.pulse}; awake ≤${wakeMs}ms=${awake}`, pass);
} catch (e) { rec('Rest tiers', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 30. Touch census (TOU-5 §e.12) ───────────────── */
try {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' });
  const page = await c.newPage();
  await page.goto(BASE + '/method.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const motes = await page.$$eval('.fc-mote', (els) => ({ n: els.length, maxOp: Math.max(...els.map((e) => +e.style.opacity || 0)) }));
  const dBefore = await page.$eval('.fc-spine__path', (p) => p.getAttribute('d'));
  await page.touchscreen.tap(60, 500);
  await page.waitForTimeout(420);
  const dAfter = await page.$eval('.fc-spine__path', (p) => p.getAttribute('d'));
  const lit = await page.evaluate(async () => {
    const block = document.querySelector('.phase') || document.querySelector('.prose');
    if (!block) return 'no-block';
    block.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    await new Promise((r) => setTimeout(r, 250));
    return block.classList.contains('fc-lit');
  });
  await c.close();
  const pass = motes.n === 10 && motes.maxOp >= 0.15 && dBefore !== dAfter && lit === true;
  rec('Touch census', true, pass, `motes=${motes.n} (10) maxOp=${num(motes.maxOp)}; spine bends on tap=${dBefore !== dAfter}; warm-lens on tap=${lit}`, pass);
} catch (e) { rec('Touch census', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 31. Spine presence + knots + stitch (HILO-3/4/5a §e.8) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME + '?fc-breath=0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2400); // min-draw seeps in from 0
  const top = await page.evaluate(() => {
    const p = document.querySelector('.fc-spine__path');
    const LEN = parseFloat(getComputedStyle(p).strokeDasharray) || 4000;
    return {
      off: parseFloat(p.style.strokeDashoffset || getComputedStyle(p).strokeDashoffset),
      LEN,
      op: +getComputedStyle(p).opacity,
      knot: +getComputedStyle(document.querySelector('.fc-spine__knot--origin')).opacity,
    };
  });
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(1200, { duration: 0.4 }); else window.scrollTo(0, 1200); });
  await page.waitForTimeout(1300);
  const stitch = await page.evaluate(() => {
    const s = document.querySelector('.fc-spine__stitch');
    return s ? { op: getComputedStyle(s).opacity, off: s.getAttribute('stroke-dashoffset') } : null;
  });
  await c.close();
  // stitch now lights only on a VISIBLE next waypoint (V5.4) — assert it EXISTS, not
  // that it's lit at this exact scroll (knot quieted to 0.72 in V5.1)
  const pass = top.off <= top.LEN * 0.95 && top.op >= 0.2 && top.knot >= 0.65 && !!stitch;
  rec('Spine presence', true, pass, `scroll-0: off=${top.off | 0} ≤ ${(top.LEN * 0.95) | 0}, op=${num(top.op)}, knot=${num(top.knot)}; stitch=${!!stitch}`, pass);
} catch (e) { rec('Spine presence', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 32. Living name route (HILO-1a) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2300); // initial draw + dasharray:none fix
  const before = await page.$eval('.route-path--desktop', (p) => ({ d: p.getAttribute('d'), dash: p.style.strokeDasharray || getComputedStyle(p).strokeDasharray }));
  await page.mouse.click(700, 140); // empty hero space
  await page.waitForTimeout(1500); // retract 0.28s + draw 0.9s
  const after = await page.$eval('.route-path--desktop', (p) => ({ d: p.getAttribute('d'), dash: p.style.strokeDasharray || getComputedStyle(p).strokeDasharray }));
  const step = await page.evaluate(() => sessionStorage.getItem('wn.routeStep'));
  await c.close();
  const pass = before.dash === 'none' && after.d !== before.d && after.dash === 'none' && step === '1';
  rec('Living name route', true, pass, `dash settled=${before.dash}; redraw on click=${after.d !== before.d}; step=${step}; dash after=${after.dash}`, pass);
} catch (e) { rec('Living name route', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 33. Seams 2.0 + void word fit (VOID-1a/5a §e.6/§e.7) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  const counts = {};
  for (const r of ['/method.html', '/work/index.html', '/work/rag-zelebrix.html']) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    counts[r] = await page.$$eval('.wn-seam', (e) => e.length);
  }
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const gold = await page.evaluate(() => {
    const s = document.querySelector('.wn-seam--postvoid');
    return s ? getComputedStyle(s, '::before').backgroundImage : 'absent';
  });
  let fitFails = 0;
  for (const r of ROUTES) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    fitFails += await page.$$eval('.wn-void__word', (els) => els.filter((el) => el.scrollWidth > el.clientWidth).length);
  }
  await c.close();
  const goldOk = /gradient/.test(gold) && /color\(srgb 0\.7\d+,? 0\.5\d+,? 0\.1\d+/.test(gold);
  const pass = Object.values(counts).every((n) => n >= 1) && goldOk && fitFails === 0;
  rec('Seams 2.0 + word fit', true, pass, `seams=${JSON.stringify(counts).slice(0, 30)}; postvoid gold=${goldOk}; word overflows=${fitFails} (0)`, pass);
} catch (e) { rec('Seams 2.0 + word fit', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 34. 404 frayed route (HILO-6/VOID-7 §e.9) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(BASE + '/404.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1700);
  const s = await page.evaluate(() => ({
    off: parseFloat(getComputedStyle(document.querySelector('.nf-route__line')).strokeDashoffset),
    bead: getComputedStyle(document.querySelector('.nf-route__end')).animationName,
    mini: !!document.querySelector('.wn-void--mini'),
    crack: !!document.querySelector('.wn-void__crack'),
  }));
  await c.close();
  const pass = s.off === 0 && s.bead === 'wn-nf-bead' && s.mini && !s.crack;
  rec('404 frayed route', true, pass, `line drawn=${s.off === 0}; bead=${s.bead}; mini band=${s.mini}; crackless=${!s.crack}`, pass);
} catch (e) { rec('404 frayed route', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 35. Per-project route assets (AST-1a/2 §e.16) ───────────────── */
try {
  const distFiles = ['dist/index.html', 'dist/work/index.html', 'dist/work/rag-zelebrix.html', 'dist/work/gestamp-agents.html', 'dist/work/architecture-idea.html', 'dist/work/personal.html'];
  const mini = distFiles.reduce((n, f) => n + (readFileSync(f, 'utf8').includes('route-mini-card') ? 1 : 0), 0);
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  const vizHome = await page.$$eval('.wn-card svg.route-viz, .wn-card .wn-card__viz svg, .wn-card svg', (els) => els.map((e) => e.innerHTML.replace(/\s+/g, '')));
  await page.goto(WORKIDX, { waitUntil: 'networkidle' });
  const vizWork = await page.$$eval('.wn-card svg', (els) => els.map((e) => e.innerHTML.replace(/\s+/g, '')));
  const unique = new Set([...vizHome, ...vizWork]).size;
  const heads = [];
  for (const r of ['/work/rag-zelebrix.html', '/work/gestamp-agents.html', '/work/architecture-idea.html', '/work/personal.html']) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    heads.push(await page.evaluate(() => {
      const el = document.querySelector('.identity__route');
      const main = el && el.querySelector('.route-main');
      return el ? { d: (main && main.getAttribute('d') || '').slice(0, 40), hy: el.dataset.headY || '' } : null;
    }));
  }
  await c.close();
  const dUnique = new Set(heads.filter(Boolean).map((h) => h.d)).size;
  const hyOk = heads.filter(Boolean).every((h) => h.hy !== '');
  const pass = mini === 0 && unique >= 5 && dUnique === 4 && hyOk;
  rec('Route assets', true, pass, `route-mini-card refs=${mini} (0); unique card viz=${unique} (≥5); unique headers=${dUnique}/4; head-y all=${hyOk}`, pass);
} catch (e) { rec('Route assets', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 36. Boost perceptibility (INT-6 Fila C — at the day's FLATTEST hour) ───────────────── */
try {
  const c = await newCtx();
  await c.addInitScript(() => { try { localStorage.setItem('wn.visitor', 'harness-fixed'); } catch { /* */ } });
  const page = await c.newPage();
  await page.goto(HOME + '?fc-hour=16&fc-wx=clear&fc-breath=0', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_LIVING });
  await page.waitForTimeout(600);
  const shotSub = await page.screenshot();
  await page.goto(HOME + '?fc-hour=16&fc-wx=clear&fc-breath=0&wn=boost', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_LIVING });
  await page.waitForTimeout(600);
  const shotBoost = await page.screenshot();
  await c.close();
  const differ = await makeDiffer(browser);
  const d = await differ.diff(shotSub, shotBoost);
  await differ.close();
  const pass = d.max >= 16 && d.pctGe8 >= 0.8;
  rec('Boost perceptibility', true, pass, `subtle↔boost @16h: max=${d.max} (≥16) pctGe8=${d.pctGe8}% (≥0.8%) — perceptible is an ASSERT`, pass);
} catch (e) { rec('Boost perceptibility', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 37. ASK THE FIELD (V5.4) — embed on home + dock on inner pages ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  // HOME: the chat is the EMBEDDED centerpiece under the hero CTAs (always open, visible)
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const embed = await page.$$eval('.wn-chat--embed .wn-chat__input', (e) => e.length); // input present + visible
  const noDockHome = await page.$$eval('.wn-chat--dock', (e) => e.length);
  const cv = await page.$$eval('.wn-btn--cv', (e) => e.length); // the prominent CV button
  await page.fill('.wn-chat--embed .wn-chat__input', 'what did he build?');
  await page.click('.wn-chat--embed .wn-chat__send');
  await page.waitForTimeout(1500); // preview has no /api/ask → the QUIET fallback must speak
  const fallback = await page.$$eval('.wn-chat__msg--quiet', (els) => els.some((el) => /guillehoyob@gmail\.com/.test(el.textContent)));
  await c.close();
  // INNER PAGE: the small corner dock, opens inline
  const c2 = await newCtx();
  const page2 = await c2.newPage();
  await page2.goto(BASE + '/method.html', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(700);
  const dock = await page2.$$eval('.wn-chat--dock .wn-chat__tab', (e) => e.length);
  await page2.click('.wn-chat--dock .wn-chat__tab');
  await page2.waitForTimeout(300);
  const opens = await page2.$eval('.wn-chat--dock', (el) => el.classList.contains('is-open'));
  await c2.close();
  const pass = embed === 1 && noDockHome === 0 && cv === 1 && fallback && dock === 1 && opens;
  rec('Ask the field', embed === 1, pass, `home embed=${embed} (dock=${noDockHome}); CV btn=${cv}; fallback=${fallback}; inner dock opens=${opens}`, pass);
} catch (e) { rec('Ask the field', true, false, 'ERR ' + e.message, false); }

/* ───────────────── 38. V5.2 surface (spec-rules · variable wght · popover ph · magnet) ───────────────── */
try {
  const specRules = /type="speculationrules"/.test(readFileSync('dist/index.html', 'utf8'));
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const wght = await page.evaluate(() => getComputedStyle(document.querySelector('.hero__h1')).fontVariationSettings);
  const cta = await page.$('.wn-btn--primary');
  const box = await cta.boundingBox();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2, { steps: 4 });
  await page.waitForTimeout(250);
  const magnet = await page.$eval('.wn-btn--primary', (el) => el.style.translate || '');
  await page.goto(BASE + '/work/rag-zelebrix.html', { waitUntil: 'networkidle' });
  const pop = await page.evaluate(() => {
    const b = document.querySelector('button.ph-quiet[popovertarget]');
    if (!b) return false;
    const p = document.getElementById(b.getAttribute('popovertarget'));
    return !!(p && p.hasAttribute('popover') && /\[PLACEHOLDER/.test(p.textContent));
  });
  await c.close();
  const pass = specRules && /wght/.test(wght) && magnet !== '' && pop;
  rec('V5.2 surface', true, pass, `spec-rules=${specRules}; h1 wght=${wght.slice(0, 14)}; magnet=${magnet || 'none'}; ph-popover=${pop}`, pass);
} catch (e) { rec('V5.2 surface', true, false, 'ERR ' + e.message, false); }

/* ═════════════════ breakpoint matrix ═════════════════ */
const matrix = [];
for (const [label, w, h] of [['1440', 1440, 900], ['1024', 1024, 768], ['768', 768, 1024], ['390', 390, 844]]) {
  try {
    const c = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await c.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    // ignore the optional open-meteo fetch's network failures (handled; not an app error)
    page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/open-meteo|Failed to load resource|ERR_/.test(t)) errs.push(t); });
    await page.goto(HOME, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const d = window.getComputedStyle(document.querySelector('.route-path--desktop')).display;
      const m = window.getComputedStyle(document.querySelector('.route-path--mobile')).display;
      return { h1op: +getComputedStyle(document.querySelector('.hero__h1')).opacity, routeDesktop: d !== 'none', routeMobile: m !== 'none' };
    });
    matrix.push({ bp: label, errs: errs.length, h1: r.h1op, route: r.routeDesktop ? 'desktop' : (r.routeMobile ? 'mobile' : 'none') });
    await c.close();
  } catch (e) { matrix.push({ bp: label, errs: 'ERR', h1: e.message.slice(0, 30), route: '?' }); }
}

/* ═════════════════ reduced-motion static state ═════════════════ */
const rm = [];
const rmCheck = (k, v, ok) => rm.push({ check: k, value: String(v), verdict: ok ? 'PASS' : 'FAIL' });
try {
  const c = await browser.newContext({ viewport: desktop, reducedMotion: 'reduce' });
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.mouse.move(400, 400, { steps: 4 });
  await page.waitForTimeout(300);
  const s = await page.evaluate(() => ({
    fcMotion: document.documentElement.classList.contains('fc-motion'),
    fcHero: document.documentElement.classList.contains('fc-hero'),
    h1op: +getComputedStyle(document.querySelector('.hero__h1')).opacity,
    crosswind: document.querySelectorAll('.fc-crosswind').length,
    dotAnim: getComputedStyle(document.querySelector('.hero .wn-status__dot')).animationName,
    daypart: document.documentElement.getAttribute('data-daypart'),
    spineOff: (() => { const p = document.querySelector('.fc-spine__path'); return p ? Math.round(parseFloat(getComputedStyle(p).strokeDashoffset) || 0) : -1; })(),
    spinePulse: (() => { const p = document.querySelector('.fc-spine__pulse'); return p ? getComputedStyle(p).display : 'absent'; })(),
    motes: document.querySelectorAll('.fc-mote').length,
  }));
  rmCheck('html.fc-motion absent', s.fcMotion, s.fcMotion === false);
  rmCheck('html.fc-hero absent', s.fcHero, s.fcHero === false);
  rmCheck('hero h1 fully visible', s.h1op, s.h1op === 1);
  rmCheck('no crosswind layers built', s.crosswind, s.crosswind === 0);
  rmCheck('status dot animation none', s.dotAnim, s.dotAnim === 'none');
  rmCheck('daypart state still applied', s.daypart, !!s.daypart);
  rmCheck('spine drawn complete', s.spineOff, s.spineOff === 0);
  rmCheck('spine pulse hidden', s.spinePulse, s.spinePulse === 'none');
  rmCheck('no field motes built', s.motes, s.motes === 0);
  await c.close();
} catch (e) { rmCheck('reduced-motion run', e.message, false); }

await browser.close();

/* ═════════════════ report ═════════════════ */
const pad = (s, n) => String(s).padEnd(n);
const line = (cols, w) => '| ' + cols.map((c, i) => pad(c, w[i])).join(' | ') + ' |';
console.log('\n══════════════════ FIELD CONDITIONS — VERIFICATION HARNESS ══════════════════\n');
console.log(`BASE: ${BASE}\n`);
console.log('CONSOLE/PAGE ERRORS (9 routes):', consoleErrors.length ? '\n  ' + consoleErrors.join('\n  ') : 'CLEAN — none\n');

const W = [16, 7, 7, 62, 7];
console.log('\nBEHAVIOR TABLE (1440px, motion on)\n');
console.log(line(['behavior', 'wired?', 'fires?', 'evidence', 'verdict'], W));
console.log('|' + W.map((n) => '-'.repeat(n + 2)).join('|') + '|');
for (const r of rows) console.log(line([r.behavior, r.wired, r.fires, r.evidence.slice(0, 62), r.verdict], W));

console.log('\nBREAKPOINT MATRIX\n');
const MW = [6, 8, 10, 10];
console.log(line(['bp', 'errors', 'h1 opacity', 'route'], MW));
console.log('|' + MW.map((n) => '-'.repeat(n + 2)).join('|') + '|');
for (const m of matrix) console.log(line([m.bp, m.errs, m.h1, m.route], MW));

console.log('\nREDUCED-MOTION STATIC STATE (1440px)\n');
const RW = [30, 14, 8];
console.log(line(['check', 'value', 'verdict'], RW));
console.log('|' + RW.map((n) => '-'.repeat(n + 2)).join('|') + '|');
for (const r of rm) console.log(line([r.check, r.value, r.verdict], RW));

const fails = rows.filter((r) => r.verdict === 'FAIL').length + rm.filter((r) => r.verdict === 'FAIL').length;
const matrixFail = matrix.filter((m) => m.errs && m.errs !== 0).length;
console.log(`\n${fails === 0 && matrixFail === 0 && consoleErrors.length === 0 ? '✅ ALL GREEN' : `❌ ${fails} behavior/RM failures, ${matrixFail} breakpoint error-rows, ${consoleErrors.length} console errors`}\n`);
process.exit(fails + matrixFail + consoleErrors.length === 0 ? 0 : 1);
