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

/** Below both of these there is nothing to point at, and the AxeonPROOF card stays hidden. */
export const REFERRAL_MIN_CUSTOMERS = 3;
export const REFERRAL_MIN_REACHED = 5;

/** One month the card could point at, with how to say it: "so far this month", "in September". */
export interface ReferralMonth {
  traffic: { estimatedCustomers: number; conversions: number } | null;
  period: string;
}

/**
 * The first line of the AxeonPROOF referral card, from the better of the months
 * given ("~38 new customers so far this month."). Null when none of them clears
 * the bar: asking for a referral in a month with nothing to show reads as
 * tone-deaf, so the card is not shown at all. Passing last month too keeps the
 * card from vanishing in the first days of every month.
 */
export function referralHeadline(months: readonly ReferralMonth[]): string | null {
  const ok = months.filter((m): m is ReferralMonth & { traffic: NonNullable<ReferralMonth['traffic']> } => m.traffic != null);
  const byCustomers = ok.filter((m) => m.traffic.estimatedCustomers >= REFERRAL_MIN_CUSTOMERS).sort((a, b) => b.traffic.estimatedCustomers - a.traffic.estimatedCustomers)[0];
  if (byCustomers) return `~${byCustomers.traffic.estimatedCustomers} new customers ${byCustomers.period}.`;
  const byReached = ok.filter((m) => m.traffic.conversions >= REFERRAL_MIN_REACHED).sort((a, b) => b.traffic.conversions - a.traffic.conversions)[0];
  if (byReached) return `${byReached.traffic.conversions} people reached out ${byReached.period}.`;
  return null;
}

/** Mailto body for the "refer someone" link: one line to fill in. */
export const referralMailto = (ownerEmail: string, from: string | null) =>
  `mailto:${ownerEmail}?subject=${encodeURIComponent('A referral for Axeon')}&body=${encodeURIComponent(
    `Hi, I'd like to refer a business to Axeon.\n\nBusiness:\nOwner's name:\nBest way to reach them:\n\n${from ? `From: ${from}` : ''}`.trim()
  )}`;
