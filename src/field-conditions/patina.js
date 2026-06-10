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
  // normalize legacy entries recorded with an extension (audit BUG-1) so old
  // memory still lights the extensionless card hrefs
  visited = visited.map((s) => String(s).replace(/\.html?$/, ''));

  // record this project-page visit (not the hub/index). The path may arrive WITH
  // its .html extension (static hosting serves both) — strip it or the stored slug
  // never matches the extensionless card hrefs and no moss ever grows (BUG-1).
  const m = location.pathname.match(/^\/work\/([^/]+?)(?:\.html?)?\/?$/);
  if (m && m[1] && m[1] !== 'personal' && m[1] !== 'index') {
    if (!visited.includes(m[1])) {
      visited.push(m[1]);
      if (visited.length > 50) visited = visited.slice(-50); // FIFO hygiene
      try { localStorage.setItem('wn.visited', JSON.stringify(visited)); } catch { /* private mode */ }
    }
  }

  // dev/QA scrubber parity (audit VIS-09): ?wn=return|amp|aged|<n≥2> should also light
  // the cards, not only the crack — EPHEMERAL (never persisted), like the visit tiers.
  let forceAll = false;
  try {
    const qp = new URLSearchParams(location.search).get('wn');
    if (qp && qp !== 'clear' && qp !== 'fresh' && qp !== '1') forceAll = true;
  } catch { /* */ }

  // mark already-visited cards across the site
  document.querySelectorAll('a.wn-card[href^="/work/"]').forEach((card) => {
    const cm = card.getAttribute('href').match(/^\/work\/([^/#]+)/);
    if (forceAll || (cm && visited.includes(cm[1].replace(/\.html?$/, '')))) markVisited(card);
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
