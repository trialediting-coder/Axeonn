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
  const log = { bookings: 0, followThrough: 0, leads: 0, alerts: [] as string[], rateChecks: 0, notes: [] as Array<{ bookingId: number | null; message: string; when: string }> };
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
    noteOnBooking: async (note) => {
      log.notes.push({ bookingId: note.bookingId, message: note.message, when: note.when });
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

test('after a booking, take_message files no lead: the message is noted on the booking instead', async () => {
  const { exec, log } = harness();
  const booked = (await exec('book_slot', BOOK)) as { ok: boolean; booking_id: number };
  assert.equal(booked.ok, true);
  assert.equal(booked.booking_id, 1);
  const r = (await exec('take_message', { name: 'Jane Doe', phone: '515-555-0134', message: 'Can you also look at my trailer?' })) as { ok: boolean; added_to_booking: boolean; note: string };
  assert.equal(r.ok, true);
  assert.equal(r.added_to_booking, true);
  assert.match(r.note, /with their booking/);
  assert.equal(log.leads, 0, 'no deliverLead, no owner ring, no new-lead texts');
  assert.deepEqual(log.notes, [{ bookingId: 1, message: 'Can you also look at my trailer?', when: log.notes[0].when }]);
  assert.match(log.notes[0].when, /Oct 20/);
  const again = (await exec('take_message', { name: 'Jane Doe', phone: '515-555-0134', message: 'more' })) as { already?: boolean };
  assert.equal(again.already, true);
  assert.equal(log.notes.length, 1);
});

test('a booking from an earlier turn also turns take_message into a note on that booking', async () => {
  const rows: ChatRow[] = [{ role: 'tool', content: JSON.stringify({ name: 'book_slot', input: {}, result: { ok: true, when: 'Tue, Oct 20 at 2:00 PM', booking_id: 9 } }) }];
  const { exec, log } = harness({}, rows);
  const r = (await exec('take_message', { name: 'Jane', message: 'Gate code is 1234' })) as { ok: boolean };
  assert.equal(r.ok, true);
  assert.equal(log.leads, 0);
  assert.deepEqual(log.notes, [{ bookingId: 9, message: 'Gate code is 1234', when: 'Tue, Oct 20 at 2:00 PM' }]);
  const empty = harness({}, rows);
  const none = (await empty.exec('take_message', { name: 'Jane', phone: '515-555-0134', message: '  ' })) as { ok: boolean };
  assert.equal(none.ok, false);
  assert.equal(empty.log.notes.length, 0);
});

test('post-booking tool texts no longer steer a booked customer to a new message lead', async () => {
  const { exec } = harness();
  await exec('book_slot', BOOK);
  const offer = (await exec('offer_booking', {})) as { note: string };
  const again = (await exec('book_slot', BOOK)) as { error: string };
  for (const text of [offer.note, again.error]) {
    assert.ok(!/offer to take a message/i.test(text), text);
    assert.match(text, /adds it to their booking/);
  }
});

test('a slow handoff alert is waited on only until the turn deadline', async () => {
  const t = Date.parse('2026-10-14T15:00:00.000Z');
  const { exec } = harness({ alertOwner: () => new Promise<void>((resolve) => setTimeout(resolve, 2000)), deadline: t + 30, now: () => t });
  const started = Date.now();
  const r = (await exec('handoff', { name: 'Jane', phone: '515-555-0134', reason: 'call me' })) as { ok: boolean };
  assert.equal(r.ok, true);
  assert.ok(Date.now() - started < 1000, 'returned at the deadline, not when the text finished');
});

test('a handoff alert that fails before the deadline is still an error', async () => {
  const now = Date.parse('2026-10-14T15:00:00.000Z');
  const { exec, state } = harness({ alertOwner: async () => { throw new Error('email down'); }, deadline: now + 10_000, now: () => now });
  await assert.rejects(exec('handoff', { name: 'Jane', phone: '515-555-0134', reason: 'x' }), /email down/);
  assert.equal(state.handedOff, false);
});
