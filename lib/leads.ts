// lib/leads.ts
// Website form leads, server side (slice 2). /api/lead writes a row here and,
// after answering the visitor, calls deliverLead: an email to the client, a
// text to the owner's cell through their own line, and a call connect call.
// The connect webhooks read and mark rows; PROOF's Leads tab reads
// listSubmissions. Server-only.
import { createHmac } from 'node:crypto';
import { ensureSchema, isDatabaseConfigured, sql } from '@/lib/db';
import { iso, errText, type DbId, type DbTime } from '@/lib/dbRows';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { sendClientLeadAlert } from '@/lib/email';
import { getLine, sendOwnerAlert, startConnectCall } from '@/lib/phoneLines';
import { REPORT_TIME_ZONE, isValidMonth } from '@/lib/siteStats';
import { normalizePhone } from '@/lib/phoneShared';
import { DUPLICATE_WINDOW_MINUTES, isRecentDuplicate, leadAlertText, planLeadDelivery, type DeliveryReport, type FormSubmission, type LeadInput } from '@/lib/leadShared';
import type { Onboarding } from '@/lib/onboarding';

/** At most this many submissions per IP hash per site in the window (spec, "Slice 2 design"). */
export const LEAD_RATE_LIMIT = 5;
export const LEAD_RATE_WINDOW_MINUTES = 10;

/** `recent` is the count already in the window, before this submission. */
export function isRateLimited(recent: number, limit: number = LEAD_RATE_LIMIT): boolean {
  return recent >= limit;
}

export type LeadOwner = Pick<Onboarding, 'id' | 'tier' | 'businessName' | 'clientEmail'>;

interface SubmissionRow {
  id: DbId;
  onboarding_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  page: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_test: boolean;
  connect_pressed_at: DbTime | null;
  alert_text_status: string | null;
  created_at: DbTime;
}

const toSubmission = (r: SubmissionRow): FormSubmission => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  name: r.name,
  phone: r.phone,
  email: r.email,
  message: r.message,
  page: r.page,
  utmSource: r.utm_source,
  utmMedium: r.utm_medium,
  utmCampaign: r.utm_campaign,
  isTest: r.is_test,
  connectPressedAt: r.connect_pressed_at ? iso(r.connect_pressed_at) : null,
  createdAt: iso(r.created_at),
});

/** The rate-limit key. The IP itself never reaches the table; this keyed hash does. */
export function leadIpHash(ip: string, secret: string): string {
  return createHmac('sha256', secret || 'axeon-lead').update(`lead|${ip}`).digest('hex').slice(0, 32);
}

export async function recordFormSubmission(onboardingId: number, input: LeadInput, meta: { ipHash: string; isTest?: boolean }): Promise<FormSubmission> {
  await ensureSchema();
  const { rows } = await sql<SubmissionRow>`
    INSERT INTO form_submissions (onboarding_id, name, phone, email, message, page, utm_source, utm_medium, utm_campaign, ip_hash, is_test)
    VALUES (${onboardingId}, ${input.name}, ${input.phone}, ${input.email}, ${input.message}, ${input.page},
            ${input.utmSource}, ${input.utmMedium}, ${input.utmCampaign}, ${meta.ipHash}, ${meta.isTest ?? false})
    RETURNING *;
  `;
  return toSubmission(rows[0]);
}

/** Submissions from this IP hash to this client in the last `minutes`. In the table, because serverless instances share no memory. */
export async function recentSubmissionCount(onboardingId: number, ipHash: string, minutes: number): Promise<number> {
  await ensureSchema();
  const { rows } = await sql<{ n: number }>`
    SELECT count(*)::int AS n FROM form_submissions
    WHERE onboarding_id = ${onboardingId} AND ip_hash = ${ipHash}
      AND created_at > now() - make_interval(mins => ${Math.round(minutes)});
  `;
  return Number(rows[0]?.n ?? 0);
}

/** How long after one call connect call starts for a client before another may ring the owner (S2-R16). */
export const CONNECT_COOLDOWN_MINUTES = 2;

/**
 * This client's real (non-test) submissions in the last `minutes` with the same
 * phone or the same email (case ignored), other than `excludeId` (the lead being
 * delivered). isRecentDuplicate makes the call; this only narrows the rows.
 */
