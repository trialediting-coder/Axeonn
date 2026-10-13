# Deep Audit, 90-Day Plan, Pitch & Progress views — design (Phase 2)

**Date:** 2026-10-13 · **Branch:** `deep-audits` (worktree `Desktop\axeon-deep-wt`, off `main` @ 03a3054)
**Builds on:** `2026-10-12-business-audit-design.md` (Phase 1: quick audit, baseline, schedule, scans), which stays as is.

## 1. Why

Phase 1 measures rank, reviews and the homepage. The owner's verdict (2026-10-13): too basic to sell with and not enough to plan from. DataForSEO has the rest, cheaply. Phase 2 adds a **deep audit** (market, competitors, profile, reviews, site), turns it into a **90-Day Plan** by rules, and shows the same data three ways: full for Axeon, simplified for a sales call, basic progress for the client.

Owner decisions (2026-10-13): one engine, three views, not separate systems. Deep data is for **selling** (pitch), **delivering** (plan), and **convincing** (client progress). The client's view can be very basic. Money is saved by running the deep audit once and deriving everything; later checks are the cheap quick audit.

Rulings made for the owner while asleep: **no AI-written text** anywhere (the plan's sentences are rule templates filled with measured numbers); sales gets **Copy as text**, no shareable page; deep audit **at kickoff and every `deep_refresh_days` (default 90)**, quick audits stay biweekly, client scans are always quick.

## 2. The deep audit

`composeAudit(subject, { grid, deep: true })` adds five sections to `AuditResults`, each `Section<T>` like the rest (independent, errors stored, never invented). Trigger `admin`, `schedule` or (never) `client`. Cost ≈ **$0.25** (quick audit ≈ $0.01–0.06).

| Section | Source (DataForSEO unless noted) | Cost |
|---|---|---|
| `market` | 1) `dataforseo_labs/google/keyword_ideas/live` — seed = main keyword, `location_code: 2840` (Labs rejects city names), `limit: 40`, national volumes used only to **pick** keywords. 2) `keywords_data/google_ads/search_volume/live` with `location_name` = the city, for up to 30 keywords: the top ideas plus `"<idea> <city>"` variants → **local** `search_volume`, `cpc`, `competition`. 3) For the top 8 by local volume: `serp/google/maps/live/advanced` and `serp/google/organic/live/advanced` (city) → the subject's Maps rank and web rank per keyword. | ≈ $0.014 + $0.09 + $0.032 |
| `competitors` | The Maps top 3 for the main keyword (already fetched): the free profile fields each Maps item carries (`total_photos`, `work_hours`, `rating_distribution`, `is_claimed`, `book_online_url`, `phone`, `domain`, categories) + `dataforseo_labs/google/domain_rank_overview/live` (`location_name: United States`) for each competitor domain and the subject's domain → organic keyword count, estimated monthly traffic (`etv`), estimated paid value. | ≈ $0.012 × up to 4 |
| `profile` | The subject's own Maps item (free; needs `maps.found`) → photos, hours (open days count, 24/7 flag), rating distribution (1–5 star counts), claimed, booking link, phone, website, categories. **Not** `my_business_info/live` (timed out twice in capture; keep it only as the Phase 1 fallback). | $0 |
| `reviews` | `business_data/google/reviews/task_post` (`keyword` = business, `location_name` = city, `depth: 50`, `sort_by: newest`) then `task_get/<id>` polled every 5 s for up to 90 s. From the dated items: reviews per month over the last 90 days (velocity), owner-response rate, share of 1–2★ in the last 50, and the 8 most frequent meaningful words in review text (stop-words removed; labelled "words reviewers use", not sentiment). Not ready in time → section error "reviews still processing" with the task id stored in `raw` so a re-run can fetch it. | ≈ $0.004 |
| `site` | Our own crawl (`lib/siteCrawl.ts`): homepage + up to 15 same-host links (nav first), each through `htmlChecks`; per page: title, h1, word count, tel link, form, schema, status, ms. **Service-page coverage:** for each of the market's top 8 keywords, does any page's title/h1/URL contain the keyword's head terms? Plus broken internal links (4xx/5xx), pages with no title, thin pages (< 150 words). Same SSRF rules as Phase 1. | $0 |

