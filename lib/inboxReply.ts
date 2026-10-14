// lib/inboxReply.ts
// Texting a lead back from the PROOF inbox. sendClientSms (lib/phoneLines.ts)
// already enforces the 10DLC gate and the opt-out list; this adds what the
// inbox needs: the contact is this client's and has a phone, and it is not
// quiet hours (8 pm to 8 am client-local; slice 2's isQuietHours through
// canReplyNow). A reply typed in quiet hours is held in held_replies and sent
// at 8 am by /api/cron/held-replies. Server-only.
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { getContact } from '@/lib/contacts';
import { canReplyNow, isReplyRefusal, replyBlocker, textingState, validateReplyBody, type Contact, type ReplyRefusal } from '@/lib/contactsShared';
import { isQuietHours } from '@/lib/leadShared';
import { getLine, isOptedOut, sendClientSms, type ClientSmsResult } from '@/lib/phoneLines';
import type { PhoneLine } from '@/lib/phoneShared';
import { holdForQuietHours, isDefiniteRejection, redactDigits } from '@/lib/sequenceSchedule';

export type ReplyResult = { status: 'sent' } | { status: 'held'; id: number; sendAt: string } | { status: 'refused'; reason: ReplyRefusal } | { status: 'unclear' };

const refused = (reason: ReplyRefusal): ReplyResult => ({ status: 'refused', reason });

/** A row claimed this long ago and still 'sending' was interrupted mid-send. */
export const HELD_STALE_MINUTES = 10;
/** A definite refusal (nothing left) is tried once more this much later. */
export const HELD_RETRY_MINUTES = 15;
/** A held row whose lookups keep failing is given up on ('lookup') once its send time is this far past. */
export const HELD_LOOKUP_GIVE_UP_HOURS = 12;
/** One tick stops starting new sends after this, well inside the route's 60 s. */
const SEND_BUDGET_MS = 45_000;

const clip = (s: string) => redactDigits(s).slice(0, 200);

/**
 * What a held reply becomes when its send threw. Slice 3's rule
 * (isDefiniteRejection): a Twilio 4xx or missing config means nothing went
 * out, so it goes back to 'held' once (priorError null) and fails the second
 * time. Anything else is unclear (a reset connection, a timeout, bad JSON on a
 * 2xx): the text may have left, so it is 'failed' and never sent again.
 * The stored error is digit-redacted and at most 200 characters.
 */
export function heldSendFailure(err: unknown, priorError: string | null): { retry: boolean; error: string } {
  const message = errText(err) || 'send failed';
  if (!isDefiniteRejection(err)) return { retry: false, error: clip(`unclear: ${message}`) };
  if (priorError === null) return { retry: true, error: clip(`retry: ${message}`) };
  return { retry: false, error: clip(message) };
}

/**
 * What a live reply becomes when sendClientSms threw. Slice 3's rule
 * (isDefiniteRejection): a Twilio 4xx or missing config means nothing went
 * out, so it is a refusal ('send_failed': try again). Anything else (a reset
 * connection, a timeout, bad JSON on a 2xx) is 'unclear': the text may have
 * left, so the client checks the thread before sending it again.
 */
export function liveSendFailure(err: unknown): ReplyResult {
  return isDefiniteRejection(err) ? refused('send_failed') : { status: 'unclear' };
}

/**
 * Null when the contact is not this client's. The order is Review Focus 4:
 * the body (validateReplyBody), then every reason a text could never go out
 * (replyBlocker: no phone, opted out, no line, carrier approval pending), and
 * only then quiet hours, so nothing waits overnight only to be refused at 8 am.
 * A throw from sendClientSms is decided by liveSendFailure, logged redacted;
 * a held reply records the number it was typed to (to_phone).
 */
export async function replyToContact(onboardingId: number, contactId: number, rawBody: unknown, now: Date = new Date()): Promise<ReplyResult | null> {
  const contact = await getContact(onboardingId, contactId);
  if (!contact) return null;
  const checked = validateReplyBody(rawBody);
  if (!checked.ok) return refused(checked.reason);
  const [line, optedOut] = await Promise.all([getLine(onboardingId), contact.phone ? isOptedOut(onboardingId, contact.phone) : Promise.resolve(false)]);
  const blocked = replyBlocker({ hasPhone: contact.phone !== null, optedOut, texting: textingState(line) });
  if (blocked) return refused(blocked);
  if (!line || !contact.phone) return refused('no_line'); // unreachable after replyBlocker; narrows the types
  const window = canReplyNow(now, line.timeZone);
  if (!window.ok) {
    await ensureSchema();
    const { rows } = await sql<{ id: number | string }>`
      INSERT INTO held_replies (onboarding_id, contact_id, body, send_at, to_phone)
      VALUES (${onboardingId}, ${contactId}, ${checked.body}, ${window.sendAt}, ${contact.phone})
      RETURNING id;`;
    return { status: 'held', id: Number(rows[0].id), sendAt: window.sendAt };
  }
  let sent: ClientSmsResult;
  try {
    sent = await sendClientSms(line, contact.phone, checked.body, 'manual');
  } catch (err) {
    const out = liveSendFailure(err);
    console.error('[proof/inbox/reply] send threw', out.status === 'unclear' ? 'unclear' : 'not sent', clip(errText(err)));
    return out;
  }
  if (!sent.sent) return refused(isReplyRefusal(sent.reason) ? sent.reason : 'bad_number');
  return { status: 'sent' };
}

