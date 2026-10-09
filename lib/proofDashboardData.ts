// lib/proofDashboardData.ts
// Everything the AxeonPROOF dashboard shows for one client, loaded once here so
// the client's own page (app/proof) and the admin's "View as client" preview
// (app/admin/onboarding/[token]/preview) render the exact same thing.
import { TIER_LABELS } from '@/data/onboardingItems';
import { agreementUrl, latestSignedAgreementFor } from '@/lib/agreements';
import { computeProgress, getItemStates, orderedItems, welcomeUrl, type Onboarding } from '@/lib/onboarding';
import { getProjectDetails, guaranteeDay, listMonthlyReports, listProjectUpdates, tierHasGuarantee } from '@/lib/projects';
import { monthLabel } from '@/lib/projectsShared';
import { getTrackingSettings, leadRows, monthOf, previousMonth } from '@/lib/siteStats';
import type { ProofDashboard } from '@/components/proof/ProofDashboard';
import type { ComponentProps } from 'react';

export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview' | 'leadApi'>;

export async function loadDashboardData(onboarding: Onboarding): Promise<DashboardData> {
  const month = monthOf();
  const previous = previousMonth(month);
  const [states, details, updates, reports, agreement, tracking, thisLeads, lastLeads] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
    getTrackingSettings(onboarding.id),
    leadRows(onboarding.id, month),
    leadRows(onboarding.id, previous),
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
    // Live from the events table, not the saved report, so a lead shows up the day it happens.
    leads: [
      { month, label: `${monthLabel(month)} so far`, rows: thisLeads },
      { month: previous, label: monthLabel(previous), rows: lastLeads },
    ],
  };
}
