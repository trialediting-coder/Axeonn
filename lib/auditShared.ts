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
    .replace(/['’]/g, '') // "Joe's" and Google's "Joes" must meet
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
