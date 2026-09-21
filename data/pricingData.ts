export interface PricingTier {
  id: string;
  name: string;
  focus: string;
  price: string;
  billingNote: string;
  turnaround: string;
  /** Short badge rendered above the card (e.g. "Most Popular"). */
  badge?: string;
  /** Rendered as a lead-in above the feature list ("Everything in X, plus:"). */
  inherits?: string;
  features: string[];
  /** Feature strings that get the highlighted "headline" treatment in the card. */
  highlightFeatures?: string[];
  cta: string;
  /** The tier most buyers should land on — gets the primary visual treatment. */
  featured?: boolean;
  /** Anchoring box: what the price step-up from the previous tier actually buys. */
  stepUp?: {
    heading: string;
    items: { label: string; note?: string }[];
    footer: string;
  };
}

export interface AddOn {
  name: string;
  price: string;
}

// Two flat-rate builds, no published monthly plan. Hosting & ongoing care is a
// separate monthly arrangement quoted on the strategy call (see hostingNote) —
// keep every monthly figure OFF this page. Numbers here must stay in sync with
// content/brand-guardrails.md and the priceRange in app/layout.tsx.
export const pricingTiers: PricingTier[] = [
  {
    id: 'core-web-build',
    name: 'Core Web Build',
    focus: 'Get found. Look credible. Get the call.',
    price: '$2,800',
    billingNote: 'One-time build — no monthly plan bundled in',
    turnaround: '7 Business Day Turnaround',
    badge: 'Most Popular',
    featured: true,
    features: [
      'Up to 4 custom-designed, mobile-first pages built around how your business actually sells',
      'Sub-second load speeds & 100% Core Web Vitals pass',
      'SEO, AEO & GEO built in — visible on Google and inside AI answers like ChatGPT',
      'Instant lead alerts — every form and call request lands in your inbox and on your phone',
      'Conversion tracking events configured so you know which pages produce calls',
      'Foundational ADA accessibility standards',
      'First 30 days of hosting & care included',
      'You own 100% of the site, code, and design files',
    ],
    cta: 'Book Core Build',
  },
  {
    id: 'full-acquisition-engine',
    name: 'Acquisition Engine',
    focus: 'Capture, qualify, and close — with real footage of your business',
    price: '$5,800',
    billingNote: 'One-time build — no monthly plan bundled in',
    turnaround: '14 Business Day Turnaround',
    badge: 'Full Engine',
    inherits: 'Everything in Core Web Build, plus:',
    features: [
      'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
      'Complete 5–7 page conversion architecture with conversion-copy hierarchy',
      'Custom CRM Pipeline built around your lead-to-close workflow — no per-seat monthly software',
      'AI chat & online scheduling so leads book themselves 24/7',
      'Multi-step intake questionnaire that pre-qualifies leads before you ever call them',
      'Automated SMS & email follow-up the second a lead comes in',
      'First 30 days of hosting & care included',
    ],
    highlightFeatures: [
      'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
    ],
    stepUp: {
      heading: 'What the extra $3,000 buys',
      items: [
        { label: 'Custom on-site videography', note: '$1,500 as an add-on' },
        { label: 'Custom CRM Pipeline', note: 'no per-seat software' },
        { label: 'AI chat & online scheduling' },
        { label: 'Multi-step intake + SMS/email automations' },
        { label: 'Up to 3 additional pages', note: '$450 each as an add-on' },
      ],
      footer: 'The video alone is half the step-up. The lead system comes with it.',
    },
    cta: 'Book Acquisition Engine',
  },
];

export const hostingNote =
  'Both builds are a one-time price. Hosting, security, backups, and ongoing care run on a simple monthly care plan — your first 30 days are included, and we walk you through the exact number on your strategy call before you commit to anything. No contracts, no lock-in: you own the site and can take your files at any time.';

export const addOns: AddOn[] = [
  { name: 'Custom On-Site Videography (add to Core Web Build)', price: '+$1,500' },
  { name: 'Additional Custom Page Build', price: '+$450 / page' },
  { name: 'Advanced Database/Directory Integration', price: '+$850' },
  { name: 'Secondary Niche Landing Page Variant', price: '+$500' },
];

export interface PricingFaq {
  q: string;
  a: string;
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: 'Which build should I pick?',
    a: 'Core Web Build if you need a credible, fast site that produces calls — most local businesses start here and it\'s the right call. Acquisition Engine if leads already come in faster than you can follow up, you book appointments or consultations, or you want your business to look like the biggest operation in town — real footage of your team and your work does that in a way no template can.',
  },
  {
    q: 'Is there a monthly fee?',
    a: 'The build itself is a one-time price — nothing recurring is bundled into either number above. Hosting, security, backups, and ongoing care are handled separately as a simple monthly care plan: your first 30 days are included, and we walk you through the exact number on your strategy call so there are no surprises. There\'s no lock-in — you own the site and can take your files at any time.',
  },
  {
    q: 'What does the on-site videography actually include?',
    a: 'We come to your location for a half-day shoot — your team, your space, your work. You get a hero film cut for your website, three vertical cuts sized for social and ads, and a photo set for your site and profiles. Everything is shot for the placements it will actually run in, not a single generic video you have to re-purpose yourself.',
  },
  {
    q: 'Can I add videography to the Core Web Build instead?',
    a: 'Yes — it\'s a $1,500 add-on. Worth knowing before you do: at that point the Acquisition Engine is only $1,500 more and adds the Custom CRM Pipeline, AI chat & scheduling, the pre-qualifying intake, and automated follow-up. Most people who want the video end up going Engine for that reason.',
  },
  {
    q: 'Why flat pricing instead of hourly billing?',
    a: 'Hourly billing rewards slow work and makes budgeting a guessing game. A fixed price means you know the exact cost before we start, and we\'re incentivized to ship fast and move on to the next milestone, not pad the clock.',
  },
  {
    q: 'What if I need more than what a build includes?',
    a: 'That\'s what the add-ons above are for — videography, additional pages, deeper database/directory integrations, and niche landing page variants can all be added to either build without re-negotiating the whole engagement.',
  },
  {
    q: 'What if I don\'t like the initial design?',
    a: 'Every build includes 2 rounds of revisions before launch, at no extra cost. We don\'t consider a project finished until the design is one you\'re proud to put your name on.',
  },
];

export const revisionGuarantee = '2-Round Revision Guarantee — included with every build';
