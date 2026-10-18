// lib/phoneShared.ts
// Phone numbers and the words around them, shared by the server (lib/phoneLines.ts,
// the webhooks), the admin Phone card and the client's Calls tab. Client-safe:
// no Node imports. Numbers are stored E.164 (+15155550134) everywhere.

export type CallOutcome = 'answered' | 'missed';
export type SmsStatus = 'pending' | 'ready';


/** Which way a phone_calls row went: a caller dialing the tracked number, or call connect ringing the owner about a website lead. */
export type CallDirection = 'inbound' | 'connect';

/** phone_messages.kind. Slice 2 sends 'alert'; slices 3 and 5 send 'sequence', 'confirm' and 'reminder'. */
export type MessageKind = 'text_back' | 'manual' | 'inbound' | 'alert' | 'sequence' | 'confirm' | 'reminder';

/** Where most Axeon clients are. Quiet hours follow the line's own zone. */
export const DEFAULT_TIME_ZONE = 'America/Chicago';

/** The zones the admin card offers. IANA ids, so Intl handles daylight saving. */
export const US_TIME_ZONES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'America/New_York', label: 'Eastern' },
  { id: 'America/Chicago', label: 'Central' },
  { id: 'America/Denver', label: 'Mountain' },
  { id: 'America/Phoenix', label: 'Arizona (no daylight saving)' },
  { id: 'America/Los_Angeles', label: 'Pacific' },
  { id: 'America/Anchorage', label: 'Alaska' },
  { id: 'Pacific/Honolulu', label: 'Hawaii' },
];

export const isUsTimeZone = (v: unknown): v is string => typeof v === 'string' && US_TIME_ZONES.some((z) => z.id === v);

export interface PhoneLineSettings {
  /** E.164. Where inbound calls ring. */
  forwardTo: string;
  recordCalls: boolean;
  /** Play "This call may be recorded" before the dial. */
  consentNotice: boolean;
  textBackEnabled: boolean;
  /** Null = use TEXT_BACK_DEFAULT with the business name. */
  textBackMessage: string | null;
  /** Call screening: the owner presses 1 to accept, so voicemail counts as missed. */
  screenCalls: boolean;
  /** Call connect: ring the owner and bridge to a new website lead on 1. */
  callConnectEnabled: boolean;
  /** IANA zone from US_TIME_ZONES; quiet hours follow it. */
  timeZone: string;
}

/** Two SMS segments. Longer automated texts read as spam and cost double. */
export const SMS_MAX_CHARS = 320;

export const TEXT_BACK_DEFAULT = "Hi, it's {business}. Sorry we missed your call! Reply here with what you need and we'll get right back to you. Reply STOP to opt out.";

const US_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

/** "(515) 555-0134", "515.555.0134", "1 515 555 0134", "+15155550134" → "+15155550134". Anything else → null. */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  const e164 = `+1${national}`;
  return US_E164.test(e164) ? e164 : null;
}

/** A caller id to store: a US number normalized, any other E.164 number as-is, else 'unknown'. */
export function callerKey(raw: unknown): string {
  const us = normalizePhone(raw);
  if (us) return us;
  const trimmed = String(raw).trim();
  return /^\+[1-9]\d{6,14}$/.test(trimmed) ? trimmed : 'unknown';
}

export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

