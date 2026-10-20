// lib/__fixtures__/proofDashboardFixture.ts
// DEV ONLY: a made-up practice for rendering the AxeonPROOF v1 and v2 dashboards
// without a database (app/proof/dev-fixture, which 404s outside `next dev`).
// stage 'setup': day 11, preview of the site in review. stage 'list': day 16,
// live since day 14, the win-back phase on and no past-patient list yet (the
// status card asks for the upload). stage 'live': day 100, live since day 14,
// phases 1-4 done, search growth on now, numbers in.
// industry: dental (default) | med_spa | law | accounting | other, for the
// per-industry wording (data/industryWords.ts).
// Never imported by a production route; nothing here is shown to a client.
import { TIER_LABELS } from '@/data/onboardingItems';
import { computeProgress, orderedItems, type ItemState, type Onboarding } from '@/lib/onboarding';
import type { DashboardData } from '@/lib/proofDashboardData';
import type { ProofV2View } from '@/lib/proofV2';
import { canGoLive, deriveMilestones, napProgress, pipelineTotals, programDay, stagingState, type MilestoneFacts, type PipelineRow, type ProofV2Settings, defaultDbrSteps } from '@/lib/proofV2Shared';
import { defaultValueFor, type Industry } from '@/data/industryWords';
import type { ProofVersion } from '@/data/dashboardVersions';
import type { MonthlyReport } from '@/lib/projects';
import type { TrafficSummary } from '@/lib/projectsShared';

const DAY = 86_400_000;

export type FixtureStage = 'setup' | 'list' | 'live';

/** A made-up name and page list per type of practice or firm. */
export const FIXTURE_PRACTICES: Record<Industry, { name: string; pages: string[] }> = {
  dental: { name: 'Example Family Dental', pages: ['Ankeny dental implants', 'West Des Moines Invisalign', 'Urbandale family dentist', 'Emergency dentist Des Moines', 'Teeth whitening Ankeny', 'Kids dentist Waukee', 'Dental crowns Johnston', 'Clive dentist'] },
  med_spa: { name: 'Example Aesthetics', pages: ['Botox in West Des Moines', 'Laser hair removal Ankeny', 'HydraFacial Urbandale', 'Lip filler Waukee', 'Chemical peels Clive', 'Microneedling Johnston', 'Med spa Des Moines', 'IPL photofacial Ankeny'] },
  law: { name: 'Example Law Group', pages: ['Des Moines personal injury lawyer', 'Ankeny estate planning', 'West Des Moines DUI defense', 'Car accident attorney Urbandale', 'Wills and trusts Waukee', 'Workers comp lawyer Des Moines', 'Probate attorney Clive', 'Family law Johnston'] },
  accounting: { name: 'Example CPA Partners', pages: ['Small business tax prep Des Moines', 'Bookkeeping West Des Moines', 'Payroll services Ankeny', 'Individual tax returns Urbandale', 'CPA for contractors Waukee', 'IRS notice help Des Moines', 'Fractional CFO Clive', 'Farm tax Johnston'] },
  other: { name: 'Example Services Co.', pages: ['Des Moines consultations', 'West Des Moines services', 'Ankeny services', 'Urbandale services', 'Waukee services', 'Clive services', 'Johnston services', 'Altoona services'] },
};

