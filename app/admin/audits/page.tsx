import { redirect } from 'next/navigation';
import { adminMain } from '@/components/admin/ui';
import { AuditsConsole, type ClientOption } from '@/components/admin/AuditsConsole';
import { auth } from '@/lib/auth';
import { listProspectAudits, type AuditRow } from '@/lib/audits';
import { isDatabaseConfigured } from '@/lib/db';
import { listOnboardings } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export default async function AuditsAdminPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await auth();
  if (!session) redirect('/admin/login');
  const { id } = await searchParams;

  let audits: AuditRow[] = [];
  let clients: ClientOption[] = [];
  let dbError: string | null = isDatabaseConfigured() ? null : 'Audits need the database (POSTGRES_URL).';
  if (!dbError) {
    try {
      const [a, o] = await Promise.all([listProspectAudits('', 100), listOnboardings(200)]);
      audits = a;
      clients = o.filter((x) => x.status !== 'closed').map((x) => ({ id: x.id, label: x.businessName || x.clientName || x.clientEmail }));
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className={adminMain}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-950">Audits</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Where a business stands on Google and on its own site, measured, not guessed. Run one before a call; attach it when they sign.
          </p>
          {dbError ? <p className="mt-2 text-sm font-semibold text-red-600">{dbError}</p> : null}
        </div>
        <AuditsConsole initial={audits} clients={clients} openId={id ? Number(id) : null} />
      </div>
    </main>
  );
}
