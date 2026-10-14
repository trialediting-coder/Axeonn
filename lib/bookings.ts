// lib/bookings.ts
// Online booking, the server half: settings, open slots, the booking write (one
// transaction with a per-client lock, so a slot cannot be sold twice), cancel,
// and the follow-through: confirmation text and email, reminders, the owner
// alert, the inbox row. Times are UTC; the client's time zone comes from their
// phone line (America/Chicago without one). Server-only.
import { randomBytes } from 'node:crypto';
import { db } from '@vercel/postgres';
import { ensureSchema, sql } from '@/lib/db';
import { iso, type DbId, type DbTime } from '@/lib/dbRows';
import { sendBookingEmail } from '@/lib/email';
import { SITE_ORIGIN } from '@/lib/hostRouting';
import { alertOwner, logContactEvent, ownerEmailFor, startBookingReminders, stopBookingReminders, type Owner } from '@/lib/leadHooks';
import { isQuietHours } from '@/lib/leadShared';
import { getLine, sendClientSms } from '@/lib/phoneLines';
import { formatPhone } from '@/lib/phoneShared';
import { safeTimeZone } from '@/lib/sequenceSchedule';
import { REPORT_TIME_ZONE, getTrackingSettings } from '@/lib/siteStats';
import {
  DEFAULT_BOOKING_SETTINGS, confirmationText, formatSlotLabel, generateSlots, icsFor, ownerCancelText, toDashboardBooking,
  type AdminBookingData, type Booking, type BookingHours, type BookingInput, type BookingSettings, type BookingSource, type BookingsMonth,
  type DashboardBookings, type Slot,
} from '@/lib/bookingShared';

/** One person can hold at most this many upcoming bookings with one client. */
export const MAX_ACTIVE_PER_PHONE = 3;
/** First key of the advisory lock (the second is the client id). Unused anywhere else. */
const BOOKING_LOCK = 5150;
const TOKEN_RE = /^[A-Za-z0-9_-]{24}$/;

interface SettingsRow {
  enabled: boolean;
  slot_minutes: number;
  buffer_minutes: number;
  lead_days: number;
  hours: unknown;
  service_names: string[] | null;
  confirm_message: string | null;
}

const toSettings = (r: SettingsRow): BookingSettings => ({
  enabled: r.enabled,
  slotMinutes: Number(r.slot_minutes),
  bufferMinutes: Number(r.buffer_minutes),
  leadDays: Number(r.lead_days),
  hours: r.hours && typeof r.hours === 'object' && !Array.isArray(r.hours) ? (r.hours as BookingHours) : {},
  serviceNames: r.service_names ?? [],
  confirmMessage: r.confirm_message,
});

interface BookingRow {
  id: DbId;
  onboarding_id: number;
  contact_name: string;
  phone: string;
  email: string | null;
  service: string;
  starts_at: DbTime;
  ends_at: DbTime;
  status: Booking['status'];
  source: BookingSource;
  cancel_token: string;
  created_at: DbTime;
}

const toBooking = (r: BookingRow): Booking => ({
  id: Number(r.id),
  onboardingId: Number(r.onboarding_id),
  contactName: r.contact_name,
  phone: r.phone,
  email: r.email,
  service: r.service,
  startsAt: iso(r.starts_at),
  endsAt: iso(r.ends_at),
  status: r.status,
  source: r.source,
  cancelToken: r.cancel_token,
  createdAt: iso(r.created_at),
});

/** The hosted booking page for a client's site key. */
export const bookingUrl = (siteKey: string): string => `${SITE_ORIGIN}/b/${siteKey}`;
/** The link in the confirmation text and email. Opening it only asks; the page's button cancels. */
export const cancelUrl = (siteKey: string, token: string): string => `${SITE_ORIGIN}/b/${siteKey}/cancel/${token}`;

