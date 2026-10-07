// lib/siteStats.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateCustomers,
  generateSiteKey,
  isValidSiteKey,
  looksLikeBot,
  monthOf,
  normalizeClickName,
  parseTrackingEvent,
  previousMonth,
  referrerHost,
  summarize,
  trackingSnippet,
  validateCloseRate,
  validateSiteUrl,
  visitorHash,
} from './siteStats';
import { autoReportEligibility, reportHasContent } from './autoReports';
import { emptyReportBody, normalizeReportBody, reportStats, type MonthlyReport } from './projects';
import { buttonLabel, sourceLabel } from './projectsShared';

const KEY = 'ax_abcdefghjkmnpq';

test('site keys are ax_ plus 14 safe characters', () => {
  const key = generateSiteKey();
  assert.ok(isValidSiteKey(key), key);
  assert.equal(isValidSiteKey('ax_ABCDEFGHJKMNPQ'), false);
  assert.equal(isValidSiteKey('ax_abc'), false);
  assert.match(trackingSnippet(KEY), /<script defer src="https:\/\/axeonstudio\.co\/t\.js" data-site="ax_abcdefghjkmnpq"><\/script>/);
});

test('events: views need a key, clicks need a name, paths lose their query', () => {
  assert.equal(parseTrackingEvent(null), null);
  assert.equal(parseTrackingEvent({ k: 'nope', e: 'view' }), null);
  assert.equal(parseTrackingEvent({ k: KEY, e: 'click' }), null);
  assert.equal(parseTrackingEvent({ k: KEY, e: 'purchase' }), null);
  assert.deepEqual(parseTrackingEvent({ k: KEY, e: 'view', p: '/services?utm=x#top', r: 'https://www.google.com/search?q=roofer', h: 'smithroofing.com' }), {
    siteKey: KEY,
    kind: 'view',
    name: null,
    path: '/services',
    referrer: 'google.com',
  });
  const click = parseTrackingEvent({ k: KEY, e: 'click', n: '  Call  NOW! ', p: 'junk' });
  assert.equal(click?.name, 'call now');
  assert.equal(click?.path, '/');
});

test('referrers: same-site and junk become direct', () => {
  assert.equal(referrerHost('https://smithroofing.com/about', 'www.smithroofing.com'), '');
  assert.equal(referrerHost('not a url at all', 'x.com'), '');
  assert.equal(referrerHost('m.facebook.com'), 'm.facebook.com');
  assert.equal(referrerHost(undefined), '');
});

test('click names are lower-case, short and plain', () => {
  assert.equal(normalizeClickName('<b>Get a Free Quote</b>'), 'b get a free quote /b');
  assert.equal(normalizeClickName('x'.repeat(100))?.length, 60);
  assert.equal(normalizeClickName(''), null);
  assert.equal(normalizeClickName(42), null);
});

