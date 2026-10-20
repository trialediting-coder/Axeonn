export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Do you guarantee results?',
    answer:
      "We guarantee the system works, not a number of new patients, clients or cases. Our 90-day performance commitment: live within 30 days of getting your materials. Every missed call and web inquiry gets a reply within 60 seconds. Every completed appointment gets a review request. If we miss any of those in the first 90 days and don't fix it within 15 days, you can walk away and owe nothing for the rest of the term. It comes with AxeonCORE and AxeonGROWTH and is written into your agreement.",
  },
  {
    question: "What if my front desk or intake team can't answer every call?",
    answer:
      "That's what AxeonCORE is built for. Anyone who calls and can't get through gets a text back within 60 seconds, any hour, with a link to book. Every web inquiry gets a first reply within 60 seconds too. Your front desk or intake team picks up the conversation from one two-way text inbox when they're free. It covers the dental office at lunch, the med spa during treatments, the law firm while attorneys are in court, and the CPA firm buried in tax season.",
  },
  {
    question: 'Do you collect health, case or financial information?',
    answer:
      'No. Intake collects name, contact, service and preferred time only. For dental practices and med spas that means never symptoms, insurance or health details. For law firms it means no case facts, so your team can run a conflict check before anyone discusses the matter, and you approve every word on your site for your state’s attorney advertising rules. For CPA firms it means no Social Security numbers, tax documents or account details; those stay in your secure client portal. Is it HIPAA compliant? Because intake never asks for health details, no protected health information is meant to flow through Axeon, and Axeon isn’t your business associate unless we sign a separate business associate agreement (BAA). If a patient volunteers health details by text anyway, your team moves that conversation into your practice software.',
  },
  {
    question: 'Is this only for clinics, or for law and CPA firms too?',
    answer:
      'All four. The system is the same for dental practices, med spas, law firms and accounting and CPA firms: every missed call and web inquiry answered within 60 seconds, the consultation booked, and a review request after every completed appointment (for law firms, only on matters you approve). What changes is the wording and the booking: a new-patient exam, a med spa consult, an intake call or case review, a tax-season or advisory meeting.',
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
      "Yes. AxeonCORE and AxeonGROWTH run on a 12-month agreement. On it, setup is $0 (normally $3,000) and your first monthly payment is charged only once you're live. After 12 months it continues month-to-month, and either side can stop with 30 days' notice. Leaving before then without cause means the rest of the 12 months is still owed, unless we miss the 90-day performance commitment. Prefer month-to-month from day one? Pay the $3,000 build upfront instead.",
  },
  {
    question: 'Do I get access to my own analytics?',
    answer:
      'Yes. You keep full access to your Google Analytics (GA4), and AxeonPROOF shows every recovered call and inquiry live.',
  },
  {
    question: 'What if I already have a website?',
    answer:
      "We look at it first, on the call after you check your area. We'll tell you straight whether to rebuild it or keep it and add the intake system around it.",
  },
  {
    question: 'How much does it cost to work with Axeon?',
    answer:
      "$0 to start. Nothing due until it's working. AxeonCORE is from $799/mo and AxeonGROWTH from $1,999/mo plus ad spend, on a 12-month agreement: $0 setup (normally $3,000), and your first payment is charged once it's working, meaning your new site is live and every missed call and web inquiry gets a reply within 60 seconds, 24/7. Month-to-month is available with the $3,000 build paid upfront, and prepaying a year gets you 2 months free.",
  },
  {
    question: 'Which plan should I pick?',
    answer:
      'AxeonCORE (from $799/mo) if calls and web inquiries are slipping through: it answers every one within 60 seconds, books the consultation, and asks for a review after the visit. AxeonGROWTH (from $1,999/mo plus ad spend) adds Google Local Services and search ads, an AI phone receptionist, reactivation campaigns to past patients and clients, and quarterly photo and video. Check your area and we’ll recommend one on the call.',
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
