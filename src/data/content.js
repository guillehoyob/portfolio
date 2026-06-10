/**
 * WHITE NOON — portfolio content (build-time data; consumed by scripts/build-pages.mjs)
 *
 * SOURCE OF TRUTH: portfolio-kit/content/*.md (the canonical copy pack), NOT the
 * Claude Design prototype's data.js — which had silently resolved placeholders and
 * dropped the Lessons / Artifacts / Next sections. Every [PLACEHOLDER — Guillermo to
 * confirm …] is preserved verbatim and rendered as a visible honest chip by the
 * generator (markPlaceholders). Nothing is invented: no metrics, dates, or live URL.
 *
 * Name/contact resolved per content/README.md change log: Guillermo Hoyo Bravo,
 * guillehoyob@gmail.com (the JUAN/zelebrix credit in tokens.css is stale).
 */

export const identity = {
  name: 'Guillermo Hoyo Bravo',
  role: 'GenAI engineer',
  location: 'Madrid',
  email: 'guillehoyob@gmail.com',
  github: 'github.com/guillehoyob',
  githubUrl: 'https://github.com/guillehoyob',
  linkedin: 'linkedin.com/in/guillermo-bravo',
  linkedinUrl: 'https://www.linkedin.com/in/guillermo-bravo',
};

export const hero = {
  pre: 'GUILLERMO — AI ENGINEER / BUILDS WITH CLAUDE',
  status: 'OPEN TO WORK',
  h1: ['Guillermo Hoyo Bravo.', 'GenAI engineer.'],
  sub: 'RAG and multi-agent systems in production at Gestamp and IDEA, plus a payments-SaaS feature at Zelebrix shipping soon — all built with Claude.',
  greet: 'welcome — today’s route is drawn',
  greetReturn: 'back again — the route’s changed',
  ctaPrimary: 'See the work',
  ctaSecondary: 'How I work with Claude',
};

export const proof = [
  { num: '~2 years', label: 'building GenAI for production' },
  { num: '2', label: 'RAG and agent systems in production' },
  { num: '+1', label: 'payments-SaaS RAG feature, built and validated, deploying soon' },
];

export const breath = {
  home: ['The model proposes;', 'the evals dispose.'],
  method: ['A spec the generator', 'cannot deviate from.'],
};

/* Home featured work grid — 4 cards (home.md §2.3 taglines). The viz is each
   project's OWN route geometry, inline SVG by vizKey||slug (route-viz.mjs). */
export const work = [
  {
    slug: 'rag-zelebrix', title: 'RAG Zelebrix', status: 'progress',
    tags: ['RAG', 'Hybrid retrieval', 'Privacy'],
    tagline: 'RAG chatbot for a multi-tenant payments SaaS, built and validated, scheduled to deploy in a few months — hybrid retrieval, PII scrubbed before the model.',
  },
  {
    slug: 'architecture-idea', title: 'Architecture IDEA', status: 'progress',
    tags: ['RAG platform', 'RAGAS', 'Langfuse'],
    tagline: 'AI Engineer — sole AI engineer at IDEA; I designed, built and lead the production RAG platform powering two live assistants (HR and electrical-engineering-rules).',
  },
  {
    slug: 'gestamp-agents', title: 'Gestamp Agents', status: 'shipped',
    tags: ['Multi-agent', 'Text-to-SQL', 'RBAC'],
    tagline: 'Production multi-agent system on Semantic Kernel — Text-to-SQL, document and SharePoint tools, permission-aware.',
  },
  {
    slug: 'personal', title: 'Personal Lab', status: 'lab',
    tags: ['This site', 'Experiments'],
    tagline: 'My lab: this site, built with Claude, plus the experiments that feed my method.',
    vizKey: 'personal-lab', href: '/work/personal',
  },
];

export const methodTeaser = {
  title: 'A method, not magic.',
  principles: [
    {
      idx: '01', name: 'Spec before prompt',
      body: 'I write the brief before Claude writes a line, because otherwise it builds the wrong thing precisely and I review the wrong thing carefully.',
      prevents: 'confident generation against an unstated spec.',
    },
    {
      idx: '02', name: 'Small verified steps',
      body: 'Claude generates one step; I run it and verify it before the next ask, because otherwise errors compound silently and the bug is three commits deep.',
      prevents: 'compounding errors hidden by a big diff.',
    },
    {
      idx: '03', name: 'Evals decide, not vibes',
      body: 'I write the eval set and acceptance criteria; Claude proposes; the tests dispose — because otherwise “looks right” ships and breaks in front of a user.',
      prevents: 'shipping on a demo that never met a real case.',
    },
  ],
  cta: 'Read the full method',
};

