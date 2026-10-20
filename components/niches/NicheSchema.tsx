import type { Niche } from '@/data/nichesData';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { serviceJsonLd } from '@/lib/seo';
import { nicheQuickAnswer } from '@/components/niches/NicheQuickAnswer';

export function NicheSchema({ niche }: { niche: Niche }) {
  const qa = nicheQuickAnswer(niche);
  const jsonLd = serviceJsonLd({
    path: `/solutions/${niche.slug}`,
    serviceType: `Patient & Client Intake for ${niche.name}`,
    name: `Axeon Studio: ${niche.name}`,
    description: `${qa.answer} ${niche.subheadline}`,
    category: niche.schemaType,
    audience: [niche.name],
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
