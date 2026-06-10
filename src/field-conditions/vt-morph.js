/**
 * WHITE NOON — View-Transition morph card→H1 (AST-6, flag `vtMorph`)
 * On pageswap (old page, before the snapshot) the clicked work card's title is
 * tagged view-transition-name:work-title; on pagereveal (new page) the project
 * H1 receives the same name, so Chrome morphs the uppercase card label into the
 * 6.5rem identity title across the navigation. The name is cleared when the
 * transition finishes (it must never leak into later same-page transitions).
 * Guards: 'onpageswap' feature-test (Firefox/Safari keep the static dive,
 * navigation stays clean); reduced motion disables @view-transition in CSS, so
 * e.viewTransition is undefined and this is a no-op. URL normalization strips
 * .html and trailing slashes (lección BUG-1). Kill-switch: flags.vtMorph.
 */
export function initVtMorph() {
  if (!('onpageswap' in window)) return; // no cross-document VT events — nothing to do

  const norm = (p) => p.replace(/\.html$/, '').replace(/\/$/, '') || '/';

  addEventListener('pageswap', (e) => {
    if (!e.viewTransition) return;
    const url = e.activation && e.activation.entry && e.activation.entry.url;
    if (!url) return;
    let to;
    try { to = norm(new URL(url, location.href).pathname); } catch { return; }
    // the card being navigated into — tag its title BEFORE the old snapshot
    const title = [...document.querySelectorAll('a.wn-card[href]')]
      .filter((a) => { try { return norm(new URL(a.href, location.href).pathname) === to; } catch { return false; } })
      .map((a) => a.querySelector('.wn-card__title'))
      .find(Boolean);
    if (title) title.style.viewTransitionName = 'work-title';
  });

  addEventListener('pagereveal', (e) => {
    if (!e.viewTransition) return;
    const h1 = document.querySelector('.identity__title');
    if (!h1) return;
    h1.style.viewTransitionName = 'work-title';
    e.viewTransition.finished.finally(() => { h1.style.viewTransitionName = 'none'; });
  });
}
