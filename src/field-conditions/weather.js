/**
 * WHITE NOON — Weather (SKY-5..11 · DESIGN-V5 §2.5–§2.11) — the sky has weather
 * Layer 0: SYNTHETIC deterministic state (date-seeded mulberry32 + seasonal
 * weights, hemisphere-aware via the tz table) — applies in <50ms, zero network.
 * Layer 1: ONE GET to api.open-meteo.com (the single sanctioned third-party,
 * CONTRACTS §f.4 — no key, no geolocation permission, Geocoding API forbidden;
 * coords come from the embedded IANA tz table). Cached in sessionStorage
 * 'wn.wx' (TTL config.weather.ttlMin); real sunrise/sunset cached in
 * 'wn.sunTimes' so heliostat warps the anchor clock to the user's real sun.
 * Failure of any kind → Layer 0 stays; impossible to break the page.
 *
 * Publishes: html[data-wx], --fc-wx-wind (normalized 0..1 = kmh/40 capped),
 * --fc-wx-clouds (0..1), field.wx {state, wind, clouds}, event 'wn:wx' on
 * document. Phenomena (DOM layers, all aria-hidden, pointer-events:none):
 * clouds (SKY-6), calligraphic gutter rain (SKY-7), snow mote-mode toggle
 * (SKY-8 — the particle physics diff belongs to W4), storm flash + thunder
 * impulse + the once-per-session RED SPRITE (SKY-9, quota 'wn.sprite'),
 * fog by subtraction + gated veils (SKY-10b/10a, flag weather.fogVeils),
 * cloud iridescence (SKY-11, flag weather.iris).
 *
 * Scrubber: ?fc-wx=clear|partly|overcast|fog|rain|rain-heavy|snow|storm|off
 * (ephemeral; skips the network entirely for deterministic QA).
 * Reduced motion: data-wx still applies (it is STATE); animated phenomena
 * (rain/storm/sprite/iris/cloud-drift) are gated off; clouds exist static.
 * Entry transitions: floor 4s in rest (clouds 6s / rain 5s / fog 8s / iris 8s);
 * the 1.2s entries exist ONLY under html.fc-boost (demo/QA — CONTRACTS §f.3b).
 */
import { intensity, field, addImpulse, registerCleanup, reduced } from './index.js';
import { TZ_COORDS } from './tz-coords.js';
import { effectiveHour } from './heliostat.js';

const STATES = ['clear', 'partly', 'overcast', 'fog', 'rain', 'snow', 'storm'];
const VALID = new Set([...STATES, 'rain-heavy']);
// seasonal weights [clear, partly, overcast, fog, rain, snow, storm] — sum 1.00 each
const SEASONS = {
  DJF: [0.40, 0.20, 0.15, 0.10, 0.10, 0.04, 0.01],
  MAM: [0.45, 0.20, 0.10, 0.05, 0.15, 0.01, 0.04],
  JJA: [0.60, 0.20, 0.05, 0.02, 0.05, 0.00, 0.08],
  SON: [0.45, 0.20, 0.12, 0.08, 0.12, 0.01, 0.02],
};
// synthetic cloud-cover defaults per state (0..1)
const CLOUDS = { clear: 0.10, partly: 0.45, overcast: 0.90, fog: 0.85, rain: 0.80, 'rain-heavy': 0.85, snow: 0.85, storm: 0.95 };
// WMO weather_code → data-wx (order matters); HEAVY upgrades drizzle/rain/showers
const HEAVY = new Set([55, 57, 63, 65, 66, 67, 81, 82]);
function wmoState(c) {
  if (c <= 1) return 'clear';
  if (c === 2) return 'partly';
  if (c === 3) return 'overcast';
  if (c === 45 || c === 48) return 'fog';
  if (c >= 95) return 'storm';
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
  if (c >= 51) return HEAVY.has(c) ? 'rain-heavy' : 'rain';
  return 'clear';
}

// deterministic PRNG (research 3.3) — same date ⇒ same sky for everyone in the tz
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoHours = (s) => {
  if (!s) return null;
  const m = String(s).match(/T(\d{2}):(\d{2})/);
  return m ? +m[1] + (+m[2]) / 60 : null;
};

/* ════════ module state ════════ */
let cfgW = {};
const layers = new Map();      // name → { els: [..], removeT: id }
let irisTimer = 0, flashT = 0, spriteT = 0, demoT = 0, thunderT = 0, snowT = 0;
let spriteRetried = false;
let io = null, voidEl = null, voidVisible = false;
const root = () => document.documentElement;

