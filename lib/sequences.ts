// lib/sequences.ts
// The follow-up engine (slice 3). Per-client templates, one run per contact per
// kind, the cron worker, and the start/stop calls the triggers use. Every
// decision is made by decideRun (lib/sequenceSchedule.ts, pure and tested);
// this file loads the facts, claims the step, and sends through sendClientSms
// (lib/phoneLines.ts) or sendSequenceEmail (lib/email.ts). Server-only.
import { ensureSchema, sql } from '@/lib/db';
import { errText, iso, type DbId, type DbTime } from '@/lib/dbRows';
import { sendSequenceEmail } from '@/lib/email';
import { getOnboardingById, type Onboarding } from '@/lib/onboarding';
import { pastCustomerCounts } from '@/lib/pastCustomers';
import { getLine, isOptedOut, sendClientSms, type PhoneLine } from '@/lib/phoneLines';
import { maskNumber, normalizePhone } from '@/lib/phoneShared';
import { sendGate } from '@/lib/sendGate';
import {
  CONNECT_RECHECK_MINUTES, connectCallDecision, decideRun, isDefiniteRejection, planSend, reactivationWindow, redactDigits, safeTimeZone,
  scheduleReactivation, type RunDecision,
} from '@/lib/sequenceSchedule';
import {
  SEQUENCE_KINDS, defaultTemplate, emptyRunCounts, isSequenceKind, missingLinks, normalizeEmail, templateVars, validateTemplate,
  type RunCounts, type SequenceKind, type SequenceSettings, type SequenceTemplate, type SequenceTemplateView, type SequencesAdminData,
  type StopReason, type TemplateVars,
} from '@/lib/sequenceShared';
import { isEmailOptedOut, unsubscribeSecret } from '@/lib/unsubscribe';
import { upsertContactEvent } from '@/lib/contacts';
import { eventSummary } from '@/lib/contactsShared';

export const DUE_BATCH = 200;
export const SEND_CONCURRENCY = 10;
export const LEASE_MINUTES = 10;
export const RETRY_MINUTES = 30;
export const MAX_ATTEMPTS = 3;
export const MISSED_CALL_WAIT_MINUTES = 30;
/** Resend's default rate limit: emails go 2 at a time, starts 600 ms apart, whatever the run concurrency. */
export const EMAIL_SEND_CONCURRENCY = 2;
export const EMAIL_GAP_MS = 600;
/** A send is not started with less than this left of the tick's time budget; the run goes back for the next tick. */
export const SEND_MIN_REMAINING_MS = 8_000;
const REACTIVATION_BATCH = 500;
const DEFAULT_BUDGET_MS = 45_000;

/** One per server instance, so overlapping work in the same instance shares the limit. */
const emailGate = sendGate(EMAIL_SEND_CONCURRENCY, EMAIL_GAP_MS);

export interface RunContact {
  name: string | null;
  phone: string | null;
  email: string | null;
}

/** What started the run: a form_submissions row, a phone_calls row, past_customers@YYYY-MM, a booking (slice 5). */
export interface RunRef {
  table: string;
  id: number;
}

export interface SequenceRun {
  id: number;
  onboardingId: number;
  kind: SequenceKind;
  contactPhone: string | null;
  contactEmail: string | null;
  contactName: string;
  refTable: string;
  refId: number;
  step: number;
  anchorAt: string;
  nextAt: string;
  status: 'active' | 'done' | 'stopped';
  stopReason: string | null;
  attempts: number;
  /** Texts of this run that went out; > 0 is decideRun's priorSmsSent. */
  smsSentCount: number;
  /** When this run last sent something (decideRun keeps 2 hours between sends); null before the first. */
  lastSentAt: string | null;
  /** The template's updated_at when the run started; a later edit stops the run ('template_changed'). */
  templateUpdatedAt: string | null;
  createdAt: string;
}

export type StartResult =
  | { started: true; runId: number }
  | { started: false; reason: 'plan' | 'disabled' | 'no_contact' | 'opted_out' | 'missing_link' | 'already_active' | 'no_steps' | 'duplicate' };

/** 'released': not started because the tick's time budget ran short; it is due again at once. */
export type RunOutcome = 'sent' | 'held' | 'done' | 'stopped' | 'failed' | 'skipped' | 'released';

export interface ProcessCounts {
  picked: number;
  sent: number;
  held: number;
  done: number;
  stopped: number;
  failed: number;
  skipped: number;
  leftover: number;
}

/** A tap on a lead stops runs with reason "stage:<action>" (lib/leadStages.ts); everything else uses a StopReason. */
export type RunStopReason = StopReason | `stage:${string}`;

// ─────────────────────────── Templates and settings ───────────────────────────

interface TemplateRow {
  id: DbId;
  kind: string;
  steps: unknown;
  enabled: boolean;
  drafted_by: 'axeon' | 'claude';
  updated_at: DbTime;
}

