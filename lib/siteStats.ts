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
import { CONVERSION_NAMES, type CloseRateEstimate, type TrafficDetail, type TrafficSummary } from '@/lib/projectsShared';
import { OBSERVED_FULL_MARKED, OBSERVED_MIN_MARKED, OBSERVED_MONTHS, type LeadOutcome, type LeadRow, type ObservedCloseRate } from '@/lib/projectsShared';

/** Month boundaries for reports follow the clients' clock (Iowa). */
export const REPORT_TIME_ZONE = 'America/Chicago';

export const DEFAULT_CLOSE_RATE = 25;

/** Raw events are kept this long; the monthly reports keep the summaries forever. */
export const EVENT_RETENTION_DAYS = 455;

export type EventKind = 'view' | 'click' | 'leave';
export type Device = 'phone' | 'tablet' | 'desktop';

export interface Utm {
  source: string;
  medium: string;
  campaign: string;
}

export interface TrackingEvent {
  siteKey: string;
  kind: EventKind;
  /** Click name: call, text, email, form, book, directions, review, a social link, or a button's text. Null otherwise. */
  name: string | null;
  path: string;
  /** Referrer host, lower-case, without a leading www. Empty = direct. */
  referrer: string;
  device: Device | null;
  /** Campaign tags from the page URL, or inferred from gclid / fbclid / msclkid. Null when untagged. */
  utm: Utm | null;
  /** 'leave' only: active seconds on the page, deepest scroll 0..100, load time in ms. */
  seconds: number | null;
  scroll: number | null;
  speedMs: number | null;
}

export type CloseRateMode = 'auto' | 'manual';

export interface TrackingSettings {
  siteKey: string | null;
  siteUrl: string | null;
  /** 'auto' estimates from the month's data; 'manual' uses closeRate as typed. */
  closeRateMode: CloseRateMode;
  closeRate: number;
  autoReports: boolean;
  /** Average job in whole dollars, or null when the client has not told us. */
  avgJobValue: number | null;
}

/** The rate to hand to monthTraffic: a number to use as-is, or null to estimate. */
export const effectiveCloseRate = (s: Pick<TrackingSettings, 'closeRateMode' | 'closeRate'>): number | null =>
  s.closeRateMode === 'manual' ? s.closeRate : null;

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

/**
 * The link that marks the browser it is opened in as the owner's own, so their
 * visits stop counting (public/t.js reads ?ax_ignore). Per device: a phone and a
 * laptop each need one tap. `count` true builds the link that counts it again.
 * Null until the admin has entered the client's website.
 */
export function ownVisitsUrl(siteUrl: string | null | undefined, count = false): string | null {
  if (!siteUrl) return null;
  try {
    const u = new URL(siteUrl);
    u.searchParams.set('ax_ignore', count ? '0' : '1');
    return u.toString();
  } catch {
    return null;
  }
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

/** Viewport width to a device class. Phones under 768 CSS px, tablets under 1024. */
export function deviceFromWidth(raw: unknown): Device | null {
  const w = Number(raw);
  if (!Number.isFinite(w) || w <= 0) return null;
  return w < 768 ? 'phone' : w < 1024 ? 'tablet' : 'desktop';
}

const tag = (v: string | null) => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 80);

/**
 * utm_source / utm_medium / utm_campaign from the page's query string. Google
 * Ads, Meta and Microsoft click ids count as paid traffic from that network
 * when no utm tags are present, so an ad click is never filed as "direct".
 */
export function parseUtm(search: unknown): Utm | null {
  const q = str(search, 2000);
  if (!q) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q);
  } catch {
    return null;
  }
  let source = tag(params.get('utm_source'));
  let medium = tag(params.get('utm_medium'));
  const campaign = tag(params.get('utm_campaign'));
  if (!source) {
    if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) source = 'google';
    else if (params.has('fbclid')) source = 'facebook';
    else if (params.has('msclkid')) source = 'bing';
    else if (params.has('ttclid')) source = 'tiktok';
    if (source && !medium) medium = 'cpc';
  }
  if (!source && !medium && !campaign) return null;
  return { source, medium, campaign };
}

