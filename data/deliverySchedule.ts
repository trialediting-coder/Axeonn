// data/deliverySchedule.ts
// The AxeonPROOF v2 delivery schedule: one repeatable system every new AxeonCORE /
// AxeonGROWTH client runs through, from "Axeon Studio - Value-Staged Delivery
// Protocol & 180-Day Client Retention Cadence". The single source for the
// client dashboard (milestone tracker), the admin panel and the emails: change a
// day or a sentence here and every surface follows.
//
// Days count from the client's start date (day 1 = the agreement signed / paid,
// lib/proofV2.ts startDateFor). The admin can move a client's start date or one
// step's date (waiting on materials, say); the client sees the new date.
//
// release:
//   'schedule'  Axeon's work. Marked done in the admin; the client sees it done on
//               its scheduled date (or the day it was done, if later), so every
//               client sees the same predictable delivery schedule.
//   'immediate' Something the client did or a live event (an approval, go-live):
//               shown the moment it happens.
// auto: a real event that completes the step by itself (lib/proofV2.ts autoDone).

export type ScheduleAuto =
  | 'line_provisioned'
  | 'text_back_live'
  | 'a2p_filed'
  | 'a2p_approved'
  | 'wireframe_approved'
  | 'copy_approved'
  | 'staging_ready'
  | 'staging_approved'
  | 'dns_cutover'
  | 'go_live'
  | 'dbr_imported'
  | 'dbr_started'
  | 'dbr_done'
  | 'reviews_live'
  | 'citations_started'
  | 'citations_done'
  | 'pages_planned'
  | 'pages_published'
  | 'sitemap_submitted'
  | 'harvest_published'
  | 'sabr_scheduled'
  | 'sabr_done';

export interface ScheduleStep {
  key: string;
  /** Program day the step is planned for. */
  day: number;
  title: string;
  /** What the client reads: what happens, in plain words. */
  client: string;
  release: 'schedule' | 'immediate';
  auto?: ScheduleAuto;
}

export interface SchedulePhase {
  key: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6';
  title: string;
  from: number;
  to: number;
  days: string;
  summary: string;
  steps: readonly ScheduleStep[];
}

