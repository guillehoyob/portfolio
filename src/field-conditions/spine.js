/**
 * WHITE NOON — THE RED SPINE (Stage 3, new — §5.2 extension)
 * ONE continuous --signal thread running down the WHOLE home page, drawn by
 * SCROLL PROGRESS (not time), carrying the shared heartbeat as a bright node
 * that travels ALONG it near the drawn leading edge and bends a few px toward
 * the cursor. The per-visit hero route's vocabulary — same token, same weight
 * class — extended into the page's spine.
 *
 * An absolute, full-document SVG on the field-grain layer (z-index:-1, behind
 * content, above the propagated field background) in the left margin/dead gutter
 * where structural lines belong (§4) — so it scrolls WITH the page and the
 * thread truly runs its height. ViewBox = the document in CSS px (1:1 → round
 * pulse node, true 2px stroke). Responsive lane keeps it in the margin on mobile
 * (never behind body text).
 *
 * Budget: 2px non-scaling stroke; on-screen red ≈ 0.14% of the viewport (a tenth
 * of the 1.5% cap). Transform / opacity / stroke-dashoffset only. Shared rAF +
 * shared heartbeat clock. Reduced motion → a quiet, fully-drawn static red rule,
 * no pulse, no bend (CSS @media). Flag off / not home → the element never exists.
 */
import { addTicker, removeTicker, wake, heartbeatPhase, heartbeatBeat, onReducedMotionChange } from './index.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const SECTIONS = ['#proof', '#work', '#method', '.wn-void', '#about', '#contact'];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initSpine() {
  const hero = document.getElementById('hero');
  if (!hero) return;                                // home only
  if (document.querySelector('.fc-spine')) return;  // idempotent

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'fc-spine');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = document.createElementNS(SVGNS, 'path');
  path.setAttribute('class', 'fc-spine__path');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--signal)');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  const pulse = document.createElementNS(SVGNS, 'circle');
  pulse.setAttribute('class', 'fc-spine__pulse');
  pulse.setAttribute('r', '3.5');
  svg.append(path, pulse);
  document.body.appendChild(svg);

  let LEN = 0, heroH = 0;
  const build = () => {
    const w = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    heroH = hero.offsetHeight;
    const lane = w >= 1024 ? 0.12 : 0.05;   // left dead gutter (desktop) / left margin (mobile)
    const bow = w >= 1024 ? 0.022 : 0.012;  // near-plumb — a gentle lean, not a snake
    const laneX = w * lane;
    const startY = hero.offsetTop + hero.offsetHeight * 0.58; // emerge low in the hero
    const pts = [[laneX, startY]];
    SECTIONS.forEach((sel, i) => {
      const el = document.querySelector(sel);
      const oy = el ? el.offsetTop : startY + ((i + 1) / (SECTIONS.length + 1)) * (docH - startY);
      pts.push([laneX + (i % 2 ? 1 : -1) * w * bow, oy]);
    });
    pts.push([laneX, docH - 24]); // settle at the foot
    path.setAttribute('d', catmullRom(pts));
    svg.setAttribute('viewBox', `0 0 ${w} ${docH}`);
    svg.style.height = docH + 'px';
    LEN = path.getTotalLength();
    svg.style.setProperty('--fc-spine-len', LEN.toFixed(1));
  };
  build();

  if (reduce) return; // CSS @media reduce draws it complete; no pulse / bend / loop

  let drawn = 0;
  let targetBend = 0, bend = 0, prevBend = 0;
  const MAXBEND = 8;
  const lenis = window.__wn && window.__wn.lenis;

  const progress = () => {
    if (lenis && typeof lenis.progress === 'number') return clamp01(lenis.progress);
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? clamp01(scrollY / max) : 0;
  };

  const onScroll = () => wake();
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });

  if (fine) {
    window.addEventListener('pointermove', (e) => {
      const lane = document.documentElement.clientWidth * (document.documentElement.clientWidth >= 1024 ? 0.12 : 0.05);
      targetBend = Math.max(-1, Math.min(1, (e.clientX - lane) / document.documentElement.clientWidth)) * MAXBEND;
      wake();
    }, { passive: true });
  }

  const ticker = () => {
    const p = progress();
    drawn += (p - drawn) * 0.18; // light lerp — the draw feels weighted, not 1:1
    const dLen = LEN * clamp01(drawn);
    path.style.strokeDashoffset = (LEN - dLen).toFixed(1);
    // the route owns the hero: the spine fades in (0 → its faint trace opacity) only
    // once the hero scrolls past, so the two reds never share a frame (one idea/viewport)
    path.style.opacity = (0.42 * clamp01((scrollY - heroH * 0.5) / (heroH * 0.4))).toFixed(3);

    // the heartbeat node: rides near the drawn leading edge (the reader's position),
    // travelling the last ~12% up to the tip each cardiac cycle, bright on the
    // lub–dub and tinting toward the cyan --pulse (cyan ONLY as a pulse)
    const phase = heartbeatPhase();
    const beat = heartbeatBeat(phase);
    svg.style.setProperty('--fc-spine-beat', beat.toFixed(3));
    if (dLen > 2) {
      const span = Math.min(dLen, LEN * 0.12);
      const pt = path.getPointAtLength(Math.max(0, dLen - span * (1 - phase)));
      pulse.setAttribute('cx', pt.x.toFixed(1));
      pulse.setAttribute('cy', pt.y.toFixed(1));
      pulse.style.opacity = Math.max(beat, 0.14).toFixed(3);
    }

    bend += (targetBend - bend) * 0.06; // Drift inertia, same as Crosswind
    if (Math.abs(bend - prevBend) > 0.01) { // skip redundant compositor writes when settled
      svg.style.transform = `translateX(${bend.toFixed(2)}px) skewX(${((bend / MAXBEND) * 0.4).toFixed(3)}deg)`;
      prevBend = bend;
    }
    return true; // heartbeat is continuous → keep the shared loop alive (suspends on tab-hide)
  };
  addTicker(ticker);

  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(build, 200); };
  window.addEventListener('resize', onResize, { passive: true });

  onReducedMotionChange((r) => {
    if (!r) return;
    removeTicker(ticker);
    window.removeEventListener('resize', onResize); // no forced-layout build() after teardown
    clearTimeout(rt);
    svg.style.transform = '';
    path.style.opacity = '0.42';
    path.style.strokeDashoffset = '0'; // settle fully drawn
    pulse.style.display = 'none';
  });
}

/* Catmull-Rom → cubic Bézier 'd' (gentle, no corners — the soft continuation of
   the hero route's crisp turns). No dependency. */
function catmullRom(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