export const about = {
  bio: 'I’m Guillermo, a GenAI engineer based in Madrid. I hold an MSc in Data Science from the Autonomous University of Madrid, and I spend my days turning automation needs into agent and retrieval systems that survive contact with production — not just a working demo. At Gestamp I extended a multi-agent system and built a Text-to-SQL agent, evaluated against a controlled golden set before every deploy [PLACEHOLDER — Guillermo to confirm: accuracy figure]. At IDEA and Zelebrix I designed RAG platforms and led their builds, reviewed commit by commit. Outside the terminal I’m learning Vietnamese, slowly and badly, which keeps me honest about being a beginner.',
  now: 'as IDEA’s sole AI Engineer, leading the production RAG platform; shipping agent work at Gestamp; and hardening the Zelebrix chatbot’s retrieval ahead of its deploy in a few months.',
  photoPlaceholder: 'Portrait / stylized avatar — placeholder (4:5)',
};

export const contact = {
  avail: 'Open to GenAI engineering roles and selected RAG and agent consulting work.',
};

/* the open-meteo credit is BOTH attribution (CC-BY 4.0) and the honest disclosure
   that one weather GET leaves the page (CONTRACTS §f.4) */
export const colophon = 'Designed with Claude Design, built with Claude Code, shipped from a static host. The site is the method’s first proof. · weather by open-meteo.com';
export const footerStatus = 'GUILLERMO — AI ENGINEER / MADRID';

/* ============ /method page (method.md) ============ */
export const method = {
  eyebrow: 'How I work with Claude',
  title: 'A method, not magic.',
  thesis: 'I treat AI pair-engineering as a discipline, not a shortcut: written specs, verification gates, and harvested learnings. Claude multiplies my output only because the process around it is strict. I built this portfolio with Claude Design and Claude Code, reviewed it commit by commit, and the page you are reading is that process running in public.',
  principles: [
    {
      idx: '01', name: 'Spec before prompt',
      body: 'I write the brief — schema, constraints, acceptance criteria — before Claude generates anything. On the Zelebrix RAG build I specified hybrid retrieval, PII scrubbing, and local data queries up front, then had Claude implement against that.',
      prevents: 'the model inventing requirements, and a payments tenant’s data leaking past a boundary I never named.',
    },
    {
      idx: '02', name: 'Claude proposes, evals dispose',
      body: 'Acceptance is decided by tests, not by how the output reads. At Gestamp my golden dataset with ground-truth results gates every Text-to-SQL deploy at 100% on controlled tests; at Zelebrix a 150-question golden set plus a retrieval probe scores each change.',
      prevents: '“looks right” shipping, and a wrong SQL answer breaking trust silently.',
    },
    {
      idx: '03', name: 'Measure before you blame the model',
      body: 'I make Claude prove the bottleneck with data before I let it tune anything. On Zelebrix an LLM benchmark showed the failure was retrieval — synonym gaps — not the generation model.',
      prevents: 'effort flowing to the loudest suspect, and the real defect surviving a redesign that changed nothing.',
    },
    {
      idx: '04', name: 'Review every commit',
      body: 'I read AI-assisted work commit by commit before it lands, the same way I review intern PRs at Gestamp and give architectural guidance. Claude drafts; I accept, reject, or rewrite each diff.',
      prevents: 'unreviewed changes accreting, and a subtle regression in retrieval or impersonation shipping under my name.',
    },
    {
      idx: '05', name: 'Harvest everything',
      body: 'Every build mines a reusable artifact — the Gestamp eval framework, the Zelebrix RAGAS-lite scorer, the IDEA ingestion and retrieval libraries. Claude helps generalize one project’s harness into the next.',
      prevents: 'hard-won workflows dying in old repos — exactly the gap my planned skills-and-harnesses collection closes.',
    },
  ],
  phases: [
    { name: 'Frame', g: 'Writes the problem, constraints, and acceptance criteria.', c: 'Restates the brief and surfaces ambiguities.', exit: 'an agreed spec with named failure modes.' },
    { name: 'Scaffold', g: 'Defines the module contracts (endpoint factory, ingestion/retrieval libraries).', c: 'Generates the first implementation.', exit: 'a running skeleton that compiles and wires together.' },
    { name: 'Iterate', g: 'Asks for small, single-purpose changes.', c: 'Edits one slice and runs it.', exit: 'a reviewed commit that does one thing.' },
    { name: 'Verify', g: 'Writes the eval set and edge cases.', c: 'Generates the test harness and runs it.', exit: 'a green run on the golden set before deploy.' },
    { name: 'Harvest', g: 'Names what should outlive the project.', c: 'Extracts it into a reusable skill or library.', exit: 'a harness ready for the next build.' },
  ],
  toolchain: [
    ['Claude Code', 'The implementation loop: scaffolding, edits, and the commit-by-commit reviews I gate every change through.'],
    ['Claude Design', 'Visual and UX iteration — this site is the demo, built without prior front-end stack knowledge.'],
    ['Skills & harnesses', 'Codified practice: my eval frameworks, retrieval libraries, and scorers, carried forward between builds.'],
    ['Evals / RAGAS', 'Acceptance gates — golden sets, retrieval probes, and the RAGAS module wired into the IDEA platform.'],
    ['Langfuse', 'Observability on the IDEA RAG platform: tracing what the agents actually did in production.'],
  ],
  breaks: [
    ['Claude over-trusts its first architecture.', 'I demand alternatives with trade-offs and benchmark them — the Zelebrix LLM comparison settled a design call with data, not preference.'],
    ['It cannot judge its own retrieval quality.', 'I own eval design — golden sets, ground-truth results, retrieval probes — because a model grading itself reports comfort, not correctness.'],
    ['It does not know my privacy and permission boundaries.', 'I specify and verify them by hand — PII scrubbing, local data queries, RBAC impersonation — because a leaked boundary is not something a prompt fixes after the fact.'],
  ],
  workedExample: 'Full annotated build log coming from the LLMwiki project. Meanwhile, the working-with-Claude notes on each project page — Zelebrix, IDEA, and the Gestamp agents — show this method in action on shipped work.',
};

