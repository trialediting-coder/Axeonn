import { FOUND_OPTIONS } from '@/lib/feedbackShared';
import { MAILBOX_HINT } from '@/lib/businessEmailShared';
import { META_CONNECT_ITEM } from '@/lib/metaShared';
import { EXIT_OFFER_SUGGESTIONS, INDUSTRY_OPTIONS, fillWords, isIndustry, wordsFor, type Industry } from '@/data/industryWords';
// data/onboardingItems.ts
// Single source of truth for the client onboarding portal (/welcome/<token>):
// every checklist item, which plan it belongs to, who does it, and the fields
// the client fills in. lib/onboarding.ts and the portal components read this;
// nothing here runs any logic. Rewording or adding an item never touches code.
//
// Three kinds of item (owner decision 2026-10-06):
//   axeon   - Axeon does it, the client is never asked. Shown greyed with a status
//             so the client can see work happening. GA4, Search Console, hosting.
//   accept  - Axeon sends a platform invite, the client taps Accept in the email
//             from Google/Meta. One button: "Done, I accepted".
//   confirm - A short card, prefilled where possible, that the client confirms.
//
// Hard rule: no field may ever be a password or login. Access always goes
// through the platform's own invite flow. assertNoCredentialFields() in
// lib/onboarding.ts enforces this at test time.
//
// Wording per type of practice or firm (2026-10-19): copy may hold tokens like
// {people} or {Pages} (data/industryWords.ts). orderedItems() in lib/onboarding.ts
// fills them with the client's words (neutral 'other' words until they answer
// the first question). Never put a token in a select option: options are what
// the server validates against.

// 'website' (2026-10-16): the Hosted Website agreement, a site and its hosting only.
export const ONBOARDING_TIERS = ['website', 'essentials', 'axeoncore', 'axeongrowth'] as const;
export type OnboardingTier = (typeof ONBOARDING_TIERS)[number];

export const TIER_LABELS: Record<OnboardingTier, string> = {
  website: 'Hosted Website',
  essentials: 'Essentials',
  axeoncore: 'AxeonCORE',
  axeongrowth: 'AxeonGROWTH',
};

/** Higher tiers include every item from the tiers below them. */
export const TIER_RANK: Record<OnboardingTier, number> = { website: -1, essentials: 0, axeoncore: 1, axeongrowth: 2 };

export type ItemKind = 'axeon' | 'accept' | 'confirm';

export type FieldType = 'text' | 'textarea' | 'tel' | 'email' | 'url' | 'select' | 'multi';

export interface ItemField {
  key: string;
  label: string;
  type: FieldType;
  /** Shown inside the input when empty. */
  placeholder?: string;
  /** One line under the label. */
  hint?: string;
  required?: boolean;
  /** For select / multi. */
  options?: readonly string[];
  /** Which onboarding column prefills this field ('industry': the label of onboardings.industry). */
  prefill?: 'businessName' | 'clientName' | 'clientEmail' | 'phone' | 'industry';
  /** Shown masked (last 4) once saved, since links get forwarded. */
  sensitive?: boolean;
  /** Longest answer kept, when tighter than the type's default (a text message is 320). */
  max?: number;
  /** For select: a line shown under the field once that option is picked. */
  optionHints?: Readonly<Record<string, string>>;
  /**
   * For text: one-tap answers per type of practice (the exit offer). A tap fills the
   * field and the client edits it; they are never validated against, so any text saves.
   * itemForIndustry() resolves them into `suggestions`.
   */
  suggestionsByIndustry?: Readonly<Record<Industry, readonly string[]>>;
  suggestions?: readonly string[];
}

export interface OnboardingItem {
  key: string;
  kind: ItemKind;
  /** The lowest plan that includes this item. */
  tier: OnboardingTier;
  title: string;
  /** One or two plain sentences: what it is and why it matters to them. */
  description: string;
  /** Numbered steps for accept items ("Open the email from Google…"). */
  steps?: readonly string[];
  /** Label on the completion button for accept items. */
  doneLabel?: string;
  /** Fields for confirm items. */
  fields?: readonly ItemField[];
  /** Rough time for the client, shown as a chip ("1 min"). */
  minutes?: number;
  /**
   * Accept items finished by a real connection instead of a "Done" tap. 'meta':
   * the button opens Facebook Login (/api/meta/connect) and the callback marks it
   * done. Hidden from every portal until META_PORTAL_LIVE=1 (after Meta App Review).
   */
  connect?: 'meta';
  /** Shown only on these plans, instead of "this plan and up" (the website plan's own domain card). */
  onlyFor?: readonly OnboardingTier[];
  /**
   * Not needed to start the build, only before launch. The portal shows these as a
   * second round once the first is done, so the first visit looks short. Progress,
   * completion and nudges still count every item.
   */
  later?: boolean;
  /** Long answers the client may give on a call instead: one tap marks it done with { callInstead: 'yes' }. */
  callable?: boolean;
}

