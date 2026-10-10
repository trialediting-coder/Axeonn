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
 * The tap-to-answer survey in the day-30 email. Every option is a link, so one
 * tap in the inbox records an answer; the landing page then offers the rest.
 * Each question is framed as "what should we do for you", so answering it
 * changes what Axeon works on next. `attention` options email the owner.
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
  note30: [
    {
      key: 'leads',
      text: 'Are the calls and leads what you hoped for?',
      options: [
        { value: 'more', label: 'More than I expected' },
        { value: 'right', label: 'About right' },
        { value: 'fewer', label: 'Fewer than I hoped', attention: true },
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
      key: 'clear',
      text: 'Do the numbers in AxeonPROOF make sense?',
      options: [
        { value: 'yes', label: 'Clear' },
        { value: 'mostly', label: 'Mostly' },
        { value: 'no', label: 'Confusing', attention: true },
      ],
    },
  ],
};

/** Answers keyed by question: { leads: 'fewer', next: 'calls' }. */
export type FeedbackAnswers = Record<string, string>;

export const surveyFor = (kind: FeedbackKind): readonly SurveyQuestion[] => SURVEYS[kind] ?? [];

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
  /** Survey taps, by question key (SURVEYS). Empty for a report. */
  answers: FeedbackAnswers;
  createdAt: string;
}