function rowToView(r: TemplateRow, onboardingId: number): SequenceTemplateView | null {
  try {
    const t = validateTemplate({ kind: r.kind, steps: r.steps, enabled: r.enabled });
    return { ...t, isDefault: false, draftedBy: r.drafted_by, updatedAt: iso(r.updated_at) };
  } catch (err) {
    // A stored template that no longer validates is treated as off (the default, disabled), never sent half-right.
    console.error('sequences: stored template is invalid, treating it as off', { templateId: Number(r.id), onboardingId, kind: r.kind, error: errText(err) });
    return null;
  }
}

/** All five kinds for a client, in SEQUENCE_KINDS order; unsaved (or unreadable) kinds are the disabled defaults. */
export async function getTemplates(onboardingId: number): Promise<SequenceTemplateView[]> {
  await ensureSchema();
  const { rows } = await sql<TemplateRow>`SELECT id, kind, steps, enabled, drafted_by, updated_at FROM sequence_templates WHERE onboarding_id = ${onboardingId};`;
  const saved = new Map<string, SequenceTemplateView | null>(rows.map((r) => [r.kind, rowToView(r, onboardingId)]));
  return SEQUENCE_KINDS.map((kind) => saved.get(kind) ?? { ...defaultTemplate(kind), isDefault: true, draftedBy: null, updatedAt: null });
}

/** The only writer of sequence_templates. Validates again, so no route can store a bad template. */
export async function saveTemplate(onboardingId: number, template: SequenceTemplate, draftedBy: 'axeon' | 'claude' = 'axeon'): Promise<void> {
  const t = validateTemplate(template);
  const steps = JSON.stringify(t.steps.map((s) => ({ offset_minutes: s.offsetMinutes, channel: s.channel, subject: s.subject, body: s.body })));
  await ensureSchema();
  await sql`
    INSERT INTO sequence_templates (onboarding_id, kind, steps, enabled, drafted_by)
    VALUES (${onboardingId}, ${t.kind}, ${steps}::jsonb, ${t.enabled}, ${draftedBy})
    ON CONFLICT (onboarding_id, kind) DO UPDATE
      SET steps = EXCLUDED.steps, enabled = EXCLUDED.enabled, drafted_by = EXCLUDED.drafted_by, updated_at = now();
  `;
}

export async function getSequenceSettings(onboardingId: number): Promise<SequenceSettings> {
  await ensureSchema();
  const { rows } = await sql<{ review_link: string | null; booking_link: string | null }>`
    SELECT review_link, booking_link FROM onboardings WHERE id = ${onboardingId} LIMIT 1;
  `;
  return { reviewLink: rows[0]?.review_link ?? null, bookingLink: rows[0]?.booking_link ?? null };
}

export async function saveSequenceSettings(onboardingId: number, s: SequenceSettings): Promise<void> {
  await ensureSchema();
  await sql`UPDATE onboardings SET review_link = ${s.reviewLink}, booking_link = ${s.bookingLink}, updated_at = now() WHERE id = ${onboardingId};`;
}

// ─────────────────────────── Per-client context ───────────────────────────

interface ClientContext {
  onboarding: Onboarding | null;
  line: PhoneLine | null;
  templates: Map<SequenceKind, SequenceTemplateView>;
  settings: SequenceSettings;
  timeZone: string;
}

/** One load per client per cron tick, shared by concurrent runs (the promise is cached, not the result). */
export type ContextCache = Map<number, Promise<ClientContext>>;

async function loadContext(onboardingId: number): Promise<ClientContext> {
  const [onboarding, line, templates, settings] = await Promise.all([
    getOnboardingById(onboardingId),
    getLine(onboardingId),
    getTemplates(onboardingId),
    getSequenceSettings(onboardingId),
  ]);
  return { onboarding, line, templates: new Map(templates.map((t) => [t.kind, t])), settings, timeZone: safeTimeZone(line?.timeZone) };
}

function clientContext(onboardingId: number, cache: ContextCache): Promise<ClientContext> {
  let p = cache.get(onboardingId);
  if (!p) {
    p = loadContext(onboardingId);
    // A failed load is not cached: the next run of this client tries again.
    p.catch(() => cache.delete(onboardingId));
    cache.set(onboardingId, p);
  }
  return p;
}

const varsFor = (c: ClientContext, contactName: string | null): TemplateVars =>
  templateVars({
    contactName,
    businessName: c.onboarding?.businessName ?? null,
    clientName: c.onboarding?.clientName ?? null,
    reviewLink: c.settings.reviewLink,
    bookingLink: c.settings.bookingLink,
  });
const tierAllowed = (o: Onboarding | null): boolean => Boolean(o && o.tier !== 'essentials' && o.status !== 'closed');
/** Resend, plus the secret the unsubscribe link is signed with: no email goes out without its unsubscribe link. */
const emailConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY && unsubscribeSecret());
const smsReady = (line: PhoneLine | null): boolean => line?.smsStatus === 'ready';
/** Error text for logs and last_error: phone numbers redacted, then cut to 300 characters. */
const clip = (s: string) => redactDigits(s).slice(0, 300);

