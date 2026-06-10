/**
 * WHITE NOON — shared visual-diff helpers for the harness (COMMITTED — INT-6).
 * Port of the Fase-1 audit probe helpers (screenshots/ is gitignored, so the
 * harness can NEVER depend on files there). Dependency-free pixel diffing:
 * PNG buffers are decoded in a throwaway browser page via <canvas> — no
 * pngjs/pixelmatch.
 */

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const VIEW = { width: 1440, height: 900 };

/** Create an in-browser canvas differ + pixel sampler + red-budget mask. */
export async function makeDiffer(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('about:blank');

  /** diff two PNG buffers; optional region {x,y,w,h} in image px. */
  const diff = async (bufA, bufB, region = null) =>
    page.evaluate(async ({ a, b, region }) => {
      const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
      const rx = region ? region.x : 0, ry = region ? region.y : 0;
      const rw = region ? Math.min(region.w, w - rx) : w;
      const rh = region ? Math.min(region.h, h - ry) : h;
      const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); return x.getImageData(rx, ry, rw, rh).data; };
      const da = px(ia), db = px(ib);
      let sum = 0, max = 0, ge4 = 0, ge8 = 0, ge16 = 0, ge32 = 0, maxAt = null;
      const n = rw * rh;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        sum += d;
        if (d > max) { max = d; const p = i / 4; maxAt = [rx + (p % rw), ry + Math.floor(p / rw)]; }
        if (d >= 4) ge4++; if (d >= 8) ge8++; if (d >= 16) ge16++; if (d >= 32) ge32++;
      }
      return { w: rw, h: rh, mean: +(sum / n).toFixed(3), max, maxAt,
        pctGe4: +(100 * ge4 / n).toFixed(3), pctGe8: +(100 * ge8 / n).toFixed(3),
        pctGe16: +(100 * ge16 / n).toFixed(3), pctGe32: +(100 * ge32 / n).toFixed(4) };
    }, { a: bufA.toString('base64'), b: bufB.toString('base64'), region });

  /** sample RGB at [x,y] points of a PNG buffer. */
  const sample = async (buf, points) =>
    page.evaluate(async ({ b, pts }) => {
      const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + s; });
      const img = await load(b);
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      return pts.map(([px, py]) => { const d = x.getImageData(Math.round(px), Math.round(py), 1, 1).data; return [d[0], d[1], d[2]]; });
    }, { b: buf.toString('base64'), pts: points });

  /** % of pixels classified as SIGNAL red (INT-5 nivel 3): R≥160 ∧ R−G≥80 ∧ R−B≥80.
      Excludes --sun gold (R−G≈59) and any ≤6% bounce-light; covers #E8341A + #B3270F. */
  const redMask = async (buf) =>
    page.evaluate(async ({ b }) => {
      const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + s; });
      const img = await load(b);
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, img.width, img.height).data;
      let red = 0;
      const n = img.width * img.height;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] >= 160 && d[i] - d[i + 1] >= 80 && d[i] - d[i + 2] >= 80) red++;
      }
      return { redPct: +(100 * red / n).toFixed(4), n };
    }, { b: buf.toString('base64') });

  return { diff, sample, redMask, close: () => ctx.close() };
}

/** Inject CSS, run fn, remove the CSS again. */
export async function withCss(page, css, fn) {
  const handle = await page.addStyleTag({ content: css });
  await sleep(120);
  const out = await fn();
  await handle.evaluate((el) => el.remove());
  await sleep(120);
  return out;
}

/** crude perceptibility verdict from a layer-isolation diff */
export function verdict(d) {
  if (!d || d.max < 4) return 'INVISIBLE';
  if (d.max < 10) return 'APENAS';
  if (d.max >= 24 && d.pctGe8 >= 0.05) return 'CLARO';
  return 'PERCEPTIBLE';
}

/** the VIS-15 anti-noise protocol: hide every always-moving layer so a diff
    isolates exactly the channel under test. */
export const HIDE_LIVING = `
  .hero__chevron, .wn-status__dot, .fc-spine, .hero__routeband, .fc-sky,
  .fc-ocean, .fc-crosswind, .fc-intensity { visibility: hidden !important; }
`;

/** scroll the full page once (trigger reveals/crack/spine), back to top, settle. */
export async function primeScroll(page) {
  await page.evaluate(async () => {
    const l = window.__wn && window.__wn.lenis;
    const go = (y) => { if (l && l.scrollTo) { try { l.scrollTo(y, { immediate: true }); return; } catch { /* */ } } window.scrollTo(0, y); };
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y <= h; y += 600) { go(y); await new Promise((r) => setTimeout(r, 35)); }
    go(0);
  });
}
