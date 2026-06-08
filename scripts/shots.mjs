/* Visual verification — screenshot key pages at 3 breakpoints (dev only). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE || 'http://localhost:4175';
mkdirSync('shots', { recursive: true });

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'work', path: '/work/index.html' },
  { name: 'project', path: '/work/rag-zelebrix.html' },
  { name: 'method', path: '/method.html' },
  { name: 'personal', path: '/work/personal.html' },
];
const BREAKS = [
  { bp: 'desk', w: 1440, h: 900 },
  { bp: 'tab', w: 820, h: 1100 },
  { bp: 'mob', w: 390, h: 844 },
];
const reduced = process.env.RM === '1';
const only = process.env.ONLY; // e.g. "home" to limit

const browser = await chromium.launch();
for (const p of PAGES) {
  if (only && p.name !== only) continue;
  for (const b of BREAKS) {
    const page = await browser.newPage({
      viewport: { width: b.w, height: b.h }, deviceScaleFactor: 1,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    await page.goto(base + p.path, { waitUntil: 'networkidle' });
    if (!reduced) {
      await page.evaluate(async () => {
        for (let y = 0; y <= document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
        window.scrollTo(0, 0);
      });
    }
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `shots/${p.name}-${b.bp}${reduced ? '-rm' : ''}.png`, fullPage: true });
    console.log('shot', `${p.name}-${b.bp}${reduced ? '-rm' : ''}`);
    await page.close();
  }
}
await browser.close();
console.log('done');
