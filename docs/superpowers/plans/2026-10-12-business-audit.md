# Business Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure where a business stands on Google and on its own website (Maps rank, organic rank, rating/reviews, a 5×5 ranking grid, site checks) and store it as dated audits: automatically every 14 days for signed clients, on demand for prospects, and a few times a month by the client in AxeonPROOF.

**Architecture:** One engine (`lib/audits.ts` → `composeAudit`) calls six independent sources (`lib/auditSources.ts`) and saves one row in a new `audits` table. Four surfaces call it: the admin Audits tab (prospects), the client project panel (baseline + history), a daily cron (schedule), and a PROOF route (client scans). Pure rules (matching, leaks, grid maths, caps, report fill) live in client-safe `lib/audit*.ts` files with `node:test` coverage; the DataForSEO HTTP client is isolated in `lib/dataforseo.ts`.

**Tech Stack:** Next.js 15 App Router (`app/api/**/route.ts`, `runtime = 'nodejs'`), React 19 client components, Tailwind v4 classes via `components/admin/ui.ts`, `@vercel/postgres` tagged `sql`, DataForSEO v3 REST (Basic auth), Google PageSpeed Insights v5, `node:test` run through `tsx --test`. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-10-12-business-audit-design.md` (read it first; this plan argues from it).

**Worktree:** `C:\Users\trial\OneDrive\Desktop\axeon-audit-wt`, branch `business-audit`. Every command below runs from that directory. Do not touch `Desktop\axeon-studio-latest2-scorpion-redesign` (stale `main` with unrelated local edits).

## Global Constraints

- Flat `lib/` files, one responsibility each; `*Shared.ts` files are client-safe (no Node imports) — the existing convention (`projectsShared.ts`, `emailLogShared.ts`).
- Every schema change is an idempotent statement appended inside `ensureSchema()` in `lib/db.ts` (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- Tests: `node:test` + `node:assert/strict`, file `lib/<name>.test.ts`, run via `npx tsx --test lib/<name>.test.ts`; register every new test file in the `test:onboarding` script in `package.json`.
- "Nothing is invented": every number shown comes from a stored response; a missing number renders as "not measured", never 0 or a dash pretending to be data. No AI-written text anywhere in this feature.
- Only `schedule` and `admin` audits set the baseline or fill monthly reports; `client` audits never do. Client scans never run the grid.
- Scan caps: `essentials 0`, `axeoncore 3`, `axeongrowth 10`, overridable per client via `onboardings.client_scan_cap`. Failed (`status = 'failed'`) scans do not count.
- Grid: 5×5, 1 mile spacing, centred on the business's own pin, **on by default** for clients (`audit_grid DEFAULT true`).
- Default interval `14` days (`audit_interval_days`), run by a **daily** cron at `15 14 * * *` UTC.
- Spend guard: env `AUDIT_MONTHLY_CAP_USD`, default `25`, summed over `audits.cost_usd` for the current month in `America/Chicago`.
- Secrets (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, optional `DATAFORSEO_BASE`, `PAGESPEED_API_KEY`) are read only in `lib/dataforseo.ts` / `lib/auditSources.ts` and never returned by any route. `raw` responses are returned only by the admin single-audit route with `?raw=1`.
- The canonical Maps rank is always measured with `location_name` ("City,State,United States"), never the pin, so the trend line compares like with like. The pin is used only for the grid. (Refinement of spec §5; keep.)
- Site fetches: http(s) only, public addresses only (DNS-resolved), ≤ 3 redirects, 10 s timeout, 2 MB cap, UA `AxeonAuditBot/1.0 (+https://axeonstudio.co)`.
- Commit after every task with an imperative one-line subject (repo style, e.g. `Audits: add DataForSEO client`) and the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- `npm run lint` (tsc) must pass at the end of every task.

## Review Focus

1. **Business names with punctuation and suffixes** ("Joe's Auto Spa, LLC" in our records vs "Joes Auto Spa" on Google) must still match → test in Task 1 (`matchSubject` name path).
2. **A website typed without a scheme** ("subjectspa.com") must normalise to `https://subjectspa.com` and still domain-match Google's `www.subjectspa.com` → test in Task 1 (`normalizeWebsite`, `domainOf`).
3. **DataForSEO task with `result: null` or an empty `items` list** (small town, odd keyword) must produce `found: false`, not a crash → test in Task 2 (`parseMapsItems`).
4. **HTML written with single quotes, uppercase attributes, or `content=` before `name=` on the meta tag** must still be detected → test in Task 2 (`htmlChecks`).
5. **A grid where some points fail** must leave those cells `null`, compute `top3Share` over all 25, and give up (section error) only when more than half fail → tests in Task 1 (`summarizeGrid`) and Task 4 (`gridSearch` with an injected search function).

---

### Task 1: Schema, shared types and pure rules

**Files:**
- Modify: `lib/db.ts` (inside `ensureSchema`, after the `email_log` index, before `})().catch(`)
- Create: `lib/auditShared.ts`
- Create: `lib/auditShared.test.ts`
- Modify: `package.json` (`test:onboarding` script)

**Interfaces:**
- Produces (used by every later task): `AuditTrigger`, `AuditStatus`, `AuditSubject`, `MapsItem`, `MapsResult`, `OrganicResult`, `ReputationResult`, `GridPoint`, `GridResult`, `SiteResult`, `WebsiteResult`, `Section<T>`, `AuditResults`, `Leak`, `AuditRow`, `AuditSummary`, `summarize(row)`, `isSectionError`, `section()`, `isNoSite()`, `normalizeName`, `domainOf`, `normalizeWebsite`, `matchSubject`, `competitors`, `gridPoints`, `summarizeGrid`, `auditStatus`, `auditLeaks(results, city)`, `TIER_SCAN_CAP`, `scanCapFor`, `scansRemaining`, `DEFAULT_AUDIT_INTERVAL_DAYS`, `auditDue`, `STATE_NAMES`, `auditLocation`, `splitCity`, `baselineFromAudit`, `reportFillPatch`, `defaultKeyword`, `validateSubjectInput`, `validateAuditSettingsInput`, `AuditSettingsInput`, `isAuditTrigger`.

- [ ] **Step 1: Add the schema**

In `lib/db.ts`, directly after the line `await sql\`CREATE INDEX IF NOT EXISTS email_log_time_idx ON email_log (created_at DESC);\`;` add:

```ts
      // Business audits (lib/audits.ts): one dated snapshot of a business's Google
      // and website standing, for clients (schedule / admin / client scans) and prospects.
      await sql`
        CREATE TABLE IF NOT EXISTS audits (
          id SERIAL PRIMARY KEY,
          onboarding_id INTEGER REFERENCES onboardings(id) ON DELETE SET NULL,
          call_lead_id INTEGER REFERENCES call_leads(id) ON DELETE SET NULL,
          subject JSONB NOT NULL,
          trigger TEXT NOT NULL CHECK (trigger IN ('schedule', 'admin', 'client')),
          status TEXT NOT NULL CHECK (status IN ('complete', 'partial', 'failed')),
          results JSONB NOT NULL DEFAULT '{}'::jsonb,
          leaks JSONB NOT NULL DEFAULT '[]'::jsonb,
          errors JSONB NOT NULL DEFAULT '{}'::jsonb,
          raw JSONB,
          cost_usd NUMERIC(8,4) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS audits_onboarding_idx ON audits (onboarding_id, created_at DESC);`;
      await sql`CREATE INDEX IF NOT EXISTS audits_lead_idx ON audits (call_lead_id, created_at DESC);`;
      await sql`CREATE INDEX IF NOT EXISTS audits_month_idx ON audits (created_at);`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_city TEXT;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_website TEXT;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_place_id TEXT;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_cid TEXT;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_lat DOUBLE PRECISION;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_lng DOUBLE PRECISION;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_grid BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_interval_days INTEGER NOT NULL DEFAULT 14;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audits_enabled BOOLEAN NOT NULL DEFAULT true;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS client_scan_cap INTEGER;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS baseline_audit_id INTEGER;`;
```

- [ ] **Step 2: Write the failing tests** — create `lib/auditShared.test.ts`:

```ts
// lib/auditShared.test.ts
// Run with: npx tsx --test lib/auditShared.test.ts   (no database needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditDue,
  auditLeaks,
  auditLocation,
  auditStatus,
  baselineFromAudit,
  competitors,
  defaultKeyword,
  domainOf,
  gridPoints,
  matchSubject,
  normalizeName,
  normalizeWebsite,
  reportFillPatch,
  scanCapFor,
  scansRemaining,
  splitCity,
  summarizeGrid,
  validateAuditSettingsInput,
  validateSubjectInput,
  type AuditResults,
  type MapsItem,
} from './auditShared';

const item = (o: Partial<MapsItem> & { rank: number; name: string }): MapsItem => ({
  domain: null, url: null, rating: null, reviews: null, placeId: null, cid: null, lat: null, lng: null, categories: [], gbpUrl: null, ...o,
});
const subject = { business: "Joe's Auto Spa, LLC", website: 'subjectspa.com', placeId: null, cid: null };

test('normalizeName drops punctuation and business suffixes', () => {
  assert.equal(normalizeName("Joe's Auto Spa, LLC"), 'joe s auto spa');
  assert.equal(normalizeName('The Shine Co.'), 'shine');
  assert.equal(normalizeName('A & B Detailing Inc'), 'a and b detailing');
});

test('domainOf and normalizeWebsite accept a bare domain and strip www', () => {
  assert.equal(domainOf('subjectspa.com'), 'subjectspa.com');
  assert.equal(domainOf('https://www.SubjectSpa.com/about'), 'subjectspa.com');
  assert.equal(domainOf(''), null);
  assert.equal(domainOf('not a url at all :'), null);
  assert.equal(normalizeWebsite('subjectspa.com'), 'https://subjectspa.com');
  assert.equal(normalizeWebsite('http://subjectspa.com/x'), 'http://subjectspa.com/x');
  assert.equal(normalizeWebsite(null), null);
});

test('matchSubject prefers place id, then domain, then a tolerant name match', () => {
  const items = [
    item({ rank: 1, name: 'Example Shine Co', domain: 'example-shine.test', placeId: 'p1' }),
    item({ rank: 4, name: 'Joes Auto Spa', domain: 'www.subjectspa.com', placeId: 'p4' }),
    item({ rank: 9, name: 'Other Joes Auto Spa North', placeId: 'p9' }),
  ];
  assert.equal(matchSubject({ ...subject, placeId: 'p9' }, items)?.matchedBy, 'placeId');
  assert.equal(matchSubject(subject, items)?.item.rank, 4);
  assert.equal(matchSubject(subject, items)?.matchedBy, 'domain');
  const byName = matchSubject({ ...subject, website: null }, items);
  assert.equal(byName?.item.rank, 4);
  assert.equal(byName?.matchedBy, 'name');
  assert.equal(matchSubject({ business: 'Nope Detailing', website: null, placeId: null, cid: null }, items), null);
  // Short names must not match by containment ("Spa" is inside everything).
  assert.equal(matchSubject({ business: 'Spa', website: null, placeId: null, cid: null }, items), null);
});

test('competitors keeps the top 3 and appends the subject when it is lower', () => {
  const items = [item({ rank: 1, name: 'A' }), item({ rank: 2, name: 'B' }), item({ rank: 3, name: 'C' }), item({ rank: 7, name: 'Me' })];
  const rows = competitors(items, items[3]);
  assert.deepEqual(rows.map((r) => [r.rank, r.self ?? false]), [[1, false], [2, false], [3, false], [7, true]]);
  const inTop = competitors(items.slice(0, 3), items[1]);
  assert.equal(inTop.length, 3);
  assert.equal(inTop[1].self, true);
});

test('gridPoints is a 5×5 square one mile apart, centred on the pin', () => {
  const pts = gridPoints(41.73, -93.6);
  assert.equal(pts.length, 25);
  assert.deepEqual(pts[12], { lat: 41.73, lng: -93.6 });
  assert.ok(pts[0].lat > pts[24].lat, 'first row is north');
  assert.ok(pts[0].lng < pts[4].lng, 'first column is west');
  assert.ok(Math.abs(pts[7].lat - pts[12].lat - 1 / 69) < 1e-4);
});

test('summarizeGrid counts nulls as not-top-3 and averages only found points', () => {
  const points = [
    { lat: 0, lng: 0, rank: 1 }, { lat: 0, lng: 0, rank: 3 }, { lat: 0, lng: 0, rank: 8 }, { lat: 0, lng: 0, rank: null },
  ];
  const g = summarizeGrid(points, 1, 2);
  assert.equal(g.top3Share, 0.5);
  assert.equal(g.avgRank, 4);
  assert.equal(summarizeGrid([], 1, 0).avgRank, null);
});

test('auditStatus is complete / partial / failed by section errors', () => {
  const ok: AuditResults = { maps: { found: true, rank: 2, matchedBy: 'name', searched: { keyword: 'k', location: 'l' }, top: [] } };
  assert.equal(auditStatus(ok), 'complete');
  assert.equal(auditStatus({ ...ok, website: { error: 'down' } }), 'partial');
  assert.equal(auditStatus({ maps: { error: 'x' }, website: { error: 'y' } }), 'failed');
  assert.equal(auditStatus({}), 'failed');
});

const results: AuditResults = {
  maps: {
    found: true, rank: 7, matchedBy: 'domain', searched: { keyword: 'auto detailing', location: 'Ankeny,Iowa,United States' },
    top: [
      { rank: 1, name: 'A', rating: 4.9, reviews: 212, website: null },
      { rank: 2, name: 'B', rating: 4.8, reviews: 140, website: null },
      { rank: 3, name: 'C', rating: 4.7, reviews: 98, website: null },
      { rank: 7, name: 'Me', rating: 4.6, reviews: 18, website: 'subject-spa.test', self: true },
    ],
  },
  organic: { rank: null, domain: 'subject-spa.test', top: [] },
  reputation: { rating: 4.6, reviews: 18, categories: [], gbpUrl: null, placeId: null },
  grid: { spacingMiles: 1, size: 5, points: [], top3Share: 0.32, avgRank: 6.4 },
  website: { url: 'https://subject-spa.test/', https: true, pagespeedMobile: 41, lcpMs: 4800, clickToCall: false, form: true, title: 'Home', metaDescription: null, schema: [] },
};

test('auditLeaks builds at most five sentences from the numbers, highest severity first', () => {
  const leaks = auditLeaks(results, 'Ankeny');
  assert.equal(leaks.length, 5);
  assert.equal(leaks[0].severity, 'high');
  assert.match(leaks[0].headline, /#7 on Maps/);
  assert.match(leaks[0].detail, /average 150 reviews; you have 18/);
  assert.ok(leaks.some((l) => /tap-to-call/.test(l.headline)));
  assert.ok(leaks.some((l) => /32% of Ankeny/.test(l.headline)));
  const order = ['high', 'medium', 'low'];
  assert.ok(leaks.every((l, i) => i === 0 || order.indexOf(l.severity) >= order.indexOf(leaks[i - 1].severity)));
});

test('auditLeaks: not found, no website, and errored sections', () => {
  const notFound = auditLeaks({ maps: { found: false, rank: null, matchedBy: null, searched: { keyword: 'k', location: 'l' }, top: [] }, website: { none: true } }, 'Ames');
  assert.match(notFound[0].headline, /isn't showing you for "k" in Ames/);
  assert.ok(notFound.some((l) => l.headline === 'No website'));
  assert.deepEqual(auditLeaks({ maps: { error: 'x' }, website: { error: 'y' } }, 'Ames'), []);
});

test('scan caps come from the tier unless overridden', () => {
  assert.equal(scanCapFor('essentials', null), 0);
  assert.equal(scanCapFor('axeoncore', null), 3);
  assert.equal(scanCapFor('axeongrowth', null), 10);
  assert.equal(scanCapFor('axeoncore', 0), 0);
  assert.equal(scansRemaining(3, 3), 0);
  assert.equal(scansRemaining(5, 3), 0);
});

test('auditDue: first run, then every interval', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  assert.equal(auditDue(null, 14, now), true);
  assert.equal(auditDue('2026-10-07T12:00:00Z', 14, now), false);
  assert.equal(auditDue('2026-10-06T11:00:00Z', 14, now), true);
  assert.equal(auditDue('2026-10-19T00:00:00Z', 0, now), true, 'interval floors at one day');
});

test('auditLocation and splitCity', () => {
  assert.equal(auditLocation('Ankeny', 'IA'), 'Ankeny,Iowa,United States');
  assert.equal(auditLocation('Ankeny, IA', 'ia'), 'Ankeny,Iowa,United States');
  assert.throws(() => auditLocation('Ankeny', 'Iowa'), /two-letter/);
  assert.throws(() => auditLocation('', 'IA'), /City/);
  assert.deepEqual(splitCity('Ankeny, IA'), { city: 'Ankeny', state: 'IA' });
  assert.deepEqual(splitCity('Des Moines'), { city: 'Des Moines', state: 'IA' });
});

test('baselineFromAudit ignores client scans and unfound businesses', () => {
  assert.deepEqual(baselineFromAudit({ trigger: 'admin', results }), { rank: 7, keyword: 'auto detailing' });
  assert.equal(baselineFromAudit({ trigger: 'client', results }), null);
  assert.equal(baselineFromAudit({ trigger: 'schedule', results: { maps: { found: false, rank: null, matchedBy: null, searched: { keyword: 'k', location: 'l' }, top: [] } } }), null);
});

test('reportFillPatch fills only blanks', () => {
  assert.deepEqual(reportFillPatch(null, { results }), { rank: 7, keyword: 'auto detailing', reviews: 18, rating: 4.6 });
  assert.deepEqual(reportFillPatch({ rank: 5, keyword: 'typed', reviews: null, rating: null }, { results }), { reviews: 18, rating: 4.6 });
  assert.deepEqual(reportFillPatch({ rank: 5, keyword: 'typed', reviews: 20, rating: 4.9 }, { results }), {});
});

test('defaultKeyword and input validation', () => {
  assert.equal(defaultKeyword('Roofing', 'Des Moines'), 'roofing des moines');
  assert.equal(defaultKeyword('', 'Ames'), 'auto detailing ames');
  const s = validateSubjectInput({ business: ' Joe Spa ', city: 'Ankeny, IA', keyword: 'Auto Detailing', website: 'joespa.com' });
  assert.deepEqual(s, { business: 'Joe Spa', city: 'Ankeny', state: 'IA', website: 'https://joespa.com', keyword: 'auto detailing', placeId: null, cid: null, lat: null, lng: null });
  assert.throws(() => validateSubjectInput({ business: '', city: 'Ankeny', keyword: 'k' }), /business/i);
  assert.throws(() => validateSubjectInput({ business: 'x', city: 'Ankeny', keyword: '' }), /keyword/i);
  const a = validateAuditSettingsInput({ city: 'Ankeny, IA', website: 'old-site.com', grid: false, intervalDays: '7', enabled: true, clientScanCap: '' });
  assert.deepEqual(a, { city: 'Ankeny, IA', website: 'https://old-site.com', grid: false, intervalDays: 7, enabled: true, clientScanCap: null });
  assert.throws(() => validateAuditSettingsInput({ intervalDays: '0' }), /between 1 and 90/);
  assert.throws(() => validateAuditSettingsInput({ clientScanCap: '99' }), /between 0 and 30/);
});
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `npx tsx --test lib/auditShared.test.ts`
Expected: FAIL — `Cannot find module './auditShared'`.

- [ ] **Step 4: Create `lib/auditShared.ts`**

```ts
// lib/auditShared.ts
// Business audits: the shapes one audit stores and every pure rule around them
// (matching the business in Google's results, the 5×5 grid maths, the
// money-leak sentences, scan caps, when the next scheduled audit is due).
// Client-safe: no Node imports, so the dashboard, the admin and the tests can
// all import it. Spec: docs/superpowers/specs/2026-10-12-business-audit-design.md
import type { OnboardingTier } from '@/data/onboardingItems';

// ───────────────────────────── Shapes ─────────────────────────────

export const AUDIT_TRIGGERS = ['schedule', 'admin', 'client'] as const;
export type AuditTrigger = (typeof AUDIT_TRIGGERS)[number];
export const isAuditTrigger = (v: unknown): v is AuditTrigger => typeof v === 'string' && (AUDIT_TRIGGERS as readonly string[]).includes(v);
export type AuditStatus = 'complete' | 'partial' | 'failed';

export interface AuditSubject {
  business: string;
  city: string;
  /** Two-letter postal code, "IA". */
  state: string;
  /** Full URL with scheme, or null when the business has no site. */
  website: string | null;
  keyword: string;
  placeId: string | null;
  cid: string | null;
  lat: number | null;
  lng: number | null;
}

/** One Google Maps result, as parsed from DataForSEO (lib/auditParse.ts). */
export interface MapsItem {
  rank: number;
  name: string;
  domain: string | null;
  url: string | null;
  rating: number | null;
  reviews: number | null;
  placeId: string | null;
  cid: string | null;
  lat: number | null;
  lng: number | null;
  categories: string[];
  gbpUrl: string | null;
}

export interface Competitor { rank: number; name: string; rating: number | null; reviews: number | null; website: string | null; self?: true }
export type MatchedBy = 'placeId' | 'domain' | 'name';
export interface MapsResult {
  found: boolean;
  /** 1-based position among Maps results (ads excluded); null when not in the top 20. */
  rank: number | null;
  matchedBy: MatchedBy | null;
  searched: { keyword: string; location: string };
  top: Competitor[];
}
export interface OrganicResult { rank: number | null; domain: string | null; top: Array<{ rank: number; domain: string; title: string }> }
export interface ReputationResult { rating: number | null; reviews: number | null; categories: string[]; gbpUrl: string | null; placeId: string | null }
export interface GridPoint { lat: number; lng: number; rank: number | null }
export interface GridResult { spacingMiles: number; size: number; points: GridPoint[]; top3Share: number; avgRank: number | null }
export interface SiteResult {
  none?: false;
  url: string;
  https: boolean;
  pagespeedMobile: number | null;
  lcpMs: number | null;
  clickToCall: boolean;
  form: boolean;
  title: string | null;
  metaDescription: string | null;
  schema: string[];
}
export type WebsiteResult = { none: true } | SiteResult;
export const isNoSite = (w: WebsiteResult): w is { none: true } => 'none' in w && w.none === true;

export type SectionError = { error: string };
export type Section<T> = T | SectionError;
export const isSectionError = (s: unknown): s is SectionError => Boolean(s) && typeof s === 'object' && typeof (s as SectionError).error === 'string';
/** The section's data, or null when it is missing or errored. */
export function section<T>(s: Section<T> | undefined | null): T | null {
  return s && !isSectionError(s) ? (s as T) : null;
}

export interface AuditResults {
  maps?: Section<MapsResult>;
  organic?: Section<OrganicResult>;
  reputation?: Section<ReputationResult>;
  grid?: Section<GridResult>;
  website?: Section<WebsiteResult>;
}

export type LeakSeverity = 'high' | 'medium' | 'low';
export interface Leak { severity: LeakSeverity; headline: string; detail: string }

export interface AuditRow {
  id: number;
  onboardingId: number | null;
  callLeadId: number | null;
  subject: AuditSubject;
  trigger: AuditTrigger;
  status: AuditStatus;
  results: AuditResults;
  leaks: Leak[];
  errors: Record<string, string>;
  costUsd: number;
  createdAt: string;
}

/** One line per audit for history tables and call-deck cards. */
export interface AuditSummary {
  id: number;
  createdAt: string;
  trigger: AuditTrigger;
  status: AuditStatus;
  mapsRank: number | null;
  found: boolean | null;
  rating: number | null;
  reviews: number | null;
  pagespeed: number | null;
  costUsd: number;
}

export function summarize(a: AuditRow): AuditSummary {
  const maps = section(a.results.maps);
  const rep = section(a.results.reputation);
  const web = section(a.results.website);
  return {
    id: a.id,
    createdAt: a.createdAt,
    trigger: a.trigger,
    status: a.status,
    mapsRank: maps?.rank ?? null,
    found: maps ? maps.found : null,
    rating: rep?.rating ?? null,
    reviews: rep?.reviews ?? null,
    pagespeed: web && !isNoSite(web) ? web.pagespeedMobile : null,
    costUsd: a.costUsd,
  };
}

// ───────────────────────────── Matching ─────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(llc|inc|co|corp|ltd|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function domainOf(url: string | null | undefined): string | null {
  const s = (url ?? '').trim();
  if (!s || /\s/.test(s)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    return host.includes('.') ? host : null;
  } catch {
    return null;
  }
}

/** A website as typed ("joespa.com") → a URL we can fetch. */
export function normalizeWebsite(v: string | null | undefined): string | null {
  if (!domainOf(v)) return null;
  const s = (v as string).trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

const MIN_CONTAIN = 4;

export function matchSubject(
  subject: Pick<AuditSubject, 'business' | 'website' | 'placeId' | 'cid'>,
  items: MapsItem[]
): { item: MapsItem; matchedBy: MatchedBy } | null {
  if (subject.placeId || subject.cid) {
    const hit = items.find((i) => (subject.placeId && i.placeId === subject.placeId) || (subject.cid && i.cid === subject.cid));
    if (hit) return { item: hit, matchedBy: 'placeId' };
  }
  const dom = domainOf(subject.website);
  if (dom) {
    const hit = items.find((i) => domainOf(i.domain) === dom);
    if (hit) return { item: hit, matchedBy: 'domain' };
  }
  const want = normalizeName(subject.business);
  if (want) {
    const hit = items.find((i) => {
      const have = normalizeName(i.name);
      if (have === want) return true;
      if (want.length < MIN_CONTAIN || have.length < MIN_CONTAIN) return false;
      return have.includes(want) || want.includes(have);
    });
    if (hit) return { item: hit, matchedBy: 'name' };
  }
  return null;
}

/** The top 3 results, plus the subject's own row when it sits further down. */
export function competitors(items: MapsItem[], self: MapsItem | null): Competitor[] {
  const row = (i: MapsItem): Competitor => ({ rank: i.rank, name: i.name, rating: i.rating, reviews: i.reviews, website: i.domain, ...(self && i === self ? { self: true as const } : {}) });
  const top = items.filter((i) => i.rank <= 3).map(row);
  if (self && self.rank > 3) top.push(row(self));
  return top;
}

// ───────────────────────────── Grid ─────────────────────────────

export const GRID_SIZE = 5;
export const GRID_SPACING_MILES = 1;

/** Row-major, north to south then west to east; the centre point is the pin itself. */
export function gridPoints(lat: number, lng: number, size = GRID_SIZE, spacingMiles = GRID_SPACING_MILES): Array<{ lat: number; lng: number }> {
  const half = (size - 1) / 2;
  const dLat = spacingMiles / 69;
  const dLng = spacingMiles / (69.172 * Math.cos((lat * Math.PI) / 180));
  const pts: Array<{ lat: number; lng: number }> = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      pts.push({ lat: Number((lat + (half - r) * dLat).toFixed(6)), lng: Number((lng + (c - half) * dLng).toFixed(6)) });
    }
  }
  return pts;
}

export function summarizeGrid(points: GridPoint[], spacingMiles = GRID_SPACING_MILES, size = GRID_SIZE): GridResult {
  const n = points.length || 1;
  const inTop3 = points.filter((p) => p.rank !== null && p.rank <= 3).length;
  const found = points.filter((p): p is GridPoint & { rank: number } => p.rank !== null);
  const avgRank = found.length ? Math.round((found.reduce((s, p) => s + p.rank, 0) / found.length) * 10) / 10 : null;
  return { spacingMiles, size, points, top3Share: Math.round((inTop3 / n) * 100) / 100, avgRank };
}

// ───────────────────────────── Status & leaks ─────────────────────────────

export function auditStatus(results: AuditResults): AuditStatus {
  const sections = Object.values(results).filter(Boolean);
  if (sections.length === 0) return 'failed';
  const errors = sections.filter(isSectionError).length;
  return errors === 0 ? 'complete' : errors === sections.length ? 'failed' : 'partial';
}

const avg = (xs: Array<number | null>): number | null => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const SEVERITY_ORDER: Record<LeakSeverity, number> = { high: 0, medium: 1, low: 2 };

/**
 * Up to five "money leaks", each built only from measured numbers, in the
 * spec's rule order (§6). Sections that errored contribute nothing.
 */
export function auditLeaks(results: AuditResults, city: string): Leak[] {
  const out: Leak[] = [];
  const maps = section(results.maps);
  const rep = section(results.reputation);
  const grid = section(results.grid);
  const org = section(results.organic);
  const web = section(results.website);
  const kw = maps?.searched.keyword ?? '';
  const top3 = maps?.top.filter((c) => !c.self && c.rank <= 3) ?? [];
  const top3Reviews = avg(top3.map((c) => c.reviews));
  const top3Rating = avg(top3.map((c) => c.rating));
  const myReviews = rep?.reviews ?? null;
  const myRating = rep?.rating ?? null;

  if (maps && !maps.found) {
    out.push({
      severity: 'high',
      headline: `Google isn't showing you for "${kw}" in ${city}`,
      detail: `You're not in the top 20 Maps results.${top3.length ? ` The top 3 are ${top3.map((c) => c.name).join(', ')}.` : ''}`,
    });
  } else if (maps && maps.rank !== null && maps.rank > 3) {
    out.push({
      severity: 'high',
      headline: `You're #${maps.rank} on Maps for "${kw}"`,
      detail:
        top3Reviews !== null && myReviews !== null
          ? `Most people call one of the top 3. They average ${Math.round(top3Reviews)} reviews; you have ${myReviews}.`
          : 'Most people call one of the top 3.',
    });
  } else if (maps && maps.found && top3Reviews !== null && myReviews !== null && myReviews < top3Reviews / 2) {
    out.push({
      severity: 'medium',
      headline: `You're in the top 3 with ${myReviews} reviews`,
      detail: `The others average ${Math.round(top3Reviews)}. A thin review count is the easiest way to lose the spot.`,
    });
  }
  if (myRating !== null && myRating < 4.5 && top3Rating !== null && myRating < top3Rating) {
    out.push({ severity: 'medium', headline: `Your rating is ${myRating.toFixed(1)}`, detail: `The top 3 average ${top3Rating.toFixed(1)}. People compare stars before they compare anything else.` });
  }
  if (grid && grid.top3Share < 0.5) {
    out.push({
      severity: 'medium',
      headline: `You're in the top 3 from only ${Math.round(grid.top3Share * 100)}% of ${city}`,
      detail: `Measured from ${grid.points.length || grid.size * grid.size} points around your shop, ${grid.spacingMiles} mile apart.`,
    });
  }
  if (web && isNoSite(web)) {
    out.push({ severity: 'high', headline: 'No website', detail: 'Google and customers have nothing to send people to.' });
  } else if (web) {
    if (!web.https) out.push({ severity: 'high', headline: 'Your site isn’t secure (no https)', detail: 'Browsers label it “Not secure” and Google ranks it lower.' });
    if (!web.clickToCall) out.push({ severity: 'high', headline: 'No tap-to-call button', detail: 'On a phone, nobody can call you with one tap.' });
    if (!web.form) out.push({ severity: 'medium', headline: 'No contact form', detail: 'People who won’t call have no way to reach you.' });
    if (web.pagespeedMobile !== null && web.pagespeedMobile < 50) {
      out.push({
        severity: 'medium',
        headline: `Mobile speed score ${web.pagespeedMobile}/100`,
        detail: web.lcpMs ? `The page takes ${(web.lcpMs / 1000).toFixed(1)}s to show its main content on a phone.` : 'Slow pages lose people before they load.',
      });
    }
    if (!web.title || !web.metaDescription) out.push({ severity: 'low', headline: 'Missing page title or description', detail: 'That’s the text Google shows under your name in search results.' });
    if (!web.schema.some((t) => /business|service|organization/i.test(t))) out.push({ severity: 'low', headline: 'No business markup on the site', detail: 'Structured data tells Google what you do and where.' });
    if (org && org.rank === null) out.push({ severity: 'low', headline: `Your site doesn't show in regular Google results for "${kw}"`, detail: 'Not in the top 20 web results; Maps is the only place people can find it.' });
  }
  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 5);
}

