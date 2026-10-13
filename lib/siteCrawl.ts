// lib/siteCrawl.ts
// Our own small crawl of a business's site for the deep audit: the homepage plus
// up to 15 same-host pages, each run through the phase-1 HTML checks, plus
// "service-page coverage" — does any page's title, h1 or path carry the words
// of a keyword people search? Free, synchronous, same SSRF rules as the homepage
// check. Pure helpers are tested; the fetcher is injectable.
import { htmlChecks } from '@/lib/auditHtml';
import { fetchPage, type SourceResult } from '@/lib/auditSources';
import { domainOf, type CrawlPage, type CrawlResult } from '@/lib/auditShared';

const SKIP_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|avif|zip|mp4|mov|docx?|xlsx?|pptx?|ics|xml|json|css|js)(\?|$)/i;
const FILLER = new Set(['in', 'near', 'me', 'the', 'best', 'top', 'service', 'services', 'company', 'companies', 'local', 'cheap', 'affordable', 'pro', 'pros', 'and', 'for', 'of', 'a', 'an']);

const normalize = (u: URL) => {
  u.hash = '';
  return u.toString();
};

/** Same host (www ignored), http(s), no hash, no files, no repeats, no self-link; in order of appearance. */
export function pickInternalLinks(html: string, baseUrl: string, max = 15): string[] {
  const base = new URL(baseUrl);
  const host = domainOf(base.hostname);
  const self = normalize(new URL(baseUrl)).replace(/\/$/, '');
  const out: string[] = [];
  const seen = new Set<string>([self]);
  const re = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < max) {
    const raw = (m[1] ?? m[2] ?? '').trim();
    if (!raw || /^(mailto:|tel:|javascript:|#)/i.test(raw)) continue;
    let u: URL;
    try {
      u = new URL(raw, base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol) || domainOf(u.hostname) !== host || SKIP_EXT.test(u.pathname)) continue;
    const key = normalize(u).replace(/\/$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalize(u));
  }
  return out;
}

const headTerms = (keyword: string, city: string): string[] => {
  const cityWords = new Set(city.toLowerCase().split(/[^a-z]+/).filter(Boolean));
  return keyword
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !FILLER.has(w) && !cityWords.has(w));
};

/** Covered when one page's title + h1 + path contains every head term of the keyword. */
export function coverageFor(pages: Array<Pick<CrawlPage, 'url' | 'title' | 'h1'>>, keyword: string, city: string): { covered: boolean; url: string | null } {
  const terms = headTerms(keyword, city);
  if (terms.length === 0) return { covered: false, url: null };
  for (const p of pages) {
    let path = '';
    try {
      path = decodeURIComponent(new URL(p.url).pathname).replace(/[-_/]+/g, ' ');
    } catch {
      path = p.url;
    }
    const hay = `${p.title ?? ''} ${p.h1 ?? ''} ${path}`.toLowerCase();
    if (terms.every((t) => hay.includes(t))) return { covered: true, url: p.url };
  }
  return { covered: false, url: null };
}

const wordCount = (html: string): number => {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ');
  return (text.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) ?? []).length;
};
const h1Of = (html: string): string | null => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null : null;
};

const THIN_WORDS = 150;
const MAX_PAGES = 15;
const CONCURRENCY = 4;
const BUDGET_MS = 60_000;

export type PageFetcher = (url: string) => Promise<{ status: number; html: string; ms: number }>;

export async function crawlSite(url: string, keywords: string[], city: string, fetcher: PageFetcher = fetchPage): Promise<SourceResult<CrawlResult>> {
  const started = Date.now();
  const toPage = (u: string, r: { status: number; html: string; ms: number }): CrawlPage => {
    const c = htmlChecks(r.html);
    return { url: u, status: r.status, title: c.title, h1: h1Of(r.html), words: wordCount(r.html), clickToCall: c.clickToCall, form: c.form, schema: c.schema, ms: r.ms };
  };
  try {
    const home = await fetcher(url);
    if (home.status >= 400) return { ok: false, error: `The site answered ${home.status}` };
    const pages: CrawlPage[] = [toPage(url, home)];
    const links = pickInternalLinks(home.html, url, MAX_PAGES);
    for (let i = 0; i < links.length; i += CONCURRENCY) {
      if (Date.now() - started > BUDGET_MS) break;
      const batch = links.slice(i, i + CONCURRENCY);
      const got = await Promise.all(
        batch.map(async (u): Promise<CrawlPage> => {
          try {
            return toPage(u, await fetcher(u));
          } catch {
            return { url: u, status: 0, title: null, h1: null, words: 0, clickToCall: false, form: false, schema: [], ms: 0 };
          }
        })
      );
      pages.push(...got);
    }
    const okPages = pages.filter((p) => p.status >= 200 && p.status < 400);
    return {
      ok: true,
      data: {
        pages,
        broken: pages.filter((p) => p.status >= 400 || p.status === 0).map((p) => p.url),
        coverage: keywords.map((k) => ({ keyword: k, ...coverageFor(okPages, k, city) })),
        thin: okPages.filter((p) => p.words < THIN_WORDS).length,
        untitled: okPages.filter((p) => !p.title).length,
      },
      cost: 0,
      raw: { pages: pages.length, ms: Date.now() - started },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
