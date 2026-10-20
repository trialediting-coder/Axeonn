export interface NicheFaqItem {
  question: string;
  answer: string;
}

// 2-3 practice-specific FAQ items per practice type, shown first on
// /solutions/[slug] and /go/[slug]. Every answer sticks to what AxeonCORE
// really includes (content/brand-guardrails.md) and never promises a number
// of patients, clients, revenue or rankings.
export const nicheFaqData: Record<string, NicheFaqItem[]> = {
  dental: [
    {
      question: 'What happens when a new patient calls after hours?',
      answer:
        'They get a text from your practice within 60 seconds, 24/7, asking what visit they want and offering a time.',
    },
    {
      question: 'Does the intake collect any health or insurance information?',
      answer:
        'No. Name, contact, service and preferred time only. Anything clinical stays in your own software. Need a business associate agreement (BAA)? We sign one on request.',
    },
    {
      question: 'Do we have to replace Dentrix, Eaglesoft or Open Dental?',
      answer:
        'No. Axeon handles the first reply, the booking request and the review ask. Your practice management software stays exactly as it is.',
    },
  ],
  'med-spa': [
    {
      question: 'How fast does someone get an answer when they ask about a treatment at night?',
      answer:
        'Within 60 seconds, any hour, with a consultation time offered before they keep shopping.',
    },
    {
      question: 'Can my front desk follow up on treatment plans and memberships?',
      answer:
        'Yes. Every conversation lands in one two-way text inbox your team works from.',
    },
    {
      question: 'Does the intake collect any health information?',
      answer:
        'No. Name, contact, service and preferred time only. Need a business associate agreement (BAA)? We sign one on request.',
    },
  ],
  'law-firms': [
    {
      question: 'Does the automated reply give legal advice or create an attorney-client relationship?',
      answer:
        'No. It acknowledges the inquiry and offers a consult time. No case facts, so your conflict check comes first.',
    },
    {
      question: 'How do you handle attorney advertising rules?',
      answer:
        'No promised outcomes, and you approve every word before launch. Review requests go out only when you say so.',
    },
    {
      question: 'Do we have to switch from Clio or MyCase?',
      answer:
        'No. Axeon handles the first reply and the consultation booking. Your practice management software stays as it is.',
    },
  ],
  accounting: [
    {
      question: 'What happens to new-client calls during tax season?',
      answer:
        'They get a text from your firm within 60 seconds asking what they need, so big engagements don’t get buried.',
    },
    {
      question: 'Does the intake collect tax documents or financial details?',
      answer:
        'No. It collects name, contact, the service they need and a preferred time. Documents and financial details stay in your own portal and process.',
    },
  ],
};
