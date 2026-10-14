// lib/bookingShared.test.ts
// Run with: npm run test:booking   (tsx --test, no database or network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BookingError, confirmationText, customerNotToldText, formatSlotLabel, generateSlots, groupSlotsByDay, icsFor, isValidTimeZone, localDayStart,
  ownerCancelFallback, ownerCancelText, parseBookingInput, shortName, toDashboardBooking, validateBookingSettings, validateHours, zonedTimeToUtc,
  type Booking, type BookingHours,
} from './bookingShared';
import { renderBookingCancelEmail } from './email';

const TZ = 'America/Chicago';
const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());
// Monday to Friday 8 to noon, Saturday 9 to 11, Sunday closed.
const WEEK: BookingHours = {
  mon: [['08:00', '12:00']], tue: [['08:00', '12:00']], wed: [['08:00', '12:00']], thu: [['08:00', '12:00']], fri: [['08:00', '12:00']],
  sat: [['09:00', '11:00']],
};
const base = { slotMinutes: 60, bufferMinutes: 0, leadDays: 14, timeZone: TZ, taken: [] };
const starts = (q: Parameters<typeof generateSlots>[0]) => generateSlots(q).map((s) => s.startsAt);

test('zonedTimeToUtc maps Chicago wall time to UTC on both sides of DST and refuses the skipped hour', () => {
  assert.equal(iso(zonedTimeToUtc(2026, 3, 7, 8 * 60, TZ)), '2026-03-07T14:00:00.000Z'); // Saturday, CST (UTC-6)
  assert.equal(iso(zonedTimeToUtc(2026, 3, 8, 8 * 60, TZ)), '2026-03-08T13:00:00.000Z'); // Sunday, CDT (UTC-5)
  assert.equal(zonedTimeToUtc(2026, 3, 8, 2 * 60 + 30, TZ), null); // 2:30 AM on 2026-03-08 never happens
  assert.equal(iso(zonedTimeToUtc(2026, 10, 31, 8 * 60, TZ)), '2026-10-31T13:00:00.000Z'); // CDT
  assert.equal(iso(zonedTimeToUtc(2026, 11, 1, 8 * 60, TZ)), '2026-11-01T14:00:00.000Z'); // CST again
  assert.equal(zonedTimeToUtc(2026, 2, 31, 0, TZ), null); // no such date
});

test('generateSlots: hours are local, Sunday is closed, and the offset changes across DST', () => {
  const slots = starts({ ...base, hours: WEEK, from: '2026-03-07T00:00:00Z', to: '2026-03-10T00:00:00Z', now: Date.parse('2026-03-01T00:00:00Z') });
  assert.deepEqual(slots, [
    '2026-03-07T15:00:00.000Z', // Sat 9:00 CST
    '2026-03-07T16:00:00.000Z', // Sat 10:00 CST
    // Sunday 2026-03-08: closed
    '2026-03-09T13:00:00.000Z', // Mon 8:00 CDT
    '2026-03-09T14:00:00.000Z',
    '2026-03-09T15:00:00.000Z',
    '2026-03-09T16:00:00.000Z', // Mon 11:00 CDT; 12:00 would end after close
  ]);
  const first = generateSlots({ ...base, hours: WEEK, from: '2026-03-07T00:00:00Z', to: '2026-03-10T00:00:00Z', now: Date.parse('2026-03-01T00:00:00Z') })[0];
  assert.equal(first.endsAt, '2026-03-07T16:00:00.000Z');
});

test('generateSlots skips the hour that does not exist when clocks spring forward', () => {
  const slots = starts({ ...base, hours: { sun: [['01:00', '04:00']] }, from: '2026-03-08T00:00:00Z', to: '2026-03-09T00:00:00Z', now: Date.parse('2026-03-01T00:00:00Z') });
  assert.deepEqual(slots, ['2026-03-08T07:00:00.000Z', '2026-03-08T08:00:00.000Z']); // 1:00 CST, (2:00 skipped), 3:00 CDT
});

test('generateSlots keeps wall-clock times on the day clocks fall back', () => {
  const slots = starts({ ...base, hours: { sun: [['08:00', '10:00']] }, from: '2026-11-01T00:00:00Z', to: '2026-11-02T06:00:00Z', now: Date.parse('2026-10-25T00:00:00Z') });
  assert.deepEqual(slots, ['2026-11-01T14:00:00.000Z', '2026-11-01T15:00:00.000Z']);
});

