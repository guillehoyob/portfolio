/**
 * WHITE NOON — New Route (Stage 3, §5.2)
 * The hero route line varies per visit: a stable line within a day, a new one
 * across days. The pre-paint head snippet has already seeded wn.visitor, picked
 * the day's index (window.__wnRouteIndex) and — when motion is allowed — armed
 * the path hidden (html.fc-route: dashoffset, + a CSS fail-safe draw at 2.4s).
 * Here we swap the day's `d` WHILE the line is still invisible (no flash on any
 * engine), disarm the CSS fail-safe, and draw it once (900ms, the page's single
 * sanctioned >600ms gesture). Only the path varies — never grid, type or palette.
 */
import { setupGsap } from './gsap-setup.js';
import routes from './routes.json';

export function initNewRoute() {
  const band = document.querySelector('.hero__routeband');
  if (!band) return; // not the home hero
  const i = ((window.__wnRouteIndex ?? 0) % routes.length + routes.length) % routes.length;
  const pair = routes[i];
  const dPath = band.querySelector('.route-path--desktop');
  const mPath = band.querySelector('.route-path--mobile');
  // swap the day's geometry while the line is still invisible (armed) or static
  if (dPath && pair) dPath.setAttribute('d', pair.d);
  if (mPath && pair) mPath.setAttribute('d', pair.m);

  const armed = document.documentElement.classList.contains('fc-route');
  if (!armed) return; // reduced motion / no-motion: the chosen line is already drawn complete

  // disarm the CSS fail-safe draw, then draw via GSAP after the 120ms breath,
  // on the signature 'run' ease (not expo.out — one curve everywhere, craft §1)
  document.documentElement.classList.add('fc-route-drawn');
  const gsap = setupGsap();
  const paths = [dPath, mPath].filter(Boolean);
  gsap.fromTo(
    paths,
    { strokeDasharray: 3000, strokeDashoffset: 3000 },
    { strokeDashoffset: 0, duration: 0.9, ease: 'run', delay: 0.12 }
  );
}
