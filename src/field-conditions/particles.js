/**
 * WHITE NOON — Sky motes (Stage 5 — TOU-5 base + SKY-8/10/12 + BRE-4 diffs)
 * A few tiny motes in the air beside the red spine that TWINKLE — dust catching
 * light. W4 owns this file; the weather couplings arrive READ-ONLY via field.wx
 * (W1's weather.js) and are harmless when weather is absent (every mul → 1).
 *
 * TOU-5 — touch parity of the SKY: the pointer-fine gate is GONE. On touch the
 * motes exist (COUNT 10 under 768px), the tap is the hand in the air (a near-
 * surge around the last tap, 2.5s window) and the twinkle floor rises to 0.18
 * (also fixes VIS-03 on desktop — two complaints, one lever).
 *
 * SKY-8 — snow mode (field.wx.state === 'snow'): the velocity vector LERPS over
 * ~3s (dtFactor 0.018) from the warm rise to a cold fall + wind push; opacity
 * caps at 0.55 (0.72 boost); the cold colour/blend is CSS (.fc-sky--snow, W1).
 * SKY-10/12 — fog halves the motes, rain mutes 0.8; wind widens the sway
 * (9 + wind·8), drifts them laterally (wind·0.12 px/frame, wrapped) and speeds
 * the twinkle (×(1 + wind·0.3)). BRE-4 — in rest tiers the motes SETTLE:
 * rise and twinkle speed ×0.6 (field.rest).
 *
 * BATTERY BUDGET (sine-qua-non, PERF-1): the work-condition is
 *   energy > 0.01 || field.breath > 0 || tap < 2.5s || cursor stirring ||
 *   (snowing && tab visible)
 * — otherwise the motes FREEZE at their last opacity (still dust, a dignified
 * static state) and the ticker returns false so the shared rAF can sleep. The
 * snow exception (loop alive while it snows and the tab is visible) is a
 * deliberate documented cost. Boost re-sizes live via the fc:intensity event
 * (eje moteSize); amplitude reads intensity.mote AT THE POINT OF USE.
 * Reduced motion → never built. Not on the print sheet.
 */
import { addTicker, removeTicker, wake, field, registerCleanup, dtFactor, intensity } from './index.js';