// Setup time is computed from the items' own `minutes`, never typed in copy
// (friction audit P4, 2026-10-19): the welcome email, the portal counter, the
// after-checkout page and the sign page all quote setupMinutes(tier).firstRound,
// "the rest closer to launch". See setupMinutes() at the bottom of this file.

/** Saved on a callable item when the client chose to answer it on a call. */
export const CALL_INSTEAD_KEY = 'callInstead';

// Housecall Pro (a trade tool) left the list on 2026-10-19: Axeon sells to practices
// and firms. Jobber stays while its dashboard connection is live. A saved answer
// naming Housecall Pro still shows in the admin.
const INVOICING_OPTIONS = [
  'Practice management software (Dentrix, Open Dental, Clio, Karbon, etc.)',
  'QuickBooks Online',
  'Jobber',
  'Square or Clover',
  'Paper, cash or check',
  'Other',
] as const;

const SERVICES_HINT = 'The ones you want more of, most important first.';

/** The first question for AxeonCORE / AxeonGROWTH: saving it sets onboardings.industry (lib/onboarding.ts saveClientItem). */
export const PRACTICE_TYPE_ITEM = 'practice-type';

/**
 * Who gets the AxeonPROOF summaries (lean setup, 2026-10-19): the owner's mobile for the
 * monthly text, prefilled, and an optional manager for the weekly email. Saving it writes
 * the v2 settings (lib/onboarding.ts saveClientItem), so the admin never retypes it.
 */
export const SUMMARY_CONTACTS_ITEM = 'summary-contacts';

