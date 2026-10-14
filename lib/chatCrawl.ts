// lib/chatCrawl.ts
// "Train on site" for the website chat: fetch the client's own pages and keep
// their text in site_pages, which the chat's system prompt reads. Same origin as
// the start page only, at most 40 pages, robots.txt respected (a disallowed
// homepage means no crawl at all), 5 seconds per fetch, text only. Fetches go
// through fetchPage (lib/auditSources.ts), which re-checks every redirect hop
// against private addresses. Parsing and the crawl loop are pure and take an
// injected fetcher, so tests need no network. Server-only (crawlSite writes SQL).
import { ensureSchema, sql } from '@/lib/db';
import { assertPublic, fetchPage } from '@/lib/auditSources';

export const CRAWL_MAX_PAGES = 40;
export const CRAWL_PAGE_TIMEOUT_MS = 5_000;
/** The whole crawl must finish inside the admin request (maxDuration 60 s). */
export const CRAWL_BUDGET_MS = 50_000;
export const PAGE_TEXT_MAX = 20_000;
/** fetchPage's user agent is "AxeonAuditBot/1.0"; robots.txt groups for it apply. */
const ROBOTS_AGENT = 'axeonauditbot';
const MIN_TEXT = 40;
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|avif|ico|zip|mp4|mov|mp3|wav|docx?|xlsx?|pptx?|ics|xml|json|css|js|txt)$/i;

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', hellip: '…', copy: '©', reg: '®', trade: '™', middot: '·', bull: '•',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[e.toLowerCase()] ?? match;
  });
}

/** The page's title and its readable text: no scripts, styles, nav menus, comments or tags. */
export function extractText(html: string): { title: string; text: string } {
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = t ? decodeEntities(t[1]).replace(/\s+/g, ' ').trim().slice(0, 200) : '';
  const body = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe|head|nav)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|ul|ol|table|blockquote)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const text = decodeEntities(body)
    .replace(/[ \t\f\v\r ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return { title, text: text.slice(0, PAGE_TEXT_MAX) };
}

/** Links on this page to the same origin (scheme + host + port), without hash or query, no files, no repeats, in order. */
export function sameOriginLinks(html: string, base: string): string[] {
  const origin = new URL(base).origin;
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = decodeEntities(m[1] ?? m[2] ?? m[3] ?? '').trim();
    if (!raw || /^(mailto:|tel:|sms:|javascript:|data:|#)/i.test(raw)) continue;
    let u: URL;
    try {
      u = new URL(raw, base);
    } catch {
      continue;
    }
    if (u.origin !== origin || SKIP_EXT.test(u.pathname)) continue;
    u.hash = '';
    u.search = '';
    const key = u.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

interface RobotsRule {
  allow: boolean;
  pattern: string;
}

function robotsRules(robotsTxt: string, agent: string): RobotsRule[] {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;
  let lastWasAgent = false;
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    const colon = line.indexOf(':');
    if (!line || colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if ((key === 'disallow' || key === 'allow') && current && value) current.rules.push({ allow: key === 'allow', pattern: value });
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.includes(a)));
  return (mine.length ? mine : groups.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules);
}

function ruleMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(path);
}

/** True when robots.txt keeps our bot off this path. The longest matching rule wins; on a tie, Allow wins. */
export function robotsDisallows(robotsTxt: string, path: string, agent: string = ROBOTS_AGENT): boolean {
  let best: RobotsRule | null = null;
  for (const r of robotsRules(robotsTxt, agent.toLowerCase())) {
    if (!ruleMatches(r.pattern, path)) continue;
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow)) best = r;
  }
  return best ? !best.allow : false;
}

/** A sitemap's <loc>s on this origin: pages, and child sitemaps (.xml) to read next. */
export function sitemapLocs(xml: string, origin: string): { pages: string[]; sitemaps: string[] } {
  const pages: string[] = [];
  const sitemaps: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    let u: URL;
    try {
      u = new URL(decodeEntities(m[1]));
    } catch {
      continue;
    }
    if (u.origin !== origin) continue;
    u.hash = '';
    if (/\.xml$/i.test(u.pathname)) sitemaps.push(u.toString());
    else if (!SKIP_EXT.test(u.pathname)) pages.push(u.toString());
  }
  return { pages, sitemaps };
}

export type CrawlFetcher = (url: string) => Promise<{ status: number; html: string; finalUrl: string }>;

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www./, '');

/** True when both URLs are on the same host (a leading www. does not count as another site) and the second is http(s). */
export function sameSite(a: string, b: string): boolean {
  const x = new URL(a);
  const y = new URL(b);
  return /^https?:$/.test(y.protocol) && bareHost(x.hostname) === bareHost(y.hostname);
}

const pageKey = (u: string) => u.replace(/\/$/, '');

/**
 * The crawl itself: homepage, robots.txt, sitemap.xml (and up to three child
 * sitemaps), then breadth-first through same-origin links until the page cap or
 * the time budget. One fetch at a time, so a small site is never hammered.
 */
