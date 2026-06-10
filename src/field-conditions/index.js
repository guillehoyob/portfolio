/**
 * WHITE NOON — Field Conditions: boot + shared infrastructure
 * One small module drives the Living System by writing only --fc-* custom
 * properties and data-attributes (§5). Global laws enforced here:
 *  - ONE shared rAF loop for all continuous behaviors (Crosswind + Slipstream),
 *    suspended on tab-hide and when no behavior has work.
 *  - reduced-motion read once at boot AND watched via matchMedia.
 *  - the Governor: at most ONE weather behavior visibly active per viewport;
 *    Heartbeat and Heliostat are exempt (a pulse / a field-state, not weather).
 * Every behavior is independently flag-gated in config.js; a flag off reproduces
 * the Stage-0 static state exactly.
 */
import config, { INTENSITY } from './config.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)');
export let reduced = RM.matches;
export const motionAllowed = () => !reduced;
const rmListeners = new Set();
export const onReducedMotionChange = (fn) => rmListeners.add(fn);
/* ---- standard teardown (CONTRACTS §d.4): a behavior registers ONE cleanup that
   removes its listeners/timers/observers/DOM; reduced-motion-on runs them all.
   New behaviors MUST use this instead of rolling another teardown pattern. */
const cleanups = new Map();
export function registerCleanup(name, fn) { cleanups.set(name, fn); }
RM.addEventListener?.('change', (e) => {
  reduced = e.matches;
  // the master motion gate must follow a LIVE change too — the pre-paint class kept
  // every CSS-driven behavior (seams, dot beat, transitions) running after the user
  // asked for reduced motion (audit A11Y-1)
  document.documentElement.classList.toggle('fc-motion', !reduced);
  if (reduced) { cleanups.forEach((fn) => { try { fn(); } catch { /* isolated */ } }); cleanups.clear(); }
  rmListeners.forEach((fn) => fn(reduced));
});

/* ---- INTENSITY runtime (INT-2): ONE live binding every behavior reads at the point
   of use, ONE event, ONE class. RULE: only applyIntensity() touches `fc-boost`. ---- */
export let intensity = INTENSITY.subtle;
export function applyIntensity(mode, opts) {
  const m = mode === 'boost' ? 'boost' : 'subtle';
  intensity = INTENSITY[m];
  const root = document.documentElement;
  for (const k of Object.keys(intensity)) root.style.setProperty('--fc-int-' + k.toLowerCase(), String(intensity[k]));
  root.classList.toggle('fc-boost', m === 'boost');
  if (!opts || opts.persist !== false) { try { localStorage.setItem('wn.intensity', m); } catch { /* private mode */ } }
  dispatchEvent(new CustomEvent('fc:intensity', { detail: { mode: m, intensity } }));
  wake();
}
function initialIntensityMode() {
  // ?wn=boost|subtle is an EPHEMERAL scrubber (never persisted); the stored choice
  // (the FIELD button) wins otherwise. ?wn=clear wipes the store in the pre-paint.
  try { const q = new URLSearchParams(location.search).get('wn'); if (q === 'boost' || q === 'subtle') return q; } catch { /* */ }
  try { if (localStorage.getItem('wn.intensity') === 'boost') return 'boost'; } catch { /* */ }
  return 'subtle';
}

/* ---- the one shared rAF loop (Crosswind + Slipstream) ----
   Dirty-flag: a ticker returns true when it did meaningful work; after ~1.5s of
   all-idle frames the loop suspends itself and re-arms on the next wake() (input
   event). Also suspends on tab-hide. No long task — a handful of float ops/frame
   even when active. */
