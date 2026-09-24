import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isStripeConfigured } from '@/lib/stripe';
import { isDatabaseConfigured } from '@/lib/db';
import { listBillingRecords, type BillingRecord } from '@/lib/billingRecords';
import { ADDON_KEYS, CATALOG, PLANS, PLAN_KEYS, TIER_KEYS, automaticTaxEnabled, depositPercent } from '@/lib/billing';
import { listPayLinks, payLinkState, payLinkUrl } from '@/lib/payLinks';
import { BillingConsole, type PayLinkItem } from '@/components/insights/BillingConsole';

// Gated by middleware.ts like the rest of /insights/admin, and always live.
export const dynamic = 'force-dynamic';

export default async function BillingAdminPage() {
  const session = await auth();
  if (!session) redirect('/insights/admin/login');

  let records: BillingRecord[] = [];
  let payLinks: PayLinkItem[] = [];
  let dbError: string | null = null;
  const databaseConfigured = isDatabaseConfigured();
  if (databaseConfigured) {
    try {
      const [recordRows, linkRows] = await Promise.all([listBillingRecords(50), listPayLinks(50)]);
      records = recordRows;
      payLinks = linkRows.map((l) => ({
        token: l.token,
        url: payLinkUrl(l.token),
        state: payLinkState(l),
        clientEmail: l.clientEmail,
        clientName: l.clientName,
        kind: l.kind,
        tier: l.tier,
        addOns: l.addOns,
        planKey: l.planKey,
        monthlyAmountCents: l.monthlyAmountCents,
        planName: l.planName,
        note: l.note,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
      }));
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main className="w-full min-h-screen pt-16 pb-24 px-6 sm:px-10 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Billing</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Payment links, invoices, and recurring plans. Nothing here is public.
            </p>
          </div>
          <Link
            href="/insights/admin"
            className="px-4 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-sm font-semibold transition-colors"
          >
            Back to admin
          </Link>
        </div>

        <BillingConsole
          stripeConfigured={isStripeConfigured()}
          databaseConfigured={databaseConfigured}
          dbError={dbError}
          records={records}
          payLinks={payLinks}
          depositPercent={depositPercent()}
          automaticTax={automaticTaxEnabled()}
          portalLoginUrl={process.env.STRIPE_PORTAL_LOGIN_URL ?? null}
          catalog={{
            tiers: TIER_KEYS.map((key) => ({ key, label: CATALOG[key].label })),
            addOns: ADDON_KEYS.map((key) => ({ key, label: CATALOG[key].label })),
          }}
          plans={PLAN_KEYS.map((key) => ({ key, label: PLANS[key].label, amountCents: PLANS[key].amountCents }))}
        />
      </div>
    </main>
  );
}
