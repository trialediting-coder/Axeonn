// data/agreementTemplates/shared.ts
// What every version of the Client Services Agreement has in common. Each version
// lives in its own file and never changes once clients have signed it: a signed
// agreement is always rendered with the version it was signed under.
import type { OnboardingTier } from '@/data/onboardingItems';

export interface AgreementSection {
  heading: string;
  paragraphs: string[];
}

export interface ScheduleColumn {
  title: string;
  lead?: string;
  items: string[];
}

/** The agreement's deal terms, already resolved from the stored fields. */
export interface AgreementTerms {
  tier: OnboardingTier;
  scope?: 'website';
  setupCents: number;
  monthlyCents: number;
  /** Whole months, 0 = month-to-month. */
  minimumMonths: number;
  /** The implementation fee credited in exchange for the Initial Term (0 = none). */
  setupCreditCents: number;
  /** 'annual' = the Initial Term paid in full at signing. */
  billing: 'monthly' | 'annual';
  /** The client's primary specialty, for territory exclusivity ('' = none). */
  specialty: string;
  /** 2026-10-19+: days after signing the client may end the agreement owing nothing (0 = no pilot). Sec. 2.5. */
  pilotDays?: number;
}

export interface AgreementTemplate {
  version: string;
  intro: string;
  sections(t: AgreementTerms): AgreementSection[];
  termSummary(t: AgreementTerms): string;
  fees(t: AgreementTerms): string;
  schedule(t: AgreementTerms): ScheduleColumn;
  definitions: string[];
}

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four',
];

/** "six (6) months", the way the template writes terms. */
export const monthsInWords = (n: number) => `${NUMBER_WORDS[n] ?? String(n)} (${n}) month${n === 1 ? '' : 's'}`;