const tickers = new Set();
let rafId = 0;
let running = false;
let idleFrames = 0;
let lastT = 0;
function frame(t) {
  // real frame delta, clamped (a tab-restore jump must not explode the physics) —
  // every ticker receives it so ambient decays are refresh-rate independent (PERF-2)
  const dt = lastT ? Math.min(50, t - lastT) : 16.7;
  lastT = t;
  let worked = false;
  for (const fn of tickers) { if (fn(t, dt)) worked = true; }
  if (worked) idleFrames = 0;
  else if (++idleFrames > 90) { running = false; return; }
  rafId = requestAnimationFrame(frame);
}
export function wake() {
  if (!running && tickers.size && !document.hidden) { running = true; idleFrames = 0; lastT = 0; rafId = requestAnimationFrame(frame); }
}
/* dt-normalized retention: keep^(dt/16.7). A per-frame factor calibrated at 60Hz
   (e.g. energy *= 0.97) decays identically at 90/120/144Hz (audit PERF-2) — without
   this, every "óptimo" the owner approves would feel different on his next monitor. */
export const dtKeep = (k, dt) => Math.pow(k, (dt || 16.7) / 16.7);
/* dt-normalized LERP gain (CONTRACTS §d.1): for `x += (target - x) * k` easings —
   the complementary form of dtKeep. Both are the same law; pick by formula shape. */
export const dtFactor = (k, dt) => 1 - Math.pow(1 - k, (dt || 16.7) / 16.7);
export function addTicker(fn) { tickers.add(fn); wake(); }
export function removeTicker(fn) {
  tickers.delete(fn);
  if (!tickers.size && running) { running = false; cancelAnimationFrame(rafId); }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && running) { cancelAnimationFrame(rafId); running = false; }
  else if (!document.hidden) wake();
});

/* ---- the ONE heartbeat clock (governor-exempt, §5.6) ----
   A single time-based phase shared by every pulse in the system: the status dot
   (Heartbeat) and the Red Spine's travelling node both read the SAME phase from
   the SAME epoch on the SAME shared rAF — so they are provably one heartbeat,
   not two equal-period loops drifting apart. A 4s cardiac cycle: a lub then a
   smaller dub close together, then a long diastole rest — reads as a calm heart
   while honouring the 4s ambient floor (§2.4). Phase wraps 0..1 every cycle. */
const HEARTBEAT_MS = 4000;
let beatAnchor = 0;
function beatInit() {
  // WALL-CLOCK base (Date.now) so the phase is CONTINUOUS across page navigations — and
  // persisted in sessionStorage when continuity is on, so the pulse never restarts when you
  // move home↔work (the literal "same ocean"). performance.now() resets per document.
  if (config.flags.continuity) {
    try { const s = sessionStorage.getItem('wn.beatAnchor'); if (s) { beatAnchor = +s; return; } } catch { /* private mode */ }
  }
  beatAnchor = Date.now();
  if (config.flags.continuity) { try { sessionStorage.setItem('wn.beatAnchor', String(beatAnchor)); } catch { /* */ } }
}
export function heartbeatPhase() {
  if (!beatAnchor) beatInit();
  return ((((Date.now() - beatAnchor) % HEARTBEAT_MS) + HEARTBEAT_MS) % HEARTBEAT_MS) / HEARTBEAT_MS;
}
const ping = (p, a, b) => (p < a || p > b ? 0 : 0.5 - 0.5 * Math.cos(((p - a) / (b - a)) * 2 * Math.PI));
const recoil = (p, a, b) => (p < a || p > b ? 0 : -Math.sin(((p - a) / (b - a)) * Math.PI));
// the cardiac beat: lub (full) + dub (0.6×), each followed by a short RECOIL undershoot
// — the dip is what turns a mechanical "pum-pum" into a heartbeat with real recoil. ~[-0.18,1]
export function heartbeatBeat(phase) {
  const swell = Math.max(ping(phase, 0, 0.11), ping(phase, 0.15, 0.24) * 0.618); // dub = golden conjugate of the lub
  const dip = recoil(phase, 0.11, 0.145) * 0.18 + recoil(phase, 0.24, 0.30) * 0.10;
  return swell + dip;
}
// diastolic BREATH: a slow sine swell filling the ~3s rest interval so the pulse never
// flatlines — crests near φ of the rest window. Shared by the dot AND the spine (one clock).
export function heartbeatBreath(phase) {
  if (phase < 0.24) return 0;
  const t = (phase - 0.24) / 0.76;
  return Math.sin(Math.pow(t, 0.786) * Math.PI); // √(1/φ) → crests at φ of the rest window
}

