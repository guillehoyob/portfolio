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
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${r}: ${m.text()}`); });
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
    tick: document.querySelectorAll('.wn-card__patina').length,
    ret: document.documentElement.classList.contains('fc-return'),
    amp: document.documentElement.classList.contains('fc-amp'),
  }));
  await c2.close();
  const aged = back.visited > first.visited && back.tick > 0 && back.ret && back.amp;
  rec('Patina', true, aged, `first(visited=${first.visited},ret=${first.ret}) → return(visited=${back.visited},tick=${back.tick},ret=${back.ret},amp=${back.amp})`, aged);
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
  await page.waitForTimeout(950);
  const off1 = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.fc-spine__path')).strokeDashoffset) || 0);
  const drew = off1 < off0 - 1;
  const cyA = await page.evaluate(() => +document.querySelector('.fc-spine__pulse').getAttribute('cy'));
  await page.waitForTimeout(650);
  const cyB = await page.evaluate(() => +document.querySelector('.fc-spine__pulse').getAttribute('cy'));
  const travels = cyA !== cyB;
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

/* ───────────────── 14. ONE HEARTBEAT — dot & spine share one clock ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
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
  const after = await page.evaluate(() => { const el = document.querySelector('.fc-lit'); return el ? getComputedStyle(el).boxShadow : ''; });
  const ok = lit && after !== before;
  rec('Warm lens', true, ok, `element lit on hover=${lit}; shadow changed=${after !== before}`, ok);
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

/* ───────────────── 18. Idle sigh (ocean: the field breathes at rest) ───────────────── */
try {
  const c = await newCtx();
  const page = await c.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await page.waitForTimeout(9200); // stay completely still past the 8s idle threshold
  let peak = 0;
  for (let i = 0; i < 28; i++) { peak = Math.max(peak, await page.evaluate(() => +getComputedStyle(document.documentElement).getPropertyValue('--fc-haze-opacity') || 0.05)); await page.waitForTimeout(130); }
  const ok = peak > 0.07 && peak <= 0.1102;
  rec('Idle sigh', true, ok, `haze after 8s rest rose to ${num(peak)} (one breath, ≤0.11 cap)`, ok);
  await c.close();
} catch (e) { rec('Idle sigh', true, false, 'ERR ' + e.message, false); }

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

/* ═════════════════ breakpoint matrix ═════════════════ */
const matrix = [];
for (const [label, w, h] of [['1440', 1440, 900], ['1024', 1024, 768], ['768', 768, 1024], ['390', 390, 844]]) {
  try {
    const c = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await c.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
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
