// lib/secretBox.test.ts
// Run with: npm run test:meta
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSecretsConfigured, open, seal } from './secretBox';

const KEY = Buffer.alloc(32, 7).toString('base64');
const OTHER = Buffer.alloc(32, 9).toString('base64');
const TOKEN = 'EAAGm0PX4ZCpsBAJZBexample-page-token-1234567890';

test('seal then open returns the original, and two seals of the same value differ (random IV)', () => {
  const a = seal(TOKEN, KEY);
  const b = seal(TOKEN, KEY);
  assert.equal(open(a, KEY), TOKEN);
  assert.equal(open(b, KEY), TOKEN);
  assert.notEqual(a, b);
});

test('the sealed form is v1.<iv>.<tag>.<ciphertext> in base64url and never contains the secret', () => {
  const s = seal(TOKEN, KEY);
  assert.match(s, /^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$/);
  assert.equal(s.includes(TOKEN), false);
  assert.equal(s.includes('EAAG'), false);
});

test('a changed ciphertext, tag or IV is refused', () => {
  const [v, iv, tag, ct] = seal(TOKEN, KEY).split('.');
  const flip = (s: string) => {
    const buf = Buffer.from(s, 'base64url');
    buf[0] ^= 1;
    return buf.toString('base64url');
  };
  assert.throws(() => open([v, iv, tag, flip(ct)].join('.'), KEY), /could not open/i);
  assert.throws(() => open([v, iv, flip(tag), ct].join('.'), KEY), /could not open/i);
  assert.throws(() => open([v, flip(iv), tag, ct].join('.'), KEY), /could not open/i);
});

test('the wrong key is refused and the error never echoes the secret', () => {
  const s = seal(TOKEN, KEY);
  assert.throws(
    () => open(s, OTHER),
    (err: unknown) => err instanceof Error && /could not open/i.test(err.message) && !err.message.includes(TOKEN)
  );
});

test('malformed input and a bad key are refused plainly', () => {
  assert.throws(() => open('v2.a.b.c', KEY), /not a sealed secret/i);
  assert.throws(() => open('nonsense', KEY), /not a sealed secret/i);
  assert.throws(() => seal(TOKEN, Buffer.alloc(16, 1).toString('base64')), /SECRETS_KEY/);
  assert.throws(() => seal(TOKEN, ''), /SECRETS_KEY/);
});

test('isSecretsConfigured reads SECRETS_KEY and wants exactly 32 bytes', () => {
  const before = process.env.SECRETS_KEY;
  process.env.SECRETS_KEY = KEY;
  assert.equal(isSecretsConfigured(), true);
  process.env.SECRETS_KEY = Buffer.alloc(31, 1).toString('base64');
  assert.equal(isSecretsConfigured(), false);
  delete process.env.SECRETS_KEY;
  assert.equal(isSecretsConfigured(), false);
  if (before !== undefined) process.env.SECRETS_KEY = before;
});