/* ---- the FIELD: a read-only bulletin board for the environment (the "ocean medium") ----
   ONE shared state object every behavior may READ. Carries cursor pos+speed, scroll speed,
   recent click IMPULSES, and ONE decaying ENERGY scalar (0..1) raised by scroll/cursor/click
   and decaying back to calm. The law (so it never breaches a §2 cap by stacking): energy
   scales an amplitude ONLY where a hard cap already clamps it. Strata: SKY reads energy;
   OCEAN reads energy + impulses; EARTH reads NEITHER (memory must not ripen on a fast scroll). */
export const field = { cursorX: 0, cursorY: 0, cursorVel: 0, scrollVel: 0, energy: 0, breath: 0, rest: 0, impulses: [] };
export function addImpulse(x, y, force) {
  field.impulses.push({ x, y, force: force || 1, t: Date.now() });
  if (field.impulses.length > 4) field.impulses.shift();
  field.energy = Math.min(1, field.energy + 0.236 * (force || 1)); // φ⁻³ — a golden-scaled stir, never a spike
  wake();
}
export function feedScroll(v) { // called from the Lenis scroll subscription (scroll.js)
  field.scrollVel = Math.min(1, Math.abs(v || 0) / 8);
  if (field.scrollVel > 0.02) field.energy = Math.min(1, field.energy + field.scrollVel * 0.05);
}
let _cx = 0, _cy = 0, _hasCursor = false;
addEventListener('pointermove', (e) => {
  if (_hasCursor) field.cursorVel = Math.min(1, Math.hypot(e.clientX - _cx, e.clientY - _cy) / 40);
  _cx = field.cursorX = e.clientX; _cy = field.cursorY = e.clientY; _hasCursor = true;
  if (field.cursorVel > 0.02) field.energy = Math.min(1, field.energy + field.cursorVel * 0.06);
  wake();
}, { passive: true });
// the energy integrator — decays toward calm each frame; prunes spent impulses. NEVER keeps
// the loop alive on its own (returns work only while energy/impulses persist), so idle-suspend holds.
function integrateEnergy(t, dt) {
  if (field.energy > 0) { field.energy *= dtKeep(0.97, dt); if (field.energy < 0.0008) field.energy = 0; } // slower decay → the stir LINGERS, so click/mote variation is perceptible
  if (field.impulses.length) { const now = Date.now(); field.impulses = field.impulses.filter((im) => now - im.t < 700); }
  field.cursorVel *= dtKeep(0.9, dt);
  return field.energy > 0.001 || field.impulses.length > 0;
}

/* ---- the Governor (weather behaviors only; Heartbeat + Heliostat exempt) ----
   precedence: slipstream > crosswind. Lower-precedence suspends. Scanline is NOT
   arbitrated here — it is footer-pinned and never collides with the cursor haze,
   so coupling it only let Crosswind (which holds the slot until pointerleave)
   starve it forever; it now self-arbitrates in scanline.js. */
const WEATHER_PRECEDENCE = ['slipstream', 'crosswind'];
let activeWeather = null;
const suspendHooks = new Map(); // name -> fn(suspended:boolean)
export function registerWeather(name, onSuspend) { suspendHooks.set(name, onSuspend); }
export function requestWeather(name) {
  if (activeWeather === name) return true;
  const incoming = WEATHER_PRECEDENCE.indexOf(name);
  const current = activeWeather ? WEATHER_PRECEDENCE.indexOf(activeWeather) : Infinity;
  if (incoming <= current) {
    if (activeWeather && activeWeather !== name) suspendHooks.get(activeWeather)?.(true);
    activeWeather = name;
    suspendHooks.get(name)?.(false);
    return true;
  }
  return false; // outranked — caller should hold rest state
}
export function releaseWeather(name) {
  if (activeWeather === name) activeWeather = null;
}

