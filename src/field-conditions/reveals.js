/**
 * WHITE NOON — Forward-landing reveals (Stage 1)
 * Content rises 24px and fades in as it enters, 420ms on --ease-run with a
 * 60ms sibling stagger after a 120ms held breath (§2.4 / §3 reveal grammar).
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

  // 60ms stagger among siblings sharing a parent, after the 120ms breath
  const groups = new Map();
  for (const el of items) {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  }
  for (const list of groups.values()) {
    list.forEach((el, i) => {
      el.style.transitionDelay = `calc(${i} * var(--stagger-sib) + var(--breath-pre))`;
    });
  }
  for (const el of items) el.classList.add('fc-reveal');

  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  for (const el of items) io.observe(el);

  // fail-safe: content can never stay hidden — reveal anything still armed after
  // 6s even if the observer somehow never fires (mirrors the route-line arming).
  setTimeout(() => { for (const el of items) el.classList.add('is-in'); }, 6000);
}
