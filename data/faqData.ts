export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'How long does it take to launch?',
    answer:
      'Most builds go live in 7–14 days from kickoff. The exact timeline depends on how quickly we get your content, brand assets, and any integration details (booking system, CRM, phone number) — the build itself moves efficiently because we work from a proven system, not a from-scratch design process.',
  },
  {
    question: 'Do I own my website?',
    answer:
      'Yes. Domains, content, and imagery are yours. If you ever decide to part ways, we hand over your site\'s files and assets so you can move to another provider without starting over.',
  },
  {
    question: 'Is there a contract, and how long is it?',
    answer:
      'We keep terms simple and transparent — no multi-year lock-in. Build pricing is published on our Pricing page, and every term is laid out clearly before you sign anything.',
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
      'It depends on your package and goals — see the Pricing page for exact numbers. We\'d rather be upfront about cost than make you book a call just to find out.',
  },
];
