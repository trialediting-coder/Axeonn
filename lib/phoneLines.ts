// lib/phoneLines.ts
// The AxeonCORE phone layer: one tracked local number per client that forwards
// to their cell, records calls, and texts back a missed call. Provisioning talks
// to Twilio (lib/twilio.ts); the webhooks under app/api/phone call the record*
// functions; PROOF and the monthly report read callsSummary. Server-only.
// Every outbound text goes through sendClientSms, the one gated send path.
import { ensureSchema, sql } from '@/lib/db';
import { attachNumberToService, buyNumber, createMessagingService, isTwilioConfigured, releaseNumber, searchLocalNumbers, sendSms, webhookUrl } from '@/lib/twilio';
import { callerKey, normalizePhone, textBackMessage, SMS_MAX_CHARS, type CallOutcome, type CallsSummary, type PhoneCall, type PhoneLine, type PhoneLineSettings, type SmsStatus } from '@/lib/phoneShared';

export type { PhoneLine, PhoneCall, CallsSummary, SmsStatus, PhoneLineSettings } from '@/lib/phoneShared';

export const TEXT_BACK_WINDOW_HOURS = 24;

// Rates from the spec's cost model; only for the admin card's running estimate.
const RATE = { number: 1.15, tenDlc: 1.5, inboundMin: 0.0085, outboundMin: 0.014, recordingMin: 0.0025, sms: 0.0113 } as const;

// node-postgres hands back BIGINT/SERIAL ids as strings or numbers and TIMESTAMPTZ as Date;
// the mappers below turn them into the numbers and ISO strings the interfaces promise.
type DbId = number | string;
type DbTime = Date | string;

const iso = (t: DbTime): string => new Date(t).toISOString();

interface LineRow {
  id: DbId;
  onboarding_id: number;
  phone_number: string;
  phone_number_sid: string;
  messaging_service_sid: string;
  forward_to: string;
  area_code: string;
  record_calls: boolean;
  consent_notice: boolean;
  text_back_enabled: boolean;
  text_back_message: string | null;
  sms_status: SmsStatus;
  status: 'active' | 'released';
  created_at: DbTime;
  updated_at: DbTime;
}

const toLine = (r: LineRow): PhoneLine => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  phoneNumber: r.phone_number,
  phoneNumberSid: r.phone_number_sid,
  messagingServiceSid: r.messaging_service_sid,
  forwardTo: r.forward_to,
  areaCode: r.area_code,
  recordCalls: r.record_calls,
  consentNotice: r.consent_notice,
  textBackEnabled: r.text_back_enabled,
  textBackMessage: r.text_back_message,
  smsStatus: r.sms_status,
  status: r.status,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

interface CallRow {
  id: DbId;
  call_sid: string;
  from_number: string;
  to_number: string;
  outcome: CallOutcome;
  dial_status: string;
  started_at: DbTime;
  duration_seconds: number | null;
  has_recording: boolean;
  recording_seconds: number | null;
  text_back_sent_at: DbTime | null;
}

const toCall = (r: CallRow): PhoneCall => ({
  id: Number(r.id),
  callSid: r.call_sid,
  fromNumber: r.from_number,
  toNumber: r.to_number,
  outcome: r.outcome,
  dialStatus: r.dial_status,
  startedAt: iso(r.started_at),
  durationSeconds: r.duration_seconds === null ? null : Number(r.duration_seconds),
  hasRecording: Boolean(r.has_recording),
  recordingSeconds: r.recording_seconds === null ? null : Number(r.recording_seconds),
  textBackSentAt: r.text_back_sent_at ? iso(r.text_back_sent_at) : null,
});

const bool = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v === true || v === 'true' || v === 'yes' || v === 'on' || v === 1);

/** The one place a forward-to number is parsed, for the settings form and provisioning alike. */
function parseForwardTo(raw: unknown): string {
  const forwardTo = normalizePhone(raw);
  if (!forwardTo) throw new Error('Forward-to must be a 10-digit US number');
  return forwardTo;
}

