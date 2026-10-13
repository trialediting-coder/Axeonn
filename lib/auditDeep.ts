// lib/auditDeep.ts
// The deep audit's paid sources (phase 2): DataForSEO Labs keyword ideas,
// Google Ads local volume, Labs domain overview, and Google reviews (an async
// task: post now, collect later). Same contract as lib/auditSources.ts: each
// returns ok/data/cost/raw or ok:false/error and never throws past its boundary.
// Labs endpoints only take country/state locations (location_code 2840); the
// Ads endpoint takes the city name. The crawler lives in lib/siteCrawl.ts and is
// listed here so composeAudit can inject a fake for it.
import { DFS_PENDING_CODES, dfsGet, dfsPost, trimTask } from '@/lib/dataforseo';
import { parseAdsVolume, parseDomainOverview, parseKeywordIdeas, parseReviews, type DomainOverview, type KeywordIdea, type LocalVolume, type ParsedReviews } from '@/lib/auditDeepParse';
import type { SourceResult } from '@/lib/auditSources';
import { crawlSite } from '@/lib/siteCrawl';

const fail = (err: unknown): { ok: false; error: string } => ({ ok: false, error: err instanceof Error ? err.message : String(err) });

export const US_LOCATION_CODE = 2840;

export async function keywordIdeas(seed: string, limit = 40): Promise<SourceResult<KeywordIdea[]>> {
  try {
    const { task } = await dfsPost('/v3/dataforseo_labs/google/keyword_ideas/live', [{ keywords: [seed], location_code: US_LOCATION_CODE, language_name: 'English', limit, include_seed_keyword: true }]);
    return { ok: true, data: parseKeywordIdeas(task.result?.[0]), cost: task.cost ?? 0, raw: trimTask(task) };
  } catch (err) {
    return fail(err);
  }
}

/** Local monthly volume + CPC for up to ~700 keywords in one call (we send ≤ 30). */
export async function adsVolume(keywords: string[], location: string): Promise<SourceResult<LocalVolume[]>> {
  try {
    const { task } = await dfsPost('/v3/keywords_data/google_ads/search_volume/live', [{ keywords, location_name: location, language_name: 'English' }]);
    return { ok: true, data: parseAdsVolume(task.result), cost: task.cost ?? 0, raw: { status_code: task.status_code, cost: task.cost, result: Array.isArray(task.result) ? task.result.slice(0, 40) : null } };
  } catch (err) {
    return fail(err);
  }
}

export async function domainOverview(domain: string): Promise<SourceResult<DomainOverview | null>> {
  try {
    const { task } = await dfsPost('/v3/dataforseo_labs/google/domain_rank_overview/live', [{ target: domain, location_name: 'United States', language_name: 'English' }]);
    return { ok: true, data: parseDomainOverview(task.result?.[0]), cost: task.cost ?? 0, raw: trimTask(task) };
  } catch (err) {
    return fail(err);
  }
}

/** Starts the reviews task; DataForSEO fills it in minutes, sometimes twenty. */
export async function reviewsPost(business: string, location: string, depth = 50): Promise<SourceResult<{ taskId: string }>> {
  try {
    const { task } = await dfsPost('/v3/business_data/google/reviews/task_post', [{ keyword: business, location_name: location, language_code: 'en', depth, sort_by: 'newest' }]);
    if (!task.id) throw new Error('DataForSEO did not return a task id');
    return { ok: true, data: { taskId: task.id }, cost: task.cost ?? 0, raw: { id: task.id, status_code: task.status_code } };
  } catch (err) {
    return fail(err);
  }
}

/** 'pending' while DataForSEO is still working; data once it has the reviews. */
export async function reviewsGet(taskId: string): Promise<SourceResult<ParsedReviews | 'pending'>> {
  try {
    const { task } = await dfsGet(`/v3/business_data/google/reviews/task_get/${encodeURIComponent(taskId)}`);
    if (DFS_PENDING_CODES.has(task.status_code)) return { ok: true, data: 'pending', cost: 0, raw: { status_code: task.status_code } };
    if (task.status_code !== 20000) throw new Error(task.status_message || `DataForSEO task ${task.status_code}`);
    const parsed = parseReviews(task.result?.[0]);
    return { ok: true, data: parsed, cost: task.cost ?? 0, raw: { status_code: task.status_code, cost: task.cost, total: parsed.total, items: parsed.items.slice(0, 50) } };
  } catch (err) {
    return fail(err);
  }
}

export interface DeepSources {
  keywordIdeas: typeof keywordIdeas;
  adsVolume: typeof adsVolume;
  domainOverview: typeof domainOverview;
  reviewsPost: typeof reviewsPost;
  reviewsGet: typeof reviewsGet;
  crawl: typeof crawlSite;
}
export const defaultDeepSources: DeepSources = { keywordIdeas, adsVolume, domainOverview, reviewsPost, reviewsGet, crawl: crawlSite };
