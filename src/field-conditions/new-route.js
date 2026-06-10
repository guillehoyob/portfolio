/**
 * WHITE NOON — New Route (Stage 3, §5.2) + HILO-1a: la ruta del nombre VIVA
 * The hero route line varies per visit: a stable line within a day, a new one
 * across days. The pre-paint head snippet has already seeded wn.visitor, picked
 * the day's index (window.__wnRouteIndex) and — when motion is allowed — armed
 * the path hidden (html.fc-route: dashoffset, + a CSS fail-safe draw at 2.4s).
 * Here we swap the day's `d` WHILE the line is still invisible (no flash on any
 * engine), disarm the CSS fail-safe, and draw it once (900ms, the page's single
 * sanctioned >600ms gesture). Only the path varies — never grid, type or palette.
 *
 * HILO-1a (flag routeAlive) makes the drawn line ALIVE:
 *  - CURVATURE: on fine pointers the polyline vertices lean ±PULL px toward the
 *    cursor's vertical offset from the band (vertex 0 stays PINNED — the spine's
 *    origin knot ties there). Miter elbows are the character — never smoothed.
 *  - REDRAW: a click on #hero retracts the line (280ms, ease 'lift') and draws
 *    the NEXT pool geometry (900ms, ease 'run' — the --dur-route licence), then
 *    emits `wn:route-redrawn` so the spine re-anchors (HILO-2). The step survives
 *    the session via sessionStorage wn.routeStep.
 *  - BOOST: `fc:intensity`→boost forces one redraw immediately (the owner sees it
 *    without guessing the click); PULL rides intensity.routePull (8 → 12px).
 * RM: if html.fc-route was never armed, NONE of this is installed.
 */
import { setupGsap } from './gsap-setup.js';
import { addTicker, removeTicker, wake, dtFactor, intensity, registerCleanup } from './index.js';
import routes from './routes.json';

const VB_W = 1440, VB_H = 48; // the band's viewBox — the `d` attribute lives in these units
// polyline M/L parser (duplicated in spine.js on purpose — owner files are disjoint)
const parsePts = (s) => [...s.matchAll(/(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)/g)].map((m) => [+m[1], +m[2]]);