/** Admin card input → settings. Throws a message safe to show the admin. */
export function validateLineSettings(raw: Record<string, unknown>, phoneNumber: string | null): PhoneLineSettings {
  const forwardTo = parseForwardTo(raw.forwardTo);
  if (phoneNumber && forwardTo === phoneNumber) throw new Error('The line cannot forward to itself');
  const msg = typeof raw.textBackMessage === 'string' ? raw.textBackMessage.trim() : '';
  if (msg.length > SMS_MAX_CHARS) throw new Error(`The text-back must be ${SMS_MAX_CHARS} characters or fewer`);
  return {
    forwardTo,
    recordCalls: bool(raw.recordCalls, true),
    consentNotice: bool(raw.consentNotice, true),
    textBackEnabled: bool(raw.textBackEnabled, true),
    textBackMessage: msg || null,
  };
}

export function validateAreaCode(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!/^[2-9]\d{2}$/.test(s)) throw new Error('Area code must be three digits, like 515');
  return s;
}

export async function getLine(onboardingId: number): Promise<PhoneLine | null> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`SELECT * FROM phone_lines WHERE onboarding_id = ${onboardingId} AND status = 'active' LIMIT 1;`;
  return rows[0] ? toLine(rows[0]) : null;
}

/** The webhooks' lookup: which client owns the number Twilio just called us about. */
export async function lineForNumber(e164: string): Promise<PhoneLine | null> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`SELECT * FROM phone_lines WHERE phone_number = ${e164} AND status = 'active' LIMIT 1;`;
  return rows[0] ? toLine(rows[0]) : null;
}

const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Buys the client their number. Order matters: the Messaging Service first (it
 * is what the 10DLC campaign hangs off), then the number with its webhooks,
 * then the number into the service, then our row. Anything that fails after the
 * purchase releases the number so a paid-for orphan never sits in the account.
 */
export async function provisionLine(onboarding: { id: number; businessName: string | null }, input: { areaCode: string; forwardTo: string }): Promise<PhoneLine> {
  if (!isTwilioConfigured()) throw new Error('Twilio is not configured');
  if (await getLine(onboarding.id)) throw new Error('This client already has a tracking number');
  const forwardTo = parseForwardTo(input.forwardTo);
  const areaCode = validateAreaCode(input.areaCode);
  const name = onboarding.businessName?.trim() || `Client ${onboarding.id}`;

  // Search before creating anything, so an empty area code leaves nothing behind in Twilio.
  const candidates = await searchLocalNumbers(areaCode);
  if (candidates.length === 0) throw new Error(`No local numbers available in ${areaCode}; try a nearby area code`);
  const service = await createMessagingService({ friendlyName: `Axeon · ${name}`, inboundUrl: webhookUrl('/api/phone/sms') });

  let number: { sid: string; phoneNumber: string };
  try {
    number = await buyNumber({ phoneNumber: candidates[0], friendlyName: `Axeon · ${name}`, voiceUrl: webhookUrl('/api/phone/voice'), smsUrl: webhookUrl('/api/phone/sms') });
  } catch (err) {
    throw new Error(`Could not buy a number; Messaging Service ${service.sid} was created and can be deleted in the Twilio console. ${errText(err)}`);
  }

  try {
    await attachNumberToService(service.sid, number.sid);
    const { rows } = await sql<LineRow>`
      INSERT INTO phone_lines (onboarding_id, phone_number, phone_number_sid, messaging_service_sid, forward_to, area_code)
      VALUES (${onboarding.id}, ${number.phoneNumber}, ${number.sid}, ${service.sid}, ${forwardTo}, ${areaCode})
      RETURNING *;
    `;
    return toLine(rows[0]);
  } catch (err) {
    try {
      await releaseNumber(number.sid);
    } catch (releaseErr) {
      throw new Error(`Provisioning failed after buying ${number.phoneNumber}, and releasing it failed too (${errText(releaseErr)}); release it in the Twilio console. Messaging Service ${service.sid} was created and can be deleted in the Twilio console. ${errText(err)}`);
    }
    throw new Error(`Provisioning failed after buying ${number.phoneNumber}; the number was released. Messaging Service ${service.sid} was created and can be deleted in the Twilio console. ${errText(err)}`);
  }
}

