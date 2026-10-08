// app/proof/page.tsx
// app.axeonstudio.co: the AxeonPROOF welcome / sign-in page, or the client's
// dashboard once they are signed in.
import { getSignedInClient } from '@/lib/proofServer';
import { getOnboardingById } from '@/lib/onboarding';
import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { SignInForm } from '@/components/proof/ProofForms';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { loadDashboardData } from '@/lib/proofDashboardData';

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

  return <ProofDashboard email={account.email} {...(await loadDashboardData(onboarding))} />;
}
