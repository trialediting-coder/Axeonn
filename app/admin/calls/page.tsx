import { redirect } from 'next/navigation';
import { adminMain } from '@/components/admin/ui';
import { CallDeck } from '@/components/admin/CallDeck';
import { auth } from '@/lib/auth';
import { listCallLeads, type CallLead } from '@/lib/callLeads';
import { isDatabaseConfigured } from '@/lib/db';
import { latestAuditByLead } from '@/lib/audits';
import type { AuditSummary } from '@/lib/auditShared';

export const dynamic = 'force-dynamic';

export default async function CallsAdminPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  let leads: CallLead[] = [];
  let audits: Record<string, AuditSummary> = {};
  let dbError: string | null = isDatabaseConfigured() ? null : 'The call deck needs the database (POSTGRES_URL).';
  if (!dbError) {
    try {
      leads = await listCallLeads();
      audits = Object.fromEntries(await latestAuditByLead());
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-950">Calls</h1>
          <p className="mt-1 text-sm text-neutral-600">
            One prospect at a time. Dial, mark what happened, jot a note, flip to the next. Best fits (A) come first.
          </p>
        </div>
        <CallDeck initialLeads={leads} dbError={dbError} initialAudits={audits} />
      </div>
    </main>
  );
}
