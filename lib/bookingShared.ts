// lib/bookingShared.ts
// Online booking, the pure half: opening hours, the slot grid, the labels people
// read, the confirmation text and the .ics file. Shared by lib/bookings.ts, the
// public booking routes, the admin Booking card and the PROOF Bookings tab.
// Client-safe: no Node imports. Every time is a UTC ISO string; the client's own
// time zone (phone_lines.time_zone, else America/Chicago) is applied here with
// Intl only, so there is no date library and DST comes from the platform's
// time-zone database. The wall-clock math is slice 3's (lib/sequenceSchedule.ts).
import { shortName as inboxShortName } from '@/lib/contactsShared';
import { DEFAULT_TIME_ZONE, maskNumber, normalizePhone, SMS_MAX_CHARS } from '@/lib/phoneShared';
import { localParts as wallClock, safeTimeZone, zonedTime } from '@/lib/sequenceSchedule';
import { normalizeEmail } from '@/lib/sequenceShared';

export { DEFAULT_TIME_ZONE };

export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const WEEKDAY_NAMES: Record<Weekday, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};

/** Open ranges per weekday in the client's local time, 24-hour "HH:MM". A missing or empty day is closed. */
export type BookingHours = Partial<Record<Weekday, Array<[string, string]>>>;

export interface BookingSettings {
  enabled: boolean;
  slotMinutes: number;
  /** Kept free after every booking (drive time, clean-up). */
  bufferMinutes: number;
  /** How many days ahead people can book. */
  leadDays: number;
  hours: BookingHours;
  /** Empty means no service picker. */
  serviceNames: string[];
  /** Optional line added to the confirmation text ("Please park in the side lot."). */
  confirmMessage: string | null;
}

const workday = (): Array<[string, string]> => [['08:00', '17:00']];
export const DEFAULT_HOURS: BookingHours = { mon: workday(), tue: workday(), wed: workday(), thu: workday(), fri: workday() };

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  enabled: false, slotMinutes: 60, bufferMinutes: 15, leadDays: 14, hours: DEFAULT_HOURS, serviceNames: [], confirmMessage: null,
};

/** Nobody can book a slot that starts sooner than this. */
export const MIN_NOTICE_MINUTES = 60;
/** The widest window one slot query may cover. */
export const MAX_QUERY_DAYS = 62;
export const MAX_RANGES_PER_DAY = 3;
export const MAX_SERVICES = 12;
export const CONFIRM_NOTE_MAX = 120;

const MINUTE = 60_000;
const DAY = 86_400_000;

export interface Slot {
  startsAt: string;
  endsAt: string;
}

export type BookingStatus = 'booked' | 'cancelled' | 'done';
export type BookingSource = 'widget' | 'chat' | 'manual';

export interface Booking {
  id: number;
  onboardingId: number;
  contactName: string;
  /** E.164. */
  phone: string;
  email: string | null;
  service: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  source: BookingSource;
  cancelToken: string;
  createdAt: string;
}

/** What a visitor (or the chat) submits, after parseBookingInput. */
export interface BookingInput {
  name: string;
  phone: string;
  email: string | null;
  service: string;
  startsAt: string;
}

/** A refusal whose message is safe to show the person booking. */
export class BookingError extends Error {}

// ───────────────────────── Time zones, with Intl only ─────────────────────────

/** The wall-clock date and minute of the day an instant shows in a time zone. */
export function localParts(ms: number, timeZone: string): { y: number; m: number; d: number; minutes: number } {
  const p = wallClock(new Date(ms), timeZone);
  return { y: p.year, m: p.month, d: p.day, minutes: p.hour * 60 + p.minute };
}

/**
 * The instant a local wall time happens, or null when it never does (the hour
 * skipped when clocks spring forward, or a date like Feb 31). On the fall-back
 * day an hour that happens twice resolves to its first occurrence (zonedTime).
 */
export function zonedTimeToUtc(y: number, m: number, d: number, minutes: number, timeZone: string): number | null {
  const utc = zonedTime(y, m, d, 0, minutes, timeZone).getTime();
  const back = localParts(utc, timeZone);
  return back.y === y && back.m === m && back.d === d && back.minutes === minutes ? utc : null;
}

/** A zone Intl knows (safeTimeZone falls back to Central for anything else). */
export const isValidTimeZone = (tz: unknown): tz is string => typeof tz === 'string' && tz !== '' && safeTimeZone(tz) === tz;