/* ════════ Layer 0 — synthetic (SKY-5, deterministic, zero network) ════════ */
function synthetic() {
  const d = new Date();
  const seed = +(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`);
  const rng = mulberry32(seed);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const co = TZ_COORDS[tz];
  let month = d.getMonth();                       // 0..11
  if (co && co[0] < 0) month = (month + 6) % 12;  // southern hemisphere → seasons shifted
  const W = (month === 11 || month <= 1) ? SEASONS.DJF : month <= 4 ? SEASONS.MAM : month <= 7 ? SEASONS.JJA : SEASONS.SON;
  let r = rng(), state = 'clear';
  for (let i = 0; i < STATES.length; i++) { r -= W[i]; if (r < 0) { state = STATES[i]; break; } }
  // morning fog of the cold half-year (independent draw, seed+1)
  const m1 = month + 1, h = d.getHours();
  if ((m1 >= 10 || m1 <= 3) && h >= 6 && h < 9 && mulberry32(seed + 1)() < 0.35 && (state === 'clear' || state === 'partly')) state = 'fog';
  return { state, wind: rng() * 0.5, clouds: CLOUDS[state] };
}

/* ════════ Layer 1 — Open-Meteo (ONE GET, cached, fail-safe) ════════ */
async function live() {
  try {
    const cached = JSON.parse(sessionStorage.getItem('wn.wx') || 'null');
    if (cached && Date.now() - cached.t < (cfgW.ttlMin || 30) * 60000) {
      if (VALID.has(cached.state)) apply(cached.state, cached.wind, cached.clouds);
      return;
    }
  } catch { /* private mode */ }
  const co = TZ_COORDS[Intl.DateTimeFormat().resolvedOptions().timeZone];
  if (!co) return; // no tz match → Layer 0 stays
  let data = null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${co[0]}&longitude=${co[1]}&current=weather_code,is_day,cloud_cover,wind_speed_10m&daily=sunrise,sunset&forecast_days=1&timezone=auto`,
      { signal: AbortSignal.timeout(4000) }
    );
    data = await res.json();
  } catch { data = null; } // offline/blocked/slow → the synthetic sky stays; nothing breaks
  if (!data || !data.current) return;
  const state = wmoState(+data.current.weather_code || 0);
  const wind = Math.min(1, (+data.current.wind_speed_10m || 0) / 40); // normalized 0..1 (40 km/h = full)
  const cc = +data.current.cloud_cover;
  const clouds = Number.isFinite(cc) ? cc / 100 : CLOUDS[state];
  try {
    const rise = isoHours(data.daily && data.daily.sunrise && data.daily.sunrise[0]);
    const set = isoHours(data.daily && data.daily.sunset && data.daily.sunset[0]);
    if (rise != null && set != null && set > rise) sessionStorage.setItem('wn.sunTimes', JSON.stringify({ rise, set }));
  } catch { /* */ }
  try { sessionStorage.setItem('wn.wx', JSON.stringify({ t: Date.now(), state, wind, clouds })); } catch { /* */ }
  apply(state, wind, clouds); // Layer 1 OVERRIDES Layer 0
}

/* ════════ apply — the one writer of the weather state ════════ */
function apply(state, wind, clouds) {
  const r = root();
  r.dataset.wx = state;
  r.style.setProperty('--fc-wx-wind', (+wind).toFixed(3));
  r.style.setProperty('--fc-wx-clouds', (+clouds).toFixed(2));
  field.wx = { state, wind: +wind, clouds: +clouds };
  syncLayers(state);
  document.dispatchEvent(new CustomEvent('wn:wx', { detail: field.wx }));
  if (r.classList.contains('fc-boost')) console.info('[wx]', state, +wind.toFixed(2), +clouds.toFixed(2));
}

/* ════════ phenomenon layers — ONE create/fade-out/remove pattern for all ════════ */
function ensure(name, make) {
  const got = layers.get(name);
  if (got) { // cancel a pending fade-out: the state came back
    if (got.removeT) { clearTimeout(got.removeT); got.removeT = 0; got.els.forEach((el) => { el.style.opacity = ''; }); }
    return got.els;
  }
  const els = make();
  if (!els || !els.length) return null;
  // fade-in trick: elements are inserted already MATCHING the data-wx selector, so the
  // computed style would land at the final opacity with no transition; pin 0 inline,
  // then clear it two frames later → the 4s+ entry transition runs (CONTRACTS §f.3b)
  els.forEach((el) => { el.style.opacity = '0'; });
  requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((el) => { el.style.opacity = ''; })));
  layers.set(name, { els, removeT: 0 });
  return els;
}
function fadeRemove(name, ms) {
  const got = layers.get(name);
  if (!got || got.removeT) return;
  got.els.forEach((el) => { el.style.opacity = '0'; }); // transition declared on the layer class
  got.removeT = setTimeout(() => { got.els.forEach((el) => el.remove()); layers.delete(name); }, ms + 120);
}

