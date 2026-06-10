/**
 * WHITE NOON — INT-3: the FIELD: SUBTLE/LOUD control (calibration UI)
 * A small fixed capsule (bottom-right) that flips the INTENSITY preset via
 * applyIntensity() — the ONLY sanctioned writer of `html.fc-boost`. State UI,
 * not motion: it stays operative under reduced motion (it reports/changes a
 * state, it doesn't animate the page). NEVER red — the red is never spent on
 * chrome; the glyph is a hollow gold disc that fills with --sun when LOUD.
 * Persisted in localStorage 'wn.intensity' (the pre-paint reads it back).
 * RETIRE PLAN: flags.intensityControl:false removes it completely once the
 * owner closes calibration (or migrate to the quiet footer variant).
 */
import { applyIntensity } from './index.js';

export function initIntensityControl() {
  if (document.querySelector('.fc-intensity')) return; // idempotent

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fc-intensity';

  const glyph = document.createElement('span');
  glyph.className = 'fc-intensity__glyph';
  glyph.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'fc-intensity__label';
  btn.append(glyph, label);

  const isBoost = () => document.documentElement.classList.contains('fc-boost');
  const render = () => {
    const on = isBoost();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Field intensity: loud. Switch to subtle.' : 'Field intensity: subtle. Switch to loud.');
    label.textContent = 'FIELD: ' + (on ? 'LOUD' : 'SUBTLE');
  };

  btn.addEventListener('click', () => applyIntensity(isBoost() ? 'subtle' : 'boost'));
  addEventListener('fc:intensity', render); // reflect ANY source (scrubber, other tab)
  render();
  document.body.appendChild(btn);
}
