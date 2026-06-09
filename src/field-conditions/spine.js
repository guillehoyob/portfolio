/**
 * WHITE NOON — THE RED SPINE (Stage 3 — §5.2 extension) — the red life-thread of the WHOLE site
 * ONE continuous --signal thread running down EVERY page (the ocean's blood reaches everywhere),
 * drawn by SCROLL PROGRESS, carrying: a DRAWING-TIP NIB at the leading edge (bright while you
 * scroll, a quiet bead at rest); the shared cardiac heartbeat (beat + diastolic breath + an
 * expanding RIPPLE on each lub); a true LOCAL bend toward the cursor; and on the home page a
 * baton-pass from the hero route's level so it grows from where the route was drawn.
 *
 * Lives in the left page margin (left of all content at every breakpoint), z-index:2 so it
 * threads IN FRONT of the void band's black but UNDER all text. Geometry uses φ (golden-ratio)
 * decay so the meander tightens toward the foot like a settling plumb line. Transform / opacity
 * / dashoffset / path-d only; one shared rAF + the one heartbeat clock. Reduced motion → a quiet,
 * fully-drawn static red rule. NOTE: kintsugi gold lives ONLY on the void CRACK (the actual
 * break) — the spine is a continuous thread, not a break, so it is never gilded.
 */
