import { redirect } from 'next/navigation';
import { adminMain } from '@/components/admin/ui';
import { AgreementsConsole, type AgreementRow } from '@/components/admin/AgreementsConsole';
import { AGREEMENT_ADD_ONS, AXEON_ENTITY_OPTIONS, ENTITY_TYPES, PLAN_DEFAULT_FEES } from '@/data/agreementTemplate';
import { ONBOARDING_TIERS, TIER_LABELS } from '@/data/onboardingItems';
import { auth } from '@/lib/auth';
import { agreementUrl, listAgreements } from '@/lib/agreements';
import { isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AgreementsAdminPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  let rows: AgreementRow[] = [];
  let dbError: string | null = isDatabaseConfigured() ? null : 'Agreements need the database (POSTGRES_URL).';
  if (!dbError) {
    try {
      rows = (await listAgreements()).map((a) => ({ ...a, url: agreementUrl(a.token) }));
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className={adminMain}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-950">Agreements</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Fill in the client&apos;s details. They get an email, sign online, pay, and their onboarding starts automatically.
          </p>
        </div>
        <AgreementsConsole
          initialRows={rows}
          dbError={dbError}
          options={{
            tiers: ONBOARDING_TIERS.map((t) => ({
              value: t,
              label: TIER_LABELS[t],
              setup: PLAN_DEFAULT_FEES[t].setupCents,
              monthly: PLAN_DEFAULT_FEES[t].monthlyCents,
            })),
            entityTypes: ENTITY_TYPES,
            axeonEntities: AXEON_ENTITY_OPTIONS,
            addOns: AGREEMENT_ADD_ONS,
          }}
        />
      </div>
    </main>
  );
}
