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
import { setHourOverride } from './heliostat.js';

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

  // ── V5.7: the PREVIEW panel — TIME + PLACE (owner: "déjame botones para controlar
  // la hora y para estar en distintos lugares del mundo"). LOUD only; a demo lens, so
  // the owner can SEE the day and the biome shift on demand. AUTO restores the truth. */
  const prev = document.createElement('div');
  prev.className = 'fc-intensity fc-preview';
  prev.hidden = true;
  // place presets → a representative biome weather (forced through the same wn:wx path)
  const PLACES = [['auto', 'AUTO'], ['arctic', 'ARCTIC'], ['tropic', 'TROPIC'], ['ocean', 'OCEAN'], ['jungle', 'JUNGLE']];
  const PLACE_WX = { auto: 'auto', arctic: 'snow', tropic: 'clear', ocean: 'partly', jungle: 'rain' };
  prev.innerHTML = `<label class="fc-preview__row"><span>TIME</span>
      <input class="fc-preview__time" type="range" min="0" max="24" step="0.5" value="12" aria-label="Preview hour">
      <button type="button" class="fc-preview__auto" aria-label="Real time">AUTO</button></label>
    <div class="fc-preview__row fc-preview__places">${PLACES.map(([k, l]) => `<button type="button" data-place="${k}"${k === 'auto' ? ' aria-pressed="true"' : ''}>${l}</button>`).join('')}</div>`;
  const timeEl = prev.querySelector('.fc-preview__time');
  timeEl.addEventListener('input', () => setHourOverride(+timeEl.value));
  prev.querySelector('.fc-preview__auto').addEventListener('click', () => { setHourOverride(null); });
  prev.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => {
    prev.querySelectorAll('[data-place]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    document.dispatchEvent(new CustomEvent('wn:wx-force', { detail: { state: PLACE_WX[b.dataset.place] } }));
  }));

  const render = () => {
    const on = isBoost();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Field intensity: loud. Switch to subtle.' : 'Field intensity: subtle. Switch to loud.');
    label.textContent = 'FIELD: ' + (on ? 'LOUD' : 'SUBTLE');
    wx.hidden = !on; prev.hidden = !on;
    if (!on) { // leaving LOUD returns the sky + clock to the truth
      if (wxIdx !== 0) { wxIdx = 0; renderWx(); document.dispatchEvent(new CustomEvent('wn:wx-force', { detail: { state: 'auto' } })); }
      setHourOverride(null);
    }
  };

  btn.addEventListener('click', () => applyIntensity(isBoost() ? 'subtle' : 'boost'));
  addEventListener('fc:intensity', render); // reflect ANY source (scrubber, other tab)
  // F3 (QA): the glyph GLINTS on every breath crest — the anchor doesn't just swell,
  // it marks the exhale's exact moment (where the owner is already looking)
  const onCrest = () => { glyph.classList.add('fc-crest'); setTimeout(() => glyph.classList.remove('fc-crest'), 500); };
  document.addEventListener('fc:crest', onCrest);
  render();
  document.body.append(btn, wx, prev);
}
