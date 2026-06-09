/**
 * WHITE NOON — Vault Blur / vertical DIVE page transitions (§5.10)
 * The dive now lives in STATIC inlined CSS (field-conditions.css: @view-transition + the
 * wn-dive-* keyframes + the reduced-motion opt-out), because a cross-document View Transition
 * opt-in must be present at PARSE time — a JS-injected <style> can arrive too late for the very
 * first navigation, which is why the dive sometimes didn't engage. This module is now a no-op
 * kept for the flag's sake (flag off doesn't remove the static rule, but the transition is a
 * sub-300ms root crossfade with a reduced-motion opt-out — harmless and not gated at runtime).
 */
export function initVaultBlur() {
  /* intentionally empty — the dive is static CSS now (reliable for cross-document VT). */
}
