/**
 * WHITE NOON — FASE 1 instrumentation probe (READ-ONLY, deterministic)
 * Collects hard numbers + targeted crops for every "no veo X" symptom, so the
 * audit rests on measured pixels/computed-styles, not vibes. Dependency-free
 * (computed CSS custom props + DOM + clip screenshots). Writes:
 *   screenshots/audit/probe.json   + labelled crops in screenshots/audit/
 * Needs the preview up:  npx vite preview --port 4178 --strictPort
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4178';
const OUT = 'screenshots/audit';
mkdirSync(OUT, { recursive: true });
const HOME = BASE + '/';
const WORK = BASE + '/work/index.html';

const SHIFT_HOUR = (hourFloat) => {
  const Real = Date; const now0 = Real.now(); const tgt = new Real(now0);
  tgt.setHours(Math.floor(hourFloat), Math.round((hourFloat % 1) * 60), 0, 0);
  const OFFSET = tgt.getTime() - now0;
  function F(...a) { if (!(this instanceof F)) return new Real(Real.now() + OFFSET).toString(); return a.length ? new Real(...a) : new Real(Real.now() + OFFSET); }
  F.prototype = Real.prototype; F.now = () => Real.now() + OFFSET; F.parse = Real.parse; F.UTC = Real.UTC;
  window.Date = F;
};
const AGED = () => { try { localStorage.setItem('wn.visits', '5'); localStorage.setItem('wn.visited', JSON.stringify(['rag-zelebrix', 'gestamp-agents'])); sessionStorage.setItem('wn.session', '1'); } catch {} };

const browser = await chromium.launch();
const desk = { width: 1440, height: 900 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = {};

/* ── 1. SKY: heliostat tint across the day (incl. the invisible 17:00) ───────── */
report.sky = {};
for (const h of [8, 13, 16, 17, 18, 19.5, 23]) {
  const ctx = await browser.newContext({ viewport: desk });
  await ctx.addInitScript(SHIFT_HOUR, h);
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await sleep(500);
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      daypart: document.documentElement.getAttribute('data-daypart'),
      fcTint: cs.getPropertyValue('--fc-tint').trim(),
      fcSkyHue: cs.getPropertyValue('--fc-sky-hue').trim(),
      fcField: cs.getPropertyValue('--fc-field').trim(),
      pulseAlpha: cs.getPropertyValue('--fc-pulse-alpha').trim(),
      // composited tint element actual paint:
      tintBg: (() => { const t = document.querySelector('.fc-tint'); return t ? getComputedStyle(t).backgroundColor : 'no .fc-tint el'; })(),
    };
  });
  await page.screenshot({ path: `${OUT}/sky_h${String(h).replace('.', '_')}_topband.png`, clip: { x: 0, y: 0, width: 760, height: 240 } });
  report.sky[`h${h}`] = r;
  await ctx.close();
}

/* ── 2. AIR: motes — count, colour, blend, opacity range (golden? glowing?) ──── */
{
  const ctx = await browser.newContext({ viewport: desk });
  await ctx.addInitScript(SHIFT_HOUR, 13);
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await sleep(400);
  const rest = await page.evaluate(() => {
    const motes = [...document.querySelectorAll('.fc-mote')];
    const s = motes.slice(0, 4).map((m) => { const c = getComputedStyle(m); return { opacity: +c.opacity, bg: c.backgroundImage.slice(0, 90), blend: c.mixBlendMode, w: c.width, z: c.zIndex }; });
    return { count: motes.length, samples: s, skyHue: getComputedStyle(document.documentElement).getPropertyValue('--fc-sky-hue').trim() };
  });
  // stir: fast cursor sweeps through the gutter, sample peak opacity reached
  let peak = 0;
  for (let i = 0; i < 14; i++) { await page.mouse.move(40 + (i % 3) * 30, 150 + i * 40, { steps: 2 }); peak = Math.max(peak, await page.evaluate(() => Math.max(...[...document.querySelectorAll('.fc-mote')].map((m) => +getComputedStyle(m).opacity || 0)))); await sleep(35); }
  report.motes = { ...rest, peakOpacityOnCursor: +peak.toFixed(3) };
  await page.screenshot({ path: `${OUT}/motes_gutter.png`, clip: { x: 0, y: 0, width: 320, height: 760 } });
  await ctx.close();
}

