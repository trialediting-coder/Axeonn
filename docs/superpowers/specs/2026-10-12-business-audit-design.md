# Business Audit — design

**Date:** 2026-10-12
**Status:** approved in conversation, awaiting owner review of this document
**Branch:** `business-audit` (worktree `Desktop\axeon-audit-wt`, cut from `origin/main` @ 98ddbeb)

## 1. Why

The admin's project panel asks Axeon to type a client's **baseline rank** next to the kickoff and launch dates (`lib/projects.ts` → `ProjectDetails.baselineRank`, stored on `onboardings.baseline_rank`). The monthly report asks for rank, reviews and rating again. Today those numbers are guesses, which undercuts the one promise the dashboard exists to prove: the 90-Day Customer Guarantee ("nothing is invented").

This feature measures them. A **business audit** is a dated snapshot of where a business stands on Google and on its own website. It runs for signed clients on a schedule, on demand for any prospect during sales and onboarding calls, and a few times a month by the client themselves inside AxeonPROOF.

## 2. Decisions already made (owner, 2026-10-12)

| Decision | Choice | Reason |
|---|---|---|
| Data source | **DataForSEO** REST API (no SDK, no no-code) | Real Google results for a chosen city; we may store the data indefinitely. Google Places was rejected because its terms restrict storing ratings/reviews past ~30 days, which kills baselines. |
| Who gets audited | Signed clients (automatic) + any business on demand (admin) | Clients need a baseline and a trend; sales needs a readout on a call. |
| Cadence for clients | Automatic every **14 days** (setting), starting the day kickoff is set | Consistent trend line; nobody has to remember. Not tighter than weekly: local rankings wobble day to day. |
| Client self-scans in PROOF | **AxeonCORE 3 / month, AxeonGROWTH 10 / month, Essentials 0** (per-client override) | A reason to log in between reports; a visible tier difference. |
| Official numbers | Only `schedule` and `admin` audits feed the monthly report; client scans are for looking | Keeps the proof trail consistent and immune to a client scanning on a bad day. |
| Summaries | Rule-based "money leaks" from measured numbers only; **no AI text** | Nothing estimated, nothing invented. |
| Failures | Save what succeeded, mark what's missing; never a fake zero | Same rule as the rest of PROOF. |
| Public share page | **Not in scope** | Internal tool. |

## 3. What one audit records

```jsonc
// audits.results — every section is independently present, or { "error": "…" }
{
  "maps": {
    "found": true,
    "rank": 7,                       // 1-based position in Google Maps results, null when not in top 20
    "matchedBy": "domain",           // placeId | domain | name
    "searched": { "keyword": "auto detailing", "location": "Ankeny,Iowa,United States" },
    "top": [                         // top 3 + the subject's own row when it is further down
      { "rank": 1, "name": "Example Shine Co", "rating": 4.9, "reviews": 212, "website": "example-shine.test" },
      { "rank": 2, "name": "Sample Detail Works", "rating": 4.8, "reviews": 140, "website": null },
      { "rank": 3, "name": "Demo Mobile Detail", "rating": 4.7, "reviews": 98, "website": "demo-detail.test" },
      { "rank": 7, "name": "Subject Auto Spa", "rating": 4.6, "reviews": 18, "website": "subject-spa.test", "self": true }
    ]
  },
  "organic": {
    "rank": null,                    // position of the subject's domain in regular results, null when not in top 20
    "domain": "subject-spa.test",
    "top": [ { "rank": 1, "domain": "yelp.com", "title": "Top 10 Best Auto Detailing in Ankeny" } ]
  },
  "reputation": { "rating": 4.6, "reviews": 18, "categories": ["Car detailing service"], "gbpUrl": "https://maps.google.com/?cid=…", "placeId": "ChIJ…" },
  "grid": {                          // optional, admin toggle per client; never on client self-scans
    "spacingMiles": 1, "size": 5,
    "points": [ { "lat": 41.73, "lng": -93.60, "rank": 3 } /* …25 */ ],
    "top3Share": 0.32,               // share of points where the subject is in the top 3
    "avgRank": 6.4                   // over points where found
  },
  "website": {                       // or { "none": true } when the subject has no site
    "url": "https://subject-spa.test/", "https": true,
    "pagespeedMobile": 41, "lcpMs": 4800,
    "clickToCall": false, "form": true,
    "title": "Home", "metaDescription": null,
    "schema": []                     // JSON-LD @type values found, e.g. ["LocalBusiness"]
  }
}
```