// ───────────────────────────── Caps & schedule ─────────────────────────────

/** Client self-scans per month, by plan (owner decision 2026-10-12). */
export const TIER_SCAN_CAP: Record<OnboardingTier, number> = { essentials: 0, axeoncore: 3, axeongrowth: 10 };
export const scanCapFor = (tier: OnboardingTier, override: number | null | undefined): number => override ?? TIER_SCAN_CAP[tier];
export const scansRemaining = (used: number, cap: number): number => Math.max(0, cap - used);

export const DEFAULT_AUDIT_INTERVAL_DAYS = 14;
/** Is a scheduled audit due? Always on the first run; then once the interval has passed. */
export function auditDue(lastScheduledAt: string | null, intervalDays: number, now: number = Date.now()): boolean {
  if (!lastScheduledAt) return true;
  return now - Date.parse(lastScheduledAt) >= Math.max(1, intervalDays) * 86_400_000;
}

// ───────────────────────────── Location ─────────────────────────────

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

/** "Ankeny, IA" → { city: "Ankeny", state: "IA" }; a bare city defaults to Iowa. */
export function splitCity(v: string): { city: string; state: string } {
  const m = v.trim().match(/^(.*?)(?:,\s*([A-Za-z]{2}))?$/);
  return { city: (m?.[1] ?? v).trim(), state: (m?.[2] ?? 'IA').toUpperCase() };
}

/** The DataForSEO location name: "Ankeny,Iowa,United States". */
export function auditLocation(city: string, state: string): string {
  const name = STATE_NAMES[state.trim().toUpperCase()];
  if (!name) throw new Error('State must be a two-letter code like IA');
  const c = splitCity(city).city;
  if (!c) throw new Error('City is required');
  return `${c},${name},United States`;
}

// ───────────────────────────── Baseline & report fill ─────────────────────────────

/** What an audit contributes to the 90-day baseline: nothing from client scans or unfound businesses. */
export function baselineFromAudit(a: Pick<AuditRow, 'trigger' | 'results'>): { rank: number; keyword: string } | null {
  if (a.trigger === 'client') return null;
  const m = section(a.results.maps);
  return m && m.found && m.rank !== null ? { rank: m.rank, keyword: m.searched.keyword } : null;
}

export interface ReportFill { rank: number | null; keyword: string; reviews: number | null; rating: number | null }
/** Fills only the report fields Axeon left blank; typed values always win. */
export function reportFillPatch(existing: ReportFill | null, a: Pick<AuditRow, 'results'>): Partial<ReportFill> {
  const m = section(a.results.maps);
  const r = section(a.results.reputation);
  const patch: Partial<ReportFill> = {};
  if ((existing?.rank ?? null) === null && m && m.found && m.rank !== null) patch.rank = m.rank;
  if (!existing?.keyword && m) patch.keyword = m.searched.keyword;
  if ((existing?.reviews ?? null) === null && r && r.reviews !== null) patch.reviews = r.reviews;
  if ((existing?.rating ?? null) === null && r && r.rating !== null) patch.rating = r.rating;
  return patch;
}

/** The call deck's prefilled keyword: "<niche> <city>", lower case. */
export const defaultKeyword = (niche: string, city: string): string =>
  `${(niche || 'auto detailing').trim()} ${city.trim()}`.toLowerCase().replace(/\s+/g, ' ').trim();

// ───────────────────────────── Input validation ─────────────────────────────

const text = (raw: Record<string, unknown>, k: string, max: number) => (typeof raw[k] === 'string' ? (raw[k] as string).trim().slice(0, max) : '');

/** A prospect audit form or a call-deck card → a subject; throws a readable message. */
export function validateSubjectInput(raw: Record<string, unknown>): AuditSubject {
  const business = text(raw, 'business', 160);
  if (!business) throw new Error('Which business? The name is required.');
  const cityRaw = text(raw, 'city', 80);
  if (!cityRaw) throw new Error('City is required.');
  const split = splitCity(cityRaw);
  const state = (text(raw, 'state', 2) || split.state).toUpperCase();
  if (!STATE_NAMES[state]) throw new Error('State must be a two-letter code like IA.');
  const keyword = text(raw, 'keyword', 120).toLowerCase();
  if (!keyword) throw new Error('Keyword is required, e.g. "auto detailing".');
  const websiteRaw = text(raw, 'website', 300);
  if (websiteRaw && !domainOf(websiteRaw)) throw new Error('That website address does not look right.');
  return { business, city: split.city, state, website: normalizeWebsite(websiteRaw), keyword, placeId: null, cid: null, lat: null, lng: null };
}

export interface AuditSettingsInput { city: string | null; website: string | null; grid: boolean; intervalDays: number; enabled: boolean; clientScanCap: number | null }

