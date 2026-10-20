// The four practice types Axeon serves (owner decision 2026-10-19): dental,
// med spa, law firms, accounting/CPA. Each page tells one story: where new
// patients or clients slip away (after hours, busy hours, no review ask) and
// the intake system that answers them within 60 seconds.
//
// Honesty rules (see content/brand-guardrails.md): no invented clients,
// results, stats or percentages. Never promise a number of patients, leads,
// revenue or rankings. The retired trade niches (hvac, roofing, ...) 301 to
// /solutions in next.config.mjs.

export type NicheCategory = 'Healthcare' | 'Professional Services';

export interface NicheLeak {
  /** Mono time stamp shown on the featured leak, e.g. "TUE 6:40 PM". */
  stamp?: string;
  title: string;
  scenario: string;
  cost: string;
  /** The fix, shown as a [ PLUG ] chip. */
  plug: string;
  plugHref: string;
}

export interface NicheWorkflowStep {
  text: string;
  /** 1-based leak numbers this step plugs, shown as [ PLUGS LEAK 0X ]. */
  plugsLeaks?: number[];
}

export interface Niche {
  slug: string;
  name: string;
  /** Short label for menus: "Dental", "Med Spa". */
  shortName: string;
  category: NicheCategory;
  /** Plural word for this practice's customers: "Ready for more {customerNoun}?" */
  customerNoun: string;
  /** Singular lead phrase for this practice's inquiries. */
  leadNoun: string;
  /** One outcome line for the /solutions hub card. */
  cardLine: string;
  schemaType: string;
  // Short, SEO-tuned <title> tag text (kept separate from `headline`, the
  // on-page H1). Stays under ~45 chars so "<seoTitle> | Axeon Studio" fits.
  seoTitle: string;
  /** The primary search phrase as the hero's first line (Semrush keyword map, 2026-10-20). */
  keywordLine: string;
  /** Meta description for /solutions/[slug]; falls back to subheadline. */
  seoDescription?: string;
  headline: string;
  subheadline: string;
  tagline: string;
  /** The practice's leak story in one line: Leaks section heading and /solutions card lead. */
  leakHeadline: string;
  /** Leak 01 is featured (and carries the stamp); 02-04 render as rows. */
  painPoints: NicheLeak[];
  /** Workflow section heading, told from the leak story. */
  workflowHeadline: string;
  intakeWorkflowSteps: NicheWorkflowStep[];
  /** Practice-specific trust note shown under the workflow (privacy, ethics rules). */
  complianceNote: string;
  primaryCTA: string;
  secondaryCTA: string;
}

const INTAKE = '/marketing-solutions#intake';
const REVIEWS = '/marketing-solutions#reviews';
const WEBSITE = '/marketing-solutions#website';

const HEALTH_INTAKE_NOTE =
  'Intake collects name, contact, service and preferred time only. Never symptoms, insurance or health details.';

