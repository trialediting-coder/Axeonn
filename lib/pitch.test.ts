// lib/pitch.test.ts
// Run with: npx tsx --test lib/pitch.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pitchNumbers, pitchText } from './pitch';
import { planFromAudit } from './planRules';
import type { AuditResults } from './auditShared';

const subject = { business: 'Subject Auto Spa', city: 'Ankeny', state: 'IA', website: 'https://subjectspa.com', keyword: 'auto detailing', placeId: null, cid: null, lat: null, lng: null };
const maps: AuditResults['maps'] = { found: true, rank: 7, matchedBy: 'domain', searched: { keyword: 'auto detailing', location: 'Ankeny,Iowa,United States' }, top: [
  { rank: 1, name: 'A', rating: 4.9, reviews: 212, website: null }, { rank: 2, name: 'B', rating: 4.8, reviews: 140, website: null }, { rank: 3, name: 'C', rating: 4.7, reviews: 98, website: null },
  { rank: 7, name: 'Subject Auto Spa', rating: 4.6, reviews: 18, website: 'subjectspa.com', self: true } ] };
const full: AuditResults = {
  maps,
  reputation: { rating: 4.6, reviews: 18, categories: [], gbpUrl: null, placeId: null },
  grid: { spacingMiles: 1, size: 5, points: [], top3Share: 0.32, avgRank: 6 },
  website: { url: 'https://subjectspa.com/', https: true, pagespeedMobile: 41, lcpMs: 4800, clickToCall: false, form: true, title: 'Home', metaDescription: 'x', schema: ['LocalBusiness'] },
  market: { city: 'Ankeny', measuredAt: '2026-10-13T00:00:00.000Z', missedSearches: 570, missedAdValue: 6180, keywords: [] },
  competitors: { items: [] },
  profile: { photos: 31, claimed: true, booking: false, phone: true, website: true, openDays: 6, categories: [], stars: null },
  reviews: { sampled: 20, perMonth90d: 2, responseRate: 0.2, lowStarShare: 0.05, words: [], newestAt: null, oldestAt: null },
  crawl: { pages: [], broken: [], coverage: [], thin: 0, untitled: 0 },
};

test('pitchNumbers pulls the headline figures', () => {
  const n = pitchNumbers({ results: full });
  assert.equal(n.missedSearches, 570);
  assert.equal(n.missedAdValue, 6180);
  assert.equal(n.myReviews, 18);
  assert.equal(n.top3AvgReviews, 150);
  assert.equal(n.reviewGap, 132);
  assert.equal(n.rank, 7);
  assert.equal(n.gridShare, 0.32);
  assert.equal(pitchNumbers({ results: {} }).rank, null);
});

test('pitchText: twelve lines at most, money formatted, rank named, three actions', () => {
  const text = pitchText({ results: full, subject }, planFromAudit({ results: full, subject }));
  const lines = text.split('\n');
  assert.ok(lines.length <= 12, `${lines.length} lines`);
  assert.equal(lines[0], 'Subject Auto Spa — "auto detailing" in Ankeny');
  assert.ok(lines.some((l) => /570 searches\/mo/.test(l) && /\$6,180\/mo/.test(l)));
  assert.ok(lines.some((l) => /#7 on Google Maps/.test(l) && /32% of Ankeny/.test(l)));
  assert.ok(lines.some((l) => /18 reviews vs the top 3's 150/.test(l) && /~2\/mo/.test(l)));
  assert.ok(lines.some((l) => /^Top 3: A \(212\), B \(140\), C \(98\)$/.test(l)));
  assert.equal(lines.filter((l) => l.startsWith('• ')).length, 3);
});

test('pitchText on a quick audit leaves out what was not measured', () => {
  const quick: AuditResults = { maps: { ...maps, top: [] }, reputation: full.reputation, website: { none: true } };
  const text = pitchText({ results: quick, subject }, planFromAudit({ results: quick, subject }));
  assert.ok(!/searches\/mo/.test(text));
  assert.ok(!/^Top 3:/m.test(text));
  assert.ok(/No website/.test(text));
  assert.ok(text.split('\n').length <= 12);
});
