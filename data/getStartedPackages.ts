// data/getStartedPackages.ts
// Single source of truth for the self-serve /get-started flow: the question
// options, the packages it can recommend, and each package's matching rules.
// lib/getStarted.ts reads this; nothing here runs any logic.
//
// Packages mirror the plans on /pricing. They have no Stripe link on purpose:
// every result goes to a booked call (owner decision 2026-09-29), so the
// result screen shows the booking button (see isPaymentLinkReady).

/** Exact values. They map 1:1 to the Airtable "Services" field, so never rename. */
export const SERVICES = ['Website', 'Meta Ads', 'Google Ads', 'SEO', 'AI Automation', 'Content'] as const;
export type Service = (typeof SERVICES)[number];

export const BUSINESS_TYPES = [
  'Home & trade services',
  'Healthcare',
  'Professional services',
  'Restaurant & hospitality',
  'Retail / e-commerce',
  'Nonprofit',
  'Other',
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const HAS_WEBSITE = ['Yes', 'No', 'Needs a redo'] as const;
export type HasWebsite = (typeof HAS_WEBSITE)[number];

export const GOALS = [
  'More calls and leads',
  'Launch or relaunch the brand',
  'Rank higher on Google',
  'Save time with automation',
  'Something else',
] as const;
export type Goal = (typeof GOALS)[number];

/** Monthly budget ranges. The last one always routes to "custom". */
export const BUDGETS = ['Under $1,000', '$1,000 – $2,000', '$2,000 – $3,000', '$3,000+'] as const;
export type Budget = (typeof BUDGETS)[number];
export const CUSTOM_BUDGET: Budget = '$3,000+';

export const TIMELINES = ['As soon as possible', 'Within 30 days', '1–3 months', 'Just exploring'] as const;
export type Timeline = (typeof TIMELINES)[number];

/** Booking page for "talk first" and for the custom result. TODO: confirm, or swap for an external calendar URL. */
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
  /** Deposit amount in whole US dollars. Sent to the webhook as packagePrice. */
  price: number;
  /** Display string, e.g. "$1,500 deposit". */
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

// The two plans from /pricing (data/pricingData.ts). Ads are an add-on scoped
// on a call, so any ads pick routes to the custom result.
const PLAN_BUDGETS: Budget[] = ['Under $1,000', '$1,000 – $2,000', '$2,000 – $3,000'];

// Order matters only as the final tie-breaker in recommendPackage.
export const PACKAGES: Package[] = [
  {
    id: 'essentials',
    name: 'Essentials',
    price: 2800,
    priceLabel: '$2,800 setup, then from $284/mo',
    tagline: 'Get found and get chosen: a site and search presence built to bring in calls.',
    includes: [
      'A custom website written to turn visitors into calls',
      'SEO, AEO and GEO so you show up on Google and in AI answers',
      'Google Business Profile upkeep and a monthly calls & leads report',
    ],
    services: ['Website', 'SEO', 'Content'],
    stripePaymentLink: null,
    match: {
      services: ['Website', 'SEO', 'Content'],
      budgets: PLAN_BUDGETS,
    },
  },
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    price: 5800,
    priceLabel: '$5,800 setup, then from $574/mo',
    tagline: 'The full customer engine: get found, get chosen, and get every lead booked.',
    includes: [
      'Everything in Essentials, plus custom on-site videography',
      'AI chat & scheduling, speed-to-lead call connect and missed-call text-back',
      'CRM pipeline with automated follow-up and call tracking',
    ],
    services: ['Website', 'SEO', 'Content', 'AI Automation'],
    stripePaymentLink: null,
    match: {
      services: ['Website', 'SEO', 'Content', 'AI Automation'],
      budgets: PLAN_BUDGETS,
    },
  },
];

/** Fallback: 3+ services, $3k+ budget, or no clean match. Never has a payment link. */
export const CUSTOM_PACKAGE: Package = {
  id: 'custom',
  name: 'Custom Plan',
  price: 0,
  priceLabel: 'Scoped on a call',
  tagline: 'Your mix needs a custom scope. Let’s map it out together.',
  includes: [
    'A short call to understand your business and goals',
    'A recommended plan built around the services you picked',
    'A clear price before you pay anything',
  ],
  services: [],
  stripePaymentLink: null,
};
