import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';

export function FAQ() {
  // Lead with the three questions people actually ask before booking:
  // price, ownership, and "I already have a site". Falls back to the first
  // three if the data file is reworded.
  const preferred = [
    'How much does it cost to work with Axeon?',
    'Do I own my website?',
    'What if I already have a website?',
  ];
  const picked = preferred
    .map((q) => faqItems.find((f) => f.question === q))
    .filter((f): f is (typeof faqItems)[number] => Boolean(f));
  const condensed = picked.length === preferred.length ? picked : faqItems.slice(0, 3);

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
          Questions People Ask Before Booking
        </h2>
        <FAQAccordion items={condensed} defaultOpenCount={1} size="large" />
        <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base sm:text-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <span>Still deciding? Book a free call</span>
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-blue-600 font-bold text-base sm:text-lg hover:text-blue-700 transition-colors"
          >
            <span>See flat-rate pricing</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/faq" className="text-neutral-500 font-semibold text-sm sm:text-base hover:text-neutral-800 transition-colors">
            All questions
          </Link>
        </div>
      </div>
    </section>
  );
}
