# WHITE NOON — Portfolio Living Layer · HANDOFF (V5)

> Hand-off for a fresh session. Read this first, then `CONCEPT.md` (§7 = las leyes V5),
> `src/field-conditions/config.js` (INTENSITY) and `src/field-conditions/index.js`.
> Status: **V5 completa en local (40/40 harness ALL GREEN)** — auditoría → research →
> panel de diseño → 4 writers paralelos → integración. Los specs completos viven en
> `screenshots/audit-v5/{AUDIT,RESEARCH,DESIGN,CONTRACTS}-V5.md` (gitignored — solo local).

---

## 1. What this is
- **Guillermo Hoyo Bravo**'s portfolio. Vite **vanilla-JS MPA** + Node page generator. Design system **WHITE NOON**: warm-white field ≥90%, exactly **ONE red** (`--signal`, ≤1.5% viewport, **BINARIO** — saturación plena o ausente, ley CONCEPT §7.5), Japanese *ma*, token-only color, GSAP free + Lenis, WCAG AA.
- Identity: Guillermo Hoyo Bravo · `guillehoyob@gmail.com` · `github.com/guillehoyob`. (El email del operador `juan@zelebrix.com` es OTRA persona — no exponer.)
- Repo `github.com/guillehoyob/portfolio`, branch **main**. Deploy: **Cloudflare Pages** (Build `npm run build` · Output `dist`). Push a main = deploy.
- **Edit** `src/pages/*.mjs`, `src/data/content.js`, `src/data/route-viz.mjs`, `src/layout.mjs`, `src/styles/*.css`, `src/field-conditions/*.js`. Los `*.html` raíz son **GENERADOS** (`scripts/build-pages.mjs` en predev/prebuild) — jamás editarlos a mano, sí commitearlos.
- **Todo `[PLACEHOLDER]` sigue visible** (dispositivo de honestidad). V5: en las filas identity va en **voz baja** (`.ph-quiet` "pendiente" + chip íntegro en title y en el cuerpo) — jerarquizado, nunca oculto.

## 2. Run / build / test
```
npm run dev                                # http://localhost:5173
npm run build                              # regenera html + dist (debe pasar antes de commit)
npx vite preview --port 4178 --strictPort  # y en otra shell:
npm run living                             # el harness (tests/living.spec.js) — 40 filas
```
- **`npm run living` es la fuente de verdad: 40/40 PASS**, 0 errores de consola en 9 rutas, matriz 1440/1024/768/390, tabla reduced-motion. Incluye: presupuesto del rojo MEDIDO en subtle Y boost (≤1.5%, Δ≤0.05pp), **perceptibilidad del boost como assert** (diff ≥Δ16 + ≥0.8% px), la única third-party medida (≤1 GET, solo api.open-meteo.com), cuota del sprite, respiración, reposo, touch, seams, 404, assets por proyecto. `tests/visual-helpers.mjs` (committeado) trae el differ y el clasificador de rojo.
- **Scrubbers** (efímeros, por URL): `?fc-hour=0..24` (la luz de cualquier hora) · `?fc-wx=clear|partly|overcast|fog|rain|rain-heavy|snow|storm|off` (clima sin red) · `?fc-breath=0..1|cycle` (congela/encadena la respiración) · `?fc-rest=deep|asleep` (tiers de reposo) · `?wn=boost|subtle` (INTENSITY, efímero) · `?wn=return|amp|aged|fresh|<n>|clear` (memoria; `clear` también borra `wn.intensity`). QA combinada: p.ej. `/?fc-hour=16&fc-wx=storm&wn=boost`.
- Reduced motion = estado estático digno; el botón FIELD sigue operativo (es UI de estado).
- CRLF warnings en Windows = inofensivos. Trailer de commits: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## 3. Architecture — the living ocean (V5)
Todo en `src/field-conditions/`, flag-gated en `config.js`, hub `index.js` (un rAF compartido con **dt real** a cada ticker, bus `field` = {cursor, scroll, energy, breath, **rest**, **wx**, impulses}, governor, reloj cardiaco 4s persistido). **Novedades V5 del hub:** `INTENSITY` (registro central: presets `subtle`/`boost`, ~20 ejes; `applyIntensity()` único dueño de `html.fc-boost`; live binding `intensity`), `dtFactor`/`dtKeep` (física independiente del refresh), `registerCleanup` (teardown estándar), el rAF **duerme de verdad** en reposo (harness lo asierta: 0 mutaciones).

