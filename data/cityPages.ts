// Suburb landing pages (/west-des-moines-web-design, /ankeny-web-design, ...),
// rendered by components/city/CityLanding.tsx. Each city gets its own copy,
// not a name swap. Local details are kept general and true: no invented client
// counts, local stats or reviews (content/brand-guardrails.md). The only proof
// used is the approved A-1 Auto Detailing result.

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
  /** Niche slugs (data/nichesData.ts) shown first in the industries list. */
  featuredNiches: string[];
  faq: CityFaq[];
}

/** One system, three jobs: shared by /des-moines-web-design and the suburb pages. */
export const METRO_SYSTEM = [
  {
    step: 'Get found',
    title: 'SEO & Ads',
    description:
      'Show up on Google, the map, and AI answers when people across the metro search for what you do. Google & Meta Ads come with AxeonGROWTH, or as a +$399/mo add-on to AxeonCORE.',
    href: '/marketing-solutions/seo',
  },
  {
    step: 'Get chosen',
    title: 'Website & Video',
    description:
      'A fast, custom site with your reviews up front, plus on-site video with AxeonGROWTH, so you look like the obvious pick.',
    href: '/marketing-solutions/website',
  },
  {
    step: 'Get booked',
    title: 'AI Chat & Lead Capture',
    description:
      'Tap-to-call and a quote form on every page. On AxeonCORE, AI chat and automatic follow-up answer every lead in seconds.',
    href: '/marketing-solutions/ai-chat-scheduling',
  },
];

/** Published pricing, phrased once for every metro FAQ. */
export function cityPricingFaq(city: string): CityFaq {
  return {
    question: `How much does a website cost in ${city}?`,
    answer:
      'Our pricing is published: $99 to start, then a flat monthly plan. Essentials is $149/mo. AxeonCORE is $299/mo and adds our AxeonPROOF dashboard, one simple list of every lead, AI chat & online scheduling, automatic follow-up, and our 90-day customer guarantee. AxeonGROWTH is $999/mo plus ad spend and adds Google & Meta ads, Google Local Services Ads, an AI phone receptionist, and a half-day on-site video shoot.',
  };
}