export function validateAuditSettingsInput(raw: Record<string, unknown>): AuditSettingsInput {
  const city = text(raw, 'city', 80) || null;
  const websiteRaw = text(raw, 'website', 300);
  if (websiteRaw && !domainOf(websiteRaw)) throw new Error('That website address does not look right.');
  const intervalRaw = raw.intervalDays === undefined || raw.intervalDays === '' ? DEFAULT_AUDIT_INTERVAL_DAYS : Number(raw.intervalDays);
  if (!Number.isInteger(intervalRaw) || intervalRaw < 1 || intervalRaw > 90) throw new Error('Audit every N days must be between 1 and 90');
  let clientScanCap: number | null = null;
  if (raw.clientScanCap !== undefined && raw.clientScanCap !== null && raw.clientScanCap !== '') {
    const n = Number(raw.clientScanCap);
    if (!Number.isInteger(n) || n < 0 || n > 30) throw new Error('Scans per month must be between 0 and 30');
    clientScanCap = n;
  }
  return { city, website: normalizeWebsite(websiteRaw), grid: raw.grid !== false && raw.grid !== 'false', intervalDays: intervalRaw, enabled: raw.enabled !== false && raw.enabled !== 'false', clientScanCap };
}
```

- [ ] **Step 5: Run the tests**

Run: `npx tsx --test lib/auditShared.test.ts`
Expected: all PASS. If an `auditLeaks` sentence differs, fix the template, not the test (the test pins the copy).

- [ ] **Step 6: Register the test and type-check**

In `package.json`, append ` lib/auditShared.test.ts` to the end of the `test:onboarding` script string. Run `npm run lint` → no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/db.ts lib/auditShared.ts lib/auditShared.test.ts package.json
git commit -m "Audits: schema, shared types and pure rules

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 2: DataForSEO client, response parsers, HTML checks

**Files:**
- Create: `lib/dataforseo.ts`
- Create: `lib/auditParse.ts`, `lib/auditParse.test.ts`
- Create: `lib/auditHtml.ts`, `lib/auditHtml.test.ts`
- Create: `lib/__fixtures__/dataforseo/maps.json`, `lib/__fixtures__/dataforseo/organic.json`, `lib/__fixtures__/dataforseo/business_info.json`
- Modify: `package.json` (`test:onboarding`)

**Interfaces:**
- Consumes: `MapsItem` from Task 1.
- Produces: `dataForSeoConfigured(): boolean`, `NOT_CONFIGURED: string`, `class DataForSeoError extends Error { code: number | null; isLocation: boolean }`, `interface DfsTask { status_code; status_message; cost; result: unknown[] | null }`, `dfsPost(path, tasks, timeoutMs?) → Promise<{ task: DfsTask; raw: unknown }>`, `trimTask(task): DfsTask` (first 20 items), `parseMapsItems(result: unknown): MapsItem[]`, `parseOrganicItems(result: unknown): Array<{ rank; domain; title }>`, `parseBusinessInfo(result: unknown): MapsItem | null`, `htmlChecks(html): HtmlChecks`, `interface HtmlChecks { clickToCall; form; title; metaDescription; schema }`, `isPrivateAddress(ip): boolean`, `isPublicHostname(host): boolean`.

- [ ] **Step 1: Fixtures** — create the three JSON files (synthetic data, shaped like DataForSEO v3 responses):

`lib/__fixtures__/dataforseo/maps.json`
```json
{
  "status_code": 20000, "status_message": "Ok.", "cost": 0.002,
  "tasks": [{ "status_code": 20000, "status_message": "Ok.", "cost": 0.002, "result": [{ "keyword": "auto detailing", "items": [
    { "type": "maps_paid_item", "rank_group": 1, "rank_absolute": 1, "title": "Sponsored Shine", "domain": "ads.test" },
    { "type": "maps_search", "rank_group": 1, "rank_absolute": 2, "title": "Example Shine Co", "domain": "example-shine.test", "url": "https://example-shine.test/", "rating": { "value": 4.9, "votes_count": 212 }, "place_id": "ChIJex1", "cid": "111", "latitude": 41.731, "longitude": -93.601, "category": "Car detailing service", "additional_categories": ["Car wash"] },
    { "type": "maps_search", "rank_group": 2, "rank_absolute": 3, "title": "Sample Detail Works", "domain": null, "url": null, "rating": { "value": 4.8, "votes_count": 140 }, "place_id": "ChIJex2", "cid": 222, "latitude": 41.72, "longitude": -93.61, "category": "Car detailing service" },
    { "type": "maps_search", "rank_group": 3, "rank_absolute": 4, "title": "Demo Mobile Detail", "domain": "demo-detail.test", "rating": { "value": 4.7, "votes_count": 98 }, "place_id": "ChIJex3", "cid": "333", "latitude": 41.74, "longitude": -93.59, "category": "Car detailing service" },
    { "type": "maps_search", "rank_group": 7, "rank_absolute": 8, "title": "Joes Auto Spa", "domain": "www.subjectspa.com", "url": "https://www.subjectspa.com/", "rating": { "value": 4.6, "votes_count": 18 }, "place_id": "ChIJsubj", "cid": "777", "latitude": 41.735, "longitude": -93.605, "category": "Car detailing service" }
  ] }] }]
}
```

`lib/__fixtures__/dataforseo/organic.json`
```json
{
  "status_code": 20000, "status_message": "Ok.", "cost": 0.002,
  "tasks": [{ "status_code": 20000, "status_message": "Ok.", "cost": 0.002, "result": [{ "keyword": "auto detailing", "items": [
    { "type": "local_pack", "rank_group": 1, "rank_absolute": 1, "title": "Example Shine Co" },
    { "type": "organic", "rank_group": 1, "rank_absolute": 2, "domain": "yelp.test", "title": "Top 10 Best Auto Detailing in Ankeny", "url": "https://yelp.test/x" },
    { "type": "organic", "rank_group": 2, "rank_absolute": 3, "domain": "www.subjectspa.com", "title": "Joe's Auto Spa | Ankeny", "url": "https://www.subjectspa.com/" }
  ] }] }]
}
```

`lib/__fixtures__/dataforseo/business_info.json`
```json
{
  "status_code": 20000, "status_message": "Ok.", "cost": 0.003,
  "tasks": [{ "status_code": 20000, "status_message": "Ok.", "cost": 0.003, "result": [{ "keyword": "Joes Auto Spa Ankeny", "items": [
    { "type": "google_business_info", "title": "Joes Auto Spa", "domain": "subjectspa.com", "url": "https://subjectspa.com/", "rating": { "value": 4.6, "votes_count": 18 }, "place_id": "ChIJsubj", "cid": "777", "latitude": 41.735, "longitude": -93.605, "category": "Car detailing service", "additional_categories": ["Car wash"] }
  ] }] }]
}
```

- [ ] **Step 2: Failing parser tests** — create `lib/auditParse.test.ts`:

```ts
// lib/auditParse.test.ts
// Run with: npx tsx --test lib/auditParse.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBusinessInfo, parseMapsItems, parseOrganicItems } from './auditParse';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => JSON.parse(readFileSync(path.join(here, '__fixtures__', 'dataforseo', name), 'utf8')) as { tasks: Array<{ result: unknown[] }> };
const result = (name: string) => fixture(name).tasks[0].result[0];

test('parseMapsItems skips ads, uses rank_group, and normalises rating / cid / categories', () => {
  const items = parseMapsItems(result('maps.json'));
  assert.deepEqual(items.map((i) => [i.rank, i.name]), [[1, 'Example Shine Co'], [2, 'Sample Detail Works'], [3, 'Demo Mobile Detail'], [7, 'Joes Auto Spa']]);
  assert.equal(items[0].rating, 4.9);
  assert.equal(items[0].reviews, 212);
  assert.equal(items[1].cid, '222', 'numeric cid becomes a string');
  assert.equal(items[1].domain, null);
  assert.deepEqual(items[0].categories, ['Car detailing service', 'Car wash']);
  assert.equal(items[0].gbpUrl, 'https://maps.google.com/?cid=111');
  assert.equal(items[3].lat, 41.735);
});

test('parseMapsItems survives a null result or no items', () => {
  assert.deepEqual(parseMapsItems(null), []);
  assert.deepEqual(parseMapsItems(undefined), []);
  assert.deepEqual(parseMapsItems({ keyword: 'x', items: null }), []);
  assert.deepEqual(parseMapsItems({ items: [{ type: 'maps_search', title: '', rank_group: 1 }] }), [], 'nameless rows are dropped');
});

test('parseOrganicItems keeps organic rows only', () => {
  const rows = parseOrganicItems(result('organic.json'));
  assert.deepEqual(rows, [
    { rank: 1, domain: 'yelp.test', title: 'Top 10 Best Auto Detailing in Ankeny' },
    { rank: 2, domain: 'www.subjectspa.com', title: "Joe's Auto Spa | Ankeny" },
  ]);
  assert.deepEqual(parseOrganicItems(null), []);
});

test('parseBusinessInfo returns one MapsItem (rank 0) or null', () => {
  const b = parseBusinessInfo(result('business_info.json'));
  assert.equal(b?.name, 'Joes Auto Spa');
  assert.equal(b?.reviews, 18);
  assert.equal(b?.placeId, 'ChIJsubj');
  assert.equal(b?.rank, 0);
  assert.equal(parseBusinessInfo({ items: [] }), null);
  assert.equal(parseBusinessInfo(null), null);
});
```

- [ ] **Step 3: Failing HTML tests** — create `lib/auditHtml.test.ts`:

```ts
// lib/auditHtml.test.ts
// Run with: npx tsx --test lib/auditHtml.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlChecks, isPrivateAddress, isPublicHostname } from './auditHtml';

test('htmlChecks finds tel links, forms, title, description and JSON-LD types', () => {
  const html = `<!doctype html><html><head><TITLE> Joe&#39;s Auto Spa &amp; Wash </TITLE>
    <META content='Ankeny detailing since 2010' NAME="description">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"LocalBusiness","name":"x"},{"@type":["WebSite","Thing"]}]}</script>
    <script type='application/ld+json'>not json</script>
    </head><body><A HREF='tel:+15155550100'>Call</A><FORM action="/contact"><input></FORM></body></html>`;
  const c = htmlChecks(html);
  assert.equal(c.clickToCall, true);
  assert.equal(c.form, true);
  assert.equal(c.title, "Joe's Auto Spa & Wash");
  assert.equal(c.metaDescription, 'Ankeny detailing since 2010');
  assert.deepEqual(c.schema, ['LocalBusiness', 'WebSite', 'Thing']);
});

test('htmlChecks on a bare page', () => {
  const c = htmlChecks('<html><body><p>hi</p></body></html>');
  assert.deepEqual(c, { clickToCall: false, form: false, title: null, metaDescription: null, schema: [] });
});

test('isPrivateAddress covers loopback, RFC1918, link-local, CGNAT and IPv6 locals', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:10.0.0.1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '172.32.0.1', '100.128.0.1', '2606:4700::1111']) assert.equal(isPrivateAddress(ip), false, ip);
});

test('isPublicHostname rejects local names', () => {
  assert.equal(isPublicHostname('localhost'), false);
  assert.equal(isPublicHostname('db.internal'), false);
  assert.equal(isPublicHostname('printer.local'), false);
  assert.equal(isPublicHostname('subjectspa.com'), true);
});
```

- [ ] **Step 4: Run both test files; expect module-not-found failures**

Run: `npx tsx --test lib/auditParse.test.ts lib/auditHtml.test.ts`

- [ ] **Step 5: Create `lib/dataforseo.ts`**

```ts
// lib/dataforseo.ts
// The only file that talks to DataForSEO (https://api.dataforseo.com/v3). Basic
// auth from DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD; DATAFORSEO_BASE can point at
// the sandbox (https://sandbox.api.dataforseo.com) to build without spending.
// Every call is a POST of a one-task array; the task's `cost` is what we record.
export const NOT_CONFIGURED = "DataForSEO isn't connected — add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Vercel";

export class DataForSeoError extends Error {
  constructor(message: string, readonly code: number | null = null) {
    super(message);
    this.name = 'DataForSeoError';
  }
  /** Bad or unknown location: stop the run before any more paid calls. */
  get isLocation(): boolean {
    return /location/i.test(this.message);
  }
}

export const dataForSeoConfigured = (): boolean => Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);

export interface DfsTask {
  status_code: number;
  status_message: string;
  cost: number;
  result: unknown[] | null;
}

interface DfsResponse {
  status_code?: number;
  status_message?: string;
  tasks?: DfsTask[];
}

const friendlyTaskError = (t: DfsTask): string =>
  /location/i.test(t.status_message)
    ? `DataForSEO doesn't know that location — check the city spelling, or use the nearest larger city (${t.status_message})`
    : t.status_message || 'DataForSEO task failed';

export async function dfsPost(path: string, tasks: Record<string, unknown>[], timeoutMs = 60_000): Promise<{ task: DfsTask; raw: unknown }> {
  if (!dataForSeoConfigured()) throw new DataForSeoError(NOT_CONFIGURED);
  const base = (process.env.DATAFORSEO_BASE || 'https://api.dataforseo.com').replace(/\/$/, '');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
    body: JSON.stringify(tasks),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = (await res.json().catch(() => null)) as DfsResponse | null;
  if (res.status === 401) throw new DataForSeoError('DataForSEO rejected the login — check DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD', 401);
  if (!res.ok || !json) throw new DataForSeoError(`DataForSEO HTTP ${res.status}`, res.status);
  if (json.status_code !== 20000) throw new DataForSeoError(json.status_message || 'DataForSEO error', json.status_code ?? null);
  const task = json.tasks?.[0];
  if (!task) throw new DataForSeoError('DataForSEO returned no task');
  if (task.status_code !== 20000) throw new DataForSeoError(friendlyTaskError(task), task.status_code);
  return { task, raw: json };
}

/** What we store: the task's status and cost, and the first 20 items of its first result. */
export function trimTask(task: DfsTask): DfsTask {
  const first = (task.result?.[0] ?? null) as (Record<string, unknown> & { items?: unknown }) | null;
  const items = first && Array.isArray(first.items) ? first.items.slice(0, 20) : [];
  return { status_code: task.status_code, status_message: task.status_message, cost: task.cost, result: first ? [{ ...first, items }] : null };
}
```

- [ ] **Step 6: Create `lib/auditParse.ts`**

```ts
// lib/auditParse.ts
// DataForSEO result shapes → our MapsItem / organic rows. Pure, so the parsers
// are tested on saved fixtures (lib/__fixtures__/dataforseo) without network.
import type { MapsItem } from '@/lib/auditShared';

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : null);
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const items = (result: unknown): Rec[] => {
  const r = rec(result);
  return r && Array.isArray(r.items) ? (r.items as unknown[]).map(rec).filter((x): x is Rec => x !== null) : [];
};

function toMapsItem(i: Rec, rank: number): MapsItem | null {
  const name = str(i.title);
  if (!name) return null;
  const rating = rec(i.rating);
  const cid = str(i.cid);
  const categories = [str(i.category), ...(Array.isArray(i.additional_categories) ? i.additional_categories.map(str) : [])].filter(Boolean);
  return {
    rank,
    name,
    domain: str(i.domain) || null,
    url: str(i.url) || null,
    rating: num(rating?.value),
    reviews: num(rating?.votes_count),
    placeId: str(i.place_id) || null,
    cid: cid || null,
    lat: num(i.latitude),
    lng: num(i.longitude),
    categories,
    gbpUrl: cid ? `https://maps.google.com/?cid=${cid}` : null,
  };
}

/** Maps results in order; ads (`maps_paid_item`) are skipped and `rank_group` is the position people see among real listings. */
export function parseMapsItems(result: unknown): MapsItem[] {
  return items(result)
    .filter((i) => i.type === 'maps_search')
    .map((i) => toMapsItem(i, num(i.rank_group) ?? num(i.rank_absolute) ?? 0))
    .filter((i): i is MapsItem => i !== null && i.rank > 0)
    .sort((a, b) => a.rank - b.rank);
}

export function parseOrganicItems(result: unknown): Array<{ rank: number; domain: string; title: string }> {
  return items(result)
    .filter((i) => i.type === 'organic')
    .map((i) => ({ rank: num(i.rank_group) ?? num(i.rank_absolute) ?? 0, domain: str(i.domain), title: str(i.title) }))
    .filter((i) => i.rank > 0 && i.domain)
    .sort((a, b) => a.rank - b.rank);
}

/** The business-info lookup returns one listing (or none). Rank is 0: it is not a ranking call. */
export function parseBusinessInfo(result: unknown): MapsItem | null {
  const first = items(result)[0];
  return first ? toMapsItem(first, 0) : null;
}
```

- [ ] **Step 7: Create `lib/auditHtml.ts`**

```ts
// lib/auditHtml.ts
// What we read off a business's homepage ourselves (no third party): tap-to-call,
// a form, title, meta description, JSON-LD types. Plus the address checks that
// keep the site fetch from reaching anything private. Pure; tested on strings.

export interface HtmlChecks {
  clickToCall: boolean;
  form: boolean;
  title: string | null;
  metaDescription: string | null;
  schema: string[];
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function collectTypes(node: unknown, out: string[]): void {
  if (Array.isArray(node)) return node.forEach((n) => collectTypes(n, out));
  if (!node || typeof node !== 'object') return;
  const o = node as Record<string, unknown>;
  const t = o['@type'];
  if (typeof t === 'string') out.push(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.push(x));
  if (o['@graph']) collectTypes(o['@graph'], out);
}

export function htmlChecks(html: string): HtmlChecks {
  const h = html.slice(0, 2_000_000);
  const titleRaw = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  let metaDescription: string | null = null;
  for (const tag of h.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']?description["']?/i.test(tag)) continue;
    const c = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const v = decode(c?.[1] ?? c?.[2] ?? c?.[3] ?? '');
    if (v) {
      metaDescription = v;
      break;
    }
  }
  const schema: string[] = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h))) {
    try {
      collectTypes(JSON.parse(m[1].trim()), schema);
    } catch {
      // not JSON: ignore the block
    }
  }
  return {
    clickToCall: /\bhref\s*=\s*["']?tel:/i.test(h),
    form: /<form[\s>]/i.test(h),
    title: decode(titleRaw) || null,
    metaDescription,
    schema: Array.from(new Set(schema)),
  };
}

/** Loopback, RFC 1918, link-local, CGNAT, "this network", and the IPv6 equivalents (incl. v4-mapped). */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v6 = ip.toLowerCase();
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

export function isPublicHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false;
  if (/^[\d.]+$/.test(h) || h.includes(':')) return !isPrivateAddress(h); // a literal IP
  return true;
}
```

- [ ] **Step 8: Run the tests**

Run: `npx tsx --test lib/auditParse.test.ts lib/auditHtml.test.ts`
Expected: all PASS.

- [ ] **Step 9: Register tests, lint, commit**

Append ` lib/auditParse.test.ts lib/auditHtml.test.ts` to `test:onboarding` in `package.json`. Run `npm run lint`.

```bash
git add lib/dataforseo.ts lib/auditParse.ts lib/auditParse.test.ts lib/auditHtml.ts lib/auditHtml.test.ts lib/__fixtures__ package.json
git commit -m "Audits: DataForSEO client, result parsers and homepage checks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 3: The six sources

**Files:**
- Create: `lib/auditSources.ts`

**Interfaces:**
- Consumes: `dfsPost`, `trimTask`, `DataForSeoError` (Task 2); `parseMapsItems`, `parseOrganicItems`, `parseBusinessInfo` (Task 2); `htmlChecks`, `isPrivateAddress`, `isPublicHostname` (Task 2); `MapsItem`, `AuditSubject`, `GridResult`, `gridPoints`, `summarizeGrid`, `matchSubject` (Task 1).
- Produces: `type SourceResult<T> = { ok: true; data: T; cost: number; raw: unknown } | { ok: false; error: string }`; `mapsSearch(keyword, where: { location?: string; coordinate?: { lat; lng } })`, `organicSearch(keyword, location)`, `businessInfo(query)`, `gridSearch(keyword, subject, center, search?)`, `pageSpeed(url)`, `siteCheck(url)`, `interface Sources { mapsSearch; organicSearch; businessInfo; gridSearch; pageSpeed; siteCheck }`, `defaultSources: Sources`.

No unit test of its own (every function is network-bound); the parsing and matching underneath are tested in Tasks 1–2, and `gridSearch`'s failure maths is tested in Task 4 through its injectable `search` parameter.

- [ ] **Step 1: Create `lib/auditSources.ts`**

