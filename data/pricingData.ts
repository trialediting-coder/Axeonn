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
  /** The term line under the price, e.g. "$0 to start · $3,000 build waived on the 12-month agreement". */
  startFee: string;
  /** The list setup price shown crossed out (components/common/SetupPrice.tsx). */
  setupWas: string;
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
// checkout; every plan starts with an area check (/check-your-area) or a call.
// Front-door offer (owner, 2026-10-19 later): "$0 to start. Nothing due until
// it's working." = the $3,000 build is waived on the 12-month partnership and
// the first monthly payment is charged at go-live (site up, every call and
// inquiry answered within 60 seconds). OFFER_* below are the only wording.
// AI phone receptionist moved into AxeonCORE (owner, 2026-10-20; site copy 2026-10-22).
// AxeonCORE: 12-month agreement, $3,000 implementation (the build) waived;
// month-to-month available with the $3,000 paid upfront; prepay a year = 2
// months free. AxeonGROWTH: 12-month agreement, $5,000 implementation waived,
// ad spend separate ($500/mo minimum, paid to Google directly).
// Never promise a number of leads, patients, revenue or rankings.
// Keep in sync with data/agreementTemplate.ts (Schedule A), content/brand-guardrails.md,
// lib/postValidation.ts and priceRange in lib/seo.ts.
// Business email (3 / 5 mailboxes) still ships with each plan:
// MAILBOXES_INCLUDED in lib/businessEmailShared.ts (lib/businessEmail.test.ts checks the cards).

/** The one line other pages print for the entry price (niche heroes, banners). */
export const STARTING_PRICE = '$799';
export const STARTING_PRICE_LINE = 'From $799/mo';

export const TERM_LINE = "12-month agreement · first payment when you're live · month-to-month available";
export const ANNUAL_DEAL = 'Prepay a year and get 2 months free.';
export const AD_SPEND_RULE =
  'Ad spend is separate: $500/mo minimum, paid to Google directly on your own card, with no markup.';
export const TERRITORY_LINE = 'One practice or firm per specialty within 5 miles.';
/** Exclusivity as a policy that protects the client. Never fake scarcity: no countdowns, no "spots left". */
export const EXCLUSIVITY_LINE = 'One practice or firm per specialty within 5 miles.';

/** The primary CTA everywhere (replaces the free after-hours audit as the hook). */
export const AREA_CHECK_HREF = '/check-your-area';
export const AREA_CHECK_CTA = 'Check your area';
export const AREA_CHECK_CTA_LONG = 'Check if your area is open';

/** The front-door offer, word for word. */
export const OFFER_LINE = "$0 to start. Nothing due until it's working.";
export const OFFER_SHORT = '$0 to start';
/** Shown under a <SetupPrice /> line, which carries the crossed-out setup price. */
export const OFFER_POINTS = [
  "First payment only once you're live.",
  'Miss the 90-day commitment, walk away.',
] as const;
export const OWNERSHIP_LINE =
  'Your domain, Google profile and contact data are always yours. The site is yours once the 12-month term is paid.';
export const COMPLIANCE_LINE =
  'Intake collects name, contact, service and preferred time only — never symptoms, insurance, case facts or tax details.';

export const pricingTiers: PricingTier[] = [
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    focus: 'Patient & client intake infrastructure',
    pricePrefix: 'From',
    price: '$799',
    billingNote: '/mo',
    startFee: "12-month agreement · first payment when you're live",
    setupWas: '$3,000',
    startNote: "First payment once you're live. Month-to-month: $3,000 upfront, then monthly from go-live. Prepay a year and get 2 months free.",
    turnaround: 'Live within 30 days of getting your materials',
    badge: 'Most Partners Start Here',
    bestFor:
      'For calls and inquiries that hit voicemail or wait until morning.',
    features: [
      'Custom mobile-first website: providers or attorneys & credentials, services, reviews, booking',
      '24/7 missed-call text-back',
      'AI phone receptionist for calls your team can’t get to',
      'First reply to every web inquiry within 60 seconds',
      'Online consultation booking',
      'Two-way text inbox for your front desk or intake team',
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
    cta: 'Check if your area is open',
    variant: 'featured',
  },
  {
    id: 'axeongrowth',
    name: 'AxeonGROWTH',
    focus: 'Intake infrastructure + active acquisition',
    pricePrefix: 'From',
    price: '$1,999',
    billingNote: '/mo + ad spend',
    startFee: "12-month agreement · first payment when you're live",
    setupWas: '$5,000',
    startNote: "First payment once you're live. Ad spend is separate: $500/mo minimum, paid to Google directly.",
    turnaround: 'Live within 30 days of getting your materials',
    bestFor:
      'Right for you if your intake is solid and you want more new patients or clients coming in: we run your Google ads, film your practice or firm every quarter, and work your list of past patients or clients.',
    inherits: 'Everything in AxeonCORE, plus:',
    features: [
      'Google Local Services Ads & search ads management',
      'Quarterly database reactivation campaign to past patients and clients',
      'Multi-provider calendar & intake routing',
      'Quarterly photo & video: review videos and reels',
      'Monthly strategy call + quarterly business review',
      'Priority support',
      '5 business email addresses at your own domain',
    ],
    highlightFeatures: [
      { feature: 'Google Local Services Ads & search ads management', icon: 'ads' },
      { feature: 'Quarterly photo & video: review videos and reels', icon: 'video' },
    ],
    cta: 'Check if your area is open',
    variant: 'premium',
  },
];

