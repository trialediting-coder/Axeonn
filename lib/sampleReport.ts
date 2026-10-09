// lib/sampleReport.ts
// A fully made-up month for a fictional detailing shop, shaped exactly like a
// real monthly report (summarize -> reportStats -> renderMonthlyReportEmail).
// The admin's "Email me a sample report" button sends it through Resend, so
// what lands in the inbox is byte-for-byte what a client would get. Sample
// emails sent through other channels (Gmail, for one) strip images, <style>
// and background colours, which is why this exists.
import type { MonthlyReportEmailInput } from '@/lib/email';
import { emptyReportBody, reportStats } from '@/lib/projects';
import type { TrafficDetail } from '@/lib/projectsShared';
import { summarize } from '@/lib/siteStats';
import { APP_ORIGIN } from '@/lib/hostRouting';

export const SAMPLE_BUSINESS = 'A-1 Auto Detailing';

const hours = new Array<number>(24).fill(0);
[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].forEach((h, i) => (hours[h] = [2, 5, 7, 6, 4, 5, 6, 5, 4, 3, 2, 1][i]));

const detail: TrafficDetail = {
  sessions: 1010,
  returningVisitors: 96,
  bounceRate: 38,
  avgSeconds: 84,
  avgScroll: 61,
  pagesPerSession: 2.1,
  devices: { phone: 880, tablet: 70, desktop: 390 },
  landing: [
    { path: '/', sessions: 512, conversions: 19 },
    { path: '/ceramic-coating', sessions: 214, conversions: 14 },
    { path: '/interior-detailing', sessions: 141, conversions: 7 },
    { path: '/paint-correction', sessions: 78, conversions: 4 },
    { path: '/pricing', sessions: 65, conversions: 5 },
  ],
  convertingPages: [
    { path: '/ceramic-coating', count: 17 },
    { path: '/', count: 15 },
    { path: '/pricing', count: 9 },
    { path: '/interior-detailing', count: 8 },
  ],
  campaigns: [
    { source: 'google', medium: 'cpc', campaign: 'ceramic coating des moines', sessions: 140, conversions: 11 },
    { source: 'facebook', medium: 'paid_social', campaign: 'fall interior special', sessions: 62, conversions: 3 },
  ],
  places: [
    { city: 'Des Moines, IA', sessions: 486, conversions: 24 },
    { city: 'West Des Moines, IA', sessions: 171, conversions: 9 },
    { city: 'Ankeny, IA', sessions: 118, conversions: 6 },
    { city: 'Urbandale, IA', sessions: 74, conversions: 3 },
    { city: 'Johnston, IA', sessions: 41, conversions: 2 },
  ],
  conversionHours: hours,
  conversionDays: [3, 9, 8, 10, 9, 8, 3],
  speedMs: 1400,
  engagedNoClick: 36,
};

/** Everything renderMonthlyReportEmail needs, addressed to `to`. Pure; safe to call from tests. */
export function sampleMonthlyReportInput(to: string): MonthlyReportEmailInput {
  const traffic = summarize({
    views: 2120,
    visitors: 912,
    clicks: 62,
    buttons: [
      { name: 'call', count: 23 },
      { name: 'get a free quote', count: 11 },
      { name: 'directions', count: 9 },
      { name: 'form', count: 7 },
      { name: 'book', count: 4 },
      { name: 'text', count: 3 },
      { name: 'facebook', count: 3 },
      { name: 'review', count: 2 },
    ],
    pages: [
      { path: '/', count: 790 },
      { path: '/ceramic-coating', count: 468 },
      { path: '/interior-detailing', count: 312 },
      { path: '/pricing', count: 241 },
      { path: '/paint-correction', count: 139 },
    ],
    sources: [
      { host: 'google.com', count: 1140 },
      { host: '', count: 486 },
      { host: 'facebook.com', count: 212 },
      { host: 'yelp.com', count: 96 },
      { host: 'nextdoor.com', count: 48 },
    ],
    closeRate: null,
    detail,
  });
  const prevTraffic = summarize({
    views: 1680,
    visitors: 744,
    clicks: 47,
    buttons: [
      { name: 'call', count: 17 },
      { name: 'get a free quote', count: 9 },
      { name: 'directions', count: 7 },
      { name: 'form', count: 5 },
      { name: 'book', count: 2 },
      { name: 'text', count: 2 },
    ],
    pages: [],
    sources: [],
    closeRate: null,
    detail: { ...detail, sessions: 820, engagedNoClick: 28 },
  });

  const report = {
    ...emptyReportBody(),
    booked: 11,
    keyword: 'auto detailing des moines',
    rank: 1,
    reviews: 4,
    rating: 4.9,
    note: 'Your best month since launch. The ceramic coating page is now your top earner after the home page.',
    done: [
      { title: 'Ceramic coating page', body: 'Rewrote it around the three questions people call about: cost, how long it lasts, and prep.' },
      { title: 'Google Ads', body: 'Moved budget from “car wash” searches to “ceramic coating” searches, which brought in 11 of the people who reached out.' },
      { title: 'Reviews', body: 'Four new five-star reviews from the follow-up text we set up.' },
    ],
    next: [
      { title: 'Paint correction page', body: 'Same treatment as ceramic coating; it gets traffic but fewer calls.' },
      { title: 'Saturday hours', body: 'Most people reach out midweek around 10am; we will test a Saturday booking reminder.' },
    ],
    fromYou: 'Two or three photos of a finished ceramic coating job in daylight.',
    traffic,
    auto: true,
  };
  const prev = { ...emptyReportBody(), booked: 8, rank: 2, traffic: prevTraffic };
  const details = { kickoffAt: '2026-06-01', targetLaunchAt: '2026-06-20', baselineCalls: 9, baselineLeads: 4, baselineKeyword: 'auto detailing des moines', baselineRank: 14 };

  return {
    to,
    clientName: 'Mike',
    businessName: SAMPLE_BUSINESS,
    tier: 'axeoncore',
    monthLabel: 'September 2026',
    prevMonthLabel: 'August',
    stats: reportStats(report, prev, details, { avgJobValue: 300 }),
    traffic,
    prevTraffic,
    avgJobValue: 300,
    rank: report.rank,
    keyword: report.keyword,
    reviews: report.reviews,
    rating: report.rating,
    prevRank: prev.rank,
    done: report.done,
    next: report.next,
    fromYou: report.fromYou,
    note: report.note,
    proofUrl: `${APP_ORIGIN}/`,
    feedbackUrl: `${APP_ORIGIN}/f/sample`,
  };
}
