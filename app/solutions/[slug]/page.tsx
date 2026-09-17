import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { niches } from '@/data/nichesData';
import { NicheSchema } from '@/components/niches/NicheSchema';
import { NicheHero } from '@/components/niches/NicheHero';
import { NichePainPoints } from '@/components/niches/NichePainPoints';
import { NicheServices } from '@/components/niches/NicheServices';
import { NicheWorkflow } from '@/components/niches/NicheWorkflow';
import { NicheClosingCTA } from '@/components/niches/NicheClosingCTA';
import { NicheVideoBreak } from '@/components/niches/NicheVideoBreak';
import { NichePlatformsMarquee } from '@/components/niches/NichePlatformsMarquee';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQAccordion } from '@/components/common/FAQAccordion';
import { faqItems } from '@/data/faqData';
import { nicheFaqData } from '@/data/nicheFaqData';
import { buildMetadata } from '@/lib/metadata';

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
    description: niche.subheadline,
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

  const combinedFaqItems = [...(nicheFaqData[niche.slug] || []), ...faqItems];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: combinedFaqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main>
      <NicheSchema niche={niche} />
      <NicheHero niche={niche} />
      <NichePlatformsMarquee slug={niche.slug} />
      <NichePainPoints niche={niche} />
      <NicheServices niche={niche} />
      <NicheVideoBreak slug={niche.slug} headline={niche.tagline} ctaLabel={niche.primaryCTA} />
      <NicheWorkflow niche={niche} />
      <Testimonials />
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 mb-10">
            Common Questions
          </h2>
          <FAQAccordion items={combinedFaqItems} />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </section>
      <NicheClosingCTA niche={niche} />
    </main>
  );
}
