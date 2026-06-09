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
  [16, 0.55, 3.2, 0.00],  // tarde — ya entibiando (warmth floor up so the afternoon reads warm, not cool-grey)
  [18, 0.70, 4.8, 0.00],  // atardecer dorado (warm golden, clearly visible — the owner's chosen direction)
  [19.5, 0.88, 5.0, 0.12],// crepúsculo (warm sunset glow, the day's peak presence)
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
    let t = now.getHours() + now.getMinutes() / 60; // continuous hour 0..24
    try { const q = new URLSearchParams(location.search).get('fc-hour'); if (q != null && q !== '' && !isNaN(+q)) t = ((+q % 24) + 24) % 24; } catch { /* */ } // dev scrubber: ?fc-hour=17 previews any hour's light
    const [warmth, alpha, dim] = dayLight(t);
    const a = Math.min(5, alpha).toFixed(2);
    const hue = `color-mix(in srgb, var(--sun) ${Math.round(warmth * 100)}%, var(--sky))`; // warm↔cool of the hour
    root.style.setProperty('--fc-sky-hue', hue);                       // the motes take the hour's colour
    root.style.setProperty('--fc-tint', `color-mix(in srgb, ${hue} ${a}%, transparent)`); // flat → crossfades smoothly; .fc-tint mask makes it top-down
    root.style.setProperty('--fc-field', dim > 0.02
      ? `color-mix(in srgb, var(--field-0) ${Math.round(100 - dim * 100)}%, var(--field-0-dim))`
      : 'var(--field-0)');
    root.style.setProperty('--fc-pulse-alpha', dim > 0.45 ? '1' : '0.85');
    // the "sun": a warm glow that travels low→high→low + east→west through the day and is
    // brightest/warmest at dawn & dusk — the day-light made perceptible in one part of the field.
    const sx = (6 + Math.max(0, Math.min(1, (t - 5) / 15)) * 88).toFixed(0);   // 6%→94% east→west (5h→20h)
    const sy = (4 + Math.min(1, Math.abs(t - 13) / 8) * 28).toFixed(0);        // high (4%) at noon, low (32%) at dawn/dusk
    const sUp = (t > 4.5 && t < 21) ? 1 : 0.3;                                 // a dim disc through the night
    root.style.setProperty('--fc-sun-x', sx + '%');
    root.style.setProperty('--fc-sun-y', sy + '%');
    root.style.setProperty('--fc-sun-glow', `color-mix(in srgb, var(--sun) ${Math.round(60 + warmth * 35)}%, var(--sky))`);
    root.style.setProperty('--fc-sun-op', (warmth * 0.22 * sUp).toFixed(3));   // visible (~0.10–0.22), warmest at dawn/dusk
    root.dataset.daypart = daypartFor(Math.floor(t));
  };
  apply();
  setInterval(apply, 60000); // minute by minute — the day flows
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
}