type ClaimedRow = {
  id: number | string;
  onboarding_id: number;
  contact_id: number | string;
  body: string;
  error: string | null;
  /** The number shown when the reply was typed; NULL on rows held before the column existed. */
  to_phone: string | null;
  /** When it is due; a lookup failure leaves it as it is, so the give-up counts from here. */
  send_at: Date | string;
};

/**
 * What one claimed row becomes. 'held' is a definite refusal put back for one
 * retry (HELD_RETRY_MINUTES); 'requeue' puts the row back untouched (its error
 * kept): for quiet hours at sendAt (the next 8 am); for a lookup failure with
 * send_at left as it is (nothing was attempted, so the next cron tick retries
 * it) until send_at is HELD_LOOKUP_GIVE_UP_HOURS past, when it fails 'lookup'.
 */
export type HeldOutcome =
  | { status: 'sent' }
  | { status: 'held' | 'failed'; error: string; threw?: true }
  | { status: 'requeue'; sendAt: string; why: 'quiet' }
  | { status: 'requeue'; why: 'lookup' };

export interface HeldRowDeps {
  getContact: (onboardingId: number, contactId: number) => Promise<Pick<Contact, 'phone'> | null>;
  getLine: (onboardingId: number) => Promise<PhoneLine | null>;
  sendClientSms: (line: PhoneLine, to: string, body: string, kind: 'manual') => Promise<ClientSmsResult>;
  now: () => Date;
}

const liveDeps: HeldRowDeps = { getContact, getLine, sendClientSms, now: () => new Date() };

/**
 * One claimed held reply, decided and (when it may) sent. The contact and line
 * lookups sit in their own try: a lookup that throws means nothing was sent, so
 * the row goes back to held (send_at unchanged, retried on the next tick)
 * instead of failing, until its send_at is HELD_LOOKUP_GIVE_UP_HOURS past
 * ('lookup' failure). The
 * text goes to to_phone, the number shown when it was typed: if the contact no
 * longer has that phone it fails 'number_changed' (a NULL to_phone, an older
 * row, goes to the contact's current phone). Quiet hours are checked again right before the send, in the line's zone (a
 * zone changed overnight, a row claimed late): if quiet, the row is re-held to
 * the next 8 am. Only a throw from the send itself goes through heldSendFailure.
 */
export async function processHeldRow(r: Pick<ClaimedRow, 'onboarding_id' | 'contact_id' | 'body' | 'error' | 'to_phone' | 'send_at'>, deps: HeldRowDeps = liveDeps): Promise<HeldOutcome> {
  const onboardingId = Number(r.onboarding_id);
  let contact: Pick<Contact, 'phone'> | null;
  let line: PhoneLine | null;
  try {
    [contact, line] = await Promise.all([deps.getContact(onboardingId, Number(r.contact_id)), deps.getLine(onboardingId)]);
  } catch {
    if (deps.now().getTime() - new Date(r.send_at).getTime() > HELD_LOOKUP_GIVE_UP_HOURS * 3_600_000) return { status: 'failed', error: 'lookup' };
    return { status: 'requeue', why: 'lookup' };
  }
  if (r.to_phone !== null && contact?.phone !== r.to_phone) return { status: 'failed', error: 'number_changed' };
  const to = r.to_phone ?? contact?.phone;
  if (!to) return { status: 'failed', error: 'no_phone' };
  if (!line || line.status !== 'active') return { status: 'failed', error: 'no_line' };
  const now = deps.now();
  if (isQuietHours(now, line.timeZone)) return { status: 'requeue', sendAt: holdForQuietHours(now, line.timeZone).toISOString(), why: 'quiet' };
  try {
    const res = await deps.sendClientSms(line, to, r.body, 'manual');
    return res.sent ? { status: 'sent' } : { status: 'failed', error: res.reason };
  } catch (err) {
    const f = heldSendFailure(err, r.error);
    return { status: f.retry ? 'held' : 'failed', error: f.error, threw: true };
  }
}

