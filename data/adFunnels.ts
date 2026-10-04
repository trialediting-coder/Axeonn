// Copy for the /go/<slug> paid-ad landing pages. Slugs match data/nichesData.ts.
// Rules (owner, 2026-10-04): the offer is the hook, every section sells the
// result, proof is real or a clearly marked placeholder (shown on previews only).
// Written at a 5th-7th grade reading level on purpose: it converts better.

export interface AdFunnel {
  slug: string;
  /** Who the ad targets, used in the eyebrow: "For Iowa HVAC companies". */
  audience: string;
  /** Singular business noun: "your HVAC business". */
  business: string;
  /** What a new customer is called in this industry. */
  customers: string;
  /** One-line result for the hero subhead. */
  result: string;
  /**
   * What industry-specific proof should go here once we have it. null = we
   * already have real proof in this industry (A-1 for auto detailing).
   */
  proofPlaceholder: string | null;
  /** WORK_PROJECTS name whose screenshot shows "what your site could look like". */
  example: string;
}

export const adFunnels: AdFunnel[] = [
  {
    slug: 'dental',
    example: 'Hintz Family Dentistry',
    audience: 'Iowa dental practices',
    business: 'practice',
    customers: 'new patients',
    result: 'Fill open chairtime and catch the patients who call after hours.',
    proofPlaceholder: 'Dental client result (e.g. new patients per month, before vs. after)',
  },
  {
    slug: 'med-spa',
    example: 'Hintz Family Dentistry',
    audience: 'Iowa med spas',
    business: 'med spa',
    customers: 'consult bookings',
    result: 'Turn more consult requests into booked, paying clients.',
    proofPlaceholder: 'Med spa client result (e.g. consults booked per month)',
  },
  {
    slug: 'hvac',
    example: 'Kaufman Construction',
    audience: 'Iowa HVAC companies',
    business: 'HVAC business',
    customers: 'booked jobs',
    result: 'Get found first when the AC dies, and answer every call, even at 2 AM.',
    proofPlaceholder: 'HVAC client result (e.g. calls per month, before vs. after)',
  },
  {
    slug: 'roofing',
    example: 'Kaufman Construction',
    audience: 'Iowa roofing companies',
    business: 'roofing company',
    customers: 'booked inspections',
    result: 'Win storm leads before they go cold and book more inspections.',
    proofPlaceholder: 'Roofing client result (e.g. inspections booked per month)',
  },
  {
    slug: 'law-firms',
    example: 'MSH Realty Group',
    audience: 'Iowa law firms',
    business: 'firm',
    customers: 'signed cases',
    result: 'Get more of the right cases, and stop losing them to voicemail.',
    proofPlaceholder: 'Law firm client result (e.g. qualified case inquiries per month)',
  },
  {
    slug: 'accounting',
    example: 'MSH Realty Group',
    audience: 'Iowa accounting firms',
    business: 'firm',
    customers: 'new clients',
    result: 'Bring in more high-value advisory clients, not just tax-season noise.',
    proofPlaceholder: 'Accounting client result (e.g. new advisory clients per quarter)',
  },
  {
    slug: 'home-remodeling',
    example: 'Kaufman Construction',
    audience: 'Iowa remodelers and builders',
    business: 'remodeling business',
    customers: 'booked projects',
    result: 'Get more qualified project leads, with budget and scope sorted before you drive out.',
    proofPlaceholder: 'Remodeling client result (e.g. qualified project leads per month)',
  },
  {
    slug: 'real-estate',
    example: 'MSH Realty Group',
    audience: 'Iowa real estate agents',
    business: 'real estate business',
    customers: 'listing appointments',
    result: 'Get found by more buyers and sellers, and follow up with every one automatically.',
    proofPlaceholder: 'Real estate client result (e.g. listing appointments per month)',
  },
  {
    slug: 'landscaping',
    example: 'Kaufman Construction',
    audience: 'Iowa landscapers',
    business: 'landscaping business',
    customers: 'booked jobs',
    result: 'Book more hardscape jobs and stop losing mowing clients to voicemail.',
    proofPlaceholder: 'Landscaping client result (e.g. jobs booked per season)',
  },
  {
    slug: 'auto-detailing',
    example: 'A-1 Auto Detailing',
    audience: 'Iowa auto detailers',
    business: 'detailing business',
    customers: 'booked details',
    result: 'Fill every bay slot, with the right package picked before they show up.',
    proofPlaceholder: null,
  },
];

export const adFunnelFor = (slug: string) => adFunnels.find((f) => f.slug === slug);
