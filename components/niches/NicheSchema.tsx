import type { Niche } from '@/data/nichesData';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { serviceJsonLd } from '@/lib/seo';

export function NicheSchema({ niche }: { niche: Niche }) {
  const jsonLd = serviceJsonLd({
    path: `/solutions/${niche.slug}`,
    serviceType: `Web Design, SEO & CRM Pipeline for ${niche.name}`,
    name: `Axeon Studio — ${niche.name}`,
    description: niche.subheadline,
    category: niche.schemaType,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Industries', path: '/solutions' },
          { name: niche.name, path: `/solutions/${niche.slug}` },
        ]}
      />
    </>
  );
}
