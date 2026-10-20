// Content for the layers on /marketing-solutions ("How it works"). Each layer
// links to the service pages that go deeper (copy in data/servicePages.ts).
//
// Every claim stays inside the offer as written in content/brand-guardrails.md:
// AxeonCORE from $799/mo, AxeonGROWTH from $1,999/mo plus ad spend. No invented
// results, no stats, no promised number of patients, clients or rankings.

export interface SolutionLayer {
  /** Anchor id on /marketing-solutions; matches data/marketingSolutionsData.ts. */
  id: string;
  /** "Layer 1" etc. */
  step: string;
  title: string;
  /** The result, in one line. */
  promise: string;
  /** What goes wrong at most practices today. */
  problem: string;
  /** What we install. */
  includes: string[];
  /** Optional trust note shown under the list. */
  note?: string;
  /** Service pages that cover this layer in depth. */
  links: { label: string; href: string }[];
}

export const coreLayers: SolutionLayer[] = [
  {
    id: 'website',
    step: 'Layer 1',
    title: 'Practice or firm website',
    promise: 'The site a new patient or client checks before they call.',
    problem:
      'Many practice sites were built years ago. They are slow on a phone, bury the providers, and end in a contact form that emails a shared inbox.',
    includes: [
      'Custom, mobile-first design for your practice',
      'Providers and credentials, services, and real reviews up front',
      'Online consultation booking on every page',
      'Set up for Google search, Maps and AI answers',
      'Hosting, security and monitoring included',
      'Up to 2 hours of content updates every month',
    ],
    links: [{ label: 'Websites', href: '/marketing-solutions/website' }],
  },
  {
    id: 'intake',
    step: 'Layer 2',
    title: '60-second intake & booking',
    promise: 'Every missed call and web inquiry gets a reply within 60 seconds, 24/7.',
    problem:
      'Calls after hours or during a busy morning go to voicemail. Forms wait until tomorrow. The new patient or client books with whoever answered first.',
    includes: [
      '24/7 missed-call text-back',
      'First reply to every web inquiry within 60 seconds',
      'Online consultation booking',
      'A two-way text inbox for your front desk or intake team',
      'Call tracking, so you see which calls came from where',
    ],
    note: 'Intake collects name, contact, service and preferred time only. Never symptoms, insurance or health details.',
    links: [
      { label: 'Lead generation & intake', href: '/marketing-solutions/lead-generation' },
      { label: 'AI chat & online booking', href: '/marketing-solutions/ai-chat-scheduling' },
    ],
  },
  {
    id: 'reviews',
    step: 'Layer 3',
    title: 'Review engine',
    promise: 'Every completed appointment gets a review request.',
    problem:
      'Happy patients and clients rarely leave a review on their own, so a great practice can look quiet on Google next to a busier-looking one.',
    includes: [
      'An automatic review request after every completed appointment',
      'Sent by text, so it arrives while the visit is still fresh',
      'One tap to your Google review page',
    ],
    links: [{ label: 'Local SEO', href: '/marketing-solutions/seo' }],
  },
];

export const growthLayer = {
  id: 'growth',
  title: 'The acquisition layer',
  plan: 'AxeonGROWTH',
  price: 'From $1,999/mo plus ad spend ($500/mo minimum, paid to Google directly)',
  intro:
    'Everything in AxeonCORE, plus the work that brings more new patients and clients into the system in the first place.',
  includes: [
    'Google Local Services Ads and search ads management',
    'A quarterly reactivation campaign to past patients and clients',
    'An AI phone receptionist',
    'Multi-provider calendars and intake routing',
    'Quarterly photo and video: review videos and reels',
    'A monthly strategy call and a quarterly business review',
    'Priority support',
  ],
  links: [
    { label: 'Google Ads & Local Services Ads', href: '/marketing-solutions/advertising' },
    { label: 'AI phone receptionist', href: '/marketing-solutions/ai-chat-scheduling' },
    { label: 'Photo & video', href: '/marketing-solutions/video-photography' },
  ],
};
