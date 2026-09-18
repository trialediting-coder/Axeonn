# Insights Blog + Autonomous CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real blog at `/insights` with a custom single-admin CMS, plus a fully autonomous weekly content pipeline (Anthropic API + web search) that researches and writes SEO/AEO-optimized posts under fail-safe anti-fabrication guardrails.

**Architecture:** One `posts` table in Vercel Postgres, one shared creation/validation code path used by three front doors — the admin UI (human), a weekly Vercel Cron job (autonomous), and an authenticated API token (for Claude Code, on request). Auth.js (single credentials-based admin) protects `/insights/admin/*`. A second hourly cron flips `scheduled` posts to `published` after a 24h window.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, `@vercel/postgres`, `next-auth` v5, `bcryptjs`, `react-markdown` + `remark-gfm`, `@anthropic-ai/sdk`, `resend`.

**Spec:** `docs/superpowers/specs/2026-09-17-insights-blog-cms-design.md`

## Global Constraints

- No user table — single admin via `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` env vars, bcrypt-checked.
- No WYSIWYG editor — Markdown only, with live preview.
- `.claude/product-marketing-context.md` stays local-only (never commit it). Production guardrails live in the new, committed `content/brand-guardrails.md`.
- Every post — regardless of which of the 3 creation paths made it — passes through the same validation code in `lib/postValidation.ts` before it can reach `status: 'scheduled'` or `status: 'published'`.
- Autonomous generation defaults to `status: 'draft'` on ANY validation or self-critique failure — it must never fail open into `scheduled`.
- Public byline is always "Axeon Studio Team"; the `author: 'human' | 'ai'` field is internal-only and never rendered on public pages.
- `niche_tags` values must be valid `slug`s from `data/nichesData.ts`'s `niches` array — reuse that list, don't invent a separate taxonomy.
- Publish cadence: weekly generation, 24-hour scheduled-delay before auto-publish (per the spec's research-backed reasoning — do not add extra cadence options).

---

## Phase 1: Foundations

### Task 1: Dependencies, Postgres schema, and DB client

**Files:**
- Modify: `package.json` (add dependencies)
- Create: `lib/db.ts`
- Create: `scripts/init-db.mjs`
- Test: `scripts/verify-db-schema.mjs`

**Interfaces:**
- Produces: `sql` (re-exported tagged-template query function from `@vercel/postgres`) from `lib/db.ts`, used by every later task that touches the database.

- [ ] **Step 1: Install dependencies**

```bash
npm install @vercel/postgres next-auth@beta bcryptjs react-markdown remark-gfm @anthropic-ai/sdk resend
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Create `lib/db.ts`**

```ts
// lib/db.ts
export { sql } from '@vercel/postgres';
```

This thin re-export exists so every other file imports the DB client from one place (`@/lib/db`), not directly from the third-party package — if the underlying driver ever changes, only this file changes.

- [ ] **Step 3: Write the schema init script**

```js
// scripts/init-db.mjs
import { sql } from '@vercel/postgres';

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published')),
      author TEXT NOT NULL CHECK (author IN ('human', 'ai')),
      niche_tags TEXT[] NOT NULL DEFAULT '{}',
      meta_title TEXT,
      meta_description TEXT,
      cover_image_url TEXT,
      cover_image_alt TEXT,
      faq_items JSONB NOT NULL DEFAULT '[]',
      sources JSONB NOT NULL DEFAULT '[]',
      scheduled_publish_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS posts_status_idx ON posts (status);`;
  await sql`CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);`;
  console.log('Schema ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Add a `db:init` script to package.json**

Add to the `"scripts"` block in `package.json`:

```json
"db:init": "node scripts/init-db.mjs"
```

- [ ] **Step 5: Document the manual Vercel Postgres setup step**

This step cannot be scripted — it requires Hayder's own Vercel account. Add a comment block at the top of `scripts/init-db.mjs` (above the imports):

```js
// MANUAL SETUP REQUIRED BEFORE RUNNING THIS SCRIPT:
// 1. In the Vercel dashboard, go to the axeonstudio project -> Storage -> Create Database -> Postgres.
// 2. Vercel automatically adds POSTGRES_URL and related env vars to the project.
// 3. Pull them locally: `vercel env pull .env.local` (requires `vercel` CLI logged in).
// 4. Then run: npm run db:init
```

- [ ] **Step 6: Write a schema verification script**

```js
// scripts/verify-db-schema.mjs
import { sql } from '@vercel/postgres';

