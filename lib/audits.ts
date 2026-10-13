// lib/audits.ts
// Business audits: run one (composeAudit → the six sources, then one row in
// `audits`), and everything the admin, the cron, the monthly report and the
// client's Scan button need to read or change around them. The pure rules are
// in lib/auditShared.ts. Spec: docs/superpowers/specs/2026-10-12-business-audit-design.md
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import type { Onboarding } from '@/lib/onboarding';
import { monthOf } from '@/lib/siteStats';
import { defaultSources, type Sources } from '@/lib/auditSources';
import { defaultDeepSources, type DeepSources } from '@/lib/auditDeep';
import { competitorProfiles, marketFromParts, profileFromItem, reviewsFromItems, type DomainOverview, type RankPair } from '@/lib/auditDeepParse';
import {
  auditLeaks,
  auditLocation,
  auditStatus,
  baselineFromAudit,
  competitors,
  domainOf,
  isAuditTrigger,
  matchSubject,
  matchableDomain,
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
export interface ComposeOptions {
  grid: boolean;
  /** Phase 2: market, competitors, profile, reviews and crawl sections (≈ $0.25). */
  deep?: boolean;
  sources?: Partial<Sources>;
  deepSources?: Partial<DeepSources>;
  /** How long to wait for the async reviews task before leaving it for later (tests pass 0). */
  pollBudgetMs?: number;
  pollMs?: number;
}

export async function composeAudit(subject: AuditSubject, opts: ComposeOptions): Promise<Composed> {
  const S: Sources = { ...defaultSources, ...opts.sources };
  const D: DeepSources = { ...defaultDeepSources, ...opts.deepSources };
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
  // Reviews are an async DataForSEO task: start it now, collect it at the end.
  const reviewsPosted = opts.deep && maps.ok ? D.reviewsPost(subject.business, location) : null;

  // A page on a shared host (Facebook, Yelp…) is not the business's website: nothing to rank or check.
  const domain = matchableDomain(subject.website);
  const website = domain ? normalizeWebsite(subject.website) : null;
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
      // The lookup is a free-text search: only trust its hit when it is recognisably this business.
      const b = bi.data && matchSubject(subject, [bi.data]) ? bi.data : null;
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

  if (opts.deep) {
    const add = (c: number) => {
      cost += c;
    };
    await runDeep({ S, D, subject: { ...subject, ...(learned ?? {}) }, location, city, mapsItems: maps.ok ? maps.data : null, self, website, domain, results, errors, raw, add, reviewsPosted, pollBudgetMs: opts.pollBudgetMs ?? 90_000, pollMs: opts.pollMs ?? 5_000 });
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
  deep?: boolean | null;
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
  deep: Boolean(r.deep),
});

export async function getAudit(id: number, withRaw = false): Promise<(AuditRow & { raw?: unknown }) | null> {
  await ensureSchema();
  const res = withRaw
    ? await sql<Row>`SELECT * FROM audits WHERE id = ${id} LIMIT 1;`
    : await sql<Row>`SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at, deep FROM audits WHERE id = ${id} LIMIT 1;`;
  const r = res.rows[0];
  if (!r) return null;
  return withRaw ? { ...toRow(r), raw: r.raw ?? null } : toRow(r);
}

export async function listAuditsForOnboarding(onboardingId: number, limit = 60): Promise<AuditRow[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<Row>`
    SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at, deep
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
    SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at, deep
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
    SELECT DISTINCT ON (call_lead_id) id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at, deep
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
    SELECT id, onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, cost_usd, created_at, deep
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
      AND NOT (results->'maps' ? 'error')
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

/** Fills blanks only: a later audit that matched the wrong listing must not overwrite a pin that was right. */
async function rememberPin(onboardingId: number, l: Learned): Promise<void> {
  await sql`
    UPDATE onboardings SET audit_place_id = COALESCE(audit_place_id, ${l.placeId}), audit_cid = COALESCE(audit_cid, ${l.cid}),
      audit_lat = COALESCE(audit_lat, ${l.lat}), audit_lng = COALESCE(audit_lng, ${l.lng})
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

export interface RunOptions { trigger: AuditTrigger; onboardingId?: number | null; callLeadId?: number | null; grid: boolean; deep?: boolean }

export async function runAudit(subject: AuditSubject, opts: RunOptions): Promise<AuditRow> {
  if (!isDatabaseConfigured()) throw new Error('Audits need the database (POSTGRES_URL).');
  await ensureSchema();
  await assertBudget();
  const deep = opts.deep === true;
  const c = await composeAudit(subject, { grid: opts.grid, deep });
  const res = await sql<{ id: number }>`
    INSERT INTO audits (onboarding_id, call_lead_id, subject, trigger, status, results, leaks, errors, raw, cost_usd, deep)
    VALUES (${opts.onboardingId ?? null}, ${opts.callLeadId ?? null}, ${JSON.stringify(c.subject)}::jsonb, ${opts.trigger}, ${c.status},
            ${JSON.stringify(c.results)}::jsonb, ${JSON.stringify(c.leaks)}::jsonb, ${JSON.stringify(c.errors)}::jsonb, ${JSON.stringify(c.raw)}::jsonb, ${c.costUsd}, ${deep})
    RETURNING id;
  `;
  const row = await getAudit(res.rows[0].id);
  if (!row) throw new Error('Audit was not saved');
  if (opts.onboardingId) {
    if (c.learned) await rememberPin(opts.onboardingId, c.learned);
    await applyBaseline(opts.onboardingId, row, false);
    if (deep) await sql`UPDATE onboardings SET last_deep_at = now() WHERE id = ${opts.onboardingId};`;
    // The 90-day plan follows the numbers: a deep audit (re)drafts it, any audit re-checks it (lib/plans.ts).
    const { recheckPlan, syncPlan } = await import('@/lib/plans');
    if (deep) {
      const { getProjectDetails } = await import('@/lib/projects');
      await syncPlan(opts.onboardingId, row, (await getProjectDetails(opts.onboardingId)).kickoffAt);
    } else {
      await recheckPlan(opts.onboardingId, row);
    }
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

// ───────────────────────────── Deep audit (phase 2) ─────────────────────────────

interface DeepCtx {
  S: Sources;
  D: DeepSources;
  subject: AuditSubject;
  location: string;
  city: string;
  mapsItems: MapsItem[] | null;
  self: MapsItem | null;
  website: string | null;
  domain: string | null;
  results: AuditResults;
  errors: Record<string, string>;
  raw: Record<string, unknown>;
  add: (cost: number) => void;
  reviewsPosted: Promise<Awaited<ReturnType<DeepSources['reviewsPost']>>> | null;
  pollBudgetMs: number;
  pollMs: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TOP_RANKED = 8;

/** Market, competitors, profile, crawl in parallel; reviews collected last. Every section stands or fails alone. */
async function runDeep(ctx: DeepCtx): Promise<void> {
  const { S, D, subject, location, city, mapsItems, self, website, domain, results, errors, raw, add } = ctx;
  const fail = (section: 'market' | 'competitors' | 'profile' | 'reviews' | 'crawl', msg: string) => {
    results[section] = { error: msg };
    errors[section] = msg;
  };

  // Market: ideas (national, to choose) → local volume (city) → ranks for the top 8.
  const market = (async () => {
    const ideas = await D.keywordIdeas(subject.keyword);
    if (!ideas.ok) return fail('market', ideas.error);
    add(ideas.cost);
    raw.keywordIdeas = ideas.raw;
    const picked = [subject.keyword, ...ideas.data.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).map((i) => i.keyword)].filter((k, i, a) => a.indexOf(k) === i).slice(0, 20);
    const variants = picked.slice(0, 6).map((k) => `${k} ${city.toLowerCase()}`).filter((k) => !picked.includes(k));
    const list = [...picked, ...variants].slice(0, 30);
    const local = await D.adsVolume(list, location);
    if (!local.ok) return fail('market', local.error);
    add(local.cost);
    raw.adsVolume = local.raw;
    const top = [...local.data].filter((k) => k.volume !== null).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, TOP_RANKED);
    const ranks = new Map<string, RankPair>();
    for (let i = 0; i < top.length; i += 4) {
      await Promise.all(
        top.slice(i, i + 4).map(async (k) => {
          const [m, o] = await Promise.all([S.mapsSearch(k.keyword, { location }), domain ? S.organicSearch(k.keyword, location) : null]);
          const pair: RankPair = { mapsRank: null, organicRank: null };
          if (m.ok) {
            add(m.cost);
            pair.mapsRank = matchSubject(subject, m.data)?.item.rank ?? null;
          }
          if (o && o.ok) {
            add(o.cost);
            pair.organicRank = o.data.find((r) => domainOf(r.domain) === domain)?.rank ?? null;
          }
          ranks.set(k.keyword, pair);
        })
      );
    }
    results.market = marketFromParts({ city, local: local.data, ranks });
    return results.market.keywords.filter((k) => k.measured).map((k) => k.keyword);
  })();

  // Competitors: the Maps top 3 + self, with domain strength where a domain exists.
  const competitors = (async () => {
    if (!mapsItems) return fail('competitors', 'Maps did not come back, so there is no top 3 to compare');
    const top = mapsItems.filter((i) => i.rank <= 3);
    const domains = [...new Set([...top, ...(self ? [self] : [])].map((i) => matchableDomain(i.domain ? `https://${i.domain}` : null)).filter((d): d is string => Boolean(d)))];
    const overviews = new Map<string, DomainOverview | null>();
    await Promise.all(
      domains.map(async (d) => {
        const r = await D.domainOverview(d);
        if (r.ok) {
          add(r.cost);
          overviews.set(d, r.data);
        }
      })
    );
    raw.domainOverview = Object.fromEntries(overviews);
    results.competitors = competitorProfiles(top, self, overviews);
  })();

  // Profile: free, from the subject's own Maps item.
  if (self) results.profile = profileFromItem(self);
  else fail('profile', 'The business was not found on Maps, so its profile could not be read');

  // Crawl needs the measured keywords for coverage: wait for market, then crawl.
  const crawl = (async () => {
    const measured = await market;
    if (!website) return fail('crawl', 'No website to crawl');
    const r = await D.crawl(website, Array.isArray(measured) ? measured : [subject.keyword], city);
    if (!r.ok) return fail('crawl', r.error);
    raw.crawl = r.raw;
    results.crawl = r.data;
  })();

  await Promise.all([competitors, crawl]);

  // Reviews: collect the task we posted at the start; leave a handle if it is not ready.
  const posted = ctx.reviewsPosted ? await ctx.reviewsPosted : null;
  if (!posted) return fail('reviews', 'Reviews need the business on Maps first');
  if (!posted.ok) return fail('reviews', posted.error);
  add(posted.cost);
  const started = Date.now();
  for (;;) {
    const got = await D.reviewsGet(posted.data.taskId);
    if (!got.ok) return fail('reviews', got.error);
    if (got.data !== 'pending') {
      add(got.cost);
      raw.reviews = got.raw;
      results.reviews = reviewsFromItems(got.data.items);
      return;
    }
    if (Date.now() - started >= ctx.pollBudgetMs) break;
    await sleep(ctx.pollMs);
  }
  raw.reviewsTaskId = posted.data.taskId;
  fail('reviews', 'Reviews are still processing at DataForSEO — fetched automatically later, or press Fetch reviews');
}

/** Finishes a deep audit whose reviews task was still running: fetches it and writes the section. */
export async function completePendingReviews(auditId: number): Promise<AuditRow | null> {
  await ensureSchema();
  const full = await getAudit(auditId, true);
  if (!full) return null;
  const raw = (full.raw && typeof full.raw === 'object' ? (full.raw as Record<string, unknown>) : {}) as Record<string, unknown>;
  const taskId = typeof raw.reviewsTaskId === 'string' ? raw.reviewsTaskId : null;
  if (!taskId) return full;
  const got = await defaultDeepSources.reviewsGet(taskId);
  if (!got.ok || got.data === 'pending') return full;
  const results: AuditResults = { ...full.results, reviews: reviewsFromItems(got.data.items) };
  const errors = { ...full.errors };
  delete errors.reviews;
  const { reviewsTaskId: _done, ...rest } = raw;
  const nextRaw = { ...rest, reviews: got.raw };
  await sql`
    UPDATE audits SET results = ${JSON.stringify(results)}::jsonb, errors = ${JSON.stringify(errors)}::jsonb, raw = ${JSON.stringify(nextRaw)}::jsonb,
      status = ${auditStatus(results)}, cost_usd = cost_usd + ${got.cost}
    WHERE id = ${auditId};
  `;
  return getAudit(auditId);
}

/** Audits from the last day still waiting on their reviews task. */
export async function auditsWithPendingReviews(): Promise<number[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<{ id: number }>`SELECT id FROM audits WHERE raw ? 'reviewsTaskId' AND created_at > now() - interval '1 day' ORDER BY id;`;
  return res.rows.map((r) => r.id);
}
