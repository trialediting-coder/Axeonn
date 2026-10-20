// Copy for the six service pages under /marketing-solutions. Layout lives in
// components/marketing-solutions/SolutionSections.tsx (ServicePageView).
//
// Rules (content/brand-guardrails.md): result-first headlines, written for
// dental practices, med spas, law firms and accounting/CPA firms. Prices are
// only "From $799/mo" (AxeonCORE), "From $1,999/mo" (AxeonGROWTH) and the
// published add-ons. No invented clients, results or stats; the only numbers
// are the two sourced studies already used on the site. Never promise a number
// of patients, clients, revenue or rankings, and never promise the Google
// Local Services Ads badge.

import type { FaqItem } from '@/data/faqData';

export type PracticeVertical = 'dental' | 'med-spa' | 'law-firms' | 'accounting';

export interface SourcedStat {
  figure: string;
  text: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface ServiceStep {
  title: string;
  body: string;
}

export interface IncludedGroup {
  /** e.g. "In AxeonCORE" */
  label: string;
  items: string[];
}

export interface VerticalExample {
  vertical: PracticeVertical;
  name: string;
  /** One sentence: what this looks like at that kind of practice. */
  scenario: string;
  points: string[];
}

export interface BuyOption {
  plan: string;
  price: string;
  detail: string;
}

export interface ServicePage {
  slug: string;
  path: string;
  /** Breadcrumb + schema name. */
  name: string;
  serviceType: string;
  metaTitle: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    priceLine: string;
    note: string;
  };
  /** Answer-first block under the hero: the page's main question, max ~35 words, not a repeat of the hero. */
  quickAnswer: { question: string; answer: string };
  /** Optional local page link under the quick answer (Semrush local cluster, 2026-10-20). */
  localLink?: { label: string; href: string };
  stat?: SourcedStat;
  how: { heading: string; intro: string; steps: ServiceStep[] };
  included: { heading: string; intro?: string; groups: IncludedGroup[] };
  examples: { heading: string; intro: string; items: VerticalExample[] };
  buying: { heading: string; intro?: string; options: BuyOption[] };
  /** Show the 90-day performance commitment next to "how it's bought". */
  showCommitment: boolean;
  /** Trust note shown under "what's included". */
  note?: string;
  faqHeading: string;
  faqs: FaqItem[];
  trackId: string;
}

const VERTICAL_NAMES: Record<PracticeVertical, string> = {
  dental: 'Dental practices',
  'med-spa': 'Med spas',
  'law-firms': 'Law firms',
  accounting: 'Accounting & CPA firms',
};

const ex = (vertical: PracticeVertical, scenario: string, points: string[]): VerticalExample => ({
  vertical,
  name: VERTICAL_NAMES[vertical],
  scenario,
  points,
});

const INTAKE_NOTE =
  'Intake collects name, contact, service and time only. Never health, case or tax details.';

const SPEED_STAT: SourcedStat = {
  figure: '21×',
  text: 'more likely to qualify when called back in 5 minutes, not 30.',
  sourceLabel: 'MIT / InsideSales lead response study',
  sourceUrl: 'https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf',
};

const REVIEWS_STAT: SourcedStat = {
  figure: '97%',
  text: 'of people read reviews before choosing a local business.',
  sourceLabel: 'BrightLocal Local Consumer Review Survey 2026',
  sourceUrl: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
};

const CORE_PRICE = 'AxeonCORE · From $799/mo';
const CORE_NOTE = "$0 to start. Nothing due until it's working.";

