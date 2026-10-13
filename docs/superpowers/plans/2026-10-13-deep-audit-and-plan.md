# Deep Audit & 90-Day Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deep audit (market keywords with local volume/CPC/ranks, competitor profiles and domain strength, own Google profile, review velocity, a 15-page site crawl), derive a rule-based 90-Day Plan from it, and show the same data as an admin plan, a sales pitch sheet with Copy-as-text, and a basic client progress strip + checklist.

**Architecture:** Phase 1's `composeAudit` grows a `deep` flag that runs five more sources (`lib/auditDeep.ts`) in parallel after Maps; their parsers are pure (`lib/auditDeepParse.ts`) and tested on the real DataForSEO captures in `.superpowers/raw/` (trimmed into `lib/__fixtures__/dataforseo/`). `lib/planRules.ts` (pure) turns an audit into plan drafts; `lib/plans.ts` stores them in `plan_items` and re-checks targets after every audit. Three views read the same rows.

**Tech Stack:** as Phase 1 (Next 15, React 19, `@vercel/postgres`, `node:test` via `tsx`), no new deps.

**Spec:** `docs/superpowers/specs/2026-10-13-deep-audit-and-plan-design.md`. Phase 1 spec and code are the base; read `lib/auditShared.ts`, `lib/audits.ts`, `lib/auditSources.ts` first.

**Worktree:** `C:\Users\trial\OneDrive\Desktop\axeon-deep-wt`, branch `deep-audits`.

## Global Constraints

- Everything from the Phase 1 plan's Global Constraints still applies (flat `lib/`, idempotent `ensureSchema`, `node:test`, "nothing is invented", secrets never returned, SSRF rules, commit style + Co-Authored-By trailer, `npm run lint` green per task).
- **No AI-generated text.** Plan titles and `why` sentences are templates filled with measured numbers.
- Deep sections are additive: a Phase 1 quick audit's JSON must still parse and render unchanged. Every new `AuditResults` key is optional.
- Labs endpoints take `location_code: 2840` (national); only `keywords_data/google_ads/search_volume/live` and the SERP endpoints take the city `location_name`.
- `my_business_info/live` stays a Phase 1 fallback only; profile data comes from the Maps item.
- Reviews are async on DataForSEO (observed: still queued 10+ minutes after posting): post first, collect last, and if not ready store the task id in `raw.reviewsTaskId` and finish it later (`completePendingReviews`).
- Deep audits never run from the client scan route.
- Plan edits by the owner (`title`, `owner`, `target`, `status = dropped`) are never overwritten by a re-sync; `current`/`status` of open items always refresh.

## Review Focus

1. **A keyword with `search_volume: null`** (Ads returns null for rare terms) must not become `missedSearches` or `missedAdValue` → test in Task 2 (`marketFromParts`).
2. **A competitor without a domain** (Maps item `domain: null`) must still appear with its profile fields and `organicKeywords: null` → test in Task 2 (`competitorProfiles`).
3. **Reviews with no timestamps / fewer than 2 items** must yield `perMonth90d: null`, not Infinity or 0 → test in Task 2 (`reviewsFromItems`).
4. **A plan re-sync after the owner renamed an item and changed its target** keeps both, while `current` and `status` move → test in Task 4 (`mergeDraft`).
5. **A crawl where the homepage links to itself, to `mailto:`/`tel:`, and to another host** must only follow same-host http(s) pages and never the same URL twice → test in Task 3 (`pickInternalLinks`).

---

### Task 1: Shapes, schema, fixtures

**Files:** modify `lib/auditShared.ts`, `lib/db.ts`, `package.json`; create fixtures under `lib/__fixtures__/dataforseo/` from `.superpowers/raw/` (trimmed with the script below).

**Interfaces produced:** `MarketKeyword`, `MarketResult`, `CompetitorProfile`, `CompetitorsResult`, `ProfileResult`, `ReviewsResult`, `SitePage`, `SiteResult` (spec §2.1) added to `AuditResults` as optional `market`, `competitors`, `profile`, `reviews`, `site`; `AuditRow.deep: boolean`; `MapsItem` gains `photos: number | null; claimed: boolean | null; booking: boolean; phone: string | null; openDays: number | null; stars: Record<1|2|3|4|5, number> | null`.

