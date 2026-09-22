// Single source of truth for every business fact that appears in structured
// data (NAP, geo, hours, service area, social profiles) and for the JSON-LD
// builders the pages share. Keep this in sync with content/brand-guardrails.md
// and public/llms.txt — inconsistent NAP across schema/page/citations is the
// most common local-SEO self-inflicted wound.

export const SITE_URL = 'https://axeonstudio.co';
export const ORG_ID = `${SITE_URL}/#organization`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Bump when static page content materially changes. Used as the sitemap
// <lastmod> for static routes so we don't tell Google "everything changed"
// on every request.
export const CONTENT_LAST_UPDATED = new Date('2026-09-22T00:00:00Z');

export const BUSINESS = {
  name: 'Axeon Studio',
  telephone: '+1-515-493-8017',
  telephoneDisplay: '(515) 493-8017',
  email: 'hayder.hatem@axeonstudio.co',
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
  // Real published pricing floor/ceiling — never widen to an unsourced range.
  priceRange: '$2800-$5800',
  sameAs: [
    'https://www.linkedin.com/company/axeonstudio',
    'https://x.com/HayderHatemm',
    'https://www.instagram.com/hayderhatemm/',
  ],
} as const;

export const FOUNDER = {
  name: 'Hayder Hatem',
  jobTitle: 'Founder & Principal Systems Architect',
  image: `${SITE_URL}/hayder_hatem.webp`,
  sameAs: [
    'https://www.linkedin.com/in/hayder-hatem-4a6720318/',
    'https://x.com/HayderHatemm',
    'https://www.instagram.com/hayderhatemm/',
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
  'Web design',
  'Website development',
  'Local SEO',
  'Search engine optimization',
  'Answer engine optimization',
  'Generative engine optimization',
  'Lead generation',
  'CRM pipeline automation',
  'AI chat and online scheduling',
  'Video and photography production',
];

export function localBusinessJsonLd() {
  return {
    '@type': ['ProfessionalService', 'Organization'],
    '@id': ORG_ID,
    name: BUSINESS.name,
    url: SITE_URL,
    logo: BUSINESS.logo,
    image: BUSINESS.image,
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    address: BUSINESS.address,
    geo: BUSINESS.geo,
    openingHoursSpecification: OPENING_HOURS,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: 'USD',
    areaServed: SERVICE_AREA,
    slogan: 'Your Business. Your Partner.',
    description:
      'Web design, SEO/AEO/GEO, AI chat & scheduling, lead-generation pipelines, and on-site video for Des Moines-area businesses — flat pricing, built and run by one West Des Moines team.',
    knowsAbout: KNOWS_ABOUT,
    founder: { '@id': FOUNDER_ID },
    sameAs: BUSINESS.sameAs,
  };
}

export function founderJsonLd() {
  return {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    image: FOUNDER.image,
    url: `${SITE_URL}/about`,
    email: BUSINESS.email,
    worksFor: { '@id': ORG_ID },
    address: BUSINESS.address,
    sameAs: FOUNDER.sameAs,
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
    '@graph': [localBusinessJsonLd(), founderJsonLd(), websiteJsonLd()],
  };
}

interface ServiceArgs {
  path: string;
  serviceType: string;
  name: string;
  description: string;
  category?: string;
}

export function serviceJsonLd({ path, serviceType, name, description, category }: ServiceArgs) {
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
    areaServed: SERVICE_AREA,
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
