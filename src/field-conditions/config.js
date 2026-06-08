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
    vaultBlur: true,      // cross-document View Transitions page blur (§5.10)
    // Stage 2 — pulse
    heartbeat: true,      // 6s dot breathe (§5.6) — governor-exempt
    firstBreath: true,    // one-shot scroll-cue pulse (§5.7)
    scanline: true,       // footer 1px drift once/60s (§5.11)
    // Stage 3 — identity
    newRoute: true,       // per-visit hero route path (§5.2)
    thresholdCut: true,   // void-band entry snap (§5.8)
    crack: true,          // signal crack draw across void (§5.9)
    // Stage 4 — weather (field state)
    heliostat: true,      // time-of-day tint/field (§5.1) — governor-exempt
    // Stage 5 — weather (traces, governor-arbitrated)
    slipstream: true,     // scroll velocity → haze + heading scaleX (§5.4)
    crosswind: true,      // cursor radial + multiply warming spot (§5.3)
    // Stage 6 — memory
    patina: true,         // returning-visitor state (§5.5)
  },
};

export default config;
