// The layers of the Axeon system, as shown on /marketing-solutions ("How it
// works") and linked from the footer. The six old service pages
// (/marketing-solutions/website, /seo, ...) were consolidated into the hub on
// 2026-10-19 and 301 to it (next.config.mjs). Full layer copy lives in
// data/solutionDetails.ts.

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
    title: 'Practice website',
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
      'Google Local Services Ads and search ads, past-patient reactivation, an AI phone receptionist and quarterly photo and video.',
    included: 'AxeonGROWTH',
    href: '/marketing-solutions#growth',
  },
];
