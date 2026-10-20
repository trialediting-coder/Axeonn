import LineIcon from '@/components/common/LineIcon';
import type { Metadata } from 'next';
import { SetupPrice } from '@/components/common/SetupPrice';
import Link from 'next/link';
import { Check, MapPin, MessageSquareText, PhoneOff, Phone, Star } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd, JsonLd } from '@/components/common/JsonLd';
import { AreaCheckRequest } from '@/components/area-check/AreaCheckRequest';
import { COMPLIANCE_LINE, EXCLUSIVITY_LINE, OFFER_LINE, OFFER_POINTS } from '@/data/pricingData';

// The area check: the primary CTA across the site (2026-10-19, replaces the free
// after-hours audit as the hook; /audit and /get-started redirect here). The form
// posts to /api/get-started/lead with packageId 'area-check'. The after-hours
// test call, website reply speed and reviews comparison are the proof we show on
// the call, not the headline. Exclusivity is a policy that protects the client:
// no countdowns, no "spots left".
export const metadata: Metadata = buildMetadata({
  path: '/check-your-area',
  title: 'Check If Your Area Is Open | Axeon Studio',
  description:
    "One dental practice, med spa, law firm or CPA firm per specialty within 5 miles. See if your Iowa area is open. $0 to start. Nothing due until it's working.",
});

const PROOF = [
  {
    icon: PhoneOff,
    title: 'An after-hours test call',
    body: 'We call your office after hours and see what a new patient or client actually gets: voicemail, a full mailbox, or a reply.',
  },
  {
    icon: MessageSquareText,
    title: 'Your website reply speed',
    body: 'We send an inquiry through your website and time how long the first reply takes, if one comes at all.',
  },
  {
    icon: Star,
    title: 'Reviews vs. the top 3 nearby',
    body: 'Your Google rating and review count next to the three practices or firms in your specialty that show up first near you.',
  },
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
    <main className="min-h-screen bg-neutral-50 text-neutral-950 pt-20 sm:pt-32 pb-12 sm:pb-28">
      <BreadcrumbJsonLd items={[{ name: 'Check Your Area', path: '/check-your-area' }]} />
      <JsonLd data={faqJsonLd} />

      {/* Same container as the header so the edges line up */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-14">
        {/* Phones: both columns use `contents`, so their blocks join one grid and
            reorder (order-*): question, form, offer, what we show, FAQ. On lg+
            the two columns are back, with the left one sticky. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-start">
          {/* Left: the policy, the offer, and what we show on the call */}
          <div className="contents lg:block lg:col-span-5 lg:sticky lg:top-32">
            {/* Purpose: the question this page answers, and the exclusivity policy behind it. */}
            <div className="order-1 lg:order-none">
              <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-2 sm:mb-4">
                [ WEST DES MOINES · CENTRAL IOWA ]
              </p>
              <h1 className="text-[30px] sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight leading-[1.1] sm:leading-[1.08]">
                Is your specialty still open in your area?
              </h1>
              <p className="mt-3 sm:mt-5 text-[15px] sm:text-xl text-neutral-600 leading-relaxed max-w-xl">
                {EXCLUSIVITY_LINE} Tell us where you are and we&apos;ll confirm within one business day.
              </p>
            </div>

            {/* Purpose: the offer, word for word. */}
            <div className="order-3 lg:order-none lg:mt-8 rounded-2xl bg-blue-600 text-white p-5 sm:p-6 shadow-lg shadow-blue-600/20">
              <p className="text-xl sm:text-2xl font-extrabold font-display tracking-tight leading-snug">{OFFER_LINE}</p>
              <p className="mt-1 text-base sm:text-lg text-white">
                <SetupPrice />
              </p>
              <ul className="mt-3 space-y-2">
                {OFFER_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm sm:text-base text-blue-50 leading-relaxed">
                    <LineIcon>
                      <Check size={16} strokeWidth={3} />
                    </LineIcon>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Purpose: the three things we test and show on the call. */}
            <div className="order-4 lg:order-none lg:mt-10">
              <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-500 uppercase">
                What we show you on the call
              </h2>
              <ul className="mt-3 sm:mt-4 space-y-4 sm:space-y-5">
                {PROOF.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl bg-white border border-neutral-200 text-blue-600 flex items-center justify-center shadow-xs">
                      <Icon size={20} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>
                      <p className="text-[15px] sm:text-base text-neutral-600 leading-snug sm:leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 sm:mt-6 flex gap-2 text-[15px] sm:text-base text-neutral-600 leading-relaxed">
                <LineIcon>
                  <MapPin size={18} className="text-blue-600" />
                </LineIcon>
                A local growth partner: one point of contact in West Des Moines for the whole partnership.
              </p>
            </div>

            <a
              href="tel:+15154938017"
              className="mt-8 hidden lg:inline-flex items-center gap-2 text-base font-semibold text-neutral-700 hover:text-blue-600 transition-colors"
            >
              <Phone size={17} className="text-blue-600" /> Rather talk now? (515) 493-8017
            </a>
          </div>

          {/* Right: the form */}
          <div className="contents lg:block lg:col-span-7">
            {/* Purpose: the form itself, fields two to a row so it fits one phone screen. */}
            <div className="order-2 lg:order-none">
              <div className="rounded-[24px] sm:rounded-[36px] bg-white border border-neutral-200 shadow-xl shadow-neutral-900/5 p-4 sm:p-8 lg:p-10 w-full">
                <AreaCheckRequest source="check_your_area" />
              </div>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-neutral-500 leading-relaxed px-2">
                For dental practices, med spas, law firms and accounting and CPA firms. {COMPLIANCE_LINE}
              </p>
            </div>

            {/* Purpose: the three questions people ask before they submit. */}
            <section className="order-5 lg:order-none lg:mt-12" aria-labelledby="area-faq">
              <h2 id="area-faq" className="text-2xl font-bold font-display tracking-tight">
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
                or see{' '}
                <Link href="/pricing" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                  pricing
                </Link>
                .
              </p>
            </section>

            <a
              href="tel:+15154938017"
              className="order-6 min-h-[44px] flex lg:hidden items-center justify-center gap-2 text-base font-semibold text-neutral-700"
            >
              <Phone size={17} className="text-blue-600" /> Rather talk now? (515) 493-8017
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
