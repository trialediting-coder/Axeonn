export interface NicheFaqItem {
  question: string;
  answer: string;
}

// 2 niche-specific FAQ items per niche, prepended to the generic sitewide
// FAQ (data/faqData.ts) on each /solutions/[slug] page. Every answer is
// paraphrased directly from that niche's own real painPoints/intakeWorkflowSteps
// in data/nichesData.ts — no new facts introduced.
export const nicheFaqData: Record<string, NicheFaqItem[]> = {
  dental: [
    {
      question: 'What happens when a patient needs an emergency appointment?',
      answer:
        'Symptom-based intake flags emergency vs. routine requests automatically, and emergency requests route into a same-day booking queue instead of sitting in a general inbox.',
    },
    {
      question: 'Does this handle insurance verification too?',
      answer:
        "Yes — the Custom CRM Pipeline sends an automated insurance pre-verification request as soon as an appointment is confirmed.",
    },
  ],
  'med-spa': [
    {
      question: 'How does this handle different treatment interests?',
      answer:
        'The consult request form segments leads by treatment interest — injectables, laser, body contouring — so follow-up and pricing context match what they actually asked about.',
    },
    {
      question: 'Can it help with membership signups?',
      answer:
        'Yes — membership tier options are presented before the consult even happens, and consult-to-treatment conversion is tracked by service line.',
    },
  ],
  hvac: [
    {
      question: 'What happens with after-hours emergency calls?',
      answer:
        'Emergency no-heat/no-cool requests are branched from routine maintenance at intake and routed directly into a dispatch queue with service-area matching — even at 2 AM.',
    },
    {
      question: 'Does it help fill seasonal tune-up bookings?',
      answer:
        'Yes — seasonal tune-up requests enroll into their own booking flow, and post-service follow-up automatically offers a maintenance plan enrollment.',
    },
  ],
  roofing: [
    {
      question: 'How does this handle storm-damage leads?',
      answer:
        'Storm inspection requests capture the address and damage photos upfront, and intake branches insurance-claim jobs from cash-pay jobs immediately.',
    },
    {
      question: "What if a bid doesn't get signed right away?",
      answer:
        "Automated follow-up chases outstanding bids automatically, so storm leads don't go cold while a homeowner is still deciding.",
    },
  ],
  'law-firms': [
    {
      question: 'How are case evaluations qualified before they reach an attorney?',
      answer:
        'A practice-area selector routes each inquiry to the right intake questionnaire, so an attorney sees the facts of the case before ever getting on a call.',
    },
    {
      question: 'Does this help track cases through to a signed retainer?',
      answer:
        'Yes — case-to-retainer conversion is tracked by practice area, with an automated conflict-check flag run at scheduling.',
    },
  ],
  accounting: [
    {
      question: 'How does this separate simple tax questions from bigger advisory leads?',
      answer:
        "Service-type intake separates tax prep, bookkeeping, and CFO-advisory requests upfront, so higher-value leads don't get buried during tax season.",
    },
    {
      question: 'What about document collection?',
      answer:
        'An automated document checklist is delivered based on the service selected, instead of collecting files over scattered email threads.',
    },
  ],
  'home-remodeling': [
    {
      question: 'How does this qualify budget before an in-home visit?',
      answer:
        'Project-type and budget-range intake filters serious jobs from tire-kickers before you ever drive to the site.',
    },
    {
      question: 'Does it help coordinate multiple trades?',
      answer:
        'Yes — the Custom CRM Pipeline schedules the estimate visit and assigns the right trade specialist automatically.',
    },
  ],
  'real-estate': [
    {
      question: 'How are buyer and seller leads handled differently?',
      answer:
        'Intake branches buyer inquiries from seller and valuation inquiries at the very first click, so each gets routed into the right pipeline.',
    },
    {
      question: 'What happens after a home valuation request?',
      answer:
        'It triggers an automated estimate and follow-up sequence immediately, instead of sitting until someone gets around to it.',
    },
  ],
  landscaping: [
    {
      question: 'How does this separate recurring maintenance from one-time jobs?',
      answer:
        "Intake branches recurring mow-and-maintenance requests from one-time hardscape and design bids, so they don't pile into the same generic inbox.",
    },
    {
      question: 'What happens during the spring rush?',
      answer:
        'Spring and fall surge requests route into a prioritized queue instead of overwhelming your phone lines.',
    },
  ],
  'auto-detailing': [
    {
      question: 'How do customers pick the right package?',
      answer:
        'A package/tier selector clarifies scope — wash, full detail, or ceramic coating — before booking, so there\'s no confusion at drop-off.',
    },
    {
      question: 'Does this handle mobile detailing too?',
      answer:
        'Yes — mobile vs. in-shop requests branch into the correct scheduling flow automatically.',
    },
  ],
};
