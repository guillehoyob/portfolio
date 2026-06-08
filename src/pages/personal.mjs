/* /work/personal — Personal Lab hub: This-Portfolio full entry + META void band + Next-up planned cards (§4.4) */
import content from '../data/content.js';
import { collabVoid, plannedCard, statusBadge, esc as e, ph as p } from '../layout.mjs';

const { thisPortfolio: tp, planned, identity } = content;

const monolist = (items) => `<ul class="monolist">${items.map((i) => `<li>${p(i)}</li>`).join('')}</ul>`;
const artifacts = (items) =>
  `<ul class="artifacts">${items
    .map((a) => `<li><span class="artifacts__label">${e(a.label)}${a.note ? ` — ${p(a.note)}` : ''}</span> <span class="artifacts__access">${e(a.access)}</span></li>`)
    .join('')}</ul>`;
const stackTable = `<table class="stacktable"><tbody>${tp.stackTable.map(([layer, tech]) => `<tr><td>${e(layer)}</td><td>${e(tech)}</td></tr>`).join('')}</tbody></table>`;

export const meta = {
  title: `Personal Lab — ${identity.name}`,
  description: 'The Personal Lab hub: this portfolio as exhibit A of the method, plus the three planned personal projects — a roadmap, not vaporware.',
  active: 'Work',
};

export const main = `<div class="shell stage"><div class="lane">
  <section class="identity" id="this-portfolio">
    <p class="eyebrow">Personal Lab</p>
    <h1 class="identity__title">${e(tp.title)}</h1>
    <p class="identity__tagline">${e(tp.tagline)}</p>
    <div class="identity__badges">
      ${statusBadge(tp.status, tp.statusLabel)}
      <span class="metalabel">LAST UPDATED: ${p(tp.updated)}</span>
      <span class="metalabel">ROLE: ${e(tp.role)}</span>
    </div>
  </section>
  <div class="projbody">
    <p class="prose prose--ghost">${e(tp.clientContext)}</p>
    <h3>Problem</h3>
    <p>${e(tp.problem)}</p>
    <p>The site you’re reading is project #1: a complete, internally consistent design system (WHITE NOON), built component by component against a token contract, every section rendering fully with all living behaviour switched off.</p>
    <h3>Constraints</h3>
    ${monolist(tp.constraints)}
    <h3>Approach</h3>
    ${tp.approachHtml}
  </div>
</div></div>

${collabVoid(tp)}

<div class="shell stage"><div class="lane">
  <div class="projbody">
    <h3>Stack &amp; Architecture</h3>
    ${stackTable}
    <p style="margin-top:var(--space-6)">${e(tp.architecture)}</p>
    <h3>Outcome</h3>
    ${monolist(tp.outcome)}
    <h3>Lessons</h3>
    ${monolist(tp.lessons)}
    <h3>Artifacts</h3>
    ${artifacts(tp.artifacts)}
    <h3>Next</h3>
    ${monolist(tp.next)}
  </div>

  <section class="section nextup">
    <div class="nextup__head">
      <span class="metalabel">Next up</span>
      <hr class="wn-hairline" style="flex:1">
    </div>
    <div class="planned-stack">
      ${planned.map((pl) => plannedCard(pl, { static: true })).join('\n      ')}
    </div>
  </section>
</div></div>`;