export async function getBookingSettings(onboardingId: number): Promise<BookingSettings> {
  await ensureSchema();
  const { rows } = await sql<SettingsRow>`
    SELECT enabled, slot_minutes, buffer_minutes, lead_days, hours, service_names, confirm_message
    FROM booking_settings WHERE onboarding_id = ${onboardingId} LIMIT 1;
  `;
  return rows[0] ? toSettings(rows[0]) : { ...DEFAULT_BOOKING_SETTINGS };
}

export async function saveBookingSettings(onboardingId: number, s: BookingSettings): Promise<BookingSettings> {
  await ensureSchema();
  const { rows } = await sql<SettingsRow>`
    INSERT INTO booking_settings (onboarding_id, enabled, slot_minutes, buffer_minutes, lead_days, hours, service_names, confirm_message, updated_at)
    VALUES (${onboardingId}, ${s.enabled}, ${s.slotMinutes}, ${s.bufferMinutes}, ${s.leadDays}, ${JSON.stringify(s.hours)}::jsonb,
            ${s.serviceNames as unknown as string}, ${s.confirmMessage}, now())
    ON CONFLICT (onboarding_id) DO UPDATE SET
      enabled = EXCLUDED.enabled, slot_minutes = EXCLUDED.slot_minutes, buffer_minutes = EXCLUDED.buffer_minutes,
      lead_days = EXCLUDED.lead_days, hours = EXCLUDED.hours, service_names = EXCLUDED.service_names,
      confirm_message = EXCLUDED.confirm_message, updated_at = now()
    RETURNING enabled, slot_minutes, buffer_minutes, lead_days, hours, service_names, confirm_message;
  `;
  return toSettings(rows[0]);
}

/** The client's zone: their phone line's (slice 2), else Central (safeTimeZone). */
export async function bookingTimeZone(onboardingId: number): Promise<string> {
  const line = await getLine(onboardingId);
  return safeTimeZone(line?.timeZone);
}

async function takenRanges(onboardingId: number, fromIso: string, toIso: string): Promise<Slot[]> {
  const { rows } = await sql<{ starts_at: DbTime; ends_at: DbTime }>`
    SELECT starts_at, ends_at FROM bookings
    WHERE onboarding_id = ${onboardingId} AND status = 'booked'
      AND starts_at < ${toIso}::timestamptz + interval '1 day'
      AND ends_at > ${fromIso}::timestamptz - interval '1 day';
  `;
  return rows.map((r) => ({ startsAt: iso(r.starts_at), endsAt: iso(r.ends_at) }));
}

/** Open slots in a window. Nothing about who booked the taken ones leaves this function. */
export async function openSlots(onboardingId: number, range: { from: string; to: string }): Promise<{ settings: BookingSettings; timeZone: string; slots: Slot[] }> {
  await ensureSchema();
  const [settings, timeZone] = await Promise.all([getBookingSettings(onboardingId), bookingTimeZone(onboardingId)]);
  if (!settings.enabled) return { settings, timeZone, slots: [] };
  const taken = await takenRanges(onboardingId, range.from, range.to);
  return { settings, timeZone, slots: generateSlots({ ...settings, from: range.from, to: range.to, timeZone, taken }) };
}

export type CreateBookingResult = { ok: true; booking: Booking; timeZone: string } | { ok: false; reason: 'closed' | 'taken' | 'limit' };

const isUniqueViolation = (err: unknown) => typeof err === 'object' && err !== null && (err as { code?: unknown }).code === '23505';

/**
 * Books one slot. The time must be one generateSlots offers right now (so a
 * made-up time, a closed day or a past time is "taken"). Inside one transaction
 * a per-client advisory lock serialises writers, the overlap check (buffer
 * included) runs again, and the per-phone cap is applied; the partial unique
 * index is the last line of defence and its violation also reads as "taken".
 */
