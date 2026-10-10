import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminMain, btn } from '@/components/admin/ui';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { computeProgress, getItemStates, getOnboardingByToken, orderedItems, welcomeUrl } from '@/lib/onboarding';
import { OnboardingDetail } from '@/components/insights/OnboardingDetail';
import { ProjectPanel } from '@/components/insights/ProjectPanel';
import { getProjectDetails, listMonthlyReports, listProjectUpdates, tierHasGuarantee } from '@/lib/projects';
import { trackingOverview } from '@/lib/siteStats';
import { listFeedback } from '@/lib/feedback';
import { noteStatus } from '@/lib/clientNotes';
import { getUpgradeRequest } from '@/lib/upgrades';
import { TIER_LABELS } from '@/data/onboardingItems';

export const dynamic = 'force-dynamic';

export default async function OnboardingDetailPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const { token } = await params;
  const onboarding = await getOnboardingByToken(token).catch(() => null);
  if (!onboarding) notFound();
  const [states, details, updates, reports, tracking, feedback, notes, upgrade] = await Promise.all([
    getItemStates(onboarding.id),
    getProjectDetails(onboarding.id),
    listProjectUpdates(onboarding.id),
    listMonthlyReports(onboarding.id),
    trackingOverview(onboarding.id),
    listFeedback(onboarding.id),
    noteStatus(onboarding.id),
    getUpgradeRequest(onboarding.id),
  ]);

  return (
    <main className={adminMain}>
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/onboarding" className={`${btn('ghost', 'sm')} -ml-3 mb-3`}>
          <ArrowLeft size={14} /> All clients
        </Link>
        {upgrade && upgrade.tier !== onboarding.tier ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
            <b>Wants to move to {TIER_LABELS[upgrade.tier]}.</b> Pressed in their dashboard on {new Date(upgrade.at).toLocaleDateString('en-US')}; they were told it switches on
            within one business day. Set up billing, change their plan, and reply to confirm.
          </div>
        ) : null}
        <OnboardingDetail
          initial={{
            onboarding: { ...onboarding, url: welcomeUrl(onboarding.token) },
            states,
            progress: computeProgress(onboarding.tier, states),
          }}
          items={orderedItems(onboarding.tier)}
        />
        <ProjectPanel token={onboarding.token} initial={{ details, updates, reports, tracking, feedback, notes }} guarantee={tierHasGuarantee(onboarding.tier)} />
      </div>
    </main>
  );
}
