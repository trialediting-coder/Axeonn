// lib/leadShared.ts
// Website form leads (slice 2 of the PROOF lead system): what a client site's
// form sent, what happens next (an email to the client, a text to the owner,
// a call connect call), and the words the owner reads and hears. Client-safe:
// no Node imports, no database. The server half is lib/leads.ts.
import { TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { DEFAULT_TIME_ZONE, formatPhone, maskNumber, normalizePhone, type SmsStatus } from '@/lib/phoneShared';

/** The hidden field the form snippet carries. People never fill it; form-filling bots do. */
export const HONEYPOT_FIELD = 'company_website';
export const LEAD_MESSAGE_MAX = 2000;
/** Quiet hours, client-local: no owner text and no call connect call from 8 pm to 8 am. */
export const QUIET_START_HOUR = 20;
export const QUIET_END_HOUR = 8;

export interface LeadInput {
  name: string;
  /** E.164, or null when none was left or it was not a US number. */
  phone: string | null;
  /** Lower-case, or null. */
  email: string | null;
  message: string;
  /** Path only ("/quote"), or "" when unknown. */
  page: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export type LeadValidation = { ok: true; lead: LeadInput } | { ok: false; reason: 'spam' } | { ok: false; reason: 'invalid'; error: string };

// The names client sites already use (Formspree templates, page builders), so switching a form is one attribute.
const ALIASES = {
  name: ['name', 'full_name', 'fullname', 'your_name'],
  phone: ['phone', 'tel', 'telephone', 'phone_number'],
  email: ['email', 'email_address', '_replyto'],
  message: ['message', 'details', 'comments', 'description'],
} as const;

const RESERVED = new Set<string>([
  'site', 'redirect', 'page', 'utm_source', 'utm_medium', 'utm_campaign', 'first_name', 'last_name', HONEYPOT_FIELD,
  ...ALIASES.name, ...ALIASES.phone, ...ALIASES.email, ...ALIASES.message,
]);
const MAX_EXTRA_FIELDS = 10;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** A form value as trimmed text with control characters turned into spaces. Multiline keeps single line breaks. */
function clean(v: unknown, max: number, multiline = false): string {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  const s = String(v).replace(/\r\n?/g, '\n');
  const out = multiline
    ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  return out.trim().slice(0, max);
}

function firstOf(raw: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) if (clean(raw[k], 10)) return raw[k];
  return undefined;
}

/** "https://site.com/quote?x=1" or "quote" → "/quote". Anything unparseable → "". */
export function pagePath(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    return new URL(raw.trim(), 'https://page.invalid/').pathname.slice(0, 300);
  } catch {
    return '';
  }
}

/**
 * What a client site's form sent → a lead, spam, or a message for the visitor.
 * A phone that is not a US number is kept in the message as typed (the owner can
 * still read it) but never stored as the lead's phone, so it is never dialed.
 */
export function validateLeadInput(raw: Record<string, unknown>): LeadValidation {
  // _gotcha is Formspree's honeypot name; sites switching over may keep it.
  if (clean(raw[HONEYPOT_FIELD], 200) || clean(raw._gotcha, 200)) return { ok: false, reason: 'spam' };
  const name = clean(firstOf(raw, ALIASES.name), 100) || clean(`${clean(raw.first_name, 50)} ${clean(raw.last_name, 50)}`, 100);
  const phoneTyped = clean(firstOf(raw, ALIASES.phone), 40);
  const phone = normalizePhone(phoneTyped);
  const emailTyped = clean(firstOf(raw, ALIASES.email), 254).toLowerCase();
  const email = EMAIL_RE.test(emailTyped) ? emailTyped : null;
  if (!phone && !email) {
    return {
      ok: false,
      reason: 'invalid',
      error: phoneTyped || emailTyped ? 'Please check your phone number or email.' : 'Please leave a phone number or email so we can reach you.',
    };
  }
  const lines = [clean(firstOf(raw, ALIASES.message), LEAD_MESSAGE_MAX, true)];
  if (phoneTyped && !phone) lines.push(`Phone as typed: ${phoneTyped}`);
  let extras = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (extras >= MAX_EXTRA_FIELDS || RESERVED.has(key) || key.startsWith('_')) continue;
    const v = clean(value, 300);
    const label = clean(key.replace(/[_-]+/g, ' '), 40);
    if (!v || !label) continue;
    lines.push(`${label}: ${v}`);
    extras += 1;
  }
  return {
    ok: true,
    lead: {
      name,
      phone,
      email,
      message: lines.filter(Boolean).join('\n').slice(0, LEAD_MESSAGE_MAX),
      page: pagePath(raw.page),
      utmSource: clean(raw.utm_source, 100) || null,
      utmMedium: clean(raw.utm_medium, 100) || null,
      utmCampaign: clean(raw.utm_campaign, 100) || null,
    },
  };
}

