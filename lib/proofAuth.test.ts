// lib/proofAuth.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashResetToken, isValidResetTokenFormat, normalizeLoginEmail, passwordProblem, readProofSession, signProofSession } from './proofAuth';

const SECRET = 'test-secret';

test('password rules: 10 to 200 characters, not the email, not one repeated character', () => {
  assert.equal(passwordProblem('short', 'a@b.co'), 'Use at least 10 characters.');
  assert.equal(passwordProblem('x'.repeat(201), 'a@b.co'), 'Use at most 200 characters.');
  assert.equal(passwordProblem('aaaaaaaaaaaa', 'a@b.co'), 'Pick something harder to guess.');
  assert.equal(passwordProblem('Mike@A1Detail.com', 'mike@a1detail.com'), "Your password can't be your email.");
  assert.equal(passwordProblem(undefined, 'a@b.co'), 'Enter a password.');
  assert.equal(passwordProblem('blue truck shines', 'a@b.co'), null);
});

test('login emails are trimmed and lowercased', () => {
  assert.equal(normalizeLoginEmail('  Mike@A1.com '), 'mike@a1.com');
  assert.equal(normalizeLoginEmail(42), '');
});

test('a session cookie verifies only with its secret, before expiry, untampered', () => {
  const exp = Date.now() + 60_000;
  const cookie = signProofSession(7, 1700000000000, exp, SECRET);
  assert.deepEqual(readProofSession(cookie, SECRET), { accountId: 7, version: 1700000000000 });
  assert.equal(readProofSession(cookie, 'other-secret'), null);
  assert.equal(readProofSession(cookie, SECRET, exp + 1), null, 'expired');
  assert.equal(readProofSession(cookie.replace(/^7\./, '8.'), SECRET), null, 'changed account id');
  assert.equal(readProofSession(cookie.replace('1700000000000', '1700000000001'), SECRET), null, 'changed version');
  assert.equal(readProofSession(`${cookie}x`, SECRET), null);
  assert.equal(readProofSession('a.b.c', SECRET), null);
  assert.equal(readProofSession(undefined, SECRET), null);
});

test('reset tokens: 43-char base64url format, stored only as a hash', () => {
  assert.equal(isValidResetTokenFormat('A'.repeat(43)), true);
  assert.equal(isValidResetTokenFormat('A'.repeat(42)), false);
  assert.equal(isValidResetTokenFormat('A'.repeat(42) + '/'), false);
  assert.match(hashResetToken('abc'), /^[0-9a-f]{64}$/);
  assert.notEqual(hashResetToken('abc'), hashResetToken('abd'));
});