/* ============ /work/<slug> project detail pages ============ */
export const projects = {
  'rag-zelebrix': {
    slug: 'rag-zelebrix',
    title: 'RAG Zelebrix',
    tagline: 'RAG chatbot answering from a multi-tenant payments SaaS knowledge base.',
    status: 'progress', statusLabel: 'In Progress',
    updated: '[PLACEHOLDER — Guillermo to confirm: last-updated date]',
    role: 'Designed and led the build — AI-assisted, reviewed commit by commit',
    clientContext: 'Zelebrix is a multi-tenant payments SaaS; tenant data is sensitive and must stay inside the company’s own systems. Guillermo joined to lead this AI feature, currently an (unpaid) collaboration with an ongoing relationship likely; the feature is scheduled to deploy to production in a few months.',
    problem: 'Users of a multi-tenant payments platform needed answers that lived across product documentation and their own tenant data, and a general-purpose chatbot could not be trusted with either side of that. Semantic search alone missed exact Spanish terms and synonyms; a naive setup would also send tenant records to an external model. The chatbot had to be accurate in Spanish, honest about what it did not know, and architecturally incapable of leaking tenant data to the external LLM.',
    constraints: [
      'External LLM must never see tenant data.',
      'Spanish-first retrieval; exact terms and synonyms must match.',
      'Tenant data queries execute locally so the external LLM never sees tenant data.',
      'Must run on CPU, GPU, or remote backend.',
      'Every retrieval stage needs a kill-switch and fallback.',
    ],
    approachHtml: `<p>I designed a hybrid retrieval pipeline rather than relying on a single method, because dense search alone was losing exact Spanish terms.</p>
<p><b>Hybrid retrieval.</b> Dense pgvector similarity and Spanish Postgres full-text search run in parallel, then fuse with Reciprocal Rank Fusion (RRF) — chosen because vector recall and lexical precision fail on different queries, and RRF combines both rankings without tuning a weight per query.</p>
<p><b>Rerank and gate.</b> A cross-encoder reranker reorders the fused candidates, and a relevance gate decides whether the context is strong enough to answer at all — so the bot abstains instead of inventing, because a confident wrong answer in payments is worse than “I don’t know.”</p>
<p><b>Privacy by design.</b> PII is scrubbed before anything reaches the LLM, and data queries execute locally, so the external model never sees tenant data.</p>
<p><b>Hardening.</b> A configurable CPU/GPU/remote compute backend, plus per-stage kill-switches and fallbacks, keep the system answering even when one component is degraded.</p>`,
    void: 'METHOD',
    collab: {
      claude: 'Scaffolded the retrieval and ingestion modules, wrote the RRF fusion and reranker glue, drafted the PII-scrubbing pass, and generated harness code for the evaluation suite from my specifications.',
      guillermo: 'Owned the architecture — the hybrid-plus-gate design, the privacy boundary, and the backend abstraction — designed the 150-question golden set and the retrieval probe, and reviewed every commit before it merged.',
      exchange: 'Early answers were drifting and I suspected the generation model. Instead of swapping models on a hunch, I had Claude build an LLM benchmark against the golden set that isolated retrieval from generation. The data showed the bottleneck was retrieval — specifically Spanish synonyms — not the model. That result is why the Spanish full-text path and RRF exist, and the benchmark is now part of how I diagnose this class of system, because otherwise you spend weeks tuning the wrong layer.',
    },
    stack: [
      'Models: external LLM (generation) · cross-encoder reranker',
      'Retrieval: pgvector (dense) · Spanish Postgres full-text · RRF fusion · relevance gate',
      'Data: PostgreSQL · local data queries · PII scrubbing before the LLM',
      'Infra: configurable CPU/GPU/remote compute backend · per-stage kill-switches and fallbacks',
    ],
    outcome: [
      'Built and validated against a 150-question golden set; scheduled to deploy to production in [PLACEHOLDER — Guillermo to confirm: target window, ~a few months].',
      'Hybrid retrieval plus RRF closed the Spanish synonym gap that pure vector search missed (validated against the golden set).',
      'Privacy boundary holds by construction: the external LLM never receives tenant data.',
      '[PLACEHOLDER — Guillermo to confirm: golden-set retrieval/answer score]',
    ],
    lessons: [
      'Benchmark before you swap models — the bottleneck was retrieval, not generation.',
      'In Spanish-first retrieval, lexical and synonym matching earn their place beside vectors.',
      'A relevance gate that lets the bot abstain is a privacy and trust feature, not a fallback.',
    ],
    artifacts: [
      { label: 'Repo', access: 'CONFIDENTIAL' },
      { label: 'Demo / pre-production system', access: 'ON-REQUEST' },
    ],
    next: [
      '[PLACEHOLDER — Guillermo to confirm: version 2 direction, e.g. expanding the golden set or adding query-rewrite for synonyms]',
      'Promote the retrieval probe and RAGAS-lite scorer into a shared evaluation harness across projects.',
    ],
    related: ['architecture-idea', 'gestamp-agents'],
  },

  'architecture-idea': {
    slug: 'architecture-idea',
    title: 'Architecture IDEA',
    tagline: 'A reusable RAG platform serving an HR and an electrical-engineering-rules assistant in production.',
    status: 'progress', statusLabel: 'In Progress',
    updated: '[PLACEHOLDER — Guillermo to confirm last-updated date]',
    role: 'AI Engineer — sole AI engineer at IDEA; designed, built and leads the platform',
    clientContext: 'A production RAG platform for IDEA, currently running two internal assistants. Guillermo is the company’s sole AI engineer and mentors one engineer building a LangGraph agent on the platform.',
    problem: 'Two assistants were needed for different audiences — one for HR questions, one for electrical-engineering rules — each with its own documents, retrieval needs, and definition of a good answer. Built separately, they would have meant two ingestion pipelines, two retrieval stacks, and two ways to measure quality. The task was not one chatbot. It was a platform that could stand up new assistants without rebuilding the same machinery each time.',
    constraints: [
      'Two distinct assistants must run from one shared codebase.',
      'New assistants must be addable without rewriting ingestion or retrieval.',
      'Answer quality must be measured, not assumed, before each release.',
      'Every retrieval and generation step must be observable in production.',
      'A second engineer must be able to contribute and own a component.',
    ],
    approachHtml: `<p>As IDEA’s only AI engineer, I designed, built, and now lead its production RAG platform on Docker with Azure CI/CD, PostgreSQL for application data, and Qdrant as the vector store. The architecture turns on three reusable parts.</p>
<p>First, an <b>endpoint factory</b> generates the API surface for each assistant from shared building blocks — because otherwise every new assistant copies and drifts from the last one.</p>
<p>Second, <b>reusable ingestion and retrieval libraries</b>, so both assistants draw on one tested pipeline rather than two parallel ones — because shared code is the only way a platform stays a platform.</p>
<p>Third, an <b>integrated RAGAS evaluation module</b> wired into the platform, so retrieval and answer quality are scored as a build step, not checked by hand. I added <b>Langfuse observability</b> across the stack so every trace — retrieval, ranking, generation — is inspectable once an assistant is live.</p>
<p>I am the company’s only AI engineer; I lead the platform and mentor one engineer building a LangGraph agent against it, defining the contract their component must meet.</p>`,
    void: 'PLATFORM',
    collab: {
      claude: 'Drafted boilerplate for the endpoint factory and the reusable library interfaces, proposed first-pass retrieval code, and generated scaffolding for the RAGAS evaluation harness from a written brief.',
      guillermo: 'Owned the platform architecture, decided the split between shared libraries and per-assistant code, set the RAGAS thresholds the platform measures against, and reviewed every contribution — including those from the engineer I mentor — before it merged.',
      exchange: 'The reusable-vs-specific boundary is the whole design. I held the line that ingestion and retrieval stay in shared libraries while only assistant-specific config diverges — because otherwise the second assistant forks the pipeline and the platform stops being one thing.',
    },
    stack: [
      'Models · Orchestration: LangGraph agent (in progress) · endpoint factory',
      'Data: PostgreSQL · Qdrant',
      'Evaluation · Observability: integrated RAGAS module · Langfuse',
      'Infra: Docker · Azure CI/CD',
    ],
    outcome: [
      'Two assistants live in production: an HR assistant and an electrical-engineering-rules assistant.',
      'Both running on one shared platform: endpoint factory, reusable ingestion and retrieval libraries, integrated RAGAS evaluation.',
      'Reported as strong metrics in production — [PLACEHOLDER — Guillermo to confirm: specific figures, e.g. RAGAS scores or HR/engineering query volume per week].',
      'A second engineer is building a LangGraph agent on the platform under my mentoring.',
    ],
    lessons: [
      'A platform is the boundary between shared and specific code — defend it on day one.',
      'Build evaluation into the pipeline; quality you do not measure is quality you only hope for.',
      'Observability is not optional once an assistant is answering real users.',
    ],
    artifacts: [],
    next: [
      'Ship the LangGraph agent the mentored engineer is building against the platform.',
      'Replace the metrics placeholder with measured RAGAS and usage figures.',
    ],
    related: ['rag-zelebrix', 'gestamp-agents'],
  },

  'gestamp-agents': {
    slug: 'gestamp-agents',
    title: 'Gestamp Agents',
    tagline: 'Production multi-agent assistant that answers staff questions from governed enterprise data.',
    status: 'shipped', statusLabel: 'Shipped',
    updated: '2026-06',
    role: 'Built and extended the multi-agent system; set plugin contribution criteria',
    clientContext: 'Gestamp, Madrid; internal data and schemas kept confidential.',
    problem: 'Staff needed answers that lived across disconnected systems: structured tables in Databricks, documents in Blob Storage, pages in SharePoint, and tickets in a Service Desk. Finding one answer meant knowing which system held it, having the right permissions, and translating a business question into a query. That work fell to whoever could read schemas and write SQL. The bottleneck was access and translation, not data: the answers already existed, but reaching them was slow and uneven.',
    constraints: [
      'Every query must run under the requesting user’s permissions.',
      'Client data and schemas stay confidential; no internal details exposed.',
      'Answers must be correct before deploy, not after.',
      'Must fit the corporate Azure and Databricks stack.',
      'Secrets managed centrally, never in code or config.',
    ],
    approachHtml: `<p>I worked on a production multi-agent system built with Semantic Kernel and extended it with new plugins so one assistant could reach several systems. Into the tool chain I added Text-to-SQL over Databricks, document extraction from Blob Storage, translation, SharePoint lookup, and a Service Desk SOAP service — integrated in under four weeks.</p>
<p>The Text-to-SQL agent carries an enriched metadata layer (business descriptions and worked query examples) because the model needs business context, not just column names, to map a question to the right tables. I built a custom evaluation framework with a golden dataset of ground-truth results, reaching 100% accuracy on controlled tests before every deploy, because an SQL agent that is confidently wrong is worse than no agent. I implemented RBAC impersonation so every Databricks query runs under the requesting user’s identity and permissions — the agent never widens what a person is allowed to see.</p>
<p>The chatbot is served by FastAPI endpoints with async token streaming, Pydantic-validated I/O, and end-to-end user impersonation on every request.</p>`,
    void: 'GOVERNED',
    collab: {
      claude: 'Scaffolded plugin boilerplate and FastAPI endpoint shapes, drafted Pydantic models, and proposed first-pass SQL-generation prompts and refactors I could review and pare back.',
      guillermo: 'Made the architecture calls — plugin contracts, the impersonation model, the metadata-layer design — and built the evaluation framework and its golden dataset. I decided what “correct” meant; the model proposed, the evals decided.',
      exchange: 'An early Text-to-SQL prompt produced queries that read plausible but returned the wrong rows on edge cases. Rather than tune the prompt by feel, I wrote a golden dataset with ground-truth results first, then iterated against it until controlled tests passed at 100%. That eval-before-prompt habit is now how I gate every SQL change, because otherwise a confident-but-wrong query ships unnoticed.',
    },
    stack: [
      'Models / Orchestration: Azure OpenAI · Semantic Kernel multi-agent orchestration',
      'Retrieval: hybrid RAG on Azure AI Search (semantic + BM25 + cross-encoder reranking), permission-aware',
      'Data: Databricks (Text-to-SQL) · Azure Blob Storage · SharePoint · MongoDB (selective plugin memory)',
      'API: FastAPI (async token streaming, Pydantic-validated I/O, per-request impersonation)',
      'Infra: Azure AKS · Azure DevOps CI/CD · Azure Key Vault',
    ],
    architecture: 'A single conversational agent routes each request to the right plugin — Text-to-SQL, document extraction, translation, SharePoint lookup, or Service Desk — under the requesting user’s identity. Structured questions go to Databricks via the metadata-enriched Text-to-SQL agent; document and knowledge questions go through the hybrid RAG pipeline on Azure AI Search, which fuses semantic and BM25 retrieval and reranks with a cross-encoder, retrieving only what the user is permitted to see. Secrets resolve through Key Vault; the service runs on AKS and ships through Azure DevOps.',
    outcome: [
      '100% accuracy on the controlled golden-dataset tests, run before every deploy.',
      'New tool chain (five plugins) integrated in under four weeks.',
      'Every Databricks query runs under the requesting user’s permissions via RBAC impersonation.',
      'In production use. [PLACEHOLDER — Guillermo to confirm breadth and figures: e.g. teams/users served, assistant queries handled per week, time-to-answer before vs. after.]',
    ],
    lessons: [
      'Retrieval and SQL correctness are eval problems before they are model problems.',
      'Give the model business context, not just schema; descriptions and examples beat column names.',
      'Impersonate on every request — permissions belong at the data call, not the prompt.',
    ],
    artifacts: [
      { label: 'Architecture diagram', access: 'ON-REQUEST', note: '[PLACEHOLDER — Guillermo to add sanitized diagram]' },
      { label: 'Repository', access: 'CONFIDENTIAL', note: '[PLACEHOLDER — client-internal]' },
    ],
    next: [
      'Broaden the golden dataset to cover more business domains before each deploy.',
      'Extend plugin contribution criteria so reviewed intern PRs can add tools safely.',
    ],
    related: ['rag-zelebrix', 'architecture-idea'],
  },
};

