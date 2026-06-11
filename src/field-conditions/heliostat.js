/**
 * WHITE NOON — Heliostat 2.0 (SKY-1/2/3/4 · DESIGN-V5 §2.0–§2.4) — the sky, hour by hour
 * ONE canonical pipeline (apply(), 1/min + events): effective hour (scrubber →
 * real-suntimes warp) → ANCHORS interpolation (8 channels) → weather-scene
 * multipliers (data-wx) → INTENSITY → night branch (moon) → shadows → outputs.
 * Publishes: the zenith→horizon sky gradient (--fc-sky-zen/-hor/-horpos on the
 * .fc-tint ELEMENT — inherits:false, no custom-prop storm), the hour's colour
 * (--fc-hour-hue, full hex — consumed by --hairline-lit/clouds), the sun/moon
 * channel (--fc-sun-*), heliostatic shadows (--fc-shadow-*), the night-dim warm
 * field (--fc-field) and the rest-tier pulse alpha (--fc-pulse-alpha).
 * Zero rAF (one timer/minute). Governor-EXEMPT.
 *
 * SANCTIONED EXCEPTION (CONTRACTS §f.7): the ANCHORS zen/hor hex pairs below are
 * curated phenomenon DATA (like routes.json), not palette — the single sanctioned
 * deviation from "only tokens.css carries raw hex". Documented in tokens lineage.
 *
 * Reduced motion: sky/field/daypart STATE still applies (state, not motion — the
 * harness asserts daypart under RM); the heliostatic SHADOW vars are NOT written
 * (static token fallbacks hold — SKY-4 "honest static fallback").
 */
import { intensity, field, registerCleanup, reduced } from './index.js';

/* CIELO-1 — real lunar phase, pure deterministic astronomy (no network). Synodic month
   29.530588853 days since a known new moon (2000-01-06 18:14 UTC = JD 2451550.1). Returns
   illuminated fraction 0..1. If the date math ever throws, callers fall back to full. */
function moonIllumination() {
  try {
    const synodic = 29.530588853;
    const jd = Date.now() / 86400000 + 2440587.5; // unix ms → Julian Day
    let age = ((jd - 2451550.1) % synodic + synodic) % synodic; // days since new moon
    return (1 - Math.cos((age / synodic) * 2 * Math.PI)) / 2;    // 0 new → 1 full → 0 new
  } catch { return 1; }
}

