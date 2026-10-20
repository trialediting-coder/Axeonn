import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSummaryToken, signSummaryToken, SUMMARY_LINK_TTL_MS } from './proofSummaryLink';
import { signProofSession } from './proofAuth';

const SECRET = 'test-secret';
const NOW = Date.parse('2026-11-01T14:00:00Z');

test('a signed link reads back as the same client, month and recipient', () => {
  const t = signSummaryToken({ onboardingId: 42, month: '2026-10', recipient: 'owner' }, SECRET, NOW);
  assert.deepEqual(readSummaryToken(t, SECRET, NOW), { onboardingId: 42, month: '2026-10', recipient: 'owner' });
  const m = signSummaryToken({ onboardingId: 42, month: '2026-10', recipient: 'manager' }, SECRET, NOW);
  assert.equal(readSummaryToken(m, SECRET, NOW)?.recipient, 'manager');
});

test('links expire after 45 days', () => {
  const t = signSummaryToken({ onboardingId: 42, month: '2026-10', recipient: 'owner' }, SECRET, NOW);
  assert.ok(readSummaryToken(t, SECRET, NOW + SUMMARY_LINK_TTL_MS - 1));
  assert.equal(readSummaryToken(t, SECRET, NOW + SUMMARY_LINK_TTL_MS + 1), null);
});

test('tampering with the client id, month or expiry breaks the signature (single tenant)', () => {
  const t = signSummaryToken({ onboardingId: 42, month: '2026-10', recipient: 'owner' }, SECRET, NOW);
  const parts = t.split('.');
  const swap = (i: number, v: string) => parts.map((p, j) => (j === i ? v : p)).join('.');
  assert.equal(readSummaryToken(swap(1, '43'), SECRET, NOW), null);
  assert.equal(readSummaryToken(swap(2, '2026-09'), SECRET, NOW), null);
  assert.equal(readSummaryToken(swap(4, String(NOW + 10 * SUMMARY_LINK_TTL_MS)), SECRET, NOW), null);
  assert.equal(readSummaryToken(swap(3, 'm'), SECRET, NOW), null);
});

test('a different secret, junk, or a dashboard session cookie never validates', () => {
  const t = signSummaryToken({ onboardingId: 42, month: '2026-10', recipient: 'owner' }, SECRET, NOW);
  assert.equal(readSummaryToken(t, 'other', NOW), null);
  for (const junk of [undefined, null, 42, '', 's1', 's1.42.2026-10.o.1', 'x'.repeat(500), 's1.0.2026-10.o.9999999999999.abc', 's1.42.2026-13.o.9999999999999.abc']) {
    assert.equal(readSummaryToken(junk, SECRET, NOW), null);
  }
  const session = signProofSession(42, 1, NOW + 1000, `proof-session:${SECRET}`);
  assert.equal(readSummaryToken(session, SECRET, NOW), null);
});

test('bad inputs are refused when signing', () => {
  assert.throws(() => signSummaryToken({ onboardingId: 0, month: '2026-10', recipient: 'owner' }, SECRET, NOW));
  assert.throws(() => signSummaryToken({ onboardingId: 1, month: '2026-1', recipient: 'owner' }, SECRET, NOW));
});
