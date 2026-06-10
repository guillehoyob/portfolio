/**
 * WHITE NOON — Field Conditions config (the kill-switch panel)
 * Every ambient behavior is gated by one flag here. Turning any flag off must
 * reproduce the Stage-0 static page exactly — each hook is independently
 * deletable (design-system.md §5.12, Risk 8). The behaviors are added in
 * staged order; a flag set false simply means that behavior never enables().
 *
 * statusLabel is the self-set Heartbeat status (§5.6) — no network, always
 * valid, never stale. It is the Stage-2 build gate (must be non-empty).
 * liveGitHub stays OFF by default: zero third-party calls unless explicitly
 * enabled by an owner who pushes publicly and frequently.
 */
export const config = {
  // Heartbeat status line — self-set string, zero network (§3.3 / §5.6)
  statusLabel: 'OPEN TO WORK',

  // Optional live GitHub enhancement — OFF by default (zero external calls)
  liveGitHub: { enabled: false, user: '' },

  // Per-behavior flags, grouped by build stage. All on by default in the
  // finished site; flip any to false to fall back to its honest static state.
  flags: {
    // Stage 1 — Lenis + GSAP base
    reveals: true,        // Forward-landing scroll reveals
    heroEntrance: true,   // hero type Forward-land + H1 SplitText masked reveal (§3.2)
    vtMorph: true,        // View-Transition morph card→H1 (AST-6); the page dive itself is static CSS
    // Stage 2 — pulse
    heartbeat: true,      // 4s cardiac dot+spine pulse, shared clock (§5.6) — governor-exempt
    firstBreath: true,    // one-shot scroll-cue pulse (§5.7)
    scanline: true,       // footer 1px drift once/60s (§5.11)
    // Stage 3 — identity
    newRoute: true,       // per-visit hero route path (§5.2)
    routeAlive: true,     // the name's red route answers interaction (HILO-1a)
    spine: true,          // THE RED SPINE — scroll-drawn full-page red thread (§5.2 ext)
    thresholdCut: true,   // void-band entry snap (§5.8)
    crack: true,          // signal crack draw across void (§5.9)
    // Stage 4 — field state
    heliostat: true,      // time-of-day tint/field (§5.1) — governor-exempt
    weather: true,        // REAL weather → sky phenomena (SKY-5..11); see `weather` below
    // Stage 5 — weather traces (governor-arbitrated)
    slipstream: true,     // scroll velocity → haze + heading scaleX (§5.4)
    crosswind: true,      // cursor radial + multiply warming spot (§5.3)
    warmLens: true,       // the cursor CLARIFIES/warms the element it touches (reveal, not fog)
    particles: true,      // SKY-light motes — soft warm light blooms high in the field, energy-reactive (redesigned)
    ocean: true,          // click → faint sky ripple, the field responds (ocean), one-shot
    breath: true,         // the field's slow breath engine (BRE-1; replaced idleSigh)
    continuity: true,     // persist the heartbeat across page navigations (the same ocean)
    // Stage 6 — memory
    patina: true,         // returning-visitor state (§5.5)
    // Calibration UI
    intensityControl: true, // the visible FIELD: SUBTLE/LOUD toggle (INT-3) — set false to retire it
    // V5.2
    ask: true,            // ASK THE FIELD — grounded portfolio assistant (/api/ask, Azure server-side)
    magnet: true,         // BREAK-5 — the primary CTA + FIELD capsule lean toward the hand (≤4px, spring release)
    sound: false,         // BREAK-8 — synthesized micro-sound. OFF by law (ma is silence); audition: ?fc-sound=1
  },

  // Real-weather behavior knobs (SKY-5): ONE GET to api.open-meteo.com (the single
  // sanctioned third-party — see CONTRACTS §f.4), cached ttlMin in sessionStorage,
  // tz-table coords (no geolocation permission, Geocoding API forbidden).
  // live:false → zero network, synthetic Layer-0 only, byte-identical page.
  weather: { live: true, ttlMin: 30, iris: true, fogVeils: false /* SKY-10a: owner gate */ },
};

/* ===== INTENSITY — el registro central de amplitudes (WL-7 / INV-1) =====
   Multiplicadores ADIMENSIONALES sobre las constantes base de cada módulo.
   subtle = identidad byte-exacta. REGLA DE CONSUMO: JS lee `intensity.<eje>`
   EN EL PUNTO DE USO (live binding de index.js) — nunca copiado a constante en
   init; CSS multiplica por var(--fc-int-*, 1). Clamp duro en cada consumidor.
   El volcado a :root usa '--fc-int-' + k.toLowerCase().
   Fuera del registro (ley del rojo / actos deliberados): warm-lens, one-shots,
   ripple rojo del nib, bounce-light, la 404 entera, tipografía del void word. */
export const INTENSITY = {
  subtle: {
    tint: 1, tintFloor: 0, sun: 1, mote: 1, moteSize: 1, ring: 1,
    beat: 1, breath: 1, haze: 1, lag: 1,
    nib: 1, spine: 1, knot: 1, stitch: 1, routePull: 1, tapPull: 1,
    kintsugi: 1, moss: 1, shadow: 1, weather: 1,
  },
  boost: {
    tint: 1.6, tintFloor: 2.5, sun: 1.6, mote: 1.5, moteSize: 1.4, ring: 1.5,
    beat: 1.25, breath: 1.4, haze: 1.7, lag: 1.6,
    nib: 1, spine: 1, knot: 1, stitch: 1, routePull: 1.5, tapPull: 1.4,
    kintsugi: 1.4, moss: 1.45, shadow: 1.3, weather: 1.5,
  },
};
// El rojo es BINARIO: el boost JAMÁS lo multiplica. El harness asierta la igualdad.
export const RED_LOCKED = ['nib', 'spine', 'knot', 'stitch'];

// Parámetros del motor de respiración (BRE-1) — namespace SEPARADO de INTENSITY.
export const BREATH_PARAMS = {
  cycleMs: 10400, inhaleMs: 3600, crestHoldMs: 1000, releaseMs: 400, releaseDepth: 0.12,
  valleyMs: 2400, idleScrollMs: 1500, idlePointerMs: 2600, idleKeyMs: 3500, /* pointer 3500→2600 (V5.1): the reader's pauses are shorter than we budgeted */
  energyGate: 0.08, firstDelayMs: 900, firstAmp: 1.25,
  boost: { idleScrollMs: 800, idlePointerMs: 600, valleyMs: 1200 },
};
// Tiers de reposo profundo (BRE-4).
export const REST_PARAMS = {
  deepMs: 30000, asleepMs: 60000, asleepCycleMul: 1.2, asleepAmp: 1.15,
  asleepValleyMs: 6000, warmFloor: 0.04,
  boost: { deepMs: 8000, asleepMs: 20000, warmFloor: 0.07 }, // warmFloor cap duro 0.07 SIEMPRE
};

export default config;
