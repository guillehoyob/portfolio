/**
 * WHITE NOON — Sky light (Stage 5, redesigned) — dust catching light, high in the field
 * The SKY stratum's atmosphere: a FEW (5) very faint, SOFT warm light-blooms — not hard
 * specks (which read as screen-dirt on white) but soft radial WARMTH, motes in a shaft of
 * light (in'ei, Tanizaki). They belong to the sky and obey its law: they read the field's
 * ENERGY (drift a touch quicker + the whole sky brightens when the field stirs) and otherwise
 * just breathe — never the cursor, never the red. Behind content (the grain layer). Home only,
 * pointer-fine; OFF under reduced motion. Shared rAF; one transform per mote/frame.
 */
import { addTicker, removeTicker, field, onReducedMotionChange } from './index.js';

const COUNT = 7;

export function initParticles() {
  if (!document.getElementById('hero')) return; // the landing field
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (document.querySelector('.fc-sky')) return;

  const layer = document.createElement('div');
  layer.className = 'fc-sky';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const motes = Array.from({ length: COUNT }, (_, i) => {
    const el = document.createElement('span');
    el.className = 'fc-mote';
    const size = 7 + (i % 3) * 4; // 7..15px soft warm blooms (dust catching light)
    el.style.width = el.style.height = size + 'px';
    layer.appendChild(el);
    return {
      el,
      x: (((i * 137.5) % 100) / 100) * innerWidth,
      y: (((i * 61.8) % 100) / 100) * innerHeight * 0.7, // biased HIGH (sky)
      vx: (i % 2 ? 1 : -1) * (0.02 + (i % 3) * 0.008),
      vy: -(0.012 + (i % 4) * 0.008), // very slow rise
      ph: i * 1.3,
    };
  });

  const ticker = (t) => {
    const e = field.energy;          // sky reads ENERGY (never the cursor, never the red)
    const spd = 1 + e * 1.6;         // the air quickens when the field stirs
    const w = innerWidth, h = innerHeight;
    for (const m of motes) {
      m.x += (m.vx + Math.sin(t / 4000 + m.ph) * 0.05) * spd;
      m.y += m.vy * spd;
      if (m.y < -10) { m.y = h * 0.75; m.x = (m.x + 70) % w; } // recycle high
      if (m.x < -10) m.x = w + 10; else if (m.x > w + 10) m.x = -10;
      m.el.style.transform = `translate3d(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
    }
    layer.style.opacity = (0.55 + e * 0.45).toFixed(3); // sky drifts AND brightens with energy
    return true; // continuous gentle drift (home only; suspends on tab-hide)
  };
  addTicker(ticker);

  onReducedMotionChange((r) => { if (r) { removeTicker(ticker); layer.remove(); } });
}
