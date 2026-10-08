// lib/projectsShared.ts
// The parts of lib/projects.ts that browser components need too (no database).

export interface Line {
  title: string;
  body: string;
}

export const UPDATE_TYPES = ['New page', 'Site change', 'Feature', 'Campaign'] as const;
export const UPDATE_STATUSES = ['Live', 'In review', 'Scheduled'] as const;

export const linesToText = (lines: Line[]) => lines.map((l) => (l.title ? `${l.title}: ${l.body}` : l.body)).join('\n');

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ───────────────────────────── Website traffic ─────────────────────────────
// Filled in by lib/autoReports.ts from the events the client's site sends to
// /api/t (public/t.js). Lives on the report body so the email and AxeonPROOF
// read the same numbers.

export interface TrafficSummary {
  /** Page views. */
  views: number;
  /** Unique people this month (salted monthly hash, no cookies). */
  visitors: number;
  /** Every tracked button or link click. */
  clicks: number;
  /** Clicks by button, most clicked first. */
  buttons: Array<{ name: string; count: number }>;
  /** Most visited pages. */
  pages: Array<{ path: string; count: number }>;
  /** Where visitors came from (referrer host). An empty host means direct / typed in. */
  sources: Array<{ host: string; count: number }>;
  /** Everyone credited as reaching out: the clicks below plus the estimated off-site callers. */
  conversions: number;
  /** Clicks on call, text, email, form, book, directions or the Google listing. */
  directContacts?: number;
  /**
   * Engaged computer and tablet visits with no click, credited at ASSISTED_RATE:
   * nobody can tap to call on a computer, so they read the number and dial it on
   * a phone. Capped so it can never dwarf the real clicks.
   */
  assistedContacts?: number;
  /** Percent of those we count as a new customer. Per client, set in the admin. */
  closeRate: number;
  /** round(conversions × closeRate / 100). Always labelled "estimated". */
  estimatedCustomers: number;
  /** Session-level detail (added 2026-10-08). Absent on reports summed before then. */
  detail?: TrafficDetail | null;
  /** Present when closeRate was estimated from the data rather than typed in. */
  closeRateEstimate?: CloseRateEstimate | null;
  /** Likely range for estimatedCustomers, from the estimate's low and high rates. */
  customersLow?: number;
  customersHigh?: number;
}

/**
 * How the close rate was arrived at, so the email and dashboard can show the
 * reasoning. `rate` is the headline figure; `low`..`high` is the likely range.
 */
export interface CloseRateEstimate {
  rate: number;
  low: number;
  high: number;
  /** Conversions the estimate rests on. Under 5 widens the range. */
  sample: number;
  /** Plain-English reasons, each with its effect in percentage points (0 for the base). */
  factors: Array<{ label: string; effect: number }>;
}

/**
 * What the sessions say. A session is one visitor's events with no gap longer
 * than 30 minutes, worked out at query time from the monthly visitor hash, so
 * the browser stores nothing.
 */
export interface TrafficDetail {
  sessions: number;
  /** Visitors with more than one session this month. */
  returningVisitors: number;
  /** Percent of sessions with one page view and no click. */
  bounceRate: number;
  /** Average active seconds per session, over sessions that reported any. */
  avgSeconds: number;
  /** Average deepest scroll, 0..100, over sessions that reported it. */
  avgScroll: number;
  pagesPerSession: number;
  /** Views by device. */
  devices: { phone: number; tablet: number; desktop: number };
  /** First page of the session, with how many of those sessions reached out. */
  landing: Array<{ path: string; sessions: number; conversions: number }>;
  /** Page the visitor was on when they reached out. */
  convertingPages: Array<{ path: string; count: number }>;
  /** utm_source / medium / campaign, sessions and how many reached out. */
  campaigns: Array<{ source: string; medium: string; campaign: string; sessions: number; conversions: number }>;
  /** "Des Moines, IA" style, from the edge, never the IP. */
  places: Array<{ city: string; sessions: number; conversions: number }>;
  /** Sessions that reached out, by local hour 0..23 and weekday 0 (Sunday)..6. */
  conversionHours: number[];
  conversionDays: number[];
  /** Median page load in ms as visitors saw it, or null. */
  speedMs: number | null;
  /** Computer or tablet sessions that read (30s+, two pages, or a contact / pricing / service page) but clicked nothing. */
  engagedNoClick?: number;
}

export const DEVICE_LABELS = { phone: 'Phone', tablet: 'Tablet', desktop: 'Desktop' } as const;

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** "2pm", "11am", "12pm". */
export function hourLabel(h: number): string {
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${h < 12 ? 'am' : 'pm'}`;
}

/** "google / cpc / spring-detail" -> "Google Ads: spring-detail"; a bare source stays readable. */
export function campaignLabel(c: { source: string; medium: string; campaign: string }): string {
  const src = c.source.toLowerCase();
  const med = c.medium.toLowerCase();
  const paid = /^(cpc|ppc|paid|paidsocial|paid_social|display|lsa)$/.test(med);
  let name = sourceLabel(src.includes('.') ? src : `${src}.com`);
  if (name === src + '.com' || name === `${src}.com`) name = src.charAt(0).toUpperCase() + src.slice(1);
  if (paid) name = name === 'Google' ? 'Google Ads' : name === 'Facebook' || name === 'Instagram' ? `${name} Ads` : `${name} (paid)`;
  else if (med && med !== 'referral' && med !== 'organic' && med !== '(none)') name = `${name} ${med}`;
  return c.campaign ? `${name}: ${c.campaign}` : name;
}

/**
 * Click names that count as a customer reaching out. Directions means they are
 * driving to the business; the Google listing is one tap from a call or a visit.
 * Review and social links are not leads.
 */
export const CONVERSION_NAMES = ['call', 'text', 'email', 'form', 'book', 'directions', 'google-business'] as const;

/** Plain-English label for a tracked click name. */
export function buttonLabel(name: string): string {
  switch (name) {
    case 'call':
      return 'Call button';
    case 'text':
      return 'Text button';
    case 'email':
      return 'Email link';
    case 'form':
      return 'Form sent';
    case 'book':
      return 'Book online';
    case 'directions':
      return 'Get directions';
    case 'review':
      return 'Leave a review';
    case 'google-business':
      return 'Google listing';
    case 'facebook':
    case 'instagram':
    case 'tiktok':
    case 'youtube':
      return `${name.charAt(0).toUpperCase() + name.slice(1)} link`;
    default:
      return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

const KNOWN_SOURCES: Array<[RegExp, string]> = [
  [/(^|\.)google\./, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)(facebook|fb)\.com$/, 'Facebook'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)yelp\.com$/, 'Yelp'],
  [/(^|\.)nextdoor\.com$/, 'Nextdoor'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)yahoo\.com$/, 'Yahoo'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)linkedin\.com$/, 'LinkedIn'],
  [/(^|\.)youtube\.com$/, 'YouTube'],
];

/** "www.google.com" -> "Google", "" -> "Direct / typed in", anything else as-is without www. */
export function sourceLabel(host: string): string {
  if (!host) return 'Direct / typed in';
  const h = host.toLowerCase().replace(/^www\./, '');
  return KNOWN_SOURCES.find(([re]) => re.test(h))?.[1] ?? h;
}
