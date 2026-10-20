import type { Metadata } from 'next';
import Link from 'next/link';
import { isStripeConfigured } from '@/lib/stripe';
import { getCheckoutSummary, type CheckoutSummary } from '@/lib/billing';
import { formatCents } from '@/lib/billingMath';
import { findOnboardingForCheckout, welcomeUrl, type Onboarding } from '@/lib/onboarding';
import { setupMinutes } from '@/data/onboardingItems';
import PurchaseTracker from '@/components/pay/PurchaseTracker';

// Display only. Fulfillment and notifications run from the Stripe webhook
// (app/api/stripe/webhook/route.ts); this page may never be reached.
//
// Friction audit 2026-10-19 (P2, P3): a $0 checkout (card on file, first month at
// go-live) never says "Payment received $0.00"; and when the webhook has already
// opened the client's setup page, it links straight there instead of a dead end.
export const metadata: Metadata = {
  title: 'You are signed up | Axeon Studio',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

const PHONE = '(515) 493-8017';
const PHONE_HREF = 'tel:+15154938017';

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  const validSession = Boolean(sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId));
  let summary: CheckoutSummary | null = null;
  if (validSession && isStripeConfigured()) {
    try {
      summary = await getCheckoutSummary(sessionId!);
    } catch {
      summary = null;
    }
  }

  // The webhook usually opens the setup page before the client lands here; when it
  // has, link to it so they can start now (the session id is the credential Stripe
  // gave this browser, and the setup page still asks for its own email code).
  let onboarding: Onboarding | null = null;
  if (validSession && summary?.status === 'complete') {
    onboarding = await findOnboardingForCheckout(sessionId!).catch(() => null);
  }
  const minutes = onboarding ? setupMinutes(onboarding.tier).firstRound : null;

  const paid = summary?.paymentStatus === 'paid' || summary?.paymentStatus === 'no_payment_required';
  const processing = !paid && summary?.status === 'complete';
  const nothingCharged = paid && summary?.amountTotalCents === 0;
  const headline = nothingCharged
    ? "You're signed. Nothing was charged today."
    : paid
      ? 'Payment received'
      : processing
        ? 'Payment is processing'
        : 'Thank you';
  const amount =
    summary?.amountTotalCents != null && !nothingCharged
      ? formatCents(summary.amountTotalCents, summary.currency ?? 'usd')
      : null;
  const setupLine = minutes
    ? `Your setup page takes about ${minutes} minutes, and you can do it from your phone.`
    : 'Your setup page takes a few minutes, and you can do it from your phone.';

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 sm:px-10 bg-neutral-950 text-white">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-sm font-mono uppercase tracking-wider text-blue-400 mb-4">Axeon Studio</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-6">{headline}</h1>
        {amount && <p className="text-lg text-neutral-200 mb-4">{amount}</p>}
        {paid && sessionId && summary?.amountTotalCents != null && (
          <PurchaseTracker
            transactionId={sessionId}
            valueCents={summary.amountTotalCents}
            currency={summary.currency ?? 'usd'}
          />
        )}

        {nothingCharged ? (
          <div className="text-left rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="font-semibold text-white">What happens next</p>
            <ol className="mt-3 space-y-2.5 text-neutral-300 leading-relaxed list-decimal pl-5">
              <li>{setupLine} It tells us what we need to start building.</li>
              <li>We build your site and intake system and test every call and inquiry path.</li>
              <li>
                Your first month is billed the day your system goes live. Your card stays on file only for that, so
                there is no other form to fill in.
              </li>
            </ol>
          </div>
        ) : (
          <p className="text-neutral-300 leading-relaxed">
            {paid &&
              `Your payment to Axeon Studio went through. A receipt and your private setup link are on their way to the email you entered at checkout. ${setupLine}`}
            {processing &&
              'Bank payments can take a few business days to clear. You will get an email receipt as soon as it settles.'}
            {!paid && !processing && 'Your checkout is complete. A confirmation email will follow.'}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {onboarding && onboarding.status !== 'closed' ? (
            <a
              href={welcomeUrl(onboarding.token)}
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Start your setup now
            </a>
          ) : (
            <Link
              href="/"
              className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Back to the site
            </Link>
          )}
          <a
            href={PHONE_HREF}
            className="px-7 py-3.5 rounded-full border border-white/20 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
          >
            Call {PHONE}
          </a>
        </div>
        <p className="mt-8 text-sm text-neutral-400">
          {onboarding
            ? 'The same setup link is in your email, so you can also start later on any device.'
            : 'Your setup link is on its way to the email you entered at checkout.'}{' '}
          Questions? Reply to that email or call us.
        </p>
      </div>
    </main>
  );
}
