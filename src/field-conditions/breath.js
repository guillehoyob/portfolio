/**
 * WHITE NOON — Breath engine 2.0 (BRE-1 / BRE-3 / BRE-4) — the field's slow clock
 * Replaces idle-sigh.js ENTIRELY. One 10.4s resonance cycle with real ma holds
 * (inhale 3.6s → crest-hold 1s → release 0.4s notch → exhale 5.4s → valley 2.4s),
 * tuned from BREATH_PARAMS (config.js — a namespace SEPARATE from INTENSITY).
 * Publishes per frame: `field.breath` (0..1) + `--fc-breath` on <html>; amplitude
 * rides the separate `--fc-breath-amp` channel (first breath 1.25 / asleep 1.15).
 * Consumers multiply by var(--fc-int-breath,1) — boost amplifies WITHOUT touching
 * this engine. The sigh haze channel is DEAD (--fc-haze-opacity stays slipstream's).
 *
 * Triggering (per-channel idle, replaces the old flat 8s): scroll 1.5s / pointer
 * 3.5s / key 3.5s + field.energy < 0.08. CRITICAL RULE: pointermove never cancels
 * a breath in progress — it only delays one that hasn't started. Cancels (fast
 * 600ms easeOutCubic exhale → AWAKE): scroll |vel|>0.15, pointerdown, keydown.
 * While at rest the cycle CHAINS through a 2.4s ma valley (boost 1.2s).
 *
 * fc:crest (BRE-3): fired ONCE per cycle on `document` at the hold→release edge
 * (t=4600ms of the cycle) — the transient that beats change-blindness (dot glint
 * in heartbeat.js, nib ring in spine.js/W2).
 *
 * Rest tiers (BRE-4, "the lamp stays lit"): 30s → data-fc-rest="deep" (field.rest=1),
 * 60s → "asleep" (field.rest=2, cycle ×1.2, amp 1.15, valley 6s, --fc-rest-warm
 * floor 0.04 — HARD CAP 0.07 even in boost). `fc:rest` fires on every tier change.
 * WAKE on any input: tier cleared synchronously (<100ms), fast exhale, amp→1 and
 * one immediate fc:crest — the page opens its eyes. --fc-pulse-alpha 0.70 in rest
 * is applied by heliostat (W1) reading field.rest + fc:rest (inline beats CSS).
 *
 * PERF-1 decouple: ZERO tickers while waiting — lazy self-correcting setTimeouts
 * re-check input timestamps on fire; the ticker exists only for the ≤10.4s of an
 * actual cycle (+600ms cancel) and the shared rAF SLEEPS in every valley.
 *
 * Scrubbers (ephemeral QA): ?fc-breath=<0..1> freezes the channel (deterministic
 * diffs; the red-budget harness shoots with =0) · ?fc-breath=cycle chains cycles
 * forever, gates and cancels ignored · ?fc-rest=deep|asleep forces a tier (inputs
 * still wake it — that IS the assert). Reduced motion: installs NOTHING (tokens
 * hold --fc-breath at 0 — a dignified static state); live RM-on runs the standard
 * registerCleanup teardown.
 */
import { BREATH_PARAMS as P, REST_PARAMS as R } from './config.js';
import { addTicker, removeTicker, wake, field, registerCleanup, reduced } from './index.js';

const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

let engine = null; // module-scope so sighNow() works as a plain export (INT-4)

export function sighNow() { if (engine) engine.sigh(); }

