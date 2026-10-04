import type { FaqItem } from '@/data/faqData';

// Long-form content for the /marketing-solutions/* pages, rendered by
// components/marketing-solutions/SolutionSections.tsx.
//
// Every claim here must stay inside content/brand-guardrails.md: real prices
// only, no build timelines, no monthly-fee mentions, no invented results. The
// only client proof is A-1 Auto Detailing, using its approved facts. Any
// external statistic needs a real source URL.

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
  groups: { title: string; note?: string; items: string[] }[];
  footnote?: string;
}

export interface SolutionTimeline {
  eyebrow: string;
  heading: string;
  intro?: string;
  steps: { title: string; body: string }[];
  footnote?: string;
}

export interface SolutionComparison {
  eyebrow: string;
  heading: string;
  intro?: string;
  rows: { label: string; typical: string; axeon: string }[];
}

export interface SolutionProof {
  heading: string;
  body: string;
  facts: string[];
}

export interface SolutionDetail {
  problem: SolutionProblem;
  deliverables: SolutionDeliverables;
  timeline: SolutionTimeline;
  comparison: SolutionComparison;
  proof?: SolutionProof;
  faqs: FaqItem[];
}

const CONSULTATION_STEP = {
  title: 'Free consultation',
  body: 'We learn how your business actually wins work. Every booked consultation comes with a custom homepage mockup and an AI visibility report showing how you show up on Google, ChatGPT, and Perplexity today. Both are yours to keep, whether you hire us or not.',
};

// ---------------------------------------------------------------------------
// Website
// ---------------------------------------------------------------------------