export const websitePage: ServicePage = {
  slug: 'website',
  localLink: { label: 'Des Moines web design', href: '/des-moines-web-design' },
  path: '/marketing-solutions/website',
  name: 'Website Design for Practices and Firms',
  serviceType: 'Website Design for Dental Practices, Med Spas, Law Firms and CPA Firms',
  metaTitle: 'Dental, Med Spa, Law & CPA Website Design | Axeon Studio',
  metaDescription:
    'Website design for dental practices, med spas, law firms and CPA firms in Des Moines and Iowa: mobile-first, with providers, reviews and online booking.',
  quickAnswer: {
    question: 'What is an Axeon website?',
    answer:
      'A custom, mobile-first website for your practice or firm, built and kept current by Axeon Studio in West Des Moines. It comes with AxeonCORE and is not sold on its own.',
  },
  hero: {
    eyebrow: 'Services · Websites',
    title: 'A website that books consultations, not just visits',
    subtitle:
      'Custom, mobile-first, built around your people, with booking on every page.',
    priceLine: `Included in ${CORE_PRICE}`,
    note: CORE_NOTE,
  },
  how: {
    heading: 'From first call to a site that books',
    intro: 'You send the materials. We write, design, build and run it.',
    steps: [
      {
        title: 'Start with your area',
        body: 'We confirm your area is open, then look at your current site, how fast it answers an inquiry, and how you compare with the top 3 practices or firms near you.',
      },
      {
        title: 'We write and design',
        body: 'Pages for each service and provider, written for the people who call you. You approve every word before launch.',
      },
      {
        title: 'Live in 30 days',
        body: 'Live within 30 days of getting your materials, with booking and the 60-second reply switched on from day one.',
      },
      {
        title: 'Kept current',
        body: 'Up to 2 hours of content updates every month: new providers, new services, holiday hours.',
      },
    ],
  },
  included: {
    heading: 'What’s included',
    groups: [
      {
        label: 'In AxeonCORE',
        items: [
          'Custom, mobile-first design for your practice or firm',
          'Provider, attorney or advisor pages with credentials, and real reviews up front',
          'A page for each core service you want more of',
          'Online consultation booking on every page',
          'A first reply to every form within 60 seconds, 24/7',
          'Set up for Google search, Maps and AI answers',
          'Call tracking, so you see which calls the site produced',
          'Hosting, security and monitoring',
          'Up to 2 hours of content updates every month',
        ],
      },
    ],
  },
  examples: {
    heading: 'What it looks like at your practice or firm',
    intro: 'Same system, written for the people who call you.',
    items: [
      ex('dental', 'A new patient comparing three offices on their phone during lunch.', [
        'New-patient, emergency and implant or cosmetic pages, each with a booking button',
        'Dentist and hygienist bios with credentials',
        'Insurance and payment information as plain text, never a form that asks for it',
      ]),
      ex('med-spa', 'Someone who saw you on Instagram and wants to know who does the injecting.', [
        'Treatment pages for injectables, laser and skin, each ending in a consultation booking',
        'Provider credentials and medical oversight stated plainly',
        'Memberships and packages laid out so the front desk answers fewer pricing calls',
      ]),
      ex('law-firms', 'A potential client reading your site at 9 PM, deciding who to call in the morning.', [
        'Practice-area pages and attorney bios with bar admissions',
        'A consultation request that collects no case facts',
        'Copy written with attorney advertising rules in mind, approved by you',
      ]),
      ex('accounting', 'A business owner looking for a new CPA before tax season.', [
        'Separate paths for individuals and businesses',
        'Advisory and tax-prep consultations booked online',
        'A clear link to the client portal you already use',
      ]),
    ],
  },
  buying: {
    heading: 'How it’s bought',
    options: [
      { plan: 'AxeonCORE', price: 'From $799/mo', detail: 'The website, 60-second intake, booking and review requests together.' },
      { plan: 'AxeonGROWTH', price: 'From $1,999/mo', detail: 'Everything in AxeonCORE plus ads, an AI phone receptionist and quarterly photo and video.' },
    ],
  },
  showCommitment: true,
  note: 'Your domain is always yours. The website design and code become yours once the 12-month term is paid.',
  faqHeading: 'Questions about your website',
  faqs: [
    {
      question: 'Do we own the website?',
      answer:
        'Your domain, Google profile and contact data are always yours. The site becomes yours once the 12-month term is paid.',
    },
    {
      question: 'How long does a new website take?',
      answer:
        'Live within 30 days of getting your materials: logo, provider, attorney or advisor bios and photos, and the services you want to feature. That date is part of the 90-day performance commitment.',
    },
    {
      question: 'Can we add pages later?',
      answer:
        'Yes. Small changes fit in the 2 hours of content updates included each month. A whole new service, location or provider page we price with you.',
    },
    {
      question: 'Do you build websites on their own, without the intake system?',
      answer:
        'No. The site is one part of AxeonCORE, next to the 60-second reply, online booking and review requests. A site that nobody answers behind is the problem we are hired to fix.',
    },
  ],
  trackId: 'service_website',
};