Partial failures behave as in Phase 1 (section error, status `partial`). A deep audit that fails every deep section is still a valid quick audit.

### 2.1 Shapes (added to `lib/auditShared.ts`)

```ts
interface MarketKeyword { keyword: string; volume: number | null; cpc: number | null; competition: 'LOW'|'MEDIUM'|'HIGH'|null; mapsRank: number | null; organicRank: number | null; measured: boolean /* ranks were checked */ }
interface MarketResult { city: string; keywords: MarketKeyword[]; missedSearches: number /* Σ volume where mapsRank null or > 3 */; missedAdValue: number /* Σ volume × cpc for those, $/mo */; measuredAt: string }
interface CompetitorProfile { name: string; rank: number; domain: string | null; rating: number | null; reviews: number | null; photos: number | null; claimed: boolean | null; booking: boolean; openDays: number | null; organicKeywords: number | null; estTraffic: number | null; self?: true }
interface CompetitorsResult { items: CompetitorProfile[] /* top 3 + self */ }
interface ProfileResult { photos: number | null; claimed: boolean | null; booking: boolean; phone: boolean; website: boolean; openDays: number | null; categories: string[]; stars: { 1: number; 2: number; 3: number; 4: number; 5: number } | null }
interface ReviewsResult { sampled: number; perMonth90d: number | null; responseRate: number | null; lowStarShare: number | null; words: Array<{ word: string; count: number }>; newestAt: string | null; oldestAt: string | null }
interface SitePage { url: string; status: number; title: string | null; h1: string | null; words: number; clickToCall: boolean; form: boolean; schema: string[]; ms: number }
interface SiteResult { pages: SitePage[]; broken: string[]; coverage: Array<{ keyword: string; covered: boolean; url: string | null }>; thin: number; untitled: number }
```

`AuditRow` gains `deep: boolean` (column `audits.deep BOOLEAN NOT NULL DEFAULT false`).

## 3. The 90-Day Plan

### 3.1 Rules (`lib/planRules.ts`, pure, tested)

`planFromAudit(audit, details): PlanDraft[]` returns ranked actions. Each: `key` (stable rule id, e.g. `reviews-gap`), `title`, `why` (sentence built from numbers), `owner: 'axeon' | 'client'`, `metric` (what the audit measures to close it: `reviews`, `mapsRank`, `photos`, `coverage:<keyword>`, `clickToCall`, `form`, `https`, `pagespeed`, `schema`, `claimed`, `booking`, `responseRate`, or `null` for manual), `target` (number | boolean | null), `current`, `impact` (1–3, for ordering). Rules, in priority order:

1. **Reviews gap** (`reviews-gap`, client+axeon): subject reviews < top-3 average → target = ceil(top-3 avg × 0.8), why cites both counts and velocity ("you add ~2/mo; the top 3 add ~14/mo").
2. **Maps top 3** (`maps-top3`, axeon): rank > 3 or not found → target rank 3.
3. **Missing service pages** (`coverage:<kw>`, axeon): one per uncovered top-8 keyword with local volume ≥ 20, ordered by volume → target `covered: true`, why cites volume and CPC ("480 searches/mo, $11 a click if you bought them").
4. **Profile gaps** (client unless noted): `claimed` false → claim (client); photos < top-3 avg × 0.6 → target photos (client); no booking link → add (client); hours missing → set (client); no website on the listing → add (axeon).
5. **Site basics** (axeon): no https, no tap-to-call, no form, PageSpeed < 50, no business schema, broken links > 0, untitled pages > 0, thin pages > 2.
6. **Review responses** (`response-rate`, client): response rate < 50% → target 80%.
7. **Grid share** (`grid-share`, axeon): `top3Share` < 0.5 → target 0.6.

Cap: 12 actions. Title and `why` are templates; no free text generated.

### 3.2 Storage and lifecycle (`lib/plans.ts`)

