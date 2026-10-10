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
import { getUpgradeRequest } from '@/lib/upgrades';
import type { ProofDashboard } from '@/components/proof/ProofDashboard';
import type { ComponentProps } from 'react';

export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview' | 'leadApi' | 'tab'>;

export async function loadDashboardData(onboarding: Onboarding): Promise<DashboardData> {
  const month = monthOf();
  const previous = previousMonth(month);
  const [states, details, updates, reports, agreement, tracking, thisLeads, lastLeads, upgradeRequest] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
    getTrackingSettings(onboarding.id),
    leadRows(onboarding.id, month),
    leadRows(onboarding.id, previous),
    getUpgradeRequest(onboarding.id),
  ]);
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
    live: hasTraffic(thisMonth) ? { month, traffic: thisMonth, prev: hasTraffic(lastMonth) ? lastMonth : null } : null,
  };
}
