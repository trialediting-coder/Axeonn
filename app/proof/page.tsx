// app/proof/page.tsx
// app.axeonstudio.co: the AxeonPROOF welcome / sign-in page, or the client's
// dashboard once they are signed in.
import { getSignedInClient } from '@/lib/proofServer';
import { computeProgress, getItemStates, getOnboardingById, orderedItems, welcomeUrl } from '@/lib/onboarding';
import { TIER_LABELS } from '@/data/onboardingItems';
import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { SignInForm } from '@/components/proof/ProofForms';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { getProjectDetails, guaranteeDay, listMonthlyReports, listProjectUpdates, tierHasGuarantee } from '@/lib/projects';
import { agreementUrl, latestSignedAgreementFor } from '@/lib/agreements';

export const dynamic = 'force-dynamic';

export default async function ProofPage() {
  const account = await getSignedInClient();
  const onboarding = account ? await getOnboardingById(account.onboardingId).catch(() => null) : null;

  if (!account || !onboarding) {
    return (
      <ProofAuthShell title="Welcome back" subtitle="Sign in with your business email and password.">
        <SignInForm />
      </ProofAuthShell>
    );
  }

  const [states, details, updates, reports, agreement] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    latestSignedAgreementFor(onboarding.clientEmail).catch(() => null),
  ]);
  return (
    <ProofDashboard
      email={account.email}
      onboarding={onboarding}
      progress={computeProgress(onboarding.tier, states)}
      planLabel={TIER_LABELS[onboarding.tier]}
      axeonItems={orderedItems(onboarding.tier).axeon}
      states={states}
      setupUrl={welcomeUrl(onboarding.token)}
      details={details}
      updates={updates}
      reports={reports}
      guarantee={tierHasGuarantee(onboarding.tier)}
      guaranteeDay={guaranteeDay(details.kickoffAt)}
      agreementUrl={agreement ? agreementUrl(agreement.token) : null}
    />
  );
}