test('bots and empty user agents are dropped', () => {
  assert.equal(looksLikeBot(null), true);
  assert.equal(looksLikeBot('Googlebot/2.1 (+http://www.google.com/bot.html)'), true);
  assert.equal(looksLikeBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'), false);
});

test('months follow the Central clock and step back correctly', () => {
  // 03:00 UTC on Oct 1 is still Sept 30 in Iowa.
  assert.equal(monthOf(Date.parse('2026-10-01T03:00:00Z')), '2026-09');
  assert.equal(monthOf(Date.parse('2026-10-01T14:00:00Z')), '2026-10');
  assert.equal(previousMonth('2026-01'), '2025-12');
  assert.equal(previousMonth('2026-10'), '2026-09');
});

test('visitor hashes change with the month and never contain the IP', () => {
  const a = visitorHash('1.2.3.4', 'UA', '2026-09', 'secret');
  const b = visitorHash('1.2.3.4', 'UA', '2026-10', 'secret');
  assert.notEqual(a, b);
  assert.equal(a, visitorHash('1.2.3.4', 'UA', '2026-09', 'secret'));
  assert.equal(a.length, 24);
  assert.ok(!a.includes('1.2.3.4'));
});

test('estimated customers round down and respect the close rate', () => {
  assert.equal(estimateCustomers(10, 25), 2);
  assert.equal(estimateCustomers(3, 25), 0);
  assert.equal(estimateCustomers(0, 50), 0);
  assert.equal(estimateCustomers(8, 0), 0);
  assert.equal(validateCloseRate(''), 25);
  assert.equal(validateCloseRate('40'), 40);
  assert.throws(() => validateCloseRate('150'), /between 0 and 100/);
  assert.equal(validateSiteUrl('https://a1detail.com/'), 'https://a1detail.com');
  assert.equal(validateSiteUrl(''), null);
  assert.throws(() => validateSiteUrl('a1detail'), /https:\/\//);
});

test('the summary counts only calls, texts, emails, forms and bookings as reaching out', () => {
  const t = summarize({
    views: 320,
    visitors: 210,
    clicks: 40,
    buttons: [
      { name: 'call', count: 12 },
      { name: 'directions', count: 10 },
      { name: 'form', count: 6 },
      { name: 'get a free quote', count: 8 },
      { name: 'book', count: 2 },
      { name: 'text', count: 1 },
      { name: 'email', count: 1 },
    ],
    pages: [],
    sources: [],
    closeRate: 25,
  });
  assert.equal(t.conversions, 22);
  assert.equal(t.estimatedCustomers, 5);
  assert.equal(buttonLabel('call'), 'Call button');
  assert.equal(buttonLabel('get a free quote'), 'Get a free quote');
  assert.equal(sourceLabel(''), 'Direct / typed in');
  assert.equal(sourceLabel('www.google.com'), 'Google');
  assert.equal(sourceLabel('l.facebook.com'), 'Facebook');
  assert.equal(sourceLabel('nextdoor.com'), 'Nextdoor');
  assert.equal(sourceLabel('somelocalblog.com'), 'somelocalblog.com');
});

test('report stats lead with the website numbers when they exist', () => {
  const traffic = summarize({
    views: 100,
    visitors: 80,
    clicks: 9,
    buttons: [{ name: 'call', count: 9 }],
    pages: [],
    sources: [],
    closeRate: 30,
  });
  const details = { kickoffAt: null, targetLaunchAt: null, baselineCalls: null, baselineLeads: null, baselineKeyword: null, baselineRank: null };
  const withWeb = reportStats({ ...emptyReportBody(), calls: 4, traffic }, { ...emptyReportBody(), traffic: { ...traffic, views: 60, conversions: 5 } }, details);
  assert.deepEqual(
    withWeb.map((s) => s.label),
    ['Website visits', 'Button clicks', 'Customers reached out', 'Estimated new customers', 'Phone calls']
  );
  assert.equal(withWeb[0].value, '100');
  assert.match(withWeb[0].sub ?? '', /80 visitors · \+40 vs last month/);
  assert.equal(withWeb[3].value, '~2');
  assert.match(withWeb[2].sub ?? '', /\+4 vs last month/);
  // Without tracking, the four typed-in boxes show as before.
  const plain = reportStats(emptyReportBody(), null, details);
  assert.equal(plain.length, 4);
  assert.equal(plain[0].value, '—');
});

test('old report rows without the new keys still read as complete bodies', () => {
  const r = normalizeReportBody({ calls: 3 } as never);
  assert.deepEqual(r.done, []);
  assert.equal(r.traffic, null);
  assert.equal(r.auto, false);
  assert.equal(r.calls, 3);
});

test('eligibility: closed, opted out, already emailed or too new are skipped', () => {
  const o = { status: 'active' as const, clientEmail: 'a@b.com', createdAt: '2026-08-10T00:00:00Z' };
  const on = { autoReports: true };
  assert.deepEqual(autoReportEligibility(o, on, '2026-09', null), { ok: true });
  assert.equal(autoReportEligibility({ ...o, status: 'closed' }, on, '2026-09', null).ok, false);
  assert.equal(autoReportEligibility(o, { autoReports: false }, '2026-09', null).ok, false);
  assert.equal(autoReportEligibility(o, on, '2026-09', { emailedAt: '2026-10-01T14:00:00Z' }).ok, false);
  assert.equal(autoReportEligibility(o, on, '2026-09', { emailedAt: null }).ok, true);
  // Signed up in October: nothing to say about September. Signed up mid-September: still gets a report.
  assert.equal(autoReportEligibility({ ...o, createdAt: '2026-10-02T00:00:00Z' }, on, '2026-09', null).ok, false);
  assert.equal(autoReportEligibility({ ...o, createdAt: '2026-09-20T00:00:00Z' }, on, '2026-09', null).ok, true);
});

test('a report counts as typed in when any box is filled', () => {
  const base: MonthlyReport = { ...emptyReportBody(), id: 1, month: '2026-09', emailedAt: null, createdAt: '2026-10-01T00:00:00Z' };
  assert.equal(reportHasContent(null), false);
  assert.equal(reportHasContent(base), false);
  assert.equal(reportHasContent({ ...base, done: [{ title: 'New page', body: 'Roof repair' }] }), true);
  assert.equal(reportHasContent({ ...base, calls: 0 }), true);
});