export async function updateLineSettings(onboardingId: number, s: PhoneLineSettings): Promise<PhoneLine> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`
    UPDATE phone_lines
    SET forward_to = ${s.forwardTo}, record_calls = ${s.recordCalls}, consent_notice = ${s.consentNotice},
        text_back_enabled = ${s.textBackEnabled}, text_back_message = ${s.textBackMessage}, updated_at = now()
    WHERE onboarding_id = ${onboardingId} AND status = 'active'
    RETURNING *;
  `;
  if (!rows[0]) throw new Error('No phone line for this client');
  return toLine(rows[0]);
}

export async function setSmsStatus(onboardingId: number, status: SmsStatus): Promise<PhoneLine> {
  await ensureSchema();
  const { rows } = await sql<LineRow>`UPDATE phone_lines SET sms_status = ${status}, updated_at = now() WHERE onboarding_id = ${onboardingId} AND status = 'active' RETURNING *;`;
  if (!rows[0]) throw new Error('No phone line for this client');
  return toLine(rows[0]);
}

/** Twilio retries webhooks, so the same CallSid can arrive twice: an upsert keeps one row. */
export async function recordCall(onboardingId: number, c: { callSid: string; fromNumber: string; toNumber: string; outcome: CallOutcome; dialStatus: string; durationSeconds: number | null }): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO phone_calls (onboarding_id, call_sid, from_number, to_number, outcome, dial_status, duration_seconds)
    VALUES (${onboardingId}, ${c.callSid}, ${c.fromNumber}, ${c.toNumber}, ${c.outcome}, ${c.dialStatus}, ${c.durationSeconds})
    ON CONFLICT (call_sid) DO UPDATE SET
      -- A retried or late webhook must never turn an answered call back into a missed one.
      outcome = CASE WHEN phone_calls.outcome = 'answered' THEN 'answered' ELSE EXCLUDED.outcome END,
      dial_status = CASE WHEN phone_calls.outcome = 'answered' THEN phone_calls.dial_status ELSE EXCLUDED.dial_status END,
      duration_seconds = COALESCE(EXCLUDED.duration_seconds, phone_calls.duration_seconds);
  `;
}

export async function attachRecording(callSid: string, recordingUrl: string, recordingSeconds: number | null): Promise<void> {
  await ensureSchema();
  await sql`UPDATE phone_calls SET recording_url = ${recordingUrl}, recording_seconds = ${recordingSeconds} WHERE call_sid = ${callSid};`;
}

/** The stored Twilio recording URL for one call, only if that call is this client's. For routes that stream the audio behind auth. */
export async function recordingUrlForCall(onboardingId: number, callSid: string): Promise<string | null> {
  await ensureSchema();
  const { rows } = await sql<{ recording_url: string | null }>`SELECT recording_url FROM phone_calls WHERE call_sid = ${callSid} AND onboarding_id = ${onboardingId} LIMIT 1;`;
  return rows[0]?.recording_url ?? null;
}

export async function recordMessage(onboardingId: number, m: { messageSid: string; direction: 'inbound' | 'outbound'; fromNumber: string; toNumber: string; body: string; kind: 'text_back' | 'manual' | 'inbound'; status: string }): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO phone_messages (onboarding_id, message_sid, direction, from_number, to_number, body, kind, status)
    VALUES (${onboardingId}, ${m.messageSid}, ${m.direction}, ${m.fromNumber}, ${m.toNumber}, ${m.body}, ${m.kind}, ${m.status})
    ON CONFLICT (message_sid) DO UPDATE SET status = EXCLUDED.status;
  `;
}

