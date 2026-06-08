/**
 * WHITE NOON — main entry (Vite-bundled, deferred module)
 * STAGE 0: interaction grammar only — nav scroll state, the mobile menu, the
 * work filter, contact copy, CV print. ZERO animation. Everything here is a
 * progressive enhancement: with JS off the static HTML is already complete
 * (inline mobile links, working mailto, all cards visible).
 *
 * The Field Conditions Living System is layered on in later stages via
 * `import('./field-conditions/index.js')` behind per-behavior flags; turning
 * every flag off must reproduce this Stage-0 page exactly.
 */

/* ---- nav: hairline + blur once scrolled past 100px (§3.1) ---- */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 100);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---- mobile menu: hamburger + full-screen overlay, focus-trapped, Esc closes (§3.1) ---- */
function initMobileMenu() {
  const nav = document.querySelector('.nav');
  const toggle = nav?.querySelector('.nav__toggle');
  const links = nav?.querySelector('.nav__links');
  if (!nav || !toggle || !links) return;
  toggle.hidden = false; // reveal only when JS can drive it

  const setOpen = (open) => {
    nav.dataset.menuOpen = open ? 'true' : 'false';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) links.querySelector('a')?.focus();
    else toggle.focus();
  };
  toggle.addEventListener('click', () => setOpen(nav.dataset.menuOpen !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (nav.dataset.menuOpen !== 'true') return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Tab') {
      // trap focus within the open overlay (§6.3)
      const items = [...links.querySelectorAll('a')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ---- work filter: instant DOM toggle by status (§3.9). No layout animation at Stage 0. ---- */
function initWorkFilter() {
  const buttons = document.querySelectorAll('.filter[data-filter]');
  if (!buttons.length) return;
  const cards = document.querySelectorAll('[data-grid] [data-status]');
  const apply = (val) => {
    cards.forEach((c) => { c.style.display = val === 'all' || c.dataset.status === val ? '' : 'none'; });
    buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === val ? 'true' : 'false'));
  };
  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));
}

/* ---- contact: copy email to clipboard, confirm by swapping the label (§3.18) ---- */
function initCopy() {
  document.querySelectorAll('.contact__copy[data-copy]').forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); } catch { /* no-op */ }
      btn.textContent = 'Copied';
      btn.dataset.copied = 'true';
      setTimeout(() => { btn.textContent = btn.dataset.label || 'Copy'; btn.dataset.copied = 'false'; }, 2000);
    });
  });
}

/* ---- CV: print / save-as-PDF ---- */
function initPrint() {
  document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
}

function boot() {
  initNavScroll();
  initMobileMenu();
  initWorkFilter();
  initCopy();
  initPrint();
  // Field Conditions Living System — deferred, flag-gated; failure never breaks Stage 0.
  import('./field-conditions/index.js').then((m) => m.boot()).catch(() => {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