/* ── 3. OCEAN: ring character — calm tap vs after fast movement ──────────────── */
{
  const measure = async (energetic) => {
    const ctx = await browser.newContext({ viewport: desk });
    await ctx.addInitScript(SHIFT_HOUR, 13);
    const page = await ctx.newPage();
    await page.goto(HOME, { waitUntil: 'networkidle' });
    await sleep(400);
    if (energetic) { for (let i = 0; i < 16; i++) { await page.mouse.move(300 + i * 40, 300 + (i % 2) * 120, { steps: 1 }); await sleep(8); } }
    const energy = await page.evaluate(() => { try { return null; } catch { return null; } }); // field not on window; inferred via ring vars
    await page.mouse.move(720, 460, { steps: energetic ? 1 : 3 });
    await page.mouse.down(); await page.mouse.up();
    await sleep(60);
    const r = await page.evaluate(() => {
      const rings = [...document.querySelectorAll('.fc-ocean__ring')];
      return {
        count: rings.length,
        rings: rings.map((ring) => { const c = getComputedStyle(ring); return { scale: ring.style.getPropertyValue('--fc-ring-scale'), op: ring.style.getPropertyValue('--fc-ring-op'), dur: ring.style.getPropertyValue('--fc-ring-dur'), border: c.borderColor, curOpacity: +c.opacity }; }),
      };
    });
    await page.screenshot({ path: `${OUT}/ocean_${energetic ? 'energetic' : 'calm'}.png`, clip: { x: 560, y: 300, width: 360, height: 320 } });
    await ctx.close();
    return r;
  };
  report.ocean = { calm: await measure(false), energetic: await measure(true) };
}

/* ── 4. THREAD: spine bend axis (X vs Y) + nib drawing/rest ──────────────────── */
{
  const ctx = await browser.newContext({ viewport: desk });
  await ctx.addInitScript(SHIFT_HOUR, 13);
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await sleep(500);
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(1400, { duration: 0.5 }); else window.scrollTo(0, 1400); });
  await sleep(900);
  const samplePath = () => page.evaluate(() => { const p = document.querySelector('.fc-spine__path'); const L = p.getTotalLength(); const out = []; for (let i = 0; i <= 12; i++) { const q = p.getPointAtLength((i / 12) * L); out.push([+q.x.toFixed(1), +q.y.toFixed(1)]); } return out; });
  // cursor at two X, SAME screen Y → expect horizontal bulge, no vertical move
  await page.mouse.move(700, 430, { steps: 6 }); await sleep(700); const aRight = await samplePath();
  await page.mouse.move(90, 430, { steps: 8 }); await sleep(800); const aLeft = await samplePath();
  // cursor at two Y, SAME X → does the bulge LOCATION track cursor Y?
  await page.mouse.move(120, 220, { steps: 6 }); await sleep(700); const bTop = await samplePath();
  await page.mouse.move(120, 760, { steps: 6 }); await sleep(800); const bBot = await samplePath();
  const maxAbsDelta = (p, q, idx) => Math.max(...p.map((pt, i) => Math.abs(pt[idx] - q[i][idx])));
  // nib
  await page.evaluate(() => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(2600, { duration: 0.6 }); else window.scrollTo(0, 2600); });
  let nibPeak = 0; for (let i = 0; i < 12; i++) { nibPeak = Math.max(nibPeak, await page.evaluate(() => +document.querySelector('.fc-spine__pulse').style.opacity || 0)); await sleep(55); }
  await sleep(900); const nibRest = await page.evaluate(() => +document.querySelector('.fc-spine__pulse').style.opacity || 0);
  report.spine = {
    bendX_dx: +maxAbsDelta(aRight, aLeft, 0).toFixed(1),   // horizontal displacement range (expected > 0)
    bendX_dy: +maxAbsDelta(aRight, aLeft, 1).toFixed(1),   // vertical displacement when only X changes (expected ≈ 0)
    bendY_dx: +maxAbsDelta(bTop, bBot, 0).toFixed(1),      // how bulge x changes as cursor Y moves
    bendY_dy: +maxAbsDelta(bTop, bBot, 1).toFixed(1),      // vertical change as cursor Y moves (expected ≈ 0: pts are fixed-Y)
    nibPeak: +nibPeak.toFixed(3), nibRest: +nibRest.toFixed(3),
  };
  await ctx.close();
}

