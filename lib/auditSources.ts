// lib/auditSources.ts
// The six measurements one audit is made of. Each returns ok/data/cost/raw or
// ok:false/error and never throws past its boundary, so lib/audits.ts can keep
// going when one of them fails. Maps, organic, business info and the grid are
// DataForSEO (paid per call); PageSpeed and the homepage check are free.
import dns from 'node:dns/promises';
import { DataForSeoError, dfsPost, trimTask } from '@/lib/dataforseo';
import { htmlChecks, isPrivateAddress, isPublicHostname, type HtmlChecks } from '@/lib/auditHtml';
import { parseBusinessInfo, parseMapsItems, parseOrganicItems } from '@/lib/auditParse';
import { gridPoints, matchSubject, summarizeGrid, type AuditSubject, type GridPoint, type GridResult, type MapsItem } from '@/lib/auditShared';

export type SourceResult<T> = { ok: true; data: T; cost: number; raw: unknown } | { ok: false; error: string };
const fail = (err: unknown): { ok: false; error: string } => ({ ok: false, error: err instanceof Error ? err.message : String(err) });

const UA = 'AxeonAuditBot/1.0 (+https://axeonstudio.co)';
const SOURCE_TIMEOUT_MS = 30_000;

// ───────────────────────────── DataForSEO ─────────────────────────────

export interface MapsWhere {
  /** "Ankeny,Iowa,United States" — the canonical rank is always measured this way. */
  location?: string;
  /** A grid point; DataForSEO takes "lat,lng,zoom". */
  coordinate?: { lat: number; lng: number };
}

export async function mapsSearch(keyword: string, where: MapsWhere): Promise<SourceResult<MapsItem[]>> {
  try {
    const task = where.coordinate
      ? { keyword, location_coordinate: `${where.coordinate.lat},${where.coordinate.lng},14z`, language_code: 'en', depth: 20 }
      : { keyword, location_name: where.location, language_code: 'en', depth: 20 };
    const { task: t } = await dfsPost('/v3/serp/google/maps/live/advanced', [task]);
    return { ok: true, data: parseMapsItems(t.result?.[0]), cost: t.cost ?? 0, raw: trimTask(t) };
  } catch (err) {
    return fail(err);
  }
}

export async function organicSearch(keyword: string, location: string): Promise<SourceResult<Array<{ rank: number; domain: string; title: string }>>> {
  try {
    const { task: t } = await dfsPost('/v3/serp/google/organic/live/advanced', [{ keyword, location_name: location, language_code: 'en', device: 'mobile', depth: 20 }]);
    return { ok: true, data: parseOrganicItems(t.result?.[0]), cost: t.cost ?? 0, raw: trimTask(t) };
  } catch (err) {
    return fail(err);
  }
}

/** Rating, reviews and the pin for a business Maps did not list in the top 20. */
export async function businessInfo(query: string): Promise<SourceResult<MapsItem | null>> {
  try {
    const { task: t } = await dfsPost('/v3/business_data/google/my_business_info/live', [{ keyword: query, language_code: 'en', location_code: 2840 }]);
    return { ok: true, data: parseBusinessInfo(t.result?.[0]), cost: t.cost ?? 0, raw: trimTask(t) };
  } catch (err) {
    return fail(err);
  }
}

const GRID_CONCURRENCY = 5;

/**
 * The same Maps search from 25 points around the pin. A point that fails or
 * does not list the business is null; the section fails only when more than
 * half the points failed. `search` is injectable for tests.
 */
