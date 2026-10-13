// lib/leads.test.ts
// Run with: npm run test:leads. Only the pure parts; the SQL is reviewed, not unit-tested.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leadIpHash, isRateLimited, LEAD_RATE_LIMIT } from './leads';

test('leadIpHash is stable, keyed by the secret, and 32 hex characters', () => {
  const a = leadIpHash('203.0.113.7', 'salt');
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.equal(a, leadIpHash('203.0.113.7', 'salt'));
  assert.notEqual(a, leadIpHash('203.0.113.8', 'salt'));
  assert.notEqual(a, leadIpHash('203.0.113.7', 'other'));
  assert.match(leadIpHash('203.0.113.7', ''), /^[0-9a-f]{32}$/); // no secret configured still hashes
});

test('isRateLimited allows the first N submissions in the window and blocks the next', () => {
  assert.equal(isRateLimited(0), false);
  assert.equal(isRateLimited(LEAD_RATE_LIMIT - 1), false); // this would be the 5th
  assert.equal(isRateLimited(LEAD_RATE_LIMIT), true); // this would be the 6th
  assert.equal(isRateLimited(2, 2), true);
  assert.equal(isRateLimited(1, 2), false);
});
