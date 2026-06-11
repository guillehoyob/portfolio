/**
 * WHITE NOON — THE RED SPINE (Stage 3 — §5.2 extension, evolved V5 §3) — the red
 * life-thread of the WHOLE site. ONE continuous --signal thread running down EVERY
 * page (the ocean's blood reaches everywhere), drawn by SCROLL PROGRESS, carrying:
 *  - a DRAWING-TIP NIB at the leading edge (bright while you scroll, a quiet bead
 *    at rest) + the shared cardiac heartbeat (beat + diastolic breath + a RIPPLE
 *    on each lub, re-rung by the field's breath crest — BRE-3);
 *  - a true LOCAL bend toward the cursor (fine) or toward the LAST TAP (touch,
 *    HILO-7 — field physics, not UI animation: attack 200ms, relax 1.2s/1.8s
 *    boost, exempt from the 600ms–4s band per CONTRACTS §f.3a);
 *  - on home a REAL baton-pass (HILO-2): the head rides the hero route's polyline
 *    34px right of the lane and elbows down INTO the lane — the thread literally
 *    NACE from the name's route, and re-anchors on `wn:route-redrawn`;
 *  - two pinky-promise KNOTS (HILO-3): origin tied at the junction, destination
 *    tightening onto the contact email when the thread arrives (drawn > 0.97);
 *  - ONE sliding sashiko STITCH (HILO-5a): a 12px dash resting on the NEXT anchor
 *    ahead of the nib — the thread's next waypoint, never a second ornament.
 * ADORNO BUDGET (ley §3): nib + stitch + 2 knots + breath = the LIMIT. Nothing
 * else hangs from this thread.
 *
 * Presence (HILO-4): min-draw computed in REAL pixels (down to ~mid first
 * viewport, capped 0.18) + fade floor 0.55 — both IDENTICAL in boost (the red
 * never scales: RED_LOCKED). The breath channel (op +0.20 / width +1px at crest,
 * × --fc-int-breath) lives in fc-ocean.css — the sanctioned transitory exception.
 *
 * Lives in the left page margin, z-index:2 (in front of the void's black, under
 * all text). Transform / opacity / dashoffset / path-d only; one shared rAF + the
 * one heartbeat clock; honest work-gates so the loop can truly sleep (PERF-1).
 * Reduced motion → fully-drawn static thread, both knots tied, stitch hidden.
 * NOTE: kintsugi gold lives ONLY on the void CRACK — the spine is never gilded.
 */
