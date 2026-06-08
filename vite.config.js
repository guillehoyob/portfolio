import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const page = (p) => resolve(__dirname, p);

// WHITE NOON portfolio — Vite vanilla multi-page app (MPA).
// Each page is a real, deep-linkable HTML file (clean URLs on Cloudflare Pages).
// CSS is inlined into every page <head> by scripts/build-pages.mjs (no render-
// blocking external stylesheet — §6.4 critical-CSS delivery rule). Vite bundles
// only the deferred JS module (src/main.js) + the Field Conditions / GSAP / Lenis
// graph it pulls in behind flags. Fonts, motifs and references are served from
// /public verbatim so their preload URLs are stable.
export default {
  base: '/',
  appType: 'mpa',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        home: page('index.html'),
        method: page('method.html'),
        cv: page('cv.html'),
        notfound: page('404.html'),
        work: page('work/index.html'),
        ragZelebrix: page('work/rag-zelebrix.html'),
        architectureIdea: page('work/architecture-idea.html'),
        gestampAgents: page('work/gestamp-agents.html'),
        personal: page('work/personal.html'),
      },
    },
  },
};