import { addTicker, removeTicker, wake, heartbeatPhase, heartbeatBeat, heartbeatBreath, onReducedMotionChange, field } from './index.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const PHI = 1.618;
// generic anchors present across pages — the thread nods at whichever exist, sorted by position
const ANCHORS = ['#proof', '#work', '#method', '.wn-void', '#about', '#contact', '.identity', '.projbody', '.toolchain', '.stacktable', '.about', '.contact__row'];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initSpine() {
  if (document.querySelector('.fc-spine')) return; // idempotent
  if (document.body.classList.contains('cv-wrap')) return; // the print sheet has nothing to thread
  if ((document.documentElement.scrollHeight - innerHeight) < 200) return; // nothing to thread on a short page

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hero = document.getElementById('hero'); // home only → baton-pass + hero fade

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
  const ripple = document.createElementNS(SVGNS, 'circle');
  ripple.setAttribute('class', 'fc-spine__ripple'); ripple.setAttribute('r', '3.5');
  const pulse = document.createElementNS(SVGNS, 'circle');
  pulse.setAttribute('class', 'fc-spine__pulse'); pulse.setAttribute('r', '3.5');
  svg.append(path, ripple, pulse);
  document.body.appendChild(svg);

  let LEN = 0, basePts = [], fadeRef = 0;
  const build = () => {
    const w = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    const lane = w >= 1024 ? 0.06 : 0.045;   // a consistent left-margin lane on every page
    const bow = w >= 1024 ? 0.030 : 0.014;
    const laneX = w * lane;
    // start point: on home, the hero route's LEVEL (baton pass); else near the top
    let headY = docH * 0.05;
    if (hero) {
      headY = hero.offsetTop + hero.offsetHeight * 0.42;
      const rb = document.querySelector('.hero__routeband');
      if (rb) { const r = rb.getBoundingClientRect(); headY = r.top + r.height / 2 + scrollY; }
      fadeRef = hero.offsetHeight * 0.6;
    } else {
      // project pages: baton-pass from the static identity route — the project's red line
      // becomes the spine's launch point, alive like the hero route (consistency UNIFY-1)
      const idr = document.querySelector('.identity__route');
      if (idr) { const r = idr.getBoundingClientRect(); headY = r.top + r.height * 0.5 + scrollY; fadeRef = idr.offsetHeight * 0.8; }
      else { fadeRef = innerHeight * 0.4; }
    }
    const anchors = ANCHORS.map((s) => document.querySelector(s)).filter(Boolean)
      .map((el) => el.offsetTop).filter((y) => y > headY + 40 && y < docH - 60).sort((a, b) => a - b);
    const ys = anchors.length >= 2 ? anchors
      : Array.from({ length: 5 }, (_, i) => headY + ((i + 1) / 6) * (docH - headY)); // even fallback
    const pts = [[laneX, headY]];
    ys.forEach((oy, i) => {
      const t = (i + 1) / (ys.length + 1);
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      const mag = bow * Math.pow(1 / PHI, i * 0.5);          // φ-decay: tighter toward the foot
      pts.push([laneX + (i % 2 ? -1 : 1) * w * mag * (0.6 + ease), oy]);
    });
    pts.push([laneX, docH - 24]);
    path.setAttribute('d', catmullRom(pts));
    svg.setAttribute('viewBox', `0 0 ${w} ${docH}`);
    svg.style.height = docH + 'px';
    // resample dense so the cursor bend is a smooth LOCAL bulge anywhere
    const len0 = path.getTotalLength();
    const N = 24;
    basePts = [];
    for (let i = 0; i <= N; i++) { const q = path.getPointAtLength((i / N) * len0); basePts.push([q.x, q.y]); }
    path.setAttribute('d', catmullRom(basePts));
    LEN = path.getTotalLength();
    svg.style.setProperty('--fc-spine-len', LEN.toFixed(1));
  };
  build();

  if (reduce) return; // CSS @media reduce draws it complete; no nib/ripple/bend/loop

  let drawn = 0, prevDrawn = 0;
  let cursorDocX = -9999, cursorDocY = -9999, influence = 0, targetInfluence = 0, dDirty = true, rang = false;
  const MAXPULL = 8, FALLOFF = 340; // contained lean (≤8px) + a wider, gentler falloff so the bulge GLIDES, never flicks
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
    // velocity-eased draw: a fast flick lets the nib race ahead and settle; a slow scroll seeps
    drawn += (p - drawn) * (0.146 + 0.114 * clamp01(velocity() * 0.1));
    const dLen = LEN * clamp01(drawn);
    path.style.strokeDashoffset = (LEN - dLen).toFixed(1);

    // quick to ANSWER the cursor, slow to FORGET it (asymmetric ease — poise, not lag)
    influence += (targetInfluence - influence) * (targetInfluence > influence ? 0.09 : 0.045);
    if (fine && (dDirty || influence > 0.01)) {
      const bent = basePts.map(([x, y]) => {
        const w0 = Math.max(0, 1 - Math.abs(cursorDocY - y) / FALLOFF);
        const wgt = w0 * w0; // squared → the active bulge eases in/out instead of snapping between φ-nodes (kills the "weird flick")
        const pull = Math.max(-MAXPULL, Math.min(MAXPULL, (cursorDocX - x) * 0.12 * wgt)) * influence;
        return [x + pull, y];
      });
      path.setAttribute('d', catmullRom(bent));
      dDirty = false;
    }

    // continuity ramp: faint trace in the first viewport → 0.42 below it (composed with breath in CSS)
    svg.style.setProperty('--fc-spine-fade', (0.24 + 0.76 * clamp01(scrollY / fadeRef)).toFixed(3));

    const phase = heartbeatPhase();
    const beat = heartbeatBeat(phase);
    const breath = heartbeatBreath(phase);
    svg.style.setProperty('--fc-spine-beat', (beat * (1 - 0.6 * field.breath)).toFixed(3)); // beat recedes during the field's rest-breath (matches the dot — one organism slowing)
    svg.style.setProperty('--fc-spine-breath', breath.toFixed(3));        // cardiac diastole
    svg.style.setProperty('--fc-spine-sigh', field.breath.toFixed(3));    // the field's slow rest-breath — its OWN perceptible channel (the spine breathes deeper as the field rests)

    if (LEN > 1) {
      const tip = path.getPointAtLength(dLen);
      const tx = tip.x.toFixed(1), ty = tip.y.toFixed(1);
      pulse.setAttribute('cx', tx); pulse.setAttribute('cy', ty);
      const advancing = clamp01(Math.abs(drawn - prevDrawn) * 40 + velocity() * 0.08);
      // the tip breathes a golden fraction BEHIND the thread — blood reaching the extremity last
      const nibBreath = heartbeatBreath((phase + 0.146) % 1);
      let nibOp = 0.146 + 0.618 * Math.max(advancing, beat * 0.5 + nibBreath * 0.1);
      for (const im of field.impulses) { if (Date.now() - im.t < 350 && Math.abs(im.x - tip.x) < 200) { nibOp = Math.min(0.95, nibOp + 0.35); break; } }
      if (drawn > 0.985) nibOp *= clamp01((1 - drawn) / 0.015);
      pulse.style.opacity = nibOp.toFixed(3);
      ripple.setAttribute('cx', tx); ripple.setAttribute('cy', ty);
      if (phase < 0.06 && !rang) { ripple.classList.remove('go'); ripple.getBoundingClientRect(); ripple.classList.add('go'); rang = true; }
      if (phase > 0.12) rang = false;
    }
    prevDrawn = drawn;
    return true;
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
    path.setAttribute('d', catmullRom(basePts));
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
