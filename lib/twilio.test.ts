// Run with: npm run test:phone. Only the pure parts: signature and form parsing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchRecording, formParams, redactPath, searchLocalNumbers, twilioSignature, verifyTwilioSignature, webhookUrl } from './twilio';

// The inputs from Twilio's "Validating requests" doc. EXPECTED was computed once with
// node:crypto from the documented algorithm (URL, then each POST param sorted by key
// as key+value with no delimiters, HMAC-SHA1 with the auth token, base64) and pinned
// here so a refactor cannot change the scheme silently. Task 9 proves the scheme
// against a real Twilio request; if that fails, the algorithm is wrong, not this number.
const URL = 'https://mycompany.com/myapp.php?foo=1&bar=2';
const PARAMS = { CallSid: 'CA1234567890ABCDE', Caller: '+12349013030', Digits: '1234', From: '+12349013030', To: '+18005551212' };
const TOKEN = '12345';
const EXPECTED = '0/KCTR6DLpKmkAf8muzZqo1nDgQ=';

test('twilioSignature follows the documented algorithm', () => {
  assert.equal(twilioSignature(URL, PARAMS, TOKEN), EXPECTED);
});

test('verifyTwilioSignature accepts the right signature and refuses a wrong, missing, or differently-ordered-URL one', () => {
  assert.equal(verifyTwilioSignature(URL, PARAMS, EXPECTED, TOKEN), true);
  assert.equal(verifyTwilioSignature(URL, PARAMS, 'nope', TOKEN), false);
  assert.equal(verifyTwilioSignature(URL, PARAMS, null, TOKEN), false);
  assert.equal(verifyTwilioSignature('https://mycompany.com/myapp.php?bar=2&foo=1', PARAMS, EXPECTED, TOKEN), false);
  assert.equal(verifyTwilioSignature(URL, { ...PARAMS, Digits: '9999' }, EXPECTED, TOKEN), false);
});

test('formParams decodes a urlencoded body: + is a space, %2B is a plus, repeated keys last-wins', () => {
  assert.deepEqual(formParams('From=%2B15155550134&Body=Hello+there'), { From: '+15155550134', Body: 'Hello there' });
  assert.deepEqual(formParams('Body=First&Body=Second'), { Body: 'Second' });
  assert.deepEqual(formParams(''), {});
});

test('webhookUrl uses PHONE_WEBHOOK_ORIGIN when set and the public site otherwise', () => {
  const before = process.env.PHONE_WEBHOOK_ORIGIN;
  delete process.env.PHONE_WEBHOOK_ORIGIN;
  assert.equal(webhookUrl('/api/phone/voice'), 'https://axeonstudio.co/api/phone/voice');
  process.env.PHONE_WEBHOOK_ORIGIN = 'https://preview.example.com/';
  assert.equal(webhookUrl('/api/phone/voice'), 'https://preview.example.com/api/phone/voice');
  if (before === undefined) delete process.env.PHONE_WEBHOOK_ORIGIN;
  else process.env.PHONE_WEBHOOK_ORIGIN = before;
});

test('redactPath masks the account SID segment', () => {
  assert.equal(redactPath('https://api.twilio.com/2010-04-01/Accounts/AC123secret/Messages.json?x=1'), '/2010-04-01/Accounts/…/Messages.json');
  assert.equal(redactPath('https://messaging.twilio.com/v1/Services'), '/v1/Services');
});

test('a 2xx with a non-JSON body throws bad JSON without leaking the account SID', async () => {
  const saved = { fetch: globalThis.fetch, sid: process.env.TWILIO_ACCOUNT_SID, tok: process.env.TWILIO_AUTH_TOKEN };
  process.env.TWILIO_ACCOUNT_SID = 'ACtestsid0123456789';
  process.env.TWILIO_AUTH_TOKEN = 'tok';
  globalThis.fetch = (async () => new Response('<html>not json</html>', { status: 200 })) as typeof fetch;
  try {
    await assert.rejects(searchLocalNumbers('515'), (e: Error) => /bad JSON \(200\)/.test(e.message) && !e.message.includes('ACtestsid0123456789'));
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.sid === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = saved.sid;
    if (saved.tok === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = saved.tok;
  }
});

test('fetchRecording refuses a non-Twilio origin before any request is made', async () => {
  const saved = { fetch: globalThis.fetch, sid: process.env.TWILIO_ACCOUNT_SID, tok: process.env.TWILIO_AUTH_TOKEN };
  process.env.TWILIO_ACCOUNT_SID = 'ACtestsid0123456789';
  process.env.TWILIO_AUTH_TOKEN = 'tok';
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response('x'); }) as typeof fetch;
  try {
    await assert.rejects(fetchRecording('https://evil.example.com/2010-04-01/Accounts/AC1/Recordings/RE1'), /non-Twilio origin/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.sid === undefined) delete process.env.TWILIO_ACCOUNT_SID; else process.env.TWILIO_ACCOUNT_SID = saved.sid;
    if (saved.tok === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = saved.tok;
  }
});
