// Copy for the /go/<slug> paid-ad landing pages. Slugs match data/nichesData.ts.
// Rules (owner, 2026-10-19): the free after-hours audit is the hook, prices are
// "From $799/mo" only, and proof is real or a clearly marked placeholder (shown
// on preview deploys only). No practice client results exist yet, so none are
// claimed. Retired trade funnels 301 to /audit (next.config.mjs).

export interface AdFunnel {
  slug: string;
  /** Short label after the offer in the <title>: "... | Iowa Dental". */
  titleLabel: string;
  /** Who the ad targets, used in the eyebrow: "For Iowa dental practices". */
  audience: string;
  /** Singular practice noun: "your practice". */
  business: string;
  /** What a new patient or client is called here, plural. */
  customers: string;
  /** One-line result for the hero subhead. Never a promised number. */
  result: string;
  /** What practice-specific proof should go here once we have it (preview-only placeholder). */
  proofPlaceholder: string;
  /**
   * WORK_PROJECTS name of a concept build in this practice type, if one
   * exists. Shown only when its niche matches, always labeled "Concept build".
   */
  example?: string;
}

export const adFunnels: AdFunnel[] = [
  {
    slug: 'dental',
    titleLabel: 'Iowa Dental',
    example: 'Hintz Family Dentistry',
    audience: 'Iowa dental practices',
    business: 'practice',
    customers: 'new patients',
    result: 'Every after-hours call and web inquiry gets a reply within 60 seconds, and new-patient exams and implant or Invisalign consults get booked.',
    proofPlaceholder: 'Dental client result once we have one (e.g. after-hours inquiries answered per month)',
  },
  {
    slug: 'med-spa',
    titleLabel: 'Iowa Med Spas',
    audience: 'Iowa med spas',
    business: 'med spa',
    customers: 'consult requests',
    result: 'Every consult request gets a reply within 60 seconds, any hour, and gets booked before they shop around.',
    proofPlaceholder: 'Med spa client result once we have one (e.g. consults booked from after-hours inquiries)',
  },
  {
    slug: 'law-firms',
    titleLabel: 'Iowa Law Firms',
    audience: 'Iowa law firms',
    business: 'firm',
    customers: 'intake calls',
    result: 'Every missed intake call and web inquiry gets a reply within 60 seconds, with a conflict-safe first contact and a booked consultation.',
    proofPlaceholder: 'Law firm client result once we have one (e.g. after-hours intake calls answered)',
  },
  {
    slug: 'accounting',
    titleLabel: 'Iowa Accounting Firms',
    audience: 'Iowa accounting and CPA firms',
    business: 'firm',
    customers: 'new clients',
    result: 'Tax-season overflow and after-hours calls get a reply within 60 seconds, and advisory consults get booked.',
    proofPlaceholder: 'Accounting client result once we have one (e.g. tax-season calls answered)',
  },
];

export const adFunnelFor = (slug: string) => adFunnels.find((f) => f.slug === slug);
