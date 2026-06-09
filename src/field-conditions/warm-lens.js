/**
 * WHITE NOON — Warm lens (Stage 5, new) — the cursor CLARIFIES what it touches
 * Rather than fogging the field (a veil would dim the pristine white and hurt reading), the
 * cursor brings WARMTH: the content block under the pointer warms a hair — the WHOLE element,
 * the instant you're on it — like a hand passing over a surface and bringing out its grain.
 * Additive light, never a subtractive veil. Delegated, no rAF, pure CSS class toggle; pointer-
 * fine only; off under reduced motion. Cards keep their own hover lift (excluded here).
 */
import { onReducedMotionChange } from './index.js';

// broad: hovering ANY content block warms it (consistent everywhere, not just a few cells)
const SEL = '.wn-card, .wn-void, .proof__cell, .principle, .phase, .about__photo, .stacktable, .toolchain, .wn-breath, .identity, .prose, .h2, .related-cards, .artifacts li, .monolist li, .breaks li, .footer__col';

export function initWarmLens() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let lit = null;
  const clear = () => { if (lit) { lit.classList.remove('fc-lit'); lit = null; } };
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest && e.target.closest(SEL);
    if (el === lit) return;
    clear();
    if (el) { el.classList.add('fc-lit'); lit = el; }
  }, { passive: true });
  document.addEventListener('pointerleave', clear);
  onReducedMotionChange((r) => { if (r) clear(); });
}