// ─────────────────────────── Runs: start and stop ───────────────────────────

interface RunRow {
  id: DbId;
  onboarding_id: number;
  kind: SequenceKind;
  contact_phone: string | null;
  contact_email: string | null;
  contact_name: string;
  ref_table: string;
  ref_id: DbId;
  step: number;
  anchor_at: DbTime;
  next_at: DbTime;
  status: 'active' | 'done' | 'stopped';
  stop_reason: string | null;
  attempts: number;
  sms_sent_count: number;
  last_sent_at: DbTime | null;
  template_updated_at: DbTime | null;
  created_at: DbTime;
}

const toRun = (r: RunRow): SequenceRun => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  kind: r.kind,
  contactPhone: r.contact_phone,
  contactEmail: r.contact_email,
  contactName: r.contact_name,
  refTable: r.ref_table,
  refId: Number(r.ref_id),
  step: r.step,
  anchorAt: iso(r.anchor_at),
  nextAt: iso(r.next_at),
  status: r.status,
  stopReason: r.stop_reason,
  attempts: r.attempts,
  smsSentCount: Number(r.sms_sent_count ?? 0),
  lastSentAt: r.last_sent_at ? iso(r.last_sent_at) : null,
  templateUpdatedAt: r.template_updated_at ? iso(r.template_updated_at) : null,
  createdAt: iso(r.created_at),
});

async function hasActiveRun(onboardingId: number, kind: SequenceKind, phone: string | null, email: string | null): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM sequence_runs
    WHERE onboarding_id = ${onboardingId} AND kind = ${kind} AND status = 'active'
      AND (contact_phone = ${phone} OR contact_email = ${email})
    LIMIT 1;
  `;
  return rows.length > 0;
}

type StartRefusal = Extract<StartResult, { started: false }>['reason'];

/**
 * Starts one follow-up for one contact, or says why not. Idempotent: the same
 * ref never starts twice, and a contact with an active run of this kind is not
 * given a second one. Nothing is sent here; the cron sends when next_at comes.
 * Reminders are anchored on the appointment, so they must be given anchorAt.
 */
export async function startRun(
  onboardingId: number,
  kind: SequenceKind,
  contact: RunContact,
  ref: RunRef,
  opts: { anchorAt?: Date; notBefore?: Date; startStep?: number; now?: Date } = {}
): Promise<StartResult> {
  if (kind === 'reminder' && !opts.anchorAt) throw new Error('reminder runs need anchorAt (the appointment time)');
  const no = (reason: StartRefusal): StartResult => ({ started: false, reason });
  const now = opts.now ?? new Date();
  await ensureSchema();
  const c = await loadContext(onboardingId);
  if (!tierAllowed(c.onboarding)) return no('plan');
  const template = c.templates.get(kind);
  if (!template?.enabled) return no('disabled');
  const phone = normalizePhone(contact.phone);
  const email = normalizeEmail(contact.email);
  if (!phone && !email) return no('no_contact');
  if (phone && (await isOptedOut(onboardingId, phone))) return no('opted_out');
  // An unsubscribed address gets no email steps; with no phone either, there is nobody to follow up with.
  const emailOptedOut = email ? await isEmailOptedOut(onboardingId, email) : false;
  if (!phone && emailOptedOut) return no('opted_out');
  if (missingLinks(template.steps, varsFor(c, contact.name)).length) return no('missing_link');
  if (await hasActiveRun(onboardingId, kind, phone, email)) return no('already_active');
  const anchorAt = opts.anchorAt ?? now;
  const plan = planSend({
    kind,
    steps: template.steps,
    fromStep: opts.startStep ?? 0,
    anchorAt,
    now,
    notBefore: opts.notBefore,
    timeZone: c.timeZone,
    canSms: Boolean(phone) && smsReady(c.line),
    canEmail: Boolean(email) && !emailOptedOut && emailConfigured(),
  });
  if (!plan) return no('no_steps');
  const name = (contact.name ?? '').trim().slice(0, 80);
  const { rows } = await sql<{ id: DbId }>`
    INSERT INTO sequence_runs (onboarding_id, kind, contact_phone, contact_email, contact_name, ref_table, ref_id, step, anchor_at, next_at, template_updated_at)
    VALUES (${onboardingId}, ${kind}, ${phone}, ${email}, ${name}, ${ref.table}, ${ref.id}, ${plan.step}, ${anchorAt.toISOString()}, ${plan.at.toISOString()}, ${template.updatedAt})
    ON CONFLICT DO NOTHING
    RETURNING id;
  `;
  return rows[0] ? { started: true, runId: Number(rows[0].id) } : no('duplicate');
}

/** Slice 2's lead route calls this after the alerts. */
export function startLeadFollowUp(onboardingId: number, submission: { id: number; name: string | null; phone: string | null; email: string | null }): Promise<StartResult> {
  return startRun(onboardingId, 'new_lead', { name: submission.name, phone: submission.phone, email: submission.email }, { table: 'form_submissions', id: submission.id });
}

/**
 * A missed call becomes a new-lead follow-up that waits 30 minutes. If the
 * caller texts back or gets through in those 30 minutes the run is stopped
 * (inbound text: the SMS route; answered inbound call: the status route; and
 * contactRepliedSince before every send). When the text-back already went out
 * it was the first touch, with the STOP line, so the run starts at step 2.
 */
export async function startMissedCallFollowUp(onboardingId: number, callSid: string, from: string, textedBack: boolean): Promise<StartResult> {
  await ensureSchema();
  const { rows } = await sql<{ id: DbId; started_at: DbTime }>`
    SELECT id, started_at FROM phone_calls WHERE call_sid = ${callSid} AND onboarding_id = ${onboardingId} LIMIT 1;
  `;
  if (!rows[0]) return { started: false, reason: 'no_contact' };
  const calledAt = new Date(rows[0].started_at);
  return startRun(
    onboardingId,
    'new_lead',
    { name: null, phone: from, email: null },
    { table: 'phone_calls', id: Number(rows[0].id) },
    { anchorAt: calledAt, notBefore: new Date(calledAt.getTime() + MISSED_CALL_WAIT_MINUTES * 60_000), startStep: textedBack ? 1 : 0 }
  );
}

/** Stops every active run for this phone or email (all kinds unless given). Returns how many stopped. */
export async function stopRunsFor(
  onboardingId: number,
  match: { phone?: string | null; email?: string | null; kinds?: SequenceKind[] },
  reason: RunStopReason
): Promise<number> {
  const phone = normalizePhone(match.phone);
  const email = normalizeEmail(match.email);
  if (!phone && !email) return 0;
  const kinds = match.kinds?.length ? match.kinds : [...SEQUENCE_KINDS];
  await ensureSchema();
  const { rows } = await sql<{ id: DbId }>`
    UPDATE sequence_runs SET status = 'stopped', stop_reason = ${reason}, updated_at = now()
    WHERE onboarding_id = ${onboardingId} AND status = 'active'
      AND (contact_phone = ${phone} OR contact_email = ${email})
      AND kind = ANY(${kinds as unknown as string}::text[])
    RETURNING id;
  `;
  return rows.length;
}

async function stopRun(id: number, reason: RunStopReason): Promise<void> {
  await sql`UPDATE sequence_runs SET status = 'stopped', stop_reason = ${reason}, updated_at = now() WHERE id = ${id} AND status = 'active';`;
}

async function finishRun(id: number): Promise<void> {
  await sql`UPDATE sequence_runs SET status = 'done', updated_at = now() WHERE id = ${id} AND status = 'active';`;
}

/**
 * Has a person been in touch since `since`: an inbound text from this number,
 * or an answered inbound call from it. Press-1 connect calls are not matched
 * here by time: a form lead's run looks its connect call up by lead id
 * (latestConnectCall), and the connect status route stops runs when one is answered.
 */
export async function contactRepliedSince(onboardingId: number, phone: string, since: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM phone_messages
      WHERE onboarding_id = ${onboardingId} AND direction = 'inbound' AND from_number = ${phone} AND created_at >= ${since}
    UNION ALL
    SELECT 1 FROM phone_calls
      WHERE onboarding_id = ${onboardingId} AND direction = 'inbound' AND outcome = 'answered' AND from_number = ${phone} AND started_at >= ${since}
    LIMIT 1;
  `;
  return rows.length > 0;
}

