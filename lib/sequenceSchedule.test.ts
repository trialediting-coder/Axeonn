// lib/sequenceSchedule.test.ts
// Run with: npm run test:sequences   (pure: no database, no clock, no network)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQuietHours } from './leadShared';
import { DEFAULT_TEMPLATES, STOP_LINE, validateTemplate, type SequenceTemplate } from './sequenceShared';
import {
  connectCallDecision, decideRun, holdForQuietHours, isDefiniteRejection, localParts, mayBeInReactivationWindow, nextSendAt, planSend,
  reactivationWindow, redactDigits, safeTimeZone, scheduleReactivation, zonedTime, type RunContext, type RunState,
} from './sequenceSchedule';

const CHI = 'America/Chicago';
const at = (iso: string) => new Date(iso);
const isoOf = (d: Date | undefined | null) => (d ? d.toISOString() : null);

test('safeTimeZone keeps a real zone and falls back to Central', () => {
  assert.equal(safeTimeZone('America/Denver'), 'America/Denver');
  assert.equal(safeTimeZone('Mars/Base'), CHI);
  assert.equal(safeTimeZone(null), CHI);
  assert.equal(safeTimeZone(''), CHI);
});

test('localParts and zonedTime agree across both DST changes', () => {
  assert.deepEqual(localParts(at('2026-10-13T03:00:00Z'), CHI), { year: 2026, month: 10, day: 12, hour: 22, minute: 0, second: 0 });
  assert.equal(zonedTime(2026, 10, 13, 8, 0, CHI).toISOString(), '2026-10-13T13:00:00.000Z');
  assert.equal(zonedTime(2026, 11, 1, 8, 0, CHI).toISOString(), '2026-11-01T14:00:00.000Z'); // CST after fall-back
  assert.equal(zonedTime(2026, 3, 8, 8, 0, CHI).toISOString(), '2026-03-08T13:00:00.000Z'); // CDT after spring-forward
  assert.equal(zonedTime(2026, 10, 32, 8, 0, CHI).toISOString(), '2026-11-01T14:00:00.000Z'); // day rolls over
  assert.equal(zonedTime(2027, 1, 1, 10, 245, CHI).toISOString(), '2027-01-01T20:05:00.000Z'); // minutes roll over
});

test('quiet hours hold a send to 8 am client-local', () => {
  assert.equal(isQuietHours(at('2026-10-13T03:00:00Z'), CHI), true); // 10 pm
  assert.equal(isQuietHours(at('2026-10-13T18:00:00Z'), CHI), false); // 1 pm
  assert.equal(isoOf(holdForQuietHours(at('2026-10-13T03:00:00Z'), CHI)), '2026-10-13T13:00:00.000Z'); // 10 pm → 8 am next day
  assert.equal(isoOf(holdForQuietHours(at('2026-10-13T12:59:00Z'), CHI)), '2026-10-13T13:00:00.000Z'); // 7:59 am → 8 am
  assert.equal(isoOf(holdForQuietHours(at('2026-10-13T13:00:00Z'), CHI)), '2026-10-13T13:00:00.000Z'); // 8:00 am stays
  assert.equal(isoOf(holdForQuietHours(at('2026-10-14T00:59:00Z'), CHI)), '2026-10-14T00:59:00.000Z'); // 7:59 pm stays
  assert.equal(isoOf(holdForQuietHours(at('2026-10-14T01:00:00Z'), CHI)), '2026-10-14T13:00:00.000Z'); // 8:00 pm → 8 am
  assert.equal(isoOf(holdForQuietHours(at('2026-11-01T06:00:00Z'), CHI)), '2026-11-01T14:00:00.000Z'); // 1 am CDT → 8 am CST
  assert.equal(isoOf(holdForQuietHours(at('2026-10-13T02:30:00Z'), 'America/Denver')), '2026-10-13T14:00:00.000Z'); // 8:30 pm MDT
});

