// lib/phoneWebhook.test.ts
// Run with: npm run test:phone
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTwilioRequest } from './phoneWebhook';
import { twilioSignature } from './twilio';

const TOKEN = 'test-token';
const PATH = '/api/phone/voice';

function post(body: Record<string, string>, signature: string | null) {
  const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' };
  if (signature) headers['x-twilio-signature'] = signature;
  return new Request(`https://axeonstudio.co${PATH}`, { method: 'POST', headers, body: new URLSearchParams(body).toString() });
}

async function statusOf(p: ReturnType<typeof readTwilioRequest>) {
  const r = await p;
  assert.equal(r.ok, false);
  return r.ok ? 0 : r.response.status;
}

test('readTwilioRequest accepts a correctly signed form post and returns its params', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  const params = { CallSid: 'CA1', From: '+15155550134', To: '+15155550199' };
  const res = await readTwilioRequest(post(params, twilioSignature(`https://axeonstudio.co${PATH}`, params, TOKEN)), PATH);
  assert.deepEqual(res, { ok: true, params });
});

test('readTwilioRequest refuses a missing or wrong signature with 403 and an oversized body with 413', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  assert.equal(await statusOf(readTwilioRequest(post({ CallSid: 'CA1' }, null), PATH)), 403);
  assert.equal(await statusOf(readTwilioRequest(post({ CallSid: 'CA1' }, 'bad'), PATH)), 403);
  const big = { Body: 'x'.repeat(70000) };
  assert.equal(await statusOf(readTwilioRequest(post(big, twilioSignature(`https://axeonstudio.co${PATH}`, big, TOKEN)), PATH)), 413);
});

test('readTwilioRequest with withQuery checks the signature over the URL including its query', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  const path = '/api/phone/connect';
  const params = { CallSid: 'CA9', From: '+15155550199', To: '+15155550100' };
  const sig = twilioSignature(`https://axeonstudio.co${path}?lead=42`, params, TOKEN);
  const req = (query: string) =>
    new Request(`https://axeonstudio.co${path}${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig },
      body: new URLSearchParams(params).toString(),
    });
  assert.deepEqual(await readTwilioRequest(req('?lead=42'), path, { withQuery: true }), { ok: true, params });
  // The same signed body replayed against another lead id is refused.
  assert.equal(await statusOf(readTwilioRequest(req('?lead=43'), path, { withQuery: true })), 403);
  // Checked without its query, the URL is not the one Twilio signed.
  assert.equal(await statusOf(readTwilioRequest(req('?lead=42'), path)), 403);
});

test('readTwilioRequest with withQuery binds the screen URL to its line id', async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  const path = '/api/phone/voice/screen';
  const params = { CallSid: 'CA1', From: '+15155550134', To: '+15155550100' };
  const sig = twilioSignature(`https://axeonstudio.co${path}?line=1`, params, TOKEN);
  const req = (query: string) =>
    new Request(`https://axeonstudio.co${path}${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig },
      body: new URLSearchParams(params).toString(),
    });
  assert.deepEqual(await readTwilioRequest(req('?line=1'), path, { withQuery: true }), { ok: true, params });
  assert.equal(await statusOf(readTwilioRequest(req('?line=2'), path, { withQuery: true })), 403);
});
