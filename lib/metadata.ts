import type { Metadata } from 'next';

interface BuildMetadataArgs {
  path: string;
  title: string;
  description: string;
}

export function buildMetadata({ path, title, description }: BuildMetadataArgs): Metadata {
  const url = `https://axeonstudio.co${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: '/og-axeon-card.png', width: 1200, height: 630, alt: 'Axeon Studio Preview Card' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-axeon-card.png'],
    },
  };
}