export async function createBooking(onboardingId: number, input: BookingInput, source: BookingSource): Promise<CreateBookingResult> {
  const { settings, timeZone, slots } = await openSlots(onboardingId, { from: input.startsAt, to: new Date(Date.parse(input.startsAt) + 1).toISOString() });
  if (!settings.enabled) return { ok: false, reason: 'closed' };
  const slot = slots.find((s) => s.startsAt === input.startsAt);
  if (!slot) return { ok: false, reason: 'taken' };

  const client = await db.connect();
  try {
    await client.sql`BEGIN`;
    await client.sql`SELECT pg_advisory_xact_lock(${BOOKING_LOCK}::int, ${onboardingId}::int);`;
    const clash = await client.sql`
      SELECT 1 FROM bookings
      WHERE onboarding_id = ${onboardingId} AND status = 'booked'
        AND starts_at < ${slot.endsAt}::timestamptz + make_interval(mins => ${settings.bufferMinutes})
        AND ends_at + make_interval(mins => ${settings.bufferMinutes}) > ${slot.startsAt}::timestamptz
      LIMIT 1;
    `;
    if (clash.rows.length > 0) {
      await client.sql`ROLLBACK`;
      return { ok: false, reason: 'taken' };
    }
    const held = await client.sql<{ n: string }>`
      SELECT count(*)::text AS n FROM bookings
      WHERE onboarding_id = ${onboardingId} AND phone = ${input.phone} AND status = 'booked' AND starts_at > now();
    `;
    if (Number(held.rows[0]?.n ?? 0) >= MAX_ACTIVE_PER_PHONE) {
      await client.sql`ROLLBACK`;
      return { ok: false, reason: 'limit' };
    }
    const token = randomBytes(18).toString('base64url'); // 24 characters
    const { rows } = await client.sql<BookingRow>`
      INSERT INTO bookings (onboarding_id, contact_name, phone, email, service, starts_at, ends_at, source, cancel_token)
      VALUES (${onboardingId}, ${input.name}, ${input.phone}, ${input.email}, ${input.service}, ${slot.startsAt}, ${slot.endsAt}, ${source}, ${token})
      RETURNING *;
    `;
    await client.sql`COMMIT`;
    return { ok: true, booking: toBooking(rows[0]), timeZone };
  } catch (err) {
    await client.sql`ROLLBACK`.catch(() => undefined);
    if (isUniqueViolation(err)) return { ok: false, reason: 'taken' };
    throw err;
  } finally {
    client.release();
  }
}

/** One follow-through step. A failure is logged and never stops the next step or the booking. */
async function step(bookingId: number, label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`booking ${bookingId}: ${label} failed`, err instanceof Error ? err.message : err);
  }
}

/**
 * Everything after the row exists, run from after() so the visitor is not kept
 * waiting: the inbox row (a 'booking' event, which moves the contact to Booked
 * in slice 4), reminders (slice 3, anchored on the appointment), the
 * confirmation text (only through an approved line, via sendClientSms, and not
 * in quiet hours), the email with the .ics when they gave one, and the owner alert.
 */
