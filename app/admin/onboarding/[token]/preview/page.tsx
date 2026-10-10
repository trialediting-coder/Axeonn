// app/admin/onboarding/[token]/preview/page.tsx
// "View as client": the exact AxeonPROOF dashboard this client sees, rendered
// for the admin. No client session involved, nothing is sent. Marking a lead
// here saves through the admin API, on the client's behalf. Sits under /admin
// so middleware's admin gate applies.
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOnboardingByToken } from '@/lib/onboarding';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { loadDashboardData } from '@/lib/proofDashboardData';
import { isProofTab } from '@/lib/proofTabs';

export const dynamic = 'force-dynamic';

export default async function ClientPreviewPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');
  const { token } = await params;
  const { tab } = await searchParams;
  const onboarding = await getOnboardingByToken(token).catch(() => null);
  if (!onboarding) notFound();
  const data = await loadDashboardData(onboarding);
  const name = onboarding.businessName || onboarding.clientName || onboarding.clientEmail;
  return <ProofDashboard email={onboarding.clientEmail} {...data} preview={{ label: `Admin preview of ${name}`, backHref: `/admin/onboarding/${token}` }} leadApi={`/api/admin/onboarding/${token}/project`} tab={isProofTab(tab) ? tab : 'overview'} />;
}
