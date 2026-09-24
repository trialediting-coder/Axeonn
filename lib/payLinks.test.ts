// lib/payLinks.test.ts
// Run with: npm run test:paylinks   (tsx --test, no database or Stripe needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, isValidToken, validatePayLinkInput } from './payLinks';

test('generateToken makes 8-char tokens from the unambiguous alphabet', () => {
  for (let i = 0; i < 50; i += 1) {
    const token = generateToken();
    assert.equal(token.length, 8);
    assert.ok(isValidToken(token), token);
    assert.doesNotMatch(token, /[01OIL]/);
  }
});

test('isValidToken rejects lowercase, wrong length, and ambiguous characters', () => {
  assert.equal(isValidToken('abcd2345'), false);
  assert.equal(isValidToken('ABCD234'), false);
  assert.equal(isValidToken('ABCD2340'), false);
  assert.equal(isValidToken(''), false);
  assert.equal(isValidToken(null), false);
  assert.equal(isValidToken('K7QZ2MPD'), true);
});

test('validatePayLinkInput accepts a setup link and strips videography from AxeonCORE', () => {
  const input = validatePayLinkInput({
    clientEmail: '  Jane@Example.com ',
    clientName: 'Smith Roofing',
    kind: 'deposit',
    tier: 'axeoncore',
    addOns: ['addon-videography', 'addon-extra-page', 'addon-extra-page'],
    note: 'Deposit for the new site',
  });
  assert.equal(input.clientEmail, 'jane@example.com');
  assert.equal(input.kind, 'deposit');
  assert.equal(input.tier, 'axeoncore');
  assert.deepEqual(input.addOns, ['addon-extra-page']);
  assert.equal(input.expiresInDays, 30);
});

test('validatePayLinkInput accepts a plan link without a tier', () => {
  const input = validatePayLinkInput({
    clientEmail: 'jane@example.com',
    kind: 'plan',
    planKey: 'core-web-build-monthly',
    expiresInDays: '7',
  });
  assert.equal(input.kind, 'plan');
  assert.equal(input.planKey, 'core-web-build-monthly');
  assert.equal(input.tier, undefined);
  assert.equal(input.expiresInDays, 7);
});

test('validatePayLinkInput rejects bad input with readable messages', () => {
  assert.throws(() => validatePayLinkInput({ clientEmail: 'nope', kind: 'deposit', tier: 'axeoncore' }), /email/);
  assert.throws(() => validatePayLinkInput({ clientEmail: 'a@b.co', kind: 'later', tier: 'axeoncore' }), /kind/);
  assert.throws(() => validatePayLinkInput({ clientEmail: 'a@b.co', kind: 'full', tier: 'addon-extra-page' }), /build/);
  assert.throws(() => validatePayLinkInput({ clientEmail: 'a@b.co', kind: 'plan', planKey: 'gold' }), /plan/);
  assert.throws(
    () => validatePayLinkInput({ clientEmail: 'a@b.co', kind: 'full', tier: 'axeoncore', expiresInDays: 400 }),
    /Expiry/
  );
  assert.throws(
    () => validatePayLinkInput({ clientEmail: 'a@b.co', kind: 'full', tier: 'axeoncore', note: 'x'.repeat(201) }),
    /Note/
  );
});