export function initNewRoute(config) {
  const band = document.querySelector('.hero__routeband');
  if (!band) return; // not the home hero
  let step = 0;
  try { step = +(sessionStorage.getItem('wn.routeStep') || 0) || 0; } catch { /* private mode */ }
  let idx = (((window.__wnRouteIndex ?? 0) + step) % routes.length + routes.length) % routes.length;
  const dPath = band.querySelector('.route-path--desktop');
  const mPath = band.querySelector('.route-path--mobile');
  const paths = [dPath, mPath].filter(Boolean);
  const apply = (i) => {
    if (dPath) dPath.setAttribute('d', routes[i].d);
    if (mPath) mPath.setAttribute('d', routes[i].m);
  };
  // swap the day's geometry while the line is still invisible (armed) or static
  apply(idx);

  const armed = document.documentElement.classList.contains('fc-route');
  if (!armed) return; // reduced motion / no-motion: the chosen line is already drawn complete — install NOTHING

  // disarm the CSS fail-safe draw, then draw via GSAP after the 120ms breath,
  // on the signature 'run' ease (not expo.out — one curve everywhere, craft §1)
  document.documentElement.classList.add('fc-route-drawn');
  const gsap = setupGsap();
  let busy = true; // initial draw in flight — no bend, no redraw until the tip lands (~1.35s)
  // delay 0.45s so the line draws into CLEAR AIR after the name has settled (it was
  // occluded mid-draw by the climbing H1 before), and dash to the REAL path length so
  // the stroke advances 1:1 with visible pixels (the 3000 guess front-loaded off-screen)
  paths.forEach((p, i) => {
    const len = p.getTotalLength() || 3000;
    gsap.fromTo(p,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 0.9, ease: 'run', delay: 0.45,
        onComplete: () => {
          // FIX OBLIGATORIO (HILO-1a): with dasharray=len fixed, any later bend that
          // changes the path length opens a gap at the tip — release the dash entirely
          p.style.strokeDasharray = 'none';
          if (i === 0) busy = false;
        } });
  });

  if (!(config && config.flags && config.flags.routeAlive)) return;

  /* ───────────────────────── HILO-1a — the route is ALIVE ───────────────────────── */
  const hero = document.getElementById('hero');
  const svgEl = band.querySelector('svg');
  const mobileMQ = matchMedia('(max-width: 1023px)'); // matches the CSS display switch
  const visiblePath = () => (mobileMQ.matches ? mPath : dPath) || dPath || mPath;
  const baseD = () => (mobileMQ.matches && mPath ? routes[idx].m : routes[idx].d);

  // cached geometry (doc coords — scroll-invariant); re-measured on debounced resize
  let svgRect = null, bandCenterY = 0;
  const measure = () => {
    if (!svgEl) return;
    const r = svgEl.getBoundingClientRect();
    if (r.width < 1) return;
    svgRect = { left: r.left, width: r.width, height: r.height };
    bandCenterY = r.top + r.height / 2 + scrollY;
  };

  /* ── REDRAW on click: retract (0.28s 'lift') → next pool geometry (0.9s 'run') ── */
  let pendingCall = null;
  const redraw = () => {
    if (busy) return; // lock for the whole 1.18s sequence
    busy = true;
    apply(idx); // shed any live bend — retract from the TRUE geometry, no tip gap
    paths.forEach((p) => {
      const len = p.getTotalLength() || 3000;
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: 0 },
        { strokeDashoffset: len, duration: 0.28, ease: 'lift', overwrite: true });
    });
    pendingCall = gsap.delayedCall(0.28, () => {
      idx = (idx + 1) % routes.length;
      try { sessionStorage.setItem('wn.routeStep', String(++step)); } catch { /* private mode */ }
      apply(idx);
      paths.forEach((p, i) => {
        const len = p.getTotalLength() || 3000;
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 0.9, ease: 'run', overwrite: true,
            onComplete: () => {
              p.style.strokeDasharray = 'none';
              if (i === 0) {
                busy = false;
                window.dispatchEvent(new CustomEvent('wn:route-redrawn')); // → the spine re-anchors (HILO-2)
              }
            } });
      });
      wake();
    });
  };
  const onClick = (e) => {
    if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,[role="button"]')) return;
    redraw();
  };
  if (hero) hero.addEventListener('click', onClick);

  // BOOST: one forced redraw at activation — the owner sees the pool without guessing the click
  const onIntensity = (e) => { if (e.detail && e.detail.mode === 'boost') redraw(); };
  addEventListener('fc:intensity', onIntensity);

  /* ── CURVATURE toward the cursor — fine pointers only ── */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let influence = 0, target = 0, cursorX = 0, cursorDocY = -9999, wasBent = false;
  let basePts = null, baseKey = ''; // parsed pool vertices, re-parsed only on pool step

  const ticker = (t, dt) => {
    influence += (target - influence) * dtFactor(target > influence ? 0.09 : 0.045, dt);
    if (busy) return true; // NO bend while retract/redraw is in flight — GSAP owns the dash
    if (influence > 0.005 && svgRect) {
      const path = visiblePath();
      const bd = baseD();
      if (bd !== baseKey) { basePts = parsePts(bd); baseKey = bd; } // re-parse only when the pool steps
      const base = basePts;
      const PULL = intensity.routePull * 8; // px — subtle 8 / boost 12 (geometry, not red — outside RED_LOCKED)
      const dyRaw = (cursorDocY - bandCenterY) * 0.10;
      // vertices i≥1 lean toward the cursor's vertical offset; vertex 0 stays PINNED
      // (the spine's origin knot ties there). Rebuild with L segments — miter elbows
      // ARE the character, never smoothed. dy computed in px, written in vb units
      // (the `d` lives in the 1440×48 viewBox — the juez's unit fix).
      let d = `M ${base[0][0]} ${base[0][1]}`;
      for (let i = 1; i < base.length; i++) {
        const [xv, yv] = base[i];
        const vx = svgRect.left + (xv / VB_W) * svgRect.width;
        const w0 = Math.max(0, 1 - Math.abs(cursorX - vx) / 260);
        const dyPx = Math.max(-PULL, Math.min(PULL, dyRaw * w0 * w0)) * influence;
        const dyVb = dyPx * (VB_H / svgRect.height);
        d += ` L ${xv} ${(yv + dyVb).toFixed(2)}`;
      }
      path.setAttribute('d', d);
      wasBent = true;
    } else if (wasBent) {
      visiblePath().setAttribute('d', baseD()); // settle EXACTLY back to the day's geometry
      wasBent = false;
    }
    return influence > 0.005; // PERF-1: the rAF may sleep the moment the lean has relaxed
  };

  const onMove = (e) => {
    if (!svgRect) measure();
    cursorX = e.clientX; cursorDocY = e.clientY + scrollY;
    // vertical gate: the band only answers a cursor travelling within ±140px of it
    target = Math.abs(cursorDocY - bandCenterY) > 140 ? 0 : 1;
    if (target) wake();
  };
  const onLeave = () => { target = 0; };
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(measure, 200); };

  if (fine) {
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    addEventListener('resize', onResize, { passive: true });
    addTicker(ticker);
    requestAnimationFrame(() => requestAnimationFrame(measure)); // after first paint settles
  }

  registerCleanup('new-route', () => {
    if (hero) hero.removeEventListener('click', onClick);
    removeEventListener('fc:intensity', onIntensity);
    removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    removeEventListener('resize', onResize);
    clearTimeout(rt);
    if (pendingCall) pendingCall.kill();
    gsap.killTweensOf(paths);
    removeTicker(ticker);
    apply(idx); // honest static state: the day's line, fully drawn
    paths.forEach((p) => { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
  });
}
