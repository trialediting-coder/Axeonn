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
import { advertisingDetail as d } from '@/data/solutionDetails';

export const metadata = buildMetadata({
  path: '/marketing-solutions/advertising',
  title: 'Google Ads & Meta Ads Management | Axeon Studio',
  description:
    'Google Ads and Meta Ads management for local businesses, sent to pages built to convert, with every call, form, and booking tracked to the customer.',
});

const jsonLd = serviceJsonLd({
  path: '/marketing-solutions/advertising',
  serviceType: 'Pay-Per-Click Advertising Management',
  name: 'Axeon Studio — Google Ads & Meta Ads',
  description:
    'Google Ads (Search) and Meta Ads (Facebook & Instagram) campaign management for Des Moines-area businesses, with service-specific landing pages and conversion tracking for calls, forms, and bookings.',
});

export default function AdvertisingMarketingSolutionPage() {
  return (
    <main className="w-full bg-white text-neutral-950">
      <JsonLd data={jsonLd} />
      <ServiceFaqJsonLd items={d.faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Services', path: '/marketing-solutions' },
          { name: 'Advertising', path: '/marketing-solutions/advertising' },
        ]}
      />

      <ServiceHero
        eyebrow="Services · Advertising"
        title="Ads That Turn Into Booked Jobs, Not Just Clicks."
        subtitle="Google Ads and Meta Ads, built around the services you want more of, sent to pages made to convert, and tracked all the way to a call or a booking."
        priceLine="Campaigns scoped to your market and goals"
        note="quoted on a free strategy call"
        showPricingLink={false}
      />
      <ProblemSection data={d.problem} />
      <DeliverablesSection data={d.deliverables} />
      <WhereItFits data={d.fit} />
      <TimelineSection data={d.timeline} />
      <ServiceFaqSection heading="Common Questions About Ads" faqs={d.faqs} />
      <ServiceClosingCta trackId="service_advertising" />
    </main>
  );
}
