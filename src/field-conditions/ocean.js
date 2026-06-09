/**
 * WHITE NOON — Ocean (Stage 5, new) — the field responds, like a still noon sea
 * A click anywhere drops ONE faint --sky ripple that expands and vanishes (<600ms).
 * SKY, never red — red is the heartbeat's voice; sky is the ocean's. The field
 * answers your touch in its own cool light. Above content (visible everywhere) but
 * pointer-events:none, faint, transient, self-removing. Debounced + max 2 concurrent
 * + never on interactive targets (those own their own feedback). Pure CSS one-shots
 * (no rAF). Reduced motion → no-op. Flag off → never inits (Stage-0 exact).
 */
export function initOcean() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'fc-ocean';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  let live = 0, last = 0;
  addEventListener('pointerdown', (e) => {
    // affordances own their own feedback (§3.12) — don't ripple on links/buttons/fields
    if (e.target.closest && e.target.closest('a,button,input,textarea,select,label,summary,[role="button"],[contenteditable]')) return;
    const now = performance.now();
    if (now - last < 120 || live >= 2) return; // debounce + concurrency cap (no spectacle)
    last = now; live++;
    const ring = document.createElement('span');
    ring.className = 'fc-ocean__ring';
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
    ring.addEventListener('animationend', () => { ring.remove(); live--; }, { once: true });
    layer.appendChild(ring);
  }, { passive: true });
}
