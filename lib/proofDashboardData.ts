// lib/proofDashboardData.ts
// Everything the AxeonPROOF dashboard shows for one client, loaded once here so
// the client's own page (app/proof) and the admin's "View as client" preview
// (app/admin/onboarding/[token]/preview) render the exact same thing.
import { TIER_LABELS } from '@/data/onboardingItems';
import { agreementUrl, latestSignedAgreementFor } from '@/lib/agreements';
import { computeProgress, getItemStates, orderedItems, welcomeUrl, type Onboarding } from '@/lib/onboarding';
import { getProjectDetails, guaranteeDay, listMonthlyReports, listProjectUpdates, tierHasGuarantee } from '@/lib/projects';
import type { ProofDashboard } from '@/components/proof/ProofDashboard';
import type { ComponentProps } from 'react';

export type DashboardData = Omit<ComponentProps<typeof ProofDashboard>, 'email' | 'preview'>;

export async function loadDashboardData(onboarding: Onboarding): Promise<DashboardData> {
  const [states, details, updates, reports, agreement] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
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
  };
}
