export interface NicheFaqItem {
  question: string;
  answer: string;
}

// 2 niche-specific FAQ items per niche, shown first on /solutions/[slug] and
// /go/[slug]. Every answer sticks to services Axeon really offers (see
// content/brand-guardrails.md): the lead-system pieces (AI chat, automatic
// follow-up, missed-call text-back, call connect, CRM pipeline) are AxeonCORE,
// so answers that rely on them say so.
export const nicheFaqData: Record<string, NicheFaqItem[]> = {
  dental: [
    {
      question: 'What happens when a patient needs an emergency appointment?',
      answer:
        'Your intake asks what the visit is for and flags emergencies, so you can fit them in same-day instead of finding them in a general inbox tomorrow.',
    },
    {
      question: 'What about patients who call after hours?',
      answer:
        'They can book online any time. On AxeonCORE, AI chat answers their questions and missed calls get a text back right away, so they are not lost to voicemail.',
    },
  ],
  'med-spa': [
    {
      question: 'How does this handle different treatment interests?',
      answer:
        'The consult request asks which treatment they want, such as injectables, laser, or body contouring, so you know what they came for before you call them back.',
    },
    {
      question: 'Can it cut down on consult no-shows?',
      answer:
        'Yes. On AxeonCORE, automatic text and email reminders go out before every consult, and your lead list shows which consults turned into treatments.',
    },
  ],
  hvac: [
    {
      question: 'What happens with after-hours emergency calls?',
      answer:
        'Your intake separates no-heat and no-cool emergencies from routine tune-ups. On AxeonCORE, missed calls get a text back right away, even at 2 AM, so the customer does not move on to the next company.',
    },
    {
      question: 'Does it help fill seasonal tune-up bookings?',
      answer:
        'Yes. Customers can book tune-ups online, and on AxeonCORE automatic follow-up invites past customers back before each season.',
    },
  ],
  roofing: [
    {
      question: 'How does this handle storm-damage leads?',
      answer:
        'The inspection request captures the address, damage photos, and whether it is an insurance claim, so you know what you are walking into before the visit.',
    },
    {
      question: "What if a bid doesn't get signed right away?",
      answer:
        "On AxeonCORE, automatic follow-up checks in on open bids and your lead list shows every one, so storm leads don't go cold while a homeowner is still deciding.",
    },
  ],
  'law-firms': [
    {
      question: 'How are case evaluations qualified before they reach an attorney?',
      answer:
        'A practice-area intake asks the questions an attorney needs, so you see the facts before you ever get on a call.',
    },
    {
      question: 'Does this help track cases through to a signed retainer?',
      answer:
        'Yes. On AxeonCORE, your lead list tracks every case evaluation through to a signed retainer, with automatic follow-up for people who have not signed yet.',
    },
  ],
  accounting: [
    {
      question: 'How does this separate simple tax questions from bigger advisory leads?',
      answer:
        "Intake separates tax prep, bookkeeping, and advisory requests up front, so higher-value leads don't get buried during tax season.",
    },
    {
      question: 'What about document collection?',
      answer:
        'On AxeonCORE, automatic emails tell each new client which documents to have ready, instead of chasing files over scattered email threads.',
    },
  ],
  'home-remodeling': [
    {
      question: 'How does this qualify budget before an in-home visit?',
      answer:
        'Intake asks for project type, scope, and budget range, so you know which jobs are serious before you drive out.',
    },
    {
      question: 'What happens to quotes that go quiet?',
      answer:
        'On AxeonCORE, your lead list tracks every bid and automatic follow-up checks in on open quotes before another contractor does.',
    },
  ],
  'real-estate': [
    {
      question: 'How are buyer and seller leads handled differently?',
      answer:
        'Intake sorts buyers from sellers at the very first click, so each one gets the right next step.',
    },
    {
      question: 'What happens after a home valuation request?',
      answer:
        'It books straight into your calendar. On AxeonCORE, automatic text and email follow-up keeps the lead warm until they are ready to move.',
    },
  ],
  landscaping: [
    {
      question: 'How does this separate recurring maintenance from one-time jobs?',
      answer:
        "Intake separates weekly maintenance from one-time hardscape and design bids, so they don't pile into the same inbox.",
    },
    {
      question: 'What happens during the spring rush?',
      answer:
        'Estimate requests come in with photos and property size, so you can quote faster. On AxeonCORE, missed calls get a text back right away.',
    },
  ],
  'auto-detailing': [
    {
      question: 'How do customers pick the right package?',
      answer:
        "Your site lays out each package, such as a wash, full detail, or ceramic coating, with starting prices, so customers pick the right one before they book and there's no confusion at drop-off.",
    },
    {
      question: 'Does this handle mobile detailing too?',
      answer:
        'Yes. Customers choose mobile or in-shop when they book, so every request lands in the right place.',
    },
  ],
};
