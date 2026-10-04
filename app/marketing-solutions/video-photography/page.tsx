import { buildMetadata } from '@/lib/metadata';
import { serviceJsonLd } from '@/lib/seo';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import {
  ServiceHero,
  ProblemSection,
  DeliverablesSection,
  WhereItFits,
  TimelineSection,
  ServiceFaqSection,
  ServiceFaqJsonLd,
} from '@/components/marketing-solutions/SolutionSections';
import { ServiceClosingCta } from '@/components/marketing-solutions/ServiceClosingCta';
import { videoDetail as d } from '@/data/solutionDetails';

const DESCRIPTION =
  'Real footage of your team and your work, the thing that makes a customer pick you over the stock-photo site next to you.';

export const metadata = buildMetadata({
  path: '/marketing-solutions/video-photography',
  title: 'Video & Photography | Axeon Studio',
  description: DESCRIPTION,
});

const jsonLd = serviceJsonLd({
  path: '/marketing-solutions/video-photography',
  serviceType: 'Video & Photography Production',
  name: 'Axeon Studio — Video & Photography',
  description: DESCRIPTION,
});

export default function VideoPhotographyPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Services', path: '/marketing-solutions' },
          { name: 'Video & Photography', path: '/marketing-solutions/video-photography' },
        ]}
      />
      <ServiceFaqJsonLd items={d.faqs} />

      <ServiceHero
        eyebrow="Services · Video & Photography"
        title="Real Footage That Makes Customers Pick You"
        subtitle={DESCRIPTION}
        priceLine="Included in AxeonCORE, or $1,500 added to Essentials"
        note="half-day on-site shoot"
      />
      <ProblemSection data={d.problem} />
      <DeliverablesSection data={d.deliverables} />
      <WhereItFits data={d.fit} />
      <TimelineSection data={d.timeline} />
      <ServiceFaqSection heading="Common Questions About Video" faqs={d.faqs} />
      <ServiceClosingCta trackId="service_video" />
    </main>
  );
}
