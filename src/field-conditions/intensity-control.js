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
import { applyIntensity, field } from './index.js';
import { setHourOverride, setPlace, effectiveHour } from './heliostat.js';

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
  // PLACE = LATITUDE only (owner: "la jungla fingiendo lluvia es raro" — the weather
  // stays REAL / WX-chip; place just rides the sun lower/higher, an honest latitude lens).
  const PLACES = [['auto', 'AUTO'], ['arctic', 'ARCTIC'], ['temperate', 'TEMPERATE'], ['tropic', 'TROPIC'], ['equator', 'EQUATOR']];
  const SPECIALS = [['', 'NONE'], ['equinox', 'EQUINOX'], ['solstice', 'SOLSTICE'], ['newyear', 'NEW YEAR'], ['fullmoon', 'FULL MOON']];
  prev.innerHTML = `<div class="fc-preview__title">PREVIEW THE FIELD</div>
    <label class="fc-preview__row"><span class="fc-preview__k">TIME</span>
      <input class="fc-preview__time" type="range" min="0" max="24" step="0.25" value="12" aria-label="Preview hour">
      <button type="button" class="fc-preview__hr" aria-label="Back to real local time">—</button></label>
    <div class="fc-preview__row"><span class="fc-preview__k">SUN</span>
      <div class="fc-preview__chips fc-preview__places">${PLACES.map(([k, l]) => `<button type="button" data-place="${k}"${k === 'auto' ? ' aria-pressed="true"' : ''}>${l}</button>`).join('')}</div></div>
    <div class="fc-preview__row"><span class="fc-preview__k">DAY</span>
      <div class="fc-preview__chips fc-preview__special">${SPECIALS.map(([k, l]) => `<button type="button" data-special="${k}"${k === '' ? ' aria-pressed="true"' : ''}>${l}</button>`).join('')}</div></div>
    <p class="fc-preview__info" aria-live="polite">—</p>`;
  const timeEl = prev.querySelector('.fc-preview__time');
  const hrEl = prev.querySelector('.fc-preview__hr');
  const infoEl = prev.querySelector('.fc-preview__info');
  const fmt = (h) => { const m = Math.round((h % 1) * 60); return String(Math.floor(h) % 24).padStart(2, '0') + ':' + String((m % 60)).padStart(2, '0'); };
  let hourOverrideOn = false;
  let place = 'auto';
  const cityOf = () => { try { return (Intl.DateTimeFormat().resolvedOptions().timeZone || '').split('/').pop().replace(/_/g, ' ') || 'your area'; } catch { return 'your area'; } };
  const showInfo = () => {
    const wx = (field.wx && field.wx.state) || '—';
    const loc = place === 'auto' ? cityOf() : place;
    infoEl.textContent = `${loc} · ${wx} · ${fmt(effectiveHour())}${hourOverrideOn ? '' : ' local'}`;
  };
  const showHr = () => { hrEl.textContent = fmt(effectiveHour()) + (hourOverrideOn ? '' : ' ·'); showInfo(); };
  timeEl.addEventListener('input', () => { hourOverrideOn = true; setHourOverride(+timeEl.value); showHr(); });
  hrEl.addEventListener('click', () => { hourOverrideOn = false; setHourOverride(null); timeEl.value = String(effectiveHour()); showHr(); });
  prev.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => {
    prev.querySelectorAll('[data-place]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    place = b.dataset.place; setPlace(place); showHr(); // SUN/latitude only — weather stays honest
  }));
  const specialWrap = prev.querySelector('.fc-preview__special');
  const setSpecial = (kind) => {
    const r = document.documentElement;
    if (kind) { r.dataset.special = kind; r.dataset.specialPreview = kind; }
    else { delete r.dataset.special; delete r.dataset.specialPreview; }
    specialWrap.querySelectorAll('[data-special]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.special === kind ? 'true' : 'false'));
  };
  specialWrap.querySelectorAll('[data-special]').forEach((b) => b.addEventListener('click', () => setSpecial(b.dataset.special)));
  document.addEventListener('wn:wx', showInfo);

  const render = () => {
    const on = isBoost();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Field intensity: loud. Switch to subtle.' : 'Field intensity: subtle. Switch to loud.');
    label.textContent = 'FIELD: ' + (on ? 'LOUD' : 'SUBTLE');
    wx.hidden = !on; prev.hidden = !on;
    if (on) { timeEl.value = String(effectiveHour()); showHr(); } // reflect the real local hour on open
    else { // leaving LOUD returns the sky + clock + place + special to the truth
      if (wxIdx !== 0) { wxIdx = 0; renderWx(); document.dispatchEvent(new CustomEvent('wn:wx-force', { detail: { state: 'auto' } })); }
      hourOverrideOn = false; setHourOverride(null); place = 'auto'; setPlace('auto');
      prev.querySelectorAll('[data-place]').forEach((x) => x.setAttribute('aria-pressed', x.dataset.place === 'auto' ? 'true' : 'false'));
      setSpecial(''); // drop any previewed special day
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