export const ONBOARDING_ITEMS: readonly OnboardingItem[] = [
  // First in the array so it is the first card on CORE and GROWTH. Prefilled from the
  // signed agreement's specialty when that maps clearly; the client still confirms it,
  // and that confirmation sends the dashboard invite (lib/onboardingFulfillment.ts).
  {
    key: PRACTICE_TYPE_ITEM,
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'What type of practice or firm are you?',
    description: 'Your dashboard, texts and pages use the right words for it.',
    minutes: 1,
    fields: [{ key: 'industry', label: 'Pick one', type: 'select', required: true, options: INDUSTRY_OPTIONS, prefill: 'industry' }],
  },
  {
    key: SUMMARY_CONTACTS_ITEM,
    // Round 2: the first summary goes out after launch, so it never lengthens the first visit.
    later: true,
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'Who gets your monthly results',
    description: 'A text on the 1st with the month in one link. Add your {manager} if they should get the weekly email.',
    minutes: 1,
    fields: [
      {
        key: 'ownerMobile',
        label: 'Your mobile',
        type: 'tel',
        required: true,
        placeholder: '(515) 555-0134',
        hint: 'Only for your monthly summary. Never shared.',
        sensitive: true,
        prefill: 'phone',
      },
      { key: 'managerName', label: '{Manager} (optional)', type: 'text', placeholder: 'Name', max: 80 },
      { key: 'managerEmail', label: '{Manager} email', type: 'email', placeholder: 'name@yourpractice.com' },
      { key: 'managerMobile', label: '{Manager} mobile', type: 'tel', placeholder: '(515) 555-0198', sensitive: true },
    ],
  },
  // ───────────────────────── Essentials: the client's part ─────────────────────────
  {
    key: 'business-basics',
    kind: 'confirm',
    tier: 'website',
    title: 'Confirm your business details',
    description: 'This is what goes on your site and your Google listing. Fix anything that is wrong.',
    minutes: 2,
    fields: [
      { key: 'businessName', label: 'Business name', type: 'text', required: true, prefill: 'businessName' },
      {
        key: 'phone',
        label: 'Business phone',
        type: 'tel',
        required: true,
        placeholder: '(515) 555-0134',
        hint: 'The number {people} should call.',
        sensitive: true,
        prefill: 'phone',
      },
      {
        key: 'address',
        label: 'Office address (or service area)',
        type: 'text',
        required: true,
        placeholder: '123 Main St, West Des Moines, IA',
      },
      {
        key: 'hours',
        label: 'Hours',
        type: 'textarea',
        required: true,
        placeholder: 'Mon–Fri 8am–6pm, Sat 9am–2pm, closed Sunday',
      },
    ],
  },
  {
    // Where clients come from, and who to thank: a referrer named here shows on the
    // admin Data page as a referral owed $300 once this client's first invoice is paid (lib/referrals.ts).
    key: 'how-found',
    // Second round (friction audit P5): not needed to start the build, and it made
    // room in round 1 for phone setup.
    later: true,
    kind: 'confirm',
    tier: 'website',
    title: 'How did you find us?',
    description: 'One tap. If someone sent you our way, tell us who so we can thank them: they get $300 and you get a month free.',
    minutes: 1,
    fields: [
      {
        key: 'source',
        label: 'How did you hear about Axeon?',
        type: 'select',
        required: true,
        options: FOUND_OPTIONS,
      },
      { key: 'referredBy', label: 'Who sent you? (name or business)', type: 'text', placeholder: 'Your CPA, consultant or a colleague', hint: 'Only if someone referred you.' },
    ],
  },
  {
    key: 'services',
    kind: 'confirm',
    tier: 'website',
    title: 'The {pages} you want more of',
    description: 'We build the pages and the Google work around these.',
    minutes: 1,
    fields: [
      {
        key: 'services',
        label: '{Pages}, most important first',
        type: 'textarea',
        required: true,
        placeholder: '{pageExamples}',
        hint: SERVICES_HINT,
      },
      {
        key: 'priceRange',
        label: 'Typical price range (optional)',
        type: 'text',
        placeholder: '$200 to $5,000 per {person}',
        hint: 'Helps us write pages that attract the right {people}.',
      },
    ],
  },
  {
    key: 'logo',
    kind: 'confirm',
    tier: 'website',
    title: 'Your logo',
    description: 'Text or email us the file, or tell us to start with a clean text wordmark. We never wait on a logo to launch.',
    minutes: 1,
    fields: [
      {
        key: 'logoChoice',
        label: 'How do you want to handle the logo?',
        type: 'select',
        required: true,
        options: ['I texted or emailed it to you', 'Here is a link to it', 'Start with a text wordmark for now'],
      },
      { key: 'logoLink', label: 'Link to the file (optional)', type: 'url', placeholder: 'https://drive.google.com/…' },
    ],
  },
  {
    key: 'photos',
    kind: 'accept',
    tier: 'website',
    title: 'Send 5 to 10 photos of your team and office',
    description: 'Straight from your phone is perfect. Real photos of your providers, front desk and office outperform stock every time.',
    minutes: 3,
    steps: [
      'Open your camera roll and pick 5 to 10: your team, your office, your work.',
      'Text them to (515) 493-8017, or email hello@axeonstudio.co.',
      'Tap the button below so we know to look for them.',
    ],
    doneLabel: 'Sent them',
  },
  {
    key: 'gbp-access',
    kind: 'accept',
    tier: 'essentials',
    title: 'Accept our Google Business Profile request',
    description:
      'Most of your calls will come from the Google map listing. We manage it for you, and Google needs you to say yes once.',
    minutes: 1,
    steps: [
      'Look for an email from Google titled “Access request” or “Manage your Business Profile”.',
      'Open it and tap Accept. That is the whole step.',
      'No listing yet? Skip this: we will create one and send you the verification instead.',
    ],
    doneLabel: 'I accepted',
  },
  {
    key: 'domain',
    kind: 'confirm',
    tier: 'essentials',
    // Also collects the business email every plan includes (lib/businessEmailShared.ts):
    // Google emails each person their own sign-in, so no field here is ever a login.
    title: 'Your website address and business email',
    description: 'Tell us where your domain lives, or let us register one for you, and which email addresses you want on it. Never type a password here; we will send a secure invite instead.',
    minutes: 2,
    fields: [
      {
        key: 'domainStatus',
        label: 'Do you own a domain already?',
        type: 'select',
        required: true,
        options: ['Yes, I own one', 'No, please register one for me', 'Not sure'],
      },
      { key: 'domainName', label: 'Domain (if you have one)', type: 'text', placeholder: 'yourpractice.com' },
      {
        key: 'registrar',
        label: 'Where is it registered?',
        type: 'select',
        options: ['GoDaddy', 'Google Domains / Squarespace', 'Namecheap', 'Wix', 'Network Solutions', 'Other', "I don't know"],
        hint: 'We will send a delegate invite for that registrar so you never share a login.',
      },
      {
        key: 'mailboxes',
        label: 'Business email addresses you want, and who uses each',
        type: 'textarea',
        required: true,
        placeholder: 'drlee@ for Dr. Lee, frontdesk@ as a shared inbox',
        hint: MAILBOX_HINT,
      },
      {
        key: 'signInEmails',
        label: "Where should Google send each person's sign-in email?",
        type: 'textarea',
        required: true,
        placeholder: 'Dr. Lee: jamie.lee@gmail.com',
        hint: 'A personal address they check today. Google sends the sign-in straight there, so we never handle a password.',
      },
      {
        key: 'currentEmail',
        label: 'Do you use email at this domain today?',
        type: 'select',
        required: true,
        options: ['No, this is new', 'Yes, move my old email over', 'I use Gmail, Yahoo or similar now; start fresh', 'Not sure'],
      },
    ],
  },
  {
    // The website plan has no business email, so its domain card asks only about the domain.
    key: 'website-domain',
    kind: 'confirm',
    tier: 'website',
    onlyFor: ['website'],
    title: 'Your website address',
    description: 'Tell us where your domain lives, or let us register one for you. Never type a password here; we will send a secure invite instead.',
    minutes: 1,
    fields: [
      {
        key: 'domainStatus',
        label: 'Do you own a domain already?',
        type: 'select',
        required: true,
        options: ['Yes, I own one', 'No, please register one for me', 'Not sure'],
      },
      { key: 'domainName', label: 'Domain (if you have one)', type: 'text', placeholder: 'yourpractice.com' },
      {
        key: 'registrar',
        label: 'Where is it registered?',
        type: 'select',
        options: ['GoDaddy', 'Google Domains / Squarespace', 'Namecheap', 'Wix', 'Network Solutions', 'Other', "I don't know"],
        hint: 'We will send a delegate invite for that registrar so you never share a login.',
      },
    ],
  },
  {
    key: 'lead-routing',
    kind: 'confirm',
    tier: 'essentials',
    title: 'Where leads should go',
    description: 'Every new inquiry lands here the second it comes in.',
    minutes: 1,
    fields: [
      {
        key: 'alertMobile',
        label: 'Mobile number for instant text alerts',
        type: 'tel',
        required: true,
        placeholder: '(515) 555-0134',
        sensitive: true,
      },
      { key: 'alertEmail', label: 'Email for lead notifications', type: 'email', required: true, prefill: 'clientEmail' },
      {
        key: 'leadDefinition',
        label: 'What counts as a lead for you?',
        type: 'multi',
        required: true,
        options: ['A phone call', 'A quote request form', 'An online booking', 'A text message'],
        hint: 'So the monthly report counts the right thing.',
      },
    ],
  },
  {
    // Partner integrations (QuickBooks Online, Jobber) connect from the dashboard (owner: live
    // 2026-10-19; the hint already says so on purpose); the
    // others get a hint. Essentials only learns the tool here; nothing is configured for it.
    key: 'jobs-invoicing',
    kind: 'confirm',
    tier: 'essentials',
    later: true,
    title: 'How you invoice and get paid',
    description: 'So new inquiries and paying {people} can line up in one place.',
    minutes: 1,
    fields: [
      {
        key: 'invoicing',
        label: 'What runs your scheduling and billing today?',
        type: 'select',
        required: true,
        options: INVOICING_OPTIONS,
        optionHints: {
          'Practice management software (Dentrix, Open Dental, Clio, Karbon, etc.)':
            'Tell us which one on your kickoff call. Your patient and client records stay in it: we never connect to them or copy them.',
          'QuickBooks Online': 'Connect it in one tap from your AxeonPROOF dashboard. You never share a login.',
          Jobber: 'Connect it in one tap from your AxeonPROOF dashboard. You never share a login.',
          'Square or Clover': 'Nothing changes for you. Leads come to your phone and inbox, and you keep billing the way you do now.',
          Other: 'Nothing changes for you. Leads come to your phone and inbox, and you keep billing the way you do now.',
          'Paper, cash or check':
            "No problem. Axeon partners with QuickBooks and Jobber, and we can send you their onboarding link with partner pricing if you want digital invoices and online card payments. Nothing changes until you decide.",
        },
      },
    ],
  },

  // ───────────────────────── Essentials: Axeon handles these ─────────────────────────
  // Axeon's lists mirror each plan's features in data/pricingData.ts; keep them in step.
  {
    key: 'website',
    kind: 'axeon',
    tier: 'website',
    title: 'Your new website',
    description: 'Custom, mobile-first pages built around how you sell, with 2 rounds of revisions before launch.',
  },
  {
    key: 'google-visibility',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Show up on Google and in AI answers',
    description: 'Your pages and business details set up so Google, the map results and tools like ChatGPT can find and recommend you.',
  },
  {
    key: 'gbp-upkeep',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Google Business Profile upkeep',
    description: 'We keep your listing current, so you keep showing up in the map results.',
  },
  {
    key: 'ga4',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Google Analytics set up',
    description: 'We create and install it. You get viewer access once the site is live.',
  },
  {
    key: 'search-console',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Google Search Console connected',
    description: 'Shows what people search to find you. Nothing needed from you.',
  },
  {
    key: 'hosting',
    kind: 'axeon',
    tier: 'website',
    title: 'Hosting and security',
    description: 'Fast hosting, SSL, backups, and uptime monitoring, so we know before your {people} do if the site ever goes down.',
  },
  {
    key: 'business-email',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Business email at your domain',
    description: 'Set up on Google Workspace with spam protection switched on. Google emails each person their own sign-in; we never see a password.',
  },
  {
    key: 'quote-form',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Inquiry form with instant alerts',
    description: 'Every request lands on your phone and in your inbox, at the number and email you gave us.',
  },
  {
    key: 'monthly-report',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Monthly calls and leads report',
    description: 'Lands in your inbox on the 1st of each month once the site is live.',
  },

  // ───────────────────────── AxeonCORE: the client's part ─────────────────────────
  {
    // First round, not "later" (friction audit P7): the 60-second missed-call
    // text-back depends on it, and carrier (10DLC) registration takes days, so it
    // starts on day 1. The main number is prefilled from what we already have.
    key: 'phone-setup',
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'Phone setup for call tracking and missed-call text-back',
    description: 'Call tracking shows which pages make your phone ring. Missed-call text-back catches the ones you cannot answer. We start the carrier registration as soon as this is in.',
    minutes: 2,
    fields: [
      {
        key: 'mainNumber',
        label: 'Your main office number',
        type: 'tel',
        required: true,
        placeholder: '(515) 555-0134',
        sensitive: true,
        prefill: 'phone',
      },
      {
        key: 'trackingPreference',
        label: 'How should we set up tracking?',
        type: 'select',
        required: true,
        options: [
          'Publish a new tracking number that forwards to my main number',
          'Keep my current number everywhere (tracking on the site only)',
          'Not sure, recommend something',
        ],
      },
      {
        key: 'answerers',
        label: 'Who answers calls and texts?',
        type: 'textarea',
        required: true,
        placeholder: 'Dr. Lee 515-555-0134, Sarah (front desk) 515-555-0199',
        hint: 'Names and mobiles. Instant call-back rings these people.',
        sensitive: true,
      },
      {
        // Read by app/api/phone/voice/status when the phone line has no admin-set message.
        key: 'textBack',
        label: 'The text people get when you miss their call',
        type: 'textarea',
        max: 320,
        placeholder: "Hi, it's [your practice]. Sorry we missed your call. Reply here with what you need and we'll get right back to you.",
        hint: 'Leave it blank to use the message shown. It goes out right after a missed call.',
      },
    ],
  },
  {
    key: 'calendar',
    later: true,
    kind: 'accept',
    tier: 'axeoncore',
    title: 'Share your calendar for online booking',
    description: 'New {people} book themselves 24/7 without double-booking you.',
    minutes: 2,
    steps: [
      'Look for a calendar sharing invite from Axeon Studio in your email.',
      'Accept it. Google Calendar, Outlook, and Apple Calendar all work.',
      'Reply to that email with the services people can book and how long each takes.',
      'Booking lives in your practice software (Dentrix, Open Dental, Clio or similar)? Tap the button and tell us which one; we set it up with you on the kickoff call.',
    ],
    doneLabel: 'Shared it',
  },
  {
    key: META_CONNECT_ITEM,
    later: true,
    kind: 'accept',
    tier: 'axeoncore',
    connect: 'meta',
    title: 'Connect your Facebook page and Instagram',
    description: 'Messages people send your Facebook page or Instagram show up with your other leads, and you can answer them from the same place.',
    minutes: 2,
    steps: [
      'Tap Connect Facebook below and log in to the Facebook account that runs your business page.',
      'When Facebook asks which pages to share, tick your business page. Your Instagram comes along if it is linked to that page.',
      'Tap Save. You land back here and this step is done.',
    ],
    doneLabel: 'Connect Facebook',
  },
  {
    key: 'sales-process',
    later: true,
    callable: true,
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'How you sell, in your own words',
    description: 'This writes your follow-up texts and emails so they sound like you, not a robot. A rough brain-dump is perfect.',
    minutes: 4,
    fields: [
      {
        key: 'responseToday',
        label: 'What happens today when a lead comes in?',
        type: 'textarea',
        required: true,
        placeholder: 'The {frontDesk} calls back between {people}, usually within a few hours. If they do not pick up we leave one voicemail.',
      },
      {
        key: 'pitch',
        label: 'What do you usually say that gets people to book?',
        type: 'textarea',
        required: true,
        placeholder: 'New patients are seen within a week, we have evening hours, and the doctor explains every option before any treatment.',
      },
      {
        key: 'dealKillers',
        label: 'What makes a lead a bad fit?',
        type: 'textarea',
        placeholder: 'Anyone outside our area, or asking for a service we do not offer.',
      },
    ],
  },
  {
    key: 'reviews',
    later: true,
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'Review requests after every {visit}',
    description: 'We generate your Google review link ourselves. We just need to know when a {visit} is finished so the request goes out.',
    minutes: 1,
    fields: [
      {
        key: 'jobDoneSignal',
        label: 'How should we know a {visit} is finished?',
        type: 'select',
        required: true,
        options: [
          'I will text a number when one is done',
          'Mark it completed in my lead list',
          'When the booking time passes',
          'Not sure, recommend something',
        ],
      },
    ],
  },
  {
    // Optional (friction audit P6): exit-intent offers are restricted for attorneys
    // and some clinical services. Leaving it blank and saving finishes the step.
    key: 'exit-offer',
    later: true,
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'Optional: an offer for visitors about to leave',
    description: 'It shows only to people about to close the tab. Tap one to start from it, write your own, or save it blank for no offer.',
    minutes: 1,
    fields: [
      {
        key: 'offer',
        label: 'Your offer',
        type: 'text',
        placeholder: 'Write your own, or leave blank',
        hint: 'Only what your profession’s advertising rules allow. No promised results.',
        max: 120,
        suggestionsByIndustry: EXIT_OFFER_SUGGESTIONS,
      },
    ],
  },

  // ───────────────────────── AxeonCORE: Axeon handles these ─────────────────────────
  {
    key: 'axeonproof',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'AxeonPROOF dashboard',
    description: 'Every call, inquiry and booked {booking}, and where each new {person} came from. Live once the site is.',
  },
  {
    key: 'core-pages',
    kind: 'axeon',
    tier: 'axeoncore',
    title: '5 to 7 pages written to turn visitors into calls',
    description: 'Built around the {pages} you want more of.',
  },
  {
    key: 'tracked-numbers',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Tracked phone numbers with call recording',
    description: 'Shows which pages and listings make your phone ring, and lets you hear what every caller asked for.',
  },
  {
    key: 'missed-call-text',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Missed-call text-back',
    description: 'Anyone who calls and cannot reach you gets a text within 60 seconds, so they do not move on to the next {office}.',
  },
  {
    key: 'instant-callback',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Instant call-back on form leads',
    description: 'When someone fills out your form, your phone rings and connects you to them while they are still on your site.',
  },
  {
    // Key kept from the old "CRM pipeline" item so saved statuses carry over.
    key: 'crm',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Automatic follow-up and one list of every lead',
    description: 'Texts and emails go out the second a lead comes in, in your words. You get a walkthrough before it goes live.',
  },
  {
    key: 'inbox',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'One inbox for texts, emails and website chat',
    description: 'Answer every lead from your phone. Facebook and Instagram messages are coming soon.',
  },
  {
    key: 'ai-chat',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'AI chat and online scheduling',
    description: 'Trained on your services and connected to your calendar, so leads book themselves 24/7.',
  },
  {
    key: 'quote-followup',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Follow-up for {people} who have not booked',
    description: '{People} who asked about a {page} but have not booked get 3 automatic follow-ups, so fewer slip away.',
  },
  {
    key: 'appointment-reminders',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Appointment reminders by text',
    description: 'So fewer people no-show.',
  },
  {
    key: 'past-customers',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'A check-in text to past {people} every quarter',
    description: 'After the win-back texts, {people} who have not been back in a while hear from you once a quarter.',
  },
  {
    key: 'review-requests',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Review requests switched on',
    description: 'A request goes out after every {visit}, so your Google rating keeps climbing.',
  },
  {
    key: 'last-chance-offer',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'Last-chance offer on your site',
    description: 'If you picked an offer, visitors about to leave see it, tied to the {page} they were looking at.',
  },

  // ───────────────────────── AxeonGROWTH: the client's part ─────────────────────────
  {
    key: 'google-ads',
    later: true,
    kind: 'accept',
    tier: 'axeongrowth',
    title: 'Link your Google Ads account',
    description: 'Ads run in your account on your card, with no markup. We just need manager access.',
    minutes: 3,
    steps: [
      'If you do not have a Google Ads account, create one at ads.google.com and skip the setup wizard (choose “Switch to Expert Mode”, then “Create an account without a campaign”).',
      'Text or email us the 10-digit customer ID shown at the top right.',
      'Accept the “manager account request” email from Google when it arrives.',
    ],
    doneLabel: 'I accepted',
  },
  {
    key: 'meta-ads',
    later: true,
    kind: 'accept',
    tier: 'axeongrowth',
    title: 'Accept our Meta Business partner request',
    description: 'Covers Facebook and Instagram ads and your Facebook page.',
    minutes: 2,
    steps: [
      'Make sure your business has a Facebook page. No page? Tell us and we will create one.',
      'Look for a “partner request” notification from Meta Business Suite.',
      'Open it and tap Accept.',
    ],
    doneLabel: 'I accepted',
  },
  {
    key: 'ad-plan',
    later: true,
    callable: true,
    kind: 'confirm',
    tier: 'axeongrowth',
    title: 'Your ad budget and target area',
    description: 'Ad spend is separate from your plan and paid on your own card. $500 a month minimum.',
    minutes: 2,
    fields: [
      {
        key: 'monthlyBudget',
        label: 'Monthly ad budget',
        type: 'select',
        required: true,
        options: ['$500 to $1,000', '$1,000 to $2,000', '$2,000 to $5,000', '$5,000+'],
      },
      {
        key: 'adServices',
        label: '{Pages} to push with ads',
        type: 'textarea',
        required: true,
        placeholder: 'Implant consults and Invisalign',
      },
      {
        key: 'geography',
        label: 'Where should ads show?',
        type: 'text',
        required: true,
        placeholder: 'ZIP codes, cities, or "10 miles around West Des Moines"',
      },
      {
        key: 'bookedOut',
        label: 'How far out are you booked right now?',
        type: 'select',
        required: true,
        options: ['I can take work in a day or two', '1 to 2 weeks out', '3 to 4 weeks out', 'More than a month out'],
        hint: 'So we spend less on ads when you are already busy. We ask again on your monthly call.',
      },
    ],
  },
  {
    key: 'receptionist',
    later: true,
    callable: true,
    kind: 'confirm',
    tier: 'axeongrowth',
    title: 'What your AI receptionist should know',
    description: 'It answers every call 24/7 and books the {booking}. This is its training sheet.',
    minutes: 5,
    fields: [
      {
        key: 'faqs',
        label: 'Questions people always ask, and your answers',
        type: 'textarea',
        required: true,
        placeholder: 'Are you taking new patients? Yes. How soon can I be seen? Usually within a week. Do you have evening hours? Tuesdays until 7.',
      },
      {
        key: 'quotablePricing',
        label: 'Prices it is allowed to quote',
        type: 'textarea',
        required: true,
        placeholder: 'Initial consultation is free. Anything else: book a consultation for a quote.',
      },
      {
        key: 'neverPromise',
        label: 'Things it should never promise',
        type: 'textarea',
        placeholder: 'Diagnoses, treatment results, legal or tax advice, or whether insurance covers something.',
      },
      {
        key: 'escalation',
        label: 'When should it hand off to a human, and to whom?',
        type: 'textarea',
        required: true,
        placeholder: 'Anything urgent or an upset caller: text Sarah at the front desk, 515-555-0199.',
        sensitive: true,
      },
    ],
  },
  {
    key: 'video-shoot',
    later: true,
    callable: true,
    kind: 'confirm',
    tier: 'axeongrowth',
    title: 'Schedule your video shoot',
    description: 'A half-day on site. We will confirm the date by text and send a one-page release to sign beforehand.',
    minutes: 2,
    fields: [
      { key: 'shootLocation', label: 'Shoot location', type: 'text', required: true, placeholder: 'Your office address' },
      {
        key: 'dateWindow',
        label: 'Best weeks and days',
        type: 'text',
        required: true,
        placeholder: 'Any weekday morning in the next 3 weeks except Oct 14',
      },
      { key: 'onCamera', label: 'Who will be on camera?', type: 'text', required: true, placeholder: 'Dr. Lee and the front-desk team' },
    ],
  },
  {
    key: 'strategy-call',
    later: true,
    kind: 'confirm',
    tier: 'axeongrowth',
    title: 'A standing time for your monthly strategy call',
    description: 'Thirty minutes, same time each month.',
    minutes: 1,
    fields: [
      {
        key: 'callTime',
        label: 'Best day and time',
        type: 'text',
        required: true,
        placeholder: 'First Tuesday of the month, 8:30am',
      },
    ],
  },

  // ───────────────────────── AxeonGROWTH: Axeon handles these ─────────────────────────
  {
    key: 'ads-management',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Google and Meta ads run for you',
    description: 'On the {pages} you want more of, in your own ad account, tracked to the booked {booking}.',
  },
  {
    key: 'local-services-ads',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Google Local Services Ads',
    description: 'The pay-per-lead spots at the very top of the search, where Google offers them for your specialty.',
  },
  {
    key: 'ai-receptionist',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'AI phone receptionist',
    description: 'Trained on the answers you gave us. Picks up every call 24/7, answers questions, and books the {booking}.',
  },
  {
    key: 'video-edit',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Your video shoot, edited',
    description: 'A hero film for your site, 3 vertical cuts for social and ads, and a photo set.',
  },
  {
    key: 'social-reels',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Social reels from your footage',
    description: 'We keep cutting short videos from your shoot and post them to Facebook and Instagram for you.',
  },
  {
    key: 'ad-tracking',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Ad reporting in AxeonPROOF',
    description: 'Every ad dollar shown next to the calls and {bookings} it brought in.',
  },
  {
    key: 'monthly-page',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'A new {page} page every month',
    description: 'Starts the month after launch, from your list of {pages}.',
  },
  {
    key: 'review-campaigns',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Full review campaigns',
    description: 'To grow your Google rating faster.',
  },
];