Alongside `results`, each audit stores:

- `leaks`: up to 5 `{ severity: 'high'|'medium'|'low', headline, detail }` from §6.
- `status`: `complete` (every section ok), `partial` (some errored), `failed` (all errored).
- `cost_usd`: summed from DataForSEO's per-task `cost` field (PageSpeed and the HTML check are free).
- `raw`: the DataForSEO and PageSpeed responses, trimmed to the first 20 items per task and capped at ~200 KB, so every number on screen can be traced to a response.
- `errors`: `{ section: message }` for anything that did not come back.

## 4. Data model (`lib/db.ts` → `ensureSchema`, idempotent like every other migration there)

```sql
CREATE TABLE IF NOT EXISTS audits (
  id            SERIAL PRIMARY KEY,
  onboarding_id INTEGER REFERENCES onboardings(id) ON DELETE SET NULL,  -- a client's audit
  call_lead_id  INTEGER REFERENCES call_leads(id)  ON DELETE SET NULL,  -- a prospect from the call deck
  subject       JSONB NOT NULL,   -- { business, city, state, website, keyword, placeId, cid, lat, lng }
  trigger       TEXT NOT NULL CHECK (trigger IN ('schedule','admin','client')),
  status        TEXT NOT NULL CHECK (status IN ('complete','partial','failed')),
  results       JSONB NOT NULL DEFAULT '{}'::jsonb,
  leaks         JSONB NOT NULL DEFAULT '[]'::jsonb,
  errors        JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw           JSONB,
  cost_usd      NUMERIC(8,4) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audits_onboarding_idx ON audits (onboarding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audits_lead_idx      ON audits (call_lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audits_month_idx     ON audits (created_at);

-- per-client audit settings live next to the other per-client settings
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_city            TEXT;              -- "Ankeny, IA"
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_website         TEXT;              -- the site to measure: the OLD one before launch
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_place_id        TEXT;              -- learned on first match
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_cid             TEXT;
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_lat             DOUBLE PRECISION;  -- the business's own pin, for the grid
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_lng             DOUBLE PRECISION;
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_grid            BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audit_interval_days   INTEGER NOT NULL DEFAULT 14;
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS audits_enabled        BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS client_scan_cap       INTEGER;           -- NULL = tier default (3 / 10 / 0)
ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS baseline_audit_id     INTEGER;           -- which audit set baseline_rank
```

The keyword is the existing `baseline_keyword`. The website is `audit_website`: before launch that is the client's old site (or blank when they have none), and at launch the admin switches it to the new one so the trend shows the before/after. The tracker's `site_url` is not reused, because it points at the new site from day one. One keyword per client in v1.

Spend guard: `AUDIT_MONTHLY_CAP_USD` (env, default `25`). Before any run, sum `cost_usd` for the current calendar month; at or over the cap, scheduled runs skip with a reason and manual runs return a clear error. No table needed.

## 5. Sources (`lib/auditSources.ts`)

Each source is a function returning `{ ok: true, data, cost, raw } | { ok: false, error }`. They never throw past their boundary; the orchestrator records the error and moves on.