const bounded = (raw: unknown, max: number): number | null => {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(max, Math.round(n));
};

/**
 * Turns whatever the browser posted into an event, or null to drop it. Views
 * carry no name; clicks need one; leaves carry engagement. Paths are kept to
 * the pathname (no query).
 */
export function parseTrackingEvent(raw: unknown): TrackingEvent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  if (!isValidSiteKey(body.k)) return null;
  const kind: EventKind | null = body.e === 'view' ? 'view' : body.e === 'click' ? 'click' : body.e === 'leave' ? 'leave' : null;
  if (!kind) return null;
  const name = kind === 'click' ? normalizeClickName(body.n) : null;
  if (kind === 'click' && !name) return null;
  let path = str(body.p, 300);
  if (!path.startsWith('/')) path = '/';
  path = path.split(/[?#]/)[0] || '/';
  const pageHost = str(body.h, 200);
  const leave = kind === 'leave';
  return {
    siteKey: body.k,
    kind,
    name,
    path,
    referrer: referrerHost(body.r, pageHost),
    device: deviceFromWidth(body.w),
    utm: kind === 'view' ? parseUtm(body.u) : null,
    seconds: leave ? bounded(body.t, 7200) : null,
    scroll: leave ? bounded(body.s, 100) : null,
    speedMs: leave ? bounded(body.ms, 120_000) : null,
  };
}

/**
 * "Des Moines, IA" from the headers Vercel adds at the edge. Coarse by design:
 * city and region only, computed before the request reaches us, and the IP
 * itself is never written anywhere.
 */
export function placeFromHeaders(h: { get(name: string): string | null }): string | null {
  const dec = (v: string | null) => {
    if (!v) return '';
    try {
      return decodeURIComponent(v).trim().slice(0, 80);
    } catch {
      return v.trim().slice(0, 80);
    }
  };
  const city = dec(h.get('x-vercel-ip-city'));
  const region = dec(h.get('x-vercel-ip-country-region'));
  const country = dec(h.get('x-vercel-ip-country')).toUpperCase();
  if (!city) return null;
  const tail = country && country !== 'US' ? country : region;
  return tail ? `${city}, ${tail}` : city;
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

/** Nearest whole customer. */
export function estimateCustomers(conversions: number, closeRate: number): number {
  if (conversions <= 0 || closeRate <= 0) return 0;
  return Math.round((conversions * closeRate) / 100);
}

/**
 * How often each way of reaching out turns into a paying job, for local service
 * businesses. Someone who books online has already picked a time; someone who
 * emails is often still shopping. The headline uses the upper figure and the
 * range runs from the lower one: optimistic, and defensible to the client.
 */
export const CONTACT_CLOSE_RATES: Record<(typeof CONVERSION_NAMES)[number], { low: number; high: number }> = {
  book: { low: 65, high: 85 },
  call: { low: 35, high: 55 },
  text: { low: 30, high: 50 },
  directions: { low: 40, high: 60 },
  form: { low: 20, high: 40 },
  email: { low: 15, high: 35 },
  'google-business': { low: 25, high: 45 },
};

/**
 * Share of engaged computer / tablet visits with no click that we credit as a
 * phone call made after reading the number on screen. Industry call-tracking
 * studies put the untracked share of calls from desktop visits well above this.
 */
export const ASSISTED_RATE = 0.25;

/** Pages whose visit alone says "I am shopping for this": the contact, pricing and service pages. */
export const INTENT_PATH_PATTERN = '(contact|quote|estimate|pricing|prices|book|schedule|appointment|service|detail|coating|repair|install|cleaning|financing)';

/**
 * Off-site contacts credited from engaged computer visits that clicked nothing,
 * capped at the real clicks plus two so the estimate never outweighs the facts.
 */
export function assistedContacts(engagedNoClick: number, directContacts: number): number {
  if (engagedNoClick <= 0) return 0;
  return Math.min(Math.round(engagedNoClick * ASSISTED_RATE), directContacts + 2);
}

/** When nobody has reached out yet there is nothing to weigh; a typical local-service figure. */
export const DEFAULT_CLOSE_RATE_ESTIMATE: CloseRateEstimate = {
  rate: 35,
  low: 25,
  high: 45,
  sample: 0,
  factors: [{ label: 'Typical rate for a local service business, until people start reaching out', effect: 0 }],
};

const clampPct = (n: number) => Math.max(10, Math.min(90, Math.round(n)));

/**
 * Estimates the share of people who reached out that became customers, from the
 * month's own data. Pure, so lib/siteStats.test.ts pins it down.
 *
 * Base: each way of reaching out gets its benchmark, weighted by this client's
 * mix. Then only upward adjustments, each one a reason the client can read:
 * visitors who read first, who came back, who reached out from a service page,
 * during business hours, or from a phone. Small samples widen the range rather
 * than lower the number.
 */
export function estimateCloseRate(input: { buttons: Array<{ name: string; count: number }>; detail?: TrafficDetail | null }): CloseRateEstimate {
  const mix = input.buttons.filter((b) => isConversion(b.name));
  const sample = mix.reduce((n, b) => n + b.count, 0);
  if (sample === 0) return DEFAULT_CLOSE_RATE_ESTIMATE;

  let baseHigh = 0;
  let baseLow = 0;
  for (const b of mix) {
    const bench = CONTACT_CLOSE_RATES[b.name as keyof typeof CONTACT_CLOSE_RATES];
    baseHigh += (bench.high * b.count) / sample;
    baseLow += (bench.low * b.count) / sample;
  }
  const dominant = [...mix].sort((a, b) => b.count - a.count)[0];
  const factors: CloseRateEstimate['factors'] = [
    {
      label: `${Math.round(baseHigh)}% to start, from how people reached out (mostly ${
        dominant.name === 'book'
          ? 'online bookings'
          : dominant.name === 'form'
            ? 'forms'
            : dominant.name === 'directions'
              ? 'directions to you'
              : dominant.name === 'google-business'
                ? 'your Google listing'
                : `${dominant.name}s`
      })`,
      effect: 0,
    },
  ];

  let adj = 0;
  const d = input.detail && input.detail.sessions > 0 ? input.detail : null;
  if (d) {
    if (d.avgSeconds >= 60 || d.pagesPerSession >= 2) {
      adj += 5;
      factors.push({ label: 'Visitors read several pages before reaching out', effect: 5 });
    }
    if (d.returningVisitors / d.sessions >= 0.15) {
      adj += 3;
      factors.push({ label: 'Many came back a second time before deciding', effect: 3 });
    }
    const convOnPages = d.convertingPages.reduce((n, c) => n + c.count, 0);
    const onService = d.convertingPages.filter((c) => c.path !== '/').reduce((n, c) => n + c.count, 0);
    if (convOnPages > 0 && onService / convOnPages >= 0.5) {
      adj += 4;
      factors.push({ label: 'Most reached out from a specific service page', effect: 4 });
    }
    const hoursTotal = d.conversionHours.reduce((a, b) => a + b, 0);
    const business = d.conversionHours.slice(8, 18).reduce((a, b) => a + b, 0);
    if (hoursTotal > 0 && business / hoursTotal >= 0.6) {
      adj += 4;
      factors.push({ label: 'Most reached out during business hours, when calls get answered', effect: 4 });
    }
    const dev = d.devices.phone + d.devices.tablet + d.devices.desktop;
    if (dev > 0 && d.devices.phone / dev >= 0.6) {
      adj += 2;
      factors.push({ label: 'Most visits were on a phone, where a tap is a real call', effect: 2 });
    }
  }

  const spread = sample < 5 ? 10 : 5;
  if (sample < 5) factors.push({ label: `Only ${sample} ${sample === 1 ? 'person' : 'people'} reached out so far, so the range is wide`, effect: 0 });
  const rate = clampPct(baseHigh + adj);
  return {
    rate,
    low: clampPct(Math.min(rate - spread, baseLow + adj)),
    high: clampPct(rate + spread),
    sample,
    factors,
  };
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
/**
 * Builds the summary from the grouped counts. `closeRate` null means "estimate
 * it from this data" (estimateCloseRate); a number is the admin's own figure.
 */
export function summarize(input: {
  views: number;
  visitors: number;
  clicks: number;
  buttons: Array<{ name: string; count: number }>;
  pages: Array<{ path: string; count: number }>;
  sources: Array<{ host: string; count: number }>;
  closeRate: number | null;
  detail?: TrafficDetail | null;
  /** Leads the client marked for this month in AxeonPROOF. */
  marked?: { won: number; lost: number } | null;
  /** The client's own close rate from marked leads (observedCloseRate); beats the estimate when closeRate is null. */
  observed?: ObservedCloseRate | null;
}): TrafficSummary {
  const directContacts = input.buttons.filter((b) => isConversion(b.name)).reduce((sum, b) => sum + b.count, 0);
  const assisted = assistedContacts(input.detail?.engagedNoClick ?? 0, directContacts);
  const conversions = directContacts + assisted;
  const won = Math.max(0, input.marked?.won ?? 0);
  const lost = Math.max(0, input.marked?.lost ?? 0);
  const observed = input.closeRate == null ? (input.observed ?? null) : null;
  const estimate = input.closeRate == null ? estimateCloseRate({ buttons: input.buttons, detail: input.detail }) : null;
  // The client's own marks are blended in from OBSERVED_MIN_MARKED and take over at OBSERVED_FULL_MARKED,
  // so one rough stretch of "not yet" taps cannot swing the headline number on its own.
  const blend = (ours: number) => (observed ? Math.round(observed.weight * observed.rate + (1 - observed.weight) * ours) : ours);
  const closeRate = input.closeRate != null ? input.closeRate : blend((estimate as CloseRateEstimate).rate);
  // Leads the client already marked are facts; the rate only applies to the rest.
  const unmarked = Math.max(0, conversions - won - lost);
  return {
    views: input.views,
    visitors: input.visitors,
    clicks: input.clicks,
    buttons: input.buttons,
    pages: input.pages,
    sources: input.sources,
    conversions,
    directContacts,
    assistedContacts: assisted,
    closeRate,
    estimatedCustomers: won + estimateCustomers(unmarked, closeRate),
    detail: input.detail ?? null,
    closeRateEstimate: estimate,
    customersLow: estimate ? won + Math.floor((unmarked * blend(estimate.low)) / 100) : undefined,
    customersHigh: estimate ? won + Math.ceil((unmarked * blend(estimate.high)) / 100) : undefined,
    markedWon: won,
    markedLost: lost,
    observedCloseRate: observed,
  };
}

/** One visitor session as the database hands it back (see sessionRows). */
export interface SessionRow {
  visitor: string;
  started_at: string | Date;
  landing: string | null;
  views: number;
  converted: boolean;
  converted_on: string | null;
  converted_at: string | Date | null;
  clicks: number;
  seconds: number | null;
  scroll: number | null;
  device: string | null;
  city: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  speed_ms: number | null;
  /** Viewed a contact, pricing or service page. */
  intent?: boolean | null;
}

const topN = <T extends object>(map: Map<string, T>, n: number, by: (t: T) => number): T[] =>
  [...map.values()].sort((a, b) => by(b) - by(a)).slice(0, n);

function localHourAndDay(at: string | Date, timeZone: string): { hour: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false, weekday: 'short' }).formatToParts(new Date(at));
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((p) => p.type === 'weekday')?.value ?? 'Sun');
  return { hour, day: day < 0 ? 0 : day };
}

