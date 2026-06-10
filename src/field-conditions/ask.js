/**
 * WHITE NOON — ASK THE FIELD (V5.4) — grounded portfolio chat, two homes
 * The owner: "el chatbot es lo principal de mi página." So on HOME it is EMBEDDED
 * right under the hero CTAs (`[data-ask-embed]`) — a prominent, always-visible input
 * with answers expanding inline. On every other page it is a small corner DOCK
 * (bottom-left) so it's always within reach without stealing the page.
 *
 * Both share one engine: question → same-origin /api/ask (Cloudflare Function → Azure,
 * key server-side) → answer WITH SOURCES (links into the real site, "WHERE TO LOOK").
 * Strictly scoped: the model only speaks for Guillermo's work (enforced server-side).
 * Honest offline/unconfigured/rate states → a quiet line + the email, never a dead
 * spinner. A red thread draws while thinking. Reduced motion: fully usable.
 */
import { registerCleanup } from './index.js';

const MAIL = 'guillehoyob@gmail.com';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function initAsk() {
  if (document.body.classList.contains('cv-wrap')) return;
  const embed = document.querySelector('[data-ask-embed]');
  if (embed) mountEmbed(embed);
  else mountDock();
}

/* ---- shared conversation engine ---- */
function makeChat(logEl, formEl, inputEl, sendEl, setThinking) {
  const history = [];
  const line = (cls, html) => {
    const el = document.createElement('div');
    el.className = 'wn-chat__msg ' + cls;
    el.innerHTML = html;
    logEl.appendChild(el);
    logEl.scrollTop = logEl.scrollHeight;
    return el;
  };
  let busy = false;
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = inputEl.value.trim();
    if (!q || busy) return;
    inputEl.value = '';
    line('wn-chat__msg--you', `<span class="wn-chat__who">YOU —</span> ${esc(q)}`);
    history.push({ role: 'user', content: q });
    busy = true; sendEl.disabled = true; setThinking(true);
    let out;
    try {
      const res = await fetch('/api/ask', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, history: history.slice(0, -1) }),
      });
      out = res.ok ? await res.json() : { error: res.status === 503 ? 'unconfigured' : res.status === 429 ? 'rate' : 'upstream' };
    } catch { out = { error: 'offline' }; }
    busy = false; sendEl.disabled = false; setThinking(false);
    if (out && out.answer) {
      history.push({ role: 'assistant', content: out.answer });
      if (history.length > 8) history.splice(0, history.length - 8);
      const src = (out.sources || []).map((s) => `<a class="wn-chat__src" href="${s.href}">${esc(s.title)}</a>`).join('');
      line('wn-chat__msg--field', `<p>${esc(out.answer)}</p>${src ? `<p class="wn-chat__where">WHERE TO LOOK</p><nav class="wn-chat__srcs">${src}</nav>` : ''}`);
    } else {
      const why = out && out.error === 'unconfigured' ? 'The assistant isn’t connected yet.'
        : out && out.error === 'rate' ? 'A moment — too many questions at once.'
        : 'The field can’t reach its voice right now.';
      line('wn-chat__msg--field wn-chat__msg--quiet', `<p>${why} Email me — I answer fast: <a class="wn-chat__src" href="mailto:${MAIL}">${MAIL}</a></p>`);
    }
    inputEl.focus();
  });
  return { line };
}

const GREET = 'Ask me about Guillermo — the work, the method, whether he’s open to work. I answer only from what this site can prove, and I point you to where it lives.';
const FORM = `
  <div class="wn-chat__thread" aria-hidden="true"></div>
  <div class="wn-chat__log" aria-live="polite"></div>
  <form class="wn-chat__form">
    <input class="wn-chat__input" type="text" maxlength="400" autocomplete="off"
      placeholder="Ask anything about his work…" aria-label="Ask about Guillermo">
    <button class="wn-chat__send" type="submit" aria-label="Send">→</button>
  </form>
  <p class="wn-chat__hint">grounded in this site · cites its sources · answered by an AI model</p>`;

/* ---- HOME: the embedded centerpiece ---- */
function mountEmbed(host) {
  host.hidden = false;
  host.classList.add('wn-chat', 'wn-chat--embed', 'is-open');
  host.innerHTML = `<p class="wn-chat__eyebrow"><span class="wn-chat__dot" aria-hidden="true"></span>ASK THE FIELD — this portfolio answers</p>
    <div class="wn-chat__panel">${FORM}</div>`;
  const set = (v) => host.classList.toggle('is-thinking', v);
  const { line } = makeChat(host.querySelector('.wn-chat__log'), host.querySelector('.wn-chat__form'),
    host.querySelector('.wn-chat__input'), host.querySelector('.wn-chat__send'), set);
  line('wn-chat__msg--field', `<p>${GREET}</p>`);
  registerCleanup('ask', () => {});
}

/* ---- inner pages: the small corner dock ---- */
function mountDock() {
  if (document.querySelector('.wn-chat')) return;
  document.documentElement.classList.add('fc-ask');
  const root = document.createElement('section');
  root.className = 'wn-chat wn-chat--dock';
  root.setAttribute('aria-label', 'Ask this portfolio');
  root.innerHTML = `
    <button type="button" class="wn-chat__tab" aria-expanded="false" aria-controls="wn-chat-panel">
      <span class="wn-chat__dot" aria-hidden="true"></span><span class="wn-chat__tablabel">Ask the field</span><span class="wn-chat__caret" aria-hidden="true">▴</span>
    </button>
    <div class="wn-chat__panel" id="wn-chat-panel" hidden>${FORM}</div>`;
  document.body.appendChild(root);
  const tab = root.querySelector('.wn-chat__tab');
  const panel = root.querySelector('.wn-chat__panel');
  let open = false, greeted = false;
  const set = (v) => root.classList.toggle('is-thinking', v);
  const { line } = makeChat(root.querySelector('.wn-chat__log'), root.querySelector('.wn-chat__form'),
    root.querySelector('.wn-chat__input'), root.querySelector('.wn-chat__send'), set);
  const setOpen = (v) => {
    open = v; root.classList.toggle('is-open', v); tab.setAttribute('aria-expanded', v ? 'true' : 'false'); panel.hidden = !v;
    if (v) { if (!greeted) { greeted = true; line('wn-chat__msg--field', `<p>${GREET}</p>`); } root.querySelector('.wn-chat__input').focus(); }
  };
  tab.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setOpen(false); tab.focus(); } });
  registerCleanup('ask', () => {});
}
