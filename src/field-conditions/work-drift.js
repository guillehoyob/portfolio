/**
 * WHITE NOON — Work-card tide drift (Stage 5, OCEAN stratum) — the work row sways
 * with the sea as you scroll. As you move past the Selected-work grid the cards
 * DRIFT a few px sideways (and a hair vertically), STAGGERED per card by the golden
 * angle so the row reads as one slow SWELL — a tide, never a carousel. Purely
 * additive: it writes the standalone CSS `translate:` property, which COMPOSES with
 * the card's own `transform` (hover lift / filter fade) — the two never collide.
 *
 * OCEAN stratum: reads field.scrollVel + field.energy. The swell grows while you
 * scroll and settles to dead rest when you stop (the ticker then returns false so
 * the one shared rAF sleeps). Amplitude is hard-clamped to ≤7px X / ≤3px Y, far
 * inside the page gutter, so it can NEVER add a horizontal scrollbar — transform-only,
 * zero layout, CLS-safe. Home only (the only page with #work .workgrid).
 * Reduced motion / flag off → never runs (honest Stage-0: cards stand still).
 */
import { addTicker, removeTicker, field, onReducedMotionChange } from './index.js';

const AMP_X = 7;        // px — the swell's horizontal reach (hard cap, << page gutter)
const AMP_Y = 3;        // px — a hair of vertical lift, so it heaves not just slides
const PHI_GAP = 2.39996323; // the golden angle (rad) — adjacent cards lead/lag like a real swell
const SWELL_SPEED = 0.10;   // base phase advance/frame at full scroll — slow (a tide, not a ripple)

export function initWorkDrift() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // honest static state
  const grid = document.querySelector('#work .workgrid');
  if (!grid) return; // home only — guard the section/cards being absent
  const cards = [...grid.querySelectorAll('.wn-card')];
  if (!cards.length) return;

  // a single phase clock that advances with how fast you're scrolling (the tide rises with
  // the swell you make), plus a smoothed amplitude that eases up under scroll and decays to
  // dead calm at rest. Both are float scalars — a handful of ops/frame even when active.
  let phase = 0, amp = 0;

  const ticker = () => {
    // swell follows the OCEAN bus: scroll velocity drives it, lingering energy keeps a faint
    // residual sway so the row doesn't snap to a halt the instant you stop (the sea settles).
    const drive = Math.max(field.scrollVel, field.energy * 0.5);
    amp += (drive - amp) * (drive > amp ? 0.12 : 0.05); // rise gently, settle slower — a tide
    phase += SWELL_SPEED * (0.15 + amp); // the crest travels faster while the swell is up

    const reach = amp * AMP_X;
    if (reach < 0.05) {                       // fully settled → clear and let the rAF sleep
      for (const c of cards) c.style.translate = '';
      amp = 0;
      return false;
    }
    for (let i = 0; i < cards.length; i++) {
      const a = phase + i * PHI_GAP;          // golden-angle stagger → a swell, not a block slide
      const x = Math.sin(a) * reach;          // ≤ AMP_X (amp ≤ 1)
      const y = Math.cos(a) * amp * AMP_Y;    // ≤ AMP_Y — the hair of heave
      // standalone `translate:` composes with the card's `transform:` (hover/filter) — no clobber
      cards[i].style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
    }
    return true; // still drifting — keep the shared loop awake
  };
  addTicker(ticker);

  // live OS reduced-motion toggle → stop ticking and return every card to dead rest (§5 law 4)
  onReducedMotionChange((r) => {
    if (!r) return;
    removeTicker(ticker);
    for (const c of cards) c.style.translate = '';
  });
}