function hourIn(now: Date, timeZone: string): number {
  const read = (tz: string) =>
    Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).formatToParts(now).find((p) => p.type === 'hour')?.value);
  let h: number;
  try {
    h = read(timeZone);
  } catch {
    h = read(DEFAULT_TIME_ZONE); // an unknown zone must not stop a lead; Central is where most clients are
  }
  return h === 24 ? 0 : h;
}

/** 8 pm to 8 am on the client's clock. Never applied to the missed-call text-back. */
export function isQuietHours(now: Date, timeZone: string): boolean {
  const h = hourIn(now, timeZone);
  return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
}

export type SmsSkip = 'plan' | 'no_line' | 'sms_pending' | 'quiet_hours';
export type ConnectSkip = 'plan' | 'no_line' | 'off' | 'no_phone' | 'same_number' | 'quiet_hours';

/** The parts of a PhoneLine the decision needs. */
export interface LeadLineView {
  phoneNumber: string;
  forwardTo: string;
  smsStatus: SmsStatus;
  callConnectEnabled: boolean;
  timeZone: string;
}

export interface DeliveryPlan {
  text: 'send' | SmsSkip;
  connect: 'call' | ConnectSkip;
}

/** What a new lead should set off, decided before anything is sent. The email always goes; this decides the text and the call. */
export function planLeadDelivery(input: { tier: OnboardingTier; line: LeadLineView | null; leadPhone: string | null; now: Date }): DeliveryPlan {
  if ((TIER_RANK[input.tier] ?? 0) < TIER_RANK.axeoncore) return { text: 'plan', connect: 'plan' };
  const line = input.line;
  if (!line) return { text: 'no_line', connect: 'no_line' };
  const quiet = isQuietHours(input.now, line.timeZone);
  const text: DeliveryPlan['text'] = line.smsStatus !== 'ready' ? 'sms_pending' : quiet ? 'quiet_hours' : 'send';
  let connect: DeliveryPlan['connect'];
  if (!line.callConnectEnabled) connect = 'off';
  else if (!input.leadPhone) connect = 'no_phone';
  else if (input.leadPhone === line.forwardTo || input.leadPhone === line.phoneNumber) connect = 'same_number';
  else if (quiet) connect = 'quiet_hours';
  else connect = 'call';
  return { text, connect };
}

/** What actually happened to one lead; the admin's "Send test lead" shows it. */
export interface DeliveryReport {
  email: 'sent' | 'off' | 'failed';
  text: SmsSkip | 'sent' | 'opted_out' | 'bad_number' | 'failed';
  connect: ConnectSkip | 'started' | 'failed';
}

const EMAIL_WORDS: Record<DeliveryReport['email'], string> = {
  sent: 'sent',
  off: 'not configured (RESEND_API_KEY)',
  failed: 'failed, see the Vercel log',
};
const TEXT_WORDS: Record<DeliveryReport['text'], string> = {
  sent: 'sent',
  plan: 'not in this plan',
  no_line: 'no tracked number yet',
  sms_pending: 'waiting on 10DLC approval',
  quiet_hours: 'skipped, quiet hours (8 pm to 8 am)',
  opted_out: "skipped, the owner's cell texted STOP",
  bad_number: 'skipped, forward-to is not a US number',
  failed: 'failed, see the Vercel log',
};
const CONNECT_WORDS: Record<DeliveryReport['connect'], string> = {
  started: "calling the owner's cell now",
  plan: 'not in this plan',
  no_line: 'no tracked number yet',
  off: 'switched off',
  no_phone: 'the lead left no US phone number',
  same_number: "the lead's phone is the owner's own number",
  quiet_hours: 'skipped, quiet hours (8 pm to 8 am)',
  failed: 'failed, see the Vercel log',
};

export function describeDelivery(r: DeliveryReport): string {
  return `Email: ${EMAIL_WORDS[r.email]} · Text: ${TEXT_WORDS[r.text]} · Call connect: ${CONNECT_WORDS[r.connect]}`;
}

export function leadDisplayName(name: string): string {
  return name.trim() || 'Someone';
}

/** Hard cap on the owner alert: GSM-7 (ASCII only), so two SMS segments of 153 characters hold it with room to spare. */
export const LEAD_ALERT_MAX = 300;

