export type HighlightIcon = 'proof' | 'ads' | 'video' | 'phone';

export interface PricingTier {
  id: string;
  name: string;
  focus: string;
  /** Shown before the price, e.g. "From". */
  pricePrefix?: string;
  /** The headline monthly price, e.g. "$799". */
  price: string;
  /** Shown next to the price, e.g. "/mo". */
  billingNote: string;
  /** The term line under the price, e.g. "12-month agreement · $3,000 setup included". */
  startFee: string;
  /** Small line under the term; empty for none. */
  startNote: string;
  turnaround: string;
  /** Short badge rendered above the card (e.g. "Most practices start here"). */
  badge?: string;
  /** Rendered as a lead-in above the feature list ("Everything in X, plus:"). */
  inherits?: string;
  features: string[];
  /** One-line "right for you if…" so the chooser question is answered on the card. */
  bestFor?: string;
  /** Feature strings that get the highlighted "headline" treatment in the card, with their icon. */
  highlightFeatures?: { feature: string; icon: HighlightIcon }[];
  cta: string;
  /** featured = the plan most practices start on, premium = the top plan (dark). */
  variant: 'plain' | 'featured' | 'premium';
}

export interface AddOn {
  name: string;
  price: string;
}

// Two public plans (2026-10-19 repositioning): patient & client intake
// infrastructure for established private practices (dental, med spa, law, CPA).
// Public copy shows "From $799/mo" and "From $1,999/mo" only. No self-serve
// checkout; every plan starts with the free after-hours audit or a call.
// AxeonCORE: 12-month agreement, $3,000 implementation credited in full;
// month-to-month available with the $3,000 paid upfront; prepay a year = 2
// months free. AxeonGROWTH: 12-month agreement, $5,000 implementation credited,
// ad spend separate ($500/mo minimum, paid to Google directly).
// Never promise a number of leads, patients, revenue or rankings.
// Keep in sync with data/agreementTemplate.ts (Schedule A), content/brand-guardrails.md,
// lib/postValidation.ts and priceRange in lib/seo.ts.
// Business email (3 / 5 mailboxes) still ships with each plan:
// MAILBOXES_INCLUDED in lib/businessEmailShared.ts (lib/businessEmail.test.ts checks the cards).

/** The one line other pages print for the entry price (niche heroes, banners). */
export const STARTING_PRICE = '$799';
export const STARTING_PRICE_LINE = 'From $799/mo';

export const TERM_LINE = '12-month agreement · $3,000 setup included · month-to-month available';
export const ANNUAL_DEAL = 'Prepay a year and get 2 months free.';
export const AD_SPEND_RULE =
  'Ad spend is separate: $500/mo minimum, paid to Google directly on your own card, with no markup.';
export const TERRITORY_LINE = 'One practice per specialty within 5 miles.';
export const OWNERSHIP_LINE =
  'Your domain, Google Business Profile, and patient and client contact data are always yours. The website design and code become yours once the 12-month term is paid. The intake system, phone and text numbers, and AxeonPROOF are a service and stop if you leave.';
export const COMPLIANCE_LINE =
  'Intake collects name, contact, service and preferred time only — never symptoms, insurance or health details.';

export const pricingTiers: PricingTier[] = [
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    focus: 'Patient & client intake infrastructure',
    pricePrefix: 'From',
    price: '$799',
    billingNote: '/mo',
    startFee: '12-month agreement · $3,000 setup included',
    startNote: 'Month-to-month available with the $3,000 setup paid upfront. Prepay a year and get 2 months free.',
    turnaround: 'Live within 30 days of getting your materials',
    badge: 'Most practices start here',
    bestFor:
      'Right for you if calls and web inquiries go to voicemail or sit until morning. Every one gets a reply within 60 seconds, 24/7, and a way to book.',
    features: [
      'Custom mobile-first practice website: providers & credentials, services, reviews, booking',
      '24/7 missed-call text-back',
      'First reply to every web inquiry within 60 seconds',
      'Online consultation booking',
      'Two-way text inbox for the front desk',
      'Call tracking',
      'Automated review requests after each appointment',
      'AxeonPROOF client portal: live recovered-inquiry counter, change requests, monthly reports',
      'Hosting, security and monitoring',
      'Up to 2 hours of content updates a month',
      '90-day performance commitment',
      '5-mile territory exclusivity for your specialty',
      '3 business email addresses at your own domain',
    ],
    highlightFeatures: [
      { feature: '24/7 missed-call text-back', icon: 'phone' },
      {
        feature: 'AxeonPROOF client portal: live recovered-inquiry counter, change requests, monthly reports',
        icon: 'proof',
      },
    ],
    cta: 'Get your free after-hours audit',
    variant: 'featured',
  },
  {
    id: 'axeongrowth',
    name: 'AxeonGROWTH',
    focus: 'Intake infrastructure + active acquisition',
    pricePrefix: 'From',
    price: '$1,999',
    billingNote: '/mo + ad spend',
    startFee: '12-month agreement · $5,000 setup included',
    startNote: 'Ad spend is separate: $500/mo minimum, paid to Google directly.',
    turnaround: 'Live within 30 days of getting your materials',
    bestFor:
      'Right for you if your intake is solid and you want more new patients or clients coming in: we run your Google ads, answer your phones with AI, and work your past-patient list.',
    inherits: 'Everything in AxeonCORE, plus:',
    features: [
      'Google Local Services Ads & search ads management',
      'Quarterly database reactivation campaign to past patients and clients',
      'AI phone receptionist',
      'Multi-provider calendar & intake routing',
      'Quarterly photo & video: review videos and reels',
      'Monthly strategy call + quarterly business review',
      'Priority support',
      '5 business email addresses at your own domain',
    ],
    highlightFeatures: [
      { feature: 'Google Local Services Ads & search ads management', icon: 'ads' },
      { feature: 'AI phone receptionist', icon: 'phone' },
      { feature: 'Quarterly photo & video: review videos and reels', icon: 'video' },
    ],
    cta: 'Get your free after-hours audit',
    variant: 'premium',
  },
];

