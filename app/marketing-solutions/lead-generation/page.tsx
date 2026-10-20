import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ServiceFaqJsonLd, ServicePageView } from '@/components/marketing-solutions/SolutionSections';
import { leadGenerationPage as page } from '@/data/servicePages';

export const metadata = buildMetadata({
  path: page.path,
  title: page.metaTitle,
  description: page.metaDescription,
});

const jsonLd = serviceJsonLd({
  path: page.path,
  serviceType: page.serviceType,
  name: `Axeon Studio: ${page.name}`,
  description: page.metaDescription,
});

export default function LeadGenerationPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'How it works', path: '/marketing-solutions' },
          { name: page.name, path: page.path },
        ]}
      />
      <ServiceFaqJsonLd items={page.faqs} />
      <ServicePageView page={page} />
    </main>
  );
}
