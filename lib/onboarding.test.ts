// lib/onboarding.test.ts
// Run with: npm run test:onboarding   (tsx --test, no database or Resend needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ONBOARDING_ITEMS,
  ONBOARDING_TIERS,
  getItem,
  itemsForTier,
} from '../data/onboardingItems';
import {
  assertNoCredentialFields,
  computeProgress,
  displayValue,
  generateCode,
  generateOnboardingToken,
  hashCode,
  isEditable,
  isValidCodeFormat,
  isValidOnboardingToken,
  maskEmail,
  maskPhone,
  orderedItems,
  prefillFor,
  signDeviceCookie,
  tierFromStripeKey,
  validateItemData,
  validateOnboardingInput,
  verifyDeviceCookie,
  type ItemState,
} from './onboarding';
import { estimatedMinutes } from './onboardingFulfillment';

const SECRET = 'test-secret-not-used-in-prod';

// ───────────── Item definitions ─────────────

test('item keys are unique and every item has what its kind needs', () => {
  const keys = new Set<string>();
  for (const item of ONBOARDING_ITEMS) {
    assert.ok(!keys.has(item.key), `duplicate key ${item.key}`);
    keys.add(item.key);
    assert.ok(item.title && item.description, `${item.key} needs title and description`);
    if (item.kind === 'confirm') {
      assert.ok(item.fields && item.fields.length > 0, `${item.key} is a confirm card with no fields`);
      const fieldKeys = new Set<string>();
      for (const f of item.fields ?? []) {
        assert.ok(!fieldKeys.has(f.key), `${item.key} repeats field ${f.key}`);
        fieldKeys.add(f.key);
        if (f.type === 'select' || f.type === 'multi') assert.ok(f.options?.length, `${item.key}.${f.key} needs options`);
      }
    }
    if (item.kind === 'accept') assert.ok(item.steps?.length, `${item.key} needs steps`);
    if (item.kind === 'axeon') assert.equal(item.fields, undefined, `${item.key} is Axeon's and must not ask the client anything`);
  }
});

test('no field ever asks for a credential', () => {
  assert.doesNotThrow(() => assertNoCredentialFields());
  assert.throws(
    () =>
      assertNoCredentialFields([
        { key: 'x', kind: 'confirm', tier: 'essentials', title: 'x', description: 'x', fields: [{ key: 'gbpPassword', label: 'Google password', type: 'text' }] },
      ]),
    /never collect credentials/
  );
});

test('higher tiers include everything from the tiers below', () => {
  const essentials = itemsForTier('essentials').map((i) => i.key);
  const core = itemsForTier('axeoncore').map((i) => i.key);
  const growth = itemsForTier('axeongrowth').map((i) => i.key);
  for (const k of essentials) assert.ok(core.includes(k), `AxeonCORE missing ${k}`);
  for (const k of core) assert.ok(growth.includes(k), `AxeonGROWTH missing ${k}`);
  assert.ok(core.length > essentials.length && growth.length > core.length);
  // Essentials stays short: that is the whole point for a $149 client.
  assert.ok(orderedItems('essentials').client.length <= 8, 'Essentials asks the client for more than 8 things');
});

test('every tier has a friendly estimate and all tiers are covered', () => {
  for (const tier of ONBOARDING_TIERS) {
    const minutes = estimatedMinutes(tier);
    assert.ok(minutes >= 5 && minutes % 5 === 0, `${tier}: ${minutes}`);
  }
  assert.ok(estimatedMinutes('axeongrowth') > estimatedMinutes('essentials'));
});

// ───────────── Tokens and codes ─────────────

test('tokens are 20 unambiguous characters', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 100; i += 1) {
    const t = generateOnboardingToken();
    assert.equal(t.length, 20);
    assert.ok(isValidOnboardingToken(t), t);
    assert.doesNotMatch(t, /[01OIL]/);
    seen.add(t);
  }
  assert.equal(seen.size, 100);
  assert.equal(isValidOnboardingToken('K7QZ2MPD'), false, 'pay-link length must not pass');
  assert.equal(isValidOnboardingToken('k7qz2mpdk7qz2mpdk7qz'), false);
  assert.equal(isValidOnboardingToken(null), false);
});