test('generateSlots steps by slot plus buffer and keeps the buffer around taken bookings', () => {
  const q = { ...base, bufferMinutes: 15, hours: { tue: [['08:00', '12:00']] } as BookingHours, from: '2026-10-13T00:00:00Z', to: '2026-10-14T00:00:00Z', now: Date.parse('2026-10-01T00:00:00Z') };
  // 8:00, 9:15, 10:30 local (CDT, UTC-5); 11:45 would end after noon.
  assert.deepEqual(starts({ ...q, taken: [] }), ['2026-10-13T13:00:00.000Z', '2026-10-13T14:15:00.000Z', '2026-10-13T15:30:00.000Z']);
  // A booking in the 9:15 slot takes only that slot: 8:00 + 15 min buffer ends at 9:15, and 10:30 starts 15 min after it.
  const sameSlot = [{ startsAt: '2026-10-13T14:15:00.000Z', endsAt: '2026-10-13T15:15:00.000Z' }];
  assert.deepEqual(starts({ ...q, taken: sameSlot }), ['2026-10-13T13:00:00.000Z', '2026-10-13T15:30:00.000Z']);
  // A five-minute manual booking at 10:20 sits inside both buffers, so 9:15 and 10:30 both go.
  const manual = [{ startsAt: '2026-10-13T15:20:00.000Z', endsAt: '2026-10-13T15:25:00.000Z' }];
  assert.deepEqual(starts({ ...q, taken: manual }), ['2026-10-13T13:00:00.000Z']);
});

test('generateSlots hides slots inside the one-hour notice and past the days-ahead limit', () => {
  const q = { ...base, hours: { tue: [['08:00', '12:00']], wed: [['08:00', '12:00']] } as BookingHours, from: '2026-10-13T00:00:00Z', to: '2026-10-15T05:00:00Z' };
  const now = Date.parse('2026-10-13T13:30:00Z'); // 8:30 AM Tuesday: 8:00 is past, 9:00 is inside the hour of notice
  assert.deepEqual(starts({ ...q, now }).slice(0, 2), ['2026-10-13T15:00:00.000Z', '2026-10-13T16:00:00.000Z']);
  const oneDay = starts({ ...q, now, leadDays: 1 });
  assert.ok(oneDay.includes('2026-10-14T13:00:00.000Z')); // Wed 8:00 is inside 24 h
  assert.ok(!oneDay.includes('2026-10-14T16:00:00.000Z')); // Wed 11:00 is not
});

test('generateSlots returns nothing for an empty or backwards window', () => {
  assert.deepEqual(generateSlots({ ...base, hours: WEEK, from: '2026-10-14T00:00:00Z', to: '2026-10-13T00:00:00Z', now: Date.parse('2026-10-01T00:00:00Z') }), []);
  assert.deepEqual(generateSlots({ ...base, hours: {}, from: '2026-10-13T00:00:00Z', to: '2026-10-20T00:00:00Z', now: Date.parse('2026-10-01T00:00:00Z') }), []);
});

test('validateHours sorts ranges, drops empty days and refuses bad input', () => {
  assert.deepEqual(validateHours({ mon: [['13:00', '17:00'], ['08:00', '12:00']], sun: [] }), { mon: [['08:00', '12:00'], ['13:00', '17:00']] });
  assert.throws(() => validateHours([]), /object/);
  assert.throws(() => validateHours({ funday: [] }), /Unknown day/);
  assert.throws(() => validateHours({ mon: [['17:00', '08:00']] }), /after opening/);
  assert.throws(() => validateHours({ mon: [['08:00', '12:00'], ['11:00', '14:00']] }), /overlap/);
  assert.throws(() => validateHours({ mon: [['8am', '5pm']] }), /like 08:00/);
  assert.throws(() => validateHours({ mon: [['08:00', '09:00'], ['10:00', '11:00'], ['12:00', '13:00'], ['14:00', '15:00']] }), /at most 3/);
});

test('validateBookingSettings reads the admin form', () => {
  const ok = {
    enabled: true, slotMinutes: '90', bufferMinutes: 0, leadDays: 30, hours: { mon: [['08:00', '17:00']] },
    serviceNames: 'Full detail\n\nInterior\nFull detail', confirmMessage: '  Park on the side.  ',
  };
  assert.deepEqual(validateBookingSettings(ok), {
    enabled: true, slotMinutes: 90, bufferMinutes: 0, leadDays: 30, hours: { mon: [['08:00', '17:00']] },
    serviceNames: ['Full detail', 'Interior'], confirmMessage: 'Park on the side.',
  });
  assert.throws(() => validateBookingSettings({ ...ok, slotMinutes: 5 }), /Slot length/);
  assert.throws(() => validateBookingSettings({ ...ok, leadDays: 365 }), /Days ahead/);
  assert.throws(() => validateBookingSettings({ ...ok, confirmMessage: 'x'.repeat(121) }), /120/);
  assert.throws(() => validateBookingSettings({ ...ok, serviceNames: Array.from({ length: 13 }, (_, i) => `S${i}`) }), /12 services/);
});