/**
 * The 8 am send. Rows are claimed (held -> sending, claimed_at) with a
 * compare-and-set before anything is sent, so two overlapping cron runs never
 * send one twice. A row still 'sending' HELD_STALE_MINUTES after its claim was
 * interrupted (a crash or timeout mid-send): nothing says the text did not
 * leave, so by slice 3's rule it is unclear and becomes 'failed', never re-sent;
 * the client sees "may have gone out, check the thread". The gates run again
 * inside sendClientSms: someone who texted STOP overnight is not texted, and a
 * line whose carrier approval lapsed sends nothing. Each row goes through
 * processHeldRow: quiet hours are checked again (re-held to 8 am), and a failed
 * lookup puts the row back to held until its send_at is HELD_LOOKUP_GIVE_UP_HOURS past.
 * Logs carry the row id only.
 */
export async function sendDueHeldReplies(limit = 40): Promise<{ sent: number; failed: number; interrupted: number }> {
  if (!isDatabaseConfigured()) return { sent: 0, failed: 0, interrupted: 0 };
  await ensureSchema();
  const deadline = Date.now() + SEND_BUDGET_MS;
  const stuck = await sql`
    UPDATE held_replies SET status = 'failed', error = 'interrupted'
    WHERE status = 'sending' AND claimed_at < now() - make_interval(mins => ${HELD_STALE_MINUTES});`;
  const { rows } = await sql<ClaimedRow>`
    UPDATE held_replies SET status = 'sending', claimed_at = now()
    WHERE status = 'held' AND id IN (
      SELECT id FROM held_replies WHERE status = 'held' AND send_at <= now()
      ORDER BY send_at, id LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, onboarding_id, contact_id, body, error, to_phone, send_at;`;
  let sent = 0;
  let failed = 0;
  let released = 0;
  for (const r of rows) {
    const id = Number(r.id);
    if (Date.now() > deadline) {
      // Never attempted, so nothing can have left: back to held for the next tick.
      try {
        await sql`UPDATE held_replies SET status = 'held', claimed_at = NULL WHERE id = ${id} AND status = 'sending';`;
        released += 1;
      } catch (err) {
        console.error('[held-replies] claim not released', id, clip(errText(err)));
      }
      continue;
    }
    const outcome = await processHeldRow(r);
    if ((outcome.status === 'held' || outcome.status === 'failed') && outcome.threw) console.error('[held-replies] send failed', id, outcome.status === 'held' ? 'retrying' : 'not retried');
    else if (outcome.status === 'requeue' && outcome.why === 'lookup') console.error('[held-replies] lookup failed, back to held', id);
    else if (outcome.status === 'failed' && outcome.error === 'lookup') console.error('[held-replies] lookup failed for 12 hours, given up', id);
    if (outcome.status === 'sent') sent += 1;
    else if (outcome.status === 'failed') failed += 1;
    try {
      if (outcome.status === 'sent') {
        await sql`UPDATE held_replies SET status = 'sent', sent_at = now(), error = NULL WHERE id = ${id} AND status = 'sending';`;
      } else if (outcome.status === 'requeue' && outcome.why === 'quiet') {
        // Nothing was attempted: back to held, error untouched (the retry-once rule still applies to a later send).
        await sql`
          UPDATE held_replies SET status = 'held', claimed_at = NULL, send_at = ${outcome.sendAt}
          WHERE id = ${id} AND status = 'sending';`;
      } else if (outcome.status === 'requeue') {
        // A lookup failed: back to held with send_at kept (still due, so the next tick retries; the give-up counts from it).
        await sql`UPDATE held_replies SET status = 'held', claimed_at = NULL WHERE id = ${id} AND status = 'sending';`;
      } else if (outcome.status === 'held') {
        await sql`
          UPDATE held_replies SET status = 'held', claimed_at = NULL, error = ${outcome.error},
            send_at = now() + make_interval(mins => ${HELD_RETRY_MINUTES})
          WHERE id = ${id} AND status = 'sending';`;
      } else {
        await sql`UPDATE held_replies SET status = 'failed', error = ${outcome.error} WHERE id = ${id} AND status = 'sending';`;
      }
    } catch (err) {
      // The row stays 'sending' and the stale sweep fails it; it is never re-sent.
      console.error('[held-replies] outcome not recorded', id, clip(errText(err)));
    }
  }
  if (released) console.error('[held-replies] out of time, released for the next tick', released);
  return { sent, failed, interrupted: stuck.rowCount ?? 0 };
}
