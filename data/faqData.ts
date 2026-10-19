export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Do you guarantee results?',
    answer:
      "We guarantee the system works, not a number of patients. Our 90-day performance commitment: live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don't fix it within 15 days, you can walk away and owe nothing for the rest of the term. It comes with AxeonCORE and AxeonGROWTH and is written into your agreement.",
  },
  {
    question: "What if my front desk can't answer every call?",
    answer:
      "That's what AxeonCORE is built for. Anyone who calls and can't get through gets a text back within 60 seconds, any hour, with a link to book. Every web inquiry gets a first reply within 60 seconds too. Your front desk picks up the conversation from one two-way text inbox when they're free.",
  },
  {
    question: 'Do you collect patient health information?',
    answer:
      'No. Intake collects name, contact, service and preferred time only, never symptoms, insurance or health details.',
  },
  {
    question: 'How long does it take to launch?',
    answer:
      "Live within 30 days of getting your materials. That's part of the 90-day performance commitment, so it's in writing.",
  },
  {
    question: 'Do I own my website?',
    answer:
      'Your domain, Google Business Profile, and patient and client contact data are always yours. The website design and code become yours once the 12-month term is paid. The intake system, phone and text numbers, and AxeonPROOF are a service and stop if you leave.',
  },
  {
    question: 'Is there a contract, and how long is it?',
    answer:
      "Yes. AxeonCORE and AxeonGROWTH run on a 12-month agreement, and the setup fee is credited in full when you take it. After 12 months it continues month-to-month, and either side can stop with 30 days' notice. Prefer month-to-month from day one? Pay the $3,000 setup upfront instead.",
  },
  {
    question: 'Do I get access to my own analytics?',
    answer:
      'Yes. You keep full access to your Google Analytics (GA4), and AxeonPROOF shows every recovered call and inquiry live.',
  },
  {
    question: 'What if I already have a website?',
    answer:
      "The free after-hours audit looks at it first. We'll tell you straight whether to rebuild it or keep it and add the intake system around it.",
  },
  {
    question: 'How much does it cost to work with Axeon?',
    answer:
      'AxeonCORE is from $799/mo and AxeonGROWTH from $1,999/mo plus ad spend, on a 12-month agreement with the setup included. Month-to-month is available with the $3,000 setup paid upfront, and prepaying a year gets you 2 months free.',
  },
  {
    question: 'Which plan should I pick?',
    answer:
      'AxeonCORE (from $799/mo) if calls and web inquiries are slipping through: it answers every one within 60 seconds, books the consultation, and asks for a review after the visit. AxeonGROWTH (from $1,999/mo plus ad spend) adds Google Local Services and search ads, an AI phone receptionist, past-patient reactivation, and quarterly photo and video. Start with the free audit and we’ll recommend one.',
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
