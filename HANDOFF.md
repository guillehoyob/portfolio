# WHITE NOON — Portfolio Living Layer · HANDOFF

> Hand-off for a fresh session. Read this first, then `src/field-conditions/index.js` and `config.js`.
> Status: all green, deployed to `main`. The owner (Guillermo) is iterating on the "living ocean" by hand and reporting what he can/can't feel.

---

## 1. What this is
- **Guillermo Hoyo Bravo**'s portfolio. Vite **vanilla-JS multi-page app (MPA)** with a Node page generator. Design system = **WHITE NOON**: warm-white field ≥90% of pixels, exactly **ONE red** signal (`--signal`, ≤1.5% viewport), Japanese *ma*, token-only color, **everything free** (GSAP 3.13 free plugins + Lenis), WCAG AA.
- Identity: Guillermo Hoyo Bravo · `guillehoyob@gmail.com` · `github.com/guillehoyob`. (The operator email `juan@zelebrix.com` is a different person — do not surface it.)
- Repo `github.com/guillehoyob/portfolio`, branch **main**. Deploy: **Cloudflare Pages** (Framework: None · Build: `npm run build` · Output: `dist`). Every push to main auto-redeploys.
- **Edit** `src/pages/*.mjs`, `src/data/content.js`, `src/layout.mjs`, `src/styles/*.css`, `src/field-conditions/*.js`. The **root `*.html` and `work/*.html` are GENERATED** by `scripts/build-pages.mjs` (runs on `predev`/`prebuild`) — never hand-edit them, but DO commit them (they carry the inlined critical CSS + the pre-paint snippet).
- **Every `[PLACEHOLDER]` must stay visible** — it's the owner's honesty device, launch-permitted. Never invent metrics/dates/URLs.

## 2. Run / build / test
```
npm run dev                              # http://localhost:5173 — instant, reflects everything
npm run build                            # regenerates root html + dist (must pass before commit)
npx vite preview --port 4178 --strictPort  # then, in another shell:
npm run living                           # the verification harness (tests/living.spec.js)
```
- **`npm run living`** is the source of truth: Playwright drives EVERY behavior programmatically and prints `behavior | wired? | fires? | evidence | verdict` + a breakpoint matrix (1440/1024/768/390) + a reduced-motion table. **Currently 22/22 green, 0 console errors, CLS ≤0.0003, zero third-party.** When you change a behavior, keep this green (add/adjust an assertion).
- **Test returning-visitor state WITHOUT the console** (Chrome blocks pasting): append **`?wn=return|amp|aged|fresh|clear`** to any URL (read in the pre-paint, ephemeral — not persisted). e.g. `/?wn=aged` shows the deepest kintsugi.
- Reduced motion = OS setting; everything must degrade to an honest static state.
- CRLF warnings on commit are harmless (Windows). Commit message trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 3. Architecture — the "living ocean"
All living behaviors are in `src/field-conditions/`, each **flag-gated in `config.js`**, each independently deletable (flag off ⇒ byte-identical Stage-0). Boot path: `main.js` → `field-conditions/index.js → boot()` (dynamic-imports each behavior behind its flag, isolated try/catch).

