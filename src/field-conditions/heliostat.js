/**
 * WHITE NOON — Heliostat (Stage 4, §5.1) — CONTINUOUS sky-light through the day
 * The field carries the light of the actual hour, flowing minute by minute through warm dawn →
 * day → clear noon → cool afternoon → warm twilight → dim night, crossfaded smoothly. The tint
 * is a TOP-DOWN wash (the light comes from above, like the sky tinting the field) — see the mask
 * on .fc-tint. Every value is token-derived (color-mix of --sun / --sky / field tokens, ≤5% cap).
 * It also publishes --fc-sky-hue (the hour's colour) so the sky motes take the daypart's light.
 * Zero rAF (one timer/minute). Governor-EXEMPT. Reduced motion: state applies, crossfade removed.
 */
export function daypartFor(h) {
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'noon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// [hour, warmth (1=--sun … 0=--sky), tint alpha %, field dim 0..1] — the day's key lights
const ANCHORS = [
  [0, 0.30, 4.0, 0.60],   // deep night (cool, dim)
  [5, 1.00, 4.0, 0.30],   // first light (warm)
  [7.5, 1.00, 5.0, 0.00], // amanecer cálido (warm, full)
  [11, 0.70, 1.6, 0.00],  // día
  [13, 0.50, 0.0, 0.00],  // mediodía limpio (clear)
  [16, 0.32, 2.0, 0.00],  // tarde
  [18, 0.12, 4.2, 0.00],  // tarde fría (cool)
  [19.5, 0.85, 5.0, 0.12],// crepúsculo (warm sunset glow)
  [21, 0.42, 4.2, 0.42],  // night falls
  [24, 0.30, 4.0, 0.60],
];
function dayLight(t) {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i], b = ANCHORS[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const f = (t - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
    }
  }
  return [0.5, 0, 0];
}

export function initHeliostat() {
  const root = document.documentElement;
  const apply = () => {
    const now = new Date();
    const t = now.getHours() + now.getMinutes() / 60; // continuous hour 0..24
    const [warmth, alpha, dim] = dayLight(t);
    const a = Math.min(5, alpha).toFixed(2);
    const hue = `color-mix(in srgb, var(--sun) ${Math.round(warmth * 100)}%, var(--sky))`; // warm↔cool of the hour
    root.style.setProperty('--fc-sky-hue', hue);                       // the motes take the hour's colour
    root.style.setProperty('--fc-tint', `color-mix(in srgb, ${hue} ${a}%, transparent)`); // flat → crossfades smoothly; .fc-tint mask makes it top-down
    root.style.setProperty('--fc-field', dim > 0.02
      ? `color-mix(in srgb, var(--field-0) ${Math.round(100 - dim * 100)}%, var(--field-0-dim))`
      : 'var(--field-0)');
    root.style.setProperty('--fc-pulse-alpha', dim > 0.45 ? '1' : '0.85');
    root.dataset.daypart = daypartFor(now.getHours());
  };
  apply();
  setInterval(apply, 60000); // minute by minute — the day flows
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
}