test('codes are 6 digits, hashed with the token as salt', () => {
  for (let i = 0; i < 50; i += 1) assert.ok(isValidCodeFormat(generateCode()));
  assert.equal(isValidCodeFormat('12345'), false);
  assert.equal(isValidCodeFormat('abcdef'), false);
  const a = hashCode('123456', 'TOKENA');
  assert.equal(a, hashCode('123456', 'TOKENA'));
  assert.notEqual(a, hashCode('123456', 'TOKENB'));
  assert.notEqual(a, hashCode('654321', 'TOKENA'));
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('device cookie verifies only for its token, secret, and lifetime', () => {
  const token = generateOnboardingToken();
  const other = generateOnboardingToken();
  const exp = Date.now() + 60_000;
  const cookie = signDeviceCookie(token, exp, SECRET);
  assert.equal(verifyDeviceCookie(cookie, token, SECRET), true);
  assert.equal(verifyDeviceCookie(cookie, other, SECRET), false);
  assert.equal(verifyDeviceCookie(cookie, token, 'wrong'), false);
  assert.equal(verifyDeviceCookie(cookie, token, SECRET, exp + 1), false, 'expired');
  assert.equal(verifyDeviceCookie(`${cookie}x`, token, SECRET), false, 'tampered signature');
  assert.equal(verifyDeviceCookie(cookie.replace(String(exp), String(exp + 100000)), token, SECRET), false, 'tampered expiry');
  assert.equal(verifyDeviceCookie(undefined, token, SECRET), false);
  assert.equal(verifyDeviceCookie('a.b', token, SECRET), false);
});

// ───────────── Display helpers ─────────────

test('masking keeps enough to recognise, not enough to misuse', () => {
  assert.equal(maskEmail('jane@smithroofing.com'), 'j***@smithroofing.com');
  assert.equal(maskEmail('bad'), 'bad');
  assert.equal(maskPhone('(515) 555-0134'), '•••• 0134');
  assert.equal(maskPhone('12'), '••••');
  const tel = { key: 'p', label: 'Phone', type: 'tel' as const, sensitive: true };
  assert.equal(displayValue(tel, '515-555-0134'), '•••• 0134');
  const text = { key: 'a', label: 'Answerers', type: 'textarea' as const, sensitive: true };
  assert.equal(displayValue(text, 'Mike 515-555-0134, Sarah 515-555-0199'), 'Mike •••• 0134, Sarah •••• 0199');
  const plain = { key: 'h', label: 'Hours', type: 'textarea' as const };
  assert.equal(displayValue(plain, 'Mon 8-5'), 'Mon 8-5');
  assert.equal(displayValue(plain, ['A', 'B']), 'A, B');
});

// ───────────── Tier mapping ─────────────

test('Stripe keys map to onboarding tiers', () => {
  assert.equal(tierFromStripeKey('core-web-build'), 'essentials');
  assert.equal(tierFromStripeKey('core-web-build-monthly'), 'essentials');
  assert.equal(tierFromStripeKey('axeoncore'), 'axeoncore');
  assert.equal(tierFromStripeKey('axeoncore-monthly'), 'axeoncore');
  assert.equal(tierFromStripeKey('axeongrowth'), 'axeongrowth');
  assert.equal(tierFromStripeKey('hosting-care-monthly'), null, 'a care plan alone is not onboarding');
  assert.equal(tierFromStripeKey(null), null);
});

// ───────────── Validation ─────────────

test('validateItemData keeps declared fields, enforces required and options', () => {
  const basics = getItem('business-basics')!;
  const clean = validateItemData(basics, {
    businessName: '  A-1 Auto Detailing ',
    phone: '(515) 555-0134',
    address: 'Pleasant Hill, IA',
    hours: 'Mon-Sat 8-6\nSun closed',
    extra: 'dropped',
  });
  assert.deepEqual(clean, {
    businessName: 'A-1 Auto Detailing',
    phone: '(515) 555-0134',
    address: 'Pleasant Hill, IA',
    hours: 'Mon-Sat 8-6\nSun closed',
  });
  assert.throws(() => validateItemData(basics, { businessName: 'x', phone: '555', address: 'y', hours: 'z' }), /full phone number/);
  assert.throws(() => validateItemData(basics, { phone: '(515) 555-0134', address: 'y', hours: 'z' }), /"Business name" is required/);

  const logo = getItem('logo')!;
  assert.throws(() => validateItemData(logo, { logoChoice: 'Something else' }), /Choose one of the options/);
  assert.throws(() => validateItemData(logo, { logoChoice: 'Here is a link to it', logoLink: 'drive.google.com/x' }), /https:\/\//);
  assert.deepEqual(validateItemData(logo, { logoChoice: 'Start with a text wordmark for now' }), {
    logoChoice: 'Start with a text wordmark for now',
    logoLink: '',
  });

  const routing = getItem('lead-routing')!;
  const r = validateItemData(routing, {
    alertMobile: '5155550134',
    alertEmail: 'mike@a1.com',
    leadDefinition: ['A phone call', 'Not an option', 'A phone call', 'An online booking'],
  });
  assert.deepEqual(r.leadDefinition, ['A phone call', 'An online booking']);
  assert.throws(() => validateItemData(routing, { alertMobile: '5155550134', alertEmail: 'mike@a1.com', leadDefinition: [] }), /Pick at least one/);
  assert.throws(() => validateItemData(routing, { alertMobile: '5155550134', alertEmail: 'nope', leadDefinition: ['A phone call'] }), /valid email/);
});

test('validateItemData ignores accept and axeon items and strips control characters', () => {
  assert.deepEqual(validateItemData(getItem('photos')!, { anything: 'x' }), {});
  assert.deepEqual(validateItemData(getItem('ga4')!, { anything: 'x' }), {});
  const services = getItem('services')!;
  const out = validateItemData(services, { services: 'Detail\u0000ing\u0007 cars' });
  assert.equal(out.services, 'Detailing cars');
});

test('validateItemData caps lengths', () => {
  const services = getItem('services')!;
  const out = validateItemData(services, { services: 'a'.repeat(5000), priceRange: 'b'.repeat(1000) });
  assert.equal((out.services as string).length, 2000);
  assert.equal((out.priceRange as string).length, 300);
});

test('prefillFor uses what Stripe already told us', () => {
  const basics = getItem('business-basics')!;
  const pre = prefillFor(basics, { businessName: 'A-1', clientName: 'Mike', clientEmail: 'm@a1.com', phone: null });
  assert.deepEqual(pre, { businessName: 'A-1' });
  const routing = getItem('lead-routing')!;
  assert.deepEqual(prefillFor(routing, { businessName: null, clientName: null, clientEmail: 'm@a1.com', phone: null }), { alertEmail: 'm@a1.com' });
});

test('validateOnboardingInput normalises email and rejects bad tiers', () => {
  const input = validateOnboardingInput({ clientEmail: ' Mike@A1.com ', tier: 'axeoncore', clientName: ' Mike ', businessName: '' });
  assert.equal(input.clientEmail, 'mike@a1.com');
  assert.equal(input.clientName, 'Mike');
  assert.equal(input.businessName, null);
  assert.throws(() => validateOnboardingInput({ clientEmail: 'nope', tier: 'essentials' }), /valid client email/);
  assert.throws(() => validateOnboardingInput({ clientEmail: 'a@b.co', tier: 'platinum' }), /Choose a plan/);
});

// ───────────── Progress and editability ─────────────

function done(key: string): ItemState {
  return { itemKey: key, status: 'done', data: {}, completedBy: 'client', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

test('computeProgress counts only client items toward the percent', () => {
  const empty = computeProgress('essentials', {});
  assert.equal(empty.clientDone, 0);
  assert.equal(empty.percent, 0);
  assert.equal(empty.clientTotal, orderedItems('essentials').client.length);
  assert.equal(empty.axeonTotal, orderedItems('essentials').axeon.length);

  const states: Record<string, ItemState> = { ga4: done('ga4'), 'business-basics': done('business-basics') };
  const p = computeProgress('essentials', states);
  assert.equal(p.axeonDone, 1);
  assert.equal(p.clientDone, 1);
  assert.equal(p.percent, Math.round((1 / p.clientTotal) * 100));

  const all: Record<string, ItemState> = {};
  for (const i of orderedItems('essentials').client) all[i.key] = done(i.key);
  assert.equal(computeProgress('essentials', all).percent, 100);
});

test('isEditable: active always, complete for 60 days, closed never', () => {
  const now = Date.now();
  assert.equal(isEditable({ status: 'active', completedAt: null }, now), true);
  assert.equal(isEditable({ status: 'closed', completedAt: null }, now), false);
  const recent = new Date(now - 10 * 86_400_000).toISOString();
  const old = new Date(now - 61 * 86_400_000).toISOString();
  assert.equal(isEditable({ status: 'complete', completedAt: recent }, now), true);
  assert.equal(isEditable({ status: 'complete', completedAt: old }, now), false);
});