- [ ] Add to `lib/auditShared.ts` the eight interfaces exactly as in spec §2.1, the five optional keys on `AuditResults`, `deep: boolean` on `AuditRow`, and the six new optional-safe fields on `MapsItem` (defaults `null`/`false`).
- [ ] `lib/db.ts` `ensureSchema`, after the Phase 1 audit statements:
```ts
      await sql`ALTER TABLE audits ADD COLUMN IF NOT EXISTS deep BOOLEAN NOT NULL DEFAULT false;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS deep_refresh_days INTEGER NOT NULL DEFAULT 90;`;
      await sql`ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS last_deep_at TIMESTAMPTZ;`;
      await sql`
        CREATE TABLE IF NOT EXISTS plan_items (
          id SERIAL PRIMARY KEY,
          onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
          key TEXT NOT NULL,
          title TEXT NOT NULL,
          why TEXT NOT NULL DEFAULT '',
          owner TEXT NOT NULL CHECK (owner IN ('axeon', 'client')),
          metric TEXT,
          target JSONB,
          current JSONB,
          impact INTEGER NOT NULL DEFAULT 2,
          status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'on_track', 'slipping', 'done', 'dropped')),
          edited BOOLEAN NOT NULL DEFAULT false,
          due_at DATE,
          source_audit_id INTEGER,
          done_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (onboarding_id, key)
        );
      `;
```
- [ ] Fixtures: run this once from the worktree root to trim the raw captures (keeps shapes, drops bulk):
```bash
python - <<'EOF'
import json,os
raw='.superpowers/raw'; out='lib/__fixtures__/dataforseo'
def load(n): return json.load(open(f'{raw}/{n}.json'))
def save(n,d): json.dump(d, open(f'{out}/{n}.json','w'), indent=1)
d=load('keyword_ideas'); r=d['tasks'][0]['result'][0]; r['items']=[{k:i[k] for k in ('keyword','keyword_info')} for i in r['items'][:6]]
for i in r['items']: i['keyword_info']={k:i['keyword_info'].get(k) for k in ('search_volume','cpc','competition_level')}
save('keyword_ideas',d)
d=load('ads_volume'); d['tasks'][0]['result']=[{k:x.get(k) for k in ('keyword','search_volume','cpc','competition')} for x in d['tasks'][0]['result']]; save('ads_volume',d)
d=load('domain_rank_overview'); it=d['tasks'][0]['result'][0]['items'][0]; it['metrics']={'organic':{k:it['metrics']['organic'].get(k) for k in ('count','etv','estimated_paid_traffic_cost','pos_1','pos_2_3','pos_4_10')}}; save('domain_rank_overview',d)
d=load('maps_live'); r=d['tasks'][0]['result'][0]; keep=('type','rank_group','rank_absolute','title','domain','url','rating','rating_distribution','place_id','cid','latitude','longitude','category','additional_categories','total_photos','is_claimed','book_online_url','phone','work_hours'); r['items']=[{k:i.get(k) for k in keep} for i in r['items'][:6]]; save('maps_profile',d)
print('ok')
EOF
```
  (`reviews` fixture: when `reviews_get.json` in `.superpowers/raw/` has items, trim to 6 items keeping `timestamp`, `rating.value`, `owner_answer`, `review_text`, plus result-level `rating`, `reviews_count`; otherwise hand-write `lib/__fixtures__/dataforseo/reviews.json` with that shape and six synthetic items dated across the last 120 days.)
- [ ] Add ` lib/auditDeepParse.test.ts lib/siteCrawl.test.ts lib/planRules.test.ts lib/pitch.test.ts lib/plans.test.ts` to `test:onboarding`. `npm run lint`. Commit: `Deep audits: shapes, schema and fixtures`.

### Task 2: Deep parsers (pure, tested)

**Files:** create `lib/auditDeepParse.ts`, `lib/auditDeepParse.test.ts`.

**Produces:** `parseKeywordIdeas(result) → Array<{ keyword; volume; cpc }>`, `parseAdsVolume(resultArray) → Array<{ keyword; volume; cpc; competition }>`, `parseDomainOverview(result) → { organicKeywords; estTraffic; estPaidValue } | null`, `parseMapsProfile(item: Record<string,unknown>) → Pick<MapsItem, 'photos'|'claimed'|'booking'|'phone'|'openDays'|'stars'>` (used by `parseMapsItems` in Task 3), `parseReviews(result) → { rating; total; items: Array<{ at: string | null; stars: number | null; answered: boolean; text: string }> }`, `marketFromParts({ city, local, ranks }) → MarketResult`, `competitorProfiles(top: MapsItem[], self: MapsItem | null, overviews: Map<string, …>) → CompetitorsResult`, `profileFromItem(item: MapsItem) → ProfileResult`, `reviewsFromItems(items, now) → ReviewsResult` (velocity = items in last 90 days ÷ 3, only if ≥ 2 dated items and the sample reaches back ≥ 30 days; else null), `STOP_WORDS`, `topWords(texts, n = 8)`.

