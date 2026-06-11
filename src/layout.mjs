/**
 * WHITE NOON — layout & component helpers (build-time)
 * One shared library every page renders through, so the nav, footer, head and
 * every component are byte-identical site-wide. renderPage() inlines the whole
 * stylesheet into <head> (no render-blocking external CSS — §6.4) and emits a
 * complete, static document that is finished with all JS off. The deferred
 * /src/main.js module (Vite-bundled) layers interaction + Field Conditions.
 */
import { readFileSync } from 'node:fs';
import fcConfig from './field-conditions/config.js';
import { routeViz, routeHeader, nfRoute } from './data/route-viz.mjs';

/* the hero route-line pool (§5.2) — index 0 ships as the static default */
const routes = JSON.parse(readFileSync(new URL('./field-conditions/routes.json', import.meta.url), 'utf8'));

/* ---- inline the full token→layout CSS cascade (order matters) ----
   field-conditions.css is the living-layer CORE (gates/reveals/dive); the per-plane
   sheets that follow are owned one-per-writer (CONTRACTS §c.1): sky=W1, ocean=W2,
   earth=W3, breath=W4, ui=W0. */
const CSS = ['tokens', 'fonts', 'base', 'components', 'layout', 'field-conditions',
  'fc-sky', 'fc-ocean', 'fc-earth', 'fc-breath', 'fc-ui']
  .map((n) => readFileSync(new URL(`./styles/${n}.css`, import.meta.url), 'utf8'))
  .join('\n');

/* ---- text helpers ---- */
export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s = '') => esc(s).replace(/"/g, '&quot;');
/* escape text, then surface every [PLACEHOLDER …] as a visible honest chip */
export const ph = (s = '') =>
  esc(s).replace(/\[PLACEHOLDER[^\]]*\]/g, (m) => `<span class="placeholder placeholder--inline">${m}</span>`);
/* AST-4 (DC-10) + BREAK-9: the QUIET placeholder — identity-badge rows only. The
   full chip is now a native POPOVER anchored to the chip (Popover API + CSS anchor
   positioning): the honesty device finally speaks on TOUCH and for the KEYBOARD,
   not just on a desktop hover (title= was invisible to both). Verbatim text —
   hierarchized, never hidden (HANDOFF §1 law intact). */
