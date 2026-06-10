/**
 * WHITE NOON — Forward-landing reveals (Stage 1)
 * Content rises 24px and fades in as it enters, 420ms on --ease-run with a
 * 55ms per-batch stagger after a 144ms held breath (Fibonacci — §2.4 / §3).
 * Flash-free: only elements BELOW the fold at load are armed (an above-fold
 * element is already seen, so it is never hidden). Reduced motion → no-op
 * (everything stays visible — the Stage-0 honest state). Pure CSS transition
 * driven by IntersectionObserver; no scroll-jank, no layout properties.
 */
const SEL = [
  '.eyebrow', '.h1', '.h2', '.prose',
  '.wn-card', '.principle', '.proof__cell',
  '.wn-breath', '.about__photo',
  '.identity__title', '.identity__tagline', '.identity__badges',
  '.projbody > h3', '.projbody > p', '.monolist', '.artifacts',
  '.related-cards', '.toolchain', '.stacktable', '.filters',
].join(', ');

export function initReveals() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fold = window.innerHeight * 0.85;
  const items = [...document.querySelectorAll(SEL)].filter(
    (el) => el.getBoundingClientRect().top > fold
  );
  if (!items.length) return;

  for (const el of items) el.classList.add('fc-reveal');

  // stagger by INTERSECTION BATCH, not absolute sibling index (audit DC-03): with a
  // pre-assigned index, the 20th sibling of a long list carried a fixed ~1.4s delay
  // even when it intersected alone much later — Related/Next arrived visibly empty.
  // Each observer callback restarts the cascade and caps it at 8 steps (~440ms).
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = `calc(${Math.min(i++, 8)} * var(--stagger-sib) + var(--breath-pre))`;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  for (const el of items) io.observe(el);

  // fail-safe: content can never stay hidden — reveal anything still armed after
  // 6s even if the observer somehow never fires (mirrors the route-line arming).
  setTimeout(() => { for (const el of items) el.classList.add('is-in'); }, 6000);
}