| Source | Call | Notes |
|---|---|---|
| `mapsRank` | DataForSEO `POST /v3/serp/google/maps/live/advanced` — `keyword`, `location_name` ("Ankeny,Iowa,United States") or `location_coordinate` ("lat,lng,14z") once the pin is known, `language_code: en`, `depth: 20` | Subject matched per §5.1. Learns `place_id`, `cid`, `latitude`, `longitude`, rating and review count from the matched row. |
| `organicRank` | `POST /v3/serp/google/organic/live/advanced` — same keyword and `location_name`, `depth: 20` | Rank = first `organic` item whose domain equals the subject's domain (www stripped). Skipped when the subject has no website. |
| `businessInfo` | `POST /v3/business_data/google/my_business_info/live` — `keyword: "<business> <city>"` | Only when `mapsRank` did not find the subject (so we still get rating/reviews/GBP link). |
| `gridRank` | 25 × `mapsRank` with `location_coordinate` on a 5×5 grid centred on the subject's pin, `spacingMiles` 1 (constant, changeable later) | Requires a known pin; otherwise errors "run one audit first so we know where the business is". Admin toggle per client; never on client scans. |
| `pageSpeed` | Google PageSpeed Insights v5, `strategy=mobile`, `category=performance`, optional `PAGESPEED_API_KEY` | Free. Records performance score and LCP. |
| `siteCheck` | Our own fetch of the homepage | https (final URL after ≤3 redirects), any `tel:` link, any `<form>`, `<title>`, `meta[name=description]`, JSON-LD `@type` values. User-agent `AxeonAuditBot/1.0 (+https://axeonstudio.co)`, 10 s timeout, 2 MB cap, **http(s) only, private/loopback/link-local addresses refused** (SSRF guard). |

`lib/dataforseo.ts` is the only file that knows the API: Basic auth from `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`, base URL `DATAFORSEO_BASE` (default `https://api.dataforseo.com`; set to `https://sandbox.api.dataforseo.com` locally to build without spending), 60 s timeout, normalises DataForSEO's `status_code`/`status_message` into thrown errors, and returns each task's `cost`. Location names that DataForSEO does not recognise come back as a readable error ("DataForSEO doesn't know 'Ankney, IA' — check the spelling, or use the nearest larger city").

### 5.1 Matching the subject in results

In order: (1) stored `place_id` or `cid`; (2) website domain equals a result's domain; (3) normalised name equality or containment (lowercase, punctuation stripped, `llc|inc|co` dropped). The match method is stored in `results.maps.matchedBy`. No match → `found: false`, `rank: null`, and leak "Google isn't showing you for '…' in {city} at all."

### 5.2 Cost (DataForSEO list prices as of 2026-10, approximate)

~$0.002 per maps/organic task, ~$0.003 for business info → **≈ $0.01 per audit, ≈ $0.06 with the grid**. Ten clients, twice a month, grid on: ≈ $1.20 / month. Prices are read from the response, never hard-coded.

## 6. Money leaks (`lib/auditShared.ts`, pure, tested)

`auditLeaks(results): Leak[]` applies fixed rules in priority order and returns at most 5. Templates live in one array so copy edits are one-line changes. Rules:

1. Not found on Maps → high.
2. Maps rank > 3 → high; detail quotes the top-3 average review count vs the subject's.
3. Review gap alone (in top 3 but fewer than half the top-3 average) → medium.
4. Rating < 4.5 and below the top-3 average → medium.
5. Grid `top3Share` < 0.5 → medium ("You're in the top 3 from only 32% of Ankeny.").
6. No website → high. Else: not https → high; no click-to-call → high; no form → medium; PageSpeed mobile < 50 → medium; missing title or meta description → low; no LocalBusiness-type schema → low.
7. Organic rank null while a website exists → low ("Your site doesn't show in regular Google results for '…'.").

Every detail sentence is built only from numbers in `results`. If a section errored, its rules are skipped, and the readout shows "not measured" for that section.

## 7. Flows

### 7.1 Admin: a client's audit section (`components/insights/ProjectPanel.tsx`)

Under "Dates & 90-day baseline" a new **Audit** block:

- Settings: city (required to run), keyword (the existing Main keyword field), website to measure, grid on/off, interval days, scans-per-month override (blank = tier default), audits on/off. Saved via `POST { kind: 'audit-settings' }`.
- **Run audit now** → `POST { kind: 'audit' }`; spinner; readout appears when done (≈ 10–30 s, up to ~90 s with grid).
- History table: date, trigger, Maps rank, organic rank, rating / reviews, PageSpeed, status, cost; a row expands into the full readout (`components/admin/AuditReadout.tsx`).
- Baseline rule: the **first `schedule` or `admin` audit (status `complete` or `partial`) where `maps.found` is true** sets `baseline_rank` (and `baseline_keyword` if empty) and records `baseline_audit_id`; the form shows "Baseline set from the audit on Oct 12". Later audits never overwrite it. Any row has **Use as baseline** for corrections.

