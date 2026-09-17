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
// implied endorsement or partnership. med-spa is deliberately omitted (too
// niche for this section per the site owner) — the component renders nothing
// for it.
export const nichePlatformsData: Record<string, NichePlatforms> = {
  dental: {
    tagline: "Already running Dentrix or Eaglesoft? We build around what you use, not instead of it.",
    platforms: [
      { name: 'Dentrix', logo: '/logos/dentrix.svg' },
      { name: 'Eaglesoft', logo: '/logos/eaglesoft.png' },
      { name: 'Open Dental', logo: '/logos/open-dental.png' },
    ],
  },
  hvac: {
    tagline: 'Already running ServiceTitan or Housecall Pro? We build around what you use, not instead of it.',
    platforms: [
      { name: 'ServiceTitan', logo: '/logos/servicetitan.svg' },
      { name: 'Housecall Pro', logo: '/logos/housecall-pro.svg' },
      { name: 'Jobber', logo: '/logos/jobber.svg' },
    ],
  },
  roofing: {
    tagline: 'Already running AccuLynx or JobNimbus? We build around what you use, not instead of it.',
    platforms: [
      { name: 'AccuLynx', logo: '/logos/acculynx.svg' },
      { name: 'JobNimbus', logo: '/logos/jobnimbus.svg', invert: true },
      { name: 'Roofr', logo: '/logos/roofr.svg' },
    ],
  },
  'law-firms': {
    tagline: 'Already running Clio or MyCase? We build around what you use, not instead of it.',
    platforms: [
      { name: 'Clio', logo: '/logos/clio.png' },
      { name: 'MyCase', logo: '/logos/mycase.svg' },
      { name: 'PracticePanther', logo: '/logos/practicepanther.png', invert: true },
    ],
  },
  accounting: {
    tagline: 'Already running QuickBooks or Xero? We build around what you use, not instead of it.',
    platforms: [
      { name: 'QuickBooks', logo: '/logos/quickbooks.svg' },
      { name: 'Xero', logo: '/logos/xero.svg' },
      { name: 'Drake Tax', logo: '/logos/drake-tax.png' },
    ],
  },
  'home-remodeling': {
    tagline: 'Already running Buildertrend or JobTread? We build around what you use, not instead of it.',
    platforms: [
      { name: 'Buildertrend', logo: '/logos/buildertrend.png' },
      { name: 'JobTread', logo: '/logos/jobtread.png' },
      { name: 'CoConstruct', logo: '/logos/coconstruct.png' },
    ],
  },
  'real-estate': {
    tagline: 'Already running Follow Up Boss or Lofty? We build around what you use, not instead of it.',
    platforms: [
      { name: 'Follow Up Boss', logo: '/logos/follow-up-boss.png' },
      { name: 'Lofty', logo: '/logos/lofty.svg', invert: true },
      { name: 'Top Producer', logo: '/logos/top-producer.png' },
    ],
  },
  landscaping: {
    tagline: 'Already running Aspire or LMN? We build around what you use, not instead of it.',
    platforms: [
      { name: 'Aspire', logo: '/logos/aspire.svg' },
      { name: 'LMN', logo: '/logos/lmn.png' },
      { name: 'Jobber', logo: '/logos/jobber.svg' },
    ],
  },
  'auto-detailing': {
    tagline: 'Already running Jobber or QuoteIQ? We build around what you use, not instead of it.',
    platforms: [
      { name: 'Jobber', logo: '/logos/jobber.svg' },
      { name: 'QuoteIQ', logo: '/logos/quoteiq.png' },
      { name: 'Mobile Tech RX', logo: '/logos/mobile-tech-rx.svg' },
    ],
  },
};
