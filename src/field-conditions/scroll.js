/**
 * WHITE NOON — Lenis smooth scroll (Stage 1), single-ticker synced to GSAP
 * Inertia, not hijack (§5 law 3). Lenis runs with autoRaf:false and is driven
 * from GSAP's ticker (gsap.ticker.add + lagSmoothing(0)) so both libraries share
 * ONE clock — no 1–2 frame ScrollTrigger lag, no double-smoothing fight
 * (guardrails §2). Only initialised when motion is allowed. Keyboard / spacebar /
 * PageDown and :target anchor jumps keep working (§6.3); in-page anchor clicks
 * glide. Exposes the instance on window.__wn.lenis for Slipstream + the chevron.
 */
import Lenis from 'lenis';
import { setupGsap } from './gsap-setup.js';
import { feedScroll } from './index.js';

export function initScroll() {
  const gsap = setupGsap();
  const lenis = new Lenis({
    autoRaf: false,
    duration: 0.9,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
  });

  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // feed scroll velocity into the field "ocean" bus (energy rises with how fast you move)
  lenis.on('scroll', (e) => feedScroll(e.velocity));

  // smooth in-page anchor jumps without breaking native :target / history
  document.addEventListener('click', (e) => {
    // modified clicks belong to the browser (open-in-new-tab etc.) — hijacking them
    // into a smooth scroll steals a native affordance (audit A11Y-2)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
