// lib/unsubscribe.test.ts
// Run with: npm run test:sequences   (no database needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { UNSUBSCRIBE_MAC_PREFIX, parseUnsubscribeToken, unsubscribeToken, unsubscribeUrl } from './unsubscribe';

const SECRET = 'test-secret';

test('a token round-trips to the client id and the normalized email', () => {
  const token = unsubscribeToken(12, 'Mike@Example.com ', SECRET);
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(parseUnsubscribeToken(token, SECRET), { onboardingId: 12, email: 'mike@example.com' });
  // Same person, same client: same token (so a resent link still works).
  assert.equal(unsubscribeToken(12, 'mike@example.com', SECRET), token);
});

test('a tampered token is refused', () => {
  const token = unsubscribeToken(12, 'mike@example.com', SECRET);
  const [payload, mac] = token.split('.');
  const otherPayload = Buffer.from('13:mike@example.com').toString('base64url');
  assert.equal(parseUnsubscribeToken(`${otherPayload}.${mac}`, SECRET), null); // someone else's client
  const otherEmail = Buffer.from('12:victim@example.com').toString('base64url');
  assert.equal(parseUnsubscribeToken(`${otherEmail}.${mac}`, SECRET), null); // someone else's address
  const flipped = (mac[0] === 'A' ? 'B' : 'A') + mac.slice(1);
  assert.equal(parseUnsubscribeToken(`${payload}.${flipped}`, SECRET), null);
  assert.equal(parseUnsubscribeToken(`${payload}.${mac.slice(0, -2)}`, SECRET), null); // short signature
  assert.equal(parseUnsubscribeToken(payload, SECRET), null);
  assert.equal(parseUnsubscribeToken(`${token}.x`, SECRET), null);
  assert.equal(parseUnsubscribeToken('', SECRET), null);
  assert.equal(parseUnsubscribeToken('x'.repeat(2000), SECRET), null);
  assert.equal(parseUnsubscribeToken(42 as unknown as string, SECRET), null);
});

test('a token signed with another secret is refused, and no secret means no tokens', () => {
  const token = unsubscribeToken(12, 'mike@example.com', SECRET);
  assert.equal(parseUnsubscribeToken(token, 'other-secret'), null);
  assert.equal(unsubscribeToken(12, 'mike@example.com', ''), '');
  assert.equal(parseUnsubscribeToken(token, ''), null);
});

test('a well-signed payload that is not a client id and an email is still refused', () => {
  // Signed correctly, but the content is junk: never trusted.
  const forge = (payload: string) =>
    `${Buffer.from(payload).toString('base64url')}.${createHmac('sha256', SECRET).update(`${UNSUBSCRIBE_MAC_PREFIX}${payload}`).digest('base64url')}`;
  assert.deepEqual(parseUnsubscribeToken(forge('7:a@b.co'), SECRET), { onboardingId: 7, email: 'a@b.co' });
  assert.equal(parseUnsubscribeToken(forge('0:a@b.co'), SECRET), null);
  assert.equal(parseUnsubscribeToken(forge('x:a@b.co'), SECRET), null);
  assert.equal(parseUnsubscribeToken(forge('7:not-an-email'), SECRET), null);
  assert.equal(parseUnsubscribeToken(forge('7:A@B.CO'), SECRET), null); // not normalized
});

test('the signature covers the "unsub|" prefix: an HMAC of the bare payload (another use of the secret) is refused', () => {
  assert.equal(UNSUBSCRIBE_MAC_PREFIX, 'unsub|');
  const bare = `${Buffer.from('7:a@b.co').toString('base64url')}.${createHmac('sha256', SECRET).update('7:a@b.co').digest('base64url')}`;
  assert.equal(parseUnsubscribeToken(bare, SECRET), null);
  const [, sig] = unsubscribeToken(7, 'a@b.co', SECRET).split('.');
  assert.equal(sig, createHmac('sha256', SECRET).update('unsub|7:a@b.co').digest('base64url'));
});

test('unsubscribeUrl puts the token under /u/ on the given origin, or is null without a secret', () => {
  const url = unsubscribeUrl(12, 'mike@example.com', 'https://axeonstudio.co', SECRET);
  assert.equal(url, `https://axeonstudio.co/u/${unsubscribeToken(12, 'mike@example.com', SECRET)}`);
  assert.equal(unsubscribeUrl(12, 'mike@example.com', 'https://axeonstudio.co', ''), null);
  assert.equal(unsubscribeUrl(12, 'not an email', 'https://axeonstudio.co', SECRET), null);
});
