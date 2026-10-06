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
import { leadGenDetail as d } from '@/data/solutionDetails';

const DESCRIPTION =
  'Lead capture and follow-up for local businesses: every call, form, and chat answered and followed up automatically, so no customer slips away.';

export const metadata = buildMetadata({
  path: '/marketing-solutions/lead-generation',
  title: 'Lead Capture & Follow-Up Automation | Axeon Studio',
  description: DESCRIPTION,
});

const jsonLd = serviceJsonLd({
  path: '/marketing-solutions/lead-generation',
  serviceType: 'Lead Capture & Follow-Up Automation',
  name: 'Axeon Studio — Lead Capture & Follow-Up Automation',
  description: DESCRIPTION,
});

export default function LeadGenerationPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Services', path: '/marketing-solutions' },
          { name: 'Lead Capture & Follow-Up', path: '/marketing-solutions/lead-generation' },
        ]}
      />
      <ServiceFaqJsonLd items={d.faqs} />

      <ServiceHero
        image="/temp-scorpion-refs/lead-generation-hero-v2.webp"
        eyebrow="Services · Lead Capture & Follow-Up"
        title="Every lead captured. Every lead followed up. Automatically."
        subtitle="Every call, form, and chat lands in one place the moment it comes in, and follow-up starts automatically before the lead goes cold."
        priceLine="Included in AxeonCORE, $299/mo"
        note="a CRM pipeline built around how you sell"
      />
      <ProblemSection data={d.problem} />
      <DeliverablesSection detail={d} />
      {d.proof && <CaseStudyProof data={d.proof} />}
      <ServiceFaqSection heading="Common Questions About Lead Follow-Up" faqs={d.faqs} />
      <ServiceClosingCta trackId="service_lead_gen" />
    </main>
  );
}
