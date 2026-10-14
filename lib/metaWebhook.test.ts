// lib/metaWebhook.test.ts
// Run with: npm run test:meta
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { answerVerification, readMetaWebhook, META_MAX_BODY } from './metaWebhook';

const SECRET = 'test-app-secret';
const URL_BASE = 'https://axeonstudio.co/api/meta/webhook';
const BODY = '{"object":"page","entry":[{"id":"111","time":1760000000000,"messaging":[{"sender":{"id":"222"},"recipient":{"id":"111"},"timestamp":1760000000000,"message":{"mid":"m_abc","text":"Do you do boats?"}}]}]}';
const BODY_SIG = 'sha256=ad0b775360013941702c09c300010f569708f9019d3e32c9ced3069be7e38239';

function configure() {
  process.env.META_APP_ID = '1234';
  process.env.META_APP_SECRET = SECRET;
  process.env.META_VERIFY_TOKEN = 'verify-me';
  process.env.SECRETS_KEY = Buffer.alloc(32, 7).toString('base64');
}

function post(body: string, signature: string | null) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (signature) headers['x-hub-signature-256'] = signature;
  return new Request(URL_BASE, { method: 'POST', headers, body });
}

test('every Meta route answers 503 with the plain message until all four variables are set', async () => {
  configure();
  delete process.env.SECRETS_KEY;
  const get = answerVerification(new Request(`${URL_BASE}?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42`));
  assert.equal(get.status, 503);
  assert.deepEqual(await get.json(), { error: 'Meta is not configured' });
  const r = await readMetaWebhook(post(BODY, BODY_SIG));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.response.status, 503);
});

test('GET echoes the challenge only for the right verify token', async () => {
  configure();
  const ok = answerVerification(new Request(`${URL_BASE}?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=1158201444`));
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '1158201444');
  assert.equal(answerVerification(new Request(`${URL_BASE}?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1`)).status, 403);
});

test('POST with a good signature returns the parsed messages', async () => {
  configure();
  const r = await readMetaWebhook(post(BODY, BODY_SIG));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.events.length, 1);
    assert.equal(r.events[0].mid, 'm_abc');
    assert.equal(r.events[0].text, 'Do you do boats?');
  }
});

test('POST with a missing or wrong signature is refused before parsing', async () => {
  configure();
  for (const sig of [null, 'sha256=00', BODY_SIG.replace(/.$/, '0')]) {
    const r = await readMetaWebhook(post(BODY, sig));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.response.status, 403);
  }
  // Not JSON and unsigned: still a 403, never a parse error.
  const junk = await readMetaWebhook(post('not json', null));
  assert.equal(junk.ok, false);
});

test('a signed body that is not JSON is acknowledged with no events', async () => {
  configure();
  const body = 'not json';
  const sig = `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;
  const r = await readMetaWebhook(post(body, sig));
  assert.deepEqual(r, { ok: true, events: [] });
});

test('an oversized body is refused', async () => {
  configure();
  const big = 'x'.repeat(META_MAX_BODY + 1);
  const r = await readMetaWebhook(post(big, `sha256=${createHmac('sha256', SECRET).update(big).digest('hex')}`));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.response.status, 413);
});