/** Last two digits hidden, for screens that get screenshotted (matches maskPhone in lib/onboarding.ts). */
export function maskNumber(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{2})\d{2}$/.exec(e164);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}··`;
  return `${e164.replace(/\d{2}$/, '')}··`;
}

export function areaCodeOf(e164: string): string | null {
  const m = /^\+1(\d{3})/.exec(e164);
  return m ? m[1] : null;
}

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const START_WORDS = new Set(['START', 'UNSTOP', 'YES']);

/** The carrier opt-out keywords, exactly, so "please stop calling" is a message and "STOP" is an opt-out. */
export function isStopWord(body: unknown): boolean {
  return typeof body === 'string' && STOP_WORDS.has(body.trim().toUpperCase());
}

/** Twilio's resubscribe keywords, whole body only. */
export function isStartWord(body: unknown): boolean {
  return typeof body === 'string' && START_WORDS.has(body.trim().toUpperCase());
}

/**
 * The missed-call text the client wrote in the portal (phone-setup.textBack), or null
 * to keep the default. Adds the opt-out line when they left it off, within 320 characters.
 */
export function portalTextBack(raw: unknown): string | null {
  const text = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
  if (!text) return null;
  if (/\bSTOP\b/i.test(text)) return text.slice(0, 320);
  const optOut = ' Reply STOP to opt out.';
  return text.slice(0, 320 - optOut.length).trimEnd() + optOut;
}

export function textBackMessage(businessName: string | null, custom: string | null): string {
  const trimmed = custom?.trim();
  if (trimmed) return trimmed;
  return TEXT_BACK_DEFAULT.replace('{business}', businessName?.trim() || 'us');
}

/**
 * Twilio's DialCallStatus: only "completed" means a person picked up. Since Twilio's
 * 2020-12-09 TwiML change a hang-up in a <Number url> screening document reports
 * "completed" too, with DialBridged=false: the legs never bridged, so it is missed.
 * Without DialBridged (absent from the request) the status alone decides.
 */
export function callOutcome(dialStatus: unknown, dialBridged?: unknown): CallOutcome {
  if (String(dialBridged) === 'false') return 'missed';
  return dialStatus === 'completed' ? 'answered' : 'missed';
}

/** "2:14" for 134 seconds, "—" when unknown. */
export function formatCallLength(seconds: number | null): string {
  if (seconds === null) return '—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "Mon, 2:05 PM" in Central time. */
export function formatCallWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

export function callResultLabel(c: { outcome: CallOutcome; textBackSentAt: string | null }): string {
  if (c.outcome === 'answered') return 'Answered';
  return c.textBackSentAt ? 'Missed · texted back' : 'Missed';
}

export function callerLabel(fromNumber: string): string {
  return fromNumber === 'unknown' ? 'Unknown' : maskNumber(fromNumber);
}

/** A client's tracked number as the server returns it (lib/phoneLines.ts). Dates are ISO strings. */
export interface PhoneLine extends PhoneLineSettings {
  id: number;
  onboardingId: number;
  /** E.164, the tracked number callers dial. */
  phoneNumber: string;
  phoneNumberSid: string;
  messagingServiceSid: string;
  areaCode: string;
  /** 'ready' once the 10DLC campaign is approved; nothing is texted before that. */
  smsStatus: SmsStatus;
  status: 'active' | 'released';
  createdAt: string;
  updatedAt: string;
}

/** One call on a tracked line. The recording URL stays server-side; hasRecording says one exists. */
export interface PhoneCall {
  id: number;
  callSid: string;
  /** E.164, or 'unknown' for a withheld caller id. */
  fromNumber: string;
  toNumber: string;
  outcome: CallOutcome;
  dialStatus: string;
  startedAt: string;
  durationSeconds: number | null;
  hasRecording: boolean;
  recordingSeconds: number | null;
  textBackSentAt: string | null;
  /** 'inbound' = a customer called in; 'connect' = we rang the owner for a website lead. */
  direction: CallDirection;
}

/** A month (YYYY-MM, America/Chicago) of calls on one line. */
export interface CallsSummary {
  month: string;
  calls: number;
  answered: number;
  missed: number;
  textedBack: number;
  /** Mean length of answered calls, rounded; null when none were answered. */
  avgSeconds: number | null;
}

/** What the client dashboard gets per call: pre-masked, with no raw numbers or carrier status in the page payload. */
export interface DashboardCall {
  id: number;
  callSid: string;
  startedAt: string;
  durationSeconds: number | null;
  outcome: CallOutcome;
  textBackSentAt: string | null;
  hasRecording: boolean;
  /** Already masked by callerLabel. */
  caller: string;
}

export function toDashboardCall(c: PhoneCall): DashboardCall {
  return {
    id: c.id,
    callSid: c.callSid,
    startedAt: c.startedAt,
    durationSeconds: c.durationSeconds,
    outcome: c.outcome,
    textBackSentAt: c.textBackSentAt,
    hasRecording: c.hasRecording,
    caller: callerLabel(c.fromNumber),
  };
}
