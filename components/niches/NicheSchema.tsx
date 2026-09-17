import type { Niche } from '@/data/nichesData';

export function NicheSchema({ niche }: { niche: Niche }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `Web & CRM Infrastructure for ${niche.name}`,
    category: niche.schemaType,
    name: `Axeon Studio — ${niche.name}`,
    url: `https://axeonstudio.co/solutions/${niche.slug}`,
    description: niche.subheadline,
    provider: {
      '@type': 'Organization',
      name: 'Axeon Studio',
      logo: 'https://axeonstudio.co/icon.png',
      telephone: '+1-515-493-8017',
      email: 'hayder.hatem@axeonstudio.co',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'West Des Moines',
        addressRegion: 'IA',
        postalCode: '50266',
        addressCountry: 'US',
      },
    },
    areaServed: 'United States',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
