/* v4c redesign spot-check: spacing/lane, grain tooth, patina creep, work drift. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4178';
const OUT = 'screenshots/verify-v4c';
mkdirSync(OUT, { recursive: true });
const AGED = () => { try { localStorage.setItem('wn.visits', '5'); localStorage.setItem('wn.visited', JSON.stringify(['rag-zelebrix', 'gestamp-agents'])); sessionStorage.setItem('wn.session', '1'); } catch {} };
const browser = await chromium.launch();

const ctx0 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p0 = await ctx0.newPage();
await p0.goto(BASE + '/?fc-hour=13', { waitUntil: 'networkidle' });
await p0.waitForTimeout(1200);
await p0.screenshot({ path: `${OUT}/home_full_1440.png`, fullPage: true });
await ctx0.close();

// aged work cards — patina creep, no badge; plus a card crop for grain
const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx1.addInitScript(AGED);
const p1 = await ctx1.newPage();
await p1.goto(BASE + '/work/index.html?fc-hour=13', { waitUntil: 'networkidle' });
await p1.waitForTimeout(900);
const box = await p1.evaluate(() => { const c = document.querySelector('.wn-card--visited'); if (!c) return null; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), width: Math.min(560, r.width + 24), height: Math.min(440, r.height + 24) }; });
await p1.waitForTimeout(300);
if (box) await p1.screenshot({ path: `${OUT}/aged_card_creep.png`, clip: box });
await p1.screenshot({ path: `${OUT}/work_index_aged.png` });
await ctx1.close();

// work drift — capture mid-scroll (the row should sway). Scroll the work section into view fast.
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage();
await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
await p2.waitForTimeout(500);
await p2.evaluate(() => { const l = window.__wn && window.__wn.lenis; const y = (document.querySelector('#work') || document.body).offsetTop; if (l) l.scrollTo(y - 100, { duration: 0.4 }); else window.scrollTo(0, y - 100); });
await p2.waitForTimeout(120); // catch it mid-sway
const drift = await p2.evaluate(() => [...document.querySelectorAll('#work .workgrid .wn-card')].map((c) => c.style.translate || '0'));
console.log('work-card translate values (mid-scroll):', JSON.stringify(drift));
await p2.screenshot({ path: `${OUT}/work_drift_midscroll.png` });
await ctx2.close();

await browser.close();
console.log('verify-v4c done →', OUT);