// ───────────────────────── Settings ─────────────────────────

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(hhmm: string): number | null {
  const m = HHMM.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function validateHours(raw: unknown): BookingHours {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Hours must be an object of weekdays');
  const out: BookingHours = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(WEEKDAYS as readonly string[]).includes(key)) throw new Error(`Unknown day "${key}"`);
    const day = key as Weekday;
    const name = WEEKDAY_NAMES[day];
    if (!Array.isArray(value)) throw new Error(`${name}: hours must be a list of time ranges`);
    if (value.length === 0) continue;
    if (value.length > MAX_RANGES_PER_DAY) throw new Error(`${name}: at most ${MAX_RANGES_PER_DAY} time ranges`);
    const ranges: Array<[string, string]> = [];
    for (const r of value) {
      if (!Array.isArray(r) || r.length !== 2) throw new Error(`${name}: each range needs an opening and a closing time`);
      const [a, b] = [String(r[0]), String(r[1])];
      const open = toMinutes(a);
      const close = toMinutes(b);
      if (open === null || close === null) throw new Error(`${name}: use times like 08:00 and 17:30`);
      if (close <= open) throw new Error(`${name}: closing time must be after opening time`);
      ranges.push([a, b]);
    }
    ranges.sort((x, y) => (toMinutes(x[0]) ?? 0) - (toMinutes(y[0]) ?? 0));
    for (let i = 1; i < ranges.length; i += 1) {
      if ((toMinutes(ranges[i][0]) ?? 0) < (toMinutes(ranges[i - 1][1]) ?? 0)) throw new Error(`${name}: time ranges overlap`);
    }
    out[day] = ranges;
  }
  return out;
}

function wholeNumber(v: unknown, label: string, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  return n;
}

/** The admin Booking card's form → settings. Throws a message safe to show the admin. */
export function validateBookingSettings(raw: Record<string, unknown>): BookingSettings {
  const list = Array.isArray(raw.serviceNames) ? raw.serviceNames : typeof raw.serviceNames === 'string' ? raw.serviceNames.split('\n') : [];
  const serviceNames = [...new Set(list.map((s) => String(s).trim()).filter(Boolean))];
  if (serviceNames.length > MAX_SERVICES) throw new Error(`List at most ${MAX_SERVICES} services`);
  if (serviceNames.some((s) => s.length > 60)) throw new Error('Each service name must be 60 characters or fewer');
  const note = typeof raw.confirmMessage === 'string' ? raw.confirmMessage.trim() : '';
  if (note.length > CONFIRM_NOTE_MAX) throw new Error(`The confirmation note must be ${CONFIRM_NOTE_MAX} characters or fewer`);
  return {
    enabled: raw.enabled === true || raw.enabled === 'true',
    slotMinutes: wholeNumber(raw.slotMinutes, 'Slot length', 15, 480),
    bufferMinutes: wholeNumber(raw.bufferMinutes, 'Buffer', 0, 120),
    leadDays: wholeNumber(raw.leadDays, 'Days ahead', 1, 90),
    hours: validateHours(raw.hours),
    serviceNames,
    confirmMessage: note || null,
  };
}

// ───────────────────────── The slot grid ─────────────────────────

export interface SlotQuery {
  hours: BookingHours;
  slotMinutes: number;
  bufferMinutes: number;
  leadDays: number;
  /** Window to list, as instants (ISO strings, ms or Dates). */
  from: string | number | Date;
  to: string | number | Date;
  timeZone: string;
  /** Booked ranges; slots that overlap one (buffer included on both sides) are left out. */
  taken: ReadonlyArray<Pick<Slot, 'startsAt' | 'endsAt'>>;
  /** For tests; defaults to Date.now(). */
  now?: number;
}

const toMs = (v: string | number | Date) => (typeof v === 'number' ? v : new Date(v).getTime());

/**
 * Every open slot in the window, earliest first. Slots start at each range's
 * opening time and step by slot + buffer in local wall-clock minutes; a slot
 * must end by the closing time, start at least MIN_NOTICE_MINUTES from now and
 * no later than leadDays from now, and keep the buffer clear of every taken range.
 */
