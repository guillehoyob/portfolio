/**
 * WHITE NOON — footer Scanline (Stage 2, §5.11)
 * A 2px × 96px --pulse segment drifts across the footer width in 4s linear,
 * once per 30s while the footer is ≥25% visible. The footer's single pulse.
 *
 * Decoupled from the weather Governor (fix): the footer scanline and the cursor
 * Crosswind haze never share screen real estate (one is pinned to the footer,
 * the other rides the cursor up in the field), so coupling them only let
 * Crosswind — which holds the slot on every pointermove and releases only on
 * pointerleave — starve the footer drift permanently whenever a mouse was in the
 * window. It now self-arbitrates (never overlaps itself) and observes the FOOTER
 * region, not the 1px line (a sub-pixel-thin element never reports ≥50%
 * intersection, so the old threshold:0.5 on the 1px rule never fired).
 * Reduced motion → no-op: the static 96px segment sits at the footer's left edge.
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

  const run = () => {
    if (!visible || running) return;
    running = true;
    scan.style.setProperty('--fc-scan-w', `${Math.max(0, scan.clientWidth - 96)}px`);
    scan.classList.add('fc-scan-run');
  };
  scan.addEventListener('animationend', () => { scan.classList.remove('fc-scan-run'); running = false; });

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !timer) { run(); timer = setInterval(run, 30000); }
      else if (!visible && timer) { clearInterval(timer); timer = 0; }
    },
    { threshold: 0.25 } // observe the footer block, not the 1px rule
  );
  io.observe(footer);

  // live OS reduced-motion toggle → settle the segment at rest, stop drifting
  onReducedMotionChange((r) => {
    if (!r) return;
    clearInterval(timer); timer = 0;
    scan.classList.remove('fc-scan-run');
    running = false;
  });
}
