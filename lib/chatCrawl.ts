// lib/chatCrawl.ts
// "Train on site" for the website chat: fetch the client's own pages and keep
// their text in site_pages, which the chat's system prompt reads. Same origin as
// the start page only, at most 40 pages, robots.txt respected (a disallowed
// homepage means no crawl at all), 5 seconds per fetch (redirects included) inside
// a 40-second budget, text only. Fetches go
// through fetchPage (lib/auditSources.ts), which re-checks every redirect hop
// against private addresses. Parsing and the crawl loop are pure and take an
// injected fetcher, so tests need no network. Server-only (crawlSite writes SQL).
import { ensureSchema, sql } from '@/lib/db';
import { assertPublic, fetchPage } from '@/lib/auditSources';

export const CRAWL_MAX_PAGES = 40;
export const CRAWL_PAGE_TIMEOUT_MS = 5_000;
/**
 * The crawl's share of the admin request (maxDuration 60 s): every fetch, the
 * redirect chain included, ends by this deadline, leaving room for the writes.
 */
export const CRAWL_BUDGET_MS = 40_000;
/** No fetch starts with less than this left in the budget. */
export const CRAWL_MIN_FETCH_MS = 1_500;
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

const BLOCK_OPEN = /<!--|<(script|style|noscript|svg|template|iframe|head|nav)\b/g;

/** Where the closing tag `</name>` that ends at or after `from` finishes, or the end of the document when it never closes. */
function blockEnd(lower: string, name: string, from: number): number {
  const needle = `</${name}`;
  let at = lower.indexOf(needle, from);
  while (at >= 0) {
    const next = lower.charAt(at + needle.length);
    if (next === '>' || /\s/.test(next)) {
      const gt = lower.indexOf('>', at);
      return gt < 0 ? lower.length : gt + 1;
    }
    at = lower.indexOf(needle, at + needle.length);
  }
  return lower.length;
}

/**
 * Comments and script/style/nav/... blocks removed in one forward pass (indexOf,
 * never a backtracking regex), so an unclosed tag costs linear time: it simply
 * runs to the end of the document.
 */
function stripBlocks(html: string): string {
  const lower = html.toLowerCase();
  const re = new RegExp(BLOCK_OPEN.source, 'g');
  let out = '';
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(lower))) {
    out += `${html.slice(pos, m.index)} `;
    if (m[0] === '<!--') {
      const close = lower.indexOf('-->', m.index + 4);
      pos = close < 0 ? lower.length : close + 3;
    } else {
      pos = blockEnd(lower, m[1], re.lastIndex);
    }
    re.lastIndex = pos;
  }
  return out + html.slice(pos);
}

function titleOf(html: string): string {
  const lower = html.toLowerCase();
  const open = lower.search(/<title\b/);
  if (open < 0) return '';
  const gt = lower.indexOf('>', open);
  const close = gt < 0 ? -1 : lower.indexOf('</title', gt);
  return close < 0 ? '' : html.slice(gt + 1, close);
}

/** The page's title and its readable text: no scripts, styles, nav menus, comments or tags. Linear time on any input. */
export function extractText(html: string): { title: string; text: string } {
  const title = decodeEntities(titleOf(html)).replace(/\s+/g, ' ').trim().slice(0, 200);
  // [^<>] (not [^>]) so a run of unclosed "<" cannot make each match scan to the end.
  const body = stripBlocks(html)
    .replace(/<(br|hr)\b[^<>]*>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|ul|ol|table|blockquote)\s*>/gi, '\n')
    .replace(/<[^<>]+>/g, ' ');
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

