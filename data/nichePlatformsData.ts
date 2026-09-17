export interface NichePlatforms {
  tagline: string;
  platforms: string[];
}

// Real, well-known software platforms commonly used in each industry — verified
// via current market research, not guessed. This is informational ("we know
// your industry and build around whatever you already use"), NOT a claim of
// integration or partnership with any of these companies. Text-only, no
// logos — using their trademarked logos here would be a real overreach; naming
// them factually is not. med-spa is deliberately omitted (too niche for this
// section per the site owner) — the component renders nothing for it.
export const nichePlatformsData: Record<string, NichePlatforms> = {
  dental: {
    tagline: "Already running Dentrix or Eaglesoft? We build around what you use, not instead of it.",
    platforms: ['Dentrix', 'Eaglesoft', 'Open Dental'],
  },
  hvac: {
    tagline: 'Already running ServiceTitan or Housecall Pro? We build around what you use, not instead of it.',
    platforms: ['ServiceTitan', 'Housecall Pro', 'Jobber'],
  },
  roofing: {
    tagline: 'Already running AccuLynx or JobNimbus? We build around what you use, not instead of it.',
    platforms: ['AccuLynx', 'JobNimbus', 'Roofr'],
  },
  'law-firms': {
    tagline: 'Already running Clio or MyCase? We build around what you use, not instead of it.',
    platforms: ['Clio', 'MyCase', 'PracticePanther'],
  },
  accounting: {
    tagline: 'Already running QuickBooks or Xero? We build around what you use, not instead of it.',
    platforms: ['QuickBooks', 'Xero', 'Drake Tax'],
  },
  'home-remodeling': {
    tagline: 'Already running Buildertrend or JobTread? We build around what you use, not instead of it.',
    platforms: ['Buildertrend', 'JobTread', 'CoConstruct'],
  },
  'real-estate': {
    tagline: 'Already running Follow Up Boss or Lofty? We build around what you use, not instead of it.',
    platforms: ['Follow Up Boss', 'Lofty', 'Top Producer'],
  },
  landscaping: {
    tagline: 'Already running Aspire or LMN? We build around what you use, not instead of it.',
    platforms: ['Aspire', 'LMN', 'Jobber'],
  },
  'auto-detailing': {
    tagline: 'Already running Jobber or QuoteIQ? We build around what you use, not instead of it.',
    platforms: ['Jobber', 'QuoteIQ', 'Mobile Tech RX'],
  },
};
