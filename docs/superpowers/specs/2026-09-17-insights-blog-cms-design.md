# Insights Blog + Autonomous CMS — Design Spec

## Goal

Add a real blog under "Insights" (`/insights`) whose actual purpose is SEO/AEO
lead generation — content engineered to rank in Google and get cited by AI
answer engines (ChatGPT, Perplexity, AI Overviews), not primarily for human
readers. A custom CMS with a real login lets the site owner (Hayder) write
posts directly, and a fully autonomous weekly pipeline researches and writes
posts on its own using the Anthropic API — with strict, fail-safe guardrails
so nothing fabricated or off-brand ever reaches production without a human
noticing.

## Why this design (research-grounded)

- Publishing frequency is **not** the lever for either SEO or AEO. Industry
  consensus (Search Engine Journal, 2026 blogging-frequency research) puts
  ~1 high-quality post/week as the cited sweet spot for service businesses;
  traffic-per-post gains flatten sharply past ~11 posts/month, and Google's
  helpful-content systems actively penalize thin/AI-mill volume.
- For AEO specifically, what gets a source cited by an AI model is structure
  (direct-answer blocks, question-shaped headings, clean schema) and
  verifiable accuracy — not cadence. See Frase's and WRITER's 2026 AEO/GEO
  guides.
- Conclusion: "optimize purely for the algorithm" and "write something
  genuinely accurate and well-structured" are the same strategy here, not
  competing ones. The guardrails below exist because autonomous generation
  with zero human review is the one part of this design that could
  accidentally violate that principle (or this site's standing
  no-fabrication rule) if unchecked.

## Non-goals (explicitly out of scope)

- Multi-user accounts / roles / invite system — single admin (Hayder) only.
- Rich-text WYSIWYG editor — Markdown only (fits AI-authored content, and is
  simpler to build/maintain).
- Comments, categories beyond niche tags, post series, drafts collaboration.
- Any publishing frequency other than weekly for the autonomous path.
- Browser automation for the "ask Claude Code to post" path — a direct
  authenticated API call is simpler and more reliable than driving a login
  form.

## Architecture Summary

Three ways a post is created, one underlying creation/validation path so no
route has weaker rules than another:

1. **Human (Hayder)** — logs into `/insights/admin`, writes/edits directly.
2. **Autonomous weekly job** — Vercel Cron → serverless function → Anthropic
   API (with web search) → validation → self-critique pass → saved as
   `scheduled` (or `draft` if it fails checks).
3. **Claude Code, on request** — a chat session (like this one) sends an
   authenticated `curl` to the same internal creation endpoint using a
   `CMS_API_TOKEN`.

All three end up in the same `posts` table and go through the same
publish-scheduling mechanics.

## Data Model

Postgres (Vercel Postgres, built on Neon). One table is sufficient — no
`users` table, since there's exactly one admin whose credentials live in
environment variables.

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,              -- Markdown
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published')),
  author TEXT NOT NULL CHECK (author IN ('human', 'ai')),
  niche_tags TEXT[] NOT NULL DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  faq_items JSONB NOT NULL DEFAULT '[]',   -- [{question, answer}] for FAQPage schema
  sources JSONB NOT NULL DEFAULT '[]',     -- [{claim, url}] — every cited external stat
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`niche_tags` values match the existing niche slugs already used elsewhere in
this codebase (`data/nichesData.ts`) so posts can cross-link to the relevant
`/solutions/[slug]` page.

## Public Site

- **Nav change**: "Insights" in `components/Header.tsx` (desktop + mobile,
  currently `href="/faq"`) points to `/insights` instead. FAQ's own URL
  (`/faq`) is unchanged; it just loses its nav slot and stays reachable via
  the Footer, matching how "Our Process" was handled earlier.
- **`/insights`** — paginated grid of published posts (title, excerpt, cover
  image, date, niche tag chip).
- **`/insights/[slug]`** — full post: title, cover image, byline
  ("Axeon Studio Team" publicly — the `author: 'ai' | 'human'` field is
  internal-only, never shown on the public page), Markdown body rendered via
  `react-markdown` + `remark-gfm`, `BlogPosting` JSON-LD, `FAQPage` JSON-LD
  when `faq_items` is non-empty, breadcrumb, related posts by shared
  `niche_tags`.
- **`app/sitemap.ts`** extended to include every `published` post.

## Admin CMS

All routes under `/insights/admin`, protected by Next.js middleware checking
the Auth.js session, except `/insights/admin/login`.

- **`/insights/admin/login`** — email + password, Auth.js Credentials
  provider checked against `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` env vars
  (bcrypt).
- **`/insights/admin`** (dashboard) — table of all posts with status badges;
  `scheduled` rows show a live countdown to auto-publish plus "Publish now" /
  "Edit" / "Cancel" actions; `draft` rows (including failed-validation
  autonomous attempts) show "Edit" / "Delete".
