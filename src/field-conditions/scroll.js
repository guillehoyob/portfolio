/**
 * WHITE NOON — Lenis smooth scroll (Stage 1)
 * Inertia, not hijack (§5 law 3). Only initialised when motion is allowed.
 * Keyboard / spacebar / PageDown and :target anchor jumps keep working (§6.3);
 * in-page anchor clicks are upgraded to a smooth glide. Exposes velocity for
 * Slipstream (Stage 5) on window.__wn.lenis.
 */
import Lenis from 'lenis';

export function initScroll() {
  const lenis = new Lenis({
    duration: 0.9,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
  });

  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // smooth in-page anchor jumps without breaking native :target / history
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -72 });
    history.pushState(null, '', url.hash);
  });

  (window.__wn ||= {}).lenis = lenis;
  return lenis;
}
