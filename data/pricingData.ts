export interface PricingTier {
  id: string;
  name: string;
  focus: string;
  price: string;
  billingNote: string;
  turnaround: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface AddOn {
  name: string;
  price: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'core-web-build',
    name: 'Core Web Build',
    focus: 'Pure frontend speed, conversion UI, lead capture',
    price: '$2,800',
    billingNote: 'One-time build',
    turnaround: '7 Business Day Turnaround',
    features: [
      'Up to 4 custom responsive pages (Tailwind/modern frontend)',
      'Sub-second load speeds & 100% Core Web Vitals pass',
      'Technical SEO & foundational ADA accessibility standards',
      'Direct inbox & webhook lead routing',
      'First 30 days of AxeonCORE included',
    ],
    cta: 'Book Core Build',
  },
  {
    id: 'full-acquisition-engine',
    name: 'Acquisition Engine',
    focus: 'Full conversion site + custom intake pipeline & SMS/email automations',
    price: '$4,800',
    billingNote: 'One-time build',
    turnaround: '14 Business Day Turnaround',
    features: [
      'Complete 5–7 page custom conversion architecture',
      'Built-in Custom CRM Pipeline tailored to your lead-to-close workflow (no per-seat monthly software fees)',
      'Automated instant SMS & email lead notifications',
      'Interactive multi-step intake questionnaire / scheduling engine',
      'Conversion copy hierarchy & tracking events configured',
      'First 30 days of AxeonCORE included',
    ],
    cta: 'Book Acquisition Engine',
  },
  {
    id: 'axeoncore',
    name: 'AxeonCORE',
    focus: 'Uptime, hosting, reviews, social media, and monthly design/intake tweaks',
    price: '$490/month',
    billingNote: 'Recurring partnership',
    turnaround: 'Ongoing — an in-house technical web & pipeline director on demand',
    featured: true,
    features: [
      'Enterprise managed hosting, SSL, and daily off-site backups',
      'Dedicated Custom CRM Database maintenance, uptime checks, and API health monitoring',
      'Up to 4 hours of dedicated custom design, page updates, or conversion testing per month',
      'Monthly Core Web Vitals and SEO performance audit',
      'Ongoing review generation and reputation management across Google and industry platforms',
      'Social media content and posting management across your core channels',
      'Priority 24-hour asynchronous support via dedicated Slack/Loom channel',
      'Continuous CRO tweaks based on user traffic and intake completion rates',
    ],
    cta: 'Join AxeonCORE',
  },
];

export const retainerTagline =
  'Run your entire digital intake and web operation on autopilot for less than a part-time receptionist.';

export const addOns: AddOn[] = [
  { name: 'Additional Custom Page Build', price: '+$450 / page' },
  { name: 'Advanced Database/Directory Integration', price: '+$850' },
  { name: 'Secondary Niche Landing Page Variant', price: '+$500' },
];

export interface PricingFaq {
  q: string;
  a: string;
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: 'Why flat pricing instead of hourly billing?',
    a: 'Hourly billing rewards slow work and makes budgeting a guessing game. A fixed price means you know the exact cost before we start, and we\'re incentivized to ship fast and move on to the next milestone, not pad the clock.',
  },
  {
    q: 'Why is there a monthly retainer instead of just a one-time price?',
    a: 'A website is never really "finished" — search algorithms shift, your CRM Pipeline needs monitoring, and a business that\'s growing needs its systems to keep up. We could hand you the files and disappear, but that\'s not the kind of company we\'re building. AxeonCORE is how we stay your long-term technology partner — the team you call for every web, intake, and IT need going forward — instead of a vendor you hire once and never hear from again. It\'s completely optional after your first 30 days free; most clients keep it because it\'s genuinely less hassle and less cost than managing hosting, updates, and CRM upkeep on their own.',
  },
  {
    q: 'What happens after the first 30 days of included retainer?',
    a: 'Both build tiers include your first 30 days of AxeonCORE at no extra cost, so your site has a dedicated owner from day one. After that, you can continue month-to-month at the standard rate or take the finished site and walk away with no lock-in.',
  },
  {
    q: 'Can I start with a one-time build and add the retainer later?',
    a: 'Yes. Most clients start with Core Web Build or Acquisition Engine, then move onto AxeonCORE once they see how much time it saves not managing hosting, updates, and CRM upkeep themselves.',
  },
  {
    q: 'What if I need more than what a tier includes?',
    a: 'That\'s what the add-ons above are for — additional pages, deeper database/directory integrations, and niche landing page variants can all be added to any tier without re-negotiating the whole engagement. Reviews and social media management are already included in AxeonCORE, not sold as separate add-ons.',
  },
  {
    q: 'What if I don\'t like the initial design?',
    a: 'Every one-time build (Core Web Build and Acquisition Engine) includes 2 rounds of revisions before launch, at no extra cost. We don\'t consider a project finished until the design is one you\'re proud to put your name on.',
  },
];

export const revisionGuarantee = '2-Round Revision Guarantee — included with every build';
