// lib/feedbackShared.ts
// The feedback types and labels that client components need (the admin
// Feedback card, the /f/<token> form). No Node imports here; lib/feedback.ts
// holds the signing and the database work and re-exports these.
export type FeedbackKind = 'report' | 'note30' | 'note90';
export type FeedbackRating = 'yes' | 'sortof' | 'no';

export const FEEDBACK_KINDS: readonly FeedbackKind[] = ['report', 'note30', 'note90'];
export const isFeedbackKind = (v: unknown): v is FeedbackKind => typeof v === 'string' && (FEEDBACK_KINDS as readonly string[]).includes(v);
export const isFeedbackRating = (v: unknown): v is FeedbackRating => v === 'yes' || v === 'sortof' || v === 'no';

export const RATING_LABELS: Record<FeedbackRating, string> = { yes: 'Yes', sortof: 'Sort of', no: 'No' };
export const KIND_LABELS: Record<FeedbackKind, string> = { report: 'Monthly report', note30: 'Day-30 survey', note90: 'Day-90 note' };

/**
 * Tap-to-answer questions at the end of the monthly report. Every option is a
 * link, so one tap in the inbox records an answer; the landing page then
 * offers the rest of what that report asked. `attention` options email the
 * owner the first time they land.
 *
 * Which questions a report carries is decided by its number
 * (lib/reportPlan.ts): the first full report asks the three that predict
 * whether the client stays (did the site bring a job they would not have had,
 * does anyone pick up when it rings, is it worth the price so far); the third
 * asks "would you recommend us"; every other report asks "how many jobs came
 * from the site" (a series that calibrates the estimate) plus one that
 * rotates with the month.
 */
export interface SurveyOption {
  value: string;
  label: string;
  attention?: boolean;
}
export interface SurveyQuestion {
  key: string;
  text: string;
  options: readonly SurveyOption[];
}
export const SURVEYS: Partial<Record<FeedbackKind, readonly SurveyQuestion[]>> = {
  report: [
    {
      key: 'job',
      text: 'Has the site brought you a job you would not have gotten otherwise?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'notsure', label: 'Not sure' },
        { value: 'notyet', label: 'Not yet', attention: true },
      ],
    },
    {
      key: 'pickup',
      text: 'When the site makes the phone ring, how often does someone pick up?',
      options: [
        { value: 'always', label: 'Almost always' },
        { value: 'half', label: 'About half' },
        { value: 'rarely', label: 'Rarely', attention: true },
      ],
    },
    {
      key: 'worth',
      text: 'Is it worth what you pay so far?',
      options: [
        { value: 'easily', label: 'Easily' },
        { value: 'even', label: 'About even' },
        { value: 'notyet', label: 'Not yet', attention: true },
      ],
    },
    {
      key: 'recommend',
      text: 'Would you recommend Axeon to another business owner?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'maybe', label: 'Maybe' },
        { value: 'notyet', label: 'Not yet', attention: true },
      ],
    },
    {
      key: 'jobs',
      text: 'Roughly how many jobs came from the site this month?',
      options: [
        { value: '0', label: 'None', attention: true },
        { value: '1-3', label: '1 to 3' },
        { value: '4-10', label: '4 to 10' },
        { value: '10+', label: 'More than 10' },
      ],
    },
    {
      key: 'clear',
      text: 'Did the numbers in this report make sense?',
      options: [
        { value: 'yes', label: 'Clear' },
        { value: 'mostly', label: 'Mostly' },
        { value: 'no', label: 'Confusing', attention: true },
      ],
    },
    {
      key: 'next',
      text: 'What should we put our time into next?',
      options: [
        { value: 'calls', label: 'More calls' },
        { value: 'fit', label: 'Better-fit customers' },
        { value: 'look', label: 'How the site looks' },
        { value: 'time', label: 'Less on my plate' },
      ],
    },
    {
      key: 'source',
      text: 'Where did your best new customer this month come from?',
      options: [
        { value: 'google', label: 'Google' },
        { value: 'site', label: 'My website' },
        { value: 'wordofmouth', label: 'Word of mouth' },
        { value: 'social', label: 'Social media' },
      ],
    },
  ],
};

/** The regular report's second question, by calendar month: "2026-10" asks the first, "2026-11" the second, and round again. */
export const REPORT_ROTATION: readonly string[] = ['clear', 'next', 'source'];

/** Every question that exists for a kind (what an answer may name). */
export const surveyFor = (kind: FeedbackKind): readonly SurveyQuestion[] => SURVEYS[kind] ?? [];

/** The questions behind a list of keys, in that order; unknown keys are dropped. */
export function questionsByKeys(kind: FeedbackKind, keys: readonly string[]): SurveyQuestion[] {
  const all = surveyFor(kind);
  return keys.map((k) => all.find((q) => q.key === k)).filter((q): q is SurveyQuestion => Boolean(q));
}

/** Answers keyed by question: { job: 'yes', pickup: 'half' }. */
export type FeedbackAnswers = Record<string, string>;

/** Keeps only answers that belong to this kind's survey, by question key and option value. */
export function cleanAnswers(kind: FeedbackKind, raw: unknown): FeedbackAnswers {
  const out: FeedbackAnswers = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const q of surveyFor(kind)) {
    const v = (raw as Record<string, unknown>)[q.key];
    if (typeof v === 'string' && q.options.some((o) => o.value === v)) out[q.key] = v;
  }
  return out;
}

/** The option's words for an answer, for the admin card and the owner's email. */
export function answerLabel(kind: FeedbackKind, key: string, value: string): { question: string; answer: string; attention: boolean } | null {
  const q = surveyFor(kind).find((x) => x.key === key);
  const o = q?.options.find((x) => x.value === value);
  return q && o ? { question: q.text, answer: o.label, attention: Boolean(o.attention) } : null;
}

export interface FeedbackEntry {
  id: number;
  kind: FeedbackKind;
  /** "YYYY-MM" for a report; null for the notes. */
  month: string | null;
  rating: FeedbackRating | null;
  comment: string | null;
  /** Survey taps, by question key (SURVEYS). */
  answers: FeedbackAnswers;
  createdAt: string;
}
