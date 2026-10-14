// app/proof/page.tsx
// app.axeonstudio.co: the AxeonPROOF welcome / sign-in page, or the client's
// dashboard once they are signed in. ?contact=<id> opens one lead in the inbox
// (the link a lead notification opens).
import { getSignedInClient } from '@/lib/proofServer';
import { getOnboardingById } from '@/lib/onboarding';
import { ProofAuthShell } from '@/components/proof/ProofAuthShell';
import { SignInForm } from '@/components/proof/ProofForms';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { loadDashboardData } from '@/lib/proofDashboardData';
import { isProofTab } from '@/lib/proofTabs';
import { parseContactId } from '@/lib/contactsShared';

export const dynamic = 'force-dynamic';

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ tab?: string; contact?: string }> }) {
  const { tab, contact } = await searchParams;
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
  const data = await loadDashboardData(onboarding, key, { contactId: parseContactId(contact) });
  return (
    <ProofDashboard
      email={account.email}
      {...data}
      leadApi="/api/proof/leads"
      stageApi="/api/proof/leads/stage"
      inboxApi="/api/proof/inbox"
      scanApi="/api/proof/scan"
      tab={key}
    />
  );
}
