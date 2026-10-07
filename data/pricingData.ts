export type HighlightIcon = 'proof' | 'ads' | 'video' | 'phone';

export interface PricingTier {
  id: string;
  name: string;
  focus: string;
  /** The headline monthly price, e.g. "$299". */
  price: string;
  /** Shown next to the price, e.g. "/mo". */
  billingNote: string;
  /** What it costs to get started, e.g. "$99 to start". */
  startFee: string;
  /** One line under the start fee: what the start fee covers, or the term. */
  startNote: string;
  turnaround: string;
  /** Short badge rendered above the card (e.g. "Recommended"). */
  badge?: string;
  /** Rendered as a lead-in above the feature list ("Everything in X, plus:"). */
  inherits?: string;
  features: string[];
  /** One-line "right for you if…" so the chooser question is answered on the card. */
  bestFor?: string;
  /** Feature strings that get the highlighted "headline" treatment in the card, with their icon. */
  highlightFeatures?: { feature: string; icon: HighlightIcon }[];
  cta: string;
  /**
   * plain = the entry card, featured = the tier we sell (loudest),
   * premium = the top tier (dark, clearly the most expensive).
   */
  variant: 'plain' | 'featured' | 'premium';
}

export interface AddOn {
  name: string;
  price: string;
}

// Three plans (owner, 2026-10-05): local, cheap, easy entry. Essentials is the
// entry tier that still has value, AxeonCORE is the middle and the one we sell,
// AxeonGROWTH is the obviously-more-expensive top tier. CORE and GROWTH include
// AxeonPROOF. Flat monthly prices (no "from"), $99 to start ($1,500 on GROWTH,
// which covers the video shoot), 3-month minimum matched to the 90-day
// guarantee, then month-to-month; a year paid up front gets 2 months free.
// Keep in sync with content/brand-guardrails.md, lib/postValidation.ts,
// data/getStartedPackages.ts and priceRange in lib/seo.ts.
export const MINIMUM_TERM = '3-month minimum, then month-to-month';
export const ANNUAL_DEAL = 'Pay a year up front and get 2 months free.';
export const AD_SPEND_RULE =
  'Ad spend is separate: $500/mo minimum, paid on your own card into your own ad account, with no markup.';

export const pricingTiers: PricingTier[] = [
  {
    id: 'core-web-build',
    name: 'Essentials',
    focus: 'Get found by more customers',
    price: '$149',
    billingNote: '/mo',
    startFee: '$99 to start',
    startNote: MINIMUM_TERM,
    turnaround: 'Our Fastest Launch',
    bestFor: 'Right for you if you mainly need more people to find you. It brings in calls and leads; you handle the follow-up yourself.',
    features: [
      'Up to 4 custom-designed, mobile-first pages built around how your business actually sells',
      'Show up on Google, in the map results, and in AI answers like ChatGPT',
      'Google Business Profile upkeep so you show up in the map results',
      'Quote request form with instant lead alerts — every request lands in your inbox and on your phone',
      'Hosting, security, and 2 small edits a month',
      'A monthly calls & leads report by email',
      'You own 100% of the site, code, and design files',
    ],
    cta: 'Get Essentials',
    variant: 'plain',
  },
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    focus: 'Get found, chosen, and booked',
    price: '$299',
    billingNote: '/mo',
    startFee: '$99 to start',
    startNote: MINIMUM_TERM,
    turnaround: 'Fast Launch',
    badge: 'Recommended',
    bestFor: 'The plan we recommend: it doesn\'t just bring in leads, it captures, follows up on, and tracks every one, so more of them turn into paying customers. Backed by our 90-day guarantee.',
    inherits: 'Everything in Essentials, plus:',
    features: [
      'AxeonPROOF — your live dashboard of every call, lead, and booked job, and where each one came from',
      'The 90-day customer guarantee',
      'Missed-call text-back — anyone who calls and can\'t reach you gets an instant text, so they don\'t move on to the next company',
      'Instant call-back — when someone fills out your form, your phone rings and connects you to them while they\'re still on your site',
      'AI chat & online scheduling so leads book themselves 24/7',
      'Automatic texts and emails the second a lead comes in, plus one simple list of every lead and where it stands',
      'Tracked phone numbers that show which pages and listings actually make your phone ring',
      'Review requests after every job, so your Google rating keeps climbing',
      '5–7 pages written to turn visitors into calls',
      'A last-chance offer — visitors about to leave your site see a deal on the service they were looking at',
      '5 edits a month',
    ],
    highlightFeatures: [
      {
        feature: 'AxeonPROOF — your live dashboard of every call, lead, and booked job, and where each one came from',
        icon: 'proof',
      },
    ],
    cta: 'Get AxeonCORE',
    variant: 'featured',
  },
  {
    id: 'axeongrowth',
    name: 'AxeonGROWTH',
    focus: 'We run your growth for you',
    price: '$999',
    billingNote: '/mo + ad spend',
    startFee: '$1,500 to start',
    startNote: `Covers your on-site video shoot. ${MINIMUM_TERM}.`,
    turnaround: 'Fast Launch',
    bestFor: 'Right for you if you want customers coming in this week, not just this year: we run your ads, answer your phones, and film your business.',
    inherits: 'Everything in AxeonCORE, plus:',
    features: [
      'Google & Meta ads run for you on the services you want more of, tracked to the booked job',
      'Google Local Services Ads — the "Google Guaranteed" spots at the very top of the search, where you pay per lead, not per click (for trades Google offers them to)',
      'AI phone receptionist — picks up every call 24/7, answers questions, and books the job',
      'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
      'AxeonPROOF ad reporting — every ad dollar shown next to the calls and jobs it brought in',
      'A new service page every month, so you keep climbing on Google and in AI answers',
      'Full review campaigns to grow your Google rating faster',
      'A monthly strategy call',
      'Same-day priority support',
    ],
    highlightFeatures: [
      {
        feature: 'Google & Meta ads run for you on the services you want more of, tracked to the booked job',
        icon: 'ads',
      },
      {
        feature: 'AI phone receptionist — picks up every call 24/7, answers questions, and books the job',
        icon: 'phone',
      },
      {
        feature: 'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
        icon: 'video',
      },
    ],
    cta: 'Get AxeonGROWTH',
    variant: 'premium',
  },
];

