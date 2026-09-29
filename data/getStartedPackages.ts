// data/getStartedPackages.ts
// Single source of truth for the self-serve /get-started flow: the question
// options, the packages it can recommend, and each package's matching rules.
// lib/getStarted.ts reads this; nothing here runs any logic.
//
// Every name, price, tagline, include, and Stripe link below is a TODO for the
// owner to fill. Do not invent them. Until a package has a real
// https://buy.stripe.com/ link, the result screen falls back to the booking
// button instead of a broken pay button (see isPaymentLinkReady).

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

const TODO_INCLUDES = ['TODO: include 1', 'TODO: include 2', 'TODO: include 3'];

// Order matters only as the final tie-breaker in recommendPackage.
export const PACKAGES: Package[] = [
  {
    id: 'website',
    name: 'TODO: Website package name',
    price: 0, // TODO: deposit in dollars
    priceLabel: 'TODO: price label',
    tagline: 'TODO: one-line tagline',
    includes: TODO_INCLUDES,
    services: ['Website'],
    stripePaymentLink: '', // TODO: https://buy.stripe.com/...
    match: {
      services: ['Website'],
      budgets: ['Under $1,000', '$1,000 – $2,000', '$2,000 – $3,000'],
    },
  },
  {
    id: 'ads',
    name: 'TODO: Ads package name',
    price: 0, // TODO: deposit in dollars
    priceLabel: 'TODO: price label',
    tagline: 'TODO: one-line tagline',
    includes: TODO_INCLUDES,
    services: ['Meta Ads', 'Google Ads'],
    stripePaymentLink: '', // TODO: https://buy.stripe.com/...
    match: {
      services: ['Meta Ads', 'Google Ads'],
      budgets: ['$1,000 – $2,000', '$2,000 – $3,000'],
      // Ads need somewhere to land. No site, or one that needs a redo, goes to custom.
      hasWebsite: ['Yes'],
    },
  },
  {
    id: 'seo-content',
    name: 'TODO: SEO + Content package name',
    price: 0, // TODO: deposit in dollars
    priceLabel: 'TODO: price label',
    tagline: 'TODO: one-line tagline',
    includes: TODO_INCLUDES,
    services: ['SEO', 'Content'],
    stripePaymentLink: '', // TODO: https://buy.stripe.com/...
    match: {
      services: ['SEO', 'Content'],
      budgets: ['$1,000 – $2,000', '$2,000 – $3,000'],
      hasWebsite: ['Yes'],
    },
  },
  {
    id: 'ai-automation',
    name: 'TODO: AI Automation package name',
    price: 0, // TODO: deposit in dollars
    priceLabel: 'TODO: price label',
    tagline: 'TODO: one-line tagline',
    includes: TODO_INCLUDES,
    services: ['AI Automation'],
    stripePaymentLink: '', // TODO: https://buy.stripe.com/...
    match: {
      services: ['AI Automation'],
      budgets: ['$1,000 – $2,000', '$2,000 – $3,000'],
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
    'A clear, flat price before you pay anything',
  ],
  services: [],
  stripePaymentLink: null,
};
