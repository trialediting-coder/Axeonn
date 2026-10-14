// lib/contactsShared.ts
// The leads inbox (slice 4 of the PROOF lead system): one contact per phone
// number or email per client, a stage, and a timeline of every call, text,
// form, booking and chat. Types and pure rules shared by the server
// (lib/contacts.ts), the API routes and the PROOF Leads tab. Client-safe: no
// Node imports, no database. Identity (phone, email) is masked here before
// anything reaches a browser; the words of a text or form are shown as written.
// Stages, taps and their follow-ups are slice 3's (lib/sequenceShared.ts);
// quiet hours are slice 2's (lib/leadShared.ts). Nothing here re-defines them.
import { TIER_RANK, type OnboardingTier } from '@/data/onboardingItems';
import { QUIET_END_HOUR, QUIET_START_HOUR, isQuietHours } from '@/lib/leadShared';
import { DEFAULT_TIME_ZONE, callerKey, formatCallLength, maskNumber, SMS_MAX_CHARS, type CallOutcome } from '@/lib/phoneShared';
import { buttonLabel, campaignLabel } from '@/lib/projectsShared';
import { holdForQuietHours, safeTimeZone } from '@/lib/sequenceSchedule';
import { LEAD_ACTION_LABELS, STAGE_EFFECTS, normalizeEmail, type LeadAction, type LeadStage, type SequenceKind } from '@/lib/sequenceShared';

// ───────────────────────────── Vocabulary ─────────────────────────────

/** Slice 3's stages, in order, for the badge and the list. */
export const CONTACT_STAGES: readonly LeadStage[] = ['new', 'contacted', 'booked', 'won', 'lost'];
export const STAGE_LABELS: Record<LeadStage, string> = { new: 'New', contacted: 'Contacted', booked: 'Booked', won: 'Won', lost: 'Lost' };

/** The stages code may set by itself (an answered call or typed text; a booking). Both are slice 3 LeadActions. */
export type SystemStage = Extract<LeadAction, 'contacted' | 'booked'>;

/** How the person first reached the client. 'click' = a tap on the site's call or text button, then that call or text. */
export const CONTACT_SOURCES = ['call', 'text', 'form', 'chat', 'booking', 'click', 'messenger', 'instagram'] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const CONTACT_EVENT_KINDS = [
  'call', 'text_in', 'text_out', 'form', 'booking', 'chat', 'click', 'note', 'alert', 'sequence', 'reminder', 'messenger', 'instagram',
] as const;
export type ContactEventKind = (typeof CONTACT_EVENT_KINDS)[number];

/** The facts of one event, copied from its source row. Never a recording URL. */
export type EventPayload = Record<string, unknown>;

export interface Contact {
  id: number;
  onboardingId: number;
  /** E.164 or null. */
  phone: string | null;
  /** Lowercase or null. */
  email: string | null;
  name: string | null;
  stage: LeadStage;
  source: ContactSource;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  firstSeenAt: string;
  lastActivityAt: string;
  stageChangedAt: string | null;
  /** When "Quote sent" was first tapped; a second tap does not restart the quote follow-up (slice 3's rule). */
  quoteSentAt: string | null;
}

export interface ContactEvent {
  id: number;
  contactId: number;
  onboardingId: number;
  kind: ContactEventKind;
  refTable: string | null;
  refId: number | null;
  /** Splits one source row into several events (a sequence run's steps). 0 for everything else. */
  refPart: number;
  summary: string;
  payload: EventPayload;
  createdAt: string;
}

/** A call or text this many minutes after a tap on the site's call or text button is that tap's person. */
export const CLICK_ATTACH_MINUTES = 10;
/** Without push, the owner gets at most one fallback text and email per lead in this many minutes. */
export const OWNER_TEXT_THROTTLE_MINUTES = 30;

const hourWord = (h: number): string => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
/** "8 pm to 8 am", from slice 2's quiet-hours constants. */
export const QUIET_WINDOW = `${hourWord(QUIET_START_HOUR)} to ${hourWord(QUIET_END_HOUR)}`;

export const inboxEnabled = (tier: OnboardingTier): boolean => TIER_RANK[tier] >= TIER_RANK.axeoncore;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
};

