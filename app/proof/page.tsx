// app/proof/page.tsx
// app.axeonstudio.co: the AxeonPROOF welcome / sign-in page, or the client's
// dashboard once they are signed in.
import { getSignedInClient } from '@/lib/proofServer';
import { getOnboardingById } from '@/lib/onboarding';
import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { SignInForm } from '@/components/proof/ProofForms';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { loadDashboardData } from '@/lib/proofDashboardData';
import { isProofTab } from '@/lib/proofTabs';

export const dynamic = 'force-dynamic';

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const account = await getSignedInClient();
  const onboarding = account ? await getOnboardingById(account.onboardingId).catch(() => null) : null;

  if (!account || !onboarding) {
    return (
      <ProofAuthShell title="Welcome back" subtitle="Sign in with your business email and password.">
        <SignInForm />
      </ProofAuthShell>
    );
  }

  const key = isProofTab(tab) ? tab : 'overview';
  return <ProofDashboard email={account.email} {...(await loadDashboardData(onboarding, key))} leadApi="/api/proof/leads" tab={key} />;
}
