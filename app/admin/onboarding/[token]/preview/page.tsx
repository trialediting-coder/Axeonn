// app/admin/onboarding/[token]/preview/page.tsx
// "View as client": the exact AxeonPROOF dashboard this client sees, rendered
// for the admin. Read-only, no client session involved, nothing is sent. Sits
// under /admin so middleware's admin gate applies.
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getOnboardingByToken } from '@/lib/onboarding';
import { ProofDashboard } from '@/components/proof/ProofDashboard';
import { loadDashboardData } from '@/lib/proofDashboardData';

export const dynamic = 'force-dynamic';

export default async function ClientPreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');
  const { token } = await params;
  const onboarding = await getOnboardingByToken(token).catch(() => null);
  if (!onboarding) notFound();
  const data = await loadDashboardData(onboarding);
  const name = onboarding.businessName || onboarding.clientName || onboarding.clientEmail;
  return <ProofDashboard email={onboarding.clientEmail} {...data} preview={{ label: `Admin preview of ${name}`, backHref: `/admin/onboarding/${token}` }} />;
}
