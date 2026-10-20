/**
 * The free after-hours audit offer — single source of truth for every surface
 * that promotes it (offer popup, its side tab, the promo banner). The file name
 * is historical (it used to hold the founding client offer, retired 2026-10-19
 * with the practice repositioning; "$0 to start" and "first month free" are gone).
 *
 * Keep these true when editing:
 * - The audit is genuinely free, with no obligation. Say what it is: an
 *   after-hours call test, how fast the website answers an inquiry, and reviews
 *   vs. the top 3 nearby competitors, delivered as a short video walkthrough.
 * - No fake urgency: no spot counters, no deadlines.
 * - Never promise a number of patients, revenue or rankings.
 */
export const foundingOffer = {
  /** Set to false to take the offer down everywhere at once. */
  active: true,
  eyebrow: 'Free after-hours audit',
  headline: 'What happens when a new patient or client calls after hours?',
  /** One short sentence: the popup shows the headline, this, the button and the terms. */
  subhead:
    'We call your practice or firm after hours, check how fast your website answers an inquiry, and compare your reviews to the top 3 nearby competitors.',
  /** Side-tab and banner label. */
  tabLabel: 'Free audit',
  includes: [
    'An after-hours call test',
    'How fast your website answers an inquiry',
    'Your reviews vs. the top 3 nearby competitors',
    'Mobile speed',
  ],
  href: '/audit',
  cta: 'Get your free after-hours audit',
  ctaHint: 'You get a short video walkthrough of what we found.',
  decline: 'Not right now',
  terms: 'No charge, no obligation. For dental practices, med spas, law firms and CPA firms.',
} as const;

export type FoundingOffer = typeof foundingOffer;
