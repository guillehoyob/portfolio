/* Runtime smoke test: console errors on every route + the level-up interactions. */
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4178';
const routes = ['/', '/method.html', '/work/index.html', '/work/rag-zelebrix.html', '/work/architecture-idea.html', '/work/gestamp-agents.html', '/work/personal.html', '/cv.html', '/404.html'];
const browser = await chromium.launch();
const errors = [];
for (const r of routes) {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${r}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${r}: PAGEERROR ${e.message}`));
  await page.goto(base + r, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.close();
}

// hero H1 must be fully visible after the entrance settles (never stuck hidden)
const home = await browser.newPage();
await home.goto(base + '/', { waitUntil: 'networkidle' });
await home.waitForTimeout(1800);
const h1op = await home.$eval('.hero__h1', (el) => +getComputedStyle(el).opacity);
const h1txt = await home.$eval('.hero__h1', (el) => el.textContent.trim());
console.log('hero h1 opacity:', h1op, '| text:', JSON.stringify(h1txt.slice(0, 40)));
// chevron exits on first scroll
const chBefore = await home.$$eval('.hero__chevron', (e) => e.length);
await home.evaluate(() => window.scrollBy(0, 600));
await home.waitForTimeout(700);
const chAfter = await home.$$eval('.hero__chevron', (e) => e.length);
console.log('chevron before scroll:', chBefore, '| after scroll:', chAfter, chAfter === 0 ? '(exited ✓)' : '(still present)');
await home.close();

// work filter: "Planned" must keep the Next-up planned row visible
const work = await browser.newPage();
await work.goto(base + '/work/index.html', { waitUntil: 'networkidle' });
await work.waitForTimeout(700);
await work.click('.filter[data-filter="shipped"]');
await work.waitForTimeout(500);
const nextVisible = await work.$$eval('.nextup .wn-card', (cards) => cards.filter((c) => getComputedStyle(c).display !== 'none' && +getComputedStyle(c).opacity > 0).length);
console.log('Next-up planned cards visible under "Shipped" filter:', nextVisible, nextVisible === 3 ? '(never hidden ✓)' : '(REGRESSION)');
await work.close();

// reduced-motion home: hero complete
const rm = await browser.newPage({ reducedMotion: 'reduce' });
await rm.goto(base + '/', { waitUntil: 'networkidle' });
await rm.waitForTimeout(600);
const rmH1 = await rm.$eval('.hero__h1', (el) => +getComputedStyle(el).opacity);
console.log('reduced-motion hero h1 opacity:', rmH1, rmH1 === 1 ? '(complete ✓)' : '(STUCK HIDDEN)');
await rm.close();

await browser.close();
console.log('\n' + (errors.length ? 'CONSOLE/PAGE ERRORS:\n' + errors.join('\n') : 'CLEAN — no console/page errors on any route'));
