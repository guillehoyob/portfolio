# WHITE NOON — CONCEPT · the three living layers (間 / ma)

> The conceptual law for the "living ocean". Companion to `HANDOFF.md` (run/arch) and
> `src/field-conditions/`. Everything here serves **ma**: the calm, the pause, the emptiness
> that gives meaning. Movement is allowed only when it is slow, fluid, subtle, and **felt — not
> seen**. Nothing competes for attention; the goal is *Flow* and calm, never spectacle.
> Born of Fase 1 audit (verified by code + computed-style/pixel probe + screenshots).

---

## 0 · The single temporal language (one clock)

One epoch (`Date.now()`, persisted across pages when `continuity`) drives **everything that lives in time**:

- **Heartbeat** — a 4s cardiac cycle: lub + a φ-conjugate (0.618) dub + recoil + a diastolic breath. Calm, never an alarm (a faster beat was rejected). `--fc-dot-beat` / `--fc-spine-beat` are the SAME phase → dot and spine are provably one heart.
- **The field breath (sigh)** — after ~8s of stillness the field exhales ONCE (`field.breath` 0→1→0 over 6s), then rests, re-firing each calm. *This is ma made audible:* the reward for stillness.
- **Coupling (NEW)** — the sigh no longer pushes fog (the owner rejects persistent haze and +6% haze is sub-threshold anyway). Instead it gets its **own perceptible channel**: `--fc-dot-sigh` / `--fc-spine-sigh` make the dot **swell slowly and the spine breathe deeper** during the sigh — the whole organism visibly *rests with you*. Amplitude on the SLOW breath channel only (never a faster/louder beat).

Constants: `HEARTBEAT_MS 4000` · sigh `6000` · idle threshold `8000` · energy decay `0.97`/frame · ambient floor `4s` · Zen ceiling `600ms` (forbidden band 600ms–4s).

---

## 1 · Shared contracts (the source of truth — land before any parallel writing, §4)

### Strata / z (taxonomy AND paint order)
| z token | value | who |
|---|---|---|
| `--z-haze` | 1 | Heliostat tint (`.fc-tint`), Crosswind sky haze |
| `--z-route` | 2 | **The Red Spine** (over the void black, under text) |
| `--z-content` | 10 | all text/content; void content lifted to 3 locally |
| `--z-warm` | 20 | Crosswind warm spot, **motes (`.fc-sky`)**, warm-lens |
| `.fc-ocean` | 50 | click ripple (above content, pointer-none) |

**Reading law:** SKY reads `energy` only · OCEAN reads `energy`+`impulses` · EARTH reads **neither** (memory must not ripen on a fast scroll).

### Energy bus API (`field`, read-only for behaviors)
`{cursorX, cursorY, cursorVel, scrollVel, energy(0..1), breath(0..1), impulses[]}` ·
`addImpulse(x,y,force)` (click) · `feedScroll(v)` (Lenis) · `integrateEnergy()` decays `energy*=0.97`. Behaviors **read**; energy only scales an amplitude where a hard cap already clamps it.

### Colour + opacity tokens per layer (contrast vs what is BELOW)
| token | hex/derivation | role | cap |
|---|---|---|---|
| `--field-0` | `#F7F7F5` | the warm-white field (≥90%) | — |
| `--signal` | `#E8341A` | THE one red (spine, crack) | ≤1.5% viewport |
| `--sun` | `#FFC42E` | gold: dawn/evening tint, **motes**, "open to work" | tint ≤5% |
| `--sky` | `#A8C4D4` | cool haze, **ocean ring** | ≤8% opacity |
| `--moss` / `--moss-deep` | `#7A8C72` / `#5C6B55` | patina tick + visited border | graphic only |
| `--gold` / `--gold-deep` | from `--sun`+`--ink` | kintsugi seam (hue ~44°, never a 2nd red) | <0.1% viewport |

### Module interface (already satisfied — no rewrite)
Each behavior = one file, flag-gated in `config.js`, `initX()` registers a ticker via `addTicker`; hub (`index.js`) + `config.js` are integrator-only. Disjoint file ownership already holds.

---

## 2 · ☁️ CIELO / Aire-Viento

