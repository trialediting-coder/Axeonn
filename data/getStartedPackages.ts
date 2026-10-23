// data/getStartedPackages.ts
// Single source of truth for the short plan-finder form (components/get-started/
// GetStartedFlow.tsx, embedded in the homepage contact section): the question
// options, the plans it can recommend, and each plan's matching rules.
// lib/getStarted.ts reads this; nothing here runs any logic.
//
// /get-started itself now redirects to /check-your-area (2026-10-19): the
// area check is the primary way in. Plans mirror /pricing
// (data/pricingData.ts) and have no Stripe link on purpose: there is no
// self-serve checkout, every result goes to a booked call (see isPaymentLinkReady).

/** Exact values. They map 1:1 to the Airtable "Services" field, so never rename. */
export const SERVICES = ['Website', 'Meta Ads', 'Google Ads', 'SEO', 'AI Automation', 'Content'] as const;
export type Service = (typeof SERVICES)[number];

export const BUSINESS_TYPES = ['Dental', 'Med spa', 'Law firm', 'Accounting / CPA', 'Other practice'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const HAS_WEBSITE = ['Yes', 'No', 'Needs a redo'] as const;
export type HasWebsite = (typeof HAS_WEBSITE)[number];

export const GOALS = [
  'Answer every call and inquiry',
  'More new patients or clients',
  'More reviews',
  'A new website for the practice or firm',
  'Something else',
] as const;
export type Goal = (typeof GOALS)[number];

/** Monthly budget ranges. The last one always routes to "custom". */
export const BUDGETS = ['Under $1,000', '$1,000 – $2,000', '$2,000 – $3,000', '$3,000+'] as const;
export type Budget = (typeof BUDGETS)[number];
export const CUSTOM_BUDGET: Budget = '$3,000+';

export const TIMELINES = ['As soon as possible', 'Within 30 days', '1–3 months', 'Just exploring'] as const;
export type Timeline = (typeof TIMELINES)[number];

/** Booking page for "talk first" and for the custom result. */
export const BOOKING_URL = '/book';

/** Shown on the success page if the next-steps email never arrives. */
export const FALLBACK_CONTACT_EMAIL = 'hello@axeonstudio.co';

export interface PackageMatch {
  /** Every service the visitor picked must be in this list. */
  services: Service[];
  /** Hard filter: the visitor's budget must be one of these. */
  budgets: Budget[];
  /** Optional filter on "Do you have a website?". Omit to accept any answer. */
  hasWebsite?: HasWebsite[];
}

export interface Package {
  id: string;
  name: string;
  /** Starting monthly price in whole US dollars. Sent to the webhook as packagePrice. */
  price: number;
  /** Display string, e.g. "From $799/mo". */
  priceLabel: string;
  tagline: string;
  includes: string[];
  /** Airtable values for this package. Sent to the webhook as services. */
  services: Service[];
  /** Stripe Payment Link (https://buy.stripe.com/...), or null for custom. */
  stripePaymentLink: string | null;
  /** Absent only on the custom fallback. */
  match?: PackageMatch;
}

// The two plans from /pricing (data/pricingData.ts). AxeonGROWTH is the only
// plan with ads, so any ads pick routes there; it needs a $2k+ budget, since the
// $500/mo ad-spend minimum sits on top of the $1,999/mo.
const CORE_BUDGETS: Budget[] = ['Under $1,000', '$1,000 – $2,000', '$2,000 – $3,000'];
const GROWTH_BUDGETS: Budget[] = ['$2,000 – $3,000'];

// Order matters only as the final tie-breaker in recommendPackage.
export const PACKAGES: Package[] = [
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    price: 799,
    priceLabel: 'From $799/mo',
    tagline: 'Patient & client intake: every missed call and web inquiry answered within 60 seconds, 24/7.',
    includes: [
      'A custom website with online consultation booking',
      '24/7 missed-call text-back, an AI phone receptionist, and a first reply to every web inquiry within 60 seconds',
      'Review requests after every appointment, AxeonPROOF, and the 90-day performance commitment',
    ],
    services: ['Website', 'SEO', 'Content', 'AI Automation'],
    stripePaymentLink: null,
    match: {
      services: ['Website', 'SEO', 'Content', 'AI Automation'],
      budgets: CORE_BUDGETS,
    },
  },
  {
    id: 'axeongrowth',
    name: 'AxeonGROWTH',
    price: 1999,
    priceLabel: 'From $1,999/mo + ad spend',
    tagline: 'Intake infrastructure plus active acquisition: ads, photo and video, and reactivation.',
    includes: [
      'Everything in AxeonCORE, plus Google Local Services Ads & search ads management',
      'A quarterly reactivation campaign to past patients and clients',
      'Quarterly photo & video, and a monthly strategy call',
    ],
    services: ['Website', 'SEO', 'Content', 'AI Automation', 'Google Ads', 'Meta Ads'],
    stripePaymentLink: null,
    match: {
      services: ['Website', 'SEO', 'Content', 'AI Automation', 'Google Ads', 'Meta Ads'],
      budgets: GROWTH_BUDGETS,
    },
  },
];

/** Fallback: 3+ services, $3k+ budget, or no clean match. Never has a payment link. */
export const CUSTOM_PACKAGE: Package = {
  id: 'custom',
  name: 'Custom Plan',
  price: 0,
  priceLabel: 'Scoped on a call',
  tagline: 'Your practice or firm needs a custom scope. Let’s map it out together.',
  includes: [
    'A short call to understand your practice or firm and goals',
    'A recommended plan built around what you picked',
    'A clear price before you sign anything',
  ],
  services: [],
  stripePaymentLink: null,
};