/** Every item a plan includes, in display order. */
export function itemsForTier(tier: OnboardingTier, metaLive: boolean = process.env.META_PORTAL_LIVE === '1'): OnboardingItem[] {
  const rank = TIER_RANK[tier];
  return ONBOARDING_ITEMS.filter(
    (item) => (item.onlyFor ? item.onlyFor.includes(tier) : TIER_RANK[item.tier] <= rank) && (item.connect !== 'meta' || metaLive)
  );
}

/** Fills the copy tokens ({people}, {Pages}...) with the client's words (data/industryWords.ts). Options are never filled. */
export function itemForIndustry(item: OnboardingItem, industry: Industry | string | null | undefined): OnboardingItem {
  const w = wordsFor(industry);
  const f = (t: string) => fillWords(t, w);
  return {
    ...item,
    title: f(item.title),
    description: f(item.description),
    ...(item.steps ? { steps: item.steps.map(f) } : {}),
    ...(item.fields
      ? {
          fields: item.fields.map((field) => ({
            ...field,
            label: f(field.label),
            ...(field.hint ? { hint: f(field.hint) } : {}),
            ...(field.placeholder ? { placeholder: f(field.placeholder) } : {}),
            ...(field.optionHints ? { optionHints: Object.fromEntries(Object.entries(field.optionHints).map(([k, v]) => [k, f(v)])) } : {}),
            ...(field.suggestionsByIndustry ? { suggestions: field.suggestionsByIndustry[isIndustry(industry) ? industry : 'other'] } : {}),
          })),
        }
      : {}),
  };
}

export function getItem(key: string): OnboardingItem | undefined {
  return ONBOARDING_ITEMS.find((item) => item.key === key);
}

export function isOnboardingTier(value: unknown): value is OnboardingTier {
  return typeof value === 'string' && (ONBOARDING_TIERS as readonly string[]).includes(value);
}

/**
 * Minutes of the client's own work on a plan, from each item's `minutes` (1 when
 * unset). `firstRound` is what we ask for before the build starts; `later` waits
 * until we are closer to launch. Connect items (Facebook) are optional and left out.
 * This is the only setup-time promise: welcome email, portal counter, after-checkout
 * page and sign page all quote it.
 */
export function setupMinutes(tier: OnboardingTier, metaLive?: boolean): { firstRound: number; later: number; total: number } {
  let firstRound = 0;
  let later = 0;
  for (const item of itemsForTier(tier, metaLive)) {
    if (item.kind === 'axeon' || item.connect) continue;
    if (item.later) later += item.minutes ?? 1;
    else firstRound += item.minutes ?? 1;
  }
  return { firstRound, later, total: firstRound + later };
}
