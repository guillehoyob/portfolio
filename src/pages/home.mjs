/* Home — hero → breath → proof → work → method teaser → void(SHIPPED) → about → contact (§4.1) */
import content from '../data/content.js';
import {
  heroRoute, chevron, card, principleBlock, breathLine, voidBand, statusBadge,
  esc as e, ph as p,
} from '../layout.mjs';

const { hero, proof, work, methodTeaser, about, contact, homeVoid, identity, breath } = content;

const proofStrip = `<div class="proof">
${proof.map((s) => `  <div class="proof__cell"><span class="wn-proof__num">${e(s.num)}</span><span class="wn-proof__label">${e(s.label)}</span></div>`).join('\n')}
</div>`;

const contactBlock = `<div>
  <div class="contact__row">
    <a class="contact__email" href="mailto:${identity.email}">${e(identity.email)}</a>
    <button class="contact__copy" type="button" data-copy="${identity.email}" data-label="Copy" hidden>Copy</button>
  </div>
  <div class="contact__links">
    <a class="wn-signal-link" href="${identity.githubUrl}" rel="me">GitHub</a>
    <a class="wn-signal-link" href="${identity.linkedinUrl}" rel="me">LinkedIn</a>
    <a class="wn-btn wn-btn--quiet" href="/cv">Download CV (PDF)</a>
  </div>
  <div class="contact__avail">
    <span class="prose prose--ghost" style="margin:0;max-width:48ch">${e(contact.avail)}</span>
    ${statusBadge('open')}
  </div>
</div>`;

export const meta = {
  title: `${identity.name} — ${identity.role}`,
  description: 'GenAI engineer in Madrid. RAG and multi-agent systems in production at Gestamp and IDEA, plus a payments-SaaS feature at Zelebrix — all built with Claude, with a documented method.',
  active: '',
};

export const main = `<header class="hero" id="hero">
  <div class="hero__sky" aria-hidden="true"></div>
  <div class="hero__inner">
    <div class="hero__lane">
      <p class="hero__pre wn-status"><span class="wn-status__dot" aria-hidden="true"></span>${e(hero.pre)} · ${e(hero.status)}</p>
      <h1 class="hero__h1">
        <span class="hero__h1line">${e(hero.h1[0])}</span>
        ${heroRoute(0)}
        <span class="hero__h1line">${e(hero.h1[1])}</span>
      </h1>
      <p class="hero__sub">${e(hero.sub)}</p>
      <p class="hero__greet" data-greet><span class="greet-first">${e(hero.greet)}</span><span class="greet-return">${e(hero.greetReturn)}</span></p>
      <div class="hero__cta">
        <a class="wn-btn wn-btn--primary" href="/work"><span>${e(hero.ctaPrimary)}</span><span aria-hidden="true">→</span></a>
        <a class="wn-btn wn-btn--secondary" href="/method">${e(hero.ctaSecondary)}</a>
        <a class="wn-btn wn-btn--quiet" href="/cv">Download CV (PDF)</a>
      </div>
      <button class="ask-cta" type="button" data-ask hidden>
        <span class="ask-cta__dot" aria-hidden="true"></span><span class="ask-cta__ghost">Ask this portfolio anything</span><span class="ask-cta__arrow" aria-hidden="true">→</span>
      </button>
    </div>
  </div>
  ${chevron()}
</header>

<div class="shell stage"><div class="lane">
  <section class="section section--tight">
    ${breathLine(breath.home)}
  </section>

  <section class="section section--tight" id="proof">
    ${proofStrip}
  </section>

  <section class="section wn-seam" id="work">
    <p class="eyebrow">Selected work</p>
    <h2 class="h2">Shipped, in production, and honest about what’s next.</h2>
    <div class="workgrid">
      ${work.map((w) => card(w)).join('\n      ')}
    </div>
  </section>

  <section class="section wn-seam" id="method">
    <p class="eyebrow">${e(methodTeaser.title)}</p>
    <div class="col-narrow">
      <div class="principles">
        ${methodTeaser.principles.map((pr) => principleBlock(pr)).join('\n        ')}
      </div>
      <p style="margin-top:var(--space-8)"><a class="wn-btn wn-btn--secondary" href="/method">${e(methodTeaser.cta)} →</a></p>
    </div>
  </section>
</div></div>

${voidBand({ word: homeVoid.word, bodyHtml: `<p>${p(homeVoid.body)}</p>` })}

<div class="shell stage"><div class="lane">
  <section class="section wn-seam wn-seam--postvoid" id="about">
    <div class="about">
      <div>
        <p class="eyebrow">About</p>
        <p class="prose">${p(about.bio)}</p>
        <p class="about__now"><b>NOW (JUN 2026):</b> ${e(about.now)}</p>
      </div>
      <div class="about__photo"><span>${e(about.photoPlaceholder)}</span></div>
    </div>
  </section>

  <section class="section wn-seam" id="contact">
    <p class="eyebrow">Contact</p>
    ${contactBlock}
  </section>
</div></div>`;
