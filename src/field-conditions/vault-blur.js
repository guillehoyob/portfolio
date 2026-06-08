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
  const css = reduced
    ? `@media (prefers-reduced-motion: reduce){
         @view-transition { navigation: none; }
         ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
       }`
    : `@view-transition { navigation: auto; }
       ::view-transition-old(root) { animation: wn-vault-out 80ms cubic-bezier(0.22,1,0.36,1) both; }
       ::view-transition-new(root) { animation: wn-vault-in 160ms cubic-bezier(0.22,1,0.36,1) both; }
       @keyframes wn-vault-out { to { filter: blur(4px); opacity: 0.6; } }
       @keyframes wn-vault-in { from { filter: blur(4px); opacity: 0.6; transform: translateX(-16px); } to { filter: blur(0); opacity: 1; transform: none; } }
       @media (prefers-reduced-motion: reduce) {
         @view-transition { navigation: none; }
         ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
       }`;
  const style = document.createElement('style');
  style.setAttribute('data-fc', 'vault-blur');
  style.textContent = css;
  document.head.appendChild(style);
}
