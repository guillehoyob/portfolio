# WHITE NOON — Guillermo Hoyo Bravo · portfolio

A personal portfolio for **Guillermo Hoyo Bravo, GenAI engineer**, built to the WHITE NOON
design system: a vast warm-white field, one decisive red line, every other influence a
scarce disciplined trace. Vite vanilla **multi-page** app, self-hosted fonts, an optional
**Field Conditions** living layer — 100% free stack, no paid dependency anywhere.

- **Design** → Claude Design (the WHITE NOON spec & static mock)
- **Build** → Vite vanilla JS + GSAP + Lenis, this repo
- **Host** → Cloudflare Pages (free), push-to-deploy

## Stack
Vite (MPA) · GSAP + ScrollTrigger-free draw · Lenis smooth scroll · SIL-OFL fonts
(self-hosted, subset to woff2) · CSS custom-property token contract · `localStorage` only,
zero third-party calls by default.

## Run it
```bash
npm install
npm run dev       # http://localhost:5173  (regenerates pages first)
npm run build     # → dist/   (regenerates pages, then vite build)
npm run preview   # serve the production build
npm run fonts     # re-subset the woff2 faces from src/fonts-src (rarely needed)
```
> Pages are **generated** from `src/pages/*.mjs` + `src/layout.mjs` by
> `scripts/build-pages.mjs` (auto-run by `predev`/`prebuild`). Edit the page modules
> and the layout helpers — **not** the generated `*.html` at the repo root.

## How it’s put together
```
index.html · method.html · cv.html · 404.html · work/*.html   ← generated, committed
src/
  layout.mjs            shared head (inline critical CSS) + nav/footer + component helpers
  pages/*.mjs           per-page <main> content (home, work, method, personal)
  data/content.js       ALL copy (from portfolio-kit/content); every [PLACEHOLDER] preserved
  styles/               tokens · fonts · base · components · layout · field-conditions
  fonts-src/ , scripts/subset-fonts.mjs    TTF → 7 subset woff2 (public/fonts)
  main.js               Stage-0 interaction (nav, mobile menu, filter, copy, print)
  field-conditions/     the Living System — one module + one flag per behavior
public/  fonts · motifs (CC0 SVG) · favicon.svg · _headers
```
The whole stylesheet is **inlined into every page `<head>`** (no render-blocking external
CSS — design-system §6.4), so each page paints immediately and is complete with JS off.

## The Field Conditions living layer
Every ambient behavior is gated by one flag in **`src/field-conditions/config.js`**. Turning
any flag `false` reproduces the static Stage-0 page exactly; each hook is independently
deletable. All eleven behaviors carry a `prefers-reduced-motion` fallback and a static
honest state.

| Behavior | Flag | What it does |
|---|---|---|
| Forward-landing reveals | `reveals` | content rises/fades in on scroll (fail-safe at 6s) |
| Vault Blur | `vaultBlur` | cross-document View-Transition page blur |
| Heartbeat | `heartbeat` | 6s pulse on the hero status dot; label from `statusLabel` |
| First Breath | `firstBreath` | scroll-cue chevron pulses once after 2s idle |
| Scanline | `scanline` | footer pulse line drifts once/60s |
| New Route | `newRoute` | the hero red line varies per visit/day; draws in 900ms |
| Threshold Cut + Crack | `thresholdCut`, `crack` | the void band detonates, then the crack draws |
| Heliostat | `heliostat` | time-of-day field tint (dawn/noon/evening/night) |
| Slipstream | `slipstream` | scroll velocity brightens the haze, widens the live heading |
| Crosswind | `crosswind` | a cursor haze + a warming multiply spot (pointer only) |
| Patina | `patina` | returning-visitor ticks, greeting swap, weather amplification |

**Heartbeat status** is the self-set string `statusLabel: 'OPEN TO WORK'` — no network.
**`liveGitHub` is off by default** (zero external calls); only enable it if you push
publicly and frequently, or “last push: 3 weeks ago” reads as abandoned.

## Before you launch — fill the honest gaps
The copy ships with visible `[PLACEHOLDER — Guillermo to confirm …]` chips wherever a date,
metric, or URL isn’t confirmed (this is the brand’s honesty device, not a bug). Search
`src/data/content.js` for `PLACEHOLDER` and replace as you confirm them — dates, the few
metrics (Gestamp/IDEA/Zelebrix), planned-project quarters/targets, and the live URL on the
“This Portfolio” entry. Launching with them is permitted; **never invent numbers.**

## Your downloadable CV
Open the built `/cv` (or `cv.html`) → **Ctrl/Cmd-P → Save as PDF** → save as
`public/cv.pdf`, then re-deploy. (The “Download CV (PDF)” links currently point to `/cv`,
the print-ready page; swap them to `/cv.pdf` once the PDF exists if you prefer a direct file.)

## Deploy free to Cloudflare Pages
See the step list in the project hand-off; in short:
```bash
git init && git add -A && git commit -m "WHITE NOON portfolio"
gh repo create <name> --public --source=. --push      # needs `gh auth login` once
```
Then in the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
pick the repo → **Framework preset: none · Build command: `npm run build` · Output
directory: `dist`** → Save and Deploy. Clean URLs (`/work/rag-zelebrix`) and the `404.html`
are served automatically; `public/_headers` sets caching. Every push redeploys; each gets a
free preview URL.

---
Designed with Claude Design, built with Claude Code, on a free static stack.
Fonts SIL OFL 1.1 (self-hosted); motif SVGs CC0. WCAG 2.1 AA throughout.