function ensureCloudFilter() {
  if (document.getElementById('fc-cloud')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  // rasterizes ONCE — baseFrequency is NEVER animated (SKY-6)
  svg.innerHTML = '<filter id="fc-cloud" x="-15%" y="-60%" width="130%" height="220%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="2" seed="7" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="90"/></filter>';
  document.body.appendChild(svg);
}
const mkDiv = (cls) => { const el = document.createElement('div'); el.className = cls; el.setAttribute('aria-hidden', 'true'); return el; };

function mkClouds() {
  ensureCloudFilter();
  const el = mkDiv('fc-clouds');
  const sun = document.querySelector('.fc-sun');
  if (sun) sun.after(el); else document.body.prepend(el); // AFTER .fc-sun: the cloud covers the sun
  return [el];
}
function mkFog() {
  const el = mkDiv('fc-fog'); el.innerHTML = '<i></i><i></i>';
  document.body.appendChild(el);
  return [el];
}
function mkIris() {
  const el = mkDiv('fc-iris'); el.innerHTML = '<i></i>';
  document.body.appendChild(el);
  return [el];
}

/* SHOOTING STARS — a rare washi streak on clear/partly NIGHTS (owner's celestial idea).
   Self-rescheduling 12–28s; one (rarely two) at a random spot up high; ≤700ms, gone. */
let starT = 0;
function nightClear(state) {
  if (reduced) return false;
  if (state !== 'clear' && state !== 'partly') return false;
  const h = effectiveHour();
  return (h >= 21 || h < 5.5);
}
function syncStars(state) {
  if (nightClear(state)) { if (!starT) scheduleStar(); }
  else { clearTimeout(starT); starT = 0; }
}
function scheduleStar() {
  starT = setTimeout(() => {
    starT = 0;
    if (!nightClear(root().dataset.wx) || document.hidden) return;
    spawnStar();
    if (Math.random() < 0.22) setTimeout(spawnStar, 200 + Math.random() * 300); // sometimes a pair
    scheduleStar();
  }, 12000 + Math.random() * 16000);
}
function spawnStar() {
  const s = mkDiv('fc-shootingstar');
  s.style.left = (35 + Math.random() * 45) + 'vw';
  s.style.top = (6 + Math.random() * 22) + 'vh';
  document.body.appendChild(s);
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('go')));
  setTimeout(() => s.remove(), 760);
}

function syncSnow() {
  const sky = document.querySelector('.fc-sky');
  if (sky) sky.classList.toggle('fc-sky--snow', root().dataset.wx === 'snow');
}

function syncIris() {
  const state = root().dataset.wx;
  const h = effectiveHour();
  // V5.7 (owner: "la esfera estática no me gusta nada; aplícalo a los titulares y solo
  // en días especiales"): the static iris SPHERE is RETIRED. Iridescence now lives as a
  // slow tornasol SHEEN that sweeps the HEADINGS on SPECIAL DAYS only (equinox/solstice/
  // new-year/full-moon) — pure CSS gated on html[data-special] (set by heliostat). So
  // here we just make sure the old sphere never renders.
  void state; void h;
  fadeRemove('iris', 1);
}

function syncLayers(state) {
  // clouds — partly/overcast/storm/snow, plus the LOW cloud of fog (SKY-10b mitigation, op .4 drift ×2)
  const wantClouds = ['partly', 'overcast', 'storm', 'snow'].includes(state);
  const wantLow = state === 'fog';
  if (wantClouds || wantLow) {
    const els = ensure('clouds', mkClouds);
    if (els) els[0].classList.toggle('fc-clouds--low', wantLow);
  } else fadeRemove('clouds', 6000);
  // RAIN STREAKS REMOVED (V5.3, owner: "la lluvia va fatal"): the diagonal gutter
  // lines read as jagged noise against the calm field. Rain now lives ONLY as a
  // dimmer sky (heliostat governor reads data-wx) + livelier ocean rings on click
  // (ocean.js SKY-12.2) — felt, not drawn. The state still exists; the layer never does.
  fadeRemove('rain', 1);
  // fog veils — SKY-10a, gated on weather.fogVeils (owner approval pending)
  if (state === 'fog' && cfgW.fogVeils && !reduced) ensure('fog', mkFog);
  else fadeRemove('fog', 8000);
  // iridescence — retired sphere (now special-day headings); keep the cleanup
  syncIris();
  // shooting stars — rare washi streaks on CLEAR/PARTLY NIGHTS (owner: celestial)
  syncStars(state);
  // snow — the motes change regime (particle physics is W4's; this only flips the class)
  syncSnow();
  // storm — flash/thunder/sprite timers
  if (state === 'storm' && !reduced) armStorm(); else disarmStorm();
}