- [ ] Write the test file first (RED): one test per parser on its fixture (assert concrete numbers from the fixture you trimmed, e.g. `parseAdsVolume` → `junk removal des moines` 170 / 11.56 / HIGH; `parseDomainOverview` → `count 16954`, `etv ≈ 38912`), plus the three Review Focus cases: null-volume keyword excluded from `missedSearches`; competitor with `domain: null` keeps profile fields; `reviewsFromItems([])` and one-item input → `perMonth90d: null`. `topWords` drops stop words and numbers, lowercases, min length 4.
- [ ] Implement; GREEN; `npm run lint`; commit `Deep audits: DataForSEO parsers`.

### Task 3: Deep sources, site crawl, composeAudit(deep)

**Files:** create `lib/siteCrawl.ts`, `lib/siteCrawl.test.ts`, `lib/auditDeep.ts`; modify `lib/auditParse.ts` (`parseMapsItems` keeps profile fields via `parseMapsProfile`), `lib/auditSources.ts` (export `fetchPublic`/`assertPublic` for reuse), `lib/audits.ts` (`composeAudit` `deep` option; `runAudit` `deep` option writes `audits.deep`, sets `onboardings.last_deep_at`; `completePendingReviews(auditId)`), `lib/audits.test.ts` (deep path with fakes).

**Produces (`lib/auditDeep.ts`):** `keywordIdeas(seed) → SourceResult<Array<{keyword;volume;cpc}>>`, `adsVolume(keywords, location) → SourceResult<…>`, `domainOverview(domain) → SourceResult<…|null>`, `reviewsPost(business, location) → SourceResult<{ taskId }>`, `reviewsGet(taskId) → SourceResult<ReturnType<typeof parseReviews> | 'pending'>`, `DeepSources` interface + `defaultDeepSources`. **`lib/siteCrawl.ts`:** `pickInternalLinks(html, baseUrl, max = 15): string[]` (pure, tested: same host only, http(s) only, strips `#`, dedupes, skips mailto/tel/files), `crawlSite(url, keywords: string[], fetchPage = fetchPublic) → SourceResult<SiteResult>` (timeouts: 8 s per page, 60 s total, 4 at a time), `coverageFor(pages, keyword) → { covered; url }` (head terms = keyword minus the city and stop words; covered when every head term appears in title, h1 or URL path of one page).

- [ ] RED: `siteCrawl.test.ts` for `pickInternalLinks` (Review Focus 5) and `coverageFor`; extend `audits.test.ts`: `composeAudit(subject, { grid: false, deep: true, sources, deepSources: fakes })` fills all five sections, `deep` cost is summed, a failed `adsVolume` makes `market` a section error while the others stand, `reviewsGet → 'pending'` yields the `reviews` error "still processing" with `raw.reviewsTaskId` set.
- [ ] Implement. Deep flow in `composeAudit`, after the Phase 1 Maps step: `reviewsPost` immediately (if subject known); then in parallel `keywordIdeas` → `adsVolume(top 30 + city variants)` → ranks for the top 8 (`mapsSearch` + `organicSearch`, 5 at a time); `domainOverview` for self + up to 3 competitor domains; `crawlSite(website, top8 keywords)`; `profileFromItem(self)`; finally `reviewsGet` polled every 5 s up to 90 s. Add `deep` to `RunOptions`; `runAudit` persists `deep`, and when `onboardingId` is set and `deep`, `UPDATE onboardings SET last_deep_at = now()`. `completePendingReviews(auditId)`: reads `raw.reviewsTaskId`, calls `reviewsGet`, on data writes `results.reviews` + clears the error, returns the row.
- [ ] GREEN; lint; commit `Deep audits: market, competitors, profile, reviews and site crawl`.

### Task 4: Plan rules and storage

**Files:** create `lib/planRules.ts`, `lib/planRules.test.ts`, `lib/plans.ts`, `lib/plans.test.ts` (pure parts: `mergeDraft`, `statusFor`).

**Produces:** `PlanDraft`, `PlanItem` types; `planFromAudit(audit: Pick<AuditRow,'results'|'subject'|'createdAt'>, opts?: { max?: number }) → PlanDraft[]` (rules spec §3.1, ordered by `impact` desc then rule order, cap 12); `metricValue(results, metric) → number | boolean | null` (reads the metric from any audit, quick or deep); `statusFor(item, now) → PlanItem['status']` (done when target met: numeric metrics compare `>=` except `mapsRank` which is `<=`; booleans equal; slipping when `elapsed/window > 0.6` and `(current - start)/(target - start) < 0.4`); `mergeDraft(existing: PlanItem | null, draft: PlanDraft, now) → PlanItem` (Review Focus 4: keeps `title/owner/target` when `existing.edited`; never resurrects `dropped`); DB: `listPlan(onboardingId)`, `syncPlan(onboardingId, audit, kickoffAt)`, `recheckPlan(onboardingId, audit)`, `updatePlanItem(onboardingId, id, patch)` (sets `edited = true` when title/owner/target change), `addPlanItem(onboardingId, { title, owner, why? })`, `validatePlanItemInput(raw)`.

