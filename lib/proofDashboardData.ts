// lib/proofDashboardData.ts
// Everything the AxeonPROOF dashboard shows for one client, loaded once here so
// the client's own page (app/proof) and the admin's "View as client" preview
// (app/admin/onboarding/[token]/preview) render the exact same thing.
import { TIER_LABELS } from '@/data/onboardingItems';
import { agreementUrl, latestSignedAgreementFor } from '@/lib/agreements';
import { computeProgress, getItemStates, orderedItems, welcomeUrl, type Onboarding } from '@/lib/onboarding';
import { getProjectDetails, guaranteeDay, listMonthlyReports, listProjectUpdates, tierHasGuarantee } from '@/lib/projects';
import { monthLabel } from '@/lib/projectsShared';
import { effectiveCloseRate, getTrackingSettings, hasTraffic, leadRows, monthOf, monthTraffic, ownVisitsUrl, previousMonth } from '@/lib/siteStats';
import { clientBilling } from '@/lib/clientBilling';
import { CLIENT_REPLY_TO } from '@/lib/email';
import { getUpgradeRequest } from '@/lib/upgrades';
import { businessEmailForDashboard } from '@/lib/businessEmail';
import { callsSummary, getLine, recentCalls } from '@/lib/phoneLines';
import { DEFAULT_TIME_ZONE, toDashboardCall, type CallsSummary, type DashboardCall } from '@/lib/phoneShared';
import { attachedClickIds, contactTimeline, listInbox } from '@/lib/contacts';
import { inboxEnabled, textingState, type DashboardInbox } from '@/lib/contactsShared';
import { isPushConfigured } from '@/lib/push';
import { listSubmissions } from '@/lib/leads';
import { toDashboardSubmission } from '@/lib/leadShared';
import type { ProofTabKey } from '@/lib/proofTabs';
import { clientScansUsed, getAuditSettings, listAuditsForOnboarding } from '@/lib/audits';
import { mapsMeasured, progressFrom, scanCapFor, section, splitCity } from '@/lib/auditShared';
import { listPlan } from '@/lib/plans';
import type { RankingData } from '@/components/proof/RankingCard';
import type { ProofDashboard } from '@/components/proof/ProofDashboard';
import type { ComponentProps } from 'react';

export interface DashboardPhone {
  number: string;
  /** True only when texting is approved and switched on, so the copy never promises a text that will not go out. */
  textBack: boolean;
  thisMonth: CallsSummary;
  lastMonth: CallsSummary;
  recent: DashboardCall[];
}

export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview' | 'leadApi' | 'inboxApi' | 'tab'>;

