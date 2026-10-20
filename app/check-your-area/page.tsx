import LineIcon from '@/components/common/LineIcon';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, MessageSquareText, PhoneOff, Phone, Star } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd, JsonLd } from '@/components/common/JsonLd';
import { AreaCheckRequest } from '@/components/area-check/AreaCheckRequest';
import { SetupPrice } from '@/components/common/SetupPrice';
import { COMPLIANCE_LINE, EXCLUSIVITY_LINE, OFFER_LINE, OFFER_POINTS } from '@/data/pricingData';

// The area check: the primary CTA across the site (2026-10-19, replaces the free
// after-hours audit as the hook; /audit and /get-started redirect here). The form
// posts to /api/get-started/lead with packageId 'area-check'.
//
// Layout (owner, 2026-10-20, after Scorpion's contact page): the first screen has
// one job, the lead. A short headline and the form, nothing else; anyone who
// needs more convincing scrolls to the offer, what we test and the questions.
// Exclusivity is a policy that protects the client: no countdowns, no "spots left".
export const metadata: Metadata = buildMetadata({
  path: '/check-your-area',
  title: 'Check If Your Area Is Open | Axeon Studio',
  description:
    "One dental practice, med spa, law firm or CPA firm per specialty within 5 miles. See if your Iowa area is open. $0 to start. Nothing due until it's working.",
});

const PROOF = [
  { icon: PhoneOff, title: 'An after-hours test call', body: 'What a new patient or client gets when they call after hours.' },
  { icon: MessageSquareText, title: 'Your website reply speed', body: 'How long the first reply to your website form takes.' },
  { icon: Star, title: 'Reviews vs. the top 3 nearby', body: 'Your Google rating next to the three that show up first.' },
];

const FAQS = [
  {
    q: 'Is it really $0 to start?',
    a: "Yes. On the 12-month agreement setup is $0 (normally $3,000), and your first monthly payment is charged only once your system is live and working. Nothing is due while we build. If you'd rather go month-to-month, the $3,000 is paid upfront instead.",
  },
  {
    q: "What does 'working' mean?",
    a: 'Your new site is live, and every missed call and web inquiry gets a reply within 60 seconds, 24/7. After that, the 90-day performance commitment applies: if we miss it and do not fix it within 15 days, you can walk away and owe nothing for the rest of the term.',
  },
  {
    q: 'What if my area is taken?',
    a: "We'll tell you plainly. We can put you on the list for your area, and if you have an office in a nearby area we can check that instead. Another specialty isn't affected: a dental practice next to a law firm we work with is still open.",
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function CheckYourAreaPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <BreadcrumbJsonLd items={[{ name: 'Check Your Area', path: '/check-your-area' }]} />
      <JsonLd data={faqJsonLd} />

      {/* Purpose: the lead. Headline and form only. */}
      <section className="relative isolate overflow-hidden bg-neutral-950 text-white pt-24 sm:pt-36 pb-10 sm:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,rgb(37_99_235/0.28),transparent_60%)]"
        />
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <h1 className="text-[32px] sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight leading-[1.06]">
              Is your area still&nbsp;open?
            </h1>
            <p className="mt-3 sm:mt-5 text-[15px] sm:text-xl text-neutral-300 leading-relaxed max-w-md">
              {EXCLUSIVITY_LINE} We&apos;ll confirm within one business&nbsp;day.
            </p>
            <a
              href="tel:+15154938017"
              className="mt-6 hidden lg:inline-flex items-center gap-2 text-base font-semibold text-neutral-300 hover:text-white transition-colors"
            >
              <Phone size={17} className="text-blue-400" /> Rather talk now? (515) 493-8017
            </a>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-[24px] sm:rounded-[32px] bg-white text-neutral-950 shadow-2xl shadow-black/40 p-4 sm:p-8 lg:p-10">
              <AreaCheckRequest source="check_your_area" />
            </div>
          </div>
        </div>
      </section>

      {/* Below the fold: for anyone who wants more before they send it. */}
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-14 py-10 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Purpose: the offer and what we test on the call. */}
        <section aria-labelledby="area-offer">
          <h2 id="area-offer" className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight">
            {OFFER_LINE}
          </h2>
          <p className="mt-2 text-base sm:text-lg text-neutral-700">
            <SetupPrice />
          </p>
          <ul className="mt-4 space-y-2">
            {OFFER_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[15px] sm:text-base text-neutral-600 leading-relaxed">
                <LineIcon>
                  <Check size={16} strokeWidth={3} className="text-blue-600" />
                </LineIcon>
                {point}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 sm:mt-12 text-lg sm:text-xl font-bold tracking-tight">What we show you on the call</h3>
          <ul className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {PROOF.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <LineIcon>
                  <Icon size={20} className="text-blue-600" />
                </LineIcon>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-[15px] sm:text-base text-neutral-600 leading-snug">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Purpose: the three questions people ask before they submit. */}
        <section aria-labelledby="area-faq">
          <h2 id="area-faq" className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight">
            Questions before you check
          </h2>
          <dl className="mt-3 sm:mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
            {FAQS.map((f) => (
              <div key={f.q} className="py-3.5 sm:py-5">
                <dt className="text-base sm:text-lg font-bold text-neutral-950">{f.q}</dt>
                <dd className="mt-1 sm:mt-1.5 text-[15px] sm:text-base text-neutral-600 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 sm:mt-6 text-[15px] sm:text-base text-neutral-600">
            Already know you want to talk?{' '}
            <Link href="/book" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
              Book a call
            </Link>{' '}
            or call{' '}
            <a href="tel:+15154938017" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
              (515) 493-8017
            </a>
            .
          </p>
          <p className="mt-6 text-xs sm:text-sm text-neutral-500 leading-relaxed">
            For dental practices, med spas, law firms and accounting and CPA firms. {COMPLIANCE_LINE}
          </p>
        </section>
      </div>
    </main>
  );
}