export const websiteDetail: SolutionDetail = {
  problem: {
    eyebrow: 'The Problem',
    heading: 'Why Most Small-Business Websites Don’t Bring In Work',
    intro:
      'Most local business sites aren’t bad because they’re ugly. They’re bad because nobody decided what the site is supposed to do for the business.',
    items: [
      {
        title: 'Built like a brochure, not a salesperson',
        body: 'A home page, an about page, a services list, and a contact form at the very bottom. Nothing tells a visitor why to pick you over the next result, or what to do next.',
      },
      {
        title: 'Slow and clumsy on a phone',
        body: 'Most people find a local business on their phone. Heavy page builders and oversized images make a visitor wait, and people who are waiting go back to the search results.',
      },
      {
        title: 'Leads land in an inbox nobody watches',
        body: 'A form fill at 2 p.m. gets seen at 9 p.m. By then the customer has already called someone else who picked up.',
      },
      {
        title: 'Invisible to Google’s AI and ChatGPT',
        body: 'No structured data, AI crawlers blocked, and answers buried in paragraphs. Search engines and AI assistants can’t tell what you do, where, or for how much, so they recommend someone else.',
      },
      {
        title: 'Rented, not owned',
        body: 'Plenty of agency sites live on a platform you can’t take with you. Leave the agency and you start over from nothing.',
      },
      {
        title: 'Same template as your competitor',
        body: 'Swap the logo and the colors and it’s the same site the agency sold to the business down the road. Customers notice, even if they can’t say why.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What’s Included',
    heading: 'Everything That Turns Visitors Into Calls',
    intro:
      'Two plans. Essentials is $2,800 to set up, then from $284/mo. AxeonCORE is $5,800 to set up, then from $574/mo, and is the one we recommend. Here’s exactly what you get.',
    groups: [
      {
        title: 'Design & build',
        items: [
          'Custom-designed, mobile-first pages built around how your business sells: up to 4 on Essentials, 5–7 on AxeonCORE',
          'Your logo, colors, and type applied consistently across every page',
          'Service pages, pricing blocks, galleries, and reviews where they help you sell',
          'Conversion-copy hierarchy on AxeonCORE, so every page leads to one clear next step',
          '2 rounds of revisions before launch, included',
        ],
      },
      {
        title: 'Speed & quality',
        items: [
          'Sub-second load speeds',
          '100% Core Web Vitals pass',
          'Images compressed and sized for phones and desktops',
          'Foundational ADA accessibility standards',
        ],
      },
      {
        title: 'Found on Google & AI',
        items: [
          'SEO, AEO, and GEO built into every page, not sold separately',
          'Local business and FAQ structured data',
          'XML sitemap, robots.txt, and llms.txt set up for search engines and AI crawlers',
          'Every old URL mapped and 301-redirected when we replace an existing site',
        ],
      },
      {
        title: 'Lead capture',
        note: 'Every build',
        items: [
          'Quote or contact form placed where visitors actually decide',
          'Tap-to-call on mobile',
          'Instant lead alerts: every form and call request lands in your inbox and on your phone',
          'Conversion tracking so you know which pages produce calls',
        ],
      },
      {
        title: 'Lead system',
        note: 'AxeonCORE',
        items: [
          'Custom CRM Pipeline built around your lead-to-close workflow, with no per-seat software',
          'AI chat & online scheduling so leads book themselves 24/7',
          'Multi-step intake questionnaire that pre-qualifies leads',
          'Automated SMS & email follow-up the second a lead comes in',
          'Speed-to-lead call connect and missed-call text-back',
          'Exit-intent offers and call tracking numbers',
        ],
      },
      {
        title: 'Video & ownership',
        items: [
          'AxeonCORE includes a half-day on-site shoot: a hero film, 3 vertical cuts, and a photo set',
          'Add the shoot to Essentials for $1,500',
          'You own 100% of the site, code, and design files',
          'No proprietary platform and no lock-in',
        ],
      },
    ],
    footnote:
      'Need more? Extra pages are $450 each, a secondary niche landing page is $500, and advanced database or directory integration is $850.',
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'From First Call to Your First 90 Days',
    intro: 'A fixed scope and a fast turnaround, not an open-ended project that drags on for months.',
    steps: [
      CONSULTATION_STEP,
      {
        title: 'Scope & content',
        body: 'We agree on the pages, the tier, and the price, all in writing. Then we collect what makes your business yours: your services, prices, photos, reviews, and service area. How quickly we get this is the biggest factor in how fast you launch.',
      },
      {
        title: 'Design & build',
        body: 'We design and build the site on a fixed scope. You talk directly to the person building it. There are no account managers passing notes back and forth.',
      },
      {
        title: 'Review & revisions',
        body: 'You review the site on a live preview link. Two rounds of revisions are included, and we aren’t done until it’s a site you’re proud to put your name on.',
      },
      {
        title: 'Launch',
        body: 'We go live with the launch checklist done: redirects in place, sitemap submitted, search engines notified, structured data validated, and lead alerts and tracking tested with real submissions.',
      },
      {
        title: 'It’s yours',
        body: 'You own the site, code, and design files outright. Nothing is held hostage on a platform you can’t leave.',
      },
    ],
  },
  comparison: {
    eyebrow: 'Side by Side',
    heading: 'How We Get You More Calls vs. a Typical Agency',
    rows: [
      { label: 'Pricing', typical: 'A custom quote after several sales calls', axeon: 'Published pricing: $2,800 or $5,800 setup, then from $284/mo' },
      { label: 'Design', typical: 'A shared theme with your logo swapped in', axeon: 'Built around how your business sells' },
      { label: 'Speed', typical: 'Heavy page builder, slow on phones', axeon: 'Sub-second loads, Core Web Vitals pass' },
      { label: 'AI search', typical: 'Rarely addressed', axeon: 'SEO, AEO, and GEO in every build' },
      { label: 'Leads', typical: 'A contact form that emails someone', axeon: 'Instant alerts; AxeonCORE adds CRM, AI chat, and auto follow-up' },
      { label: 'Ownership', typical: 'Often tied to the agency’s platform', axeon: 'You own the code and files' },
      { label: 'Who you talk to', typical: 'An account manager', axeon: 'The person building your site' },
    ],
  },
  proof: {
    heading: 'From Page 2 to #1 on Google',
    body: 'A-1 Auto Detailing had 25 years of experience and 180+ five-star Google reviews, but sat on page 2 of Google and the old website hid most of that. We rebuilt it from the logo up, and A-1 now ranks #1 for “Pleasant Hill auto detailing.”',
    facts: [
      'New logo and a custom site designed by Axeon',
      '18 pages, including 6 service pages and 4 guides',
      'Published starting prices from the owner’s own price list',
      'Quote and booking form with service pre-select, plus tap-to-call',
      'About 56 old URLs 301-redirected so nothing was lost',
      'Page loads of roughly 0.3–0.8 seconds',
    ],
  },
  faqs: [
    {
      question: 'How long does it take to get a new website?',
      answer:
        'Fast. We work from a proven system, so builds go live in a fraction of the time a typical agency takes. We map out your schedule on the strategy call. The biggest factor is how quickly we get your content and brand assets.',
    },
    {
      question: 'What’s the difference between Essentials and AxeonCORE?',
      answer:
        'Essentials ($2,800) is a credible, fast site with up to 4 pages that gets you found and alerts you to every lead. AxeonCORE ($5,800) is 5–7 pages, plus the system that captures, qualifies, and follows up on leads for you: a Custom CRM Pipeline, AI chat and scheduling, a pre-qualifying intake, automated SMS and email follow-up, and a half-day on-site video shoot. AxeonCORE is the one we recommend.',
    },
    {
      question: 'Will I lose my Google rankings if I replace my current site?',
      answer:
        'Not if the move is handled properly. We map every old URL to the most relevant new page and set a permanent 301 redirect, so bookmarks, backlinks, and Google’s existing index all land somewhere real. On the A-1 Auto Detailing rebuild that was about 56 old URLs.',
    },
    {
      question: 'What do I need to provide?',
      answer:
        'Your logo if you have one, your list of services and prices, any photos of your work, and access to your domain. If you don’t have good photos, the AxeonCORE on-site shoot (or the $1,500 add-on on Essentials) covers it.',
    },
    {
      question: 'Do I own the website once it’s built?',
      answer: 'Yes. You own 100% of the site, code, and design files. There’s no proprietary platform and no lock-in.',
    },
    {
      question: 'What if I don’t like the design?',
      answer:
        'Every build includes 2 rounds of revisions before launch. We don’t consider it finished until it’s a site you’re proud to put your name on.',
    },
    {
      question: 'What does the free consultation include?',
      answer:
        'A walkthrough of your business and goals, a custom homepage mockup, and an AI visibility report showing how you appear on Google, ChatGPT, and Perplexity. Both are yours to keep either way.',
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
    intro:
      'Most businesses that don’t show up aren’t worse than the ones that do. Their websites just make it hard for Google and AI assistants to understand them.',
    items: [
      {
        title: 'The site is slow on phones',
        body: 'Google measures real-world load speed and stability. A bloated template that stutters on a phone starts behind before content is even considered.',
      },
      {
        title: 'Search engines have to guess',
        body: 'Without structured data, Google and AI tools have to work out your services, hours, service area, and prices from loose paragraphs. Most of the time they guess wrong, or skip you.',
      },
      {
        title: 'AI crawlers are blocked or ignored',
        body: 'OpenAI says sites that opt out of its search crawler won’t be shown in ChatGPT search answers. Plenty of sites block it without knowing.',
      },
      {
        title: 'Dozens of copy-paste town pages',
        body: 'Twenty pages that only swap a city name are thin content. Google treats them as low value, and AI tools have nothing unique to quote.',
      },
      {
        title: 'Your details don’t match',
        body: 'When your name, address, phone, or hours differ between your site and your listings, search engines trust all of them less.',
      },
      {
        title: 'Answers are buried',
        body: 'People ask full questions now: “how much does ceramic coating cost near me?” If your page never answers plainly, an AI assistant quotes a competitor who did.',
      },
    ],
    stat: {
      text: '45% of consumers now use ChatGPT or other AI tools for local business recommendations, up from 6% the year before.',
      sourceLabel: 'BrightLocal Local Consumer Review Survey',
      sourceUrl: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
    },
  },
  deliverables: {
    eyebrow: 'What’s Included',
    heading: 'Everything That Gets You Found',
    intro:
      'This isn’t a separate package or an add-on. All of it ships with every Essentials and AxeonCORE build.',
    groups: [
      {
        title: 'Technical SEO',
        items: [
          'Sub-second loads and a 100% Core Web Vitals pass',
          'Mobile-first build',
          'Clean URL structure with canonical tags',
          'XML sitemap and robots.txt',
          'Every old URL 301-redirected when replacing a site',
          'IndexNow submission at launch so search engines see changes quickly',
        ],
      },
      {
        title: 'On-page SEO',
        items: [
          'A unique title and meta description on every page',
          'One clear H1 and a logical heading structure',
          'A dedicated page for each core service',
          'Internal links between related services',
          'Descriptive image alt text',
        ],
      },
      {
        title: 'Local SEO',
        items: [
          'Local business structured data: name, address, phone, hours, and service area',
          'Business details that match your Google Business Profile exactly',
          'Service-area wording written for real towns, without thin copy-paste city pages',
        ],
      },
      {
        title: 'AEO: answer engines',
        items: [
          'A plain, direct answer at the top of each page: what it is, what it costs, what’s included',
          'FAQ sections written around the questions customers actually ask',
          'FAQ structured data so answers can be read as answers',
        ],
      },
      {
        title: 'GEO: generative AI',
        items: [
          'AI search crawlers allowed in robots.txt',
          'An llms.txt file that summarizes your business for AI tools',
          'Machine-readable content on every page',
          'Consistent facts about your business wherever AI looks',
        ],
      },
      {
        title: 'Measurement',
        items: [
          'Conversion tracking so you know which pages produce calls and forms',
          'An AI visibility report at your free consultation, so you can see where you stand before we start',
        ],
      },
    ],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Get You Found, Step by Step',
    steps: [
      {
        title: 'Free consultation & AI visibility report',
        body: 'We check how you show up today on Google, ChatGPT, and Perplexity, and hand you the report along with a custom homepage mockup. Both are yours to keep.',
      },
      {
        title: 'Search & page map',
        body: 'We map the searches that actually bring you paying work (your services, your towns, the questions people ask) and give each one a page with a clear job.',
      },
      {
        title: 'Build with SEO baked in',
        body: 'Structured data, headings, direct answers, FAQs, and internal links go in while the site is built, not bolted on after launch.',
      },
      {
        title: 'Launch checklist',
        body: 'Redirects tested, sitemap submitted, search engines notified through IndexNow, structured data validated, and AI crawlers confirmed allowed.',
      },
      {
        title: 'Let it compound',
        body: 'Rankings take real time and vary by market and competition. We won’t promise a date. We build every page to compete for the top spot from day one.',
      },
    ],
  },
  comparison: {
    eyebrow: 'Side by Side',
    heading: 'How Our SEO Compares',
    rows: [
      { label: 'How it’s sold', typical: 'A separate SEO package', axeon: 'Included in every build' },
      { label: 'AI answers', typical: 'Rarely covered', axeon: 'AEO and GEO built in' },
      { label: 'Structured data', typical: 'Whatever a plugin adds by default', axeon: 'Local business and FAQ schema written for your business' },
      { label: 'City pages', typical: 'Dozens of copy-paste town pages', axeon: 'Only pages with something real to say' },
      { label: 'Promises', typical: '“Page one guaranteed”', axeon: 'No fake guarantees and no made-up dates' },
      { label: 'Redesigns', typical: 'Old URLs break and rankings reset', axeon: 'Every old URL mapped and 301-redirected' },
    ],
  },
  proof: {
    heading: 'Page 2 to #1 on Google for “Pleasant Hill Auto Detailing”',
    body: 'A-1 Auto Detailing was stuck on page 2. We rebuilt the site with search designed in from the start: redirects, schema, AI crawler access, and speed. A-1 now ranks #1 for its main local search.',
    facts: [
      '#1 on Google for “Pleasant Hill auto detailing,” up from page 2',
      'A perfect 100/100 SEO audit score',
      'About 56 old URLs 301-redirected so existing search value carried over',
      'AI search crawlers allowed in robots.txt, plus an llms.txt file',
      'FAQ and local business schema',
      'IndexNow set up for fast re-crawls',
      'Page loads of roughly 0.3–0.8 seconds',
    ],
  },
  faqs: [
    {
      question: 'Will my SEO get a specific ranking date or guarantee?',
      answer:
        'No. Search rankings take real time and vary by market, so we won’t promise a date. Every build is optimized to compete for the top spot, and we’re upfront that timelines vary by industry and market.',
    },
    {
      question: 'What’s the difference between SEO, AEO, and GEO?',
      answer:
        'SEO gets your pages ranking in regular search results. AEO (answer engine optimization) structures your content so Google’s AI answers and voice assistants can pull a direct answer from it. GEO (generative engine optimization) makes sure tools like ChatGPT, Perplexity, and Gemini can read, trust, and cite your business.',
    },
    {
      question: 'Is AEO/GEO an extra cost on top of SEO?',
      answer: 'No. SEO, AEO, and GEO are bundled into every Axeon Studio build by default, not sold as separate add-ons.',
    },
    {
      question: 'Do I need a separate SEO contract?',
      answer: 'No. It’s included in both plans, Essentials and AxeonCORE.',
    },
    {
      question: 'How do I know if ChatGPT can see my business?',
      answer:
        'Book a free consultation. It includes an AI visibility report showing how you appear on Google, ChatGPT, and Perplexity today, and it’s yours to keep.',
    },
    {
      question: 'Do you build a page for every town I serve?',
      answer:
        'Only when there’s something unique to put on it, like photos, reviews, or projects from that town. Pages that only swap the city name are thin content, and Google and AI tools treat them that way.',
    },
    {
      question: 'What is llms.txt?',
      answer:
        'A plain-text file at the root of your site that summarizes who you are, what you offer, and where, in a format AI tools can read easily. We add one to every build.',
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
    intro: 'The lead usually isn’t lost because of price. It’s lost because nobody answered while the customer was still interested.',
    items: [
      {
        title: 'Calls go to voicemail while you’re working',
        body: 'You’re on a job, with a client, or under a car. The caller doesn’t leave a message. They call the next business on the list.',
      },
      {
        title: 'After-hours visitors just leave',
        body: 'Someone finds your site at 10 p.m., has a question, and gets no answer. By morning they’ve booked with whoever responded first.',
      },
      {
        title: 'Phone tag to book one appointment',
        body: '“Does Tuesday work?” “How about Thursday?” Every back-and-forth text is another chance for the lead to go cold.',
      },
      {
        title: 'Chatbots that frustrate people',
        body: 'Most website chat widgets are a menu of buttons or a form in disguise. They collect an email and do nothing, and visitors can tell.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What’s Included',
    heading: 'What the AI Actually Does for You',
    intro: 'AI chat and online scheduling are included in AxeonCORE ($5,800 setup), set up around your business. An AI receptionist that picks up your phone calls around the clock is an AxeonCORE add-on, scoped on your strategy call.',
    groups: [
      {
        title: 'Answers questions',
        items: [
          '24/7 chat on your website',
          'Set up with your real services, prices, hours, and service area',
          'Holds a natural conversation instead of a button menu',
        ],
      },
      {
        title: 'Books appointments',
        items: [
          'Online scheduling connected to your real calendar',
          'Qualified leads book themselves straight onto your schedule',
          'No back-and-forth texts to lock in a time',
        ],
      },
      {
        title: 'Qualifies leads',
        items: [
          'Multi-step intake questionnaire that pre-qualifies leads before you ever call',
          'Captures the details you need to quote: the job, the timing, the location',
        ],
      },
      {
        title: 'Follows up',
        items: [
          'Automated SMS & email follow-up the second a lead comes in',
          'Missed-call text-back, so a caller who can’t reach you gets a text right away',
          'Instant alerts to your inbox and phone',
        ],
      },
      {
        title: 'Feeds your pipeline',
        items: [
          'Every conversation lands in your Custom CRM Pipeline',
          'One place to see every lead, not another vendor dashboard',
        ],
      },
      {
        title: 'Built into your site',
        items: [
          'Designed to match your website, not a generic widget',
          'Works on phones as well as desktops',
          'No separate per-seat chat subscription',
        ],
      },
    ],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Set It Up',
    steps: [
      CONSULTATION_STEP,
      {
        title: 'Map your conversations',
        body: 'We write down what customers actually ask you, what you charge, what makes a job a good fit, and what you need to know before you quote.',
      },
      {
        title: 'Configure & connect',
        body: 'We set the AI up with your answers, connect it to your calendar, and build the intake questions and follow-up messages.',
      },
      {
        title: 'Test with real scenarios',
        body: 'We run it through the questions, edge cases, and bookings your business actually gets before a single customer sees it.',
      },
      {
        title: 'Launch & review',
        body: 'It goes live on your site, and every conversation flows into your pipeline. We review the early conversations with you and adjust answers where needed.',
      },
    ],
  },
  comparison: {
    eyebrow: 'Side by Side',
    heading: 'How It Compares to a Typical Chat Widget',
    rows: [
      { label: 'Conversation', typical: 'Scripted menus and canned replies', axeon: 'Natural conversation using your real info' },
      { label: 'Result', typical: 'Collects an email and waits', axeon: 'Books qualified leads onto your calendar' },
      { label: 'Qualification', typical: 'None, so every lead looks the same', axeon: 'A multi-step intake that pre-qualifies' },
      { label: 'Follow-up', typical: 'Manual, when someone remembers', axeon: 'Automatic SMS and email the second a lead comes in' },
      { label: 'Where leads go', typical: 'A separate vendor dashboard', axeon: 'Your Custom CRM Pipeline' },
      { label: 'Cost structure', typical: 'Another per-seat subscription', axeon: 'Included in the AxeonCORE build' },
    ],
  },
  faqs: [
    {
      question: 'Will it sound like a robot?',
      answer:
        'Listen for yourself above. That’s a real recorded call from Axeon’s AI receptionist next to a typical agency’s, so you can judge the difference directly instead of taking our word for it.',
    },
    {
      question: 'Can it actually book appointments, or just answer questions?',
      answer:
        'It checks your real calendar and books qualified leads directly onto it. It’s not just a chatbot that collects an email and passes it along.',
    },
    {
      question: 'Does this replace my front desk?',
      answer:
        'It’s built to catch what would otherwise go to voicemail or a missed chat. Most clients use it as always-on backup and after-hours coverage, not a full front-desk replacement.',
    },
    {
      question: 'What if someone asks something it doesn’t know?',
      answer:
        'We set it up with your real services, prices, and policies. When a question falls outside that, it’s set up to take the person’s details and get them to you rather than guess.',
    },
    {
      question: 'Is AI chat included in Essentials?',
      answer:
        'No. AI chat and online scheduling are part of AxeonCORE ($5,800), along with the Custom CRM Pipeline, the pre-qualifying intake, and automated follow-up. Essentials includes instant lead alerts, so you still hear about every form and call request right away.',
    },
    {
      question: 'Where do the conversations go?',
      answer: 'Every conversation lands in your Custom CRM Pipeline, the same place as your calls and form fills, and you get an instant alert.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Lead Generation
// ---------------------------------------------------------------------------

export const leadGenDetail: SolutionDetail = {
  problem: {
    eyebrow: 'Where Leads Go Missing',
    heading: 'Most Businesses Don’t Need More Leads First',
    intro: 'They need to stop losing the ones they already get. These are the leaks we see most.',
    items: [
      {
        title: 'Slow first response',
        body: 'A lead reaches out, and nobody replies until the end of the day. By then they’ve talked to two competitors.',
      },
      {
        title: 'Leads scattered across apps',
        body: 'Calls on your cell, forms in one inbox, chats in another tool, and texts on your personal phone. Something always slips.',
      },
      {
        title: 'No follow-up after the first touch',
        body: 'A quote goes out and nobody checks back. A lot of work is won on the second or third contact, and most businesses never make it.',
      },
      {
        title: 'Every lead treated the same',
        body: 'Tire-kickers and ready-to-buy customers get the same callback, so your best leads wait behind your worst.',
      },
      {
        title: 'No idea what’s working',
        body: 'Without tracking, you can’t tell which page, service, or channel brings in the calls that turn into jobs.',
      },
      {
        title: 'A stack of subscriptions',
        body: 'A CRM, a form tool, a scheduler, a texting app, each with its own login and per-seat price, and none of them talking to each other.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What’s Included',
    heading: 'The Full Lead System, Piece by Piece',
    intro:
      'Every build includes instant lead alerts and conversion tracking. The full system below comes with AxeonCORE ($5,800).',
    groups: [
      {
        title: 'Capture',
        note: 'Every build',
        items: [
          'Quote and contact forms placed where visitors decide',
          'Tap-to-call on mobile',
          'Instant lead alerts to your inbox and phone',
          'Conversion tracking so you know which pages produce calls',
        ],
      },
      {
        title: 'Qualify',
        note: 'AxeonCORE',
        items: [
          'Multi-step intake questionnaire that pre-qualifies leads before you call',
          'Service pre-select, so you know what the lead wants before you pick up',
        ],
      },
      {
        title: 'Follow up',
        note: 'AxeonCORE',
        items: [
          'Automated SMS & email follow-up the second a lead comes in',
          'Messages written in your voice for your services',
          'Speed-to-lead call connect: when a form comes in, your phone rings and connects you to that lead while they’re still on your site',
          'Missed-call text-back: anyone who calls and can’t reach you gets an instant text',
        ],
      },
      {
        title: 'Book',
        note: 'AxeonCORE',
        items: ['AI chat & online scheduling so leads book themselves 24/7', 'Appointments go straight onto your calendar'],
      },
      {
        title: 'Track',
        note: 'AxeonCORE',
        items: [
          'Custom CRM Pipeline built around your lead-to-close workflow',
          'Every call, form, chat, and booking in one place',
          'Stages that match how you actually sell, from new lead to booked to won',
          'Call tracking numbers that show which pages and listings make your phone ring',
          'Exit-intent offers matched to the service a visitor was looking at',
        ],
      },
      {
        title: 'Own',
        items: [
          'No per-seat CRM software stacked on top',
          'One team to call instead of a vendor for every tool',
        ],
      },
    ],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Set Up Your Lead Pipeline',
    steps: [
      CONSULTATION_STEP,
      {
        title: 'Map your lead-to-close process',
        body: 'Where leads come from today, what you ask them, how you quote, and what “won” means for your business. The pipeline gets built around that, not a generic template.',
      },
      {
        title: 'Build intake & stages',
        body: 'We build the pre-qualifying questions, the pipeline stages, and the forms and booking flow on your site.',
      },
      {
        title: 'Write the follow-up',
        body: 'We write the automated texts and emails that go out the moment a lead arrives, in your voice and for your services.',
      },
      {
        title: 'Test end to end',
        body: 'We submit real test leads through every channel and confirm each one lands in the pipeline, triggers an alert, and gets its follow-up.',
      },
      {
        title: 'Launch',
        body: 'The system goes live with your site. From then on, every lead is captured, followed up, and tracked automatically.',
      },
    ],
  },
  comparison: {
    eyebrow: 'Side by Side',
    heading: 'One Pipeline vs. a Vendor Stack',
    rows: [
      { label: 'Where leads live', typical: 'Spread across several apps and inboxes', axeon: 'One Custom CRM Pipeline' },
      { label: 'First response', typical: 'Whenever someone checks', axeon: 'Your phone rings and connects you to the lead, plus automatic SMS and email' },
      { label: 'Missed calls', typical: 'Voicemail, and the caller moves on', axeon: 'An instant text back to every missed caller' },
      { label: 'Qualification', typical: 'A phone call to find out', axeon: 'A multi-step intake before you ever call' },
      { label: 'Software cost', typical: 'Per-seat subscriptions for each tool', axeon: 'No per-seat CRM software' },
      { label: 'Setup', typical: 'Off-the-shelf stages that don’t fit', axeon: 'Built around your workflow' },
      { label: 'Support', typical: 'A different vendor for each tool', axeon: 'One team' },
    ],
  },
  proof: {
    heading: '“Getting Lots of Leads”',
    body: 'A-1 Auto Detailing’s old site made customers dig for a way to book. The rebuild puts the next step in front of every visitor, and the owner’s verdict was: “…Whatever you have been doing, it’s working. Getting lots of leads.”',
    facts: [
      '#1 on Google for “Pleasant Hill auto detailing,” up from page 2',
      'Quote and booking form with service pre-select',
      'Tap-to-call on every page',
      'Published starting prices, so leads arrive already knowing the range',
      '180+ five-star Google reviews, now shown where it helps people decide',
    ],
  },
  faqs: [
    {
      question: 'Do you run Google or Facebook ads?',
      answer:
        'Yes, as a separate service. This service is about capturing, qualifying, and following up on every lead, including the ones your ads bring in, so fewer of them slip away. See our Advertising page for Google Ads and Meta Ads.',
    },
    {
      question: 'Does this replace my existing CRM?',
      answer:
        'It replaces the need for a separate per-seat CRM subscription. Your Custom CRM Pipeline is built into your site and run by us, so you’re not paying for and managing another piece of software.',
    },
    {
      question: 'What counts as a lead in this system?',
      answer:
        'Every call, form fill, chat, and text. Anything that comes in through your site or listed number goes into the same pipeline instead of being scattered across different tools.',
    },
    {
      question: 'Do I still have to check it manually?',
      answer: 'No. Follow-up starts automatically the moment someone reaches out, so nothing waits on you to notice it.',
    },
    {
      question: 'What’s included in Essentials vs. AxeonCORE?',
      answer:
        'Essentials includes instant lead alerts to your inbox and phone, plus conversion tracking. AxeonCORE adds the full system: the Custom CRM Pipeline, the pre-qualifying intake, AI chat and scheduling, automated SMS and email follow-up, speed-to-lead call connect, missed-call text-back, exit-intent offers, and call tracking.',
    },
    {
      question: 'Can the pipeline match how my business already works?',
      answer:
        'Yes, that’s the point of it. We map how you get from first contact to a paid job, and build the stages, questions, and follow-up around that.',
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
    intro: 'People hire the business they trust, and they decide a lot of that from what they see before they read a word.',
    items: [
      {
        title: 'Stock photos that could be anyone',
        body: 'A smiling model in a hard hat tells a customer nothing about you. They’ve seen the same photo on three other sites.',
      },
      {
        title: 'Phone photos that undersell the work',
        body: 'Your work is good, but bad lighting and awkward angles make it look ordinary.',
      },
      {
        title: 'One long video nobody finishes',
        body: 'A four-minute brand video on the about page doesn’t get watched. Short cuts in the right places do.',
      },
      {
        title: 'Content that doesn’t fit where it runs',
        body: 'A horizontal video forced into a vertical feed, or a photo cropped badly on a phone. The content has to be shot for where it’ll be used.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What’s Included',
    heading: 'What One Half-Day Shoot Gets You',
    intro: 'Included in AxeonCORE ($5,800), or added to an Essentials build for $1,500.',
    groups: [
      {
        title: 'The shoot',
        items: [
          'A half-day on-site shoot at your location',
          'Your team, your space, and your work, never stock footage',
          'Planned before we arrive, so nothing important gets missed',
        ],
      },
      {
        title: 'Video',
        items: [
          'A hero film cut for your website',
          '3 vertical cuts sized for social and ads',
        ],
      },
      {
        title: 'Photography',
        items: [
          'A photo set for your website and profiles',
          'Shot to fit the pages and placements where it will run',
        ],
      },
      {
        title: 'Built into your site',
        items: [
          'Placed on your homepage, service pages, and about page as part of the build',
          'Compressed so real footage doesn’t slow the site down',
        ],
      },
      {
        title: 'One team',
        items: [
          'The same team that builds your website plans the shoot',
          'No separate vendor to hire, brief, or manage',
        ],
      },
    ],
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How a Shoot Comes Together',
    steps: [
      CONSULTATION_STEP,
      {
        title: 'Plan the shoot',
        body: 'We decide what needs to be on camera: the work you’re proudest of, the people customers will meet, and the moments that make you different. Then we build a shot list around your pages.',
      },
      {
        title: 'Schedule around your day',
        body: 'We pick a half-day that works around your jobs and customers, so the shoot doesn’t shut the business down.',
      },
      {
        title: 'Shoot on-site',
        body: 'We come to you and capture your team, your space, and your work.',
      },
      {
        title: 'Edit & deliver',
        body: 'You get the hero film, 3 vertical cuts, and a photo set, and we build them into your website.',
      },
    ],
  },
  comparison: {
    eyebrow: 'Side by Side',
    heading: 'How It Compares',
    rows: [
      { label: 'Footage', typical: 'Stock photos and generic b-roll', axeon: 'Your team, your space, and your work' },
      { label: 'Vendor', typical: 'A separate videographer to brief', axeon: 'The same team building your site' },
      { label: 'Formats', typical: 'One long video to repurpose yourself', axeon: 'A hero film, 3 vertical cuts, and a photo set' },
      { label: 'On the site', typical: 'Handed over as files', axeon: 'Built into your pages' },
      { label: 'Price', typical: 'A separate quote', axeon: 'Included in AxeonCORE, or $1,500 on Essentials' },
    ],
  },
  faqs: [
    {
      question: 'What exactly do I get from the shoot?',
      answer:
        'A half-day on-site shoot at your location. You get a hero film cut for your website, three vertical cuts sized for social and ads, and a photo set for your site and profiles.',
    },
    {
      question: 'Can I see examples of your work?',
      answer:
        'Yes. See the A-1 Auto Detailing case study for a full before-and-after, and our Work page for recent homepages. On your strategy call we’ll walk through exactly what a shoot would look like for your business.',
    },
    {
      question: 'Is this a separate contract from my website?',
      answer:
        'No. It’s included in AxeonCORE, or added to an Essentials build for $1,500. You don’t hire a separate vendor or manage another handoff.',
    },
    {
      question: 'Is the $1,500 add-on or AxeonCORE the better deal?',
      answer:
        'If you want the video, AxeonCORE is usually the better value. It’s $1,500 more than Essentials plus the add-on, and it also includes the Custom CRM Pipeline, AI chat and scheduling, the pre-qualifying intake, and automated follow-up.',
    },
    {
      question: 'Do I need to prepare anything?',
      answer:
        'Just tidy the space you want on camera and let the people who will appear know ahead of time. We plan the shot list with you beforehand, so you’ll know what we’re capturing.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Advertising (Google Ads + Meta Ads)
// ---------------------------------------------------------------------------

export const advertisingDetail: SolutionDetail = {
  problem: {
    eyebrow: 'Where Ad Budgets Leak',
    heading: 'Most Local Ad Spend Is Wasted Before Anyone Clicks',
    intro: 'Ads aren’t the hard part. Running them so every dollar can be traced to a call or a booking is.',
    items: [
      {
        title: 'Boosted posts instead of campaigns',
        body: 'Hitting “Boost” reaches people who like pictures, not people who need your service this week.',
      },
      {
        title: 'Broad keywords burning the budget',
        body: 'Without negative keywords and tight targeting, you pay for clicks from job seekers, DIYers, and people three states away.',
      },
      {
        title: 'Clicks sent to the homepage',
        body: 'Someone searches for one specific service and lands on a generic page. They hit back and call the next ad.',
      },
      {
        title: 'No conversion tracking',
        body: 'The dashboard shows clicks and impressions, but nobody can tell you which ads produced calls, forms, or booked jobs.',
      },
      {
        title: 'Leads that nobody answers',
        body: 'You paid for the click, the form comes in, and it sits until the end of the day. By then they’ve booked someone else.',
      },
      {
        title: 'Set it and forget it',
        body: 'Campaigns launched once and never touched again. Costs creep up while the same tired ads keep running.',
      },
    ],
  },
  deliverables: {
    eyebrow: 'What’s Included',
    heading: 'Google and Meta, Run Like a System',
    intro:
      'Ads work best when they send people to a site built to convert and a pipeline that follows up instantly. That’s the part most ad agencies can’t offer.',
    groups: [
      {
        title: 'Google Ads',
        items: [
          'Search campaigns built around the services you actually want more of',
          'Keyword research, negative keywords, and service-area targeting',
          'Ad copy written for high-intent local searches',
          'Call assets so mobile searchers can tap to call straight from the ad',
        ],
      },
      {
        title: 'Meta Ads',
        items: [
          'Facebook and Instagram campaigns aimed at your service area',
          'Audience setup, including retargeting people who already visited your site',
          'Lead forms and offers matched to each service',
          'Creative cut for Reels, Stories, and the feed',
        ],
      },
      {
        title: 'Landing pages',
        items: [
          'Every ad points to a page about that specific service, not your homepage',
          'Fast, mobile-first pages with one clear next step',
          'Forms, tap-to-call, and booking placed where people decide',
        ],
      },
      {
        title: 'Tracking',
        items: [
          'Conversion tracking for calls, forms, chats, and bookings',
          'Call tracking numbers that show which campaigns make your phone ring',
          'Reporting in plain English: what you spent and what it produced',
        ],
      },
      {
        title: 'Creative',
        items: [
          'Ad copy and static creative for every campaign',
          'Video from an Axeon shoot, cut into vertical formats sized for ads',
        ],
      },
      {
        title: 'Optimization',
        items: [
          'Ongoing bid, budget, and keyword adjustments based on real conversions',
          'New ad variations tested against what’s already working',
          'Budget moved toward the campaigns that produce booked work',
        ],
      },
    ],
    footnote:
      'Pair ads with AxeonCORE and every paid lead lands in your Custom CRM Pipeline with instant follow-up, speed-to-lead call connect, and missed-call text-back.',
  },
  timeline: {
    eyebrow: 'How It Works',
    heading: 'How We Launch Your Campaigns',
    steps: [
      CONSULTATION_STEP,
      {
        title: 'Audit & strategy',
        body: 'If you’ve run ads before, we audit the accounts. Then we pick the services, service area, and channels worth paying for, and set a budget that fits.',
      },
      {
        title: 'Tracking first',
        body: 'Conversion tracking and call tracking go in before a single dollar is spent, so every result can be traced to a campaign.',
      },
      {
        title: 'Build campaigns & pages',
        body: 'We build the campaigns, write the ads, and make sure each one points to a landing page about that specific service.',
      },
      {
        title: 'Launch',
        body: 'Campaigns go live, and every lead flows into the same place as the rest of your leads.',
      },
      {
        title: 'Optimize & report',
        body: 'We keep adjusting targeting, keywords, and creative based on what produces calls and bookings, and report back in plain English.',
      },
    ],
  },
  comparison: {
    eyebrow: 'Side by Side',
    heading: 'Axeon vs. a Typical Ad Agency',
    rows: [
      { label: 'Where clicks go', typical: 'Your homepage', axeon: 'A landing page for that exact service' },
      { label: 'Tracking', typical: 'Clicks and impressions', axeon: 'Calls, forms, chats, and bookings' },
      { label: 'Lead follow-up', typical: 'Not their problem', axeon: 'Instant follow-up through your pipeline with AxeonCORE' },
      { label: 'Channels', typical: 'Google or Meta, rarely both', axeon: 'Google and Meta under one team' },
      { label: 'Creative', typical: 'Stock photos', axeon: 'Your own video and photos' },
      { label: 'Reporting', typical: 'A PDF full of jargon', axeon: 'Spend in, results out, in plain English' },
      { label: 'Website & ads', typical: 'Two vendors blaming each other', axeon: 'One team that owns both' },
    ],
  },
  faqs: [
    {
      question: 'Do you manage both Google Ads and Meta Ads?',
      answer:
        'Yes. We run Google Search campaigns and Facebook and Instagram campaigns, and we recommend the mix based on how your customers actually look for you.',
    },
    {
      question: 'Do I need a new website to run ads with you?',
      answer:
        'Not necessarily. Ads work best when they point to fast, service-specific landing pages, so we’ll look at your current site on the strategy call and tell you honestly whether it can convert paid traffic.',
    },
    {
      question: 'How much should I spend on ads?',
      answer:
        'It depends on your market, your services, and how much work you can take on. We’ll recommend a starting budget on your strategy call, based on your goals rather than a one-size-fits-all number.',
    },
    {
      question: 'How do I know the ads are working?',
      answer:
        'Conversion tracking and call tracking go in before launch, so you’ll see which campaigns produced calls, forms, and bookings, not just clicks.',
    },
    {
      question: 'Do you run Local Services Ads?',
      answer:
        'Not at this time. We focus on Google Search campaigns and Meta (Facebook and Instagram) campaigns.',
    },
  ],
};
