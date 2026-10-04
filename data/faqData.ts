export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Do you guarantee results?',
    answer:
      'Yes. Our 90-Day Customer Guarantee: More calls and leads in your first 90 days than you were getting before, or we keep working for free until you do. We set your baseline together on the kickoff call and track every call and form from day one. It applies while you\'re on your monthly plan and answering new leads within one business day.',
  },
  {
    question: "What if I'm too busy to answer every lead?",
    answer:
      'That\'s what AxeonCORE is built for. Speed-to-lead call connect rings your phone the moment a form comes in, missed-call text-back replies to anyone you can\'t pick up for, and automated follow-up keeps every lead warm until you can get to them. The guarantee does ask that new leads get a reply within one business day, and the system makes that easy.',
  },
  {
    question: 'How long does it take to launch?',
    answer:
      'Fast — a fraction of the time a typical agency takes. Timing mostly depends on how quickly we get your content.',
  },
  {
    question: 'Do I own my website?',
    answer:
      'Yes. Domains, content, and imagery are yours. If you ever decide to part ways, we hand over your site\'s files and assets so you can move to another provider without starting over.',
  },
  {
    question: 'Is there a contract, and how long is it?',
    answer:
      'Every plan is a one-time setup and then a monthly plan that keeps the customers coming. There\'s no multi-year lock-in, and every term is laid out clearly before you sign anything.',
  },
  {
    question: 'Do I get access to my own analytics?',
    answer:
      'Yes. You keep full access to your Google Analytics (GA4) — nothing is siloed behind our login only.',
  },
  {
    question: 'What if I already have a website?',
    answer:
      'We\'ll tell you on the call whether to rebuild or improve what you have; either way the goal is more calls.',
  },
  {
    question: 'How much does it cost to work with Axeon?',
    answer:
      'A one-time setup of $2,800 (Essentials) or $5,800 (AxeonCORE), then a monthly plan starting at $284 or $574. The final monthly amount depends on your market and what you want us to run, and we set it with you before you commit. We\'d rather be upfront about cost than make you book a call just to find out.',
  },
  {
    question: 'Which plan should I pick?',
    answer:
      'Essentials ($2,800 setup, then from $284/mo) gets you found and chosen: a site built to turn visitors into calls, plus Google and AI search visibility. AxeonCORE ($5,800 setup, then from $574/mo) adds the full lead system that gets you booked: CRM pipeline, AI chat & scheduling, automated follow-up, and on-site video. Not sure? We\'ll recommend one on the call.',
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