export function generateSlots(q: SlotQuery): Slot[] {
  const now = q.now ?? Date.now();
  const start = Math.max(toMs(q.from), now + MIN_NOTICE_MINUTES * MINUTE);
  const end = Math.min(toMs(q.to), now + q.leadDays * DAY, start + MAX_QUERY_DAYS * DAY);
  const step = q.slotMinutes + q.bufferMinutes;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || q.slotMinutes <= 0 || step <= 0) return [];
  const slotMs = q.slotMinutes * MINUTE;
  const bufferMs = q.bufferMinutes * MINUTE;
  const taken = q.taken.map((t) => ({ s: toMs(t.startsAt), e: toMs(t.endsAt) }));
  const first = localParts(start, q.timeZone);
  const last = localParts(end, q.timeZone);
  const lastDay = Date.UTC(last.y, last.m - 1, last.d);
  const out: Slot[] = [];
  for (let day = Date.UTC(first.y, first.m - 1, first.d); day <= lastDay; day += DAY) {
    const date = new Date(day);
    const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    for (const [open, close] of q.hours[WEEKDAYS[date.getUTCDay()]] ?? []) {
      const o = toMinutes(open);
      const c = toMinutes(close);
      if (o === null || c === null) continue;
      for (let t = o; t + q.slotMinutes <= c; t += step) {
        const s = zonedTimeToUtc(y, m, d, t, q.timeZone);
        if (s === null || s < start || s > end) continue;
        const e = s + slotMs;
        if (taken.some((b) => s < b.e + bufferMs && b.s < e + bufferMs)) continue;
        out.push({ startsAt: new Date(s).toISOString(), endsAt: new Date(e).toISOString() });
      }
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** "2026-10-13" in the client's zone → the instant that day starts, for "show me times from Friday". */
export function localDayStart(raw: unknown, timeZone: string): string | null {
  const m = typeof raw === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim()) : null;
  if (!m) return null;
  const ms = zonedTimeToUtc(Number(m[1]), Number(m[2]), Number(m[3]), 0, timeZone);
  return ms === null ? null : new Date(ms).toISOString();
}

// ───────────────────────── Words people read ─────────────────────────

function readable(ms: number, timeZone: string): { day: string; time: string } {
  const p: Record<string, string> = {};
  const f = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  for (const part of f.formatToParts(new Date(ms))) p[part.type] = part.value;
  return { day: `${p.weekday}, ${p.month} ${p.day}`, time: `${p.hour}:${p.minute} ${String(p.dayPeriod ?? '').toUpperCase()}` };
}

/** "Tue, Oct 13" */
export const formatSlotDay = (iso: string, timeZone: string): string => readable(Date.parse(iso), timeZone).day;
/** "2:00 PM" */
export const formatSlotTime = (iso: string, timeZone: string): string => readable(Date.parse(iso), timeZone).time;
/** "Tue, Oct 13 at 2:00 PM" */
export function formatSlotLabel(slot: Pick<Slot, 'startsAt'>, timeZone: string): string {
  const r = readable(Date.parse(slot.startsAt), timeZone);
  return `${r.day} at ${r.time}`;
}

export interface SlotDay {
  /** YYYY-MM-DD in the client's zone. */
  date: string;
  label: string;
  slots: Array<Slot & { time: string }>;
}

/** Sorted slots → one entry per local day, for the day chips and the time grid. */
export function groupSlotsByDay(slots: readonly Slot[], timeZone: string): SlotDay[] {
  const days: SlotDay[] = [];
  for (const s of slots) {
    const ms = Date.parse(s.startsAt);
    const p = localParts(ms, timeZone);
    const date = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
    const r = readable(ms, timeZone);
    let day = days[days.length - 1];
    if (!day || day.date !== date) {
      day = { date, label: r.day, slots: [] };
      days.push(day);
    }
    day.slots.push({ ...s, time: r.time });
  }
  return days;
}

/** The confirmation text. Two SMS segments at most; the optional note is dropped first when it would not fit. */
export function confirmationText(input: { business: string | null; when: string; service: string; cancelUrl: string; note: string | null }): string {
  const who = input.business?.trim() || 'us';
  const what = input.service.trim() ? `${input.service.trim()} on ` : '';
  const head = `You're booked with ${who}: ${what}${input.when}.`;
  const tail = ` Need to cancel? ${input.cancelUrl} Reply STOP to opt out.`;
  const note = input.note?.trim() ? ` ${input.note.trim()}` : '';
  const full = head + note + tail;
  return full.length <= SMS_MAX_CHARS ? full : head + tail;
}

/** Sent to the customer when the owner cancels from the admin card. */
export function ownerCancelText(input: { business: string | null; when: string; service: string }): string {
  const who = input.business?.trim() || 'We';
  return `${who} had to cancel your ${input.service.trim() || 'appointment'} on ${input.when}. Sorry about that. Reply here or call to pick a new time.`;
}

const icsTime = (v: string | number) => new Date(v).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');

/** RFC 5545 line folding: 75 octets of UTF-8, continuation lines start with a space; never splits a character. */
function fold(line: string): string {
  const bytes = (c: string) => new TextEncoder().encode(c).length;
  const parts: string[] = [];
  let cur = '';
  let size = 0;
  for (const ch of line) {
    const n = bytes(ch);
    const limit = parts.length === 0 ? 75 : 74;
    if (size + n > limit) {
      parts.push(cur);
      cur = '';
      size = 0;
    }
    cur += ch;
    size += n;
  }
  parts.push(cur);
  return parts.map((p, i) => (i === 0 ? p : ` ${p}`)).join('\r\n');
}

/** A one-event calendar file for the confirmation email. */
export function icsFor(input: { uid: string; startsAt: string; endsAt: string; summary: string; description: string; now?: number }): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Axeon Studio//Online booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${icsTime(input.now ?? Date.now())}`,
    `DTSTART:${icsTime(input.startsAt)}`,
    `DTEND:${icsTime(input.endsAt)}`,
    `SUMMARY:${icsText(input.summary)}`,
    `DESCRIPTION:${icsText(input.description)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/** What the booking form (or the chat's book_slot) sent → a clean BookingInput, or a BookingError to show. */
export function parseBookingInput(raw: Record<string, unknown>, serviceNames: readonly string[]): BookingInput {
  const name = typeof raw.name === 'string' ? raw.name.trim().replace(/\s+/g, ' ') : '';
  if (name.length < 2 || name.length > 80) throw new BookingError('Please enter your name');
  const phone = normalizePhone(raw.phone);
  if (!phone) throw new BookingError('Please enter a 10-digit US phone number');
  const typedEmail = typeof raw.email === 'string' ? raw.email.trim() : '';
  const email = typedEmail ? normalizeEmail(typedEmail) : null;
  if (typedEmail && !email) throw new BookingError('That email address does not look right');
  const service = typeof raw.service === 'string' ? raw.service.trim() : '';
  if (serviceNames.length > 0 && !serviceNames.includes(service)) throw new BookingError('Please pick a service');
  const t = typeof raw.startsAt === 'string' ? Date.parse(raw.startsAt) : NaN;
  if (!Number.isFinite(t)) throw new BookingError('Please pick a time');
  return { name, phone, email, service: serviceNames.length > 0 ? service : '', startsAt: new Date(t).toISOString() };
}

/** "Mike R.": enough for the owner to recognise, not enough to identify from a screenshot. */
export const shortName = (full: string): string => inboxShortName(full) ?? 'Someone';

// ───────────────────────── Shapes the screens get ─────────────────────────

/** One month (YYYY-MM, America/Chicago, like every report) of bookings, by when they were made. */
export interface BookingsMonth {
  month: string;
  booked: number;
  byChat: number;
  done: number;
  cancelled: number;
}

/** A booking as the client dashboard gets it: short name, masked number. */
export interface DashboardBooking {
  id: number;
  startsAt: string;
  service: string;
  who: string;
  phone: string;
  status: BookingStatus;
  source: BookingSource;
}

export interface DashboardBookings {
  enabled: boolean;
  /** The hosted booking page, when the client has a site key. */
  bookUrl: string | null;
  timeZone: string;
  thisMonth: BookingsMonth;
  lastMonth: BookingsMonth;
  next7: DashboardBooking[];
}

export const toDashboardBooking = (b: Booking): DashboardBooking => ({
  id: b.id, startsAt: b.startsAt, service: b.service, who: shortName(b.contactName), phone: maskNumber(b.phone), status: b.status, source: b.source,
});

/** What the admin Booking card loads and every admin booking API call returns. */
export interface AdminBookingData {
  settings: BookingSettings;
  timeZone: string;
  upcoming: Booking[];
  siteKey: string | null;
}
