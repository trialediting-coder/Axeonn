// lib/__fixtures__/proofDashboardFixture.ts
// DEV ONLY: a made-up practice for rendering the AxeonPROOF v1 and v2 dashboards
// without a database (app/proof/dev-fixture, which 404s outside `next dev`).
// Never imported by a production route; nothing here is shown to a client.
import { TIER_LABELS } from '@/data/onboardingItems';
import { computeProgress, orderedItems, type Onboarding } from '@/lib/onboarding';
import type { DashboardData } from '@/lib/proofDashboardData';
import type { ProofV2View } from '@/lib/proofV2';
import { canGoLive, deriveMilestones, napProgress, pipelineTotals, programDay, stagingState, type MilestoneFacts, type PipelineRow, type ProofV2Settings, DEFAULT_DBR_STEPS } from '@/lib/proofV2Shared';
import type { ProofVersion } from '@/data/dashboardVersions';

const DAY = 86_400_000;

export function fixtureDashboard(version: ProofVersion, now: Date = new Date()): DashboardData {
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY).toISOString();
  const onboarding: Onboarding = {
    id: 1,
    token: 'FIXTUREFIXTUREFIXTUR',
    tier: 'axeoncore',
    clientEmail: 'owner@example.com',
    clientName: 'Dana Example',
    businessName: 'Example Family Dental',
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
  };
  const states = {};
  const startAt = iso(11).slice(0, 10);
  const settings: ProofV2Settings = {
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
  const mcat = { missed: 6, textedBack: 6, under30: 6, medianSeconds: 11, rescued: 4 };
  const dbr = { imported: 0, consented: 0, firstImportAt: null, status: 'none' as const, steps: DEFAULT_DBR_STEPS.map((s) => ({ ...s })), startedAt: null, endedAt: null, sent: 0, pending: 0, stopped: 0, replied: 0 };
  const rows: PipelineRow[] = [{ key: 'booking:1', source: 'web', label: 'Jordan P.', at: iso(1), value: null, valueBasis: null }];
  const totals = pipelineTotals(rows);
  const nap = napProgress(settings.nap);
  const staging = stagingState(settings.staging, now);
  const autoDone = {
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
    settings,
    autoDone,
    line,
    mcat,
    dbr: { imported: 0, status: 'none', sent: 0, booked: 0, pipelineDollars: null },
    reviewEngine: { enabled: false, sent: 0, newReviews: null },
    nap: { synced: nap.synced, total: nap.total },
    pages: { planned: 0, published: 0, indexed: 0 },
    openPins: 0,
  };
  const v2: ProofV2View | null =
    version === 2
      ? {
          startAt,
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
          pipeline: { rows, totals, average: null },
          reviews: { enabled: false, enabledAt: null, sent: 0, newReviews: null, rating: null, reviews: null },
          nap,
          pages: [],
          frontDesk: { waiting: 1, week: { missed: 6, autoTexted: 6, staffReplied: 5, booked: 3, archived: 1 }, signedOffAt: null, signedOffBy: null, access: [] },
          bookUrl: 'https://axeonstudio.co/book',
        }
      : null;
  return {
    onboarding,
    progress: computeProgress('axeoncore', states),
    planLabel: TIER_LABELS.axeoncore,
    axeonItems: orderedItems('axeoncore').axeon,
    states,
    setupUrl: '/welcome/FIXTUREFIXTUREFIXTUR',
    details: { kickoffAt: startAt, targetLaunchAt: null, baselineCalls: null, baselineLeads: null, baselineKeyword: null, baselineRank: null },
    updates: [],
    reports: [],
    guarantee: true,
    guaranteeDay: 12,
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
