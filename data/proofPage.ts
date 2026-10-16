// data/proofPage.ts
// Content for /axeonproof, the AxeonPROOF showcase page.
//
// The dashboard on that page is rendered live from this file, for an example
// business ("Northside Auto Spa") with an example month (owner, 2026-10-13:
// "use an example of a real client, not an actual client"). Nothing here is a
// client's result, and the page says so on screen (owner rule 2026-10-10:
// invented figures are never shown as anyone's own numbers). The screens copy
// the real app's layout (components/proof/*) so what people see here is what a
// client sees after sign-in. Tabs outside the Overview reuse the app's own
// example-month data from lib/proofTabs.ts.
import type { OnboardingTier } from '@/data/onboardingItems';
import type { ProofTabKey } from '@/lib/proofTabs';

export interface ExampleLead {
  kind: 'Call button' | 'Text button' | 'Form' | 'Booking' | 'Email link';
  when: string;
  page: string;
  where: string;
  device: 'Phone' | 'Desktop';
  booked: boolean;
}

export interface ExampleTile {
  key: 'reached' | 'customers' | 'visits' | 'clicks';
  label: string;
  value: number;
  prefix?: string;
  sub: string;
  hint: string;
  tone: 'up' | 'neutral';
}

export const EXAMPLE = {
  name: 'Northside Auto Spa',
  initials: 'NA',
  owner: 'Dana',
  city: 'Des Moines',
  keyword: 'ceramic coating',
  plan: 'axeoncore' as OnboardingTier,
  month: 'October 2026',
  monthShort: 'Oct',
  tiles: [
    { key: 'reached', label: 'Reached out', value: 46, sub: '+9 vs last month', hint: 'Calls, texts, forms, bookings', tone: 'up' },
    { key: 'customers', label: 'Est. new customers', value: 24, prefix: '~', sub: 'about $7,200 in work', hint: 'Estimated from who reached out', tone: 'up' },
    { key: 'visits', label: 'Website visits', value: 1284, sub: '812 visitors', hint: 'Page views on your site', tone: 'neutral' },
    { key: 'clicks', label: 'Button clicks', value: 212, sub: 'Call, text, book, form and more', hint: 'Call, text, book, form and more', tone: 'neutral' },
  ] as ExampleTile[],
  leads: [
    { kind: 'Call button', when: 'Today, 10:30 AM', page: 'Home page', where: 'Des Moines, IA', device: 'Phone', booked: true },
    { kind: 'Booking', when: 'Today, 8:12 AM', page: '/ceramic-coating', where: 'Ankeny, IA', device: 'Phone', booked: true },
    { kind: 'Form', when: 'Yesterday, 6:48 PM', page: '/interior-detailing', where: 'West Des Moines, IA', device: 'Desktop', booked: false },
    { kind: 'Text button', when: 'Yesterday, 12:02 PM', page: 'Home page · Google Ads', where: 'Urbandale, IA', device: 'Phone', booked: false },
    { kind: 'Call button', when: 'Mon, 9:03 AM', page: 'Home page', where: 'Johnston, IA', device: 'Phone', booked: true },
  ] as ExampleLead[],
  /** Calls and leads by month; the last one is the live month so far. */
  months: [
    { label: 'Jun', calls: 11, leads: 7 },
    { label: 'Jul', calls: 14, leads: 10 },
    { label: 'Aug', calls: 19, leads: 12 },
    { label: 'Sep', calls: 23, leads: 15 },
    { label: 'Oct', calls: 28, leads: 18, live: true },
  ],
  rank: {
    current: 2,
    baseline: 11,
    /** Maps rank at each audit since kickoff, oldest first. */
    points: [11, 9, 8, 6, 4, 3, 2],
    rating: 4.9,
    reviews: 212,
    progress: [
      { label: 'Maps rank', from: '#11', to: '#2', better: true },
      { label: 'Reviews', from: '171', to: '212', better: true },
      { label: 'Rating', from: '4.7', to: '4.9', better: true },
      { label: 'Site speed', from: '3.8s', to: '0.7s', better: true },
    ],
  },
  guarantee: { day: 41, baseline: 18, now: 46 },
  analytics: {
    buttons: [
      ['Call', 96],
      ['Book online', 54],
      ['Text', 31],
      ['Get a quote', 19],
      ['Directions', 12],
    ] as [string, number][],
    sources: [
      ['Google', 486],
      ['Direct / typed in', 212],
      ['Google listing', 161],
      ['Facebook', 98],
      ['Google Ads', 44],
    ] as [string, number][],
    pages: [
      ['Home page', 1012],
      ['/ceramic-coating', 214],
      ['/interior-detailing', 168],
      ['/paint-correction', 97],
      ['/about', 61],
    ] as [string, number][],
    devices: [
      ['Phone', 68],
      ['Tablet', 3],
      ['Desktop', 29],
    ] as [string, number][],
    visitFacts: [
      ['Typical visit', '1 min 12 sec'],
      ['Pages per visit', '1.8'],
      ['One-page visits', '54%'],
      ['Page load', '0.7s'],
    ] as [string, string][],
    bring: [
      ['Home page', 740, 21],
      ['/ceramic-coating', 214, 11],
      ['/interior-detailing', 168, 7],
      ['/paint-correction', 97, 4],
    ] as [string, number, number][],
    campaigns: [['Google Ads', 44, 3]] as [string, number, number][],
    cities: [
      ['Des Moines', 412, 19],
      ['West Des Moines', 180, 8],
      ['Ankeny', 141, 6],
      ['Urbandale', 97, 5],
      ['Johnston', 66, 3],
    ] as [string, number, number][],
    /** Contacts by hour of day (0-23) and by weekday (Sun-Sat). */
    hours: [0, 0, 0, 0, 0, 0, 1, 3, 6, 8, 7, 6, 5, 5, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0],
    days: [2, 11, 9, 8, 10, 12, 4],
  },
};