test('labels read the way people say times, in the client time zone', () => {
  assert.equal(formatSlotLabel({ startsAt: '2026-10-13T19:00:00.000Z' }, TZ), 'Tue, Oct 13 at 2:00 PM');
  const days = groupSlotsByDay(
    [
      { startsAt: '2026-10-13T13:00:00.000Z', endsAt: '2026-10-13T14:00:00.000Z' },
      { startsAt: '2026-10-13T14:15:00.000Z', endsAt: '2026-10-13T15:15:00.000Z' },
      { startsAt: '2026-10-14T13:00:00.000Z', endsAt: '2026-10-14T14:00:00.000Z' },
    ],
    TZ
  );
  assert.deepEqual(days.map((d) => [d.date, d.label, d.slots.map((s) => s.time)]), [
    ['2026-10-13', 'Tue, Oct 13', ['8:00 AM', '9:15 AM']],
    ['2026-10-14', 'Wed, Oct 14', ['8:00 AM']],
  ]);
  assert.equal(localDayStart('2026-10-13', TZ), '2026-10-13T05:00:00.000Z');
  assert.equal(localDayStart('2026-02-31', TZ), null);
  assert.equal(localDayStart('tomorrow', TZ), null);
  assert.equal(isValidTimeZone(TZ), true);
  assert.equal(isValidTimeZone('Mars/Olympus_Mons'), false);
});

test('confirmationText fits two SMS segments and drops the note before anything else', () => {
  assert.equal(
    confirmationText({ business: 'A-1 Auto Detailing', when: 'Tue, Oct 13 at 2:00 PM', service: 'Full detail', cancelUrl: 'https://axeonstudio.co/b/ax_abc/cancel/tok', note: 'Park on the side.' }),
    "You're booked with A-1 Auto Detailing: Full detail on Tue, Oct 13 at 2:00 PM. Park on the side. Need to cancel? https://axeonstudio.co/b/ax_abc/cancel/tok Reply STOP to opt out."
  );
  assert.equal(
    confirmationText({ business: null, when: 'Tue, Oct 13 at 2:00 PM', service: '', cancelUrl: 'https://x.co/c', note: null }),
    "You're booked with us: Tue, Oct 13 at 2:00 PM. Need to cancel? https://x.co/c Reply STOP to opt out."
  );
  const long = confirmationText({ business: 'z'.repeat(60), when: 'Tue, Oct 13 at 2:00 PM', service: 'y'.repeat(60), cancelUrl: 'https://axeonstudio.co/b/ax_abc/cancel/tok', note: 'x'.repeat(120) });
  assert.ok(long.length <= 320);
  assert.ok(!long.includes('xxxx'));
  assert.ok(long.endsWith('Reply STOP to opt out.'));
  assert.equal(ownerCancelText({ business: 'A-1', when: 'Tue, Oct 13 at 2:00 PM', service: '' }), 'A-1 had to cancel your appointment on Tue, Oct 13 at 2:00 PM. Sorry about that. Reply here or call to pick a new time.');
});

test('icsFor writes a valid, escaped, folded calendar file', () => {
  const ics = icsFor({
    uid: 'booking-7@axeonstudio.co',
    startsAt: '2026-10-13T19:00:00.000Z',
    endsAt: '2026-10-13T20:00:00.000Z',
    summary: 'Detail, interior; SUV',
    description: `Need to cancel? https://axeonstudio.co/b/ax_abcdefghjkmnpq/cancel/${'t'.repeat(24)} and that is all.`,
    now: Date.parse('2026-10-01T12:00:00Z'),
  });
  const lines = ics.split('\r\n');
  assert.equal(lines[0], 'BEGIN:VCALENDAR');
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(lines.includes('DTSTART:20261013T190000Z'));
  assert.ok(lines.includes('DTEND:20261013T200000Z'));
  assert.ok(lines.includes('DTSTAMP:20261001T120000Z'));
  assert.ok(lines.includes('SUMMARY:Detail\\, interior\\; SUV'));
  assert.ok(lines.every((l) => l.length <= 75));
  assert.ok(ics.replace(/\r\n /g, '').includes('and that is all.'));
  assert.ok(lines.includes('METHOD:PUBLISH'));
  assert.ok(lines.includes('STATUS:CONFIRMED'));
  assert.ok(!lines.some((l) => l.startsWith('SEQUENCE:')));
});

