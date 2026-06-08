/**
 * WHITE NOON — static page generator
 * Assembles every page through the shared layout helpers and writes the .html
 * files Vite consumes as MPA inputs. Deterministic (no timestamps) so rebuilds
 * produce identical output. Run: npm run pages (auto-run by pre{dev,build}).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import content from '../src/data/content.js';
import { renderPage, projectPage, renderCvPage, notFoundMain } from '../src/layout.mjs';
import * as home from '../src/pages/home.mjs';
import * as work from '../src/pages/work.mjs';
import * as method from '../src/pages/method.mjs';
import * as personal from '../src/pages/personal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function write(rel, html) {
  const abs = resolve(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, html, 'utf8');
  console.log(`  ✓ ${rel}  (${(html.length / 1024).toFixed(1)} KB)`);
}

const standalone = [
  { file: 'index.html', mod: home },
  { file: 'method.html', mod: method },
  { file: 'work/index.html', mod: work },
  { file: 'work/personal.html', mod: personal },
];
for (const { file, mod } of standalone) {
  write(file, renderPage({ ...mod.meta, main: mod.main, content }));
}

for (const slug of ['rag-zelebrix', 'architecture-idea', 'gestamp-agents']) {
  const proj = content.projects[slug];
  write(
    `work/${slug}.html`,
    renderPage({
      title: `${proj.title} — ${content.identity.name}`,
      description: proj.tagline,
      active: 'Work',
      main: projectPage(proj, content),
      content,
    })
  );
}

write('cv.html', renderCvPage(content));
write(
  '404.html',
  renderPage({
    title: `Not found — ${content.identity.name}`,
    description: 'Page not found.',
    active: '',
    main: notFoundMain(),
    content,
  })
);

console.log('\n  9 pages generated.');