### 7.2 Schedule (`app/api/cron/audits/route.ts`, `vercel.json` `15 14 * * *`)

Daily, `Authorization: Bearer $CRON_SECRET`, same shape as `monthly-reports`. For every onboarding that is not `closed`, has `audits_enabled`, `kickoff_at`, `audit_city` and `baseline_keyword`: run a `schedule` audit when there is no previous `schedule` audit or the last one is ≥ `audit_interval_days` old. Daily-with-interval means a failed day retries tomorrow. Concurrency 2, `maxDuration 300`. Spend cap checked before each client. Response lists ran / skipped (with reasons) / failed; the owner gets an email only on a day something failed (reusing the digest helper pattern in `lib/email.ts`).

### 7.3 Monthly report fill (`lib/autoReports.ts`)

When the job builds the report for month M, any of `rank`, `keyword`, `reviews`, `rating` that Axeon left blank is filled from the **latest `schedule` or `admin` audit created in M** (never `client`). New `attachAuditToReport(onboardingId, month, patch)` in `lib/projects.ts` writes only keys that are currently null in the stored body (COALESCE-style merge, unlike `attachTrafficToReport`'s overwrite), so typed values always win. The admin report form shows "from the audit on Oct 26" next to filled fields.

### 7.4 Admin: prospects (`/admin/audits`, new **Audits** tab in `components/admin/AdminNav.tsx`)

- Form: business, city, state (default IA), keyword, website (optional), grid on/off → `POST /api/admin/audits`. Result renders in the same readout.
- List of past prospect audits (business, city, date, Maps rank, status), searchable by name, each opening its readout. `GET /api/admin/audits?q=&limit=`.
- **Call deck** (`components/admin/CallDeck.tsx`): an **Audit** button on each card, prefilled from the lead (business, city, website; keyword = `"<niche> <city>"` when the niche is set). Runs with `call_lead_id`; the card then shows a one-line summary ("Maps #7 · 18 reviews · no click-to-call") and a link to the readout. Latest audit per lead comes back with `GET /api/admin/calls`.
- **Attach to client**: on any prospect audit's readout, pick an onboarding from a dropdown → `POST /api/admin/audits/[id] { action: 'attach', onboardingId }`. Copies `audit_city`, `place_id`, `cid`, pin and keyword onto the onboarding, sets `audits.onboarding_id`, and applies the baseline rule from §7.1 if the client has no baseline yet. This is the "they signed, carry the audit over" step.

### 7.5 Client self-scan (AxeonPROOF, Overview tab)

A **Ranking** card (`components/proof/RankingCard.tsx`), shown only when the client's cap > 0 and city + keyword are set:

- Latest Maps rank for "{keyword} in {city}", rating and review count, and a small line chart of every audit since kickoff with the baseline marked.
- Fixed copy: "Rankings move a spot or two day to day. The line is what matters."
- **Scan now — 2 of 3 left this month** → `POST /api/proof/scan` (proof session required; acts only on the session's own onboarding). Server checks `count(trigger='client' AND created_at in current month) < cap`, runs a `client` audit **without grid**, returns the readout. Cap resets with the calendar month. Over cap → button disabled with "Next scans unlock Nov 1".
- Tier defaults: `essentials 0`, `axeoncore 3`, `axeongrowth 10`; `client_scan_cap` overrides. The client never types a keyword or city.

## 8. Module layout (flat `lib/`, per repo convention)

| File | Purpose |
|---|---|
| `lib/dataforseo.ts` | HTTP client for DataForSEO: auth, base URL, timeout, error and cost normalisation. |
| `lib/auditSources.ts` | The six sources in §5, each self-contained. |
| `lib/auditShared.ts` | Client-safe types (`AuditResults`, `Leak`, `AuditRow`), `auditLeaks`, subject matching, grid point generation, HTML checks on a string, tier caps, due-date check. **Tested.** |
| `lib/audits.ts` | `runAudit(subject, opts)` orchestrator (parallel sources, grid after the pin is known), DB read/write, spend cap, baseline rule, attach-to-client, monthly fill query, scheduled-run selection. |
| `lib/auditShared.test.ts`, `lib/audits.test.ts` | `node:test` via `tsx`, added to the `test:onboarding` script. Fixtures: sanitised sandbox responses under `lib/__fixtures__/dataforseo/`. |
| `app/api/admin/audits/route.ts`, `app/api/admin/audits/[id]/route.ts` | Prospect audits: list, run, read, attach, delete. `requireAdmin`. |
| `app/api/admin/onboarding/[token]/project/route.ts` | Extended: `GET` adds `audits` + `auditSettings`; `POST { kind: 'audit' }`, `POST { kind: 'audit-settings' }`, `POST { kind: 'audit-baseline', id }`. |
| `app/api/admin/calls/route.ts` | `GET` includes each lead's latest audit summary. |
| `app/api/proof/scan/route.ts` | Client self-scan with cap. |
| `app/api/cron/audits/route.ts` | Daily scheduler. |
| `components/admin/AuditReadout.tsx` | One readout component: sections, leaks, competitor table, grid heatmap (CSS grid of 25 cells coloured by rank), "not measured" states. `variant: 'admin' \| 'client'` hides cost/raw/matchedBy for clients. |
| `components/admin/AuditsConsole.tsx`, `app/admin/audits/page.tsx` | The Audits tab. |
| `components/proof/RankingCard.tsx` | §7.5. |

## 9. Error handling

- A source failure never fails the audit: `status: partial`, section shows "not measured — {reason}", its leak rules skip.
- All sources fail (e.g. DataForSEO credentials missing) → `status: failed`, still saved, readout says what to fix. Missing env vars produce the message "DataForSEO isn't connected — add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Vercel".
- Spend cap reached → scheduled: skipped with reason; manual: `409 { error: "This month's audit budget ($25) is used up. Raise AUDIT_MONTHLY_CAP_USD or wait for the 1st." }`.
- Unrecognised location → readable error before further paid calls: the maps call runs first; if it fails with a location message, the run stops and surfaces it.
- Client scan: any failure returns a friendly message and does **not** consume a scan (only completed/partial audits count toward the cap).
- Timeouts: 30 s per source, 60 s for DataForSEO calls, grid points run 5 at a time.

## 10. Security

- Admin routes: `requireAdmin`. Proof route: proof session, scoped to its own `onboarding_id`. Cron: `CRON_SECRET` bearer.
- Secrets only in env; never echoed in responses or `raw`.
- `siteCheck` fetch: http(s) only, DNS-resolved address must be public, ≤3 redirects re-checked, 2 MB cap, 10 s timeout.
- `raw` is admin-only; the client variant of the readout never receives it.

## 11. Testing

Pure logic under `node:test` (repo convention): subject matching (place_id, domain, name normalisation), `auditLeaks` rule priority and copy, grid point generation (25 points, spacing), HTML checks on fixture pages (tel link, form, title/meta, JSON-LD), DataForSEO response parsing on saved sandbox fixtures, due-date check for the scheduler, tier cap resolution and month counting, the COALESCE merge for report fill. Routes are exercised manually against the sandbox (`DATAFORSEO_BASE=https://sandbox.api.dataforseo.com`) and then one live audit per flow before merge. `npm run lint` (tsc) and `npm run verify` must pass.

## 12. Rollout

1. Owner adds to Vercel: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, optional `AUDIT_MONTHLY_CAP_USD`, optional `PAGESPEED_API_KEY`. Local `.env.local` points `DATAFORSEO_BASE` at the sandbox until funded.
2. Build order (each step shippable): (a) `dataforseo.ts` + sources + shared + tests; (b) Audits tab for prospects; (c) client audit section + baseline rule + cron; (d) monthly report fill; (e) PROOF Ranking card + scan; (f) call-deck button + attach-to-client.
3. `vercel.json` cron entry ships with (c).
4. First live run: audit the first signed client with the grid on, confirm the baseline lands, then enable the schedule.

## 13. Out of scope (v1)

Public/shareable audit pages; AI-written summaries; more than one tracked keyword per client; search volume, backlinks, review text analysis; Bing/Apple Maps; auditing prospects on a schedule; automatic keyword suggestion from the niche (the call-deck prefill is a plain string).
