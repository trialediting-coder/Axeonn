// lib/audits.test.ts
// Run with: npx tsx --test lib/audits.test.ts   (composeAudit with fake sources; no network, no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeAudit } from './audits';
import { gridSearch, type SourceResult, type Sources } from './auditSources';
import { section, type AuditSubject, type MapsItem } from './auditShared';

const item = (o: Partial<MapsItem> & { rank: number; name: string }): MapsItem => ({
  domain: null, url: null, rating: null, reviews: null, placeId: null, cid: null, lat: null, lng: null, categories: [], gbpUrl: null, photos: null, claimed: null, booking: false, phone: null, openDays: null, stars: null, ...o,
});
const subject: AuditSubject = { business: 'Joes Auto Spa', city: 'Ankeny', state: 'IA', website: 'https://subjectspa.com', keyword: 'auto detailing', placeId: null, cid: null, lat: null, lng: null };
const mapsItems = [
  item({ rank: 1, name: 'Example Shine Co', rating: 4.9, reviews: 212, placeId: 'p1' }),
  item({ rank: 2, name: 'Sample Detail Works', rating: 4.8, reviews: 140 }),
  item({ rank: 3, name: 'Demo Mobile Detail', rating: 4.7, reviews: 98 }),
  item({ rank: 7, name: 'Joes Auto Spa', domain: 'www.subjectspa.com', rating: 4.6, reviews: 18, placeId: 'ChIJsubj', cid: '777', lat: 41.735, lng: -93.605 }),
];
const ok = <T,>(data: T, cost = 0.002): SourceResult<T> => ({ ok: true, data, cost, raw: { fixture: true } });
const bad = (error: string): SourceResult<never> => ({ ok: false, error });

const fakes = (over: Partial<Sources> = {}): Sources => ({
  mapsSearch: async () => ok(mapsItems),
  organicSearch: async () => ok([{ rank: 1, domain: 'yelp.test', title: 'Top 10' }, { rank: 4, domain: 'www.subjectspa.com', title: 'Joes' }]),
  businessInfo: async () => ok(null, 0.003),
  gridSearch: async () => ok({ spacingMiles: 1, size: 5, points: [], top3Share: 0.4, avgRank: 5 }, 0.05),
  pageSpeed: async () => ok({ score: 41, lcpMs: 4800 }, 0),
  siteCheck: async () => ok({ finalUrl: 'https://subjectspa.com/', https: true, clickToCall: false, form: true, title: 'Home', metaDescription: null, schema: [] }, 0),
  ...over,
});

test('composeAudit: every section filled, pin learned, cost summed, leaks built', async () => {
  const c = await composeAudit(subject, { grid: true, sources: fakes() });
  assert.equal(c.status, 'complete');
  assert.equal(section(c.results.maps)?.rank, 7);
  assert.equal(section(c.results.maps)?.matchedBy, 'domain');
  assert.equal(section(c.results.organic)?.rank, 4);
  assert.equal(section(c.results.reputation)?.reviews, 18);
  assert.equal(section(c.results.grid)?.top3Share, 0.4);
  const web = section(c.results.website);
  assert.ok(web && !('none' in web));
  assert.equal(c.costUsd, 0.054);
  assert.deepEqual(c.learned, { placeId: 'ChIJsubj', cid: '777', lat: 41.735, lng: -93.605 });
  assert.equal(c.subject.placeId, 'ChIJsubj');
  assert.ok(c.leaks.length > 0);
  assert.deepEqual(Object.keys(c.raw).sort(), ['grid', 'maps', 'organic']);
});

test('composeAudit: not found → business info fills reputation; no website → website none, no organic/pagespeed calls', async () => {
  let organicCalls = 0;
  const c = await composeAudit(
    { ...subject, business: 'Nobody Detailing', website: null },
    { grid: false, sources: fakes({ organicSearch: async () => { organicCalls += 1; return ok([]); }, businessInfo: async () => ok(item({ rank: 0, name: 'Nobody Detailing', rating: 4.2, reviews: 5, placeId: 'pX', lat: 1, lng: 2 }), 0.003) }) }
  );
  assert.equal(section(c.results.maps)?.found, false);
  assert.equal(section(c.results.reputation)?.rating, 4.2);
  assert.deepEqual(c.results.website, { none: true });
  assert.equal(c.results.organic, undefined);
  assert.equal(organicCalls, 0);
  assert.equal(c.results.grid, undefined, 'grid off');
  assert.deepEqual(c.learned, { placeId: 'pX', cid: null, lat: 1, lng: 2 });
});

