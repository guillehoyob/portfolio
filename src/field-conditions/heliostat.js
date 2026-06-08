/**
 * WHITE NOON — Heliostat (Stage 4, §5.1)
 * The field has weather: time of day. data-daypart is set on <html> pre-paint
 * (head snippet → no flash of the wrong daypart) and re-checked on
 * visibilitychange + a 60s interval that only acts when a daypart boundary is
 * crossed. CSS derives every tint from the --sun / --sky tokens via the
 * data-daypart attribute (never raw rgba). Governor-EXEMPT: a one-shot
 * field-state transition (≤4 background crossfades/day, zero rAF), not weather.
 * Reduced motion: the daypart state still applies; the 4s crossfade is removed
 * in CSS (instant swap).
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
    const dp = daypartFor(new Date().getHours());
    if (root.dataset.daypart !== dp) root.dataset.daypart = dp; // CSS crossfades the change
  };
  apply(); // equals the pre-paint value at load; only acts on a boundary crossing
  setInterval(apply, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
}