/** The owner's text: who, how to reach them, what they said, from which page. ASCII only and at most LEAD_ALERT_MAX characters. */
export function leadAlertText(lead: { name: string; phone: string | null; email: string | null; message: string; page: string }): string {
  const ascii = (v: string) =>
    v
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
  const who = [ascii(leadDisplayName(lead.name)), lead.phone ? formatPhone(lead.phone) : null, ascii(lead.email ?? '')].filter(Boolean).join(', ');
  const head = `New website lead: ${who}.`;
  const page = ascii(lead.page);
  const tail = page ? ` Page: ${page}` : '';
  const msg = ascii(lead.message).replace(/"/g, "'");
  const room = LEAD_ALERT_MAX - head.length - tail.length - 3; // a space and two quotes
  const body = msg.length > room ? `${msg.slice(0, Math.max(0, room - 3)).trimEnd()}...` : msg;
  const quoted = msg && room > 10 ? ` "${body}"` : '';
  return `${head}${quoted}${tail}`.slice(0, LEAD_ALERT_MAX);
}

/** The name as the voice should say it: letters, spaces, apostrophes and hyphens only, at most 40 characters. */
export function spokenName(name: string): string {
  const s = name.normalize('NFC').replace(/[^\p{L}\p{M}' -]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40).trim();
  return s || 'someone';
}

export function connectWhisperText(leadName: string): string {
  return `New lead from your website: ${spokenName(leadName)}. Press 1 to call them now.`;
}

/** A row id from a webhook query string (?lead=, ?line=): digits only, no leading zero, at most 15 digits. */
export function parseId(raw: string | null | undefined): number | null {
  if (!raw || !/^[1-9]\d{0,14}$/.test(raw)) return null;
  return Number(raw);
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

function httpUrl(raw: string | null): URL | null {
  if (!raw || raw === 'null') return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/**
 * Where to send the visitor after a plain HTML form post: the form's `redirect`
 * field, but only on the same site the post came from (Origin, else Referer;
 * www ignored). Anything else, or no way to tell the site, returns null and the
 * route shows its own thank-you page. Never an open redirect.
 */
export function safeRedirect(target: unknown, origin: string | null, referer: string | null): string | null {
  if (typeof target !== 'string' || !target.trim()) return null;
  const base = httpUrl(origin) ?? httpUrl(referer);
  if (!base) return null;
  let to: URL;
  try {
    to = new URL(target.trim(), base);
  } catch {
    return null;
  }
  if (to.protocol !== 'https:' && to.protocol !== 'http:') return null;
  if (bareHost(to.hostname) !== bareHost(base.hostname)) return null;
  return to.toString();
}

/** The page the visitor came from, for a "Back to the site" link; http(s) only. */
export function backLink(referer: string | null): string | null {
  return httpUrl(referer)?.toString() ?? null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The small page a plain form post lands on when there is no safe redirect. */
export function replyPage(input: { heading: string; text: string; backUrl: string | null }): string {
  const back = input.backUrl ? `<p><a href="${esc(input.backUrl)}">Back to the site</a></p>` : '';
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    `<title>${esc(input.heading)}</title><style>body{font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#0a0a0a;line-height:1.5}a{color:#2563eb}</style></head>` +
    `<body><h1>${esc(input.heading)}</h1><p>${esc(input.text)}</p>${back}</body></html>`
  );
}

/** A stored website form lead (lib/leads.ts). Dates are ISO strings. */
export interface FormSubmission extends LeadInput {
  id: number;
  onboardingId: number;
  /** Sent from the admin's "Send test lead"; never shown to the client. */
  isTest: boolean;
  /** When the owner pressed 1 on the call connect call. */
  connectPressedAt: string | null;
  createdAt: string;
}

/** What the client dashboard gets per form lead: pre-masked phone, no email, no message. */
export interface DashboardSubmission {
  id: number;
  at: string;
  name: string;
  /** Already masked by maskNumber. */
  phone: string | null;
  page: string;
  /** The owner pressed 1 and we dialed the lead. */
  calledBack: boolean;
}

export function toDashboardSubmission(s: FormSubmission): DashboardSubmission {
  return {
    id: s.id,
    at: s.createdAt,
    name: leadDisplayName(s.name),
    phone: s.phone ? maskNumber(s.phone) : null,
    page: s.page,
    calledBack: s.connectPressedAt !== null,
  };
}

/** What the connect route does with the digit the owner pressed. Pure, so the route stays thin. */
export function connectDecision(input: {
  digits: string | null | undefined;
  lead: { id: number; onboardingId: number; phone: string | null } | null;
  lineOnboardingId: number;
}): { action: 'dial'; phone: string } | { action: 'no_press' } | { action: 'reject'; reason: 'missing_lead' | 'wrong_client' | 'no_phone' } {
  if (input.digits !== '1') return { action: 'no_press' };
  if (!input.lead) return { action: 'reject', reason: 'missing_lead' };
  if (input.lead.onboardingId !== input.lineOnboardingId) return { action: 'reject', reason: 'wrong_client' };
  if (!input.lead.phone) return { action: 'reject', reason: 'no_phone' };
  return { action: 'dial', phone: input.lead.phone };
}