/** `tab` decides what is worth fetching: Stripe is only read for the Billing tab, DNS only for the Email tab. */
export async function loadDashboardData(onboarding: Onboarding, tab: ProofTabKey = 'overview', opts: { contactId?: number | null } = {}): Promise<DashboardData> {
  const month = monthOf();
  const previous = previousMonth(month);
  const [states, details, updates, reports, agreement, tracking, thisLeads, lastLeads, upgradeRequest, billing, businessEmail, auditSettings, audits, scansUsed, plan, line] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
    getTrackingSettings(onboarding.id),
    leadRows(onboarding.id, month),
    leadRows(onboarding.id, previous),
    getUpgradeRequest(onboarding.id),
    tab === 'billing' ? clientBilling(onboarding) : Promise.resolve(null),
    tab === 'email' ? businessEmailForDashboard(onboarding.id) : Promise.resolve(null),
    getAuditSettings(onboarding.id),
    listAuditsForOnboarding(onboarding.id, 60),
    clientScansUsed(onboarding.id),
    listPlan(onboarding.id),
    getLine(onboarding.id),
  ]);
  // The Ranking card (components/proof/RankingCard.tsx): shown only when the plan includes scans and the admin set city + keyword.
  const cap = scanCapFor(onboarding.tier, auditSettings.clientScanCap);
  // Only audits whose Maps section came back are measurements; an errored one must not read as "not found".
  const measured = audits.filter((a) => a.status !== 'failed' && mapsMeasured(a));
  const official = measured.filter((a) => a.trigger !== 'client');
  const latestGrid = official.map((a) => ({ at: a.createdAt, result: section(a.results.grid) })).find((g) => g.result !== null);
  const latest = measured[0] ?? null;
  const deepOfficial = official.filter((a) => a.deep);
  const baselineDeep = deepOfficial[deepOfficial.length - 1] ?? null;
  const latestDeep = deepOfficial[0] ?? null;
  const latestMaps = latest ? section(latest.results.maps) : null;
  const latestRep = latest ? section(latest.results.reputation) : null;
  const ranking: RankingData | null =
    cap > 0 && auditSettings.city && auditSettings.keyword
      ? {
          keyword: auditSettings.keyword,
          city: splitCity(auditSettings.city).city,
          baselineRank: details.baselineRank,
          points: [...measured]
            .reverse()
            .map((a) => ({ at: a.createdAt, rank: section(a.results.maps)?.rank ?? null, trigger: a.trigger })),
          latest: latest ? { at: latest.createdAt, rank: latestMaps?.rank ?? null, found: latestMaps?.found ?? false, rating: latestRep?.rating ?? null, reviews: latestRep?.reviews ?? null } : null,
          grid: latestGrid && latestGrid.result ? { at: latestGrid.at, result: latestGrid.result } : null,
          cap,
          used: scansUsed,
          progress: progressFrom(baselineDeep, latest, latestDeep),
          plan: plan.filter((i) => i.status !== 'dropped').map((i) => ({ id: i.id, title: i.title, owner: i.owner, status: i.status, metric: i.metric, current: i.current, target: i.target })),
        }
      : null;
  // This month straight from the tracker, so the overview is never blank between reports
  // (and never blank before the first report, which is the first thing a new client sees).
  // AxeonCORE and up get the leads inbox, where every form is a contact; the separate form list is Essentials' view.
  const inboxOn = inboxEnabled(onboarding.tier);
  const [thisMonth, lastMonth, thisForms, lastForms] = await Promise.all([
    monthTraffic(onboarding.id, month, effectiveCloseRate(tracking)),
    monthTraffic(onboarding.id, previous, effectiveCloseRate(tracking)),
    inboxOn ? Promise.resolve([]) : listSubmissions(onboarding.id, month),
    inboxOn ? Promise.resolve([]) : listSubmissions(onboarding.id, previous),
  ]);
  const phone: DashboardPhone | null = line
    ? await (async () => {
        const [tm, lm, recent] = await Promise.all([callsSummary(onboarding.id, month), callsSummary(onboarding.id, previous), recentCalls(onboarding.id, 20)]);
        return { number: line.phoneNumber, textBack: line.smsStatus === 'ready' && line.textBackEnabled, thisMonth: tm, lastMonth: lm, recent: recent.map(toDashboardCall) };
      })()
    : null;
  // The leads inbox: loaded only for the Leads tab; ?contact=<id> opens one person.
  const inbox: DashboardInbox | null =
    inboxOn && tab === 'leads'
      ? await (async (): Promise<DashboardInbox> => {
          const [list, selected] = await Promise.all([
            listInbox(onboarding.id, { limit: 50 }),
            opts.contactId ? contactTimeline(onboarding.id, opts.contactId) : Promise.resolve(null),
          ]);
          return { ...list, selected, timeZone: line?.timeZone ?? DEFAULT_TIME_ZONE, texting: textingState(line) };
        })()
      : null;
  // Taps already matched to a caller live in the inbox; the anonymous list keeps the rest.
  const attached = inboxOn && tab === 'leads' ? await attachedClickIds(onboarding.id, [...thisLeads, ...lastLeads].map((r) => r.id)) : new Set<number>();
  // The VAPID public key (lib/push.ts), only when push is set up and the plan has the inbox.
  const pushKey = inboxOn && isPushConfigured() ? (process.env.WEB_PUSH_PUBLIC_KEY ?? null) : null;
  return {
    onboarding,
    progress: computeProgress(onboarding.tier, states),
    planLabel: TIER_LABELS[onboarding.tier],
    axeonItems: orderedItems(onboarding.tier).axeon,
    states,
    setupUrl: welcomeUrl(onboarding.token),
    details,
    updates,
    reports,
    guarantee: tierHasGuarantee(onboarding.tier),
    guaranteeDay: guaranteeDay(details.kickoffAt),
    agreementUrl: agreement ? agreementUrl(agreement.token) : null,
    avgJobValue: tracking.avgJobValue,
    ownVisitsUrl: ownVisitsUrl(tracking.siteUrl),
    // Live from the events table, not the saved report, so a lead shows up the day it happens.
    leads: [
      { month, label: `${monthLabel(month)} so far`, rows: thisLeads.filter((r) => !attached.has(r.id)) },
      { month: previous, label: monthLabel(previous), rows: lastLeads.filter((r) => !attached.has(r.id)) },
    ],
    // Website form messages (slice 2), pre-masked: no raw phone, email or message reaches the page.
    forms: [
      { month, label: `${monthLabel(month)} so far`, rows: thisForms.map(toDashboardSubmission) },
      { month: previous, label: monthLabel(previous), rows: lastForms.map(toDashboardSubmission) },
    ],
    upgradeRequest,
    billing,
    businessEmail,
    ownerEmail: CLIENT_REPLY_TO,
    phone,
    inbox,
    pushKey,
    ranking,
    live: hasTraffic(thisMonth) ? { month, traffic: thisMonth, prev: hasTraffic(lastMonth) ? lastMonth : null } : null,
  };
}