/** The latest press-1 connect call for one form lead (phone_calls.lead_id), or null when there was none. */
async function latestConnectCall(onboardingId: number, leadId: number): Promise<{ outcome: string; dialStatus: string | null; startedAt: Date } | null> {
  const { rows } = await sql<{ outcome: string; dial_status: string | null; started_at: DbTime }>`
    SELECT outcome, dial_status, started_at FROM phone_calls
    WHERE onboarding_id = ${onboardingId} AND direction = 'connect' AND lead_id = ${leadId}
    ORDER BY started_at DESC, id DESC
    LIMIT 1;
  `;
  const r = rows[0];
  return r ? { outcome: r.outcome, dialStatus: r.dial_status, startedAt: new Date(r.started_at) } : null;
}

// ─────────────────────────── The worker ───────────────────────────

/**
 * Leases up to `limit` due runs in one statement: their next_at moves 10
 * minutes out, so an overlapping tick (SKIP LOCKED) or a crashed one cannot
 * pick the same run until the lease ends.
 */
export async function dueRuns(limit: number = DUE_BATCH): Promise<SequenceRun[]> {
  await ensureSchema();
  const { rows } = await sql<RunRow>`
    UPDATE sequence_runs SET next_at = now() + make_interval(mins => ${LEASE_MINUTES}), updated_at = now()
    WHERE id IN (
      SELECT id FROM sequence_runs
      WHERE status = 'active' AND next_at <= now()
      ORDER BY next_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `;
  return rows.map(toRun);
}

async function releaseRuns(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await sql`UPDATE sequence_runs SET next_at = now(), updated_at = now() WHERE status = 'active' AND id = ANY(${ids as unknown as string}::bigint[]);`;
}

