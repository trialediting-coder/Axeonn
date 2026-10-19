import { redirect } from 'next/navigation';
import { adminMain } from '@/components/admin/ui';
import { PartnersConsole } from '@/components/admin/PartnersConsole';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { listPartners } from '@/lib/partners';
import { PARTNER_BRIEF_PATH, type Partner } from '@/lib/partnersShared';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function PartnersAdminPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  let partners: Partner[] = [];
  let dbError: string | null = isDatabaseConfigured() ? null : 'Partners need the database (POSTGRES_URL).';
  if (!dbError) {
    try {
      partners = await listPartners();
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-950">Partners</h1>
          <p className="mt-1 text-sm text-neutral-600">
            CPAs, practice consultants and billing firms who send us practices. Track who has the brief, who signed, what they referred, and the 15% share owed each month.
          </p>
        </div>
        <PartnersConsole initialPartners={partners} dbError={dbError} briefUrl={`${SITE_URL}${PARTNER_BRIEF_PATH}`} />
      </div>
    </main>
  );
}
