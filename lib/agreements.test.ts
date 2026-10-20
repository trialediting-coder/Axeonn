// lib/agreements.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementText, agreementValues, dueAtSigning, hashAgreementText, isAgreementToken, money, newAgreementToken, validateAgreementInput } from './agreements';

const RAW = {
  clientEmail: 'Office@HintzDental.com',
  legalName: 'Hintz Family Dentistry PC',
  entityType: 'PC',
  entityState: 'Iowa',
  signerName: 'Dana Hintz',
  signerTitle: 'Owner',
  address: '1 Main St, Ankeny, IA 50021',
  tier: 'axeoncore',
  hourlyRate: '$95/hour',
  axeonEntity: 'an Iowa limited liability company',
  effectiveDate: '2026-10-19',
};

/** Agreements signed before 2026-10-19 are stored with this version. */
const OLD = '2026-10-06';

test('tokens are 20 unambiguous characters', () => {
  const t = newAgreementToken();
  assert.equal(t.length, 20);
  assert.ok(isAgreementToken(t));
  assert.equal(isAgreementToken('ABCDEFGHJKMNPQRSTUV0'), false); // 0 is excluded
  assert.equal(isAgreementToken('short'), false);
});

test('practice plans default to $799 / $1,999 on 12 months with the implementation fee credited', () => {
  const a = validateAgreementInput(RAW);
  assert.equal(a.clientEmail, 'office@hintzdental.com');
  assert.equal(a.setupCents, 0);
  assert.equal(a.monthlyCents, 79900);
  assert.equal(a.minimumMonths, 12);
  assert.equal(a.setupCreditCents, 300000);
  assert.equal(a.billing, 'monthly');
  const g = validateAgreementInput({ ...RAW, tier: 'axeongrowth' });
  assert.equal(g.monthlyCents, 199900);
  assert.equal(g.setupCreditCents, 500000);
  const b = validateAgreementInput({ ...RAW, setup: '0', monthly: '749.50' });
  assert.equal(b.monthlyCents, 74950);
});

test('required fields are enforced', () => {
  assert.throws(() => validateAgreementInput({ ...RAW, clientEmail: 'nope' }), /valid client email/);
  assert.throws(() => validateAgreementInput({ ...RAW, tier: 'gold' }), /Choose a plan/);
  assert.throws(() => validateAgreementInput({ ...RAW, hourlyRate: '' }), /Hourly rate is required/);
  assert.throws(() => validateAgreementInput({ ...RAW, monthly: '0' }), /Monthly fee/);
  assert.throws(() => validateAgreementInput({ ...RAW, billing: 'annual', minimumMonths: 0 }), /12-month/);
});

test('the signed text fills every placeholder and its hash changes with any field', () => {
  const a = { ...validateAgreementInput({ ...RAW, specialty: 'general dentistry' }), number: 'AX-2026-001' };
  const text = agreementText(a);
  assert.ok(!text.includes('{{'), 'no unfilled placeholders');
  assert.ok(text.includes('Version 2026-10-19'));
  assert.ok(text.includes('$95/hour'));
  assert.ok(text.includes('October 19, 2026'));
  assert.ok(text.includes('AxeonCORE · Patient & Client Intake Infrastructure'));
  assert.ok(!text.includes('Active Acquisition'), 'only the selected plan in Schedule A');
  const h1 = hashAgreementText(text);
  assert.equal(h1, hashAgreementText(agreementText(a)));
  assert.notEqual(h1, hashAgreementText(agreementText({ ...a, monthlyCents: 79800 })));
});

test('the 12-month practice agreement: credit, release, territory, no health information', () => {
  const a = { ...validateAgreementInput({ ...RAW, specialty: 'general dentistry' }), number: 'AX-2026-001' };
  const text = agreementText(a);
  assert.ok(text.includes('Fees: $799 / month; the $3,000 implementation fee is credited in full (Sec. 2.4); nothing is due at signing, and the first month is billed when the Services go live (Sec. 4.1)'));
  assert.ok(text.includes('the first monthly Fee is due on the date the Services go live'));
  assert.equal(dueAtSigning(a).cents, 0, '$0 to start');
  assert.ok(text.includes('Initial Term: 12 months, then month-to-month'));
  assert.ok(text.includes('initial term of twelve (12) months'));
  assert.ok(text.includes('2.4 Implementation fee credit.'));
  assert.ok(text.includes('the credited fee is never charged in addition'));
  assert.ok(text.includes('5. 90-Day Performance Commitment'));
  assert.ok(text.includes('within sixty (60) seconds'));
  assert.ok(text.includes('remaining Fees for the Initial Term are not due'), 'the release waives the rest of the term');
  assert.ok(text.includes('lower volume of any of them than Client expected is not a missed Performance Commitment'));
  assert.ok(text.includes('may not terminate for convenience during the Initial Term, except under Section 5.2'));
  assert.ok(text.includes('primary specialty is general dentistry at a location within five (5) miles'));
  assert.ok(text.includes("Client's own business phone numbers remain Client's property at all times"));
  assert.ok(text.includes('8.5 No health information.'));
  assert.ok(!text.includes('three (3) months beginning'), 'no 3-month term');
  const noTerritory = agreementText({ ...a, specialty: '' });
  assert.ok(!noTerritory.includes('6.8 Territory exclusivity'), 'territory needs a specialty');
});