async function main() {
  const { rows } = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'posts' ORDER BY ordinal_position;
  `;
  if (rows.length === 0) {
    console.error('FAIL: posts table does not exist. Run npm run db:init first.');
    process.exit(1);
  }
  const expected = ['id', 'slug', 'title', 'excerpt', 'content', 'status', 'author', 'niche_tags', 'meta_title', 'meta_description', 'cover_image_url', 'cover_image_alt', 'faq_items', 'sources', 'scheduled_publish_at', 'published_at', 'created_at', 'updated_at'];
  const actual = rows.map((r) => r.column_name);
  const missing = expected.filter((c) => !actual.includes(c));
  if (missing.length > 0) {
    console.error('FAIL: missing columns:', missing);
    process.exit(1);
  }
  console.log('PASS: posts table has all expected columns.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 7: Run verification (requires the manual Vercel Postgres step above to have been done by Hayder first)**

Run: `npm run db:init && node scripts/verify-db-schema.mjs`
Expected: `PASS: posts table has all expected columns.`

If Hayder hasn't provisioned the database yet, this task's code is still correct and complete — note in the task report that live DB verification is blocked on manual Vercel setup, and move on. Do not treat this as a task failure.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json lib/db.ts scripts/init-db.mjs scripts/verify-db-schema.mjs
git commit -m "feat(insights): add Postgres schema and DB client for blog posts"
```

---

### Task 2: Brand guardrails content + post validation

**Files:**
- Create: `content/brand-guardrails.md`
- Create: `lib/postValidation.ts`
- Test: `lib/postValidation.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `validatePost(post: PostDraft): ValidationResult` from `lib/postValidation.ts`, where:
  ```ts
  export interface PostDraft {
    title: string;
    content: string; // markdown
    sources: { claim: string; url: string }[];
  }
  export interface ValidationResult {
    passed: boolean;
    reasons: string[]; // empty if passed
  }
  ```
  Task 12 (autonomous generation) and Task 11 (creation API) both call `validatePost`.

- [ ] **Step 1: Write `content/brand-guardrails.md`**

Read `.claude/product-marketing-context.md` first (if it doesn't exist in this environment, read `data/pricingData.ts` and `data/marketingSolutionsData.ts` directly instead) to pull the real, current facts, then write:

```markdown
# Axeon Studio — Brand Guardrails (Production, Committed)

These are the ONLY facts the autonomous content pipeline may state about
Axeon Studio. This file ships to production; it is intentionally a narrow
factual subset of the fuller internal marketing-context file, which stays
local-only.

## Real pricing (never state a different number)
- Core Web Build: $2,800, one-time, 7 business days.
- Acquisition Engine: $4,800, one-time, up to 14 days.
- AxeonCORE retainer: $490/month.

## Real, currently-live services (safe to describe as offered)
- Custom website design and development.
- SEO / AEO / GEO (search + AI-answer-engine visibility).
- AI chat & online scheduling.
- Lead generation / Custom CRM Pipeline.
- Video & photography.

## NOT currently live — never imply these are offered
- Paid digital advertising / Google Ads / Meta Ads management.
- Local Services Ads management.
- ChatGPT Ads or any other paid AI-platform advertising product.

## Banned / retired terminology
- Do not call the $2,800 tier a "sprint" or otherwise use "sprint" as a
  headline value proposition.
- Do not use "fast" alone as the core value proposition of a post — pair
  speed claims with something concrete (a real timeline, a real number)
  or omit them.
- Never refer to "Operations Retainer" — the correct current name is
  "AxeonCORE".

## Never fabricate
- No invented client results, case studies, testimonials, or before/after
  numbers for Axeon's own work. Axeon does not yet have published client
  case studies — do not imply otherwise.
- No unverifiable superlatives beyond these two pre-approved claims:
  "Certified Partner" and "5.0 Client Rating". "First AI-Powered Agency in
  Iowa" / "Iowa's First AI-Forward Digital Agency" is also pre-approved
  (confirmed accurate by the site owner).
- Any external statistic (industry data, survey results, etc.) MUST come
  from a real source found via web search during generation, and MUST be
  recorded in this post's `sources` array with the real URL. Never state a
  statistic without a real, checkable source.

## Voice
- Direct, specific, no jargon-stuffed corporate language.
- Iowa-based, West Des Moines. Founder: Hayder Hatem.
```

- [ ] **Step 2: Write the failing test for structural validation**

```ts
// lib/postValidation.test.ts
import { describe, it, expect } from 'node:test';
import assert from 'node:assert';
import { validatePost } from './postValidation';

describe('validatePost', () => {
  it('fails a post under the word-count floor', () => {
    const result = validatePost({
      title: 'Too Short',
      content: '# Too Short\n\nJust a few words here.',
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('word count')));
  });

  it('fails a post missing an H1', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'No H1 Post',
      content: `## Only an H2\n\n${longBody}`,
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('H1')));
  });

  it('fails a post with fewer than two H2s', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'One H2 Post',
      content: `# Title\n\n## Only One H2\n\n${longBody}`,
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('H2')));
  });

  it('fails a post that names a not-live service', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'Ads Post',
      content: `# Title\n\n## One\n\n## Two\n\n${longBody} We also run your Google Ads campaigns for you.`,
      sources: [],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.toLowerCase().includes('not-live')));
  });

  it('fails a post citing a source without a real-looking URL', () => {
    const longBody = 'word '.repeat(900);
    const result = validatePost({
      title: 'Bad Source Post',
      content: `# Title\n\n## One\n\n## Two\n\n${longBody}`,
      sources: [{ claim: 'made up stat', url: 'not-a-url' }],
    });
    assert.strictEqual(result.passed, false);
    assert.ok(result.reasons.some((r) => r.includes('source')));
  });

  it('passes a well-formed, compliant post', () => {
    const longBody = 'Axeon Studio builds custom web infrastructure. '.repeat(200);
    const result = validatePost({
      title: 'A Good Post',
      content: `# A Good Post\n\n## Section One\n\n${longBody}\n\n## Section Two\n\nMore real content here about SEO and AEO for local service businesses, written with enough depth to pass the word count floor comfortably.`,
      sources: [{ claim: 'real stat', url: 'https://www.searchenginejournal.com/some-article' }],
    });
    assert.strictEqual(result.passed, true);
    assert.deepStrictEqual(result.reasons, []);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx tsx --test lib/postValidation.test.ts`
Expected: FAIL — `Cannot find module './postValidation'` (the module doesn't exist yet).

- [ ] **Step 4: Implement `lib/postValidation.ts`**

```ts
// lib/postValidation.ts
export interface PostDraft {
  title: string;
  content: string;
  sources: { claim: string; url: string }[];
}

export interface ValidationResult {
  passed: boolean;
  reasons: string[];
}

const MIN_WORD_COUNT = 800;

// Phrases that must never appear in a published post's body. Kept in sync
// with content/brand-guardrails.md by hand — if you add a rule there that
// implies a bannable phrase, add it here too.
const BANNED_PHRASE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bsprint\b/i, reason: 'Uses "sprint" as a value proposition (banned terminology).' },
  { pattern: /operations retainer/i, reason: 'References the retired "Operations Retainer" name instead of AxeonCORE.' },
  { pattern: /(run|manage|handle)s?\s+(your\s+)?(google|meta|facebook)\s+ads/i, reason: 'Implies Axeon manages paid ad accounts (not-live service).' },
  { pattern: /local services ads? management/i, reason: 'Implies Axeon offers Local Services Ads management (not-live service).' },
  { pattern: /chatgpt ads/i, reason: 'Implies Axeon offers ChatGPT Ads (not-live service).' },
];

