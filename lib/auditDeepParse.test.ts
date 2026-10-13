// lib/auditDeepParse.test.ts
// Run with: npx tsx --test lib/auditDeepParse.test.ts  (fixtures are trimmed real DataForSEO responses)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { competitorProfiles, marketFromParts, parseAdsVolume, parseDomainOverview, parseKeywordIdeas, parseMapsProfile, parseReviews, profileFromItem, reviewsFromItems, topWords } from './auditDeepParse';
import { parseMapsItems } from './auditParse';
import type { MapsItem } from './auditShared';

const here = path.dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => JSON.parse(readFileSync(path.join(here, '__fixtures__', 'dataforseo', n), 'utf8')) as { tasks: Array<{ result: unknown[] }> };
const NOW = Date.parse('2026-10-13T12:00:00Z');

test('parseKeywordIdeas: keyword, national volume, cpc (null when absent)', () => {
  const ideas = parseKeywordIdeas(fx('keyword_ideas.json').tasks[0].result[0]);
  assert.equal(ideas.length, 6);
  assert.deepEqual(ideas[0], { keyword: 'junk removal services', volume: 49500, cpc: 14.65 });
  assert.equal(ideas.find((i) => i.keyword.startsWith('arc raiders'))?.cpc, null);
  assert.deepEqual(parseKeywordIdeas(null), []);
});

test('parseAdsVolume: city-level volume, cpc and competition', () => {
  const rows = parseAdsVolume(fx('ads_volume.json').tasks[0].result);
  assert.deepEqual(rows[0], { keyword: 'junk removal des moines', volume: 170, cpc: 11.56, competition: 'HIGH' });
  const hotTub = rows.find((r) => r.keyword === 'hot tub removal');
  assert.equal(hotTub?.cpc, null);
  assert.equal(hotTub?.competition, null);
  assert.deepEqual(parseAdsVolume(null), []);
});

test('parseDomainOverview: organic keyword count, estimated traffic and paid value', () => {
  const o = parseDomainOverview(fx('domain_rank_overview.json').tasks[0].result[0]);
  assert.equal(o?.organicKeywords, 16954);
  assert.equal(Math.round(o?.estTraffic ?? 0), 38912);
  assert.equal(Math.round(o?.estPaidValue ?? 0), 534014);
  assert.equal(parseDomainOverview({ items: [] }), null);
});

test('parseMapsProfile + parseMapsItems carry the free profile fields', () => {
  const raw = (fx('maps_profile.json').tasks[0].result[0] as { items: Array<Record<string, unknown>> }).items;
  const p = parseMapsProfile(raw[0]);
  assert.equal(p.photos, 82);
  assert.equal(p.claimed, true);
  assert.equal(p.booking, true);
  assert.ok(p.phone);
  assert.equal(p.openDays, 7);
  assert.deepEqual(p.stars, { 1: 7, 2: 2, 3: 3, 4: 24, 5: 491 });
  assert.equal(parseMapsProfile(raw[3]).openDays, 6);
  assert.deepEqual(parseMapsProfile({}), { photos: null, claimed: null, booking: false, phone: null, openDays: null, stars: null });
  const items = parseMapsItems(fx('maps_profile.json').tasks[0].result[0]);
  assert.equal(items[0].photos, 82);
  assert.equal(items[3].name, 'Richie Bros Junk Removal');
});

test('parseReviews + reviewsFromItems: velocity, response rate, low-star share, words', () => {
  const r = parseReviews(fx('reviews.json').tasks[0].result[0]);
  assert.equal(r.total, 18);
  assert.equal(r.items.length, 6);
  assert.equal(r.items[0].answered, true);
  assert.equal(r.items[0].stars, 5);
  assert.match(r.items[0].at ?? '', /^2026-10-08T/);
  const s = reviewsFromItems(r.items, NOW);
  assert.equal(s.sampled, 6);
  assert.equal(s.perMonth90d, 1.3);
  assert.equal(s.responseRate, 0.33);
  assert.equal(s.lowStarShare, 0.17);
  assert.equal(s.words[0].word, 'detail');
  assert.equal(s.words[0].count, 4);
  assert.match(s.newestAt ?? '', /^2026-10-08/);
  // Review Focus 3: too little to say
  assert.equal(reviewsFromItems([], NOW).perMonth90d, null);
  assert.equal(reviewsFromItems(r.items.slice(0, 1), NOW).perMonth90d, null);
  assert.equal(reviewsFromItems(r.items.map((i) => ({ ...i, at: null })), NOW).perMonth90d, null);
});

test('topWords drops stop words, short words and numbers', () => {
  assert.deepEqual(topWords(['Great detail work', 'The detail was great and fast, 100 percent'], 3), [
    { word: 'detail', count: 2 },
    { word: 'great', count: 2 },
    { word: 'fast', count: 1 },
  ]);
});

test('marketFromParts: measured keywords only, null volumes never count (Review Focus 1)', () => {
  const m = marketFromParts({
    city: 'Ankeny',
    local: [
      { keyword: 'auto detailing ankeny', volume: 480, cpc: 11, competition: 'HIGH' },
      { keyword: 'ceramic coating', volume: null, cpc: 5, competition: null },
      { keyword: 'car detailing', volume: 90, cpc: 8, competition: 'LOW' },
      { keyword: 'unmeasured term', volume: 1000, cpc: 1, competition: 'LOW' },
    ],
    ranks: new Map([
      ['auto detailing ankeny', { mapsRank: 7, organicRank: null }],
      ['ceramic coating', { mapsRank: null, organicRank: null }],
      ['car detailing', { mapsRank: 2, organicRank: 5 }],
    ]),
    now: NOW,
  });
  assert.equal(m.missedSearches, 480);
  assert.equal(m.missedAdValue, 5280);
  assert.equal(m.keywords.find((k) => k.keyword === 'unmeasured term')?.measured, false);
  assert.equal(m.keywords.find((k) => k.keyword === 'car detailing')?.organicRank, 5);
  assert.equal(m.keywords[0].keyword, 'unmeasured term', 'sorted by volume desc');
});

test('competitorProfiles: top 3 + self, domain strength when known, a domain-less competitor keeps its profile (Review Focus 2)', () => {
  const items = parseMapsItems(fx('maps_profile.json').tasks[0].result[0]);
  const noDomain: MapsItem = { ...items[1], domain: null };
  const top = [items[0], noDomain, items[2], items[3]];
  const c = competitorProfiles(top, items[3], new Map([['junk-king.com', { organicKeywords: 16954, estTraffic: 38912, estPaidValue: 534014 }]]));
  assert.equal(c.items.length, 4);
  assert.equal(c.items[0].organicKeywords, 16954);
  assert.equal(c.items[1].domain, null);
  assert.equal(c.items[1].photos, 110);
  assert.equal(c.items[1].organicKeywords, null);
  assert.equal(c.items[3].self, true);
  assert.equal(c.items[3].reviews, 318);
});

test('profileFromItem', () => {
  const items = parseMapsItems(fx('maps_profile.json').tasks[0].result[0]);
  const p = profileFromItem(items[3]);
  assert.equal(p.photos, 533);
  assert.equal(p.booking, true);
  assert.equal(p.phone, true);
  assert.equal(p.website, true);
  assert.equal(p.openDays, 6);
  assert.equal(p.claimed, true);
  assert.ok(p.categories.length >= 1);
});
