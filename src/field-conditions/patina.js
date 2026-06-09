/**
 * WHITE NOON — Patina (Stage 6, §5.5) — state, not animation
 * The site ages with the visitor (wabi-sabi). Visited project cards grow a 12px
 * moss corner tick and a border warmed toward moss, with an sr-only "viewed
 * earlier". The visit count + return greeting are handled PRE-PAINT in the head
 * snippet (no content flash; fc-return swaps the greeting, fc-amp ≥3 amplifies
 * Heliostat). Here we record the current project-page visit and mark cards.
 * Reduced motion: identical — memory isn't motion. Storage unavailable (private
 * mode) → behavior silently absent. First-party localStorage only; no fetch.
 */
export function initPatina() {
  let visited;
  try { visited = JSON.parse(localStorage.getItem('wn.visited') || '[]'); } catch { return; }
  if (!Array.isArray(visited)) visited = [];

  // record this project-page visit (not the hub/index)
  const m = location.pathname.match(/^\/work\/([^/]+)\/?$/);
  if (m && m[1] && m[1] !== 'personal' && m[1] !== 'index') {
    if (!visited.includes(m[1])) {
      visited.push(m[1]);
      if (visited.length > 50) visited = visited.slice(-50); // FIFO hygiene
      try { localStorage.setItem('wn.visited', JSON.stringify(visited)); } catch { /* private mode */ }
    }
  }

  // mark already-visited cards across the site
  document.querySelectorAll('a.wn-card[href^="/work/"]').forEach((card) => {
    const cm = card.getAttribute('href').match(/^\/work\/([^/#]+)/);
    if (cm && visited.includes(cm[1])) markVisited(card);
  });
}

function markVisited(card) {
  if (card.dataset.visited) return;
  card.dataset.visited = 'true';
  card.classList.add('wn-card--visited');
  const tick = document.createElement('span');
  tick.className = 'wn-card__patina';
  tick.setAttribute('aria-hidden', 'true');
  // two-tone moss: a filled corner + a 1px --moss-deep edge along the hypotenuse, so it reads
  // as a small bloom of lichen (settled growth) rather than a hard UI flag
  // a small rounded moss BLOOM in the corner (concave inner curve) — reads as settled lichen, not a
  // hard UI dog-ear (Fase 1); the moss-deep edge is thicker so the organic rim is actually visible
  tick.innerHTML = '<svg viewBox="0 0 12 12" width="100%" height="100%"><path d="M0 0 L12 0 L12 12 Q6 6 0 0 Z" fill="var(--moss)"/><path d="M12 12 Q6 6 0 0" stroke="var(--moss-deep)" stroke-width="1.5" fill="none"/></svg>';
  (card.querySelector('.wn-card__head') || card).appendChild(tick);
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = ' (viewed earlier)';
  card.appendChild(sr);
}
