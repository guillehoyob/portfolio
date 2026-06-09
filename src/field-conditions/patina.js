/**
 * WHITE NOON — Patina (Stage 6, §5.5) — state, not animation
 * The site ages with the visitor (wabi-sabi). Visited project cards grow an
 * organic moss CREEP from the lower-left earth corner and a border warmed toward
 * moss, with an sr-only "viewed earlier" (no corner badge — the aging is rooted,
 * felt-not-seen; the deepest tier settles a faint gold glint INTO the creep). The visit count + return greeting are handled PRE-PAINT in the head
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
  // No corner badge: the aging lives in the moss CREEP (CSS on .wn-card--visited) —
  // warmed border + creep from the lower-left earth corner, plus an in-creep gold glint
  // at the deepest tier. We only add the a11y label here (memory isn't a visual flag).
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = ' (viewed earlier)';
  card.appendChild(sr);
}
