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
 * - Per content/brand-guardrails.md: never mention a monthly plan, hosting
 *   fee, or timeline. "Ongoing arrangements are discussed on the call" is the
 *   approved phrasing.
 * - `totalSpots` is the real cap. If spots are claimed, lower `spotsRemaining`
 *   here rather than inventing urgency elsewhere; a fake counter is a
 *   deceptive-practice risk.
 */
export const foundingOffer = {
  /** Set to false to take the offer down everywhere at once. */
  active: true,
  eyebrow: 'Founding Client Offer',
  headline: 'Free setup for one of our first 5 Iowa businesses',
  subhead:
    'We are launching with five Iowa businesses. Their full setup, the site and the system that brings in customers, costs nothing, in exchange for honest feedback and a review we can show the next client.',
  /** Real anchor: the published Essentials build price. */
  anchorPrice: '$2,800',
  anchorLabel: 'Essentials setup value',
  totalSpots: 5,
  /** Update as founding clients sign. Never display a number higher than reality. */
  spotsRemaining: 1,
  includes: [
    'Found by more customers on Google and inside AI answers',
    'A custom, mobile-first site built to turn visitors into calls',
    'Instant lead alerts to your phone the moment someone reaches out',
    'Backed by our 90-day customer guarantee',
  ],
  cta: 'See If I Qualify',
  ctaHint: 'Takes a 15-minute call. No pitch deck, no pressure.',
  decline: 'Not right now',
  terms:
    'Open to Iowa-based businesses. Limited to 5 founding clients, subject to fit and availability. Setup cost waived; the monthly plan is discussed on the call.',
} as const;

export type FoundingOffer = typeof foundingOffer;