let phN = 0;
export const phQuiet = (s = '') => {
  if (!/\[PLACEHOLDER/.test(s)) return esc(s);
  const id = `ph-${++phN}`;
  return `<button type="button" class="ph-quiet" popovertarget="${id}" style="anchor-name:--${id}">pendiente</button><div id="${id}" popover class="ph-pop" style="position-anchor:--${id}">${esc(s)}</div>`;
};

/* ---- the pre-paint head snippet (grows per Field Conditions stage) ----
   Sets has-js + fc-motion (motion-allowed master gate) BEFORE first paint so
   armed ambient states never flash. Later stages extend it (Heliostat daypart,
   New Route seed, Patina greeting). */
export const prePaint = () => {
  const f = fcConfig.flags;
  // classes applied pre-paint ONLY when motion is allowed (so armed ambient
  // states never flash). Each is additionally gated by its behavior flag.
  const motionCls = [];
  if (f.firstBreath) motionCls.push('fc-firstbreath');
  if (f.newRoute) motionCls.push('fc-route');
  if (f.heroEntrance) motionCls.push('fc-hero');
  const addMotion = motionCls.map((c) => `d.classList.add('${c}');`).join('');
  // Seed the first-party visitor id and the day's route index, pre-paint, so the
  // route arms hidden before first paint (§5.2). Gated by newRoute → flag off
  // produces zero side effects (Patina relies only on wn.visits / wn.visited).
  const seed = f.newRoute
    ? `try{var v=localStorage.getItem('wn.visitor');if(!v){v=(self.crypto&&crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2));localStorage.setItem('wn.visitor',v);}var n=new Date(),ds=n.getFullYear()+'-'+(n.getMonth()+1)+'-'+n.getDate(),k=ds+'|'+v,h=5381,i=0;for(;i<k.length;i++)h=((h<<5)+h+k.charCodeAt(i))>>>0;window.__wnRouteIndex=h%${routes.length};}catch(e){window.__wnRouteIndex=0;}`
    : '';
  // Heliostat daypart is STATE — set pre-paint regardless of reduced motion (§5.1)
  const daypart = f.heliostat
    ? `try{var qh=new URLSearchParams(location.search).get('fc-hour');var hh=(qh!=null&&qh!==''&&!isNaN(+qh))?((+qh%24)+24)%24:new Date().getHours();d.setAttribute('data-daypart',(hh>=5&&hh<9)?'dawn':(hh>=9&&hh<17)?'noon':(hh>=17&&hh<21)?'evening':'night');}catch(e){}`
    : '';
  // Patina: increment visit count once per session (guarded) and set memory
  // classes pre-paint — the return greeting swaps with no content flash (§5.5).
  // Patina visit tiers + a dev/test override: ?wn=return|amp|aged|fresh (or a number),
  // and ?wn=clear to wipe real state. The override is ephemeral (never persisted) — drop
  // the param and the real visit count returns. Lets the owner SEE return-visit gold
  // without the console (which Chrome blocks pasting into).
  const patina = f.patina
    ? `try{var qp=new URLSearchParams(location.search).get('wn');if(qp==='clear'){try{localStorage.removeItem('wn.visits');localStorage.removeItem('wn.visited');sessionStorage.removeItem('wn.session');}catch(e){}}var sv=sessionStorage.getItem('wn.session'),vi=parseInt(localStorage.getItem('wn.visits')||'0',10);if(!sv){vi++;localStorage.setItem('wn.visits',''+vi);sessionStorage.setItem('wn.session','1');}if(qp&&qp!=='clear'){var mp={fresh:1,'return':2,amp:3,aged:5};vi=mp[qp]||parseInt(qp,10)||vi;}if(vi>=2)d.classList.add('fc-return');if(vi>=3)d.classList.add('fc-amp');if(vi>=5)d.classList.add('fc-aged');}catch(e){}`
    : '';
  // INTENSITY pre-paint (INT-2): boost is STATE — the class lands before first paint
  // (tokens.css carries the boost var preset) so a persisted LOUD never flashes subtle.
  // ?wn=boost|subtle are EPHEMERAL scrubbers (never persisted); ?wn=clear wipes the store.
  const intensityState = `try{var qi=new URLSearchParams(location.search).get('wn');if(qi==='clear'){try{localStorage.removeItem('wn.intensity');}catch(e){}}var im=(qi==='boost'||qi==='subtle')?qi:null;if(!im){try{im=localStorage.getItem('wn.intensity');}catch(e){}}if(im==='boost')d.classList.add('fc-boost');}catch(e){}`;
  return `<script>(function(){var d=document.documentElement;d.classList.add('has-js');${intensityState}${daypart}${seed}${patina}try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('fc-motion');${addMotion}}}catch(e){}})();</script>`;
};

/* ---- shared chrome ---- */
export function nav(active = '') {
  const links = [
    ['Work', '/work'],
    ['Method', '/method'],
    ['About', '/#about'],
    ['Contact', '/#contact'],
  ];
  return `<nav class="nav" aria-label="Primary">
  <a class="nav__mark" href="/">Guillermo</a>
  <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu" hidden>
    <span class="nav__toggle-bars" aria-hidden="true"></span>
  </button>
  <div class="nav__links" id="nav-links">
    ${links
      .map(
        ([label, href]) =>
          `<a class="wn-signal-link${active === label ? ' wn-signal-link--active' : ''}" href="${href}"${
            active === label ? ' aria-current="page"' : ''
          }>${label}</a>`
      )
      .join('\n    ')}
  </div>
</nav>`;
}

export function footer(content) {
  const id = content.identity;
  return `<footer class="footer">
  <div class="footer__inner">
    <div class="footer__col footer__links">
      <a class="wn-signal-link wn-signal-link--body footer__mono" href="mailto:${id.email}">${id.email}</a>
      <a class="wn-signal-link wn-signal-link--body footer__mono" href="${id.githubUrl}" rel="me">${id.github}</a>
      <a class="wn-signal-link wn-signal-link--body footer__mono" href="${id.linkedinUrl}" rel="me">${id.linkedin}</a>
    </div>
    <div class="footer__col">
      <p class="footer__colophon">${esc(content.colophon)}</p>
      <p class="wn-status footer__mono" style="margin-top:var(--space-8)">
        <span class="wn-status__dot wn-status__dot--static" aria-hidden="true"></span>${esc(content.footerStatus)}
      </p>
    </div>
  </div>
  <div class="footer__inner"><div class="footer__scanline" style="grid-column:1/-1" aria-hidden="true"></div></div>
</footer>`;
}

/* ---- the full page shell ---- */
export function renderPage({ title, description, active = '', main, content }) {
  return `<!-- GENERATED by scripts/build-pages.mjs — edit src/pages/*.mjs + src/layout.mjs, not this file. -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${escAttr(description)}">
<meta name="author" content="${escAttr(content.identity.name)}">
<meta name="color-scheme" content="light">
<meta property="og:type" content="website">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:image" content="/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escAttr(content.identity.name + ' — GenAI engineer')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(title)}">
<meta name="twitter:description" content="${escAttr(description)}">
<meta name="twitter:image" content="/og-image.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/SpaceGrotesk-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/DMSans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/DMSans-700.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
${prePaint()}
<script type="speculationrules">
{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/*\\\\?*"}}]},"eagerness":"moderate"}],
 "prefetch":[{"where":{"href_matches":"/*"},"eagerness":"conservative"}]}
</script>
</head>
<body>
<div class="fc-tint" aria-hidden="true"></div>
<div class="fc-sun" aria-hidden="true"></div>
<div class="fc-breath-halo" aria-hidden="true"></div>
<div class="fc-bleed" aria-hidden="true"></div>
<svg class="grain" aria-hidden="true" focusable="false" width="100%" height="100%"><filter id="wn-grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#wn-grain)"/></svg>
<a class="skip" href="#main">Skip to content</a>
${nav(active)}
<div class="page">
<main id="main">
${main}
</main>
${footer(content)}
</div>
<script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

/* ============ component helpers ============ */
const BADGE_LABELS = {
  shipped: 'Shipped', progress: 'In Progress', planned: 'Planned',
  lab: 'Lab', archived: 'Archived', open: 'Open to Work',
};
export const statusBadge = (status, label) =>
  `<span class="wn-badge wn-badge--${status}">${esc(label || BADGE_LABELS[status])}</span>`;

/* hero route line — threads BETWEEN the two H1 lines (§3.2). Two precomputed
   variants (desktop 2-turn / mobile 1-turn) under one index, toggled by a CSS
   media query; ships index 0 drawn complete as the static default. New Route
   (§5.2) swaps the day's geometry while the line is armed-invisible. */
const routePaths = (r) =>
  `<path class="route-path route-path--desktop" d="${r.d}" fill="none" stroke="var(--signal)" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/><path class="route-path route-path--mobile" d="${r.m}" fill="none" stroke="var(--signal)" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/>`;
export const heroRoute = () =>
  `<span class="hero__routeband" aria-hidden="true"><svg viewBox="0 0 1440 48" preserveAspectRatio="none">${routePaths(routes[0])}</svg></span>`;

/* scroll cue (§3.16) — a real, keyboard-usable anchor (native jump at Stage 0;
   Lenis smooth-scroll upgrade later). Inner glyph stays decorative. */
export const chevron = () =>
  `<a class="hero__chevron" href="#proof" aria-label="Scroll to content"><svg class="wn-chevron" viewBox="0 0 16 16" width="28" height="28" aria-hidden="true"><path d="M 2 5 L 8 11 L 14 5" fill="none" stroke="var(--signal)" stroke-width="2" stroke-linecap="square"/></svg></a>`;

/* featured work card (§3.5 / §3.6) — viz is the project's OWN route geometry
   (AST-1a, inline SVG via route-viz.mjs), born drawn, never dimmed: the material
   grammar (ink/gold/dashed) already says what shipped and what is still road. */
export function card(p) {
  const href = p.href || `/work/${p.slug}`;
  const planned = p.status === 'lab' || p.status === 'planned';
  return `<a class="wn-card${planned ? ' wn-card--planned' : ''}" href="${href}" data-status="${p.status}">
  <div class="wn-card__head">${statusBadge(p.status)}</div>
  <div class="wn-card__tags">${p.tags.slice(0, 3).map((t) => `<span class="wn-tag">${esc(t)}</span>`).join('')}</div>
  <div class="wn-card__body"><span class="wn-card__title">${esc(p.title)}</span><p class="wn-card__tagline">${ph(p.tagline)}</p></div>
  ${routeViz(p.vizKey || p.slug)}
  <div class="wn-card__foot"><span></span><span class="wn-card__arrow" aria-hidden="true">→</span></div>
</a>`;
}

/* planned-project card (§3.6) — link variant COLLAPSED (AST-3 / DC-06): badge +
   title + clamped HYPOTHESIS + arrow only; the full 4-row detail lives at depth in
   the static hub variant (/work/personal), which stays intact. No viz placeholder:
   a promise gets no picture. */
export function plannedCard(p, { static: isStatic = false } = {}) {
  if (!isStatic) {
    return `<a class="wn-card wn-card--planned" href="/work/personal#${p.slug}" data-status="planned">
  <div class="wn-card__head">${statusBadge('planned')}</div>
  <div class="wn-card__body">
    <span class="wn-card__title">${esc(p.title)}</span>
    <p class="wn-card__microrow wn-card__hyp"><b>HYPOTHESIS:</b> ${ph(p.hypothesis)}</p>
  </div>
  <div class="wn-card__foot"><span></span><span class="wn-card__arrow" aria-hidden="true">→</span></div>
</a>`;
  }
  return `<div class="wn-card wn-card--planned wn-card--static" id="${p.slug}" data-status="planned">
  <div class="wn-card__head">${statusBadge('planned')}</div>
  <div class="wn-card__body">
    <span class="wn-card__title">${esc(p.title)}</span>
    <p class="wn-card__microrow"><b>HYPOTHESIS:</b> ${ph(p.hypothesis)}</p>
    <p class="wn-card__microrow"><b>EXISTS TODAY:</b> ${ph(p.exists)}</p>
    <p class="wn-card__microrow"><b>FIRST MILESTONE:</b> ${ph(p.milestone)}</p>
    <p class="wn-card__microrow"><b>PLANNED START:</b> ${ph(p.plannedStart)}</p>
  </div>
</div>`;
}

export const principleBlock = (p) =>
  `<div class="principle">
  <span class="principle__idx" aria-hidden="true">${esc(p.idx)}</span>
  <div>
    <h3 class="principle__name">${esc(p.name)}</h3>
    <p class="principle__body">${esc(p.body)}</p>
    <p class="principle__prevents"><b>PREVENTS:</b> ${esc(p.prevents)}</p>
  </div>
</div>`;

export const breathLine = (lines) =>
  `<p class="wn-breath">${esc(lines[0])} ${esc(lines[1])}</p>`;

/* the one void band per page (§3.14). bodyHtml is raw HTML.
   VOID-5a: --void-fit caps the word so it ALWAYS fits the band at one line —
   computed 100% at build. BLINDAJE: a flat glyph count (spec divisor 0.50)
   under-caps wide words — GOVERNED/PLATFORM measure 0.607em/glyph in SG 700
   UPPER and overflow at the 288px clamp — so the count is WEIGHTED with the
   font's real advances (measured once, Chromium @100px) + the −0.02em tracking
   + 2% air; the harness law (scrollWidth ≤ clientWidth on all 9 routes,
   CONTRACTS §e.7) prevails. SHIPPED/META/METHOD/404 stay above the clamp →
   rendered byte-identical. Unknown glyph falls back to a wide 0.66em.
   VOID-4: the maki-e dust span rides just above the crack (gold settles on the
   mend, return visits only — CSS in fc-earth). mini → the 404's quieter band. */
const SG_ADV = {
  A: 0.634, B: 0.664, C: 0.644, D: 0.6462, E: 0.554, F: 0.534, G: 0.662, H: 0.656,
  I: 0.264, J: 0.5776, K: 0.626, L: 0.542, M: 0.882, N: 0.67, O: 0.676, P: 0.604,
  Q: 0.676, R: 0.632, S: 0.606, T: 0.588, U: 0.672, V: 0.618, W: 0.898, X: 0.644,
  Y: 0.624, Z: 0.576, 0: 0.648, 1: 0.452, 2: 0.594, 3: 0.608, 4: 0.636, 5: 0.6,
  6: 0.618, 7: 0.554, 8: 0.6, 9: 0.618,
};
const voidWordEm = (w) =>
  [...w.toUpperCase()].reduce((s, ch) => s + (SG_ADV[ch] ?? 0.66), 0) - 0.02 * (w.length - 1);
export const voidBand = ({ word, bodyHtml, crack = true, mini = false }) => {
  const fit = (1 / (voidWordEm(word) * 1.02)).toFixed(4);
  return `<section class="wn-void${mini ? ' wn-void--mini' : ''} bleed" aria-label="${escAttr(word)}">
  <h2 class="wn-void__word" style="--void-fit: calc((100vw - 2 * var(--gutter-page)) * ${fit})">${esc(word)}</h2>
  ${crack ? '<hr class="wn-void__crack" role="presentation">\n  <span class="wn-void__dust" aria-hidden="true"></span>' : ''}
  <div class="wn-void__body">${bodyHtml}</div>
</section>`;
};

/* the claude-collab void band (§3.15) */
export const collabVoid = (project) =>
  voidBand({
    word: project.void,
    bodyHtml: `<div class="collab">
      <div><h3>Claude did</h3><p>${esc(project.collab.claude)}</p></div>
      <div><h3>Guillermo did</h3><p>${esc(project.collab.guillermo)}</p></div>
      <div><h3>One exchange</h3><p>${esc(project.collab.exchange)}</p></div>
    </div>`,
  });

const monolist = (items) =>
  `<ul class="monolist">${items.map((i) => `<li>${ph(i)}</li>`).join('')}</ul>`;

const artifactsList = (items) =>
  `<ul class="artifacts">${items
    .map(
      (a) =>
        `<li><span class="artifacts__label">${esc(a.label)}${a.note ? ` — ${ph(a.note)}` : ''}</span> <span class="artifacts__access">${esc(a.access)}</span></li>`
    )
    .join('')}</ul>`;

/* ---- the project-page template (§4.3 render order), shared by all 3 client pages ---- */
/* Related = two inline cards at half scale (§4.3), not a link list */
export const relatedCards = (slugs, content) =>
  `<div class="related-cards">${slugs
    .map((slug) => {
      const r = content.projects[slug];
      return `<a class="wn-card wn-card--half" href="/work/${slug}" data-status="${r.status}">
    <div class="wn-card__head">${statusBadge(r.status, r.statusLabel)}</div>
    <div class="wn-card__body"><span class="wn-card__title">${esc(r.title)}</span><p class="wn-card__tagline">${esc(r.tagline)}</p></div>
    <div class="wn-card__foot"><span></span><span class="wn-card__arrow" aria-hidden="true">→</span></div>
  </a>`;
    })
    .join('')}</div>`;

export function projectPage(project, content) {
  return `<div class="shell stage"><div class="lane">
  <section class="identity">
    ${routeHeader(project.slug)}
    <h1 class="identity__title">${esc(project.title)}</h1>
    <p class="identity__tagline">${esc(project.tagline)}</p>
    <div class="identity__badges">
      ${statusBadge(project.status, project.statusLabel)}
      <span class="metalabel">LAST UPDATED: ${phQuiet(project.updated)}</span>
      <span class="metalabel">ROLE: ${esc(project.role)}</span>
    </div>
  </section>
  <div class="projbody">
    <p class="prose prose--ghost">${esc(project.clientContext)}</p>
    <h3>Problem</h3>
    <p>${ph(project.problem)}</p>
    <h3>Constraints</h3>
    ${monolist(project.constraints)}
    <h3>Approach</h3>
    ${project.approachHtml}
  </div>
</div></div>

${collabVoid(project)}

<div class="shell stage"><div class="lane">
  <div class="projbody wn-seam wn-seam--postvoid">
    <h3>Stack${project.architecture ? ' &amp; Architecture' : ''}</h3>
    ${monolist(project.stack)}
    ${project.architecture ? `<p style="margin-top:var(--space-6)">${esc(project.architecture)}</p>` : ''}
    <h3>Outcome</h3>
    ${monolist(project.outcome)}
    <h3>Lessons</h3>
    ${monolist(project.lessons)}
    ${project.artifacts && project.artifacts.length ? `<h3>Artifacts</h3>\n    ${artifactsList(project.artifacts)}` : ''}
    <h3>Next</h3>
    ${monolist(project.next)}
    <h3>Related</h3>
    ${relatedCards(project.related, content)}
  </div>
</div></div>`;
}

/* ---- 404 (VOID-7 + HILO-6) ----
   The frayed route is THE one red and THE one movement of the page (it draws,
   reaches nowhere, unravels — "That route was never drawn", now literal). The
   mini void band enters crack-less, its cut delayed 1.2s so the route finishes
   first (entry hierarchy §f.14). The H1 keeps .h2 — modestia intencional. */
export const notFoundMain = () => `<div class="shell stage"><div class="lane">
  <section class="section section--tight">
    <p class="eyebrow">404</p>
    <h1 class="h2">Not found.</h1>
    ${nfRoute()}
  </section>
</div></div>

${voidBand({ word: '404', mini: true, crack: false, bodyHtml: '<p>That route was never drawn. <a class="wn-signal-link" href="/">Back to the field →</a></p>' })}`;

/* ---- the print-ready CV page (/cv) — own shell, no site nav/footer (§ content/cv) ----
   Quiet, utility document; placeholders preserved as chips; @media print = clean A4. */
export function renderCvPage(content) {
  const id = content.identity;
  const cvCss = `
  .cv-wrap { background: var(--field-2); min-height: 100vh; }
  .toolbar { max-width: 820px; margin: 0 auto; padding: var(--space-6) var(--space-8) 0; display: flex; align-items: center; justify-content: space-between; gap: var(--space-6); }
  .toolbar a, .toolbar button { font-family: var(--font-mono); font-size: var(--text-micro); letter-spacing: var(--ls-mono); text-transform: uppercase; color: var(--ink-ghost); background: none; border: 1px solid var(--hairline); border-radius: var(--radius-tag); padding: var(--space-2) var(--space-4); cursor: pointer; text-decoration: none; min-height: 40px; display: inline-flex; align-items: center; }
  .toolbar a:hover, .toolbar button:hover { color: var(--ink); border-color: var(--ink); }
  .sheet { max-width: 820px; margin: var(--space-6) auto var(--space-16); background: var(--field-0); border: 1px solid var(--hairline); padding: var(--space-24) var(--space-16); }
  .cv-name { font-family: var(--font-display); font-weight: 700; font-size: 2.75rem; line-height: 1; letter-spacing: var(--ls-h1); margin: 0; }
  .cv-role { font-family: var(--font-display); font-weight: 500; font-size: var(--text-label); letter-spacing: var(--ls-label); text-transform: uppercase; color: var(--ink); margin: var(--space-4) 0 0; }
  .cv-contact { font-family: var(--font-mono); font-size: var(--text-micro); letter-spacing: var(--ls-mono); color: var(--ink-ghost); margin: var(--space-4) 0 0; }
  .cv-contact a { color: var(--ink-ghost); text-decoration: none; }
  .cv-contact a:hover { color: var(--ink); }
  .cv-rule { height: 1px; background: var(--signal); border: none; margin: var(--space-12) 0; } /* AST-4 (DC-14): the CV's ONE drop of red — full saturation, never amplified */
  .cv-section { margin-top: var(--space-12); }
  .cv-h { font-family: var(--font-display); font-weight: 500; font-size: var(--text-label); letter-spacing: var(--ls-label); text-transform: uppercase; color: var(--ink); margin: 0 0 var(--space-6); padding-bottom: var(--space-3); border-bottom: 1px solid var(--hairline); }
  .cv-p { font-size: var(--text-body); line-height: var(--lh-body); color: var(--ink); margin: 0 0 var(--space-4); max-width: 66ch; }
  .cv-job { margin-bottom: var(--space-8); }
  .cv-job__head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap; }
  .cv-job__title { font-family: var(--font-display); font-weight: 700; font-size: 1.125rem; color: var(--ink); margin: 0; }
  .cv-job__when { font-family: var(--font-mono); font-size: var(--text-micro); letter-spacing: var(--ls-mono); color: var(--ink-ghost); white-space: nowrap; }
  .cv-list { list-style: none; padding: 0; margin: var(--space-4) 0 0; display: flex; flex-direction: column; gap: var(--space-3); }
  .cv-list li { position: relative; padding-left: var(--space-6); font-size: var(--text-body); line-height: var(--lh-body); max-width: 70ch; }
  .cv-list li::before { content: "—"; position: absolute; left: 0; color: var(--ink-ghost); }
  .cv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-8); }
  .cv-skills b { font-weight: 500; }
  .cv-skills p { margin: 0 0 var(--space-3); font-size: var(--text-body); line-height: var(--lh-body); max-width: 66ch; }
  @media (max-width: 640px) { .cv-grid { grid-template-columns: 1fr; } .sheet { padding: var(--space-16) var(--space-8); } }
  @media print {
    .cv-wrap { background: var(--field-0); }
    .toolbar { display: none; }
    .sheet { border: none; margin: 0; max-width: none; padding: 14mm 16mm; }
    @page { margin: 0; }
    .cv-section, .cv-job { break-inside: avoid; }
    .cv-rule { -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* the red survives print/PDF */
  }`;
  return `<!-- GENERATED by scripts/build-pages.mjs — edit src/layout.mjs renderCvPage, not this file. -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(id.name)} — CV</title>