/** The note that opens when a card in the analytics grid is hovered or tapped. */
export const CARD_NOTES: Record<string, { title: string; body: string }> = {
  sources: {
    title: 'Where visitors came from',
    body: 'Google, Facebook, or typed straight in. You see which channel is actually sending people, not a guess.',
  },
  device: {
    title: 'How people visit',
    body: 'Most visits are on a phone, where a tap on your number is a real call. That is why the call button is never buried.',
  },
  bring: {
    title: 'Pages that bring customers',
    body: 'The first page each visitor saw, and how many of them reached out. The pages that pay get more work.',
  },
  cities: {
    title: 'Where visitors are',
    body: 'City and area only, never who. Enough to see your service area filling in.',
  },
  when: {
    title: 'When customers reach out',
    body: 'By hour and by day of the week, so you know when the phone needs a person on it.',
  },
};

export const CARD_ORDER = ['sources', 'device', 'bring', 'cities', 'when'] as const;

/** One line under each tab in the tour: what the owner gets from it. */
export const TAB_NOTES: Record<ProofTabKey, string> = {
  overview: 'This month at a glance: who reached out, where they came from, and what it is worth.',
  leads: 'Every call, text, form and booking, the day it happens. Tap Booked on the ones that turned into a job.',
  calls: 'Every call counted. A missed call gets a text back within a minute, so the job does not go to the next shop.',
  bookings: 'People book themselves at 9pm instead of calling whoever answers first. Reminders cut the no-shows.',
  reviews: 'A review link texted after every finished job, and your rating month by month.',
  ads: 'Every ad dollar next to the leads and booked jobs it brought in.',
  receptionist: 'Every call answered, day and night, and either booked or taken as a message for you.',
  email: 'Your business email at your own domain, with spam checks that run by themselves.',
  billing: 'Your plan, your card and every invoice. Nothing to ask us for.',
};

/** The chip next to a tab: which plan switches it on. */
export const PLAN_CHIP: Record<OnboardingTier, string> = {
  website: 'Every plan',
  essentials: 'Essentials',
  axeoncore: 'AxeonCORE',
  axeongrowth: 'AxeonGROWTH',
};
