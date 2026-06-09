/**
 * WHITE NOON — Slipstream (Stage 5, §5.4)
 * Scroll velocity & direction. Past |v|>1.2 DOWNWARD (running back up gets the
 * settled state): ① the hero/section sky haze brightens (--fc-haze-opacity
 * 0.05→0.11 max) and ② the display heading currently in view widens
 * (--fc-slip-scale 1→1.01 via scaleX — letter-spacing reflows, scaleX is free).
 * The haze also parallaxes at ~0.6× foreground rate. Rises with velocity, decays
 * over ~300ms (smoke lingering). Shared rAF; two var writes per active frame.
 * Reduced motion: off (haze fixed at 0.05, no parallax, headings never scale).
 * Governor: wins the slot while scrolling; Crosswind resumes at rest.
 */
import { addTicker, removeTicker, wake, requestWeather, releaseWeather, onReducedMotionChange } from './index.js';

export function initSlipstream() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  const sky = document.querySelector('.hero__sky');
  const lenis = window.__wn && window.__wn.lenis;

  const heads = [...document.querySelectorAll('.hero__h1, .h2, .wn-void__word, .identity__title')];
  let activeHead = null;
  const io = new IntersectionObserver(
    (es) => { for (const e of es) if (e.isIntersecting) activeHead = e.target; },
    { threshold: 0.6 }
  );
  heads.forEach((h) => io.observe(h));

  let target = 0, current = 0, scroll = 0, prevHead = null;
  const onScroll = (e) => {
    if (typeof e.scroll === 'number') scroll = e.scroll;
    const v = e.velocity || 0;
    if (v > 1.0) { target = Math.min(1, (v - 1.0) / 3); requestWeather('slipstream'); } // a firm scroll trips it (was 1.2)
    else { target = 0; releaseWeather('slipstream'); }
    wake();
  };
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', () => { scroll = window.scrollY; wake(); }, { passive: true });

  const ticker = () => {
    const rate = target > current ? 0.35 : 0.12; // rise fast, decay ~300ms (--ease-lift feel)
    current += (target - current) * rate;
    if (sky) sky.style.transform = `translateY(${scroll * -0.4}px)`; // ~0.6× parallax
    root.style.setProperty('--fc-haze-opacity', (0.05 + current * 0.06).toFixed(4));
    const scale = (1 + current * 0.02).toFixed(4);
    root.style.setProperty('--fc-slip-scale', scale);
    if (prevHead && prevHead !== activeHead) prevHead.style.transform = '';
    if (activeHead) { activeHead.style.transformOrigin = 'left'; activeHead.style.transform = `scaleX(${scale})`; prevHead = activeHead; }
    return current > 0.001 || Math.abs(target - current) > 0.001;
  };
  addTicker(ticker);

  // live OS reduced-motion toggle → settle the haze + headings, stop ticking (§5 law 4)
  onReducedMotionChange((r) => {
    if (!r) return;
    removeTicker(ticker);
    root.style.setProperty('--fc-haze-opacity', '0.05');
    root.style.setProperty('--fc-slip-scale', '1');
    if (sky) sky.style.transform = '';
    if (activeHead) activeHead.style.transform = '';
  });
}
