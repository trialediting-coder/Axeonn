// components/proof/BillingTab.tsx
// The client's plan, the card on file, and every invoice, read live from Stripe
// (lib/clientBilling.ts). One button opens Stripe's portal for anything that
// changes money: a new card, a receipt, a cancellation. Server component; the
// button is the only client piece.
import { CreditCard, FileText } from 'lucide-react';
import { TIER_LABELS, type OnboardingTier } from '@/data/onboardingItems';
import { money, type BillingSummary } from '@/lib/clientBilling';
import { TIER_PRICE } from '@/lib/proofTabs';
import { PortalButton } from '@/components/proof/PortalButton';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const INTERVAL = { day: 'day', week: 'week', month: 'month', year: 'year' } as const;
const STATUS: Record<BillingSummary['invoices'][number]['status'], { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  open: { label: 'Due', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  void: { label: 'Voided', cls: 'bg-neutral-100 text-neutral-500 ring-neutral-200' },
  uncollectible: { label: 'Unpaid', cls: 'bg-red-50 text-red-700 ring-red-200' },
};

function planLine(p: NonNullable<BillingSummary['plan']>): string {
  if (p.status === 'canceled') return 'This plan has ended.';
  if (p.cancelAtPeriodEnd && p.periodEnd) return `Ends ${day(p.periodEnd)}. Nothing is charged after that.`;
  if (p.status === 'past_due' || p.status === 'unpaid') return 'The last payment did not go through. Update the card below and it retries on its own.';
  if (p.status === 'trialing' && p.periodEnd) return `Trial. First charge ${day(p.periodEnd)}.`;
  if (p.status === 'paused') return 'Paused. Nothing is charged while it is paused.';
  return p.periodEnd ? `Renews ${day(p.periodEnd)}.` : 'Renews automatically.';
}

export function BillingTab({
  billing,
  tier,
  agreementUrl,
  preview,
  ownerEmail,
}: {
  billing: BillingSummary | null;
  tier: OnboardingTier;
  agreementUrl: string | null;
  preview: boolean;
  ownerEmail: string;
}) {
  const plan = billing?.plan ?? null;
  const unpaid = billing && billing.due > 0;
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Included in your plan</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">Billing</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">Your plan, the card on file, and every invoice. Receipts download from here any time; nothing to ask us for.</p>

      {unpaid ? (
        <div className="mt-4 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">{money(billing.due, billing.currency)} is due.</span> Open the invoice below to pay it, or update the card and it retries on its own.
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <p className="text-sm font-medium text-neutral-600">Your plan</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">{plan ? plan.name : TIER_LABELS[tier]}</p>
          {plan ? (
            <p className="mt-1 text-sm text-neutral-600">
              {money(plan.amount, plan.currency)} per {INTERVAL[plan.interval]} · {planLine(plan)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">
              {billing ? 'No monthly plan is running through the card on file.' : `${money(TIER_PRICE[tier])} per month. Billing is handled by Axeon; your invoices will appear here once the first one is sent.`}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            {billing?.card ? (
              <span className="inline-flex items-center gap-2 text-neutral-700">
                <CreditCard size={16} className="text-neutral-400" />
                <span className="capitalize">{billing.card.brand}</span> ending {billing.card.last4} · expires {String(billing.card.expMonth).padStart(2, '0')}/{String(billing.card.expYear).slice(-2)}
              </span>
            ) : billing ? (
              <span className="inline-flex items-center gap-2 text-neutral-500">
                <CreditCard size={16} className="text-neutral-400" /> No card on file yet
              </span>
            ) : null}
            {agreementUrl ? (
              <a href={agreementUrl} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
                <FileText size={16} /> Your signed agreement
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-neutral-950">Manage billing</p>
          <p className="mt-1 text-sm text-neutral-600">Change the card, download receipts, or update the billing email. Opens Stripe, our payment provider, and brings you back here.</p>
          <div className="mt-4">
            {billing ? (
              <PortalButton label="Open billing" preview={preview} />
            ) : (
              <p className="text-sm text-neutral-500">
                This opens once your first invoice is on file. Questions now: <a href={`mailto:${ownerEmail}`} className="font-semibold text-blue-600 hover:text-blue-700">{ownerEmail}</a>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-950">Invoices</h3>
          {billing ? <span className="text-xs text-neutral-500">{billing.invoices.length} on file</span> : null}
        </div>
        {billing && billing.invoices.length > 0 ? (
          <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
            {billing.invoices.map((i) => {
              const st = STATUS[i.status];
              return (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{day(i.date)}</p>
                    <p className="text-xs text-neutral-500">{i.number ?? i.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                    <span className="w-20 text-right font-semibold text-neutral-950">{money(i.amount, i.currency)}</span>
                    {i.url ? (
                      <a href={i.url} target="_blank" rel="noopener" className="font-semibold text-blue-600 hover:text-blue-700">
                        {i.status === 'open' ? 'Pay' : 'View'}
                      </a>
                    ) : null}
                    {i.pdf ? (
                      <a href={i.pdf} className="font-semibold text-neutral-500 hover:text-neutral-800">
                        PDF
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border-t border-neutral-100 px-5 py-8 text-center text-sm text-neutral-500">
            {billing ? 'No invoices yet.' : 'Invoices show up here from the first one on.'}
          </p>
        )}
      </div>
    </div>
  );
}