/** `timeoutMs` bounds the whole fetch, every redirect hop and address check included. */
export type CrawlFetcher = (url: string, opts?: { timeoutMs?: number }) => Promise<{ status: number; html: string; finalUrl: string }>;

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

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
  // Each fetch gets at most 5 s and never runs past the deadline; none starts without room for one.
  const room = () => deadline - now();
  const canFetch = () => room() >= CRAWL_MIN_FETCH_MS;
  const get = (url: string) => fetcher(url, { timeoutMs: Math.max(1, Math.min(CRAWL_PAGE_TIMEOUT_MS, room())) });

  if (!canFetch()) throw new Error('No time left to load the website');
  const home = await get(startUrl);
  if (home.status !== 200 || !home.html) throw new Error(`Could not load ${startUrl} (status ${home.status || 'no answer'})`);
  const base = new URL(home.finalUrl);
  if (!sameSite(startUrl, base.toString())) throw new Error(`${startUrl} redirects to another website (${base.host}); enter the final address`);
  const origin = base.origin;

  let robots = '';
  // No time left to read robots.txt: keep nothing rather than keep a page robots.txt might forbid.
  if (!canFetch()) return { pages: [], blocked: false, errors: 1 };
  try {
    const r = await get(`${origin}/robots.txt`);
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
    const sm = canFetch() ? await get(`${origin}/sitemap.xml`) : null;
    if (sm && sm.status === 200 && sm.html) {
      const { pages, sitemaps } = sitemapLocs(sm.html, origin);
      pages.forEach(enqueue);
      for (const child of sitemaps.slice(0, 3)) {
        if (!canFetch()) break;
        try {
          const c = await get(child);
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
  while (queue.length > 0 && pages.length < maxPages && canFetch()) {
    const url = queue.shift() as string;
    if (!allowed(url)) continue;
    try {
      const r = await get(url);
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

/** A promise that also rejects once `signal` aborts (dns.lookup in the address check has no timeout of its own). */
function untilAborted<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new Error('Page took too long'));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error('Page took too long'));
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

/** Every request, and every redirect hop, must stay on the client's own host (or its www variant) and be public. */
export function hostLockCheck(startUrl: string, publicCheck: (u: URL) => Promise<void> = assertPublic): (u: URL) => Promise<void> {
  return async (u) => {
    if (!sameSite(startUrl, u.toString())) throw new Error("Crawl stays on the client's own website");
    await publicCheck(u);
  };
}

/**
 * One live page fetch through fetchPage (redirect and SSRF checks per hop) under
 * a single time limit for the whole call: every hop's request, body read and
 * address check share one signal, so redirects cannot multiply the 5 seconds.
 */
const livePage =
  (startUrl: string): CrawlFetcher =>
  (url, opts = {}) => {
    const limit = AbortSignal.timeout(Math.max(1, Math.min(CRAWL_PAGE_TIMEOUT_MS, opts.timeoutMs ?? CRAWL_PAGE_TIMEOUT_MS)));
    const lock = hostLockCheck(startUrl);
    const fetchImpl = ((input: Parameters<typeof fetch>[0], init?: RequestInit) =>
      fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, limit]) : limit })) as typeof fetch;
    return untilAborted(fetchPage(url, { fetchImpl, check: (u) => untilAborted(lock(u), limit) }), limit);
  };

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
  await ensureSchema();
  if (!(await claimTraining(onboardingId))) throw new Error('A crawl for this client is already running. Try again in a minute.');
  try {
    return await crawlAndSave(onboardingId, url, fetcher);
  } finally {
    await sql`UPDATE chat_settings SET train_started_at = NULL WHERE onboarding_id = ${onboardingId};`.catch((err: unknown) =>
      console.error('chat crawl: lock not released', err instanceof Error ? err.message : err)
    );
  }
}

/**
 * One crawl at a time per client: claims chat_settings.train_started_at unless
 * another train request set it less than 60 seconds ago (a crashed request's
 * claim lapses by itself after that). Atomic: one INSERT ... ON CONFLICT.
 */
async function claimTraining(onboardingId: number): Promise<boolean> {
  const { rows } = await sql<{ onboarding_id: number }>`
    INSERT INTO chat_settings (onboarding_id, train_started_at) VALUES (${onboardingId}, now())
    ON CONFLICT (onboarding_id) DO UPDATE SET train_started_at = now()
      WHERE chat_settings.train_started_at IS NULL OR chat_settings.train_started_at < now() - interval '60 seconds'
    RETURNING onboarding_id;
  `;
  return rows.length > 0;
}

async function crawlAndSave(onboardingId: number, url: URL, fetcher?: CrawlFetcher): Promise<CrawlSummary> {
  const result = await collectPages(url.toString(), fetcher ?? livePage(url.toString()));
  if (result.blocked) return { saved: 0, blocked: true, errors: 0 };

  const { rows } = await sql<{ t: Date | string }>`SELECT now() AS t;`;
  const started = new Date(rows[0].t).toISOString();
  // One statement for every page (unnest), so the writes take one round trip, not forty.
  const unique = [...new Map(result.pages.map((p) => [p.url, p])).values()];
  if (unique.length > 0) {
    const urls = unique.map((p) => p.url);
    const titles = unique.map((p) => p.title);
    const texts = unique.map((p) => p.text);
    await sql`
      INSERT INTO site_pages (onboarding_id, url, title, text, fetched_at)
      SELECT ${onboardingId}::int, p.url, p.title, p.text, now()
      FROM unnest(${urls as unknown as string}::text[], ${titles as unknown as string}::text[], ${texts as unknown as string}::text[]) AS p(url, title, text)
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