```ts
// lib/auditSources.ts
// The six measurements one audit is made of. Each returns ok/data/cost/raw or
// ok:false/error and never throws past its boundary, so lib/audits.ts can keep
// going when one of them fails. Maps, organic, business info and the grid are
// DataForSEO (paid per call); PageSpeed and the homepage check are free.
import dns from 'node:dns/promises';
import { DataForSeoError, dfsPost, trimTask } from '@/lib/dataforseo';
import { htmlChecks, isPrivateAddress, isPublicHostname, type HtmlChecks } from '@/lib/auditHtml';
import { parseBusinessInfo, parseMapsItems, parseOrganicItems } from '@/lib/auditParse';
import { gridPoints, matchSubject, summarizeGrid, type AuditSubject, type GridPoint, type GridResult, type MapsItem } from '@/lib/auditShared';

export type SourceResult<T> = { ok: true; data: T; cost: number; raw: unknown } | { ok: false; error: string };
const fail = (err: unknown): { ok: false; error: string } => ({ ok: false, error: err instanceof Error ? err.message : String(err) });

const UA = 'AxeonAuditBot/1.0 (+https://axeonstudio.co)';
const SOURCE_TIMEOUT_MS = 30_000;

// ───────────────────────────── DataForSEO ─────────────────────────────

export interface MapsWhere {
  /** "Ankeny,Iowa,United States" — the canonical rank is always measured this way. */
  location?: string;
  /** A grid point; DataForSEO takes "lat,lng,zoom". */
  coordinate?: { lat: number; lng: number };
}

export async function mapsSearch(keyword: string, where: MapsWhere): Promise<SourceResult<MapsItem[]>> {
  try {
    const task = where.coordinate
      ? { keyword, location_coordinate: `${where.coordinate.lat},${where.coordinate.lng},14z`, language_code: 'en', depth: 20 }
      : { keyword, location_name: where.location, language_code: 'en', depth: 20 };
    const { task: t } = await dfsPost('/v3/serp/google/maps/live/advanced', [task]);
    return { ok: true, data: parseMapsItems(t.result?.[0]), cost: t.cost ?? 0, raw: trimTask(t) };
  } catch (err) {
    return fail(err);
  }
}

export async function organicSearch(keyword: string, location: string): Promise<SourceResult<Array<{ rank: number; domain: string; title: string }>>> {
  try {
    const { task: t } = await dfsPost('/v3/serp/google/organic/live/advanced', [{ keyword, location_name: location, language_code: 'en', device: 'mobile', depth: 20 }]);
    return { ok: true, data: parseOrganicItems(t.result?.[0]), cost: t.cost ?? 0, raw: trimTask(t) };
  } catch (err) {
    return fail(err);
  }
}

/** Rating, reviews and the pin for a business Maps did not list in the top 20. */
export async function businessInfo(query: string): Promise<SourceResult<MapsItem | null>> {
  try {
    const { task: t } = await dfsPost('/v3/business_data/google/my_business_info/live', [{ keyword: query, language_code: 'en', location_code: 2840 }]);
    return { ok: true, data: parseBusinessInfo(t.result?.[0]), cost: t.cost ?? 0, raw: trimTask(t) };
  } catch (err) {
    return fail(err);
  }
}

const GRID_CONCURRENCY = 5;

/**
 * The same Maps search from 25 points around the pin. A point that fails or
 * does not list the business is null; the section fails only when more than
 * half the points failed. `search` is injectable for tests.
 */
export async function gridSearch(
  keyword: string,
  subject: Pick<AuditSubject, 'business' | 'website' | 'placeId' | 'cid'>,
  center: { lat: number; lng: number },
  search: typeof mapsSearch = mapsSearch
): Promise<SourceResult<GridResult>> {
  const pts = gridPoints(center.lat, center.lng);
  const points: GridPoint[] = pts.map((p) => ({ ...p, rank: null }));
  let cost = 0;
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < pts.length; i += GRID_CONCURRENCY) {
    const batch = pts.slice(i, i + GRID_CONCURRENCY);
    const results = await Promise.all(batch.map((p) => search(keyword, { coordinate: p })));
    results.forEach((r, j) => {
      if (!r.ok) {
        failed += 1;
        if (errors.length < 3) errors.push(r.error);
        return;
      }
      cost += r.cost;
      points[i + j].rank = matchSubject(subject, r.data)?.item.rank ?? null;
    });
    // A location/credentials error repeats 25 times: stop after the first batch.
    if (failed === batch.length && i === 0) break;
  }
  if (failed > pts.length / 2) return { ok: false, error: `Grid failed at ${failed} of ${pts.length} points: ${errors[0] ?? 'unknown error'}` };
  return { ok: true, data: summarizeGrid(points), cost, raw: { points: pts.length, failed, errors } };
}

// ───────────────────────────── Free sources ─────────────────────────────

export async function pageSpeed(url: string): Promise<SourceResult<{ score: number | null; lcpMs: number | null }>> {
  try {
    const key = process.env.PAGESPEED_API_KEY ? `&key=${encodeURIComponent(process.env.PAGESPEED_API_KEY)}` : '';
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${key}`, {
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, { numericValue?: number }> };
    } | null;
    if (!res.ok || !json?.lighthouseResult) throw new Error(json?.error?.message || `PageSpeed answered ${res.status}`);
    const score = json.lighthouseResult.categories?.performance?.score;
    const lcp = json.lighthouseResult.audits?.['largest-contentful-paint']?.numericValue;
    return {
      ok: true,
      data: { score: typeof score === 'number' ? Math.round(score * 100) : null, lcpMs: typeof lcp === 'number' ? Math.round(lcp) : null },
      cost: 0,
      raw: { score, lcp },
    };
  } catch (err) {
    return fail(err);
  }
}

