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

/** Mailto body for the "refer someone" link: one line to fill in. */
export const referralMailto = (ownerEmail: string, from: string | null) =>
  `mailto:${ownerEmail}?subject=${encodeURIComponent('A referral for Axeon')}&body=${encodeURIComponent(
    `Hi, I'd like to refer a business to Axeon.\n\nBusiness:\nOwner's name:\nBest way to reach them:\n\n${from ? `From: ${from}` : ''}`.trim()
  )}`;
