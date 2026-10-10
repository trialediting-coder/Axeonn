// lib/feedback.ts
// Client feedback with no login: the monthly report ends with "Was this report
// useful? Yes / Sort of / No", three links carrying a signed token for that
// client and month, landing on /f/<token>, which records the tap and offers a
// box for one sentence. The day-30 and day-90 notes (lib/clientNotes.ts) link
// to the same page. Everything lands in client_feedback and on the client's
// admin page; a "No" or a sentence also emails the owner.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { sendFeedbackNotification } from '@/lib/email';
import { SITE_ORIGIN } from '@/lib/hostRouting';

export { FEEDBACK_KINDS, KIND_LABELS, RATING_LABELS, REPORT_ROTATION, SURVEYS, answerLabel, cleanAnswers, isFeedbackKind, isFeedbackRating, questionsByKeys, surveyFor } from '@/lib/feedbackShared';
export type { FeedbackAnswers, FeedbackEntry, FeedbackKind, FeedbackRating, SurveyQuestion } from '@/lib/feedbackShared';
import { answerLabel, cleanAnswers, isFeedbackKind, isFeedbackRating, type FeedbackAnswers, type FeedbackEntry, type FeedbackKind, type FeedbackRating } from '@/lib/feedbackShared';

const secret = () => process.env.TRACKING_SALT || process.env.AUTH_SECRET || '';
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** What a report or note links to: the client id, the kind, and a signature over both. */
export interface FeedbackRef {
  onboardingId: number;
  kind: FeedbackKind;
  month: string | null;
}

const sign = (payload: string, key: string) => createHmac('sha256', key).update(`feedback:${payload}`).digest('hex').slice(0, 24);

/** "12.report.2026-09.<sig>" or "12.note30.-.<sig>": URL-safe, nothing to guess. Empty when no secret is configured. */
export function feedbackToken(ref: FeedbackRef, key: string = secret()): string {
  if (!key) return '';
  const payload = `${ref.onboardingId}.${ref.kind}.${ref.month ?? '-'}`;
  return `${payload}.${sign(payload, key)}`;
}

export function readFeedbackToken(token: unknown, key: string = secret()): FeedbackRef | null {
  if (!key || typeof token !== 'string' || token.length > 80) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [idStr, kind, month, sig] = parts;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0 || !isFeedbackKind(kind)) return null;
  if (month !== '-' && !MONTH_RE.test(month)) return null;
  const expected = sign(`${idStr}.${kind}.${month}`, key);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return { onboardingId: id, kind, month: month === '-' ? null : month };
}

/** The link a report or note carries. Null when no secret is configured, so the email simply omits the line. */
export function feedbackUrl(ref: FeedbackRef): string | null {
  const token = feedbackToken(ref);
  return token ? `${SITE_ORIGIN}/f/${token}` : null;
}

/** Shape of the survey taps on a row. */
export type StoredAnswers = FeedbackAnswers;

const cleanComment = (v: unknown) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 1000) : '');

interface Row {
  id: number;
  kind: FeedbackKind;
  month: string | null;
  rating: FeedbackRating | null;
  comment: string | null;
  answers: unknown;
  created_at: string | Date;
}
const toEntry = (r: Row): FeedbackEntry => ({
  id: r.id,
  kind: r.kind,
  month: r.month,
  rating: r.rating,
  comment: r.comment,
  answers: cleanAnswers(r.kind, r.answers),
  createdAt: new Date(r.created_at).toISOString(),
});

/** What this client has already said for this kind and month, so the landing page asks only what is left. */
export async function getFeedback(ref: FeedbackRef): Promise<FeedbackEntry | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const res = await sql<Row>`
    SELECT id, kind, month, rating, comment, answers, created_at FROM client_feedback
    WHERE onboarding_id = ${ref.onboardingId} AND kind = ${ref.kind} AND month_key = ${ref.month ?? '-'} LIMIT 1;
  `;
  return res.rows[0] ? toEntry(res.rows[0]) : null;
}

/**
 * Records a tap, survey answers and/or a sentence. One row per client, kind and
 * month: a second tap replaces the first (a link scanner's click is overwritten
 * by the person's), answers merge in by question, and a comment is added to the
 * row rather than making a new one. The owner is emailed for a "No", for any
 * comment, and for a survey answer marked `attention` the first time it lands;
 * never for a plain "Yes".
 */
export async function recordFeedback(
  ref: FeedbackRef,
  input: { rating?: unknown; comment?: unknown; answers?: unknown },
  who: { businessName: string; token: string }
): Promise<FeedbackEntry | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const rating = isFeedbackRating(input.rating) ? input.rating : null;
  const comment = cleanComment(input.comment);
  const answers = cleanAnswers(ref.kind, input.answers);
  if (!rating && !comment && Object.keys(answers).length === 0) return null;
  const before = Object.keys(answers).length ? await getFeedback(ref) : null;
  const res = await sql<Row>`
    INSERT INTO client_feedback (onboarding_id, kind, month, rating, comment, answers)
    VALUES (${ref.onboardingId}, ${ref.kind}, ${ref.month}, ${rating}, ${comment || null}, ${JSON.stringify(answers)}::jsonb)
    ON CONFLICT (onboarding_id, kind, month_key) DO UPDATE SET
      rating = coalesce(EXCLUDED.rating, client_feedback.rating),
      comment = coalesce(EXCLUDED.comment, client_feedback.comment),
      answers = client_feedback.answers || EXCLUDED.answers,
      created_at = now()
    RETURNING id, kind, month, rating, comment, answers, created_at;
  `;
  const entry = toEntry(res.rows[0]);
  // New answers this call, with their words; "attention" ones go to the owner once.
  const fresh = Object.entries(answers)
    .filter(([k, v]) => before?.answers[k] !== v)
    .map(([k, v]) => answerLabel(ref.kind, k, v))
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (rating === 'no' || comment || fresh.some((x) => x.attention)) {
    sendFeedbackNotification({
      businessName: who.businessName,
      token: who.token,
      kind: ref.kind,
      month: ref.month,
      rating,
      comment: comment || null,
      answers: Object.entries(entry.answers)
        .map(([k, v]) => answerLabel(ref.kind, k, v))
        .filter((x): x is NonNullable<typeof x> => x !== null),
    }).catch((err) => console.error('[feedback] owner email failed', err instanceof Error ? err.message : err));
  }
  return entry;
}

/** Everything a client has told us, newest first. */
export async function listFeedback(onboardingId: number): Promise<FeedbackEntry[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureSchema();
  const res = await sql<Row>`
    SELECT id, kind, month, rating, comment, answers, created_at FROM client_feedback WHERE onboarding_id = ${onboardingId} ORDER BY created_at DESC LIMIT 100;
  `;
  return res.rows.map(toEntry);
}
