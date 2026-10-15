import AboutClient from './AboutClient';
import { buildMetadata } from '@/lib/metadata';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ORG_ID, SITE_URL } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/about',
  title: 'About Axeon Studio | West Des Moines Marketing Company',
  description:
    'Based in West Des Moines, Axeon Studio gets Iowa businesses more calls and customers, backed by a 90-day customer guarantee. Work directly with the team building your system.',
});

// The Organization node is defined once in the root layout graph;
// this page just declares that it is *about* it.
const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#webpage`,
  url: `${SITE_URL}/about`,
  name: 'About Axeon Studio | More Customers for Iowa Businesses',
  about: { '@id': ORG_ID },
  mainEntity: { '@id': ORG_ID },
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