function countWords(markdown: string): number {
  return markdown
    .replace(/[#*_>`-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasHeadingLevel(markdown: string, level: number): number {
  const re = new RegExp(`^${'#'.repeat(level)}\\s+.+$`, 'gm');
  return (markdown.match(re) || []).length;
}

function looksLikeRealUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function validatePost(post: PostDraft): ValidationResult {
  const reasons: string[] = [];

  const wordCount = countWords(post.content);
  if (wordCount < MIN_WORD_COUNT) {
    reasons.push(`Word count ${wordCount} is below the ${MIN_WORD_COUNT}-word floor.`);
  }

  if (hasHeadingLevel(post.content, 1) < 1) {
    reasons.push('Missing an H1 heading.');
  }

  if (hasHeadingLevel(post.content, 2) < 2) {
    reasons.push('Fewer than 2 H2 headings — content is not structured enough.');
  }

  for (const { pattern, reason } of BANNED_PHRASE_PATTERNS) {
    if (pattern.test(post.content)) {
      reasons.push(`Banned phrase / not-live-service claim found: ${reason}`);
    }
  }

  for (const source of post.sources) {
    if (!looksLikeRealUrl(source.url)) {
      reasons.push(`Cited source has an invalid-looking URL: "${source.url}" (claim: "${source.claim}").`);
    }
  }

  return { passed: reasons.length === 0, reasons };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx tsx --test lib/postValidation.test.ts`
Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add content/brand-guardrails.md lib/postValidation.ts lib/postValidation.test.ts
git commit -m "feat(insights): add committed brand guardrails and post validation"
```

---

### Task 3: Post CRUD library

**Files:**
- Create: `lib/posts.ts`
- Test: `lib/posts.test.ts`

**Interfaces:**
- Consumes: `sql` from `lib/db.ts` (Task 1).
- Produces (used by Tasks 4, 5, 6, 9, 10, 11, 14, 15):
  ```ts
  export interface Post {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    status: 'draft' | 'scheduled' | 'published';
    author: 'human' | 'ai';
    nicheTags: string[];
    metaTitle: string | null;
    metaDescription: string | null;
    coverImageUrl: string | null;
    coverImageAlt: string | null;
    faqItems: { question: string; answer: string }[];
    sources: { claim: string; url: string }[];
    scheduledPublishAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
  export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

  export async function listPosts(filter?: { status?: Post['status'] }): Promise<Post[]>;
  export async function getPostBySlug(slug: string): Promise<Post | null>;
  export async function getPostById(id: number): Promise<Post | null>;
  export async function createPost(input: PostInput): Promise<Post>;
  export async function updatePost(id: number, input: Partial<PostInput>): Promise<Post>;
  export async function deletePost(id: number): Promise<void>;
  export async function publishDuePosts(): Promise<number>; // returns count flipped
  export function slugify(title: string): string;
  ```

- [ ] **Step 1: Write the failing test for `slugify` (pure function, no DB needed)**

```ts
// lib/posts.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from './posts';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    assert.strictEqual(slugify('How HVAC Companies Win Local SEO'), 'how-hvac-companies-win-local-seo');
  });

  it('strips punctuation', () => {
    assert.strictEqual(slugify("What's the Best CRM for Roofers?"), 'whats-the-best-crm-for-roofers');
  });

  it('collapses repeated whitespace/hyphens', () => {
    assert.strictEqual(slugify('Too   Many    Spaces'), 'too-many-spaces');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/posts.test.ts`
Expected: FAIL — `Cannot find module './posts'`.

- [ ] **Step 3: Implement `lib/posts.ts`**

```ts
// lib/posts.ts
import { sql } from '@/lib/db';

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  author: 'human' | 'ai';
  nicheTags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  faqItems: { question: string; answer: string }[];
  sources: { claim: string; url: string }[];
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(row: any): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    author: row.author,
    nicheTags: row.niche_tags ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    faqItems: row.faq_items ?? [],
    sources: row.sources ?? [],
    scheduledPublishAt: row.scheduled_publish_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listPosts(filter?: { status?: Post['status'] }): Promise<Post[]> {
  const { rows } = filter?.status
    ? await sql`SELECT * FROM posts WHERE status = ${filter.status} ORDER BY created_at DESC`
    : await sql`SELECT * FROM posts ORDER BY created_at DESC`;
  return rows.map(rowToPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { rows } = await sql`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const { rows } = await sql`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function createPost(input: PostInput): Promise<Post> {
  const { rows } = await sql`
    INSERT INTO posts (
      slug, title, excerpt, content, status, author, niche_tags,
      meta_title, meta_description, cover_image_url, cover_image_alt,
      faq_items, sources, scheduled_publish_at, published_at
    ) VALUES (
      ${input.slug}, ${input.title}, ${input.excerpt}, ${input.content},
      ${input.status}, ${input.author}, ${input.nicheTags},
      ${input.metaTitle}, ${input.metaDescription}, ${input.coverImageUrl}, ${input.coverImageAlt},
      ${JSON.stringify(input.faqItems)}, ${JSON.stringify(input.sources)},
      ${input.scheduledPublishAt}, ${input.publishedAt}
    )
    RETURNING *;
  `;
  return rowToPost(rows[0]);
}

export async function updatePost(id: number, input: Partial<PostInput>): Promise<Post> {
  const existing = await getPostById(id);
  if (!existing) throw new Error(`Post ${id} not found`);
  const merged = { ...existing, ...input };
  const { rows } = await sql`
    UPDATE posts SET
      slug = ${merged.slug},
      title = ${merged.title},
      excerpt = ${merged.excerpt},
      content = ${merged.content},
      status = ${merged.status},
      niche_tags = ${merged.nicheTags},
      meta_title = ${merged.metaTitle},
      meta_description = ${merged.metaDescription},
      cover_image_url = ${merged.coverImageUrl},
      cover_image_alt = ${merged.coverImageAlt},
      faq_items = ${JSON.stringify(merged.faqItems)},
      sources = ${JSON.stringify(merged.sources)},
      scheduled_publish_at = ${merged.scheduledPublishAt},
      published_at = ${merged.publishedAt},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;
  return rowToPost(rows[0]);
}

export async function deletePost(id: number): Promise<void> {
  await sql`DELETE FROM posts WHERE id = ${id}`;
}

export async function publishDuePosts(): Promise<number> {
  const { rowCount } = await sql`
    UPDATE posts
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE status = 'scheduled' AND scheduled_publish_at <= now();
  `;
  return rowCount ?? 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/posts.test.ts`
Expected: all 3 `slugify` tests PASS. (The CRUD functions are exercised end-to-end in Task 11's tests against a real/dev database — no DB mocking is introduced here, per YAGNI.)

- [ ] **Step 5: Commit**

```bash
git add lib/posts.ts lib/posts.test.ts
git commit -m "feat(insights): add post CRUD library"
```

---

## Phase 2: Public Site

### Task 4: Blog index page

**Files:**
- Create: `app/insights/page.tsx`
- Create: `components/insights/PostCard.tsx`
- Modify: `components/Header.tsx:346-348` (desktop nav), `components/Header.tsx:546-548` (mobile nav)

**Interfaces:**
- Consumes: `listPosts` and `Post` type from `lib/posts.ts` (Task 3).

- [ ] **Step 1: Change the Header "Insights" links**

In `components/Header.tsx`, change line 346 (`<Link href="/faq" className={...}>`) so it reads:

```tsx
<Link href="/insights" className={`${navHoverClass} transition-colors py-1`}>
```

And change line 546 the same way:

```tsx
<Link href="/insights" onClick={() => setMobileMenuOpen(false)} className="text-neutral-800 font-semibold pt-1">
```

The link text ("Insights") and everything else on both lines stays identical — only the `href` value changes from `/faq` to `/insights`.

- [ ] **Step 2: Create `components/insights/PostCard.tsx`**

```tsx
import Link from 'next/link';
import type { Post } from '@/lib/posts';

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/insights/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
    >
      {post.coverImageUrl && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ''}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6 flex flex-col gap-3">
        {post.nicheTags[0] && (
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-600">
            {post.nicheTags[0]}
          </span>
        )}
        <h2 className="text-xl font-bold text-neutral-950 leading-snug group-hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="text-xs text-neutral-400 mt-1">
            {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create `app/insights/page.tsx`**

```tsx
import { listPosts } from '@/lib/posts';
import { PostCard } from '@/components/insights/PostCard';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata({
  path: '/insights',
  title: 'Insights | Axeon Studio',
  description: 'Practical guidance on web systems, SEO/AEO, and lead capture for local service businesses, from Axeon Studio.',
});

export const revalidate = 3600;

export default async function InsightsPage() {
  const posts = await listPosts({ status: 'published' });

  return (
    <main className="w-full pt-32 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4">
          Axeon Studio Insights
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mb-14">
          Practical guidance on web systems, search visibility, and lead capture for local service businesses.
        </p>
        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts published yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify it builds and renders**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `rm -rf .next && npm run build`
Expected: succeeds; `/insights` appears in the route list. (With no database provisioned yet in this environment, `listPosts` will throw at build/request time — if that happens, wrap the call in a try/catch that falls back to an empty array for now, and note in the task report that this is temporary until Task 1's manual DB setup is done. Do NOT leave a broken build.)

- [ ] **Step 5: Commit**

```bash
git add app/insights/page.tsx components/insights/PostCard.tsx components/Header.tsx
git commit -m "feat(insights): add blog index page and repoint Insights nav link"
```

---

### Task 5: Post detail page with schema markup

**Files:**
- Create: `app/insights/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getPostBySlug`, `listPosts`, `Post` from `lib/posts.ts` (Task 3); `niches` from `data/nichesData.ts`.

- [ ] **Step 1: Create `app/insights/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { getPostBySlug, listPosts } from '@/lib/posts';
import { niches } from '@/data/nichesData';
import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== 'published') return {};
  return buildMetadata({
    path: `/insights/${post.slug}`,
    title: post.metaTitle ?? `${post.title} | Axeon Studio`,
    description: post.metaDescription ?? post.excerpt,
  });
}

export default async function InsightPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== 'published') notFound();

  const allPublished = await listPosts({ status: 'published' });
  const related = allPublished
    .filter((p) => p.id !== post.id && p.nicheTags.some((t) => post.nicheTags.includes(t)))
    .slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl ?? undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'Axeon Studio' },
    publisher: {
      '@type': 'Organization',
      name: 'Axeon Studio',
      logo: { '@type': 'ImageObject', url: 'https://axeonstudio.co/icon.png' },
    },
    mainEntityOfPage: `https://axeonstudio.co/insights/${post.slug}`,
  };

  const faqJsonLd =
    post.faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null;

  const nicheLookup = new Map(niches.map((n) => [n.slug, n.name]));

  return (
    <main className="w-full pt-32 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <article className="max-w-3xl mx-auto">
        <nav className="text-sm text-neutral-500 mb-6">
          <Link href="/insights" className="hover:text-blue-600">Insights</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{post.title}</span>
        </nav>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4">
          {post.title}
        </h1>
        <p className="text-sm text-neutral-400 mb-8">
          Axeon Studio Team
          {post.publishedAt && (
            <>
              {' · '}
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </>
          )}
        </p>
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ''}
            loading="eager"
            decoding="async"
            className="w-full rounded-2xl mb-10 aspect-[16/9] object-cover"
          />
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-blue-600">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {post.faqItems.length > 0 && (
          <section className="mt-16 pt-10 border-t border-neutral-200">
            <h2 className="text-2xl font-bold text-neutral-950 mb-6">Common Questions</h2>
            <div className="flex flex-col gap-6">
              {post.faqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-neutral-900 mb-1">{item.question}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-neutral-200">
            <h2 className="text-2xl font-bold text-neutral-950 mb-6">Related</h2>
            <ul className="flex flex-col gap-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/insights/${r.slug}`} className="text-blue-600 hover:underline font-medium">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {post.nicheTags.length > 0 && (
          <p className="mt-10 text-sm text-neutral-500">
            Related industries:{' '}
            {post.nicheTags.map((tag, i) => (
              <span key={tag}>
                {i > 0 && ', '}
                <Link href={`/solutions/${tag}`} className="text-blue-600 hover:underline">
                  {nicheLookup.get(tag) ?? tag}
                </Link>
              </span>
            ))}
          </p>
        )}
      </article>
    </main>
  );
}
```

- [ ] **Step 2: Add Tailwind Typography plugin (needed for the `prose` classes above)**

Run: `npm install -D @tailwindcss/typography`

Add the plugin to `app/globals.css`'s `@plugin` directives (Tailwind v4 uses CSS-based plugin registration — check the existing `@plugin` lines already in `app/globals.css` and follow the same pattern to add `@plugin "@tailwindcss/typography";`).

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `rm -rf .next && npm run build`
Expected: succeeds (dynamic route `/insights/[slug]` shown in output).

- [ ] **Step 4: Commit**

```bash
git add app/insights/[slug]/page.tsx package.json package-lock.json app/globals.css
git commit -m "feat(insights): add post detail page with BlogPosting/FAQPage schema"
```

---

### Task 6: Sitemap integration

**Files:**
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `listPosts` from `lib/posts.ts` (Task 3).

- [ ] **Step 1: Update `app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { niches } from '@/data/nichesData';
import { marketingSolutions } from '@/data/marketingSolutionsData';
import { listPosts } from '@/lib/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://axeonstudio.co';
  const staticRoutes = ['', '/solutions', '/marketing-solutions', '/pricing', '/why-axeon', '/work', '/process', '/about', '/faq', '/book', '/privacy', '/terms', '/insights'];

  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  try {
    posts = await listPosts({ status: 'published' });
  } catch {
    // Database not provisioned yet in this environment — sitemap still
    // generates correctly for every other route.
    posts = [];
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/why-axeon' ? 0.9 : 0.8,
    })),
    ...niches.map((niche) => ({
      url: `${baseUrl}/solutions/${niche.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...marketingSolutions.map((solution) => ({
      url: `${baseUrl}/marketing-solutions/${solution.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/insights/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds; `/sitemap.xml` still generates.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(insights): include published posts in sitemap"
```

---

## Phase 3: Auth + Admin CMS

### Task 7: Auth.js setup and admin route protection

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`
- Create: `scripts/hash-admin-password.mjs`

**Interfaces:**
- Produces: `auth`, `signIn`, `signOut`, `handlers` from `lib/auth.ts`, used by Tasks 8, 9, 10, 11.

- [ ] **Step 1: Write the password-hash helper script (Hayder runs this once to generate `ADMIN_PASSWORD_HASH`)**

```js
// scripts/hash-admin-password.mjs
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-admin-password.mjs "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('Add this to your .env.local and Vercel project env vars as ADMIN_PASSWORD_HASH:');
console.log(hash);
```

- [ ] **Step 2: Create `lib/auth.ts`**

```ts
// lib/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        if (email !== process.env.ADMIN_EMAIL) return null;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!passwordHash) return null;
        const valid = await bcrypt.compare(password, passwordHash);
        if (!valid) return null;
        return { id: '1', email };
      },
    }),
  ],
  pages: { signIn: '/insights/admin/login' },
  session: { strategy: 'jwt' },
});
```

- [ ] **Step 3: Create the NextAuth route handler**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create `middleware.ts`**

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === '/insights/admin/login';
  const isAdminRoute = pathname.startsWith('/insights/admin');

  if (isAdminRoute && !isLoginPage && !req.auth) {
    const loginUrl = new URL('/insights/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/insights/admin/:path*'],
};
```

- [ ] **Step 5: Add required env vars to `.env.example`**

Append to `.env.example`:

```
NEXTAUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
```

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts app/api/auth middleware.ts scripts/hash-admin-password.mjs .env.example
git commit -m "feat(insights): add Auth.js single-admin login and route protection"
```

---

### Task 8: Admin login page

**Files:**
- Create: `app/insights/admin/login/page.tsx`

**Interfaces:**
- Consumes: `signIn` from `lib/auth.ts` (Task 7) via a client-side form action.

- [ ] **Step 1: Create `app/insights/admin/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password, redirect: 'false', json: 'true' }),
    });

    setLoading(false);

    if (res.ok) {
      router.push('/insights/admin');
      router.refresh();
    } else {
      setError('Invalid email or password.');
    }
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center px-6 bg-neutral-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-950 mb-6">Insights Admin</h1>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
```

**Note for implementer:** Auth.js v5's exact client-side credentials sign-in call shape can differ slightly by beta version. Before writing this task's code, run `npx context7-mcp resolve-library-id next-auth` (or check `node_modules/next-auth/package.json` for the installed version and its README) to confirm whether the installed version prefers `signIn('credentials', {...})` from `next-auth/react` over the raw fetch shown above — if `next-auth/react`'s `signIn` is available and simpler, use that instead of the manual fetch call, keeping the rest of the component the same.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, visit `/insights/admin/login`, confirm the form renders and an invalid login shows the error message (a valid login can't be fully tested until Task 1's DB and this task's `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` env vars are set locally — note this in the task report if blocked).

- [ ] **Step 4: Commit**

```bash
git add app/insights/admin/login/page.tsx
git commit -m "feat(insights): add admin login page"
```

---

### Task 9: Admin dashboard

**Files:**
- Create: `app/insights/admin/page.tsx`
- Create: `components/insights/AdminDashboardTable.tsx`

**Interfaces:**
- Consumes: `listPosts`, `Post` from `lib/posts.ts` (Task 3); `signOut` from `lib/auth.ts` (Task 7).
- Consumes (client actions): `DELETE /api/admin/posts/[id]`, `POST /api/admin/posts/[id]/publish` — both created in Task 11. This task's UI calls those endpoints; if Task 11 hasn't landed yet when this task is implemented, stub the fetch calls exactly as shown below (they're correct against Task 11's contract) rather than inventing a different shape.

- [ ] **Step 1: Create `components/insights/AdminDashboardTable.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/posts';

function statusBadge(status: Post['status']) {
  const styles: Record<Post['status'], string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    scheduled: 'bg-amber-100 text-amber-700',
    published: 'bg-green-100 text-green-700',
  };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}>{status}</span>;
}

export function AdminDashboardTable({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);

  async function handlePublishNow(id: number) {
    const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'published' as const } : p)));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this post permanently?')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-neutral-500 border-b border-neutral-200">
          <th className="py-3 pr-4">Title</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 pr-4">Author</th>
          <th className="py-3 pr-4">Scheduled for</th>
          <th className="py-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-b border-neutral-100">
            <td className="py-3 pr-4 font-medium text-neutral-900">{post.title}</td>
            <td className="py-3 pr-4">{statusBadge(post.status)}</td>
            <td className="py-3 pr-4 text-neutral-500">{post.author}</td>
            <td className="py-3 pr-4 text-neutral-500">
              {post.scheduledPublishAt ? new Date(post.scheduledPublishAt).toLocaleString() : '—'}
            </td>
            <td className="py-3 flex items-center gap-3">
              <Link href={`/insights/admin/posts/${post.id}/edit`} className="text-blue-600 hover:underline">
                Edit
              </Link>
              {post.status !== 'published' && (
                <button onClick={() => handlePublishNow(post.id)} className="text-green-600 hover:underline cursor-pointer">
                  Publish now
                </button>
              )}
              <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:underline cursor-pointer">
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Create `app/insights/admin/page.tsx`**

```tsx
import Link from 'next/link';
import { listPosts } from '@/lib/posts';
import { AdminDashboardTable } from '@/components/insights/AdminDashboardTable';

export default async function AdminDashboardPage() {
  const posts = await listPosts();

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-neutral-950">Insights Admin</h1>
          <Link
            href="/insights/admin/posts/new"
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            New Post
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          {posts.length === 0 ? (
            <p className="text-neutral-500">No posts yet.</p>
          ) : (
            <AdminDashboardTable initialPosts={posts} />
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/insights/admin/page.tsx components/insights/AdminDashboardTable.tsx
git commit -m "feat(insights): add admin dashboard"
```

---

### Task 10: Post editor (new + edit)

**Files:**
- Create: `components/insights/PostEditor.tsx`
- Create: `app/insights/admin/posts/new/page.tsx`
- Create: `app/insights/admin/posts/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `getPostById`, `Post`, `slugify` from `lib/posts.ts` (Task 3); `niches` from `data/nichesData.ts`; `POST /api/admin/posts` and `PATCH /api/admin/posts/[id]` from Task 11 (same stub-against-contract note as Task 9).

- [ ] **Step 1: Create `components/insights/PostEditor.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { niches } from '@/data/nichesData';
import { slugify, type Post } from '@/lib/posts';

interface PostEditorProps {
  initialPost?: Post;
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initialPost);
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [content, setContent] = useState(initialPost?.content ?? '');
  const [metaTitle, setMetaTitle] = useState(initialPost?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(initialPost?.metaDescription ?? '');
  const [nicheTags, setNicheTags] = useState<string[]>(initialPost?.nicheTags ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function save(status: 'draft' | 'scheduled' | 'published') {
    setSaving(true);
    setError(null);

    const scheduledPublishAt =
      status === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    const body = {
      slug,
      title,
      excerpt,
      content,
      status,
      author: initialPost?.author ?? 'human',
      nicheTags,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      coverImageUrl: initialPost?.coverImageUrl ?? null,
      coverImageAlt: initialPost?.coverImageAlt ?? null,
      faqItems: initialPost?.faqItems ?? [],
      sources: initialPost?.sources ?? [],
      scheduledPublishAt,
      publishedAt: status === 'published' ? new Date().toISOString() : (initialPost?.publishedAt ?? null),
    };

    const res = await fetch(initialPost ? `/api/admin/posts/${initialPost.id}` : '/api/admin/posts', {
      method: initialPost ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      router.push('/insights/admin');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save post.');
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Content (Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Meta title</label>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Meta description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Niche tags</label>
          <div className="flex flex-wrap gap-2">
            {niches.map((niche) => {
              const active = nicheTags.includes(niche.slug);
              return (
                <button
                  key={niche.slug}
                  type="button"
                  onClick={() =>
                    setNicheTags((prev) =>
                      active ? prev.filter((t) => t !== niche.slug) : [...prev, niche.slug]
                    )
                  }
                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${
                    active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-600 border-neutral-300'
                  }`}
                >
                  {niche.name}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            disabled={saving}
            onClick={() => save('draft')}
            className="px-4 py-2 rounded-full border border-neutral-300 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            Save Draft
          </button>
          <button
            disabled={saving}
            onClick={() => save('scheduled')}
            className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            Schedule (+24h)
          </button>
          <button
            disabled={saving}
            onClick={() => save('published')}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            Publish Now
          </button>
        </div>
      </div>
      <div className="border border-neutral-200 rounded-2xl p-6 bg-white overflow-y-auto max-h-[80vh]">
        <p className="text-xs font-mono uppercase text-neutral-400 mb-4">Preview</p>
        <div className="prose prose-neutral max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing to preview yet.*'}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/insights/admin/posts/new/page.tsx`**

```tsx
import { PostEditor } from '@/components/insights/PostEditor';

export default function NewPostPage() {
  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-950 mb-8">New Post</h1>
        <PostEditor />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create `app/insights/admin/posts/[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getPostById } from '@/lib/posts';
import { PostEditor } from '@/components/insights/PostEditor';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) notFound();

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-950 mb-8">Edit Post</h1>
        <PostEditor initialPost={post} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/insights/PostEditor.tsx app/insights/admin/posts
git commit -m "feat(insights): add post editor for create and edit"
```

---

## Phase 4: Shared Creation API

### Task 11: Admin posts API (create, update, delete, publish-now)

**Files:**
- Create: `app/api/admin/posts/route.ts`
- Create: `app/api/admin/posts/[id]/route.ts`
- Create: `app/api/admin/posts/[id]/publish/route.ts`
- Create: `lib/adminAuth.ts`
- Test: `app/api/admin/posts/route.test.ts`

**Interfaces:**
- Consumes: `createPost`, `updatePost`, `deletePost`, `getPostById`, `PostInput` from `lib/posts.ts` (Task 3); `validatePost` from `lib/postValidation.ts` (Task 2); `auth` from `lib/auth.ts` (Task 7).
- Produces: `requireAdmin(req: Request): Promise<boolean>` from `lib/adminAuth.ts` — true if the request has either a valid Auth.js session OR a valid `Authorization: Bearer $CMS_API_TOKEN` header. Used by every route in this task and by Task 14/15's cron routes.

- [ ] **Step 1: Create `lib/adminAuth.ts`**

```ts
// lib/adminAuth.ts
import { auth } from '@/lib/auth';

export async function requireAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  const token = process.env.CMS_API_TOKEN;
  if (token && authHeader === `Bearer ${token}`) return true;

  const session = await auth();
  return !!session;
}
```

- [ ] **Step 2: Write the failing test for the creation route's validation gate**

```ts
// app/api/admin/posts/route.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validatePost } from '@/lib/postValidation';

// This route-level test exercises the same validation gate the POST handler
// applies, since spinning up the full Next.js request/response cycle for
// every scenario is unnecessary — the handler's only real logic beyond
// plumbing is "call validatePost, and if a scheduled/published post fails,
// force it to draft instead."
describe('scheduled/published posts must pass validation', () => {
  it('a post that fails validation cannot be scheduled', () => {
    const draft = { title: 'x', content: 'too short', sources: [] };
    const result = validatePost(draft);
    assert.strictEqual(result.passed, false);
  });
});
```

- [ ] **Step 3: Run test to verify current behavior is understood**

Run: `npx tsx --test app/api/admin/posts/route.test.ts`
Expected: PASS (this confirms `validatePost` behaves as the route will rely on — Task 2 already implemented it, so this test passes immediately and exists as living documentation of the route's core safety rule).

- [ ] **Step 4: Create `app/api/admin/posts/route.ts`**

```ts
// app/api/admin/posts/route.ts
import { NextResponse } from 'next/server';
import { createPost, listPosts, slugify, type PostInput } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const posts = await listPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as PostInput;

  if (body.status === 'scheduled' || body.status === 'published') {
    const result = validatePost({ title: body.title, content: body.content, sources: body.sources });
    if (!result.passed) {
      return NextResponse.json(
        { error: 'Post failed validation and cannot be scheduled/published.', reasons: result.reasons },
        { status: 422 }
      );
    }
  }

  const slug = body.slug || slugify(body.title);
  const post = await createPost({ ...body, slug });
  return NextResponse.json({ post }, { status: 201 });
}
```

- [ ] **Step 5: Create `app/api/admin/posts/[id]/route.ts`**

```ts
// app/api/admin/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { updatePost, deletePost, type PostInput } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { requireAdmin } from '@/lib/adminAuth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as Partial<PostInput>;

  if ((body.status === 'scheduled' || body.status === 'published') && body.title && body.content) {
    const result = validatePost({ title: body.title, content: body.content, sources: body.sources ?? [] });
    if (!result.passed) {
      return NextResponse.json(
        { error: 'Post failed validation and cannot be scheduled/published.', reasons: result.reasons },
        { status: 422 }
      );
    }
  }

  const post = await updatePost(Number(id), body);
  return NextResponse.json({ post });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await deletePost(Number(id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Create `app/api/admin/posts/[id]/publish/route.ts`**

```ts
// app/api/admin/posts/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { getPostById, updatePost } from '@/lib/posts';
import { validatePost } from '@/lib/postValidation';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = validatePost({ title: post.title, content: post.content, sources: post.sources });
  if (!result.passed) {
    return NextResponse.json(
      { error: 'Post failed validation and cannot be published.', reasons: result.reasons },
      { status: 422 }
    );
  }

  const updated = await updatePost(post.id, { status: 'published', publishedAt: new Date().toISOString() });
  return NextResponse.json({ post: updated });
}
```

- [ ] **Step 7: Add `CMS_API_TOKEN` to `.env.example`**

Append to `.env.example`:

```
CMS_API_TOKEN=
```

- [ ] **Step 8: Run the test suite and verify build**

Run: `npx tsx --test app/api/admin/posts/route.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add lib/adminAuth.ts app/api/admin .env.example
git commit -m "feat(insights): add admin posts API with shared validation gate"
```

---

## Phase 5: Autonomous Pipeline

### Task 12: Anthropic generation client (research + write + self-critique)

**Files:**
- Create: `lib/anthropic.ts`
- Test: `lib/anthropic.test.ts`

**Interfaces:**
- Consumes: `Post['nicheTags']`-shaped niche list (from `data/nichesData.ts`), `content/brand-guardrails.md` (Task 2).
- Produces (used by Task 14):
  ```ts
  export interface GeneratedPost {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    nicheTags: string[];
    faqItems: { question: string; answer: string }[];
    sources: { claim: string; url: string }[];
  }
  export async function generatePost(avoidTitles: string[]): Promise<GeneratedPost>;
  export async function critiquePost(post: GeneratedPost): Promise<{ passed: boolean; reasons: string[] }>;
  ```

**Note for implementer:** the Anthropic API's web-search tool name/schema and the current recommended model ID can change between SDK versions. Before writing this task's code, check the currently-installed `@anthropic-ai/sdk` version's docs (via `context7-mcp resolve-library-id anthropic` / `query-docs`, or https://docs.anthropic.com/en/docs/build-with-claude/tool-use if that MCP isn't available) for: (a) the exact server-tool type string for web search, and (b) a current model ID to use for both the generation and critique calls. Use whatever the current docs specify — the code below shows the correct *shape* (tool-use loop, structured submission tool) but the exact tool-type string and model ID are the parts most likely to need updating to match what's current at implementation time.

- [ ] **Step 1: Write the failing test for the pure/deterministic part (prompt construction), not the live API call**

```ts
// lib/anthropic.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildAvoidTitlesClause } from './anthropic';

describe('buildAvoidTitlesClause', () => {
  it('returns an empty-list note when there are no prior titles', () => {
    assert.strictEqual(buildAvoidTitlesClause([]), 'No prior posts exist yet — any real, relevant topic is fine.');
  });

  it('lists prior titles to avoid when present', () => {
    const clause = buildAvoidTitlesClause(['How HVAC Companies Win Local SEO', 'A Second Post']);
    assert.ok(clause.includes('How HVAC Companies Win Local SEO'));
    assert.ok(clause.includes('A Second Post'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test lib/anthropic.test.ts`
Expected: FAIL — `Cannot find module './anthropic'`.

- [ ] **Step 3: Implement `lib/anthropic.ts`**

```ts
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';
import { niches } from '@/data/nichesData';

export interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  nicheTags: string[];
  faqItems: { question: string; answer: string }[];
  sources: { claim: string; url: string }[];
}

// NOTE: verify this model ID against current Anthropic docs before relying
// on it — pin whatever is the current recommended model at implementation
// time.
const MODEL = 'claude-opus-5';

function loadGuardrails(): string {
  return readFileSync(path.join(process.cwd(), 'content', 'brand-guardrails.md'), 'utf-8');
}

export function buildAvoidTitlesClause(priorTitles: string[]): string {
  if (priorTitles.length === 0) {
    return 'No prior posts exist yet — any real, relevant topic is fine.';
  }
  return `Do not repeat or closely resemble any of these already-published topics:\n${priorTitles.map((t) => `- ${t}`).join('\n')}`;
}

const SUBMIT_POST_TOOL = {
  name: 'submit_post',
  description: 'Submit the completed, researched blog post.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' as const },
      slug: { type: 'string' as const, description: 'lowercase-hyphenated' },
      excerpt: { type: 'string' as const, description: '1-2 sentence summary' },
      content: { type: 'string' as const, description: 'Full post body in Markdown, with a single H1, at least two H2s, and real depth (800+ words).' },
      metaTitle: { type: 'string' as const },
      metaDescription: { type: 'string' as const },
      nicheTags: { type: 'array' as const, items: { type: 'string' as const }, description: 'Slugs from the provided niche list — only include ones this post genuinely relates to.' },
      faqItems: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: { question: { type: 'string' as const }, answer: { type: 'string' as const } },
          required: ['question', 'answer'],
        },
      },
      sources: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: { claim: { type: 'string' as const }, url: { type: 'string' as const } },
          required: ['claim', 'url'],
        },
        description: 'Every external statistic cited in content, with the real URL it came from.',
      },
    },
    required: ['title', 'slug', 'excerpt', 'content', 'metaTitle', 'metaDescription', 'nicheTags', 'faqItems', 'sources'],
  },
};

export async function generatePost(avoidTitles: string[]): Promise<GeneratedPost> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const guardrails = loadGuardrails();
  const nicheList = niches.map((n) => `${n.slug}: ${n.name}`).join('\n');

  const systemPrompt = `You write SEO/AEO-optimized blog posts for Axeon Studio, a West Des Moines, Iowa digital agency. Your goal is genuine ranking and AI-citation potential, which research shows comes from real accuracy, depth, and structure — never from volume or filler.

${guardrails}

Axeon's niches (use these exact slugs in nicheTags):
${nicheList}

${buildAvoidTitlesClause(avoidTitles)}

Research a real, specific, current topic relevant to one of Axeon's niches or services using web search. Every external statistic you state MUST be one you actually found via search, with its real source URL recorded in "sources". Write a complete, well-structured post, then call submit_post with the final result. Do not call submit_post until you have done real research.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Research and write this week\'s post now.' },
  ];

  // Agentic loop: let the model use web_search freely across turns until it
  // calls submit_post.
  for (let turn = 0; turn < 8; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: systemPrompt,
      // Verify this tool type string against current Anthropic docs.
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool, SUBMIT_POST_TOOL],
      messages,
    });

    const submitCall = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'submit_post'
    );
    if (submitCall) {
      return submitCall.input as GeneratedPost;
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
      .map((block) => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: 'Search executed by the API automatically.',
      }));

    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }

  throw new Error('generatePost: model did not call submit_post within the turn budget.');
}

