// lib/planRules.ts
// The 90-Day Plan's rules (phase 2, spec §3.1): an audit in, ranked actions out.
// Every title and "why" is a template filled with measured numbers; nothing is
// written by a model. Pure and client-safe; tested in lib/planRules.test.ts.
import { isNoSite, section, type AuditResults, type AuditSubject } from '@/lib/auditShared';

export type PlanOwner = 'axeon' | 'client';
export type PlanStatus = 'open' | 'on_track' | 'slipping' | 'done' | 'dropped';
export type PlanValue = number | boolean | null;
export type Impact = 1 | 2 | 3;

export interface PlanDraft {
  /** Stable rule id ("reviews-gap", "coverage:<keyword>"); owner-added items use "custom:<id>". */
  key: string;
  title: string;
  why: string;
  owner: PlanOwner;
  /** What later audits measure to close it; null = marked done by hand. */
  metric: string | null;
  target: PlanValue;
  current: PlanValue;
  impact: Impact;
}

export const PLAN_MAX = 12;
/** Metrics where lower is better. */
const LOWER_IS_BETTER = new Set(['mapsRank', 'broken-links', 'untitled-pages', 'thin-pages']);
const NOT_FOUND_RANK = 21;
const BUSINESS_SCHEMA = /business|service|organization/i;

/** Reads one plan metric off any audit (quick or deep). null = this audit did not measure it. */
export function metricValue(results: AuditResults, metric: string): PlanValue {
  const maps = section(results.maps);
  const rep = section(results.reputation);
  const grid = section(results.grid);
  const web = section(results.website);
  const site = web && !isNoSite(web) ? web : null;
  const profile = section(results.profile);
  const reviews = section(results.reviews);
  const crawl = section(results.crawl);
  if (metric.startsWith('coverage:')) {
    const kw = metric.slice('coverage:'.length);
    const c = crawl?.coverage.find((x) => x.keyword === kw);
    return c ? c.covered : null;
  }
  switch (metric) {
    case 'reviews':
      return rep?.reviews ?? null;
    case 'rating':
      return rep?.rating ?? null;
    case 'mapsRank':
      return maps ? (maps.found && maps.rank !== null ? maps.rank : NOT_FOUND_RANK) : null;
    case 'gridShare':
      return grid?.top3Share ?? null;
    case 'https':
      return site ? site.https : web ? false : null;
    case 'clickToCall':
      return site ? site.clickToCall : web ? false : null;
    case 'form':
      return site ? site.form : web ? false : null;
    case 'pagespeed':
      return site?.pagespeedMobile ?? null;
    case 'schema':
      return site ? site.schema.some((t) => BUSINESS_SCHEMA.test(t)) : web ? false : null;
    case 'photos':
      return profile?.photos ?? null;
    case 'claimed':
      return profile?.claimed ?? null;
    case 'booking':
      return profile ? profile.booking : null;
    case 'hours':
      return profile ? (profile.openDays ?? 0) > 0 : null;
    case 'listing-website':
      return profile ? profile.website : null;
    case 'responseRate':
      return reviews?.responseRate ?? null;
    case 'broken-links':
      return crawl ? crawl.broken.length : null;
    case 'untitled-pages':
      return crawl?.untitled ?? null;
    case 'thin-pages':
      return crawl?.thin ?? null;
    default:
      return null;
  }
}

/** How a plan value reads on screen; the not-found sentinel is never shown as a rank. */
export function fmtPlanValue(v: PlanValue, metric: string | null): string {
  if (v === null) return '–';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (metric === 'mapsRank') return v >= NOT_FOUND_RANK ? 'not in top 20' : `#${v}`;
  if (metric === 'responseRate' || metric === 'gridShare') return `${Math.round(v * 100)}%`;
  return String(v);
}

export function targetMet(metric: string | null, current: PlanValue, target: PlanValue): boolean {
  if (metric === null || current === null || target === null) return false;
  if (typeof target === 'boolean') return current === target;
  if (typeof current !== 'number') return false;
  return LOWER_IS_BETTER.has(metric) ? current <= target : current >= target;
}

