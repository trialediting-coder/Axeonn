// lib/proofTabs.ts
// The AxeonPROOF tabs, which plan each one belongs to, and the words on a tab
// the client's plan does not include. Every tab is visible to every client; a
// locked one opens an upgrade page that shows the feature with their own
// numbers, what the plan adds, the price as "one extra job", and one button
// that asks Axeon to get in touch. No pop-ups, no nagging: the ask lives where the value
// is. Client-safe (no Node imports); used by the dashboard and its tests.
import { TIER_LABELS, TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import type { TrafficSummary } from '@/lib/projectsShared';

export type ProofTabKey = 'overview' | 'leads' | 'calls' | 'bookings' | 'reviews' | 'ads' | 'receptionist';

export interface ProofTab {
  key: ProofTabKey;
  label: string;
  /** The lowest plan that includes it. */
  tier: OnboardingTier;
  /** One line under the tab name on a locked page, before the numbers. */
  promise: string;
  /** What the plan adds, in the client's words. */
  includes: readonly string[];
}

export const PROOF_TABS: readonly ProofTab[] = [
  { key: 'overview', label: 'Overview', tier: 'essentials', promise: '', includes: [] },
  { key: 'leads', label: 'Leads', tier: 'essentials', promise: '', includes: [] },
  {
    key: 'calls',
    label: 'Calls',
    tier: 'axeoncore',
    promise: 'Every call counted, every missed call texted back within a minute.',
    includes: [
      'Tracked phone numbers, so every call shows up here',
      'Missed-call text-back within a minute',
      'Instant call-back when someone sends your form',
      'Call counts in your monthly report',
    ],
  },
  {
    key: 'bookings',
    label: 'Bookings',
    tier: 'axeoncore',
    promise: 'Let people book themselves at 9pm instead of calling the next shop.',
    includes: [
      'Online scheduling on your site and your Google listing',
      'AI chat that answers questions and books the job',
      'Reminders, so fewer people no-show',
      'Booked jobs counted here every month',
    ],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    tier: 'axeoncore',
    promise: 'Reviews are the first thing the next customer reads.',
    includes: [
      'A review request texted after every finished job',
      'New reviews and your rating in the monthly report',
      'Automatic text and email follow-up, with one list of every lead',
    ],
  },
  {
    key: 'ads',
    label: 'Ads',
    tier: 'axeongrowth',
    promise: 'When the phone is quiet, turn it up.',
    includes: [
      'Google and Meta ads managed every day',
      'Every lead traced back to the ad that brought it',
      'A new service page every month',
      'A monthly strategy call',
    ],
  },
  {
    key: 'receptionist',
    label: 'AI receptionist',
    tier: 'axeongrowth',
    promise: 'Every call answered, 24/7, in your words.',
    includes: [
      'An AI receptionist that answers when you cannot',
      'Knows your services, prices and hours',
      'Books the job or takes a message',
      'Everything in AxeonCORE',
    ],
  },
];

export const TIER_PRICE: Record<OnboardingTier, number> = { essentials: 149, axeoncore: 299, axeongrowth: 999 };
export const TIER_SHORT: Record<OnboardingTier, string> = { essentials: 'Essentials', axeoncore: 'CORE', axeongrowth: 'GROWTH' };

export const isProofTab = (v: unknown): v is ProofTabKey => PROOF_TABS.some((t) => t.key === v);
export const proofTab = (key: ProofTabKey): ProofTab => PROOF_TABS.find((t) => t.key === key)!;
export const tabLocked = (tab: ProofTab, tier: OnboardingTier): boolean => TIER_RANK[tab.tier] > TIER_RANK[tier];

/** The line under the price: "At your average job of $300, that is one extra job a month to cover it." */
export function upgradeMath(current: OnboardingTier, target: OnboardingTier, avgJobValue: number | null | undefined): { delta: number; line: string } {
  const delta = Math.max(0, TIER_PRICE[target] - TIER_PRICE[current]);
  const money = (n: number) => `$${n.toLocaleString('en-US')}`;
  const adSpend = target === 'axeongrowth' ? ' Plus the ad budget you set, which stays yours to decide.' : '';
  if (avgJobValue && avgJobValue > 0) {
    const jobs = Math.max(1, Math.ceil(delta / avgJobValue));
    return { delta, line: `At your average job of ${money(avgJobValue)}, that is ${jobs === 1 ? 'one extra job' : `${jobs} extra jobs`} a month to cover it.${adSpend}` };
  }
  return { delta, line: `For most shops that is one or two extra jobs a month.${adSpend}` };
}

/** The first sentence on a locked tab, with the client's own numbers when there are any. */
export function lockedHeadline(tab: ProofTab, t: TrafficSummary | null): string {
  const n = t?.conversions ?? 0;
  const calls = t?.buttons.find((b) => b.name === 'call')?.count ?? 0;
  const people = `${n} ${n === 1 ? 'person' : 'people'} reached out through your site last month`;
  switch (tab.key) {
    case 'calls':
      return n > 0
        ? `${people}${calls ? `, and ${calls} of them pressed Call` : ''}. When the phone rings out, ${TIER_LABELS[tab.tier]} texts them back within a minute, so the job does not go to the next shop.`
        : `When a call rings out, ${TIER_LABELS[tab.tier]} texts the caller back within a minute, so the job does not go to the next shop.`;
    case 'bookings':
      return n > 0
        ? `${people}. Some of them would rather tap a time than make a call. ${TIER_LABELS[tab.tier]} lets them book themselves, day or night, and reminds them so they show up.`
        : `${TIER_LABELS[tab.tier]} lets people book themselves, day or night, and reminds them so they show up.`;
    case 'reviews':
      return `The next customer reads your reviews before they call. ${TIER_LABELS[tab.tier]} texts every finished job a review link, so your rating climbs without you asking.`;
    case 'ads':
      return n > 0
        ? `${people} without a dollar of ads. ${TIER_LABELS[tab.tier]} adds Google and Meta ads managed every day, with every lead traced back to the ad that brought it.`
        : `${TIER_LABELS[tab.tier]} adds Google and Meta ads managed every day, with every lead traced back to the ad that brought it.`;
    case 'receptionist':
      return `${TIER_LABELS[tab.tier]} answers every call, 24 hours a day, with a receptionist that knows your services, your prices and your hours, and books the job or takes a message.`;
    default:
      return tab.promise;
  }
}
