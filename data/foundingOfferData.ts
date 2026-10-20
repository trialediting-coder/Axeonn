/**
 * The front-door offer — single source of truth for every surface that
 * promotes it (offer popup, its side tab, the promo banner). The file name is
 * historical (it used to hold the founding client offer, then the free
 * after-hours audit; both retired 2026-10-19).
 *
 * Keep these true when editing:
 * - The hook is the area check (/check-your-area): one practice or firm per
 *   specialty within 5 miles, stated as a policy that protects the client.
 * - The offer is "$0 to start. Nothing due until it's working." (build waived
 *   on the 12-month agreement, first payment at go-live, 90-day commitment).
 * - No fake urgency: no spot counters, no countdowns, no deadlines.
 * - Never promise a number of patients, revenue or rankings.
 */
export const foundingOffer = {
  /** Set to false to take the offer down everywhere at once. */
  active: true,
  eyebrow: 'West Des Moines · Central Iowa',
  headline: 'Is your specialty still open in your area?',
  /** One short sentence: the popup shows the headline, this, the button and the terms. */
  subhead:
    "One practice or firm per specialty within 5 miles. When we're working with you, we don't work for the competitor down the street.",
  /** Side-tab and banner label. */
  tabLabel: 'Check your area',
  includes: [
    '$0 setup (normally $3,000)',
    "First payment only once it's working",
    '90-day performance commitment',
    'One practice or firm per specialty within 5 miles',
  ],
  href: '/check-your-area',
  cta: 'Check if your area is open',
  ctaHint: "$0 to start. Nothing due until it's working.",
  decline: 'Not right now',
  terms: "We'll confirm your area within one business day. For dental practices, med spas, law firms and CPA firms.",
} as const;

export type FoundingOffer = typeof foundingOffer;
