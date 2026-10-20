import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata: Metadata = buildMetadata({
  path: '/faq',
  title: 'Practice & Firm Marketing FAQ: Cost, SEO, Intake | Axeon Studio',
  description:
    'Straight answers for dental, med spa, law and CPA firm owners in Iowa: cost, the 90-day performance commitment, ownership, agreements and patient and client privacy.',
});

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <main className="w-full pt-20 sm:pt-32 pb-12 sm:pb-24 px-4 sm:px-10 lg:px-16 xl:px-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <BreadcrumbJsonLd items={[{ name: 'FAQ', path: '/faq' }]} />
      <div className="max-w-3xl mx-auto">
        {/* Purpose: every question an owner asks, collapsed so all of them show in one view. */}
        <section aria-labelledby="faq-heading">
          <span className="eyebrow block mb-2 sm:mb-4">FAQ</span>
          <h1 id="faq-heading" className="text-[30px] leading-tight sm:text-5xl font-extrabold font-display tracking-tight text-neutral-950 mb-2 sm:mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[15px] sm:text-lg text-neutral-600 mb-4 sm:mb-14">
            Straight answers to what dental, med spa, law firm and CPA firm owners ask before working with us.
          </p>
          <FAQAccordion items={faqItems} defaultOpenCount={0} />
        </section>

        {/* Purpose: the next step for anyone whose question isn't answered above. */}
        <div className="mt-10 sm:mt-16 rounded-[24px] sm:rounded-[28px] bg-neutral-950 text-white p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">Still have a question?</h2>
            <p className="mt-2 text-neutral-300 text-base sm:text-lg">
              Check if your area is open, or{' '}
              <Link href="/book" className="underline underline-offset-4 hover:text-white">
                book a call
              </Link>
              .
            </p>
          </div>
          <Link
            href="/check-your-area"
            data-track="cta_click"
            data-track-cta="faq_closer"
            className="shrink-0 text-center px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
          >
            Check your area
          </Link>
        </div>
      </div>
    </main>
  );
}
