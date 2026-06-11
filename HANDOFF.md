# WHITE NOON — Portfolio · HANDOFF (V6)

> Read this, then `CONCEPT.md §7` (the V5 laws) and `src/field-conditions/config.js`
> (the INTENSITY registry + flags). Status: shipped to `main` through **V6.1** (`4cc0a2c`),
> Cloudflare Pages auto-deploys every push. Harness `npm run living` = **42/42 ALL GREEN**.
> The owner (Guillermo) iterates live and reports what he still doesn't see/understand —
> §A is the verify-with-owner + open queue. Reply to him in Spanish.

---

## 1 · What this is
- **Guillermo Hoyo Bravo**'s portfolio. Vite **vanilla-JS MPA** + a Node page generator. Design system **WHITE NOON**: warm-white field ≥90% of pixels, exactly **ONE red** (`--signal #E8341A`, ≤1.5% viewport, **binary** — full or absent; the boost never scales it: `RED_LOCKED`), Japanese *ma*, token-only color, GSAP-free-plugins + Lenis, WCAG AA, **zero npm deps beyond those**.
- Identity: `guillehoyob@gmail.com` · `github.com/guillehoyob`. Repo `github.com/guillehoyob/portfolio`, branch **main**. Deploy: **Cloudflare Pages** (Build `npm run build` · Output `dist`).
- **Edit** `src/pages/*.mjs`, `src/data/content.js`, `src/data/route-viz.mjs`, `src/layout.mjs`, `src/styles/*.css`, `src/field-conditions/*.js`, `functions/api/*.js`. The root `*.html` + `work/*.html` are **GENERATED** by `scripts/build-pages.mjs` (predev/prebuild) — never hand-edit, but DO commit them.
- **THE OWNER'S NORTH STAR (repeated, V6):** *"that nature molds the page — each weather/time/place generates a sensation — WITH a personal touch, BUT never at the cost of legibility. The white legible field is the soul of white noon."* So: effects must be **felt and tasteful**, never break the ≥90% white field, AA, or reading. When in doubt: **legibility wins**, then make the effect perceptible by other means (placement, motion, a defined band) rather than washing the page.

## 2 · Run / build / test / deploy
```
npm run dev                                  # localhost:5173
npm run build                                # regenerates html + dist (must pass before commit)
npm run cv                                   # regenerate public/cv.pdf from /cv (Playwright)
npx vite preview --port 4178 --strictPort    # then, another shell:
npm run living                               # the harness — 42 rows, must stay ALL GREEN
```
- **Harness** (`tests/living.spec.js` + `tests/visual-helpers.mjs`): drives every behavior, asserts the red budget (subtle & boost), perceptibility diffs, the one sanctioned third-party, AA, CLS, reduced-motion. Keep it green; update an assert when you change a behavior. Network failures of the optional open-meteo fetch are filtered out (not app errors).
- **Scrubbers (ephemeral, URL):** `?fc-hour=0..24` · `?fc-wx=clear|partly|overcast|fog|rain|rain-heavy|snow|storm|off` · `?fc-breath=0..1|cycle` · `?fc-rest=deep|asleep` · `?wn=boost|subtle|return|amp|aged|fresh|clear` · `?fc-sound=1`.
- **In-page controls (LOUD only):** the **FIELD: SUBTLE/LOUD** capsule (bottom-right), the **WX** chip (cycles weather), and the **PREVIEW** panel (TIME slider + hour readout, SUN=latitude AUTO/ARCTIC/TEMPERATE/TROPIC/EQUATOR, SPECIAL DAY toggle, and a live `location · weather · hour` readout).
- Windows: CRLF warnings are harmless. **NEVER edit files with PowerShell `-replace` (it mojibakes UTF-8) — use the Edit tool.** Commit trailer: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Push to main needs explicit user OK (auto-mode blocks default-branch pushes).

## 3 · Architecture
Living layer in `src/field-conditions/*.js`, each flag-gated in `config.js`; hub `index.js` (one shared rAF with real **dt** to every ticker; the bus `field` = {cursor, scroll, energy, breath, rest, wx, impulses}; the 4s heartbeat clock; `INTENSITY` registry → live binding `intensity` + `applyIntensity()` (the ONLY writer of `html.fc-boost`); `dtFactor`/`dtKeep`; `registerCleanup`). CSS split by plane (inlined in this order): `tokens` → `fonts` → `base` → `components` → `layout` → `field-conditions`(core) → `fc-sky`(W1) → `fc-ocean`(W2) → `fc-earth`(W3) → `fc-breath`(W4) → `fc-ui`(W0).
- **Events:** `fc:intensity`(window) · `wn:wx`, `fc:crest`, `fc:rest`, `fc:cite`(document) · `wn:route-redrawn`, `wn:wx-force`(document).
- **Chatbot:** `ask.js` (embedded editorial chat on home under the name; small dock on inner pages) → same-origin `/api/ask` → `functions/api/ask.js` → **Azure OpenAI**. The 4 env vars (`AZURE_OPENAI_ENDPOINT/API_KEY/DEPLOYMENT/API_VERSION`) live ONLY in Cloudflare (owner has set them). Hardened: scope-locked grounding (`src/data/knowledge.gen.mjs`, regenerated each build), refuses off-topic, max 320 tokens, per-IP rate-limit (mem + optional `ASK_KV`), Origin/content-type/body guards, key never in code/bundle/git. Interactive (non-deployed) explainer: `docs/security-guide.html`.
- Full design rationale: `screenshots/audit-v5/{AUDIT,RESEARCH,DESIGN,CONTRACTS}-V5.md` (gitignored — local only; read if present).

