// lib/siteStats.ts
// Website tracking for client sites. Each site we build loads
// https://axeonstudio.co/t.js with its site key; the script posts page views
// and button clicks (call, text, email, form, book, directions, other buttons)
// to /api/t, which stores them in site_events. This module validates those
// events, hashes the visitor, and sums a month into a TrafficSummary for the
// automatic monthly report (lib/autoReports.ts) and the admin.
//
// Privacy: no cookies, no IP stored. `visitor` is sha256(secret, month, ip, UA)
// cut short, and the salt changes every month, so "visitors" means unique
// people that month and no row identifies anyone.
import { createHash, createHmac, randomInt } from 'node:crypto';
import { sql, ensureSchema, isDatabaseConfigured } from '@/lib/db';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { CONVERSION_NAMES, type TrafficSummary } from '@/lib/projectsShared';

/** Month boundaries for reports follow the clients' clock (Iowa). */
export const REPORT_TIME_ZONE = 'America/Chicago';

export const DEFAULT_CLOSE_RATE = 25;

/** Raw events are kept this long; the monthly reports keep the summaries forever. */
export const EVENT_RETENTION_DAYS = 455;

export type EventKind = 'view' | 'click';

export interface TrackingEvent {
  siteKey: string;
  kind: EventKind;
  /** Click name: call, text, email, form, book, directions, or a button's text. Null for views. */
  name: string | null;
  path: string;
  /** Referrer host, lower-case, without a leading www. Empty = direct. */
  referrer: string;
}

export interface TrackingSettings {
  siteKey: string | null;
  siteUrl: string | null;
  closeRate: number;
  autoReports: boolean;
}

// ───────────────────────────── Pure helpers ─────────────────────────────

// Lower-case letters and digits only, no look-alikes, so the key survives being
// typed from a screenshot. 30^14 ≈ 2^69: unguessable, and a wrong key is just dropped.
const KEY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz2345679';
const KEY_RE = /^ax_[a-z2-9]{14}$/;

export function generateSiteKey(): string {
  let out = 'ax_';
  for (let i = 0; i < 14; i += 1) out += KEY_ALPHABET[randomInt(KEY_ALPHABET.length)];
  return out;
}

export const isValidSiteKey = (v: unknown): v is string => typeof v === 'string' && KEY_RE.test(v);

/** The one line a client site needs. Shown in the admin with a copy button. */
export function trackingSnippet(siteKey: string): string {
  return `<script defer src="${SITE_ORIGIN}/t.js" data-site="${siteKey}"></script>`;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max) : '');

/** Lower-case, one space between words, letters/digits/basic punctuation only. */
export function normalizeClickName(raw: unknown): string | null {
  const name = str(raw, 80)
    .toLowerCase()
    .replace(/[^a-z0-9 _:./&'()+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return name || null;
}

/** Host of a referrer URL (or a bare host), lower-case without www. Empty for none, invalid, or same-site. */
export function referrerHost(raw: unknown, pageHost?: string): string {
  const value = str(raw, 500);
  if (!value) return '';
  let host = value;
  try {
    host = new URL(value.includes('://') ? value : `https://${value}`).hostname;
  } catch {
    return '';
  }
  host = host.toLowerCase().replace(/^www\./, '');
  if (pageHost && host === pageHost.toLowerCase().replace(/^www\./, '')) return '';
  return host.slice(0, 120);
}

/**
 * Turns whatever the browser posted into an event, or null to drop it. Views
 * carry no name; clicks need one. Paths are kept to the pathname (no query).
 */
export function parseTrackingEvent(raw: unknown): TrackingEvent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  if (!isValidSiteKey(body.k)) return null;
  const kind = body.e === 'view' ? 'view' : body.e === 'click' ? 'click' : null;
  if (!kind) return null;
  const name = kind === 'click' ? normalizeClickName(body.n) : null;
  if (kind === 'click' && !name) return null;
  let path = str(body.p, 300);
  if (!path.startsWith('/')) path = '/';
  path = path.split(/[?#]/)[0] || '/';
  const pageHost = str(body.h, 200);
  return { siteKey: body.k, kind, name, path, referrer: referrerHost(body.r, pageHost) };
}

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|preview|curl|wget|python|java\/|go-http|node-fetch|axios|scrapy/i;

/** Crawlers and monitors never count as visitors. An empty User-Agent is treated as a bot. */
export function looksLikeBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 10) return true;
  return BOT_RE.test(userAgent);
}

/** "YYYY-MM" of the month `now` falls in, in the report time zone. */
export function monthOf(now: number | Date = Date.now(), timeZone: string = REPORT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(new Date(now));
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  return `${y}-${m}`;
}

/** The month before `month` ("2026-01" -> "2025-12"). */
export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const isValidMonth = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

/** Salted, rotating hash so a row never identifies a person. */
export function visitorHash(ip: string, userAgent: string, month: string, secret: string): string {
  const salt = createHmac('sha256', secret).update(month).digest('hex');
  return createHash('sha256').update(`${salt}|${ip}|${userAgent}`).digest('hex').slice(0, 24);
}

export function isConversion(name: string): boolean {
  return (CONVERSION_NAMES as readonly string[]).includes(name);
}

/** Rounds down to a whole number: never promise a customer that is not there. */
export function estimateCustomers(conversions: number, closeRate: number): number {
  if (conversions <= 0 || closeRate <= 0) return 0;
  return Math.floor((conversions * closeRate) / 100);
}

export function validateCloseRate(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return DEFAULT_CLOSE_RATE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error('Close rate must be between 0 and 100 percent');
  return Math.round(n);
}

export function validateSiteUrl(raw: unknown): string | null {
  const v = str(raw, 300);
  if (!v) return null;
  if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(v)) throw new Error('Website address should look like https://example.com');
  return v.replace(/\/+$/, '');
}

