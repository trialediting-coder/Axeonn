export interface PricingTier {
  id: string;
  name: string;
  focus: string;
  price: string;
  billingNote: string;
  /** Starting monthly plan after launch; the final amount is set per client. */
  monthly: string;
  /** What the monthly plan keeps doing for the client. */
  monthlyNote: string;
  turnaround: string;
  /** Short badge rendered above the card (e.g. "Recommended"). */
  badge?: string;
  /** Rendered as a lead-in above the feature list ("Everything in X, plus:"). */
  inherits?: string;
  features: string[];
  /** One-line "right for you if…" so the chooser question is answered on the card. */
  bestFor?: string;
  /** Feature strings that get the highlighted "headline" treatment in the card. */
  highlightFeatures?: string[];
  cta: string;
  /** The tier most buyers should land on — gets the primary visual treatment. */
  featured?: boolean;
}

export interface AddOn {
  name: string;
  price: string;
}

// Two plans, each a one-time setup plus a monthly plan that starts after launch.
// The monthly amounts are STARTING prices (owner, 2026-10-03): $284 and $574,
// adjusted up or down per client on the call. Keep in sync with
// content/brand-guardrails.md, lib/billing.ts PLANS and priceRange in lib/seo.ts.
export const pricingTiers: PricingTier[] = [
  {
    id: 'core-web-build',
    name: 'Essentials',
    focus: 'Get found by more customers',
    price: '$2,800',
    billingNote: 'One-time setup',
    monthly: 'from $284/mo',
    monthlyNote: 'Hosting, security, Google Business Profile upkeep, local search upkeep, and a monthly calls & leads report.',
    turnaround: 'Our Fastest Launch',
    bestFor: 'Right for you if you mainly need more people to find you. It brings in calls and leads; you handle the follow-up yourself.',
    features: [
      'SEO, AEO & GEO built in — visible on Google and inside AI answers like ChatGPT',
      'Quote request form with instant lead alerts — every request lands in your inbox and on your phone',
      'Up to 4 custom-designed, mobile-first pages built around how your business actually sells',
      'You own 100% of the site, code, and design files',
      'Fast-loading on every phone',
      'See which pages make your phone ring',
      'Built so every customer can use it',
    ],
    cta: 'Get Essentials',
  },
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    focus: 'Get found, chosen, and booked',
    price: '$5,800',
    billingNote: 'One-time setup',
    monthly: 'from $574/mo',
    monthlyNote: 'Everything in Essentials monthly, plus your lead system kept running and improving: CRM pipeline, AI chat, automated follow-up, call tracking, and a monthly strategy call.',
    turnaround: 'Fast Launch',
    badge: 'Recommended',
    featured: true,
    bestFor: 'The plan we recommend: it doesn\'t just bring in leads, it captures, qualifies, and follows up on every one automatically, so more of them turn into paying customers.',
    inherits: 'Everything in Essentials, plus:',
    features: [
      'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
      'Speed-to-lead call connect — when a form comes in, your phone rings and connects you to that lead while they\'re still on your site',
      'Missed-call text-back — anyone who calls and can\'t reach you gets an instant text, so they don\'t move on to the next company',
      'AI chat & online scheduling so leads book themselves 24/7',
      '5–7 pages written to turn visitors into calls',
      'Custom CRM Pipeline built around your lead-to-close workflow — no per-seat monthly software',
      'Multi-step intake questionnaire that pre-qualifies leads before you ever call them',
      'Automated SMS & email follow-up the second a lead comes in',
      'Exit-intent offers — visitors about to leave see an offer matched to the service they were looking at',
      'Call tracking numbers that show which pages and listings actually make your phone ring',
    ],
    highlightFeatures: [
      'Custom on-site videography — a half-day shoot at your location: a hero film for your site, 3 vertical cuts for social & ads, and a photo set',
    ],
    cta: 'Get AxeonCORE',
  },
];

export const addOns: AddOn[] = [
  { name: 'Custom On-Site Videography (add to Essentials)', price: '+$1,500' },
  { name: 'Extra Service Page (rank for another service)', price: '+$450 / page' },
  { name: 'Advanced Database/Directory Integration', price: '+$850' },
  { name: 'Second-Service Landing Page (win a second market)', price: '+$500' },
];

export interface PricingFaq {
  q: string;
  a: string;
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: 'What is the 90-day customer guarantee?',
    a: 'More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do. We set your starting baseline together on the kickoff call and track every call and form from day one, so the comparison is real. The guarantee applies while you\'re on your monthly plan and answering new leads within one business day, because we can bring the customers to you but you have to pick up the phone.',
  },
  {
    q: 'How does the monthly plan work, and what does it cost?',
    a: 'Every plan is a one-time setup and then a monthly plan that starts after launch. Essentials starts at $284/mo and AxeonCORE starts at $574/mo. The final monthly amount depends on your market, how many services and locations we\'re covering, and what you want us to run for you. We set it with you on the call, before you commit to anything.',
  },
  {
    q: 'Which plan should I pick?',
    a: 'Essentials if you mainly need more people to find you and you\'re happy to chase every lead yourself. AxeonCORE if you want the site to do the selling for you: it captures, qualifies, and follows up on leads automatically, and real footage of your team and your work makes you look like the biggest operation in town in a way no template can. It\'s the plan we recommend.',
  },
  {
    q: 'What does the on-site videography actually include?',
    a: 'We come to your location for a half-day shoot — your team, your space, your work. You get a hero film cut for your website, three vertical cuts sized for social and ads, and a photo set for your site and profiles. Everything is shot for the placements it will actually run in, not a single generic video you have to re-purpose yourself.',
  },
  {
    q: 'Can I add videography to Essentials instead?',
    a: 'Yes — it\'s a $1,500 add-on. Worth knowing before you do: at that point AxeonCORE is only $1,500 more and adds the Custom CRM Pipeline, AI chat & scheduling, the pre-qualifying intake, automated follow-up, speed-to-lead call connect, missed-call text-back, exit-intent offers, and call tracking. Most people who want the video end up going AxeonCORE for that reason.',
  },
  {
    q: 'What does the AxeonCORE lead system actually do?',
    a: 'It makes sure a lead never sits waiting. When someone fills out a form, your phone rings and connects you to them while they\'re still on your site. If someone calls and you can\'t pick up, they get a text back right away instead of calling your competitor. Visitors about to leave see an offer tied to the service they were looking at. Every lead lands in your CRM pipeline with automated text and email follow-up, and call tracking shows which pages and listings are making your phone ring.',
  },
  {
    q: 'What happens in the first 90 days?',
    a: 'Before launch we set your baseline together: how many calls and leads you get today. From launch day, every call and form is tracked, and you get a monthly report showing each one and where it came from. If you\'re not ahead of your baseline by day 90, we keep working for free until you are.',
  },
  {
    q: 'What if I need more than what a plan includes?',
    a: 'That\'s what the add-ons above are for: videography, extra service pages, deeper database/directory integrations, and landing pages for a second service can all be added to either plan without re-negotiating the whole engagement.',
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
