/**
 * WHITE NOON — Idle sigh (Stage 5, new) — the field breathes once when you rest
 * After ~8s of zero scroll + zero cursor movement, with the field calm, the environment
 * takes ONE slow breath: the sky haze swells 0.05 → 0.08 → 0.05 over ~6s, then stops. NOT a
 * loop (a looping field-breath reads as a corporate logo) — a single sigh, the only ambient
 * the playbook sanctions for "the field responds to stillness". Any scroll/move cancels it.
 * Home only (the hero sky owns --fc-haze-opacity). Shared rAF; returns false when done so the
 * loop sleeps. Reduced motion / flag off → never runs (honest Stage-0).
 */
import { addTicker, removeTicker, wake, field, onReducedMotionChange } from './index.js';

const SIGH_MS = 6000;
const IDLE_MS = 8000;

export function initIdleSigh() {
  if (!document.getElementById('hero')) return; // the hero sky is what breathes
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;

  let sighing = false, sighStart = 0, timer = 0;
  const stopSigh = () => { sighing = false; field.breath = 0; root.style.removeProperty('--fc-haze-opacity'); };
  // OWN idle timer, decoupled from the shared loop (audit PERF-1 coupling): the old
  // version counted its 8s INSIDE the rAF loop, which only kept running because
  // spine/particles never slept — with honest tickers the loop suspends at rest and
  // the sigh's own timer is what wakes it.
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (field.energy < 0.001) { sighing = true; sighStart = Date.now(); wake(); }
      else arm(); // the field is still stirring — wait another breath-length
    }, IDLE_MS);
  };
  const bump = () => { if (sighing) stopSigh(); arm(); };
  addEventListener('scroll', bump, { passive: true });
  addEventListener('pointermove', bump, { passive: true });
  arm();

  const ticker = () => {
    if (!sighing) return false; // at rest the loop may sleep — the timer wakes it
    const t = (Date.now() - sighStart) / SIGH_MS;
    if (t >= 1) { stopSigh(); arm(); return false; } // re-arm → it sighs AGAIN after another 8s of rest
    const breath = Math.sin(t * Math.PI);
    field.breath = breath; // publish the field's slow breath → the heartbeat dot + spine breathe WITH it (one organism)
    root.style.setProperty('--fc-haze-opacity', (0.05 + breath * 0.06).toFixed(4)); // 0.05→0.11→0.05 (the cap, so it's visible)
    return true;
  };
  addTicker(ticker);

  onReducedMotionChange((r) => { if (r) { removeTicker(ticker); stopSigh(); clearTimeout(timer); } });
}
