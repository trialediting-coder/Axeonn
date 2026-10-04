export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Do you guarantee results?',
    answer:
      'Yes. Our 90-Day Customer Guarantee: if you\'re not getting more calls and leads in your first 90 days after launch than you were getting before, we keep working for free until you are. We set your baseline together on the kickoff call and track every call and form from day one. It applies while you\'re on your monthly plan and answering new leads within one business day.',
  },
  {
    question: 'How long does it take to launch?',
    answer:
      'Fast — most builds go live in a fraction of the time a typical agency takes. The exact timing depends on how quickly we get your content, brand assets, and any integration details (booking system, CRM, phone number) — the build itself moves efficiently because we work from a proven system, not a from-scratch design process.',
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
      'We can rebuild it from scratch on our infrastructure, or in some cases migrate your existing content into a cleaner, better-converting layout. We\'ll tell you honestly which approach fits your situation during your strategy call.',
  },
  {
    question: 'How much does it cost to work with Axeon?',
    answer:
      'A one-time setup of $2,800 (Essentials) or $5,800 (AxeonCORE), then a monthly plan starting at $284 or $574. The final monthly amount depends on your market and what you want us to run, and we set it with you before you commit. We\'d rather be upfront about cost than make you book a call just to find out.',
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