/* Load + init one behavior in COMPLETE isolation: a module that 404s, throws on
   import, or throws on init must never break the others (§5.12 — each hook is
   independently deletable; the honest static state holds). The importer thunk
   keeps the import() literal so Vite still code-splits per behavior. */
const load = async (flag, importer, run) => {
  if (!flag) return;
  try { run(await importer()); }
  catch (e) { if (import.meta.env?.DEV) console.warn('[FC] behavior skipped:', e); }
};

export async function boot() {
  const f = config.flags;
  applyIntensity(initialIntensityMode(), { persist: false }); // FIRST — every behavior reads `intensity` live from frame one
  addTicker(integrateEnergy); // runs FIRST each frame — the field is fresh before behaviors read it
  // Stage 1 — Lenis + reveals + VT morph (the page dive is static CSS; vault-blur died — CODE-1)
  await load(!reduced, () => import('./scroll.js'), (m) => m.initScroll());
  await load(f.reveals, () => import('./reveals.js'), (m) => m.initReveals());
  await load(f.heroEntrance, () => import('./hero-entrance.js'), (m) => m.initHeroEntrance());
  await load(f.vtMorph, () => import('./vt-morph.js'), (m) => m.initVtMorph());
  // Stage 2 — pulse (Heartbeat governor-exempt; First Breath + Scanline one-shots)
  await load(f.heartbeat, () => import('./heartbeat.js'), (m) => m.initHeartbeat(config));
  await load(f.firstBreath, () => import('./first-breath.js'), (m) => m.initFirstBreath());
  await load(f.scanline, () => import('./scanline.js'), (m) => m.initScanline());
  // Stage 3 — identity (New Route swaps the pre-armed line; the Spine extends it down the page; Threshold Cut + Crack detonate the void)
  await load(f.thresholdCut, () => import('./threshold-cut.js'), (m) => m.initThresholdCut(config));
  await load(f.newRoute, () => import('./new-route.js'), (m) => m.initNewRoute(config));
  await load(f.spine, () => import('./spine.js'), (m) => m.initSpine());
  // Stage 4 — field state (Heliostat governor-exempt; Weather feeds field.wx — SKY-5)
  await load(f.heliostat, () => import('./heliostat.js'), (m) => m.initHeliostat());
  await load(f.weather, () => import('./weather.js'), (m) => m.initWeather(config));
  // Stage 5 — weather traces (Governor: slipstream > crosswind > scanline)
  await load(f.slipstream, () => import('./slipstream.js'), (m) => m.initSlipstream());
  await load(f.crosswind, () => import('./crosswind.js'), (m) => m.initCrosswind());
  await load(f.warmLens, () => import('./warm-lens.js'), (m) => m.initWarmLens());
  await load(f.particles, () => import('./particles.js'), (m) => m.initParticles());
  await load(f.ocean, () => import('./ocean.js'), (m) => m.initOcean());
  await load(f.breath, () => import('./breath.js'), (m) => m.initBreath(config));
  // Stage 6 — Patina (memory; the visit count + greeting swapped pre-paint)
  await load(f.patina, () => import('./patina.js'), (m) => m.initPatina(config));
  // V5.2 — the grounded assistant + the lean of the one red button + the auditioned voice
  await load(f.ask, () => import('./ask.js'), (m) => m.initAsk());
  await load(f.magnet, () => import('./magnet.js'), (m) => m.initMagnet());
  await load(f.sound || /[?&]fc-sound=1/.test(location.search), () => import('./hum.js'), (m) => m.initHum());
  // Calibration UI — last, never on the print sheet
  await load(f.intensityControl && !document.body.classList.contains('cv-wrap'),
    () => import('./intensity-control.js'), (m) => m.initIntensityControl());
}