/** Pure: turns the month's sessions into the detail block. Covered by lib/siteStats.test.ts. */
export function summarizeSessions(rows: SessionRow[], timeZone: string = REPORT_TIME_ZONE): TrafficDetail {
  const sessions = rows.length;
  const perVisitor = new Map<string, number>();
  const devices = { phone: 0, tablet: 0, desktop: 0 };
  const landing = new Map<string, { path: string; sessions: number; conversions: number }>();
  const converting = new Map<string, { path: string; count: number }>();
  const campaigns = new Map<string, { source: string; medium: string; campaign: string; sessions: number; conversions: number }>();
  const places = new Map<string, { city: string; sessions: number; conversions: number }>();
  const conversionHours = new Array<number>(24).fill(0);
  const conversionDays = new Array<number>(7).fill(0);
  let bounces = 0;
  let engagedNoClick = 0;
  let views = 0;
  let secondsSum = 0;
  let secondsN = 0;
  let scrollSum = 0;
  let scrollN = 0;
  const speeds: number[] = [];

  for (const r of rows) {
    perVisitor.set(r.visitor, (perVisitor.get(r.visitor) ?? 0) + 1);
    views += r.views;
    if (r.views <= 1 && r.clicks === 0) bounces += 1;
    // A computer visitor cannot tap to call. One who read for 30s, saw two pages, or
    // opened a contact / pricing / service page and then left is likely to have dialled.
    if ((r.device === 'desktop' || r.device === 'tablet') && !r.converted && r.clicks === 0) {
      if ((r.seconds ?? 0) >= 30 || r.views >= 2 || r.intent) engagedNoClick += 1;
    }
    if (r.seconds != null && r.seconds > 0) {
      secondsSum += r.seconds;
      secondsN += 1;
    }
    if (r.scroll != null) {
      scrollSum += r.scroll;
      scrollN += 1;
    }
    if (r.device === 'phone' || r.device === 'tablet' || r.device === 'desktop') devices[r.device] += r.views;
    if (r.speed_ms != null && r.speed_ms > 0) speeds.push(r.speed_ms);
    const conv = r.converted ? 1 : 0;
    if (r.landing) {
      const l = landing.get(r.landing) ?? { path: r.landing, sessions: 0, conversions: 0 };
      l.sessions += 1;
      l.conversions += conv;
      landing.set(r.landing, l);
    }
    if (r.converted && r.converted_on) {
      const c = converting.get(r.converted_on) ?? { path: r.converted_on, count: 0 };
      c.count += 1;
      converting.set(r.converted_on, c);
    }
    if (r.utm_source || r.utm_medium || r.utm_campaign) {
      const key = `${r.utm_source ?? ''}|${r.utm_medium ?? ''}|${r.utm_campaign ?? ''}`;
      const c = campaigns.get(key) ?? { source: r.utm_source ?? '', medium: r.utm_medium ?? '', campaign: r.utm_campaign ?? '', sessions: 0, conversions: 0 };
      c.sessions += 1;
      c.conversions += conv;
      campaigns.set(key, c);
    }
    if (r.city) {
      const pl = places.get(r.city) ?? { city: r.city, sessions: 0, conversions: 0 };
      pl.sessions += 1;
      pl.conversions += conv;
      places.set(r.city, pl);
    }
    if (r.converted && r.converted_at) {
      const { hour, day } = localHourAndDay(r.converted_at, timeZone);
      conversionHours[hour] += 1;
      conversionDays[day] += 1;
    }
  }

  speeds.sort((a, b) => a - b);
  const median = speeds.length ? speeds[Math.floor((speeds.length - 1) / 2)] : null;

  return {
    sessions,
    returningVisitors: [...perVisitor.values()].filter((n) => n > 1).length,
    bounceRate: sessions ? Math.round((bounces / sessions) * 100) : 0,
    avgSeconds: secondsN ? Math.round(secondsSum / secondsN) : 0,
    avgScroll: scrollN ? Math.round(scrollSum / scrollN) : 0,
    pagesPerSession: sessions ? Math.round((views / sessions) * 10) / 10 : 0,
    devices,
    landing: topN(landing, 6, (l) => l.sessions),
    convertingPages: topN(converting, 5, (c) => c.count),
    campaigns: topN(campaigns, 6, (c) => c.sessions),
    places: topN(places, 6, (p) => p.sessions),
    conversionHours,
    conversionDays,
    speedMs: median,
    engagedNoClick,
  };
}

