// lib/partnersShared.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyShareCents, validatePartnerInput, validateReferralInput, type PartnerReferral } from './partnersShared';

const ref = (status: PartnerReferral['status'], monthlyCents: number): PartnerReferral => ({
  id: 1,
  partnerId: 1,
  practice: 'Quillmont Family Dental',
  status,
  monthlyCents,
  notes: '',
  createdAt: '2026-10-19T00:00:00.000Z',
});

test('the advisory share is 15% of signed clients only, and nothing on the credit deal', () => {
  const referrals = [ref('signed', 79900), ref('signed', 199900), ref('call_booked', 79900), ref('ended', 79900)];
  assert.equal(monthlyShareCents({ deal: 'share', referrals }), Math.round((79900 + 199900) * 0.15));
  assert.equal(monthlyShareCents({ deal: 'share', referrals: [ref('signed', 79900)] }), 11985, '$119.85 on one AxeonCORE practice');
  assert.equal(monthlyShareCents({ deal: 'credit', referrals }), 0);
});

test('partner input needs a name or firm and falls back to safe values', () => {
  const p = validatePartnerInput({ firm: '  Ames Dental CPA ', email: 'Jordan@Ames.com', kind: 'nope', status: 'brief_sent' });
  assert.equal(p.firm, 'Ames Dental CPA');
  assert.equal(p.email, 'jordan@ames.com');
  assert.equal(p.kind, 'cpa');
  assert.equal(p.status, 'brief_sent');
  assert.equal(p.deal, 'share');
  assert.throws(() => validatePartnerInput({}), /name or a firm/);
  assert.throws(() => validatePartnerInput({ name: 'J', email: 'bad' }), /email/);
});

test('referral input reads the monthly fee in dollars', () => {
  const r = validateReferralInput({ practice: 'Quillmont Family Dental', monthly: '799', status: 'signed' });
  assert.equal(r.monthlyCents, 79900);
  assert.equal(r.status, 'signed');
  assert.equal(validateReferralInput({ practice: 'X', monthly: '' }).monthlyCents, 0);
  assert.throws(() => validateReferralInput({ practice: ' ' }), /practice/);
});