test('composeAudit: a location error stops the run before more paid calls', async () => {
  let organicCalls = 0;
  const c = await composeAudit(subject, {
    grid: true,
    sources: fakes({ mapsSearch: async () => bad("DataForSEO doesn't know that location — check the city spelling"), organicSearch: async () => { organicCalls += 1; return ok([]); } }),
  });
  assert.equal(c.status, 'failed');
  assert.match(c.errors.maps, /location/);
  assert.equal(organicCalls, 0);
  assert.equal(c.costUsd, 0);
});

test('composeAudit: one failing section makes the audit partial, and a grid without a pin errors cleanly', async () => {
  const noPin = mapsItems.map((i) => ({ ...i, lat: null, lng: null }));
  const c = await composeAudit(subject, { grid: true, sources: fakes({ mapsSearch: async () => ok(noPin), pageSpeed: async () => bad('PageSpeed answered 500') }) });
  assert.equal(c.status, 'partial');
  assert.match(c.errors.grid, /finds the business first/);
  assert.equal(c.errors.pagespeed, 'PageSpeed answered 500');
  const web = section(c.results.website);
  assert.ok(web && !('none' in web) && web.pagespeedMobile === null && web.form === true, 'site checks still recorded without PageSpeed');
});

test('gridSearch: failed points are null; more than half failing fails the section; a dead first batch stops early', async () => {
  let calls = 0;
  const flaky: Sources['mapsSearch'] = async (_k, where) => {
    calls += 1;
    const lng = where.coordinate?.lng ?? 0;
    return lng < -93.61 ? bad('timeout') : ok(mapsItems); // the two western columns (10 of 25 points) fail
  };
  const g = await gridSearch('auto detailing', subject, { lat: 41.735, lng: -93.605 }, flaky);
  assert.ok(g.ok);
  assert.equal(g.data.points.length, 25);
  assert.ok(g.data.points.some((p) => p.rank === null) && g.data.points.some((p) => p.rank === 7));
  assert.equal(calls, 25);

  calls = 0;
  const dead = await gridSearch('auto detailing', subject, { lat: 41.735, lng: -93.605 }, async () => { calls += 1; return bad('DataForSEO rejected the login'); });
  assert.equal(dead.ok, false);
  assert.equal(calls, 5, 'stops after the first batch when every point fails');
});

// ── Final-review fixes ──
test('composeAudit: a business-info hit with a different name is not trusted', async () => {
  const c = await composeAudit(
    { ...subject, business: 'Nobody Detailing', website: null },
    { grid: false, sources: fakes({ businessInfo: async () => ok(item({ rank: 0, name: 'Totally Different Shop', rating: 4.9, reviews: 300, placeId: 'pWrong', lat: 1, lng: 2 }), 0.003) }) }
  );
  assert.equal(section(c.results.reputation)?.rating, null);
  assert.equal(c.learned, null);
  assert.equal(c.costUsd, 0.005, 'the call is still paid for and recorded');
});

test('composeAudit: a Facebook page is not a website — no organic, speed or site checks', async () => {
  let calls = 0;
  const count = async () => { calls += 1; return bad('should not be called'); };
  const c = await composeAudit(
    { ...subject, website: 'https://www.facebook.com/joesautospa' },
    { grid: false, sources: fakes({ organicSearch: count as Sources['organicSearch'], pageSpeed: count as Sources['pageSpeed'], siteCheck: count as Sources['siteCheck'] }) }
  );
  assert.deepEqual(c.results.website, { none: true });
  assert.equal(c.results.organic, undefined);
  assert.equal(calls, 0);
  assert.equal(section(c.results.maps)?.matchedBy, 'name', 'matched by name, not by the shared host');
});

// ── Phase 2: deep audit ──
import type { DeepSources } from './auditDeep';

