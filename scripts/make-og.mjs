/**
 * WHITE NOON — social card generator (og-image, 1200×630) · AST-7 composition
 * Renders an on-brand share card with Playwright (already a dev dep — no new deps)
 * and writes public/og-image.png. The card mirrors the hero itself: the name, the
 * day's route 0 threading the air between the lines, the role, the mono ground.
 * Laws honored: warm-white field ≥90%, exactly ONE red route (4px ≈ 0.64%), one
 * gold knot, ink type, real brand fonts (self-hosted SG 700 + Share Tech Mono,
 * embedded as data URIs so the headless page needs zero network). Re-run after a
 * copy change:   node scripts/make-og.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

mkdirSync('public', { recursive: true });

const b64 = (p) => readFileSync(p).toString('base64');
const SG = b64('public/fonts/SpaceGrotesk-700.woff2');
const MONO = b64('public/fonts/ShareTechMono-400.woff2');

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: "Space Grotesk"; font-weight: 700;
    src: url(data:font/woff2;base64,${SG}) format("woff2"); }
  @font-face { font-family: "Share Tech Mono"; font-weight: 400;
    src: url(data:font/woff2;base64,${MONO}) format("woff2"); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body { background: #F7F7F5; color: #1A1917; position: relative; overflow: hidden;
    font-family: "Space Grotesk", system-ui, sans-serif; }
  .name { position: absolute; left: 96px; top: 122px; font-size: 92px; font-weight: 700;
    line-height: 1; letter-spacing: -0.015em; color: #1A1917; white-space: nowrap; }
  .role { position: absolute; left: 96px; top: 342px; font-size: 92px; font-weight: 700;
    line-height: 1; letter-spacing: -0.015em; color: #1A1917; }
  .route { position: absolute; left: 0; top: 0; }
  .foot { position: absolute; left: 96px; top: 560px; font-family: "Share Tech Mono", monospace;
    font-size: 26px; letter-spacing: 0.06em; color: #5A5855; }
</style></head><body>
  <div class="name">Guillermo Hoyo Bravo.</div>
  <svg class="route" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
    <path d="M 0 306 L 392 281 L 817 246 L 1200 222" stroke="#E8341A" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter"/>
    <circle cx="1136" cy="227" r="7" fill="#D2A22A"/>
  </svg>
  <div class="role">GenAI engineer.</div>
  <div class="foot">RAG · MULTI-AGENT · EVALS — MADRID</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(HTML, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// guard: the name must never clip the 1200px frame (the spec's ~92px is a target,
// not a law) — shrink in 2px steps if the brand fonts render wider than expected
await page.evaluate(() => {
  const el = document.querySelector('.name');
  let size = 92;
  while (el.scrollWidth > 1200 - 96 - 40 && size > 72) { size -= 2; el.style.fontSize = size + 'px'; }
});
await page.screenshot({ path: 'public/og-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('og-image written → public/og-image.png (1200×630)');