export async function afterBooking(onboarding: Owner, siteKey: string, booking: Booking, timeZone: string): Promise<void> {
  const when = formatSlotLabel(booking, timeZone);
  const link = cancelUrl(siteKey, booking.cancelToken);
  const settings = await getBookingSettings(onboarding.id).catch(() => DEFAULT_BOOKING_SETTINGS);

  await step(booking.id, 'inbox', () =>
    logContactEvent({
      onboardingId: onboarding.id,
      phone: booking.phone,
      email: booking.email,
      name: booking.contactName,
      kind: 'booking',
      refTable: 'bookings',
      refId: booking.id,
      summary: `Booked ${booking.service ? `${booking.service}, ` : ''}${when}`,
      payload: { startsAt: booking.startsAt, endsAt: booking.endsAt, service: booking.service, source: booking.source },
      createdAt: booking.createdAt,
    })
  );
  await step(booking.id, 'reminders', async () => {
    const r = await startBookingReminders(onboarding.id, booking);
    if (!r.started) console.info(`booking ${booking.id}: reminders not started (${r.reason})`);
  });
  await step(booking.id, 'text', async () => {
    const line = await getLine(onboarding.id);
    if (!line) return;
    // Quiet hours (8 pm to 8 am client-local) hold every automated text; the visitor already has it on screen and by email.
    if (isQuietHours(new Date(), line.timeZone)) return console.info(`booking ${booking.id}: confirmation text skipped (quiet hours)`);
    const body = confirmationText({ business: onboarding.businessName, when, service: booking.service, cancelUrl: link, note: settings.confirmMessage });
    const result = await sendClientSms(line, booking.phone, body, 'confirm');
    if (!result.sent) console.info(`booking ${booking.id}: confirmation text not sent (${result.reason})`);
  });
  const email = booking.email;
  if (email) {
    await step(booking.id, 'email', async () =>
      sendBookingEmail({
        to: email,
        businessName: onboarding.businessName,
        replyTo: await ownerEmailFor(onboarding),
        when,
        service: booking.service,
        cancelUrl: link,
        ics: icsFor({
          uid: `booking-${booking.id}@axeonstudio.co`,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          summary: `${booking.service || 'Appointment'} with ${onboarding.businessName?.trim() || 'us'}`,
          description: `Need to cancel? ${link}`,
        }),
      })
    );
  }
  await step(booking.id, 'owner alert', () =>
    alertOwner(
      onboarding,
      `New booking: ${booking.contactName}`,
      `New booking: ${booking.contactName}, ${formatPhone(booking.phone)}, ${booking.service || 'appointment'} on ${when}${booking.source === 'chat' ? ' (booked through your website chat)' : ''}.`
    )
  );
}

export async function bookingByToken(token: string): Promise<Booking | null> {
  if (!TOKEN_RE.test(token)) return null;
  await ensureSchema();
  const { rows } = await sql<BookingRow>`SELECT * FROM bookings WHERE cancel_token = ${token} LIMIT 1;`;
  return rows[0] ? toBooking(rows[0]) : null;
}

export type CancelResult = { ok: true; booking: Booking } | { ok: false; reason: 'not_found' | 'already' | 'past' };

/** The customer's cancel. Only a live booking that has not started can be cancelled; the update is the check. */
export async function cancelBooking(token: string): Promise<CancelResult> {
  if (!TOKEN_RE.test(token)) return { ok: false, reason: 'not_found' };
  await ensureSchema();
  const { rows } = await sql<BookingRow>`
    UPDATE bookings SET status = 'cancelled', updated_at = now()
    WHERE cancel_token = ${token} AND status = 'booked' AND starts_at > now()
    RETURNING *;
  `;
  if (rows[0]) return { ok: true, booking: toBooking(rows[0]) };
  const existing = await bookingByToken(token);
  if (!existing) return { ok: false, reason: 'not_found' };
  return { ok: false, reason: existing.status === 'cancelled' ? 'already' : 'past' };
}

/** After either side cancels: stop the reminders, note it in the inbox, and tell the other side. */
export async function afterCancel(onboarding: Owner, booking: Booking, timeZone: string, by: 'customer' | 'owner'): Promise<void> {
  const when = formatSlotLabel(booking, timeZone);
  await step(booking.id, 'stop reminders', () => stopBookingReminders(booking.id));
  await step(booking.id, 'inbox', () =>
    logContactEvent({
      onboardingId: onboarding.id,
      phone: booking.phone,
      email: booking.email,
      name: booking.contactName,
      // A note on the same booking (refPart 1): its own timeline row, and a note never moves the stage.
      kind: 'note',
      refTable: 'bookings',
      refId: booking.id,
      refPart: 1,
      summary: `Cancelled ${by === 'customer' ? 'by them' : 'by you'}: ${when}`,
      payload: { text: `Booking cancelled ${by === 'customer' ? 'by them' : 'by you'}: ${when}`, status: 'cancelled', by, startsAt: booking.startsAt },
      createIfMissing: false,
    })
  );
  if (by === 'customer') {
    await step(booking.id, 'owner alert', () =>
      alertOwner(onboarding, `Booking cancelled: ${booking.contactName}`, `${booking.contactName} cancelled their ${booking.service || 'appointment'} on ${when}. That time is open again.`)
    );
    return;
  }
  await step(booking.id, 'text', async () => {
    const line = await getLine(onboarding.id);
    if (!line) return;
    if (isQuietHours(new Date(), line.timeZone)) return console.info(`booking ${booking.id}: cancel text skipped (quiet hours)`);
    await sendClientSms(line, booking.phone, ownerCancelText({ business: onboarding.businessName, when, service: booking.service }), 'confirm');
  });
}