## 4 · The behaviors (where each lives)
heliostat.js (day/sun/moon, tint, shadows, `--fc-hour-hue`, `specialDay()`, `setHourOverride`/`setPlace`) · weather.js (Open-Meteo + synthetic, clouds/fog/snow-class/storm-flash+thunder+**looping red sprite**/shooting-stars/iris-retired) · spine.js (the red thread: baton-pass from the name route, knots, sashiko stitch, waypoint **stations**, `fc:cite` live-retrieval glow, scroll-driven draw to the contact email) · new-route.js (the name's living route) · breath.js (10.4s resonance, `--fc-breath`, crest, rest tiers) · heartbeat.js · particles.js (gold motes hugging the thread; snow regime) · ocean.js (click ripple; rain livens it) · warm-lens.js · reveals/scanline/threshold-cut/crack/first-breath/hero-entrance/slipstream/crosswind · patina.js (memory) · intensity-control.js (FIELD + WX + PREVIEW panel) · ask.js · magnet.js · hum.js (sound, flag OFF) · vt-morph.js. Assets: `src/data/route-viz.mjs` (per-project route SVGs + favicon/og via `scripts/make-cv-pdf.mjs`/`make-og.mjs`).

## A · VERIFY-WITH-OWNER + OPEN QUEUE
**First**, walk the owner (in LOUD, via the PREVIEW panel) through the V6.1 changes so he confirms what he can now see — these were his complaints and are SHIPPED but need his eye:
- **Chat** — the invitation now speaks in the Cormorant breath voice over a borderless editorial input (no boxed widget). Ask him if it's finally beautiful; if not, redesign further (it's been his #1 complaint 4×). Files: `ask.js` + `fc-ui.css` (`.wn-chat--embed`/`--dock`).
- **Sun** — now small + faint (`fc-sky.css .fc-sun`, radius ×0.8/0.55, cap 0.20/0.28). Confirm it no longer degrades white-noon.
- **Special days** — PREVIEW panel → DAY selector (NONE/EQUINOX/SOLSTICE/NEW YEAR/FULL MOON); each sweeps a distinct iridescent palette on the headings. Confirm each looks good.
- **Place/latitude** — PREVIEW → SUN row (AUTO/ARCTIC/TEMPERATE/TROPIC/EQUATOR) rides the sun height only (no faked weather). Confirm he now notices it.
- **Location/weather readout** — the bottom line of the PREVIEW panel (`location · weather · hour`). Confirm he finds + understands it.

**Still open / likely next (he flagged these):**
1. **NIGHT at the HERO stays bright.** V6.1 deepened the night sky (blue top band, max-cap alpha) + a defined brighter moon, but the HERO block is bright by design, so "night" reads best on scroll / inner pages, not the hero. The owner may want the **hero itself to darken at night** — that is a DELIBERATE trade-off against the ≥90%-white/legibility law he ALSO insists on. Discuss before doing; if yes, it's a hero-specific night treatment (`.hero__sky` + a night body bias), kept AA on the text. Lever: `layout.css .hero__sky`, `heliostat.js` night branch.
2. **clear/partly/overcast** differentiation — check if still too subtle for him; if so push cloud density / overcast grey further (`fc-sky.css`, `weather.js`).
3. **The comet** (alongside the shooting stars) — approved, not yet built (`weather.js` night-clear gate, like `spawnStar`).

**Also queued (approved, not built):** RAG architecture diagram on the project pages (card-viz idiom); refine **live-retrieval** (thread→cited section) for cross-page citations; lower the thread's start a touch. **Rejected (do NOT re-propose):** lateral scroll-jacking carousel (breaks the scroll-drawn spine), rain-as-drops, persistent fog veil, a faster heartbeat, gold on the spine.

## 5 · Laws (CONCEPT §7 is the source) — the hard invariants
ONE red ≤1.5% binary (`RED_LOCKED`, boost never scales it) · field ≥90% warm-white **and legible** (the owner's re-emphasis: weather tints the world but must NOT compromise reading) · AA · CLS≈0 · JS budget OK · reduced-motion honest · zero new npm deps · open-meteo is the ONLY sanctioned third-party · everything flag-reversible (flag off ⇒ byte-identical Stage-0).

## 6 · Lessons
- Land changes in small commits; build + `npm run living` green before every commit/push.
- A CSS rule in a later-inlined plane sheet can override an earlier one — that's how the nav lost `sticky` (a stray `.nav{position:relative}` in fc-sky.css). Watch cascade order.
- Don't over-cool/over-tint: the owner will reject anything that hurts legibility. Tune to a *hush*.
- Parallel writers (if used) MUST be in isolated worktrees with disjoint files; workflows resume from cache after session limits (`resumeFromRunId`). Only spawn workflows when the owner opts into ultracode.

## 7 · Recent commits (newest first)
`4cc0a2c` V6.1 (small sun · deep-blue legible night + defined moon · special-day DAY selector w/ distinct palettes · Cormorant chat voice) · `6b99bb4` V6 (hero re-flow, editorial chat, nav-sticky fix, legible snow, calm stitch, honest preview) · `2b6c5ac` V5.9 (nav horizon, shooting stars, clear/partly/overcast, live-retrieval) · `8c54cc1` V5.8 (stitch ties at contact, snow cools, rain somber, place→sun) · `a6a64fb` V5.7 · `030030f` V5.6 (editorial light chat + real CV PDF) · `7c7bbd6` V5.3.1 · `f46d873` V5.3 (chat dock + Azure hardening) · … V5/V4 below.
