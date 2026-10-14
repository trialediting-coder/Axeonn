// lib/inboxReply.test.ts
// Run with: npm run test:inbox. The pure parts of lib/inboxReply.ts: no database, no Twilio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HELD_STALE_MINUTES, heldSendFailure } from './inboxReply';

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
