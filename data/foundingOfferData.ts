/**
 * Founding Client Offer — single source of truth for every surface that
 * promotes it (exit popup, promo banner, any future landing section).
 *
 * Compliance notes (keep these true when editing):
 * - This is a real offer. Copy must never say a visitor *has* qualified;
 *   only that Iowa businesses *may* qualify. Qualification happens on the call.
 * - FTC guidance on "free" requires the conditions to be stated clearly and
 *   conspicuously alongside the offer, so `terms` must always be rendered
 *   wherever `headline` is.
 * - Never call it "free" (2026-10-05): the offer is "$0 to start + first month
 *   of AxeonCORE free", with the 3-month minimum stated in `terms`. The anchor
 *   is real: the $99 start fee plus one $299 month = $398.
 * - `totalSpots` is the real cap. If spots are claimed, lower `spotsRemaining`
 *   here rather than inventing urgency elsewhere; a fake counter is a
 *   deceptive-practice risk.
 */
export const foundingOffer = {
  /** Set to false to take the offer down everywhere at once. */
  active: true,
  eyebrow: 'Founding Client Offer',
  headline: '$0 to start, and your first month of AxeonCORE free',
  subhead:
    'We are launching with five Iowa businesses. They skip the $99 start fee and get their first month of AxeonCORE, the site and the system that brings in customers, at no cost, in exchange for honest feedback and a review we can show the next client.',
  /** Real anchor: the $99 start fee + the first $299 AxeonCORE month. */
  anchorPrice: '$398',
  anchorLabel: 'Your first month',
  offerPrice: '$0',
  /** Side-tab and banner label. Never the word "free" on its own. */
  tabLabel: '$0 to start',
  totalSpots: 5,
  /** Update as founding clients sign. Never display a number higher than reality. */
  spotsRemaining: 1,
  includes: [
    'Found by more customers on Google and inside AI answers',
    'A custom, mobile-first site built to turn visitors into calls',
    'Missed-call text-back, automated follow-up, and AxeonPROOF to track every lead',
    'Backed by our 90-day customer guarantee',
  ],
  cta: 'See If I Qualify',
  ctaHint: 'Takes a 15-minute call. No pitch deck, no pressure.',
  decline: 'Not right now',
  terms:
    'Open to Iowa-based businesses. Limited to 5 founding clients, subject to fit and availability. The $99 start fee is waived and the first month of AxeonCORE ($299) is free; AxeonCORE then continues at $299/mo with a 3-month minimum, then month-to-month.',
} as const;

export type FoundingOffer = typeof foundingOffer;
