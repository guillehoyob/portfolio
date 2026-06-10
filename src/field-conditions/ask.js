/**
 * WHITE NOON — ASK THE FIELD (frontend) — the void answers
 * A grounded portfolio assistant: questions go to the same-origin /api/ask
 * (Cloudflare Pages Function → Azure OpenAI, key server-side); answers come back
 * WITH SOURCES — links into the real site, rendered as "WHERE TO LOOK". The
 * conversation lives inside a void-styled <dialog> (black, washi, gold frame —
 * the conversation happens IN the void, the site's most charged place).
 *
 * Honest states: unconfigured/offline → a quiet line + the email (never a dead
 * spinner). While thinking, a red thread draws across the panel top — the same
 * gesture as the void crack: the thought finding its way.
 * Native <dialog> = focus trap + ESC for free. Reduced motion: fully usable
 * (state UI); only the thinking-thread animation is gated.
 * Flag ask:false → the hero affordance stays hidden (CSS gates on html.fc-ask).
 */
import { registerCleanup } from './index.js';

const MAILTO = 'guillehoyob@gmail.com';

export function initAsk() {
  const trigger = document.querySelector('[data-ask]');
  if (!trigger) return;
  document.documentElement.classList.add('fc-ask');
  trigger.hidden = false; // progressive: rendered hidden, revealed only when this module drives it (Stage-0 honest)

  let dlg = null, thread = null, log = null, form = null, input = null, send = null;
  const history = [];

  const build = () => {
    dlg = document.createElement('dialog');
    dlg.className = 'wn-ask';
    dlg.setAttribute('aria-label', 'Ask this portfolio');
    dlg.innerHTML = `
      <div class="wn-ask__thread" aria-hidden="true"></div>
      <header class="wn-ask__head">
        <p class="wn-ask__eyebrow">ASK THE FIELD</p>
        <button type="button" class="wn-ask__close" aria-label="Close">×</button>
      </header>
      <div class="wn-ask__log" aria-live="polite"></div>
      <form class="wn-ask__form">
        <input class="wn-ask__input" type="text" maxlength="400" autocomplete="off"
          placeholder="What did he build at Zelebrix? Is he open to work?" aria-label="Your question">
        <button class="wn-ask__send" type="submit" aria-label="Send">→</button>
      </form>
      <p class="wn-ask__hint">answers cite their sources · only your question leaves this page</p>`;
    document.body.appendChild(dlg);
    thread = dlg.querySelector('.wn-ask__thread');
    log = dlg.querySelector('.wn-ask__log');
    form = dlg.querySelector('.wn-ask__form');
    input = dlg.querySelector('.wn-ask__input');
    send = dlg.querySelector('.wn-ask__send');
    dlg.querySelector('.wn-ask__close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // backdrop closes
    form.addEventListener('submit', onAsk);
    greet();
  };

  const line = (cls, html) => {
    const el = document.createElement('div');
    el.className = 'wn-ask__msg ' + cls;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const greet = () => line('wn-ask__msg--field',
    `<p>Ask me anything about Guillermo — the work, the method, the availability. I answer only from what this site can prove, and I point you to where it lives.</p>`);

  async function onAsk(e) {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || send.disabled) return;
    input.value = '';
    line('wn-ask__msg--you', `<span class="wn-ask__who">YOU —</span> ${esc(q)}`);
    history.push({ role: 'user', content: q });
    send.disabled = true;
    dlg.classList.add('is-thinking'); // the red thread searches
    let out;
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, history: history.slice(0, -1) }),
      });
      out = res.ok ? await res.json() : { error: res.status === 503 ? 'unconfigured' : 'upstream' };
    } catch { out = { error: 'offline' }; }
    dlg.classList.remove('is-thinking');
    send.disabled = false;

    if (out && out.answer) {
      history.push({ role: 'assistant', content: out.answer });
      if (history.length > 8) history.splice(0, history.length - 8);
      const src = (out.sources || []).map((s) =>
        `<a class="wn-ask__src" href="${s.href}">${esc(s.title)}</a>`).join('');
      line('wn-ask__msg--field', `<p>${esc(out.answer)}</p>${src ? `<p class="wn-ask__where">WHERE TO LOOK</p><nav class="wn-ask__srcs">${src}</nav>` : ''}`);
    } else {
      const why = out && out.error === 'unconfigured'
        ? 'The field hasn’t found its voice yet — the Azure keys aren’t connected.'
        : 'The field can’t reach its voice right now.';
      line('wn-ask__msg--field wn-ask__msg--quiet',
        `<p>${why} Email me instead — I answer fast: <a class="wn-ask__src" href="mailto:${MAILTO}">${MAILTO}</a></p>`);
    }
    input.focus();
  }

  const open = () => {
    if (!dlg) build();
    dlg.showModal();
    input.focus();
  };
  trigger.addEventListener('click', open);

  registerCleanup('ask', () => { /* state UI — nothing animates without the thinking class */ });
}