async function assertPublic(url: URL): Promise<void> {
  if (!/^https?:$/.test(url.protocol)) throw new Error('Only http(s) sites can be checked');
  if (!isPublicHostname(url.hostname)) throw new Error('That address is not a public website');
  const { address } = await dns.lookup(url.hostname);
  if (isPrivateAddress(address)) throw new Error('That address is not a public website');
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    n += value.length;
    if (n >= max) {
      await reader.cancel();
      break;
    }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchPublic(url: string, hops = 0): Promise<{ finalUrl: string; html: string }> {
  if (hops > 3) throw new Error('Too many redirects');
  const u = new URL(url);
  await assertPublic(u);
  const res = await fetch(u, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,*/*;q=0.8' }, signal: AbortSignal.timeout(10_000) });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (!loc) throw new Error(`Redirect without a destination (${res.status})`);
    return fetchPublic(new URL(loc, u).toString(), hops + 1);
  }
  if (!res.ok) throw new Error(`The site answered ${res.status}`);
  return { finalUrl: u.toString(), html: await readCapped(res, 2_000_000) };
}

export async function siteCheck(url: string): Promise<SourceResult<{ finalUrl: string; https: boolean } & HtmlChecks>> {
  try {
    const { finalUrl, html } = await fetchPublic(url);
    return { ok: true, data: { finalUrl, https: finalUrl.startsWith('https://'), ...htmlChecks(html) }, cost: 0, raw: { finalUrl, bytes: html.length } };
  } catch (err) {
    return fail(err);
  }
}

export interface Sources {
  mapsSearch: typeof mapsSearch;
  organicSearch: typeof organicSearch;
  businessInfo: typeof businessInfo;
  gridSearch: typeof gridSearch;
  pageSpeed: typeof pageSpeed;
  siteCheck: typeof siteCheck;
}
export const defaultSources: Sources = { mapsSearch, organicSearch, businessInfo, gridSearch, pageSpeed, siteCheck };

export { DataForSeoError };
```

- [ ] **Step 2: Type-check and commit**

Run `npm run lint`.

```bash
git add lib/auditSources.ts
git commit -m "Audits: Maps, organic, business info, grid, PageSpeed and homepage sources

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 4: Orchestrator and database layer

**Files:**
- Create: `lib/audits.ts`
- Create: `lib/audits.test.ts`
- Modify: `package.json` (`test:onboarding`)

**Interfaces:**
- Consumes: everything from Tasks 1–3; `sql`, `ensureSchema`, `isDatabaseConfigured` from `lib/db.ts`; `monthOf` from `lib/siteStats.ts` (returns `'YYYY-MM'` in `America/Chicago`); `Onboarding` from `lib/onboarding.ts`.
- Produces: `composeAudit(subject, { grid, sources? }) → Promise<Composed>`; `runAudit(subject, { trigger, onboardingId?, callLeadId?, grid }) → Promise<AuditRow>`; `monthlyCapUsd()`, `monthSpendUsd(month?)`, `assertBudget()`; `getAudit(id, withRaw?)`, `listAuditsForOnboarding(id, limit?)`, `listProspectAudits(q, limit?)`, `deleteAudit(id)`, `latestAuditByLead() → Map<number, AuditSummary>`, `latestOfficialAuditInMonth(onboardingId, month)`, `clientScansUsed(onboardingId, month)`, `lastScheduledAt(onboardingId)`; `interface AuditSettings`, `getAuditSettings(onboardingId)`, `setAuditSettings(onboardingId, input: AuditSettingsInput)`, `subjectForOnboarding(o, settings): AuditSubject`; `applyBaseline(onboardingId, audit, force) → Promise<boolean>`; `attachAuditToOnboarding(auditId, onboardingId) → Promise<{ audit; baselineSet }>`.

- [ ] **Step 1: Failing tests** — create `lib/audits.test.ts`:

```ts
// lib/audits.test.ts
// Run with: npx tsx --test lib/audits.test.ts   (composeAudit with fake sources; no network, no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeAudit } from './audits';
import { gridSearch, type SourceResult, type Sources } from './auditSources';
import { section, type AuditSubject, type MapsItem } from './auditShared';

const item = (o: Partial<MapsItem> & { rank: number; name: string }): MapsItem => ({
  domain: null, url: null, rating: null, reviews: null, placeId: null, cid: null, lat: null, lng: null, categories: [], gbpUrl: null, ...o,
});
const subject: AuditSubject = { business: 'Joes Auto Spa', city: 'Ankeny', state: 'IA', website: 'https://subjectspa.com', keyword: 'auto detailing', placeId: null, cid: null, lat: null, lng: null };
const mapsItems = [
  item({ rank: 1, name: 'Example Shine Co', rating: 4.9, reviews: 212, placeId: 'p1' }),
  item({ rank: 2, name: 'Sample Detail Works', rating: 4.8, reviews: 140 }),
  item({ rank: 3, name: 'Demo Mobile Detail', rating: 4.7, reviews: 98 }),
  item({ rank: 7, name: 'Joes Auto Spa', domain: 'www.subjectspa.com', rating: 4.6, reviews: 18, placeId: 'ChIJsubj', cid: '777', lat: 41.735, lng: -93.605 }),
];
const ok = <T,>(data: T, cost = 0.002): SourceResult<T> => ({ ok: true, data, cost, raw: { fixture: true } });
const bad = (error: string): SourceResult<never> => ({ ok: false, error });

const fakes = (over: Partial<Sources> = {}): Sources => ({
  mapsSearch: async () => ok(mapsItems),
  organicSearch: async () => ok([{ rank: 1, domain: 'yelp.test', title: 'Top 10' }, { rank: 4, domain: 'www.subjectspa.com', title: 'Joes' }]),
  businessInfo: async () => ok(null, 0.003),
  gridSearch: async () => ok({ spacingMiles: 1, size: 5, points: [], top3Share: 0.4, avgRank: 5 }, 0.05),
  pageSpeed: async () => ok({ score: 41, lcpMs: 4800 }, 0),
  siteCheck: async () => ok({ finalUrl: 'https://subjectspa.com/', https: true, clickToCall: false, form: true, title: 'Home', metaDescription: null, schema: [] }, 0),
  ...over,
});

test('composeAudit: every section filled, pin learned, cost summed, leaks built', async () => {
  const c = await composeAudit(subject, { grid: true, sources: fakes() });
  assert.equal(c.status, 'complete');
  assert.equal(section(c.results.maps)?.rank, 7);
  assert.equal(section(c.results.maps)?.matchedBy, 'domain');
  assert.equal(section(c.results.organic)?.rank, 4);
  assert.equal(section(c.results.reputation)?.reviews, 18);
  assert.equal(section(c.results.grid)?.top3Share, 0.4);
  const web = section(c.results.website);
  assert.ok(web && !('none' in web));
  assert.equal(c.costUsd, 0.054);
  assert.deepEqual(c.learned, { placeId: 'ChIJsubj', cid: '777', lat: 41.735, lng: -93.605 });
  assert.equal(c.subject.placeId, 'ChIJsubj');
  assert.ok(c.leaks.length > 0);
  assert.deepEqual(Object.keys(c.raw).sort(), ['grid', 'maps', 'organic']);
});

test('composeAudit: not found → business info fills reputation; no website → website none, no organic/pagespeed calls', async () => {
  let organicCalls = 0;
  const c = await composeAudit(
    { ...subject, business: 'Nobody Detailing', website: null },
    { grid: false, sources: fakes({ organicSearch: async () => { organicCalls += 1; return ok([]); }, businessInfo: async () => ok(item({ rank: 0, name: 'Nobody Detailing', rating: 4.2, reviews: 5, placeId: 'pX', lat: 1, lng: 2 }), 0.003) }) }
  );
  assert.equal(section(c.results.maps)?.found, false);
  assert.equal(section(c.results.reputation)?.rating, 4.2);
  assert.deepEqual(c.results.website, { none: true });
  assert.equal(c.results.organic, undefined);
  assert.equal(organicCalls, 0);
  assert.equal(c.results.grid, undefined, 'grid off');
  assert.deepEqual(c.learned, { placeId: 'pX', cid: null, lat: 1, lng: 2 });
});

test('composeAudit: a location error stops the run before more paid calls', async () => {
  let organicCalls = 0;
  const c = await composeAudit(subject, {
    grid: true,
    sources: fakes({ mapsSearch: async () => bad("DataForSEO doesn't know that location — check the city spelling"), organicSearch: async () => { organicCalls += 1; return ok([]); } }),
  });
  assert.equal(c.status, 'failed');
  assert.match(c.errors.maps, /location/);
  assert.equal(organicCalls, 0);
  assert.equal(c.costUsd, 0);
});

test('composeAudit: one failing section makes the audit partial, and a grid without a pin errors cleanly', async () => {
  const noPin = mapsItems.map((i) => ({ ...i, lat: null, lng: null }));
  const c = await composeAudit(subject, { grid: true, sources: fakes({ mapsSearch: async () => ok(noPin), pageSpeed: async () => bad('PageSpeed answered 500') }) });
  assert.equal(c.status, 'partial');
  assert.match(c.errors.grid, /finds the business first/);
  assert.equal(c.errors.pagespeed, 'PageSpeed answered 500');
  const web = section(c.results.website);
  assert.ok(web && !('none' in web) && web.pagespeedMobile === null && web.form === true, 'site checks still recorded without PageSpeed');
});

test('gridSearch: failed points are null; more than half failing fails the section; a dead first batch stops early', async () => {
  let calls = 0;
  const flaky: Sources['mapsSearch'] = async (_k, where) => {
    calls += 1;
    const lng = where.coordinate?.lng ?? 0;
    return lng < -93.6 ? bad('timeout') : ok(mapsItems);
  };
  const g = await gridSearch('auto detailing', subject, { lat: 41.735, lng: -93.605 }, flaky);
  assert.ok(g.ok);
  assert.equal(g.data.points.length, 25);
  assert.ok(g.data.points.some((p) => p.rank === null) && g.data.points.some((p) => p.rank === 7));
  assert.equal(calls, 25);

  calls = 0;
  const dead = await gridSearch('auto detailing', subject, { lat: 41.735, lng: -93.605 }, async () => { calls += 1; return bad('DataForSEO rejected the login'); });
  assert.equal(dead.ok, false);
  assert.equal(calls, 5, 'stops after the first batch when every point fails');
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx tsx --test lib/audits.test.ts` → FAIL, `Cannot find module './audits'`.

- [ ] **Step 3: Create `lib/audits.ts`**

```ts
// lib/audits.ts
// Business audits: run one (composeAudit → the six sources, then one row in
// `audits`), and everything the admin, the cron, the monthly report and the
// client's Scan button need to read or change around them. The pure rules are
// in lib/auditShared.ts. Spec: docs/superpowers/specs/2026-10-12-business-audit-design.md
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import type { Onboarding } from '@/lib/onboarding';
import { monthOf } from '@/lib/siteStats';
import { defaultSources, type Sources } from '@/lib/auditSources';
import {
  auditLeaks,
  auditLocation,
  auditStatus,
  baselineFromAudit,
  competitors,
  domainOf,
  isAuditTrigger,
  matchSubject,
  normalizeWebsite,
  splitCity,
  summarize,
  type AuditResults,
  type AuditRow,
  type AuditSettingsInput,
  type AuditStatus,
  type AuditSubject,
  type AuditSummary,
  type AuditTrigger,
  type Leak,
  type MapsItem,
  type WebsiteResult,
} from '@/lib/auditShared';

export type { AuditRow, AuditSubject, AuditSummary } from '@/lib/auditShared';

// ───────────────────────────── Compose ─────────────────────────────

export interface Learned { placeId: string | null; cid: string | null; lat: number | null; lng: number | null }
export interface Composed {
  subject: AuditSubject;
  results: AuditResults;
  leaks: Leak[];
  errors: Record<string, string>;
  status: AuditStatus;
  costUsd: number;
  raw: Record<string, unknown>;
  learned: Learned | null;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;
/** Errors that would repeat on every call: stop before spending more. */
const FATAL = /location|isn't connected|rejected the login/i;

const learn = (i: MapsItem): Learned => ({ placeId: i.placeId, cid: i.cid, lat: i.lat, lng: i.lng });

/** The whole measurement, no database: Maps first (it tells us if the location is valid and where the pin is), then the rest in parallel, then the grid. */
export async function composeAudit(subject: AuditSubject, opts: { grid: boolean; sources?: Partial<Sources> }): Promise<Composed> {
  const S: Sources = { ...defaultSources, ...opts.sources };
  const results: AuditResults = {};
  const errors: Record<string, string> = {};
  const raw: Record<string, unknown> = {};
  let cost = 0;
  let learned: Learned | null = null;
  const city = splitCity(subject.city).city;

  const finish = (): Composed => ({
    subject: { ...subject, ...(learned ?? {}) },
    results,
    leaks: auditLeaks(results, city),
    errors,
    status: auditStatus(results),
    costUsd: round4(cost),
    raw,
    learned,
  });

  let location: string;
  try {
    location = auditLocation(subject.city, subject.state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.maps = { error: msg };
    errors.maps = msg;
    return finish();
  }

  const maps = await S.mapsSearch(subject.keyword, { location });
  let self: MapsItem | null = null;
  if (maps.ok) {
    cost += maps.cost;
    raw.maps = maps.raw;
    const m = matchSubject(subject, maps.data);
    self = m?.item ?? null;
    results.maps = { found: Boolean(m), rank: self?.rank ?? null, matchedBy: m?.matchedBy ?? null, searched: { keyword: subject.keyword, location }, top: competitors(maps.data, self) };
    if (self) learned = learn(self);
  } else {
    results.maps = { error: maps.error };
    errors.maps = maps.error;
    if (FATAL.test(maps.error)) return finish();
  }

  const website = normalizeWebsite(subject.website);
  const domain = domainOf(website);
  const [org, ps, sc, bi] = await Promise.all([
    website ? S.organicSearch(subject.keyword, location) : null,
    website ? S.pageSpeed(website) : null,
    website ? S.siteCheck(website) : null,
    maps.ok && !self ? S.businessInfo(`${subject.business} ${city}`) : null,
  ]);

  if (org) {
    if (org.ok) {
      cost += org.cost;
      raw.organic = org.raw;
      const hit = domain ? org.data.find((i) => domainOf(i.domain) === domain) : undefined;
      results.organic = { rank: hit?.rank ?? null, domain, top: org.data.slice(0, 3) };
    } else {
      results.organic = { error: org.error };
      errors.organic = org.error;
    }
  }

  if (self) {
    results.reputation = { rating: self.rating, reviews: self.reviews, categories: self.categories, gbpUrl: self.gbpUrl, placeId: self.placeId };
  } else if (bi) {
    if (bi.ok) {
      cost += bi.cost;
      raw.businessInfo = bi.raw;
      const b = bi.data;
      results.reputation = b
        ? { rating: b.rating, reviews: b.reviews, categories: b.categories, gbpUrl: b.gbpUrl, placeId: b.placeId }
        : { rating: null, reviews: null, categories: [], gbpUrl: null, placeId: null };
      if (b && !learned) learned = learn(b);
    } else {
      results.reputation = { error: bi.error };
      errors.reputation = bi.error;
    }
  }

  if (!website) {
    results.website = { none: true };
  } else {
    const checks = sc && sc.ok ? sc.data : null;
    const speed = ps && ps.ok ? ps.data : null;
    if (!checks && !speed) {
      const e = (sc && !sc.ok ? sc.error : '') || (ps && !ps.ok ? ps.error : 'Website check failed');
      results.website = { error: e };
      errors.website = e;
    } else {
      const site: WebsiteResult = {
        url: checks?.finalUrl ?? website,
        https: checks ? checks.https : website.startsWith('https://'),
        pagespeedMobile: speed?.score ?? null,
        lcpMs: speed?.lcpMs ?? null,
        clickToCall: checks?.clickToCall ?? false,
        form: checks?.form ?? false,
        title: checks?.title ?? null,
        metaDescription: checks?.metaDescription ?? null,
        schema: checks?.schema ?? [],
      };
      results.website = site;
      if (ps && !ps.ok) errors.pagespeed = ps.error;
      if (sc && !sc.ok) errors.siteCheck = sc.error;
    }
  }

  if (opts.grid) {
    const center =
      learned?.lat != null && learned.lng != null ? { lat: learned.lat, lng: learned.lng } : subject.lat != null && subject.lng != null ? { lat: subject.lat, lng: subject.lng } : null;
    if (!center) {
      const e = 'Run one audit that finds the business first, so we know where it is.';
      results.grid = { error: e };
      errors.grid = e;
    } else {
      const g = await S.gridSearch(subject.keyword, { ...subject, ...(learned ?? {}) }, center);
      if (g.ok) {
        cost += g.cost;
        raw.grid = g.raw;
        results.grid = g.data;
      } else {
        results.grid = { error: g.error };
        errors.grid = g.error;
      }
    }
  }
  return finish();
}

// ───────────────────────────── Budget ─────────────────────────────

export const monthlyCapUsd = (): number => {
  const n = Number(process.env.AUDIT_MONTHLY_CAP_USD);
  return Number.isFinite(n) && n > 0 ? n : 25;
};

export async function monthSpendUsd(month: string = monthOf()): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureSchema();
  const res = await sql<{ spent: string | null }>`
    SELECT SUM(cost_usd)::text AS spent FROM audits WHERE to_char(created_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};
  `;
  return Number(res.rows[0]?.spent ?? 0);
}

export async function assertBudget(): Promise<void> {
  const cap = monthlyCapUsd();
  if ((await monthSpendUsd()) >= cap) throw new Error(`This month's audit budget ($${cap}) is used up. Raise AUDIT_MONTHLY_CAP_USD or wait for the 1st.`);
}

// ───────────────────────────── Rows ─────────────────────────────

interface Row {
  id: number;
  onboarding_id: number | null;
  call_lead_id: number | null;
  subject: AuditSubject;
  trigger: string;
  status: AuditStatus;
  results: AuditResults;
  leaks: Leak[];
  errors: Record<string, string>;
  raw?: unknown;
  cost_usd: string | number;
  created_at: string;
}

const toRow = (r: Row): AuditRow => ({
  id: r.id,
  onboardingId: r.onboarding_id,
  callLeadId: r.call_lead_id,
  subject: r.subject,
  trigger: isAuditTrigger(r.trigger) ? r.trigger : 'admin',
  status: r.status,
  results: r.results ?? {},
  leaks: Array.isArray(r.leaks) ? r.leaks : [],
  errors: r.errors ?? {},
  costUsd: Number(r.cost_usd),
  createdAt: new Date(r.created_at).toISOString(),
});

const COLS = 'id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at';

export async function getAudit(id: number, withRaw = false): Promise<(AuditRow & { raw?: unknown }) | null> {
  await ensureSchema();
  const res = withRaw
    ? await sql<Row>`SELECT * FROM audits WHERE id = ${id} LIMIT 1;`
    : await sql<Row>`SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at FROM audits WHERE id = ${id} LIMIT 1;`;
  const r = res.rows[0];
  if (!r) return null;
  return withRaw ? { ...toRow(r), raw: r.raw ?? null } : toRow(r);
}

export async function listAuditsForOnboarding(onboardingId: number, limit = 60): Promise<AuditRow[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<Row>`
    SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at
    FROM audits WHERE onboarding_id = ${onboardingId} ORDER BY created_at DESC, id DESC LIMIT ${limit};
  `;
  return res.rows.map(toRow);
}

/** Audits not attached to a client, newest first, optionally filtered by business or city. */
export async function listProspectAudits(q = '', limit = 100): Promise<AuditRow[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const like = `%${q.trim()}%`;
  const res = await sql<Row>`
    SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at
    FROM audits
    WHERE onboarding_id IS NULL AND (${q.trim() === ''} OR subject->>'business' ILIKE ${like} OR subject->>'city' ILIKE ${like})
    ORDER BY created_at DESC, id DESC LIMIT ${limit};
  `;
  return res.rows.map(toRow);
}

export async function deleteAudit(id: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM audits WHERE id = ${id};`;
}

/** The newest audit per call-deck lead, for the card's one-line summary. */
export async function latestAuditByLead(): Promise<Map<number, AuditSummary>> {
  const out = new Map<number, AuditSummary>();
  if (!isDatabaseConfigured()) return out;
  await ensureSchema();
  const res = await sql<Row>`
    SELECT DISTINCT ON (call_lead_id) id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at
    FROM audits WHERE call_lead_id IS NOT NULL ORDER BY call_lead_id, created_at DESC;
  `;
  for (const r of res.rows) if (r.call_lead_id) out.set(r.call_lead_id, summarize(toRow(r)));
  return out;
}

/** The newest schedule/admin audit created in `month` (Central time); client scans never count. */
export async function latestOfficialAuditInMonth(onboardingId: number, month: string): Promise<AuditRow | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<Row>`
    SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at
    FROM audits
    WHERE onboarding_id = ${onboardingId} AND trigger IN ('schedule', 'admin') AND status <> 'failed'
      AND to_char(created_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month}
    ORDER BY created_at DESC LIMIT 1;
  `;
  return res.rows[0] ? toRow(res.rows[0]) : null;
}

export async function clientScansUsed(onboardingId: number, month: string = monthOf()): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureSchema();
  const res = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n FROM audits
    WHERE onboarding_id = ${onboardingId} AND trigger = 'client' AND status <> 'failed'
      AND to_char(created_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};
  `;
  return res.rows[0]?.n ?? 0;
}

export async function lastScheduledAt(onboardingId: number): Promise<string | null> {
  await ensureSchema();
  const res = await sql<{ at: string | null }>`SELECT MAX(created_at)::text AS at FROM audits WHERE onboarding_id = ${onboardingId} AND trigger = 'schedule';`;
  return res.rows[0]?.at ? new Date(res.rows[0].at).toISOString() : null;
}

// ───────────────────────────── Per-client settings ─────────────────────────────

export interface AuditSettings {
  city: string | null;
  website: string | null;
  /** The existing Main keyword (onboardings.baseline_keyword). */
  keyword: string | null;
  grid: boolean;
  intervalDays: number;
  enabled: boolean;
  clientScanCap: number | null;
  placeId: string | null;
  cid: string | null;
  lat: number | null;
  lng: number | null;
  baselineAuditId: number | null;
}

interface SettingsRow {
  audit_city: string | null;
  audit_website: string | null;
  baseline_keyword: string | null;
  audit_grid: boolean;
  audit_interval_days: number;
  audits_enabled: boolean;
  client_scan_cap: number | null;
  audit_place_id: string | null;
  audit_cid: string | null;
  audit_lat: number | null;
  audit_lng: number | null;
  baseline_audit_id: number | null;
}

const EMPTY_SETTINGS: AuditSettings = { city: null, website: null, keyword: null, grid: true, intervalDays: 14, enabled: true, clientScanCap: null, placeId: null, cid: null, lat: null, lng: null, baselineAuditId: null };

export async function getAuditSettings(onboardingId: number): Promise<AuditSettings> {
  if (!isDatabaseConfigured()) return EMPTY_SETTINGS;
  await ensureSchema();
  const res = await sql<SettingsRow>`
    SELECT audit_city, audit_website, baseline_keyword, audit_grid, audit_interval_days, audits_enabled, client_scan_cap,
           audit_place_id, audit_cid, audit_lat, audit_lng, baseline_audit_id
    FROM onboardings WHERE id = ${onboardingId} LIMIT 1;
  `;
  const r = res.rows[0];
  if (!r) return EMPTY_SETTINGS;
  return {
    city: r.audit_city,
    website: r.audit_website,
    keyword: r.baseline_keyword,
    grid: r.audit_grid,
    intervalDays: r.audit_interval_days,
    enabled: r.audits_enabled,
    clientScanCap: r.client_scan_cap,
    placeId: r.audit_place_id,
    cid: r.audit_cid,
    lat: r.audit_lat === null ? null : Number(r.audit_lat),
    lng: r.audit_lng === null ? null : Number(r.audit_lng),
    baselineAuditId: r.baseline_audit_id,
  };
}

export async function setAuditSettings(onboardingId: number, s: AuditSettingsInput): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE onboardings SET audit_city = ${s.city}, audit_website = ${s.website}, audit_grid = ${s.grid},
      audit_interval_days = ${s.intervalDays}, audits_enabled = ${s.enabled}, client_scan_cap = ${s.clientScanCap}, updated_at = now()
    WHERE id = ${onboardingId};
  `;
}

/** The client as an audit subject; throws when the admin has not set the city or keyword yet. */
export function subjectForOnboarding(o: Pick<Onboarding, 'businessName' | 'clientName' | 'clientEmail'>, s: AuditSettings): AuditSubject {
  if (!s.city || !s.keyword) throw new Error('Set the audit city and the Main keyword first.');
  const { city, state } = splitCity(s.city);
  return { business: o.businessName || o.clientName || o.clientEmail, city, state, website: s.website, keyword: s.keyword.toLowerCase(), placeId: s.placeId, cid: s.cid, lat: s.lat, lng: s.lng };
}

async function rememberPin(onboardingId: number, l: Learned): Promise<void> {
  await sql`
    UPDATE onboardings SET audit_place_id = COALESCE(${l.placeId}, audit_place_id), audit_cid = COALESCE(${l.cid}, audit_cid),
      audit_lat = COALESCE(${l.lat}, audit_lat), audit_lng = COALESCE(${l.lng}, audit_lng)
    WHERE id = ${onboardingId};
  `;
}

/** Sets baseline_rank (and the keyword if blank) from a schedule/admin audit that found the business. Returns true when it wrote. */
export async function applyBaseline(onboardingId: number, audit: AuditRow, force: boolean): Promise<boolean> {
  const b = baselineFromAudit(audit);
  if (!b) return false;
  await ensureSchema();
  const res = force
    ? await sql`UPDATE onboardings SET baseline_rank = ${b.rank}, baseline_keyword = COALESCE(NULLIF(baseline_keyword, ''), ${b.keyword}), baseline_audit_id = ${audit.id}, updated_at = now() WHERE id = ${onboardingId};`
    : await sql`UPDATE onboardings SET baseline_rank = ${b.rank}, baseline_keyword = COALESCE(NULLIF(baseline_keyword, ''), ${b.keyword}), baseline_audit_id = ${audit.id}, updated_at = now() WHERE id = ${onboardingId} AND baseline_rank IS NULL;`;
  return (res.rowCount ?? 0) > 0;
}

// ───────────────────────────── Run & attach ─────────────────────────────

export interface RunOptions { trigger: AuditTrigger; onboardingId?: number | null; callLeadId?: number | null; grid: boolean }

export async function runAudit(subject: AuditSubject, opts: RunOptions): Promise<AuditRow> {
  if (!isDatabaseConfigured()) throw new Error('Audits need the database (POSTGRES_URL).');
  await ensureSchema();
  await assertBudget();
  const c = await composeAudit(subject, { grid: opts.grid });
  const res = await sql<{ id: number }>`
    INSERT INTO audits (onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, raw, cost_usd)
    VALUES (${opts.onboardingId ?? null}, ${opts.callLeadId ?? null}, ${JSON.stringify(c.subject)}::jsonb, ${opts.trigger}, ${c.status},
            ${JSON.stringify(c.results)}::jsonb, ${JSON.stringify(c.leaks)}::jsonb, ${JSON.stringify(c.errors)}::jsonb, ${JSON.stringify(c.raw)}::jsonb, ${c.costUsd})
    RETURNING id;
  `;
  const row = await getAudit(res.rows[0].id);
  if (!row) throw new Error('Audit was not saved');
  if (opts.onboardingId) {
    if (c.learned) await rememberPin(opts.onboardingId, c.learned);
    await applyBaseline(opts.onboardingId, row, false);
  }
  return row;
}

/** A prospect signed: the audit becomes theirs, its city / pin / keyword become their settings, and it sets the baseline if there is none. */
export async function attachAuditToOnboarding(auditId: number, onboardingId: number): Promise<{ audit: AuditRow; baselineSet: boolean }> {
  await ensureSchema();
  const audit = await getAudit(auditId);
  if (!audit) throw new Error('Audit not found');
  const s = audit.subject;
  await sql`UPDATE audits SET onboarding_id = ${onboardingId} WHERE id = ${auditId};`;
  await sql`
    UPDATE onboardings SET audit_city = COALESCE(audit_city, ${`${s.city}, ${s.state}`}), audit_website = COALESCE(audit_website, ${s.website}),
      baseline_keyword = COALESCE(NULLIF(baseline_keyword, ''), ${s.keyword}), audit_place_id = COALESCE(audit_place_id, ${s.placeId}),
      audit_cid = COALESCE(audit_cid, ${s.cid}), audit_lat = COALESCE(audit_lat, ${s.lat}), audit_lng = COALESCE(audit_lng, ${s.lng}), updated_at = now()
    WHERE id = ${onboardingId};
  `;
  const attached = { ...audit, onboardingId };
  const baselineSet = await applyBaseline(onboardingId, attached, false);
  return { audit: attached, baselineSet };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx tsx --test lib/audits.test.ts` → all PASS. (`composeAudit` never touches `sql`, so no database is needed.)

- [ ] **Step 5: Register, lint, commit**

Append ` lib/audits.test.ts` to `test:onboarding`. Run `npm run lint`.

```bash
git add lib/audits.ts lib/audits.test.ts package.json
git commit -m "Audits: composeAudit orchestrator and the audits table layer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 5: Prospect audits — API routes, readout component, Audits tab

**Files:**
- Create: `app/api/admin/audits/route.ts`, `app/api/admin/audits/[id]/route.ts`
- Create: `components/admin/AuditReadout.tsx`
- Create: `components/admin/AuditsConsole.tsx`, `app/admin/audits/page.tsx`
- Modify: `components/admin/AdminNav.tsx` (the `TABS` array)

**Interfaces:**
- Consumes: `runAudit`, `getAudit`, `listProspectAudits`, `deleteAudit`, `attachAuditToOnboarding` (Task 4); `validateSubjectInput`, `summarize`, `section`, `isNoSite`, `isSectionError`, types (Task 1); `requireAdmin` (`lib/adminAuth.ts`), `readBody`, `jsonError` (`lib/billingApi.ts`), `listOnboardings` (`lib/onboarding.ts`), `btn`, `adminInput`, `adminLabel`, `adminMain` (`components/admin/ui.ts`), `auth` (`lib/auth.ts`).
- Produces: `GET /api/admin/audits?q=&limit=` → `{ audits: AuditRow[] }`; `POST /api/admin/audits { business, city, state?, keyword, website?, grid?, callLeadId? }` → `{ audit: AuditRow }`; `GET /api/admin/audits/[id]?raw=1` → `{ audit }`; `POST /api/admin/audits/[id] { action: 'attach', onboardingId }` → `{ audit, baselineSet }`; `DELETE /api/admin/audits/[id]`; `<AuditReadout audit variant />` and `<GridMap grid />` (exported, reused in Tasks 6, 9, 10); `<AuditsConsole initial clients openId />`.

- [ ] **Step 1: Create `app/api/admin/audits/route.ts`**

```ts
// app/api/admin/audits/route.ts
// Admin-only prospect audits (lib/audits.ts).
//   GET  ?q=&limit=                                   audits not attached to a client, newest first
//   POST { business, city, state?, keyword, website?, grid?, callLeadId? }   run one now and save it
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { isDatabaseConfigured } from '@/lib/db';
import { listProspectAudits, runAudit } from '@/lib/audits';
import { validateSubjectInput } from '@/lib/auditShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const noDb = () => NextResponse.json({ error: 'Audits need the database (POSTGRES_URL).' }, { status: 503 });

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isDatabaseConfigured()) return noDb();
  try {
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100));
    return NextResponse.json({ audits: await listProspectAudits(url.searchParams.get('q') ?? '', limit) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isDatabaseConfigured()) return noDb();
  try {
    const body = await readBody(req);
    const subject = validateSubjectInput(body);
    const callLeadId = Number.isInteger(Number(body.callLeadId)) && Number(body.callLeadId) > 0 ? Number(body.callLeadId) : null;
    const audit = await runAudit(subject, { trigger: 'admin', callLeadId, grid: body.grid === true || body.grid === 'true' });
    return NextResponse.json({ audit });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed';
    const status = /budget/.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 2: Create `app/api/admin/audits/[id]/route.ts`**

```ts
// app/api/admin/audits/[id]/route.ts
// One audit: read it (with ?raw=1 for the stored DataForSEO responses), attach
// it to a client who signed, or delete it.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { attachAuditToOnboarding, deleteAudit, getAudit } from '@/lib/audits';
import { getOnboardingById } from '@/lib/onboarding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const idOf = async (ctx: { params: Promise<{ id: string }> }) => {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Which audit?');
  return id;
};

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const audit = await getAudit(await idOf(ctx), new URL(req.url).searchParams.get('raw') === '1');
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const id = await idOf(ctx);
    const body = await readBody(req);
    if (body.action !== 'attach') throw new Error('Unknown action');
    const onboardingId = Number(body.onboardingId);
    if (!Number.isInteger(onboardingId) || onboardingId <= 0) throw new Error('Pick the client to attach this audit to');
    if (!(await getOnboardingById(onboardingId))) throw new Error('That client no longer exists');
    return NextResponse.json(await attachAuditToOnboarding(id, onboardingId));
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    await deleteAudit(await idOf(ctx));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
```

- [ ] **Step 3: Create `components/admin/AuditReadout.tsx`** (server-safe: no hooks, no `'use client'`; usable from both admin client components and the PROOF page)

```tsx
// components/admin/AuditReadout.tsx
// One audit on screen: the money leaks, Maps rank with the top 3, organic rank,
// rating and reviews, the website checklist and the 5×5 grid. Every section
// that did not come back says "not measured" with the reason. `variant`
// 'client' hides cost, match method, raw errors and the location string.
import type { ReactNode } from 'react';
import { isNoSite, isSectionError, section, type AuditResults, type AuditRow, type GridResult, type Leak, type Section } from '@/lib/auditShared';

type Audit = Pick<AuditRow, 'subject' | 'results' | 'leaks' | 'errors' | 'status' | 'costUsd' | 'createdAt' | 'trigger'>;

const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });

const SEVERITY: Record<Leak['severity'], string> = {
  high: 'bg-red-50 text-red-800 border-red-200',
  medium: 'bg-amber-50 text-amber-900 border-amber-200',
  low: 'bg-neutral-50 text-neutral-700 border-neutral-200',
};
const STATUS: Record<Audit['status'], string> = {
  complete: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-800',
  failed: 'bg-red-50 text-red-700',
};

function Block({ title, children, missing }: { title: string; children?: ReactNode; missing?: string | null }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h4>
      {missing ? <p className="mt-2 text-sm text-neutral-500">Not measured — {missing}</p> : <div className="mt-2">{children}</div>}
    </section>
  );
}

const missingOf = <T,>(s: Section<T> | undefined): string | null => (s === undefined ? 'not part of this audit' : isSectionError(s) ? s.error : null);

/** Rank 1–3 green, 4–10 amber, 11–20 orange, not listed grey. */
const cellTone = (rank: number | null) =>
  rank === null ? 'bg-neutral-100 text-neutral-400' : rank <= 3 ? 'bg-emerald-500 text-white' : rank <= 10 ? 'bg-amber-400 text-neutral-900' : 'bg-orange-500 text-white';

export function GridMap({ grid, caption }: { grid: GridResult; caption?: string }) {
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))`, maxWidth: 260 }}>
        {grid.points.map((p, i) => (
          <div key={i} className={`flex aspect-square items-center justify-center rounded text-xs font-bold tabular-nums ${cellTone(p.rank)}`} title={`${p.lat}, ${p.lng}`}>
            {p.rank ?? '–'}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-neutral-700">
        In the top 3 from <b>{Math.round(grid.top3Share * 100)}%</b> of the area
        {grid.avgRank !== null ? <> · average position <b>{grid.avgRank}</b></> : null}
        {caption ? <span className="text-neutral-500"> · {caption}</span> : null}
      </p>
    </div>
  );
}

export function AuditReadout({ audit, variant = 'admin' }: { audit: Audit; variant?: 'admin' | 'client' }) {
  const r: AuditResults = audit.results;
  const maps = section(r.maps);
  const org = section(r.organic);
  const rep = section(r.reputation);
  const grid = section(r.grid);
  const web = section(r.website);
  const admin = variant === 'admin';
  const s = audit.subject;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-bold text-neutral-950">{s.business}</span>
        <span className="text-neutral-600">
          “{s.keyword}” in {s.city}, {s.state}
        </span>
        <span className="text-neutral-500">{when(audit.createdAt)}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS[audit.status]}`}>{audit.status}</span>
        {admin ? <span className="text-xs text-neutral-400">{audit.trigger} · ${audit.costUsd.toFixed(3)}</span> : null}
      </div>

      {audit.leaks.length > 0 ? (
        <ul className="space-y-2">
          {audit.leaks.map((l, i) => (
            <li key={i} className={`rounded-xl border px-4 py-3 ${SEVERITY[l.severity]}`}>
              <p className="font-semibold">{l.headline}</p>
              <p className="mt-0.5 text-sm opacity-90">{l.detail}</p>
            </li>
          ))}
        </ul>
      ) : audit.status !== 'failed' ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Nothing measured here is costing you customers right now.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Google Maps" missing={missingOf(r.maps)}>
          {maps ? (
            <>
              <p className="text-3xl font-bold text-neutral-950">{maps.found && maps.rank !== null ? `#${maps.rank}` : 'Not in top 20'}</p>
              {admin ? <p className="text-xs text-neutral-500">{maps.searched.location}{maps.matchedBy ? ` · matched by ${maps.matchedBy}` : ''}</p> : null}
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {maps.top.map((c) => (
                    <tr key={`${c.rank}-${c.name}`} className={c.self ? 'font-semibold text-blue-800' : 'text-neutral-800'}>
                      <td className="w-8 py-1 tabular-nums">#{c.rank}</td>
                      <td className="py-1">{c.name}{c.self ? ' (you)' : ''}</td>
                      <td className="py-1 text-right tabular-nums text-neutral-600">{c.rating ?? '–'} ★ · {c.reviews ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </Block>

        <Block title="Rating & reviews" missing={missingOf(r.reputation)}>
          {rep ? (
            <>
              <p className="text-3xl font-bold text-neutral-950">
                {rep.rating ?? '–'} <span className="text-base font-semibold text-neutral-500">★ · {rep.reviews ?? '–'} reviews</span>
              </p>
              {rep.categories.length ? <p className="mt-1 text-xs text-neutral-500">{rep.categories.join(' · ')}</p> : null}
              {rep.gbpUrl ? (
                <a href={rep.gbpUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:underline">
                  Open their Google listing
                </a>
              ) : null}
            </>
          ) : null}
        </Block>

        <Block title="Regular Google results" missing={missingOf(r.organic)}>
          {org ? (
            <>
              <p className="text-3xl font-bold text-neutral-950">{org.rank !== null ? `#${org.rank}` : 'Not in top 20'}</p>
              <ol className="mt-2 space-y-1 text-sm text-neutral-700">
                {org.top.map((t) => (
                  <li key={t.rank}>
                    <span className="tabular-nums text-neutral-400">#{t.rank}</span> {t.domain} <span className="text-neutral-500">— {t.title}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </Block>

        <Block title="Website" missing={missingOf(r.website)}>
          {web && isNoSite(web) ? (
            <p className="text-sm font-semibold text-orange-800">No website</p>
          ) : web ? (
            <ul className="space-y-1 text-sm">
              <li className="truncate text-neutral-500">{web.url}</li>
              <Check ok={web.https} label="Secure (https)" />
              <Check ok={web.clickToCall} label="Tap-to-call button" />
              <Check ok={web.form} label="Contact form" />
              <Check ok={web.pagespeedMobile !== null && web.pagespeedMobile >= 50} label={web.pagespeedMobile !== null ? `Mobile speed ${web.pagespeedMobile}/100` : 'Mobile speed not measured'} />
              <Check ok={Boolean(web.title && web.metaDescription)} label="Page title and description" />
              <Check ok={web.schema.some((t) => /business|service|organization/i.test(t))} label={web.schema.length ? `Business markup (${web.schema.join(', ')})` : 'Business markup'} />
            </ul>
          ) : null}
        </Block>
      </div>

      {r.grid !== undefined ? (
        <Block title={`Where you show up across ${s.city}`} missing={missingOf(r.grid)}>
          {grid ? <GridMap grid={grid} caption={`${grid.size}×${grid.size} points, ${grid.spacingMiles} mile apart`} /> : null}
        </Block>
      ) : null}

      {admin && Object.keys(audit.errors).length ? (
        <details className="text-xs text-neutral-500">
          <summary className="cursor-pointer">What did not come back</summary>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(audit.errors).map(([k, v]) => (
              <li key={k}>
                <b>{k}:</b> {v}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-neutral-800' : 'text-red-700'}`}>
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {label}
    </li>
  );
}
```

- [ ] **Step 4: Create `components/admin/AuditsConsole.tsx`**

```tsx
'use client';

// components/admin/AuditsConsole.tsx
// /admin/audits: run an audit on any business (for a sales or onboarding call),
// browse past prospect audits, and attach one to a client who signed.
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { adminInput, adminLabel, btn } from '@/components/admin/ui';
import { AuditReadout } from '@/components/admin/AuditReadout';
import { summarize, type AuditRow } from '@/lib/auditShared';

export interface ClientOption { id: number; label: string }

const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });

export function AuditsConsole({ initial, clients, openId = null }: { initial: AuditRow[]; clients: ClientOption[]; openId?: number | null }) {
  const [audits, setAudits] = useState(initial);
  const [open, setOpen] = useState<number | null>(openId ?? initial[0]?.id ?? null);
  const [form, setForm] = useState({ business: '', city: '', state: 'IA', keyword: '', website: '', grid: false });
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [attachTo, setAttachTo] = useState<string>('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const current = audits.find((a) => a.id === open) ?? null;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? audits.filter((a) => `${a.subject.business} ${a.subject.city}`.toLowerCase().includes(needle)) : audits;
  }, [audits, q]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const res = await fetch('/api/admin/audits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    const json = (await res.json().catch(() => ({}))) as { audit?: AuditRow; error?: string };
    setBusy(false);
    if (!res.ok || !json.audit) return setNotice({ ok: false, text: json.error ?? 'Audit failed.' });
    setAudits((all) => [json.audit as AuditRow, ...all]);
    setOpen(json.audit.id);
    setNotice({ ok: true, text: `Audited ${json.audit.subject.business} ($${json.audit.costUsd.toFixed(3)}).` });
  }

  async function attach() {
    if (!current || !attachTo) return;
    setBusy(true);
    const res = await fetch(`/api/admin/audits/${current.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'attach', onboardingId: Number(attachTo) }) });
    const json = (await res.json().catch(() => ({}))) as { baselineSet?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: json.error ?? 'Could not attach.' });
    setAudits((all) => all.filter((a) => a.id !== current.id));
    setOpen(null);
    setNotice({ ok: true, text: json.baselineSet ? 'Attached, and it set their 90-day baseline.' : 'Attached to the client.' });
  }

  async function remove() {
    if (!current || !window.confirm(`Delete the audit of ${current.subject.business}?`)) return;
    const res = await fetch(`/api/admin/audits/${current.id}`, { method: 'DELETE' });
    if (!res.ok) return setNotice({ ok: false, text: 'Could not delete.' });
    setAudits((all) => all.filter((a) => a.id !== current.id));
    setOpen(null);
  }

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      <input className={adminInput} value={form[k] as string} onChange={set(k)} {...props} />
    </label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <form onSubmit={run} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-bold text-neutral-950">Audit a business</h2>
          <div className="mt-3 grid gap-3">
            {field('business', 'Business', { placeholder: 'Joe’s Auto Spa', required: true })}
            <div className="grid grid-cols-[1fr_72px] gap-2">
              {field('city', 'City', { placeholder: 'Ankeny', required: true })}
              {field('state', 'State', { maxLength: 2 })}
            </div>
            {field('keyword', 'What they want to rank for', { placeholder: 'auto detailing', required: true })}
            {field('website', 'Website (optional)', { placeholder: 'joesautospa.com', inputMode: 'url' })}
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={form.grid} onChange={set('grid')} /> Include the 5×5 city grid (+$0.05, ~1 min)
            </label>
          </div>
          <button type="submit" disabled={busy} className={`${btn('primary')} mt-4 w-full`}>
            {busy ? 'Measuring…' : 'Run audit'}
          </button>
          {notice ? <p className={`mt-2 text-sm font-semibold ${notice.ok ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p> : null}
        </form>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className={`${adminInput} pl-8`} placeholder="Search past audits" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <ul className="mt-3 max-h-[60vh] divide-y divide-neutral-100 overflow-y-auto">
            {shown.map((a) => {
              const s = summarize(a);
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => setOpen(a.id)} className={`w-full px-1 py-2 text-left text-sm hover:bg-neutral-50 ${open === a.id ? 'bg-blue-50' : ''}`}>
                    <span className="font-semibold text-neutral-900">{a.subject.business}</span>
                    <span className="text-neutral-500"> · {a.subject.city}</span>
                    <span className="float-right tabular-nums text-neutral-500">
                      {s.found === false ? 'not found' : s.mapsRank !== null ? `#${s.mapsRank}` : '–'} · {when(a.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 ? <li className="py-6 text-center text-sm text-neutral-500">No audits yet.</li> : null}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
        {current ? (
          <>
            <AuditReadout audit={current} variant="admin" />
            <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-neutral-200 pt-4">
              <label className="block min-w-[220px] flex-1">
                <span className={adminLabel}>They signed? Attach to a client</span>
                <select className={adminInput} value={attachTo} onChange={(e) => setAttachTo(e.target.value)}>
                  <option value="">Pick a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={attach} disabled={!attachTo || busy} className={btn('primary')}>
                Attach as their baseline
              </button>
              <button type="button" onClick={remove} className={btn('danger')}>
                Delete
              </button>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-neutral-500">Run an audit or pick one on the left.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `app/admin/audits/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { adminMain } from '@/components/admin/ui';
import { AuditsConsole, type ClientOption } from '@/components/admin/AuditsConsole';
import { auth } from '@/lib/auth';
import { listProspectAudits, type AuditRow } from '@/lib/audits';
import { isDatabaseConfigured } from '@/lib/db';
import { listOnboardings } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export default async function AuditsAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');
  const { id } = await searchParams;

  let audits: AuditRow[] = [];
  let clients: ClientOption[] = [];
  let dbError: string | null = isDatabaseConfigured() ? null : 'Audits need the database (POSTGRES_URL).';
  if (!dbError) {
    try {
      const [a, o] = await Promise.all([listProspectAudits('', 100), listOnboardings(200)]);
      audits = a;
      clients = o.filter((x) => x.status !== 'closed').map((x) => ({ id: x.id, label: x.businessName || x.clientName || x.clientEmail }));
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className={adminMain}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-950">Audits</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Where a business stands on Google and on its own site, measured, not guessed. Run one before a call; attach it when they sign.
          </p>
          {dbError ? <p className="mt-2 text-sm font-semibold text-red-600">{dbError}</p> : null}
        </div>
        <AuditsConsole initial={audits} clients={clients} openId={id ? Number(id) : null} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Add the tab** — in `components/admin/AdminNav.tsx`, insert after the Calls entry in `TABS`:

```ts
  { href: '/admin/audits', label: 'Audits', match: (p: string) => p.startsWith('/admin/audits') },
```

- [ ] **Step 7: Try it against the sandbox**

In `.env.local` add `DATAFORSEO_LOGIN=<your login>`, `DATAFORSEO_PASSWORD=<your password>`, `DATAFORSEO_BASE=https://sandbox.api.dataforseo.com`. Run `npm run dev`, sign in at `/admin/login`, open `/admin/audits`, audit "Joe's Auto Spa / Ankeny / auto detailing / (any public site)". Expect a saved audit with Maps + organic sections (sandbox data), a website checklist, and the leaks list. Then switch `DATAFORSEO_BASE` off (delete the line) and run one real audit of a known local business; confirm the Maps top 3 match what Google Maps shows for that city.

- [ ] **Step 8: Lint and commit**

```bash
npm run lint
git add app/api/admin/audits components/admin/AuditReadout.tsx components/admin/AuditsConsole.tsx app/admin/audits components/admin/AdminNav.tsx
git commit -m "Admin: Audits tab to measure any business and attach it to a client

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 6: A client's audits — settings, Run now, history, baseline

**Files:**
- Modify: `app/api/admin/onboarding/[token]/project/route.ts` (`present()`, `POST` kinds)
- Modify: `app/admin/onboarding/[token]/page.tsx` (load `audits` + `auditSettings` into `initial`)
- Modify: `components/insights/ProjectPanel.tsx` (`Data` type, `call()`, a new Audit card after the Dates form)

**Interfaces:**
- Consumes: `listAuditsForOnboarding`, `getAuditSettings`, `setAuditSettings`, `subjectForOnboarding`, `runAudit`, `getAudit`, `applyBaseline`, `AuditSettings` (Task 4); `validateAuditSettingsInput`, `summarize`, `scanCapFor`, `TIER_SCAN_CAP` (Task 1); `AuditReadout` (Task 5).
- Produces: `GET …/project` now returns `{ …, audits: AuditRow[], auditSettings: AuditSettings }`; `POST { kind: 'audit' }` runs an `admin` audit for the client (grid per settings); `POST { kind: 'audit-settings', city, website, grid, intervalDays, enabled, clientScanCap }`; `POST { kind: 'audit-baseline', id }` forces that audit as the baseline.

- [ ] **Step 1: Extend the project route**

Add imports at the top of `app/api/admin/onboarding/[token]/project/route.ts`:

```ts
import { applyBaseline, getAudit, getAuditSettings, listAuditsForOnboarding, runAudit, setAuditSettings, subjectForOnboarding } from '@/lib/audits';
import { validateAuditSettingsInput } from '@/lib/auditShared';
```

Add `export const maxDuration = 120;` under `export const runtime = 'nodejs';`.

Replace `present()` with:

```ts
async function present(onboardingId: number) {
  const [details, updates, reports, tracking, feedback, audits, auditSettings] = await Promise.all([
    getProjectDetails(onboardingId),
    listProjectUpdates(onboardingId),
    listMonthlyReports(onboardingId),
    trackingOverview(onboardingId),
    listFeedback(onboardingId),
    listAuditsForOnboarding(onboardingId),
    getAuditSettings(onboardingId),
  ]);
  return { details, updates, reports, tracking, feedback, audits, auditSettings };
}
```

In the `POST` handler, inside its `try`, before the existing `kind` branches, add three branches (follow the same shape the file uses for `'tracking'`: do the work, then `return NextResponse.json(await present(onboarding.id))`):

```ts
    if (body.kind === 'audit-settings') {
      await setAuditSettings(onboarding.id, validateAuditSettingsInput(body));
      return NextResponse.json(await present(onboarding.id));
    }
    if (body.kind === 'audit') {
      const settings = await getAuditSettings(onboarding.id);
      const subject = subjectForOnboarding(onboarding, settings);
      try {
        await runAudit(subject, { trigger: 'admin', onboardingId: onboarding.id, grid: settings.grid });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Audit failed';
        return NextResponse.json({ error: message }, { status: /budget/.test(message) ? 409 : 400 });
      }
      return NextResponse.json(await present(onboarding.id));
    }
    if (body.kind === 'audit-baseline') {
      const audit = await getAudit(Number(body.id));
      if (!audit || audit.onboardingId !== onboarding.id) throw new Error('That audit is not this client’s');
      if (!(await applyBaseline(onboarding.id, audit, true))) throw new Error('That audit did not find the business on Maps, so it cannot be the baseline');
      return NextResponse.json(await present(onboarding.id));
    }
```

Also update the header comment block of the route to list the three new kinds.

- [ ] **Step 2: Load the new data on the admin page**

In `app/admin/onboarding/[token]/page.tsx`: import `{ getAuditSettings, listAuditsForOnboarding } from '@/lib/audits'`; add `listAuditsForOnboarding(onboarding.id)` and `getAuditSettings(onboarding.id)` to the `Promise.all` (destructure as `audits, auditSettings`); pass `initial={{ details, updates, reports, tracking, feedback, audits, auditSettings }}` and add a `tier={onboarding.tier}` prop to `<ProjectPanel>`.

- [ ] **Step 3: ProjectPanel — types, props and state**

In `components/insights/ProjectPanel.tsx`:

Add imports:

```ts
import { AuditReadout } from '@/components/admin/AuditReadout';
import type { AuditSettings } from '@/lib/audits';
import { TIER_SCAN_CAP, summarize, type AuditRow } from '@/lib/auditShared';
import type { OnboardingTier } from '@/data/onboardingItems';
```

Extend `Data`:

```ts
  /** Every audit of this client, newest first, and the settings that drive the scheduled ones (lib/audits.ts). */
  audits: AuditRow[];
  auditSettings: AuditSettings;
```

Change the component signature to `export function ProjectPanel({ token, initial, guarantee, tier }: { token: string; initial: Data; guarantee: boolean; tier: OnboardingTier })`.

In `call()`, inside the `setData({...})` object add:

```ts
      audits: json.audits ?? data.audits,
      auditSettings: json.auditSettings ?? data.auditSettings,
```

After the `// ── Tracking ──` state block, add:

```ts
  // ── Audit ──
  const a = data.auditSettings;
  const [auditForm, setAuditForm] = useState({
    city: a.city ?? '',
    website: a.website ?? '',
    grid: a.grid,
    intervalDays: String(a.intervalDays),
    enabled: a.enabled,
    clientScanCap: a.clientScanCap === null ? '' : String(a.clientScanCap),
  });
  const setA = (k: keyof typeof auditForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAuditForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const [openAudit, setOpenAudit] = useState<number | null>(null);
  const baselineAudit = data.audits.find((x) => x.id === a.baselineAuditId) ?? null;
```

- [ ] **Step 4: ProjectPanel — the Audit card**

Directly after the closing `</form>` of the "Dates" form (the one that submits `call('PUT', details, …)`), insert:

```tsx
      <div className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-neutral-950">Business audit</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Maps rank, reviews, their site and the 5×5 grid, measured on Google every {auditForm.intervalDays || '14'} days from kickoff. The first one that finds them sets the
              baseline rank above. Keyword: <b>{d.baselineKeyword ? `“${d.baselineKeyword}”` : 'set the Main keyword above first'}</b>.
            </p>
            {baselineAudit ? (
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Baseline set from the audit on {new Date(baselineAudit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
              </p>
            ) : null}
          </div>
          <button type="button" onClick={() => void call('POST', { kind: 'audit' }, 'Audit saved.', 'audit')} disabled={busy === 'audit' || !a.city || !d.baselineKeyword} className={btn('primary')}>
            {busy === 'audit' ? 'Measuring… (up to a minute with the grid)' : 'Run audit now'}
          </button>
        </div>

        <form
          className="mt-4 grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void call('POST', { kind: 'audit-settings', ...auditForm }, 'Audit settings saved.', 'audit-settings');
          }}
        >
          {input(auditForm.city, setA('city'), 'City (for the search)', { placeholder: 'Ankeny, IA' })}
          {input(auditForm.website, setA('website'), 'Website to measure', { placeholder: 'their old site before launch', inputMode: 'url' })}
          {input(auditForm.intervalDays, setA('intervalDays'), 'Audit every N days', { inputMode: 'numeric' })}
          {input(auditForm.clientScanCap, setA('clientScanCap'), `Client scans / month (blank = ${TIER_SCAN_CAP[tier]} for this plan)`, { inputMode: 'numeric' })}
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-700">
            <input type="checkbox" checked={auditForm.grid} onChange={setA('grid')} /> 5×5 grid (+$0.05 per audit)
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-700">
            <input type="checkbox" checked={auditForm.enabled} onChange={setA('enabled')} /> Scheduled audits on
          </label>
          <div className="sm:col-span-3">
            <button type="submit" disabled={busy === 'audit-settings'} className={btn('secondary')}>
              {busy === 'audit-settings' ? 'Saving…' : 'Save audit settings'}
            </button>
          </div>
        </form>

        {data.audits.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="py-1 pr-3">Date</th>
                  <th className="py-1 pr-3">By</th>
                  <th className="py-1 pr-3">Maps</th>
                  <th className="py-1 pr-3">Rating</th>
                  <th className="py-1 pr-3">Speed</th>
                  <th className="py-1 pr-3">Status</th>
                  <th className="py-1 pr-3">Cost</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {data.audits.map((x) => {
                  const s = summarize(x);
                  return (
                    <tr key={x.id} className="border-t border-neutral-100">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(x.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="py-1.5 pr-3">{x.trigger}</td>
                      <td className="py-1.5 pr-3 font-semibold tabular-nums">{s.found === false ? 'not found' : s.mapsRank !== null ? `#${s.mapsRank}` : '–'}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{s.rating ?? '–'} · {s.reviews ?? '–'}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{s.pagespeed ?? '–'}</td>
                      <td className="py-1.5 pr-3">{x.status}</td>
                      <td className="py-1.5 pr-3 tabular-nums">${x.costUsd.toFixed(3)}</td>
                      <td className="py-1.5 whitespace-nowrap">
                        <button type="button" onClick={() => setOpenAudit(openAudit === x.id ? null : x.id)} className={btn('ghost', 'sm')}>
                          {openAudit === x.id ? 'Hide' : 'View'}
                        </button>
                        {x.trigger !== 'client' && s.found ? (
                          <button type="button" onClick={() => void call('POST', { kind: 'audit-baseline', id: x.id }, 'Baseline updated.', 'audit-baseline')} className={btn('ghost', 'sm')}>
                            Use as baseline
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">No audits yet. Set the city and keyword, then run one — or wait for the schedule once kickoff is set.</p>
        )}

        {openAudit !== null && data.audits.find((x) => x.id === openAudit) ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <AuditReadout audit={data.audits.find((x) => x.id === openAudit) as AuditRow} variant="admin" />
          </div>
        ) : null}
      </div>
```

- [ ] **Step 5: Try it**

`npm run dev` → open a client's admin page → set city "Ankeny, IA" (and a Main keyword in the Dates form, saved) → **Run audit now** → the history row appears, "Baseline set from the audit on …" shows and the Rank field in the Dates form now holds the measured rank after a reload. Run again → baseline unchanged; **Use as baseline** on the second row changes it.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add "app/api/admin/onboarding/[token]/project/route.ts" "app/admin/onboarding/[token]/page.tsx" components/insights/ProjectPanel.tsx
git commit -m "Admin: audit settings, Run audit now, history and baseline on the client page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 7: The daily scheduler and the failure email

**Files:**
- Modify: `lib/emailLogShared.ts` (`EMAIL_KINDS`)
- Modify: `lib/email.ts` (new `sendAuditFailuresNotification`)
- Create: `app/api/cron/audits/route.ts`
- Modify: `vercel.json` (`crons`)

**Interfaces:**
- Consumes: `listOnboardings` (`lib/onboarding.ts`), `getAuditSettings`, `lastScheduledAt`, `subjectForOnboarding`, `runAudit`, `monthSpendUsd`, `monthlyCapUsd` (Task 4), `auditDue` (Task 1), `APP_ORIGIN` (`lib/hostRouting.ts`), `displayName` (`lib/autoReports.ts`); in `lib/email.ts` the existing private helpers `getClient(kind)`, `FROM_ADDRESS`, `ADMIN_NOTIFICATION_EMAIL`, `escapeHtml`.
- Produces: `GET|POST /api/cron/audits` (bearer `CRON_SECRET`) → `{ checked, ran: string[], skipped: {name, reason}[], failed: {name, error}[], spentUsd, capUsd }`; `sendAuditFailuresNotification({ failed: Array<{ name; error; token }> }) → Promise<boolean>`; email kind `audit_failed`.

- [ ] **Step 1: Register the email kind** — in `lib/emailLogShared.ts`, inside `EMAIL_KINDS` after `tracker_quiet`, add:

```ts
  audit_failed: { label: 'Scheduled audit failed', category: 'alerts' },
```

- [ ] **Step 2: Add the owner email** — in `lib/email.ts`, directly after `sendTrackerQuietNotification`, add:

```ts
/** The daily audit job hit errors: one email listing who failed and why. */
export async function sendAuditFailuresNotification(input: { failed: Array<{ name: string; error: string; token: string }> }): Promise<boolean> {
  const resend = getClient('audit_failed');
  if (!resend || !ADMIN_NOTIFICATION_EMAIL || input.failed.length === 0) return false;
  const rows = input.failed
    .map((f) => `<li><b>${escapeHtml(f.name)}</b>: ${escapeHtml(f.error)} — <a href="https://app.axeonstudio.co/admin/onboarding/${f.token}">open</a></li>`)
    .join('');
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `${input.failed.length} scheduled audit${input.failed.length === 1 ? '' : 's'} failed today`,
    html: `<p>The daily audit run could not measure:</p><ul>${rows}</ul><p>The job retries tomorrow. A budget message means AUDIT_MONTHLY_CAP_USD is used up; a login message means the DataForSEO keys in Vercel are wrong or the account is out of funds.</p>`,
  });
  return true;
}
```

- [ ] **Step 3: Create `app/api/cron/audits/route.ts`**

```ts
// app/api/cron/audits/route.ts
// Daily job (vercel.json, 14:15 UTC). For every open client with scheduled
// audits on, a kickoff date, a city and a Main keyword: run a `schedule`
// audit when the last one is older than their interval (lib/audits.ts). Daily
// with an interval check means a failed day simply retries tomorrow. The owner
// gets one email on any day something failed.
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`.
import { NextResponse } from 'next/server';
import { getAuditSettings, lastScheduledAt, monthSpendUsd, monthlyCapUsd, runAudit, subjectForOnboarding } from '@/lib/audits';
import { auditDue } from '@/lib/auditShared';
import { displayName } from '@/lib/autoReports';
import { isDatabaseConfigured } from '@/lib/db';
import { sendAuditFailuresNotification } from '@/lib/email';
import { listOnboardings } from '@/lib/onboarding';
import { getProjectDetails } from '@/lib/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONCURRENCY = 2;

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });

  const onboardings = await listOnboardings(500);
  const ran: string[] = [];
  const skipped: { name: string; reason: string }[] = [];
  const failed: { name: string; error: string; token: string }[] = [];
  const capUsd = monthlyCapUsd();

  const one = async (o: (typeof onboardings)[number]) => {
    const name = displayName(o);
    try {
      if (o.status === 'closed') return skipped.push({ name, reason: 'closed' });
      const settings = await getAuditSettings(o.id);
      if (!settings.enabled) return skipped.push({ name, reason: 'scheduled audits are off' });
      if (!settings.city || !settings.keyword) return skipped.push({ name, reason: 'no city or keyword set' });
      if (!(await getProjectDetails(o.id)).kickoffAt) return skipped.push({ name, reason: 'no kickoff date' });
      if (!auditDue(await lastScheduledAt(o.id), settings.intervalDays)) return skipped.push({ name, reason: 'not due yet' });
      if ((await monthSpendUsd()) >= capUsd) return skipped.push({ name, reason: `monthly audit budget ($${capUsd}) used up` });
      await runAudit(subjectForOnboarding(o, settings), { trigger: 'schedule', onboardingId: o.id, grid: settings.grid });
      ran.push(name);
    } catch (err) {
      failed.push({ name, error: err instanceof Error ? err.message : String(err), token: o.token });
    }
  };

  for (let i = 0; i < onboardings.length; i += CONCURRENCY) {
    await Promise.all(onboardings.slice(i, i + CONCURRENCY).map(one));
  }

  if (failed.length) {
    console.error('[cron:audits] failures', failed);
    try {
      await sendAuditFailuresNotification({ failed });
    } catch (err) {
      console.error('[cron:audits] failure email failed', err instanceof Error ? err.message : err);
    }
  }
  return NextResponse.json({ checked: onboardings.length, ran, skipped, failed: failed.map(({ name, error }) => ({ name, error })), spentUsd: await monthSpendUsd(), capUsd });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
```

- [ ] **Step 4: Schedule it** — in `vercel.json`, add to `crons` after the `tracker-health` entry:

```json
    { "path": "/api/cron/audits", "schedule": "15 14 * * *" }
```

- [ ] **Step 5: Try it locally**

With `CRON_SECRET` in `.env.local` and `npm run dev` running:
`curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/audits` (PowerShell: `Invoke-RestMethod -Headers @{Authorization="Bearer <secret>"} http://localhost:3000/api/cron/audits`). Expect `skipped` reasons for clients without city/keyword/kickoff, `ran` for the one you set up in Task 6, and `not due yet` on a second call.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add lib/emailLogShared.ts lib/email.ts app/api/cron/audits/route.ts vercel.json
git commit -m "Cron: scheduled client audits every N days, with a failure email to the owner

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 8: Monthly report fill

**Files:**
- Modify: `lib/projects.ts` (`ReportBody`, `normalizeReportBody`, `saveMonthlyReport`, new `attachAuditToReport`)
- Modify: `lib/autoReports.ts` (`sendAutoReport`)
- Modify: `lib/projects.test.ts` (one new test)
- Modify: `components/insights/ProjectPanel.tsx` (a one-line note in the reports list)

**Interfaces:**
- Consumes: `latestOfficialAuditInMonth` (Task 4), `reportFillPatch` (Task 1).
- Produces: `ReportBody.audit?: { id: number; at: string } | null`; `attachAuditToReport(onboardingId, month, audit) → Promise<MonthlyReport | null>` (null when the audit had nothing to add and no report exists).

- [ ] **Step 1: Failing test** — append to `lib/projects.test.ts`:

```ts
import { normalizeReportBody } from './projects';

test('normalizeReportBody carries the audit note and defaults it to null', () => {
  assert.equal(normalizeReportBody({ rank: 3 }).audit, null);
  assert.deepEqual(normalizeReportBody({ audit: { id: 9, at: '2026-10-26T14:00:00.000Z' } }).audit, { id: 9, at: '2026-10-26T14:00:00.000Z' });
});
```

(Put the import next to the file's existing `./projects` import rather than duplicating it.) Run `npx tsx --test lib/projects.test.ts` → the new test FAILS (`audit` is undefined).

- [ ] **Step 2: `lib/projects.ts` changes**

In `ReportBody`, after `auto?: boolean;` add:

```ts
  /** Set when the monthly job filled rank / reviews / rating from a business audit (lib/audits.ts). */
  audit?: { id: number; at: string } | null;
```

In `normalizeReportBody`'s returned object add `audit: raw.audit ?? null,`.

In `saveMonthlyReport`, change the destructure to `const { traffic: _traffic, auto: _auto, audit: _audit, ...typed } = input.body;` (the admin form never carries the note; it stays as stored).

Add the import `import { reportFillPatch, type AuditRow } from '@/lib/auditShared';` and, after `attachTrafficToReport`, add:

```ts
/**
 * The monthly job's other write: rank, keyword, reviews and rating from the
 * month's latest schedule/admin audit, but only into fields Axeon left blank.
 * Returns null when there was nothing to add and no report row exists yet.
 */
export async function attachAuditToReport(onboardingId: number, month: string, audit: Pick<AuditRow, 'id' | 'createdAt' | 'results'>): Promise<MonthlyReport | null> {
  await ensureSchema();
  const existing = await getMonthlyReport(onboardingId, month);
  const patch = reportFillPatch(existing ? { rank: existing.rank, keyword: existing.keyword, reviews: existing.reviews, rating: existing.rating } : null, audit);
  if (Object.keys(patch).length === 0) return existing;
  const note = { ...patch, audit: { id: audit.id, at: audit.createdAt } };
  const fresh: ReportBody = { ...emptyReportBody(), ...note };
  await sql`
    INSERT INTO monthly_reports (onboarding_id, month, body)
    VALUES (${onboardingId}, ${month}, ${JSON.stringify(fresh)}::jsonb)
    ON CONFLICT (onboarding_id, month) DO UPDATE SET body = monthly_reports.body || ${JSON.stringify(note)}::jsonb, updated_at = now();
  `;
  return getMonthlyReport(onboardingId, month);
}
```

Run `npx tsx --test lib/projects.test.ts` → PASS.

- [ ] **Step 3: `lib/autoReports.ts`**

Add imports: `import { latestOfficialAuditInMonth } from '@/lib/audits';` and extend the `@/lib/projects` import with `attachAuditToReport`.

In `sendAutoReport`, directly after the `if (!opts.force && existing?.previewSentAt && !existing.emailedAt) { … }` block and before `const traffic = await monthTraffic(...)`, add:

```ts
  // Measured numbers for the month beat blanks: fill rank / reviews / rating from the latest audit, never over what Axeon typed.
  const audit = await latestOfficialAuditInMonth(onboarding.id, month);
  const filled = audit ? await attachAuditToReport(onboarding.id, month, audit) : null;
  const current = filled ?? existing;
```

Then replace the two later uses of `existing` in content checks with `current`: `if (!hasTraffic(traffic) && !reportHasContent(current))` and `if (!opts.force && number === 1 && hasTraffic(traffic) && !reportHasContent(current))`. Leave `existing?.survey` as is.

- [ ] **Step 4: Show where the numbers came from**

In `components/insights/ProjectPanel.tsx`, find the reports list row that renders the `editReport(r)` button (`grep -n "editReport(r)" components/insights/ProjectPanel.tsx`). Inside that row's text block, after the existing month label element, add:

```tsx
                {r.audit ? (
                  <span className="text-xs text-neutral-500">
                    rank · reviews from the audit on {new Date(r.audit.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ) : null}
```

- [ ] **Step 5: Try it**

With a client that has one `admin` audit this month and no typed report: `POST /api/admin/onboarding/<token>/project { kind: 'auto-report', month: '<this month>' }` from the admin page's "Send now" button for the current month (or `Invoke-RestMethod` with the admin cookie). The saved report shows the audit's rank/reviews/rating and the "from the audit on …" note; typing a different rank into the report form and saving keeps the typed value on the next run.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint && npm run test:onboarding
git add lib/projects.ts lib/projects.test.ts lib/autoReports.ts components/insights/ProjectPanel.tsx
git commit -m "Reports: fill blank rank, reviews and rating from the month's audit

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 9: AxeonPROOF — the Ranking card and client scans

**Files:**
- Create: `app/api/proof/scan/route.ts`
- Create: `components/proof/RankingCard.tsx`
- Modify: `lib/proofDashboardData.ts` (`loadDashboardData` adds `ranking`)
- Modify: `components/proof/ProofDashboard.tsx` (props `ranking`, `scanApi`; render the card on the overview)
- Modify: `app/proof/page.tsx` (pass `scanApi="/api/proof/scan"`)

**Interfaces:**
- Consumes: `getSignedInClient` (`lib/proofServer.ts`), `getOnboardingById`, `getAuditSettings`, `clientScansUsed`, `listAuditsForOnboarding`, `subjectForOnboarding`, `runAudit` (Task 4), `scanCapFor`, `scansRemaining`, `section`, `summarize`, `GridResult`, `Leak`, `AuditTrigger` (Task 1), `GridMap` (Task 5), `monthOf` (`lib/siteStats.ts`).
- Produces: `interface RankingData` (exported from `components/proof/RankingCard.tsx`, client-safe), `POST /api/proof/scan` → `{ rank, found, rating, reviews, leaks: Leak[], used, cap }` or `409 { error }` when over the cap.

- [ ] **Step 1: Create `components/proof/RankingCard.tsx`**

```tsx
'use client';

// components/proof/RankingCard.tsx
// The client's Google standing on the PROOF overview: today's Maps rank for
// their keyword, every audit since kickoff as a line (baseline marked), the
// latest 5×5 grid, and "Scan now" with this month's remaining scans. Client
// scans never feed the official numbers; the copy says why the line matters
// more than any single day.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { GridMap } from '@/components/admin/AuditReadout';
import type { AuditTrigger, GridResult, Leak } from '@/lib/auditShared';

export interface RankingData {
  keyword: string;
  city: string;
  baselineRank: number | null;
  points: Array<{ at: string; rank: number | null; trigger: AuditTrigger }>;
  latest: { at: string; rank: number | null; found: boolean; rating: number | null; reviews: number | null } | null;
  grid: { at: string; result: GridResult } | null;
  cap: number;
  used: number;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
const nextMonthLabel = () => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/** Rank over time; rank 1 at the top, "not found" drawn at the bottom edge as a hollow dot. */
function Trend({ points, baseline }: { points: RankingData['points']; baseline: number | null }) {
  const W = 320;
  const H = 96;
  const pad = 10;
  const ranks = points.map((p) => p.rank ?? 21);
  const max = Math.max(5, ...ranks, baseline ?? 0);
  const x = (i: number) => (points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1));
  const y = (r: number) => pad + ((r - 1) * (H - pad * 2)) / (max - 1 || 1);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rank ?? 21).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" role="img" aria-label="Maps rank over time">
      {baseline !== null ? <line x1={pad} x2={W - pad} y1={y(baseline)} y2={y(baseline)} stroke="#a3a3a3" strokeDasharray="4 4" /> : null}
      {points.length > 1 ? <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" /> : null}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.rank ?? 21)} r="3.5" fill={p.rank === null ? '#fff' : '#2563eb'} stroke="#2563eb" strokeWidth="1.5">
          <title>{`${day(p.at)}: ${p.rank === null ? 'not in top 20' : `#${p.rank}`}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function RankingCard({ data, api }: { data: RankingData; api: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ rank: number | null; found: boolean; leaks: Leak[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const left = Math.max(0, data.cap - data.used);

  async function scan() {
    if (!api) return;
    setBusy(true);
    setError(null);
    const res = await fetch(api, { method: 'POST' });
    const json = (await res.json().catch(() => ({}))) as { rank?: number | null; found?: boolean; leaks?: Leak[]; error?: string };
    setBusy(false);
    if (!res.ok) return setError(json.error ?? 'The scan did not go through. Nothing was used.');
    setResult({ rank: json.rank ?? null, found: Boolean(json.found), leaks: json.leaks ?? [] });
    router.refresh();
  }

  return (
    <section className="proof-rise mt-4 rounded-2xl bg-white p-5 shadow-[0_2px_12px_-2px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.04)] sm:mt-6 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <MapPin size={12} /> Google Maps · “{data.keyword}” in {data.city}
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-950">
            {data.latest ? (data.latest.found && data.latest.rank !== null ? `#${data.latest.rank}` : 'Not in top 20') : 'Measured after kickoff'}
            {data.latest ? <span className="ml-2 text-sm font-semibold text-neutral-500">{day(data.latest.at)}</span> : null}
          </p>
          {data.latest && data.latest.rating !== null ? (
            <p className="text-sm text-neutral-600">
              {data.latest.rating} ★ · {data.latest.reviews ?? '–'} reviews
              {data.baselineRank !== null ? <> · started at #{data.baselineRank}</> : null}
            </p>
          ) : null}
        </div>
        {api && data.cap > 0 ? (
          <div className="text-right">
            <button type="button" onClick={scan} disabled={busy || left === 0} className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Checking Google…' : 'Scan now'}
            </button>
            <p className="mt-1 text-xs text-neutral-500">{left > 0 ? `${left} of ${data.cap} left this month` : `Next scans unlock ${nextMonthLabel()}`}</p>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {result ? (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
          <p className="font-semibold">Right now: {result.found && result.rank !== null ? `#${result.rank}` : 'not in the top 20'}.</p>
          {result.leaks.slice(0, 3).map((l, i) => (
            <p key={i} className="mt-1">
              <b>{l.headline}.</b> {l.detail}
            </p>
          ))}
        </div>
      ) : null}

      {data.points.length > 0 ? (
        <div className="mt-4">
          <Trend points={data.points} baseline={data.baselineRank} />
          <p className="mt-1 text-xs text-neutral-500">Rankings move a spot or two day to day. The line is what matters.{data.baselineRank !== null ? ' Dashed line: where you started.' : ''}</p>
        </div>
      ) : null}

      {data.grid ? (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Where you show up across {data.city} · measured {day(data.grid.at)}</p>
          <div className="mt-2">
            <GridMap grid={data.grid.result} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Create `app/api/proof/scan/route.ts`**

```ts
// app/api/proof/scan/route.ts
// POST from the signed-in client's Ranking card: one `client` audit of their
// own business on the keyword and city Axeon set, never with the grid, while
// this month's scans (3 on AxeonCORE, 10 on AxeonGROWTH, or the per-client
// override) are not used up. A failed scan is not counted.
import { NextResponse } from 'next/server';
import { clientScansUsed, getAuditSettings, runAudit, subjectForOnboarding } from '@/lib/audits';
import { scanCapFor, section } from '@/lib/auditShared';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const onboarding = await getOnboardingById(account.onboardingId);
    if (!onboarding) throw new Error('Account not found');
    const settings = await getAuditSettings(onboarding.id);
    const cap = scanCapFor(onboarding.tier, settings.clientScanCap);
    const used = await clientScansUsed(onboarding.id);
    if (cap === 0) return NextResponse.json({ error: 'Scans are not part of your plan yet.' }, { status: 403 });
    if (used >= cap) return NextResponse.json({ error: `You've used this month's ${cap} scans. They reset on the 1st.` }, { status: 409 });
    const audit = await runAudit(subjectForOnboarding(onboarding, settings), { trigger: 'client', onboardingId: onboarding.id, grid: false });
    const maps = section(audit.results.maps);
    const rep = section(audit.results.reputation);
    const counted = audit.status !== 'failed';
    return NextResponse.json({
      rank: maps?.rank ?? null,
      found: maps?.found ?? false,
      rating: rep?.rating ?? null,
      reviews: rep?.reviews ?? null,
      leaks: audit.leaks,
      used: used + (counted ? 1 : 0),
      cap,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The scan did not go through';
    // Never leak a budget or credentials message to a client.
    const safe = /budget|DataForSEO|login/i.test(message) ? 'Scanning is paused for a moment. Please try again later.' : message;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
```

- [ ] **Step 3: Load the card's data** — in `lib/proofDashboardData.ts`:

Add imports: `import { clientScansUsed, getAuditSettings, listAuditsForOnboarding } from '@/lib/audits';`, `import { scanCapFor, section, splitCity } from '@/lib/auditShared';`, `import type { RankingData } from '@/components/proof/RankingCard';`.

Add `auditSettings`, `audits`, `scansUsed` to the big `Promise.all`:

```ts
    getAuditSettings(onboarding.id),
    listAuditsForOnboarding(onboarding.id, 60),
    clientScansUsed(onboarding.id),
```

(destructure them at the end of the existing list). Before the `return`, build the card data:

```ts
  const cap = scanCapFor(onboarding.tier, auditSettings.clientScanCap);
  const official = audits.filter((a) => a.trigger !== 'client' && a.status !== 'failed');
  const latestGrid = official.map((a) => ({ at: a.createdAt, result: section(a.results.grid) })).find((g) => g.result !== null);
  const latest = audits.find((a) => a.status !== 'failed') ?? null;
  const latestMaps = latest ? section(latest.results.maps) : null;
  const latestRep = latest ? section(latest.results.reputation) : null;
  const ranking: RankingData | null =
    cap > 0 && auditSettings.city && auditSettings.keyword
      ? {
          keyword: auditSettings.keyword,
          city: splitCity(auditSettings.city).city,
          baselineRank: details.baselineRank,
          points: [...audits]
            .filter((a) => a.status !== 'failed')
            .reverse()
            .map((a) => ({ at: a.createdAt, rank: section(a.results.maps)?.rank ?? null, trigger: a.trigger })),
          latest: latest ? { at: latest.createdAt, rank: latestMaps?.rank ?? null, found: latestMaps?.found ?? false, rating: latestRep?.rating ?? null, reviews: latestRep?.reviews ?? null } : null,
          grid: latestGrid && latestGrid.result ? { at: latestGrid.at, result: latestGrid.result } : null,
          cap,
          used: scansUsed,
        }
      : null;
```

and add `ranking,` to the returned object.

- [ ] **Step 4: Render it** — in `components/proof/ProofDashboard.tsx`:

Import `{ RankingCard, type RankingData } from '@/components/proof/RankingCard'`. Add to the props (both the destructuring defaults and the type):

```ts
  ranking = null,
  scanApi = null,
  …
  /** The client's Google standing and scan allowance (lib/proofDashboardData.ts); null when their plan has no scans. */
  ranking?: RankingData | null;
  /** Where "Scan now" posts; null in the admin preview, which hides the button. */
  scanApi?: string | null;
```

In the overview branch, directly after the `METRICS` grid `</div>` and before the `<div className="mt-4 sm:mt-9 grid …">` chart row, add:

```tsx
        {ranking ? <RankingCard data={ranking} api={scanApi} /> : null}
```

In `app/proof/page.tsx`, add `scanApi="/api/proof/scan"` to the `<ProofDashboard …>` props. The admin preview page passes nothing, so the button is hidden there.

- [ ] **Step 5: Try it**

Sign in as a CORE client at `/proof` (or `/demo` if that shortcut exists for this repo; otherwise use a real client account) → the Ranking card shows after an admin audit exists; **Scan now** → the "Right now: #N" line appears, the counter drops to "2 of 3 left", and the page refreshes with a new point on the line. A fourth click shows the unlock date. Confirm the Essentials demo sees no card.

- [ ] **Step 6: Lint and commit**

```bash
npm run lint
git add app/api/proof/scan/route.ts components/proof/RankingCard.tsx lib/proofDashboardData.ts components/proof/ProofDashboard.tsx app/proof/page.tsx
git commit -m "PROOF: Ranking card with the trend, the grid and client scans

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 10: Call deck — Audit button and summary

**Files:**
- Modify: `app/api/admin/calls/route.ts` (`GET` adds `audits`)
- Modify: `app/admin/calls/page.tsx` (load `latestAuditByLead`)
- Modify: `components/admin/CallDeck.tsx` (prop, state, a Fact with the summary and the button)

**Interfaces:**
- Consumes: `latestAuditByLead`, `AuditSummary` (Task 4/1), `defaultKeyword`, `summarize` (Task 1), `POST /api/admin/audits` (Task 5).
- Produces: `GET /api/admin/calls` → `{ leads, audits: Record<string, AuditSummary> }`; `<CallDeck initialLeads dbError initialAudits />`.

- [ ] **Step 1: API** — in `app/api/admin/calls/route.ts`, import `{ latestAuditByLead } from '@/lib/audits'` and change the `GET` body to:

```ts
    const [leads, audits] = await Promise.all([listCallLeads(), latestAuditByLead()]);
    return NextResponse.json({ leads, audits: Object.fromEntries(audits) });
```

- [ ] **Step 2: Page** — in `app/admin/calls/page.tsx`, import `{ latestAuditByLead } from '@/lib/audits'` and `type { AuditSummary } from '@/lib/auditShared'`; add `let audits: Record<string, AuditSummary> = {};` and inside the `try`: `audits = Object.fromEntries(await latestAuditByLead());`. Pass `<CallDeck initialLeads={leads} dbError={dbError} initialAudits={audits} />`.

- [ ] **Step 3: Deck** — in `components/admin/CallDeck.tsx`:

Imports: add `Gauge` to the lucide import list; `import { defaultKeyword, summarize, type AuditRow, type AuditSummary } from '@/lib/auditShared';`.

Props: `export function CallDeck({ initialLeads, dbError, initialAudits = {} }: { initialLeads: CallLead[]; dbError: string | null; initialAudits?: Record<string, AuditSummary> })` (keep the existing signature's other parts). State, next to `const [leads, setLeads] = …`:

```ts
  const [audits, setAudits] = useState<Record<string, AuditSummary>>(initialAudits);
  const [auditing, setAuditing] = useState(false);
```

In `refresh()`, after the leads are read from the response, also read `audits`: `if (data.audits) setAudits(data.audits as Record<string, AuditSummary>);` (extend the response type to `{ leads?: CallLead[]; audits?: Record<string, AuditSummary>; error?: string }`).

Add the action next to `saveNotes`:

```ts
  const runAudit = useCallback(async () => {
    if (!lead || auditing) return;
    setAuditing(true);
    try {
      const res = await fetch('/api/admin/audits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ business: lead.business, city: lead.city, state: 'IA', keyword: defaultKeyword(lead.niche, lead.city), website: lead.website, grid: false, callLeadId: lead.id }),
      });
      const data = (await res.json().catch(() => ({}))) as { audit?: AuditRow; error?: string };
      if (!res.ok || !data.audit) throw new Error(data.error ?? 'Audit failed');
      setAudits((all) => ({ ...all, [String(lead.id)]: summarize(data.audit as AuditRow) }));
      flash(true, 'Audited');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setAuditing(false);
    }
  }, [lead, auditing]);
```

(`flash` is the existing toast helper defined above `patch`; `lead` is the current card.) In the Facts `<dl>`, after the `<Fact label="Source">` entry, add:

```tsx
                <Fact label="Audit">
                  {(() => {
                    const s = audits[String(lead.id)];
                    return (
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {s ? (
                          <>
                            <span className="font-semibold text-neutral-900">
                              {s.found === false ? 'Not on Maps' : s.mapsRank !== null ? `Maps #${s.mapsRank}` : 'Maps –'}
                              {s.reviews !== null ? ` · ${s.reviews} reviews` : ''}
                              {s.pagespeed !== null ? ` · speed ${s.pagespeed}` : ''}
                            </span>
                            <a href={`/admin/audits?id=${s.id}`} className="text-xs text-blue-700 hover:underline">
                              View
                            </a>
                          </>
                        ) : (
                          <span className="text-neutral-500">Not audited</span>
                        )}
                        <button type="button" onClick={runAudit} disabled={auditing || !lead.city} className={btn('secondary', 'sm')}>
                          <Gauge size={13} /> {auditing ? 'Measuring…' : s ? 'Re-run' : 'Run audit'}
                        </button>
                      </span>
                    );
                  })()}
                </Fact>
```

- [ ] **Step 4: Try it** — `/admin/calls` → a card → **Run audit** → the Fact fills with "Maps #N · reviews · speed" and **View** opens `/admin/audits?id=…` with that audit selected; it also appears in the Audits tab list. Attach it to a client from there.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add app/api/admin/calls/route.ts app/admin/calls/page.tsx components/admin/CallDeck.tsx
git commit -m "Call deck: audit a prospect from the card

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 11: Verification, env notes, PR

**Files:**
- Modify: `.env.example` if it exists (`ls .env.example`); otherwise skip this file.
- Modify: `docs/superpowers/specs/2026-10-12-business-audit-design.md` (one line under §12 noting the location_name refinement from Global Constraints)

- [ ] **Step 1: Full checks**

```bash
npm run lint && npm run test:onboarding && npm run verify
```
All must pass. If `verify` runs a production build, expect it to take a few minutes.

- [ ] **Step 2: Env documentation** — if `.env.example` exists, append:

```
# Business audits (lib/dataforseo.ts, lib/audits.ts)
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
# DATAFORSEO_BASE=https://sandbox.api.dataforseo.com   # local only: free sample data
# AUDIT_MONTHLY_CAP_USD=25
# PAGESPEED_API_KEY=
```

- [ ] **Step 3: Spec note** — under §12 "Rollout" in the spec add: `5. Implementation note: the canonical Maps rank always uses location_name (city), not the learned pin, so every point on the trend line is measured the same way; the pin is used for the grid only.`

- [ ] **Step 4: Live checklist (owner + executor together)**

1. Owner adds `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` (and optionally `AUDIT_MONTHLY_CAP_USD`, `PAGESPEED_API_KEY`) in Vercel → Project → Settings → Environment Variables, Production + Preview.
2. Push the branch, open a PR, let the preview deploy, run one prospect audit on the preview URL's `/admin/audits` (real DataForSEO).
3. Merge. On production: set the first signed client's audit city + keyword, **Run audit now**, confirm baseline + grid, confirm `/api/cron/audits` appears under Vercel → Cron Jobs.

- [ ] **Step 5: Commit and open the PR**

```bash
git add -A
git commit -m "Audits: env notes and spec implementation note

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin business-audit
gh pr create --title "Business audits: DataForSEO baselines, scheduled client audits, prospect audits, PROOF scans" --body "Implements docs/superpowers/specs/2026-10-12-business-audit-design.md per docs/superpowers/plans/2026-10-12-business-audit.md.

- audits table + per-client audit settings
- lib/dataforseo.ts, lib/audit*.ts, lib/audits.ts (tested)
- /admin/audits tab, client page audit card, call-deck button
- daily /api/cron/audits (14-day default), monthly report fill
- PROOF Ranking card with client scans (CORE 3 / GROWTH 10)

Needs DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD in Vercel before merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Self-review (done while writing)

- **Spec coverage:** §3 shapes → Task 1; §4 schema + spend guard → Tasks 1, 4; §5 sources, 5.1 matching, 5.2 cost → Tasks 2–4; §6 leaks → Task 1; §7.1 → Task 6; §7.2 → Task 7; §7.3 → Task 8; §7.4 → Tasks 5, 10; §7.5 → Task 9; §9 error handling → Tasks 3, 4, 7, 9; §10 security → Tasks 2, 3, 5, 9; §11 testing → Tasks 1, 2, 4, 8; §12 rollout → Task 11; §13 out of scope → nothing added.
- **Known deviations from the spec, all deliberate:** canonical Maps rank uses `location_name` always (Global Constraints); the client's settings reuse `baseline_keyword` rather than a separate keyword column; `raw` for the grid stores counts, not 25 payloads (size).
- **Type consistency checked:** `AuditRow.costUsd` (number) everywhere; `summarize()` is the only summary builder; `Section<T>` + `section()` used in all readers; `Sources` is the injection seam in both `composeAudit` and tests; `attachAuditToReport` returns `MonthlyReport | null` and `autoReports` handles null.

<!-- END -->

