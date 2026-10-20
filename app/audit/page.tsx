import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge, MessageSquareText, PhoneOff, Phone, Star, Video } from 'lucide-react';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd, JsonLd } from '@/components/common/JsonLd';
import { AuditRequest } from '@/components/audit/AuditRequest';
import { COMPLIANCE_LINE } from '@/data/pricingData';

// The free after-hours audit: the primary CTA across the site (2026-10-19).
// /get-started redirects here. The form posts to /api/get-started/lead with
// packageId 'free-audit', then offers an optional call to walk through it.
export const metadata: Metadata = buildMetadata({
  path: '/audit',
  title: 'Free After-Hours Audit for Practices & Firms | Axeon Studio',
  description:
    'We call your practice or firm after hours, check how fast your website answers an inquiry, compare your reviews to the top 3 nearby competitors, and test your mobile speed. You get a short video walkthrough. No charge, no obligation.',
});

const CHECKS = [
  {
    icon: PhoneOff,
    title: 'After-hours call test',
    body: 'We call your practice or firm after hours and see what a new patient or client actually gets: voicemail, a full mailbox, or a reply.',
  },
  {
    icon: MessageSquareText,
    title: 'Web inquiry response time',
    body: 'We send an inquiry through your website and time how long it takes to get a first reply, if one comes at all.',
  },
  {
    icon: Star,
    title: 'Reviews vs. the top 3 nearby',
    body: 'Your Google rating and review count next to the three practices or firms in your specialty that show up first near you.',
  },
  {
    icon: Gauge,
    title: 'Mobile speed',
    body: 'How fast your site loads on a phone, where most people look you up and decide whether to call.',
  },
];

const FAQS = [
  {
    q: 'Is it really free?',
    a: 'Yes. No charge and no obligation. If the audit shows your practice or firm already answers every call and inquiry quickly, we will tell you that.',
  },
  {
    q: 'What do I get?',
    a: 'A short video walkthrough of what we found: what happened when we called after hours, how long your website took to answer an inquiry, how your reviews compare to the top 3 nearby competitors, and your mobile speed.',
  },
  {
    q: 'What happens after?',
    a: 'You watch the video. If you want to talk it through, pick a time for a 30-minute call. If not, that is the end of it.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function AuditPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950 pt-28 sm:pt-32 pb-20 sm:pb-28">
      <BreadcrumbJsonLd items={[{ name: 'Free After-Hours Audit', path: '/audit' }]} />
      <JsonLd data={faqJsonLd} />

      {/* Same container as the header so the edges line up */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-start">
          {/* Left: what the audit is */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-4">
              [ FREE AFTER-HOURS AUDIT ]
            </p>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight leading-[1.08]">
              What happens when a new patient or client calls after hours?
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-xl">
              We call your practice or firm after hours, check how fast your website answers an inquiry, and compare your
              reviews to the top 3 nearby competitors. You get a short video walkthrough of what we found. No charge.
            </p>

            <h2 className="mt-10 text-sm font-mono font-bold tracking-widest text-neutral-500 uppercase">
              What we check
            </h2>
            <ul className="mt-4 space-y-5">
              {CHECKS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-white border border-neutral-200 text-blue-600 flex items-center justify-center shadow-xs">
                    <Icon size={20} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                    <p className="text-base text-neutral-600 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex gap-4 rounded-2xl bg-white border border-neutral-200 p-5 shadow-xs">
              <Video size={22} className="shrink-0 mt-0.5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold tracking-tight">What you get</h2>
                <p className="mt-1 text-base text-neutral-600 leading-relaxed">
                  A short video walkthrough of every finding, sent to your inbox. No charge and no obligation.
                </p>
              </div>
            </div>

            <a
              href="tel:+15154938017"
              className="mt-8 hidden lg:inline-flex items-center gap-2 text-base font-semibold text-neutral-700 hover:text-blue-600 transition-colors"
            >
              <Phone size={17} className="text-blue-600" /> Rather talk now? (515) 493-8017
            </a>
          </div>

          {/* Right: the form */}
          <div className="lg:col-span-7">
            <div className="rounded-[32px] sm:rounded-[36px] bg-white border border-neutral-200 shadow-xl shadow-neutral-900/5 p-6 sm:p-8 lg:p-10 w-full">
              <AuditRequest source="audit" />
            </div>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed px-2">
              For dental practices, med spas, law firms and CPA firms. {COMPLIANCE_LINE}
            </p>

            <section className="mt-12" aria-labelledby="audit-faq">
              <h2 id="audit-faq" className="text-2xl font-bold font-display tracking-tight">
                Questions about the audit
              </h2>
              <dl className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
                {FAQS.map((f) => (
                  <div key={f.q} className="py-5">
                    <dt className="text-base sm:text-lg font-bold text-neutral-950">{f.q}</dt>
                    <dd className="mt-1.5 text-base text-neutral-600 leading-relaxed">{f.a}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-base text-neutral-600">
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
              className="mt-8 flex lg:hidden items-center justify-center gap-2 text-base font-semibold text-neutral-700"
            >
              <Phone size={17} className="text-blue-600" /> Rather talk now? (515) 493-8017
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
