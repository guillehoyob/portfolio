/**
 * WHITE NOON — Crosswind (Stage 5, §5.3)
 * Cursor presence: a 600px --sky radial haze (≤8% alpha) at --z-haze follows the
 * cursor with heavy lag (lerp 0.05 — Drift inertia), and a smaller --ink-ghost
 * multiply spot rides at --z-warm (above content, below nav) so hairlines passing
 * under it read one step warmer with no per-element checks. Pointer devices only;
 * never created on touch or under reduced motion. Runs in the ONE shared rAF;
 * frames skip when displacement <0.1px. Governor: holds the weather slot while the
 * cursor is in the window, yields to Slipstream while scrolling, releases on leave.
 */
import { addTicker, removeTicker, wake, registerWeather, requestWeather, releaseWeather, onReducedMotionChange, field } from './index.js';

export function initCrosswind() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return; // pointer devices only

  const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); return d; };
  const sky = mk('fc-crosswind fc-crosswind--sky');
  const warm = mk('fc-crosswind fc-crosswind--warm');
  document.body.append(sky, warm);

  let cx = innerWidth / 2, cy = innerHeight / 2;
  let px = cx, py = cy, wx = cx, wy = cy;
  let suspended = false, gone = true;

  registerWeather('crosswind', (s) => {
    suspended = s;
    if (s) { sky.style.opacity = '0'; warm.style.opacity = '0'; }
    else if (!gone) { sky.style.opacity = ''; warm.style.opacity = ''; }
  });

  window.addEventListener('pointermove', (e) => {
    cx = e.clientX; cy = e.clientY; gone = false;
    requestWeather('crosswind'); // ALWAYS re-ask — the suspend hook restores opacity when granted
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => {
    gone = true; sky.style.opacity = '0'; warm.style.opacity = '0';
    releaseWeather('crosswind'); // free the slot so the footer Scanline can drift
  });

  const ticker = () => {
    if (suspended || gone) return false;
    const ox = px, oy = py;
    // SKY reads the field's energy: calm = heavy lag (a lingering trail); agitated = tighter lag
    // (the air quickens with the field). Opacity/area untouched — only the lag changes.
    const skyLerp = 0.020 + field.energy * 0.035;
    px += (cx - px) * skyLerp; py += (cy - py) * skyLerp;
    wx += (cx - 34 - wx) * 0.05; wy += (cy - wy) * 0.05; // warm spot tracks tighter, 34px behind (Fib)
    sky.style.transform = `translate3d(${px - 300}px, ${py - 300}px, 0)`;
    warm.style.transform = `translate3d(${wx - 120}px, ${wy - 120}px, 0)`;
    return Math.abs(px - ox) > 0.05 || Math.abs(py - oy) > 0.05; // idle pointer costs nothing
  };
  addTicker(ticker);

  // live OS reduced-motion toggle → tear the cursor field down (§5 law 4)
  onReducedMotionChange((r) => {
    if (!r) return;
    removeTicker(ticker);
    releaseWeather('crosswind');
    sky.remove();
    warm.remove();
  });
}
