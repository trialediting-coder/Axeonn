// lib/proofTabs.ts
// The AxeonPROOF tabs, which plan each one belongs to, and the words on a tab
// the client's plan does not include. Every tab is visible to every client; a
// locked one opens an upgrade page that shows the feature with their own
// numbers, what the plan adds, the price as "one extra job", and one button
// that asks Axeon to get in touch. No pop-ups, no nagging: the ask lives where the value
// is. Client-safe (no Node imports); used by the dashboard and its tests.
import { TIER_LABELS, TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import type { TrafficSummary } from '@/lib/projectsShared';

export type ProofTabKey = 'overview' | 'leads' | 'calls' | 'bookings' | 'reviews' | 'ads' | 'receptionist' | 'billing';

export interface ProofTab {
  key: ProofTabKey;
  label: string;
  /** The lowest plan that includes it. */
  tier: OnboardingTier;
  /** One line under the tab name on a locked page, before the numbers. */
  promise: string;
  /** What the plan adds, in the client's words. */
  includes: readonly string[];
  /**
   * The example month shown on a locked tab: tiles, a bar chart and a list
   * (components/proof/UpgradePanel.tsx). Readable, and labelled on screen as
   * an example that is not the client's numbers. Owner decision 2026-10-10:
   * invented figures are never shown as a client's own results.
   */
  ghost?: Ghost;
}

export interface Ghost {
  tiles: ReadonlyArray<{ label: string; value: string; sub: string }>;
  bars: readonly number[];
  rows: ReadonlyArray<{ a: string; b: string; c: string }>;
}

const BARS = [38, 52, 44, 61, 57, 70, 66, 78, 72, 84, 80, 92] as const;

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
    ghost: {
      tiles: [
        { label: 'Calls this month', value: '64', sub: '+11 vs last month' },
        { label: 'Answered', value: '51', sub: '80% pick-up' },
        { label: 'Missed, texted back', value: '13', sub: 'in under a minute' },
        { label: 'Booked from calls', value: '19', sub: '30% of calls' },
      ],
      bars: BARS,
      rows: [
        { a: 'Mon 10:14 AM', b: '(515) 555-01··', c: 'Answered · 3:12 · booked' },
        { a: 'Mon 12:40 PM', b: '(515) 555-08··', c: 'Missed · text-back sent in 41s' },
        { a: 'Tue 8:55 AM', b: '(515) 555-02··', c: 'Answered · 1:48' },
        { a: 'Tue 4:20 PM', b: '(515) 555-07··', c: 'Missed · called back in 6 min · booked' },
        { a: 'Wed 9:03 AM', b: '(515) 555-04··', c: 'Answered · 2:30 · quote sent' },
        { a: 'Wed 5:47 PM', b: '(515) 555-09··', c: 'After hours · text-back sent' },
      ],
    },
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
    ghost: {
      tiles: [
        { label: 'Booked online', value: '27', sub: '+8 vs last month' },
        { label: 'After hours', value: '11', sub: 'while you were closed' },
        { label: 'By chat', value: '6', sub: 'questions answered first' },
        { label: 'No-shows', value: '1', sub: 'reminders sent to all' },
      ],
      bars: BARS,
      rows: [
        { a: 'Thu 9:00 AM', b: 'Full detail · SUV', c: 'Booked online, Tue 9:12 PM' },
        { a: 'Thu 1:30 PM', b: 'Ceramic coating', c: 'Booked by chat' },
        { a: 'Fri 8:30 AM', b: 'Interior detail', c: 'Reminder sent' },
        { a: 'Fri 2:00 PM', b: 'Paint correction', c: 'Booked from Google listing' },
        { a: 'Sat 10:00 AM', b: 'Full detail · truck', c: 'Deposit paid' },
        { a: 'Sat 1:00 PM', b: 'Headlight restore', c: 'Booked online, Fri 11:48 PM' },
      ],
    },
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
    ghost: {
      tiles: [
        { label: 'Rating', value: '4.9', sub: 'up from 4.6' },
        { label: 'Reviews', value: '38', sub: '+9 this month' },
        { label: 'Requests sent', value: '31', sub: 'after every job' },
        { label: 'Replied to', value: '38', sub: 'every one' },
      ],
      bars: BARS,
      rows: [
        { a: '★★★★★', b: '“Looks brand new. Easy to book.”', c: '2 days after the job' },
        { a: '★★★★★', b: '“Fair price, on time, great work.”', c: 'Review link texted' },
        { a: '★★★★★', b: '“Came to my office. Flawless.”', c: 'Replied same day' },
        { a: '★★★★☆', b: '“Great detail, running a bit late.”', c: 'Replied, offered a touch-up' },
        { a: '★★★★★', b: '“Best in Des Moines, hands down.”', c: 'Shared to Facebook' },
        { a: '★★★★★', b: '“Ceramic coating still beading.”', c: '6 months later' },
      ],
    },
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
    ghost: {
      tiles: [
        { label: 'Leads from ads', value: '34', sub: '+12 vs last month' },
        { label: 'Cost per lead', value: '$21', sub: 'down from $29' },
        { label: 'Spend', value: '$920', sub: 'of $1,000 budget' },
        { label: 'Booked from ads', value: '14', sub: 'about $4,200 in work' },
      ],
      bars: BARS,
      rows: [
        { a: 'Google · ceramic coating', b: '140 visits · 11 leads', c: '$18 per lead' },
        { a: 'Google · paint correction', b: '96 visits · 7 leads', c: '$24 per lead' },
        { a: 'Meta · fall interior special', b: '62 visits · 3 leads', c: '$27 per lead' },
        { a: 'Google · mobile detailing', b: '210 visits · 9 leads', c: '$19 per lead' },
        { a: 'Meta · before and after reel', b: '340 visits · 4 leads', c: '$22 per lead' },
        { a: 'Weekends', b: 'Paused', c: 'Budget moved to weekdays' },
      ],
    },
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
    ghost: {
      tiles: [
        { label: 'Calls answered', value: '118', sub: 'every one, 24/7' },
        { label: 'After hours', value: '41', sub: 'nights and weekends' },
        { label: 'Booked by phone', value: '23', sub: 'straight to your calendar' },
        { label: 'Messages taken', value: '17', sub: 'texted to you' },
      ],
      bars: BARS,
      rows: [
        { a: 'Sun 7:48 PM', b: '“Do you do boats?”', c: 'Answered · took a message' },
        { a: 'Mon 6:05 AM', b: '“How much for a full detail?”', c: 'Quoted from your price list' },
        { a: 'Mon 6:06 AM', b: 'Booked Thu 9:00 AM', c: 'Added to your calendar' },
        { a: 'Mon 12:31 PM', b: '“Are you open Saturday?”', c: 'Answered · booked Sat 10:00' },
        { a: 'Tue 9:15 PM', b: '“Can you come to my office?”', c: 'Answered · message sent to you' },
        { a: 'Wed 7:02 AM', b: 'Reschedule request', c: 'Moved to Fri 2:00 PM' },
      ],
    },
  },
  // Every plan: the client's plan, card and invoices, live from Stripe (components/proof/BillingTab.tsx).
  { key: 'billing', label: 'Billing', tier: 'essentials', promise: '', includes: [] },
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

