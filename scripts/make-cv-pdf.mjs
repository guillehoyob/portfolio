/**
 * WHITE NOON — CV → PDF generator
 * Renders the built /cv page to a real A4 PDF at public/cv.pdf using the Playwright
 * that already ships as a devDependency (zero new deps). The "Download CV" button
 * serves this file. Run after a build:  npm run build && npm run cv
 *
 * READY FOR THE REAL CV (owner): two ways to ship your real PDF —
 *   1) edit your details in src/data/content.js → renderCvPage, then `npm run cv`
 *      (this regenerates public/cv.pdf from the live CV page), OR
 *   2) just drop your own designed PDF at public/cv.pdf — it overrides this one.
 * Either way the Download button is already wired to /cv.pdf.
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cvHtml = resolve(ROOT, 'dist/cv.html');
if (!existsSync(cvHtml)) {
  console.error('  ! dist/cv.html not found — run `npm run build` first.');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(cvHtml).href, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' }); // the CV page has a clean @media print (no toolbar, A4 margins)
await page.pdf({
  path: resolve(ROOT, 'public/cv.pdf'),
  format: 'A4',
  printBackground: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
});
await browser.close();
console.log('  ✓ public/cv.pdf  (from dist/cv.html — replace with your designed PDF anytime)');
