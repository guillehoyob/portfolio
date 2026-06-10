/* /method — thesis → principles → 5-row workflow → void(DISCIPLINE) → toolchain → breath (§4.5) */
import content from '../data/content.js';
import { principleBlock, voidBand, breathLine, esc as e } from '../layout.mjs';

const { method, breath, identity } = content;

const phasesRows = method.phases
  .map(
    (ph) => `<div class="phase">
      <h3 class="phase__name">${e(ph.name)}</h3>
      <p class="phase__text">${e(ph.g)}</p>
      <p class="phase__text">${e(ph.c)}</p>
      <p class="phase__exit"><b>EXIT ARTIFACT:</b> ${e(ph.exit)}</p>
    </div>`
  )
  .join('\n        ');

const breaksList = `<p style="margin-bottom:var(--space-8)">Where it breaks — and what I do about it:</p>
    <ul class="breaks">
      ${method.breaks.map(([b, fix]) => `<li><b>${e(b)}</b> ${e(fix)}</li>`).join('\n      ')}
    </ul>`;

export const meta = {
  title: `Method — ${identity.name}`,
  description: 'How I work with Claude: written specs, eval gates, commit-by-commit review, and harvested learnings. AI pair-engineering run as a discipline, not a shortcut.',
  active: 'Method',
};

export const main = `<div class="shell stage"><div class="lane">
  <section class="section section--tight">
    <p class="eyebrow">${e(method.eyebrow)}</p>
    <h1 class="h1-sub" style="max-width:20ch">${e(method.title)}</h1>
    <p class="prose" style="max-width:62ch">${e(method.thesis)}</p>
  </section>

  <section class="section section--tight">
    <p class="eyebrow">Principles</p>
    <div class="principles">
      ${method.principles.map((pr) => principleBlock(pr)).join('\n      ')}
    </div>
  </section>
</div></div>

<div class="shell"><div class="lane" style="max-width:100%">
  <section class="section wn-seam">
    <p class="eyebrow">The workflow</p>
    <div class="phases">
      <div class="phase" style="border-top:none">
        <span class="phase__name" aria-hidden="true" style="opacity:0">—</span>
        <span class="phase__who">Guillermo</span>
        <span class="phase__who">Claude</span>
      </div>
      ${phasesRows}
    </div>
  </section>
</div></div>

${voidBand({ word: 'DISCIPLINE', bodyHtml: breaksList })}

<div class="shell stage"><div class="lane">
  <section class="section wn-seam wn-seam--postvoid">
    <p class="eyebrow">Toolchain</p>
    <table class="toolchain"><tbody>
      ${method.toolchain.map(([tool, use]) => `<tr><td>${e(tool)}</td><td>${e(use)}</td></tr>`).join('\n      ')}
    </tbody></table>
  </section>

  <section class="section section--tight">
    <p class="eyebrow">Worked example</p>
    <p class="prose prose--ghost" style="max-width:62ch">${e(method.workedExample)}</p>
  </section>

  <section class="section section--tight">
    ${breathLine(breath.method)}
  </section>
</div></div>`;
