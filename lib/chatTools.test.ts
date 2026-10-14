// lib/chatTools.test.ts
// Run with: npm run test:chat   (every side effect is a fake; nothing touches a database or the network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatToolExecutor, initialToolState, type ChatBookingResult, type ChatToolDeps } from './chatTools';
import { sessionToolFlags, type ChatRow } from './chatShared';
import { BOOKING_RATE, bookingRateLimited } from './welcomeApi';
import type { Booking, BookingInput } from './bookingShared';

const TZ = 'America/Chicago';
const SLOT = '2026-10-20T19:00:00.000Z';

function booking(input: BookingInput, id = 1): Booking {
  return {
    id, onboardingId: 7, contactName: input.name, phone: input.phone, email: input.email, service: input.service,
    startsAt: input.startsAt, endsAt: '2026-10-20T20:00:00.000Z', status: 'booked', source: 'chat', cancelToken: 't'.repeat(24), createdAt: SLOT,
  };
}

function harness(over: Partial<ChatToolDeps> = {}, rows: ChatRow[] = []) {
  const log = { bookings: 0, followThrough: 0, leads: 0, alerts: [] as string[], rateChecks: 0 };
  const deps: ChatToolDeps = {
    booking: { enabled: true, slotMinutes: 60, bufferMinutes: 0, leadDays: 14, hours: {}, serviceNames: [], confirmMessage: null },
    timeZone: TZ,
    openSlots: async () => ({ slots: [{ startsAt: SLOT, endsAt: '2026-10-20T20:00:00.000Z' }] }),
    createBooking: async (input): Promise<ChatBookingResult> => {
      log.bookings += 1;
      return { ok: true, booking: booking(input, log.bookings), timeZone: TZ };
    },
    bookingRateLimited: () => {
      log.rateChecks += 1;
      return false;
    },
    followThrough: () => {
      log.followThrough += 1;
    },
    submitLead: async () => {
      log.leads += 1;
    },
    alertOwner: async (_subject, body) => {
      log.alerts.push(body);
    },
    knowPhone: async () => undefined,
    now: () => Date.parse('2026-10-14T15:00:00.000Z'),
    ...over,
  };
  const state = initialToolState({ phone: null, name: null }, sessionToolFlags(rows));
  return { exec: chatToolExecutor(deps, state), state, log };
}

const BOOK = { name: 'Jane Doe', phone: '515-555-0134', starts_at: SLOT };

test('book_slot books once a session: a second try in the same turn is refused and books nothing', async () => {
  const { exec, log } = harness();
  const first = (await exec('book_slot', BOOK)) as { ok: boolean; when: string };
  assert.equal(first.ok, true);
  assert.equal(log.bookings, 1);
  assert.equal(log.followThrough, 1);
  const second = (await exec('book_slot', { ...BOOK, phone: '515-555-0199' })) as { ok: boolean; error: string };
  assert.equal(second.ok, false);
  assert.match(second.error, /Already booked in this chat for .*Oct 20/);
  assert.equal(log.bookings, 1);
});

test('a booking stored in an earlier turn blocks another one in a later turn', async () => {
  const rows: ChatRow[] = [{ role: 'tool', content: JSON.stringify({ name: 'book_slot', input: {}, result: { ok: true, when: 'Tue, Oct 20 at 2:00 PM' } }) }];
  const { exec, log } = harness({}, rows);
  const r = (await exec('book_slot', BOOK)) as { ok: boolean; error: string };
  assert.equal(r.ok, false);
  assert.match(r.error, /Already booked in this chat for Tue, Oct 20 at 2:00 PM/);
  assert.equal(log.bookings, 0);
  assert.equal(log.rateChecks, 0);
  const offer = (await exec('offer_booking', {})) as { available: boolean };
  assert.equal(offer.available, false);
});

test('book_slot honours the per-IP booking budget and books nothing past it', async () => {
  const { exec, log } = harness({ bookingRateLimited: () => true });
  const r = (await exec('book_slot', BOOK)) as { ok: boolean; error: string };
  assert.equal(r.ok, false);
  assert.match(r.error, /Too many bookings/);
  assert.equal(log.bookings, 0);
  assert.equal(log.followThrough, 0);
});

test('the widget and the chat share one booking budget per IP (the same key)', () => {
  const ip = `203.0.113.${Math.floor(Math.random() * 200)}`;
  // Widget requests and chat bookings both call bookingRateLimited(ip): together they get BOOKING_RATE.max.
  for (let i = 0; i < BOOKING_RATE.max; i += 1) assert.equal(bookingRateLimited(ip), false, `attempt ${i + 1}`);
  assert.equal(bookingRateLimited(ip), true);
  assert.equal(bookingRateLimited('198.51.100.9'), false); // another IP has its own budget
});

test('take_message makes one lead a session; a repeat says it was already done and makes none', async () => {
  const { exec, log } = harness();
  assert.deepEqual(await exec('take_message', { name: 'Jane', phone: '515-555-0134', message: 'Call me' }), { ok: true });
  const again = (await exec('take_message', { name: 'Jane', phone: '515-555-0134', message: 'Also: white truck' })) as { ok: boolean; already: boolean };
  assert.equal(again.ok, true);
  assert.equal(again.already, true);
  assert.equal(log.leads, 1);

  const stored: ChatRow[] = [{ role: 'tool', content: JSON.stringify({ name: 'take_message', input: {}, result: { ok: true } }) }];
  const later = harness({}, stored);
  const r = (await later.exec('take_message', { name: 'Jane', phone: '515-555-0134', message: 'x' })) as { already?: boolean };
  assert.equal(r.already, true);
  assert.equal(later.log.leads, 0);
});

test('handoff texts the owner once a session, with a short, link-free text', async () => {
  const { exec, log } = harness();
  const reason = `Call me now!! see http://evil.example/x and www.spam.test ${'blah '.repeat(80)}`;
  assert.deepEqual(await exec('handoff', { name: 'Jane', phone: '515-555-0134', reason }), { ok: true });
  assert.equal(log.alerts.length, 1);
  assert.ok(log.alerts[0].length <= 300);
  assert.doesNotMatch(log.alerts[0], /evil\.example|spam\.test|http/);
  assert.match(log.alerts[0], /Jane at \(515\) 555-0134/);
  const again = (await exec('handoff', { name: 'Jane', phone: '515-555-0134', reason: 'again' })) as { already?: boolean };
  assert.equal(again.already, true);
  assert.equal(log.alerts.length, 1);

  const stored: ChatRow[] = [{ role: 'tool', content: JSON.stringify({ name: 'handoff', input: {}, result: { ok: true } }) }];
  const later = harness({}, stored);
  await later.exec('handoff', { phone: '515-555-0134', reason: 'x' });
  assert.equal(later.log.alerts.length, 0);
});

test('a lead or booking that went through is not undone when saving the number on the session fails', async () => {
  const { exec, log } = harness({ knowPhone: async () => { throw new Error('db down'); } });
  assert.deepEqual(await exec('take_message', { name: 'Jane', phone: '515-555-0134', message: 'hi' }), { ok: true });
  const booked = (await exec('book_slot', BOOK)) as { ok: boolean };
  assert.equal(booked.ok, true);
  assert.equal(log.leads, 1);
  assert.equal(log.followThrough, 1);
});
