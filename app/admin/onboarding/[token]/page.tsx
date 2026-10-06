import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminMain, btn } from '@/components/admin/ui';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { computeProgress, getItemStates, getOnboardingByToken, orderedItems, welcomeUrl } from '@/lib/onboarding';
import { OnboardingDetail } from '@/components/insights/OnboardingDetail';

export const dynamic = 'force-dynamic';

export default async function OnboardingDetailPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const { token } = await params;
  const onboarding = await getOnboardingByToken(token).catch(() => null);
  if (!onboarding) notFound();
  const states = await getItemStates(onboarding.id);

  return (
    <main className={adminMain}>
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/onboarding" className={`${btn('ghost', 'sm')} -ml-3 mb-3`}>
          <ArrowLeft size={14} /> All clients
        </Link>
        <OnboardingDetail
          initial={{
            onboarding: { ...onboarding, url: welcomeUrl(onboarding.token) },
            states,
            progress: computeProgress(onboarding.tier, states),
          }}
          items={orderedItems(onboarding.tier)}
        />
      </div>
    </main>
  );
}
