# WHITE NOON — Portfolio Living Layer · HANDOFF

> Hand-off for a fresh session. Read this first, then `src/field-conditions/index.js` and `config.js`.
> Status: all green, deployed to `main` (through v4d, `aca2e48`). The owner (Guillermo) is **actively iterating on perceptibility** — he keeps reporting living-layer effects he still can't see and intends to keep going until each is clearly felt. **Read §8.0 before touching anything.**

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

## 8. Open items / HANDOFF for the next session

### 8.0 ⚠️ READ THIS FIRST — the owner is NOT satisfied yet; this is ongoing
Guillermo's standing words: **"sigo sin ver muchas cosas… voy a intentar seguir iterando hasta que lo consiga."** Every round, after we ship, he reviews the LIVE site and reports *more* living-layer effects he still can't perceive. **Treat the perceptibility work as OPEN and continuing, not done.** He will keep pushing each element until HE can clearly see/feel it.

**THE CORE TENSION (the most important thing to understand):** WHITE NOON's law is *felt-not-seen / ma / ≤5% tint / ≥90% warm field / ≤1.5% red / whisper-quiet*. For **Guillermo's taste, that spec lands too far toward "not seen."** He repeatedly asks to **exaggerate** — and has explicitly approved exceeding the original subtle budgets (e.g. the v4d "sun" glow runs at 0.10–0.22 opacity, well past the old ≤5% tint guideline). **So: lean MORE visible than the original spec.** Protect the hard invariants that are about *correctness* (exactly ONE red ≤1.5%; AA contrast; reduced-motion honest; harness 22/22; zero deps) — but the "everything ultra-subtle" guideline is **negotiable and he wants it dialed up.** When in doubt, make it more perceptible, deploy, and let him judge live.

**Method that works with him:** he tests hands-on and reports "no veo X." Reproduce + debug with the **`?fc-hour=` scrubber**, `scripts/audit-probe.mjs` (hard numbers), and **before/after screenshot crops** — NEVER hand-wave or argue it "is" visible. Ship each round (push to main → Cloudflare); he reviews live and comes back with the next thing. Small, fast, deploy-each-round loop.

### 8.1 STILL "ON PROBATION" — things he may still say he can't see (verify live each)
- **The day-tint / light of the hour** — his #1 recurring complaint across EVERY round ("no veo el tinte"). v4 warmed it, v4d added the moving **"sun" glow** (`.fc-sun`, heliostat-driven, traverses low→high→low + east→west, op 0.10–0.22). **Unconfirmed he's happy** — likely the next thing he pushes. Lever: `heliostat.js` sun `warmth * 0.22` (raise for more), and the `.fc-sun` radial size/position; the flat `.fc-tint` wash is still there but faint.
- **The breathing / idle-sigh** — he said "no veo el respirar" twice. v4b made the cardiac beat *recede* so the dot/spine SLOW into a deep breath after 8s idle (`--fc-dot-sigh` 0.22 scale / `--fc-spine-sigh`). **Requires staying perfectly still 8s** (cursor included) — a real discoverability problem he keeps hitting. Unconfirmed. Levers: the 8s threshold (`idle-sigh.js`), the sigh amplitudes, or a more findable channel.
- **The moss / "visited"** — "no veo el musgo, nada verde." v4d added a clear **4px `--moss-deep` left band** + stronger creep. Unconfirmed he finds it clear enough.
- **Motes** — wanted gold + glowing; v4 made them saturated gold (kept `multiply`; `screen` is invisible on near-white — don't "fix" that way). He didn't re-complain but may.
- **Pulse wave** — was "too fast"; slowed 600→1300ms (v4b). Unconfirmed.

### 8.2 Shipped so far (deployed to main; harness 22/22, budgets met)
Commits: `aca2e48` (v4d) ← `e8f82f4` (seams) ← `8d14f27` (v4c) ← `7109b6c` (v4b) ← `671861d` (v4). See `CONCEPT.md` for the three-layer law.
- **v4 perceptibility:** warm afternoon/evening tint; gold motes; ocean ripple crests as a ring + energy→width/dur/wake; spine bend contained; kintsugi gold off the red crack; `og-image` (`scripts/make-og.mjs`). Fase-6 independently audited clean.
- **v4b:** ripple slowed; idle-sigh via beat-recede; motes on every page; **`?fc-hour=` dev day-scrubber**.
- **v4c redesign:** tighter rhythm + unified `--lane-max:72ch` lane; card paper-tooth grain (`.wn-card::before`); creep-only patina (badge removed); scroll-drawn **seams**. *(Removed in v4d: the ocean work-drift — he said it "broke the steadiness/the soul.")*
- **v4d:** removed work-drift; **clear green visited band**; **hero ALIGNED** (it sat ~115px right of every section — `.stage` zeros padding-left but `.hero__inner` kept it; now hero = 259px = sections @1440); **breath line one centered line**; **proof-grid cells get left padding**; **"sun" glow** for a visible day-cycle.

### 8.3 His call / tunables (he may ask for these)
- **Sun intensity** (too much / too little) — one number in `heliostat.js`. **Tint warm vs cool** — ANCHORS warmth 16/18h.
- **Work grid** is 2-col at `--lane-max:72ch` — bump toward 80–84ch for wider cards.
- **Breath line** is centered within the lane — he may want it centered on the full page instead.

### 8.4 Deferred / candidates
Slim unused `public/motifs/*` SVGs; populate empty `public/references/`; og:image is root-relative (make absolute if a custom domain is set); flagged inverted-fog veil prototype (he was curious); project `identity__route` as inline SVG.

### 8.5 Tools, artifacts & lessons
- **Verify scripts:** `scripts/baseline-shots.mjs` (36 labelled shots), `scripts/audit-probe.mjs` (hard numbers + crops), `scripts/verify-v4b.mjs`/`verify-v4c.mjs`, `scripts/make-og.mjs`. Outputs under `screenshots/` (gitignored).
- **`?fc-hour=<0–24>`** previews any hour's light instantly (ephemeral, dev). `?wn=aged|return|amp|fresh|clear` for visit state.
- **LESSON:** parallel WRITE agents/workflows MUST use `isolation:'worktree'` — a redesign workflow without it raced on the shared tree (recovered by re-applying the returned edit-specs deterministically). Read-only audit agents are safe to parallelize freely.

## 9. Recent commits (main, newest first)
`aca2e48` v4d (hero align, clear green visited, "sun" glow, remove work-drift) · `e8f82f4` seams · `8d14f27` v4c redesign (lane/rhythm, grain, drift, creep patina) · `7109b6c` v4b (slow pulse, perceptible breath, motes everywhere, ?fc-hour scrubber) · `671861d` v4 perceptibility (Fase-1 audit fixes) · `8f86842` HANDOFF · `02869e5` living-ocean v3.