1. **Rol/metáfora.** The light of the actual hour and the breathing air — *"the room knows what time it is."* Safety, the gentle passage of the day.
2. **Elementos.** Heliostat day-tint · gold **motes** (dust catching light) · Crosswind (cursor halo) · Slipstream (scroll haze).
3. **Estrato.** `--z-haze` (tint/haze) and `--z-warm` (motes). Reads `energy` only.
4. **Look.** Tint ≤5% α, **warm through the afternoon** (warmth floor raised so 16–19h read golden, not cool-grey — the owner's chosen direction). Motes = saturated `--sun` gold on `multiply` (multiply of gold over white → a *warm gold speck*, AA-safe; **`screen`/additive was rejected — it is invisible on a near-white field**). ~16 motes, 3–7px, gutter-confined (AA by position).
5. **Movimiento.** Minute-by-minute tint, 4s crossfade · motes rise slowly + twinkle.
6. **Reacción.** Motes twinkle faster/brighter with cursor speed (`energy`) and proximity — *spores lifting in the cursor's "wind"*. Tint follows the clock.
7. **Vecindad.** Tint sits over everything (top-down mask); motes are the **Viento+Tierra liminal** (see §5).

## 3 · 🌊 OCÉANO / Agua

1. **Rol/metáfora.** The medium that answers your touch — a still noon sea. Shared presence, life that responds gently.
2. **Elementos.** Click ripple · the energy bus · **the Red Spine** (the ocean's blood thread reaching every page).
3. **Estrato.** Spine `--z-route`(2); ripple `.fc-ocean`(50). Reads `energy`+`impulses`.
4. **Look.** Ring = `--sky`, **crests as a RING at mid-expansion** (not as a 5px dot), effective α ≤0.22 · spine = faint `--signal` trace (opacity ~0.42), breathes with the heart.
5. **Movimiento.** Ripple <0.9s; **energy varies width+duration+a wake ring, NOT brightness** (the old "brighter when small / dimmer when energetic" inversion is removed).
6. **Reacción.** Click = ripple + impulse; cursor/scroll speed = energy. Spine bends toward the cursor — **contained** (X-only, ≤8px, gliding, never the old "flick").
7. **Vecindad.** Spine baton-passes from the hero/identity route. Ripple spray meets the air (**Viento+Agua** liminal, §5).

## 4 · 🌱 TIERRA

1. **Rol/metáfora.** Memory and sediment — what ripens slowly (wabi-sabi / kintsugi). The earned, the lived-in.
2. **Elementos.** Patina **moss** (visited cards) · **kintsugi** gold seam (the mended void crack) · grain/tooth · forward-land reveals.
3. **Estrato.** None of the energy bus — pure **state**, identical under reduced motion.
4. **Look.** Moss `#7A8C72` (border = primary at-a-glance cue, deepened to ~40%; tick = a softened **bloom**, not a hard dog-ear) · kintsugi `--gold` clearly **separated from the red crack** (a parallel gold thread, not fused) · reveals 24px/420ms (the reference for "subtle yet perceptible").
5. **Movimiento.** Static (memory must not ripen on a fast scroll). Reveals land forward as you arrive.
6. **Reacción.** Only to the **visit** (returning visitor) — never to cursor/scroll.
7. **Vecindad.** Moss lives on the **Agua+Tierra shore** (§5). *(Card grain/tooth = deferred art-direction note, flagged.)*

## 5 · Zonas liminales (defined with the same rigor)

- **Viento + Tierra — pollen/spores:** the **motes** rise from the gutter (earth) into the air and lift in the cursor's wind. They belong to *both*: born of the ground's dust, alive in the sky's light → live in SKY paint (`--z-warm`) but seed from the low gutter. Justified as a bridge, not a border.
- **Viento + Agua — spray/mist:** the Slipstream haze + the ripple's faint edge are the sea's breath meeting the air. Kept whisper-quiet (both already ma-correct).
- **Agua + Tierra — the shore / moss:** **moss** is the damp seam where the ocean's moisture settles on the earth's memory — that is *why* it is recovered as a liminal element (humidity over sediment), not as pure "earth". The visited border is the waterline; the tick is the lichen at the edge.
- **In two layers at once (explicit):** the **Red Spine** is OCEAN (blood/medium) yet draws its life from the heart (TEMPORAL) — it lives in two because it carries the pulse *through* the ocean. This differs from "on the border": the spine is fully in both at every point, not at a seam.

## 6 · Fase-3 change-set (surgical evolution — no rewrite)

| Layer | File(s) | Change |
|---|---|---|
| Cielo | `heliostat.js`, `field-conditions.css` | warm evening ANCHORS (16/18/19.5h warmth↑); mask floor 82%→92%; delete dead daypart `--fc-tint` rules |
| Cielo | `particles.js`, `field-conditions.css` | mote gradient → saturated `--sun`; keep `multiply`; COUNT 9→16 |
| Océano | `ocean.js`, `field-conditions.css` | keyframe opacity crest at mid-expansion; energy→width/duration/wake (not brightness); base op ~0.30; wake opMul 0.5→0.7 |
| Océano | `spine.js` | MAXPULL 14→8, gain 0.18→0.12, FALLOFF→340, squared Y-weight (glide, not flick) |
| Tierra | `components.css`, `field-conditions.css`, `patina.js` | visited border 32%→40%; softened moss bloom + thicker edge; kintsugi seam top 3px→5px / height 1.5px, return-tier visible |
| Temporal | `heartbeat.js`, `spine.js`, `idle-sigh.js`, `field-conditions.css` | dedicated `--fc-dot-sigh`/`--fc-spine-sigh` slow-breath channel (perceptible rest, no fog) |
| Assets | `public/og-image.png`, `layout.mjs` | 1200×630 social card + og/twitter meta |

**Invariants:** harness 22/22 · CLS≈0 · JS<90KB gz · zero third-party · AA · field ≥90% · red ≤1.5% · reduced-motion honest · no new deps · all changes flag-reversible.
