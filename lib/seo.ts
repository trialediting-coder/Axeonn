// Single source of truth for every business fact that appears in structured
// data (NAP, geo, hours, service area, social profiles) and for the JSON-LD
// builders the pages share. Keep this in sync with content/brand-guardrails.md
// and public/llms.txt — inconsistent NAP across schema/page/citations is the
// most common local-SEO self-inflicted wound.

import { pricingTiers } from '@/data/pricingData';

export const SITE_URL = 'https://axeonstudio.co';
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Bump when static page content materially changes. Used as the sitemap
// <lastmod> for static routes so we don't tell Google "everything changed"
// on every request.
export const CONTENT_LAST_UPDATED = new Date('2026-10-19T00:00:00Z');

export const BUSINESS = {
  name: 'Axeon Studio',
  telephone: '+1-515-493-8017',
  telephoneDisplay: '(515) 493-8017',
  email: 'hello@axeonstudio.co',
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}/og-axeon-card.png`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'West Des Moines',
    addressRegion: 'IA',
    postalCode: '50266',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.5772,
    longitude: -93.7538,
  },
  // Real published monthly floor/ceiling (AxeonCORE $799, AxeonGROWTH $1,999).
  // Never widen to an unsourced range.
  priceRange: '$799-$1,999',
  // Company profiles only; no personal accounts.
  // Add the Google Business Profile, Yelp and Clutch URLs here once claimed.
  sameAs: [
    'https://www.linkedin.com/company/axeon-studio',
    'https://www.facebook.com/profile.php?id=61593868815413',
  ],
} as const;

// Des Moines metro, ordered roughly by proximity to the West Des Moines base.
export const METRO_CITIES = [
  'West Des Moines',
  'Des Moines',
  'Clive',
  'Urbandale',
  'Waukee',
  'Johnston',
  'Grimes',
  'Ankeny',
  'Altoona',
  'Norwalk',
] as const;

export const OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '18:00',
  },
];

// Schema.org areaServed: named metro cities first (local pack relevance),
// then the state, then the country (remote clients are real, just not the
// primary target).
export const SERVICE_AREA = [
  ...METRO_CITIES.map((city) => ({
    '@type': 'City',
    name: city,
    containedInPlace: { '@type': 'State', name: 'Iowa' },
  })),
  { '@type': 'State', name: 'Iowa' },
  { '@type': 'Country', name: 'United States' },
];

/** Reference to the site-wide organization node — use instead of re-inlining NAP. */
export const providerRef = { '@id': ORG_ID };

const KNOWS_ABOUT = [
  'Patient intake for private practices',
  'Client intake for professional services firms',
  'Missed-call text-back',
  'Speed-to-lead response',
  'Online consultation booking',
  'Review generation',
  'Google Local Services Ads for professional services',
  'Dental practice marketing',
  'Med spa marketing',
  'Law firm marketing',
  'Accounting and CPA firm marketing',
  'Practice website design',
  'Local SEO',
  'Google Business Profile management',
  'Call tracking',
  'AI phone receptionist',
  'Database reactivation campaigns',
];

// The published plans, generated from data/pricingData.ts so the structured
// data can never drift from the pricing cards. Reads only fields every tier
// shape carries (name, price string, optional focus) and skips retired or
// non-public tiers, so a pricingData rewrite cannot leak an old price here.
// Never put a start/setup fee in the offer text.
type CatalogTier = { name: string; price: string | number; focus?: string };
const RETIRED_TIER = /essentials/i;

function planOfferCatalog() {
  const tiers = (pricingTiers as unknown as readonly CatalogTier[]).filter(
    (tier) => !RETIRED_TIER.test(tier.name) && /\d/.test(String(tier.price)),
  );
  return {
    '@type': 'OfferCatalog',
    name: 'Axeon Studio plans',
    url: `${SITE_URL}/pricing`,
    itemListElement: tiers.map((tier) => {
      const price = String(tier.price).replace(/[^0-9.]/g, '');
      const display = `$${Number(price).toLocaleString('en-US')}/month`;
      return {
        '@type': 'Offer',
        name: tier.name,
        description: `${tier.focus ? `${tier.focus}. ` : ''}From ${display} on a 12-month agreement, implementation fee credited.`,
        url: `${SITE_URL}/pricing`,
        price,
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price,
          priceCurrency: 'USD',
          unitCode: 'MON',
          unitText: 'month',
        },
        itemOffered: { '@type': 'Service', name: tier.name, provider: providerRef },
      };
    }),
  };
}

export function localBusinessJsonLd() {
  return {
    '@type': ['ProfessionalService', 'Organization'],
    '@id': ORG_ID,
    name: BUSINESS.name,
    // Other businesses are called "Axeon"; this ties the short name to this one.
    alternateName: ['Axeon', 'Axeon Studio West Des Moines'],
    url: SITE_URL,
    logo: BUSINESS.logo,
    image: BUSINESS.image,
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: BUSINESS.telephone,
      email: BUSINESS.email,
      areaServed: 'US',
      availableLanguage: 'en',
    },
    address: BUSINESS.address,
    geo: BUSINESS.geo,
    openingHoursSpecification: OPENING_HOURS,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: 'USD',
    areaServed: SERVICE_AREA,
    slogan: 'We Get You Patients and Clients, Not Clicks.',
    description:
      'Axeon Studio is a growth partner that gets dental practices, med spas, law firms and accounting firms more new patients and clients: a practice website, SEO and ads that bring them in, and an intake system that answers every one. Every missed call and web inquiry gets a reply within 60 seconds, 24/7, consultations are booked online, and every patient or client is asked for a review after the visit. Based in West Des Moines, Iowa, with a 90-day performance commitment: live in 30 days, 60-second replies, review requests on every visit, or walk away.',
    knowsAbout: KNOWS_ABOUT,
    hasOfferCatalog: planOfferCatalog(),
    sameAs: BUSINESS.sameAs,
  };
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: BUSINESS.name,
    url: SITE_URL,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };
}

/** The site-wide @graph rendered once in the root layout. */
export function siteGraphJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [localBusinessJsonLd(), websiteJsonLd()],
  };
}

/** areaServed for a single-city landing page (e.g. /ankeny-web-design): just that city. */
export function cityAreaServed(city: string) {
  return [{ '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: 'Iowa' } }];
}

interface ServiceArgs {
  path: string;
  serviceType: string;
  name: string;
  description: string;
  category?: string;
  /** Defaults to the full metro SERVICE_AREA. */
  areaServed?: ReturnType<typeof cityAreaServed>;
}

export function serviceJsonLd({ path, serviceType, name, description, category, areaServed }: ServiceArgs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}${path}#service`,
    serviceType,
    name,
    description,
    url: `${SITE_URL}${path}`,
    ...(category ? { category } : {}),
    provider: providerRef,
    areaServed: areaServed ?? SERVICE_AREA,
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const trail: BreadcrumbItem[] = [{ name: 'Home', path: '/' }, ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