export const hasTraffic = (t: TrafficSummary | null | undefined): t is TrafficSummary => Boolean(t && (t.views > 0 || t.clicks > 0));

// ───────────────────────────── Database ─────────────────────────────

interface SettingsRow {
  site_key: string | null;
  site_url: string | null;
  close_rate: number | null;
  close_rate_mode: string | null;
  auto_reports: boolean | null;
  avg_job_value: number | null;
}

const rowToSettings = (r: SettingsRow | undefined): TrackingSettings => ({
  siteKey: r?.site_key ?? null,
  siteUrl: r?.site_url ?? null,
  closeRateMode: r?.close_rate_mode === 'manual' ? 'manual' : 'auto',
  closeRate: r?.close_rate ?? DEFAULT_CLOSE_RATE,
  autoReports: r?.auto_reports ?? true,
  avgJobValue: r?.avg_job_value ?? null,
});

export async function getTrackingSettings(onboardingId: number): Promise<TrackingSettings> {
  if (!isDatabaseConfigured()) return rowToSettings(undefined);
  await ensureSchema();
  const res = await sql<SettingsRow>`
    SELECT site_key, site_url, close_rate, close_rate_mode, auto_reports, avg_job_value FROM onboardings WHERE id = ${onboardingId} LIMIT 1;
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
  input: Pick<TrackingSettings, 'siteUrl' | 'closeRateMode' | 'closeRate' | 'autoReports' | 'avgJobValue'>
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE onboardings SET site_url = ${input.siteUrl}, close_rate = ${input.closeRate}, close_rate_mode = ${input.closeRateMode},
      auto_reports = ${input.autoReports}, avg_job_value = ${input.avgJobValue}, updated_at = now()
    WHERE id = ${onboardingId};
  `;
}

