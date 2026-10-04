import type { FaqItem } from '@/data/faqData';

// Content for the /marketing-solutions/* service pages, rendered by
// components/marketing-solutions/SolutionSections.tsx.
//
// Every claim here must stay inside content/brand-guardrails.md: real prices
// only ("from $284/mo" / "from $574/mo"), no build timelines, no invented
// results. The only client proof is A-1 Auto Detailing, using its approved
// facts, one angle per page. At most one sourced statistic per page, always
// with its real source URL.
//
// Keep it short: 3 problems, 3 outcome groups, 3 steps, max 4 own FAQs.

export type FunnelStep = 'found' | 'chosen' | 'booked';

export interface SolutionProblem {
  eyebrow: string;
  heading: string;
  intro?: string;
  items: { title: string; body: string }[];
  stat?: { text: string; sourceLabel: string; sourceUrl: string };
}

export interface SolutionDeliverables {
  eyebrow: string;
  heading: string;
  intro?: string;
  groups: { title: string; items: string[] }[];
}

export interface SolutionTimeline {
  eyebrow: string;
  heading: string;
  intro?: string;
  steps: { title: string; body: string }[];
}

/** Where the service sits in Found → Chosen → Booked, and how it's bought. First line is the headline. */
export interface SolutionFit {
  step: FunnelStep;
  lines: string[];
}

export interface SolutionProof {
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
  timeline: SolutionTimeline;
  proof?: SolutionProof;
  faqs: FaqItem[];
}

const BOTH_PLANS =
  'AxeonCORE: $5,800 setup, then from $574/mo · Essentials: $2,800 setup, then from $284/mo';