export function initParticles() {
  if (document.body.classList.contains('cv-wrap')) return; // not on the print sheet
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.querySelector('.fc-sky')) return; // idempotent

  const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
  const COUNT = touch && innerWidth < 768 ? 10 : 16;

  const layer = document.createElement('div');
  layer.className = 'fc-sky';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const laneX = () => innerWidth * (innerWidth >= 1024 ? 0.06 : 0.045); // beside the spine
  const spread = () => Math.min(75, innerWidth * 0.08); // at 390px the motes never sit on text

  const motes = Array.from({ length: COUNT }, (_, i) => {
    const el = document.createElement('span');
    el.className = 'fc-mote';
    layer.appendChild(el);
    return {
      el,
      base: 4 + (i % 3) * 2,                            // 4..8px sparkles
      off: (((i * 53.7) % 100) / 100 - 0.5) * 2,        // -1..1 → × spread() at render
      y: (((i * 137.5) % 100) / 100) * innerHeight,
      vy: 0,                                            // lerped velocity vector (SKY-8)
      ph: (i * 0.7) % (Math.PI * 2),                    // twinkle phase (accumulated by dt)
      sp: 0.7 + (i % 4) * 0.22,                         // twinkle speed
      tw: (i * 0.7) % (Math.PI * 2),                    // sway phase offset
    };
  });
  // mote size scales with the moteSize axis — re-applied live on the boost toggle
  const size = () => {
    for (const m of motes) {
      const s = (m.base * intensity.moteSize).toFixed(1) + 'px';
      m.el.style.width = s; m.el.style.height = s;
    }
  };
  size();
  let boostMode = document.documentElement.classList.contains('fc-boost');
  const onIntensity = (e) => { boostMode = e.detail.mode === 'boost'; size(); wake(); };
  addEventListener('fc:intensity', onIntensity);

  // TOU-5: the tap is the hand in the air — a near-surge around the last tap (2.5s window)
  let tapX = -9999, tapY = -9999, tapT = 0;
  const onTap = (e) => { tapX = e.clientX; tapY = e.clientY; tapT = Date.now(); wake(); };
  addEventListener('pointerdown', onTap, { passive: true });

  let drift = 0; // lateral wind drift, wrapped horizontally (SKY-12.1)
  const ticker = (t, dt) => {
    const wx = field.wx;
    const snow = !!wx && wx.state === 'snow';
    // ── the battery budget: freeze (last opacity holds — still dust) unless something stirs
    const tapAge = (Date.now() - tapT) / 2500;
    const live = field.energy > 0.01 || field.breath > 0 || tapAge < 1
      || field.cursorVel > 0.005 || (snow && !document.hidden);
    if (!live) return false;

    const e = field.energy, cx = field.cursorX, cy = field.cursorY, lx = laneX();
    const wind = (wx && wx.wind) || 0;
    const fogMul = wx && wx.state === 'fog' ? 0.5 : 1;
    const rainMul = wx && wx.state === 'rain' ? 0.8 : 1;     // anti-noise with the rain
    const restMul = field.rest ? 0.6 : 1;                    // BRE-4: the motes settle
    const dtF = (dt || 16.7) / 16.7;
    const sprd = spread();
    if (!snow) drift += wind * 0.12 * dtF;                   // wind pushes the air sideways
    const W = innerWidth + 32;

    for (const m of motes) {
      // velocity VECTOR with a ~3s lerp (SKY-8 — from day one, so the snow turn is a weather front, not a switch)
      const vyTarget = (snow ? 0.55 + wind * 0.45 : -(0.05 + e * 0.4)) * restMul;
      m.vy += (vyTarget - m.vy) * dtFactor(0.018, dt);
      m.y += m.vy * dtF;
      if (snow && m.y > innerHeight + 10) m.y = -10;
      if (!snow && m.y < -10) m.y = innerHeight + 10;

      const swayAmp = snow ? 14 : 9 + wind * 8;
      let x = lx + m.off * sprd * (snow ? 1.5 : 1)
        + Math.sin(t / (snow ? 3400 : 2600) + m.tw) * swayAmp
        + (snow ? wind * 18 : drift);
      x = ((x + 16) % W + W) % W - 16;                       // horizontal wrap for the drift

      // TWINKLE — phase accumulated by dt (speed changes glide instead of jumping):
      // speed = m.sp × (1 + wind·0.3) × restMul (SKY-12 / BRE-4)
      m.ph += (dt || 16.7) / 1000 * m.sp * (1 + wind * 0.3) * restMul;
      const twk = Math.sin(m.ph) * 0.5 + 0.5;
      const near = Math.max(0, 1 - Math.hypot(x - cx, m.y - cy) / 240);
      const nearTap = tapAge < 1 ? Math.max(0, 1 - Math.hypot(x - tapX, m.y - tapY) / 240) * (1 - tapAge) : 0;
      // the ONE final opacity formula (TOU-5 §5.5): floor 0.18, all couplings multiply
      const op = (0.18 + twk * (0.32 + e * 0.4) + Math.max(near, nearTap) * 0.35)
        * intensity.mote * fogMul * rainMul;
      m.el.style.opacity = Math.min(snow ? (boostMode ? 0.72 : 0.55) : 0.95, op).toFixed(3);
      m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
    }
    return true;
  };
  addTicker(ticker);

  registerCleanup('particles', () => {
    removeTicker(ticker);
    removeEventListener('fc:intensity', onIntensity);
    removeEventListener('pointerdown', onTap);
    layer.remove();
  });
}
