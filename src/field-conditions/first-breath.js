/**
 * WHITE NOON — First Breath (Stage 2, §5.7)
 * After 2s of zero scroll + zero pointer travel on the hero, the scroll-cue
 * chevron fades in and pulses ONCE, then holds at rest opacity 0.8. Reset by
 * any scroll/pointer activity. Reduced motion → no-op (the chevron renders at
 * rest 0.8 from load, since fc-firstbreath is never set under reduced motion).
 * Fail-safe: CSS reveals the chevron at ~4s even if this never fires, so it can
 * never stay invisible.
 */
export function initFirstBreath() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const chevron = document.querySelector('.hero__chevron');
  const hero = document.querySelector('.hero');
  if (!chevron || !hero) return;

  let fired = false;
  let timer = 0;

  const cleanup = () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', onActivity);
    window.removeEventListener('pointermove', onActivity);
  };
  const fire = () => {
    if (fired) return;
    const r = hero.getBoundingClientRect();
    if (r.bottom < 80) { cleanup(); return; } // hero scrolled away — let CSS fail-safe hold
    fired = true;
    chevron.classList.add('fc-breathed');
    cleanup();
  };
  const onActivity = () => { if (!fired) { clearTimeout(timer); timer = setTimeout(fire, 2000); } };

  window.addEventListener('scroll', onActivity, { passive: true });
  window.addEventListener('pointermove', onActivity, { passive: true });
  timer = setTimeout(fire, 2000);
}
