/**
 * WHITE NOON — footer Scanline (Stage 2, §5.11)
 * A 1px × 64px --pulse line drifts across the footer width in 4s linear, once
 * per 60s while the footer is ≥50% visible. The footer's single pulse instance.
 * Governor: lowest precedence — it asks for the weather slot before each drift
 * and skips if Crosswind/Slipstream hold it (one weather behavior per viewport).
 * Reduced motion → no-op: the static 64px segment sits at the footer's left edge.
 */
import { registerWeather, requestWeather, releaseWeather } from './index.js';

export function initScanline() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scan = document.querySelector('.footer__scanline');
  if (!scan) return;

  let visible = false;
  let timer = 0;
  let suspended = false;

  registerWeather('scanline', (s) => {
    suspended = s;
    if (s) scan.classList.remove('fc-scan-run'); // outranked mid-drift → stop
  });

  const run = () => {
    if (!visible || suspended || scan.classList.contains('fc-scan-run')) return;
    if (!requestWeather('scanline')) return; // a higher-precedence weather holds the slot
    scan.style.setProperty('--fc-scan-w', `${Math.max(0, scan.clientWidth - 64)}px`);
    scan.classList.add('fc-scan-run');
  };
  scan.addEventListener('animationend', () => {
    scan.classList.remove('fc-scan-run');
    releaseWeather('scanline');
  });

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !timer) { run(); timer = setInterval(run, 60000); }
      else if (!visible && timer) { clearInterval(timer); timer = 0; releaseWeather('scanline'); }
    },
    { threshold: 0.5 }
  );
  io.observe(scan);
}
