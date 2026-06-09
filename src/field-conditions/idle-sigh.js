/**
 * WHITE NOON — Idle sigh (Stage 5, new) — the field breathes once when you rest
 * After ~8s of zero scroll + zero cursor movement, with the field calm, the environment
 * takes ONE slow breath: the sky haze swells 0.05 → 0.08 → 0.05 over ~6s, then stops. NOT a
 * loop (a looping field-breath reads as a corporate logo) — a single sigh, the only ambient
 * the playbook sanctions for "the field responds to stillness". Any scroll/move cancels it.
 * Home only (the hero sky owns --fc-haze-opacity). Shared rAF; returns false when done so the
 * loop sleeps. Reduced motion / flag off → never runs (honest Stage-0).
 */
import { addTicker, removeTicker, field, onReducedMotionChange } from './index.js';

const SIGH_MS = 6000;

export function initIdleSigh() {
  if (!document.getElementById('hero')) return; // the hero sky is what breathes
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;

  let lastActive = Date.now();
  let sighing = false, sighStart = 0;
  const stopSigh = () => { sighing = false; root.style.removeProperty('--fc-haze-opacity'); };
  const bump = () => { lastActive = Date.now(); if (sighing) stopSigh(); };
  addEventListener('scroll', bump, { passive: true });
  addEventListener('pointermove', bump, { passive: true });

  const ticker = () => {
    const now = Date.now();
    if (!sighing) {
      if (now - lastActive > 8000 && field.energy < 0.001) { sighing = true; sighStart = now; }
      else return false; // not yet — the hero heartbeat keeps the loop alive to re-check
    }
    const t = (now - sighStart) / SIGH_MS;
    if (t >= 1) { stopSigh(); return false; }
    root.style.setProperty('--fc-haze-opacity', (0.05 + Math.sin(t * Math.PI) * 0.06).toFixed(4)); // 0.05→0.11→0.05 (the cap, so it's actually visible)
    return true;
  };
  addTicker(ticker);

  onReducedMotionChange((r) => { if (r) { removeTicker(ticker); stopSigh(); } });
}