export async function critiquePost(post: GeneratedPost): Promise<{ passed: boolean; reasons: string[] }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const guardrails = loadGuardrails();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a strict compliance reviewer for Axeon Studio's blog. Check the draft below against these rules exactly:\n\n${guardrails}\n\nRespond with ONLY a JSON object: {"passed": boolean, "reasons": string[]}. "reasons" must be empty if passed is true.`,
    messages: [{ role: 'user', content: JSON.stringify(post, null, 2) }],
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
  if (!textBlock) return { passed: false, reasons: ['Critique call returned no text response.'] };

  try {
    return JSON.parse(textBlock.text);
  } catch {
    return { passed: false, reasons: ['Critique response was not valid JSON — treating as failure per fail-safe default.'] };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test lib/anthropic.test.ts`
Expected: both `buildAvoidTitlesClause` tests PASS.

- [ ] **Step 5: Verify build (the live API is not called by the build or tests)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Add `ANTHROPIC_API_KEY` to `.env.example`**

Append to `.env.example`:

```
ANTHROPIC_API_KEY=
```

- [ ] **Step 7: Commit**

```bash
git add lib/anthropic.ts lib/anthropic.test.ts .env.example
git commit -m "feat(insights): add Anthropic generation and self-critique client"
```

---

### Task 13: Email notifications

**Files:**
- Create: `lib/email.ts`

**Interfaces:**
- Produces (used by Task 14):
  ```ts
  export async function sendScheduledNotification(post: { title: string; slug: string; id: number }): Promise<void>;
  export async function sendFailedGenerationNotification(reasons: string[]): Promise<void>;
  ```

- [ ] **Step 1: Implement `lib/email.ts`**

```ts
// lib/email.ts
import { Resend } from 'resend';

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendScheduledNotification(post: { title: string; slug: string; id: number }): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: 'Axeon Insights <insights@axeonstudio.co>',
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New post scheduled: ${post.title}`,
    html: `
      <p>The weekly autonomous pipeline generated and validated a new post.</p>
      <p><strong>${post.title}</strong></p>
      <p>It will auto-publish in 24 hours unless you review/edit/cancel it first.</p>
      <p><a href="https://axeonstudio.co/insights/admin/posts/${post.id}/edit">Review and edit</a></p>
    `,
  });
}

export async function sendFailedGenerationNotification(reasons: string[]): Promise<void> {
  const resend = getClient();
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: 'Axeon Insights <insights@axeonstudio.co>',
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: 'Weekly post generation did not pass review',
    html: `
      <p>This week's autonomous post generation failed validation and was saved as a draft — nothing was scheduled or published.</p>
      <ul>${reasons.map((r) => `<li>${r}</li>`).join('')}</ul>
      <p><a href="https://axeonstudio.co/insights/admin">View drafts</a></p>
    `,
  });
}
```

- [ ] **Step 2: Add `RESEND_API_KEY` to `.env.example`**

Append to `.env.example`:

```
RESEND_API_KEY=
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/email.ts .env.example
git commit -m "feat(insights): add Resend email notifications for the review safety net"
```

---

### Task 14: Weekly generation cron route

**Files:**
- Create: `app/api/cron/generate-post/route.ts`

**Interfaces:**
- Consumes: `generatePost`, `critiquePost`, `GeneratedPost` from `lib/anthropic.ts` (Task 12); `validatePost` from `lib/postValidation.ts` (Task 2); `createPost`, `listPosts`, `slugify` from `lib/posts.ts` (Task 3); `sendScheduledNotification`, `sendFailedGenerationNotification` from `lib/email.ts` (Task 13).

- [ ] **Step 1: Create `app/api/cron/generate-post/route.ts`**

```ts
// app/api/cron/generate-post/route.ts
import { NextResponse } from 'next/server';
import { generatePost, critiquePost } from '@/lib/anthropic';
import { validatePost } from '@/lib/postValidation';
import { createPost, listPosts, slugify } from '@/lib/posts';
import { sendScheduledNotification, sendFailedGenerationNotification } from '@/lib/email';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existingPosts = await listPosts();
  const priorTitles = existingPosts.map((p) => p.title);

  const generated = await generatePost(priorTitles);

  const structuralResult = validatePost({
    title: generated.title,
    content: generated.content,
    sources: generated.sources,
  });

  const critiqueResult = structuralResult.passed
    ? await critiquePost(generated)
    : { passed: false, reasons: [] };

  const allReasons = [...structuralResult.reasons, ...critiqueResult.reasons];
  const passed = structuralResult.passed && critiqueResult.passed;

  const slug = generated.slug || slugify(generated.title);

  if (passed) {
    const post = await createPost({
      slug,
      title: generated.title,
      excerpt: generated.excerpt,
      content: generated.content,
      status: 'scheduled',
      author: 'ai',
      nicheTags: generated.nicheTags,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      coverImageUrl: null,
      coverImageAlt: null,
      faqItems: generated.faqItems,
      sources: generated.sources,
      scheduledPublishAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
    });
    await sendScheduledNotification({ title: post.title, slug: post.slug, id: post.id });
    return NextResponse.json({ status: 'scheduled', postId: post.id });
  }

  // Fail-safe: never scheduled/published on failure — always draft.
  const post = await createPost({
    slug,
    title: generated.title,
    excerpt: generated.excerpt,
    content: generated.content,
    status: 'draft',
    author: 'ai',
    nicheTags: generated.nicheTags,
    metaTitle: generated.metaTitle,
    metaDescription: generated.metaDescription,
    coverImageUrl: null,
    coverImageAlt: null,
    faqItems: generated.faqItems,
    sources: generated.sources,
    scheduledPublishAt: null,
    publishedAt: null,
  });
  await sendFailedGenerationNotification(allReasons);
  return NextResponse.json({ status: 'draft', postId: post.id, reasons: allReasons });
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds. (This route calls live external APIs — it is not exercised by automated tests here; Task 2's and Task 12's unit tests already cover its pure logic. End-to-end verification happens manually once `ANTHROPIC_API_KEY` and the database are provisioned — note this in the task report.)

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/generate-post
git commit -m "feat(insights): add autonomous weekly generation cron route"
```

---

### Task 15: Publish-scheduled cron route + Vercel Cron config

**Files:**
- Create: `app/api/cron/publish-scheduled/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `publishDuePosts` from `lib/posts.ts` (Task 3).

- [ ] **Step 1: Create `app/api/cron/publish-scheduled/route.ts`**

```ts
// app/api/cron/publish-scheduled/route.ts
import { NextResponse } from 'next/server';
import { publishDuePosts } from '@/lib/posts';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publishedCount = await publishDuePosts();
  return NextResponse.json({ published: publishedCount });
}
```

- [ ] **Step 2: Create `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/generate-post", "schedule": "0 13 * * 0" },
    { "path": "/api/cron/publish-scheduled", "schedule": "0 * * * *" }
  ]
}
```

The first runs weekly (Sundays 13:00 UTC); the second runs hourly to catch any post whose 24-hour scheduled window has passed.

**Note for implementer:** Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` using the project's `CRON_SECRET` env var — confirm this against current Vercel Cron docs, since Vercel occasionally changes whether this header is automatic or must be added manually in `vercel.json`'s cron config.