export function initBreath() {
  if (engine) return; // idempotent
  const root = document.documentElement;

  let q = null;
  try { q = new URLSearchParams(location.search); } catch { /* */ }
  const qBreath = q ? q.get('fc-breath') : null;
  const qRest = q ? q.get('fc-rest') : null;

  // ── frozen scrubber: a deterministic, STATIC channel value (QA/harness only) ──
  if (qBreath != null && qBreath !== '' && qBreath !== 'cycle' && !isNaN(+qBreath)) {
    const v = clamp01(+qBreath);
    root.style.setProperty('--fc-breath', v.toFixed(4));
    field.breath = v;
    registerCleanup('breath', () => { root.style.setProperty('--fc-breath', '0'); field.breath = 0; });
    return;
  }
  const forceCycle = qBreath === 'cycle';

  if (reduced) return; // honest static state: tokens keep --fc-breath/--fc-rest-warm at 0

  /* ── state ── */
  field.rest = 0; // breath.js OWNS this field extension (CONTRACTS §b.6) — index.js doesn't seed it
  let boostMode = root.classList.contains('fc-boost');
  const now0 = Date.now();
  let lastScroll = now0, lastPointer = now0, lastKey = now0;
  let px = -1, py = -1;                  // pointermove >6px filter
  let running = false;                   // a cycle (or fast exhale) is in flight
  let cancelling = false;
  let cycleStart = 0, cycleMul = 1, crestFired = false;
  let cancelFrom = 0, cancelStart = 0;
  let lastPub = -1;                      // last published --fc-breath (gate writes)
  let firstDone = false;
  try { firstDone = sessionStorage.getItem('wn.firstBreathDone') === '1'; } catch { /* */ }

  const lastInput = () => Math.max(lastScroll, lastPointer, lastKey);
  const thScroll = () => (boostMode ? P.boost.idleScrollMs : P.idleScrollMs);
  const thPointer = () => (boostMode ? P.boost.idlePointerMs : P.idlePointerMs);
  const valleyMs = () => (field.rest === 2 ? R.asleepValleyMs : boostMode ? P.boost.valleyMs : P.valleyMs);

  const publish = (b) => {
    field.breath = b;
    if (Math.abs(b - lastPub) > 0.0008 || (b === 0 && lastPub !== 0)) {
      root.style.setProperty('--fc-breath', b.toFixed(4));
      lastPub = b;
    }
  };
  const setAmp = (a) => root.style.setProperty('--fc-breath-amp', a.toFixed(2));

  /* ── the curve (phase boundaries scale with the asleep cycleMul) ── */
  const curve = (e, mul) => {
    const inhale = P.inhaleMs * mul;
    const holdEnd = (P.inhaleMs + P.crestHoldMs) * mul;
    const relEnd = holdEnd + P.releaseMs * mul;
    const total = P.cycleMs * mul;
    if (e <= inhale) return Math.sin((e / inhale) * Math.PI / 2);
    if (e <= holdEnd) return 1;                                           // the ma of the peak
    if (e <= relEnd) return 1 - P.releaseDepth * easeOutCubic((e - holdEnd) / (P.releaseMs * mul));
    return (1 - P.releaseDepth) * Math.cos(((e - relEnd) / (total - relEnd)) * Math.PI / 2);
  };

  /* ── ticker: alive ONLY while a cycle / fast-exhale runs (the rAF sleeps in valleys) ── */
  const ticker = (t) => {
    if (!running) return false;
    if (cancelling) {
      const u = clamp01((performance.now() - cancelStart) / 600);
      publish(cancelFrom * (1 - easeOutCubic(u)));
      if (u >= 1) { running = false; cancelling = false; publish(0); armIdle(); return false; }
      return true;
    }
    const e = performance.now() - cycleStart;
    const total = P.cycleMs * cycleMul;
    const crestT = (P.inhaleMs + P.crestHoldMs) * cycleMul; // t=4600ms of the base cycle
    if (!crestFired && e >= crestT) {
      crestFired = true;
      document.dispatchEvent(new CustomEvent('fc:crest')); // once per cycle, never under RM
    }
    if (e >= total) {
      running = false; publish(0);
      armIdle(valleyMs()); // CHAIN: the ma valley, then the next cycle while rest lasts
      return false;
    }
    publish(clamp01(curve(e, cycleMul)));
    return true;
  };

  const startCycle = (amp) => {
    cycleMul = field.rest === 2 ? R.asleepCycleMul : 1;
    setAmp(amp != null ? amp : field.rest === 2 ? R.asleepAmp : 1);
    cycleStart = performance.now();
    crestFired = false; cancelling = false;
    if (!running) { running = true; addTicker(ticker); } // addTicker wakes the loop
    wake();
  };
  const cancelFast = () => {
    if (!running || cancelling || forceCycle) return;
    // F1 (QA respiración): an inhalation that climbed ≥0.6 PAYS its crest as it is
    // cancelled — the glint lands ON the user's gesture, at peak attention. In real
    // reading cadence the 4.6s crest almost never arrived: 6-7 inhalations per
    // minute died MUTE at breath 0.5-0.8. Now each one is felt as it exhales.
    if (!crestFired && field.breath >= 0.6) {
      crestFired = true;
      document.dispatchEvent(new CustomEvent('fc:crest'));
    }
    cancelFrom = field.breath; cancelStart = performance.now(); cancelling = true; wake();
  };

  /* ── lazy idle timer: ONE setTimeout, re-checks timestamps on fire (zero work per input) ── */
  let idleTimer = 0;
  function armIdle(extraMs) {
    clearTimeout(idleTimer);
    const n = Date.now();
    const waitG = Math.max(
      thScroll() - (n - lastScroll),
      thPointer() - (n - lastPointer),
      P.idleKeyMs - (n - lastKey),
    );
    const delay = Math.max(60, forceCycle ? (extraMs || 0) : Math.max(waitG, extraMs || 0));
    idleTimer = setTimeout(idleFire, delay);
  }
  function idleFire() {
    if (running) return; // the cycle's own end re-arms
    if (forceCycle) { startCycle(); return; }
    const n = Date.now();
    const gatesPass = n - lastScroll >= thScroll() && n - lastPointer >= thPointer()
      && n - lastKey >= P.idleKeyMs && field.energy < P.energyGate;
    if (gatesPass) startCycle();
    else armIdle(350); // energy still stirring (or re-touched) — check again shortly
  }

  /* ── BRE-4 rest tiers (lazy timer too) ── */
  const deepMs = () => (boostMode ? R.boost.deepMs : R.deepMs);
  const asleepMs = () => (boostMode ? R.boost.asleepMs : R.asleepMs);
  const warmFloor = () => Math.min(0.07, boostMode ? R.boost.warmFloor : R.warmFloor); // HARD CAP 0.07 always
  let restTimer = 0;
  const enterTier = (tier) => {
    if (field.rest === tier) return;
    field.rest = tier;
    root.dataset.fcRest = tier === 2 ? 'asleep' : 'deep';
    if (tier === 2) { root.style.setProperty('--fc-rest-warm', warmFloor().toFixed(2)); setAmp(R.asleepAmp); }
    document.dispatchEvent(new CustomEvent('fc:rest')); // heliostat (W1) re-applies pulse-alpha
  };
  function armRest() {
    clearTimeout(restTimer);
    const n = Date.now();
    const next = field.rest === 0 ? deepMs() : field.rest === 1 ? asleepMs() : 0;
    if (!next) return; // asleep is the deepest tier
    restTimer = setTimeout(restFire, Math.max(120, next - (n - lastInput())));
  }
  function restFire() {
    const idleFor = Date.now() - lastInput();
    if (field.rest < 2 && idleFor >= asleepMs()) enterTier(2);
    else if (field.rest < 1 && idleFor >= deepMs()) enterTier(1);
    armRest();
  }
  const wakeRest = () => {
    if (!field.rest) return;
    field.rest = 0;
    delete root.dataset.fcRest;                       // synchronous — the <100ms waking
    root.style.setProperty('--fc-rest-warm', '0');
    setAmp(1);
    document.dispatchEvent(new CustomEvent('fc:rest'));
    cancelFast();                                     // fast exhale out of the asleep cadence
    document.dispatchEvent(new CustomEvent('fc:crest')); // the page opens its eyes
    armRest();
  };

  /* ── inputs: timestamps only (cheap); cancels per the law; rest wake is immediate ── */
  const onScroll = () => {
    lastScroll = Date.now(); wakeRest();
    if (field.scrollVel > 0.15) cancelFast();
  };
  const onPointerMove = (e) => {
    if (px >= 0 && Math.hypot(e.clientX - px, e.clientY - py) <= 14) return; // jitter is not presence (V5.1: 6→14 — a reading hand resting on the mouse must not silence the field)
    px = e.clientX; py = e.clientY;
    lastPointer = Date.now(); wakeRest();
    // RULE: pointermove never cancels a breath in progress — it only delays the next one
  };
  const onPointerDown = () => { lastPointer = Date.now(); wakeRest(); cancelFast(); };
  const onTouchStart = () => { lastPointer = Date.now(); wakeRest(); };
  const onKeyDown = () => { lastKey = Date.now(); wakeRest(); cancelFast(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('pointerdown', onPointerDown, { passive: true });
  addEventListener('touchstart', onTouchStart, { passive: true });
  addEventListener('keydown', onKeyDown);

  /* ── INT-4: boost toggle answers with an immediate sigh (the old idle-sigh re-target) ── */
  const onIntensity = (e) => {
    boostMode = e.detail.mode === 'boost';
    armRest(); // boost tiers (8s/20s) take effect now
    if (boostMode) sighNow();
  };
  addEventListener('fc:intensity', onIntensity);

  engine = {
    sigh() { startCycle(); }, // restart from 0 — deterministic for the Fila-A assert
  };

  /* ── boot choreography ── */
  let firstTimer = 0;
  const markFirst = () => { try { sessionStorage.setItem('wn.firstBreathDone', '1'); } catch { /* */ } };
  if (forceCycle) {
    startCycle();
  } else if (boostMode) {
    // boost: an immediate breath at load, no gates (amplitude via --fc-int-breath)
    if (!firstDone) markFirst();
    startCycle(firstDone ? 1 : P.firstAmp);
  } else if (!firstDone) {
    // the ANTICIPATED first breath: 0.9s after load, amp 1.25, runs even if the
    // cursor moves (only the first page of the session — the welcome breath)
    firstTimer = setTimeout(() => {
      if (!running && field.scrollVel < 0.15) { markFirst(); startCycle(P.firstAmp); }
      else armIdle();
    }, P.firstDelayMs);
  } else {
    armIdle();
  }
  armRest();

  /* ── forced rest scrubber (after listeners: inputs still wake it — that IS the assert) ── */
  if (qRest === 'deep') enterTier(1);
  else if (qRest === 'asleep') enterTier(2);

  registerCleanup('breath', () => {
    removeEventListener('scroll', onScroll);
    removeEventListener('pointermove', onPointerMove);
    removeEventListener('pointerdown', onPointerDown);
    removeEventListener('touchstart', onTouchStart);
    removeEventListener('keydown', onKeyDown);
    removeEventListener('fc:intensity', onIntensity);
    clearTimeout(idleTimer); clearTimeout(restTimer); clearTimeout(firstTimer);
    removeTicker(ticker);
    running = false; cancelling = false; engine = null;
    field.breath = 0; field.rest = 0;
    root.style.setProperty('--fc-breath', '0');
    root.style.setProperty('--fc-breath-amp', '1');
    root.style.setProperty('--fc-rest-warm', '0');
    delete root.dataset.fcRest;
  });
}