export async function recentSubmissionsForContact(
  onboardingId: number,
  contact: { phone: string | null; email: string | null; excludeId: number },
  minutes: number,
): Promise<{ phone: string | null; email: string | null; createdAt: string }[]> {
  if (!contact.phone && !contact.email) return [];
  await ensureSchema();
  const { rows } = await sql<{ phone: string | null; email: string | null; created_at: DbTime }>`
    SELECT phone, email, created_at FROM form_submissions
    WHERE onboarding_id = ${onboardingId} AND is_test = false AND id <> ${contact.excludeId}
      AND created_at > now() - make_interval(mins => ${Math.round(minutes)})
      AND ((${contact.phone}::text IS NOT NULL AND phone = ${contact.phone})
        OR (${contact.email}::text IS NOT NULL AND lower(email) = lower(${contact.email})))
    ORDER BY created_at DESC
    LIMIT 20;
  `;
  return rows.map((r) => ({ phone: r.phone, email: r.email, createdAt: iso(r.created_at) }));
}

/** When the latest call connect call for this client started, if one started in the last `minutes`; else null. */
export async function recentConnectCallStartedAt(onboardingId: number, minutes: number): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql<{ started_at: DbTime }>`
    SELECT started_at FROM phone_calls
    WHERE onboarding_id = ${onboardingId} AND direction = 'connect'
      AND started_at > now() - make_interval(mins => ${Math.round(minutes)})
    ORDER BY started_at DESC
    LIMIT 1;
  `;
  return rows[0] ? iso(rows[0].started_at) : null;
}

/** A lead as the connect webhooks read it: plus what happened to the owner text (S2-R1; null = unknown). */
export interface StoredSubmission extends FormSubmission {
  alertTextStatus: string | null;
}

/** One lead, only if it is this client's: the connect webhooks bind ?lead= to the line's onboarding through this. */
export async function getSubmission(onboardingId: number, id: number): Promise<StoredSubmission | null> {
  await ensureSchema();
  const { rows } = await sql<SubmissionRow>`SELECT * FROM form_submissions WHERE id = ${id} AND onboarding_id = ${onboardingId} LIMIT 1;`;
  return rows[0] ? { ...toSubmission(rows[0]), alertTextStatus: rows[0].alert_text_status ?? null } : null;
}

/** The month's real (non-test) form leads, newest first. Month is YYYY-MM in REPORT_TIME_ZONE, like leadRows. */
export async function listSubmissions(onboardingId: number, month: string, limit = 200): Promise<FormSubmission[]> {
  if (!isDatabaseConfigured() || !isValidMonth(month)) return [];
  await ensureSchema();
  const first = `${month}-01`;
  const { rows } = await sql<SubmissionRow>`
    SELECT * FROM form_submissions
    WHERE onboarding_id = ${onboardingId} AND is_test = false
      AND created_at >= (${first}::timestamp AT TIME ZONE ${REPORT_TIME_ZONE})
      AND created_at < ((${first}::date + interval '1 month') AT TIME ZONE ${REPORT_TIME_ZONE})
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit};
  `;
  return rows.map(toSubmission);
}

