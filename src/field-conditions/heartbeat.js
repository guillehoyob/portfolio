/**
 * WHITE NOON — Heartbeat (Stage 2, §5.6) — the one shared pulse
 * The hero status dot beats on the SHARED heartbeat clock (a 4s cardiac lub–dub
 * + diastole, exported from index.js), driven on the ONE shared rAF — the exact
 * same phase the Red Spine's travelling node reads, so the dot and the spine are
 * provably one heartbeat, not two coincident loops. Governor-EXEMPT (a pulse,
 * not weather); the dot ticker returns true so it owns/keeps the shared loop
 * alive on the home hero (suspends on tab-hide). The status text is the self-set
 * config.statusLabel: zero network, always valid, never stale. liveGitHub off by
 * default → no third-party call. Reduced motion → dot solid, no beat (CSS), label
 * still renders.
 */
import { addTicker, removeTicker, heartbeatPhase, heartbeatBeat, heartbeatBreath, onReducedMotionChange } from './index.js';

export function initHeartbeat(config) {
  const dot = document.querySelector('.hero .wn-status__dot:not(.wn-status__dot--static)');
  if (dot) {
    dot.classList.add('wn-status__dot--live');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const beat = () => {
        const ph = heartbeatPhase();
        dot.style.setProperty('--fc-dot-beat', heartbeatBeat(ph).toFixed(3));
        dot.style.setProperty('--fc-dot-breath', heartbeatBreath(ph).toFixed(3)); // diastolic breath
        return true; // continuous pulse — keeps the shared loop alive on the hero
      };
      addTicker(beat);
      // live OS reduced-motion toggle → stop writing the vars (CSS already neutralises them)
      onReducedMotionChange((r) => { if (r) { removeTicker(beat); dot.style.removeProperty('--fc-dot-beat'); dot.style.removeProperty('--fc-dot-breath'); } });
    }
  }

  // resolve + cache the status label (the line is already rendered in static HTML)
  const label = (config.statusLabel || '').trim();
  try { sessionStorage.setItem('wn.heartbeat', JSON.stringify({ label })); } catch { /* private mode */ }

  // Optional live-GitHub enhancement — OFF by default (§5.6). Only ever touches
  // the network when explicitly enabled; any failure falls back to statusLabel.
  if (config.liveGitHub?.enabled && config.liveGitHub.user) {
    enrichFromGitHub(config).catch(() => { /* falls back to statusLabel, dot solid */ });
  }
}

async function enrichFromGitHub(config) {
  const line = document.querySelector('.hero .wn-status');
  if (!line) return;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`https://api.github.com/users/${config.liveGitHub.user}/events/public`, { signal: ctrl.signal });
    if (!res.ok) return;
    const events = await res.json();
    const push = Array.isArray(events) && events.find((e) => e.type === 'PushEvent');
    if (!push || !push.created_at || !push.repo?.name) return; // never render "undefined"
    const hours = Math.max(1, Math.round((Date.now() - new Date(push.created_at).getTime()) / 3.6e6));
    const repo = push.repo.name.split('/').pop();
    const text = `last push: ${hours}h ago · BUILDING: ${repo}`;
    line.lastChild.textContent = text;
    try { sessionStorage.setItem('wn.heartbeat', JSON.stringify({ label: text })); } catch { /* */ }
  } finally {
    clearTimeout(t);
  }
}
