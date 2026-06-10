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
- **Coupling (V5)** — the breath engine (`breath.js`, BRE-1) replaces the old idle-sigh: a **10.4s resonance cycle** (inhale 3.6s · crest-hold 1s · release · valley — the holds ARE the ma) published as `field.breath` + `--fc-breath`. Channels WITH AREA breathe with it (sun swell, spine width/op crest, dot+halo), an anticipated **first breath** on load teaches the mechanic, and `fc:crest` gives the transient that beats change-blindness. The old `--fc-dot-sigh`/haze-sigh channels are retired. *(Historical note kept honest: the v4 sigh DID also push haze 0.05→0.11 — the doc used to claim otherwise.)*

Constants: `HEARTBEAT_MS 4000` · breath cycle `10400` (BREATH_PARAMS) · idle by channel (scroll 1.5s / pointer 3.5s) · energy decay `0.97`/frame dt-normalized · ambient floor `4s` · Zen ceiling `600ms` (forbidden band 600ms–4s, exceptions §7.3).

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

**Invariants:** harness ALL GREEN · CLS≈0 · JS<90KB gz · AA · field ≥90% · red ≤1.5% · reduced-motion honest · no new npm deps · all changes flag-reversible. *(Third-party: exactamente UNA sancionada — ver §7.4.)*

---

## 7 · LEYES V5 — excepciones sancionadas y leyes nuevas (CONTRACTS §f, vigentes)

> Estas derogan/extienden lo anterior donde choquen. El dueño aprobó la dirección "claramente
> perceptible aunque sutil": los presupuestos de *presencia* suben; los de *corrección* no se tocan.

1. **Cap del tinte:** "tints ≤5%" queda derogada → `--fc-tint-cap: 6.5%` en reposo; clamp duro 8% en boost.
2. **El sol excede el viejo cap:** canal propio por ancla, op 0.10–0.26 subtle / ≤0.40 boost / cap final CSS 0.46 (con respiración+rest). Sancionado por el dueño (HANDOFF §8.0).
3. **Banda prohibida 600ms–4s:** (a) la FÍSICA del field está exenta (decay de energía, relajación del tap 1.2–1.8s, lerp de nieve 3s) — es simulación, no animación UI; (b) las entradas de clima tienen SUELO 4s en reposo; cadencias <4s SOLO bajo `html.fc-boost` como demo/QA; (c) excepciones aprobadas y tokenizadas: `--dur-ripple:1300ms`, ocean 0.7–0.89s, hero 700ms, `--dur-route` 900ms.
4. **Open-Meteo = la única third-party:** un GET a `api.open-meteo.com` (allowlist en harness/probe), cache 30min, sin key, sin permiso de geolocalización (tabla tz embebida; Geocoding API PROHIBIDA), fallo → Capa 0 sintética. Atribución CC-BY en el colofón. `flags.weather:false` → cero red, byte-idéntico.
5. **Rojo BINARIO (la ley del encargo):** `--signal` a saturación plena o ausente — jamás fill translúcido. Única excepción: **bounce-light ≤6% alpha** (bleed del spine 4%/6% boost, halo del CTA 5%, halo del sprite 6%×120ms). El boost JAMÁS multiplica el rojo: `RED_LOCKED = [nib, spine, knot, stitch]`.
6. **Excepción transitoria del sigh del spine:** el canal breath multiplica op (+0.20→+0.28) y width (+1px→+1.4px) del trazo rojo SOLO durante la cresta (≤6s de un ciclo de 10.4s) bajo boost. Transitoria, no aumenta área en reposo; opt-out de 1 línea (quitar `* var(--fc-int-breath,1)` en fc-ocean.css); el harness mide el rojo con `?fc-breath=0`.
7. **Hex fuera de tokens.css:** las ANCHORS de heliostat (zen/hor por hora) y los pasteles del iris son DATA curada de fenómeno (como routes.json), documentada en el header de cada fichero.
8. **Cupo de oro estático:** máx UNA traza dorada estática por viewport blanco (el seam `--postvoid`). Ticks de hover y glint son TRANSITORIOS (legales); dentro del void el cupo no aplica (ahí se concentra la luz).
9. **Una traza animada por viewport blanco (cielo claro):** el iris ES esa traza en clear 10–16h; nunca coexiste con overcast/fog; arriba un solo protagonista (iris XOR luna XOR sprite).
10. **`::after` de `.wn-void` RESERVADO** al marco byōbu; el flash de tormenta usa `.fc-voidflash` (hijo dedicado); el grain del void sigue en `::before`.
11. **Frontera de sombras:** banda void = urushi (fc-earth); cards = heliostáticas (fc-sky). Nadie escribe la sombra del otro.
12. **Ley de estratos AMPLIADA (§5):** *el CLIMA es un estado del CIELO que los otros planos LEEN como leen energy — OCEAN sí (es agua: la lluvia aviva sus anillos), EARTH jamás (es memoria: la patina NO madura con el clima).* Igual con `rest`: la memoria no duerme ni despierta.
13. **Presupuesto de adornos del hilo:** nib + puntada + 2 nudos + respiración = LÍMITE. Nada más se cuelga del spine.
14. **Jerarquía de entrada del void:** negro (cut 70ms) → crack (280ms) → marco oro (+280ms/600ms) → polvo (7s, tiers). Consistente en TODAS las bandas; en la 404 el cut se retrasa 1.2s (la ruta deshilachada dibuja primero).

**El registro INTENSITY** (config.js) es la única fuente de amplitudes: subtle = identidad; boost = el modo de calibración del dueño (botón FIELD, `?wn=boost`, persistido en `wn.intensity`). El boost amplifica luz, aire y memoria — **jamás la sangre**.