export const addOns: AddOn[] = [
  { name: 'Google Local Services Ads management on AxeonCORE', price: '+$750 / mo' },
  { name: 'Database reactivation campaign', price: '$100 / showed appointment' },
  { name: 'AI phone receptionist', price: '+$199 / mo' },
  { name: 'Extra page', price: '+$450 / page' },
  { name: 'On-site videography', price: '+$1,500' },
  { name: 'Extra business email mailbox', price: '+$10 / mo' },
];

export interface PricingFaq {
  q: string;
  a: string;
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: 'How does the pricing work?',
    a: 'AxeonCORE starts at $799/mo and AxeonGROWTH at $1,999/mo, on a 12-month agreement. The setup ($3,000 on CORE, $5,000 on GROWTH) is credited in full when you take the 12-month term, so nothing is due for it at signing. Prepay a year and you get 2 months free. Your exact price is confirmed after the free audit, based on your locations and providers.',
  },
  {
    q: 'Why a 12-month agreement?',
    a: "Setting up your website, phone and text numbers, booking, and review requests is a few weeks of work up front. The 12-month term is how we credit that $3,000 setup instead of billing it. After 12 months it continues month-to-month, and either side can stop with 30 days' notice.",
  },
  {
    q: 'Can I go month-to-month instead?',
    a: 'Yes. Pay the $3,000 setup upfront and AxeonCORE runs month-to-month from the start. Most practices take the 12-month agreement because the setup is then credited in full.',
  },
  {
    q: 'What is the $3,000?',
    a: "It's the implementation fee for AxeonCORE: the website build, number setup and carrier registration, booking, the inquiry reply system, review requests, and AxeonPROOF. On the 12-month agreement it is credited in full and never charged. On month-to-month it is paid upfront. AxeonGROWTH's implementation is $5,000, credited the same way.",
  },
  {
    q: 'What is the 90-day performance commitment?',
    a: "Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don't fix it within 15 days, you can walk away and owe nothing for the rest of the term. We don't promise a number of new patients, revenue, or rankings. We promise the system does its job.",
  },
  {
    q: 'Is ad spend included in AxeonGROWTH?',
    a: "No. Your ad budget goes straight to Google, on your own card and in your own account, with no markup from us. The minimum is $500/mo, because below that there isn't enough data to keep improving the campaigns. Local Services Ads bill you per lead. The $1,999/mo is for running them.",
  },
  {
    q: 'What does territory exclusivity mean?',
    a: "One practice per specialty within 5 miles. While your account is in good standing, we won't take on another practice in your specialty within 5 miles of you.",
  },
  {
    q: 'Do you collect patient health information?',
    a: 'No. Intake collects name, contact, service and preferred time only, never symptoms, insurance or health details. The forms and text replies are set up that way on purpose.',
  },
  {
    q: 'What do I own?',
    a: 'Your domain, Google Business Profile, and patient and client contact data are always yours. The website design and code become yours once the 12-month term is paid. The intake system, phone and text numbers, and AxeonPROOF are a service, so they stop if you leave.',
  },
  {
    q: 'What happens after 12 months?',
    a: "The agreement continues month-to-month at the same price, and you can stop with 30 days' notice. Once the term is paid, the website design and code are yours, and if you leave we hand over the files and your contact data.",
  },
  {
    q: 'Which plan should I pick?',
    a: 'AxeonCORE if the problem is answering: calls going to voicemail, web inquiries waiting until morning, reviews that never get asked for. AxeonGROWTH if your intake is already solid and you want more new patients or clients coming in through Google ads, an AI receptionist, and past-patient campaigns. The free audit usually makes the answer obvious.',
  },
];

/** The performance commitment, word for word. Never paraphrase it. */
export const guaranteeSentence =
  "Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don't fix it within 15 days, you can walk away and owe nothing for the rest of the term.";

/** The short form, for badges and strips. */
export const guaranteeShort =
  '90-day performance commitment: live in 30 days, 60-second replies, review requests on every visit — or walk away.';

/**
 * How many feature bullets a plan card shows up front; the rest sit behind
 * "See everything included". Order each tier's features strongest-first.
 */
export const FEATURED_BULLETS = 5;

export const customerGuarantee = `90-Day Performance Commitment: ${guaranteeSentence}`;
export const revisionGuarantee = '2 rounds of design revisions before launch, included';
