import AboutClient from './AboutClient';
import { buildMetadata } from '@/lib/metadata';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { FOUNDER_ID, ORG_ID, SITE_URL } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/about',
  title: "Iowa's First AI-Forward Digital Agency | Axeon Studio",
  description:
    'Meet Axeon Studio, founded by Hayder Hatem in West Des Moines, Iowa. Direct builders, fast delivery, zero agency fluff.',
});

// The founder Person node itself is defined once in the root layout graph;
// this page just declares that it is *about* him and the organization.
const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#webpage`,
  url: `${SITE_URL}/about`,
  name: "Iowa's First AI-Forward Digital Agency | Axeon Studio",
  about: { '@id': ORG_ID },
  mainEntity: { '@id': FOUNDER_ID },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutPageJsonLd} />
      <BreadcrumbJsonLd items={[{ name: 'Our Story', path: '/about' }]} />
      <AboutClient />
    </>
  );
}
