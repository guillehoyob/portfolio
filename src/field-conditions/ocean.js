/**
 * WHITE NOON — Ocean (Stage 5, new) — the field responds, like a still noon sea
 * A click anywhere drops ONE faint --sky ripple that expands and vanishes (0.7s calm,
 * ≈0.89s energetic — a sanctioned exception to the 600ms–4s band, CONTRACTS §f.3).
 * SKY, never red — red is the heartbeat's voice; sky is the ocean's. The field
 * answers your touch in its own cool light. Above content (visible everywhere) but
 * pointer-events:none, faint, transient, self-removing. Debounced + max 3 concurrent
 * + never on interactive targets (those own their own feedback). Pure CSS one-shots
 * (no rAF). Reduced motion → no-op. Flag off → never inits (Stage-0 exact).
 */
import { field, addImpulse, intensity } from './index.js';

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
    // SKY-12.2 — rain feeds the water: under rain/storm the sea answers a touch more
    // (one extra concurrent ring + a brighter crest). The ocean READS the sky's state.
    const wxd = document.documentElement.dataset.wx || '';
    const wxMul = (wxd.startsWith('rain') || wxd === 'storm') ? 1 : 0;
    const now = performance.now();
    if (now - last < 120 || live >= 3 + wxMul) return; // debounce + concurrency cap (no spectacle)
    last = now; // NOTE: live is incremented inside spawn() only — never here (that double-count
                // leaked the counter and froze the ocean after 2 clicks)
    // the ring's CHARACTER reads the field's ENERGY — a heavy moment (you were moving fast) makes
    // a WIDER, SLOWER, DIMMER swell; a calm tap makes a SMALL, QUICK, BRIGHT one ("resembles what
    // is happening"). The click also feeds the ocean (raises energy + a nib blip near the spine).
    const en = field.energy;
    const dur = 0.7 + en * 0.19; // heavy swell ≈0.89s (sanctioned cap); calm tap 0.7s — the old 0.5s died before the eye landed (audit VIS-04)
    const spawn = (opMul, delay) => {
      live++;
      const ring = document.createElement('span');
      ring.className = 'fc-ocean__ring';
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      ring.style.setProperty('--fc-ring-scale', (8 + en * 7).toFixed(1)); // 8→15: a clearly wider swell when you were moving
      ring.style.setProperty('--fc-ring-dur', dur.toFixed(2) + 's');
      ring.style.setProperty('--fc-ring-op', Math.min(0.8, (0.45 + wxMul * 0.08 + en * 0.03) * intensity.ring * opMul).toFixed(3)); // base raised 0.30→0.45 (audit VIS-04) + rain crest (SKY-12.2); intensity.ring scales it, hard cap 0.8 (CONTRACTS §a)
      ring.style.setProperty('--fc-ring-delay', delay.toFixed(2) + 's');
      let done = false;
      const finish = () => { if (done) return; done = true; ring.remove(); live = Math.max(0, live - 1); };
      ring.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, (dur + delay) * 1000 + 300); // backstop: live can never leak
      layer.appendChild(ring);
    };
    spawn(1, 0);
    if (en > 0.3) spawn(0.7, dur * 0.146); // a still sea drops ONE ring on a calm tap; a heavier touch leaves a φ-delayed wake (now visible)
    addImpulse(e.clientX, e.clientY, 0.6 + en * 0.6);
  }, { passive: true });
}
