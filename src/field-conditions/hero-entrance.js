/**
 * WHITE NOON — hero entrance choreography (Stage 1, §3.2) — the opening gesture
 * After the 120ms breath: the H1 name + role rise line-by-line from behind a mask
 * (SplitText on each .hero__h1line, so the route band between them is untouched),
 * and the rest of the type stack Forward-lands (24px rise, 420ms, 60ms stagger),
 * concurrent with the 900ms route draw — total settle <1.3s. Everything is armed
 * hidden pre-paint (html.fc-hero) so nothing flashes, with a 2.4s CSS fail-safe so
 * the name can never stay invisible. SplitText reverts on complete → the H1 stays
 * one clean node for screen readers + copy/paste. Reduced motion → no-op (fc-hero
 * is never set, so the type renders complete from the static HTML).
 */
import { setupGsap, SplitText } from './gsap-setup.js';

export function initHeroEntrance() {
  const root = document.documentElement;
  if (!root.classList.contains('fc-hero')) return; // only armed on the home hero, motion allowed
  const h1 = document.querySelector('.hero__h1');
  const lane = document.querySelector('.hero__lane');
  if (!h1 || !lane) { root.classList.remove('fc-hero'); return; }

  const gsap = setupGsap();
  root.classList.add('fc-hero-revealed'); // disarm the CSS fail-safe; GSAP takes over

  const rest = ['.hero__pre', '.hero__sub', '.hero__greet', '.hero__cta']
    .map((s) => lane.querySelector(s)).filter(Boolean);
  const splits = [...h1.querySelectorAll('.hero__h1line')]
    .map((el) => new SplitText(el, { type: 'lines', mask: 'lines', aria: 'auto' }));
  const lines = splits.flatMap((s) => s.lines);

  gsap.set(h1, { opacity: 1 }); // container visible; the masked lines sit below the clip
  const tl = gsap.timeline({
    delay: 0.12,
    onComplete: () => { splits.forEach((s) => s.revert()); root.classList.remove('fc-hero'); },
  });
  // wider φ-ish stagger (90ms) + an opacity lead so the two lines read as TWO deliberate
  // events rising through light, and the name leads the rest of the stack (+0.14)
  tl.from(lines, { yPercent: 110, opacity: 0, duration: 0.7, stagger: 0.09, ease: 'run' }, 0);
  tl.fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, stagger: 0.06, ease: 'run', clearProps: 'transform,opacity' }, 0.14);
}