- [ ] **Step 3: Add `CRON_SECRET` to `.env.example`**

Append to `.env.example`:

```
CRON_SECRET=
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && rm -rf .next && npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/publish-scheduled vercel.json .env.example
git commit -m "feat(insights): add publish-scheduled cron and Vercel Cron config"
```

---

## Final Verification (after all 15 tasks)

- [ ] `npx tsc --noEmit` — clean across the whole project.
- [ ] `rm -rf .next && npm run build` — succeeds, `/insights`, `/insights/[slug]`, `/insights/admin`, `/insights/admin/login`, `/insights/admin/posts/new`, `/insights/admin/posts/[id]/edit` all present in the route list.
- [ ] Confirm `.env.example` lists every new env var: `AUTH_SECRET` (corrected from the v4-era `NEXTAUTH_SECRET` name used earlier in this plan — Auth.js v5's `@auth/core` only auto-reads `AUTH_SECRET`), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ANTHROPIC_API_KEY`, `CMS_API_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (optional), `CRON_SECRET`, plus the Postgres vars Vercel adds automatically.
- [ ] Report to Hayder exactly which manual setup steps remain before this is live: (1) provision Vercel Postgres, run `vercel env pull .env.local`, then `npm run db:init` (and `npm run db:verify` to confirm), (2) generate `ADMIN_PASSWORD_HASH` via `scripts/hash-admin-password.mjs` and set it + `ADMIN_EMAIL` + `AUTH_SECRET` in Vercel env vars, (3) get an Anthropic API key and set `ANTHROPIC_API_KEY`, (4) sign up for Resend, verify a sending domain, and set `RESEND_API_KEY` (+ `RESEND_FROM_EMAIL` if not using `insights@axeonstudio.co`), (5) generate a random `CMS_API_TOKEN` for Claude-Code-initiated posts, (6) redeploy so `vercel.json`'s cron schedule takes effect.
