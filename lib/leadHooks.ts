// lib/leadHooks.ts
// The one place slice 5 (online booking and website chat) calls slices 2, 3
// and 4: form submissions and owner alerts (lib/leads.ts, lib/phoneLines.ts),
// reminder sequences (lib/sequences.ts) and the leads inbox (lib/contacts.ts).
// If one of those signatures changes, this file changes and nothing else does.
// Server-only.
import { ensureSchema, sql } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { projectForm, upsertContactEvent } from '@/lib/contacts';
import { sendOwnerNoticeEmail } from '@/lib/email';
import { deliverLead, recordFormSubmission, type LeadOwner } from '@/lib/leads';
import { LEAD_MESSAGE_MAX, isQuietHours, pagePath } from '@/lib/leadShared';
import { getItemStates } from '@/lib/onboarding';
import { getLine, sendOwnerAlert } from '@/lib/phoneLines';
import { startRun, type RunStopReason, type StartResult } from '@/lib/sequences';
import type { Booking } from '@/lib/bookingShared';

export type Owner = LeadOwner;

/**
 * A chat visitor who left their number. Written as a form submission and then
 * handled exactly as /api/lead handles the site's quote form: into the inbox
 * (projectForm), then deliverLead (owner email and text, call connect, the
 * new_lead follow-up). The slow part runs through `defer` (after() in the route).
 */
export async function submitChatLead(
  owner: Owner,
  input: { name: string; phone: string; email: string | null; message: string; page: string | null; session: string },
  defer: (task: () => Promise<void>) => void
): Promise<number> {
  const saved = await recordFormSubmission(
    owner.id,
    {
      name: input.name.trim().slice(0, 80) || 'Website chat visitor',
      phone: input.phone,
      email: input.email,
      message: input.message.slice(0, LEAD_MESSAGE_MAX),
      page: pagePath(input.page),
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    },
    // Not an IP hash: chat is limited by its own message limits, and this keeps chat leads out of /api/lead's per-IP count.
    { ipHash: `chat:${input.session}`.slice(0, 32) }
  );
  defer(async () => {
    try {
      const projected = await projectForm(saved.id).catch((err) => {
        console.error('[chat] inbox', saved.id, errText(err));
        return null;
      });
      await deliverLead(owner, saved, { contactId: projected?.contactId ?? null });
    } catch (err) {
      console.error('[chat] deliver', saved.id, errText(err));
    }
  });
  return saved.id;
}

/** Where the owner wants lead email: the portal's lead-routing answer, else the account email. */
export async function ownerEmailFor(owner: Owner): Promise<string> {
  const states = await getItemStates(owner.id);
  const v = states['lead-routing']?.data?.alertEmail;
  return typeof v === 'string' && v.includes('@') ? v.trim() : owner.clientEmail;
}

/**
 * Tell the owner something happened: a text through their line (slice 2's alert
 * path) outside quiet hours (8 pm to 8 am client-local, isQuietHours from
 * lib/leadShared.ts); otherwise, or when the text cannot go, an email.
 */
export async function alertOwner(owner: Owner, subject: string, body: string, now: Date = new Date()): Promise<void> {
  const line = await getLine(owner.id);
  if (line && !isQuietHours(now, line.timeZone)) {
    const r = await sendOwnerAlert(line, body);
    if (r.sent) return;
  }
  await sendOwnerNoticeEmail({ to: await ownerEmailFor(owner), subject, text: body });
}

export interface LeadHookEvent {
  onboardingId: number;
  phone: string | null;
  email: string | null;
  name: string | null;
  /** 'booking' moves the contact to Booked by itself (slice 4); 'note' is a plain timeline line (a cancel). */
  kind: 'booking' | 'chat' | 'note';
  refTable: 'bookings' | 'chat_sessions';
  /** bookings.id; null for a chat (its id is text and rides in payload.session). */
  refId: number | null;
  /** 0 for the booking itself, 1 for its cancel note: one row each, so a cancel never overwrites "Booked". */
  refPart?: number;
  summary: string;
  payload: Record<string, unknown>;
  /** When it happened, ISO. Defaults to now. */
  createdAt?: string;
  /** False when the event may only attach to an existing contact (a cancel). Default true. */
  createIfMissing?: boolean;
}

/** One row on the contact's timeline in the leads inbox (slice 4's upsertContactEvent). */
export async function logContactEvent(input: LeadHookEvent): Promise<void> {
  await upsertContactEvent({
    onboardingId: input.onboardingId,
    kind: input.kind,
    refTable: input.refTable,
    refId: input.refId,
    refPart: input.refPart ?? 0,
    phone: input.phone,
    email: input.email,
    name: input.name,
    summary: input.summary,
    payload: input.payload,
    createdAt: input.createdAt ?? new Date().toISOString(),
    createIfMissing: input.createIfMissing,
  });
}

/**
 * Slice 3's reminder texts (24 h and 2 h before), anchored on the appointment
 * (startRun throws for 'reminder' without anchorAt) and keyed to the booking so
 * a cancel stops exactly them. startRun allows one active reminder run per
 * person, so a second upcoming booking by the same number gets 'already_active'.
 */
export async function startBookingReminders(
  onboardingId: number,
  booking: Pick<Booking, 'id' | 'contactName' | 'phone' | 'email' | 'startsAt'>
): Promise<StartResult> {
  return startRun(
    onboardingId,
    'reminder',
    { name: booking.contactName, phone: booking.phone, email: booking.email },
    { table: 'bookings', id: booking.id },
    { anchorAt: new Date(booking.startsAt) }
  );
}

/** Stops only this booking's reminders (stopRunsFor would match every run for that phone). */
export async function stopBookingReminders(bookingId: number): Promise<void> {
  const reason: RunStopReason = 'cancelled';
  await ensureSchema();
  await sql`
    UPDATE sequence_runs SET status = 'stopped', stop_reason = ${reason}, updated_at = now()
    WHERE ref_table = 'bookings' AND ref_id = ${bookingId} AND status = 'active';
  `;
}
