import { FOUND_OPTIONS } from '@/lib/feedbackShared';
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

export const ONBOARDING_TIERS = ['essentials', 'axeoncore', 'axeongrowth'] as const;
export type OnboardingTier = (typeof ONBOARDING_TIERS)[number];

export const TIER_LABELS: Record<OnboardingTier, string> = {
  essentials: 'Essentials',
  axeoncore: 'AxeonCORE',
  axeongrowth: 'AxeonGROWTH',
};

/** Higher tiers include every item from the tiers below them. */
export const TIER_RANK: Record<OnboardingTier, number> = { essentials: 0, axeoncore: 1, axeongrowth: 2 };

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
  /** Which onboarding column prefills this field. */
  prefill?: 'businessName' | 'clientName' | 'clientEmail' | 'phone';
  /** Shown masked (last 4) once saved, since links get forwarded. */
  sensitive?: boolean;
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
}

const SERVICES_HINT = 'The ones you want more of, most important first.';

export const ONBOARDING_ITEMS: readonly OnboardingItem[] = [
  // ───────────────────────── Essentials: the client's part ─────────────────────────
  {
    key: 'business-basics',
    kind: 'confirm',
    tier: 'essentials',
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
        hint: 'The number customers should call.',
        sensitive: true,
      },
      {
        key: 'address',
        label: 'Address or service area',
        type: 'text',
        required: true,
        placeholder: '123 Main St, Des Moines, IA or "Des Moines metro, 25 miles"',
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
    kind: 'confirm',
    tier: 'essentials',
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
      { key: 'referredBy', label: 'Who sent you? (name or business)', type: 'text', placeholder: 'Mike at A-1 Auto Detailing', hint: 'Only if someone referred you.' },
    ],
  },
  {
    key: 'services',
    kind: 'confirm',
    tier: 'essentials',
    title: 'The services you want more of',
    description: 'We build the pages and the Google work around these.',
    minutes: 1,
    fields: [
      {
        key: 'services',
        label: 'Services, most important first',
        type: 'textarea',
        required: true,
        placeholder: 'Full interior detail, ceramic coating, paint correction',
        hint: SERVICES_HINT,
      },
      {
        key: 'priceRange',
        label: 'Typical price range (optional)',
        type: 'text',
        placeholder: '$150 to $600 per job',
        hint: 'Helps us write pages that attract the right customers.',
      },
    ],
  },
  {
    key: 'logo',
    kind: 'confirm',
    tier: 'essentials',
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
    tier: 'essentials',
    title: 'Send 5 to 10 photos of real work',
    description: 'Straight from your phone is perfect. Real photos outperform stock every time.',
    minutes: 3,
    steps: [
      'Open your camera roll and pick 5 to 10 of your best jobs.',
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
      { key: 'domainName', label: 'Domain (if you have one)', type: 'text', placeholder: 'a1autodetailing.com' },
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
    description: 'Every quote request lands here the second it comes in.',
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

  // ───────────────────────── Essentials: Axeon handles these ─────────────────────────
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
    tier: 'essentials',
    title: 'Hosting and security',
    description: 'Fast hosting, SSL, backups, and monitoring.',
  },
  {
    key: 'quote-form',
    kind: 'axeon',
    tier: 'essentials',
    title: 'Quote request form with instant alerts',
    description: 'Wired to the number and email you gave us above.',
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
    key: 'phone-setup',
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'Phone setup for call tracking and missed-call text-back',
    description: 'Call tracking shows which pages make your phone ring. Missed-call text-back catches the ones you cannot answer.',
    minutes: 2,
    fields: [
      {
        key: 'mainNumber',
        label: 'Your main business number',
        type: 'tel',
        required: true,
        placeholder: '(515) 555-0134',
        sensitive: true,
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
        placeholder: 'Mike (owner) 515-555-0134, Sarah (office) 515-555-0199',
        hint: 'Names and mobiles. Speed-to-lead rings these people.',
        sensitive: true,
      },
    ],
  },
  {
    key: 'calendar',
    kind: 'accept',
    tier: 'axeoncore',
    title: 'Share your calendar for online booking',
    description: 'Leads book themselves 24/7 without double-booking you.',
    minutes: 2,
    steps: [
      'Look for a calendar sharing invite from Axeon Studio in your email.',
      'Accept it. Google Calendar, Outlook, and Apple Calendar all work.',
      'Reply to that email with the services people can book and how long each takes.',
    ],
    doneLabel: 'Shared it',
  },
  {
    key: 'sales-process',
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
        placeholder: 'I call back when I get a break, usually within a few hours. If they do not pick up I text once.',
      },
      {
        key: 'pitch',
        label: 'What do you usually say that gets people to book?',
        type: 'textarea',
        required: true,
        placeholder: 'We come to you, we are insured, and we fix what the last guy missed.',
      },
      {
        key: 'dealKillers',
        label: 'What makes a lead a bad fit?',
        type: 'textarea',
        placeholder: 'Anyone outside 30 miles, or looking for the cheapest possible price.',
      },
    ],
  },
  {
    key: 'reviews',
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'Review requests after every job',
    description: 'We generate your Google review link ourselves. We just need to know when a job is done so the request fires.',
    minutes: 1,
    fields: [
      {
        key: 'jobDoneSignal',
        label: 'How should we know a job is finished?',
        type: 'select',
        required: true,
        options: [
          'I will text a number when I finish a job',
          'Mark it done in the CRM pipeline',
          'When the booking time passes',
          'Not sure, recommend something',
        ],
      },
    ],
  },
  {
    key: 'exit-offer',
    kind: 'confirm',
    tier: 'axeoncore',
    title: 'One offer for visitors about to leave',
    description: 'Something you are happy to honor. It only shows to people about to close the tab.',
    minutes: 1,
    fields: [
      {
        key: 'offer',
        label: 'The offer',
        type: 'text',
        required: true,
        placeholder: '$25 off your first detail',
      },
    ],
  },

  // ───────────────────────── AxeonCORE: Axeon handles these ─────────────────────────
  {
    key: 'axeonproof',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'AxeonPROOF dashboard',
    description: 'Every call, lead, and booked job, and where each came from. Live once the site is.',
  },
  {
    key: 'crm',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'CRM pipeline and automated follow-up',
    description: 'Built from your answers above. You will get a walkthrough before it goes live.',
  },
  {
    key: 'ai-chat',
    kind: 'axeon',
    tier: 'axeoncore',
    title: 'AI chat and online scheduling',
    description: 'Trained on your services and connected to your calendar.',
  },

  // ───────────────────────── AxeonGROWTH: the client's part ─────────────────────────
  {
    key: 'google-ads',
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
        label: 'Services to push with ads',
        type: 'textarea',
        required: true,
        placeholder: 'Ceramic coating and full interior details',
      },
      {
        key: 'geography',
        label: 'Where should ads show?',
        type: 'text',
        required: true,
        placeholder: 'ZIP codes, cities, or "25 miles around Pleasant Hill"',
      },
    ],
  },
  {
    key: 'receptionist',
    kind: 'confirm',
    tier: 'axeongrowth',
    title: 'What your AI receptionist should know',
    description: 'It answers every call 24/7 and books the job. This is its training sheet.',
    minutes: 5,
    fields: [
      {
        key: 'faqs',
        label: 'Questions people always ask, and your answers',
        type: 'textarea',
        required: true,
        placeholder: 'Do you come to me? Yes, anywhere in the metro. How long does it take? 2 to 4 hours.',
      },
      {
        key: 'quotablePricing',
        label: 'Prices it is allowed to quote',
        type: 'textarea',
        required: true,
        placeholder: 'Interior detail from $150, full detail from $275. Ceramic coating: book an estimate.',
      },
      {
        key: 'neverPromise',
        label: 'Things it should never promise',
        type: 'textarea',
        placeholder: 'Same-day service, exact prices on paint correction, anything about insurance claims.',
      },
      {
        key: 'escalation',
        label: 'When should it hand off to a human, and to whom?',
        type: 'textarea',
        required: true,
        placeholder: 'Angry customers or anything about a warranty: text Mike at 515-555-0134.',
        sensitive: true,
      },
    ],
  },
  {
    key: 'video-shoot',
    kind: 'confirm',
    tier: 'axeongrowth',
    title: 'Schedule your video shoot',
    description: 'A half-day on site. We will confirm the date by text and send a one-page release to sign beforehand.',
    minutes: 2,
    fields: [
      { key: 'shootLocation', label: 'Shoot location', type: 'text', required: true, placeholder: 'Shop address, or a customer site you can arrange' },
      {
        key: 'dateWindow',
        label: 'Best weeks and days',
        type: 'text',
        required: true,
        placeholder: 'Any weekday morning in the next 3 weeks except Oct 14',
      },
      { key: 'onCamera', label: 'Who will be on camera?', type: 'text', required: true, placeholder: 'Mike and one tech' },
    ],
  },
  {
    key: 'strategy-call',
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
    key: 'ad-tracking',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'Ad conversion tracking',
    description: 'Every ad dollar shown next to the calls and jobs it brought in.',
  },
  {
    key: 'monthly-page',
    kind: 'axeon',
    tier: 'axeongrowth',
    title: 'New service page every month',
    description: 'Starts the month after launch, from your services list.',
  },
];

/** Every item a plan includes, in display order. */
export function itemsForTier(tier: OnboardingTier): OnboardingItem[] {
  const rank = TIER_RANK[tier];
  return ONBOARDING_ITEMS.filter((item) => TIER_RANK[item.tier] <= rank);
}

export function getItem(key: string): OnboardingItem | undefined {
  return ONBOARDING_ITEMS.find((item) => item.key === key);
}

export function isOnboardingTier(value: unknown): value is OnboardingTier {
  return typeof value === 'string' && (ONBOARDING_TIERS as readonly string[]).includes(value);
}
