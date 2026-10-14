// lib/inboxReply.test.ts
// Run with: npm run test:inbox. The pure parts of lib/inboxReply.ts: no database, no Twilio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HELD_LOOKUP_GIVE_UP_HOURS, HELD_RETRY_MINUTES, HELD_STALE_MINUTES, heldSendFailure, liveSendFailure, processHeldRow, type HeldRowDeps } from './inboxReply';
import type { PhoneLine } from './phoneShared';

test('held reply: a definite Twilio refusal (nothing left) is retried once, then fails', () => {
  const first = heldSendFailure(new Error('Twilio 429 (20429): Too Many Requests (/Messages.json)'), null);
  assert.equal(first.retry, true);
  assert.match(first.error, /^retry: Twilio 429/);
  const second = heldSendFailure(new Error('Twilio 429 (20429): Too Many Requests (/Messages.json)'), first.error);
  assert.equal(second.retry, false);
  assert.match(second.error, /^Twilio 429/);
});

test('held reply: an unclear failure (the text may have left) is never put back to held', () => {
  for (const msg of ['fetch failed: ECONNRESET', 'Twilio 500: request failed (/Messages.json)', 'Twilio /Messages.json: bad JSON (201)']) {
    const out = heldSendFailure(new Error(msg), null);
    assert.equal(out.retry, false, msg);
    assert.match(out.error, /^unclear: /);
  }
});

test('held reply: stored errors never carry a phone number and stay short', () => {
  const out = heldSendFailure(new Error(`Twilio 400 (21211): Invalid To number +15155550134 ${'x'.repeat(400)}`), 'retry: earlier');
  assert.equal(out.error.includes('5155550134'), false);
  assert.ok(out.error.includes('[number]'));
  assert.ok(out.error.length <= 200);
});

test('held reply: a claim older than 10 minutes is stale', () => {
  assert.equal(HELD_STALE_MINUTES, 10);
});

// processHeldRow (ruling S4-R6): fakes for the lookups and the send, no database.
const LINE = { onboardingId: 7, status: 'active', smsStatus: 'ready', timeZone: 'America/Chicago' } as PhoneLine;
const ROW = { onboarding_id: 7, contact_id: '42', body: 'On my way at 9', error: null, to_phone: null, created_at: '2026-10-14T12:00:00Z' };
function deps(now: string, over: Partial<HeldRowDeps> = {}): HeldRowDeps & { sends: string[] } {
  const sends: string[] = [];
  return {
    sends,
    getContact: async () => ({ phone: '+15155550134' }),
    getLine: async () => LINE,
    sendClientSms: async (_line, to) => {
      sends.push(to);
      return { sent: true, sid: 'SM1' };
    },
    now: () => new Date(now),
    ...over,
  };
}

test('held reply: outside quiet hours the row is sent', async () => {
  const d = deps('2026-10-14T18:00:00Z'); // 1 pm in Chicago
  assert.deepEqual(await processHeldRow(ROW, d), { status: 'sent' });
  assert.deepEqual(d.sends, ['+15155550134']);
});

test('held reply: quiet hours again at send time re-holds the row to the next 8 am, sending nothing', async () => {
  const d = deps('2026-10-14T03:00:00Z'); // 10 pm in Chicago
  const out = await processHeldRow(ROW, d);
  assert.deepEqual(out, { status: 'requeue', sendAt: '2026-10-14T13:00:00.000Z', why: 'quiet' }); // 8 am CDT
  assert.deepEqual(d.sends, []);
});

test('held reply: quiet hours follow the line zone, not the server clock', async () => {
  // 7:30 am Los Angeles is still quiet even though it is 9:30 am in Chicago.
  const d = deps('2026-10-14T14:30:00Z', { getLine: async () => ({ ...LINE, timeZone: 'America/Los_Angeles' }) });
  const out = await processHeldRow(ROW, d);
  assert.equal(out.status, 'requeue');
  assert.equal(out.status === 'requeue' && out.sendAt, '2026-10-14T15:00:00.000Z');
});