export function validateAvgJobValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new Error('Average job value must be a dollar amount up to $1,000,000');
  return Math.round(n) || null;
}

export const validateCloseRateMode = (raw: unknown): CloseRateMode => (raw === 'manual' ? 'manual' : 'auto');

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

export async function recordEvent(onboardingId: number, event: TrackingEvent, visitor: string, place: string | null): Promise<void> {
  await sql`
    INSERT INTO site_events (
      onboarding_id, kind, name, path, referrer, visitor, device, utm_source, utm_medium, utm_campaign, city, seconds, scroll, speed_ms
    )
    VALUES (
      ${onboardingId}, ${event.kind}, ${event.name}, ${event.path}, ${event.referrer}, ${visitor}, ${event.device},
      ${event.utm?.source || null}, ${event.utm?.medium || null}, ${event.utm?.campaign || null}, ${place},
      ${event.seconds}, ${event.scroll}, ${event.speedMs}
    );
  `;
}

/** Idle gap that ends a session. */
export const SESSION_GAP_MINUTES = 30;

/**
 * One row per session for the month. Sessions are cut where a visitor's events
 * have a gap longer than SESSION_GAP_MINUTES; everything else is summed per
 * session in SQL and turned into the detail block by summarizeSessions().
 */
export async function sessionRows(onboardingId: number, month: string): Promise<SessionRow[]> {
  const first = `${month}-01`;
  const conv = CONVERSION_NAMES as unknown as string;
  const res = await sql<SessionRow>`
    WITH ev AS (
      SELECT id, visitor, created_at, kind, name, path, device, city, utm_source, utm_medium, utm_campaign, seconds, scroll, speed_ms,
        CASE
          WHEN lag(created_at) OVER w IS NULL THEN 1
          WHEN created_at - lag(created_at) OVER w > make_interval(mins => ${SESSION_GAP_MINUTES}) THEN 1
          ELSE 0
        END AS starts
      FROM site_events
      WHERE onboarding_id = ${onboardingId} AND visitor IS NOT NULL
        AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
        AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
      WINDOW w AS (PARTITION BY visitor ORDER BY created_at, id)
    ),
    s AS (
      SELECT *, sum(starts) OVER (PARTITION BY visitor ORDER BY created_at, id) AS sn FROM ev
    )
    SELECT
      visitor,
      min(created_at) AS started_at,
      (array_agg(path ORDER BY created_at, id) FILTER (WHERE kind = 'view'))[1] AS landing,
      (count(*) FILTER (WHERE kind = 'view'))::int AS views,
      coalesce(bool_or(kind = 'click' AND name = ANY(${conv}::text[])), false) AS converted,
      (array_agg(path ORDER BY created_at, id) FILTER (WHERE kind = 'click' AND name = ANY(${conv}::text[])))[1] AS converted_on,
      min(created_at) FILTER (WHERE kind = 'click' AND name = ANY(${conv}::text[])) AS converted_at,
      (count(*) FILTER (WHERE kind = 'click'))::int AS clicks,
      coalesce(bool_or(kind = 'view' AND path ~* ${INTENT_PATH_PATTERN}), false) AS intent,
      (sum(seconds) FILTER (WHERE kind = 'leave'))::int AS seconds,
      max(scroll) FILTER (WHERE kind = 'leave') AS scroll,
      (array_agg(device ORDER BY created_at, id) FILTER (WHERE device IS NOT NULL))[1] AS device,
      (array_agg(city ORDER BY created_at, id) FILTER (WHERE city IS NOT NULL))[1] AS city,
      (array_agg(utm_source ORDER BY created_at, id) FILTER (WHERE utm_source IS NOT NULL))[1] AS utm_source,
      (array_agg(utm_medium ORDER BY created_at, id) FILTER (WHERE utm_medium IS NOT NULL))[1] AS utm_medium,
      (array_agg(utm_campaign ORDER BY created_at, id) FILTER (WHERE utm_campaign IS NOT NULL))[1] AS utm_campaign,
      min(speed_ms) FILTER (WHERE speed_ms > 0) AS speed_ms
    FROM s
    GROUP BY visitor, sn
    ORDER BY started_at;
  `;
  return res.rows;
}

