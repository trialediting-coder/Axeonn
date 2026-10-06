import Link from 'next/link';
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
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-950">Onboarding</h1>
          <Link
            href="/admin/onboarding"
            className="px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-sm font-semibold transition-colors"
          >
            All clients
          </Link>
        </div>
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
