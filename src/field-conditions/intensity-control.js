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

  // ── V5.1: the WX audition chip — LOUD only ("no sé cómo probarlos sin sucesos
  // externos"): cycles the sky's states in-page through the wn:wx-force event
  // (same path as the ?fc-wx scrubber; ephemeral; AUTO returns to the truth).
  const WXS = ['auto', 'clear', 'partly', 'overcast', 'rain', 'storm', 'snow', 'fog'];
  let wxIdx = 0;
  const wx = document.createElement('button');
  wx.type = 'button';
  wx.className = 'fc-intensity fc-intensity--wx';
  wx.hidden = true;
  const wxLabel = document.createElement('span');
  wxLabel.className = 'fc-intensity__label';
  wx.appendChild(wxLabel);
  const renderWx = () => {
    wxLabel.textContent = 'WX: ' + WXS[wxIdx].toUpperCase();
    wx.setAttribute('aria-label', 'Audition weather: ' + WXS[wxIdx]);
  };
  wx.addEventListener('click', () => {
    wxIdx = (wxIdx + 1) % WXS.length;
    renderWx();
    document.dispatchEvent(new CustomEvent('wn:wx-force', { detail: { state: WXS[wxIdx] } }));
  });
  renderWx();

  const render = () => {
    const on = isBoost();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Field intensity: loud. Switch to subtle.' : 'Field intensity: subtle. Switch to loud.');
    label.textContent = 'FIELD: ' + (on ? 'LOUD' : 'SUBTLE');
    wx.hidden = !on;
    if (!on && wxIdx !== 0) { // leaving LOUD returns the sky to the truth
      wxIdx = 0;
      renderWx();
      document.dispatchEvent(new CustomEvent('wn:wx-force', { detail: { state: 'auto' } }));
    }
  };

  btn.addEventListener('click', () => applyIntensity(isBoost() ? 'subtle' : 'boost'));
  addEventListener('fc:intensity', render); // reflect ANY source (scrubber, other tab)
  // F3 (QA): the glyph GLINTS on every breath crest — the anchor doesn't just swell,
  // it marks the exhale's exact moment (where the owner is already looking)
  const onCrest = () => { glyph.classList.add('fc-crest'); setTimeout(() => glyph.classList.remove('fc-crest'), 500); };
  document.addEventListener('fc:crest', onCrest);
  render();
  document.body.append(btn, wx);
}
