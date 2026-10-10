// lib/referrals.test.ts
// Run with: npm run test:onboarding   (pure parts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOW_FOUND_KEY, readHowFound, referralStatus } from './referrals';
import { ONBOARDING_ITEMS } from '@/data/onboardingItems';

test('the "how did you find us" item exists for every plan with a referrer field', () => {
  const item = ONBOARDING_ITEMS.find((i) => i.key === HOW_FOUND_KEY)!;
  assert.ok(item && item.tier === 'essentials' && item.kind === 'confirm');
  assert.deepEqual(item.fields!.map((f) => f.key), ['source', 'referredBy']);
  assert.ok(item.fields![0].options!.includes('Someone referred me'));
});

test('readHowFound trims, and a named referrer counts whatever the source says', () => {
  assert.deepEqual(readHowFound({}), { source: null, referredBy: null });
  assert.deepEqual(readHowFound({ [HOW_FOUND_KEY]: { data: { source: 'Google search', referredBy: '  ' } } }), { source: 'Google search', referredBy: null });
  assert.deepEqual(readHowFound({ [HOW_FOUND_KEY]: { data: { source: 'Google search', referredBy: ' Mike at A-1 ' } } }), { source: 'Google search', referredBy: 'Mike at A-1' });
});

test('a referral is pending until the first invoice is paid, owed after, paid when marked', () => {
  assert.equal(referralStatus({ firstInvoicePaid: false, rewardPaidAt: null }), 'pending');
  assert.equal(referralStatus({ firstInvoicePaid: true, rewardPaidAt: null }), 'owed');
  assert.equal(referralStatus({ firstInvoicePaid: true, rewardPaidAt: '2026-10-10T00:00:00Z' }), 'paid');
});