export const DELIVERY_SCHEDULE: readonly SchedulePhase[] = [
  {
    key: 'p1',
    title: 'Phone infrastructure',
    from: 1,
    to: 3,
    days: 'Days 1–3',
    summary: 'Your tracked number, the missed-call auto-text, and carrier approval for texting.',
    steps: [
      { key: 'p1-number', day: 1, title: 'Tracked phone number set up', client: 'Your new tracked number is set up and forwards to your front desk.', release: 'schedule', auto: 'line_provisioned' },
      { key: 'p1-a2p-filed', day: 2, title: 'Texting registration filed', client: 'We register your business with the phone carriers so your texts are delivered, not filtered.', release: 'schedule', auto: 'a2p_filed' },
      { key: 'p1-a2p-approved', day: 3, title: 'Texting approved by carriers', client: 'The carriers approve your texting campaign. Their review time is outside our control; the date moves if they take longer.', release: 'immediate', auto: 'a2p_approved' },
      { key: 'p1-autotext', day: 3, title: 'Missed-call auto-text live', client: 'Anyone whose call you miss gets a text from your number within 30 seconds.', release: 'immediate', auto: 'text_back_live' },
    ],
  },
  {
    key: 'p2',
    title: 'Website build',
    from: 4,
    to: 14,
    days: 'Days 4–14',
    summary: 'You approve the layout and the words, we test everything, you review a preview of the new site for 48 hours, then it goes live.',
    steps: [
      { key: 'p2-wireframe', day: 5, title: 'Layout approved', client: 'You review the page layout here, drop pins where you want changes, and approve it.', release: 'immediate', auto: 'wireframe_approved' },
      { key: 'p2-copy', day: 8, title: 'Copy approved', client: 'You review the words on every page the same way: pins, then approve.', release: 'immediate', auto: 'copy_approved' },
      { key: 'p2-qa', day: 10, title: 'Speed, mobile and schema checks', client: 'We test load speed, every phone size, forms and calls, and add search schema.', release: 'schedule' },
      { key: 'p2-staging', day: 11, title: 'Preview of your new site: your 48-hour review', client: 'The finished site on a private link. You have 48 hours to approve it or ask for changes; book a review call if you want to walk through it together.', release: 'immediate', auto: 'staging_ready' },
      { key: 'p2-staging-approved', day: 13, title: 'Preview approved', client: 'You approve the site (or the 48 hours pass with no changes asked for).', release: 'immediate', auto: 'staging_approved' },
      { key: 'p2-dns', day: 14, title: 'Switch your domain to the new site', client: 'Your web address now opens the new site.', release: 'immediate', auto: 'dns_cutover' },
      { key: 'p2-launch', day: 14, title: 'Launch + Launch Certificate', client: 'You are live. Your Launch Certificate lists everything that went live and is emailed to you.', release: 'immediate', auto: 'go_live' },
    ],
  },
  {
    key: 'p3',
    title: 'Win-back texts',
    from: 15,
    to: 30,
    days: 'Days 15–30',
    summary: 'Win-back texts to past patients and clients: three texts over 7 days, and every booking they bring is counted.',
    steps: [
      { key: 'p3-import', day: 15, title: 'Past-customer list imported', client: 'Your list of past patients or customers (usually 200 to 500) is loaded, with consent confirmed.', release: 'immediate', auto: 'dbr_imported' },
      { key: 'p3-sprint', day: 16, title: 'Win-back texts start', client: 'Three friendly texts over 7 days from your number. Anyone who replies stops getting them.', release: 'immediate', auto: 'dbr_started' },
      { key: 'p3-replies', day: 23, title: 'Win-back texts finished, replies in your inbox', client: 'Every reply lands in your Leads inbox to book.', release: 'immediate', auto: 'dbr_done' },
      { key: 'p3-tracker', day: 30, title: 'Win-back bookings tallied', client: 'Bookings from the win-back texts go into your Pipeline Revenue Tracker.', release: 'schedule' },
    ],
  },
  {
    key: 'p4',
    title: 'Reviews + listings',
    from: 45,
    to: 60,
    days: 'Days 45–60',
    summary: 'A review request 2 hours after each completed visit, and your name, address and phone matched on 40 directories.',
    steps: [
      { key: 'p4-reviews', day: 45, title: 'Review requests on', client: 'Two hours after you mark a visit completed, the customer gets a text asking for a Google review.', release: 'immediate', auto: 'reviews_live' },
      { key: 'p4-citations', day: 50, title: 'Directory listings started', client: 'We correct your listing on each directory so every one matches.', release: 'schedule', auto: 'citations_started' },
      { key: 'p4-citations-done', day: 60, title: 'Listings consistent everywhere', client: 'Every directory shows the same name, address and phone.', release: 'schedule', auto: 'citations_done' },
    ],
  },
  {
    key: 'p5',
    title: 'Search growth',
    from: 61,
    to: 150,
    days: 'Months 3–5',
    summary: 'Pages for your locations and services, written one by one, then your search report in month 5.',
    steps: [
      { key: 'p5-plan', day: 61, title: 'Page plan', client: 'The areas and procedures that deserve their own page, each written for its own visitors.', release: 'schedule', auto: 'pages_planned' },
      { key: 'p5-publish', day: 90, title: 'First pages published', client: 'Pages go live once each one passes our uniqueness check.', release: 'schedule', auto: 'pages_published' },
      { key: 'p5-sitemap', day: 92, title: 'Sitemap submitted to Google', client: 'Google is told about every new page.', release: 'schedule', auto: 'sitemap_submitted' },
      { key: 'p5-indexing', day: 120, title: 'Indexing checked', client: 'We check which pages Google has indexed; the count is on your dashboard.', release: 'schedule' },
      { key: 'p5-harvest', day: 150, title: 'Your search report', client: 'Rankings, search clicks and the calls and forms that came from search.', release: 'schedule', auto: 'harvest_published' },
    ],
  },
  {
    key: 'p6',
    title: 'Six-month review',
    from: 151,
    to: 180,
    days: 'Month 6',
    summary: 'A 30-minute call on what the first six months produced.',
    steps: [
      { key: 'p6-schedule', day: 165, title: 'Review call booked', client: 'We book 30 minutes with you for the six-month review.', release: 'immediate', auto: 'sabr_scheduled' },
      { key: 'p6-sabr', day: 180, title: 'Six-month review', client: 'Recovered pipeline, missed calls rescued, new reviews and search growth, and what comes next.', release: 'immediate', auto: 'sabr_done' },
    ],
  },
];

export const ALL_STEPS: readonly (ScheduleStep & { phase: SchedulePhase['key'] })[] = DELIVERY_SCHEDULE.flatMap((p) => p.steps.map((s) => ({ ...s, phase: p.key })));
export const isStepKey = (k: unknown): k is string => typeof k === 'string' && ALL_STEPS.some((s) => s.key === k);
