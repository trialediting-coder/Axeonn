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
        'If nobody picks up, they get a text from your practice within 60 seconds, 24/7. It asks what kind of visit they want and offers a time, so a new-patient exam or an implant or Invisalign consult gets booked instead of lost to voicemail.',
    },
    {
      question: 'Does the intake collect any health or insurance information?',
      answer:
        'No. Intake collects name, contact, service and preferred time only. Never symptoms, insurance or health details. Anything clinical stays in your practice management software and your front desk. Is it HIPAA compliant? Because intake never asks for health details, no protected health information is meant to flow through Axeon, and Axeon isn’t your business associate unless we sign a separate business associate agreement (BAA). If a patient volunteers health details by text anyway, your team moves that conversation into your practice software.',
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
        'Within 60 seconds, any hour. The reply asks which treatment they are interested in and offers a consultation time, so they book with you before they keep shopping around.',
    },
    {
      question: 'Can my front desk follow up on treatment plans and memberships?',
      answer:
        'Yes. Every conversation lands in a two-way text inbox, so your team can check in after a consult, answer questions about a plan or membership, and see the whole thread in one place.',
    },
    {
      question: 'Does the intake collect any health information?',
      answer:
        'No. Intake collects name, contact, service and preferred time only. Never symptoms, medical history or health details. Is it HIPAA compliant? Because intake never asks for health details, no protected health information is meant to flow through Axeon, and Axeon isn’t your business associate unless we sign a separate business associate agreement (BAA). If a patient volunteers health details by text anyway, your team moves that conversation into your practice software.',
    },
  ],
  'law-firms': [
    {
      question: 'Does the automated reply give legal advice or create an attorney-client relationship?',
      answer:
        'No. The first reply only acknowledges the inquiry and offers a consultation time. It collects name, contact and the type of matter, never case facts, so your team can run a conflict check before anything confidential is shared.',
    },
    {
      question: 'How do you handle attorney advertising rules?',
      answer:
        'Site copy is written with attorney advertising rules in mind: no promised outcomes, no results-based claims, and you approve every word before launch. Review requests only go out when you decide a matter allows it.',
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
        'When your staff cannot pick up, the caller gets a text from your firm within 60 seconds. Intake asks whether they need tax prep, bookkeeping or advisory work, so the bigger engagements do not get buried under routine questions.',
    },
    {
      question: 'Does the intake collect tax documents or financial details?',
      answer:
        'No. It collects name, contact, the service they need and a preferred time. Documents and financial details stay in your own portal and process.',
    },
  ],
};
