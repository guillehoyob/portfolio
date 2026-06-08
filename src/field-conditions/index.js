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
import config from './config.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)');
export let reduced = RM.matches;
export const motionAllowed = () => !reduced;
const rmListeners = new Set();
export const onReducedMotionChange = (fn) => rmListeners.add(fn);
RM.addEventListener?.('change', (e) => {
  reduced = e.matches;
  rmListeners.forEach((fn) => fn(reduced));
});

/* ---- the one shared rAF loop (Crosswind + Slipstream) ----
   Dirty-flag: a ticker returns true when it did meaningful work; after ~1.5s of
   all-idle frames the loop suspends itself and re-arms on the next wake() (input
   event). Also suspends on tab-hide. No long task — a handful of float ops/frame
   even when active. */
const tickers = new Set();
let rafId = 0;
let running = false;
let idleFrames = 0;
function frame(t) {
  let worked = false;
  for (const fn of tickers) { if (fn(t)) worked = true; }
  if (worked) idleFrames = 0;
  else if (++idleFrames > 90) { running = false; return; }
  rafId = requestAnimationFrame(frame);
}
export function wake() {
  if (!running && tickers.size && !document.hidden) { running = true; idleFrames = 0; rafId = requestAnimationFrame(frame); }
}
export function addTicker(fn) { tickers.add(fn); wake(); }
export function removeTicker(fn) {
  tickers.delete(fn);
  if (!tickers.size && running) { running = false; cancelAnimationFrame(rafId); }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && running) { cancelAnimationFrame(rafId); running = false; }
  else if (!document.hidden) wake();
});

/* ---- the Governor (weather behaviors only; Heartbeat + Heliostat exempt) ----
   precedence: slipstream > crosswind > scanline. Lower-precedence suspends. */
const WEATHER_PRECEDENCE = ['slipstream', 'crosswind', 'scanline'];
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
  // Stage 1 — Lenis + reveals + Vault Blur
  await load(!reduced, () => import('./scroll.js'), (m) => m.initScroll());
  await load(f.reveals, () => import('./reveals.js'), (m) => m.initReveals());
  await load(f.heroEntrance, () => import('./hero-entrance.js'), (m) => m.initHeroEntrance());
  await load(f.vaultBlur, () => import('./vault-blur.js'), (m) => m.initVaultBlur(reduced));
  // Stage 2 — pulse (Heartbeat governor-exempt; First Breath + Scanline one-shots)
  await load(f.heartbeat, () => import('./heartbeat.js'), (m) => m.initHeartbeat(config));
  await load(f.firstBreath, () => import('./first-breath.js'), (m) => m.initFirstBreath());
  await load(f.scanline, () => import('./scanline.js'), (m) => m.initScanline());
  // Stage 3 — identity (New Route swaps the pre-armed line; Threshold Cut + Crack detonate the void)
  await load(f.thresholdCut, () => import('./threshold-cut.js'), (m) => m.initThresholdCut(config));
  await load(f.newRoute, () => import('./new-route.js'), (m) => m.initNewRoute());
  // Stage 4 — Heliostat (field-state, governor-exempt)
  await load(f.heliostat, () => import('./heliostat.js'), (m) => m.initHeliostat());
  // Stage 5 — weather traces (Governor: slipstream > crosswind > scanline)
  await load(f.slipstream, () => import('./slipstream.js'), (m) => m.initSlipstream());
  await load(f.crosswind, () => import('./crosswind.js'), (m) => m.initCrosswind());
  // Stage 6 — Patina (memory; the visit count + greeting swapped pre-paint)
  await load(f.patina, () => import('./patina.js'), (m) => m.initPatina(config));
}
