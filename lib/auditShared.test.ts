// lib/auditShared.test.ts
// Run with: npx tsx --test lib/auditShared.test.ts   (no database needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditDue,
  auditLeaks,
  auditLocation,
  auditStatus,
  baselineFromAudit,
  competitors,
  defaultKeyword,
  domainOf,
  gridPoints,
  matchSubject,
  normalizeName,
  normalizeWebsite,
  reportFillPatch,
  scanCapFor,
  scansRemaining,
  splitCity,
  summarizeGrid,
  validateAuditSettingsInput,
  validateSubjectInput,
  type AuditResults,
  type MapsItem,
} from './auditShared';

const item = (o: Partial<MapsItem> & { rank: number; name: string }): MapsItem => ({
  domain: null, url: null, rating: null, reviews: null, placeId: null, cid: null, lat: null, lng: null, categories: [], gbpUrl: null, ...o,
});
const subject = { business: "Joe's Auto Spa, LLC", website: 'subjectspa.com', placeId: null, cid: null };

test('normalizeName drops punctuation and business suffixes', () => {
  assert.equal(normalizeName("Joe's Auto Spa, LLC"), 'joes auto spa');
  assert.equal(normalizeName('The Shine Co.'), 'shine');
  assert.equal(normalizeName('A & B Detailing Inc'), 'a and b detailing');
});

test('domainOf and normalizeWebsite accept a bare domain and strip www', () => {
  assert.equal(domainOf('subjectspa.com'), 'subjectspa.com');
  assert.equal(domainOf('https://www.SubjectSpa.com/about'), 'subjectspa.com');
  assert.equal(domainOf(''), null);
  assert.equal(domainOf('not a url at all :'), null);
  assert.equal(normalizeWebsite('subjectspa.com'), 'https://subjectspa.com');
  assert.equal(normalizeWebsite('http://subjectspa.com/x'), 'http://subjectspa.com/x');
  assert.equal(normalizeWebsite(null), null);
});

test('matchSubject prefers place id, then domain, then a tolerant name match', () => {
  const items = [
    item({ rank: 1, name: 'Example Shine Co', domain: 'example-shine.test', placeId: 'p1' }),
    item({ rank: 4, name: 'Joes Auto Spa', domain: 'www.subjectspa.com', placeId: 'p4' }),
    item({ rank: 9, name: 'Other Joes Auto Spa North', placeId: 'p9' }),
  ];
  assert.equal(matchSubject({ ...subject, placeId: 'p9' }, items)?.matchedBy, 'placeId');
  assert.equal(matchSubject(subject, items)?.item.rank, 4);
  assert.equal(matchSubject(subject, items)?.matchedBy, 'domain');
  const byName = matchSubject({ ...subject, website: null }, items);
  assert.equal(byName?.item.rank, 4);
  assert.equal(byName?.matchedBy, 'name');
  assert.equal(matchSubject({ business: 'Nope Detailing', website: null, placeId: null, cid: null }, items), null);
  // Short names must not match by containment ("Spa" is inside everything).
  assert.equal(matchSubject({ business: 'Spa', website: null, placeId: null, cid: null }, items), null);
});

test('competitors keeps the top 3 and appends the subject when it is lower', () => {
  const items = [item({ rank: 1, name: 'A' }), item({ rank: 2, name: 'B' }), item({ rank: 3, name: 'C' }), item({ rank: 7, name: 'Me' })];
  const rows = competitors(items, items[3]);
  assert.deepEqual(rows.map((r) => [r.rank, r.self ?? false]), [[1, false], [2, false], [3, false], [7, true]]);
  const inTop = competitors(items.slice(0, 3), items[1]);
  assert.equal(inTop.length, 3);
  assert.equal(inTop[1].self, true);
});

