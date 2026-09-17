// One short benefit headline per painPoints entry in data/nichesData.ts, same
// order, keyed by niche slug. Looked up by NichePainPoints.tsx.
export const benefitHeadlinesBySlug: Record<string, string[]> = {
  dental: [
    'Never lose a same-day slot',
    'Free up your front desk',
    'Catch every after-hours inquiry',
    'Keep hygiene chairs full',
  ],
  'med-spa': [
    'Capture every consult request',
    'Close memberships automatically',
    'Stop losing high-ticket services',
    'Cut no-shows before they happen',
  ],
  hvac: [
    'Never miss a 2 AM call',
    'Know exactly who booked',
    'End the dispatch phone tag',
    'Send techs out prepared',
  ],
  roofing: [
    'Bid storm leads before they cool',
    'Qualify scope before the visit',
    'Route claims the right way',
    'Prioritize real storm urgency',
  ],
  'law-firms': [
    'Qualify cases before the call',
    'Close retainers faster',
    'Stop wasting attorney time',
    'Keep intake confidential',
  ],
  accounting: [
    'Triage the tax-season flood',
    'Surface your best advisory leads',
    'Centralize document collection',
    'Handle overflow gracefully',
  ],
  'home-remodeling': [
    'Filter out budget mismatches',
    'Know scope before you drive out',
    'Coordinate every trade automatically',
    'Quote faster than competitors',
  ],
  'real-estate': [
    'Route buyers and sellers separately',
    'Follow up on every valuation',
    'Centralize every showing request',
    'Keep leads warm until showing',
  ],
  landscaping: [
    'Separate mow clients from bids',
    'Know scope before you visit',
    'Handle the spring rush smoothly',
    'Auto-rebook every season',
  ],
  'auto-detailing': [
    'Clarify package selection upfront',
    'End double-booked bays',
    'Route mobile and in-shop cleanly',
    'Bring repeat customers back',
  ],
};