test('nextSendAt adds the wait, then applies quiet hours', () => {
  assert.equal(isoOf(nextSendAt(at('2026-10-13T15:00:00Z'), 5, CHI)), '2026-10-13T15:05:00.000Z');
  assert.equal(isoOf(nextSendAt(at('2026-10-13T02:40:00Z'), 5, CHI)), '2026-10-13T13:00:00.000Z'); // 9:45 pm → 8 am
  assert.equal(isoOf(nextSendAt(at('2026-10-13T02:40:00Z'), 5, 'Not/AZone')), '2026-10-13T13:00:00.000Z');
});

test('planSend picks the first step the contact can receive', () => {
  const base = { kind: 'new_lead' as const, steps: DEFAULT_TEMPLATES.new_lead, anchorAt: at('2026-10-13T15:00:00Z'), now: at('2026-10-13T15:00:00Z'), timeZone: CHI };
  assert.deepEqual(planSend({ ...base, fromStep: 0, canSms: true, canEmail: true }), { step: 0, at: at('2026-10-13T15:05:00Z') });
  assert.deepEqual(planSend({ ...base, fromStep: 0, canSms: false, canEmail: true }), { step: 1, at: at('2026-10-14T15:00:00Z') });
  assert.deepEqual(planSend({ ...base, fromStep: 1, canSms: true, canEmail: false }), { step: 2, at: at('2026-10-16T15:00:00Z') });
  assert.equal(planSend({ ...base, fromStep: 0, canSms: false, canEmail: false }), null);
  assert.equal(planSend({ ...base, fromStep: 3, canSms: true, canEmail: true }), null);
  // A missed call: anchored on the call, nothing before 30 minutes have passed.
  assert.deepEqual(planSend({ ...base, fromStep: 0, canSms: true, canEmail: false, notBefore: at('2026-10-13T15:30:00Z') }), { step: 0, at: at('2026-10-13T15:30:00Z') });
  // A step whose time already passed goes now, not in the past.
  assert.deepEqual(planSend({ ...base, fromStep: 0, canSms: true, canEmail: true, now: at('2026-10-13T18:00:00Z') }), { step: 0, at: at('2026-10-13T18:00:00Z') });
});

test('planSend skips reminders that are too late or would land on the appointment', () => {
  const r = { kind: 'reminder' as const, steps: DEFAULT_TEMPLATES.reminder, timeZone: CHI, canSms: true, canEmail: false, fromStep: 0 };
  // Booked two days out at 9 am: the day-before text goes at 9 am the day before.
  assert.deepEqual(planSend({ ...r, anchorAt: at('2026-10-15T14:00:00Z'), now: at('2026-10-13T15:00:00Z') }), { step: 0, at: at('2026-10-14T14:00:00Z') });
  // Booked at 7:30 am for 9 am: the day-before text is skipped; the 2-hour one is held from 7:30 to 8 am.
  assert.deepEqual(planSend({ ...r, anchorAt: at('2026-10-15T14:00:00Z'), now: at('2026-10-15T12:30:00Z') }), { step: 1, at: at('2026-10-15T13:00:00Z') });
  // An 8 am appointment: the 2-hour text would be held to 8 am, the appointment itself, so nothing is sent.
  assert.equal(planSend({ ...r, anchorAt: at('2026-10-15T13:00:00Z'), now: at('2026-10-14T20:00:00Z') }), null);
});

test('scheduleReactivation spreads a small list over the sending days of the week from 10 am', () => {
  const start = at('2027-01-01T06:15:00Z'); // 12:15 am Fri Jan 1, Central
  const times = scheduleReactivation(120, start, CHI);
  assert.equal(times.length, 120);
  // Jan 1 and Sun Jan 3 are off: 5 sending days in the week, 24 a day.
  assert.equal(isoOf(times[0]), '2027-01-02T16:00:00.000Z'); // 10:00 am CST Sat Jan 2
  assert.equal(isoOf(times[23]), '2027-01-02T17:55:00.000Z'); // 24 a day, 5 minutes apart
  assert.equal(isoOf(times[24]), '2027-01-04T16:00:00.000Z'); // Sunday skipped
  assert.ok(times.every((t) => !isQuietHours(t, CHI)));
  assert.ok(times[119].getTime() < at('2027-01-08T06:00:00Z').getTime()); // inside the first week
  assert.deepEqual(scheduleReactivation(0, start, CHI), []);
});

