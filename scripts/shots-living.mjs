/* Capture screenshots of the strengthened living layer for self-review + critique. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4178';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

const shot = async (name, { w = 1440, h = 900, url = '/', visits = 0, visited = null, scrollTo = 0, wait = 1500 } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  if (visits || visited) {
    await ctx.addInitScript(([v, seen]) => {
      try {
        if (v) { localStorage.setItem('wn.visits', String(v)); sessionStorage.setItem('wn.session', '1'); }
        if (seen) localStorage.setItem('wn.visited', JSON.stringify(seen));
      } catch {}
    }, [visits, visited]);
  }
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (scrollTo) { await page.evaluate((y) => { const l = window.__wn && window.__wn.lenis; if (l) l.scrollTo(y, { duration: 0.6 }); else window.scrollTo(0, y); }, scrollTo); }
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log('shot:', name);
};

await shot('home_1440_hero', { scrollTo: 0 });
await shot('home_1440_scroll', { scrollTo: 1400 });   // spine drawn + work section
await shot('home_1440_void', { scrollTo: 2600 });     // the void band
await shot('home_1440_void_aged', { scrollTo: 2600, visits: 5, visited: ['rag-zelebrix'] }); // kintsugi seam
await shot('home_768', { w: 768, h: 1024, scrollTo: 0 });
await shot('home_390', { w: 390, h: 844, scrollTo: 0 });
await shot('work_1440_aged', { url: '/work/index.html', visits: 5, visited: ['rag-zelebrix', 'gestamp-agents'], wait: 1200 });

await browser.close();
console.log('done');
