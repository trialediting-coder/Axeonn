// One page per practice area inside a practice type: /solutions/{vertical}/{specialty}
// (owner, 2026-10-20: "use all the info and apply it. we wanna rank aggressively").
// Each targets a low-difficulty national search found in Semrush (US, Oct 2026):
// personal injury marketing 1,000/KD4, family law marketing 1,300/KD12, criminal
// defense marketing 720/KD9, estate planning marketing 390/KD8, orthodontist
// marketing 720/KD12, marketing for bookkeepers 210/KD7 + bookkeeping leads
// 210/KD10, how to get more tax clients 110/KD8 + marketing for tax preparers 90/KD8.
//
// Same rules as data/serviceFunnels.ts: short lines, that practice's own words,
// no invented clients, stats or results, never promise rankings or outcomes.
// Law: attorney advertising rules (no "specialist"/"expert", no outcomes) and no
// case facts by text or form. Dental: no health information. Accounting: no tax
// advice, no tax documents or financial details through intake.

import type { FaqItem } from '@/data/faqData';
import type { PracticeVertical } from '@/data/servicePages';

export interface SpecialtyPage {
  vertical: PracticeVertical;
  slug: string;
  /** Short name for links and breadcrumbs. */
  name: string;
  /** The primary search phrase, shown as the hero eyebrow. */
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  sub: string;
  /** The real search or moment this page is about. */
  moment: string;
  /** Three things we do about it. */
  does: [string, string, string];
  /** Where new clients slip away, one line each. */
  leaks: { title: string; line: string }[];
  steps: [string, string, string];
  included: string[];
  /** The first question is the top question search for the topic (AEO). */
  faqs: FaqItem[];
}

const q = (question: string, answer: string): FaqItem => ({ question, answer });

const CORE_COST =
  "AxeonCORE is $799/mo on a 12-month agreement, with $0 setup (normally $3,000) and nothing due until you're live. Ads are in AxeonGROWTH, $1,999/mo plus ad spend from $500/mo, paid to Google directly.";

const LAW_STEPS: [string, string, string] = [
  'We map the searches for your practice area and the firms showing up for them',
  'We build the pages and set up 60-second intake; you approve every word',
  'Live in 30 days, with every call and form tracked to a booked consultation',
];

const LAW_RULES = q(
  'Do you follow attorney advertising rules?',
  'Yes. Copy avoids promised outcomes and words like "specialist" or "expert", and you approve every word before launch.',
);

const LAW_NO_FACTS = q(
  'Does your intake collect case details?',
  'No. The first reply collects name, contact and a good time to talk. Case facts wait for the attorney.',
);

