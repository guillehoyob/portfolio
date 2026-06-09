/**
 * WHITE NOON — First Breath + scroll-cue exit (Stage 2, §5.7 / feedback §5)
 * FADE-IN: after 2s of zero scroll + zero pointer travel on the hero, the chevron
 * fades in and pulses ONCE, then rests at 0.8 (motion only; under reduced motion it
 * sits at rest 0.8 from load via the CSS fail-safe). EXIT: the moment the user
 * scrolls, the chevron steps aside and does not return — awareness, not a doorman
 * that keeps gesturing. The exit runs even under reduced motion (it is UX, just
 * instant). Reads Lenis velocity when present, native scroll otherwise.
 */
export function initFirstBreath() {
  const chevron = document.querySelector('.hero__chevron');
  const hero = document.querySelector('.hero');
  if (!chevron || !hero) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- exit on first scroll (always) ----
  let exited = false;
  const exit = () => {
    if (exited) return;
    exited = true;
    if (reduce) { chevron.remove(); return; }
    chevron.style.transition = 'opacity var(--dur-300) var(--ease-lift)';
    chevron.style.opacity = '0';
    setTimeout(() => chevron.remove(), 340);
  };
  const lenis = window.__wn && window.__wn.lenis;
  if (lenis) {
    const onLenis = ({ velocity }) => { if (Math.abs(velocity) > 0.01) { lenis.off('scroll', onLenis); exit(); } };
    lenis.on('scroll', onLenis);
  } else {
    const onWin = () => { if (window.scrollY > 4) { window.removeEventListener('scroll', onWin); exit(); } };
    window.addEventListener('scroll', onWin, { passive: true });
  }

  // ---- fade-in pulse after 2s idle (motion only) ----
  if (reduce) return;
  let fired = false;
  let timer = 0;
  const cleanup = () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', onActivity);
  };
  const fire = () => {
    if (fired || exited) return;
    if (hero.getBoundingClientRect().bottom < 80) { cleanup(); return; }
    fired = true;
    chevron.classList.add('fc-breathed');
    cleanup();
  };
  // gate on SCROLL only, NOT pointer movement — requiring zero mouse motion meant the cue
  // never appeared during active review (looking around moves the cursor). Now any 2s pause
  // on the hero reveals it for virtually every visitor.
  const onActivity = () => { if (!fired) { clearTimeout(timer); timer = setTimeout(fire, 2000); } };
  window.addEventListener('scroll', onActivity, { passive: true });
  timer = setTimeout(fire, 2000);
}
