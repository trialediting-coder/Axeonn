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
import type { ProofTabKey } from '@/lib/proofTabs';
import { clientScansUsed, getAuditSettings, listAuditsForOnboarding } from '@/lib/audits';
import { scanCapFor, section, splitCity } from '@/lib/auditShared';
import type { RankingData } from '@/components/proof/RankingCard';
import type { ProofDashboard } from '@/components/proof/ProofDashboard';
import type { ComponentProps } from 'react';

export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview' | 'leadApi' | 'tab'>;

/** `tab` decides what is worth fetching: Stripe is only read for the Billing tab, DNS only for the Email tab. */
export async function loadDashboardData(onboarding: Onboarding, tab: ProofTabKey = 'overview'): Promise<DashboardData> {
  const month = monthOf();
  const previous = previousMonth(month);
  const [states, details, updates, reports, agreement, tracking, thisLeads, lastLeads, upgradeRequest, billing, businessEmail, auditSettings, audits, scansUsed] = await Promise.all([
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
  ]);
  // The Ranking card (components/proof/RankingCard.tsx): shown only when the plan includes scans and the admin set city + keyword.
  const cap = scanCapFor(onboarding.tier, auditSettings.clientScanCap);
  const official = audits.filter((a) => a.trigger !== 'client' && a.status !== 'failed');
  const latestGrid = official.map((a) => ({ at: a.createdAt, result: section(a.results.grid) })).find((g) => g.result !== null);
  const latest = audits.find((a) => a.status !== 'failed') ?? null;
  const latestMaps = latest ? section(latest.results.maps) : null;
  const latestRep = latest ? section(latest.results.reputation) : null;
  const ranking: RankingData | null =
    cap > 0 && auditSettings.city && auditSettings.keyword
      ? {
          keyword: auditSettings.keyword,
          city: splitCity(auditSettings.city).city,
          baselineRank: details.baselineRank,
          points: [...audits]
            .filter((a) => a.status !== 'failed')
            .reverse()
            .map((a) => ({ at: a.createdAt, rank: section(a.results.maps)?.rank ?? null, trigger: a.trigger })),
          latest: latest ? { at: latest.createdAt, rank: latestMaps?.rank ?? null, found: latestMaps?.found ?? false, rating: latestRep?.rating ?? null, reviews: latestRep?.reviews ?? null } : null,
          grid: latestGrid && latestGrid.result ? { at: latestGrid.at, result: latestGrid.result } : null,
          cap,
          used: scansUsed,
        }
      : null;
  // This month straight from the tracker, so the overview is never blank between reports
  // (and never blank before the first report, which is the first thing a new client sees).
  const [thisMonth, lastMonth] = await Promise.all([
    monthTraffic(onboarding.id, month, effectiveCloseRate(tracking)),
    monthTraffic(onboarding.id, previous, effectiveCloseRate(tracking)),
  ]);
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
      { month, label: `${monthLabel(month)} so far`, rows: thisLeads },
      { month: previous, label: monthLabel(previous), rows: lastLeads },
    ],
    upgradeRequest,
    billing,
    businessEmail,
    ownerEmail: CLIENT_REPLY_TO,
    ranking,
    live: hasTraffic(thisMonth) ? { month, traffic: thisMonth, prev: hasTraffic(lastMonth) ? lastMonth : null } : null,
  };
}