/* ════════ SKY-9 — storm: void flash + thunder impulse + RED SPRITE (1/session) ════════ */
function armStorm() {
  if (!voidEl) {
    voidEl = document.querySelector('.wn-void');
    if (voidEl && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => { voidVisible = es[0].isIntersecting; }, { threshold: 0.25 });
      io.observe(voidEl);
    }
  }
  if (!flashT) flashT = setTimeout(fireFlash, 30e3 + Math.random() * 90e3); // rand 30–120s
  scheduleSprite();
}
function disarmStorm() {
  clearTimeout(flashT); flashT = 0;
  clearTimeout(spriteT); spriteT = 0;
}
function fireFlash() {
  flashT = 0;
  if (root().dataset.wx !== 'storm') return;
  if (voidEl && voidVisible) { // only if the IO confirmed the void on screen (threshold .25)
    const fl = mkDiv('fc-voidflash');
    voidEl.appendChild(fl);
    requestAnimationFrame(() => fl.classList.add('go'));
    setTimeout(() => fl.remove(), 700);
  }
  thunderT = setTimeout(fireThunder, 900); // thunder follows the light — void-less pages get thunder alone
  flashT = setTimeout(fireFlash, 30e3 + Math.random() * 90e3);
}
function fireThunder() {
  thunderT = 0;
  if (root().dataset.wx !== 'storm') return;
  const r = voidEl ? voidEl.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  const cy = Math.max(0, r.top) + Math.min(r.height, innerHeight) / 2;
  addImpulse(r.left + r.width / 2, cy, intensity.weather > 1 ? 2 : 1); // the organism FEELS it (existing bus)
  root().classList.add('fc-thunder');
  setTimeout(() => root().classList.remove('fc-thunder'), 900); // body returns cleanly to its 4s transition
}
function sessionT0() {
  try { const s = sessionStorage.getItem('wn.beatAnchor'); if (s) return +s; } catch { /* */ }
  return Date.now() - performance.now();
}
// V5.7 (owner: "quiero ver el rayo más veces, en bucle, 1 o más a la vez, en posición
// random arriba"): while it STORMS the red sprite LOOPS — a random gap, sometimes a
// double strike, each at a random x along the top. Still transient (≤640ms), still
// the rare-1/session quota for NON-storm naturally-occurring weather (kept below).
function scheduleSprite() {
  clearTimeout(spriteT);
  const first = root().classList.contains('fc-boost') ? 1500 : 6000 + Math.random() * 8000;
  spriteT = setTimeout(fireSprite, first);
}
function fireSprite() {
  spriteT = 0;
  if (document.hidden || root().dataset.wx !== 'storm') return; // disarmStorm stops the loop
  const strikes = Math.random() < 0.3 ? 2 : 1; // sometimes a double bolt
  for (let i = 0; i < strikes; i++) setTimeout(() => spawnSprite(8 + Math.random() * 72), i * (120 + Math.random() * 220));
  spriteT = setTimeout(fireSprite, 7000 + Math.random() * 13000); // 7–20s between bursts
}
// 600ms total: halo 120ms (the ONE sanctioned bounce-light in the sky, §f.5) → draw 180ms
// (--ease-crack) → hold 60ms at op .85 → fade 240ms → remove(). FULL saturation, ~0.07% transient.
function spawnSprite(leftVw) {
  const w = mkDiv('fc-sprite');
  if (leftVw != null) { w.style.left = leftVw.toFixed(1) + 'vw'; w.style.right = 'auto'; } // random x along the top
  w.innerHTML = '<svg viewBox="0 0 100 140">'
    + '<path pathLength="100" d="M52 0 V42"/><path pathLength="100" d="M52 42 L40 86"/>'
    + '<path pathLength="100" d="M52 42 L63 92"/><path pathLength="100" d="M52 42 V98"/>'
    + '<path pathLength="100" d="M46 16 L34 50 M58 18 L70 54"/></svg>';
  document.body.appendChild(w);
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('go')));
  setTimeout(() => w.classList.add('fade'), 360);
  setTimeout(() => w.remove(), 640);
}
// BOOST DEMO (documented, demo-only — §2.9): boost + storm IGNORES the quota and fires
// at +8s (?fc-wx=storm&boost is how the owner auditions it), then every 5–10 min in boost.
function demoSprite() {
  demoT = 0;
  if (!root().classList.contains('fc-boost')) return;
  if (root().dataset.wx === 'storm' && !reduced && !document.hidden) spawnSprite();
  demoT = setTimeout(demoSprite, 300e3 + Math.random() * 300e3);
}
function onIntensity(e) {
  // the visual boost of every layer is CSS-driven (html.fc-boost) and heliostat
  // re-applies its scene itself — weather only re-arms the demo sprite cadence
  clearTimeout(demoT); demoT = 0;
  if (e.detail && e.detail.mode === 'boost' && !reduced) demoT = setTimeout(demoSprite, 8000);
  syncIris(); // boost relaxes the iris hour-gate — re-evaluate now (owner can see it on demand)
}

