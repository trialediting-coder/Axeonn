// lib/agreements.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementText, hashAgreementText, isAgreementToken, money, newAgreementToken, validateAgreementInput } from './agreements';

const RAW = {
  clientEmail: 'Mike@A1Detail.com',
  legalName: 'A1 Detail LLC',
  entityType: 'LLC',
  entityState: 'Iowa',
  signerName: 'Mike Smith',
  signerTitle: 'Owner',
  address: '1 Main St, Ankeny, IA 50021',
  tier: 'axeoncore',
  hourlyRate: '$95/hour',
  axeonEntity: 'an Iowa limited liability company',
  effectiveDate: '2026-10-06',
};

test('tokens are 20 unambiguous characters', () => {
  const t = newAgreementToken();
  assert.equal(t.length, 20);
  assert.ok(isAgreementToken(t));
  assert.equal(isAgreementToken('ABCDEFGHJKMNPQRSTUV0'), false); // 0 is excluded
  assert.equal(isAgreementToken('short'), false);
});

test('fees default to the plan and accept dollar overrides', () => {
  const a = validateAgreementInput(RAW);
  assert.equal(a.clientEmail, 'mike@a1detail.com');
  assert.equal(a.setupCents, 9900);
  assert.equal(a.monthlyCents, 29900);
  const b = validateAgreementInput({ ...RAW, setup: '0', monthly: '249.50' });
  assert.equal(b.setupCents, 0);
  assert.equal(b.monthlyCents, 24950);
});

test('required fields are enforced', () => {
  assert.throws(() => validateAgreementInput({ ...RAW, clientEmail: 'nope' }), /valid client email/);
  assert.throws(() => validateAgreementInput({ ...RAW, tier: 'gold' }), /Choose a plan/);
  assert.throws(() => validateAgreementInput({ ...RAW, hourlyRate: '' }), /Hourly rate is required/);
  assert.throws(() => validateAgreementInput({ ...RAW, monthly: '0' }), /Monthly fee/);
});

test('the signed text fills every placeholder and its hash changes with any field', () => {
  const a = { ...validateAgreementInput(RAW), number: 'AX-2026-001' };
  const text = agreementText(a);
  assert.ok(!text.includes('{{'), 'no unfilled placeholders');
  assert.ok(text.includes('$95/hour'));
  assert.ok(text.includes('October 6, 2026'));
  assert.ok(text.includes('AxeonCORE'));
  assert.ok(!text.includes('AxeonGROWTH\n'), 'only the selected plan in Schedule A');
  const h1 = hashAgreementText(text);
  assert.equal(h1, hashAgreementText(agreementText(a)));
  assert.notEqual(h1, hashAgreementText(agreementText({ ...a, monthlyCents: 29800 })));
});

test('money formats cents', () => {
  assert.equal(money(9900), '$99');
  assert.equal(money(150000), '$1,500');
  assert.equal(money(24950), '$249.50');
});
