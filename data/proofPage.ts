// data/proofPage.ts
// Content for /axeonproof, the AxeonPROOF showcase page.
//
// The screens are real captures of A-1 Auto Detailing's dashboard (an Axeon
// client), taken 2026-10-13 from the admin preview at app.axeonstudio.co with
// the client's email hidden. Tabs outside the client's plan show the app's own
// "example month" panel, which the app labels as an example on screen; this
// page never presents those figures as anyone's results. Re-capture with the
// same names in public/images/proof/ when the app changes.
import type { OnboardingTier } from '@/data/onboardingItems';

export interface ProofScreen {
  key: string;
  label: string;
  /** The lowest plan that includes the tab (lib/proofTabs.ts). */
  tier: OnboardingTier;
  /** One line under the tab name: what the owner gets from it. */
  promise: string;
  src: string;
  width: number;
  height: number;
}

export const PROOF_SCREENS: ProofScreen[] = [
  {
    key: 'overview',
    label: 'Overview',
    tier: 'essentials',
    promise: 'This month at a glance: who reached out, where they came from, and what it is worth.',
    src: '/images/proof/overview.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'leads',
    label: 'Leads',
    tier: 'essentials',
    promise: 'Every call, text, form and booking, the day it happens. Tap Booked on the ones that turned into a job.',
    src: '/images/proof/leads.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'calls',
    label: 'Calls',
    tier: 'axeoncore',
    promise: 'Every call counted. A missed call gets a text back within a minute, so the job does not go to the next shop.',
    src: '/images/proof/calls.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    tier: 'axeoncore',
    promise: 'People book themselves at 9pm instead of calling whoever answers first. Reminders cut the no-shows.',
    src: '/images/proof/bookings.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'reviews',
    label: 'Reviews',
    tier: 'axeoncore',
    promise: 'A review link texted after every finished job, and your rating month by month.',
    src: '/images/proof/reviews.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'ads',
    label: 'Ads',
    tier: 'axeongrowth',
    promise: 'Every ad dollar next to the leads and booked jobs it brought in.',
    src: '/images/proof/ads.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'receptionist',
    label: 'AI receptionist',
    tier: 'axeongrowth',
    promise: 'Every call answered, day and night, and either booked or taken as a message for you.',
    src: '/images/proof/receptionist.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'email',
    label: 'Email',
    tier: 'essentials',
    promise: 'Your business email at your own domain, with spam checks that run by themselves.',
    src: '/images/proof/email.webp',
    width: 2000,
    height: 1011,
  },
  {
    key: 'billing',
    label: 'Billing',
    tier: 'essentials',
    promise: 'Your plan, your card and every invoice. Nothing to ask us for.',
    src: '/images/proof/billing.webp',
    width: 2000,
    height: 1011,
  },
];

/** The chip next to a tab: which plan switches it on. */
export const PLAN_CHIP: Record<OnboardingTier, string> = {
  essentials: 'Every plan',
  axeoncore: 'AxeonCORE',
  axeongrowth: 'AxeonGROWTH',
};

export interface ProofHotspot {
  key: string;
  /** Position on public/images/proof/analytics.webp, in percent of its width and height. */
  x: number;
  y: number;
  title: string;
  body: string;
}

export const PROOF_HOTSPOTS: ProofHotspot[] = [
  {
    key: 'sources',
    x: 63.5,
    y: 5,
    title: 'Where visitors came from',
    body: 'Google, Facebook, or typed straight in. You see which channel is actually sending people, not a guess.',
  },
  {
    key: 'device',
    x: 30,
    y: 33.5,
    title: 'How people visit',
    body: 'Most visits are on a phone, where a tap on your number is a real call. That is why the call button is never buried.',
  },
  {
    key: 'pages',
    x: 63.5,
    y: 33.5,
    title: 'Pages that bring customers',
    body: 'The first page each visitor saw, and how many of them reached out. The pages that pay get more work.',
  },
  {
    key: 'cities',
    x: 97,
    y: 33.5,
    title: 'Where visitors are',
    body: 'City and area only, never who. Enough to see your service area filling in.',
  },
  {
    key: 'when',
    x: 39,
    y: 86,
    title: 'When customers reach out',
    body: 'By hour and by day of the week, so you know when the phone needs a person on it.',
  },
];

export const PROOF_IMAGES = {
  overviewFull: { src: '/images/proof/overview-full.webp', width: 2000, height: 4256 },
  analytics: { src: '/images/proof/analytics.webp', width: 1650, height: 1403 },
  leadLog: { src: '/images/proof/lead-log.webp', width: 1650, height: 392 },
} as const;
