// Suburb landing pages (/west-des-moines-web-design, /ankeny-web-design, ...),
// rendered by components/city/CityLanding.tsx. The URLs stay as they are for
// search; since 2026-10-19 the copy speaks to private practices (dental, med
// spa, law, accounting) in each city. Each city gets its own copy, not a name
// swap. Local details are kept general and true: no invented clients, local
// stats or reviews (content/brand-guardrails.md), and no client results.

export interface CityFaq {
  question: string;
  answer: string;
}

export interface CityFocusPoint {
  title: string;
  description: string;
}

export interface CityPage {
  /** URL path segment, e.g. "west-des-moines-web-design". */
  slug: string;
  city: string;
  /** Short label for links between metro pages. */
  linkLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  localHeading: string;
  localBody: string[];
  focusPoints: CityFocusPoint[];
  /** Practice slugs (data/nichesData.ts), in the order this city shows them. */
  featuredNiches: string[];
  faq: CityFaq[];
}

/** The three AxeonCORE layers: shared by /des-moines-web-design and the suburb pages. */
export const METRO_SYSTEM = [
  {
    step: 'Practice or firm website',
    title: 'Providers, services, reviews, booking',
    description:
      'Providers, services, real reviews and online booking, built for phones.',
    href: '/marketing-solutions#website',
  },
  {
    step: '60-second intake',
    title: 'Every call and inquiry answered',
    description:
      'A reply to every missed call and web inquiry in 60 seconds, 24/7.',
    href: '/marketing-solutions#intake',
  },
  {
    step: 'Review engine',
    title: 'A review ask after every visit',
    description: 'An automatic review request after every completed appointment.',
    href: '/marketing-solutions#reviews',
  },
];

/** Published pricing, phrased once for every metro FAQ. */
export function cityPricingFaq(city: string): CityFaq {
  return {
    question: `How much does Axeon cost for a ${city} practice or firm?`,
    answer:
      'AxeonCORE is from $799/mo on a 12-month agreement, with $0 setup (normally $3,000) and nothing due until it is working. AxeonGROWTH, from $1,999/mo plus ad spend, adds ads and an AI receptionist.',
  };
}