<meta name="description" content="${escAttr(id.name + ' — GenAI engineer. Curriculum vitae.')}">
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/SpaceGrotesk-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/DMSans-400.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}${cvCss}</style>
${prePaint()}
</head>
<body class="cv-wrap">
<a class="skip" href="#cv">Skip to content</a>
<nav class="toolbar" aria-label="CV utilities">
  <a href="/">← Back to portfolio</a>
  <button type="button" data-print>Print / Save as PDF</button>
</nav>
<main class="sheet" id="cv">
  <header>
    <h1 class="cv-name">${esc(id.name)}</h1>
    <p class="cv-role">GenAI Engineer — Madrid, Spain</p>
    <p class="cv-contact">
      <a href="mailto:${id.email}">${id.email}</a> ·
      <a href="${id.githubUrl}">${id.github}</a> ·
      <a href="${id.linkedinUrl}">${id.linkedin}</a>
    </p>
  </header>
  <hr class="cv-rule">
  <section class="cv-section">
    <h2 class="cv-h">Professional summary</h2>
    <p class="cv-p">GenAI engineer with around two years building production AI systems. I design, build, evaluate, and lead RAG architecture and multi-agent orchestration — from retrieval pipelines and ingestion libraries to evaluation suites that gate every deploy. I work AI-pair-engineering as a documented method: I direct the design and review the build commit by commit, so the human owns the decisions and the AI accelerates the work.</p>
  </section>
  <section class="cv-section">
    <h2 class="cv-h">Experience</h2>
    <div class="cv-job">
      <div class="cv-job__head"><h3 class="cv-job__title">AI Engineer — IDEA</h3><span class="cv-job__when">${ph('[PLACEHOLDER — dates to confirm]')}</span></div>
      <p class="cv-p">Sole AI engineer at IDEA: designed, built, and leads the company’s production RAG platform.</p>
      <ul class="cv-list">
        <li>Designed, built, and now lead a production RAG platform on Docker, Azure CI/CD, PostgreSQL, and Qdrant, with an endpoint factory and reusable ingestion/retrieval libraries so new assistants ship from shared components.</li>
        <li>Integrated a RAGAS evaluation module and Langfuse observability so retrieval and answer quality are measured, not assumed.</li>
        <li>Shipped two assistants to production — an HR assistant and an electrical-engineering-rules assistant — with strong measured results ${ph('[PLACEHOLDER — metrics to confirm]')}.</li>
        <li>Mentor an engineer building a LangGraph agent on the platform.</li>
      </ul>
    </div>
    <div class="cv-job">
      <div class="cv-job__head"><h3 class="cv-job__title">RAG Chatbot Lead (AI-assisted) — Zelebrix</h3><span class="cv-job__when">${ph('[PLACEHOLDER — ongoing, to confirm]')}</span></div>
      <p class="cv-p">Joined to lead one AI feature — a RAG chatbot for a multi-tenant payments SaaS. Built and validated; scheduled to deploy to production in ${ph('[PLACEHOLDER — target window, ~a few months]')}. Ongoing collaboration, role still being defined (currently unpaid).</p>
      <ul class="cv-list">
        <li>Designed and led the build of the RAG chatbot, AI-assisted and reviewed commit by commit.</li>
        <li>Built hybrid retrieval: dense pgvector plus Spanish Postgres full-text search, fused with Reciprocal Rank Fusion, then a cross-encoder reranker and a relevance gate.</li>
        <li>Designed privacy-by-design: PII scrubbing before the LLM, and data queries executed locally so the external LLM never sees tenant data — a boundary that holds by construction.</li>
        <li>Built a custom evaluation suite — a 150-question golden set, a retrieval probe, and a RAGAS-lite scorer — and an LLM benchmark that showed with data the bottleneck was retrieval (synonyms), not the generation model.</li>
      </ul>
    </div>
    <div class="cv-job">
      <div class="cv-job__head"><h3 class="cv-job__title">Data Scientist, GenAI — Gestamp, Madrid</h3><span class="cv-job__when">03/2024 – Present</span></div>
      <ul class="cv-list">
        <li>Extended a production multi-agent system on Semantic Kernel; added plugins for Text-to-SQL (Databricks), document extraction (Azure Blob Storage), translation, SharePoint lookup, and a Service Desk SOAP service in under four weeks.</li>
        <li>Built a Text-to-SQL agent with an enriched metadata layer and a custom evaluation framework with a golden dataset — 100% accuracy on controlled tests before every deploy. Implemented RBAC impersonation so every query runs under the requesting user’s identity.</li>
        <li>Built FastAPI endpoints with async token streaming, Pydantic-validated I/O, selective per-plugin memory (MongoDB), and end-to-end impersonation; deployed via Azure DevOps CI/CD to AKS.</li>
        <li>Contributed to a hybrid RAG pipeline on Azure AI Search (semantic + BM25 + cross-encoder reranking) with permission-aware retrieval; reviewed intern PRs and set plugin contribution criteria.</li>
      </ul>
    </div>
    <div class="cv-job">
      <div class="cv-job__head"><h3 class="cv-job__title">Data Analyst — FTI Consulting, Madrid</h3><span class="cv-job__when">01/2024 – 03/2024</span></div>
      <ul class="cv-list">
        <li>Automated data cleaning and processing for large datasets with Python and KNIME; researched OCR digitisation (Pytesseract, OpenCV, Azure AI Studio).</li>
      </ul>
    </div>
  </section>
  <section class="cv-section">
    <h2 class="cv-h">Education</h2>
    <ul class="cv-list">
      <li><b>MSc in Data Science</b> — Autonomous University of Madrid (UAM), 2021–2023. GPA 7.63/10. Time-series forecasting, deep learning, NLP, optimization.</li>
      <li><b>BSc in Computer Engineering</b> — UAM, 2016–2021. Erasmus at the University of Bergen, Norway. GPA 7.03/10.</li>
    </ul>
  </section>
  <div class="cv-grid">
    <section class="cv-section">
      <h2 class="cv-h">Certifications</h2>
      <ul class="cv-list">
        <li>Hugging Face — “Fine-tuning Language Models” (Oct 2025)</li>
        <li>AlgoExpert — “Machine Learning Expert” (Sep 2025)</li>
      </ul>
    </section>
    <section class="cv-section">
      <h2 class="cv-h">Languages</h2>
      <ul class="cv-list">
        <li>Spanish — native</li>
        <li>English — B2; bilingual education, Erasmus in Norway</li>
        <li>Vietnamese — learning</li>
      </ul>
    </section>
  </div>
  <section class="cv-section cv-skills">
    <h2 class="cv-h">Skills</h2>
    <p><b>GenAI &amp; RAG:</b> Semantic Kernel, Azure OpenAI, hybrid RAG (vector + BM25 + reranking), multi-agent orchestration, prompt engineering, RAGAS evaluation, cross-encoder rerankers, Reciprocal Rank Fusion, LangGraph, Langfuse.</p>
    <p><b>Cloud &amp; Data:</b> Azure (AI Search, Blob Storage, Key Vault, Document Intelligence, AKS, DevOps), Databricks, Docker, CI/CD, PostgreSQL/pgvector, Qdrant.</p>
    <p><b>Programming:</b> Python (FastAPI, Pandas, PySpark, Scikit-learn), SQL, Power BI.</p>
  </section>
</main>
<script type="module" src="/src/main.js"></script>
</body>
</html>`;
}