export const seoPage: ServicePage = {
  slug: 'seo',
  localLink: { label: 'Des Moines SEO', href: '/des-moines-seo' },
  path: '/marketing-solutions/seo',
  name: 'Local SEO for Practices and Firms',
  serviceType: 'Local SEO for Dentists, Med Spas, Law Firms and CPA Firms',
  metaTitle: 'SEO for Dentists, Med Spas, Law Firms & CPAs | Axeon Studio',
  metaDescription:
    'Local SEO for dentists, med spas, law firms and CPA firms in Des Moines and Iowa: Google Business Profile upkeep, local service pages and reviews after every appointment.',
  quickAnswer: {
    question: "What does Axeon's local SEO do?",
    answer:
      'Axeon Studio keeps your Google Business Profile, local service pages and structured data current, so your practice or firm gets found on Google Maps and in AI answers across the Des Moines metro.',
  },
  hero: {
    eyebrow: 'Services · Local SEO',
    title: 'Show up on Google Maps when new patients and clients search near you',
    subtitle:
      'Your Google profile kept current, pages built for local search, a review after every appointment.',
    priceLine: `Included in ${CORE_PRICE}`,
    note: CORE_NOTE,
  },
  stat: REVIEWS_STAT,
  how: {
    heading: 'How local search work gets done',
    intro: 'Google’s own guidance for local results comes down to relevance, distance and prominence. We work on the two you control.',
    steps: [
      {
        title: 'Fix the profile',
        body: 'Categories, services, hours, photos and contact details on your Google Business Profile, matched to your website.',
      },
      {
        title: 'Build the pages',
        body: 'One page for each service you want found for, fast on a phone and marked up so search engines and AI answers can read it.',
      },
      {
        title: 'Keep reviews coming',
        body: 'Every completed appointment gets a review request by text, so your reviews stay recent instead of trailing off.',
      },
      {
        title: 'Report it',
        body: 'Calls, bookings and reviews show up in AxeonPROOF, with a monthly report you can read in five minutes.',
      },
    ],
  },
  included: {
    heading: 'What’s included',
    groups: [
      {
        label: 'In AxeonCORE',
        items: [
          'Google Business Profile setup and upkeep',
          'Service pages written for the searches patients and clients make',
          'Fast, mobile-first pages with structured data',
          'Consistent name, phone and hours across your site and profile',
          'Automated review requests after every completed appointment',
          'Call tracking, so you can see calls that came from Google',
          'Monthly report in AxeonPROOF',
        ],
      },
      {
        label: 'Want the top of the page sooner?',
        items: ['Google Local Services Ads and search ads, in AxeonGROWTH'],
      },
    ],
  },
  examples: {
    heading: 'The searches we build for',
    intro: 'Example searches for each kind of practice and firm. Your pages follow the services you actually want more of.',
    items: [
      ex('dental', 'Someone searching “emergency dentist near me” on a Saturday.', [
        'Pages for new patients, emergencies, implants and cosmetic work',
        'Profile services and photos matched to those pages',
        'Recent reviews that mention the visit, not a pile from 2019',
      ]),
      ex('med-spa', 'Someone searching “Botox West Des Moines” after a friend’s recommendation.', [
        'A page per treatment, named the way people search for it',
        'Provider credentials visible on the page and the profile',
        'Before-and-after photos only with signed patient consent',
      ]),
      ex('law-firms', 'Someone searching “estate planning attorney Des Moines” after a family change.', [
        'A page per practice area, written with advertising rules in mind',
        'Attorney bios that connect to each practice area',
        'Review requests sent in a way that fits your bar’s rules',
      ]),
      ex('accounting', 'A business owner searching “small business CPA Ankeny” in January.', [
        'Separate pages for tax prep, bookkeeping and advisory',
        'Tax-season hours kept current on the profile',
        'Reviews from clients who just finished their return',
      ]),
    ],
  },
  buying: {
    heading: 'How it’s bought',
    options: [
      { plan: 'AxeonCORE', price: 'From $799/mo', detail: 'Profile upkeep, service pages, review requests and reporting, together with the website and intake.' },
      { plan: 'AxeonGROWTH', price: 'From $1,999/mo', detail: 'Adds Local Services Ads and search ads for the top of the page.' },
    ],
  },
  showCommitment: true,
  faqHeading: 'Questions about local SEO',
  faqs: [
    {
      question: 'Can you guarantee a spot in the Google map pack?',
      answer:
        'No, and be careful with anyone who does. Google decides rankings. We do the work its guidance rewards and report the results in AxeonPROOF.',
    },
    {
      question: 'Do reviews really affect local search?',
      answer:
        'Google says review count and score factor into local ranking, and people read them before they call. That is why every completed appointment gets a review request automatically.',
    },
    {
      question: 'Who owns our Google Business Profile?',
      answer: 'You do, always. We manage it with access you grant, and it stays yours if you ever leave.',
    },
    {
      question: 'How long until we see results?',
      answer:
        'It depends on your market, so we won’t promise a date. We commit to the work and the 60-second replies.',
    },
  ],
  trackId: 'service_seo',
};

