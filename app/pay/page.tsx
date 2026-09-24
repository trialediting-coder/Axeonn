import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, FileText, CalendarCheck } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { getPublicCatalog, type PublicPlan } from '@/lib/publicCatalog';
import { depositPercent, planForTier } from '@/lib/billing';
import { isStripeConfigured } from '@/lib/stripe';
import { PaymentForm } from '@/components/pay/PaymentForm';

// Public self-serve payment page. Sales stay call-first, so this page is not in
// the header nav and is noindex; it is linked from the footer and from payment
// conversations. Card entry happens on Stripe-hosted Checkout, never here.
export const metadata: Metadata = {
  ...buildMetadata({
    path: '/pay',
    title: 'Make a Payment | Axeon Studio',
    description:
      'Pay your Axeon Studio build deposit, settle a balance, or pay in full through secure Stripe checkout.',
  }),
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function PayPage({ searchParams }: { searchParams: Promise<{ tier?: string }> }) {
  const [{ tier }, catalog] = await Promise.all([searchParams, getPublicCatalog()]);
  const tierPlans: Partial<Record<string, PublicPlan>> = {};
  for (const t of catalog.tiers) {
    const planKey = planForTier(t.key);
    if (planKey) tierPlans[t.key] = catalog.plans[planKey];
  }
  const portalLoginUrl = process.env.STRIPE_PORTAL_LOGIN_URL ?? null;

  return (
    <main className="min-h-screen bg-white text-neutral-950 pt-28 sm:pt-32 pb-24">
      <BreadcrumbJsonLd items={[{ name: 'Make a Payment', path: '/pay' }]} />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <header className="max-w-3xl mb-10 sm:mb-14">
          <p className="text-sm font-mono uppercase tracking-wider text-blue-600 mb-4">Secure payment</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5">
            Make a payment.
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            Reserve your build with a deposit, settle a balance, or pay in full. You choose the scope here and finish on
            Stripe&apos;s secure checkout. Takes about a minute.
          </p>
        </header>

        <PaymentForm
          tiers={catalog.tiers}
          addOns={catalog.addOns}
          tierPlans={tierPlans}
          depositPercent={depositPercent()}
          stripeConfigured={isStripeConfigured()}
          initialTier={tier ?? ''}
        />

        <section
          className="mt-16 sm:mt-24 grid sm:grid-cols-3 gap-5 sm:gap-6"
          aria-label="Other ways to pay or get help"
        >
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileText size={19} className="stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-1.5">Have an invoice or a link from us?</h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Use the <span className="font-semibold text-neutral-900">Pay this invoice</span> button in the email, or
              open the personal link we sent you. Both show your exact amount.
            </p>
            {portalLoginUrl && (
              <a
                href={portalLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Already a client? View invoices &amp; update your card &rarr;
              </a>
            )}
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <CalendarCheck size={19} className="stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-1.5">Not scoped yet?</h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-4">
              Start with a free 20-minute call. You leave with a clear scope and a flat price before paying anything.
            </p>
            <Link
              href="/book"
              className="inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Book a Strategy Call &rarr;
            </Link>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Phone size={19} className="stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold tracking-tight mb-1.5">Questions about a payment?</h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-4">
              Call or text and you get Hayder, not a billing department.
            </p>
            <a
              href="tel:+15154938017"
              className="inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors font-mono"
            >
              (515) 493-8017
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
