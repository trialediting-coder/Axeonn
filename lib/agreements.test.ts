// lib/agreements.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementText, agreementValues, hashAgreementText, isAgreementToken, money, newAgreementToken, validateAgreementInput } from './agreements';

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

test('no minimum swaps in month-to-month terms; default text is unchanged', () => {
  const a = { ...validateAgreementInput(RAW), number: 'AX-2026-001' };
  assert.equal(a.noMinimum, false);
  const legacy = { ...a };
  delete (legacy as { noMinimum?: boolean }).noMinimum;
  assert.equal(agreementText(legacy), agreementText(a), 'older agreements keep their signed text');
  assert.ok(agreementText(a).includes('initial term of three (3) months'));
  const m = { ...validateAgreementInput({ ...RAW, noMinimum: true }), number: 'AX-2026-001' };
  const text = agreementText(m);
  assert.ok(text.includes('Initial Term: Month-to-month, no minimum'));
  assert.ok(text.includes('one (1) month'));
  assert.ok(!text.includes('initial term of three (3) months'));
  assert.ok(!text.includes('may not terminate for convenience during the Initial Term'));
});

test('money formats cents', () => {
  assert.equal(money(9900), '$99');
  assert.equal(money(150000), '$1,500');
  assert.equal(money(24950), '$249.50');
});

test('minimum term: any whole number of months, 3 keeps the original text, 0 = none', () => {
  const base = { ...validateAgreementInput(RAW), number: 'AX-2026-001' };
  assert.equal(base.minimumMonths, 3);
  const legacy = { ...base };
  delete (legacy as { minimumMonths?: number }).minimumMonths;
  assert.equal(agreementText(legacy), agreementText(base), 'agreements signed before minimumMonths keep their text');

  const six = { ...validateAgreementInput({ ...RAW, minimumMonths: '6' }), number: 'AX-2026-001' };
  const t6 = agreementText(six);
  assert.ok(t6.includes('Initial Term: 6 months, then month-to-month'));
  assert.ok(t6.includes('initial term of six (6) months'));
  assert.ok(t6.includes('may not terminate for convenience during the Initial Term'), 'still a commitment');

  const none = { ...validateAgreementInput({ ...RAW, minimumMonths: 0 }), number: 'AX-2026-001' };
  assert.equal(none.noMinimum, true);
  assert.ok(agreementText(none).includes('Initial Term: Month-to-month, no minimum'));

  assert.throws(() => validateAgreementInput({ ...RAW, minimumMonths: 25 }));
  assert.throws(() => validateAgreementInput({ ...RAW, minimumMonths: 1.5 }));
});

test('a $0 setup fee reads as monthly only', () => {
  const a = validateAgreementInput({ ...RAW, setup: '0', monthly: '49' });
  assert.equal(a.setupCents, 0);
  assert.equal(agreementValues(a).fees, '$49 / month with no setup fee; the first month is due at signing');
});

test('Hosted Website agreement lists only the site and hosting', () => {
  const a = { ...validateAgreementInput({ ...RAW, tier: 'website' }), number: 'AX-2026-002' };
  assert.equal(a.tier, 'website', 'its own plan: website-only onboarding');
  assert.equal(a.setupCents, 0);
  assert.equal(a.monthlyCents, 4900);
  const text = agreementText(a);
  assert.ok(text.includes('Plan: Hosted Website'));
  assert.ok(text.includes('A custom, professionally designed, mobile-friendly website (up to 4 pages)'));
  assert.ok(!text.includes('Google Business Profile upkeep\n'), 'GBP upkeep is not promised');
  assert.ok(!text.includes('Monthly calls & leads report by email'));
  const full = agreementText({ ...validateAgreementInput({ ...RAW, tier: 'essentials' }), number: 'AX-2026-002' });
  assert.ok(full.includes('Monthly calls & leads report by email'), 'full plans keep their Schedule A');
});