export const leadGenerationPage: ServicePage = {
  slug: 'lead-generation',
  path: '/marketing-solutions/lead-generation',
  name: 'Lead Generation & Intake',
  serviceType: 'Lead Generation and Intake for Dental Practices, Med Spas, Law Firms and CPA Firms',
  metaTitle: 'Lead Gen for Dentists, Med Spas, Law & CPA Firms | Axeon',
  metaDescription:
    'Lead generation and intake for dental practices, med spas, law firms and CPA firms in Des Moines: every call and inquiry answered in 60 seconds, 24/7.',
  quickAnswer: {
    question: 'What is 60-second intake?',
    answer:
      "Axeon Studio's intake system replies to every missed call and web inquiry within 60 seconds, 24/7, and counts each one in AxeonPROOF. It collects no health, case or tax details.",
  },
  hero: {
    eyebrow: 'Services · Lead generation & intake',
    title: 'Every inquiry answered in 60 seconds and booked',
    subtitle:
      'Missed calls get a text back, forms get a reply, all in one inbox.',
    priceLine: `Included in ${CORE_PRICE}`,
    note: CORE_NOTE,
  },
  stat: SPEED_STAT,
  how: {
    heading: 'What happens when someone reaches out',
    intro: 'Most practices and firms don’t need more traffic first. They need every call they already get answered.',
    steps: [
      {
        title: 'Someone calls or writes',
        body: 'A call your team can’t pick up, a form on your site, or a text to your office number.',
      },
      {
        title: 'A reply within 60 seconds',
        body: 'They get a text from your office’s number with a way to book, any hour of the day.',
      },
      {
        title: 'Booked or picked up',
        body: 'They book a consultation online, or your team continues the conversation in the two-way text inbox.',
      },
      {
        title: 'Counted',
        body: 'AxeonPROOF shows every recovered inquiry and booking, and call tracking shows where each call came from.',
      },
    ],
  },
  included: {
    heading: 'What’s included',
    groups: [
      {
        label: 'In AxeonCORE',
        items: [
          '24/7 missed-call text-back',
          'A first reply to every web inquiry within 60 seconds',
          'Online consultation booking',
          'A two-way text inbox for your front desk or intake team',
          'Call tracking by source',
          'A live recovered-inquiry counter in AxeonPROOF',
        ],
      },
      {
        label: 'In AxeonGROWTH',
        items: [
          'A quarterly reactivation campaign to past patients and clients',
          'Google Local Services Ads and search ads',
          'An AI phone receptionist',
          'Multi-provider calendars and intake routing',
        ],
      },
    ],
  },
  examples: {
    heading: 'What it looks like at your practice or firm',
    intro: 'Example moments, one for each kind of practice and firm. The reply is written with you, in your voice, from your number.',
    items: [
      ex('dental', 'A toothache call at 7 PM on a Thursday.', [
        'Text back within 60 seconds with a link to book an emergency exam',
        'Front desk sees the thread first thing in the morning',
        'No questions about symptoms or insurance in the reply',
      ]),
      ex('med-spa', 'A filler question sent through your site at 10 PM.', [
        'A reply with consultation times before they move on to the next spa',
        'Your coordinator picks it up in the text inbox the next day',
        'Past clients due for a touch-up get a reactivation campaign each quarter on AxeonGROWTH',
      ]),
      ex('law-firms', 'A call that comes in while you’re in a hearing.', [
        'A text back confirming the firm got the call and offering a consultation time',
        'No legal advice and no case facts collected',
        'Every call logged, so nobody falls through the cracks',
      ]),
      ex('accounting', 'Calls stacking up in March while the team is buried in returns.', [
        'Every missed call gets a text with a link to book a tax-prep appointment',
        'Your team answers in batches from one inbox',
        'Past clients get a note before the next season on AxeonGROWTH',
      ]),
    ],
  },
  buying: {
    heading: 'How it’s bought',
    options: [
      { plan: 'AxeonCORE', price: 'From $799/mo', detail: 'The 60-second reply, booking, text inbox and call tracking, with the website and review requests.' },
      { plan: 'AxeonGROWTH', price: 'From $1,999/mo', detail: 'Adds ads, a quarterly reactivation campaign and an AI phone receptionist.' },
    ],
  },
  showCommitment: true,
  note: INTAKE_NOTE,
  faqHeading: 'Questions about intake and lead generation',
  faqs: [
    {
      question: 'Will people know it’s automated?',
      answer:
        'The first reply comes from your office’s number, in words you approved. It says what it is and gives them a way to book. Your front desk or intake team takes it from there in the text inbox.',
    },
    {
      question: 'Does this replace our front desk or intake team?',
      answer:
        'No. It covers the moments they can’t pick up: after hours, lunch, a packed morning of check-ins, a day in court, the week before April 15. Your team still handles the conversation.',
    },
    {
      question: 'Do you guarantee a number of new patients, clients or cases?',
      answer:
        'No. We commit to the system: live in 30 days, 60-second replies, a review request after every appointment. Miss it and you can walk away.',
    },
    {
      question: 'Does intake collect health or case details?',
      answer:
        'No. Intake collects name, contact, service and preferred time only. Never symptoms, insurance, health details, case facts or financial records.',
    },
  ],
  trackId: 'service_lead_generation',
};

