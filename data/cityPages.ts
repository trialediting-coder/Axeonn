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
      'A custom, mobile-first site with your providers and credentials, services, real reviews and online consultation booking.',
    href: '/marketing-solutions#website',
  },
  {
    step: '60-second intake',
    title: 'Every call and inquiry answered',
    description:
      'Every missed call and web inquiry gets a reply within 60 seconds, 24/7, plus a two-way text inbox for your front desk or intake team.',
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
      'AxeonCORE is from $799/mo on a 12-month agreement: $0 to start, with the $3,000 build waived and nothing due until it is working. Month-to-month is available if you pay the $3,000 upfront. It includes the website, 60-second intake and booking, the review engine and the AxeonPROOF client portal. AxeonGROWTH is from $1,999/mo plus ad spend and adds Google Local Services Ads and search ads management, reactivation of past patients and clients, and an AI phone receptionist.',
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
      'Axeon Studio is based in West Des Moines. We install patient and client intake for local practices and firms: every missed call and web inquiry answered within 60 seconds, consultations booked, and a review request after every visit.',
    localHeading: 'Built in West Des Moines, for practices and firms here.',
    localBody: [
      'Practices and firms in West Des Moines compete with a lot of nearby options for the same searches. Someone comparing three dentists, a med spa consult, an injury lawyer or a CPA before tax season often calls more than one. Whoever answers first, with a clear way to book, tends to get the appointment.',
      'Because we are based here, we can meet at your office, walk through how your front desk or intake team handles calls today, and look at your competition the way new patients and clients do: from the same searches, in the same part of town.',
    ],
    focusPoints: [
      {
        title: 'Answer the calls your front desk or intake team cannot',
        description:
          'After hours, at lunch, or while the team is with patients or clients: every missed call gets a text reply within 60 seconds.',
      },
      {
        title: 'Look like the obvious pick',
        description: 'Your providers, credentials and real reviews up front, with online consultation booking on every page.',
      },
      {
        title: 'Meet in person whenever it helps',
        description: 'Kickoff, training for your front desk or intake team, or a quarterly review. We are local, so it is easy.',
      },
    ],
    featuredNiches: ['dental', 'med-spa', 'law-firms', 'accounting'],
    faq: [
      {
        question: 'Are you actually located in West Des Moines?',
        answer:
          'Yes. Axeon Studio is based in West Des Moines, Iowa 50266. The team that builds your system answers the phone, and we can meet at your office anywhere in the metro.',
      },
      {
        question: 'What happens when someone calls my practice after hours?',
        answer:
          'If nobody picks up, they get a text from your practice or firm within 60 seconds, 24/7, with a way to book a consultation. Your front desk or intake team sees the whole conversation in the morning in a two-way text inbox.',
      },
      {
        question: 'Do you work with only one practice or firm of each kind?',
        answer:
          'Yes. One practice per specialty within 5 miles, while your account is in good standing. We will not install the same system for the dental office, med spa, law firm or CPA firm down the street.',
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
      'Every new Ankeny neighborhood is full of people who have not picked a dentist, a med spa, a lawyer or a CPA yet. We make sure that when they call or send a form, your practice or firm answers within 60 seconds and gets the consultation on the calendar.',
    localHeading: 'New neighbors are choosing their dentist, med spa, lawyer and CPA right now.',
    localBody: [
      'Ankeny is one of the fastest-growing cities in Iowa. When people move into a new home, they do not have a family dentist, a med spa, an attorney or an accountant yet. They search, skim a few reviews, and call whoever looks trustworthy and easy to book.',
      'That window is short. A family that calls at 6:30 PM and reaches voicemail will try the next name on the map. The practices and firms that answer fast and look established win those first visits.',
    ],
    focusPoints: [
      {
        title: 'Get found by people who just moved in',
        description:
          'A website and Google Business Profile set up for Ankeny searches, with your providers and reviews up front.',
      },
      {
        title: 'Answer while your team is with patients and clients',
        description: 'Missed calls get a text back within 60 seconds, so a full schedule never means a missed new patient or client.',
      },
      {
        title: 'Build reviews with every visit',
        description: 'An automatic review request after every completed appointment, so your rating keeps up with your growth.',
      },
    ],
    featuredNiches: ['dental', 'accounting', 'med-spa', 'law-firms'],
    faq: [
      {
        question: 'Do you work with practices and firms in Ankeny?',
        answer:
          'Yes. Ankeny is part of our home metro, a short drive north of our West Des Moines base. We can meet at your office for kickoff and front-desk training.',
      },
      {
        question: 'We are busy already. Why does after-hours intake matter?',
        answer:
          'Because new patients and clients often reach out when your team is busy or gone for the day. If nobody answers, they try the next office. AxeonCORE replies to every missed call and web inquiry within 60 seconds, so the new ones still get booked.',
      },
      {
        question: 'Does the intake collect any health or financial details?',
        answer:
          'No. Intake collects name, contact, service and preferred time only. Never symptoms, insurance or health details for a dental office or med spa, and never case facts or tax and financial details for a law or CPA firm. Those stay in your own systems.',
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
      'Waukee is growing fast, and new practices and firms open next to ones that have been around for years. You may not have their head start on reviews, but you can answer every call and inquiry within 60 seconds while others send people to voicemail.',
    localHeading: 'New office, established competition.',
    localBody: [
      'Many Waukee practices and firms are new, and many compete with names that have been around for years, in Waukee or just down the road in West Des Moines. The established names usually have more reviews and an older Google listing. That is a real head start.',
      'You close the gap where you can control it: a site that looks like the obvious pick, a reply within 60 seconds to every inquiry, and a review request after every visit.',
    ],
    focusPoints: [
      {
        title: 'Start your Google presence right',
        description:
          'A properly set up Google Business Profile and a fast website from day one, so you are not playing catch-up a year from now.',
      },
      {
        title: 'Win on response time',
        description:
          'Every missed call and web inquiry answered within 60 seconds, 24/7. Speed is something a new practice or firm can win on right away.',
      },
      {
        title: 'Build reviews on purpose',
        description: 'An automatic review request after every completed appointment, so your rating grows with every patient and client.',
      },
    ],
    featuredNiches: ['med-spa', 'dental', 'law-firms', 'accounting'],
    faq: [
      {
        question: 'We just opened in Waukee. Is it too early for this?',
        answer:
          'No, it is a good time. Setting up your website, Google Business Profile and intake correctly from the start is easier than fixing them later, and every early patient or client gets asked for a review.',
      },
      {
        question: 'How do we compete with practices and firms that have far more reviews?',
        answer:
          'You will not out-review them overnight, so you win elsewhere: a faster, clearer site and a reply within 60 seconds to every call and inquiry. Automatic review requests then help your rating grow after every visit.',
      },
      {
        question: 'Do you serve Waukee in person?',
        answer:
          'Yes. Waukee is next door to our West Des Moines base. We can meet at your office for kickoff and front-desk training.',
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
      'Urbandale has many established practices and firms with loyal patients and clients, and websites and phone setups that have not kept up. We rebuild the site and install intake so new people who find you today get answered within 60 seconds.',
    localHeading: 'Great reputation, outdated front door.',
    localBody: [
      'Many established practices and firms run on referrals and a website built a long time ago. The phone still goes to voicemail at 5 PM, and the contact form still emails a shared inbox.',
      'Referrals still matter, but even a referral looks you up before calling. If your site is slow on a phone or the call goes unanswered, they call someone who looks easier to reach.',
    ],
    focusPoints: [
      {
        title: 'A rebuild that keeps what is working',
        description:
          'We move your existing pages over carefully and redirect your old links, so you keep the search visibility you have already earned.',
      },
      {
        title: 'Answer every new inquiry',
        description: 'Missed calls and web inquiries get a reply within 60 seconds, 24/7, with online consultation booking.',
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
          'Because most referrals still look you up and call first. A site that works well on a phone, and a reply within 60 seconds when nobody can pick up, make sure that referral turns into a booked exam, consult or client meeting.',
      },
      {
        question: 'Will a new site hurt the search visibility we already have?',
        answer:
          'Not if it is done carefully. We move your content over and redirect every old URL to its new page, so links and bookmarks keep working.',
      },
      {
        question: 'Do you work with practices and firms in Urbandale?',
        answer:
          'Yes. Urbandale is a short drive from our West Des Moines base, and we can meet at your office anywhere in the metro.',
      },
    ],
  },
];

export const cityPageBySlug = (slug: string) => cityPages.find((c) => c.slug === slug);
