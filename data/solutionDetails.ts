import type { FaqItem } from '@/data/faqData';

// Content for the /marketing-solutions/* service pages, rendered by
// components/marketing-solutions/SolutionSections.tsx.
//
// Every claim here must stay inside content/brand-guardrails.md: real prices
// only ($149 / $299 / $999 a month, $99 to start), no build timelines, no invented
// results. The only client proof is A-1 Auto Detailing, using its approved
// facts, one angle per page. At most one sourced statistic per page, always
// with its real source URL.
//
// Each page sells one story: the leaks (problem.items) -> the fix for each leak
// (deliverables.fixes, same order) -> proof. Every section header is the
// message, not a label. Keep it short: 3 leaks, 3 fixes, max 4 own FAQs.

export type FunnelStep = 'found' | 'chosen' | 'booked';

export interface SolutionProblem {
  eyebrow: string;
  /** The message a skimmer gets in two seconds. */
  heading: string;
  intro?: string;
  /** Each leak: one bold sentence (title) and a short cost line (body). */
  items: { title: string; body: string }[];
  /** The page's sourced stat, shown as a giant number. */
  stat?: { figure: string; text: string; sourceLabel: string; sourceUrl: string };
  /** Pages without a sourced stat lead with their strongest leak instead. */
  pullLine?: string;
}

export interface SolutionFix {
  title: string;
  items: string[];
}

export interface SolutionDeliverables {
  eyebrow: string;
  heading: string;
  intro?: string;
  /** One fix per leak, in the same order as problem.items. */
  fixes: SolutionFix[];
  /** Index of the fix that carries the page; rendered dark and dominant. */
  dominant?: number;
  /** One large frame for a page's hero deliverable. */
  feature?: { image: string; alt: string; label: string; caption: string };
  /** Included work that doesn't answer a single leak. */
  alsoIncluded?: { label: string; items: string[] };
}

/** Where the service sits in Found -> Chosen -> Booked, and how it's bought. First line is the headline. */
export interface SolutionFit {
  step: FunnelStep;
  lines: string[];
}

export interface SolutionProof {
  /** Big result number; without one the section leads with Levi's quote. */
  figure?: string;
  figureLabel?: string;
  /** The result, stated as the headline. */
  heading: string;
  body: string;
  facts: string[];
  /** Show Levi Rench's approved quote, verbatim. */
  quote?: boolean;
}

export interface SolutionDetail {
  problem: SolutionProblem;
  deliverables: SolutionDeliverables;
  fit: SolutionFit;
  /** Step names for the slim "how it works" strip. */
  timeline: string[];
  proof?: SolutionProof;
  faqs: FaqItem[];
}

const BOTH_PLANS =
  'Essentials $149/mo · AxeonCORE $299/mo · AxeonGROWTH $999/mo · $99 to start';
const CORE_PLAN = 'Part of AxeonCORE: $299/mo, $99 to start';

const STAT_62 = {
  sourceLabel: '411 Locals call study',
  sourceUrl: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
};
const STAT_21X = {
  sourceLabel: 'MIT / InsideSales lead response study',
  sourceUrl: 'https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf',
};
const STAT_97 = {
  sourceLabel: 'BrightLocal Local Consumer Review Survey',
  sourceUrl: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
};

// ---------------------------------------------------------------------------
// Website
// ---------------------------------------------------------------------------