import { addTicker, removeTicker, wake, dtFactor, intensity, heartbeatPhase, heartbeatBeat, heartbeatBreath, onReducedMotionChange, field } from './index.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const PHI = 1.618;
// generic anchors present across pages — the thread nods at whichever exist, sorted by position
const ANCHORS = ['#proof', '#work', '#method', '.wn-void', '#about', '#contact', '.identity', '.projbody', '.toolchain', '.stacktable', '.about', '.contact__row'];
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// polyline M/L parser (duplicated from new-route.js on purpose — owner files are disjoint)
const parsePts = (s) => [...s.matchAll(/(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)/g)].map((m) => [+m[1], +m[2]]);

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
  const stitch = mkPath('fc-spine__stitch'); // HILO-5a — right after the path, UNDER the nib
  const ripple = document.createElementNS(SVGNS, 'circle');
  ripple.setAttribute('class', 'fc-spine__ripple'); ripple.setAttribute('r', '3.5');
  const pulse = document.createElementNS(SVGNS, 'circle');
  pulse.setAttribute('class', 'fc-spine__pulse'); pulse.setAttribute('r', '3.5');
  // HILO-3 — the two pinky-promise knots (full red ring, perforated loop, NO gold)
  const mkKnot = (mod) => {
    const k = document.createElementNS(SVGNS, 'circle');
    k.setAttribute('class', `fc-spine__knot fc-spine__knot--${mod}`); k.setAttribute('r', '3.5'); // quieter (V5.1 owner: "muy cantosos")
    return k;
  };
  const knotO = mkKnot('origin'), knotD = mkKnot('dest');
  // HILO-3 (owner: "más puntos, el camino que sigue") — a station per section ON the
  // thread; NEUTRAL (not red/gold — respects the one-red + adorno-budget laws), each
  // lights from a faint dot to a darker one as the descending thread reaches it: the
  // path you've walked. Container repopulated in build().
  const wpG = document.createElementNS(SVGNS, 'g');
  wpG.setAttribute('class', 'fc-spine__wps');
  svg.append(path, stitch, wpG, ripple, pulse, knotO, knotD);
  document.body.appendChild(svg);
  let wps = []; // {el, len}

  let LEN = 0, basePts = [], fadeRef = 0, minP = 0.05, anchorLens = [], anchorYs = [], headPinY = -1, destDocY = -1, drawMax = 0;
  let tipLen = -1, tipX = 0, lastFade = '', lastNib = -1, lastNext = -1, tied = false, wasBent = false;
  const build = () => {
    const w = document.documentElement.clientWidth;
    // collapse our own height before measuring: the absolutely-positioned svg keeps the
    // OLD document height alive in scrollHeight, so a page that shrank (e.g. the /work
    // filter) could never reclaim its ghost scroll (audit BUG-2)
    svg.style.height = '0px';
    const docH = document.documentElement.scrollHeight;
    const lane = w >= 1024 ? 0.06 : 0.045;   // a consistent left-margin lane on every page
    const bow = w >= 1024 ? 0.030 : 0.014;
    const laneX = w * lane;
    // start point: on home, the hero route ITSELF (baton pass HILO-2); else near the top
    let headY = docH * 0.05;
    let junction = null, tangentPt = null;
    if (hero) {
      headY = hero.offsetTop + hero.offsetHeight * 0.42;
      const rb = document.querySelector('.hero__routeband');
      if (rb) {
        const svgEl = rb.querySelector('svg');
        const rp = rb.querySelector(matchMedia('(max-width: 1023px)').matches ? '.route-path--mobile' : '.route-path--desktop');
        const sr = (svgEl || rb).getBoundingClientRect();
        const dAttr = rp && rp.getAttribute('d');
        if (dAttr && sr.width > 1 && sr.height > 0) {
          // REAL baton-pass (V5.1 owner fix): the thread is born AT the route's actual
          // left ENDPOINT (the visible start of the name's line) and sweeps down-left
          // into the lane — the old version interpolated/EXTRAPOLATED the polyline at
          // x=laneX, which floats in the gutter where no red line exists ("la línea no
          // sale de la línea que se genera del hero").
          const vb = parsePts(dAttr);
          const first = vb.reduce((a, b) => (b[0] < a[0] ? b : a)); // leftmost point = the drawn end
          const end = { x: sr.left + (first[0] / 1440) * sr.width, y: sr.top + (first[1] / 48) * sr.height + scrollY };
          junction = { x: laneX, y: end.y + 34 };
          tangentPt = end;
          headY = end.y;
        } else { // fallback: the band's center level (never worse than before)
          const r = rb.getBoundingClientRect(); headY = r.top + r.height / 2 + scrollY;
        }
      }
      fadeRef = hero.offsetHeight * 0.6;
    } else {
      // project pages: baton-pass from the static identity route — read data-head-y when
      // W3's inline header marks where its red line truly sits (AST-2), else center
      const idr = document.querySelector('.identity__route');
      if (idr) {
        const r = idr.getBoundingClientRect();
        const hy = parseFloat(idr.dataset.headY || '0.5');
        headY = r.top + r.height * (Number.isFinite(hy) ? hy : 0.5) + scrollY;
        // QA-2 ROOT CAUSE of "baja el punto rojo pero no hay hilo": .identity__route is
        // an <svg> — it has NO offsetHeight → fadeRef was NaN → --fc-spine-fade "NaN"
        // → computed opacity 0 on EVERY project page. The rect is the truth.
        fadeRef = Math.max(1, r.height * 0.8);
      } else { fadeRef = innerHeight * 0.4; }
    }
    const anchors = ANCHORS.map((s) => document.querySelector(s)).filter(Boolean)
      .map((el) => el.offsetTop).filter((y) => y > headY + 40 && y < docH - 60).sort((a, b) => a - b);
    const ys = anchors.length >= 2 ? anchors
      : Array.from({ length: 5 }, (_, i) => headY + ((i + 1) / 6) * (docH - headY)); // even fallback
    // head: the sweep from the route's real endpoint down-left into the lane — one
    // continuous gesture (Mirror's Edge: the red guides the eye into the page)
    const pts = junction
      ? [[tangentPt.x, tangentPt.y],
         [laneX + (tangentPt.x - laneX) * 0.42, tangentPt.y + 14],
         [laneX, junction.y + 30]]
      : [[laneX, headY]];
    ys.forEach((oy, i) => {
      const t = (i + 1) / (ys.length + 1);
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      const mag = bow * Math.pow(1 / PHI, i * 0.5);          // φ-decay: tighter toward the foot
      pts.push([laneX + (i % 2 ? -1 : 1) * w * mag * (0.6 + ease), oy]);
    });
    // tail (HILO-3): a diagonal hook to the contact email — the thread ties off at the door
    let destPt = [laneX, docH - 24];
    const destEl = document.querySelector('#contact .contact__email') || document.querySelector('a[href^="mailto:"]');
    if (destEl) {
      const r = destEl.getBoundingClientRect();
      destPt = [Math.max(laneX, r.left - 18), r.top + r.height / 2 + scrollY];
    }
    pts.push([laneX, destPt[1] - 120], destPt);
    path.setAttribute('d', catmullRom(pts));
    svg.setAttribute('viewBox', `0 0 ${w} ${docH}`);
    svg.style.height = docH + 'px';
    // resample dense so the cursor bend is a smooth LOCAL bulge anywhere — but keep the
    // HEAD elbow and the TAIL hook detailed (uniform 1/24 steps would erase both codos)
    const len0 = path.getTotalLength();
    const N = 24;
    const samples = new Set([0, len0]);
    if (junction) [10, 22, 34, 48, 64, 90, 130, 190, 270, 370, 480, 590].forEach((l) => { if (l < len0) samples.add(l); }); // the long head sweep keeps its shape through the resample
    [130, 90, 56, 28, 10].forEach((l) => { if (len0 - l > 0) samples.add(len0 - l); });
    for (let i = 1; i < N; i++) samples.add((len0 * i) / N);
    basePts = [...samples].sort((a, b) => a - b).map((s) => { const q = path.getPointAtLength(s); return [q.x, q.y]; });
    path.setAttribute('d', catmullRom(basePts));
    LEN = path.getTotalLength();
    svg.style.setProperty('--fc-spine-len', LEN.toFixed(1));
    // MIN-DRAW in REAL pixels (HILO-4): the thread always reaches ~mid first viewport.
    // y grows monotonically down the thread → bisect path-length space directly (so the
    // result is exact in dash units). Cap 0.18 protects short pages; floor 0.05.
    const lenAtY = (yT) => {
      let lo = 0, hi = LEN;
      for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).y < yT) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    };
    minP = LEN > 1 ? Math.min(0.18, Math.max(0.05, lenAtY(headY + innerHeight * 0.45) / LEN)) : 0.05;
    // the stitch's waypoints (HILO-5a): accumulated length where the thread crosses each anchor
    anchorLens = LEN > 1 ? ys.map((y) => lenAtY(y)) : [];
    anchorYs = LEN > 1 ? ys.slice() : []; // doc-Y per waypoint (QA-4: visibility check per frame, no sampling)
    headPinY = junction ? junction.y + 30 : -1; // QA-1b: below this the bend ramps in; above, the head is welded to the route
    destDocY = destPt[1]; // doc-Y of the email — the thread ties here when CONTACT is reached, not the page foot (V5.8)
    // V6 (owner: "la última puntada va demasiado rápida, rompe el ma"): map the draw to
    // reach the email at the CONTACT level (email ~mid-screen), scroll-driven — so the
    // thread eases to the knot at the SAME flow as the rest, never a fast snap.
    drawMax = Math.max(200, destDocY - innerHeight * 0.5);
    // (re)build the station dots ON the thread, one per real section anchor
    wpG.textContent = '';
    wps = LEN > 1 ? anchorLens.map((len) => {
      const q = path.getPointAtLength(len);
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('class', 'fc-spine__waypoint'); c.setAttribute('r', '2.5');
      c.setAttribute('cx', q.x.toFixed(1)); c.setAttribute('cy', q.y.toFixed(1));
      wpG.appendChild(c);
      return { el: c, len };
    }) : [];
    // V5.4 (owner: "el círculo no coincide con el hilo") + QA HILO-1: weld the origin
    // knot to the ACTUAL drawn point of the thread (the resample left it ~3.4px above
    // junction.y+30). Sample the path at that length so cx/cy land exactly ON the trace.
    if (junction && LEN > 1) {
      const q = path.getPointAtLength(lenAtY(junction.y + 30));
      knotO.setAttribute('cx', q.x.toFixed(1)); knotO.setAttribute('cy', q.y.toFixed(1));
    } else {
      knotO.setAttribute('cx', pts[0][0].toFixed(1)); knotO.setAttribute('cy', pts[0][1].toFixed(1));
    }
    knotD.setAttribute('cx', destPt[0].toFixed(1));
    knotD.setAttribute('cy', destPt[1].toFixed(1));
    stitch.setAttribute('d', path.getAttribute('d'));
    tipLen = -1; // geometry changed (rebuild/route-redraw) → never let the nib ride a stale point
  };
  build();

  if (reduce) {
    // honest static state: thread fully drawn (CSS), both knots present and TIED
    knotD.classList.add('is-tied');
    return; // no nib/ripple/bend/stitch/loop
  }

  let drawn = 0, prevDrawn = 0;
  let cursorDocX = -9999, cursorDocY = -9999, influence = 0, targetInfluence = 0, dDirty = true, rang = false;
  let lastTap = null; // HILO-7 — the thread leans toward the LAST TAP on coarse pointers
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
  const onMove = (e) => {
    cursorDocX = e.clientX + scrollX; cursorDocY = e.clientY + scrollY;
    targetInfluence = 1; dDirty = true; wake();
  };
  const onLeave = () => { targetInfluence = 0; };
  const onTap = (e) => {
    if (e.target.closest && e.target.closest('a,button,input,textarea,select,label,[role="button"]')) return;
    lastTap = { x: e.clientX + scrollX, y: e.clientY + scrollY, t: Date.now() };
    dDirty = true; wake();
  };
  let clickT = 0; // V5.1 — the click-wave TUGS the thread on desktop too ("la onda no interactúa con nada")
  const onClickTug = (e) => {
    if (e.target.closest && e.target.closest('a,button,input,textarea,select,label,[role="button"]')) return;
    clickT = Date.now(); dDirty = true; wake();
  };
  if (fine) {
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onClickTug, { passive: true });
    document.addEventListener('pointerleave', onLeave);
  } else {
    // HILO-7: field physics, not UI animation (CONTRACTS §f.3a) — the 1.2–1.8s
    // relaxation is the medium settling, sanctioned outside the 600ms–4s band
    window.addEventListener('pointerdown', onTap, { passive: true });
  }
  // BRE-3 — the breath crest re-rings the nib's ripple (emitter is breath.js/W4;
  // perfectly inert if the event never arrives). Skip if it would collide with the lub.
  const onCrest = () => {
    if (heartbeatPhase() < 0.12) return; // anti double-pulse with the cardiac lub
    ripple.classList.remove('go'); ripple.getBoundingClientRect(); ripple.classList.add('go');
    wake();
  };
  document.addEventListener('fc:crest', onCrest);
  // LIVE RETRIEVAL (the chat cited a section ON this page) → light the thread's station
  // for that section: the red thread reaches toward the answer's source (WOW, on-brand).
  const onCite = (e) => {
    const sel = e.detail && e.detail.sel; if (!sel || !wps.length) return;
    let el; try { el = document.querySelector(sel); } catch { return; }
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY;
    let best = -1, bd = Infinity;
    for (let i = 0; i < anchorYs.length; i++) { const d = Math.abs(anchorYs[i] - y); if (d < bd) { bd = d; best = i; } }
    const wp = best >= 0 && wps[best]; if (!wp) return;
    wp.el.classList.add('is-cited'); wake();
    clearTimeout(wp._citeT); wp._citeT = setTimeout(() => wp.el.classList.remove('is-cited'), 2600);
  };
  document.addEventListener('fc:cite', onCite);

  const ticker = (t, dt) => {
    const dtF = (dt || 16.7) / 16.7;
    let worked = false;
    // the thread EXISTS before the first scroll (HILO-4): min-draw in real pixels down
    // to ~mid first viewport (cap 0.18) — IDENTICAL in boost (the red never scales).
    // It still grows from 0 on load (the ease below seeps toward the floor).
    // the draw is scroll-driven to the EMAIL (drawMax = the contact level), not the page
    // foot — so it reaches the knot exactly as you arrive at contact, eased at the normal
    // flow (V6: no more fast snap). The knot ties when that draw essentially completes.
    const dm = drawMax > 0 ? clamp01(scrollY / drawMax) : progress();
    const p = Math.max(dm, minP);
    const reached = dm > 0.985;
    if (Math.abs(p - drawn) > 0.00005) { // gate kills idle cost only — the visible tail of the seep (~2px) must finish, the nib travels it
      // velocity-eased draw: a fast flick lets the nib race ahead and settle; a slow scroll seeps
      drawn += (p - drawn) * Math.min(1, (0.146 + 0.114 * clamp01(velocity() * 0.1)) * dtF);
      path.style.strokeDashoffset = (LEN - LEN * clamp01(drawn)).toFixed(1);
      worked = true;
    }
    const dLen = LEN * clamp01(drawn);

    // ── the bend: ONE mechanism, two hands (cursor = fine / last tap = HILO-7) ──
    // quick to ANSWER, slow to FORGET (asymmetric ease — poise, not lag)
    influence += (targetInfluence - influence) * Math.min(1, (targetInfluence > influence ? 0.09 : 0.045) * dtF);
    let inf = 0, bx = 0, by = 0;
    // the click-wave's tug: for ~0.9s after a field click the thread leans harder
    // toward the hand — the ripple visibly touches the thread (geometry, not red)
    const cAge = clickT ? (Date.now() - clickT) / 900 : 1;
    const cTug = cAge < 1 ? 1 - cAge : 0;
    if (cTug > 0) worked = true; else if (clickT) clickT = 0;
    if (fine) { inf = Math.min(1, influence + 0.5 * cTug); bx = cursorDocX; by = cursorDocY; }
    else if (lastTap) {
      const age = Date.now() - lastTap.t; // absolute clock — refresh-rate immune
      const relaxMs = intensity.tapPull > 1 ? 1800 : 1200; // boost stretches the settle, not the red
      inf = age < 200 ? age / 200 : Math.max(0, 1 - (age - 200) / relaxMs);
      if (inf <= 0) { lastTap = null; dDirty = true; }
      else { bx = lastTap.x; by = lastTap.y; }
    }
    if (dDirty || inf > 0.005 || wasBent) {
      const MAXP = fine ? MAXPULL + 5 * cTug : intensity.tapPull * 10; // click-tug deepens the lean ≤13px for ~0.9s; tap pull: subtle 10 / boost 14 (geometry, not red)
      const hasSrc = inf > 0.005;
      const bent = hasSrc ? basePts.map(([x, y]) => {
        const w0 = Math.max(0, 1 - Math.abs(by - y) / FALLOFF);
        const wgt = w0 * w0; // squared → the active bulge eases in/out instead of snapping between φ-nodes
        // QA-1b: the HEAD is welded to the route — the bend's mask ramps in over the
        // 200px below the junction, so the thread's birth never de-anchors (2.7–8px
        // drift measured when the cursor sat in the hero)
        const pin = headPinY > 0 ? clamp01((y - headPinY) / 200) : 1;
        const pull = Math.max(-MAXP, Math.min(MAXP, (bx - x) * 0.12 * wgt)) * inf * pin;
        return [x + pull, y];
      }) : basePts; // settles EXACTLY back to base on the last write
      const dNow = catmullRom(bent);
      path.setAttribute('d', dNow);
      stitch.setAttribute('d', dNow); // the stitch rides the SAME thread while it bends
      tipLen = -1; // QA-3: the bend rewrote the geometry — re-seat the nib on the BENT thread next frame
      wasBent = hasSrc;
      dDirty = false;
      worked = true;
    }

    // continuity ramp (HILO-4 floor): present from the first viewport → full below it.
    // V5.3: floor 0.72→0.85 so the hero reads strong and there is barely any "fade-in"
    // band left to misread as the thread weakening as you scroll.
    const fade = (0.85 + 0.15 * clamp01(scrollY / fadeRef)).toFixed(3);
    if (fade !== lastFade) { svg.style.setProperty('--fc-spine-fade', fade); lastFade = fade; worked = true; }

    // ── the pulse channels: they WRITE whenever the loop runs, but never CLAIM it
    // (audit PERF-1). On pages without a live hero dot the loop may suspend at full
    // rest and the thread holds still — ma. Any input or the breath timer wakes it.
    const phase = heartbeatPhase();
    const beat = heartbeatBeat(phase);
    const breath = heartbeatBreath(phase);
    svg.style.setProperty('--fc-spine-beat', (beat * (1 - 0.7 * field.breath)).toFixed(3)); // beat RECEDES during the field's breath crest (BRE-2: 0.7 — frecuencias anidadas legibles)
    svg.style.setProperty('--fc-spine-breath', breath.toFixed(3));        // cardiac diastole (micro channel — kept)
    if (field.breath > 0.001) worked = true; // while the field breathes, keep composing the channels

    if (LEN > 1) {
      // tip geometry only when the drawn length moved — getPointAtLength every frame
      // was the single largest idle cost in the whole system (audit PERF-1)
      if (Math.abs(dLen - tipLen) > 0.4) {
        const tip = path.getPointAtLength(dLen);
        tipLen = dLen; tipX = tip.x;
        const tx = tip.x.toFixed(1), ty = tip.y.toFixed(1);
        pulse.setAttribute('cx', tx); pulse.setAttribute('cy', ty);
        ripple.setAttribute('cx', tx); ripple.setAttribute('cy', ty);
      }
      const advancing = clamp01(Math.abs(drawn - prevDrawn) * 40 + velocity() * 0.08);
      // the tip breathes a golden fraction BEHIND the thread — blood reaching the extremity last
      const nibBreath = heartbeatBreath((phase + 0.146) % 1);
      let nibOp = 0.24 + 0.618 * Math.max(advancing, beat * 0.5 + nibBreath * 0.1); // QA HILO-2: brighter leading bead (was 0.146 — too faint to read), opacity only
      for (const im of field.impulses) { if (Date.now() - im.t < 350 && Math.abs(im.x - tipX) < 200) { nibOp = Math.min(0.95, nibOp + 0.35); break; } }
      if (drawn > 0.985) nibOp *= clamp01((1 - drawn) / 0.015);
      if (Math.abs(nibOp - lastNib) > 0.003) { pulse.style.opacity = nibOp.toFixed(3); lastNib = nibOp; }
      if (phase < 0.06 && !rang) { ripple.classList.remove('go'); ripple.getBoundingClientRect(); ripple.classList.add('go'); rang = true; }
      if (phase > 0.12) rang = false;

      // ── HILO-5a: the sashiko stitch slides to the NEXT anchor ahead of the nib —
      // and it must be a VISIBLE waypoint (QA-4: the old pick often sat 1400px below
      // the viewport — a marker nobody could read as "next stop"). Anchor Ys are
      // precomputed in build() — zero path sampling per frame.
      const vLimit = scrollY + innerHeight * 1.6; // within reach of a nudge — anchors are sparse on long pages
      let next;
      for (let i = 0; i < anchorLens.length; i++) {
        if (anchorLens[i] > dLen + 24 && anchorYs[i] < vLimit) { next = anchorLens[i]; break; }
      }
      if (next !== undefined && drawn < 0.97) {
        if (next !== lastNext) { // write-gated: only when the waypoint changes (240ms blink)
          stitch.style.opacity = '0';
          requestAnimationFrame(() => {
            stitch.setAttribute('stroke-dasharray', '12 ' + LEN.toFixed(0));
            stitch.setAttribute('stroke-dashoffset', String(-(next - 6)));
            stitch.style.opacity = '1';
          });
          lastNext = next;
          worked = true;
        }
      } else if (lastNext !== -1) { stitch.style.opacity = '0'; lastNext = -1; worked = true; } // the destination is the KNOT now

      // ── HILO-3: each station lights as the thread reaches it (the camino walked) ──
      for (const wp of wps) {
        const on = dLen > wp.len - 2;
        if (wp._on !== on) { wp.el.classList.toggle('is-passed', on); wp._on = on; worked = true; }
      }

      // ── HILO-3: the destination knot ties when the draw reaches the email (contact) ──
      if (reached && !tied) { knotD.classList.add('is-tied'); tied = true; worked = true; }
      else if (dm < 0.9 && tied) { knotD.classList.remove('is-tied'); tied = false; worked = true; }
    }
    prevDrawn = drawn;
    return worked;
  };
  addTicker(ticker);

  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { build(); dDirty = true; wake(); }, 200); };
  window.addEventListener('resize', onResize, { passive: true });
  // the hero route redrew (HILO-1a) → the junction moved: re-anchor the baton-pass
  window.addEventListener('wn:route-redrawn', onResize);
  // the document can shrink WITHOUT a window resize (the /work filter) — watch the body
  // box and rebuild, or the thread runs past the footer into ghost scroll (audit BUG-2)
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(document.body);

  onReducedMotionChange((r) => {
    if (!r) return;
    removeTicker(ticker);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('wn:route-redrawn', onResize);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('pointerdown', onTap);
    document.removeEventListener('fc:crest', onCrest);
    if (ro) ro.disconnect();
    clearTimeout(rt);
    path.setAttribute('d', catmullRom(basePts));
    path.style.strokeDashoffset = '0';
    svg.style.setProperty('--fc-spine-fade', '1');
    pulse.style.display = 'none'; ripple.style.display = 'none';
    knotD.classList.add('is-tied'); // static dignity: the thread arrived, the knot is tied
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