- **`/insights/admin/posts/new`** and **`/insights/admin/posts/[id]/edit`** —
  title, slug (auto-slugified from title, editable), excerpt, Markdown
  content textarea with a live-rendered preview pane, meta title/description,
  cover image (URL field — Vercel Blob upload can be a fast-follow, not
  required for v1), niche tag multi-select, FAQ items editor (repeatable
  question/answer pairs), Save Draft / Schedule (+24h) / Publish Now.

## Autonomous Pipeline

### New committed guardrails file

`.claude/product-marketing-context.md` is deliberately local-only (not
committed) per an earlier decision this session. The autonomous pipeline
runs in production and needs the underlying facts at runtime, so a new,
smaller, **committed** file carries just what generation needs:

**`content/brand-guardrails.md`** — real pricing tiers, real live services,
explicitly-not-live services ("do not treat as offered"), banned/retired
terminology, brand-voice DON'Ts (no "fast"/"sprint" as core value prop, no
fabricated stats/testimonials/certifications). This is a factual subset of
the fuller marketing-context file — no personas, no competitive landscape,
nothing that has no reason to exist in production.

### Weekly flow

Vercel Cron (`vercel.json`, e.g. Sundays 13:00 UTC) → `POST
/api/cron/generate-post` (verified via Vercel's `Authorization: Bearer
$CRON_SECRET` header):

1. Query `posts` for existing titles + `niche_tags` → build a "don't repeat"
   list for the prompt.
2. Call the Anthropic API (`@anthropic-ai/sdk`) with the web-search tool
   enabled. System prompt includes: the contents of
   `content/brand-guardrails.md`, the don't-repeat list, and instructions to
   research one real, specific, citation-worthy topic tied to one of Axeon's
   niches/services, then return a structured result (via tool use / JSON
   mode) with: `title`, `slug`, `excerpt`, `content` (Markdown), `meta_title`,
   `meta_description`, `niche_tags`, `faq_items[]`, `sources[]` (every
   external statistic cited must carry a real URL found during the search).
3. **Automated structural validation** (plain code, not another AI call):
   - Word count ≥ some floor (e.g. 800).
   - At least one H1 and two H2s present in the Markdown.
   - Every entry in `sources[]` has a URL matching a real domain pattern.
   - Scans the draft text against a banned-phrase list derived from
     `content/brand-guardrails.md` (retired terms, not-live services,
     "fast"/"sprint" as a headline value prop, unverifiable superlatives
     beyond the two pre-approved trust badges).
4. **Independent self-critique pass** — a second, separate Anthropic API call
   (no tools, just the guardrails + the generated draft) asks Claude to act
   as a strict compliance reviewer and return pass/fail + specific reasons
   for any violation found. Catches subtle issues (implied results, tone
   drift) the regex pass can't.
5. **Fail-safe branch**:
   - Both checks pass → insert as `status: 'scheduled'`, `author: 'ai'`,
     `scheduled_publish_at: now() + 24h`. Send a Resend email: post title +
     preview link + "publishes automatically in 24h unless you act."
   - Either check fails → insert as `status: 'draft'` (never `scheduled`,
     never auto-published). Send a Resend email: "weekly generation did not
     pass review" + the specific failure reasons, so Hayder can look at it
     if curious but nothing goes live unattended.

### Publish-scheduled flow

A second, hourly Vercel Cron → `POST /api/cron/publish-scheduled`: finds
every post where `status = 'scheduled' AND scheduled_publish_at <= now()`,
flips it to `status: 'published', published_at: now()`.

### Claude-Code-on-request path

`POST /api/admin/posts` accepts either the Auth.js admin session (browser)
or a `CMS_API_TOKEN` bearer header (for me, in a chat session). Both go
through the identical creation code path — there is no separate, looser
"AI wrote this on request" route. A request via the token still runs through
steps 3–4 above before it can be saved as `scheduled`; it does not bypass
validation just because a human explicitly asked for it in a session.

## New Environment Variables

```
POSTGRES_URL / POSTGRES_URL_NON_POOLING   (from Vercel Postgres integration)
NEXTAUTH_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ANTHROPIC_API_KEY
CRON_SECRET                                (Vercel sets/verifies this automatically)
CMS_API_TOKEN                              (for the Claude-Code-on-request path)
RESEND_API_KEY
```

## New Dependencies

`@vercel/postgres`, `next-auth`, `bcryptjs`, `react-markdown`, `remark-gfm`,
`@anthropic-ai/sdk`, `resend`.

## Open Items to Resolve During Implementation

- Exact Vercel Postgres provisioning is done through Hayder's own Vercel
  dashboard (requires his account access) — the implementation plan should
  call this out as a manual setup step, not something scripted.
- Resend requires its own free-tier signup/API key (same category of manual
  step).
- Anthropic API key for the autonomous pipeline is separate from any Claude
  Code subscription and has its own usage-based billing (expected to be a
  few dollars/month at 1 researched ~1500-word post/week).
