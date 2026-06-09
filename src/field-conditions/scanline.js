/**
 * WHITE NOON — footer Scanline (Stage 2, §5.11) — a pulse of light, not a scan
 * A soft 72px --pulse glow drifts across the footer on the page's signature
 * --ease-run curve, fading up as it enters and down as it leaves (no hard edges,
 * no constant velocity → reads as a travelling pulse, not a robotic progress bar).
 * Cadence is φ-jittered (45–63s, never the same gap) so it feels alive, not a
 * metronome. Decoupled from the weather governor (footer-pinned, never collides
 * with the cursor haze). Reduced motion → no-op: a static soft glow at the edge.
 */
import { onReducedMotionChange } from './index.js';

export function initScanline() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scan = document.querySelector('.footer__scanline');
  if (!scan) return;
  const footer = scan.closest('.footer') || scan;

  let visible = false;
  let timer = 0;
  let running = false;
  let phi = 0.618; // golden-ratio walk → irregular but evenly-spread intervals

  const run = () => {
    if (!visible || running) return;
    running = true;
    scan.style.setProperty('--fc-scan-w', `${Math.max(0, scan.clientWidth - 72)}px`);
    scan.classList.add('fc-scan-run');
  };
  // self-rescheduling, φ-jittered: 45s + (0..18s) — no two gaps match (a heartbeat skips)
  const schedule = () => { phi = (phi + 0.618) % 1; timer = setTimeout(() => { run(); schedule(); }, 45000 + phi * 18000); };
  scan.addEventListener('animationend', () => { scan.classList.remove('fc-scan-run'); running = false; });

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !timer) { run(); schedule(); }
      else if (!visible && timer) { clearTimeout(timer); timer = 0; }
    },
    { threshold: 0.25 } // observe the footer block, not the 1px rule
  );
  io.observe(footer);

  onReducedMotionChange((r) => {
    if (!r) return;
    clearTimeout(timer); timer = 0;
    scan.classList.remove('fc-scan-run');
    running = false;
  });
}
