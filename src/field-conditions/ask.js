/**
 * WHITE NOON — ASK THE FIELD (V5.3) — a small, always-present inline chat
 * NOT a modal/link any more (owner: "the idea was a little small chat there, in the
 * same page"). A compact dock bottom-left: collapsed = a quiet pill with a breathing
 * dot; click = it expands UPWARD into a small void-styled panel IN PLACE — no backdrop,
 * the page stays live behind it. Mirror of the FIELD capsule (bottom-right).
 *
 * Grounded: questions go same-origin to /api/ask (Cloudflare Pages Function → Azure
 * OpenAI, key server-side). Answers come back WITH SOURCES — links into the real site
 * ("WHERE TO LOOK"), the honesty device. Unconfigured/offline → a quiet line + the
 * email, never a dead spinner. A red thread draws across the panel top while thinking.
 * Reduced motion: fully usable; only the thread animation is gated. Flag ask:false →
 * the dock never mounts (Stage-0 honest).
 */
import { registerCleanup } from './index.js';

const MAILTO = 'guillehoyob@gmail.com';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function initAsk() {
  if (document.body.classList.contains('cv-wrap')) return; // not on the print sheet
  if (document.querySelector('.wn-chat')) return; // idempotent
  document.documentElement.classList.add('fc-ask');

  const history = [];
  let open = false, busy = false, greeted = false;

  const root = document.createElement('section');
  root.className = 'wn-chat';
  root.setAttribute('aria-label', 'Ask this portfolio');
  root.innerHTML = `
    <button type="button" class="wn-chat__tab" aria-expanded="false" aria-controls="wn-chat-panel">
      <span class="wn-chat__dot" aria-hidden="true"></span>
      <span class="wn-chat__tablabel">Ask the field</span>
      <span class="wn-chat__caret" aria-hidden="true">▴</span>
    </button>
    <div class="wn-chat__panel" id="wn-chat-panel" hidden>
      <div class="wn-chat__thread" aria-hidden="true"></div>
      <div class="wn-chat__log" aria-live="polite"></div>
      <form class="wn-chat__form">
        <input class="wn-chat__input" type="text" maxlength="400" autocomplete="off"
          placeholder="What did he build at Zelebrix?" aria-label="Ask about Guillermo">
        <button class="wn-chat__send" type="submit" aria-label="Send">→</button>
      </form>
      <p class="wn-chat__hint">grounded in this site · cites its sources · only your question leaves the page</p>
    </div>`;
  document.body.appendChild(root);

  const tab = root.querySelector('.wn-chat__tab');
  const panel = root.querySelector('.wn-chat__panel');
  const log = root.querySelector('.wn-chat__log');
  const form = root.querySelector('.wn-chat__form');
  const input = root.querySelector('.wn-chat__input');
  const send = root.querySelector('.wn-chat__send');

  const line = (cls, html) => {
    const el = document.createElement('div');
    el.className = 'wn-chat__msg ' + cls;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const setOpen = (v) => {
    open = v;
    root.classList.toggle('is-open', v);
    tab.setAttribute('aria-expanded', v ? 'true' : 'false');
    panel.hidden = !v;
    if (v) {
      if (!greeted) {
        greeted = true;
        line('wn-chat__msg--field', `<p>Ask me about Guillermo — the work, the method, whether he’s open to work. I answer only from what this site can prove, and I point you to where it lives.</p>`);
      }
      input.focus();
    }
  };

  tab.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setOpen(false); tab.focus(); } });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || busy) return;
    input.value = '';
    line('wn-chat__msg--you', `<span class="wn-chat__who">YOU —</span> ${esc(q)}`);
    history.push({ role: 'user', content: q });
    busy = true; send.disabled = true;
    root.classList.add('is-thinking');
    let out;
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, history: history.slice(0, -1) }),
      });
      out = res.ok ? await res.json() : { error: res.status === 503 ? 'unconfigured' : 'upstream' };
    } catch { out = { error: 'offline' }; }
    root.classList.remove('is-thinking');
    busy = false; send.disabled = false;

    if (out && out.answer) {
      history.push({ role: 'assistant', content: out.answer });
      if (history.length > 8) history.splice(0, history.length - 8);
      const src = (out.sources || []).map((s) => `<a class="wn-chat__src" href="${s.href}">${esc(s.title)}</a>`).join('');
      line('wn-chat__msg--field', `<p>${esc(out.answer)}</p>${src ? `<p class="wn-chat__where">WHERE TO LOOK</p><nav class="wn-chat__srcs">${src}</nav>` : ''}`);
    } else {
      const why = out && out.error === 'unconfigured'
        ? 'The field hasn’t found its voice yet — the assistant isn’t connected.'
        : 'The field can’t reach its voice right now.';
      line('wn-chat__msg--field wn-chat__msg--quiet',
        `<p>${why} Email me — I answer fast: <a class="wn-chat__src" href="mailto:${MAILTO}">${MAILTO}</a></p>`);
    }
    input.focus();
  });

  registerCleanup('ask', () => { /* state UI — nothing animates without is-thinking */ });
}