export const addOns: AddOn[] = [
  { name: 'Google Local Services Ads management on AxeonCORE', price: '+$750 / mo' },
  { name: 'Database reactivation campaign', price: '$100 / showed appointment' },
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
    a: "AxeonCORE from $799/mo, AxeonGROWTH from $1,999/mo, on a 12-month agreement. Setup is $0, and the first payment comes once you're live. Exact price is confirmed on the call.",
  },
  {
    q: 'How much does dental or med spa SEO cost?',
    a: "Local SEO is part of AxeonCORE, from $799/mo, with the website and 60-second intake. No separate SEO retainer, and no ranking guarantees from us or anyone honest.",
  },
  {
    q: 'How much does a law firm or CPA website cost?',
    a: "The website is part of AxeonCORE, from $799/mo on a 12-month agreement, with $0 setup (normally $3,000). Hosting, updates and intake are included.",
  },
  {
    q: 'Why a 12-month agreement?',
    a: "The build is weeks of work up front. On 12 months we waive it and bill only once it's working. After that it's month-to-month with 30 days' notice.",
  },
  {
    // Honest, not hidden (friction audit C2): what leaving early costs.
    q: 'Can I leave before the 12 months are up?',
    a: "Yes, owing nothing, if we miss the 90-day commitment and don't fix it in 15 days. Otherwise the rest of the term is still owed. Month-to-month has no term.",
  },
  {
    q: 'Can I go month-to-month instead?',
    a: 'Yes. Pay the $3,000 build upfront, then monthly from go-live. Or prepay a year for $7,990 and get 2 months free.',
  },
  {
    q: 'What is the $3,000?',
    a: "The AxeonCORE build: site, numbers, booking, replies, reviews and AxeonPROOF. Waived on 12 months, paid upfront on month-to-month. GROWTH's is $5,000.",
  },
  {
    q: "What does 'working' mean?",
    a: "Your site is live and every inquiry gets a reply in 60 seconds. That's when the first payment is charged.",
  },
  {
    q: 'What is the 90-day performance commitment?',
    a: "Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don't fix it within 15 days, you can walk away and owe nothing for the rest of the term. We don't promise a number of new patients, clients, cases, revenue, or rankings. We promise the system does its job.",
  },
  {
    q: 'Is ad spend included in AxeonGROWTH?',
    a: "No. Ad spend goes straight to Google on your own card, no markup. The minimum is $500/mo.",
  },
  {
    q: 'What does territory exclusivity mean?',
    a: "One practice or firm per specialty within 5 miles, while your account is in good standing. We don't work for the competitor down the street.",
  },
  {
    q: 'Do you collect health, case or financial information?',
    a: 'No. Name, contact, service and preferred time only. Never health, case or tax details. Need a business associate agreement (BAA)? We sign one on request.',
  },
  {
    q: 'What do I own?',
    a: 'Your domain, Google profile and contact data, always. The site once the 12-month term is paid. Intake and AxeonPROOF are a service.',
  },
  {
    q: 'What happens after 12 months?',
    a: "It goes month-to-month at the same price, stop with 30 days' notice. The site is yours.",
  },
  {
    q: 'Which plan should I pick?',
    a: 'AxeonCORE if the problem is answering. AxeonGROWTH if intake is solid and you want more coming in through ads. The call makes it obvious.',
  },
];

/** The performance commitment, word for word. Never paraphrase it. */
export const guaranteeSentence =
  "Live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don't fix it within 15 days, you can walk away and owe nothing for the rest of the term.";

/**
 * The commitment as the site shows it: one confident line (owner, 2026-10-19:
 * the full sentence everywhere read like "we're trying to prove something").
 * The full wording above lives in the FAQ, /terms and client documents.
 */
export const COMMITMENT_HEADLINE = 'Live in 30 days. Every inquiry answered in 60 seconds. Or you walk away.';
export const COMMITMENT_NOTE = 'Written into your agreement.';
export const COMMITMENT_TERMS_HREF = '/pricing#pricing-faq';

/** The short form, for badges and strips. */
export const guaranteeShort =
  '90-day performance commitment: live in 30 days, 60-second replies, review requests on every appointment — or walk away.';

/**
 * How many feature bullets a plan card shows up front; the rest sit behind
 * "See everything included". Order each tier's features strongest-first.
 */
export const FEATURED_BULLETS = 5;

export const customerGuarantee = `90-Day Performance Commitment: ${guaranteeSentence}`;
export const revisionGuarantee = '2 rounds of design revisions before launch, included';
