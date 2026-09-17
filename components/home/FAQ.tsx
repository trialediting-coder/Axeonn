import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';

export function FAQ() {
  const condensed = faqItems.slice(0, 3);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: condensed.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section id="faq" className="w-full py-24 sm:py-36 lg:py-44 px-6 sm:px-10 lg:px-16 xl:px-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 mb-12 sm:mb-16 text-center">
          Common Questions
        </h2>
        <FAQAccordion items={condensed} defaultOpenCount={1} size="large" />
        <div className="mt-12 sm:mt-14 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2.5 text-blue-600 font-bold text-base sm:text-lg hover:text-blue-700 transition-colors"
          >
            <span>See all questions</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
