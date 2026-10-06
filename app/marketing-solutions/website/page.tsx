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
import { websiteDetail as d } from '@/data/solutionDetails';

const DESCRIPTION =
  'A website built to win the comparison and turn searches into calls. Part of AxeonCORE, backed by a 90-day customer guarantee.';

export const metadata = buildMetadata({
  path: '/marketing-solutions/website',
  title: 'Website Design & Development | Axeon Studio',
  description: DESCRIPTION,
});

const jsonLd = serviceJsonLd({
  path: '/marketing-solutions/website',
  serviceType: 'Website Design & Development',
  name: 'Axeon Studio — Website Design & Development',
  description: DESCRIPTION,
});

export default function WebsitePage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Services', path: '/marketing-solutions' },
          { name: 'Website Design & Development', path: '/marketing-solutions/website' },
        ]}
      />
      <ServiceFaqJsonLd items={d.faqs} />

      <ServiceHero
        image="/temp-scorpion-refs/website-hero.webp"
        eyebrow="Services · Website"
        title="A Website That Turns Searches Into Calls"
        subtitle="Built to make you the obvious choice the second someone compares you, with a call or a booking one tap away."
        priceLine="Plans from $149/mo, $99 to start"
        note="backed by our 90-day customer guarantee"
      />
      <ProblemSection data={d.problem} />
      <DeliverablesSection detail={d} />
      {d.proof && <CaseStudyProof data={d.proof} />}
      <ServiceFaqSection heading="Common Questions About Your Website" faqs={d.faqs} />
      <ServiceClosingCta trackId="service_website" />
    </main>
  );
}