export function fixtureDashboard(version: ProofVersion, now: Date = new Date(), stage: FixtureStage = 'setup', industry: Industry = 'dental'): DashboardData {
  const live = stage === 'live';
  const list = stage === 'list';
  const practice = FIXTURE_PRACTICES[industry];
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY).toISOString();
  const onboarding: Onboarding = {
    id: 1,
    token: 'FIXTUREFIXTUREFIXTUR',
    tier: 'axeoncore',
    clientEmail: 'owner@example.com',
    clientName: 'Dana Example',
    businessName: practice.name,
    phone: null,
    stripeCustomerId: null,
    checkoutSessionId: null,
    status: 'active',
    welcomeSentAt: iso(12),
    nudgeSentAt: null,
    lastClientActivityAt: iso(1),
    completedAt: null,
    createdAt: iso(12),
    updatedAt: iso(1),
    proofVersion: version,
    industry,
    industryConfirmedAt: iso(11),
    dashboardInviteSentAt: iso(11),
  };
  // Live: every setup item and every build item done, as they would be by day 100.
  const states: Record<string, ItemState> = live
    ? Object.fromEntries(
        [...orderedItems('axeoncore').client, ...orderedItems('axeoncore').axeon].map((i) => [i.key, { itemKey: i.key, status: 'done', data: {}, completedBy: null, completedAt: iso(80), updatedAt: iso(80) } as ItemState]),
      )
    : {};
  const base = live ? 99 : list ? 15 : 11; // days since day 1
  const startAt = iso(base).slice(0, 10);
  const dayAt = (day: number) => iso(base - (day - 1)); // program day N, as an ISO time
  const liveSettings: ProofV2Settings = {
    a2p: { brand: 'approved', campaign: 'approved', filedAt: dayAt(2), approvedAt: dayAt(3) },
    reviews: {
      wireframe: { imageUrl: '/images/work/hintz.webp', url: 'https://example.com/draft', sharedAt: dayAt(4), approvedAt: dayAt(5) },
      copy: { imageUrl: '/images/work/hintz.webp', url: 'https://example.com/draft', sharedAt: dayAt(7), approvedAt: dayAt(8) },
    },
    staging: { url: 'https://example.com/staging', imageUrl: '/images/work/hintz.webp', readyAt: dayAt(11), approvedAt: dayAt(12) },
    dnsCutoverAt: dayAt(14),
    goLiveAt: dayAt(14),
    certificateSentAt: dayAt(14),
    liveItems: ['New website on your domain', 'Tracked number on every page', 'Missed-call text-back', 'Online booking', 'Review requests', 'AxeonPROOF reporting'],
    steps: { 'p2-qa': { doneAt: dayAt(10) }, 'p3-tracker': { doneAt: dayAt(30) }, 'p5-indexing': {} },
    nap: Object.fromEntries(Array.from({ length: 38 }, (_, i) => i).map((i) => [['google', 'bing', 'apple', 'yelp', 'facebook'][i] ?? `dir${i}`, 'synced'])),
    sitemapSubmittedAt: dayAt(92),
    indexedOverride: { indexed: 6, total: 8, at: dayAt(120) },
    organic: {
      [iso(60).slice(0, 7)]: { impressions: 2140, clicks: 61, calls: 9, forms: 4 },
      [iso(30).slice(0, 7)]: { impressions: 3380, clicks: 97, calls: 14, forms: 6 },
      [iso(0).slice(0, 7)]: { impressions: 4410, clicks: 128, calls: 19, forms: 8 },
    },
    manager: { name: 'Sam Example', email: 'frontdesk@example.com' },
  } as ProofV2Settings;
  const listSettings: ProofV2Settings = {
    a2p: liveSettings.a2p,
    reviews: liveSettings.reviews,
    staging: liveSettings.staging,
    dnsCutoverAt: dayAt(14),
    goLiveAt: dayAt(14),
    certificateSentAt: dayAt(14),
    liveItems: liveSettings.liveItems,
    steps: { 'p2-qa': { doneAt: dayAt(10) } },
    nap: { google: 'synced', bing: 'submitted' },
    manager: { name: 'Sam Example', email: 'frontdesk@example.com' },
  };
  const settings: ProofV2Settings = live ? liveSettings : list ? listSettings : {
    a2p: { brand: 'approved', campaign: 'approved', filedAt: iso(10), approvedAt: iso(9) },
    reviews: {
      wireframe: { imageUrl: '/images/work/hintz.webp', url: 'https://example.com/draft', sharedAt: iso(7), approvedAt: iso(6) },
      copy: { imageUrl: '/images/work/hintz.webp', url: 'https://example.com/draft', sharedAt: iso(4), approvedAt: iso(3) },
    },
    staging: { url: 'https://example.com/staging', imageUrl: '/images/work/hintz.webp', readyAt: iso(0.5) },
    steps: { 'p2-qa': { doneAt: iso(2) } },
    nap: { google: 'synced', bing: 'synced', apple: 'submitted', avvo: 'na', justia: 'na', findlaw: 'na', lawyers_com: 'na' },
    manager: { name: 'Sam Example', email: 'frontdesk@example.com' },
  };
  const line = { number: '+15155550142', smsReady: true, textBackOn: true };
  const mcat = live ? { missed: 41, textedBack: 41, under30: 41, medianSeconds: 9, rescued: 23 } : { missed: 6, textedBack: 6, under30: 6, medianSeconds: 11, rescued: 4 };
  const dbr = live
    ? { imported: 312, consented: 312, firstImportAt: dayAt(15), status: 'done' as const, steps: defaultDbrSteps(industry), startedAt: dayAt(16), endedAt: dayAt(23), sent: 902, pending: 0, stopped: 34, replied: 34 }
    : { imported: 0, consented: 0, firstImportAt: null, status: 'none' as const, steps: defaultDbrSteps(industry), startedAt: null, endedAt: null, sent: 0, pending: 0, stopped: 0, replied: 0 };
  const average = defaultValueFor(industry);
  const rowsRaw: PipelineRow[] = live
    ? [
        ...Array.from({ length: 14 }, (_, i): PipelineRow => ({ key: `dbr:${i}`, source: 'dbr', label: ['Maria L.', 'Tom R.', 'Priya S.', 'Kevin D.'][i % 4], at: dayAt(17 + i), value: null, valueBasis: null })),
        ...Array.from({ length: 22 }, (_, i): PipelineRow => ({ key: `web:${i}`, source: 'web', label: ['Jordan P.', 'Alex K.', 'Sara M.'][i % 3], at: dayAt(20 + i * 3), value: null, valueBasis: null })),
      ]
    : [{ key: 'booking:1', source: 'web', label: 'Jordan P.', at: iso(1), value: null, valueBasis: null }];
  // Valued at the industry estimate, as lib/proofV2.ts pipelineRows does until the client sets their own.
  const rows = rowsRaw.map((r) => ({ ...r, value: average, valueBasis: 'average' as const }));
  const totals = pipelineTotals(rows);
  const nap = napProgress(settings.nap);
  const staging = stagingState(settings.staging, now);
  const autoDone = list
    ? {
        line_provisioned: dayAt(1),
        a2p_filed: dayAt(2),
        a2p_approved: dayAt(3),
        text_back_live: dayAt(3),
        wireframe_approved: dayAt(5),
        copy_approved: dayAt(8),
        staging_ready: dayAt(11),
        staging_approved: dayAt(12),
        dns_cutover: dayAt(14),
        go_live: dayAt(14),
      }
    : live
    ? {
        line_provisioned: dayAt(1),
        a2p_filed: dayAt(2),
        a2p_approved: dayAt(3),
        text_back_live: dayAt(3),
        wireframe_approved: dayAt(5),
        copy_approved: dayAt(8),
        staging_ready: dayAt(11),
        staging_approved: dayAt(12),
        dns_cutover: dayAt(14),
        go_live: dayAt(14),
        dbr_imported: dayAt(15),
        dbr_started: dayAt(16),
        dbr_done: dayAt(23),
        reviews_live: dayAt(45),
        citations_started: dayAt(50),
        citations_done: dayAt(60),
        pages_planned: dayAt(61),
        pages_published: dayAt(90),
        sitemap_submitted: dayAt(92),
      }
    : {
    line_provisioned: iso(11),
    a2p_filed: iso(10),
    a2p_approved: iso(9),
    text_back_live: iso(9),
    wireframe_approved: iso(6),
    copy_approved: iso(3),
    staging_ready: iso(0.5),
  };
  const facts: MilestoneFacts = {
    startAt,
    industry,
    settings,
    autoDone,
    line,
    mcat,
    dbr: live ? { imported: 312, status: 'done', sent: 902, booked: 14, pipelineDollars: null } : { imported: 0, status: 'none', sent: 0, booked: 0, pipelineDollars: null },
    reviewEngine: live ? { enabled: true, sent: 118, newReviews: 37 } : { enabled: false, sent: 0, newReviews: null },
    nap: { synced: nap.synced, total: nap.total },
    pages: live ? { planned: 8, published: 8, indexed: 6 } : { planned: 0, published: 0, indexed: 0 },
    openPins: 0,
  };
  const v2: ProofV2View | null =
    version === 2
      ? {
          startAt,
          industry,
          day: programDay(startAt, now),
          milestones: deriveMilestones(facts, now),
          settings,
          staging,
          goLive: canGoLive(settings, now),
          pins: [
            { id: 1, stage: 'wireframe', x: 30, y: 18, note: 'Bigger phone number in the header', author: 'client', status: 'resolved', createdAt: iso(7) },
            { id: 2, stage: 'staging', x: 62, y: 40, note: 'Use the team photo here', author: 'client', status: 'open', createdAt: iso(0.2) },
          ],
          line,
          mcat,
          dbr,
          pipeline: { rows, totals, average, averageBasis: 'estimate' },
          reviews: live ? { enabled: true, enabledAt: dayAt(45), sent: 118, newReviews: 37, rating: 4.9, reviews: 212 } : { enabled: false, enabledAt: null, sent: 0, newReviews: null, rating: null, reviews: null },
          nap,
          pages: live
            ? practice.pages.map((title, i) => ({ id: i + 1, title, status: 'published', indexed: i < 6 }) as ProofV2View['pages'][number])
            : [],
          frontDesk: list
            ? { waiting: 0, week: { missed: 3, autoTexted: 3, staffReplied: 3, booked: 2, archived: 0 }, signedOffAt: dayAt(15), signedOffBy: 'Sam Example', access: [] }
            : live
            ? { waiting: 0, week: { missed: 4, autoTexted: 4, staffReplied: 4, booked: 5, archived: 1 }, signedOffAt: dayAt(15), signedOffBy: 'Sam Example', access: [{ month: iso(20).slice(0, 7), recipient: 'owner', at: iso(19) }] }
            : { waiting: 1, week: { missed: 6, autoTexted: 6, staffReplied: 5, booked: 3, archived: 1 }, signedOffAt: null, signedOffBy: null, access: [] },
          bookUrl: 'https://axeonstudio.co/book',
          signing: { legalName: `${practice.name} PC`, signerName: 'Dana Example', signerTitle: 'Owner', einMasked: '••-•••6789' },
        }
      : null;
  const traffic = (views: number, conversions: number): TrafficSummary => ({
    views,
    visitors: Math.round(views * 0.62),
    clicks: Math.round(views * 0.16),
    buttons: [{ name: 'Call', count: Math.round(conversions * 0.6) }, { name: 'Book', count: Math.round(conversions * 0.3) }],
    pages: [{ path: '/', count: Math.round(views * 0.4) }],
    sources: [{ host: 'google.com', count: Math.round(views * 0.55) }, { host: '', count: Math.round(views * 0.3) }],
    conversions,
    closeRate: 35,
    estimatedCustomers: Math.round(conversions * 0.35),
  });
  const report = (month: string, r: Partial<MonthlyReport>, id: number): MonthlyReport =>
    ({ id, month, emailedAt: null, calls: null, leads: null, booked: null, keyword: 'dentist ankeny', rank: null, reviews: null, rating: null, done: [], next: [], fromYou: '', note: '', ...r }) as MonthlyReport;
  const reports: MonthlyReport[] = live
    ? [
        report(iso(30).slice(0, 7), { calls: 64, leads: 19, booked: 27, rank: 3, reviews: 205, rating: 4.9, traffic: traffic(1284, 58) }, 2),
        report(iso(60).slice(0, 7), { calls: 51, leads: 14, booked: 19, rank: 5, reviews: 190, rating: 4.8, traffic: traffic(1022, 44) }, 1),
      ]
    : [];
  return {
    onboarding,
    progress: computeProgress('axeoncore', states),
    planLabel: TIER_LABELS.axeoncore,
    axeonItems: orderedItems('axeoncore', industry).axeon,
    states,
    setupUrl: '/welcome/FIXTUREFIXTUREFIXTUR',
    details: { kickoffAt: startAt, targetLaunchAt: null, baselineCalls: null, baselineLeads: null, baselineKeyword: null, baselineRank: null },
    updates: [],
    reports,
    guarantee: true,
    guaranteeDay: live ? 99 : 12,
    agreementUrl: null,
    avgJobValue: null,
    ownVisitsUrl: null,
    leads: [],
    forms: [],
    upgradeRequest: null,
    billing: null,
    businessEmail: null,
    ownerEmail: 'hello@axeonstudio.co',
    phone: null,
    inbox: null,
    pushKey: null,
    bookings: null,
    ranking: null,
    reels: [],
    v2,
    programTab: false,
    live: null,
  };
}
