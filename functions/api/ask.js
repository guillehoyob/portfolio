/**
 * WHITE NOON — /api/ask (Cloudflare Pages Function)
 * The voice of the field: a GROUNDED assistant for a GenAI engineer's portfolio.
 * Proxies ONE chat-completions call to Azure OpenAI — the key lives in Cloudflare
 * env vars and NEVER reaches the browser (the page itself still makes zero
 * third-party calls; this hop is server-side, CONCEPT §7.4 note).
 *
 * Grounding = src/data/knowledge.gen.mjs (regenerated each build from the real
 * site content). The model must answer ONLY from it and cite hrefs from its URL
 * map — the same honesty device as the placeholders: every claim has a place to
 * verify it. Unanswerable → say so and point to the email.
 *
 * Env (Cloudflare Pages → Settings → Variables; owner provides):
 *   AZURE_OPENAI_ENDPOINT     e.g. https://<resource>.openai.azure.com
 *   AZURE_OPENAI_API_KEY
 *   AZURE_OPENAI_DEPLOYMENT   e.g. gpt-4o-mini
 *   AZURE_OPENAI_API_VERSION  optional, default 2024-10-21
 * Unconfigured → 503 {error:'unconfigured'} and the panel shows its quiet fallback.
 */
import { KNOWLEDGE } from '../../src/data/knowledge.gen.mjs';

const ALLOWED_HREFS = new Set([
  ...KNOWLEDGE.pages.map((p) => p.href),
  ...KNOWLEDGE.projects.map((p) => p.href),
  '/method', '/cv', '/#about', '/#contact', '/#work',
]);

const SYSTEM = `You are the quiet voice of ${KNOWLEDGE.identity.name}'s portfolio (design system "WHITE NOON" — calm, precise, honest).
Answer questions about Guillermo, his work, method, experience and availability USING ONLY the KNOWLEDGE JSON below. Never invent facts, metrics or dates; where the knowledge says a value is pending, say it is pending.
Reply in the same language the visitor writes in. Keep answers under 110 words, warm but precise — no hype.
ALWAYS respond as a JSON object: {"answer": string, "sources": [{"title": string, "href": string}]} where every href comes from the knowledge (pages or project hrefs). 1-3 sources, the places on the site where the visitor can VERIFY or read more about what you said. If the question cannot be answered from the knowledge, say so honestly, suggest emailing ${KNOWLEDGE.identity.email}, and cite the Contact section ("/#contact").
KNOWLEDGE = ${JSON.stringify(KNOWLEDGE)}`;

export async function onRequestGet({ env }) {
  const configured = !!(env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_DEPLOYMENT);
  return json({ ok: true, configured });
}

export async function onRequestPost({ request, env }) {
  if (!(env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_DEPLOYMENT)) {
    return json({ error: 'unconfigured' }, 503);
  }
  // ── abuse guards (the function spends money on every call) ──
  // 1) same-origin only: a cross-site page cannot POST here (blocks drive-by abuse)
  const origin = request.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== new URL(request.url).host) return json({ error: 'forbidden' }, 403); } catch { return json({ error: 'forbidden' }, 403); } }
  // 2) body size cap before parsing
  const clen = +(request.headers.get('content-length') || 0);
  if (clen > 8000) return json({ error: 'too-large' }, 413);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const q = String((body && body.q) || '').trim().slice(0, 400);
  if (!q) return json({ error: 'empty' }, 400);
  // short rolling history keeps follow-ups cheap and the context honest
  const history = Array.isArray(body.history)
    ? body.history.slice(-6).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
    : [];

  const version = env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
  const url = `${env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${version}`;
  const messages = [{ role: 'system', content: SYSTEM }, ...history, { role: 'user', content: q }];
  const call = (payload) => fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': env.AZURE_OPENAI_API_KEY },
    body: JSON.stringify(payload),
  });
  // gpt-5 / reasoning deployments (2024-12-01-preview) want max_completion_tokens and
  // reject a non-default temperature; older gpt-4o deployments want max_tokens. Try the
  // modern shape first, fall back ONCE on a 400 (param mismatch) — works for both.
  let res;
  try {
    res = await call({ messages, max_completion_tokens: 500, response_format: { type: 'json_object' } });
    if (res.status === 400) res = await call({ messages, max_tokens: 500, temperature: 0.3, response_format: { type: 'json_object' } });
  } catch { return json({ error: 'upstream' }, 502); }
  if (!res.ok) return json({ error: 'upstream', status: res.status }, 502); // NEVER echo the upstream body (it can carry request context)

  let answer = '', sources = [];
  try {
    const data = await res.json();
    const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const parsed = JSON.parse(raw);
    answer = String(parsed.answer || '').slice(0, 1200);
    sources = (Array.isArray(parsed.sources) ? parsed.sources : [])
      .filter((s) => s && ALLOWED_HREFS.has(s.href)) // citations only into the real site
      .slice(0, 3)
      .map((s) => ({ title: String(s.title || s.href).slice(0, 80), href: s.href }));
  } catch { return json({ error: 'parse' }, 502); }
  if (!answer) return json({ error: 'empty-answer' }, 502);
  return json({ answer, sources });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