/* ── 5. EARTH: card moss on the aged state (does the musgo render & read?) ───── */
{
  const ctx = await browser.newContext({ viewport: desk });
  await ctx.addInitScript(SHIFT_HOUR, 13);
  await ctx.addInitScript(AGED);
  const page = await ctx.newPage();
  await page.goto(WORK, { waitUntil: 'networkidle' });
  await sleep(500);
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const ticks = [...document.querySelectorAll('.wn-card__patina')];
    const visited = [...document.querySelectorAll('.wn-card--visited')];
    const t0 = ticks[0];
    const rect = t0 ? t0.getBoundingClientRect() : null;
    return {
      moss: cs.getPropertyValue('--moss').trim(), mossDeep: cs.getPropertyValue('--moss-deep').trim(), hairline: cs.getPropertyValue('--hairline').trim(),
      visitedCards: visited.length, patinaTicks: ticks.length,
      tick0: t0 ? { opacity: +getComputedStyle(t0).opacity, display: getComputedStyle(t0).display, w: rect && +rect.width.toFixed(1), h: rect && +rect.height.toFixed(1), onScreen: rect && rect.top < innerHeight && rect.top > -50 } : null,
      visitedBorder: visited[0] ? getComputedStyle(visited[0]).borderColor : null,
      isReturn: document.documentElement.classList.contains('fc-return'),
      isAged: document.documentElement.classList.contains('fc-aged'),
    };
  });
  // crop the first visited card if on screen
  const box = await page.evaluate(() => { const c = document.querySelector('.wn-card--visited'); if (!c) return null; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(520, r.width + 20), height: Math.min(360, r.height + 20) }; });
  await sleep(300);
  if (box) await page.screenshot({ path: `${OUT}/earth_aged_card.png`, clip: box });
  report.earth = r;
  await ctx.close();
}

/* ── 6. TEMPORAL: idle sigh amplitude + breath↔heart coupling ────────────────── */
{
  const ctx = await browser.newContext({ viewport: desk });
  await ctx.addInitScript(SHIFT_HOUR, 13);
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: 'networkidle' });
  await sleep(8600); // past the 8s idle threshold — DO NOT move/scroll
  let hazePeak = 0, spineBreathPeak = 0, dotBeatRange = [9, -9];
  for (let i = 0; i < 28; i++) {
    const s = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const sp = document.querySelector('.fc-spine');
      const dot = document.querySelector('.hero .wn-status__dot');
      return {
        haze: +root.getPropertyValue('--fc-haze-opacity') || 0.05,
        spineBreath: sp ? (+getComputedStyle(sp).getPropertyValue('--fc-spine-breath') || 0) : 0,
        dotBeat: dot ? (+getComputedStyle(dot).getPropertyValue('--fc-dot-beat') || 0) : 0,
      };
    });
    hazePeak = Math.max(hazePeak, s.haze);
    spineBreathPeak = Math.max(spineBreathPeak, s.spineBreath);
    dotBeatRange[0] = Math.min(dotBeatRange[0], s.dotBeat); dotBeatRange[1] = Math.max(dotBeatRange[1], s.dotBeat);
    await sleep(130);
  }
  report.temporal = { idleHazePeak: +hazePeak.toFixed(4), idleHazeDelta: +(hazePeak - 0.05).toFixed(4), spineBreathPeak: +spineBreathPeak.toFixed(3), dotBeatRange: dotBeatRange.map((v) => +v.toFixed(3)) };
  await ctx.close();
}

writeFileSync(`${OUT}/probe.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report, null, 2));
console.log('\nprobe done →', OUT + '/probe.json');