// ───────────────────────────── Leads and outcomes ─────────────────────────────

/**
 * The month's contact clicks, newest first, each with the campaign behind the
 * visit when the landing page carried one. What the "People who reached out"
 * list in AxeonPROOF shows. No names: the tracker never has any.
 */
export async function leadRows(onboardingId: number, month: string, limit = 200): Promise<LeadRow[]> {
  if (!isDatabaseConfigured() || !isValidMonth(month)) return [];
  await ensureSchema();
  const first = `${month}-01`;
  const conv = CONVERSION_NAMES as unknown as string;
  const res = await sql<Omit<LeadRow, 'at'> & { at: string | Date }>`
    SELECT c.id, c.created_at AS at, c.name, c.path, c.device, c.city, v.utm_source, v.utm_medium, v.utm_campaign, c.outcome
    FROM site_events c
    LEFT JOIN LATERAL (
      SELECT utm_source, utm_medium, utm_campaign FROM site_events v
      WHERE v.onboarding_id = c.onboarding_id AND v.visitor = c.visitor AND v.kind = 'view'
        AND v.utm_source IS NOT NULL
        AND v.created_at <= c.created_at AND v.created_at > c.created_at - interval '2 hours'
      ORDER BY v.created_at DESC LIMIT 1
    ) v ON true
    WHERE c.onboarding_id = ${onboardingId} AND c.kind = 'click' AND c.name = ANY(${conv}::text[])
      AND c.created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
      AND c.created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT ${limit};
  `;
  return res.rows.map((r) => ({ ...r, at: new Date(r.at).toISOString() }));
}

