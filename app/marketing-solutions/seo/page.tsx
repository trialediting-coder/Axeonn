import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import {
  ServiceHero,
  ProblemSection,
  DeliverablesSection,
  CaseStudyProof,
  ServiceFaqSection,
  ServiceFaqJsonLd,
} from '@/components/marketing-solutions/SolutionSections';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';
import { seoDetail as d } from '@/data/solutionDetails';

export const metadata = buildMetadata({
  path: '/marketing-solutions/seo',
  title: 'SEO, AEO & GEO Services | Axeon Studio',
  description:
    'Get found on Google and cited by AI. SEO, AEO, and GEO built into every Axeon Studio site, not sold separately, backed by a 90-day customer guarantee.',
});

const jsonLd = serviceJsonLd({
  path: '/marketing-solutions/seo',
  serviceType: 'Local SEO, AEO & GEO',
  name: 'Axeon Studio — SEO, AEO & GEO',
  description:
    'Search, answer engine, and generative engine optimization built into every Axeon Studio site, so Des Moines-area businesses are found on Google and cited by AI assistants.',
});

export default function SeoMarketingSolutionPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <ServiceFaqJsonLd items={d.faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Services', path: '/marketing-solutions' },
          { name: 'SEO, AEO & GEO', path: '/marketing-solutions/seo' },
        ]}
      />

      <ServiceHero
        image="/temp-scorpion-refs/seo-hero.webp"
        eyebrow="Services · SEO / AEO / GEO"
        title="Get Found on Google. Get Cited by AI."
        subtitle="Show up when people nearby search for what you do: on Google, on the map, and inside AI answers. Built into every site we build, not sold separately."
        priceLine="Built into every site, from $2,800 setup"
        note="not bolted on"
      />
      <ProblemSection data={d.problem} />
      <DeliverablesSection detail={d} />
      {d.proof && <CaseStudyProof data={d.proof} />}
      <ServiceFaqSection heading="Common Questions About SEO" faqs={d.faqs} />
      <ServiceClosingCta trackId="service_seo" />
    </main>
  );
}
