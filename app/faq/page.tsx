import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';
import { buildMetadata } from '@/lib/metadata';
import { BreadcrumbJsonLd } from '@/components/common/JsonLd';

export const metadata: Metadata = buildMetadata({
  path: '/faq',
  title: 'FAQ: Questions Practice & Firm Owners Ask | Axeon Studio',
  description: 'Answers to what owners of dental practices, med spas, law firms and CPA firms ask before working with Axeon Studio: the performance commitment, ownership, agreements and cost.',
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
    <main className="w-full pt-32 pb-24 px-6 sm:px-10 lg:px-16 xl:px-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <BreadcrumbJsonLd items={[{ name: 'FAQ', path: '/faq' }]} />
      <div className="max-w-3xl mx-auto">
        <span className="block mb-4 text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">[ FAQ ]</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-neutral-950 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-neutral-600 mb-14">
          Straight answers to what dental, med spa, law firm and CPA firm owners ask before working with us.
        </p>
        <FAQAccordion items={faqItems} defaultOpenCount={1} />

        <div className="mt-16 rounded-[28px] bg-neutral-950 text-white p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">Still have a question?</h2>
            <p className="mt-2 text-neutral-300 text-base sm:text-lg">
              Start with the free after-hours audit, or{' '}
              <Link href="/book" className="underline underline-offset-4 hover:text-white">
                book a call
              </Link>
              .
            </p>
          </div>
          <Link
            href="/audit"
            data-track="cta_click"
            data-track-cta="faq_closer"
            className="shrink-0 text-center px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors shadow-lg shadow-blue-600/30"
          >
            Get your free audit
          </Link>
        </div>
      </div>
    </main>
  );
}