/** The client's tap on a lead: became a customer, did not, or cleared. Only this client's contact clicks can be marked. */
export async function setLeadOutcome(onboardingId: number, eventId: number, outcome: LeadOutcome | null): Promise<boolean> {
  if (!isDatabaseConfigured() || !Number.isInteger(eventId) || eventId <= 0) return false;
  await ensureSchema();
  const conv = CONVERSION_NAMES as unknown as string;
  const res = await sql`
    UPDATE site_events SET outcome = ${outcome}, outcome_at = ${outcome ? new Date().toISOString() : null}
    WHERE id = ${eventId} AND onboarding_id = ${onboardingId} AND kind = 'click' AND name = ANY(${conv}::text[]);
  `;
  return (res.rowCount ?? 0) > 0;
}

/** How many of the month's leads the client marked each way. */
export async function markedForMonth(onboardingId: number, month: string): Promise<{ won: number; lost: number }> {
  if (!isDatabaseConfigured() || !isValidMonth(month)) return { won: 0, lost: 0 };
  await ensureSchema();
  const first = `${month}-01`;
  const res = await sql<{ won: number; lost: number }>`
    SELECT (count(*) FILTER (WHERE outcome = 'won'))::int AS won, (count(*) FILTER (WHERE outcome = 'lost'))::int AS lost
    FROM site_events
    WHERE onboarding_id = ${onboardingId} AND kind = 'click' AND outcome IS NOT NULL
      AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
      AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE});
  `;
  return res.rows[0] ?? { won: 0, lost: 0 };
}