```sql
CREATE TABLE IF NOT EXISTS plan_items (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES onboardings(id) ON DELETE CASCADE,
  key TEXT NOT NULL,                      -- rule id, or custom:<uuid> for owner-added
  title TEXT NOT NULL, why TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL CHECK (owner IN ('axeon','client')),
  metric TEXT, target JSONB, current JSONB,
  impact INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL CHECK (status IN ('open','on_track','slipping','done','dropped')) DEFAULT 'open',
  due_at DATE, source_audit_id INTEGER, done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (onboarding_id, key)
);
```

- **Generate:** after a client's deep audit (`runAudit` with `onboardingId` + `deep`), `syncPlan(onboardingId, audit)`: upsert each draft by `key` (never overwrite a row the owner edited: `title`/`owner`/`target` keep owner edits; `current` and `status` always refresh), set `due_at` = kickoff + 90 days (or today + 90), mark rules that no longer fire as `done` (with `done_at`) when their metric is now met.
- **Re-check:** after every quick audit too, `recheckPlan(onboardingId, audit)` updates `current` and `status` for metrics the quick audit measures (`reviews`, `mapsRank`, `grid`, `clickToCall`, `form`, `https`, `pagespeed`, `schema`); `done` when target met, `slipping` when past 60% of the window with < 40% of the gap closed, else `on_track`/`open`.
- **Owner edits:** rename, change owner/target, drop, add custom (`metric: null`, manual done).

## 4. Views

### 4.1 Admin — client page (`components/insights/ProjectPanel.tsx` + new `components/admin/PlanPanel.tsx`)
- Audit card gains **Run deep audit** (next to Run audit now), a `deep` badge in history, and the deep sections in the readout (`AuditReadout` renders `market`, `competitors`, `profile`, `reviews`, `site` when present).
- New **90-Day Plan** card: ranked list with owner chip, status chip, "current → target", due; inline edit of title/owner/target, Drop, Mark done, Add action. Empty state: "Run a deep audit to draft the plan."
- Settings: `deep_refresh_days` (default 90) next to the interval.

### 4.2 Sales — Audits tab (`components/admin/AuditsConsole.tsx` + `components/admin/PitchSheet.tsx`, `lib/pitch.ts`)
- **Deep** checkbox on the prospect form (default on). A **Pitch** / **Full** toggle on the readout. Pitch = one screen: three big numbers (searches/mo they're not showing up for and the $/mo those clicks would cost in ads; review gap to the top 3 with velocity; Maps rank and grid share), the competitor table (reviews, photos, keywords, traffic), and **What we'd do first** = top 3 plan drafts (`planFromAudit` runs on the prospect audit in memory; nothing stored).
- **Copy as text** → `pitchText(audit)` (pure, tested): ≤ 12 lines, plain text, for a text or email.

### 4.3 Client — PROOF (`components/proof/RankingCard.tsx` → extended, + `components/proof/PlanChecklist.tsx`)
- **Progress strip** above the trend: four tiles, each baseline → now with the delta: Maps rank, reviews, searches you show up for (count of top-8 keywords with Maps rank ≤ 3 — from the latest deep audit), site health (count of site basics met out of 6). Baseline = the kickoff deep audit; "Measured after kickoff" until it exists.
- **Plan checklist:** the plan's non-dropped items, grouped Axeon / You, with status chips and "current → target". No `why` numbers about competitors, no costs.

## 5. Schedule & cost

- `onboardings.deep_refresh_days INTEGER NOT NULL DEFAULT 90`, `onboardings.last_deep_at TIMESTAMPTZ`.
- Cron (`/api/cron/audits`): when due, run **deep** if there is no deep audit yet or `last_deep_at` older than `deep_refresh_days`; else quick. Spend cap unchanged.
- Client scans and the biweekly default stay quick. Per client ≈ $0.25–0.45/month.

## 6. Out of scope

AI text; shareable/public pages; multiple tracked keywords beyond the market list; backlinks; DataForSEO On-Page crawler; review sentiment scoring; competitor review text.
