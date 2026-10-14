// lib/chatTools.ts
// What the chat's four tools do, with every side effect injected (lib/chat.ts
// wires the real booking module, lead hooks and database; tests pass fakes).
// The once-per-session rules live here:
//   book_slot     at most one booking a session, across turns, and inside the
//                 same per-IP booking budget as the booking widget
//   take_message  one lead a session; a repeat says it was already passed on
//   handoff       one owner alert a session, with a short, link-free text
// Only parseBookingInput-clean input reaches createBooking, and createBooking
// only books a time openSlots offers right now. No Node imports, no SQL.
import { BookingError, formatSlotLabel, localDayStart, parseBookingInput, type Booking, type BookingInput, type BookingSettings, type Slot } from '@/lib/bookingShared';
import { formatPhone, normalizePhone } from '@/lib/phoneShared';
import { handoffAlertText, type SessionToolFlags } from '@/lib/chatShared';
import type { ToolExecutor } from '@/lib/chatLoop';

const DAY = 86_400_000;

export type ChatBookingResult = { ok: true; booking: Booking; timeZone: string } | { ok: false; reason: 'closed' | 'taken' | 'limit' };

export interface ChatToolState {
  /** E.164 once the visitor gave one. */
  phone: string | null;
  name: string | null;
  /** The labels of the times last offered, shown as buttons. */
  choices: string[];
  /** Set once this session has a booking (seeded from the stored tool rows). */
  booked: { when: string } | null;
  messaged: boolean;
  handedOff: boolean;
}

export const initialToolState = (session: { phone: string | null; name: string | null }, flags: SessionToolFlags): ChatToolState => ({
  phone: session.phone,
  name: session.name,
  choices: [],
  booked: flags.booked ? { when: flags.bookedWhen ?? '' } : null,
  messaged: flags.messaged,
  handedOff: flags.handedOff,
});

export interface ChatToolDeps {
  booking: BookingSettings;
  timeZone: string;
  openSlots: (range: { from: string; to: string }) => Promise<{ slots: Slot[] }>;
  createBooking: (input: BookingInput) => Promise<ChatBookingResult>;
  /** True when this visitor's IP is over the booking budget it shares with the booking widget (counts this attempt). */
  bookingRateLimited: () => boolean;
  /** Start the booking's follow-through now (texts, reminders, inbox, owner alert); must not throw. */
  followThrough: (booking: Booking, timeZone: string) => void;
  submitLead: (lead: { name: string; phone: string; message: string }) => Promise<void>;
  alertOwner: (subject: string, body: string) => Promise<void>;
  /** Remember the visitor's number on the session (and log the transcript once). */
  knowPhone: (phone: string, name: string | null) => Promise<void>;
  now?: () => number;
}

/** knowPhone after something already happened for real: a failure is logged, never turned into a tool error the model retries. */
async function remember(deps: ChatToolDeps, phone: string, name: string | null, what: string): Promise<void> {
  try {
    await deps.knowPhone(phone, name);
  } catch (err) {
    console.error(`chat: session phone not saved after ${what}`, err instanceof Error ? err.message : err);
  }
}

export function chatToolExecutor(deps: ChatToolDeps, state: ChatToolState): ToolExecutor {
  const now = deps.now ?? Date.now;
  return async (name, raw) => {
    const args = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    switch (name) {
      case 'offer_booking': {
        if (!deps.booking.enabled) return { available: false, note: 'Online booking is off. Offer to take their name and number instead.' };
        if (state.booked) return { available: false, note: 'They already booked in this chat. Do not offer another time; offer to take a message for anything else.' };
        const from = localDayStart(args.after_date, deps.timeZone) ?? new Date(now()).toISOString();
        const to = new Date(Date.parse(from) + 14 * DAY).toISOString();
        const { slots } = await deps.openSlots({ from, to });
        const offered = slots.slice(0, 6).map((s) => ({ starts_at: s.startsAt, label: formatSlotLabel(s, deps.timeZone) }));
        state.choices = offered.map((s) => s.label);
        return offered.length ? { available: true, slots: offered } : { available: false, note: 'No open times in the next two weeks. Offer to take a message.' };
      }
      case 'book_slot': {
        if (state.booked) return { ok: false, error: `Already booked in this chat${state.booked.when ? ` for ${state.booked.when}` : ''}. Do not book again; offer to take a message for anything else.` };
        let parsed: BookingInput;
        try {
          parsed = parseBookingInput({ name: args.name, phone: args.phone, email: args.email, service: args.service, startsAt: args.starts_at }, deps.booking.serviceNames);
        } catch (err) {
          if (err instanceof BookingError) return { ok: false, error: err.message };
          throw err;
        }
        if (deps.bookingRateLimited()) return { ok: false, error: 'Too many bookings from this connection right now. Offer to take their name and number instead.' };
        const result = await deps.createBooking(parsed);
        if (!result.ok) {
          const why = { taken: 'That time is no longer open. Call offer_booking again.', limit: 'They already have three upcoming bookings. Offer to take a message.', closed: 'Online booking is off.' };
          return { ok: false, error: why[result.reason] };
        }
        // Committed. Nothing below may turn this into a failure.
        const made = result.booking;
        const when = formatSlotLabel(made, result.timeZone);
        state.choices = [];
        state.booked = { when };
        deps.followThrough(made, result.timeZone);
        await remember(deps, parsed.phone, parsed.name, 'booking');
        return { ok: true, when, service: made.service };
      }
      case 'take_message': {
        if (state.messaged) return { ok: true, already: true, note: 'Their message was already passed on in this chat. Do not take it again; tell them the business has it.' };
        const phone = normalizePhone(args.phone);
        const who = typeof args.name === 'string' ? args.name.trim().slice(0, 80) : '';
        const message = typeof args.message === 'string' ? args.message.trim().slice(0, 1000) : '';
        if (!phone) return { ok: false, error: 'Ask for a 10-digit US phone number first.' };
        if (!who) return { ok: false, error: 'Ask for their name first.' };
        await deps.submitLead({ name: who, phone, message: message || 'Asked to be contacted from the website chat.' });
        state.messaged = true;
        await remember(deps, phone, who, 'message');
        return { ok: true };
      }
      case 'handoff': {
        if (state.handedOff) return { ok: true, already: true, note: 'The owner was already asked to get in touch in this chat. Do not ask again; tell them they will hear back soon.' };
        const phone = normalizePhone(args.phone) ?? state.phone;
        if (!phone) return { ok: false, error: 'Ask for their phone number first.' };
        const who = (typeof args.name === 'string' && args.name.trim().slice(0, 80)) || state.name || null;
        const reason = typeof args.reason === 'string' ? args.reason : '';
        await deps.alertOwner('Someone on your website chat wants you', handoffAlertText({ who, phone: formatPhone(phone), reason }));
        state.handedOff = true;
        await remember(deps, phone, who, 'handoff');
        return { ok: true };
      }
      default:
        return { ok: false, error: 'Unknown tool' };
    }
  };
}