/**
 * The client's own close rate: won / (won + lost) over the leads they marked in
 * the last OBSERVED_MONTHS, once at least OBSERVED_MIN_MARKED are marked, with
 * a weight that rises to 1 at OBSERVED_FULL_MARKED (summarize blends it with
 * the estimate). Null until then, and the data-driven estimate stays in charge.
 */
export async function observedCloseRate(onboardingId: number): Promise<ObservedCloseRate | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<{ won: number; lost: number }>`
    SELECT (count(*) FILTER (WHERE outcome = 'won'))::int AS won, (count(*) FILTER (WHERE outcome = 'lost'))::int AS lost
    FROM site_events
    WHERE onboarding_id = ${onboardingId} AND kind = 'click' AND outcome IS NOT NULL
      AND created_at >= now() - make_interval(months => ${OBSERVED_MONTHS});
  `;
  const { won, lost } = res.rows[0] ?? { won: 0, lost: 0 };
  const marked = won + lost;
  if (marked < OBSERVED_MIN_MARKED) return null;
  return { rate: Math.round((won / marked) * 100), won, lost, months: OBSERVED_MONTHS, weight: Math.min(1, marked / OBSERVED_FULL_MARKED) };
}

const EMPTY_INPUT = { views: 0, visitors: 0, clicks: 0, buttons: [], pages: [], sources: [] };

/**
 * One month of a client's website, with the month's edges at midnight in the
 * report time zone (Postgres handles daylight saving).
 */
export async function monthTraffic(onboardingId: number, month: string, closeRate: number | null): Promise<TrafficSummary> {
  if (!isDatabaseConfigured() || !isValidMonth(month)) return summarize({ ...EMPTY_INPUT, closeRate });
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
  if (t.views === 0 && t.clicks === 0) return summarize({ ...EMPTY_INPUT, closeRate });

  const [buttons, pages, sources, sessions, marked, observed] = await Promise.all([
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
    sessionRows(onboardingId, month),
    markedForMonth(onboardingId, month),
    // A typed-in rate is the client's word already; otherwise their marked leads beat our estimate.
    closeRate == null ? observedCloseRate(onboardingId) : Promise.resolve(null),
  ]);
  return summarize({
    views: t.views,
    visitors: t.visitors,
    clicks: t.clicks,
    buttons: buttons.rows,
    pages: pages.rows,
    sources: sources.rows,
    closeRate,
    detail: summarizeSessions(sessions),
    marked,
    observed,
  });
}

export interface TrackingOverview extends TrackingSettings {
  /** The line to paste into the client's site, or null before the key exists. */
  snippet: string | null;
  /** Opens the client's site so that device stops counting; null until the site address is set. */
  ownVisitsUrl: string | null;
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
    monthTraffic(onboardingId, month, effectiveCloseRate(settings)),
    monthTraffic(onboardingId, previous, effectiveCloseRate(settings)),
    lastEventAt(onboardingId),
  ]);
  return {
    ...settings,
    snippet: settings.siteKey ? trackingSnippet(settings.siteKey) : null,
    ownVisitsUrl: ownVisitsUrl(settings.siteUrl),
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
