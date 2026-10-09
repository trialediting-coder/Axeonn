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
export const KIND_LABELS: Record<FeedbackKind, string> = { report: 'Monthly report', note30: 'Day-30 note', note90: 'Day-90 note' };

export interface FeedbackEntry {
  id: number;
  kind: FeedbackKind;
  /** "YYYY-MM" for a report; null for the notes. */
  month: string | null;
  rating: FeedbackRating | null;
  comment: string | null;
  createdAt: string;
}