test('held reply: a contact or line lookup that throws puts the row back to held, never failed, and sends nothing', async () => {
  for (const over of [
    { getContact: async () => { throw new Error('db down'); } },
    { getLine: async () => { throw new Error('db down'); } },
  ] as Partial<HeldRowDeps>[]) {
    const d = deps('2026-10-14T18:00:00Z', over);
    const out = await processHeldRow(ROW, d);
    assert.deepEqual(out, { status: 'requeue', sendAt: new Date(Date.parse('2026-10-14T18:00:00Z') + HELD_RETRY_MINUTES * 60_000).toISOString(), why: 'lookup' });
    assert.deepEqual(d.sends, []);
  }
});

test('held reply: a throw from the send itself still goes through heldSendFailure', async () => {
  const d = deps('2026-10-14T18:00:00Z', { sendClientSms: async () => { throw new Error('fetch failed: ECONNRESET'); } });
  const out = await processHeldRow(ROW, d);
  assert.equal(out.status, 'failed');
  assert.match(out.status === 'failed' ? out.error : '', /^unclear: /);
});

test('held reply: no phone or no active line fails without a send', async () => {
  const noPhone = deps('2026-10-14T18:00:00Z', { getContact: async () => ({ phone: null }) });
  assert.deepEqual(await processHeldRow(ROW, noPhone), { status: 'failed', error: 'no_phone' });
  const noLine = deps('2026-10-14T18:00:00Z', { getLine: async () => null });
  assert.deepEqual(await processHeldRow(ROW, noLine), { status: 'failed', error: 'no_line' });
});

test('live reply: a definite Twilio refusal is "did not go out, try again"', () => {
  for (const msg of ['Twilio 429 (20429): Too Many Requests (/Messages.json)', 'Twilio 400 (21211): Invalid To number', 'Twilio is not configured']) {
    assert.deepEqual(liveSendFailure(new Error(msg)), { status: 'refused', reason: 'send_failed' }, msg);
  }
});

test('live reply: any other throw is unclear (the text may have gone out)', () => {
  for (const err of [new Error('fetch failed: ECONNRESET'), new Error('Twilio 500: request failed (/Messages.json)'), new Error('Twilio /Messages.json: bad JSON (201)'), 'boom', null]) {
    assert.deepEqual(liveSendFailure(err), { status: 'unclear' }, String(err));
  }
});

test('held reply: goes to the number shown when it was typed', async () => {
  const d = deps('2026-10-14T18:00:00Z');
  assert.deepEqual(await processHeldRow({ ...ROW, to_phone: '+15155550134' }, d), { status: 'sent' });
  assert.deepEqual(d.sends, ['+15155550134']);
});

test('held reply: the contact no longer has the typed number, so it fails number_changed and sends nothing', async () => {
  for (const phone of ['+15155550199', null]) {
    const d = deps('2026-10-14T18:00:00Z', { getContact: async () => ({ phone }) });
    assert.deepEqual(await processHeldRow({ ...ROW, to_phone: '+15155550134' }, d), { status: 'failed', error: 'number_changed' });
    assert.deepEqual(d.sends, []);
  }
});

test('held reply: a row with no to_phone (held before the column) keeps going to the current phone', async () => {
  const d = deps('2026-10-14T18:00:00Z', { getContact: async () => ({ phone: '+15155550199' }) });
  assert.deepEqual(await processHeldRow({ ...ROW, to_phone: null }, d), { status: 'sent' });
  assert.deepEqual(d.sends, ['+15155550199']);
});

test('held reply: lookups still failing 12 hours after it was typed fail the row with lookup', async () => {
  assert.equal(HELD_LOOKUP_GIVE_UP_HOURS, 12);
  const over = { getLine: async () => { throw new Error('db down'); } } as Partial<HeldRowDeps>;
  const typed = '2026-10-14T03:00:00Z';
  const justUnder = deps(new Date(Date.parse(typed) + 12 * 3_600_000 - 60_000).toISOString(), over);
  assert.equal((await processHeldRow({ ...ROW, created_at: typed }, justUnder)).status, 'requeue');
  const past = deps(new Date(Date.parse(typed) + 12 * 3_600_000 + 60_000).toISOString(), over);
  assert.deepEqual(await processHeldRow({ ...ROW, created_at: new Date(typed) }, past), { status: 'failed', error: 'lookup' });
  assert.deepEqual(past.sends, []);
});