- [ ] RED: `planRules.test.ts` builds one rich fake deep audit (reviews 18 vs top-3 avg 150, rank 7, two uncovered keywords 480 and 90 vol, no booking, photos 31 vs avg 140, no tap-to-call, response rate 0.2, grid 0.32) and asserts the keys, order, owners, targets and `why` text (`/average 150 reviews/`, `/480 searches/`), the cap, and that a quick audit (no deep sections) still yields `maps-top3` + site basics only. `plans.test.ts`: `mergeDraft` (Review Focus 4), `statusFor` done/slipping/on_track, `metricValue` for `coverage:<kw>` and `mapsRank`.
- [ ] Implement; GREEN; lint; commit `Plan: rules, storage and re-check`.
- [ ] Wire: `lib/audits.ts` `runAudit` → after insert, when `onboardingId`: `deep ? syncPlan(onboardingId, row, kickoffAt) : recheckPlan(onboardingId, row)` (import lazily to avoid cycles if any).

### Task 5: Pitch text + admin UI (plan panel, deep readout, pitch sheet)

**Files:** create `lib/pitch.ts`, `lib/pitch.test.ts`, `components/admin/PlanPanel.tsx`, `components/admin/PitchSheet.tsx`; modify `components/admin/AuditReadout.tsx` (five deep blocks), `components/admin/AuditsConsole.tsx` (Deep checkbox default on, Pitch/Full toggle, Copy as text), `components/insights/ProjectPanel.tsx` (Run deep audit, deep badge, `deep_refresh_days` field, PlanPanel), `app/api/admin/onboarding/[token]/project/route.ts` (`POST kind: 'deep-audit' | 'plan-update' | 'plan-add' | 'reviews-fetch'`; `GET` adds `plan`), `app/api/admin/audits/route.ts` (`deep` flag; `POST` returns `{ audit, plan: PlanDraft[] }`), `app/admin/onboarding/[token]/page.tsx` (load `plan`), `lib/audits.ts` `validateAuditSettingsInput` + `setAuditSettings` + `AuditSettings` gain `deepRefreshDays`.

**Produces:** `pitchText(audit, drafts) → string` (≤ 12 lines: headline numbers, top-3 line, three actions; omits any line whose section is missing). `pitchNumbers(audit) → { missedSearches; missedAdValue; reviewGap; top3Velocity; rank; gridShare }`.

- [ ] RED `pitch.test.ts`: full audit → 12 lines max with `$`-formatted ad value and "#7 on Maps"; quick-only audit → no market lines, still ≤ 12; no competitors → no gap line.
- [ ] Implement everything; manual check in `npm run dev` against the sandbox is **not** possible for Labs/Ads (sandbox returns sample data for SERP only) — use the fixtures via tests, then one live deep audit on a prospect in Task 7.
- [ ] lint; commit `Admin: deep readout, 90-day plan panel, pitch sheet with Copy as text`.

### Task 6: Cron deep cadence + PROOF progress strip and checklist

**Files:** modify `app/api/cron/audits/route.ts` (deep when no deep yet or `last_deep_at` older than `deep_refresh_days`; also `completePendingReviews` for audits from the last 24 h with `raw.reviewsTaskId`), `lib/proofDashboardData.ts` (`ranking.progress` + `plan` for the client), `components/proof/RankingCard.tsx` (progress strip), create `components/proof/PlanChecklist.tsx`, `components/proof/ProofDashboard.tsx` (render checklist under the card).

- [ ] Progress strip data (pure helper `progressFrom(baselineDeep, latestAny, latestDeep)` in `lib/auditShared.ts`, tested in `auditShared.test.ts`): rank, reviews, `showingFor` (top-8 keywords with mapsRank ≤ 3), `siteHealth` (count of https, clickToCall, form, pagespeed ≥ 50, schema, no broken, out of 6). Each tile `{ label, baseline, now, better: boolean | null }`.
- [ ] Implement; lint; commit `PROOF: progress strip and plan checklist; cron runs deep audits on the refresh cadence`.

### Task 7: Verify, live run, merge

- [ ] `npm run lint && npm run test:onboarding && npm run build && npm run verify`.
- [ ] Push `deep-audits`, open the PR (title "Deep audits, 90-day plan, pitch and progress views"), fast-forward `main` when green (owner said push right away).
- [ ] One live deep audit on production for a prospect (`/admin/audits`, Deep on): confirm market numbers, competitor table, profile, site coverage; reviews may show "still processing" — press **Fetch reviews** after a minute. Cost should print ≈ $0.25.
- [ ] Final self-review per executing-plans (fresh reviewer if available), ledger, memory.
