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
  /** Calls, texts, emails, form sends and bookings: the clicks that mean a customer reached out. */
  conversions: number;
  /** Percent of those we count as a new customer. Per client, set in the admin. */
  closeRate: number;
  /** round(conversions × closeRate / 100). Always labelled "estimated". */
  estimatedCustomers: number;
}

/** Click names that count as a customer reaching out. The others are navigation. */
export const CONVERSION_NAMES = ['call', 'text', 'email', 'form', 'book'] as const;

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