/** Rule-of-thumb rates the loss line uses. Stated on screen, never presented as the client's own measurement. */
export const RINGS_OUT_SHARE = 0.2;
export const PREFER_BOOKING_SHARE = 0.3;

/**
 * The cost of not having the feature, from the client's real contact counts and
 * a stated rule of thumb. Null when the numbers are too small to say anything.
 */
export function lossLine(tab: ProofTab, t: TrafficSummary | null, period = 'last month'): { text: string; basis: string } | null {
  if (!t) return null;
  const plan = TIER_LABELS[tab.tier];
  if (tab.key === 'calls') {
    const calls = t.buttons.find((b) => b.name === 'call')?.count ?? 0;
    if (calls < 5) return null;
    const lost = Math.max(1, Math.round(calls * RINGS_OUT_SHARE));
    return {
      text: `${calls} people pressed Call ${period}. If one in five of those calls rang out, that is roughly ${lost} ${lost === 1 ? 'person' : 'people'} who may have called the next shop. That is the gap ${plan} closes.`,
      basis: 'One in five is a rule of thumb for a busy shop line, not your measured pick-up rate. AxeonCORE measures it.',
    };
  }
  if (tab.key === 'bookings') {
    const n = t.conversions;
    if (n < 5) return null;
    const ready = Math.max(1, Math.round(n * PREFER_BOOKING_SHARE));
    return {
      text: `${n} people reached out ${period}. If a third of them would rather tap a time than call, about ${ready} were ready to book themselves. On ${plan} they can, at 9pm too.`,
      basis: 'A third is a rule of thumb from how people book services online, not a measurement of your customers.',
    };
  }
  return null;
}

/** The first sentence on a locked tab, with the client's own numbers when there are any. */
export function lockedHeadline(tab: ProofTab, t: TrafficSummary | null, period = 'last month'): string {
  const n = t?.conversions ?? 0;
  const calls = t?.buttons.find((b) => b.name === 'call')?.count ?? 0;
  const people = `${n} ${n === 1 ? 'person' : 'people'} reached out through your site ${period}`;
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
