export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Do you guarantee results?',
    answer:
      "We guarantee the system, not a number of patients or cases. Live in 30 days, every inquiry answered in 60 seconds, a review request after every visit. Miss it and you can walk away.",
  },
  {
    question: "What if my front desk or intake team can't answer every call?",
    answer:
      "That's what AxeonCORE is for. Missed callers get a text with a booking link in 60 seconds, and your team picks up the thread when they're free.",
  },
  {
    question: 'Do you collect health, case or financial information?',
    answer:
      'No. Name, contact, service and preferred time only. Never health, case or tax details. Need a business associate agreement (BAA)? We sign one on request.',
  },
  {
    question: 'Is this only for clinics, or for law and CPA firms too?',
    answer:
      'All four. Same system for dental, med spa, law and CPA firms. Only the wording and what gets booked change.',
  },
  {
    question: 'How long does it take to launch?',
    answer:
      "Live within 30 days of getting your materials. That's part of the 90-day performance commitment, so it's in writing.",
  },
  {
    question: 'Do I own my website?',
    answer:
      'Your domain, Google profile and contact data are always yours. The site becomes yours once the 12-month term is paid.',
  },
  {
    question: 'Is there a contract, and how long is it?',
    answer:
      "Yes, 12 months, with $0 setup (normally $3,000) and the first payment when you're live. Then month-to-month. Want month-to-month from day one? Pay the $3,000 upfront.",
  },
  {
    question: 'Do I get access to my own analytics?',
    answer:
      'Yes. You keep full access to your Google Analytics (GA4), and AxeonPROOF shows every recovered call and inquiry live.',
  },
  {
    question: 'What if I already have a website?',
    answer:
      "We look at it on the call and tell you straight: rebuild it, or keep it and add intake around it.",
  },
  {
    question: 'How much does it cost to work with Axeon?',
    answer:
      "AxeonCORE is from $799/mo and AxeonGROWTH from $1,999/mo plus ad spend. $0 setup (normally $3,000), and nothing is due until it's working.",
  },
  {
    question: 'How much should a dental practice spend on marketing?',
    answer:
      'Start from what one new patient is worth over a year. AxeonCORE, from $799/mo, covers the website, local SEO and intake; ads are AxeonGROWTH, from $1,999/mo plus ad spend.',
  },
  {
    question: 'How much should a law firm spend on marketing?',
    answer:
      'Work back from what one signed case is worth. Most firms start with AxeonCORE, from $799/mo, and add ads with AxeonGROWTH once every inquiry is answered.',
  },
  {
    question: 'Which plan should I pick?',
    answer:
      'AxeonCORE if calls and inquiries slip through. AxeonGROWTH adds ads, an AI receptionist and past-patient campaigns. We recommend one on the call.',
  },
];

// Service pages already answer timing, ownership, and price in their own FAQs, so they
// only append the general questions they don't cover.
const SERVICE_PAGE_GENERAL = [
  'Is there a contract, and how long is it?',
  'Do I get access to my own analytics?',
  'What if I already have a website?',
];
export function withGeneralFaqs(own: FaqItem[], skip: string[] = []): FaqItem[] {
  const extra = faqItems.filter(
    (f) => SERVICE_PAGE_GENERAL.includes(f.question) && !skip.includes(f.question),
  );
  return [...own, ...extra];
}
