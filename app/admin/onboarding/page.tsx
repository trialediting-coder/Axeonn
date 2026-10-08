import { adminMain } from '@/components/admin/ui';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { listOnboardings, welcomeUrl } from '@/lib/onboarding';
import { OnboardingBoard, type BoardRow } from '@/components/insights/OnboardingBoard';
import { ensureSelfOnboarding } from '@/lib/selfTracking';

// Gated by middleware.ts like the rest of /admin, and always live.
export const dynamic = 'force-dynamic';

export default async function OnboardingAdminPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  let rows: BoardRow[] = [];
  let selfToken: string | null = null;
  let dbError: string | null = null;
  const databaseConfigured = isDatabaseConfigured();
  if (databaseConfigured) {
    try {
      // Our own site's record, created the first time this page or the tracker needs it.
      selfToken = (await ensureSelfOnboarding())?.token ?? null;
      rows = (await listOnboardings(100)).map((o) => ({ ...o, url: welcomeUrl(o.token) }));
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-950">Client onboarding</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Every client&apos;s setup portal, what they have finished, and what is waiting on you.
          </p>
        </div>
        <OnboardingBoard initialRows={rows} selfToken={selfToken} databaseConfigured={databaseConfigured} dbError={dbError} />
      </div>
    </main>
  );
}