**CSS por planos** (propiedad disjunta, inlined en orden): `field-conditions.css` (core W0) → `fc-sky.css` (W1) → `fc-ocean.css` (W2) → `fc-earth.css` (W3) → `fc-breath.css` (W4) → `fc-ui.css` (W0).

**Eventos** (protocolo único): `fc:intensity` (window, emite applyIntensity) · `wn:wx`, `fc:crest`, `fc:rest` (document) · `wn:route-redrawn` (window). **Storage:** `wn.intensity`, `wn.visited/visits/visitor`, `wn.beatAnchor`, `wn.routeStep`, `wn.wx`, `wn.sunTimes`, `wn.firstBreathDone`, `wn.sprite`.

## 4. The behaviors (file → what + see it)
| File | What | See it |
|---|---|---|
| `heliostat.js` | **Heliostat 2.0**: gradiente cenit→horizonte por anclas (12 filas × 8 canales, DATA sancionada §7.7), canal de sol propio (op por ancla, tamaño horario), **noche bella** (luna washi recorriendo lo alto + campo cálido jamás gris), **sombras heliostáticas** (cambian de lado al mediodía), `--hairline-lit`, reloj warpeado al sol REAL del visitante (wn.sunTimes) | `?fc-hour=7.5 / 13 / 18 / 2`; sombras de cards 9h vs 18h |
| `weather.js` | **El clima real**: UN GET a Open-Meteo (sin key, cache 30min, tabla tz embebida — sin permisos) con Capa 0 sintética determinista de respaldo; estados → `data-wx` + `field.wx`; nubes con deriva, **lluvia caligráfica** en gutters, nieve (motas en régimen frío), tormenta (flash del void + trueno como impulso + **RED SPRITE 1/sesión**), niebla por sustracción, **iridiscencia** diurna | `?fc-wx=rain / storm / snow / fog`; sprite: `?fc-wx=storm&wn=boost` (~8s) |
| `breath.js` | **Respiración 2.0**: ciclo de resonancia 10.4s con holds de *ma*, primera respiración anticipada al cargar (~0.9s), re-arma a 1.5s de quietud de scroll, `fc:crest` (transitorio anti change-blindness), tiers de reposo 30s/60s (la lámpara queda encendida), despertar <100ms | quédate quieto tras un scroll; mira sol+dot+hilo respirar JUNTOS |
| `spine.js` | **El hilo rojo del destino**: nace DE la ruta del nombre (baton-pass real con codo), **nudos de meñique** (origen atado; el del destino se aprieta sobre el email al llegar), **puntada sashiko** deslizante (el siguiente waypoint), presencia desde el primer viewport (min-draw en px reales), bend al cursor (fine) o al último tap (touch), respira con ANCHURA en la cresta (§7.6) | recarga y mira el arranque; scrollea hasta el contacto |
| `new-route.js` | **La ruta del nombre VIVA**: curvatura hacia el cursor + **redibujo del pool en click** sobre el hero (wn.routeStep), boost fuerza un redibujo | click en el espacio del hero |
| `particles.js` | Motas doradas sitewide + **touch** (sin gate pointer-fine, 10 en móvil, surge al tap), suelo 0.18, nieve/niebla/viento/reposo acoplados vía field.wx | mueve el cursor por el gutter; `?fc-wx=snow` |
| `ocean.js` | Ripple de click perceptible (0.45 base) + **la lluvia aviva el mar** (anillo extra + cresta +0.08) | click en vacío; `?fc-wx=rain` |
| `patina.js` | Memoria + **demo-moss en boost** (2 cards efímeras si no hay memoria real) | `?wn=aged` /work; boost en /work |
| `intensity-control.js` | **El botón FIELD: SUBTLE/LOUD** (cápsula inferior-dcha, disco de oro que se llena de sol; persiste; jamás rojo). Retiro: `flags.intensityControl:false` | clícalo: helio-snap + suspiro inmediato + demo-moss |
| `vt-morph.js` | morph card→H1 con View Transitions (Chrome) | click en una card de /work |
| resto | heartbeat (recede 0.7 en cresta + glint), warm-lens (dual: hover / tap transitorio), reveals/scanline/threshold-cut/crack/first-breath/hero-entrance/slipstream/crosswind como v4 + dt + intensity | — |