export async function markOptedOut(onboardingId: number, phoneNumber: string): Promise<void> {
  await ensureSchema();
  await sql`INSERT INTO phone_opt_outs (onboarding_id, phone_number) VALUES (${onboardingId}, ${phoneNumber}) ON CONFLICT DO NOTHING;`;
}

/** START / UNSTOP / YES: the caller asked to hear from this client again. */
export async function clearOptOut(onboardingId: number, phoneNumber: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM phone_opt_outs WHERE onboarding_id = ${onboardingId} AND phone_number = ${phoneNumber};`;
}

export async function isOptedOut(onboardingId: number, phoneNumber: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`SELECT 1 FROM phone_opt_outs WHERE onboarding_id = ${onboardingId} AND phone_number = ${phoneNumber} LIMIT 1;`;
  return rows.length > 0;
}

export async function textedBackRecently(onboardingId: number, phoneNumber: string, hours: number = TEXT_BACK_WINDOW_HOURS): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT 1 FROM phone_calls
    WHERE onboarding_id = ${onboardingId} AND from_number = ${phoneNumber}
      AND text_back_sent_at IS NOT NULL AND text_back_sent_at > now() - make_interval(hours => ${Math.round(hours)})
    LIMIT 1;
  `;
  return rows.length > 0;
}

export type ClientSmsResult = { sent: true; sid: string } | { sent: false; reason: 'sms_pending' | 'opted_out' | 'bad_number' };

/**
 * The only way a text leaves a client's line. Gates: a US number, the 10DLC
 * campaign approved (sms_status 'ready'), and the recipient not opted out.
 * Records the outbound message on success. A throw means nothing was sent.
 */
export async function sendClientSms(line: PhoneLine, to: string, body: string, kind: 'text_back' | 'manual'): Promise<ClientSmsResult> {
  // The 10DLC campaign is US-only, so only US numbers are texted.
  const recipient = normalizePhone(to);
  if (!recipient) return { sent: false, reason: 'bad_number' };
  if (line.smsStatus !== 'ready') return { sent: false, reason: 'sms_pending' };
  if (await isOptedOut(line.onboardingId, recipient)) return { sent: false, reason: 'opted_out' };
  const { sid, status } = await sendSms({ serviceSid: line.messagingServiceSid, to: recipient, body });
  // The text has left; a failed bookkeeping write must not read as "not sent".
  try {
    await recordMessage(line.onboardingId, { messageSid: sid, direction: 'outbound', fromNumber: line.phoneNumber, toNumber: recipient, body, kind, status });
  } catch (err) {
    console.error('phone: outbound row not recorded', sid, err);
  }
  return { sent: true, sid };
}

/**
 * The missed-call text. The line must want it and the caller must not have been
 * texted back in the last day; then the call row is claimed atomically (so a
 * retried webhook, or two calls from the same caller, cannot text twice) and the send goes through sendClientSms.
 * A send that does not happen releases the claim. Returns true only when a text left.
 */
export async function sendTextBack(line: PhoneLine, businessName: string | null, to: string, callSid: string): Promise<boolean> {
  const skip = (reason: string) => {
    console.info('phone: text-back skipped', callSid, reason);
    return false;
  };
  if (!line.textBackEnabled) return skip('disabled');
  if (line.smsStatus !== 'ready') return skip('sms_pending');
  const caller = callerKey(to);
  if (caller === 'unknown') return skip('unknown_caller');
  if (await textedBackRecently(line.onboardingId, caller)) return skip('recent_24h'); // cheap fast path; the claim below is the real check

  // Atomic: this call is unclaimed AND no other call from the same caller was texted back in the window.
  const claim = await sql`
    UPDATE phone_calls SET text_back_sent_at = now()
    WHERE call_sid = ${callSid} AND text_back_sent_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM phone_calls p
        WHERE p.onboarding_id = ${line.onboardingId} AND p.from_number = ${caller} AND p.call_sid <> ${callSid}
          AND p.text_back_sent_at > now() - interval '24 hours'
      )
    RETURNING id;
  `;
  if (claim.rows.length === 0) return skip('already_claimed');

  const release = () => sql`UPDATE phone_calls SET text_back_sent_at = NULL WHERE call_sid = ${callSid};`;
  let result: ClientSmsResult;
  try {
    result = await sendClientSms(line, caller, textBackMessage(businessName, line.textBackMessage), 'text_back');
  } catch (err) {
    try {
      await release();
    } catch (releaseErr) {
      console.error('phone: text-back claim not cleared', callSid, releaseErr);
    }
    throw err; // the send error, never the cleanup error
  }
  if (!result.sent) {
    try {
      await release();
    } catch (releaseErr) {
      console.error('phone: text-back claim not cleared', callSid, releaseErr);
    }
    return skip(result.reason);
  }
  return true;
}