test('month-to-month charges the implementation fee upfront and has no credit', () => {
  const m = { ...validateAgreementInput({ ...RAW, minimumMonths: 0, setup: '3000' }), number: 'AX-2026-002' };
  assert.equal(m.setupCreditCents, 0);
  const text = agreementText(m);
  assert.ok(text.includes('Fees: $3,000 implementation fee due at signing + $799 / month, billed from the day the Services go live (Sec. 4.1)'));
  assert.equal(dueAtSigning(m).cents, 300000, 'only the implementation fee today');
  assert.ok(text.includes('Initial Term: Month-to-month, no minimum'));
  assert.ok(!text.includes('2.4 Implementation fee credit.'));
  assert.ok(!text.includes('may not terminate for convenience during the Initial Term'));
});

test('annual prepay is ten months for twelve', () => {
  const y = { ...validateAgreementInput({ ...RAW, billing: 'annual' }), number: 'AX-2026-003' };
  const text = agreementText(y);
  assert.ok(text.includes('Fees: $7,990 for the twelve (12) months Initial Term, paid in full at signing'));
  assert.ok(text.includes('Initial Term: 12 months, prepaid, then month-to-month'));
  assert.ok(text.includes('2.3 Annual prepayment.'));
  assert.equal(dueAtSigning(y).cents, 799000, 'the prepaid year is charged at signing');
});

test('Essentials on the new version keeps section numbers and has no Performance Commitment', () => {
  const e = { ...validateAgreementInput({ ...RAW, tier: 'essentials' }), number: 'AX-2026-004' };
  assert.equal(e.setupCents, 9900);
  assert.equal(e.minimumMonths, 3);
  const text = agreementText(e);
  assert.ok(text.includes('5. Reserved'));
  assert.ok(!text.includes('90-Day Performance Commitment'));
  assert.ok(text.includes('10. Termination'));
  assert.ok(!text.includes('except under Section 5.2'));
});

test('money formats cents', () => {
  assert.equal(money(9900), '$99');
  assert.equal(money(150000), '$1,500');
  assert.equal(money(24950), '$249.50');
});

// ── Agreements signed under 2026-10-06 keep their exact text ──

const OLD_RAW = { ...RAW, tier: 'axeoncore', effectiveDate: '2026-10-06', setup: '99', monthly: '299', minimumMonths: '3' };

test('2026-10-06: no minimum swaps in month-to-month terms; default text is unchanged', () => {
  const a = { ...validateAgreementInput(OLD_RAW), number: 'AX-2026-001', version: OLD };
  const legacy = { ...a };
  delete (legacy as { noMinimum?: boolean }).noMinimum;
  delete (legacy as { minimumMonths?: number }).minimumMonths;
  delete (legacy as { setupCreditCents?: number }).setupCreditCents;
  delete (legacy as { billing?: string }).billing;
  delete (legacy as { specialty?: string }).specialty;
  assert.equal(agreementText(legacy), agreementText(a), 'older agreements keep their signed text');
  assert.ok(agreementText(a).includes('Version 2026-10-06'));
  assert.ok(agreementText(a).includes('initial term of three (3) months'));
  assert.ok(agreementText(a).includes('5. 90-Day Customer Guarantee'));
  const m = { ...validateAgreementInput({ ...OLD_RAW, minimumMonths: '', noMinimum: true }), number: 'AX-2026-001', version: OLD };
  const text = agreementText(m);
  assert.ok(text.includes('Initial Term: Month-to-month, no minimum'));
  assert.ok(text.includes('one (1) month'));
  assert.ok(!text.includes('initial term of three (3) months'));
  assert.ok(!text.includes('may not terminate for convenience during the Initial Term'));
});

test('2026-10-06: any whole number of months, 0 = none', () => {
  const six = { ...validateAgreementInput({ ...OLD_RAW, minimumMonths: '6' }), number: 'AX-2026-001', version: OLD };
  const t6 = agreementText(six);
  assert.ok(t6.includes('Initial Term: 6 months, then month-to-month'));
  assert.ok(t6.includes('initial term of six (6) months'));
  assert.ok(t6.includes('may not terminate for convenience during the Initial Term'), 'still a commitment');
  const none = { ...validateAgreementInput({ ...OLD_RAW, minimumMonths: 0 }), number: 'AX-2026-001', version: OLD };
  assert.equal(none.noMinimum, true);
  assert.ok(agreementText(none).includes('Initial Term: Month-to-month, no minimum'));
  assert.throws(() => validateAgreementInput({ ...RAW, minimumMonths: 25 }));
  assert.throws(() => validateAgreementInput({ ...RAW, minimumMonths: 1.5 }));
});

test('2026-10-06: a $0 setup fee reads as monthly only', () => {
  const a = { ...validateAgreementInput({ ...OLD_RAW, setup: '0', monthly: '49' }), version: OLD };
  assert.equal(agreementValues(a).fees, '$49 / month with no setup fee; the first month is due at signing');
  assert.equal(dueAtSigning(a).cents, 4900, 'older agreements still bill the first month at signing');
});

test('Hosted Website agreement lists only the site and hosting', () => {
  const a = { ...validateAgreementInput({ ...RAW, tier: 'website' }), number: 'AX-2026-002' };
  assert.equal(a.tier, 'website', 'its own plan: website-only onboarding');
  assert.equal(a.setupCents, 0);
  assert.equal(a.monthlyCents, 4900);
  for (const version of [OLD, undefined]) {
    const text = agreementText({ ...a, version });
    assert.ok(text.includes('Plan: Hosted Website'));
    assert.ok(text.includes('A custom, professionally designed, mobile-friendly website (up to 4 pages)'));
    assert.ok(!text.includes('Google Business Profile upkeep\n'), 'GBP upkeep is not promised');
    assert.ok(!text.includes('Monthly calls & leads report by email'));
  }
  const full = agreementText({ ...validateAgreementInput({ ...RAW, tier: 'essentials' }), number: 'AX-2026-002' });
  assert.ok(full.includes('Monthly calls & leads report by email'), 'full plans keep their Schedule A');
});