export const websiteDetail: SolutionDetail = {
  problem: {
    eyebrow: 'The Problem',
    heading: 'Your site looks fine. It isn’t selling.',
    pullLine: 'A form fill at 2 p.m. gets seen at 9 p.m. By then the customer has called someone who picked up.',
    items: [
      {
        title: 'It’s built like a brochure.',
        body: 'Nothing tells a visitor why to pick you or what to do next, so they go back and compare.',
      },
      {
        title: 'It’s slow and clumsy on a phone.',
        body: 'Most people find a local business on their phone. Make them wait and they’re back in the search results.',
      },
      {
        title: 'Leads land in an inbox nobody watches.',
        body: 'By the time someone sees the form fill, the customer has called whoever picked up.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'The Fix',
    heading: 'A Site That Turns Visitors Into Calls',
    fixes: [
      {
        title: 'Built to win the comparison',
        items: [
          'Custom pages designed around how you sell',
          'Your reviews, prices, and real work up front',
          'You own the site and every file',
        ],
      },
      {
        title: 'Fast on every phone, found on Google & AI',
        items: [
          'Fast on every phone',
          'Search and AI-answer visibility built into every page',
          'Business details that match your Google profile',
          'Old pages redirected, so you keep what you’ve earned',
        ],
      },
      {
        title: 'Every lead reaches you, instantly',
        items: [
          'Quote forms and tap-to-call where people decide',
          'Instant alerts to your inbox and phone',
          'On AxeonCORE: one list of every lead, AI chat, and automatic follow-up',
        ],
      },
    ],
  },
  fit: {
    step: 'chosen',
    lines: [`Part of ${BOTH_PLANS}`, 'Every plan starts with the website. AxeonCORE adds the lead system; AxeonGROWTH adds a half-day video shoot.'],
  },
  timeline: ['Scope & content', 'Design, build & review', 'Launch'],
  proof: {
    figure: '0.3–0.8s',
    figureLabel: 'page loads on A-1’s new site',
    heading: 'A-1’s new site loads in under a second.',
    body: 'A-1 Auto Detailing had 25 years of experience and an old site that hid it. We redesigned it from the logo up.',
    facts: ['New logo and a custom site, designed by Axeon', '18 pages, including 6 service pages and 4 guides'],
  },
  faqs: [
    {
      question: 'How long does it take to get a new website?',
      answer:
        'Fast. We work from a proven system, so builds go live in a fraction of the time a typical agency takes. We map out your schedule on the strategy call. The biggest factor is how quickly we get your content.',
    },
    {
      question: 'What’s the difference between Essentials and AxeonCORE?',
      answer:
        'Essentials ($149/mo) is a fast, credible site that gets you found and alerts you to every lead. AxeonCORE ($299/mo) adds the system that captures, qualifies, and follows up on leads for you, tracked in AxeonPROOF. AxeonGROWTH ($999/mo plus ad spend) adds ads, an AI phone receptionist, and a half-day on-site video shoot. AxeonCORE is the one we recommend.',
    },
    {
      question: 'Will I lose my Google rankings if I replace my current site?',
      answer:
        'Not if the move is handled properly. We map every old URL to the most relevant new page with a permanent redirect, so bookmarks, links, and Google’s existing index all land somewhere real.',
    },
    {
      question: 'Do I own the website once it’s built?',
      answer: 'Yes. You own 100% of the site, code, and design files. There’s no proprietary platform and no lock-in.',
    },
  ],
};

// ---------------------------------------------------------------------------
// SEO / AEO / GEO
// ---------------------------------------------------------------------------

export const seoDetail: SolutionDetail = {
  problem: {
    eyebrow: 'The Problem',
    heading: 'Google can’t read you. AI recommends competitors.',
    intro: 'Most businesses that don’t show up aren’t worse than the ones that do. Their sites just make it hard for Google and AI to understand them.',
    items: [
      {
        title: 'Search engines have to guess what you do.',
        body: 'Services, hours, and service area are buried in loose paragraphs, so Google and AI tools guess wrong, or skip you.',
      },
      {
        title: 'Your site may be shutting AI tools out.',
        body: 'Plenty of sites block AI search tools without knowing it, so ChatGPT recommends someone else.',
      },
      {
        title: 'Your answers are buried.',
        body: 'People ask full questions now. If your page never answers plainly, an AI assistant quotes a competitor who did.',
      },
    ],
    stat: {
      figure: '97%',
      text: 'of people read reviews when choosing a local business. Being found is step one; what they find on Google decides who gets the call.',
      ...STAT_97,
    },
  },
  deliverables: {
    eyebrow: 'The Fix',
    heading: 'Found Wherever Customers Look',
    fixes: [
      {
        title: 'Google reads you right',
        items: ['A page for every core service', 'Business details Google can read and trust', 'Fast, mobile-first pages'],
      },
      {
        title: 'AI tools let in, with the same facts everywhere',
        items: ['Your site open to AI search tools like ChatGPT', 'The same facts about you everywhere AI looks'],
      },
      {
        title: 'Plain answers AI can quote',
        items: ['Plain answers to the questions customers ask'],
      },
    ],
    alsoIncluded: {
      label: 'Measured monthly',
      items: ['Tracking on every call and form', 'A monthly calls & leads report', 'A clear view of which pages bring in work'],
    },
  },
  fit: {
    step: 'found',
    lines: [`Built into every plan. ${BOTH_PLANS}`, 'AxeonGROWTH adds a new service page every month; on other plans extra pages are $450 each.'],
  },
  timeline: ['Map the searches', 'Build it in', 'Launch & measure'],
  proof: {
    figure: '#1',
    figureLabel: 'on Google for “Pleasant Hill auto detailing,” up from page 2',
    heading: 'Page 2 to #1 on Google for “Pleasant Hill Auto Detailing”',
    body: 'A-1 Auto Detailing was stuck on page 2. We rebuilt the site with search designed in from the start, and it now ranks #1 for its main local search.',
    facts: ['A perfect 100/100 SEO audit score'],
  },
  faqs: [
    {
      question: 'What’s the difference between SEO, AEO, and GEO?',
      answer:
        'SEO gets your pages ranking in regular search results. AEO (answer engine optimization) shapes your content so Google’s AI answers and voice assistants can pull a direct answer from it. GEO (generative engine optimization) makes sure tools like ChatGPT, Perplexity, and Gemini can read, trust, and cite your business.',
    },
    {
      question: 'Will you guarantee a ranking or a date?',
      answer:
        'No. Rankings take real time and vary by market, so we won’t promise a date. Every page is built to compete for the top spot from day one.',
    },
    {
      question: 'Does SEO cost extra?',
      answer:
        'No. SEO, AEO, and GEO are built into every plan. AxeonGROWTH adds a new service page every month; on other plans extra pages are $450 each.',
    },
    {
      question: 'Do you build a page for every town I serve?',
      answer:
        'Only when there’s something real to put on it, like photos, reviews, or projects from that town. Pages that only swap the city name are thin content, and Google treats them that way.',
    },
  ],
};

// ---------------------------------------------------------------------------
// AI Chat & Online Scheduling
// ---------------------------------------------------------------------------

export const aiChatDetail: SolutionDetail = {
  problem: {
    eyebrow: 'The Problem',
    heading: 'At 10 p.m., nobody answers. They book elsewhere.',
    intro: 'The lead usually isn’t lost on price. It’s lost because nobody answered while the customer was still interested.',
    items: [
      {
        title: 'After-hours visitors just leave.',
        body: 'Their question gets no answer, and by morning they’ve booked elsewhere.',
      },
      {
        title: 'Booking one job takes a round of phone tag.',
        body: '“Does Tuesday work?” “How about Thursday?” Every back-and-forth is another chance for the lead to go cold.',
      },
      {
        title: 'Your chat widget frustrates people.',
        body: 'Most are a form in disguise. They collect an email and do nothing, and visitors can tell.',
      },
    ],
    stat: {
      figure: '62%',
      text: 'of calls to small businesses go unanswered. After hours, your website may be the only thing still answering.',
      ...STAT_62,
    },
  },
  deliverables: {
    eyebrow: 'The Fix',
    heading: 'An Assistant That Works the Night Shift',
    fixes: [
      {
        title: 'Answers 24/7, with your real details',
        items: ['24/7 chat on your website', 'Set up with your real services, prices, and hours'],
      },
      {
        title: 'Qualified leads book themselves',
        items: ['Scheduling connected to your calendar', 'No back-and-forth texts to lock in a time'],
      },
      {
        title: 'A real conversation that follows through',
        items: [
          'A real conversation, not a button menu',
          'A text and email the second a lead comes in',
          'Missed-call text-back',
          'Every conversation in one place',
        ],
      },
    ],
  },
  fit: {
    step: 'booked',
    lines: [CORE_PLAN, 'Not part of Essentials. The AI phone receptionist comes with AxeonGROWTH, or +$199/mo on AxeonCORE.'],
  },
  timeline: ['Map your conversations', 'Configure & connect', 'Test & launch'],
  proof: {
    heading: 'A local owner, after his Axeon rebuild',
    body: 'A-1 Auto Detailing’s site was redesigned by Axeon from the logo up.',
    facts: [],
    quote: true,
  },
  faqs: [
    {
      question: 'Can it actually book appointments, or just answer questions?',
      answer:
        'It checks your real calendar and books qualified leads directly onto it. It’s not a chatbot that collects an email and passes it along.',
    },
    {
      question: 'Does this replace my front desk?',
      answer:
        'It’s built to catch what would otherwise go to voicemail or a missed chat, as after-hours backup, not a front-desk replacement.',
    },
    {
      question: 'What if someone asks something it doesn’t know?',
      answer:
        'We set it up with your real services, prices, and policies. When a question falls outside that, it takes the person’s details and gets them to you rather than guess.',
    },
    {
      question: 'Is AI chat included in Essentials?',
      answer:
        'No. AI chat and online scheduling are part of AxeonCORE, along with your lead list and automatic follow-up. Essentials includes instant lead alerts, so you still hear about every form and call request right away.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Lead Capture & Follow-Up
// ---------------------------------------------------------------------------

export const leadGenDetail: SolutionDetail = {
  problem: {
    eyebrow: 'Where Leads Go Missing',
    heading: 'You’re losing leads you already paid for.',
    intro: 'Most businesses don’t need more leads first. They need to stop losing the ones they already get.',
    items: [
      {
        title: 'Nobody replies until the end of the day.',
        body: 'By then the lead has talked to two competitors.',
      },
      {
        title: 'The quote goes out, and nobody checks back.',
        body: 'The lead goes with whoever followed up.',
      },
      {
        title: 'Every lead waits in the same line.',
        body: 'Ready-to-buy customers sit behind tire-kickers, because nothing sorts them first.',
      },
    ],
    stat: {
      figure: '21×',
      text: 'Leads called back within 5 minutes were about 21 times more likely to qualify than leads called back after 30.',
      ...STAT_21X,
    },
  },
  deliverables: {
    eyebrow: 'The Fix',
    heading: 'Every Lead Answered, Followed Up, and Booked',
    fixes: [
      {
        title: 'Answered in seconds',
        items: [
          'A text and email the second a lead comes in',
          'Your phone rings and connects you to new form leads',
          'Missed callers get a text back right away',
        ],
      },
      {
        title: 'Followed up until they book',
        items: [
          'Automatic texts and emails keep following up until they book',
          'AI chat and online scheduling, 24/7',
          'Appointments straight onto your calendar',
          'Every lead tracked from first contact to booked job',
        ],
      },
      {
        title: 'Ready buyers sorted first',
        items: [
          'Intake questions that qualify the lead',
          'Quote forms and tap-to-call where visitors decide',
          'Instant alerts to your inbox and phone',
        ],
      },
    ],
  },
  fit: {
    step: 'booked',
    lines: [CORE_PLAN, 'Essentials ($149/mo) includes instant lead alerts and tracks every call and form.'],
  },
  timeline: ['Map how you close', 'Build & write', 'Test & launch'],
  proof: {
    heading: 'Now every page on A-1’s site can take a booking.',
    body: 'A-1 Auto Detailing’s rebuild added a quote and booking form with service pre-select and tap-to-call on every page.',
    facts: [],
    quote: true,
  },
  faqs: [
    {
      question: 'What counts as a lead?',
      answer: 'Every call, form fill, chat, and text that comes in through your site or listed number. They all land in the same list.',
    },
    {
      question: 'Do I still have to check it manually?',
      answer: 'No. Follow-up starts automatically the moment someone reaches out, so nothing waits on you to notice it.',
    },
    {
      question: 'What’s included in Essentials vs. AxeonCORE?',
      answer:
        'Essentials includes instant lead alerts and tracks every call and form. AxeonCORE adds the full system: one list of every lead, a few quick questions that screen out tire-kickers, AI chat and scheduling, automatic texts and emails, instant call-back, missed-call text-back, and tracked phone numbers.',
    },
    {
      question: 'Do you run Google or Facebook ads?',
      answer:
        'Yes, as a separate add-on. This service makes sure every lead, including the ones your ads bring in, gets answered and followed up. See our Advertising page.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Video & Photography
// ---------------------------------------------------------------------------

export const videoDetail: SolutionDetail = {
  problem: {
    eyebrow: 'The Problem',
    heading: 'Stock photos make you look like everyone else.',
    pullLine: 'People hire the business they trust, and they decide a lot of that before they read a word.',
    items: [
      {
        title: 'Stock photos could be anyone.',
        body: 'A smiling model in a hard hat tells a customer nothing about you. They’ve seen it on three other sites.',
      },
      {
        title: 'Phone photos undersell good work.',
        body: 'Bad lighting and awkward angles make it look ordinary.',
      },
      {
        title: 'One long video nobody finishes.',
        body: 'A four-minute brand video doesn’t get watched. Short cuts in the right places do.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'The Fix',
    heading: 'One Half-Day Shoot, Used Everywhere',
    feature: {
      image: '/temp-scorpion-refs/video-photography-hero.webp',
      alt: 'An on-site video shoot',
      label: 'The hero film',
      caption: 'A hero film for your website, shot in a half-day at your location.',
    },
    fixes: [
      {
        title: 'Your team, your space, your work. Never stock.',
        items: ['A half-day on-site shoot at your location', 'A shot list planned with you beforehand'],
      },
      {
        title: 'A photo set that shows the work properly',
        items: ['A photo set for your site and profiles', 'Ready for social, ads, and your Google profile'],
      },
      {
        title: '3 short vertical cuts',
        items: ['3 vertical cuts for social and ads', 'Built into your homepage and service pages', 'Compressed so your site stays fast'],
      },
    ],
  },
  fit: {
    step: 'chosen',
    lines: ['Included in AxeonGROWTH: $999/mo plus ad spend', 'On Essentials or AxeonCORE, add the shoot for $1,500.'],
  },
  timeline: ['Plan the shoot', 'Shoot on-site', 'Edit & build in'],
  faqs: [
    {
      question: 'What exactly do I get from the shoot?',
      answer:
        'A half-day on-site shoot at your location: a hero film for your website, three vertical cuts sized for social and ads, and a photo set for your site and profiles.',
    },
    {
      question: 'Can I see examples of your work?',
      answer: 'On your strategy call we’ll walk through exactly what a shoot would look like for your business.',
    },
    {
      question: 'Is the $1,500 add-on or AxeonGROWTH the better deal?',
      answer:
        'If you also want ads and an AI receptionist, AxeonGROWTH is the better value: its $1,500 start covers the shoot, and the $999/mo includes ads management, the receptionist, and a new page every month. If you only want the video, the $1,500 add-on on Essentials or AxeonCORE is the way to go.',
    },
    {
      question: 'Do I need to prepare anything?',
      answer:
        'Just tidy the space you want on camera and let the people who will appear know ahead of time. We plan the shot list with you beforehand.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Advertising (Google Ads + Meta Ads)
// ---------------------------------------------------------------------------

export const advertisingDetail: SolutionDetail = {
  problem: {
    eyebrow: 'The Problem',
    heading: 'Every ad dollar should trace to a call.',
    intro: 'Ads aren’t the hard part. Running them so every dollar traces back to a call or a booking is.',
    items: [
      {
        title: 'You’re paying for the wrong clicks.',
        body: 'Boosted posts and broad keywords reach job seekers, DIYers, and people three states away.',
      },
      {
        title: 'Clicks land on your homepage.',
        body: 'Someone searches for one service, lands on a generic page, hits back, and calls the next ad.',
      },
      {
        title: 'Nobody can tell you what worked.',
        body: 'The dashboard shows clicks, not which ads produced calls or booked jobs.',
      },
    ],
    stat: {
      figure: '21×',
      text: 'Every paid lead is only worth it if someone answers fast. Leads called back within 5 minutes were about 21 times more likely to qualify.',
      ...STAT_21X,
    },
  },
  deliverables: {
    eyebrow: 'The Fix',
    heading: 'Google and Meta, Run Like a System',
    dominant: 2,
    fixes: [
      {
        title: 'Only the clicks worth paying for',
        items: [
          'Google Search campaigns for the services you want more of',
          'Google Local Services Ads, the "Google Guaranteed" spots at the top, paid per lead (AxeonGROWTH)',
          'Tight keywords and service-area targeting',
          'Facebook and Instagram campaigns in your service area',
          'Retargeting people who visited but didn’t book',
        ],
      },
      {
        title: 'Every ad lands on its own page',
        items: [
          'Every ad points to a page for that exact service',
          'Tap-to-call straight from the ad',
          'Your own video and photos with an Axeon shoot',
        ],
      },
      {
        title: 'Every call and booking traced to its ad.',
        items: [
          'Tracking set up before a dollar is spent',
          'Calls, forms, and bookings tracked to the campaign',
          'Plain-English reporting on spend and results',
        ],
      },
    ],
  },
  fit: {
    step: 'found',
    lines: [
      'Included in AxeonGROWTH ($999/mo plus ad spend), or Google & Meta only for +$399/mo on AxeonCORE. Local Services Ads come with AxeonGROWTH.',
      'Ad spend is separate: $500/mo minimum, on your own card and ad account, no markup. Every paid lead gets AxeonCORE\'s instant follow-up.',
    ],
  },
  timeline: ['Audit & tracking', 'Build campaigns & pages', 'Launch & optimize'],
  faqs: [
    {
      question: 'Do you manage both Google Ads and Meta Ads?',
      answer:
        'Yes. We run Google Search campaigns and Facebook and Instagram campaigns, and recommend the mix based on how your customers actually look for you.',
    },
    {
      question: 'Do you run Google Local Services Ads?',
      answer:
        'Yes, on AxeonGROWTH. These are the "Google Guaranteed" listings at the very top of the search, and you pay per lead instead of per click. Google only offers them for certain trades and screens every business itself, so we check your eligibility on the call, then set up and manage the listing for you.',
    },
    {
      question: 'Do I need a new website to run ads with you?',
      answer:
        'Not necessarily. Ads work best when they point to fast, service-specific landing pages, so we’ll look at your current site on the strategy call and tell you honestly whether it can turn ad clicks into calls.',
    },
    {
      question: 'How much should I spend on ads?',
      answer:
        'It depends on your market, your services, and how much work you can take on. We’ll recommend a starting budget on your strategy call.',
    },
    {
      question: 'How do I know the ads are working?',
      answer:
        'Call and form tracking go in before launch, so you see which campaigns produced calls, forms, and bookings, not just clicks.',
    },
  ],
};
