import Link from 'next/link';
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

export default async function NichePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const niche = niches.find((n) => n.slug === slug);
  if (!niche) notFound();

  const faqs = [...(nicheFaqData[niche.slug] ?? []).slice(0, 3), ...pickGeneralFaqs()];

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
        </div>
      </section>
      <NicheClosingCTA niche={niche} />
    </main>
  );
}
