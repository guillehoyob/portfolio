/**
 * WHITE NOON — Threshold Cut + Crack (Stage 3, §5.8 / §5.9)
 * The void band is the page's one detonation. Its content holds at opacity 0
 * until the band is 35% in view, then SNAPS in (70ms, no fade, no stagger — a
 * cut, not a reveal). 120ms later, the 1px --signal crack draws across (280ms,
 * ease-crack, fast through the middle, hard stop). Once per band per load.
 * Reduced motion → no-op: content and crack render complete (the Stage-0 state),
 * which is also the no-flash case (bands are below the fold, armed at runtime).
 */
import { addImpulse } from './index.js';

export function initThresholdCut(config) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bands = document.querySelectorAll('.wn-void');
  if (!bands.length) return;
  const crackOn = !!config.flags.crack;

  bands.forEach((band) => {
    band.classList.add('fc-cut-armed');
    const crack = band.querySelector('.wn-void__crack');
    if (crackOn && crack) band.classList.add('fc-crack-armed');

    // the WORD detonates the instant the band enters (it's the headline)
    const cutIO = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          cutIO.disconnect();
          band.classList.add('fc-cut-in');
          // the detonation's one outward consequence: the field flinches (the living layer feels it)
          const r = band.getBoundingClientRect();
          addImpulse(r.left + r.width / 2, Math.max(0, r.top) + 40, 0.5);
        }
      },
      { threshold: 0.35 }
    );
    cutIO.observe(band);

    // the CRACK draws only once the crack LINE itself is in the reading zone — before, it
    // armed while still below the fold (hidden under the giant word) and you missed it draw
    if (crackOn && crack) {
      const crackIO = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue;
            crackIO.disconnect();
            setTimeout(() => band.classList.add('fc-crack'), 120); // a held breath, then the blade
          }
        },
        { threshold: 0, rootMargin: '0px 0px -35% 0px' } // fires when the crack is in the top ~65%
      );
      crackIO.observe(crack);
    }
  });
}
