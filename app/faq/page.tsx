import type { Metadata } from 'next';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  path: '/faq',
  title: 'Insights & FAQ | Axeon Studio',
  description: 'Answers to the questions Iowa business owners ask most before working with Axeon Studio.',
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 mb-4">
          Insights &amp; FAQ
        </h1>
        <p className="text-lg text-neutral-600 mb-14">
          Straight answers to what business owners ask before working with us.
        </p>
        <FAQAccordion items={faqItems} defaultOpenCount={1} />
      </div>
    </main>
  );
}