/**
 * Something failed before a step was claimed (a load, a lookup, the claim
 * itself): count the attempt and record why, so a run that keeps failing stops
 * after MAX_ATTEMPTS instead of re-firing every tick. Never throws.
 */
async function recordFailure(runId: number, err: unknown): Promise<void> {
  const message = clip(errText(err));
  console.error('sequences: run failed', runId, message);
  try {
    await sql`
      UPDATE sequence_runs
      SET attempts = attempts + 1,
          last_error = ${message},
          status = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'stopped' ELSE 'active' END,
          stop_reason = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'failed' ELSE stop_reason END,
          next_at = now() + make_interval(mins => ${RETRY_MINUTES}),
          updated_at = now()
      WHERE id = ${runId} AND status = 'active';
    `;
  } catch (writeErr) {
    console.error('sequences: failure not recorded', runId, clip(errText(writeErr)));
  }
}

type SendDecision = Extract<RunDecision, { type: 'send' }>;

/**
 * Claims the step, sends it, then books the outcome. The claim moves the run
 * past this step under a lease (next_at 10 minutes out), so if anything dies
 * after it the step is skipped, never sent twice. A throw from the send puts
 * the step back only when nothing went out for certain (an email; a text Twilio
 * refused with a 4xx), and only while the run is still active: a run stopped
 * meanwhile (a tap, the template turned off) stays stopped. A text whose send
 * failed unclearly (it may have left) is never retried: the run moves past it.
 */
async function claimAndSend(run: SequenceRun, c: ClientContext, d: SendDecision, deadline: number | undefined): Promise<RunOutcome> {
  const claimedStep = d.next ? d.next.step : d.step + 1;
  const smsDelta = d.channel === 'sms' ? 1 : 0;
  // Checked here, after any wait for the email gate: no send starts that the tick may not live to finish booking.
  if (deadline !== undefined && deadline - Date.now() < SEND_MIN_REMAINING_MS) {
    try {
      await sql`UPDATE sequence_runs SET next_at = now(), updated_at = now() WHERE id = ${run.id} AND status = 'active' AND step = ${run.step};`;
    } catch (err) {
      console.error('sequences: run not released (its lease ends in 10 minutes)', run.id, clip(errText(err)));
    }
    return 'released';
  }
  try {
    const claim = await sql`
      UPDATE sequence_runs
      SET step = ${claimedStep},
          next_at = now() + make_interval(mins => ${LEASE_MINUTES}),
          sent_count = sent_count + 1,
          updated_at = now()
      WHERE id = ${run.id} AND status = 'active' AND step = ${run.step}
      RETURNING id;
    `;
    if (!claim.rows.length) return 'skipped';
  } catch (err) {
    await recordFailure(run.id, err);
    return 'failed';
  }

  // The send. A refusal (nothing sent, by design) is kept apart from a throw (nothing sent, by accident).
  let refusal: string | null = null;
  try {
    if (d.channel === 'sms') {
      if (!c.line) refusal = 'sms_pending';
      else {
        const r = await sendClientSms(c.line, d.to, d.body, run.kind === 'reminder' ? 'reminder' : 'sequence');
        if (!r.sent) refusal = r.reason;
      }
    } else {
      const r = await sendSequenceEmail({
        onboardingId: run.onboardingId,
        businessName: c.onboarding?.businessName ?? null,
        replyTo: c.onboarding?.clientEmail ?? null,
        to: d.to,
        subject: d.subject ?? '',
        body: d.body,
        // A Resend timeout that did deliver, then a retry of this step, must not land twice.
        idempotencyKey: `seq-${run.id}-${claimedStep}`,
      });
      if (r.skipped) refusal = 'email_opted_out';
      else {
        // Into the inbox timeline of an existing contact (never creates one): one event per run step (ref_part = the
        // step that went out). Caught here, not thrown: a throw inside this try would put an email that already left
        // back in the queue and send it again.
        await upsertContactEvent({
          onboardingId: run.onboardingId,
          kind: 'sequence',
          refTable: 'sequence_runs',
          refId: run.id,
          refPart: d.step,
          phone: run.contactPhone,
          email: run.contactEmail,
          name: run.contactName,
          summary: eventSummary('sequence', { channel: 'email', automatic: true }),
          payload: { channel: 'email', step: d.step, automatic: true },
          createdAt: new Date().toISOString(),
          createIfMissing: false,
        }).catch((err) => console.error('sequences: email not added to the inbox', run.id, clip(errText(err))));
      }
    }
  } catch (err) {
    const message = clip(errText(err));
    if (d.channel === 'sms' && !isDefiniteRejection(err)) {
      // Unclear (a reset connection, a timeout, bad JSON on a 2xx): the text may have left, so it is never sent again.
      // The run moves on as if sent, without counting it as a delivered text or a send time.
      console.error('sequences: text send unclear, step not retried', run.id, message);
      try {
        await sql`
          UPDATE sequence_runs
          SET last_error = ${`unclear: ${message}`},
              status = ${d.next ? 'active' : 'done'},
              next_at = ${(d.next ? d.next.at : new Date()).toISOString()},
              updated_at = now()
          WHERE id = ${run.id} AND status = 'active' AND step = ${claimedStep};
        `;
      } catch (writeErr) {
        console.error('sequences: unclear send not recorded (the step stays skipped)', run.id, clip(errText(writeErr)));
      }
      return 'failed';
    }
    // A definite refusal (nothing went out): put the step back and retry later. Emails keep their idempotency key.
    console.error('sequences: send failed', run.id, message);
    try {
      await sql`
        UPDATE sequence_runs
        SET step = ${run.step},
            attempts = attempts + 1,
            last_error = ${message},
            sent_count = sent_count - 1,
            status = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'stopped' ELSE 'active' END,
            stop_reason = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'failed' ELSE stop_reason END,
            next_at = now() + make_interval(mins => ${RETRY_MINUTES}),
            updated_at = now()
        WHERE id = ${run.id} AND status = 'active' AND step = ${claimedStep};
      `;
    } catch (writeErr) {
      console.error('sequences: send failure not recorded (the step stays skipped)', run.id, clip(errText(writeErr)));
    }
    return 'failed';
  }

  // Bookkeeping after the send. A failure here must never read as "not sent" (that would resend).
  try {
    if (!refusal) {
      // Only a text that really left counts towards priorSmsSent; the claim never touches sms_sent_count.
      await sql`
        UPDATE sequence_runs
        SET sms_sent_count = sms_sent_count + ${smsDelta},
            last_sent_at = now(),
            status = ${d.next ? 'active' : 'done'},
            next_at = ${(d.next ? d.next.at : new Date()).toISOString()},
            updated_at = now()
        WHERE id = ${run.id} AND status = 'active' AND step = ${claimedStep};
      `;
      return 'sent';
    }
    // Refused: nothing went out, so the counters come back down and the reason is kept on the run.
    // A number that cannot take texts will not take the next one either.
    const stopReason: StopReason | null =
      refusal === 'opted_out' || (refusal === 'email_opted_out' && !run.contactPhone) ? 'opted_out' : refusal === 'bad_number' ? 'bad_number' : null;
    const stop = stopReason !== null;
    await sql`
      UPDATE sequence_runs
      SET last_error = ${`${d.channel} step ${d.step + 1} not sent: ${refusal}`},
          sent_count = sent_count - 1,
          status = ${stop ? 'stopped' : d.next ? 'active' : 'done'},
          stop_reason = ${stopReason},
          next_at = ${(d.next ? d.next.at : new Date()).toISOString()},
          updated_at = now()
      WHERE id = ${run.id} AND status = 'active' AND step = ${claimedStep};
    `;
    console.warn('sequences: step refused', run.id, d.channel, refusal);
    return stop ? 'stopped' : 'skipped';
  } catch (err) {
    console.error('sequences: bookkeeping after send failed', run.id, clip(errText(err)));
    return refusal ? 'skipped' : 'sent';
  }
}

