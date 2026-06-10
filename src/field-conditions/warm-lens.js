/**
 * WHITE NOON — Warm lens (Stage 5 — TOU-5 dual mode) — the hand CLARIFIES what it touches
 * Rather than fogging the field (a veil would dim the pristine white and hurt reading), the
 * pointer brings WARMTH: the content block under it warms a hair — the WHOLE element — like a
 * hand passing over a surface and bringing out its grain. Additive light, never a veil.
 *
 * DESKTOP (hover+fine): unchanged — delegated pointerover, the warmth follows the cursor.
 * TOUCH (TOU-5): a tap on a block leaves a TRANSIENT warmth — fc-lit for 1.8s (3s in boost,
 * read at tap time; warm-lens sits OUTSIDE the INTENSITY registry by law) then fades out via
 * the element's own transition. Heat your hand leaves on the paper, never a sticky state.
 *
 * Delegated, no rAF, pure CSS class toggle; off under reduced motion; standard teardown.
 */
import { registerCleanup } from './index.js';

// broad: ANY content block warms (consistent everywhere, not just a few cells)
const SEL = '.wn-card, .wn-void, .proof__cell, .principle, .phase, .about__photo, .stacktable, .toolchain, .wn-breath, .identity, .prose, .h2, .related-cards, .artifacts li, .monolist li, .breaks li, .footer__col';

export function initWarmLens() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let lit = null, fadeT = 0;
  const clear = () => { clearTimeout(fadeT); if (lit) { lit.classList.remove('fc-lit'); lit = null; } };

  const onOver = (e) => {
    const el = e.target.closest && e.target.closest(SEL);
    if (el === lit) return;
    clear();
    if (el) { el.classList.add('fc-lit'); lit = el; }
  };
  const onTap = (e) => {
    const el = e.target.closest && e.target.closest(SEL);
    if (!el) return;
    clear();
    el.classList.add('fc-lit'); lit = el;
    const hold = document.documentElement.classList.contains('fc-boost') ? 3000 : 1800;
    fadeT = setTimeout(clear, hold);
  };

  if (fine) {
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerleave', clear);
  } else {
    document.addEventListener('pointerdown', onTap, { passive: true });
  }

  registerCleanup('warmLens', () => {
    document.removeEventListener('pointerover', onOver);
    document.removeEventListener('pointerleave', clear);
    document.removeEventListener('pointerdown', onTap);
    clear();
  });
}
