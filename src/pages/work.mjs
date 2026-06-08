/* /work index — intro + filters + grid + "Next up" planned row (no void band, §4.2) */
import content from '../data/content.js';
import { card, plannedCard, esc as e } from '../layout.mjs';

const { work, portfolioCard, planned, identity } = content;
const clients = work.filter((w) => w.slug !== 'personal');
const gridCards = [...clients, portfolioCard];

const filters = [
  ['all', 'All'], ['shipped', 'Shipped'], ['progress', 'In Progress'], ['planned', 'Planned'],
];

export const meta = {
  title: `Work — ${identity.name}`,
  description: 'Three production AI builds (Gestamp, IDEA, Zelebrix), the portfolio itself, and the planned personal projects — with honest placeholders where a metric is still pending.',
  active: 'Work',
};

export const main = `<div class="shell">
  <section class="section">
    <p class="eyebrow">Work</p>
    <h1 class="h2">Production AI systems, a documented method, and the pipeline behind them.</h1>
    <p class="prose prose--ghost" style="max-width:55ch">Three client builds and the site you’re reading. Where a metric or screenshot is still pending, it says so — nothing here is invented.</p>
    <div class="filters" role="group" aria-label="Filter work by status">
      ${filters.map(([k, label]) => `<button class="filter" type="button" data-filter="${k}" aria-pressed="${k === 'all'}">${e(label)}</button>`).join('\n      ')}
    </div>
  </section>

  <section class="section section--tight">
    <div class="workgrid workgrid--three" data-grid>
      ${gridCards.map((c) => card(c)).join('\n      ')}
    </div>
    <p class="filter-empty" data-empty hidden>Nothing shipped under that filter yet — the rest of the road is in Next up.</p>
  </section>

  <section class="section nextup">
    <div class="nextup__head">
      <span class="metalabel">Next up</span>
      <hr class="wn-hairline" style="flex:1">
    </div>
    <div class="workgrid workgrid--three">
      ${planned.map((p) => plannedCard(p)).join('\n      ')}
    </div>
  </section>
</div>`;
