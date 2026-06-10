/**
 * WHITE NOON — route-viz: the per-project route geometries (AST-1a / AST-2 / HILO-6)
 * Build-time inline SVG. The MATERIAL GRAMMAR (the law, AST-1a):
 *   recorrido = tinta  (--ink, square/miter — the road actually walked)
 *   entregado = oro    (--gold-deep overlay + knot — only what SHIPPED is gilded)
 *   futuro    = hairline discontinua 4 6 (announced, not walked)
 *   rojo      = EXCLUSIVAMENTE prospectivo y por acto deliberado:
 *               cards → .route-head ignites on :hover/:focus-visible only (rest red = CERO);
 *               headers → .route-headdot on the two IN-PROGRESS projects only
 *               (gestamp/this-portfolio ship NO red here: the spine IS the page's red).
 * Styling lives in components.css (static grammar) + fc-earth.css (draw-in).
 * data-head-y on each header = where the route enters at x=0, as a fraction of the
 * 240 viewBox height — spine.js (W2) reads it for the baton-pass (CONTRACTS §c.4.4).
 */

/* ---- the 5 card geometries (320×180, field-2 ground) ---- */
const CARD_VIZ = {
  /* dos corrientes que se funden — dense + lexical retrieval fusing into one route;
     built+validated segment gilded; the deploy still ahead (dashed); head ignitable */
  'rag-zelebrix': `
    <path class="route-main" d="M 0 56 L 96 70 L 178 96" />
    <path class="route-main" d="M 0 140 L 90 122 L 178 96" />
    <path class="route-main" d="M 178 96 L 236 88" />
    <path class="route-gold" d="M 178 96 L 236 88" />
    <path class="route-ahead" d="M 236 88 L 320 76" />
    <circle class="route-head" cx="236" cy="88" r="3" />`,
  /* el tronco que se bifurca — one platform trunk, two assistants live (2 gold tips);
     the third route (LangGraph) announced dashed; head at the platform core */
  'architecture-idea': `
    <path class="route-main" d="M 0 120 L 120 110 L 168 100" />
    <path class="route-main" d="M 168 100 L 268 56" />
    <path class="route-main" d="M 168 100 L 262 132" />
    <path class="route-ahead" d="M 168 100 L 320 100" />
    <circle class="route-knot" cx="268" cy="56" r="2.5" />
    <circle class="route-knot" cx="262" cy="132" r="2.5" />
    <circle class="route-head" cx="168" cy="100" r="3" />`,
  /* 5 nudos, ruta sellada en oro — five plugins as knots; shipped = the whole
     walked route is gilded shut. No future, no head: the work is sealed. */
  'gestamp-agents': `
    <path class="route-main" d="M 0 130 L 48 122 L 104 112 L 160 100 L 216 92 L 272 78 L 320 70" />
    <path class="route-gold" d="M 0 130 L 48 122 L 104 112 L 160 100 L 216 92 L 272 78 L 320 70" />
    <circle class="route-knot" cx="48" cy="122" r="2.5" />
    <circle class="route-knot" cx="104" cy="112" r="2.5" />
    <circle class="route-knot" cx="160" cy="100" r="2.5" />
    <circle class="route-knot" cx="216" cy="92" r="2.5" />
    <circle class="route-knot" cx="272" cy="78" r="2.5" />`,
  /* this portfolio — la ruta 0 del pool del hero, ×0.222x / ×3.75y (the site you are
     reading IS the route); the final climb gilded, knot at the shipped end */
  'this-portfolio': `
    <path class="route-main" d="M 0 150 L 104.34 112.5 L 217.56 60 L 319.68 22.5" />
    <path class="route-gold" d="M 217.56 60 L 319.68 22.5" />
    <circle class="route-knot" cx="314" cy="24.6" r="2.5" />`,
  /* el camino aún no dibujado, primer paso andado — one short ink step, a gate
     tick at the threshold, the rest a dashed hairline. No gold: nothing shipped. */
  'personal-lab': `
    <path class="route-main" d="M 0 148 L 36 142" />
    <path class="route-gate" d="M 36 136 L 36 148" />
    <path class="route-ahead" d="M 36 142 L 120 128 L 210 100 L 320 64" />`,
};

