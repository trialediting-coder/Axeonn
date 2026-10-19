export interface PlatformLogo {
  name: string;
  logo: string;
  /** Set true for logos whose official mark is a light/white wordmark with no
   * colored variant available — these render invisible on the marquee's light
   * background, so they're shown with a CSS invert filter instead (turns the
   * white mark black, transparent stays transparent). */
  invert?: boolean;
}

export interface NichePlatforms {
  tagline: string;
  platforms: PlatformLogo[];
}

// Real, well-known software platforms commonly used in each industry — verified
// via current market research, not guessed. This is informational ("we know
// your industry and build around whatever you already use"), NOT a claim of
// integration or partnership with any of these companies. Logos are each
// company's genuine, unaltered official mark, sourced directly from their own
// site/brand kit (see public/logos/ for source notes) — used here strictly as
// factual reference to real software these businesses already run, not as an
// implied endorsement or partnership. med-spa is deliberately omitted (too niche
// for this section per the site
// owner); the component renders nothing for it.
export const nichePlatformsData: Record<string, NichePlatforms> = {
  dental: {
    tagline: "Already running Dentrix or Eaglesoft? Axeon works alongside what you already use, not instead of it.",
    platforms: [
      { name: 'Dentrix', logo: '/logos/dentrix.svg' },
      { name: 'Eaglesoft', logo: '/logos/eaglesoft.png' },
      { name: 'Open Dental', logo: '/logos/open-dental.png' },
    ],
  },
  'law-firms': {
    tagline: 'Already running Clio or MyCase? Axeon works alongside what you already use, not instead of it.',
    platforms: [
      { name: 'Clio', logo: '/logos/clio.png' },
      { name: 'MyCase', logo: '/logos/mycase.svg' },
      { name: 'PracticePanther', logo: '/logos/practicepanther.png', invert: true },
    ],
  },
  accounting: {
    tagline: 'Already running QuickBooks or Xero? Axeon works alongside what you already use, not instead of it.',
    platforms: [
      { name: 'QuickBooks', logo: '/logos/quickbooks.svg' },
      { name: 'Xero', logo: '/logos/xero.svg' },
      { name: 'Drake Tax', logo: '/logos/drake-tax.png' },
    ],
  },
};
