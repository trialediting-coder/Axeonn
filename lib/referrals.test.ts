// lib/referrals.test.ts
// Run with: npm run test:onboarding   (pure parts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOW_FOUND_KEY, readHowFound, referralStatus } from './referrals';
import { referralHeadline } from './referral';
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

test('the AxeonPROOF referral card points at the better month, or does not show', () => {
  const now = (c: number, e: number) => ({ traffic: { conversions: c, estimatedCustomers: e }, period: 'so far this month' });
  const sep = (c: number, e: number) => ({ traffic: { conversions: c, estimatedCustomers: e }, period: 'in September' });
  assert.equal(referralHeadline([now(74, 38), sep(80, 41)]), '~41 new customers in September.');
  assert.equal(referralHeadline([now(74, 38), sep(10, 5)]), '~38 new customers so far this month.');
  // Early in the month: this month is near zero, last month carries the card.
  assert.equal(referralHeadline([now(1, 0), sep(60, 30)]), '~30 new customers in September.');
  assert.equal(referralHeadline([now(9, 2)]), '9 people reached out so far this month.');
  // Nothing to point at: no card.
  assert.equal(referralHeadline([now(3, 1), sep(4, 2)]), null);
  assert.equal(referralHeadline([{ traffic: null, period: 'in September' }]), null);
  assert.equal(referralHeadline([]), null);
});