// Priced so AxeonCORE plus these always costs more than AxeonGROWTH:
// $299 + $399 + $199 + a $450 page every month = $1,347/mo vs $999/mo.
export const addOns: AddOn[] = [
  { name: 'Google & Meta Ads Management (AxeonCORE)', price: '+$399 / mo' },
  { name: 'AI Phone Receptionist', price: '+$199 / mo' },
  { name: 'Extra Service Page (rank for another service)', price: '+$450 / page' },
  { name: 'Custom On-Site Videography', price: '+$1,500' },
];

export interface PricingFaq {
  q: string;
  a: string;
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: 'How does the pricing work?',
    a: 'You pay $99 to start (AxeonGROWTH is $1,500, which covers your on-site video shoot), then a flat monthly price: $149 for Essentials, $299 for AxeonCORE, or $999 for AxeonGROWTH. There\'s a 3-month minimum, which matches our 90-day guarantee. After that it\'s month-to-month. Pay a year up front and you get 2 months free.',
  },
  {
    q: 'What is the 90-day customer guarantee?',
    a: 'More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do. It comes with AxeonCORE and AxeonGROWTH. We set your starting baseline together on the kickoff call and track every call and form from day one in AxeonPROOF, so the comparison is real. The guarantee applies while you\'re on your plan and answering new leads within one business day, because we can bring the customers to you but you have to pick up the phone.',
  },
  {
    q: 'Which plan should I pick?',
    a: 'Essentials if you mainly need more people to find you and you\'re happy to chase every lead yourself. AxeonCORE if you want every lead captured, followed up on, and tracked, with the guarantee behind it. It\'s the plan we recommend. AxeonGROWTH if you want us to run the whole thing: ads, an AI receptionist on your phones, video of your business, and a new page every month.',
  },
  {
    q: 'What is AxeonPROOF?',
    a: 'AxeonPROOF is our own client dashboard, included with AxeonCORE and AxeonGROWTH. It shows every call, form, and booked job as it happens, where each one came from, and how you\'re tracking against your 90-day baseline. On AxeonGROWTH it also shows every ad dollar next to the calls it brought in. No guessing whether your marketing is working.',
  },
  {
    q: 'Do I pay for ads separately on AxeonGROWTH?',
    a: 'Yes. Your ad budget goes straight to Google and Meta, on your own card and in your own ad account, with no markup from us. We ask for at least $500/mo in ad spend, because below that there isn\'t enough data to keep improving your campaigns. The $999/mo is for running them.',
  },
  {
    q: 'Can I add pieces of AxeonGROWTH to AxeonCORE instead?',
    a: 'Yes. Ads management is +$399/mo, the AI phone receptionist is +$199/mo, and extra service pages are $450 each. Worth knowing before you do: AxeonCORE plus ads, the receptionist, and a new page every month comes to $1,347/mo, while AxeonGROWTH includes all of it, plus the video shoot, for $999/mo.',
  },
  {
    q: 'What does the AxeonCORE lead system actually do?',
    a: 'It makes sure a lead never sits waiting. When someone fills out a form, your phone rings and connects you to them while they\'re still on your site. If someone calls and you can\'t pick up, they get a text back right away instead of calling your competitor. Visitors about to leave see an offer tied to the service they were looking at. Every lead lands in one simple list with automatic texts and emails, and tracked phone numbers show which pages and listings are making your phone ring.',
  },
  {
    q: 'What does the on-site videography include?',
    a: 'We come to your location for a half-day shoot — your team, your space, your work. You get a hero film cut for your website, three vertical cuts sized for social and ads, and a photo set for your site and profiles. It\'s included in AxeonGROWTH and is a $1,500 add-on for the other plans.',
  },
  {
    q: 'What happens after the first 3 months?',
    a: 'Your plan keeps running month-to-month, and you can cancel any time. By then you\'ll have 90 days of calls and leads in your monthly reports to judge it by. You own 100% of the site, code, and design files on every plan.',
  },
  {
    q: 'What if I don\'t like the initial design?',
    a: 'Every plan includes 2 rounds of revisions on your new site before launch, at no extra cost. We don\'t consider a project finished until the design is one you\'re proud to put your name on.',
  },
];

/** The guarantee sentence on its own, word for word. Never paraphrase it. */
export const guaranteeSentence =
  'More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do.';

/**
 * How many feature bullets a plan card shows up front; the rest sit behind
 * "See everything included". Order each tier's features strongest-first.
 */
export const FEATURED_BULLETS = 4;

export const customerGuarantee = '90-Day Customer Guarantee: More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do.';
export const revisionGuarantee = '2-Round Revision Guarantee — included with every build';
