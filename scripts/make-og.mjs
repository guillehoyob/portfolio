/**
 * WHITE NOON — social card generator (og-image, 1200×630)
 * Renders an on-brand share card with Playwright (already a dev dep — no new deps)
 * and writes public/og-image.png. Honors the law: warm-white field ≥90%, exactly
 * ONE red signal, one teal "open to work" pulse, ink type. Re-run after a copy change:
 *   node scripts/make-og.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('public', { recursive: true });

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #F7F7F5; color: #1A1917; position: relative; overflow: hidden;
    font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
    padding: 84px 96px; display: flex; flex-direction: column; justify-content: space-between;
  }
  .eyebrow { font-size: 22px; letter-spacing: 3px; text-transform: uppercase; color: #5A5855; font-weight: 600; display: flex; align-items: center; gap: 14px; }
  .dot { width: 13px; height: 13px; border-radius: 50%; background: #00C2D4; display: inline-block; }
  .h1 { font-size: 132px; line-height: 0.96; font-weight: 800; letter-spacing: -3px; margin-top: 30px; }
  .route { position: absolute; left: 96px; top: 372px; }
  .foot { font-size: 25px; letter-spacing: 0.5px; color: #5A5855; display: flex; gap: 26px; align-items: baseline; }
  .foot b { color: #1A1917; font-weight: 700; }
  .sig { color: #E8341A; }
</style></head><body>
  <div>
    <div class="eyebrow"><span class="dot"></span> Guillermo Hoyo Bravo &nbsp;·&nbsp; Open to work</div>
    <div class="h1">GenAI<br>engineer<span class="sig">.</span></div>
  </div>
  <svg class="route" width="640" height="40" viewBox="0 0 640 40" fill="none">
    <path d="M0 30 L520 8" stroke="#E8341A" stroke-width="4" stroke-linecap="square"/>
  </svg>
  <div class="foot"><span><b>RAG</b> &amp; multi-agent systems in production</span><span>·</span><span>built with Claude</span><span>·</span><span><b>github.com/guillehoyob</b></span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(HTML, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'public/og-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log('og-image written → public/og-image.png (1200×630)');
