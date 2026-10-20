// /solutions/{vertical}/{specialty}: one practice area inside a practice type
// (personal injury, orthodontists, bookkeepers...). Copy in data/specialtyPages.ts.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ServiceFaqJsonLd } from '@/components/marketing-solutions/SolutionSections';
import { SpecialtyPageView } from '@/components/niches/SpecialtyPageView';
import { VERTICAL_TITLE } from '@/data/serviceFunnels';
import { specialtyFor, specialtyPages, specialtyPath } from '@/data/specialtyPages';
import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';

type Params = { params: Promise<{ slug: string; specialty: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return specialtyPages.map((p) => ({ slug: p.vertical, specialty: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, specialty } = await params;
  const page = specialtyFor(slug, specialty);
  if (!page) return {};
  return buildMetadata({ path: specialtyPath(page), title: page.metaTitle, description: page.metaDescription });
}

export default async function SpecialtyRoute({ params }: Params) {
  const { slug, specialty } = await params;
  const page = specialtyFor(slug, specialty);
  if (!page) notFound();
  const path = specialtyPath(page);
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd
        data={serviceJsonLd({
          path,
          serviceType: page.keyword,
          name: `Axeon Studio: ${page.keyword}`,
          description: page.metaDescription,
          audience: [page.name],
        })}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Who we help', path: '/solutions' },
          { name: VERTICAL_TITLE[page.vertical], path: `/solutions/${page.vertical}` },
          { name: page.name, path },
        ]}
      />
      <ServiceFaqJsonLd items={page.faqs} />
      <SpecialtyPageView page={page} />
    </main>
  );
}