export const aiChatPage: ServicePage = {
  slug: 'ai-chat-scheduling',
  path: '/marketing-solutions/ai-chat-scheduling',
  name: 'AI Chat & Online Booking',
  serviceType: 'AI Chat and Online Consultation Booking for Practices and Firms',
  metaTitle: 'Med Spa, Dental, Law & CPA Online Booking + AI Chat | Axeon',
  metaDescription:
    'Online booking and AI chat for med spas, dental practices, law firms and CPA firms in Des Moines: questions answered 24/7, consults booked on your calendar.',
  quickAnswer: {
    question: 'How does online booking with Axeon work?',
    answer:
      'Patients and clients pick an open time on your real calendar, from your website or a text reply, any hour. An AI phone receptionist comes with AxeonGROWTH.',
  },
  hero: {
    eyebrow: 'Services · AI chat & booking',
    title: 'Patients and clients book their own consultation, day or night',
    subtitle:
      'A chat that answers from what you approve, then books the consult.',
    priceLine: `Included in ${CORE_PRICE}`,
    note: 'AI phone receptionist on AxeonGROWTH',
  },
  how: {
    heading: 'From question to booked consultation',
    intro: 'Most after-hours visitors have one or two questions before they book. Answer them and offer a time.',
    steps: [
      {
        title: 'They ask',
        body: 'Hours, location, services, what a first consult looks like. The chat answers from information you approved.',
      },
      {
        title: 'It offers a time',
        body: 'Open consultation slots from your calendar, right in the chat or on the booking page.',
      },
      {
        title: 'Booked',
        body: 'The consultation is on the calendar and your team gets the details in the text inbox.',
      },
      {
        title: 'Handed off when it should be',
        body: 'Anything outside the approved answers goes to your team, never a guess.',
      },
    ],
  },
  included: {
    heading: 'What’s included',
    groups: [
      {
        label: 'In AxeonCORE',
        items: [
          'Website chat that answers common questions 24/7',
          'Answers drawn only from information you approve',
          'Online consultation booking',
          'A first reply to every web inquiry within 60 seconds',
          'Hand-off to your team in the two-way text inbox',
        ],
      },
      {
        label: 'In AxeonGROWTH, or as an add-on',
        items: [
          'An AI phone receptionist that answers calls your team can’t get to and books the consultation (AxeonGROWTH)',
          'Multi-provider calendars and intake routing (AxeonGROWTH)',
        ],
      },
    ],
  },
  examples: {
    heading: 'What it looks like at your practice or firm',
    intro: 'Example questions the chat handles, one for each kind of practice and firm.',
    items: [
      ex('dental', '“Are you taking new patients, and do you see kids?”', [
        'Answers from your approved list, then offers new-patient exam times',
        'Never asks about symptoms or insurance details',
        'Routes to the right hygienist or dentist schedule on AxeonGROWTH',
      ]),
      ex('med-spa', '“How long does a lip filler consultation take?”', [
        'Explains what the consultation covers, in your words',
        'Books the consultation, not the treatment, so a provider sees them first',
        'No medical advice, ever',
      ]),
      ex('law-firms', '“Do you handle custody cases in Polk County?”', [
        'Confirms the practice areas you approved and offers a consultation',
        'Collects no case facts and gives no legal advice',
        'A clear note that no attorney-client relationship exists yet',
      ]),
      ex('accounting', '“Can I still get my return done before April 15?”', [
        'Shares your intake cut-off dates and books a tax-prep appointment',
        'Points business owners to an advisory consultation',
        'No documents or Social Security numbers through the chat',
      ]),
    ],
  },
  buying: {
    heading: 'How it’s bought',
    options: [
      { plan: 'AxeonCORE', price: 'From $799/mo', detail: 'Website chat, online booking and the 60-second reply.' },
      { plan: 'AxeonGROWTH', price: 'From $1,999/mo', detail: 'Adds the AI phone receptionist and multi-provider routing.' },
    ],
  },
  showCommitment: true,
  note: INTAKE_NOTE,
  faqHeading: 'Questions about AI chat and booking',
  faqs: [
    {
      question: 'What does the chat answer, and what does it refuse?',
      answer:
        'It answers from information you approve: hours, location, services, what a first consult looks like, how to book. It never gives medical, legal or tax advice. Anything else goes to your team.',
    },
    {
      question: 'Does it connect to our practice-management, EHR or case-management software?',
      answer:
        'No. Consultations book into a calendar we set up for you, and your team is told right away. The chat never sees patient or client records.',
    },
    {
      question: 'What does the AI phone receptionist do?',
      answer:
        'It answers the calls your team can’t get to, takes name, contact and the service they need, and books the consultation. It comes with AxeonGROWTH.',
    },
    {
      question: 'Can we change what it says?',
      answer: 'Yes. Send a change request in AxeonPROOF and we update the approved answers, usually as part of your monthly content updates.',
    },
  ],
  trackId: 'service_ai_chat',
};

