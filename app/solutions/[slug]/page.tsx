import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { niches } from '@/data/nichesData';
import { NicheSchema } from '@/components/niches/NicheSchema';
import { NicheHero } from '@/components/niches/NicheHero';
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

// Max 5 FAQs per industry page: its 2 niche questions plus these 3 general ones.
const GENERAL_FAQS = ['Do you guarantee results?', 'How much does it cost to work with Axeon?', 'Do I own my website?'];

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

  const faqs = [
    ...(nicheFaqData[niche.slug] ?? []).slice(0, 2),
    ...GENERAL_FAQS.map((q) => faqItems.find((f) => f.question === q)).filter(
      (f): f is (typeof faqItems)[number] => Boolean(f),
    ),
  ];

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
      <NichePainPoints niche={niche} />
      <Testimonials />
      <NicheWorkflow niche={niche} />
      <NicheWork niche={niche} />
      <NicheProof niche={niche} />
      <section className="w-full py-20 px-6 sm:px-10 lg:px-16 xl:px-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase mb-3">[ FAQ ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-950 mb-10">
            Common Questions
          </h2>
          <FAQAccordion items={faqs} />
          <p className="mt-8 text-neutral-600">
            <Link href="/faq" className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
              More questions &rarr;
            </Link>
          </p>
        </div>
      </section>
      <NicheClosingCTA niche={niche} />
    </main>
  );
}
