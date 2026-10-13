// lib/planRules.test.ts
// Run with: npx tsx --test lib/planRules.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metricValue, planFromAudit, targetMet } from './planRules';
import type { AuditResults } from './auditShared';

const rich: AuditResults = {
  maps: { found: true, rank: 7, matchedBy: 'domain', searched: { keyword: 'auto detailing', location: 'Ankeny,Iowa,United States' }, top: [
    { rank: 1, name: 'A', rating: 4.9, reviews: 212, website: null }, { rank: 2, name: 'B', rating: 4.8, reviews: 140, website: null }, { rank: 3, name: 'C', rating: 4.7, reviews: 98, website: null },
    { rank: 7, name: 'Me', rating: 4.6, reviews: 18, website: 'subjectspa.com', self: true } ] },
  reputation: { rating: 4.6, reviews: 18, categories: [], gbpUrl: null, placeId: null },
  grid: { spacingMiles: 1, size: 5, points: [], top3Share: 0.32, avgRank: 6 },
  website: { url: 'https://subjectspa.com/', https: true, pagespeedMobile: 41, lcpMs: 4800, clickToCall: false, form: true, title: 'Home', metaDescription: 'x', schema: ['LocalBusiness'] },
  market: { city: 'Ankeny', measuredAt: '2026-10-13T00:00:00.000Z', missedSearches: 570, missedAdValue: 6000, keywords: [
    { keyword: 'auto detailing ankeny', volume: 480, cpc: 11, competition: 'HIGH', mapsRank: 7, organicRank: null, measured: true },
    { keyword: 'ceramic coating ankeny', volume: 90, cpc: 9, competition: 'MEDIUM', mapsRank: null, organicRank: null, measured: true },
    { keyword: 'car wash ankeny', volume: 10, cpc: 2, competition: 'LOW', mapsRank: null, organicRank: null, measured: true } ] },
  competitors: { items: [
    { name: 'A', rank: 1, domain: 'a.test', rating: 4.9, reviews: 212, photos: 150, claimed: true, booking: true, openDays: 7, organicKeywords: 300, estTraffic: 900 },
    { name: 'B', rank: 2, domain: null, rating: 4.8, reviews: 140, photos: 160, claimed: true, booking: false, openDays: 7, organicKeywords: null, estTraffic: null },
    { name: 'C', rank: 3, domain: 'c.test', rating: 4.7, reviews: 98, photos: 110, claimed: true, booking: true, openDays: 6, organicKeywords: 40, estTraffic: 100 },
    { name: 'Me', rank: 7, domain: 'subjectspa.com', rating: 4.6, reviews: 18, photos: 31, claimed: true, booking: false, openDays: 6, organicKeywords: 6, estTraffic: 12, self: true } ] },
  profile: { photos: 31, claimed: true, booking: false, phone: true, website: true, openDays: 6, categories: ['Car detailing service'], stars: null },
  reviews: { sampled: 20, perMonth90d: 2, responseRate: 0.2, lowStarShare: 0.05, words: [], newestAt: null, oldestAt: null },
  crawl: { pages: [], broken: ['https://subjectspa.com/old'], coverage: [
    { keyword: 'auto detailing ankeny', covered: true, url: 'https://subjectspa.com/' },
    { keyword: 'ceramic coating ankeny', covered: false, url: null },
    { keyword: 'car wash ankeny', covered: false, url: null } ], thin: 1, untitled: 0 },
};
const audit = { results: rich, subject: { business: 'Me', city: 'Ankeny', state: 'IA', website: 'https://subjectspa.com', keyword: 'auto detailing', placeId: null, cid: null, lat: null, lng: null }, createdAt: '2026-10-13T00:00:00.000Z' };

test('planFromAudit: ranked, numbered, owned, capped', () => {
  const plan = planFromAudit(audit);
  const keys = plan.map((p) => p.key);
  assert.ok(plan.length <= 12);
  assert.equal(keys[0], 'reviews-gap');
  assert.ok(keys.includes('maps-top3') && keys.includes('tap-to-call') && keys.includes('coverage:ceramic coating ankeny'));
  assert.ok(!keys.includes('coverage:car wash ankeny'), 'under 20 searches/mo is not worth a page');
  assert.ok(!keys.includes('coverage:auto detailing ankeny'), 'already covered');
  const gap = plan.find((p) => p.key === 'reviews-gap')!;
  assert.equal(gap.owner, 'client');
  assert.equal(gap.target, 120, 'ceil(150 × 0.8)');
  assert.equal(gap.current, 18);
  assert.match(gap.why, /average 150 reviews/);
  assert.match(gap.why, /~2\/mo/);
  const page = plan.find((p) => p.key === 'coverage:ceramic coating ankeny')!;
  assert.equal(page.owner, 'axeon');
  assert.match(page.why, /90 searches/);
  assert.match(page.why, /\$9/);
  assert.equal(plan.find((p) => p.key === 'photos')?.target, 84, 'ceil(140 × 0.6)');
  assert.equal(plan.find((p) => p.key === 'booking')?.owner, 'client');
  assert.equal(plan.find((p) => p.key === 'response-rate')?.target, 0.8);
  assert.equal(plan.find((p) => p.key === 'grid-share')?.target, 0.6);
  assert.ok(plan.find((p) => p.key === 'broken-links'));
  assert.ok(!plan.find((p) => p.key === 'https'), 'https is fine');
  assert.ok(!plan.find((p) => p.key === 'claim'), 'already claimed');
  for (let i = 1; i < plan.length; i += 1) assert.ok(plan[i - 1].impact >= plan[i].impact, 'impact descending');
});

test('planFromAudit on a quick audit: only what it can see', () => {
  const quick: AuditResults = { maps: rich.maps, reputation: rich.reputation, website: rich.website };
  const keys = planFromAudit({ ...audit, results: quick }).map((p) => p.key);
  assert.deepEqual(keys, ['reviews-gap', 'maps-top3', 'tap-to-call', 'pagespeed']);
});

test('metricValue and targetMet read any audit', () => {
  assert.equal(metricValue(rich, 'reviews'), 18);
  assert.equal(metricValue(rich, 'mapsRank'), 7);
  assert.equal(metricValue({ maps: { found: false, rank: null, matchedBy: null, searched: { keyword: 'k', location: 'l' }, top: [] } }, 'mapsRank'), 21, 'not found counts as worse than 20');
  assert.equal(metricValue(rich, 'coverage:ceramic coating ankeny'), false);
  assert.equal(metricValue(rich, 'clickToCall'), false);
  assert.equal(metricValue({}, 'reviews'), null);
  assert.equal(targetMet('reviews', 120, 120), true);
  assert.equal(targetMet('mapsRank', 3, 3), true);
  assert.equal(targetMet('mapsRank', 4, 3), false);
  assert.equal(targetMet('clickToCall', true, true), true);
  assert.equal(targetMet('broken-links', 0, 0), true);
});

import { fmtPlanValue } from './planRules';
test('fmtPlanValue never shows the not-found sentinel as a rank (review Important 3)', () => {
  assert.equal(fmtPlanValue(21, 'mapsRank'), 'not in top 20');
  assert.equal(fmtPlanValue(7, 'mapsRank'), '#7');
  assert.equal(fmtPlanValue(0.2, 'responseRate'), '20%');
  assert.equal(fmtPlanValue(true, 'claimed'), 'yes');
  assert.equal(fmtPlanValue(null, 'reviews'), '–');
});
