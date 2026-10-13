// lib/auditDeepParse.ts
// Pure parsers and roll-ups for the deep audit (phase 2): DataForSEO Labs
// keyword ideas, Google Ads local volume, domain rank overview, the profile
// fields on a Maps item, Google reviews, and the market / competitor / profile /
// reviews sections built from them. Tested on trimmed real responses in
// lib/__fixtures__/dataforseo. Nothing here estimates; missing numbers stay null.
import { domainOf, type CompetitorProfile, type CompetitorsResult, type MapsItem, type MarketKeyword, type MarketResult, type ProfileResult, type ReviewsResult } from '@/lib/auditShared';

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : null);
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const items = (result: unknown): Rec[] => {
  const r = rec(result);
  return r && Array.isArray(r.items) ? (r.items as unknown[]).map(rec).filter((x): x is Rec => x !== null) : [];
};
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

// ───────────────────────────── DataForSEO shapes ─────────────────────────────

export interface KeywordIdea { keyword: string; volume: number | null; cpc: number | null }
/** dataforseo_labs/google/keyword_ideas/live → result[0] */
export function parseKeywordIdeas(result: unknown): KeywordIdea[] {
  return items(result)
    .map((i) => {
      const info = rec(i.keyword_info);
      return { keyword: str(i.keyword).toLowerCase(), volume: num(info?.search_volume), cpc: num(info?.cpc) };
    })
    .filter((i) => i.keyword);
}

export interface LocalVolume { keyword: string; volume: number | null; cpc: number | null; competition: 'LOW' | 'MEDIUM' | 'HIGH' | null }
/** keywords_data/google_ads/search_volume/live → task.result (an array of keyword rows) */
export function parseAdsVolume(resultArray: unknown): LocalVolume[] {
  if (!Array.isArray(resultArray)) return [];
  return resultArray
    .map(rec)
    .filter((x): x is Rec => x !== null)
    .map((r) => {
      const c = str(r.competition).toUpperCase();
      const competition: LocalVolume['competition'] = c === 'LOW' || c === 'MEDIUM' || c === 'HIGH' ? c : null;
      return { keyword: str(r.keyword).toLowerCase(), volume: num(r.search_volume), cpc: num(r.cpc), competition };
    })
    .filter((r) => r.keyword);
}

export interface DomainOverview { organicKeywords: number | null; estTraffic: number | null; estPaidValue: number | null }
/** dataforseo_labs/google/domain_rank_overview/live → result[0] */
export function parseDomainOverview(result: unknown): DomainOverview | null {
  const first = items(result)[0];
  const organic = rec(rec(first?.metrics)?.organic);
  if (!organic) return null;
  return { organicKeywords: num(organic.count), estTraffic: num(organic.etv), estPaidValue: num(organic.estimated_paid_traffic_cost) };
}

/** The profile fields a Maps item carries for free. Safe on any object. */
export function parseMapsProfile(i: Rec): Pick<MapsItem, 'photos' | 'claimed' | 'booking' | 'phone' | 'openDays' | 'stars'> {
  const dist = rec(i.rating_distribution);
  const stars = dist
    ? ({ 1: num(dist['1']) ?? 0, 2: num(dist['2']) ?? 0, 3: num(dist['3']) ?? 0, 4: num(dist['4']) ?? 0, 5: num(dist['5']) ?? 0 } as Record<1 | 2 | 3 | 4 | 5, number>)
    : null;
  const timetable = rec(rec(i.work_hours)?.timetable);
  const openDays = timetable ? Object.values(timetable).filter((d) => Array.isArray(d) && d.length > 0).length : null;
  return {
    photos: num(i.total_photos),
    claimed: typeof i.is_claimed === 'boolean' ? i.is_claimed : null,
    booking: Boolean(str(i.book_online_url)),
    phone: str(i.phone) || null,
    openDays,
    stars,
  };
}

export interface ReviewItem { at: string | null; stars: number | null; answered: boolean; text: string }
export interface ParsedReviews { rating: number | null; total: number | null; items: ReviewItem[] }
/** business_data/google/reviews/task_get → result[0]. Timestamps come as "2026-10-08 12:00:00 +00:00". */
export function parseReviews(result: unknown): ParsedReviews {
  const r = rec(result);
  const toIso = (v: unknown): string | null => {
    const s = str(v);
    if (!s) return null;
    const t = Date.parse(s.replace(' ', 'T').replace(/ \+00:00$/, 'Z').replace(/ ([+-]\d{2}:\d{2})$/, '$1'));
    return Number.isNaN(t) ? null : new Date(t).toISOString();
  };
  return {
    rating: num(rec(r?.rating)?.value),
    total: num(r?.reviews_count),
    items: items(result).map((i) => ({ at: toIso(i.timestamp), stars: num(rec(i.rating)?.value), answered: Boolean(str(i.owner_answer)), text: str(i.review_text) })),
  };
}

