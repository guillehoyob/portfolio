/**
 * WHITE NOON — Threshold Cut + Crack (Stage 3, §5.8 / §5.9)
 * The void band is the page's one detonation. Its content holds at opacity 0
 * until the band is 35% in view, then SNAPS in (70ms, no fade, no stagger — a
 * cut, not a reveal). 120ms later, the 1px --signal crack draws across (280ms,
 * ease-crack, fast through the middle, hard stop). Once per band per load.
 * Reduced motion → no-op: content and crack render complete (the Stage-0 state),
 * which is also the no-flash case (bands are below the fold, armed at runtime).
 */
export function initThresholdCut(config) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bands = document.querySelectorAll('.wn-void');
  if (!bands.length) return;
  const crackOn = !!config.flags.crack;

  bands.forEach((band) => {
    band.classList.add('fc-cut-armed');
    if (crackOn) band.classList.add('fc-crack-armed');

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          io.disconnect();
          band.classList.add('fc-cut-in');
          if (crackOn) setTimeout(() => band.classList.add('fc-crack'), 190); // 70ms cut + 120ms breath
        }
      },
      { threshold: 0.35 }
    );
    io.observe(band);
  });
}
