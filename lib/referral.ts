// lib/referral.ts
// The referral offer, said the same way everywhere a client reads: the monthly
// report, the AxeonPROOF overview, and the feedback page. Client-safe (no Node
// imports). Owner decision 2026-10-10: $300 to whoever refers, paid when the
// referred business pays its first invoice; a free month for the referred.
export const REFERRAL = {
  /** What the referrer gets. */
  reward: '$300',
  /** What the business they refer gets. */
  friendGets: 'a month free',
  /** When the reward is paid. */
  when: 'when they pay their first invoice',
} as const;

/** One sentence, for a footer or a card. */
export const referralSentence = () =>
  `Know a business owner who needs this? Refer them and you get ${REFERRAL.reward} ${REFERRAL.when}, and they get ${REFERRAL.friendGets}.`;

/** Below these the numbers are too small to lead with; the card falls back to the plain offer. */
export const REFERRAL_MIN_CUSTOMERS = 3;
export const REFERRAL_MIN_REACHED = 5;

/**
 * The first line of the AxeonPROOF referral card, from the client's own numbers
 * when they are worth saying: "~38 likely new customers so far this month." Null
 * when they are not, so a slow month never reads as a boast.
 */
export function referralHeadline(t: { estimatedCustomers: number; conversions: number } | null, period: string): string | null {
  if (!t) return null;
  if (t.estimatedCustomers >= REFERRAL_MIN_CUSTOMERS) return `~${t.estimatedCustomers} likely new customers ${period}.`;
  if (t.conversions >= REFERRAL_MIN_REACHED) return `${t.conversions} people reached out ${period}.`;
  return null;
}

/** Mailto body for the "refer someone" link: one line to fill in. */
export const referralMailto = (ownerEmail: string, from: string | null) =>
  `mailto:${ownerEmail}?subject=${encodeURIComponent('A referral for Axeon')}&body=${encodeURIComponent(
    `Hi, I'd like to refer a business to Axeon.\n\nBusiness:\nOwner's name:\nBest way to reach them:\n\n${from ? `From: ${from}` : ''}`.trim()
  )}`;
