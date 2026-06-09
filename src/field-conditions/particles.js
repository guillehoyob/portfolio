/**
 * WHITE NOON — Field motes (Stage 5, new) — dust in a shaft of light (in'ei)
 * A few (8) faint warm motes drift slowly up through the field and lean gently
 * away from the cursor, like dust disturbed by a passing hand. Whisper-quiet:
 * 1.5–2.5px, ~18% warm alpha, behind content (the grain layer), fixed. Home only,
 * pointer-fine only; fully OFF under reduced motion (no element, no loop). Runs on
 * the ONE shared rAF; a handful of float ops per frame; suspends on tab-hide.
 */
import { addTicker, removeTicker, wake, onReducedMotionChange } from './index.js';

const COUNT = 6;

export function initParticles() {
  if (!document.getElementById('hero')) return; // home only (the landing field)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return; // pointer devices only
  if (document.querySelector('.fc-motes')) return;

  const layer = document.createElement('div');
  layer.className = 'fc-motes';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  // deterministic spread (no Math.random — quasi-random offsets keep it calm)
  const motes = Array.from({ length: COUNT }, (_, i) => {
    const el = document.createElement('span');
    el.className = 'fc-mote';
    const size = 1.5 + (i % 3) * 0.5;
    el.style.width = el.style.height = size + 'px';
    layer.appendChild(el);
    return {
      el,
      x: (((i * 137.5) % 100) / 100) * innerWidth,
      y: (((i * 53.7) % 100) / 100) * innerHeight,
      vx: (i % 2 ? 1 : -1) * (0.04 + (i % 3) * 0.015),
      vy: -(0.07 + (i % 4) * 0.025), // gentle upward drift (rising dust)
    };
  });

  let cx = -9999, cy = -9999;
  window.addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; wake(); }, { passive: true });
  document.addEventListener('pointerleave', () => { cx = -9999; cy = -9999; });

  const ticker = (t) => {
    const w = innerWidth, h = innerHeight;
    for (const m of motes) {
      m.x += m.vx + Math.sin(t / 3000 + m.y * 0.01) * 0.12; // drift + slow sway
      m.y += m.vy;
      // faint cursor avoidance (dust nudged by the hand)
      const dx = m.x - cx, dy = m.y - cy, d2 = dx * dx + dy * dy;
      if (d2 < 14000) {
        const dist = Math.sqrt(d2) || 1, f = (1 - d2 / 14000) * 0.6;
        m.x += (dx / dist) * f; m.y += (dy / dist) * f;
      }
      if (m.y < -4) { m.y = h + 4; m.x = (m.x + 53) % w; } // wrap to the bottom
      if (m.x < -4) m.x = w + 4; else if (m.x > w + 4) m.x = -4;
      m.el.style.transform = `translate3d(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
    }
    return true; // continuous ambient drift; suspends on tab-hide
  };
  addTicker(ticker);

  // live OS reduced-motion toggle → tear the motes down (§5 law 4)
  onReducedMotionChange((r) => { if (r) { removeTicker(ticker); layer.remove(); } });
}
