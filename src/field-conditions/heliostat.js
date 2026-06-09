/**
 * WHITE NOON — Heliostat (Stage 4, §5.1) — CONTINUOUS time-of-day field
 * The field has weather: the light of the actual hour. Rather than four discrete daypart
 * swaps, the tint flows CONTINUOUSLY through the day — recomputed minute by minute and
 * crossfaded — from a warm dawn (--sun), through a clear noon (no tint), to a cool evening
 * (--sky), into a dimmed night (the field itself darkens). Every value is token-derived
 * (color-mix of --sun / --sky / field tokens, never raw rgba) and stays ≤5% tint (the hard
 * cap). data-daypart is still set for the few rules that read it (the night dot alpha). Zero
 * rAF (one timer/minute). Reduced motion: the state still applies; the crossfade is removed
 * in CSS (instant). Governor-EXEMPT — a field state, not weather.
 */
export function daypartFor(h) {
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'noon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function initHeliostat() {
  const root = document.documentElement;
  const apply = () => {
    const now = new Date();
    const t = now.getHours() + now.getMinutes() / 60; // 0..24, continuous
    // three smooth channels through the day (triangular crests, no rAF)
    const warm = Math.max(0, 1 - Math.abs(t - 7.5) / 4.5); // dawn warmth, crest ~07:30
    const cool = Math.max(0, 1 - Math.abs(t - 19) / 4);    // evening cool, crest ~19:00
    const night = t <= 5 ? (5 - t) / 5 : t >= 21 ? Math.min(1, (t - 21) / 3) : 0; // deepens pre-5h / post-21h

    // tint: the dominant channel's hue, alpha capped at the hard 5%
    const a = Math.min(5, warm * 5 + cool * 5 + night * 4).toFixed(2);
    const hue = night > warm && night > cool ? 'var(--sky)' : warm >= cool ? 'var(--sun)' : 'var(--sky)';
    root.style.setProperty('--fc-tint', `color-mix(in srgb, ${hue} ${a}%, transparent)`);

    // the field itself dims continuously into the night (token-derived; reverts by day)
    const dim = Math.min(1, night);
    root.style.setProperty('--fc-field', dim > 0.02
      ? `color-mix(in srgb, var(--field-0) ${(100 - dim * 100).toFixed(0)}%, var(--field-0-dim))`
      : 'var(--field-0)');
    root.style.setProperty('--fc-pulse-alpha', dim > 0.5 ? '1' : '0.85');

    root.dataset.daypart = daypartFor(now.getHours()); // kept for any rule that still reads it
  };
  apply();
  setInterval(apply, 60000); // minute by minute — the day flows continuously
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
}