/* Home void band — the one detonation (§4.1), word SHIPPED */
export const homeVoid = {
  word: 'SHIPPED',
  body: 'The hardest problem on the Zelebrix build was never the model — it was the privacy boundary. PII is scrubbed before anything reaches the LLM and tenant data is queried locally, so the external model never sees it. The boundary holds by construction, not by a prompt.',
};

/* ============ /work/personal hub — the meta-entry (work-this-portfolio.md) ============ */
export const thisPortfolio = {
  title: 'This Portfolio',
  tagline: 'Personal portfolio built with Claude Design and Claude Code, on a free stack.',
  status: 'shipped', statusLabel: 'Shipped',
  updated: '2026-06',
  role: 'Sole designer and engineer',
  clientContext: 'Personal project — the site itself is exhibit A of the method on /method.',
  problem: 'The standard GenAI-engineer portfolio is a GitHub README or a Notion page: skill buried in wall text, no visual system, no documented method. This site closes that gap — shipped work, a documented process, and a contact in under two minutes. It is also proof that advanced prompting, run as an engineering discipline rather than a shortcut, produces artefacts that hold up.',
  constraints: [
    'Everything free, no paid dependency: Cloudflare Pages, Vite, SIL OFL fonts.',
    'No prior experience with the front-end stack (Vite, GSAP, Lenis) before starting.',
    'The design system had to be complete and internally consistent before any production code — because otherwise the build loop produces incoherent output.',
    'Every section must render fully with all living behaviour switched off, so the static version is a complete, navigable document, not a shell waiting for JS.',
    'Launch on four shipped entries, not ten planned ones.',
  ],
  approachHtml: `<p><b>Design system first.</b> Seven DNA cards synthesised into three candidates; a pairwise tournament converged on WHITE NOON — warm-white field, one decisive red line, strict token budget. Output: the design-system spec, the contract Claude Code builds against.</p>
<p><b>IA before components.</b> The sections-IA doc resolved slug permanence, naming gates, and the graduation mechanism before any component existed — because a static host with no redirects makes a published URL permanent.</p>
<p><b>Living System specified, not improvised.</b> The Field Conditions module — eleven named behaviours (Heliostat, New Route, Crosswind, Slipstream, Patina, Heartbeat, First Breath, Threshold Cut, Crack, Vault Blur, Scanline) — was fully specced before any JS, each with a governor, a reduced-motion fallback, and a static honest state.</p>
<p><b>Build against the spec.</b> Component by component, each verified against its token-contract entry before the next was started.</p>`,
  void: 'META',
  collab: {
    claude: 'Generated the design system from a structured brief — tokens, WCAG contrast ratios, component anatomy, motion timing, the Field Conditions spec — and produced component CSS/JS from spec entries under token-only rules.',
    guillermo: 'Defined the seven DNA cards, ran the tournament, made every directional call, authored all constraints and content, and reviewed every generated block against the token contract before proceeding.',
    exchange: 'The first Field Conditions draft had Heliostat and Slipstream fighting for a single governor slot. Fix: Heliostat became a governor-exempt field-state transition (≤4 crossfades/day, zero rAF); the slot now arbitrates only trace-level behaviours. That field-state-vs-trace distinction is a principle I carry into any layered animation system.',
  },
  stackTable: [
    ['Models', 'Claude Design (direction & spec), Claude Code (implementation)'],
    ['Build', 'Vite (vanilla JS), Cloudflare Pages'],
    ['Motion', 'GSAP + ScrollTrigger, Lenis smooth scroll'],
    ['Living System', 'Custom field-conditions module, < 8KB gzip target, localStorage only'],
    ['Fonts', 'Space Grotesk, DM Sans, Share Tech Mono, Cormorant Garamond (SIL OFL, self-hosted)'],
    ['Tokens', 'CSS custom properties in assets/tokens.css'],
  ],
  architecture: 'The Field Conditions module writes only --fc-* custom properties and data-attributes; components style themselves off those hooks in pure CSS. One shared requestAnimationFrame loop drives all continuous behaviours and suspends on tab-hide or when no behaviour has work.',
  outcome: [
    'A shipped portfolio with a complete, internally consistent design system (WHITE NOON), documented well enough to hand to another engineer.',
    'The Field Conditions Living System runs eleven named behaviours, each with a reduced-motion fallback and a static honest state, with no paid animation library beyond GSAP.',
    'The site is a worked example of the method it describes: every page explaining how I work with Claude was itself built with Claude.',
    '[PLACEHOLDER — Guillermo to confirm: Lighthouse scores, bundle size, or other measured performance facts before launch.]',
  ],
  lessons: [
    'A design system is a contract, not a style guide — it earns its cost only when it is specific enough that a code generator cannot deviate from it accidentally (token names, cap rules, forbidden states included).',
    'Specifying the failure mode of every ambient behaviour before any JS is written is what keeps a living system from becoming a decoration pile.',
    'The hardest decision was not visual — it was slug permanence and the client-naming gate, resolved before the first URL shipped, because a static host has no redirects.',
  ],
  artifacts: [
    { label: 'Design system spec — portfolio-kit/design-system.md', access: 'PUBLIC (in repo)' },
    { label: 'IA decisions — portfolio-kit/decisions/sections-ia.md', access: 'PUBLIC (in repo)' },
    { label: 'CSS tokens — portfolio-kit/assets/tokens.css', access: 'PUBLIC (in repo)' },
    { label: 'Live site', access: 'PUBLIC', note: '[PLACEHOLDER — Guillermo to confirm: Cloudflare Pages URL]' },
  ],
  next: [
    'Worked-example annotated build log (a real prompt → output → correction → result sequence from the Living System build) — planned for the LLMwiki project.',
    'Graduate planned personal projects as they ship; each card collapses in place to the stub variant per the graduation mechanism.',
  ],
};