export const advertisingPage: ServicePage = {
  slug: 'advertising',
  path: '/marketing-solutions/advertising',
  name: 'Google Ads & Local Services Ads',
  serviceType: 'Google Local Services Ads and Search Ads Management for Practices and Firms',
  metaTitle: 'Local Services Ads for Dentists, Law Firms & CPAs | Axeon',
  metaDescription:
    'Google Local Services Ads and search ads for dental practices, law firms, med spas and CPA firms in Des Moines and Iowa, tracked to the booked consultation.',
  quickAnswer: {
    question: 'What ads does Axeon run for practices and firms?',
    answer:
      'Google Local Services Ads and search ads for practices and firms, managed by Axeon Studio in West Des Moines and tracked from the ad to the booked consultation.',
  },
  hero: {
    eyebrow: 'Services · Advertising',
    title: 'Ads that fill your schedule, tracked to the booked consult',
    subtitle:
      'Local Services and search ads for the work you want more of. Every ad call answered.',
    priceLine: 'AxeonGROWTH · From $1,999/mo + ad spend',
    note: 'or +$750/mo on AxeonCORE',
  },
  how: {
    heading: 'Ads only pay off when someone answers',
    intro: 'Paying for a call that goes to voicemail is the most expensive kind of missed call. So the ads run on top of the intake system.',
    steps: [
      {
        title: 'Pick the services',
        body: 'Implants, injectables, estate planning, tax prep: the work you want more of, in the area you serve.',
      },
      {
        title: 'Check eligibility',
        body: 'Google screens every business for Local Services Ads itself. We check what your practice or firm qualifies for before we launch.',
      },
      {
        title: 'Launch and answer',
        body: 'Every call and inquiry from an ad gets the same 60-second reply and booking link as everything else.',
      },
      {
        title: 'Track to the booking',
        body: 'AxeonPROOF shows ad calls, inquiries and booked consultations, and the monthly strategy call decides what changes.',
      },
    ],
  },
  included: {
    heading: 'What’s included',
    groups: [
      {
        label: 'With AxeonGROWTH',
        items: [
          'Google Local Services Ads setup and management',
          'Google search ads on the services you choose',
          'Ad calls and inquiries answered within 60 seconds',
          'Call tracking from ad to booked consultation',
          'A monthly strategy call and a quarterly business review',
        ],
      },
      {
        label: 'Ad spend',
        items: [
          'Paid to Google directly, on your card and in your account',
          '$500/mo minimum, no markup from us',
        ],
      },
    ],
  },
  examples: {
    heading: 'What it looks like at your practice or firm',
    intro: 'Where ads usually start for each kind of practice and firm. Your plan follows your services and your area.',
    items: [
      ex('dental', 'Local Services Ads for “dentist near me”, plus search ads for implants or emergencies.', [
        'Budget pointed at the procedures you want on the schedule',
        'Every ad call answered or texted back within 60 seconds',
        'Booked new-patient exams counted in AxeonPROOF',
      ]),
      ex('med-spa', 'Search ads for the treatments you want to grow, like injectables or laser.', [
        'Ads that lead to a treatment page with consultation booking',
        'Ad copy that stays within Google’s health-care ad policies',
        'Consultations booked, not just clicks, in your report',
      ]),
      ex('law-firms', 'Local Services Ads for your practice areas, where Google offers them.', [
        'Ads only for the case types you take',
        'Every ad call logged, so intake never loses one',
        'Ad copy written with attorney advertising rules in mind',
      ]),
      ex('accounting', 'Local Services Ads for tax services and search ads before tax season.', [
        'Campaigns timed to when people look for a CPA',
        'Calls answered even when the team is buried in returns',
        'Advisory consultations tracked separately from tax prep',
      ]),
    ],
  },
  buying: {
    heading: 'How it’s bought',
    options: [
      { plan: 'AxeonGROWTH', price: 'From $1,999/mo + ad spend', detail: 'Ads management with everything in AxeonCORE, an AI receptionist, reactivation and quarterly photo and video.' },
      { plan: 'Ads on AxeonCORE', price: '+$750/mo', detail: 'Local Services Ads and search ads management added to AxeonCORE.' },
      { plan: 'Ad spend', price: '$500/mo minimum', detail: 'Paid to Google directly. No markup.' },
    ],
  },
  showCommitment: true,
  note: 'Google decides who gets the Local Services Ads badge after its own screening, so we never promise it.',
  faqHeading: 'Questions about ads',
  faqs: [
    {
      question: 'Who pays for the ad spend?',
      answer:
        'You do, directly to Google, on your own card and in your own account. The minimum is $500/mo. We add no markup. Our fee covers running the ads and the intake behind them.',
    },
    {
      question: 'Can you guarantee a cost per new patient, client or case?',
      answer:
        'No. Results depend on your market and Google. We commit to answering every ad call in 60 seconds and showing what the ads produced.',
    },
    {
      question: 'Will we get the Google Guaranteed or Google Screened badge?',
      answer:
        'Google runs its own screening for Local Services Ads and decides that. We check your eligibility first and handle the setup, but we never promise the badge.',
    },
    {
      question: 'Can we run ads without the intake system?',
      answer:
        'No. Ads are part of AxeonGROWTH or an add-on to AxeonCORE, because an ad call that reaches voicemail is money spent on someone who books somewhere else.',
    },
  ],
  trackId: 'service_advertising',
};

