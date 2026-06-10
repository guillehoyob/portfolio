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

  // ── BREAK-4: the pull-quote (.wn-breath) is the page's ONE typographic moment —
  // it rises line by line from behind a mask (SplitText, free in GSAP 3.13) instead
  // of taking the generic forward-land. Fail-safe: split errors leave the quote
  // visible (it was excluded from .fc-reveal arming below only when split works).
  // ── BREAK-7 (BOOST-GATED until the owner blesses it): the mono voice "tunes in"
  // with a 420ms terminal decode (ScrambleText) — Edgerunners in ONE voice only,
  // never the body, never the red.
  const quote = document.querySelector('.wn-breath');
  const boost = document.documentElement.classList.contains('fc-boost');
  if (quote || boost) {
    import('./gsap-setup.js').then(({ setupGsap, SplitText }) => {
      const gsap = setupGsap();
      if (quote && quote.getBoundingClientRect().top > fold) {
        try {
          quote.classList.remove('fc-reveal'); // its reveal is the line-mask now
          quote.style.transitionDelay = '';
          const split = new SplitText(quote, { type: 'lines', mask: 'lines', linesClass: 'wn-breath__line' }); // mask:'lines' = native overflow wrapper per line (GSAP 3.13)
          gsap.set(split.lines, { yPercent: 110 });
          const qio = new IntersectionObserver((ens) => {
            if (!ens.some((en) => en.isIntersecting)) return;
            qio.disconnect();
            gsap.to(split.lines, { yPercent: 0, duration: 0.55, stagger: 0.144, ease: 'run' });
          }, { threshold: 0.4 });
          qio.observe(quote);
        } catch { quote.classList.add('is-in'); }
      }
      if (boost) {
        // one decode per element per load, only as it enters — the data voice tuning in
        const monos = [...document.querySelectorAll('.eyebrow, .wn-proof__num')].filter((el) => el.textContent.trim());
        const sio = new IntersectionObserver((ens) => {
          for (const en of ens) {
            if (!en.isIntersecting) continue;
            sio.unobserve(en.target);
            gsap.to(en.target, { duration: 0.42, scrambleText: { text: en.target.textContent, chars: 'upperCase', speed: 2, tweenLength: false } });
          }
        }, { threshold: 0.6 });
        monos.forEach((el) => sio.observe(el));
      }
    }).catch(() => { if (quote) quote.classList.add('is-in'); });
  }
}
