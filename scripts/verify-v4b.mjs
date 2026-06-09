/* v4b spot-check: hour scrubber (?fc-hour=), organic patina, motes on inner pages. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4178';
const OUT = 'screenshots/verify';
mkdirSync(OUT, { recursive: true });
const AGED = () => { try { localStorage.setItem('wn.visits', '5'); localStorage.setItem('wn.visited', JSON.stringify(['rag-zelebrix', 'gestamp-agents'])); sessionStorage.setItem('wn.session', '1'); } catch {} };
const browser = await chromium.launch();

const shot = async (name, url, { aged = false, w = 1440, h = 900, clip = null, wait = 1400 } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  if (aged) await ctx.addInitScript(AGED);
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, ...(clip ? { clip } : {}) });
  // read the tint for the record
  const tint = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fc-tint').trim());
  console.log(name, '| --fc-tint:', tint);
  await ctx.close();
};

await shot('hour_13_hero', '/?fc-hour=13', { clip: { x: 0, y: 0, width: 760, height: 360 } });
await shot('hour_19_hero', '/?fc-hour=19', { clip: { x: 0, y: 0, width: 760, height: 360 } });
await shot('hour_7_dawn', '/?fc-hour=7.5', { clip: { x: 0, y: 0, width: 760, height: 360 } });
await shot('patina_aged_cards', '/work/index.html?fc-hour=13', { aged: true });
// motes on an inner project page — park cursor in the gutter to stir them
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/work/rag-zelebrix.html?fc-hour=19', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  for (let i = 0; i < 12; i++) { await page.mouse.move(45 + (i % 3) * 30, 160 + i * 45, { steps: 2 }); await page.waitForTimeout(30); }
  await page.waitForTimeout(200);
  const count = await page.$$eval('.fc-mote', (e) => e.length);
  console.log('inner-page motes:', count);
  await page.screenshot({ path: `${OUT}/motes_inner_page.png`, clip: { x: 0, y: 0, width: 360, height: 820 } });
  await ctx.close();
}
await browser.close();
console.log('verify-v4b done →', OUT);