export const videoPhotographyPage: ServicePage = {
  slug: 'video-photography',
  path: '/marketing-solutions/video-photography',
  name: 'Photography & Video for Practices and Firms',
  serviceType: 'Photography and Video for Dental Practices, Med Spas, Law Firms and CPA Firms',
  metaTitle: 'Dental Photography, Law Firm Headshots & Video | Axeon',
  metaDescription:
    'Dental office photography, med spa video and law and CPA firm headshots in Des Moines and Iowa: real photos and short videos of your team for your site and Google.',
  quickAnswer: {
    question: 'What photo and video does Axeon provide?',
    answer:
      'A quarterly on-site shoot for practices and firms around Des Moines: provider portraits, office photos, review videos and short reels, placed on your website and Google profile.',
  },
  hero: {
    eyebrow: 'Services · Photo & video',
    title: 'Photos and video that make patients and clients choose you',
    subtitle:
      'Real photos and short videos of your people, so new patients and clients see who they will meet.',
    priceLine: 'Quarterly in AxeonGROWTH · From $1,999/mo',
    note: 'or a single on-site shoot for $1,500',
  },
  how: {
    heading: 'How a shoot works',
    intro: 'Planned around your schedule, not the other way around.',
    steps: [
      {
        title: 'Plan the shot list',
        body: 'Providers, team, rooms and the services you want to feature, matched to the pages that need them.',
      },
      {
        title: 'Shoot on site',
        body: 'At your office, scheduled around patient or client hours.',
      },
      {
        title: 'Edit',
        body: 'Portraits, office photos, short reels and review videos, cut for the website, Google and social.',
      },
      {
        title: 'Put it to work',
        body: 'We place it on your site and Google Business Profile, so the work shows up where people decide.',
      },
    ],
  },
  included: {
    heading: 'What’s included',
    groups: [
      {
        label: 'Each quarter in AxeonGROWTH',
        items: [
          'Provider portraits and team photos',
          'Office, reception, treatment and meeting-room photos',
          'Review videos with patients or clients who agree to take part',
          'Short reels for social and your Google profile',
          'Placed on your website and Google Business Profile',
        ],
      },
    ],
  },
  examples: {
    heading: 'What it looks like at your practice or firm',
    intro: 'Example shots, one for each kind of practice and firm.',
    items: [
      ex('dental', 'A nervous patient deciding whether your office feels calm.', [
        'Dentists and hygienists, not stock models in scrubs',
        'Rooms and equipment, with no screens or charts in frame',
        'Before-and-after photos only with signed patient consent',
      ]),
      ex('med-spa', 'Someone choosing between two spas with similar prices.', [
        'Providers at work and the treatment rooms people will sit in',
        'Short reels explaining a treatment in your provider’s words',
        'Client videos only with written consent',
      ]),
      ex('law-firms', 'Someone who wants to see the attorney before they call.', [
        'Attorney headshots and a short intro video per practice area',
        'Office photos that show where a consultation happens',
        'Nothing that implies an outcome, in line with advertising rules',
      ]),
      ex('accounting', 'A business owner who wants to know who will actually do the work.', [
        'CPAs and staff photographed at the firm',
        'A short video on how you work with business clients',
        'No client documents or screens in any shot',
      ]),
    ],
  },
  buying: {
    heading: 'How it’s bought',
    options: [
      { plan: 'AxeonGROWTH', price: 'From $1,999/mo', detail: 'Photo and video every quarter, with ads, reactivation and an AI phone receptionist.' },
      { plan: 'On-site shoot on AxeonCORE', price: '$1,500', detail: 'One on-site photo and video shoot, edited and placed on your site.' },
    ],
  },
  showCommitment: false,
  note: 'Patients and clients appear only with their written consent, and no patient or client records, charts or screens are ever in frame.',
  faqHeading: 'Questions about photo and video',
  faqs: [
    {
      question: 'Why not just use stock photos?',
      answer:
        'People are choosing a person, not a building. Stock photos look like every other practice or firm. Real photos of your providers, attorneys or advisors and your office show who they will actually see.',
    },
    {
      question: 'Do you film patients or clients?',
      answer:
        'Only people who agree in writing. Review videos are optional and always use signed consent. We keep charts, screens and paperwork out of every shot.',
    },
    {
      question: 'How often do you shoot?',
      answer:
        'Every quarter on AxeonGROWTH. On AxeonCORE you can book a single on-site shoot for $1,500 whenever you need new photos.',
    },
    {
      question: 'Where do the photos and videos go?',
      answer:
        'Your website, your Google Business Profile and your social accounts. On AxeonGROWTH they can also be used in your ads.',
    },
  ],
  trackId: 'service_video_photography',
};

export const servicePages: ServicePage[] = [
  websitePage,
  seoPage,
  leadGenerationPage,
  aiChatPage,
  advertisingPage,
  videoPhotographyPage,
];