export const routeViz = (key) => {
  const inner = CARD_VIZ[key] || CARD_VIZ['personal-lab'];
  return `<svg class="wn-card__viz" viewBox="0 0 320 180" width="320" height="180" aria-hidden="true" focusable="false"><rect width="320" height="180" fill="var(--field-2)"/>${inner}
  </svg>`;
};

/* ---- the 4 identity headers (720×240, transparent ground) ----
   route-main carries pathLength="1" so the fc-earth draw-in (AST-6 sequence: morph
   420ms → draw at 480ms) costs one dasharray. data-head-y: zelebrix 0.30 · IDEA 0.71
   (spec'd) · gestamp 0.63 · this-portfolio 0.83 (where each route enters at x=0). */
const HEADERS = {
  'rag-zelebrix': {
    headY: '0.30',
    inner: `
    <path class="route-main" pathLength="1" d="M 0 72 L 150 86 L 330 118" />
    <path class="route-main" pathLength="1" d="M 0 196 L 160 168 L 330 118" />
    <path class="route-main" pathLength="1" d="M 330 118 L 470 104" />
    <path class="route-gold" d="M 330 118 L 470 104" />
    <path class="route-ahead" d="M 470 104 L 720 84" />
    <circle class="route-headdot" cx="470" cy="104" r="5" />`,
  },
  'architecture-idea': {
    headY: '0.71',
    inner: `
    <path class="route-main" pathLength="1" d="M 0 170 L 200 156 L 300 140" />
    <path class="route-main" pathLength="1" d="M 300 140 L 560 64" />
    <path class="route-main" pathLength="1" d="M 300 140 L 540 188" />
    <path class="route-ahead" d="M 300 140 L 720 140" />
    <circle class="route-knot" cx="560" cy="64" r="4" />
    <circle class="route-knot" cx="540" cy="188" r="4" />
    <circle class="route-headdot" cx="300" cy="140" r="5" />`,
  },
  'gestamp-agents': {
    headY: '0.63',
    inner: `
    <path class="route-main" pathLength="1" d="M 0 150 L 120 140 L 240 122 L 360 108 L 480 96 L 600 78 L 720 64" />
    <path class="route-gold" d="M 0 150 L 120 140 L 240 122 L 360 108 L 480 96 L 600 78 L 720 64" />
    <circle class="route-knot" cx="120" cy="140" r="4" />
    <circle class="route-knot" cx="240" cy="122" r="4" />
    <circle class="route-knot" cx="360" cy="108" r="4" />
    <circle class="route-knot" cx="480" cy="96" r="4" />
    <circle class="route-knot" cx="600" cy="78" r="4" />`,
  },
  'this-portfolio': {
    headY: '0.83',
    inner: `
    <path class="route-main" pathLength="1" d="M 0 200 L 235 150 L 490 80 L 720 30" />
    <path class="route-gold" d="M 490 80 L 720 30" />
    <circle class="route-knot" cx="700" cy="34.3" r="4" />`,
  },
};

export const routeHeader = (key) => {
  const h = HEADERS[key];
  if (!h) return '';
  return `<svg class="identity__route" viewBox="0 0 720 240" width="720" height="240" data-head-y="${h.headY}" aria-hidden="true" focusable="false">${h.inner}
  </svg>`;
};

/* ---- HILO-6: the 404's frayed route (THE one red + one movement of that page) ----
   The line draws (reusing wn-route-draw, pathLength=100), reaches nowhere, and
   unravels into three fibres; the bead pulses lub-dub where the route gave out. */
export const nfRoute = () => `<div class="nf-route" aria-hidden="true"><svg viewBox="0 0 720 96" preserveAspectRatio="xMinYMid meet">
  <path class="nf-route__line" pathLength="100" d="M 0 72 L 250 58 L 410 46" fill="none"/>
  <path class="nf-route__fray nf-route__fray--1" d="M 410 46 C 450 40, 480 44, 500 56" fill="none"/>
  <path class="nf-route__fray nf-route__fray--2" d="M 410 46 C 445 46, 465 56, 472 70" fill="none"/>
  <path class="nf-route__fray nf-route__fray--3" d="M 410 46 C 440 36, 452 28, 458 18" fill="none"/>
  <circle class="nf-route__end" cx="410" cy="46" r="3"/></svg></div>`;
