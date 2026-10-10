// app/admin/data/page.tsx
// The owner's view of every client's data on one page (lib/ownerData.ts,
// components/insights/OwnerDataTable.tsx).
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { adminMain } from '@/components/admin/ui';
import { OwnerDataTable } from '@/components/insights/OwnerDataTable';
import { ownerOverview } from '@/lib/ownerData';

export const dynamic = 'force-dynamic';

export default async function OwnerDataPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');
  if (!isDatabaseConfigured()) {
    return (
      <main className={adminMain}>
        <p className="mx-auto max-w-2xl text-sm text-neutral-600">No database attached yet, so there is no client data to show.</p>
      </main>
    );
  }
  const data = await ownerOverview();
  return (
    <main className={adminMain}>
      <OwnerDataTable data={data} />
    </main>
  );
}