export async function collectPages(
  startUrl: string,
  fetcher: CrawlFetcher,
  opts: { maxPages?: number; budgetMs?: number; now?: () => number } = {}
): Promise<{ pages: CrawledPage[]; blocked: boolean; errors: number }> {
  const maxPages = opts.maxPages ?? CRAWL_MAX_PAGES;
  const now = opts.now ?? Date.now;
  const deadline = now() + (opts.budgetMs ?? CRAWL_BUDGET_MS);

  const home = await fetcher(startUrl);
  if (home.status !== 200 || !home.html) throw new Error(`Could not load ${startUrl} (status ${home.status || 'no answer'})`);
  const base = new URL(home.finalUrl);
  if (!sameSite(startUrl, base.toString())) throw new Error(`${startUrl} redirects to another website (${base.host}); enter the final address`);
  const origin = base.origin;

  let robots = '';
  try {
    const r = await fetcher(`${origin}/robots.txt`);
    if (r.status === 200) robots = r.html;
  } catch {
    // No robots.txt reachable: nothing is disallowed.
  }
  if (robots && robotsDisallows(robots, base.pathname || '/')) return { pages: [], blocked: true, errors: 0 };
  const allowed = (u: string) => {
    const p = new URL(u);
    return p.origin === origin && !(robots && robotsDisallows(robots, p.pathname));
  };

  const queue: string[] = [];
  const queued = new Set<string>([pageKey(base.toString())]);
  const enqueue = (u: string) => {
    const key = pageKey(u);
    if (queued.has(key)) return;
    queued.add(key);
    queue.push(u);
  };

  try {
    const sm = await fetcher(`${origin}/sitemap.xml`);
    if (sm.status === 200 && sm.html) {
      const { pages, sitemaps } = sitemapLocs(sm.html, origin);
      pages.forEach(enqueue);
      for (const child of sitemaps.slice(0, 3)) {
        if (now() >= deadline) break;
        try {
          const c = await fetcher(child);
          if (c.status === 200) sitemapLocs(c.html, origin).pages.forEach(enqueue);
        } catch {
          // A broken child sitemap only loses its own pages.
        }
      }
    }
  } catch {
    // No sitemap: links from the homepage are enough.
  }

  const pages: CrawledPage[] = [];
  const kept = new Set<string>();
  let errors = 0;
  const take = (url: string, html: string) => {
    const key = pageKey(url);
    if (!kept.has(key)) {
      const { title, text } = extractText(html);
      if (text.length >= MIN_TEXT) {
        kept.add(key);
        pages.push({ url, title, text });
      }
    }
    for (const link of sameOriginLinks(html, url)) if (allowed(link)) enqueue(link);
  };

  take(base.toString(), home.html);
  while (queue.length > 0 && pages.length < maxPages && now() < deadline) {
    const url = queue.shift() as string;
    if (!allowed(url)) continue;
    try {
      const r = await fetcher(url);
      if (r.status !== 200 || !r.html) continue;
      const final = new URL(r.finalUrl);
      if (final.origin !== origin) continue;
      final.hash = '';
      take(final.toString(), r.html);
    } catch {
      errors += 1;
    }
  }
  return { pages: pages.slice(0, maxPages), blocked: false, errors };
}

/** fetch with our 5-second ceiling, kept alongside fetchPage's own redirect and SSRF checks. */
const withTimeout = ((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
  const limit = AbortSignal.timeout(CRAWL_PAGE_TIMEOUT_MS);
  return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, limit]) : limit });
}) as typeof fetch;

/** Every request, and every redirect hop, must stay on the client's own host (or its www variant) and be public. */
export function hostLockCheck(startUrl: string, publicCheck: (u: URL) => Promise<void> = assertPublic): (u: URL) => Promise<void> {
  return async (u) => {
    if (!sameSite(startUrl, u.toString())) throw new Error("Crawl stays on the client's own website");
    await publicCheck(u);
  };
}

const livePage = (startUrl: string): CrawlFetcher => (url) => fetchPage(url, { fetchImpl: withTimeout, check: hostLockCheck(startUrl) });

export interface CrawlSummary {
  saved: number;
  blocked: boolean;
  errors: number;
}

/**
 * Crawl and replace the client's saved pages. Pages found this time are upserted;
 * pages from an earlier crawl that were not found again are deleted (only when
 * this crawl found something, so a site that is down never wipes the chat's knowledge).
 */
export async function crawlSite(onboardingId: number, startUrl: string, fetcher?: CrawlFetcher): Promise<CrawlSummary> {
  let url: URL;
  try {
    url = new URL(startUrl);
  } catch {
    throw new Error('Enter the full website address, like https://example.com');
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error('The website address must start with http:// or https://');
  const result = await collectPages(url.toString(), fetcher ?? livePage(url.toString()));
  if (result.blocked) return { saved: 0, blocked: true, errors: 0 };

  await ensureSchema();
  const { rows } = await sql<{ t: Date | string }>`SELECT now() AS t;`;
  const started = new Date(rows[0].t).toISOString();
  for (const p of result.pages) {
    await sql`
      INSERT INTO site_pages (onboarding_id, url, title, text, fetched_at)
      VALUES (${onboardingId}, ${p.url}, ${p.title}, ${p.text}, now())
      ON CONFLICT (onboarding_id, url) DO UPDATE SET title = EXCLUDED.title, text = EXCLUDED.text, fetched_at = now();
    `;
  }
  if (result.pages.length > 0) await sql`DELETE FROM site_pages WHERE onboarding_id = ${onboardingId} AND fetched_at < ${started}::timestamptz;`;
  await sql`
    INSERT INTO chat_settings (onboarding_id, trained_at) VALUES (${onboardingId}, now())
    ON CONFLICT (onboarding_id) DO UPDATE SET trained_at = now(), updated_at = now();
  `;
  return { saved: result.pages.length, blocked: false, errors: result.errors };
}