/* ════════ init ════════ */
export function initWeather(config) {
  cfgW = (config && config.weather) || {};
  if (!document.body) return;

  // scrubber — ephemeral, deterministic: skips the network entirely
  let scrub = null;
  try { scrub = new URLSearchParams(location.search).get('fc-wx'); } catch { /* */ }

  const onWxDoc = () => syncSnow();
  document.addEventListener('wn:wx', onWxDoc);
  // V5.1 — in-page QA without URLs: the LOUD panel's WX chip forces a state through
  // the same path as the ?fc-wx scrubber (ephemeral; detail.state null/'auto' → back
  // to the synthetic/cached truth). The owner can now AUDITION rain/storm/snow live.
  const onForce = (e) => {
    const st = e.detail && e.detail.state;
    const syn = synthetic();
    if (st && st !== 'auto' && VALID.has(st)) apply(st, syn.wind, CLOUDS[st]);
    else apply(syn.state, syn.wind, syn.clouds);
    // V5.3 — auditioning the RED SPRITE: selecting STORM via the LOUD chip fires one
    // sprite right away (boost only) so the owner SEES the red lightning on demand,
    // instead of waiting out the 1/session quota.
    if (st === 'storm' && root().classList.contains('fc-boost') && !reduced && !document.hidden) {
      clearTimeout(demoT); demoT = setTimeout(spawnSprite, 1400);
    }
  };
  document.addEventListener('wn:wx-force', onForce);
  snowT = setTimeout(syncSnow, 1200); // .fc-sky is born later in boot (particles) — re-sync once
  addEventListener('fc:intensity', onIntensity);
  irisTimer = setInterval(syncIris, 600e3); // hourly drift gate, re-checked every 10 min

  registerCleanup('weather', () => {
    clearInterval(irisTimer); clearTimeout(snowT); clearTimeout(demoT); clearTimeout(thunderT); clearTimeout(starT);
    disarmStorm();
    if (io) { io.disconnect(); io = null; }
    document.removeEventListener('wn:wx', onWxDoc);
    document.removeEventListener('wn:wx-force', onForce);
    removeEventListener('fc:intensity', onIntensity);
    // animated phenomena go; data-wx + static clouds REMAIN (state is honest under RM)
    for (const name of ['rain', 'iris', 'fog']) { const got = layers.get(name); if (got) { clearTimeout(got.removeT); got.els.forEach((el) => el.remove()); layers.delete(name); } }
  });

  if (scrub === 'off') { root().removeAttribute('data-wx'); return; } // no state at all
  if (scrub && VALID.has(scrub)) {
    const syn = synthetic(); // deterministic wind/clouds for the forced state
    apply(scrub, syn.wind, CLOUDS[scrub]);
    if (root().classList.contains('fc-boost') && !reduced) demoT = setTimeout(demoSprite, 8000); // boot misses fc:intensity
    return;
  }

  // Layer 0 — IMMEDIATELY (<50ms from boot, no await before this)
  const syn = synthetic();
  apply(syn.state, syn.wind, syn.clouds);
  if (root().classList.contains('fc-boost') && !reduced) demoT = setTimeout(demoSprite, 8000);

  // Layer 1 — net-polite: idle, save-data honored, never on file://
  if (cfgW.live && !(navigator.connection && navigator.connection.saveData) && !location.protocol.startsWith('file')) {
    const kick = () => { live(); };
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 400 });
    else setTimeout(kick, 400);
  }
}