const deepFakes = (over: Partial<DeepSources> = {}): DeepSources => ({
  keywordIdeas: async () => ok([{ keyword: 'auto detailing', volume: 49500, cpc: 14 }, { keyword: 'ceramic coating', volume: 5000, cpc: 9 }], 0.014),
  adsVolume: async (keywords) => ok(keywords.map((k) => ({ keyword: k, volume: k.includes('ceramic') ? 90 : 480, cpc: 11, competition: 'HIGH' as const })), 0.09),
  domainOverview: async () => ok({ organicKeywords: 100, estTraffic: 500, estPaidValue: 1000 }, 0.012),
  reviewsPost: async () => ok({ taskId: 't1' }, 0.0015),
  reviewsGet: async () => ok({ rating: 4.6, total: 18, items: [
    { at: '2026-10-01T00:00:00.000Z', stars: 5, answered: true, text: 'Great detail' },
    { at: '2026-08-01T00:00:00.000Z', stars: 4, answered: false, text: 'Good detail' },
  ] }, 0),
  crawl: async () => ok({ pages: [{ url: 'https://subjectspa.com/', status: 200, title: 'Home', h1: null, words: 300, clickToCall: false, form: true, schema: [], ms: 5 }], broken: [], coverage: [{ keyword: 'auto detailing ankeny', covered: false, url: null }], thin: 0, untitled: 0 }, 0),
  ...over,
});
const selfWithProfile = mapsItems.map((i) => (i.name === 'Joes Auto Spa' ? { ...i, photos: 31, claimed: true, booking: false, openDays: 6 } : i));

test('composeAudit deep: all five deep sections, reviews collected, costs summed', async () => {
  const c = await composeAudit(subject, { grid: false, deep: true, sources: fakes({ mapsSearch: async () => ok(selfWithProfile) }), deepSources: deepFakes(), pollBudgetMs: 0 });
  assert.equal(c.status, 'complete');
  const market = section(c.results.market);
  assert.ok(market && market.keywords.length >= 2);
  assert.ok(market.missedSearches > 0, 'subject is #7, so measured volume is missed');
  assert.equal(section(c.results.competitors)?.items.length, 4);
  assert.equal(section(c.results.profile)?.photos, 31);
  assert.equal(section(c.results.reviews)?.sampled, 2);
  assert.equal(section(c.results.crawl)?.pages.length, 1);
  assert.ok(c.costUsd > 0.1 && c.costUsd < 0.3, `cost ${c.costUsd}`);
  assert.equal(c.raw.reviewsTaskId, undefined);
});

test('composeAudit deep: a failed Ads call errors only the market section; a pending reviews task is recorded for later', async () => {
  const c = await composeAudit(subject, {
    grid: false, deep: true, sources: fakes({ mapsSearch: async () => ok(selfWithProfile) }),
    deepSources: deepFakes({ adsVolume: async () => bad('Ads quota'), reviewsGet: async () => ok('pending' as const, 0) }), pollBudgetMs: 0,
  });
  assert.equal(c.status, 'partial');
  assert.match(c.errors.market, /Ads quota/);
  assert.ok(section(c.results.competitors));
  assert.match(c.errors.reviews, /still processing/);
  assert.equal(c.raw.reviewsTaskId, 't1');
});

test('composeAudit quick: no deep sections when deep is off', async () => {
  const c = await composeAudit(subject, { grid: false, sources: fakes() });
  assert.equal(c.results.market, undefined);
  assert.equal(c.results.crawl, undefined);
});

test('deep: a failed rank search leaves the keyword unmeasured instead of "not in top 20" (review Important 2)', async () => {
  const flakyMaps: Sources['mapsSearch'] = async (keyword) => (keyword === 'ceramic coating ankeny' ? bad('timeout') : ok(selfWithProfile));
  const c = await composeAudit(subject, { grid: false, deep: true, sources: fakes({ mapsSearch: flakyMaps }), deepSources: deepFakes(), pollBudgetMs: 0 });
  const m = section(c.results.market)!;
  assert.equal(m.keywords.find((k) => k.keyword === 'ceramic coating ankeny')?.measured, false);
  assert.ok(m.keywords.find((k) => k.keyword === 'auto detailing ankeny')?.measured);
});

test('deep: open coverage keywords from the plan are crawled too (review Important 8)', async () => {
  let asked: string[] = [];
  const c = await composeAudit(subject, {
    grid: false, deep: true, sources: fakes({ mapsSearch: async () => ok(selfWithProfile) }),
    deepSources: deepFakes({ crawl: async (_u, keywords) => { asked = keywords; return ok({ pages: [], broken: [], coverage: keywords.map((k) => ({ keyword: k, covered: false, url: null })), thin: 0, untitled: 0 }, 0); } }),
    pollBudgetMs: 0, coverageKeywords: ['paint correction ankeny'],
  });
  assert.ok(asked.includes('paint correction ankeny'));
  assert.ok(section(c.results.crawl)?.coverage.some((x) => x.keyword === 'paint correction ankeny'));
});