**`index.js` is the engine:**
- **ONE shared rAF** (`addTicker`/`removeTicker`/`wake`; dirty-flag idle-suspend after ~90 idle frames; suspends on tab-hide). A ticker returns `true` while it has work.
- **Governor** (weather only): precedence `slipstream > crosswind`; Heartbeat + Heliostat exempt; Scanline self-arbitrates (decoupled).
- **The heartbeat clock** (`heartbeatPhase/heartbeatBeat/heartbeatBreath`): 4s cardiac (lub + 0.618 dub + recoil undershoot) + a diastolic breath. Anchored to **`Date.now()` persisted in `sessionStorage 'wn.beatAnchor'`** when `config.flags.continuity` → **the pulse is continuous across page navigations** (gated by `continuity`).
- **The field "bus"** (the ocean medium): `export const field = {cursorX,cursorY,cursorVel,scrollVel,energy,breath,impulses}`. `addImpulse(x,y,force)` (click/detonation), `feedScroll(v)` (from Lenis in scroll.js), `integrateEnergy()` ticker decays `energy *= 0.97` each frame. **Energy** rises with cursor/scroll speed + clicks; behaviors READ it (never multiply past a hard cap).
- **Strata law** (a taxonomy, NOT painted layers): **SKY** reads energy only (heliostat tint, crosswind haze, motes); **OCEAN** reads energy+impulses (spine, heartbeat, ocean ripple, route); **EARTH** reads neither — memory must not ripen on a fast scroll (patina moss, kintsugi gold, grain).
- **`field.breath`** = the slow sigh (set by `idle-sigh.js`); the **dot AND spine breathe with it** (one organism — owner's request).

## 4. The behaviors (file → what + how to see)
| File | What | See it |
|---|---|---|
| `heartbeat.js` | Hero status dot beats (4s cardiac) + breathes; shared clock; couples to `field.breath` | Watch the "OPEN TO WORK" dot |
| `spine.js` | **THE RED SPINE** on EVERY page: scroll-drawn red trace down the left margin (lane 6%/4.5%), drawing-tip **nib** (brightens with scroll velocity + a click near it), **local path-deform cursor bend** (24 dense resampled points), tidal breath, **baton-pass** from the hero route (home) / `.identity__route` (project pages). z-index:2 (over the void black, under text). **Skipped on `/cv`.** NO gold vein (removed). | Scroll any page; move cursor near the line |
| `new-route.js` | Per-visit hero route, GSAP draw (delay 0.45, real `getTotalLength`) | Reload home |
| `particles.js` | **SKY sparkles** — tiny TWINKLING motes beside the spine, in the hour's colour (`--fc-sky-hue`), brighter/faster with cursor speed+proximity. Home only. `mix-blend-mode:multiply`, z-warm | Move cursor fast in the left gutter |
| `ocean.js` | Click → SKY ripple, **energy-scaled** (calm=small/quick, after-moving=wide/slow + a φ ghost ring). `addImpulse` on click. (Had a `live`-counter leak → fixed.) | Click empty space; vary your speed first |
| `warm-lens.js` | Cursor **warms the element it touches** (broad: cards/prose/headings/lists/void) — additive light, NOT a fog | Hover any block |
| `idle-sigh.js` | After 8s rest, ONE breath of the haze (0.05→0.11), **re-fires each cycle**, publishes `field.breath` | Stay still 8s on home |
| `heliostat.js` | **CONTINUOUS top-down day wash** (warm dawn→clear noon→cool evening→dim night), minute-by-minute, masked gradient (`.fc-tint`), publishes `--fc-sky-hue` | Subtle; strongest at dawn/dusk |
| `crosswind.js` | Cursor sky haze + ink-ghost multiply warm spot; lag tightens with energy | Move the cursor |
| `slipstream.js` | Scroll velocity → haze (feeds the nib); scaleX capped 1.01 | Scroll fast |
| `scanline.js` | Footer pulse of light, φ-jittered cadence | Footer |
| `threshold-cut.js` | Void band detonation (word snap + crack draws when in view) + a field flinch (`addImpulse`) | Scroll to "SHIPPED" |
| `reveals.js` | Forward-landing scroll reveals (Fib stagger) | Scroll |
| `vault-blur.js` | **NO-OP now** — the vertical DIVE page transition is **static CSS** in `field-conditions.css` (`@view-transition` + `wn-dive-*`, sink/surface). Needs Chrome/Edge 126+ | Navigate between pages |
| `patina.js` | Returning-visitor moss tick (two-tone) + warmed border; **kintsugi gold on the void crack only** (deepens fc-return/amp/aged) | `?wn=aged` then `/work`; void band |

## 5. Nature ratios (φ / Fibonacci) already applied
Spine bow φ-decay; cardiac dub = 0.618; breath crest exp 0.786; reveal stagger 55ms / breath-pre 144ms; hero stagger 0.089 / lead 0.144; dive 120/200ms + 20/30px; ocean ring 8→15; scanline golden-ratio jitter; mote golden-angle (137.5°) seeding; energy injection φ⁻³.

## 6. Budgets (all met — keep them)
CLS ~0 (≤0.0003) · shipped JS ≈55 KB gz (<90) · fonts 133 KB (<220) · **zero third-party** · field ≥90% · red ≤1.5% · tints ≤5% · haze ≤8% · AA on all text. Transform/opacity/dashoffset/path-d only; no per-frame inherited custom-prop storms on big subtrees.

## 7. The owner (Guillermo) — how to work with him
- Wants it **magical but felt-not-seen**, "natural like breathing", **simple-but-elaborate** (looks simple, many subtle things happen). Never obvious/overloaded/garish.
- Loves: **golden ratio / Fibonacci everywhere**, **consistency across pages** (same effect-type ⇒ same, or explain why one is intentionally cleaner), **nature metaphors** (ocean / earth / sky strata; wabi-sabi / kintsugi).
- He **tests hands-on and reports what he can't see** — treat each as either a real bug or a perceptibility miss; **debug with Playwright probes + screenshots**, don't hand-wave. (This session caught: ocean `live` leak, motes occluded by body bg, sigh firing once, warm-lens too narrow — all real.)
- **Already REJECTED — do not re-propose:** red section titles (breaks one-red + AA on small text); a faster heartbeat (reads as alarm); gilding the hero route or a gold "vein" on the spine (ugly + kintsugi gilds *breaks* only → gold lives on the void crack); a persistent inverted-fog veil (hurts reading → shipped the additive **warm lens** instead).
- **Likes / keep:** the warm lens, the ocean click ripple, the continuous day, the kintsugi glow on the crack, the spine on every page.

## 8. Open items / what he's reviewing now
- **SHIPPED to main (deployed):** the "WHITE NOON maestro plan" — Fase-1 audit + v4 (perceptibility) + v4b (live-feedback tuning) + v4c (redesign). See `CONCEPT.md` (three-layer law) and commits `e8f82f4` (seams) ← `8d14f27` (v4c) ← `7109b6c` (v4b) ← `671861d` (v4). Harness 22/22, budgets met.
  - **v4 (perceptibility):** warm visible afternoon/evening day-tint (heliostat ANCHORS warmth floor 16/18/19.5; mask 82%→92%; dead daypart `--fc-tint` rules deleted); motes **gold** (saturated `--sun`, kept `multiply` — NOTE `screen` is invisible on near-white, don't "fix" that way) ; ocean ripple **crests as a ring** + energy varies width/dur/wake not brightness; spine bend **contained**; kintsugi gold separated from the red crack; **og/social image** (`scripts/make-og.mjs`). Independently re-audited clean (Fase 6).
  - **v4b:** spine ripple slowed 600→1300ms; idle-sigh now perceptible — the cardiac beat **recedes** (×(1−0.6·breath)) so the dot/spine visibly SLOW into a deep breath (dedicated `--fc-dot-sigh`/`--fc-spine-sigh`); **motes on every page** (not /cv); **dev day-scrubber `?fc-hour=17`** previews any hour's light.
  - **v4c (redesign):** **tighter vertical rhythm** (`--space-section` ~30% down + `--space-section-tight`) + **one unified lane** (`--lane-max: 72ch`, every section shares the left edge; hero no longer thin); **card paper TOOTH** (`.wn-card::before` void noise, 0.03 multiply, `isolation:isolate`); **ocean work-drift** (new `work-drift.js`, flag `workDrift` — work row sways ≤7px with scroll); **organic patina creep-only** (corner tick badge REMOVED — visited = warm border + lower-left moss creep + aged gold glint; a11y sr-only kept; harness Patina assertion updated to creep+label); **seams** (scroll-drawn hairline dividers on #work/#method/#about/#contact, never red).
  - **His call now:** TINT warm vs cool (currently warm — a 2-number flip of heliostat ANCHORS warmth at 16/18h); WORK GRID is 2-col at `--lane-max:72ch` — bump toward 80–84ch if he wants cards wider.
  - **Deferred:** slim shipped-but-unused `public/motifs/*` SVGs; populate empty `public/references/`; og:image is root-relative (make absolute if a custom domain is set).
  - **Orchestration note:** parallel WRITE agents MUST use `isolation:'worktree'` — a redesign workflow without it raced on the shared tree (recovered by re-applying specs deterministically).
- **His call, not done (offer):** the *composition* notes from the art-director review — work cards feel flat; the void band is bottom-heavy; whether the dead gutter reads deliberate enough. These are his visual-design layout, not the living layer.
- **Candidates if he wants:** sky sparkles on inner pages (currently home-only); a flagged prototype of the inverted-fog veil (he was curious); project `identity__route` as inline SVG for richer life (currently a static `<img>`, the spine already baton-passes from it).
- **Fase-1 audit artifacts:** `screenshots/baseline/` (36 labelled shots), `screenshots/audit/` (probe + crops), `screenshots/before-audit/` (the pre-fix "before"). `CONCEPT.md` holds the three-layer concept + shared contracts + the change-set table.

## 9. Recent commits (main, newest first)
`02869e5` living-ocean v3 (breath↔heart, twinkle motes, broad warm lens, static dive, continuous day) · `ea00f9d` fix ocean leak + motes occlusion + continuous gradient · `c86e954` φ + depth + consistency · `feef9a0` spine on every page + remove gold vein + warm lens · `1d8c304` continuous heartbeat + bus + sigh + dive + energy couplings · `0c79694` living-layer v2 (spine, heartbeat, kintsugi…) · `54c1e76` harness + first living layer.
