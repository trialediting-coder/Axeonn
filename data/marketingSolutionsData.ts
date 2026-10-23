// The layers of the Axeon system, as shown on /marketing-solutions ("How it
// works"), plus the six service pages under it (/marketing-solutions/website,
// /seo, ...). Layer copy lives in data/solutionDetails.ts; full service-page
// copy lives in data/servicePages.ts. This file stays small because the
// header (a client component) imports it.

export interface ServiceLink {
  slug: string;
  /** Short name for menus and footers. */
  title: string;
  /** The result, in one line, for the Services menu. */
  outcome: string;
  href: string;
}

export const services: ServiceLink[] = [
  {
    slug: 'website',
    title: 'Websites',
    outcome: 'A website that books consultations, not just visits.',
    href: '/marketing-solutions/website',
  },
  {
    slug: 'seo',
    title: 'Local SEO',
    outcome: 'Show up on Google Maps when new patients and clients search near you.',
    href: '/marketing-solutions/seo',
  },
  {
    slug: 'lead-generation',
    title: 'Lead generation & intake',
    outcome: 'Every call and inquiry answered in 60 seconds.',
    href: '/marketing-solutions/lead-generation',
  },
  {
    slug: 'ai-chat-scheduling',
    title: 'AI chat & online booking',
    outcome: 'Patients and clients book their own consultation, any hour.',
    href: '/marketing-solutions/ai-chat-scheduling',
  },
  {
    slug: 'advertising',
    title: 'Google Ads & Local Services Ads',
    outcome: 'Ads tracked all the way to the booked consultation.',
    href: '/marketing-solutions/advertising',
  },
  {
    slug: 'video-photography',
    title: 'Photo & video',
    outcome: 'Photos and video that make patients and clients choose you.',
    href: '/marketing-solutions/video-photography',
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);

export interface MarketingSolution {
  /** Anchor id on /marketing-solutions. */
  id: string;
  title: string;
  description: string;
  /** Which plan includes this layer. */
  included: string;
  href: string;
}

export const marketingSolutions: MarketingSolution[] = [
  {
    id: 'website',
    title: 'Practice or firm website',
    description:
      'A custom, mobile-first site with providers and credentials, services, reviews and online booking.',
    included: 'AxeonCORE',
    href: '/marketing-solutions#website',
  },
  {
    id: 'intake',
    title: '60-second intake & booking',
    description:
      'Every missed call and web inquiry gets a reply within 60 seconds, 24/7, and a way to book the consultation.',
    included: 'AxeonCORE',
    href: '/marketing-solutions#intake',
  },
  {
    id: 'reviews',
    title: 'Review engine',
    description: 'An automatic review request after every completed appointment.',
    included: 'AxeonCORE',
    href: '/marketing-solutions#reviews',
  },
  {
    id: 'growth',
    title: 'Acquisition layer',
    description:
      'Google Local Services Ads and search ads, reactivation of past patients and clients, and quarterly photo and video.',
    included: 'AxeonGROWTH',
    href: '/marketing-solutions#growth',
  },
];