/** One leased run: decide, then stop, finish, hold, or claim the step and send it. Never throws. */
export async function advanceRun(
  run: SequenceRun,
  now: Date = new Date(),
  cache: ContextCache = new Map(),
  opts: { deadline?: number } = {}
): Promise<RunOutcome> {
  let c: ClientContext;
  let d: RunDecision;
  try {
    c = await clientContext(run.onboardingId, cache);
    const [optedOut, emailOptedOut, replied] = await Promise.all([
      run.contactPhone ? isOptedOut(run.onboardingId, run.contactPhone) : Promise.resolve(false),
      run.contactEmail ? isEmailOptedOut(run.onboardingId, run.contactEmail) : Promise.resolve(false),
      run.contactPhone && (run.kind === 'new_lead' || run.kind === 'quote')
        ? contactRepliedSince(run.onboardingId, run.contactPhone, run.createdAt)
        : Promise.resolve(false),
    ]);
    if (emailOptedOut && !run.contactPhone) {
      await stopRun(run.id, 'opted_out');
      return 'stopped';
    }
    // The template was edited after this run started: stop it rather than send a mix of old and new steps. New leads get the new one.
    const current = c.templates.get(run.kind);
    if (run.templateUpdatedAt && current?.updatedAt && current.updatedAt !== run.templateUpdatedAt) {
      await stopRun(run.id, 'template_changed');
      return 'stopped';
    }
    // A form lead's press-1 connect call, found by lead id: answered stops the follow-up; one still live holds it.
    if (run.kind === 'new_lead' && run.refTable === 'form_submissions') {
      const call = await latestConnectCall(run.onboardingId, run.refId);
      const connect = connectCallDecision({ outcome: call?.outcome ?? null, dialStatus: call?.dialStatus ?? null, startedAt: call?.startedAt ?? null, now });
      if (connect === 'stop') {
        await stopRun(run.id, 'answered');
        return 'stopped';
      }
      if (connect === 'hold') {
        await sql`
          UPDATE sequence_runs SET next_at = now() + make_interval(mins => ${CONNECT_RECHECK_MINUTES}), updated_at = now()
          WHERE id = ${run.id} AND status = 'active' AND step = ${run.step};
        `;
        return 'held';
      }
    }
    // A booking reminder only goes while its booking is still on: a cancel (or 'done') whose
    // stopBookingReminders never landed is caught here before anything sends.
    if (run.kind === 'reminder' && run.refTable === 'bookings') {
      const { rows } = await sql<{ status: string }>`SELECT status FROM bookings WHERE id = ${run.refId} LIMIT 1;`;
      if (rows[0]?.status !== 'booked') {
        await stopRun(run.id, 'cancelled');
        return 'stopped';
      }
    }
    d = decideRun(
      {
        kind: run.kind,
        step: run.step,
        anchorAt: new Date(run.anchorAt),
        contactPhone: run.contactPhone,
        contactEmail: run.contactEmail,
        contactName: run.contactName,
        priorSmsSent: run.smsSentCount > 0,
        lastSentAt: run.lastSentAt ? new Date(run.lastSentAt) : null,
      },
      {
        template: c.templates.get(run.kind) ?? null,
        tierAllowed: tierAllowed(c.onboarding),
        optedOut,
        replied,
        smsReady: smsReady(c.line),
        // An unsubscribed address simply has no email steps left; texts carry on.
        emailReady: emailConfigured() && !emailOptedOut,
        timeZone: c.timeZone,
        vars: varsFor(c, null),
        now,
      }
    );
    if (d.type === 'stop') {
      await stopRun(run.id, d.reason);
      return 'stopped';
    }
    if (d.type === 'done') {
      await finishRun(run.id);
      return 'done';
    }
    if (d.type === 'hold') {
      await sql`UPDATE sequence_runs SET step = ${d.step}, next_at = ${d.until.toISOString()}, updated_at = now() WHERE id = ${run.id} AND status = 'active' AND step = ${run.step};`;
      return 'held';
    }
  } catch (err) {
    await recordFailure(run.id, err);
    return 'failed';
  }
  const send = d;
  const ctx = c;
  return send.channel === 'email' ? emailGate(() => claimAndSend(run, ctx, send, opts.deadline)) : claimAndSend(run, ctx, send, opts.deadline);
}

