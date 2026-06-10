/**
 * WHITE NOON — font subsetting (free, no Python)
 * Subsets + instances the four source TTFs (src/fonts-src) to the seven
 * latin woff2 faces the design system uses, writing them to public/fonts.
 * Uses subset-font (harfbuzz/wasm). Run: npm run fonts
 *
 * Subset = latin (U+0020–00FF) + the typographic punctuation and the → glyph
 * the copy actually uses (§6.5). Variable faces are pinned to a single weight.
 */
import subsetFont from 'subset-font';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '../src/fonts-src');
const OUT = resolve(__dirname, '../public/fonts');

// Build the keep-set: ASCII printable + Latin-1 supplement + the exact
// extra codepoints the copy uses.
const cp = [];
for (let c = 0x20; c <= 0x7e; c++) cp.push(c);   // ASCII printable
for (let c = 0xa0; c <= 0xff; c++) cp.push(c);   // Latin-1 supplement (accents)
const extras = [
  0x2013, 0x2014,                 // – —
  0x2018, 0x2019, 0x201a,         // ' ' ‚
  0x201c, 0x201d, 0x201e,         // " " „
  0x2026,                         // …
  0x2192,                         // →  (CTA + card arrow)
  0x25cf,                         // ●  (status dot, belt-and-braces)
];
const text = [...cp, ...extras].map((c) => String.fromCodePoint(c)).join('');

const faces = [
  // BREAK-3: ONE variable face (wght 500–700 kept live) replaces the two static
  // SG instances — the display voice can now BREATHE its weight with the field
  // (fc-breath.css couples 'wght' to --fc-breath; ±14 max, reflow-safe)
  { src: 'SpaceGrotesk.ttf',              out: 'SpaceGrotesk-var.woff2',            axes: { wght: { min: 500, max: 700 } } },
  { src: 'DMSans.ttf',                    out: 'DMSans-400.woff2',                  axes: { wght: 400 } },
  { src: 'DMSans.ttf',                    out: 'DMSans-500.woff2',                  axes: { wght: 500 } },
  { src: 'DMSans.ttf',                    out: 'DMSans-700.woff2',                  axes: { wght: 700 } },
  { src: 'ShareTechMono.ttf',             out: 'ShareTechMono-400.woff2',           axes: null },
  { src: 'CormorantGaramond-Italic.ttf',  out: 'CormorantGaramond-300-italic.woff2', axes: { wght: 300 } },
];

async function run() {
  await mkdir(OUT, { recursive: true });
  let total = 0;
  for (const face of faces) {
    const buf = await readFile(resolve(SRC, face.src));
    const opts = { targetFormat: 'woff2' };
    if (face.axes) opts.variationAxes = face.axes;
    let subset;
    try {
      subset = await subsetFont(buf, text, opts);
    } catch (err) {
      // Fallback: if axis instancing is unsupported, subset without pinning.
      console.warn(`  ! instancing failed for ${face.out} (${err.message}); subsetting without pin`);
      subset = await subsetFont(buf, text, { targetFormat: 'woff2' });
    }
    await writeFile(resolve(OUT, face.out), subset);
    total += subset.length;
    console.log(`  ✓ ${face.out.padEnd(34)} ${(subset.length / 1024).toFixed(1)} KB`);
  }
  console.log(`\n  total font payload: ${(total / 1024).toFixed(1)} KB  (budget < 220 KB)`);
  if (total > 220 * 1024) console.warn('  ! over the 220 KB font budget — review §6.4');
}

run().catch((e) => { console.error(e); process.exit(1); });