/** Admin card: mark a live booking done, or cancel it for the client. */
export async function markBooking(onboardingId: number, id: number, status: 'done' | 'cancelled'): Promise<Booking | null> {
  await ensureSchema();
  const { rows } = await sql<BookingRow>`
    UPDATE bookings SET status = ${status}, updated_at = now()
    WHERE id = ${id} AND onboarding_id = ${onboardingId} AND status = 'booked'
    RETURNING *;
  `;
  return rows[0] ? toBooking(rows[0]) : null;
}

/** Live bookings from two hours ago onward, soonest first. */
export async function upcomingBookings(onboardingId: number, limit = 50): Promise<Booking[]> {
  await ensureSchema();
  const { rows } = await sql<BookingRow>`
    SELECT * FROM bookings
    WHERE onboarding_id = ${onboardingId} AND status = 'booked' AND starts_at > now() - interval '2 hours'
    ORDER BY starts_at ASC
    LIMIT ${limit};
  `;
  return rows.map(toBooking);
}

/** Bookings made in a month (YYYY-MM, America/Chicago, the report key), by status and source. */
async function monthCounts(onboardingId: number, month: string): Promise<BookingsMonth> {
  const { rows } = await sql<{ booked: string; chat: string; done: string; cancelled: string }>`
    SELECT count(*)::text AS booked,
           count(*) FILTER (WHERE source = 'chat')::text AS chat,
           count(*) FILTER (WHERE status = 'done')::text AS done,
           count(*) FILTER (WHERE status = 'cancelled')::text AS cancelled
    FROM bookings
    WHERE onboarding_id = ${onboardingId}
      AND to_char(created_at AT TIME ZONE ${REPORT_TIME_ZONE}, 'YYYY-MM') = ${month};
  `;
  const r = rows[0];
  return { month, booked: Number(r?.booked ?? 0), byChat: Number(r?.chat ?? 0), done: Number(r?.done ?? 0), cancelled: Number(r?.cancelled ?? 0) };
}

/** The PROOF Bookings tab (lib/proofDashboardData.ts loads it only when the plan includes booking). */
export async function loadDashboardBookings(onboardingId: number, month: string, previous: string): Promise<DashboardBookings> {
  await ensureSchema();
  const [settings, timeZone, tracking, thisMonth, lastMonth, next] = await Promise.all([
    getBookingSettings(onboardingId),
    bookingTimeZone(onboardingId),
    getTrackingSettings(onboardingId),
    monthCounts(onboardingId, month),
    monthCounts(onboardingId, previous),
    sql<BookingRow>`
      SELECT * FROM bookings
      WHERE onboarding_id = ${onboardingId} AND status IN ('booked', 'done')
        AND starts_at >= now() - interval '2 hours' AND starts_at < now() + interval '7 days'
      ORDER BY starts_at ASC LIMIT 50;
    `,
  ]);
  return {
    enabled: settings.enabled,
    bookUrl: tracking.siteKey ? bookingUrl(tracking.siteKey) : null,
    timeZone,
    thisMonth,
    lastMonth,
    next7: next.rows.map(toBooking).map(toDashboardBooking),
  };
}

/** Everything the admin Booking card shows. */
export async function adminBookingData(onboardingId: number): Promise<AdminBookingData> {
  const [settings, timeZone, upcoming, tracking] = await Promise.all([
    getBookingSettings(onboardingId),
    bookingTimeZone(onboardingId),
    upcomingBookings(onboardingId),
    getTrackingSettings(onboardingId),
  ]);
  return { settings, timeZone, upcoming, siteKey: tracking.siteKey };
}
