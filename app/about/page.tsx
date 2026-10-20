import AboutClient from './AboutClient';
import { buildMetadata } from '@/lib/metadata';
import { JsonLd, BreadcrumbJsonLd } from '@/components/common/JsonLd';
import { ORG_ID, SITE_URL } from '@/lib/seo';

export const metadata = buildMetadata({
  path: '/about',
  title: 'About Axeon Studio | Growth Partner in West Des Moines',
  description:
    'Axeon Studio is a West Des Moines growth partner for dental practices, med spas, law firms and CPA firms. One point of contact, one practice per specialty.',
});

// The Organization node is defined once in the root layout graph;
// this page just declares that it is *about* it.
const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#webpage`,
  url: `${SITE_URL}/about`,
  name: 'About Axeon Studio | Patient & Client Intake for Practices and Firms',
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