export const cityPages: CityPage[] = [
  {
    slug: 'west-des-moines-web-design',
    city: 'West Des Moines',
    linkLabel: 'West Des Moines Practices & Firms',
    title: 'West Des Moines Practice & Firm Intake | Axeon Studio',
    description:
      'Websites and 60-second intake for West Des Moines dental practices, med spas, law firms and CPA firms, from a team based here. From $799/mo, $0 to start.',
    eyebrow: 'West Des Moines, Iowa · Home Base',
    h1: 'Every after-hours call answered, for West Des Moines practices and firms',
    intro:
      'Every missed call and web inquiry answered in 60 seconds, from a team based here.',
    localHeading: 'Built in West Des Moines, for practices and firms here.',
    localBody: [
      'People here call more than one office. Whoever answers first gets the appointment.',
    ],
    focusPoints: [
      {
        title: 'Answer the calls your front desk or intake team cannot',
        description:
          'After hours or mid-appointment, every missed call gets a text in 60 seconds.',
      },
      {
        title: 'Look like the obvious pick',
        description: 'Your people and real reviews up front, with booking on every page.',
      },
      {
        title: 'Meet in person whenever it helps',
        description: 'Kickoff, front-desk training or a quarterly review, at your office.',
      },
    ],
    featuredNiches: ['dental', 'med-spa', 'law-firms', 'accounting'],
    faq: [
      {
        question: 'Are you actually located in West Des Moines?',
        answer:
          'Yes, West Des Moines, Iowa 50266. The team that builds your system answers the phone and meets at your office.',
      },
      {
        question: 'What happens when someone calls my practice after hours?',
        answer:
          'They get a text from your practice within 60 seconds with a way to book. Your team sees the conversation in the morning.',
      },
      {
        question: 'Do you work with only one practice or firm of each kind?',
        answer:
          'Yes. One practice or firm per specialty within 5 miles, while your account is in good standing.',
      },
    ],
  },
  {
    slug: 'ankeny-web-design',
    city: 'Ankeny',
    linkLabel: 'Ankeny Practices & Firms',
    title: 'Ankeny Practice & Firm Intake | Axeon Studio',
    description:
      'Ankeny dental practices, med spas, law firms and CPA firms: every after-hours call and web inquiry answered in 60 seconds and booked. From $799/mo.',
    eyebrow: 'Ankeny, Iowa · North Metro',
    h1: 'Ankeny is growing. Answer every new patient and client first.',
    intro:
      'New neighbors are picking a dentist, lawyer and CPA. Answer them in 60 seconds.',
    localHeading: 'New neighbors are choosing their dentist, med spa, lawyer and CPA right now.',
    localBody: [
      'A family that reaches voicemail at 6:30 PM tries the next name on the map.',
    ],
    focusPoints: [
      {
        title: 'Get found by people who just moved in',
        description:
          'A site and Google profile set up for Ankeny searches.',
      },
      {
        title: 'Answer while your team is with patients and clients',
        description: 'Missed calls get a text back in 60 seconds, even on a full day.',
      },
      {
        title: 'Build reviews with every visit',
        description: 'A review request after every appointment, automatically.',
      },
    ],
    featuredNiches: ['dental', 'accounting', 'med-spa', 'law-firms'],
    faq: [
      {
        question: 'Do you work with practices and firms in Ankeny?',
        answer:
          'Yes. Ankeny is a short drive from our West Des Moines base, and we meet at your office.',
      },
      {
        question: 'We are busy already. Why does after-hours intake matter?',
        answer:
          'New patients and clients often reach out when your team is busy or gone. A 60-second reply keeps them from calling the next office.',
      },
      {
        question: 'Does the intake collect any health or financial details?',
        answer:
          'No. Name, contact, service and preferred time only. Never health, case or financial details.',
      },
    ],
  },
  {
    slug: 'waukee-web-design',
    city: 'Waukee',
    linkLabel: 'Waukee Practices & Firms',
    title: 'Waukee Practice & Firm Intake | Axeon Studio',
    description:
      'For Waukee dental practices, med spas, law firms and CPA firms: a site that books and a reply to every call in 60 seconds, from a team next door.',
    eyebrow: 'Waukee, Iowa · West Metro',
    h1: 'Waukee practices and firms: answer first, even against older names',
    intro:
      'Older names have more reviews. You can still answer every call first.',
    localHeading: 'New office, established competition.',
    localBody: [
      'Close the gap where you control it: a better site, faster replies, steady reviews.',
    ],
    focusPoints: [
      {
        title: 'Start your Google presence right',
        description:
          'A fast site and a proper Google profile from day one.',
      },
      {
        title: 'Win on response time',
        description:
          'Every missed call and inquiry answered in 60 seconds, 24/7.',
      },
      {
        title: 'Build reviews on purpose',
        description: 'A review request after every appointment, automatically.',
      },
    ],
    featuredNiches: ['med-spa', 'dental', 'law-firms', 'accounting'],
    faq: [
      {
        question: 'We just opened in Waukee. Is it too early for this?',
        answer:
          'No. Setting it up right from the start is easier than fixing it later.',
      },
      {
        question: 'How do we compete with practices and firms that have far more reviews?',
        answer:
          'Win on speed and a clearer site first. Automatic review requests close the gap over time.',
      },
      {
        question: 'Do you serve Waukee in person?',
        answer:
          'Yes. Waukee is next door to our West Des Moines base.',
      },
    ],
  },
  {
    slug: 'urbandale-web-design',
    city: 'Urbandale',
    linkLabel: 'Urbandale Practices & Firms',
    title: 'Urbandale Practice & Firm Intake | Axeon Studio',
    description:
      'Urbandale dental practices, med spas, law firms and CPA firms: turn a good reputation into booked consultations, with every inquiry answered in 60 seconds.',
    eyebrow: 'Urbandale, Iowa · Northwest Metro',
    h1: 'Urbandale practices and firms: a great reputation still needs an answer',
    intro:
      'A loyal following and an old website. We fix the second part.',
    localHeading: 'Great reputation, outdated front door.',
    localBody: [
      'Even referrals look you up first. A slow site or voicemail sends them elsewhere.',
    ],
    focusPoints: [
      {
        title: 'A rebuild that keeps what is working',
        description:
          'Old pages moved and redirected, so you keep your search rankings.',
      },
      {
        title: 'Answer every new inquiry',
        description: 'A reply in 60 seconds, 24/7, with online booking.',
      },
      {
        title: 'Turn loyal patients and clients into reviews',
        description: 'An automatic review request after every completed appointment.',
      },
    ],
    featuredNiches: ['accounting', 'law-firms', 'dental', 'med-spa'],
    faq: [
      {
        question: 'Most of our new patients or clients come from referrals. Why change anything?',
        answer:
          'Referrals still look you up and call first. A fast site and a 60-second reply turn them into bookings.',
      },
      {
        question: 'Will a new site hurt the search visibility we already have?',
        answer:
          'No. Every old URL redirects to its new page.',
      },
      {
        question: 'Do you work with practices and firms in Urbandale?',
        answer:
          'Yes. Urbandale is a short drive from our West Des Moines base.',
      },
    ],
  },
];

export const cityPageBySlug = (slug: string) => cityPages.find((c) => c.slug === slug);