/**
 * The cron's work: lease up to 200 due runs and advance them 10 at a time
 * (emails among them still go 2 at a time, 600 ms apart). When the time budget
 * runs out, the rest are released for the next tick.
 */
export async function processDueRuns(opts: { now?: Date; limit?: number; deadline?: number } = {}): Promise<ProcessCounts> {
  const deadline = opts.deadline ?? Date.now() + DEFAULT_BUDGET_MS;
  const counts: ProcessCounts = { picked: 0, sent: 0, held: 0, done: 0, stopped: 0, failed: 0, skipped: 0, leftover: 0 };
  const runs = await dueRuns(opts.limit ?? DUE_BATCH);
  counts.picked = runs.length;
  const cache: ContextCache = new Map();
  for (let i = 0; i < runs.length; i += SEND_CONCURRENCY) {
    if (Date.now() > deadline) {
      const left = runs.slice(i).map((r) => r.id);
      counts.leftover = left.length;
      await releaseRuns(left);
      break;
    }
    const batch = runs.slice(i, i + SEND_CONCURRENCY);
    const outcomes = await Promise.all(
      batch.map((run) =>
        advanceRun(run, opts.now ?? new Date(), cache, { deadline }).catch(async (err): Promise<RunOutcome> => {
          // advanceRun does not throw; this is the last net, and it still counts the attempt.
          await recordFailure(run.id, err);
          return 'failed';
        })
      )
    );
    for (const o of outcomes) {
      if (o === 'released') counts.leftover += 1;
      else counts[o] += 1;
    }
  }
  return counts;
}

/**
 * Quarterly check-in: during the first local week of Jan/Apr/Jul/Oct, once per
 * client per quarter, one run per consented, not-opted-out past customer, spread
 * by scheduleReactivation (from 10 am, at most 50 a day). Inserts go in batches
 * of 500; a client already fully started this quarter is skipped, one that was
 * cut off part-way is finished (ON CONFLICT keeps it to one run per customer).
 */