const avg = (xs: Array<number | null | undefined>): number | null => {
  const v = xs.filter((x): x is number => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const pct = (n: number) => `${Math.round(n * 100)}%`;
const money = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`;

/** Spec §3.1 rules, in priority order; then sorted by impact, capped. */
export function planFromAudit(audit: { results: AuditResults; subject: Pick<AuditSubject, 'keyword' | 'city'>; createdAt?: string }, opts: { max?: number } = {}): PlanDraft[] {
  const r = audit.results;
  const maps = section(r.maps);
  const rep = section(r.reputation);
  const grid = section(r.grid);
  const web = section(r.website);
  const site = web && !isNoSite(web) ? web : null;
  const market = section(r.market);
  const comps = section(r.competitors);
  const profile = section(r.profile);
  const reviews = section(r.reviews);
  const crawl = section(r.crawl);
  const kw = maps?.searched.keyword ?? audit.subject.keyword;
  const city = audit.subject.city;
  const top3 = maps?.top.filter((c) => !c.self && c.rank <= 3) ?? [];
  const out: PlanDraft[] = [];
  const push = (d: PlanDraft) => out.push(d);

  // 1. Reviews gap
  const top3Reviews = avg(top3.map((c) => c.reviews));
  const mine = rep?.reviews ?? null;
  if (top3Reviews !== null && mine !== null && mine < top3Reviews) {
    const target = Math.ceil(top3Reviews * 0.8);
    const velocity = reviews?.perMonth90d != null ? ` You add ~${reviews.perMonth90d}/mo.` : '';
    push({ key: 'reviews-gap', title: `Get to ${target} Google reviews`, why: `You have ${mine}; the top 3 average ${Math.round(top3Reviews)} reviews.${velocity}`, owner: 'client', metric: 'reviews', target, current: mine, impact: 3 });
  }
  // 2. Maps top 3
  if (maps && (!maps.found || (maps.rank ?? NOT_FOUND_RANK) > 3)) {
    const current = maps.found && maps.rank !== null ? maps.rank : NOT_FOUND_RANK;
    push({ key: 'maps-top3', title: `Reach the Maps top 3 for "${kw}"`, why: maps.found && maps.rank !== null ? `#${maps.rank} today.` : 'Not in the top 20 today.', owner: 'axeon', metric: 'mapsRank', target: 3, current, impact: 3 });
  }
  // 3. Missing service pages
  if (market && crawl) {
    const uncovered = market.keywords
      .filter((k) => k.measured && (k.volume ?? 0) >= 20)
      .map((k) => ({ k, c: crawl.coverage.find((x) => x.keyword === k.keyword) }))
      .filter(({ c }) => c && !c.covered)
      .slice(0, 4);
    for (const { k } of uncovered) {
      const cpc = k.cpc ? `; ${money(k.cpc)} a click if you bought them` : '';
      push({ key: `coverage:${k.keyword}`, title: `Build a "${k.keyword}" page`, why: `${k.volume} searches/mo in ${city}; no page on the site covers it${cpc}.`, owner: 'axeon', metric: `coverage:${k.keyword}`, target: true, current: false, impact: (k.volume ?? 0) >= 100 ? 3 : 2 });
    }
  }
  // 4. Profile gaps
  if (profile) {
    if (profile.claimed === false) push({ key: 'claim', title: 'Claim the Google Business Profile', why: 'The listing is unclaimed.', owner: 'client', metric: 'claimed', target: true, current: false, impact: 3 });
    const top3Photos = avg(comps?.items.filter((c) => !c.self).map((c) => c.photos) ?? []);
    if (top3Photos !== null && profile.photos !== null && profile.photos < top3Photos * 0.6) {
      const target = Math.ceil(top3Photos * 0.6);
      push({ key: 'photos', title: `Add photos to the Google listing (to ${target})`, why: `${profile.photos} photos vs the top 3's ${Math.round(top3Photos)} on average.`, owner: 'client', metric: 'photos', target, current: profile.photos, impact: 2 });
    }
    if (!profile.booking) {
      const n = comps?.items.filter((c) => !c.self && c.booking).length ?? 0;
      push({ key: 'booking', title: 'Add a booking link to the Google listing', why: n ? `None today; ${n} of the top 3 have one.` : 'None today.', owner: 'client', metric: 'booking', target: true, current: false, impact: 1 });
    }
    if ((profile.openDays ?? 0) === 0) push({ key: 'hours', title: 'Set business hours on the Google listing', why: 'No hours are listed.', owner: 'client', metric: 'hours', target: true, current: false, impact: 1 });
    if (!profile.website) push({ key: 'listing-website', title: 'Put the website on the Google listing', why: 'The listing has no website link.', owner: 'axeon', metric: 'listing-website', target: true, current: false, impact: 2 });
  }
  // 5. Site basics
  if (site) {
    if (!site.https) push({ key: 'https', title: 'Make the site secure (https)', why: 'Browsers label it “Not secure”.', owner: 'axeon', metric: 'https', target: true, current: false, impact: 3 });
    if (!site.clickToCall) push({ key: 'tap-to-call', title: 'Add a tap-to-call button', why: 'On a phone, nobody can call with one tap.', owner: 'axeon', metric: 'clickToCall', target: true, current: false, impact: 3 });
    if (!site.form) push({ key: 'form', title: 'Add a contact form', why: 'People who won’t call have no way to reach you.', owner: 'axeon', metric: 'form', target: true, current: false, impact: 2 });
    if (site.pagespeedMobile !== null && site.pagespeedMobile < 50) push({ key: 'pagespeed', title: 'Get mobile speed above 50', why: `Mobile speed score ${site.pagespeedMobile}/100.`, owner: 'axeon', metric: 'pagespeed', target: 50, current: site.pagespeedMobile, impact: 2 });
    if (!site.schema.some((t) => BUSINESS_SCHEMA.test(t))) push({ key: 'schema', title: 'Add business markup to the site', why: 'No structured data tells Google what you do and where.', owner: 'axeon', metric: 'schema', target: true, current: false, impact: 1 });
  }
  if (crawl) {
    if (crawl.broken.length) push({ key: 'broken-links', title: `Fix ${crawl.broken.length} broken link${crawl.broken.length === 1 ? '' : 's'}`, why: `${crawl.broken.length} internal link${crawl.broken.length === 1 ? '' : 's'} on the site go nowhere.`, owner: 'axeon', metric: 'broken-links', target: 0, current: crawl.broken.length, impact: 2 });
    if (crawl.untitled) push({ key: 'untitled-pages', title: `Give ${crawl.untitled} page${crawl.untitled === 1 ? '' : 's'} a title`, why: `${crawl.untitled} page${crawl.untitled === 1 ? ' has' : 's have'} no title tag.`, owner: 'axeon', metric: 'untitled-pages', target: 0, current: crawl.untitled, impact: 1 });
    if (crawl.thin > 2) push({ key: 'thin-pages', title: `Flesh out ${crawl.thin} thin pages`, why: `${crawl.thin} pages have under 150 words.`, owner: 'axeon', metric: 'thin-pages', target: 2, current: crawl.thin, impact: 1 });
  }
  // 6. Review responses
  if (reviews && reviews.responseRate !== null && reviews.responseRate < 0.5) {
    push({ key: 'response-rate', title: 'Reply to reviews (aim for 80%)', why: `You replied to ${pct(reviews.responseRate)} of the last ${reviews.sampled}.`, owner: 'client', metric: 'responseRate', target: 0.8, current: reviews.responseRate, impact: 2 });
  }
  // 7. Grid share
  if (grid && grid.top3Share < 0.5) {
    push({ key: 'grid-share', title: `Show in the top 3 across more of ${city}`, why: `In the top 3 from ${pct(grid.top3Share)} of the area today.`, owner: 'axeon', metric: 'gridShare', target: 0.6, current: grid.top3Share, impact: 2 });
  }

  return out
    .map((d, i) => ({ d, i }))
    .sort((a, b) => b.d.impact - a.d.impact || a.i - b.i)
    .map(({ d }) => d)
    .slice(0, opts.max ?? PLAN_MAX);
}
