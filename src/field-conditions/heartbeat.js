/**
 * WHITE NOON — Heartbeat (Stage 2, §5.6)
 * The one ambient pulse: the 8px hero status dot breathes on a 6s cycle (pure
 * CSS, compositor-only). Governor-EXEMPT — a pulse, not weather. The status
 * text is the self-set config.statusLabel: zero network, always valid, never
 * stale. liveGitHub is off by default → no third-party call. Reduced motion is
 * handled in CSS (no fc-motion → no animation; dot solid, label still renders).
 */
export function initHeartbeat(config) {
  const dot = document.querySelector('.hero .wn-status__dot:not(.wn-status__dot--static)');
  if (dot) dot.classList.add('wn-status__dot--live');

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
