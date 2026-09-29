import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Mail } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { FALLBACK_CONTACT_EMAIL } from '@/data/getStartedPackages';

// Stripe Payment Links redirect here after a successful deposit
// (set "After payment → Don't show confirmation page → redirect" on each link).
export const metadata: Metadata = {
  ...buildMetadata({
    path: '/get-started/success',
    title: 'Payment Received | Axeon Studio',
    description: 'Your Axeon Studio deposit was received. Next steps are on the way to your inbox.',
  }),
  robots: { index: false, follow: false },
};

export default function GetStartedSuccessPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950 pt-28 sm:pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-6 sm:px-10">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-8 sm:p-10 shadow-xs text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <CheckCircle2 size={28} className="stroke-[2.2]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Payment received.</h1>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            Check your inbox within 15 minutes for next steps.
          </p>

          <div className="mt-8 rounded-2xl bg-neutral-50 border border-neutral-200 p-5 text-left flex items-start gap-3">
            <Mail size={19} className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-base text-neutral-700 leading-relaxed">
              Nothing yet? Check spam or promotions, then email us at{' '}
              <a
                href={`mailto:${FALLBACK_CONTACT_EMAIL}?subject=Deposit%20paid%20-%20next%20steps`}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                {FALLBACK_CONTACT_EMAIL}
              </a>{' '}
              or call{' '}
              <a href="tel:+15154938017" className="font-semibold text-blue-600 hover:text-blue-700 font-mono">
                (515) 493-8017
              </a>
              .
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-base font-semibold text-neutral-600 hover:text-neutral-950 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