export function daypartFor(h) {
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'noon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// ANCHORS (SKY-1 final): [hour, warmth (1=--sun…0=--sky), tint alpha %, field dim 0..1,
//   zenHex (zenith), horHex (horizon), comp (horizon compression 0..1), sunOp]
// zen/hor are curated DATA — see header (§f.7). The 8th channel REPLACES warmth*0.22 (SKY-2).
const ANCHORS = [
  [0,    0.38, 4.5, 0.85, '#3A3A52', '#515175', 0.10, 0.10],
  [5,    1.00, 5.0, 0.45, '#6F71AA', '#8A76AB', 0.30, 0.22],
  [6.5,  1.00, 6.0, 0.10, '#7072AB', '#EAB0D1', 0.55, 0.25],
  [7.5,  1.00, 6.5, 0.00, '#82ADDB', '#EBB2B1', 0.45, 0.26],
  [9,    0.85, 3.5, 0.00, '#94C5F8', '#B1B5EA', 0.20, 0.20],
  [11,   0.70, 2.2, 0.00, '#B7EAFF', '#94DFFF', 0.10, 0.17],
  [13,   0.50, 2.0, 0.00, '#B7EAFF', '#94DFFF', 0.05, 0.15],
  [16,   0.60, 4.0, 0.00, '#6E93B8', '#E3C264', 0.45, 0.19],
  [18,   0.78, 5.5, 0.00, '#576E71', '#E1C45E', 0.60, 0.24],
  [19.5, 0.92, 6.5, 0.12, '#4F6480', '#C5752D', 0.72, 0.26],
  [21,   0.55, 5.0, 0.55, '#46557E', '#8A76AB', 0.40, 0.12],
  [24,   0.38, 4.5, 0.85, '#3A3A52', '#515175', 0.10, 0.10],
];
const TINT_CAP = 6.5; // tokenized as --fc-tint-cap (documentation); hard clamp 8 in the formula

const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PARSED = ANCHORS.map((a) => [a[0], a[1], a[2], a[3], hexRGB(a[4]), hexRGB(a[5]), a[6], a[7], a[5]]);

const lerp = (a, b, f) => a + (b - a) * f;
function dayLight(t) {
  for (let i = 0; i < PARSED.length - 1; i++) {
    const a = PARSED[i], b = PARSED[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const f = (t - a[0]) / (b[0] - a[0]);
      return {
        warmth: lerp(a[1], b[1], f), alpha: lerp(a[2], b[2], f), dim: lerp(a[3], b[3], f),
        zen: a[4].map((c, j) => Math.round(lerp(c, b[4][j], f))),
        hor: a[5].map((c, j) => Math.round(lerp(c, b[5][j], f))),
        comp: lerp(a[6], b[6], f), sunOp: lerp(a[7], b[7], f),
        horHex: f < 0.5 ? a[8] : b[8], // full-hex anchor for --fc-hour-hue (nearest — a hue, not a blend)
      };
    }
  }
  return { warmth: 0.5, alpha: 0, dim: 0, zen: [183, 234, 255], hor: [148, 223, 255], comp: 0.1, sunOp: 0.15, horHex: '#94DFFF' };
}

/* SKY-5.f — the day WARPED to the user's real sun: if weather.js cached real
   sunrise/sunset (sessionStorage wn.sunTimes, decimal hours), the anchor clock
   maps rise→7h and set→20h; the night distributes 20h→7h. ?fc-hour bypasses ALL. */
function warpHour(t) {
  try {
    const st = JSON.parse(sessionStorage.getItem('wn.sunTimes') || 'null');
    if (!st || !(st.set > st.rise)) return t;
    if (t >= st.rise && t <= st.set) return 7 + ((t - st.rise) / (st.set - st.rise)) * 13;
    const since = (t - st.set + 24) % 24;
    const nightLen = 24 - (st.set - st.rise);
    return (20 + (since / nightLen) * 11) % 24;
  } catch { return t; }
}

/* The effective hour every sky consumer agrees on (weather.js gates the iris by it). */
export function effectiveHour() {
  try {
    const q = new URLSearchParams(location.search).get('fc-hour');
    if (q != null && q !== '' && !isNaN(+q)) return ((+q % 24) + 24) % 24; // scrubber bypasses the warp too
  } catch { /* */ }
  const now = new Date();
  return warpHour(now.getHours() + now.getMinutes() / 60);
}

export function initHeliostat() {
  const root = document.documentElement;

  const apply = () => {
    const t = effectiveHour();
    const boost = intensity.tint > 1; // read at the point of use (live binding) — never cached at init
    const L = dayLight(t);

    // ── weather scene multipliers (§2.0.3 / SKY-10b: in fog the boost SUBTRACTS harder, never adds a veil)
    const wx = root.dataset.wx || '';
    const sunScene = wx === 'overcast' ? 0.45
      : wx === 'fog' ? (boost ? 0.18 : 0.30)
      : wx === 'rain' ? 0.60
      : (wx === 'rain-heavy' || wx === 'storm') ? 0.50
      : wx === 'snow' ? 0.65 : 1;
    const tintScene = (wx === 'fog' || wx === 'overcast') ? 0.7 : 1;

    // ── tint channel (SKY-1): zenith→horizon gradient on the .fc-tint ELEMENT (inherits:false)
    const alphaEff = Math.min(8, Math.max(Math.min(TINT_CAP, L.alpha) * tintScene * intensity.tint, intensity.tintFloor));
    const aZen = alphaEff * 0.72 / 100, aHor = Math.min(8, alphaEff * 1.15) / 100;
    const tintEl = document.querySelector('.fc-tint');
    if (tintEl) {
      tintEl.style.setProperty('--fc-sky-zen', `rgba(${L.zen[0]},${L.zen[1]},${L.zen[2]},${aZen.toFixed(4)})`);
      tintEl.style.setProperty('--fc-sky-hor', `rgba(${L.hor[0]},${L.hor[1]},${L.hor[2]},${aHor.toFixed(4)})`);
      tintEl.style.setProperty('--fc-sky-horpos', (38 + (L.comp + (intensity.tint > 1 ? 0.06 : 0)) * 34).toFixed(1) + '%');
    }
    root.style.setProperty('--fc-hour-hue', L.horHex); // FULL hue of the hour — hairlines/clouds mix it down themselves
    // compat channel (the harness Heliostat row reads --fc-tint; motes read --fc-sky-hue)
    const hue = `color-mix(in srgb, var(--sun) ${Math.round(L.warmth * 100)}%, var(--sky))`;
    root.style.setProperty('--fc-sky-hue', hue);
    root.style.setProperty('--fc-tint', `color-mix(in srgb, ${L.horHex} ${alphaEff.toFixed(2)}%, transparent)`);

    // ── field dim (SKY-3): night-warm, never grey — 3% --sun folded into the dim mix
    const dim = Math.min(1, L.dim * (boost ? 1.15 : 1));
    root.style.setProperty('--fc-field', dim > 0.02
      ? `color-mix(in srgb, color-mix(in srgb, var(--field-0) ${Math.round(100 - dim * 100)}%, var(--field-0-dim)) 97%, var(--sun) 3%)`
      : 'var(--field-0)');

    // ── sun / moon channel (SKY-2 + SKY-3)
    const night = (t >= 21.3 || t < 4.7);
    const sUp = 1; // the night dimming now lives IN the sunOp anchors (8th channel) — kept as the formula's slot
    const sunOpEff = Math.min(0.40, L.sunOp * sUp * sunScene * intensity.sun);
    root.style.setProperty('--fc-sun-op', sunOpEff.toFixed(3));
    let sx;
    if (night) {
      // the MOON: a cool washi disc travelling the top of the field through the night.
      // CIELO-1 (owner's celestial idea) — it is no longer ALWAYS FULL: its illumination
      // follows the REAL lunar phase (deterministic, zero network). New moon → a barely-
      // there disc (gifting an empty star-less calm sky); full moon → bright. By
      // subtraction only (opacity), never a hard crescent, never red, field stays ≥90% white.
      const illum = moonIllumination(); // 0 (new) … 1 (full)
      sx = (6 + ((t >= 21 ? t - 21 : t + 3) / 10) * 88).toFixed(0);
      root.style.setProperty('--fc-sun-x', sx + '%');
      root.style.setProperty('--fc-sun-y', '9%');
      root.style.setProperty('--fc-sun-size', ((intensity.sun > 1 ? 26 : 22) * (0.7 + illum * 0.3)).toFixed(0) + 'vw');
      root.style.setProperty('--fc-sun-glow', 'color-mix(in srgb, var(--washi) 55%, var(--sky))');
      // re-scale the moon's own opacity by illumination (the anchor sunOp is the night floor)
      root.style.setProperty('--fc-sun-op', Math.min(0.40, sunOpEff * (0.25 + illum * 0.85)).toFixed(3));
    } else {
      sx = (6 + Math.max(0, Math.min(1, (t - 5) / 15)) * 88).toFixed(0);   // 6%→94% east→west (5h→20h)
      const sy = (4 + Math.min(1, Math.abs(t - 13) / 8) * 28).toFixed(0);  // high (4%) at noon, low (32%) at dawn/dusk
      const size = 34 + Math.min(1, Math.abs(t - 13) / 6.5) * 12 + (intensity.sun > 1 ? 6 : 0); // 34vw noon → 46vw dawn/dusk (SKY-2)
      root.style.setProperty('--fc-sun-x', sx + '%');
      root.style.setProperty('--fc-sun-y', sy + '%');
      root.style.setProperty('--fc-sun-size', size.toFixed(0) + 'vw');
      root.style.setProperty('--fc-sun-glow', `color-mix(in srgb, var(--sun) ${Math.round(60 + L.warmth * 35)}%, var(--sky))`);
    }

    // ── heliostatic shadows (SKY-4) — NOT under reduced motion (static fallbacks are the honest state);
    //    fog FLATTENS them inline (SKY-10b — a CSS rule cannot out-specify these inline writes)
    if (!reduced) {
      if (wx === 'fog') {
        root.style.setProperty('--fc-shadow-dx', '0px');
        root.style.setProperty('--fc-shadow-blur', '30px');
      } else {
        const dx = (((50 - parseFloat(sx)) / 50) * 8 * intensity.shadow).toFixed(1);
        const blur = (10 + Math.min(1, Math.abs(t - 13) / 8) * 16).toFixed(0);
        root.style.setProperty('--fc-shadow-dx', dx + 'px');     // +morning → −afternoon (changes SIDE at noon)
        root.style.setProperty('--fc-shadow-blur', blur + 'px'); // 10px noon → 26px dawn/dusk
      }
      root.style.setProperty('--fc-shadow-tint', `color-mix(in srgb, rgb(${L.zen[0]},${L.zen[1]},${L.zen[2]}) 35%, var(--ink))`);
    }

    // ── rest tier (BRE-4 fix: heliostat is the ONLY writer of --fc-pulse-alpha — inline beats CSS)
    root.style.setProperty('--fc-pulse-alpha', (field.rest >= 1) ? '0.70' : night ? '1' : '0.85');

    root.dataset.daypart = daypartFor(Math.floor(t)); // state (harness + any daypart reader)
  };

  // first paint lands INSTANTLY (CIE-01) — the 4s ambient crossfade starts on the SECOND apply
  const instant = () => {
    root.classList.add('fc-helio-instant');
    apply();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('fc-helio-instant')));
  };
  instant();
  const timer = setInterval(apply, 60000); // minute by minute — the day flows

  const onVis = () => { if (!document.hidden) apply(); };
  const onWx = () => apply();           // scene multipliers re-read data-wx (smooth 4s crossfade)
  const onRest = () => apply();         // only --fc-pulse-alpha actually changes
  document.addEventListener('visibilitychange', onVis);
  document.addEventListener('wn:wx', onWx);
  document.addEventListener('fc:rest', onRest);
  addEventListener('fc:intensity', instant); // boost snaps the hour's light instantly (INT-4 helio-snap)

  registerCleanup('heliostat', () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('wn:wx', onWx);
    document.removeEventListener('fc:rest', onRest);
    removeEventListener('fc:intensity', instant);
    // the current hour's light REMAINS as dignified static state (it is state, not motion)
  });
}