const CORE_PLAN = 'Part of AxeonCORE: $5,800 setup, then from $574/mo';

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
    heading: 'Why Most Small-Business Websites Don’t Bring In Work',
    items: [
      {
        title: 'Built like a brochure',
        body: 'Nothing tells a visitor why to pick you over the next result, or what to do next. So they go back and compare.',
      },
      {
        title: 'Slow and clumsy on a phone',
        body: 'Most people find a local business on their phone. Make them wait and they go back to the search results.',
      },
      {
        title: 'Leads land in an inbox nobody watches',
        body: 'A form fill at 2 p.m. gets seen at 9 p.m. By then the customer has called someone who picked up.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What You Get',
    heading: 'A Site That Turns Visitors Into Calls',
    groups: [
      {
        title: 'Built to win the comparison',
        items: [
          'Custom pages designed around how you sell',
          'Your reviews, prices, and real work up front',
          'Fast on every phone',
          'You own the site and every file',
        ],
      },
      {
        title: 'Found on Google & AI',
        items: [
          'Search and AI-answer visibility built into every page',
          'Business details that match your Google profile',
          'Old pages redirected, so you keep what you’ve earned',
        ],
      },
      {
        title: 'Every lead reaches you',
        items: [
          'Quote forms and tap-to-call where people decide',
          'Instant alerts to your inbox and phone',
          'On AxeonCORE: a CRM pipeline, AI chat, and automatic follow-up',
        ],
      },
    ],
  },
  fit: {
    step: 'chosen',
    lines: [`Part of ${BOTH_PLANS}`, 'Every plan starts with the website. AxeonCORE adds the lead system and a half-day video shoot.'],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'From Kickoff to Launch',
    steps: [
      {
        title: 'Scope & content',
        body: 'We agree on the pages and the price in writing, then gather your services, prices, photos, and reviews.',
      },
      {
        title: 'Design, build & review',
        body: 'You talk directly to the person building your site, and review it on a live link. Two rounds of revisions are included.',
      },
      {
        title: 'Launch',
        body: 'Redirects in place, search engines notified, and lead alerts tested with real submissions before we call it done.',
      },
    ],
  },
  proof: {
    heading: 'A New Brand and a Site Built to Sell',
    body: 'A-1 Auto Detailing had 25 years of experience and an old site that hid it. We redesigned it from the logo up.',
    facts: [
      'New logo and a custom site, designed by Axeon',
      '18 pages, including 6 service pages and 4 guides',
      'Page loads of roughly 0.3–0.8 seconds',
    ],
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
        'Essentials ($2,800 setup, then from $284/mo) is a fast, credible site that gets you found and alerts you to every lead. AxeonCORE ($5,800 setup, then from $574/mo) adds the system that captures, qualifies, and follows up on leads for you, plus a half-day on-site video shoot. AxeonCORE is the one we recommend.',
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
    heading: 'Why Good Local Businesses Stay Invisible',
    intro: 'Most businesses that don’t show up aren’t worse than the ones that do. Their sites just make it hard for Google and AI to understand them.',
    items: [
      {
        title: 'Search engines have to guess',
        body: 'Your services, hours, and service area are buried in loose paragraphs. Google and AI tools guess wrong, or skip you.',
      },
      {
        title: 'AI tools are shut out',
        body: 'Plenty of sites block AI search tools without knowing it, so ChatGPT recommends someone else.',
      },
      {
        title: 'Answers are buried',
        body: 'People ask full questions now. If your page never answers plainly, an AI assistant quotes a competitor who did.',
      },
    ],
    stat: {
      text: '97% of people read reviews when choosing a local business. Being found is step one; what they find on Google decides who gets the call.',
      ...STAT_97,
    },
  },
  deliverables: {
    eyebrow: 'What You Get',
    heading: 'Found Wherever Customers Look',
    groups: [
      {
        title: 'Found on Google',
        items: [
          'A page for every core service',
          'Business details Google can read and trust',
          'Fast, mobile-first pages',
        ],
      },
      {
        title: 'Found in AI answers',
        items: [
          'Plain answers to the questions customers ask',
          'Your site open to AI search tools like ChatGPT',
          'The same facts about you everywhere AI looks',
        ],
      },
      {
        title: 'Measured monthly',
        items: [
          'Tracking on every call and form',
          'A monthly calls & leads report',
          'A clear view of which pages bring in work',
        ],
      },
    ],
  },
  fit: {
    step: 'found',
    lines: [`Built into both plans. ${BOTH_PLANS}`, 'Ongoing SEO & content beyond the build is an add-on, scoped on your strategy call.'],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Get You Found',
    steps: [
      {
        title: 'Map the searches',
        body: 'We find the searches that bring you paying work (your services, your towns, the questions people ask) and give each one a page.',
      },
      {
        title: 'Build it in',
        body: 'Search and AI visibility go in while the site is built, not bolted on after launch.',
      },
      {
        title: 'Launch & measure',
        body: 'Search engines notified, tracking live, and a monthly report on calls and leads. Rankings take time, so we never promise a date.',
      },
    ],
  },
  proof: {
    heading: 'Page 2 to #1 on Google for “Pleasant Hill Auto Detailing”',
    body: 'A-1 Auto Detailing was stuck on page 2. We rebuilt the site with search designed in from the start, and it now ranks #1 for its main local search.',
    facts: ['#1 on Google for “Pleasant Hill auto detailing,” up from page 2', 'A perfect 100/100 SEO audit score'],
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
        'No. SEO, AEO, and GEO are built into every Essentials and AxeonCORE site. Ongoing SEO & content after launch is an add-on, scoped on your strategy call.',
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
    heading: 'Where Local Businesses Lose Leads Every Day',
    intro: 'The lead usually isn’t lost on price. It’s lost because nobody answered while the customer was still interested.',
    items: [
      {
        title: 'After-hours visitors just leave',
        body: 'Someone finds your site at 10 p.m. with a question and gets no answer. By morning they’ve booked elsewhere.',
      },
      {
        title: 'Phone tag to book one job',
        body: '“Does Tuesday work?” “How about Thursday?” Every back-and-forth is another chance for the lead to go cold.',
      },
      {
        title: 'Chat widgets that frustrate people',
        body: 'Most are a button menu or a form in disguise. They collect an email and do nothing, and visitors can tell.',
      },
    ],
    stat: {
      text: '62% of calls to small businesses go unanswered. After hours, your website may be the only thing still answering.',
      ...STAT_62,
    },
  },
  deliverables: {
    eyebrow: 'What You Get',
    heading: 'An Assistant That Works the Night Shift',
    groups: [
      {
        title: 'Answers',
        items: [
          '24/7 chat on your website',
          'Set up with your real services, prices, and hours',
          'A real conversation, not a button menu',
        ],
      },
      {
        title: 'Books',
        items: [
          'Scheduling connected to your calendar',
          'Qualified leads book themselves',
          'No back-and-forth texts to lock in a time',
        ],
      },
      {
        title: 'Follows up',
        items: [
          'A text and email the second a lead comes in',
          'Missed-call text-back',
          'Every conversation in your CRM pipeline',
        ],
      },
    ],
  },
  fit: {
    step: 'booked',
    lines: [CORE_PLAN, 'Not part of Essentials. The AI phone receptionist is a separate add-on, scoped on your strategy call.'],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Set It Up',
    steps: [
      {
        title: 'Map your conversations',
        body: 'What customers ask you, what you charge, and what you need to know before you quote.',
      },
      {
        title: 'Configure & connect',
        body: 'We load your answers, connect your calendar, and write the intake questions and follow-up messages.',
      },
      {
        title: 'Test & launch',
        body: 'We run it through real questions and bookings before a customer sees it, then review early conversations with you.',
      },
    ],
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
        'No. AI chat and online scheduling are part of AxeonCORE, along with the CRM pipeline and automated follow-up. Essentials includes instant lead alerts, so you still hear about every form and call request right away.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Lead Capture & Follow-Up
// ---------------------------------------------------------------------------

export const leadGenDetail: SolutionDetail = {
  problem: {
    eyebrow: 'Where Leads Go Missing',
    heading: 'Most Businesses Don’t Need More Leads First',
    intro: 'They need to stop losing the ones they already get.',
    items: [
      {
        title: 'Slow first response',
        body: 'A lead reaches out and nobody replies until the end of the day. By then they’ve talked to two competitors.',
      },
      {
        title: 'No follow-up',
        body: 'A quote goes out and nobody checks back, so the lead goes with whoever followed up.',
      },
      {
        title: 'Every lead treated the same',
        body: 'Ready-to-buy customers wait behind tire-kickers, because nothing sorts them first.',
      },
    ],
    stat: {
      text: 'Leads called back within 5 minutes were about 21× more likely to qualify than leads called back after 30.',
      ...STAT_21X,
    },
  },
  deliverables: {
    eyebrow: 'What You Get',
    heading: 'Every Lead Answered, Followed Up, and Booked',
    groups: [
      {
        title: 'Capture',
        items: [
          'Quote forms and tap-to-call where visitors decide',
          'Intake questions that qualify the lead',
          'Instant alerts to your inbox and phone',
        ],
      },
      {
        title: 'Follow up',
        items: [
          'A text and email the second a lead comes in',
          'Your phone rings and connects you to new form leads',
          'Missed callers get a text back right away',
        ],
      },
      {
        title: 'Book',
        items: [
          'AI chat and online scheduling, 24/7',
          'Appointments straight onto your calendar',
          'Every lead tracked from first contact to booked job',
        ],
      },
    ],
  },
  fit: {
    step: 'booked',
    lines: [CORE_PLAN, 'Essentials ($2,800 setup, then from $284/mo) includes instant lead alerts and conversion tracking.'],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Set Up Your Pipeline',
    steps: [
      {
        title: 'Map how you close',
        body: 'Where leads come from, what you ask them, how you quote, and what “won” means for your business.',
      },
      {
        title: 'Build & write',
        body: 'Intake questions, pipeline stages, and follow-up texts and emails, written in your voice.',
      },
      {
        title: 'Test & launch',
        body: 'We send real test leads through every channel and confirm each one lands, alerts you, and gets its follow-up.',
      },
    ],
  },
  proof: {
    heading: 'Every Page Ready to Take a Booking',
    body: 'A-1 Auto Detailing’s rebuild added a quote and booking form with service pre-select and tap-to-call on every page. Owner Levi Rench:',
    facts: [],
    quote: true,
  },
  faqs: [
    {
      question: 'What counts as a lead?',
      answer: 'Every call, form fill, chat, and text that comes in through your site or listed number. They all land in the same pipeline.',
    },
    {
      question: 'Do I still have to check it manually?',
      answer: 'No. Follow-up starts automatically the moment someone reaches out, so nothing waits on you to notice it.',
    },
    {
      question: 'What’s included in Essentials vs. AxeonCORE?',
      answer:
        'Essentials includes instant lead alerts and conversion tracking. AxeonCORE adds the full system: the CRM pipeline, pre-qualifying intake, AI chat and scheduling, automated text and email follow-up, speed-to-lead call connect, missed-call text-back, and call tracking.',
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
    heading: 'Why Most Local Business Visuals Don’t Sell',
    intro: 'People hire the business they trust, and they decide a lot of that before they read a word.',
    items: [
      {
        title: 'Stock photos that could be anyone',
        body: 'A smiling model in a hard hat tells a customer nothing about you. They’ve seen it on three other sites.',
      },
      {
        title: 'Phone photos that undersell the work',
        body: 'Your work is good, but bad lighting and awkward angles make it look ordinary.',
      },
      {
        title: 'One long video nobody finishes',
        body: 'A four-minute brand video doesn’t get watched. Short cuts in the right places do.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What You Get',
    heading: 'One Half-Day Shoot, Used Everywhere',
    groups: [
      {
        title: 'Shoot',
        items: [
          'A half-day on-site shoot at your location',
          'Your team, your space, your work. Never stock',
          'A shot list planned with you beforehand',
        ],
      },
      {
        title: 'Edit',
        items: ['A hero film for your website', '3 vertical cuts for social and ads', 'A photo set for your site and profiles'],
      },
      {
        title: 'Use everywhere',
        items: [
          'Built into your homepage and service pages',
          'Ready for social, ads, and your Google profile',
          'Compressed so your site stays fast',
        ],
      },
    ],
  },
  fit: {
    step: 'chosen',
    lines: [CORE_PLAN, 'On Essentials ($2,800 setup, then from $284/mo), add the shoot for $1,500.'],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How a Shoot Comes Together',
    steps: [
      {
        title: 'Plan the shoot',
        body: 'The work you’re proudest of, the people customers will meet, and a shot list built around your pages.',
      },
      {
        title: 'Shoot on-site',
        body: 'We pick a half-day that works around your jobs and capture your team, your space, and your work.',
      },
      {
        title: 'Edit & build in',
        body: 'You get the hero film, 3 vertical cuts, and a photo set, and we build them into your website.',
      },
    ],
  },
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
      question: 'Is the $1,500 add-on or AxeonCORE the better deal?',
      answer:
        'If you want the video, AxeonCORE is usually the better value. Its setup is $1,500 more than Essentials plus the add-on, and it also includes the CRM pipeline, AI chat and scheduling, and automated follow-up.',
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
    heading: 'Where Local Ad Budgets Leak',
    intro: 'Ads aren’t the hard part. Running them so every dollar traces back to a call or a booking is.',
    items: [
      {
        title: 'Paying for the wrong clicks',
        body: 'Boosted posts and broad keywords reach job seekers, DIYers, and people three states away.',
      },
      {
        title: 'Clicks sent to the homepage',
        body: 'Someone searches for one service and lands on a generic page. They hit back and call the next ad.',
      },
      {
        title: 'No idea what worked',
        body: 'The dashboard shows clicks, but nobody can tell you which ads produced calls or booked jobs.',
      },
    ],
    stat: {
      text: 'Every paid lead is only worth it if someone answers fast. Leads called back within 5 minutes were about 21× more likely to qualify (MIT/InsideSales).',
      ...STAT_21X,
    },
  },
  deliverables: {
    eyebrow: 'What You Get',
    heading: 'Google and Meta, Run Like a System',
    groups: [
      {
        title: 'Google',
        items: [
          'Search campaigns for the services you want more of',
          'Tight keywords and service-area targeting',
          'Tap-to-call straight from the ad',
        ],
      },
      {
        title: 'Meta',
        items: [
          'Facebook and Instagram campaigns in your service area',
          'Retargeting people who visited but didn’t book',
          'Your own video and photos with an Axeon shoot',
        ],
      },
      {
        title: 'Tracking & landing pages',
        items: [
          'Every ad points to a page for that exact service',
          'Calls, forms, and bookings tracked to the campaign',
          'Plain-English reporting on spend and results',
        ],
      },
    ],
  },
  fit: {
    step: 'found',
    lines: [
      'A growth add-on to your plan, scoped on your strategy call',
      'No published price. Budget and scope are set around your market and goals. Pair it with AxeonCORE and every paid lead gets instant follow-up.',
    ],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Launch Your Campaigns',
    steps: [
      {
        title: 'Audit & tracking',
        body: 'We review any past accounts, pick the services worth paying for, and set up tracking before a dollar is spent.',
      },
      {
        title: 'Build campaigns & pages',
        body: 'We write the ads and point each one to a landing page for that specific service.',
      },
      {
        title: 'Launch & optimize',
        body: 'We keep adjusting targeting and creative toward what produces calls and bookings, and report back in plain English.',
      },
    ],
  },
  faqs: [
    {
      question: 'Do you manage both Google Ads and Meta Ads?',
      answer:
        'Yes. We run Google Search campaigns and Facebook and Instagram campaigns, and recommend the mix based on how your customers actually look for you.',
    },
    {
      question: 'Do I need a new website to run ads with you?',
      answer:
        'Not necessarily. Ads work best when they point to fast, service-specific landing pages, so we’ll look at your current site on the strategy call and tell you honestly whether it can convert paid traffic.',
    },
    {
      question: 'How much should I spend on ads?',
      answer:
        'It depends on your market, your services, and how much work you can take on. We’ll recommend a starting budget on your strategy call.',
    },
    {
      question: 'How do I know the ads are working?',
      answer:
        'Conversion and call tracking go in before launch, so you see which campaigns produced calls, forms, and bookings, not just clicks.',
    },
  ],
};