export async function gridSearch(
  keyword: string,
  subject: Pick<AuditSubject, 'business' | 'website' | 'placeId' | 'cid'>,
  center: { lat: number; lng: number },
  search: typeof mapsSearch = mapsSearch
): Promise<SourceResult<GridResult>> {
  const pts = gridPoints(center.lat, center.lng);
  const points: GridPoint[] = pts.map((p) => ({ ...p, rank: null }));
  let cost = 0;
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < pts.length; i += GRID_CONCURRENCY) {
    const batch = pts.slice(i, i + GRID_CONCURRENCY);
    const results = await Promise.all(batch.map((p) => search(keyword, { coordinate: p })));
    results.forEach((r, j) => {
      if (!r.ok) {
        failed += 1;
        if (errors.length < 3) errors.push(r.error);
        return;
      }
      cost += r.cost;
      points[i + j].rank = matchSubject(subject, r.data)?.item.rank ?? null;
    });
    // A location/credentials error repeats 25 times: stop after the first batch and count the rest as failed.
    if (failed === batch.length && i === 0) {
      failed = pts.length;
      break;
    }
  }
  if (failed > pts.length / 2) return { ok: false, error: `Grid failed at ${failed} of ${pts.length} points: ${errors[0] ?? 'unknown error'}` };
  return { ok: true, data: summarizeGrid(points), cost, raw: { points: pts.length, failed, errors } };
}

// ───────────────────────────── Free sources ─────────────────────────────

export async function pageSpeed(url: string): Promise<SourceResult<{ score: number | null; lcpMs: number | null }>> {
  try {
    const key = process.env.PAGESPEED_API_KEY ? `&key=${encodeURIComponent(process.env.PAGESPEED_API_KEY)}` : '';
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${key}`, {
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, { numericValue?: number }> };
    } | null;
    if (!res.ok || !json?.lighthouseResult) throw new Error(json?.error?.message || `PageSpeed answered ${res.status}`);
    const score = json.lighthouseResult.categories?.performance?.score;
    const lcp = json.lighthouseResult.audits?.['largest-contentful-paint']?.numericValue;
    return {
      ok: true,
      data: { score: typeof score === 'number' ? Math.round(score * 100) : null, lcpMs: typeof lcp === 'number' ? Math.round(lcp) : null },
      cost: 0,
      raw: { score, lcp },
    };
  } catch (err) {
    return fail(err);
  }
}

async function assertPublic(url: URL): Promise<void> {
  if (!/^https?:$/.test(url.protocol)) throw new Error('Only http(s) sites can be checked');
  if (!isPublicHostname(url.hostname)) throw new Error('That address is not a public website');
  const { address } = await dns.lookup(url.hostname);
  if (isPrivateAddress(address)) throw new Error('That address is not a public website');
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    n += value.length;
    if (n >= max) {
      await reader.cancel();
      break;
    }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchPublic(url: string, hops = 0): Promise<{ finalUrl: string; html: string }> {
  if (hops > 3) throw new Error('Too many redirects');
  const u = new URL(url);
  await assertPublic(u);
  const res = await fetch(u, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,*/*;q=0.8' }, signal: AbortSignal.timeout(10_000) });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (!loc) throw new Error(`Redirect without a destination (${res.status})`);
    return fetchPublic(new URL(loc, u).toString(), hops + 1);
  }
  if (!res.ok) throw new Error(`The site answered ${res.status}`);
  return { finalUrl: u.toString(), html: await readCapped(res, 2_000_000) };
}

export async function siteCheck(url: string): Promise<SourceResult<{ finalUrl: string; https: boolean } & HtmlChecks>> {
  try {
    const { finalUrl, html } = await fetchPublic(url);
    return { ok: true, data: { finalUrl, https: finalUrl.startsWith('https://'), ...htmlChecks(html) }, cost: 0, raw: { finalUrl, bytes: html.length } };
  } catch (err) {
    return fail(err);
  }
}

export interface Sources {
  mapsSearch: typeof mapsSearch;
  organicSearch: typeof organicSearch;
  businessInfo: typeof businessInfo;
  gridSearch: typeof gridSearch;
  pageSpeed: typeof pageSpeed;
  siteCheck: typeof siteCheck;
}
export const defaultSources: Sources = { mapsSearch, organicSearch, businessInfo, gridSearch, pageSpeed, siteCheck };

export { DataForSeoError };
