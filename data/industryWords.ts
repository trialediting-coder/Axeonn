// data/industryWords.ts
// The words a client reads, per type of practice or firm (owner request
// 2026-10-19): a dental practice has patients and procedures, a law firm has
// clients and practice areas. One module so the setup portal, the AxeonPROOF v2
// dashboard, the delivery schedule, the monthly summary and the v2 emails all
// say the same thing. Admin screens keep Axeon's internal wording.
//
// Missing or unknown industry = 'other' (neutral words). Pure: no imports, so
// client components, the server and the tests share it.
//
// Copy with tokens: write "{people}" / "{People}" (capitalised) and fillWords()
// swaps in the client's word. Every key of IndustryWords is a token.

export const INDUSTRIES = ['dental', 'med_spa', 'law', 'accounting', 'other'] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const isIndustry = (v: unknown): v is Industry => typeof v === 'string' && (INDUSTRIES as readonly string[]).includes(v);

/** What the client picks in the first setup question. */
export const INDUSTRY_LABELS: Record<Industry, string> = {
  dental: 'Dental practice',
  med_spa: 'Med spa',
  law: 'Law firm',
  accounting: 'Accounting or CPA firm',
  other: 'Other professional service',
};

export const INDUSTRY_OPTIONS: readonly string[] = INDUSTRIES.map((i) => INDUSTRY_LABELS[i]);

export function industryFromLabel(label: unknown): Industry | null {
  const hit = INDUSTRIES.find((i) => INDUSTRY_LABELS[i] === label);
  return hit ?? null;
}

export interface IndustryWords {
  /** One of the people they serve: "patient". */
  person: string;
  people: string;
  /** What gets its own page on the site: "procedure". */
  page: string;
  pages: string;
  /** The first booked meeting: "exam". */
  booking: string;
  bookings: string;
  /** A finished appointment, the moment a review request goes out: "visit". */
  visit: string;
  visits: string;
  /** What they are: "practice", "firm". */
  office: string;
  /** Who runs the day to day: "practice manager". */
  manager: string;
  /** The team that answers the phone. */
  frontDesk: string;
  /** What never goes on a win-back list. */
  privateDetails: string;
  /** Where their records live. */
  software: string;
  /** Placeholder for the pages they want more of. */
  pageExamples: string;
}

export const INDUSTRY_WORDS: Record<Industry, IndustryWords> = {
  dental: {
    person: 'patient',
    people: 'patients',
    page: 'procedure',
    pages: 'procedures',
    booking: 'exam',
    bookings: 'exams',
    visit: 'visit',
    visits: 'visits',
    office: 'practice',
    manager: 'practice manager',
    frontDesk: 'front desk',
    privateDetails: 'health or treatment details',
    software: 'practice software',
    pageExamples: 'Implants, Invisalign, new-patient exams',
  },
  med_spa: {
    person: 'client',
    people: 'clients',
    page: 'treatment',
    pages: 'treatments',
    booking: 'consultation',
    bookings: 'consultations',
    visit: 'treatment',
    visits: 'treatments',
    office: 'med spa',
    manager: 'practice manager',
    frontDesk: 'front desk',
    privateDetails: 'health or treatment details',
    software: 'booking software',
    pageExamples: 'Botox, laser hair removal, facials',
  },
  law: {
    person: 'client',
    people: 'clients',
    page: 'practice area',
    pages: 'practice areas',
    booking: 'case review',
    bookings: 'case reviews',
    visit: 'consultation',
    visits: 'consultations',
    office: 'firm',
    manager: 'office manager',
    frontDesk: 'front office',
    privateDetails: 'case details',
    software: 'case management software',
    pageExamples: 'Personal injury, estate planning, DUI defense',
  },
  accounting: {
    person: 'client',
    people: 'clients',
    page: 'service',
    pages: 'services',
    booking: 'client meeting',
    bookings: 'client meetings',
    visit: 'meeting',
    visits: 'meetings',
    office: 'firm',
    manager: 'office manager',
    frontDesk: 'front office',
    privateDetails: 'tax or financial details',
    software: 'practice software',
    pageExamples: 'Tax prep, bookkeeping, payroll',
  },
  other: {
    person: 'customer',
    people: 'customers',
    page: 'service',
    pages: 'services',
    booking: 'appointment',
    bookings: 'appointments',
    visit: 'appointment',
    visits: 'appointments',
    office: 'business',
    manager: 'office manager',
    frontDesk: 'front desk',
    privateDetails: 'health, case or financial details',
    software: 'office software',
    pageExamples: 'Your top service, your newest offer, a consultation',
  },
};

export function wordsFor(industry: Industry | string | null | undefined): IndustryWords {
  return INDUSTRY_WORDS[isIndustry(industry) ? industry : 'other'];
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "{People} who agreed" -> "Patients who agreed". Unknown tokens are left as written. */
export function fillWords(text: string, words: IndustryWords): string {
  return text.replace(/\{([A-Za-z]+)\}/g, (whole, key: string) => {
    const lower = (key[0].toLowerCase() + key.slice(1)) as keyof IndustryWords;
    const word = words[lower];
    if (typeof word !== 'string') return whole;
    return key[0] === key[0].toUpperCase() ? cap(word) : word;
  });
}

/**
 * The agreement's free-text specialty ("General dentistry", "Personal injury
 * law", "CPA / tax") mapped to an industry, or null when it is not clear. Only
 * a clear match counts: the client confirms it in the portal either way.
 */
export function industryFromSpecialty(specialty: string | null | undefined): Industry | null {
  const s = (specialty ?? '').toLowerCase();
  if (!s.trim()) return null;
  const hits: Industry[] = [];
  if (/\b(dent\w*|orthodont\w*|endodont\w*|periodont\w*|prosthodont\w*|oral surg\w*|pediatric dent\w*|dds|dmd)\b/.test(s)) hits.push('dental');
  if (/\b(med ?spa|medspa|medical spa|aesthetic\w*|botox|injectab\w*|laser|cosmetic (clinic|medicine)|skin ?care|wellness spa)\b/.test(s)) hits.push('med_spa');
  if (/\b(law|lawyer\w*|attorney\w*|legal|litigation|injury|estate planning|criminal defen[cs]e|family law|immigration|bankruptcy|esq)\b/.test(s)) hits.push('law');
  if (/\b(cpa\w*|accounting|accountant\w*|bookkeep\w*|tax(es)?|payroll|audit\w*|enrolled agent)\b/.test(s)) hits.push('accounting');
  // "Tax law" or "dental spa": two kinds at once is not a clear match.
  return hits.length === 1 ? hits[0] : null;
}