test('gridPoints is a 5×5 square one mile apart, centred on the pin', () => {
  const pts = gridPoints(41.73, -93.6);
  assert.equal(pts.length, 25);
  assert.deepEqual(pts[12], { lat: 41.73, lng: -93.6 });
  assert.ok(pts[0].lat > pts[24].lat, 'first row is north');
  assert.ok(pts[0].lng < pts[4].lng, 'first column is west');
  assert.ok(Math.abs(pts[7].lat - pts[12].lat - 1 / 69) < 1e-4);
});

test('summarizeGrid counts nulls as not-top-3 and averages only found points', () => {
  const points = [
    { lat: 0, lng: 0, rank: 1 }, { lat: 0, lng: 0, rank: 3 }, { lat: 0, lng: 0, rank: 8 }, { lat: 0, lng: 0, rank: null },
  ];
  const g = summarizeGrid(points, 1, 2);
  assert.equal(g.top3Share, 0.5);
  assert.equal(g.avgRank, 4);
  assert.equal(summarizeGrid([], 1, 0).avgRank, null);
});

test('auditStatus is complete / partial / failed by section errors', () => {
  const ok: AuditResults = { maps: { found: true, rank: 2, matchedBy: 'name', searched: { keyword: 'k', location: 'l' }, top: [] } };
  assert.equal(auditStatus(ok), 'complete');
  assert.equal(auditStatus({ ...ok, website: { error: 'down' } }), 'partial');
  assert.equal(auditStatus({ maps: { error: 'x' }, website: { error: 'y' } }), 'failed');
  assert.equal(auditStatus({}), 'failed');
});

const results: AuditResults = {
  maps: {
    found: true, rank: 7, matchedBy: 'domain', searched: { keyword: 'auto detailing', location: 'Ankeny,Iowa,United States' },
    top: [
      { rank: 1, name: 'A', rating: 4.9, reviews: 212, website: null },
      { rank: 2, name: 'B', rating: 4.8, reviews: 140, website: null },
      { rank: 3, name: 'C', rating: 4.7, reviews: 98, website: null },
      { rank: 7, name: 'Me', rating: 4.6, reviews: 18, website: 'subject-spa.test', self: true },
    ],
  },
  organic: { rank: null, domain: 'subject-spa.test', top: [] },
  reputation: { rating: 4.6, reviews: 18, categories: [], gbpUrl: null, placeId: null },
  grid: { spacingMiles: 1, size: 5, points: [], top3Share: 0.32, avgRank: 6.4 },
  website: { url: 'https://subject-spa.test/', https: true, pagespeedMobile: 41, lcpMs: 4800, clickToCall: false, form: true, title: 'Home', metaDescription: null, schema: [] },
};