export const specialtyPages: SpecialtyPage[] = [
  {
    vertical: 'law-firms',
    slug: 'personal-injury',
    name: 'Personal injury',
    keyword: 'Personal injury marketing',
    metaTitle: 'Personal Injury Marketing for Law Firms | Axeon Studio',
    metaDescription:
      'Personal injury marketing for Iowa law firms: found after the accident, every call answered in 60 seconds, case reviews booked. From $799/mo.',
    headline: 'Personal injury marketing that answers before the next firm does.',
    sub: 'After a crash, people call down the list of firms. Be the one that answers.',
    moment: 'Saturday night after the crash. They search “car accident lawyer near me” and call three firms.',
    does: [
      'A page for car, truck, motorcycle and workplace injuries, each with a call button',
      'Every missed call texted back within 60 seconds, nights and weekends',
      'Case reviews booked online, with no injury details asked by text or form',
    ],
    leaks: [
      { title: 'After-hours calls', line: 'Accidents happen on weekends. Voicemail sends them to the next firm.' },
      { title: 'Slow form replies', line: 'A web form answered Monday morning is answered too late.' },
      { title: 'Shared leads', line: 'Lead vendors sell the same person to several firms. Your own site sends them only to you.' },
      { title: 'Thin reviews', line: 'People compare star counts before they call.' },
    ],
    steps: LAW_STEPS,
    included: [
      'A page for each injury type you take',
      'Attorney bios with bar admissions and real photos',
      'Missed-call text-back and a 60-second first reply, 24/7',
      'Online case-review booking',
      'Google Business Profile upkeep and review requests',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do personal injury lawyers get clients?',
        'From Google searches, referrals and ads, and then from answering first. Show up for the injury types you take, answer every call in 60 seconds and book the case review on the spot.',
      ),
      q('How much does personal injury marketing cost?', CORE_COST),
      q(
        'Do you sell personal injury leads?',
        'No. We build your own pages, profile and intake, so every inquiry goes only to your firm. One firm per specialty within 5 miles.',
      ),
      LAW_NO_FACTS,
      LAW_RULES,
    ],
  },
  {
    vertical: 'law-firms',
    slug: 'family-law',
    name: 'Family law',
    keyword: 'Family law marketing',
    metaTitle: 'Family Law Marketing for Divorce Attorneys | Axeon Studio',
    metaDescription:
      'Family law marketing for Iowa divorce and custody attorneys: found in private, answered in 60 seconds, consultations booked online. From $799/mo.',
    headline: 'Family law marketing for the call they’ve put off for months.',
    sub: 'Divorce and custody clients search quietly, late at night. Answer them fast and privately.',
    moment: '11 PM, phone on low brightness. They search “divorce lawyer near me” and read every review first.',
    does: [
      'Pages for divorce, custody, child support and mediation, in plain words',
      'A discreet text reply within 60 seconds, worded so it’s safe on a shared phone',
      'Consultations booked online, at any hour',
    ],
    leaks: [
      { title: 'Late-night searches', line: 'They’re ready at 11 PM. Your office opens at 8.' },
      { title: 'Nervous about calling', line: 'Many would rather text or book online than talk first.' },
      { title: 'One generic page', line: 'A single “family law” page doesn’t answer the custody question they searched.' },
      { title: 'Reviews', line: 'They read every review before trusting anyone with this.' },
    ],
    steps: LAW_STEPS,
    included: [
      'A page for divorce, custody, child support and mediation',
      'Attorney bios with real photos and how you work with clients',
      'Discreet missed-call text-back and a 60-second first reply',
      'Online consultation booking, any hour',
      'Google Business Profile upkeep and review requests',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do family law attorneys get clients?',
        'Referrals and Google. People compare reviews, read your pages and contact the firm that makes the first step easiest, so fast replies and online booking matter most.',
      ),
      q('How much does family law marketing cost?', CORE_COST),
      q(
        'Is the first text discreet?',
        'Yes. It names your firm and offers a time to talk. It never mentions divorce or custody, in case someone else sees the phone.',
      ),
      LAW_NO_FACTS,
      LAW_RULES,
    ],
  },
  {
    vertical: 'law-firms',
    slug: 'criminal-defense',
    name: 'Criminal defense',
    keyword: 'Criminal defense marketing',
    metaTitle: 'Criminal Defense Marketing for Attorneys | Axeon Studio',
    metaDescription:
      'Criminal defense marketing for Iowa attorneys: found the night of the arrest, every call answered in 60 seconds, consultations booked. From $799/mo.',
    headline: 'Criminal defense marketing for the calls that come at 2 AM.',
    sub: 'An arrest doesn’t wait for business hours. The family calls whoever answers.',
    moment: 'Saturday, 2 AM. A parent searches “OWI lawyer near me” and calls every number on the first screen.',
    does: [
      'A page for OWI, drug charges, assault and the other charges you take',
      'Every missed call texted back within 60 seconds, all night',
      'Consultations booked online, with no charge details asked by text or form',
    ],
    leaks: [
      { title: 'Calls at 2 AM', line: 'Voicemail at night means the next firm on the list.' },
      { title: 'Family members calling', line: 'Often a parent or spouse calls first. Intake has to be ready for them.' },
      { title: 'Charge-specific searches', line: 'People search “OWI lawyer”, not “criminal defense”. One page can’t cover every charge.' },
      { title: 'Reviews', line: 'A scared family picks the firm other people vouch for.' },
    ],
    steps: LAW_STEPS,
    included: [
      'A page for each charge type you take, with Iowa’s own terms like OWI',
      'Attorney bios with bar admissions and real photos',
      'Missed-call text-back and a 60-second first reply, 24/7',
      'Online consultation booking',
      'Google Business Profile upkeep and review requests',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do criminal defense lawyers get clients?',
        'Mostly from searches made right after an arrest, and from referrals. A page for each charge, an answer at any hour and easy booking win the call.',
      ),
      q('How much does criminal defense marketing cost?', CORE_COST),
      q(
        'Do you build pages for OWI?',
        'Yes. Iowa calls it OWI, so that’s the word on your page, with “DUI” alongside for people who search that.',
      ),
      LAW_NO_FACTS,
      LAW_RULES,
    ],
  },
  {
    vertical: 'law-firms',
    slug: 'estate-planning',
    name: 'Estate planning & probate',
    keyword: 'Estate planning marketing',
    metaTitle: 'Estate Planning Marketing for Attorneys | Axeon Studio',
    metaDescription:
      'Estate planning and probate marketing for Iowa attorneys: found by families planning ahead, inquiries answered in 60 seconds, meetings booked online.',
    headline: 'Estate planning marketing for families who keep putting it off.',
    sub: 'They mean to call for years. Make the first step one tap.',
    moment: 'Sunday afternoon. A couple with a new grandchild searches “wills and trusts lawyer near me”.',
    does: [
      'Pages for wills, trusts, powers of attorney and probate',
      'A reply within 60 seconds, then a reminder if they don’t book',
      'The first meeting booked online, in person or by video',
    ],
    leaks: [
      { title: 'Putting it off', line: 'Without a nudge, “we should call” turns into next year.' },
      { title: 'Probate searches', line: 'After a parent dies, adult children search “probate lawyer”. They need their own page.' },
      { title: 'Seminar sign-ups', line: 'Interest from a workshop goes cold when nobody follows up.' },
      { title: 'Reviews', line: 'Families trust the firm their neighbors already used.' },
    ],
    steps: LAW_STEPS,
    included: [
      'A page for wills, trusts, powers of attorney and probate',
      'Attorney bios with real photos and how a first meeting works',
      'Missed-call text-back and a 60-second first reply',
      'Online booking for in-person or video meetings',
      'Google Business Profile upkeep and review requests',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do estate planning attorneys get clients?',
        'Referrals, Google and seminars. People plan ahead slowly, so the firms that follow up and make booking easy get the meeting.',
      ),
      q('How much does estate planning marketing cost?', CORE_COST),
      q('Do you build probate pages too?', 'Yes. Probate is a different search from estate planning, so it gets its own page.'),
      q('Can clients book a video meeting?', 'Yes. Online booking can offer in-person or video times, whichever you take.'),
      LAW_RULES,
    ],
  },
  {
    vertical: 'dental',
    slug: 'orthodontists',
    name: 'Orthodontists',
    keyword: 'Orthodontist marketing',
    metaTitle: 'Orthodontist Marketing for Iowa Practices | Axeon Studio',
    metaDescription:
      'Orthodontist marketing for Iowa practices: found by parents and adults, every consult request answered in 60 seconds, consultations booked online.',
    headline: 'Orthodontist marketing that books the consultation, not just the click.',
    sub: 'Parents compare a few orthodontists before choosing one. Be the easy yes.',
    moment: 'A parent leaves the dentist with a referral slip and searches “orthodontist near me” in the parking lot.',
    does: [
      'Pages for braces, clear aligners, kids and adults',
      'Every consult request answered within 60 seconds, after school hours included',
      'Consultations booked online, around school and work schedules',
    ],
    leaks: [
      { title: 'After-school calls', line: 'Parents call at 4 PM, when your team is busiest.' },
      { title: 'Referral slips', line: 'A referral still has to choose you over the other names on it.' },
      { title: 'Adult patients', line: 'Adults searching for aligners need a page written for them.' },
      { title: 'Cost questions', line: 'Payment plans buried in a PDF send people elsewhere.' },
    ],
    steps: [
      'We review your site and the top 3 orthodontists near you',
      'We build the pages and set up 60-second replies; you approve every word',
      'Live in 30 days, with consultation booking on from day one',
    ],
    included: [
      'A page for braces, clear aligners, kids and adults',
      'Orthodontist bio with credentials and real photos',
      'Payment plans and insurance explained as plain text',
      'A reply to every consult request within 60 seconds, 24/7',
      'Online consultation booking and review requests',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do orthodontists get new patients?',
        'Dentist referrals, Google searches by parents and adults, and reviews. Answer consult requests fast and make booking easy, so more referrals become consultations.',
      ),
      q('How much does orthodontist marketing cost?', CORE_COST),
      q('Do you collect health information?', 'No. Intake asks for name, contact and a good time. Clinical details wait for the consultation.'),
      q('Can you build pages for the aligner brands we offer?', 'Yes. Each treatment you offer can have its own page, named the way patients search for it.'),
      q('Is this only for orthodontists in Des Moines?', 'We work with practices across Iowa. One practice per specialty within 5 miles.'),
    ],
  },
  {
    vertical: 'accounting',
    slug: 'bookkeepers',
    name: 'Bookkeepers',
    keyword: 'Marketing for bookkeepers',
    metaTitle: 'Bookkeeping Marketing for Bookkeepers | Axeon Studio',
    metaDescription:
      'Marketing for bookkeepers in Iowa: your own bookkeeping leads from Google, every inquiry answered in 60 seconds, discovery calls booked. From $799/mo.',
    headline: 'Bookkeeping clients who stay for years, found on Google.',
    sub: 'A monthly client is worth far more than one return. Get found by the owners looking for one.',
    moment: 'A business owner three months behind on their books searches “bookkeeper near me” on a Sunday night.',
    does: [
      'Pages for monthly bookkeeping, cleanup and catch-up, and payroll',
      'A reply within 60 seconds, so a Sunday-night search becomes a Monday call',
      'Discovery calls booked online',
    ],
    leaks: [
      { title: 'Directory leads', line: 'Lead sites send the same owner to several bookkeepers at once.' },
      { title: 'Catch-up work', line: 'Owners behind on their books want help now. Slow replies lose them.' },
      { title: 'One generic page', line: 'Monthly, cleanup and payroll are different searches.' },
      { title: 'No reviews', line: 'Happy clients rarely leave a review unless someone asks.' },
    ],
    steps: [
      'We map the bookkeeping searches in your area and who shows up for them',
      'We build the pages and set up 60-second replies; you approve every word',
      'Live in 30 days, with every call and form tracked to a booked discovery call',
    ],
    included: [
      'A page for monthly bookkeeping, cleanup and catch-up, and payroll',
      'Your bio, credentials and the software you work in',
      'Missed-call text-back and a 60-second first reply',
      'Online discovery-call booking',
      'Google Business Profile upkeep and review requests',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do bookkeepers get clients?',
        'Referrals from CPAs and clients, plus local Google searches. A page for each service, fast replies and a simple discovery call turn searches into monthly clients.',
      ),
      q('How much does bookkeeping marketing cost?', CORE_COST),
      q(
        'Do you sell bookkeeping leads?',
        'No. We build your own pages, profile and intake, so every inquiry goes only to you. One firm per specialty within 5 miles.',
      ),
      q('Does intake collect financial details?', 'No. It collects name, contact, the service they need and a good time. Books and numbers wait for the call.'),
      q('Can a solo bookkeeper use this?', 'Yes, if you want more monthly clients and can take them on.'),
    ],
  },
  {
    vertical: 'accounting',
    slug: 'tax-preparers',
    name: 'Tax preparers',
    keyword: 'Marketing for tax preparers',
    metaTitle: 'Marketing for Tax Preparers & Tax Offices | Axeon Studio',
    metaDescription:
      'Marketing for tax preparers in Iowa: get more tax clients from Google, every call answered in 60 seconds in rush season, appointments booked online.',
    headline: 'More tax clients, without missing calls in March.',
    sub: 'Tax season is short. Every missed call in it is a return someone else files.',
    moment: 'January 31. W-2 in hand, they search “tax preparation near me” and call the first office that picks up.',
    does: [
      'A Google profile with tax-season hours, kept current',
      'Every missed call texted back within 60 seconds, even on the busiest Saturday',
      'Appointments booked online, with reminders so people show up',
    ],
    leaks: [
      { title: 'Rush-season phones', line: 'Your team is with clients. The phone rings out.' },
      { title: 'Wrong hours on Google', line: 'Old hours send people to the office down the street.' },
      { title: 'No-shows', line: 'A missed appointment in March is a slot you can’t get back.' },
      { title: 'Reviews', line: 'Finished returns are the best time to ask, and the easiest to forget.' },
    ],
    steps: [
      'In the fall, we fix your Google profile and build your service pages',
      'We set up 60-second replies and online booking; you approve every word',
      'Live before January, with every call and booking tracked through April',
    ],
    included: [
      'Pages for individual returns, small business returns and your other services',
      'Google Business Profile with seasonal hours',
      'Missed-call text-back and a 60-second first reply',
      'Online appointment booking with reminders',
      'Review requests after finished returns',
      'Call tracking and a monthly AxeonPROOF report',
    ],
    faqs: [
      q(
        'How do I get more tax clients?',
        'Be found on Google in January, answer every call during rush season and let people book online. Then ask every finished client for a review.',
      ),
      q('How much does marketing for a tax office cost?', CORE_COST),
      q('When should a tax preparer start marketing?', 'In the fall, so your profile and pages are settled before January searches start.'),
      q('Does intake collect tax documents?', 'No. It collects name, contact, the service they need and a time. Documents and Social Security numbers never pass through it.'),
      q('Do the pages give tax advice?', 'No. Pages explain your services. Anything that reads as tax advice is yours to write or approve.'),
    ],
  },
];

export const specialtyPath = (p: Pick<SpecialtyPage, 'vertical' | 'slug'>) => `/solutions/${p.vertical}/${p.slug}`;

export const specialtiesFor = (vertical: string) => specialtyPages.filter((p) => p.vertical === vertical);

export const specialtyFor = (vertical: string, slug: string) =>
  specialtyPages.find((p) => p.vertical === vertical && p.slug === slug);
