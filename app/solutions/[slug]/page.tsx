import Link from 'next/link';
import { ServicesForVertical } from '@/components/marketing-solutions/FunnelPage';
import { SpecialtiesForVertical } from '@/components/niches/SpecialtyPageView';
import { FUNNEL_VERTICALS } from '@/data/serviceFunnels';
import type { PracticeVertical } from '@/data/servicePages';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { niches } from '@/data/nichesData';
import { NicheSchema } from '@/components/niches/NicheSchema';
import { NicheHero } from '@/components/niches/NicheHero';
import { NicheQuickAnswer } from '@/components/niches/NicheQuickAnswer';
import { NichePainPoints } from '@/components/niches/NichePainPoints';
import { NicheWorkflow } from '@/components/niches/NicheWorkflow';
import { NicheWork } from '@/components/niches/NicheWork';
import { NicheProof } from '@/components/niches/NicheProof';
import { NicheClosingCTA } from '@/components/niches/NicheClosingCTA';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { JsonLd } from '@/components/common/JsonLd';
import { faqItems } from '@/data/faqData';
import { nicheFaqData } from '@/data/nicheFaqData';
import { buildMetadata } from '@/lib/metadata';

const isPracticeVertical = (s: string): s is PracticeVertical => (FUNNEL_VERTICALS as readonly string[]).includes(s);

// Max 6 FAQs per practice page: up to 3 practice questions plus 3 general ones
// (cost, the performance commitment, ownership). Matched by topic rather than
// exact wording so a reworded data/faqData.ts still fills the slots.
const GENERAL_FAQ_TOPICS = [/cost|price|pricing/i, /guarantee|commitment|results/i, /own/i];

function pickGeneralFaqs() {
  const picked: (typeof faqItems)[number][] = [];
  for (const topic of GENERAL_FAQ_TOPICS) {
    const hit = faqItems.find((f) => topic.test(f.question) && !picked.includes(f));
    if (hit) picked.push(hit);
  }
  return picked;
}

export function generateStaticParams() {
  return niches.map((niche) => ({ slug: niche.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const niche = niches.find((n) => n.slug === slug);
  if (!niche) return {};

  const title = `${niche.seoTitle} | Axeon Studio`;
  return buildMetadata({
    path: `/solutions/${niche.slug}`,
    title,
    description: niche.seoDescription ?? niche.subheadline,
  });
}

// The top question search for each practice type (Semrush, 2026-10-20), answered
// first in the FAQ and in the FAQPage schema.
// Two insight posts per practice page, so each post gets a link from the page
// that ranks for its topic (Semrush flagged posts with a single incoming link).
const FURTHER_READING: Record<string, { slug: string; title: string }[]> = {
  dental: [
    { slug: 'how-to-get-more-dental-patients', title: 'How to get more dental patients' },
    { slug: 'dental-marketing-ideas', title: '15 dental marketing ideas' },
  ],
  'med-spa': [
    { slug: 'med-spa-marketing-ideas', title: '14 med spa marketing ideas' },
    { slug: 'med-spa-seo', title: 'Med spa SEO: what it costs and what works' },
  ],
  'law-firms': [
    { slug: 'law-firm-intake', title: 'A simple law firm intake process' },
    { slug: 'how-much-does-a-law-firm-website-cost', title: 'What a law firm website costs' },
  ],
  accounting: [
    { slug: 'how-to-get-more-tax-clients', title: 'How to get more tax clients' },
    { slug: 'marketing-ideas-for-accountants', title: '12 marketing ideas for accountants' },
  ],
};

const AEO_FAQ: Record<string, { question: string; answer: string }> = {
  dental: {
    question: 'How do you market a dental practice?',
    answer:
      'Get found on Google, answer every new-patient call and inquiry fast, make booking one tap and ask every patient for a review. AxeonCORE runs all four, from $799/mo.',
  },
  'med-spa': {
    question: 'How do you market a med spa?',
    answer:
      'A page per treatment, injector credentials up front, every consult request answered in 60 seconds and booked, and a review ask after each visit.',
  },
  'law-firms': {
    question: 'How do you market a small law firm?',
    answer:
      'Rank locally for your practice areas, answer every call and form the night it happens, and book the case review on the spot. Ads come later, with AxeonGROWTH.',
  },
  accounting: {
    question: 'How do you grow an accounting firm?',
    answer:
      'Show up when business owners search nearby, answer every call fast, especially in tax season, and let clients book tax and advisory meetings online.',
  },
};

export default async function NichePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const niche = niches.find((n) => n.slug === slug);
  if (!niche) notFound();

  const aeo = AEO_FAQ[niche.slug];
  const faqs = [...(aeo ? [aeo] : []), ...(nicheFaqData[niche.slug] ?? []).slice(0, 3), ...pickGeneralFaqs()];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <main>
      <NicheSchema niche={niche} />
      <JsonLd data={faqJsonLd} />
      <NicheHero niche={niche} />
      <NicheQuickAnswer niche={niche} />
      <NichePainPoints niche={niche} />
      {/* Purpose: why answering first matters (sourced stats; shared with the home page) */}
      <Testimonials />
      <NicheWorkflow niche={niche} />
      <NicheWork niche={niche} />
      <NicheProof niche={niche} />
      {/* Purpose: answer the last objections; every question visible, answers one tap away */}
      <section className="w-full py-10 sm:py-20 px-4 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-2 sm:mb-3">FAQ</p>
          <h2 className="text-[28px] sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 mb-4 sm:mb-10">
            Common Questions
          </h2>
          <FAQAccordion items={faqs} />
          <p className="mt-3 sm:mt-8 text-neutral-600">
            <Link href="/faq" className="min-h-11 inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
              More questions &rarr;
            </Link>
          </p>
          {FURTHER_READING[niche.slug] && (
            <ul className="mt-2 sm:mt-4">
              {FURTHER_READING[niche.slug].map((post) => (
                <li key={post.slug}>
                  <Link href={`/insights/${post.slug}`} className="min-h-11 inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
                    {post.title} &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <SpecialtiesForVertical vertical={niche.slug} />
      {isPracticeVertical(niche.slug) && <ServicesForVertical vertical={niche.slug} />}
      <NicheClosingCTA niche={niche} />
    </main>
  );
}
