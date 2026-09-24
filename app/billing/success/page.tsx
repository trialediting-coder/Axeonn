import type { Metadata } from 'next';
import Link from 'next/link';
import { isStripeConfigured } from '@/lib/stripe';
import { getCheckoutSummary, type CheckoutSummary } from '@/lib/billing';
import { formatCents } from '@/lib/billingMath';

// Display only. Fulfillment and notifications run from the Stripe webhook
// (app/api/stripe/webhook/route.ts); this page may never be reached.
export const metadata: Metadata = {
  title: 'Payment confirmation | Axeon Studio',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let summary: CheckoutSummary | null = null;
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId) && isStripeConfigured()) {
    try {
      summary = await getCheckoutSummary(sessionId);
    } catch {
      summary = null;
    }
  }

  const paid = summary?.paymentStatus === 'paid' || summary?.paymentStatus === 'no_payment_required';
  const processing = !paid && summary?.status === 'complete';
  const headline = paid ? 'Payment received' : processing ? 'Payment is processing' : 'Thank you';
  const amount =
    summary?.amountTotalCents != null ? formatCents(summary.amountTotalCents, summary.currency ?? 'usd') : null;

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 sm:px-10 bg-neutral-950 text-white">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">Axeon Studio</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-6">{headline}</h1>
        {amount && <p className="text-lg text-neutral-200 mb-4">{amount}</p>}
        <p className="text-neutral-300 leading-relaxed">
          {paid &&
            'Your payment to Axeon Studio went through. A receipt is on its way to the email you entered at checkout.'}
          {processing &&
            'Bank payments can take a few business days to clear. You will get an email receipt as soon as it settles.'}
          {!paid && !processing && 'Your checkout is complete. A confirmation email will follow.'}
        </p>
        <p className="mt-8 text-sm text-neutral-400">
          Questions about this payment? Reply to your receipt email or reach us through the site.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            Back to the site
          </Link>
        </div>
      </div>
    </main>
  );
}
