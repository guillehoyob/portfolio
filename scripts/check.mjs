/* Runtime smoke test: console/page errors on every route + the Crosswind governor fix. */
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4174';
const routes = ['/', '/method.html', '/work/index.html', '/work/rag-zelebrix.html', '/work/architecture-idea.html', '/work/gestamp-agents.html', '/work/personal.html', '/cv.html', '/404.html'];
const browser = await chromium.launch();
const errors = [];
for (const r of routes) {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${r}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${r}: PAGEERROR ${e.message}`));
  await page.goto(base + r, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.close();
}
// Governor: Crosswind must resume after a fast scroll (the blocker fix)
const page = await browser.newPage();
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.mouse.move(400, 300); await page.mouse.move(520, 420); await page.waitForTimeout(300);
const before = await page.$$eval('.fc-crosswind', (els) => els.map((e) => +getComputedStyle(e).opacity));
await page.evaluate(() => window.scrollBy(0, 2500)); await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
await page.mouse.move(300, 300); await page.mouse.move(640, 500); await page.mouse.move(680, 540);
await page.waitForTimeout(500);
const after = await page.$$eval('.fc-crosswind', (els) => els.map((e) => +getComputedStyle(e).opacity));
console.log('crosswind opacity  before:', before, ' after-resume:', after);
const resumed = after.length > 0 && after.every((o) => o > 0.5);
console.log(resumed ? 'GOVERNOR OK — Crosswind resumes after scroll' : 'GOVERNOR FAIL — Crosswind did not resume');
await page.close();
await browser.close();
console.log(errors.length ? 'CONSOLE/PAGE ERRORS:\n' + errors.join('\n') : 'CLEAN — no console/page errors on any route');
