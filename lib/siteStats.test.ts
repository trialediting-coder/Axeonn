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
    device: null,
    utm: null,
    seconds: null,
    scroll: null,
    speedMs: null,
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

test('estimated customers round to the nearest whole customer and respect the close rate', () => {
  assert.equal(estimateCustomers(10, 25), 3);
  assert.equal(estimateCustomers(3, 25), 1);
  assert.equal(estimateCustomers(1, 25), 0);
  assert.equal(estimateCustomers(0, 50), 0);
  assert.equal(estimateCustomers(8, 0), 0);
  assert.equal(validateCloseRate(''), 25);
  assert.equal(validateCloseRate('40'), 40);
  assert.throws(() => validateCloseRate('150'), /between 0 and 100/);
  assert.equal(validateSiteUrl('https://a1detail.com/'), 'https://a1detail.com');
  assert.equal(validateSiteUrl(''), null);
  assert.throws(() => validateSiteUrl('a1detail'), /https:\/\//);
});

test('the summary counts calls, texts, emails, forms, bookings, directions and listing taps as reaching out', () => {
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
  assert.equal(t.directContacts, 32); // 12 calls + 10 directions + 6 forms + 2 book + 1 text + 1 email
  assert.equal(t.assistedContacts, 0); // no detail, so nothing credited off-site
  assert.equal(t.conversions, 32);
  assert.equal(t.estimatedCustomers, 8);
  assert.equal(t.closeRateEstimate, null);
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
    ['Customers reached out', 'Estimated new customers', 'Website visits', 'Button clicks', 'Phone calls']
  );
  assert.equal(withWeb[2].value, '100');
  assert.match(withWeb[2].sub ?? '', /80 visitors · \+40 vs last month/);
  assert.equal(withWeb[1].value, '~3'); // 9 × 30% = 2.7
  assert.match(withWeb[0].sub ?? '', /\+4 vs last month/);
  const withValue = reportStats({ ...emptyReportBody(), traffic }, null, details, { avgJobValue: 300 });
  assert.match(withValue[1].sub ?? '', /about \$900 in work/);
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

// ───────────────────────────── Detail (2026-10-08) ─────────────────────────────
import { deviceFromWidth, parseUtm, placeFromHeaders, summarizeSessions, type SessionRow } from './siteStats';
import { campaignLabel, hourLabel } from './projectsShared';

test('devices come from the viewport width', () => {
  assert.equal(deviceFromWidth(390), 'phone');
  assert.equal(deviceFromWidth(820), 'tablet');
  assert.equal(deviceFromWidth(1440), 'desktop');
  assert.equal(deviceFromWidth(undefined), null);
  assert.equal(deviceFromWidth('junk'), null);
});

test('campaign tags are read from the query string, and ad click ids count as paid', () => {
  assert.deepEqual(parseUtm('?utm_source=Google&utm_medium=cpc&utm_campaign=Spring%20Detail'), {
    source: 'google',
    medium: 'cpc',
    campaign: 'spring detail',
  });
  assert.deepEqual(parseUtm('?gclid=abc123'), { source: 'google', medium: 'cpc', campaign: '' });
  assert.deepEqual(parseUtm('?fbclid=xyz'), { source: 'facebook', medium: 'cpc', campaign: '' });
  assert.equal(parseUtm('?page=2'), null);
  assert.equal(parseUtm(''), null);
  assert.equal(campaignLabel({ source: 'google', medium: 'cpc', campaign: 'spring detail' }), 'Google Ads: spring detail');
  assert.equal(campaignLabel({ source: 'facebook', medium: 'paid_social', campaign: '' }), 'Facebook Ads');
  assert.equal(campaignLabel({ source: 'nextdoor', medium: 'post', campaign: 'fall' }), 'Nextdoor post: fall');
  assert.equal(campaignLabel({ source: 'newsletter', medium: 'email', campaign: '' }), 'Newsletter email');
});

test('place is city and region from the edge headers, never the IP', () => {
  const h = (m: Record<string, string>) => ({ get: (k: string) => m[k] ?? null });
  assert.equal(placeFromHeaders(h({ 'x-vercel-ip-city': 'Des%20Moines', 'x-vercel-ip-country-region': 'IA', 'x-vercel-ip-country': 'US' })), 'Des Moines, IA');
  assert.equal(placeFromHeaders(h({ 'x-vercel-ip-city': 'Toronto', 'x-vercel-ip-country-region': 'ON', 'x-vercel-ip-country': 'CA' })), 'Toronto, CA');
  assert.equal(placeFromHeaders(h({ 'x-vercel-ip-country': 'US' })), null);
  assert.equal(hourLabel(0), '12am');
  assert.equal(hourLabel(9), '9am');
  assert.equal(hourLabel(12), '12pm');
  assert.equal(hourLabel(17), '5pm');
});

test('sessions roll up into bounce rate, devices, landing pages, campaigns, places and hours', () => {
  const row = (over: Partial<SessionRow>): SessionRow => ({
    visitor: 'v1',
    started_at: '2026-09-10T15:00:00Z',
    landing: '/',
    views: 1,
    converted: false,
    converted_on: null,
    converted_at: null,
    clicks: 0,
    seconds: null,
    scroll: null,
    device: 'phone',
    city: 'Des Moines, IA',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    speed_ms: null,
    ...over,
  });
  const rows: SessionRow[] = [
    // Bounce: one page, no click.
    row({ visitor: 'a', seconds: 4, scroll: 10, speed_ms: 900 }),
    // Converted from Google Ads on the ceramic page at 2pm Central (19:00Z in September, CDT).
    row({
      visitor: 'b',
      landing: '/ceramic-coating',
      views: 3,
      clicks: 1,
      converted: true,
      converted_on: '/ceramic-coating',
      converted_at: '2026-09-12T19:30:00Z',
      seconds: 95,
      scroll: 80,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'ceramic',
      device: 'desktop',
      speed_ms: 1500,
    }),
    // Same visitor as 'b' came back later (returning), looked at two pages, no click.
    row({ visitor: 'b', landing: '/', views: 2, seconds: 30, scroll: 50, device: 'desktop', city: 'Ankeny, IA', speed_ms: 1100 }),
    // Converted on the home page via a call at 9am Central on a Saturday (14:00Z Sat Sep 19).
    row({ visitor: 'c', views: 1, clicks: 1, converted: true, converted_on: '/', converted_at: '2026-09-19T14:05:00Z', seconds: 20 }),
  ];
  const d = summarizeSessions(rows, 'America/Chicago');
  assert.equal(d.sessions, 4);
  assert.equal(d.returningVisitors, 1);
  assert.equal(d.bounceRate, 25); // only 'a'; 'c' had one view but clicked
  assert.equal(d.avgSeconds, Math.round((4 + 95 + 30 + 20) / 4));
  assert.equal(d.avgScroll, Math.round((10 + 80 + 50) / 3));
  assert.equal(d.pagesPerSession, 1.8);
  assert.deepEqual(d.devices, { phone: 2, tablet: 0, desktop: 5 });
  assert.deepEqual(d.landing[0], { path: '/', sessions: 3, conversions: 1 });
  assert.deepEqual(d.landing[1], { path: '/ceramic-coating', sessions: 1, conversions: 1 });
  assert.deepEqual(d.convertingPages, [
    { path: '/ceramic-coating', count: 1 },
    { path: '/', count: 1 },
  ]);
  assert.deepEqual(d.campaigns, [{ source: 'google', medium: 'cpc', campaign: 'ceramic', sessions: 1, conversions: 1 }]);
  assert.deepEqual(d.places[0], { city: 'Des Moines, IA', sessions: 3, conversions: 2 });
  assert.equal(d.conversionHours[14], 1); // 19:30Z = 2:30pm CDT
  assert.equal(d.conversionHours[9], 1); // 14:05Z = 9:05am CDT
  assert.equal(d.conversionDays[6], 2); // Sep 12 and Sep 19, 2026 are both Saturdays
  assert.equal(d.conversionDays.reduce((a, b) => a + b, 0), 2);
  assert.equal(d.speedMs, 1100); // median of 900, 1100, 1500
  const empty = summarizeSessions([]);
  assert.equal(empty.sessions, 0);
  assert.equal(empty.bounceRate, 0);
  assert.equal(empty.speedMs, null);
});

test('leave events carry engagement and are capped', () => {
  const ev = parseTrackingEvent({ k: KEY, e: 'leave', p: '/services', t: '95.4', s: '140', ms: '1800' });
  assert.equal(ev?.kind, 'leave');
  assert.equal(ev?.seconds, 95);
  assert.equal(ev?.scroll, 100);
  assert.equal(ev?.speedMs, 1800);
  assert.equal(ev?.utm, null);
  const view = parseTrackingEvent({ k: KEY, e: 'view', p: '/', w: 390, u: '?utm_source=yelp&utm_medium=referral' });
  assert.equal(view?.device, 'phone');
  assert.deepEqual(view?.utm, { source: 'yelp', medium: 'referral', campaign: '' });
  assert.equal(view?.seconds, null);
});


// ───────────────────────────── Close rate estimate ─────────────────────────────
import { DEFAULT_CLOSE_RATE_ESTIMATE, effectiveCloseRate, estimateCloseRate } from './siteStats';
import type { TrafficDetail } from './projectsShared';

const detailWith = (over: Partial<TrafficDetail>): TrafficDetail => ({
  sessions: 100,
  returningVisitors: 5,
  bounceRate: 40,
  avgSeconds: 30,
  avgScroll: 40,
  pagesPerSession: 1.4,
  devices: { phone: 40, tablet: 5, desktop: 55 },
  landing: [],
  convertingPages: [{ path: '/', count: 10 }],
  campaigns: [],
  places: [],
  conversionHours: new Array(24).fill(0),
  conversionDays: new Array(7).fill(0),
  speedMs: null,
  ...over,
});

test('with nobody reaching out, the estimate is the typical local-service figure', () => {
  assert.deepEqual(estimateCloseRate({ buttons: [{ name: 'review', count: 9 }] }), DEFAULT_CLOSE_RATE_ESTIMATE);
});

test('the base rate is the optimistic benchmark weighted by how people reached out', () => {
  // 10 calls (55) and 10 forms (40): base 47.5, nothing in the detail to add.
  const e = estimateCloseRate({ buttons: [{ name: 'call', count: 10 }, { name: 'form', count: 10 }], detail: detailWith({}) });
  assert.equal(e.rate, 48);
  assert.equal(e.low, 28); // (35 + 20) / 2 = 27.5
  assert.equal(e.high, 53);
  assert.equal(e.sample, 20);
  assert.equal(e.factors.length, 1);
  // All online bookings: the ceiling.
  assert.equal(estimateCloseRate({ buttons: [{ name: 'book', count: 8 }], detail: detailWith({}) }).rate, 85);
});

test('good signals only ever add, each with a reason the client can read', () => {
  const hours = new Array(24).fill(0);
  hours[10] = 6;
  hours[14] = 3;
  hours[20] = 1;
  const e = estimateCloseRate({
    buttons: [{ name: 'call', count: 10 }],
    detail: detailWith({
      avgSeconds: 75, // read first: +5
      returningVisitors: 20, // came back: +3
      convertingPages: [
        { path: '/ceramic-coating', count: 7 },
        { path: '/', count: 3 },
      ], // service pages: +4
      conversionHours: hours, // business hours: +4
      devices: { phone: 70, tablet: 5, desktop: 25 }, // phones: +2
    }),
  });
  assert.equal(e.rate, 55 + 5 + 3 + 4 + 4 + 2);
  assert.equal(e.low, 35 + 18);
  assert.equal(e.high, 78);
  assert.equal(e.factors.filter((f) => f.effect > 0).length, 5);
  // A weak month never goes below the base.
  const weak = estimateCloseRate({ buttons: [{ name: 'call', count: 10 }], detail: detailWith({ avgSeconds: 5, bounceRate: 90 }) });
  assert.equal(weak.rate, 55);
});

test('small samples widen the range instead of lowering the number', () => {
  const e = estimateCloseRate({ buttons: [{ name: 'call', count: 2 }], detail: detailWith({}) });
  assert.equal(e.rate, 55);
  assert.equal(e.low, 35);
  assert.equal(e.high, 65);
  assert.ok(e.factors.some((f) => /2 people reached out/.test(f.label)));
  assert.ok(e.rate <= 90 && e.low >= 10);
});

test('summarize estimates when no manual rate is set, and carries the range', () => {
  const t = summarize({
    views: 100,
    visitors: 80,
    clicks: 12,
    buttons: [{ name: 'call', count: 10 }, { name: 'book', count: 2 }],
    pages: [],
    sources: [],
    closeRate: null,
    detail: detailWith({}),
  });
  assert.equal(t.closeRate, 60); // (55*10 + 85*2) / 12 = 60
  assert.equal(t.estimatedCustomers, 7); // round(12 * 0.6)
  assert.equal(t.customersLow, Math.floor((12 * t.closeRateEstimate!.low) / 100));
  assert.equal(t.customersHigh, Math.ceil((12 * t.closeRateEstimate!.high) / 100));
  assert.equal(effectiveCloseRate({ closeRateMode: 'auto', closeRate: 25 }), null);
  assert.equal(effectiveCloseRate({ closeRateMode: 'manual', closeRate: 40 }), 40);
});


// ───────────────────────────── Generous crediting ─────────────────────────────
import { ASSISTED_RATE, assistedContacts } from './siteStats';

test('engaged computer visits with no click are counted, from time, pages or an intent page', () => {
  const base = (over: Partial<SessionRow>): SessionRow => ({
    visitor: 'x',
    started_at: '2026-09-10T15:00:00Z',
    landing: '/',
    views: 1,
    converted: false,
    converted_on: null,
    converted_at: null,
    clicks: 0,
    seconds: null,
    scroll: null,
    device: 'desktop',
    city: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    speed_ms: null,
    intent: false,
    ...over,
  });
  const d = summarizeSessions([
    base({ visitor: 'a', seconds: 45 }), // read for 45s: counts
    base({ visitor: 'b', views: 3 }), // three pages: counts
    base({ visitor: 'c', intent: true }), // opened the pricing page: counts
    base({ visitor: 'd', seconds: 5 }), // bounced: no
    base({ visitor: 'e', device: 'phone', seconds: 120 }), // phone: they could have tapped, so no
    base({ visitor: 'f', seconds: 90, clicks: 1, converted: true, converted_on: '/' }), // already counted as a click
    base({ visitor: 'g', device: 'tablet', views: 2 }), // tablet counts like a computer
  ]);
  assert.equal(d.engagedNoClick, 4);
});

test('off-site credit is a quarter of those visits, capped at the real clicks plus two', () => {
  assert.equal(ASSISTED_RATE, 0.25);
  assert.equal(assistedContacts(0, 10), 0);
  assert.equal(assistedContacts(40, 10), 10); // 40 × 0.25
  assert.equal(assistedContacts(40, 3), 5); // capped at 3 + 2
  assert.equal(assistedContacts(100, 0), 2); // with no clicks at all, at most two
  assert.equal(assistedContacts(2, 10), 1); // rounds to nearest
});

test('summarize adds the off-site credit to who reached out and says so', () => {
  const t = summarize({
    views: 400,
    visitors: 300,
    clicks: 20,
    buttons: [{ name: 'call', count: 10 }, { name: 'directions', count: 2 }],
    pages: [],
    sources: [],
    closeRate: null,
    detail: detailWith({ engagedNoClick: 24, devices: { phone: 100, tablet: 20, desktop: 280 } }),
  });
  assert.equal(t.directContacts, 12);
  assert.equal(t.assistedContacts, 6); // 24 × 0.25, under the cap of 14
  assert.equal(t.conversions, 18);
  assert.equal(t.closeRate, 56); // (55×10 + 60×2) / 12 = 55.8
  assert.equal(t.estimatedCustomers, 10); // round(18 × 0.56)
});


// ───────────────────────────── Report copy ─────────────────────────────
import { alwaysOnSentence, estimatedValue, headlineSentence, reportHighlights, money } from './reportCopy';

test('the headline leads with people, then customers, then money, then the change', () => {
  const t = summarize({
    views: 2120, visitors: 912, clicks: 62,
    buttons: [{ name: 'call', count: 23 }, { name: 'form', count: 7 }],
    pages: [], sources: [], closeRate: 50, detail: detailWith({ engagedNoClick: 0 }),
  });
  const prev = { ...t, conversions: 20 };
  const s = headlineSentence({ business: 'A-1 Auto Detailing', monthLabel: 'September', prevMonthLabel: 'August', traffic: t, prev, avgJobValue: 300 });
  assert.equal(s, '30 people reached out to A-1 Auto Detailing through your website in September, and about 15 of them likely became new customers, worth around $4,500 in work. That is up 10 from August.');
  const quiet = headlineSentence({ business: 'A-1', monthLabel: 'September', traffic: { ...t, conversions: 0, estimatedCustomers: 0 } });
  assert.match(quiet, /Nobody has reached out through it yet/);
  assert.equal(money(11700), '$11,700');
  assert.deepEqual(estimatedValue({ ...t, estimatedCustomers: 10, customersLow: 8, customersHigh: 12 }, 300), { low: 2400, mid: 3000, high: 3600 });
  assert.equal(estimatedValue(t, null), null);
});

test('wins are at most three true things, best first', () => {
  const t = summarize({
    views: 2120, visitors: 912, clicks: 62,
    buttons: [{ name: 'call', count: 23 }],
    pages: [], sources: [{ host: 'google.com', count: 1140 }], closeRate: null,
    detail: detailWith({
      landing: [{ path: '/', sessions: 500, conversions: 19 }, { path: '/ceramic-coating', sessions: 214, conversions: 14 }],
      campaigns: [{ source: 'google', medium: 'cpc', campaign: 'ceramic', sessions: 140, conversions: 11 }],
      returningVisitors: 96,
      speedMs: 1400,
    }),
  });
  const wins = reportHighlights({ traffic: t, prev: { ...t, views: 1680 }, report: { rank: 1, keyword: 'auto detailing des moines', reviews: 4, rating: 4.9 }, prevReport: { rank: 2 } });
  assert.deepEqual(wins, [
    'You are #1 on Google for “auto detailing des moines”, up from #2.',
    'Website visits are up 26% (2120 this month, 1680 last month).',
    'Your ceramic coating page alone brought 14 people to reach out.',
  ]);
  const few = reportHighlights({ traffic: { ...t, sources: [], detail: null }, report: { rank: null, keyword: '', reviews: null, rating: null } });
  assert.deepEqual(few, []);
});

test('the always-on sentence names real included work in plain words', () => {
  const s = alwaysOnSentence('axeoncore');
  assert.match(s, /^Running every day in the background: hosting, security and backups, /);
  assert.match(s, /review requests after every job/);
  assert.doesNotMatch(s, /CRM|speed-to-lead|funnel|conversion/i);
  assert.match(alwaysOnSentence('axeongrowth'), /Google and Meta ads managed daily/);
});

// ---- sample report (lib/sampleReport.ts) --------------------------------------

test('the sample report renders the real template with the logo images and brand bands', async () => {
  const { sampleMonthlyReportInput } = await import('./sampleReport');
  const { renderMonthlyReportEmail } = await import('./email');
  const input = sampleMonthlyReportInput('owner@example.com');
  assert.equal(input.to, 'owner@example.com');
  assert.ok(input.traffic && input.traffic.conversions > 0, 'the sample month has people reaching out');
  const { subject, html } = renderMonthlyReportEmail(input);
  assert.match(subject, /A-1 Auto Detailing/);
  assert.match(html, /axeonstudio\.co\/email\/axeon-proof-white\.png/, 'header lockup');
  assert.match(html, /axeonstudio\.co\/email\/axeon-white\.png/, 'footer lockup');
  assert.match(html, /bgcolor="#2563eb"/, 'solid Axeon-blue band');
  assert.doesNotMatch(html, /conversion/i, 'client copy never says "conversion"');
});

// ---- Axeon's own site (lib/selfTracking.ts) ------------------------------------

test("Axeon's own site key is a valid tracker key and the tracker honours data-host", async () => {
  const { readFileSync } = await import('node:fs');
  const { SELF_SITE_KEY, SELF_SITE_HOST } = await import('./selfTracking');
  assert.ok(isValidSiteKey(SELF_SITE_KEY), 'SELF_SITE_KEY matches the key format the collector accepts');
  assert.equal(SELF_SITE_HOST, 'axeonstudio.co');
  const tjs = readFileSync(new URL('../public/t.js', import.meta.url), 'utf8');
  assert.match(tjs, /getAttribute\('data-host'\)/, 'tracker reads data-host');
  assert.match(tjs, /window\.axeonTrack = function/, 'tracker exposes axeonTrack');
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /src="\/t\.js" data-site=\{SELF_SITE_KEY\} data-host=\{SELF_SITE_HOST\}/, 'the site loads its own tracker');
});

// ---- lead outcomes and the client's own close rate ------------------------------

test('marked leads are counted as facts and the rate applies only to the rest', () => {
  const base = { views: 400, visitors: 180, clicks: 12, buttons: [{ name: 'call', count: 10 }], pages: [], sources: [] };
  const plain = summarize({ ...base, closeRate: null });
  const marked = summarize({ ...base, closeRate: null, marked: { won: 3, lost: 2 } });
  assert.equal(marked.conversions, plain.conversions, 'marking never changes who reached out');
  assert.equal(marked.closeRate, plain.closeRate, 'with no observed rate the estimate still sets the rate');
  assert.equal(marked.markedWon, 3);
  assert.equal(marked.markedLost, 2);
  const unmarked = plain.conversions - 5;
  assert.equal(marked.estimatedCustomers, 3 + Math.round((unmarked * plain.closeRate) / 100));
  assert.ok(marked.customersLow! >= 3, 'the low end can never drop below the confirmed customers');
  assert.equal(marked.observedCloseRate, null);
});

test("the client's own close rate is blended in from 10 marks, sets the rate at 20, and never beats a typed-in rate", () => {
  const base = { views: 400, visitors: 180, clicks: 12, buttons: [{ name: 'call', count: 10 }], pages: [], sources: [] };
  const plain = summarize({ ...base, closeRate: null });
  const full = { rate: 60, won: 12, lost: 8, months: 6, weight: 1 };
  const own = summarize({ ...base, closeRate: null, observed: full, marked: { won: 1, lost: 0 } });
  assert.equal(own.closeRate, 60, 'at full weight the marked rate is the rate');
  assert.ok(own.closeRateEstimate, 'the estimate still exists for the range');
  assert.deepEqual(own.observedCloseRate, full);
  assert.equal(own.estimatedCustomers, 1 + Math.round(((own.conversions - 1) * 60) / 100));
  const half = { rate: 60, won: 6, lost: 4, months: 6, weight: 0.5 };
  const blended = summarize({ ...base, closeRate: null, observed: half });
  assert.equal(blended.closeRate, Math.round(0.5 * 60 + 0.5 * plain.closeRate), 'half the client, half the data');
  const rough = summarize({ ...base, closeRate: null, observed: { rate: 0, won: 0, lost: 10, months: 6, weight: 0.5 } });
  assert.equal(rough.closeRate, Math.round(plain.closeRate / 2), 'ten "not yet" taps halve the rate, never zero it');
  const manual = summarize({ ...base, closeRate: 25, observed: full });
  assert.equal(manual.closeRate, 25, 'a rate typed in by the admin wins');
  assert.equal(manual.observedCloseRate, null);
});

test('the report tile and email note explain where a marked rate came from', async () => {
  const { reportStats } = await import('./projects');
  const { closeRateNote } = await import('./email');
  const base = { views: 400, visitors: 180, clicks: 12, buttons: [{ name: 'call', count: 10 }], pages: [], sources: [] };
  const details = { kickoffAt: null, targetLaunchAt: null, baselineCalls: null, baselineLeads: null, baselineKeyword: '', baselineRank: null };
  const t = summarize({ ...base, closeRate: null, observed: { rate: 60, won: 12, lost: 8, months: 6, weight: 1 }, marked: { won: 2, lost: 1 } });
  const tile = reportStats({ ...emptyReportBody(), traffic: t }, null, details).find((s) => s.label === 'Estimated new customers')!;
  assert.match(tile.sub!, /2 booked, marked by you/);
  assert.match(tile.sub!, /60% close rate from the leads you marked/);
  const note = closeRateNote(t);
  assert.match(note, /you marked 12 of 20 leads in AxeonPROOF as booked, so that is the rate we use/);
  assert.match(note, /marked 3 so far, 2 as booked/);
  assert.doesNotMatch(note, /conversion|customers marked|became customers/i);
  const b = summarize({ ...base, closeRate: null, observed: { rate: 60, won: 6, lost: 4, months: 6, weight: 0.5 } });
  const btile = reportStats({ ...emptyReportBody(), traffic: b }, null, details).find((s) => s.label === 'Estimated new customers')!;
  assert.match(btile.sub!, /close rate from your marks and our estimate/);
  assert.match(closeRateNote(b), /Until you have marked 20, we blend that with what the data says \(\d+%\), your marks counting for 50%/);
});

// ---- feedback links and the owner's notes --------------------------------------

test('feedback tokens round-trip, reject tampering, and the report carries the three links', async () => {
  const { feedbackToken, readFeedbackToken } = await import('./feedback');
  const { renderMonthlyReportEmail } = await import('./email');
  const { sampleMonthlyReportInput } = await import('./sampleReport');
  const key = 'test-secret';
  const t = feedbackToken({ onboardingId: 12, kind: 'report', month: '2026-09' }, key);
  assert.match(t, /^12\.report\.2026-09\.[0-9a-f]{24}$/);
  assert.deepEqual(readFeedbackToken(t, key), { onboardingId: 12, kind: 'report', month: '2026-09' });
  assert.deepEqual(readFeedbackToken(feedbackToken({ onboardingId: 3, kind: 'note30', month: null }, key), key), { onboardingId: 3, kind: 'note30', month: null });
  assert.equal(readFeedbackToken(t.replace('12.', '13.'), key), null, 'another client id fails the signature');
  assert.equal(readFeedbackToken(t, 'other-secret'), null, 'another secret fails');
  assert.equal(readFeedbackToken('12.report.2026-09', key), null, 'no signature');
  assert.equal(feedbackToken({ onboardingId: 1, kind: 'report', month: '2026-09' }, ''), '', 'no secret, no link');
  const { html } = renderMonthlyReportEmail({ ...sampleMonthlyReportInput('a@b.c'), feedbackUrl: 'https://axeonstudio.co/f/x' });
  assert.match(html, /Was this report useful\?/);
  for (const r of ['yes', 'sortof', 'no']) assert.match(html, new RegExp(`href="https://axeonstudio.co/f/x\\?r=${r}"`));
  const { html: without } = renderMonthlyReportEmail({ ...sampleMonthlyReportInput('a@b.c'), feedbackUrl: null });
  assert.doesNotMatch(without, /Was this report useful/);
});

test("the owner's notes are due at day 30 and day 90 after launch, once each, never for quiet or closed clients", async () => {
  const { noteDue, launchDate } = await import('./clientNotes');
  const DAY = 86_400_000;
  const live = { status: 'active' as const, welcomeSentAt: '2026-06-01T00:00:00Z', createdAt: '2026-05-20T00:00:00Z' };
  const d = { kickoffAt: '2026-06-01', targetLaunchAt: '2026-06-20' };
  const launch = launchDate(live, d);
  const none = { note30SentAt: null, note90SentAt: null };
  assert.equal(noteDue(live, d, none, launch + 10 * DAY), null);
  assert.equal(noteDue(live, d, none, launch + 30 * DAY), 'note30');
  assert.equal(noteDue(live, d, none, launch + 45 * DAY), 'note30');
  assert.equal(noteDue(live, d, { ...none, note30SentAt: 'x' }, launch + 45 * DAY), null, 'sent once');
  assert.equal(noteDue(live, d, none, launch + 70 * DAY), null, 'missed the window: skipped, not sent late');
  assert.equal(noteDue(live, d, none, launch + 90 * DAY), 'note90');
  assert.equal(noteDue(live, d, { ...none, note90SentAt: 'x' }, launch + 100 * DAY), null);
  assert.equal(noteDue({ ...live, welcomeSentAt: null }, d, none, launch + 30 * DAY), null, 'quiet client');
  assert.equal(noteDue({ ...live, status: 'closed' }, d, none, launch + 30 * DAY), null, 'closed client');
  // Without project dates, launch is the sign-up day.
  assert.equal(launchDate(live, { kickoffAt: null, targetLaunchAt: null }), new Date(live.createdAt).getTime());
  assert.equal(noteDue(live, { kickoffAt: null, targetLaunchAt: null }, none, new Date(live.createdAt).getTime() + 31 * DAY), 'note30');
});

// ---- AxeonPROOF tabs and the upgrade page ---------------------------------------

test('every tab is visible, tabs outside the plan are locked, and the price reads as extra jobs', async () => {
  const { PROOF_TABS, isProofTab, proofTab, tabLocked, upgradeMath, lockedHeadline } = await import('./proofTabs');
  assert.deepEqual(PROOF_TABS.map((t) => t.key), ['overview', 'leads', 'calls', 'bookings', 'reviews', 'ads', 'receptionist']);
  assert.ok(isProofTab('calls') && !isProofTab('billing'));
  const locked = (tier: 'essentials' | 'axeoncore' | 'axeongrowth') => PROOF_TABS.filter((t) => tabLocked(t, tier)).map((t) => t.key);
  assert.deepEqual(locked('essentials'), ['calls', 'bookings', 'reviews', 'ads', 'receptionist']);
  assert.deepEqual(locked('axeoncore'), ['ads', 'receptionist']);
  assert.deepEqual(locked('axeongrowth'), []);
  assert.equal(upgradeMath('essentials', 'axeoncore', 300).delta, 150);
  assert.match(upgradeMath('essentials', 'axeoncore', 300).line, /^At your average job of \$300, that is one extra job a month/);
  assert.match(upgradeMath('essentials', 'axeoncore', 100).line, /2 extra jobs/);
  assert.match(upgradeMath('essentials', 'axeoncore', null).line, /one or two extra jobs/);
  assert.equal(upgradeMath('axeoncore', 'axeongrowth', 300).delta, 700);
  assert.match(upgradeMath('axeoncore', 'axeongrowth', 300).line, /Plus the ad budget you set/);
  const t = summarize({ views: 300, visitors: 120, clicks: 20, buttons: [{ name: 'call', count: 12 }, { name: 'form', count: 3 }], pages: [], sources: [], closeRate: null });
  assert.match(lockedHeadline(proofTab('calls'), t), /^15 people reached out through your site last month, and 12 of them pressed Call\. When the phone rings out, AxeonCORE texts them back/);
  assert.match(lockedHeadline(proofTab('calls'), null), /^When a call rings out, AxeonCORE/);
  assert.match(lockedHeadline(proofTab('ads'), t), /without a dollar of ads\. AxeonGROWTH/);
  for (const tab of PROOF_TABS.filter((x) => x.tier !== 'essentials')) {
    assert.ok(tab.includes.length >= 3, `${tab.key} has bullets`);
    assert.ok(tab.ghost && tab.ghost.tiles.length === 4 && tab.ghost.rows.length >= 6 && tab.ghost.bars.length >= 8, `${tab.key} has a ghost dashboard`);
    assert.doesNotMatch(lockedHeadline(tab, t) + tab.includes.join(' '), /conversion/i);
  }
});

test('the loss line uses real counts with a stated rule of thumb, and the report nudges only when the number earns it', async () => {
  const { lossLine, proofTab } = await import('./proofTabs');
  const { upgradeNudge, CALLS_NUDGE_MIN } = await import('./email');
  const big = summarize({ views: 900, visitors: 400, clicks: 40, buttons: [{ name: 'call', count: 23 }, { name: 'form', count: 7 }], pages: [], sources: [], closeRate: null });
  const small = summarize({ views: 90, visitors: 40, clicks: 4, buttons: [{ name: 'call', count: 3 }], pages: [], sources: [], closeRate: null });
  const calls = lossLine(proofTab('calls'), big)!;
  assert.match(calls.text, /^23 people pressed Call last month\. If one in five of those calls rang out, that is roughly 5 people/);
  assert.match(calls.basis, /rule of thumb/);
  assert.equal(lossLine(proofTab('calls'), small), null, 'too few to say anything');
  assert.match(lossLine(proofTab('bookings'), big)!.text, /people reached out last month\. If a third of them/);
  assert.equal(lossLine(proofTab('reviews'), big), null);
  assert.equal(lossLine(proofTab('calls'), null), null);
  assert.equal(CALLS_NUDGE_MIN, 15);
  assert.match(upgradeNudge({ tier: 'essentials', traffic: big, proofUrl: 'https://app.axeonstudio.co/' }), /23 people pressed Call this month.*href="https:\/\/app\.axeonstudio\.co\/\?tab=calls"/);
  assert.equal(upgradeNudge({ tier: 'essentials', traffic: small, proofUrl: 'https://app.axeonstudio.co/' }), '', 'under the bar: nothing');
  assert.equal(upgradeNudge({ tier: 'axeoncore', traffic: big, proofUrl: 'https://app.axeonstudio.co/' }), '', 'already on CORE: nothing');
});