// ───────────────────────────── Identity ─────────────────────────────

/** The two keys a contact can be found by. Null when the event identifies nobody (a withheld caller, a form with neither). */
export function contactKeyFor(input: { phone?: unknown; email?: unknown }): { phone: string | null; email: string | null } | null {
  const rawPhone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const key = rawPhone ? callerKey(rawPhone) : 'unknown';
  const phone = key === 'unknown' ? null : key;
  const email = normalizeEmail(input.email);
  return phone || email ? { phone, email } : null;
}

export function cleanName(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  return s || null;
}

export function parseContactId(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d{1,15}$/.test(raw) ? Number(raw) : Number.NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ───────────────────────────── Stages ─────────────────────────────

const STAGE_RANK: Record<LeadStage, number> = { new: 0, contacted: 1, booked: 2, won: 3, lost: 3 };

/**
 * A move code makes by itself, or null for none. Code only moves forward and
 * never touches a Won or Lost contact; the client's taps go through slice 3's
 * applyLeadStage instead (lib/leadStages.ts), which can move a lead anywhere.
 */
export function nextSystemStage(current: LeadStage, proposed: SystemStage): SystemStage | null {
  if (current === 'won' || current === 'lost') return null;
  return STAGE_RANK[proposed] > STAGE_RANK[current] ? proposed : null;
}

/** The stage an event implies on its own: an answered call or a typed text means Contacted, a booking means Booked. */
export function systemStageFor(kind: ContactEventKind, payload: EventPayload): SystemStage | null {
  if (kind === 'call') return payload.outcome === 'answered' ? 'contacted' : null;
  if (kind === 'text_out') return payload.messageKind === 'manual' ? 'contacted' : null;
  if (kind === 'booking') return 'booked';
  return null;
}

export function outcomeForStage(stage: LeadStage): 'won' | 'lost' | null {
  return stage === 'won' || stage === 'lost' ? stage : null;
}

/**
 * The follow-ups a stage move starts and stops. Delegates to slice 3's
 * STAGE_EFFECTS (one source of truth). Stops always apply (stopping is
 * idempotent); starts only on a real change, as applyLeadStage does.
 */
export function sequenceEffects(action: LeadAction, changed: boolean): { stop: SequenceKind[]; start: SequenceKind[] } {
  const effect = STAGE_EFFECTS[action];
  return { stop: [...effect.stop], start: changed ? [...effect.start] : [] };
}

/** The timeline note for one of the client's taps, in slice 3's words. */
export function noteForAction(action: LeadAction): string {
  return `Tapped "${LEAD_ACTION_LABELS[action]}"`;
}

// ───────────────────────────── Merging ─────────────────────────────

export interface MergePlan {
  keepId: number;
  dropId: number;
  merged: Pick<Contact, 'name' | 'phone' | 'email' | 'stage' | 'stageChangedAt' | 'quoteSentAt' | 'source' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'firstSeenAt' | 'lastActivityAt'>;
}

/**
 * Two contacts turned out to be one person (an event carried the phone of one
 * and the email of the other). The older row is kept (earlier first-seen, then
 * lower id); it keeps its first touch (source, campaign) and fills any gap from
 * the newer row. The furthest stage wins; between Won and Lost, the later mark.
 * The earliest "Quote sent" stands. If both rows had a phone, the kept row's
 * phone stays and the other's events still move over.
 */
export function mergeDecision(a: Contact, b: Contact): MergePlan {
  const aFirst = Date.parse(a.firstSeenAt);
  const bFirst = Date.parse(b.firstSeenAt);
  const [keep, drop] = aFirst < bFirst || (aFirst === bFirst && a.id < b.id) ? [a, b] : [b, a];
  const dropRank = STAGE_RANK[drop.stage];
  const keepRank = STAGE_RANK[keep.stage];
  const dropLater = Date.parse(drop.stageChangedAt ?? '') > Date.parse(keep.stageChangedAt ?? '');
  const stageFrom = dropRank > keepRank || (dropRank === keepRank && drop.stage !== keep.stage && dropLater) ? drop : keep;
  const utmFrom = keep.utmSource ? keep : drop.utmSource ? drop : keep;
  const quotes = [a.quoteSentAt, b.quoteSentAt].filter((q): q is string => q !== null).sort();
  return {
    keepId: keep.id,
    dropId: drop.id,
    merged: {
      name: keep.name ?? drop.name,
      phone: keep.phone ?? drop.phone,
      email: keep.email ?? drop.email,
      stage: stageFrom.stage,
      stageChangedAt: stageFrom.stageChangedAt,
      quoteSentAt: quotes[0] ?? null,
      source: keep.source,
      utmSource: utmFrom.utmSource,
      utmMedium: utmFrom.utmMedium,
      utmCampaign: utmFrom.utmCampaign,
      firstSeenAt: new Date(Math.min(aFirst, bFirst)).toISOString(),
      lastActivityAt: new Date(Math.max(Date.parse(a.lastActivityAt), Date.parse(b.lastActivityAt))).toISOString(),
    },
  };
}

// ───────────────────────────── Events ─────────────────────────────

/** phone_messages (direction, kind) → the timeline kind. Owner alerts are about a lead, not to one: null. */
export function messageEventKind(direction: 'inbound' | 'outbound', messageKind: string): ContactEventKind | null {
  if (direction === 'inbound') return 'text_in';
  if (messageKind === 'alert') return null;
  if (messageKind === 'sequence') return 'sequence';
  if (messageKind === 'reminder') return 'reminder';
  return 'text_out';
}

export function sourceForKind(kind: ContactEventKind): ContactSource {
  switch (kind) {
    case 'call':
    case 'form':
    case 'booking':
    case 'chat':
    case 'click':
    case 'messenger':
    case 'instagram':
      return kind;
    default:
      return 'text';
  }
}

/** Does this event mean the lead (or the owner, by hand) did something? Decides "last activity" and the list's one line. Mirrored in listInbox's SQL. */
export function isLeadActivity(kind: ContactEventKind, payload: EventPayload): boolean {
  if (kind === 'alert' || kind === 'note' || kind === 'sequence' || kind === 'reminder') return false;
  if (kind === 'text_out' && payload.automatic === true) return false;
  return true;
}

const VERBS: Record<ContactEventKind, string> = {
  call: 'Called', text_in: 'Texted', text_out: 'You texted', form: 'Form', booking: 'Booked', chat: 'Chat', click: 'Website',
  note: 'Note', alert: 'Alert', sequence: 'Follow-up', reminder: 'Reminder', messenger: 'Facebook', instagram: 'Instagram',
};
export const eventVerb = (kind: ContactEventKind): string => VERBS[kind];

const quote = (text: string | null, max = 60): string | null => (text ? `"${text.length > max ? `${text.slice(0, max - 1)}…` : text}"` : null);
const pageName = (path: string | null) => (!path || path === '/' ? 'home page' : path.replace(/^\//, '').replace(/[-_/]+/g, ' '));

/** The one line under a name in the list and beside an event in the timeline. */
export function eventSummary(kind: ContactEventKind, p: EventPayload): string {
  switch (kind) {
    case 'call': {
      const connect = p.direction === 'connect';
      if (p.outcome === 'answered') {
        const len = formatCallLength(num(p.durationSeconds));
        return connect ? `you called them back · ${len}` : `answered · ${len}`;
      }
      if (connect) return 'call-back did not connect';
      return p.textedBack === true ? 'missed, texted back' : 'missed';
    }
    case 'text_in':
    case 'messenger':
    case 'instagram':
      return quote(str(p.body)) ?? 'sent a message';
    case 'text_out':
      if (p.automatic === true) return p.messageKind === 'text_back' ? 'texted back automatically' : 'automatic text sent';
      return quote(str(p.body)) ?? 'you texted them';
    case 'sequence':
      return p.channel === 'email' ? 'follow-up email sent' : 'follow-up text sent';
    case 'reminder':
      return 'appointment reminder sent';
    case 'form':
      return quote(str(p.message)) ?? 'sent your form';
    case 'booking': {
      const service = str(p.service);
      return service ? `booked ${service}` : 'booked a time';
    }
    case 'chat':
      return 'chatted on your site';
    case 'click':
      return `tapped ${buttonLabel(str(p.name) ?? 'call').toLowerCase()} on ${pageName(str(p.path))}`;
    case 'note':
      return str(p.text) ?? 'note';
    case 'alert':
      return p.channel === 'sms' ? 'you were sent a text about this lead' : p.channel === 'email' ? 'you were emailed about this lead' : 'you were sent a notification';
  }
}

// ───────────────────────────── Display ─────────────────────────────

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  const local = at > 0 ? email.slice(0, at) : email;
  return `${local.slice(0, 12)}@…`;
}

/** "Mike Rogers" → "Mike R.", for the list. */
export function shortName(name: string | null): string | null {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return null;
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[words.length - 1][0].toUpperCase()}.`;
}

/**
 * Masked number, else masked email. A Messenger / Instagram contact has neither
 * (the PSID / IGSID is its identity, slice 6), so it reads by channel instead of
 * "Unknown"; its name, when known, already shows beside this in the list.
 */
export function contactWho(c: { phone: string | null; email: string | null; source?: ContactSource }): string {
  if (c.phone) return maskNumber(c.phone);
  if (c.email) return maskEmail(c.email);
  if (c.source === 'messenger') return 'Facebook message';
  if (c.source === 'instagram') return 'Instagram message';
  return 'Unknown';
}

const SOURCE_LABELS: Record<ContactSource, string> = {
  call: 'Called your number', text: 'Texted your number', form: 'Your website form', chat: 'Your website chat',
  booking: 'Online booking', click: 'Your website', messenger: 'Facebook', instagram: 'Instagram',
};

/** "Google Ads: spring", "Your website form", "Called your number". */
export function sourceLabelFor(c: Pick<Contact, 'source' | 'utmSource' | 'utmMedium' | 'utmCampaign'>): string {
  if (c.utmSource) return campaignLabel({ source: c.utmSource, medium: c.utmMedium ?? '', campaign: c.utmCampaign ?? '' });
  return SOURCE_LABELS[c.source];
}

/** "Oct 9, 2:05 PM" in Central time, like the rest of PROOF. */
export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** "just now", "2 min ago", "9:05 AM" today, "Mon" this week, else "Sep 30". */
export function relativeWhen(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const ms = now.getTime() - then.getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  if (day(then) === day(now)) return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(then);
  if (ms < 6 * 24 * 3_600_000) return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, weekday: 'short' }).format(then);
  return new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, month: 'short', day: 'numeric' }).format(then);
}

/** One row of the inbox list, as the browser gets it: no full number, no full email. */
export interface DashboardContact {
  id: number;
  /** As the lead gave it or the client typed it. */
  name: string | null;
  /** Masked number, masked email, "Facebook message" / "Instagram message" for a DM-only contact, or "Unknown". */
  who: string;
  stage: LeadStage;
  /** Whether "Quote sent" was tapped; the time itself stays server-side (as slice 3's DashboardSubmission). */
  quoteSent: boolean;
  sourceLabel: string;
  firstSeenAt: string;
  lastActivityAt: string;
  /** "Called", "Texted", "Form"; null before any event. */
  lastVerb: string | null;
  /** "missed, texted back", "\"still open Saturday?\"". */
  lastSummary: string | null;
  hasPhone: boolean;
  hasEmail: boolean;
  /** Replied STOP: no texts from this client's line. */
  optedOut: boolean;
}

export function toDashboardContact(c: Contact, last: { kind: ContactEventKind; summary: string } | null, optedOut: boolean): DashboardContact {
  return {
    id: c.id,
    name: c.name,
    who: contactWho(c),
    stage: c.stage,
    quoteSent: c.quoteSentAt !== null,
    sourceLabel: sourceLabelFor(c),
    firstSeenAt: c.firstSeenAt,
    lastActivityAt: c.lastActivityAt,
    lastVerb: last ? eventVerb(last.kind) : null,
    lastSummary: last ? last.summary : null,
    hasPhone: c.phone !== null,
    hasEmail: c.email !== null,
    optedOut,
  };
}

/** One timeline entry as the browser gets it. */
export interface DashboardEvent {
  id: number;
  kind: ContactEventKind;
  at: string;
  verb: string;
  summary: string;
  /** Sent by Axeon on the client's behalf (text-back, follow-ups, reminders), not typed by anyone. */
  automatic: boolean;
  /** The words of a text or message, either direction. Null for everything else. */
  text: string | null;
  /** For calls: what the recording route needs. */
  call: { callSid: string; outcome: CallOutcome; durationSeconds: number | null; hasRecording: boolean } | null;
  /** For forms and bookings: what was submitted. */
  fields: Array<{ label: string; value: string }>;
}

const MESSAGE_KINDS: readonly ContactEventKind[] = ['text_in', 'text_out', 'sequence', 'reminder', 'messenger', 'instagram'];

function eventFields(kind: ContactEventKind, p: EventPayload): Array<{ label: string; value: string }> {
  const page = str(p.page);
  const startsAt = str(p.startsAt);
  const rows: Array<[string, string | null]> =
    kind === 'form'
      ? [['Name', str(p.name)], ['Message', str(p.message)], ['Page', page ? pageName(page) : null]]
      : kind === 'booking'
        ? [['Service', str(p.service)], ['When', startsAt ? formatWhen(startsAt) : null]]
        : [];
  return rows.filter((r): r is [string, string] => r[1] !== null).map(([label, value]) => ({ label, value }));
}

export function toDashboardEvent(e: ContactEvent): DashboardEvent {
  const p = e.payload;
  const isMessage = MESSAGE_KINDS.includes(e.kind) && p.channel !== 'email';
  return {
    id: e.id,
    kind: e.kind,
    at: e.createdAt,
    verb: eventVerb(e.kind),
    summary: e.summary || eventSummary(e.kind, p),
    automatic: p.automatic === true || e.kind === 'sequence' || e.kind === 'reminder',
    text: isMessage ? str(p.body) : null,
    call:
      e.kind === 'call' && typeof p.callSid === 'string'
        ? { callSid: p.callSid, outcome: p.outcome === 'answered' ? 'answered' : 'missed', durationSeconds: num(p.durationSeconds), hasRecording: p.hasRecording === true }
        : null,
    fields: eventFields(e.kind, p),
  };
}

/**
 * A reply typed in quiet hours, waiting for 8 am ('held'); one that definitely
 * did not go out ('failed'); one not sent because the person texted STOP
 * overnight ('opted_out': sending it again would be refused too); or one whose
 * send was cut off or came back unclear ('unclear': it may have gone out, so
 * the client checks the thread, never "did not go out").
 */
export interface HeldReply {
  id: number;
  body: string;
  sendAt: string;
  status: 'held' | 'failed' | 'opted_out' | 'unclear';
}

/**
 * The tracker taps not yet matched to a caller. site_events.id is BIGSERIAL and
 * arrives as a string at runtime, so ids are compared as numbers.
 */
export function unmatchedTaps<T extends { id: number | string }>(rows: T[], attached: ReadonlySet<number>): T[] {
  return rows.filter((r) => !attached.has(Number(r.id)));
}

/** A held_replies row's status and error as the Leads tab shows it (lib/inboxReply.ts writes 'interrupted' and 'unclear: …'). */
export function heldReplyStatus(status: string, error: string | null): HeldReply['status'] {
  if (status !== 'failed') return 'held';
  if (error === 'interrupted' || error?.startsWith('unclear:')) return 'unclear';
  if (error === 'opted_out') return 'opted_out';
  return 'failed';
}

export const HELD_REPLY_COPY = {
  failed: 'This text did not go out. Send it again from the box below.',
  opted_out: 'This person asked not to be texted.',
  unclear: 'This text may have gone out. Check the thread before you send it again.',
} as const;

export interface DashboardContactView {
  contact: DashboardContact;
  /** Oldest first, the latest 300. */
  events: DashboardEvent[];
  held: HeldReply[];
}

/** Can replies go out from this client's line: yes, waiting on carrier approval, or no tracked number. */
export type Texting = 'ready' | 'pending' | 'none';

export interface DashboardInbox {
  contacts: DashboardContact[];
  nextCursor: string | null;
  /** The contact opened with ?contact=<id>, or null. */
  selected: DashboardContactView | null;
  /** The client's time zone, for the quiet-hours notice. */
  timeZone: string;
  texting: Texting;
}

/** "<ms>_<id>" of the last row on a page; the next page starts strictly after it. */
export function encodeCursor(at: string, id: number): string {
  return `${Date.parse(at)}_${id}`;
}

export function decodeCursor(raw: unknown): { at: string; id: number } | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{1,15})_(\d{1,15})$/.exec(raw);
  if (!m) return null;
  const id = Number(m[2]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { at: new Date(Number(m[1])).toISOString(), id };
}

// ───────────────────────────── Replies ─────────────────────────────

export type ReplyWindow = { ok: true } | { ok: false; sendAt: string };

/**
 * Can a typed reply go out now? Slice 2's quiet hours (8 pm to 8 am
 * client-local, isQuietHours) hold it to 8:00 am (slice 3's holdForQuietHours,
 * which also handles a wrong zone and daylight saving).
 */
export function canReplyNow(now: Date, timeZone: string): ReplyWindow {
  if (!isQuietHours(now, timeZone)) return { ok: true };
  return { ok: false, sendAt: holdForQuietHours(now, timeZone).toISOString() };
}

export function quietNotice(sendAtIso: string, timeZone: string, queued: boolean): string {
  const when = new Intl.DateTimeFormat('en-US', { timeZone: safeTimeZone(timeZone), weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(sendAtIso));
  return queued
    ? `Quiet hours (${QUIET_WINDOW}): your text goes out ${when}.`
    : `It is quiet hours (${QUIET_WINDOW}) where you are. A text sent now goes out ${when}.`;
}

/** 'send_failed': the send threw with a definite refusal (isDefiniteRejection), so nothing went out and it can be tried again. */
export const REPLY_REFUSALS = ['empty', 'too_long', 'no_phone', 'no_line', 'sms_pending', 'opted_out', 'bad_number', 'send_failed'] as const;
export type ReplyRefusal = (typeof REPLY_REFUSALS)[number];
export const isReplyRefusal = (v: unknown): v is ReplyRefusal => typeof v === 'string' && (REPLY_REFUSALS as readonly string[]).includes(v);

export const REPLY_REFUSAL_COPY: Record<ReplyRefusal, string> = {
  empty: 'Type a message first.',
  too_long: `Keep it under ${SMS_MAX_CHARS} characters so it arrives in one piece.`,
  no_phone: 'We only have an email for this person. Use the Email button instead.',
  no_line: 'Replies go out from your tracked number, and you do not have one yet.',
  sms_pending: 'Texting turns on once the phone carriers approve your number. We will tell you when.',
  opted_out: 'This person asked not to be texted.',
  bad_number: 'This number cannot get texts from your line.',
  send_failed: 'Your text did not go out. Try again.',
};

/** A live reply whose send threw without a definite refusal: it may have left, so the box is cleared and the thread refreshed. */
export const REPLY_UNCLEAR_COPY = 'This text may have gone out. Refresh and check the thread before you send it again.';

export function validateReplyBody(raw: unknown): { ok: true; body: string } | { ok: false; reason: 'empty' | 'too_long' } {
  const body = typeof raw === 'string' ? raw.trim() : '';
  if (!body) return { ok: false, reason: 'empty' };
  if (body.length > SMS_MAX_CHARS) return { ok: false, reason: 'too_long' };
  return { ok: true, body };
}

/** What a client's line allows. getLine already returns active lines only; the status check keeps this honest for any caller. */
export function textingState(line: { status: string; smsStatus: string } | null): Texting {
  if (!line || line.status !== 'active') return 'none';
  return line.smsStatus === 'ready' ? 'ready' : 'pending';
}

/**
 * Why a reply can never go out, or null. One order for the server
 * (replyToContact) and the reply box: no phone, opted out (the banner the spec
 * asks for), no line, carrier approval pending. Quiet hours are not a refusal:
 * the reply is held (canReplyNow).
 */
export function replyBlocker(input: { hasPhone: boolean; optedOut: boolean; texting: Texting }): Exclude<ReplyRefusal, 'empty' | 'too_long' | 'bad_number' | 'send_failed'> | null {
  if (!input.hasPhone) return 'no_phone';
  if (input.optedOut) return 'opted_out';
  if (input.texting === 'none') return 'no_line';
  if (input.texting === 'pending') return 'sms_pending';
  return null;
}