test('scheduleReactivation never sends more than 50 a day, even past the first week', () => {
  const times = scheduleReactivation(600, at('2027-01-01T06:15:00Z'), CHI);
  const perDay = new Map<string, number>();
  for (const t of times) {
    const p = localParts(t, CHI);
    const key = `${p.year}-${p.month}-${p.day}`;
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  assert.equal(times.length, 600);
  assert.ok([...perDay.values()].every((n) => n <= 50));
  assert.equal(perDay.get('2027-1-1'), undefined); // New Year's Day
  assert.equal(perDay.get('2027-1-2'), 50);
  assert.equal(perDay.get('2027-1-3'), undefined); // Sunday
  assert.equal(perDay.size, 12);
});

test('scheduleReactivation shifts the first send day off a Sunday and skips the Fourth of July', () => {
  // Sun Oct 1 2028: the first texts go Monday.
  assert.equal(isoOf(scheduleReactivation(3, at('2028-10-01T05:30:00Z'), CHI)[0]), '2028-10-02T15:00:00.000Z');
  // Sun Jul 1 2029: sending days are Jul 2, 3, 5, 6, 7 (Wed Jul 4 off), 2 a day for 6 customers.
  const july = scheduleReactivation(6, at('2029-07-01T05:30:00Z'), CHI).map(isoOf);
  assert.deepEqual(july, [
    '2029-07-02T15:00:00.000Z', '2029-07-02T15:05:00.000Z',
    '2029-07-03T15:00:00.000Z', '2029-07-03T15:05:00.000Z',
    '2029-07-05T15:00:00.000Z', '2029-07-05T15:05:00.000Z',
  ]);
});

test('scheduleReactivation starts tomorrow when 10 am has passed', () => {
  const times = scheduleReactivation(3, at('2027-01-01T18:00:00Z'), CHI); // noon
  assert.equal(isoOf(times[0]), '2027-01-02T16:00:00.000Z');
});

test('reactivationWindow is the first local week of each quarter', () => {
  assert.equal(reactivationWindow(at('2027-01-01T06:15:00Z'), CHI), '2027-01');
  assert.equal(reactivationWindow(at('2027-01-07T20:00:00Z'), CHI), '2027-01');
  assert.equal(reactivationWindow(at('2027-01-08T15:00:00Z'), CHI), null);
  assert.equal(reactivationWindow(at('2027-02-01T15:00:00Z'), CHI), null);
  assert.equal(reactivationWindow(at('2026-10-01T04:30:00Z'), CHI), null); // still Sep 30 in Central
  assert.equal(reactivationWindow(at('2026-10-01T05:30:00Z'), CHI), '2026-10');
});

const enabled = (kind: SequenceTemplate['kind']): SequenceTemplate => validateTemplate({ kind, steps: DEFAULT_TEMPLATES[kind], enabled: true });
const run = (over: Partial<RunState> = {}): RunState => ({
  kind: 'new_lead',
  step: 0,
  anchorAt: at('2026-10-13T15:00:00Z'),
  contactPhone: '+15155550134',
  contactEmail: 'mike@example.com',
  contactName: 'mike smith',
  priorSmsSent: false,
  ...over,
});
const ctx = (over: Partial<RunContext> = {}): RunContext => ({
  template: enabled('new_lead'),
  tierAllowed: true,
  optedOut: false,
  replied: false,
  smsReady: true,
  emailReady: true,
  timeZone: CHI,
  vars: { business: 'Hintz Roofing', owner_first: 'Dana', review_link: null, booking_link: null },
  now: at('2026-10-13T15:06:00Z'),
  ...over,
});

test('decideRun sends the due step, rendered, and plans the next one', () => {
  const d = decideRun(run(), ctx());
  assert.equal(d.type, 'send');
  if (d.type !== 'send') return;
  assert.equal(d.step, 0);
  assert.equal(d.channel, 'sms');
  assert.equal(d.to, '+15155550134');
  assert.equal(d.subject, null);
  assert.ok(d.body.startsWith("Hi Mike, it's Dana with Hintz Roofing."));
  assert.ok(d.body.endsWith(STOP_LINE));
  assert.deepEqual(d.next, { step: 1, at: at('2026-10-14T15:00:00Z') });
});

test('decideRun sends the email step to the email address with a rendered subject', () => {
  const d = decideRun(run({ step: 1 }), ctx({ now: at('2026-10-14T15:01:00Z') }));
  assert.equal(d.type, 'send');
  if (d.type !== 'send') return;
  assert.equal(d.to, 'mike@example.com');
  assert.equal(d.subject, 'Following up from Hintz Roofing');
  assert.deepEqual(d.next, { step: 2, at: at('2026-10-16T15:00:00Z') });
});

test('decideRun ends the run after the last step', () => {
  const d = decideRun(run({ step: 2 }), ctx({ now: at('2026-10-16T15:01:00Z') }));
  assert.equal(d.type === 'send' && d.next, null);
});

test('decideRun holds a step that comes due at night', () => {
  const d = decideRun(run({ anchorAt: at('2026-10-13T02:55:00Z') }), ctx({ now: at('2026-10-13T03:01:00Z') }));
  assert.deepEqual(d, { type: 'hold', step: 0, until: at('2026-10-13T13:00:00Z') });
});

test('decideRun stops for STOP before any step, even an email', () => {
  assert.deepEqual(decideRun(run({ step: 1 }), ctx({ optedOut: true, now: at('2026-10-14T15:01:00Z') })), { type: 'stop', reason: 'opted_out' });
});

test('decideRun stops new-lead and quote follow-ups once the person replied, but not a review request', () => {
  assert.deepEqual(decideRun(run(), ctx({ replied: true })), { type: 'stop', reason: 'replied' });
  assert.deepEqual(decideRun(run({ kind: 'quote', anchorAt: at('2026-10-12T15:00:00Z') }), ctx({ template: enabled('quote'), replied: true })), { type: 'stop', reason: 'replied' });
  const review = decideRun(
    run({ kind: 'review', anchorAt: at('2026-10-13T13:00:00Z') }),
    ctx({ template: enabled('review'), replied: true, vars: { business: 'Hintz Roofing', review_link: 'https://g.page/r/abc/review' } })
  );
  assert.equal(review.type, 'send');
  if (review.type === 'send') assert.ok(review.body.includes('https://g.page/r/abc/review'));
});

test('decideRun stops when the template is off, the plan lacks sequences, or the review link is gone', () => {
  assert.deepEqual(decideRun(run(), ctx({ template: { ...enabled('new_lead'), enabled: false } })), { type: 'stop', reason: 'template_off' });
  assert.deepEqual(decideRun(run(), ctx({ template: null })), { type: 'stop', reason: 'template_off' });
  assert.deepEqual(decideRun(run(), ctx({ tierAllowed: false })), { type: 'stop', reason: 'plan' });
  assert.deepEqual(
    decideRun(run({ kind: 'review', anchorAt: at('2026-10-13T13:00:00Z') }), ctx({ template: enabled('review') })),
    { type: 'stop', reason: 'missing_link' }
  );
});

test('decideRun finishes quietly when nothing left can reach the contact', () => {
  assert.deepEqual(decideRun(run({ contactEmail: null }), ctx({ smsReady: false })), { type: 'done' });
});

test('decideRun puts STOP on the first text delivered, once', () => {
  const t: SequenceTemplate = { kind: 'new_lead', enabled: true, steps: DEFAULT_TEMPLATES.new_lead };
  const late = { template: t, now: at('2026-10-16T15:01:00Z') };
  // Run starting at step 2 (a text with no STOP line), no text sent yet by this run: STOP appended.
  const first = decideRun(run({ step: 2 }), ctx(late));
  assert.equal(first.type, 'send');
  if (first.type === 'send') assert.ok(first.body.endsWith(STOP_LINE));
  // Step 0 was already sent: the later text is left as authored.
  const later = decideRun(run({ step: 2, priorSmsSent: true }), ctx(late));
  assert.equal(later.type, 'send');
  if (later.type === 'send') assert.ok(!later.body.includes('STOP'));
  // Body already ending with STOP is not doubled.
  const done = decideRun(run(), ctx());
  assert.equal(done.type, 'send');
  if (done.type === 'send') assert.equal(done.body.split(STOP_LINE).length, 2);
  // Emails never get it.
  const mail = decideRun(run({ step: 1 }), ctx({ now: at('2026-10-14T15:01:00Z') }));
  if (mail.type === 'send') assert.ok(!mail.body.includes('STOP'));
});

test('decideRun never exceeds the text cap when adding STOP', () => {
  const long = 'x'.repeat(300) + ' end';
  const t: SequenceTemplate = { kind: 'new_lead', enabled: true, steps: [{ offsetMinutes: 5, channel: 'sms', subject: null, body: long }] };
  const d = decideRun(run(), ctx({ template: t }));
  assert.equal(d.type, 'send');
  if (d.type === 'send') {
    assert.ok(d.body.length <= 320);
    assert.ok(d.body.endsWith(STOP_LINE));
  }
});

test('mayBeInReactivationWindow covers every time zone and nothing more', () => {
  assert.equal(mayBeInReactivationWindow(new Date('2026-10-03T12:00:00Z')), true);
  assert.equal(mayBeInReactivationWindow(new Date('2026-10-07T20:00:00Z')), true);
  assert.equal(mayBeInReactivationWindow(new Date('2026-10-08T05:00:00Z')), true); // still the 7th at UTC-12
  assert.equal(mayBeInReactivationWindow(new Date('2026-10-08T12:00:00Z')), false);
  assert.equal(mayBeInReactivationWindow(new Date('2026-09-30T12:00:00Z')), true); // Oct 1 at UTC+14
  assert.equal(mayBeInReactivationWindow(new Date('2026-09-15T12:00:00Z')), false);
  assert.equal(mayBeInReactivationWindow(new Date('2026-11-02T12:00:00Z')), false);
});

test('a step more than 12 hours late is skipped, not sent; a 2-hour-late one still goes', () => {
  // Step 0 was due at 10:05 am; it is now 11:06 pm, 13 hours on: skip to the email step, held to its time.
  assert.deepEqual(decideRun(run(), ctx({ now: at('2026-10-14T04:06:00Z') })), { type: 'hold', step: 1, until: at('2026-10-14T15:00:00Z') });
  const base = { kind: 'new_lead' as const, steps: DEFAULT_TEMPLATES.new_lead, anchorAt: at('2026-10-13T15:00:00Z'), timeZone: CHI, canSms: true, canEmail: true, fromStep: 0 };
  assert.deepEqual(planSend({ ...base, now: at('2026-10-14T04:06:00Z') }), { step: 1, at: at('2026-10-14T15:00:00Z') });
  // Two hours late: sent now.
  const d = decideRun(run(), ctx({ now: at('2026-10-13T17:05:00Z') }));
  assert.equal(d.type, 'send');
  if (d.type === 'send') assert.equal(d.step, 0);
});

test('lateness counts from the end of quiet hours, and the last step is never skipped', () => {
  // Due 8:03 pm, held to 8 am, picked up at 8:10 am: ten minutes late, sent.
  const night = decideRun(run({ anchorAt: at('2026-10-14T00:58:00Z') }), ctx({ now: at('2026-10-14T13:10:00Z') }));
  assert.equal(night.type, 'send');
  if (night.type === 'send') assert.equal(night.step, 0);
  // The last step two days late still goes.
  const last = decideRun(run({ step: 2 }), ctx({ now: at('2026-10-18T15:00:00Z') }));
  assert.equal(last.type, 'send');
  if (last.type === 'send') assert.equal(last.step, 2);
});

test('no send within 2 hours of the run\'s previous send; reminders are exempt', () => {
  // The email step is due 30 minutes after the last send: held to last send + 2 hours.
  assert.deepEqual(
    decideRun(run({ step: 1, lastSentAt: at('2026-10-14T14:30:00Z') }), ctx({ now: at('2026-10-14T15:00:00Z') })),
    { type: 'hold', step: 1, until: at('2026-10-14T16:30:00Z') }
  );
  // A send's next step is planned at least 2 hours out.
  const t: SequenceTemplate = { kind: 'new_lead', enabled: true, steps: [{ offsetMinutes: 5, channel: 'sms', subject: null, body: 'a' }, { offsetMinutes: 30, channel: 'sms', subject: null, body: 'b' }] };
  const d = decideRun(run(), ctx({ template: t }));
  assert.equal(d.type, 'send');
  if (d.type === 'send') assert.deepEqual(d.next, { step: 1, at: at('2026-10-13T17:06:00Z') });
  // A reminder 30 minutes after the last send goes on time.
  const r = { kind: 'reminder' as const, steps: DEFAULT_TEMPLATES.reminder, timeZone: CHI, canSms: true, canEmail: false, fromStep: 1 };
  assert.deepEqual(
    planSend({ ...r, anchorAt: at('2026-10-15T19:00:00Z'), now: at('2026-10-15T17:00:00Z'), lastSentAt: at('2026-10-15T16:30:00Z') }),
    { step: 1, at: at('2026-10-15T17:00:00Z') }
  );
});

test('connectCallDecision: answered stops, a live connect call holds for up to an hour, nothing else matters', () => {
  const now = at('2026-10-13T15:00:00Z');
  assert.equal(connectCallDecision({ outcome: 'answered', dialStatus: 'completed', startedAt: at('2026-10-13T14:00:00Z'), now }), 'stop');
  assert.equal(connectCallDecision({ outcome: 'missed', dialStatus: 'queued', startedAt: at('2026-10-13T14:50:00Z'), now }), 'hold');
  assert.equal(connectCallDecision({ outcome: 'missed', dialStatus: 'in-progress', startedAt: at('2026-10-13T14:50:00Z'), now }), 'hold');
  assert.equal(connectCallDecision({ outcome: 'missed', dialStatus: 'queued', startedAt: at('2026-10-13T13:00:00Z'), now }), 'none');
  assert.equal(connectCallDecision({ outcome: 'missed', dialStatus: 'no-answer', startedAt: at('2026-10-13T14:50:00Z'), now }), 'none');
  assert.equal(connectCallDecision({ outcome: 'missed', dialStatus: 'owner-completed', startedAt: at('2026-10-13T14:50:00Z'), now }), 'none');
  assert.equal(connectCallDecision({ outcome: null, dialStatus: null, startedAt: null, now }), 'none');
});

test('isDefiniteRejection: a Twilio 4xx or missing config is a refusal; anything else is unclear', () => {
  assert.equal(isDefiniteRejection(new Error('Twilio 400 (21211): Invalid To number (/2010-04-01/Accounts/…/Messages.json)')), true);
  assert.equal(isDefiniteRejection(new Error('Twilio 429 (20429): Too Many Requests (/Messages.json)')), true);
  assert.equal(isDefiniteRejection(new Error('Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)')), true);
  assert.equal(isDefiniteRejection(new Error('Twilio /2010-04-01/Accounts/…/Messages.json: bad JSON (201)')), false);
  assert.equal(isDefiniteRejection(new Error('Twilio 500: request failed (/Messages.json)')), false);
  assert.equal(isDefiniteRejection(new Error('fetch failed: ECONNRESET')), false);
  assert.equal(isDefiniteRejection('The operation was aborted due to timeout'), false);
});

test('redactDigits hides phone numbers but keeps short codes', () => {
  assert.equal(redactDigits('Twilio 400 (21211): The To number +15155550134 is invalid'), 'Twilio 400 (21211): The To number +[number] is invalid');
  assert.equal(redactDigits('no digits'), 'no digits');
});