/* Three planned cards (work-planned.md, §5.2 reduced template) */
export const planned = [
  {
    slug: 'language-app', title: 'Language-Learning App',
    plannedStart: '[PLACEHOLDER — Guillermo to confirm: planned start quarter]',
    hypothesis: 'An app shaped around one learner’s real friction beats a generic app shaped around the average user’s assumed friction — built for how I actually study Vietnamese, integrating listening, reading, and active recall in a single flow.',
    exists: 'Spec drafted — input modes, session structure, and progression model are written down; no code exists yet. Scheduled after LLMwiki vault reaches its first milestone.',
    milestone: 'A working session loop — vocabulary card → listening clip → typed answer → spaced-repetition scheduling — covering [PLACEHOLDER — Guillermo to confirm: vocabulary scope]. Target: [PLACEHOLDER — Guillermo to confirm: target date].',
  },
  {
    slug: 'llmwiki-vault', title: 'LLMwiki Vault',
    plannedStart: '[PLACEHOLDER — Guillermo to confirm: planned start quarter]',
    hypothesis: 'A reader agent ingests YouTube videos and LinkedIn reposts into a structured wiki vault; a manager agent then updates, corrects, links, and prunes entries as the field moves. A maintained knowledge base beats an ever-growing bookmark pile.',
    exists: 'Agent roles defined (reader, manager), tool list and vault schema drafted (claim, source, date, confidence, linked entries, superseded-by). No code written.',
    milestone: 'Manager agent successfully correcting [PLACEHOLDER — Guillermo to confirm: number of seeded wiki entries] when fed a conflicting source — claim diff logged, old version retained, link added. Target: [PLACEHOLDER — Guillermo to confirm: target date].',
  },
  {
    slug: 'skills-harnesses', title: 'Skills & Harnesses Collection',
    plannedStart: '[PLACEHOLDER — Guillermo to confirm: planned start quarter]',
    hypothesis: 'A curated, version-controlled collection of the Claude skills, prompt harnesses, and evaluation patterns proven useful across real builds. Each entry is named, tested and reusable. Formalising what works once means every future project starts one level higher.',
    exists: 'Concept and motivation are clear; nothing is written or collected yet. Scheduled to start once LLMwiki vault is past its first milestone, because LLMwiki will itself generate the first batch of harnesses worth collecting.',
    milestone: '[PLACEHOLDER — Guillermo to confirm: number of harnesses] documented, individually runnable harnesses extracted from the Gestamp, Zelebrix, and LLMwiki builds — each with a one-paragraph description, a worked example, and the failure it prevents. Target: [PLACEHOLDER — Guillermo to confirm: target date].',
  },
];

/* The standalone "This portfolio" card on the /work index (links to the hub) */
export const portfolioCard = {
  slug: 'personal', title: 'This Portfolio', status: 'shipped',
  tags: ['Claude Design', 'Claude Code'],
  tagline: 'Personal portfolio built with Claude Design and Claude Code, on a free stack — exhibit A of the method.',
  vizKey: 'this-portfolio', href: '/work/personal',
};

export default {
  identity, hero, proof, breath, work, methodTeaser, about, contact,
  colophon, footerStatus, method, projects, homeVoid, thisPortfolio,
  planned, portfolioCard,
};