export const niches: Niche[] = [
  {
    slug: 'dental',
    name: 'Dental Practices',
    shortName: 'Dental',
    category: 'Healthcare',
    customerNoun: 'patients',
    leadNoun: 'new-patient inquiry',
    cardLine: 'New-patient calls and implant or Invisalign questions answered within 60 seconds, day or night.',
    schemaType: 'Dentist',
    seoTitle: 'Dental Marketing for Des Moines Practices',
    keywordLine: 'Dental marketing · Des Moines & Iowa',
    seoDescription:
      'Dental marketing for Des Moines practices: every new-patient call and inquiry answered in 60 seconds, exams booked online, a review ask after every visit.',
    headline: 'New patients call after hours. Answer them in 60 seconds.',
    subheadline:
      'Every missed call answered in 60 seconds, 24/7, and the exam booked.',
    tagline: 'New-patient exams and implant consults booked, not lost to voicemail.',
    leakHeadline: 'The new-patient call that hit voicemail at 6:40 PM.',
    painPoints: [
      {
        stamp: 'TUE 6:40 PM',
        title: 'New-patient call goes to voicemail',
        scenario:
          'A family new to the area calls after the front desk has gone home. They hear the machine and call the next practice on the map.',
        cost: 'A new-patient exam, and likely the whole family’s hygiene visits.',
        plug: '24/7 missed-call text-back',
        plugHref: INTAKE,
      },
      {
        title: 'Implant question, answered tomorrow',
        scenario:
          'Someone fills out your form at 9 PM asking about implants. The front desk sees it the next morning, between check-ins.',
        cost: 'A high-value consult booked with whoever replied first.',
        plug: 'First reply to every inquiry within 60 seconds',
        plugHref: INTAKE,
      },
      {
        title: 'Invisalign consult, three rounds of phone tag',
        scenario:
          'A patient wants a consult but can only talk at lunch. Your team calls back during appointments. Nobody connects.',
        cost: 'A consult that never makes it onto the schedule.',
        plug: 'Online consult booking + two-way text inbox',
        plugHref: INTAKE,
      },
      {
        title: 'Great visit, no review',
        scenario:
          'Patients leave happy, but nobody asks for a review. The practice down the road asks every patient.',
        cost: 'The next new patient picks the practice with more recent reviews.',
        plug: 'Review request after every appointment',
        plugHref: REVIEWS,
      },
    ],
    workflowHeadline: 'From after-hours call to booked new-patient exam.',
    intakeWorkflowSteps: [
      { text: 'A patient searching for a dentist nearby finds your site: providers, credentials, services and reviews on one fast page' },
      { text: 'They call after hours or send a form. Within 60 seconds they get a text reply from your practice', plugsLeaks: [1, 2] },
      { text: 'Intake asks for name, contact, the visit they want and a preferred time. Nothing clinical' },
      { text: 'They book online, or your front desk confirms the time from the two-way text inbox', plugsLeaks: [3] },
      { text: 'After the visit, an automatic text asks for a Google review', plugsLeaks: [4] },
    ],
    complianceNote: HEALTH_INTAKE_NOTE,
    primaryCTA: 'Check if your area is open',
    secondaryCTA: 'See plans and pricing',
  },
  {
    slug: 'med-spa',
    name: 'Med Spas & Aesthetic Clinics',
    shortName: 'Med Spa',
    category: 'Healthcare',
    customerNoun: 'clients',
    leadNoun: 'consult request',
    cardLine: 'Consult requests answered within 60 seconds and booked before they shop around.',
    schemaType: 'MedicalBusiness',
    seoTitle: 'Med Spa Marketing Agency in Des Moines',
    keywordLine: 'Med spa marketing · Des Moines & Iowa',
    seoDescription:
      'Med spa marketing in Des Moines: every consultation request answered in 60 seconds and booked online, with a review ask after every visit. From $799/mo.',
    headline: 'Consult requests come in at night. Answer them in 60 seconds.',
    subheadline:
      'Every consult request answered in 60 seconds, 24/7, and booked.',
    tagline: 'More booked consults, treatment plans and memberships.',
    leakHeadline: 'The filler question nobody answered at 10 PM.',
    painPoints: [
      {
        stamp: '10:04 PM',
        title: 'Consult request, answered two days later',
        scenario:
          'Someone sees your before-and-afters, asks about a consult through your site at night, and waits until your team catches up.',
        cost: 'A consult booked with the spa that answered that night.',
        plug: 'First reply within 60 seconds, 24/7',
        plugHref: INTAKE,
      },
      {
        title: 'Missed call during a treatment',
        scenario: 'Your injector is with a client and the front desk is on another line. The caller hangs up.',
        cost: 'A new client who called the next spa on the list.',
        plug: '24/7 missed-call text-back',
        plugHref: INTAKE,
      },
      {
        title: 'Treatment plan, then silence',
        scenario:
          'A client leaves a consult with a treatment plan and a quote. Nobody checks in while they think it over.',
        cost: 'A multi-session plan, or a membership, that goes to whoever followed up.',
        plug: 'Two-way text inbox for the front desk',
        plugHref: INTAKE,
      },
      {
        title: 'Loyal regulars, quiet reviews',
        scenario: 'Your members love you, but your Google profile shows a handful of old reviews.',
        cost: 'New clients compare reviews first and pick the busier-looking spa.',
        plug: 'Review request after every appointment',
        plugHref: REVIEWS,
      },
    ],
    workflowHeadline: 'From late-night question to booked consultation.',
    intakeWorkflowSteps: [
      { text: 'Someone researching a treatment finds your site: providers, credentials, treatments and reviews' },
      { text: 'They call or send a question. A reply goes out within 60 seconds, any hour', plugsLeaks: [1, 2] },
      { text: 'Intake collects name, contact, the treatment they are interested in and a preferred time. Nothing clinical' },
      { text: 'They book the consultation online, and your team follows up on treatment plans from the two-way text inbox', plugsLeaks: [3] },
      { text: 'After each appointment, an automatic text asks for a review', plugsLeaks: [4] },
    ],
    complianceNote: HEALTH_INTAKE_NOTE,
    primaryCTA: 'Check if your area is open',
    secondaryCTA: 'See plans and pricing',
  },
  {
    slug: 'law-firms',
    name: 'Law Firms',
    shortName: 'Law Firms',
    category: 'Professional Services',
    customerNoun: 'clients',
    leadNoun: 'intake call',
    cardLine: 'Intake calls answered within 60 seconds and consultations booked, with attorney advertising rules respected.',
    schemaType: 'LegalService',
    seoTitle: 'Law Firm Marketing in Des Moines, IA',
    keywordLine: 'Law firm marketing · Des Moines & Iowa',
    seoDescription:
      'Law firm marketing for Des Moines attorneys: every call and inquiry answered in 60 seconds, case reviews booked, reviews within bar rules. From $799/mo.',
    headline: 'People call a lawyer the night it happens. Answer in 60 seconds.',
    subheadline:
      'Every missed intake call answered in 60 seconds, 24/7, and the consult booked.',
    tagline: 'Intake calls answered and consultations booked.',
    leakHeadline: 'The night-after call goes to whoever answers.',
    painPoints: [
      {
        stamp: 'FRI 8:15 PM',
        title: 'Intake call after the office closes',
        scenario:
          'Someone needs a lawyer tonight. They call your office, hear the after-hours message, and keep dialing down the search results.',
        cost: 'The consultation, and the matter, signed with the firm that answered.',
        plug: '24/7 missed-call text-back',
        plugHref: INTAKE,
      },
      {
        title: 'Web inquiry waits for Monday',
        scenario: 'A form comes in over the weekend. It sits in a shared inbox until someone has time to read it.',
        cost: 'A prospective client who already booked a consult elsewhere.',
        plug: 'First reply to every inquiry within 60 seconds',
        plugHref: INTAKE,
      },
      {
        title: 'Too many details, too soon',
        scenario:
          'A long contact form asks people to describe their case before anyone has checked for a conflict.',
        cost: 'Confidential facts in your inbox from someone you may not be able to represent.',
        plug: 'Conflict-safe intake: contact and matter type only',
        plugHref: INTAKE,
      },
      {
        title: 'A site that sounds like every other firm',
        scenario: 'Stock photos, vague practice-area pages, and no clear way to book a consultation.',
        cost: 'People compare three firms and call the one that looks easiest to reach.',
        plug: 'Practice website with attorney bios and consult booking',
        plugHref: WEBSITE,
      },
    ],
    workflowHeadline: 'From after-hours call to booked consultation.',
    intakeWorkflowSteps: [
      { text: 'Someone searching for a lawyer finds your site: attorneys, credentials, practice areas and a clear way to book', plugsLeaks: [4] },
      { text: 'They call after hours or send a form. A reply goes out within 60 seconds, any hour', plugsLeaks: [1, 2] },
      { text: 'Intake asks for name, contact and the type of matter only, so your team can run a conflict check first', plugsLeaks: [3] },
      { text: 'They pick a consultation time online, or your staff follows up from the two-way text inbox' },
      { text: 'When a matter closes and it is appropriate, an automatic text asks for a review' },
    ],
    complianceNote:
      'The automated first reply never gives legal advice and collects no case facts. Site copy is written with attorney advertising rules in mind: no promised outcomes, and you approve every word before launch.',
    primaryCTA: 'Check if your area is open',
    secondaryCTA: 'See plans and pricing',
  },
  {
    slug: 'accounting',
    name: 'Accounting & CPA Firms',
    shortName: 'Accounting',
    category: 'Professional Services',
    customerNoun: 'clients',
    leadNoun: 'new-client inquiry',
    cardLine: 'Tax-season overflow answered and advisory consults booked, even when the phones are buried.',
    schemaType: 'AccountingService',
    seoTitle: 'Marketing for CPA Firms in Des Moines',
    keywordLine: 'Marketing for CPA & accounting firms · Iowa',
    seoDescription:
      'Marketing for CPA and accounting firms in Des Moines: every call answered in 60 seconds, even in March, and meetings booked online. From $799/mo.',
    headline: 'In March, new clients wait on hold. Answer them in 60 seconds.',
    subheadline:
      'Every missed call answered in 60 seconds, even in tax season, and booked.',
    tagline: 'Tax-season overflow answered, advisory consults booked.',
    leakHeadline: 'In March, your best new client waits behind W-2s.',
    painPoints: [
      {
        stamp: 'MAR · 5:52 PM',
        title: 'Tax-season phones ring out',
        scenario:
          'Your staff is buried in returns. A business owner looking for a new CPA calls twice, gets voicemail twice, and moves on.',
        cost: 'A year-round client, not just one return.',
        plug: '24/7 missed-call text-back',
        plugHref: INTAKE,
      },
      {
        title: 'Advisory inquiry lost in the pile',
        scenario:
          'A request about advisory or bookkeeping work lands in the same inbox as fifty “where is my refund” emails.',
        cost: 'Your highest-value work answered last.',
        plug: 'First reply within 60 seconds, sorted by service',
        plugHref: INTAKE,
      },
      {
        title: 'Consult scheduling by email chain',
        scenario:
          'Four emails to find a time for a 30-minute intro call. Somewhere in there, the prospect stops replying.',
        cost: 'A consult that never happens.',
        plug: 'Online consult booking',
        plugHref: INTAKE,
      },
      {
        title: 'Happy clients, no reviews',
        scenario:
          'Clients trust you for years but nobody asks them to say so. Your Google profile looks quiet next to the firm across town.',
        cost: 'Referrals look you up and second-guess the call.',
        plug: 'Review request after every engagement',
        plugHref: REVIEWS,
      },
    ],
    workflowHeadline: 'From missed tax-season call to booked advisory consult.',
    intakeWorkflowSteps: [
      { text: 'A business owner looking for a CPA finds your site: partners, credentials, services and reviews' },
      { text: 'They call during a rush or after hours. A text reply goes out within 60 seconds', plugsLeaks: [1] },
      { text: 'Intake sorts tax prep, bookkeeping and advisory requests up front, so the bigger work is not buried', plugsLeaks: [2] },
      { text: 'They book a consult online instead of trading emails', plugsLeaks: [3] },
      { text: 'When the engagement wraps up, an automatic text asks for a review', plugsLeaks: [4] },
    ],
    complianceNote:
      'Intake collects name, contact, the service they need and a preferred time. No tax documents, Social Security numbers or financial details pass through it.',
    primaryCTA: 'Check if your area is open',
    secondaryCTA: 'See plans and pricing',
  },
];

export const nicheBySlug = (slug: string) => niches.find((n) => n.slug === slug);