export const cityPages: CityPage[] = [
  {
    slug: 'west-des-moines-web-design',
    city: 'West Des Moines',
    linkLabel: 'West Des Moines Web Design',
    title: 'West Des Moines Web Design & Marketing | Axeon Studio',
    description:
      'West Des Moines web design, local SEO, and ads from a team based right here in 50266. More calls and booked jobs, plans from $149/mo, backed by a 90-day guarantee.',
    eyebrow: 'West Des Moines, Iowa · Home Base',
    h1: 'West Des Moines Web Design That Gets You More Customers',
    intro:
      'Axeon Studio is based in West Des Moines. We get local businesses more customers: found on Google, chosen over the competition, and booked. The team down the road builds it and answers the phone.',
    localHeading: 'Built in West Des Moines, for West Des Moines.',
    localBody: [
      'West Des Moines is not one market. A business near Jordan Creek competes with regional chains and big national names for the same searches, while a shop in Valley Junction is trying to be the local pick people already want to support. Both need to show up when someone nearby searches, and both need a site that makes calling feel easy.',
      'Because we are based here, we can meet at your location, shoot video on-site, and look at your competition the way your customers do: from the same searches, in the same part of town.',
    ],
    focusPoints: [
      {
        title: 'Show up for searches in your part of town',
        description:
          'We set up your Google Business Profile, your service pages, and the behind-the-scenes details of your site so you show up for West Des Moines searches, not just a generic "near me."',
      },
      {
        title: 'Look like the obvious pick next to the chains',
        description:
          'Your reviews, your real work, and a clear next step up front, so you win the comparison against bigger names.',
      },
      {
        title: 'Meet in person whenever it helps',
        description:
          'Strategy calls, a walk-through of your shop, or the on-site video shoot with AxeonGROWTH. We are local, so it is easy.',
      },
    ],
    featuredNiches: ['dental', 'med-spa', 'law-firms', 'accounting', 'real-estate', 'home-remodeling'],
    faq: [
      {
        question: 'Are you actually located in West Des Moines?',
        answer:
          'Yes. Axeon Studio is based in West Des Moines, Iowa 50266. The team that builds your site answers the phone, and we can meet at your location anywhere in the metro.',
      },
      {
        question: 'Can you help my business show up for West Des Moines searches?',
        answer:
          'That is the point of every build. We set up your Google Business Profile, write pages around the services you offer and the areas you serve, and set up your site so Google and AI assistants like ChatGPT can recommend you for local searches.',
      },
      {
        question: 'Do you work with businesses near Jordan Creek and Valley Junction?',
        answer:
          'Yes. We work with businesses all over West Des Moines and the rest of the metro, from offices and shops near Jordan Creek to local spots in Valley Junction.',
      },
    ],
  },
  {
    slug: 'ankeny-web-design',
    city: 'Ankeny',
    linkLabel: 'Ankeny Web Design',
    title: 'Ankeny Web Design & Local SEO | Axeon Studio',
    description:
      'Ankeny web design and local SEO for a fast-growing city: get found by new neighbors first and turn searches into calls. Plans from $149/mo, 90-day guarantee.',
    eyebrow: 'Ankeny, Iowa · North Metro',
    h1: 'Ankeny Web Design That Brings In More Customers',
    intro:
      'Ankeny keeps growing, and every new neighborhood is full of people searching for a dentist, a plumber, or a contractor they have not picked yet. We make sure they find you first and call you, not the next name on the map.',
    localHeading: 'New neighbors are picking their go-to businesses right now.',
    localBody: [
      'Ankeny is one of the fastest-growing cities in Iowa. When people move into a new home, they do not have a dentist, an HVAC company, or a landscaper yet. They search, skim a few reviews, and call whoever looks the most trustworthy and easiest to book.',
      'That window is short, and it is why Ankeny is a strong market for trades and home services. New construction keeps contractors, concrete crews, and landscapers busy, and the businesses that answer fast and look established win the work.',
    ],
    focusPoints: [
      {
        title: 'Get found by people who just moved in',
        description:
          'Local SEO and a Google Business Profile set up for Ankeny searches, so new homeowners find you the first time they look.',
      },
      {
        title: 'Answer while you are on the job',
        description:
          'Tap-to-call and a quote form on every page. On AxeonCORE, missed calls get a text back right away, so a busy crew does not mean a lost job.',
      },
      {
        title: 'Look established from day one',
        description:
          'Your reviews and real project photos up front, so a homeowner who has never heard of you still feels good about calling.',
      },
    ],
    featuredNiches: ['home-remodeling', 'concrete', 'hvac', 'plumbing', 'landscaping', 'dental'],
    faq: [
      {
        question: 'Do you work with businesses in Ankeny?',
        answer:
          'Yes. Ankeny is part of our home metro, a short drive north of our West Des Moines base. We can meet at your location, and the on-site video shoot with AxeonGROWTH happens right at your shop or job site.',
      },
      {
        question: 'I am a contractor in Ankeny. Will this help me get more project leads?',
        answer:
          'It is built for that. Your site and Google Business Profile are set up so homeowners searching in Ankeny find you, and your quote form asks for the details you need, like project type and photos, before you drive out.',
      },
      {
        question: 'What if I am too busy to answer every call?',
        answer:
          'That is common for Ankeny trades. On AxeonCORE, missed calls get a text back right away, AI chat answers questions on your site, and automatic follow-up keeps quotes from going cold.',
      },
    ],
  },
  {
    slug: 'waukee-web-design',
    city: 'Waukee',
    linkLabel: 'Waukee Web Design',
    title: 'Waukee Web Design & Marketing | Axeon Studio',
    description:
      'Waukee web design and marketing that helps newer businesses get chosen over established names. Local SEO, fast sites, plans from $149/mo, 90-day guarantee.',
    eyebrow: 'Waukee, Iowa · West Metro',
    h1: 'Waukee Web Design That Wins You More Customers',
    intro:
      'Waukee is growing fast, and new businesses open next to ones that have been around for years. We help you get found and get chosen, even when the other option has a head start.',
    localHeading: 'New business, established competition.',
    localBody: [
      'A lot of Waukee businesses are new, and many compete with names that have been around for years, in Waukee or just down the road in West Des Moines. The established names usually have more reviews and an older Google listing. That is a real head start.',
      'You close the gap with a site that looks like the obvious pick, a Google Business Profile set up right from the start, and a steady habit of asking happy customers for reviews.',
    ],
    focusPoints: [
      {
        title: 'Start your Google presence right',
        description:
          'A properly set up Google Business Profile, service pages, and local SEO from day one, so you are not playing catch-up a year from now.',
      },
      {
        title: 'Win the side-by-side comparison',
        description:
          'Clear services, real photos, and an easy next step, so a customer comparing you to an older name picks you.',
      },
      {
        title: 'Build reviews on purpose',
        description:
          'On AxeonCORE, review requests go out automatically after the job, so your rating grows with every happy customer.',
      },
    ],
    featuredNiches: ['med-spa', 'dental', 'auto-detailing', 'landscaping', 'real-estate', 'handyman'],
    faq: [
      {
        question: 'I just opened in Waukee. Is it too early for a real website?',
        answer:
          'No, it is the best time. Setting up your website and Google Business Profile correctly from the start is easier than fixing them later, and it gives every early customer a place to find you and leave a review.',
      },
      {
        question: 'How do I compete with businesses that have way more reviews?',
        answer:
          'You will not out-review them overnight, so you win elsewhere: a faster, clearer site, real photos of your work, and a quick answer to every lead. On AxeonCORE, automatic review requests help your rating grow after every job.',
      },
      {
        question: 'Do you serve Waukee in person?',
        answer:
          'Yes. Waukee is next door to our West Des Moines base. We can meet at your location, and the on-site video shoot with AxeonGROWTH happens right where you work.',
      },
    ],
  },
  {
    slug: 'urbandale-web-design',
    city: 'Urbandale',
    linkLabel: 'Urbandale Web Design',
    title: 'Urbandale Web Design & Local SEO | Axeon Studio',
    description:
      'Urbandale web design and local SEO that turns searches into calls for established businesses. One West Des Moines team, plans from $149/mo, 90-day guarantee.',
    eyebrow: 'Urbandale, Iowa · Northwest Metro',
    h1: 'Urbandale Web Design That Turns Searches Into Calls',
    intro:
      'Urbandale is full of established businesses with loyal customers and websites that have not kept up. We rebuild your site so the people searching today find you, trust you, and call.',
    localHeading: 'Great reputation, outdated website.',
    localBody: [
      'The business corridors along Douglas Avenue, 86th Street, and Merle Hay Road are full of companies that have served the area for years. Many of them run on word of mouth and a website built a long time ago.',
      'Word of mouth still matters, but even a referral looks you up before calling. If your site is slow, hard to use on a phone, or hides your reviews, they call someone who looks more current.',
    ],
    focusPoints: [
      {
        title: 'A rebuild that keeps what is working',
        description:
          'We move your existing pages over carefully and redirect your old links, so you keep the Google rankings you have already earned.',
      },
      {
        title: 'Turn your reputation into calls',
        description:
          'Your reviews, your years in business, and your real work front and center, with tap-to-call on every page.',
      },
      {
        title: 'Show up for nearby searches',
        description:
          'Local SEO for Urbandale and the surrounding metro, so people searching close by find you first.',
      },
    ],
    featuredNiches: ['accounting', 'law-firms', 'hvac', 'electrical', 'auto-detailing', 'home-remodeling'],
    faq: [
      {
        question: 'Most of our work comes from referrals. Why rebuild an old website?',
        answer:
          'Because most referrals still look you up first. A site that is fast, works well on a phone, and shows your reviews makes that referral pick up the phone instead of second-guessing.',
      },
      {
        question: 'Will a new site hurt the Google rankings we already have?',
        answer:
          'Not if it is done carefully. We move your content over and redirect every old URL to its new page. That is how we rebuilt A-1 Auto Detailing’s site, which went from page 2 to #1 on Google for "Pleasant Hill auto detailing."',
      },
      {
        question: 'Do you work with businesses in Urbandale?',
        answer:
          'Yes. Urbandale is a short drive from our West Des Moines base, and we can meet at your location anywhere in the metro.',
      },
    ],
  },
];

export const cityPageBySlug = (slug: string) => cityPages.find((c) => c.slug === slug);