/** The owner pressed 1. The first press time is kept if Twilio retries. */
export async function markConnectPressed(onboardingId: number, leadId: number, callSid: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE form_submissions
    SET connect_pressed_at = COALESCE(connect_pressed_at, now()), connect_call_sid = COALESCE(NULLIF(${callSid}, ''), connect_call_sid)
    WHERE id = ${leadId} AND onboarding_id = ${onboardingId};
  `;
}

async function noteConnectCall(onboardingId: number, leadId: number, callSid: string): Promise<void> {
  await sql`UPDATE form_submissions SET connect_call_sid = ${callSid} WHERE id = ${leadId} AND onboarding_id = ${onboardingId};`;
}

/** What happened to the owner text, kept on the row so the connect whisper can say whether "we texted you" is true. */
async function noteAlertText(onboardingId: number, leadId: number, status: DeliveryReport['text']): Promise<void> {
  await sql`UPDATE form_submissions SET alert_text_status = ${status} WHERE id = ${leadId} AND onboarding_id = ${onboardingId};`;
}

/**
 * Everything a new lead sets off. Runs inside after() from /api/lead, and
 * directly from the admin's test button. Each channel fails on its own: a
 * Twilio error never stops the email, and the report says what happened.
 */
export async function deliverLead(owner: LeadOwner, lead: FormSubmission, opts: { now?: Date; test?: boolean } = {}): Promise<DeliveryReport> {
  // The email does not depend on the line, so it starts first and runs alongside the phone steps.
  const email = sendClientLeadAlert({ to: owner.clientEmail, businessName: owner.businessName, lead, proofUrl: `${APP_ORIGIN}/?tab=leads`, test: Boolean(opts.test) })
    .then((sent): DeliveryReport['email'] => (sent ? 'sent' : 'off'))
    .catch((err): DeliveryReport['email'] => {
      console.error('[lead] email', lead.id, errText(err));
      return 'failed';
    });

  const now = opts.now ?? new Date();

  // One lead, one ring (S2-R16): the same person writing again within the window gets the email only.
  let duplicate = false;
  try {
    const candidates = await recentSubmissionsForContact(owner.id, { phone: lead.phone, email: lead.email, excludeId: lead.id }, DUPLICATE_WINDOW_MINUTES);
    duplicate = isRecentDuplicate({ candidates, phone: lead.phone, email: lead.email, now });
  } catch (err) {
    // Cannot tell, so deliver as new: a second ring beats a lost lead.
    console.error('[lead] duplicate check failed', lead.id, errText(err));
  }
  if (duplicate) {
    const report: DeliveryReport = { email: await email, text: 'duplicate', connect: 'duplicate' };
    await noteAlertText(owner.id, lead.id, report.text).catch((err) => console.error('[lead] alert status not saved', lead.id, errText(err)));
    console.info('[lead] delivered', lead.id, report);
    return report;
  }

  let line: Awaited<ReturnType<typeof getLine>>;
  try {
    line = await getLine(owner.id);
  } catch (err) {
    // Without the line we cannot tell what to send, so the phone steps are skipped; the email still went.
    console.error('[lead] line lookup failed, phone steps skipped', lead.id, errText(err));
    const report: DeliveryReport = { email: await email, text: 'failed', connect: 'failed' };
    await noteAlertText(owner.id, lead.id, report.text).catch((e) => console.error('[lead] alert status not saved', lead.id, errText(e)));
    return report;
  }
  const plan = planLeadDelivery({ tier: owner.tier, line, leadPhone: lead.phone, now });

  // The text goes before the call, so "we texted you their details" is already true when the owner hears it.
  let text: DeliveryReport['text'];
  if (plan.text !== 'send') text = plan.text;
  else if (!line) text = 'no_line';
  else {
    try {
      const r = await sendOwnerAlert(line, leadAlertText(lead));
      text = r.sent ? 'sent' : r.reason;
    } catch (err) {
      console.error('[lead] owner text', lead.id, errText(err));
      text = 'failed';
    }
  }
  await noteAlertText(owner.id, lead.id, text).catch((err) => console.error('[lead] alert status not saved', lead.id, errText(err)));

  // Another lead just rang the owner: two calls at once would collide, and the email and text already carry this one.
  let cooldown = false;
  if (plan.connect === 'call') {
    try {
      cooldown = (await recentConnectCallStartedAt(owner.id, CONNECT_COOLDOWN_MINUTES)) !== null;
    } catch (err) {
      console.error('[lead] cooldown check failed', lead.id, errText(err));
    }
  }

  let connect: DeliveryReport['connect'];
  if (plan.connect !== 'call') connect = plan.connect;
  else if (!line || !lead.phone) connect = 'no_phone';
  else if (cooldown) connect = 'cooldown';
  else {
    try {
      const { sid } = await startConnectCall(line, { id: lead.id, phone: lead.phone });
      await noteConnectCall(owner.id, lead.id, sid).catch((err) => console.error('[lead] connect sid not saved', sid, errText(err)));
      connect = 'started';
    } catch (err) {
      console.error('[lead] call connect', lead.id, errText(err));
      connect = 'failed';
    }
  }

  const report: DeliveryReport = { email: await email, text, connect };
  console.info('[lead] delivered', lead.id, report);
  return report;
}

/**
 * The admin's "Send test lead": a fake submission for this client, delivered
 * the real way (email marked [Test], owner text, call connect to the owner's
 * cell, which then dials `phoneRaw` on 1). Test rows never show in PROOF.
 */
export async function sendTestLead(owner: LeadOwner, phoneRaw: unknown): Promise<DeliveryReport> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) throw new Error("Enter the test lead's phone: a 10-digit US number that is not the owner's forward-to (use your own cell)");
  const line = await getLine(owner.id);
  if (line && phone === line.forwardTo) throw new Error('Use a second phone, not the forward-to number.');
  const lead = await recordFormSubmission(
    owner.id,
    { name: 'Test Lead', phone, email: null, message: 'This is a test lead sent from the Axeon admin. Nothing to do.', page: '/axeon-test', utmSource: null, utmMedium: null, utmCampaign: null },
    { ipHash: 'admin-test', isTest: true },
  );
  return deliverLead(owner, lead, { test: true });
}