export async function kickOffReactivation(now: Date = new Date(), deadline: number = Date.now() + 10_000): Promise<{ clients: number; runs: number }> {
  await ensureSchema();
  const { rows: clients } = await sql<{ onboarding_id: number; updated_at: DbTime }>`
    SELECT t.onboarding_id, t.updated_at FROM sequence_templates t JOIN onboardings o ON o.id = t.onboarding_id
    WHERE t.kind = 'reactivation' AND t.enabled AND o.tier <> 'essentials' AND o.status <> 'closed';
  `;
  let started = 0;
  let made = 0;
  for (const { onboarding_id: onboardingId, updated_at: templateUpdatedAt } of clients) {
    if (Date.now() > deadline) break;
    const line = await getLine(onboardingId);
    if (!smsReady(line)) continue;
    const timeZone = safeTimeZone(line?.timeZone);
    const window = reactivationWindow(now, timeZone);
    if (!window) continue;
    const refTable = `past_customers@${window}`;
    const { rows: tally } = await sql<{ eligible: number; already: number }>`
      SELECT
        (SELECT count(*)::int FROM past_customers p
          WHERE p.onboarding_id = ${onboardingId} AND p.consent_attested_at IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM phone_opt_outs x WHERE x.onboarding_id = p.onboarding_id AND x.phone_number = p.phone)) AS eligible,
        (SELECT count(*)::int FROM sequence_runs
          WHERE onboarding_id = ${onboardingId} AND kind = 'reactivation' AND ref_table = ${refTable}) AS already;
    `;
    const eligible = Number(tally[0]?.eligible ?? 0);
    if (!eligible || Number(tally[0]?.already ?? 0) >= eligible) continue;
    const times = scheduleReactivation(eligible, now, timeZone).map((t) => t.toISOString());
    let inClient = 0;
    for (let offset = 0; offset < eligible; offset += REACTIVATION_BATCH) {
      const { rows: customers } = await sql<{ id: DbId; name: string; phone: string }>`
        SELECT p.id, p.name, p.phone FROM past_customers p
        WHERE p.onboarding_id = ${onboardingId} AND p.consent_attested_at IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM phone_opt_outs x WHERE x.onboarding_id = p.onboarding_id AND x.phone_number = p.phone)
        ORDER BY p.last_job_at DESC NULLS LAST, p.id
        LIMIT ${REACTIVATION_BATCH} OFFSET ${offset};
      `;
      if (!customers.length) break;
      const at = customers.map((_, i) => times[Math.min(offset + i, times.length - 1)]);
      const ids = customers.map((r) => Number(r.id));
      const phones = customers.map((r) => r.phone);
      const names = customers.map((r) => r.name);
      const { rows: inserted } = await sql`
        INSERT INTO sequence_runs (onboarding_id, kind, contact_phone, contact_name, ref_table, ref_id, step, anchor_at, next_at, template_updated_at)
        SELECT ${onboardingId}::int, 'reactivation', u.phone, u.name, ${refTable}::text, u.id, 0, u.at, u.at, ${iso(templateUpdatedAt)}::timestamptz
        FROM unnest(
          ${ids as unknown as string}::bigint[],
          ${phones as unknown as string}::text[],
          ${names as unknown as string}::text[],
          ${at as unknown as string}::timestamptz[]
        ) AS u(id, phone, name, at)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `;
      inClient += inserted.length;
    }
    started += 1;
    made += inClient;
  }
  return { clients: started, runs: made };
}

export async function runCounts(onboardingId: number): Promise<RunCounts> {
  await ensureSchema();
  const { rows } = await sql<{ kind: string; status: string; n: number }>`
    SELECT kind, status, count(*)::int AS n FROM sequence_runs WHERE onboarding_id = ${onboardingId} GROUP BY kind, status;
  `;
  const out = emptyRunCounts();
  for (const r of rows) {
    if (isSequenceKind(r.kind) && (r.status === 'active' || r.status === 'done' || r.status === 'stopped')) out[r.kind][r.status] = Number(r.n);
  }
  return out;
}

/** Everything the admin Sequences card needs, for the page load and every API response. */
export async function sequencesAdminData(onboardingId: number): Promise<SequencesAdminData> {
  await ensureSchema();
  const [templates, settings, counts, customers, line, leadRows, stopRows] = await Promise.all([
    getTemplates(onboardingId),
    getSequenceSettings(onboardingId),
    runCounts(onboardingId),
    pastCustomerCounts(onboardingId),
    getLine(onboardingId),
    sql<{ id: DbId; name: string | null; phone: string | null; email: string | null; stage: string; created_at: DbTime }>`
      SELECT id, name, phone, email, stage, created_at FROM form_submissions
      WHERE onboarding_id = ${onboardingId} AND NOT is_test ORDER BY created_at DESC, id DESC LIMIT 10;
    `,
    sql<{ reason: string | null; n: number }>`
      SELECT stop_reason AS reason, count(*)::int AS n FROM sequence_runs
      WHERE onboarding_id = ${onboardingId} AND status = 'stopped' GROUP BY stop_reason ORDER BY n DESC;
    `,
  ]);
  return {
    templates, settings, counts, customers, smsReady: smsReady(line), canDraft: Boolean(process.env.ANTHROPIC_API_KEY),
    recentLeads: leadRows.rows.map((r) => ({
      id: Number(r.id), name: r.name, maskedPhone: r.phone ? maskNumber(r.phone) : null, hasEmail: Boolean(r.email), stage: r.stage, createdAt: iso(r.created_at),
    })),
    stops: stopRows.rows.map((r) => ({ reason: r.reason ?? 'unknown', n: Number(r.n) })),
  };
}
