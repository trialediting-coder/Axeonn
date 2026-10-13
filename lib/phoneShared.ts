// lib/phoneShared.ts
// Phone numbers and the words around them, shared by the server (lib/phoneLines.ts,
// the webhooks), the admin Phone card and the client's Calls tab. Client-safe:
// no Node imports. Numbers are stored E.164 (+15155550134) everywhere.

export type CallOutcome = 'answered' | 'missed';
export type SmsStatus = 'pending' | 'ready';

export interface PhoneLineSettings {
  /** E.164. Where inbound calls ring. */
  forwardTo: string;
  recordCalls: boolean;
  /** Play "This call may be recorded" before the dial. */
  consentNotice: boolean;
  textBackEnabled: boolean;
  /** Null = use TEXT_BACK_DEFAULT with the business name. */
  textBackMessage: string | null;
}

/** Two SMS segments. Longer automated texts read as spam and cost double. */
export const SMS_MAX_CHARS = 320;

export const TEXT_BACK_DEFAULT = "Hi, it's {business}. Sorry we missed your call! Reply here with what you need and we'll get right back to you.";

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

export function textBackMessage(businessName: string | null, custom: string | null): string {
  const trimmed = custom?.trim();
  if (trimmed) return trimmed;
  return TEXT_BACK_DEFAULT.replace('{business}', businessName?.trim() || 'us');
}

/** Twilio's DialCallStatus: only "completed" means a person picked up. */
export function callOutcome(dialStatus: unknown): CallOutcome {
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