/** Builds the summary from the grouped counts. Pure, so the tests can cover it without a database. */
export function summarize(input: {
  views: number;
  visitors: number;
  clicks: number;
  buttons: Array<{ name: string; count: number }>;
  pages: Array<{ path: string; count: number }>;
  sources: Array<{ host: string; count: number }>;
  closeRate: number;
}): TrafficSummary {
  const conversions = input.buttons.filter((b) => isConversion(b.name)).reduce((sum, b) => sum + b.count, 0);
  return {
    views: input.views,
    visitors: input.visitors,
    clicks: input.clicks,
    buttons: input.buttons,
    pages: input.pages,
    sources: input.sources,
    conversions,
    closeRate: input.closeRate,
    estimatedCustomers: estimateCustomers(conversions, input.closeRate),
  };
}

export const hasTraffic = (t: TrafficSummary | null | undefined): t is TrafficSummary => Boolean(t && (t.views > 0 || t.clicks > 0));

// ───────────────────────────── Database ─────────────────────────────

interface SettingsRow {
  site_key: string | null;
  site_url: string | null;
  close_rate: number | null;
  auto_reports: boolean | null;
}

const rowToSettings = (r: SettingsRow | undefined): TrackingSettings => ({
  siteKey: r?.site_key ?? null,
  siteUrl: r?.site_url ?? null,
  closeRate: r?.close_rate ?? DEFAULT_CLOSE_RATE,
  autoReports: r?.auto_reports ?? true,
});

export async function getTrackingSettings(onboardingId: number): Promise<TrackingSettings> {
  if (!isDatabaseConfigured()) return rowToSettings(undefined);
  await ensureSchema();
  const res = await sql<SettingsRow>`
    SELECT site_key, site_url, close_rate, auto_reports FROM onboardings WHERE id = ${onboardingId} LIMIT 1;
  `;
  return rowToSettings(res.rows[0]);
}

/** Every client gets a key the first time the admin opens their page. Idempotent. */
export async function ensureSiteKey(onboardingId: number): Promise<TrackingSettings> {
  const current = await getTrackingSettings(onboardingId);
  if (current.siteKey || !isDatabaseConfigured()) return current;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const key = generateSiteKey();
    const taken = await sql`SELECT 1 FROM onboardings WHERE site_key = ${key} LIMIT 1;`;
    if (taken.rows.length) continue;
    await sql`UPDATE onboardings SET site_key = ${key}, updated_at = now() WHERE id = ${onboardingId} AND site_key IS NULL;`;
    return getTrackingSettings(onboardingId);
  }
  throw new Error('Could not allocate a site key');
}

