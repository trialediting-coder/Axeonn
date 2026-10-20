// data/proofPage.ts
// Content for /axeonproof, the AxeonPROOF showcase page.
//
// The dashboard on that page is rendered live from this file, for a FICTIONAL
// demo practice ("Quillmont Family Dental") with an example month. Since the
// 2026-10-19 practice repositioning the demo is a dental practice, labelled
// "Demo" on screen (EXAMPLE.demoLabel). VERTICAL_DEMOS (below) shows the same
// dashboard's events for a fictional med spa, law firm and CPA firm too, so the
// page speaks to all four verticals. Nothing here is a client's result, and
// the page says so (owner rule 2026-10-10: invented figures are never shown as
// anyone's own numbers). Email addresses use the reserved .example domain. The screens copy
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
  name: 'Quillmont Family Dental',
  /** Shown wherever the demo practice is named outside the dashboard frame. */
  demoLabel: 'Demo: Quillmont Family Dental (a fictional practice)',
  initials: 'LD',
  owner: 'Dana',
  city: 'Des Moines',
  keyword: 'family dentist',
  emailDomain: 'quillmontdental.example',
  plan: 'axeoncore' as OnboardingTier,
  month: 'October 2026',
  monthShort: 'Oct',
  tiles: [
    { key: 'reached', label: 'Inquiries', value: 46, sub: '+9 vs last month', hint: 'Calls, texts, forms, bookings', tone: 'up' },
    { key: 'customers', label: 'Recovered', value: 17, sub: 'after hours or missed', hint: 'Missed calls and after-hours inquiries answered by the system', tone: 'up' },
    { key: 'visits', label: 'Website visits', value: 1284, sub: '812 visitors', hint: 'Page views on your site', tone: 'neutral' },
    { key: 'clicks', label: 'Button clicks', value: 212, sub: 'Call, text, book, form and more', hint: 'Call, text, book, form and more', tone: 'neutral' },
  ] as ExampleTile[],
  leads: [
    { kind: 'Call button', when: 'Today, 10:30 AM', page: 'Home page', where: 'Des Moines, IA', device: 'Phone', booked: true },
    { kind: 'Booking', when: 'Today, 6:12 AM', page: '/new-patients', where: 'Ankeny, IA', device: 'Phone', booked: true },
    { kind: 'Form', when: 'Yesterday, 8:48 PM', page: '/teeth-whitening', where: 'West Des Moines, IA', device: 'Desktop', booked: false },
    { kind: 'Text button', when: 'Yesterday, 12:02 PM', page: 'Home page · Google Ads', where: 'Urbandale, IA', device: 'Phone', booked: false },
    { kind: 'Call button', when: 'Mon, 7:03 AM', page: '/emergency-dentist', where: 'Johnston, IA', device: 'Phone', booked: true },
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
  /** The 90-day performance commitment, as AxeonPROOF records it. */
  commitment: {
    day: 41,
    launched: 'Sep 2',
    /** Inquiries so far in the 90 days, and how many got a first reply within 60 seconds. */
    inquiries: 96,
    repliedIn60: 95,
    medianReplySeconds: 14,
    /** Completed appointments so far, and review requests sent for them. */
    visits: 212,
    reviewRequests: 212,
  },
  analytics: {
    buttons: [
      ['Call', 96],
      ['Book online', 54],
      ['Text', 31],
      ['New patient form', 19],
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
      ['/new-patients', 214],
      ['/teeth-whitening', 168],
      ['/dental-implants', 97],
      ['/our-dentists', 61],
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
      ['/new-patients', 214, 11],
      ['/teeth-whitening', 168, 7],
      ['/dental-implants', 97, 4],
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
    hours: [0, 0, 0, 0, 0, 1, 2, 4, 6, 7, 6, 5, 6, 5, 5, 4, 4, 4, 3, 3, 2, 1, 0, 0],
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
    body: 'Most visits are on a phone, where a tap on your number is a real call. That is why the call and book buttons are never buried.',
  },
  bring: {
    title: 'Pages that bring new patients and clients',
    body: 'The first page each visitor saw, and how many of them reached out. The pages that bring inquiries get more attention.',
  },
  cities: {
    title: 'Where visitors are',
    body: 'City and area only, never who. Enough to see where your patients or clients come from.',
  },
  when: {
    title: 'When people reach out',
    body: 'By hour and by day of the week. Inquiries before 8 AM and after 5 PM are the ones the system answers for you.',
  },
};

export const CARD_ORDER = ['sources', 'device', 'bring', 'cities', 'when'] as const;

/** One line under each tab in the tour: what the owner gets from it. */
export const TAB_NOTES: Record<ProofTabKey, string> = {
  overview: 'This month at a glance: who reached out, how many were recovered after hours, and where they came from.',
  leads: 'Every call, text, form and booking, the day it happens. Tap Booked on the ones that turned into an appointment.',
  calls: 'Every call counted. A missed call gets a text back within 60 seconds, so the caller does not book with the next office.',
  bookings: 'New patients and clients book a consultation at 9 PM instead of calling whoever answers first. Reminders cut the no-shows.',
  reviews: 'A review request after every completed appointment, and your rating month by month.',
  ads: 'Every ad dollar next to the inquiries and booked appointments it brought in.',
  receptionist: 'Every call answered, day and night, and either booked or taken as a message for the front desk or intake team.',
  email: 'Your business email at your own domain, with spam checks that run by themselves.',
  billing: 'Your plan, your card and every invoice. Nothing to ask us for.',
};

/**
 * The same dashboard for each vertical: a fictional demo business per vertical
 * and three example events the recovered-inquiry counter would log. All demo,
 * labelled on screen; never a client's results.
 */
export interface VerticalDemo {
  key: 'dental' | 'med-spa' | 'law' | 'accounting';
  label: string;
  name: string;
  /** What a booked first visit is called in this vertical. */
  booking: string;
  events: { when: string; what: string; result: string }[];
}

export const VERTICAL_DEMOS: VerticalDemo[] = [
  {
    key: 'dental',
    label: 'Dental',
    name: 'Quillmont Family Dental',
    booking: 'new-patient exams',
    events: [
      { when: 'Tue, 7:48 PM', what: 'Missed call, texted back in 11s', result: 'New-patient exam booked' },
      { when: 'Sat, 9:15 AM', what: 'Web inquiry from /dental-implants, reply in 14s', result: 'Implant consult booked' },
      { when: 'Mon, 12:20 PM', what: 'Cleaning completed', result: 'Review request sent' },
    ],
  },
  {
    key: 'med-spa',
    label: 'Med spa',
    name: 'Verawood Aesthetics',
    booking: 'consults',
    events: [
      { when: 'Wed, 8:32 PM', what: 'Web inquiry from /botox, reply in 9s', result: 'Consult booked' },
      { when: 'Fri, 1:05 PM', what: 'Missed call during treatments, texted back in 12s', result: 'Filler consult booked' },
      { when: 'Sat, 6:10 PM', what: 'Treatment completed', result: 'Review request sent' },
    ],
  },
  {
    key: 'law',
    label: 'Law firm',
    name: 'Harlan & Pike Law',
    booking: 'intake calls and case reviews',
    events: [
      { when: 'Thu, 9:40 PM', what: 'Web inquiry from /car-accidents, reply in 13s', result: 'Intake call booked, conflict check first' },
      { when: 'Mon, 11:55 AM', what: 'Missed call while attorneys were in court, texted back in 10s', result: 'Case review booked' },
      { when: 'Wed, 3:00 PM', what: 'Matter closed', result: 'Review request sent' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    name: 'Ostrander Tax & Advisory',
    booking: 'tax and advisory consults',
    events: [
      { when: 'Sun, 4:18 PM', what: 'Web inquiry from /small-business-tax, reply in 15s', result: 'Tax consult booked' },
      { when: 'Tue, 5:42 PM', what: 'Missed call after hours, texted back in 12s', result: 'Advisory meeting booked' },
      { when: 'Fri, 10:05 AM', what: 'Return filed', result: 'Review request sent' },
    ],
  },
];

/** The chip next to a tab: which plan switches it on. */
export const PLAN_CHIP: Record<OnboardingTier, string> = {
  website: 'Every plan',
  essentials: 'Every plan',
  axeoncore: 'AxeonCORE',
  axeongrowth: 'AxeonGROWTH',
};