// ───────────────────────────── Roll-ups ─────────────────────────────

export const STOP_WORDS = new Set(
  'the and for with that this they them were was very have from your their there about would could just also than then when what which while will been being into over after before more most some such only other these those because'.split(' ')
);

/** The words reviewers use most: lowercase, letters only, ≥ 4 letters, stop words out, by count then alphabetically. */
export function topWords(texts: string[], n = 8): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const w of t.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
      if (STOP_WORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, n);
}

const DAY = 86_400_000;

/** Velocity only when the sample can support it: ≥ 2 dated reviews spanning ≥ 30 days. */
export function reviewsFromItems(list: ReviewItem[], now: number = Date.now()): ReviewsResult {
  const dated = list.filter((i): i is ReviewItem & { at: string } => typeof i.at === 'string').map((i) => ({ ...i, t: Date.parse(i.at) }));
  const rated = list.filter((i) => i.stars !== null);
  const newest = dated.length ? Math.max(...dated.map((d) => d.t)) : null;
  const oldest = dated.length ? Math.min(...dated.map((d) => d.t)) : null;
  const canMeasure = dated.length >= 2 && oldest !== null && now - oldest >= 30 * DAY;
  const last90 = dated.filter((d) => now - d.t <= 90 * DAY).length;
  return {
    sampled: list.length,
    perMonth90d: canMeasure ? round1(last90 / 3) : null,
    responseRate: list.length ? round2(list.filter((i) => i.answered).length / list.length) : null,
    lowStarShare: rated.length ? round2(rated.filter((i) => (i.stars ?? 5) <= 2).length / rated.length) : null,
    words: topWords(list.map((i) => i.text)),
    newestAt: newest === null ? null : new Date(newest).toISOString(),
    oldestAt: oldest === null ? null : new Date(oldest).toISOString(),
  };
}

export interface RankPair { mapsRank: number | null; organicRank: number | null }

/** Local keywords + the ranks we measured for some of them → the market section. */
export function marketFromParts(input: { city: string; local: LocalVolume[]; ranks: Map<string, RankPair>; now?: number }): MarketResult {
  const keywords: MarketKeyword[] = input.local
    .map((k) => {
      const r = input.ranks.get(k.keyword);
      return { keyword: k.keyword, volume: k.volume, cpc: k.cpc, competition: k.competition, mapsRank: r?.mapsRank ?? null, organicRank: r?.organicRank ?? null, measured: Boolean(r) };
    })
    .sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1) || a.keyword.localeCompare(b.keyword));
  const missed = keywords.filter((k) => k.measured && k.volume !== null && (k.mapsRank === null || k.mapsRank > 3));
  return {
    city: input.city,
    keywords,
    missedSearches: missed.reduce((s, k) => s + (k.volume ?? 0), 0),
    missedAdValue: Math.round(missed.reduce((s, k) => s + (k.volume ?? 0) * (k.cpc ?? 0), 0)),
    measuredAt: new Date(input.now ?? Date.now()).toISOString(),
  };
}

/** The Maps top 3 plus the subject, with domain strength where a domain was looked up. */
export function competitorProfiles(top: MapsItem[], self: MapsItem | null, overviews: Map<string, DomainOverview | null>): CompetitorsResult {
  const row = (i: MapsItem, isSelf: boolean): CompetitorProfile => {
    const d = domainOf(i.domain);
    const o = d ? (overviews.get(d) ?? null) : null;
    return {
      name: i.name,
      rank: i.rank,
      domain: d,
      rating: i.rating,
      reviews: i.reviews,
      photos: i.photos,
      claimed: i.claimed,
      booking: i.booking,
      openDays: i.openDays,
      organicKeywords: o?.organicKeywords ?? null,
      estTraffic: o?.estTraffic ?? null,
      ...(isSelf ? { self: true as const } : {}),
    };
  };
  const rows = top.filter((i) => i.rank <= 3 && i !== self).map((i) => row(i, false));
  if (self) rows.push(row(self, true));
  return { items: rows };
}

export function profileFromItem(i: MapsItem): ProfileResult {
  return {
    photos: i.photos,
    claimed: i.claimed,
    booking: i.booking,
    phone: Boolean(i.phone),
    website: Boolean(i.domain),
    openDays: i.openDays,
    categories: i.categories,
    stars: i.stars,
  };
}
