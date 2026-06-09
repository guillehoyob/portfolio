/**
 * WHITE NOON — Sky sparkles (Stage 5, redesigned) — the air near the thread, made of light
 * A few tiny motes that live in the AIR beside the red spine (the left gutter) and TWINKLE —
 * fading in and out like dust catching light, not steady dots. They are the volatile, lighter-
 * than-the-ocean layer: they take the hour's colour (--fc-sky-hue, from Heliostat) and react to
 * the CURSOR — twinkling faster + brighter the quicker you move (field.energy) and where the
 * cursor passes near them. Subtle by design. Home only, pointer-fine; OFF under reduced motion.
 * Shared rAF; a handful of float ops + one transform/opacity per mote/frame.
 */
import { addTicker, removeTicker, field, onReducedMotionChange } from './index.js';

const COUNT = 16; // a fuller sprinkling of caught sparks (still slow + low-opacity → calm, not a starfield)

export function initParticles() {
  if (!document.getElementById('hero')) return; // the landing field
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (document.querySelector('.fc-sky')) return;

  const layer = document.createElement('div');
  layer.className = 'fc-sky';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const laneX = () => innerWidth * (innerWidth >= 1024 ? 0.06 : 0.045); // beside the spine

  const motes = Array.from({ length: COUNT }, (_, i) => {
    const el = document.createElement('span');
    el.className = 'fc-mote';
    const size = 3 + (i % 3) * 2; // 3..7px sparkles
    el.style.width = el.style.height = size + 'px';
    layer.appendChild(el);
    return {
      el,
      off: (((i * 53.7) % 100) / 100 - 0.5) * 150, // ±75px around the spine lane
      y: (((i * 137.5) % 100) / 100) * innerHeight,
      tw: (i * 0.7) % (Math.PI * 2), // twinkle phase
      sp: 0.7 + (i % 4) * 0.22,      // twinkle speed
    };
  });

  const ticker = (t) => {
    const e = field.energy, cx = field.cursorX, cy = field.cursorY, lx = laneX();
    for (const m of motes) {
      m.y -= 0.05 + e * 0.4;                              // slow rise, quicker when the field stirs
      if (m.y < -10) m.y = innerHeight + 10;
      const x = lx + m.off + Math.sin(t / 2600 + m.tw) * 9; // gentle sway in the gutter
      // TWINKLE — opacity fades in/out; faster + brighter with cursor SPEED (energy) and proximity
      const twk = Math.sin((t / 1000) * m.sp * (1 + e * 1.5) + m.tw) * 0.5 + 0.5;
      const near = Math.max(0, 1 - Math.hypot(x - cx, m.y - cy) / 240);
      const op = 0.05 + twk * (0.32 + e * 0.4) + near * 0.35; // faint base, sparkles, surges near the cursor
      m.el.style.opacity = Math.min(0.9, op).toFixed(3);
      m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
    }
    return true;
  };
  addTicker(ticker);

  onReducedMotionChange((r) => { if (r) { removeTicker(ticker); layer.remove(); } });
}
