/**
 * WHITE NOON — Magnet (BREAK-5) — the one red button leans toward the hand
 * Within 80px, the primary CTA (and the FIELD capsule) drifts ≤4px toward the
 * cursor — contained, never playful; the release snaps back on a CSS spring
 * (--ease-spring, linear() with a 2% overshoot). Field physics (lerp on the
 * shared ticker) — exempt from the 600ms–4s band per CONCEPT §7.3a. The red's
 * AREA never changes (translate only — budget intact). pointer:fine only;
 * reduced motion → never inits.
 */
import { addTicker, removeTicker, field, registerCleanup } from './index.js';

const R = 80, MAX = 4;

export function initMagnet() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const els = [...document.querySelectorAll('.wn-btn--primary, .fc-intensity:not(.fc-intensity--wx)')];
  if (!els.length) return;

  const targets = els.map((el) => ({ el, x: 0, y: 0, on: false }));
  let rects = null;
  const measure = () => {
    rects = targets.map((t) => { const b = t.el.getBoundingClientRect(); return { cx: b.left + b.width / 2, cy: b.top + b.height / 2 }; });
  };
  let rt = 0;
  const onScrollResize = () => { rects = null; clearTimeout(rt); rt = setTimeout(() => { rects = null; }, 80); };
  addEventListener('scroll', onScrollResize, { passive: true });
  addEventListener('resize', onScrollResize, { passive: true });

  const ticker = () => {
    if (field.cursorVel <= 0 && !targets.some((t) => t.on)) return false;
    if (!rects) measure();
    let worked = false;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i], r = rects[i];
      const dx = field.cursorX - r.cx, dy = field.cursorY - r.cy;
      const d = Math.hypot(dx, dy);
      if (d < R && d > 0.5) {
        const k = (1 - d / R) * MAX;
        t.el.style.translate = `${((dx / d) * k).toFixed(1)}px ${((dy / d) * k).toFixed(1)}px`;
        t.on = true;
        worked = true;
      } else if (t.on) {
        t.el.style.translate = ''; // the spring release lives in CSS (--ease-spring)
        t.on = false;
        worked = true;
      }
    }
    return worked;
  };
  addTicker(ticker);

  registerCleanup('magnet', () => {
    removeTicker(ticker);
    removeEventListener('scroll', onScrollResize);
    removeEventListener('resize', onScrollResize);
    targets.forEach((t) => { t.el.style.translate = ''; });
  });
}
