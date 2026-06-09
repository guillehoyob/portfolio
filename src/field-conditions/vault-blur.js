/**
 * WHITE NOON — Vault Blur page transitions (Stage 1, §5.10)
 * Cross-document View Transitions on this MPA static host: the split-second
 * between leaping and landing. Injected at runtime so the flag fully gates it —
 * flag off (or unsupported) → instant navigation, which is the honest Stage-0
 * state. Reduced motion injects the explicit opt-out (the UA default crossfade
 * cannot be reached by the token gate, so it must be turned off here).
 * Durations: 80ms out / 160ms in (240ms total), --ease-run.
 */
export function initVaultBlur(reduced) {
  // A vertical DIVE between pages: the old page sinks down + blurs (descending through water),
  // the new page surfaces from above into clarity — so home↔work reads as moving through ONE
  // body of water, not a slide. Within the locked caps (blur ≤4px, translate ≤14px, scale ≥0.992).
  const css = reduced
    ? `@media (prefers-reduced-motion: reduce){
         @view-transition { navigation: none; }
         ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
       }`
    : `@view-transition { navigation: auto; }
       ::view-transition-old(root) { animation: wn-dive-out 89ms cubic-bezier(0.22,1,0.36,1) both; }
       ::view-transition-new(root) { animation: wn-dive-in 144ms cubic-bezier(0.22,1,0.36,1) both; }
       @keyframes wn-dive-out { to { filter: blur(4px); opacity: 0.55; transform: translateY(8px) scale(0.992); } }
       @keyframes wn-dive-in { from { filter: blur(4px); opacity: 0.55; transform: translateY(-13px) scale(0.992); } to { filter: blur(0); opacity: 1; transform: none; } }
       @media (prefers-reduced-motion: reduce) {
         @view-transition { navigation: none; }
         ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
       }`;
  const style = document.createElement('style');
  style.setAttribute('data-fc', 'vault-blur');
  style.textContent = css;
  document.head.appendChild(style);
}
