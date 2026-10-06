import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { listOnboardings, welcomeUrl } from '@/lib/onboarding';
import { OnboardingBoard, type BoardRow } from '@/components/insights/OnboardingBoard';

// Gated by middleware.ts like the rest of /admin, and always live.
export const dynamic = 'force-dynamic';

export default async function OnboardingAdminPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  let rows: BoardRow[] = [];
  let dbError: string | null = null;
  const databaseConfigured = isDatabaseConfigured();
  if (databaseConfigured) {
    try {
      rows = (await listOnboardings(100)).map((o) => ({ ...o, url: welcomeUrl(o.token) }));
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Client onboarding</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Every client&apos;s setup portal, what they have finished, and what is waiting on you. Nothing here is public.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-sm font-semibold transition-colors"
          >
            Back to admin
          </Link>
        </div>
        <OnboardingBoard initialRows={rows} databaseConfigured={databaseConfigured} dbError={dbError} />
      </div>
    </main>
  );
}