/** Month is YYYY-MM in America/Chicago, the same key the reports use (monthOf in lib/siteStats.ts). */
export async function callsSummary(onboardingId: number, month: string): Promise<CallsSummary> {
  await ensureSchema();
  const { rows } = await sql<{ calls: string; answered: string; missed: string; texted: string; avg: string | null }>`
    SELECT count(*)::text AS calls,
           count(*) FILTER (WHERE outcome = 'answered')::text AS answered,
           count(*) FILTER (WHERE outcome = 'missed')::text AS missed,
           count(*) FILTER (WHERE text_back_sent_at IS NOT NULL)::text AS texted,
           avg(duration_seconds) FILTER (WHERE outcome = 'answered')::text AS avg
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId}
      AND to_char(started_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};
  `;
  const r = rows[0];
  return {
    month,
    calls: Number(r?.calls ?? 0),
    answered: Number(r?.answered ?? 0),
    missed: Number(r?.missed ?? 0),
    textedBack: Number(r?.texted ?? 0),
    avgSeconds: r?.avg ? Math.round(Number(r.avg)) : null,
  };
}

/** Newest first. The recording URL never leaves the server; hasRecording says one exists. */
export async function recentCalls(onboardingId: number, limit = 30): Promise<PhoneCall[]> {
  await ensureSchema();
  const { rows } = await sql<CallRow>`
    SELECT id, call_sid, from_number, to_number, outcome, dial_status, started_at, duration_seconds,
           recording_url IS NOT NULL AS has_recording, recording_seconds, text_back_sent_at
    FROM phone_calls
    WHERE onboarding_id = ${onboardingId}
    ORDER BY started_at DESC
    LIMIT ${limit};
  `;
  return rows.map(toCall);
}

/** The admin card's running estimate for the month, from the two tables and the spec's rates. */
export async function monthCost(onboardingId: number, month: string): Promise<{ calls: number; minutes: number; texts: number; estimate: number }> {
  await ensureSchema();
  const [{ rows: c }, { rows: m }] = await Promise.all([
    sql<{ calls: string; seconds: string; recorded: string }>`
      SELECT count(*)::text AS calls, coalesce(sum(duration_seconds), 0)::text AS seconds, coalesce(sum(recording_seconds), 0)::text AS recorded
      FROM phone_calls WHERE onboarding_id = ${onboardingId} AND to_char(started_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};`,
    sql<{ texts: string }>`
      SELECT count(*)::text AS texts FROM phone_messages WHERE onboarding_id = ${onboardingId} AND to_char(created_at AT TIME ZONE 'America/Chicago', 'YYYY-MM') = ${month};`,
  ]);
  const minutes = Math.ceil(Number(c[0]?.seconds ?? 0) / 60);
  const recordedMinutes = Math.ceil(Number(c[0]?.recorded ?? 0) / 60);
  const texts = Number(m[0]?.texts ?? 0);
  const estimate = RATE.number + RATE.tenDlc + minutes * (RATE.inboundMin + RATE.outboundMin) + recordedMinutes * RATE.recordingMin + texts * RATE.sms;
  return { calls: Number(c[0]?.calls ?? 0), minutes, texts, estimate: Math.round(estimate * 100) / 100 };
}