test('auditLeaks builds at most five sentences from the numbers, highest severity first', () => {
  const leaks = auditLeaks(results, 'Ankeny');
  assert.equal(leaks.length, 5);
  assert.equal(leaks[0].severity, 'high');
  assert.match(leaks[0].headline, /#7 on Maps/);
  assert.match(leaks[0].detail, /average 150 reviews; you have 18/);
  assert.ok(leaks.some((l) => /tap-to-call/.test(l.headline)));
  assert.ok(leaks.some((l) => /32% of Ankeny/.test(l.headline)));
  const order = ['high', 'medium', 'low'];
  assert.ok(leaks.every((l, i) => i === 0 || order.indexOf(l.severity) >= order.indexOf(leaks[i - 1].severity)));
});

test('auditLeaks: not found, no website, and errored sections', () => {
  const notFound = auditLeaks({ maps: { found: false, rank: null, matchedBy: null, searched: { keyword: 'k', location: 'l' }, top: [] }, website: { none: true } }, 'Ames');
  assert.match(notFound[0].headline, /isn't showing you for "k" in Ames/);
  assert.ok(notFound.some((l) => l.headline === 'No website'));
  assert.deepEqual(auditLeaks({ maps: { error: 'x' }, website: { error: 'y' } }, 'Ames'), []);
});

test('scan caps come from the tier unless overridden', () => {
  assert.equal(scanCapFor('essentials', null), 0);
  assert.equal(scanCapFor('axeoncore', null), 3);
  assert.equal(scanCapFor('axeongrowth', null), 10);
  assert.equal(scanCapFor('axeoncore', 0), 0);
  assert.equal(scansRemaining(3, 3), 0);
  assert.equal(scansRemaining(5, 3), 0);
});

test('auditDue: first run, then every interval', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  assert.equal(auditDue(null, 14, now), true);
  assert.equal(auditDue('2026-10-07T12:00:00Z', 14, now), false);
  assert.equal(auditDue('2026-10-06T11:00:00Z', 14, now), true);
  assert.equal(auditDue('2026-10-19T00:00:00Z', 0, now), true, 'interval floors at one day');
});

test('auditLocation and splitCity', () => {
  assert.equal(auditLocation('Ankeny', 'IA'), 'Ankeny,Iowa,United States');
  assert.equal(auditLocation('Ankeny, IA', 'ia'), 'Ankeny,Iowa,United States');
  assert.throws(() => auditLocation('Ankeny', 'Iowa'), /two-letter/);
  assert.throws(() => auditLocation('', 'IA'), /City/);
  assert.deepEqual(splitCity('Ankeny, IA'), { city: 'Ankeny', state: 'IA' });
  assert.deepEqual(splitCity('Des Moines'), { city: 'Des Moines', state: 'IA' });
});

test('baselineFromAudit ignores client scans and unfound businesses', () => {
  assert.deepEqual(baselineFromAudit({ trigger: 'admin', results }), { rank: 7, keyword: 'auto detailing' });
  assert.equal(baselineFromAudit({ trigger: 'client', results }), null);
  assert.equal(baselineFromAudit({ trigger: 'schedule', results: { maps: { found: false, rank: null, matchedBy: null, searched: { keyword: 'k', location: 'l' }, top: [] } } }), null);
});

test('reportFillPatch fills only blanks', () => {
  assert.deepEqual(reportFillPatch(null, { results }), { rank: 7, keyword: 'auto detailing', reviews: 18, rating: 4.6 });
  assert.deepEqual(reportFillPatch({ rank: 5, keyword: 'typed', reviews: null, rating: null }, { results }), { reviews: 18, rating: 4.6 });
  assert.deepEqual(reportFillPatch({ rank: 5, keyword: 'typed', reviews: 20, rating: 4.9 }, { results }), {});
});

test('defaultKeyword and input validation', () => {
  assert.equal(defaultKeyword('Roofing', 'Des Moines'), 'roofing des moines');
  assert.equal(defaultKeyword('', 'Ames'), 'auto detailing ames');
  const s = validateSubjectInput({ business: ' Joe Spa ', city: 'Ankeny, IA', keyword: 'Auto Detailing', website: 'joespa.com' });
  assert.deepEqual(s, { business: 'Joe Spa', city: 'Ankeny', state: 'IA', website: 'https://joespa.com', keyword: 'auto detailing', placeId: null, cid: null, lat: null, lng: null });
  assert.throws(() => validateSubjectInput({ business: '', city: 'Ankeny', keyword: 'k' }), /business/i);
  assert.throws(() => validateSubjectInput({ business: 'x', city: 'Ankeny', keyword: '' }), /keyword/i);
  const a = validateAuditSettingsInput({ city: 'Ankeny, IA', website: 'old-site.com', grid: false, intervalDays: '7', enabled: true, clientScanCap: '' });
  assert.deepEqual(a, { city: 'Ankeny, IA', website: 'https://old-site.com', grid: false, intervalDays: 7, enabled: true, clientScanCap: null });
  assert.throws(() => validateAuditSettingsInput({ intervalDays: '0' }), /between 1 and 90/);
  assert.throws(() => validateAuditSettingsInput({ clientScanCap: '99' }), /between 0 and 30/);
});
