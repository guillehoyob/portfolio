/* Visual verification — screenshot key pages from the built site (dev only). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE || 'http://localhost:4173';
mkdirSync('shots', { recursive: true });

const shots = [
  { name: 'home-desktop', path: '/', w: 1440, h: 900, full: true },
  { name: 'home-mobile', path: '/', w: 390, h: 844, full: true },
  { name: 'method', path: '/method.html', w: 1440, h: 900, full: true },
  { name: 'work', path: '/work/index.html', w: 1440, h: 900, full: true },
  { name: 'project', path: '/work/rag-zelebrix.html', w: 1440, h: 900, full: true },
  { name: 'personal', path: '/work/personal.html', w: 1440, h: 900, full: true },
  { name: 'cv', path: '/cv.html', w: 1000, h: 900, full: true },
];

const reduced = process.env.RM === '1';
const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({
    viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await page.goto(base + s.path, { waitUntil: 'networkidle' });
  if (!reduced && s.full) {
    // scroll the page so the Forward-landing reveals actually trigger, then return
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
  }
  await page.waitForTimeout(1500); // let route draw + reveals settle
  await page.screenshot({ path: `shots/${s.name}.png`, fullPage: s.full });
  console.log('shot', s.name);
  await page.close();
}
await browser.close();
console.log('done');
