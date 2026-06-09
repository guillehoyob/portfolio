/**
 * WHITE NOON — THE RED SPINE (Stage 3, new — §5.2 extension)
 * ONE continuous --signal thread down the whole home page, drawn by SCROLL
 * PROGRESS, growing from the hero route's level (a baton pass), carrying:
 *  - a DRAWING-TIP NIB at the leading edge — bright while you scroll, a quiet
 *    bead at rest (so you see WHERE the line is being drawn);
 *  - the shared cardiac heartbeat: a beat + diastolic breath (the line breathes
 *    with the dot), and an expanding RIPPLE ring emitted on each lub;
 *  - a true LOCAL bend toward the cursor (the path leans where the cursor is —
 *    not a rigid block translate);
 *  - on RETURNING visits, a kintsugi GOLD VEIN: φ-spaced gold flecks healing the
 *    red thread, clipped to the drawn portion, deepening by visit tier.
 * It sits ABOVE the void band's black (z-index:2) but under all text. Absolute,
 * full-document, on the field layer. Transform/opacity/dashoffset/path-d only,
 * one shared rAF + the one heartbeat clock. Reduced motion → a quiet, fully-drawn
 * static red rule, no nib/ripple/bend. Flag off / not home → never exists.
 */
import { addTicker, removeTicker, wake, heartbeatPhase, heartbeatBeat, heartbeatBreath, onReducedMotionChange } from './index.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const SECTIONS = ['#proof', '#work', '#method', '.wn-void', '#about', '#contact'];
const PHI = 1.618;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initSpine() {
  const hero = document.getElementById('hero');
  if (!hero) return;                                // home only
  if (document.querySelector('.fc-spine')) return;  // idempotent

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const returning = document.documentElement.classList.contains('fc-return'); // gild on return

  const mkPath = (cls) => {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('class', cls); p.setAttribute('fill', 'none');
    p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('vector-effect', 'non-scaling-stroke');
    return p;
  };

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'fc-spine');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = mkPath('fc-spine__path');

  let gild = null, clipRect = null;
  if (returning) {
    const defs = document.createElementNS(SVGNS, 'defs');
    const clip = document.createElementNS(SVGNS, 'clipPath');
    clip.setAttribute('id', 'fc-spine-clip');
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    clipRect = document.createElementNS(SVGNS, 'rect');
    clipRect.setAttribute('x', '0'); clipRect.setAttribute('y', '0');
    clipRect.setAttribute('width', '100000'); clipRect.setAttribute('height', '0');
    clip.appendChild(clipRect); defs.appendChild(clip); svg.appendChild(defs);
    gild = mkPath('fc-spine__gild');
    gild.setAttribute('clip-path', 'url(#fc-spine-clip)');
  }
  const ripple = document.createElementNS(SVGNS, 'circle');
  ripple.setAttribute('class', 'fc-spine__ripple'); ripple.setAttribute('r', '3.5');
  const pulse = document.createElementNS(SVGNS, 'circle');
  pulse.setAttribute('class', 'fc-spine__pulse'); pulse.setAttribute('r', '3.5');

  svg.append(path);
  if (gild) svg.append(gild);
  svg.append(ripple, pulse);
  document.body.appendChild(svg);

  let LEN = 0, basePts = [], heroH = 0, unit = 1;
  const build = () => {
    const w = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    heroH = hero.offsetHeight;
    const lane = w >= 1024 ? 0.12 : 0.05;   // left dead gutter (desktop) / margin (mobile)
    const bow = w >= 1024 ? 0.030 : 0.014;  // a hand-drawn lean, not a ruler
    const laneX = w * lane;
    // baton pass: start the spine at the hero route's vertical LEVEL, in the gutter, so the
    // thread reads as continuing downward from where the route was drawn
    let headY = hero.offsetTop + heroH * 0.42;
    const rb = document.querySelector('.hero__routeband');
    if (rb) { const r = rb.getBoundingClientRect(); headY = r.top + r.height / 2 + scrollY; }
    const pts = [[laneX, headY]];
    SECTIONS.forEach((sel, i) => {
      const el = document.querySelector(sel);
      const oy = el ? el.offsetTop : headY + ((i + 1) / (SECTIONS.length + 1)) * (docH - headY);
      const t = (i + 1) / (SECTIONS.length + 1);
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);          // accelerate then settle
      const mag = bow * Math.pow(1 / PHI, i * 0.5);            // φ-decay: tighter toward the foot
      pts.push([laneX + (i % 2 ? -1 : 1) * w * mag * (0.6 + ease), oy]); // top leans toward the name
    });
    pts.push([laneX, docH - 24]);
    path.setAttribute('d', catmullRom(pts));
    svg.setAttribute('viewBox', `0 0 ${w} ${docH}`);
    svg.style.height = docH + 'px';
    // resample into dense waypoints so the cursor bend is a smooth LOCAL bulge ANYWHERE
    // along the thread, not only near the sparse section anchors
    const len0 = path.getTotalLength();
    const N = 24;
    basePts = [];
    for (let i = 0; i <= N; i++) { const q = path.getPointAtLength((i / N) * len0); basePts.push([q.x, q.y]); }
    const d = catmullRom(basePts);
    path.setAttribute('d', d);
    LEN = path.getTotalLength();
    unit = LEN / 233; // 233 = Fibonacci → scale-stable flecks
    svg.style.setProperty('--fc-spine-len', LEN.toFixed(1));
    if (gild) {
      gild.setAttribute('d', d);
      const dash = [unit, unit * PHI, unit * PHI * PHI, unit * PHI * PHI * PHI]; // φ on/gap/on/gap
      gild.style.strokeDasharray = dash.map((n) => n.toFixed(1)).join(' ');
      clipRect.setAttribute('width', w.toString());
    }
  };
  build();

  if (reduce) return; // CSS @media reduce draws it complete; no nib/ripple/bend/loop

  let drawn = 0, prevDrawn = 0;
  let cursorDocX = -9999, cursorDocY = -9999, influence = 0, targetInfluence = 0, dDirty = true, rang = false;
  const MAXPULL = 14, FALLOFF = 260;
  const lenis = window.__wn && window.__wn.lenis;

  const progress = () => {
    if (lenis && typeof lenis.progress === 'number') return clamp01(lenis.progress);
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? clamp01(scrollY / max) : 0;
  };
  const velocity = () => (lenis && typeof lenis.velocity === 'number' ? Math.abs(lenis.velocity) : 0);

  const onScroll = () => { dDirty = true; wake(); };
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });

  if (fine) {
    window.addEventListener('pointermove', (e) => {
      cursorDocX = e.clientX + scrollX; cursorDocY = e.clientY + scrollY;
      targetInfluence = 1; dDirty = true; wake();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { targetInfluence = 0; });
  }

  const ticker = () => {
    const p = progress();
    drawn += (p - drawn) * 0.18;
    const dLen = LEN * clamp01(drawn);
    path.style.strokeDashoffset = (LEN - dLen).toFixed(1);

    // local cursor bend: pull each waypoint toward the cursor, strongest near the cursor's
    // row, zero far away — a real lean, not a block translate (S3). Rebuild d only when needed.
    influence += (targetInfluence - influence) * 0.06;
    if (fine && (dDirty || influence > 0.01)) {
      const bent = basePts.map(([x, y]) => {
        const wgt = Math.max(0, 1 - Math.abs(cursorDocY - y) / FALLOFF);
        const pull = Math.max(-MAXPULL, Math.min(MAXPULL, (cursorDocX - x) * 0.18 * wgt)) * influence;
        return [x + pull, y];
      });
      const d = catmullRom(bent);
      path.setAttribute('d', d);
      if (gild) gild.setAttribute('d', d);
      dDirty = false;
    }

    // continuity ramp: faint 0.10 trace in the hero → 0.42 past it (composed with breath in CSS)
    svg.style.setProperty('--fc-spine-fade', (0.24 + 0.76 * clamp01(scrollY / (heroH * 0.6))).toFixed(3));

    // the shared cardiac heartbeat: beat (with recoil) + diastolic breath
    const phase = heartbeatPhase();
    const beat = heartbeatBeat(phase);
    const breath = heartbeatBreath(phase);
    svg.style.setProperty('--fc-spine-beat', beat.toFixed(3));
    svg.style.setProperty('--fc-spine-breath', breath.toFixed(3));

    if (LEN > 1) {
      const tip = path.getPointAtLength(dLen);
      const tx = tip.x.toFixed(1), ty = tip.y.toFixed(1);
      // NIB at the exact leading edge — bright while drawing (scroll velocity feeds it), quiet at rest
      pulse.setAttribute('cx', tx); pulse.setAttribute('cy', ty);
      const advancing = clamp01(Math.abs(drawn - prevDrawn) * 40 + velocity() * 0.08);
      let nibOp = 0.14 + 0.66 * Math.max(advancing, beat * 0.5 + breath * 0.1);
      if (drawn > 0.985) nibOp *= clamp01((1 - drawn) / 0.015); // the pen lifts at the foot
      pulse.style.opacity = nibOp.toFixed(3);
      // ripple ring re-armed on the lub rising edge, centred on the nib (the wave after the beat)
      ripple.setAttribute('cx', tx); ripple.setAttribute('cy', ty);
      if (phase < 0.06 && !rang) { ripple.classList.remove('go'); ripple.getBoundingClientRect(); ripple.classList.add('go'); rang = true; }
      if (phase > 0.12) rang = false;
      // kintsugi gold vein: clip the φ flecks to the drawn region; drift one φ-unit per cycle
      if (gild && clipRect) {
        clipRect.setAttribute('height', Math.max(0, tip.y).toFixed(1));
        gild.style.strokeDashoffset = (-phase * unit).toFixed(1);
      }
    }
    prevDrawn = drawn;
    return true; // heartbeat is continuous → keep the shared loop alive (suspends on tab-hide)
  };
  addTicker(ticker);

  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(build, 200); };
  window.addEventListener('resize', onResize, { passive: true });

  onReducedMotionChange((r) => {
    if (!r) return;
    removeTicker(ticker);
    window.removeEventListener('resize', onResize);
    clearTimeout(rt);
    path.setAttribute('d', catmullRom(basePts)); // undo any bend
    path.style.strokeDashoffset = '0';
    svg.style.setProperty('--fc-spine-fade', '1');
    pulse.style.display = 'none'; ripple.style.display = 'none';
  });
}

/* Catmull-Rom → cubic Bézier 'd' (gentle, no corners). No dependency. */
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
