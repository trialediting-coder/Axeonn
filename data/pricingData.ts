export interface PricingTier {
  id: string;
  name: string;
  focus: string;
  price: string;
  billingNote: string;
  turnaround: string;
  /** Short badge rendered above the card (e.g. "Recommended"). */
  badge?: string;
  /** Rendered as a lead-in above the feature list ("Everything in X, plus:"). */
  inherits?: string;
  features: string[];
  /** One-line "right for you if…" so the chooser question is answered on the card. */
  bestFor?: string;
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

// Two flat-rate builds (one-time setup payments). Each is followed by a monthly
// plan that starts after launch: Core $284/mo, AxeonCORE $574/mo (see PLANS in
// lib/billing.ts). The plans are shown on /pay; this pricing page does not list
// them yet. Numbers here must stay in sync with content/brand-guardrails.md and
// the priceRange in app/layout.tsx.
export const pricingTiers: PricingTier[] = [
  {
    id: 'core-web-build',
    name: 'Essentials',
    focus: 'Show up on Google and in AI answers, with a quote form that sends every lead to your phone.',
    price: '$2,800',
    billingNote: 'Flat-rate build price',
    turnaround: 'Our Fastest Turnaround',
    bestFor: 'Right for you if you just need a credible, fast site that shows up on Google. It brings in leads; it won\'t capture, qualify, or follow up on them for you.',
    features: [
      'SEO, AEO & GEO built in — visible on Google and inside AI answers like ChatGPT',
      'Up to 4 custom-designed, mobile-first pages built around how your business actually sells',
      'Sub-second load speeds & 100% Core Web Vitals pass',
      'Quote request form with instant lead alerts — every request lands in your inbox and on your phone',
      'Conversion tracking events configured so you know which pages produce calls',
      'Foundational ADA accessibility standards',
      'You own 100% of the site, code, and design files',
    ],
    cta: 'Book Essentials',
  },
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    focus: 'Capture, qualify, and close — with real footage of your business',
    price: '$5,800',
    billingNote: 'Flat-rate build price',
    turnaround: 'Fast Turnaround',
    badge: 'Recommended',
    featured: true,
    bestFor: 'The build we recommend: a site that captures, qualifies, and follows up on every lead automatically, with real footage of your business doing the selling.',
    inherits: 'Everything in Essentials, plus:',
    features: [
      'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
      'Complete 5–7 page conversion architecture with conversion-copy hierarchy',
      'Custom CRM Pipeline built around your lead-to-close workflow — no per-seat monthly software',
      'AI chat & online scheduling so leads book themselves 24/7',
      'Multi-step intake questionnaire that pre-qualifies leads before you ever call them',
      'Automated SMS & email follow-up the second a lead comes in',
      'Speed-to-lead call connect — when a form comes in, your phone rings and connects you to that lead while they\'re still on your site',
      'Missed-call text-back — anyone who calls and can\'t reach you gets an instant text, so they don\'t move on to the next company',
      'Exit-intent offers — visitors about to leave see an offer matched to the service they were looking at',
      'Call tracking numbers that show which pages and listings actually make your phone ring',
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
        { label: 'Speed-to-lead call connect + missed-call text-back' },
        { label: 'Exit-intent offers + call tracking' },
        { label: 'Up to 3 additional pages', note: '$450 each as an add-on' },
      ],
      footer: 'The video alone is half the step-up. The lead system comes with it.',
    },
    cta: 'Book AxeonCORE',
  },
];

export const addOns: AddOn[] = [
  { name: 'Custom On-Site Videography (add to Essentials)', price: '+$1,500' },
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
    a: 'Essentials if you just need a credible, fast site online and you\'re happy to chase every lead yourself. AxeonCORE if you want the site to do the selling for you: it captures, qualifies, and follows up on leads automatically, and real footage of your team and your work makes you look like the biggest operation in town in a way no template can. It\'s the build we recommend.',
  },
  {
    q: 'What does the on-site videography actually include?',
    a: 'We come to your location for a half-day shoot — your team, your space, your work. You get a hero film cut for your website, three vertical cuts sized for social and ads, and a photo set for your site and profiles. Everything is shot for the placements it will actually run in, not a single generic video you have to re-purpose yourself.',
  },
  {
    q: 'Can I add videography to Essentials instead?',
    a: 'Yes — it\'s a $1,500 add-on. Worth knowing before you do: at that point AxeonCORE is only $1,500 more and adds the Custom CRM Pipeline, AI chat & scheduling, the pre-qualifying intake, automated follow-up, speed-to-lead call connect, missed-call text-back, exit-intent offers, and call tracking. Most people who want the video end up going AxeonCORE for that reason.',
  },
  {
    q: 'What does the AxeonCORE lead system actually do?',
    a: 'It makes sure a lead never sits waiting. When someone fills out a form, your phone rings and connects you to them while they\'re still on your site. If someone calls and you can\'t pick up, they get a text back right away instead of calling your competitor. Visitors about to leave see an offer tied to the service they were looking at. Every lead lands in your CRM pipeline with automated text and email follow-up, and call tracking shows which pages and listings are making your phone ring.',
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