**Assets V5 (`src/data/route-viz.mjs`):** viz de ruta ÚNICA por proyecto en las cards (gramática de material: tinta=recorrido, oro=entregado, hairline discontinua=futuro, rojo SOLO la cabeza en hover de las in-progress) + `identity__route` única por ficha (con `data-head-y` que el spine lee) + favicon void-aware + og-image nueva. La **404**: ruta deshilachada (el único rojo) + banda void mini sin crack con marco byōbu.

## 4b. V5.1/V5.2 — feedback del dueño + tendencias + ASK THE FIELD
- **ASK THE FIELD** (`ask.js` + `functions/api/ask.js` + `src/data/knowledge.gen.mjs` generado en build): asistente *grounded* — botón bajo los CTAs del hero ("Ask this portfolio anything") → panel `<dialog>` estilo void (negro/washi/marco oro, hilo rojo que dibuja mientras piensa) → POST same-origin a `/api/ask` (Cloudflare Pages Function → **Azure OpenAI**, key server-side) → respuesta + **fuentes citadas como links del propio sitio** ("WHERE TO LOOK"). Sin configurar → fallback honesto con el email. **Variables (Cloudflare Pages → Settings → Variables):** `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, opcional `AZURE_OPENAI_API_VERSION` (default 2024-10-21).
- **Fixes del feedback en vivo:** baton-pass REAL (el hilo nace del extremo visible de la ruta del nombre, cabeza soldada durante el bend — pin 200px); fichas de proyecto: el hilo era invisible por un `NaN` (offsetHeight sobre `<svg>`) — arreglado; nib re-asentado sobre el hilo doblado; nudos más callados (r3.5/op0.72); puntada solo en waypoints VISIBLES; warm-lens = charco de luz `::after` (el box-shadow recortaba un rectángulo duro desalineado); void con `margin-block` 48px sitewide; badges del identity con aire; respiración: filtro de jitter 14px, gate pointer 2.6s, sol +0.14/cap boost 0.52, **F1: la inhalación ≥0.6 PAGA su cresta al cancelarse** (el glint cae sobre tu gesto — antes 6-7 ciclos/min morían mudos), **el glifo del botón FIELD respira y destella en cada cresta** (tu ancla: mira el botón); la onda del click **toca el mundo** (empuja y enciende motas a su paso, tira del hilo ≤13px en desktop).
- **QA sin URLs:** en LOUD aparece el chip **WX: AUTO→CLEAR→…→FOG** sobre el botón FIELD (fuerza estados de clima in-page, efímero).
- **Tendencias 2025-26 integradas (BREAK-1..9):** Speculation Rules (navegación con prerender al hover + guards `document.prerendering` — el living layer y el GET de clima esperan a la llegada real); permanencia de objeto (la viz de ruta VUELA de la card a la ficha) + dive direccional (volver = emerger); **Space Grotesk VARIABLE** (22.7KB, menos que las 2 estáticas: el H1 exhala peso 700→686 con la respiración; los títulos de card relajan tinta al hover); pull-quote con line-mask SplitText; CTA magnético ≤4px con muelle `linear()`; nav que enciende su hairline al pegarse (`scroll-state(stuck)`); ScrambleText decode en la voz mono (**solo boost** hasta tu veredicto); micro-sonido sintetizado (**flag OFF**; audición: `?fc-sound=1`); placeholders "pendiente" con **popover nativo** (el chip íntegro por fin accesible en touch/teclado).

## 5. Leyes y presupuestos (V5 — la fuente es CONCEPT.md §7)
Campo ≥90% · **rojo ≤1.5% y BINARIO** (RED_LOCKED: el boost jamás lo multiplica; medido en harness) · tinte ≤6.5% (clamp 8 en boost) · AA · CLS≈0 · JS ~65KB gz (<90) · **una sola third-party sancionada** (api.open-meteo.com, atribuida en el colofón; `flags.weather:false` → cero red) · reduced-motion honesto · cero deps npm nuevas · banda 600ms–4s con las excepciones escritas (§7.3) · cupo de oro estático (1 traza/viewport) · jerarquía de entrada del void (§7.14).

## 6. The owner (Guillermo) — cómo trabajar con él
- Quiere **claramente perceptible aunque sutil** (la era "felt-not-seen" terminó — pero jamás garish). Ama: φ/Fibonacci, consistencia, metáforas de naturaleza (océano/cielo/tierra, wabi-sabi/kintsugi, el hilo rojo del destino), Mirror's Edge, Edgerunners, el VOID.
- **Método**: ship → él revisa EN VIVO → reporta "no veo X" → reproducir con scrubbers + probe + diffs, jamás a ojo. El botón FIELD/LOUD existe para que él calibre.
- **Rechazado (no re-proponer):** títulos rojos de sección; latido más rápido; oro en el spine/nudos; niebla persistente que ensucie la lectura; `screen`/additive sobre blanco.

## 7. CALIBRACIÓN PENDIENTE CON EL DUEÑO (los gates humanos de CONTRACTS §c.5.4)
Todo está implementado y verde; estos puntos esperan su VEREDICTO en vivo (cada uno con su palanca de 1 número):
1. **La noche** `?fc-hour=2` (luna + campo cálido) — el mayor cambio del cielo.
2. **Sombras de card en reposo** (art-direction nueva de SKY-4; retirada = solo-hover).
3. **El red sprite** `?fc-wx=storm&wn=boost` (~8s) — cuota 1/sesión en real.
4. **Iridiscencia** `?fc-hour=13&wn=boost` (con `?fc-wx=clear`).
5. **fogVeils** (`weather.fogVeils:false` — velos de niebla completos, OFF hasta su OK).
6. **El pliego de las 5 geometrías** de rutas por proyecto (interpretación de W3 — enseñar capturas).
7. **El morph** card→ficha en Chrome en vivo.
8. **El encadenado de la respiración** en reposo + la dosis del glint (si lee "notificación": keyframe 0.85→0.7).
9. Lluvia más visible: `fc-sky.css` op .30→.40 (1 línea) si la quiere más presente.

## 8. Lessons (orquestación)
- Writers paralelos SIEMPRE en worktrees aislados con ficheros 100% disjuntos + lista CERRADA de cross-diffs; el hub/config/tokens/tests son solo del integrador. `.claude/worktrees/` está en .gitignore (un `git add -A` se los tragó una vez).
- El split de `field-conditions.css` por planos fue lo que hizo posible 4 writers sin colisiones.
- Sesiones largas chocan con límites: los workflows se RESUMEN con caché (`resumeFromRunId`) — no relanzar de cero.
- Los `*.html` generados: regenerar y commitear SOLO desde el merge final (los writers los restauran a su base).

## 9. Commits V5 (main, newest first)
`4cb4663` integración W0 (cross-diffs + harness 40) · `8a5954a` W3 tierra/páginas · `d124f0f` W2 hilo rojo · `906df2a` W4 respiración/touch · `65dd1a4` W1 cielo/clima · `4e37e21`+`5a74b0c` leyes V5 + higiene · `33e2ca6` Fase 0 (INTENSITY+split+harness 29) · `11c4b45` motor (dt + rAF-sleep) · `2500b5c` 16 quick-wins medidos · `0698008` (v4d, la base).