test('icsFor with cancel is the same event (same UID) as a cancellation calendars remove', () => {
  const base = { uid: 'booking-7@axeonstudio.co', startsAt: '2026-10-13T19:00:00.000Z', endsAt: '2026-10-13T20:00:00.000Z', summary: 'Detail', description: 'x', now: Date.parse('2026-10-01T12:00:00Z') };
  const confirm = icsFor(base).split('\r\n');
  const cancel = icsFor({ ...base, cancel: true }).split('\r\n');
  assert.ok(cancel.includes('METHOD:CANCEL'));
  assert.ok(!cancel.includes('METHOD:PUBLISH'));
  assert.ok(cancel.includes('STATUS:CANCELLED'));
  assert.ok(!cancel.includes('STATUS:CONFIRMED'));
  assert.ok(cancel.includes('SEQUENCE:1'), 'one past the confirmation (implicit SEQUENCE 0)');
  assert.equal(cancel.find((l) => l.startsWith('UID:')), confirm.find((l) => l.startsWith('UID:')));
  assert.ok(cancel.includes('DTSTART:20261013T190000Z'));
});

test('owner cancel: an email goes only when the text did not and there is an address; else the owner is told to call', () => {
  assert.equal(ownerCancelFallback({ texted: true, hasEmail: true }), 'none');
  assert.equal(ownerCancelFallback({ texted: false, hasEmail: true }), 'email');
  assert.equal(ownerCancelFallback({ texted: false, hasEmail: false }), 'none');
  assert.equal(
    customerNotToldText({ name: 'Mike Robinson', phone: '(515) 555-0134', when: 'Tue, Oct 13 at 2:00 PM', service: '' }),
    'Mike Robinson was NOT told that their appointment on Tue, Oct 13 at 2:00 PM is cancelled (no text or email could go). Please call them at (515) 555-0134.'
  );
});

test('the cancellation email escapes every customer and business value', () => {
  const r = renderBookingCancelEmail({ businessName: 'A&B <script>x</script>', when: 'Tue, Oct 13 at 2:00 PM', service: '<img src=x onerror=alert(1)>\r\nBcc: a@b.c' });
  assert.ok(!r.html.includes('<script>'));
  assert.ok(!r.html.includes('<img'));
  assert.ok(r.html.includes('A&amp;B &lt;script&gt;'));
  assert.ok(!/[\r\n]/.test(r.subject), 'no header injection through the subject');
  assert.match(r.subject, /^Cancelled: /);
  assert.equal(renderBookingCancelEmail({ businessName: null, when: 'Tue', service: '' }).text.startsWith('We had to cancel your appointment on Tue.'), true);
});

test('parseBookingInput cleans what a visitor typed and refuses what cannot be booked', () => {
  const raw = { name: '  Mike   Robinson ', phone: '(515) 555-0134', email: ' Mike@Example.com ', service: 'Full detail', startsAt: '2026-10-13T19:00:00Z' };
  assert.deepEqual(parseBookingInput(raw, ['Full detail']), {
    name: 'Mike Robinson', phone: '+15155550134', email: 'mike@example.com', service: 'Full detail', startsAt: '2026-10-13T19:00:00.000Z',
  });
  const noPicker = parseBookingInput({ ...raw, email: '', service: 'whatever' }, []);
  assert.equal(noPicker.email, null);
  assert.equal(noPicker.service, '');
  assert.throws(() => parseBookingInput({ ...raw, phone: '+44 20 7946 0958' }, []), BookingError);
  assert.throws(() => parseBookingInput({ ...raw, phone: '' }, []), /US phone/);
  assert.throws(() => parseBookingInput({ ...raw, service: 'Oil change' }, ['Full detail']), /pick a service/);
  assert.throws(() => parseBookingInput({ ...raw, name: 'M' }, []), /your name/);
  assert.throws(() => parseBookingInput({ ...raw, email: 'nope' }, []), /email/);
  assert.throws(() => parseBookingInput({ ...raw, startsAt: 'soon' }, []), /pick a time/);
});

test('the dashboard row shows a short name and a masked number', () => {
  assert.equal(shortName('  Mike   Robinson '), 'Mike R.');
  assert.equal(shortName('Cher'), 'Cher');
  assert.equal(shortName('   '), 'Someone');
  const b: Booking = {
    id: 3, onboardingId: 1, contactName: 'Mike Robinson', phone: '+15155550134', email: null, service: 'Full detail',
    startsAt: '2026-10-13T19:00:00.000Z', endsAt: '2026-10-13T20:00:00.000Z', status: 'booked', source: 'chat', cancelToken: 't', createdAt: '2026-10-01T00:00:00.000Z',
  };
  assert.deepEqual(toDashboardBooking(b), { id: 3, startsAt: '2026-10-13T19:00:00.000Z', service: 'Full detail', who: 'Mike R.', phone: '(515) 555-01··', status: 'booked', source: 'chat' });
});