export async function setTrackingSettings(
  onboardingId: number,
  input: Pick<TrackingSettings, 'siteUrl' | 'closeRate' | 'autoReports'>
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE onboardings SET site_url = ${input.siteUrl}, close_rate = ${input.closeRate},
      auto_reports = ${input.autoReports}, updated_at = now()
    WHERE id = ${onboardingId};
  `;
}

const keyCache = new Map<string, { id: number | null; at: number }>();
const KEY_CACHE_MS = 5 * 60 * 1000;

/** Which client a site key belongs to. Cached per instance; unknown keys are cached too so a flood of junk costs one query. */
export async function onboardingIdForSiteKey(siteKey: string): Promise<number | null> {
  const hit = keyCache.get(siteKey);
  if (hit && Date.now() - hit.at < KEY_CACHE_MS) return hit.id;
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<{ id: number }>`SELECT id FROM onboardings WHERE site_key = ${siteKey} AND status <> 'closed' LIMIT 1;`;
  const id = res.rows[0]?.id ?? null;
  if (keyCache.size > 2000) keyCache.clear();
  keyCache.set(siteKey, { id, at: Date.now() });
  return id;
}

export async function recordEvent(onboardingId: number, event: TrackingEvent, visitor: string): Promise<void> {
  await sql`
    INSERT INTO site_events (onboarding_id, kind, name, path, referrer, visitor)
    VALUES (${onboardingId}, ${event.kind}, ${event.name}, ${event.path}, ${event.referrer}, ${visitor});
  `;
}

const EMPTY: TrafficSummary = summarize({ views: 0, visitors: 0, clicks: 0, buttons: [], pages: [], sources: [], closeRate: DEFAULT_CLOSE_RATE });

/**
 * One month of a client's website, with the month's edges at midnight in the
 * report time zone (Postgres handles daylight saving).
 */
export async function monthTraffic(onboardingId: number, month: string, closeRate: number): Promise<TrafficSummary> {
  if (!isDatabaseConfigured() || !isValidMonth(month)) return { ...EMPTY, closeRate };
  await ensureSchema();
  const first = `${month}-01`;
  const totals = await sql<{ views: number; visitors: number; clicks: number }>`
    SELECT
      (count(*) FILTER (WHERE kind = 'view'))::int AS views,
      (count(DISTINCT visitor) FILTER (WHERE kind = 'view'))::int AS visitors,
      (count(*) FILTER (WHERE kind = 'click'))::int AS clicks
    FROM site_events
    WHERE onboarding_id = ${onboardingId}
      AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
      AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE});
  `;
  const t = totals.rows[0] ?? { views: 0, visitors: 0, clicks: 0 };
  if (t.views === 0 && t.clicks === 0) return { ...EMPTY, closeRate };

  const [buttons, pages, sources] = await Promise.all([
    sql<{ name: string; count: number }>`
      SELECT name, count(*)::int AS count FROM site_events
      WHERE onboarding_id = ${onboardingId} AND kind = 'click' AND name IS NOT NULL
        AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
        AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
      GROUP BY name ORDER BY count DESC, name LIMIT 8;
    `,
    sql<{ path: string; count: number }>`
      SELECT path, count(*)::int AS count FROM site_events
      WHERE onboarding_id = ${onboardingId} AND kind = 'view' AND path IS NOT NULL
        AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
        AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
      GROUP BY path ORDER BY count DESC, path LIMIT 5;
    `,
    sql<{ host: string; count: number }>`
      SELECT coalesce(referrer, '') AS host, count(*)::int AS count FROM site_events
      WHERE onboarding_id = ${onboardingId} AND kind = 'view'
        AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
        AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
      GROUP BY host ORDER BY count DESC, host LIMIT 5;
    `,
  ]);
  return summarize({
    views: t.views,
    visitors: t.visitors,
    clicks: t.clicks,
    buttons: buttons.rows,
    pages: pages.rows,
    sources: sources.rows,
    closeRate,
  });
}

export interface TrackingOverview extends TrackingSettings {
  /** The line to paste into the client's site, or null before the key exists. */
  snippet: string | null;
  lastEventAt: string | null;
  /** The current month and the one before it, "YYYY-MM". */
  month: string;
  previous: string;
  thisMonth: TrafficSummary;
  lastMonth: TrafficSummary;
}

/** What the admin's tracking card shows: settings, snippet, this month and last month so far. Mints the key on first view. */
export async function trackingOverview(onboardingId: number): Promise<TrackingOverview> {
  const settings = await ensureSiteKey(onboardingId);
  const month = monthOf();
  const previous = previousMonth(month);
  const [thisMonth, lastMonth, last] = await Promise.all([
    monthTraffic(onboardingId, month, settings.closeRate),
    monthTraffic(onboardingId, previous, settings.closeRate),
    lastEventAt(onboardingId),
  ]);
  return {
    ...settings,
    snippet: settings.siteKey ? trackingSnippet(settings.siteKey) : null,
    lastEventAt: last,
    month,
    previous,
    thisMonth,
    lastMonth,
  };
}

/** When the site last sent anything, so the admin can tell "installed" from "not yet". */
export async function lastEventAt(onboardingId: number): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<{ at: string | null }>`SELECT max(created_at) AS at FROM site_events WHERE onboarding_id = ${onboardingId};`;
  const at = res.rows[0]?.at;
  return at ? new Date(at).toISOString() : null;
}

/** Drops raw events past the retention window. Reports keep their summaries. */
export async function pruneOldEvents(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  await ensureSchema();
  const res = await sql`DELETE FROM site_events WHERE created_at < now() - make_interval(days => ${EVENT_RETENTION_DAYS});`;
  return res.rowCount ?? 0;
}
