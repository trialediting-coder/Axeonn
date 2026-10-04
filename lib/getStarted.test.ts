// lib/getStarted.test.ts
// Run with: npm run test:get-started   (tsx --test, no network needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeadPayload,
  buildPaymentUrl,
  isPaymentLinkReady,
  isValidEmail,
  matchPackage,
  recommendPackage,
  type ContactInfo,
  type GetStartedAnswers,
} from './getStarted';
import { BUDGETS, CUSTOM_PACKAGE, PACKAGES, SERVICES, type Package } from '../data/getStartedPackages';

const base: GetStartedAnswers = {
  services: [],
  businessType: 'Home & trade services',
  hasWebsite: 'Yes',
  goal: 'More calls and leads',
  budget: '$1,000 – $2,000',
  timeline: 'Within 30 days',
};

const contact: ContactInfo = {
  businessName: ' Smith Roofing ',
  contactName: 'Jane Smith',
  email: '  Jane.Smith+roof@Example.com ',
  phone: '515-555-0100',
  website: '',
};

/** Answers built from a package's own criteria, so this test tracks config edits. */
function answersFor(pkg: Package): GetStartedAnswers {
  const m = pkg.match!;
  return {
    ...base,
    services: [...m.services],
    budget: m.budgets[0],
    hasWebsite: m.hasWebsite?.[0] ?? 'Yes',
  };
}

// ---- every package ---------------------------------------------------------

for (const pkg of PACKAGES) {
  test(`recommends "${pkg.id}" for its full service set`, () => {
    assert.equal(matchPackage(answersFor(pkg)).id, pkg.id);
  });

  test(`recommends "${pkg.id}" for each single service it covers`, () => {
    for (const service of pkg.match!.services) {
      const answers = { ...answersFor(pkg), services: [service] };
      const got = matchPackage(answers);
      // A tighter package may own a single service; it must still never be custom.
      assert.notEqual(got.id, CUSTOM_PACKAGE.id, `${pkg.id} / ${service}`);
      assert.ok(got.match!.services.includes(service));
    }
  });

  test(`"${pkg.id}" is excluded by budgets it does not allow (hard filter)`, () => {
    for (const budget of BUDGETS.filter((b) => !pkg.match!.budgets.includes(b))) {
      assert.notEqual(matchPackage({ ...answersFor(pkg), budget }).id, pkg.id, budget);
    }
  });

  test(`"${pkg.id}" config uses only Airtable service values`, () => {
    for (const s of [...pkg.services, ...pkg.match!.services]) assert.ok(SERVICES.includes(s), s);
  });
}

test('spot checks against the shipped config', () => {
  assert.equal(matchPackage({ ...base, services: ['Website'], budget: 'Under $1,000' }).id, 'essentials');
  assert.equal(matchPackage({ ...base, services: ['SEO', 'Content'] }).id, 'essentials');
  assert.equal(matchPackage({ ...base, services: ['Website', 'SEO', 'Content'] }).id, 'essentials');
  assert.equal(matchPackage({ ...base, services: ['AI Automation'] }).id, 'axeoncore');
  assert.equal(matchPackage({ ...base, services: ['Website', 'AI Automation'] }).id, 'axeoncore');
});

// ---- custom fallback -------------------------------------------------------

test('custom: 5+ services', () => {
  assert.equal(matchPackage({ ...base, services: [...SERVICES] }).id, 'custom');
});

test('custom: $3k+ budget, even for a single service', () => {
  for (const pkg of PACKAGES) {
    assert.equal(matchPackage({ ...answersFor(pkg), budget: '$3,000+' }).id, 'custom', pkg.id);
  }
});

test('custom: no good match', () => {
  // Ads are an add-on scoped on a call, alone or with anything else.
  assert.equal(matchPackage({ ...base, services: ['Meta Ads'] }).id, 'custom');
  assert.equal(matchPackage({ ...base, services: ['Google Ads', 'Meta Ads'] }).id, 'custom');
  assert.equal(matchPackage({ ...base, services: ['Website', 'Meta Ads'] }).id, 'custom');
});

test('custom: empty services or missing budget', () => {
  assert.equal(matchPackage({ ...base, services: [] }).id, 'custom');
  assert.equal(matchPackage({ ...base, services: ['Website'], budget: '' }).id, 'custom');
});

test('custom has no payment link', () => {
  assert.equal(CUSTOM_PACKAGE.stripePaymentLink, null);
  assert.equal(isPaymentLinkReady(CUSTOM_PACKAGE), false);
});

test('deterministic: duplicate services and repeat calls give the same answer', () => {
  const a = { ...base, services: ['SEO', 'SEO'] as GetStartedAnswers['services'] };
  assert.equal(matchPackage(a).id, matchPackage(a).id);
  assert.equal(matchPackage(a).id, 'essentials');
});

// ---- placeholder guard -----------------------------------------------------

test('recommendPackage never shows a TODO placeholder package', () => {
  for (const pkg of PACKAGES) {
    const got = recommendPackage(answersFor(pkg));
    assert.ok(!got.name.trim().startsWith('TODO'), pkg.id);
    if (pkg.name.trim().startsWith('TODO')) assert.equal(got.id, CUSTOM_PACKAGE.id, pkg.id);
    else assert.equal(got.id, pkg.id);
  }
});

// ---- payload + payment URL -------------------------------------------------

test('payload uses the package services and exact keys', () => {
  const pkg = PACKAGES.find((p) => p.id === 'axeoncore')!;
  const payload = buildLeadPayload({ ...base, services: ['AI Automation'] }, contact, pkg, '');
  assert.deepEqual(Object.keys(payload), [
    'businessName', 'contactName', 'email', 'phone', 'website', 'services',
    'packageId', 'packageName', 'packagePrice', 'answers', 'company_fax',
  ]);
  assert.deepEqual(Object.keys(payload.answers), ['businessType', 'hasWebsite', 'goal', 'budget', 'timeline']);
  assert.deepEqual(payload.services, pkg.services);
  assert.equal(typeof payload.packagePrice, 'number');
  assert.equal(payload.businessName, 'Smith Roofing');
  assert.equal(payload.company_fax, '');
});

test('payload for custom passes through the visitor’s own services', () => {
  const picked: GetStartedAnswers['services'] = ['Website', 'SEO', 'Content'];
  const payload = buildLeadPayload({ ...base, services: picked }, contact, CUSTOM_PACKAGE, '');
  assert.deepEqual(payload.services, picked);
  assert.equal(payload.packageId, 'custom');
});

test('payment URL carries the exact payload email', () => {
  const payload = buildLeadPayload({ ...base, services: ['Website'] }, contact, PACKAGES[0], '');
  const url = buildPaymentUrl('https://buy.stripe.com/test_abc', payload.email);
  assert.equal(url, 'https://buy.stripe.com/test_abc?prefilled_email=Jane.Smith%2Broof%40Example.com');
  assert.equal(new URL(url).searchParams.get('prefilled_email'), payload.email);
  assert.equal(buildPaymentUrl('https://buy.stripe.com/x?locale=en', 'a@b.co'), 'https://buy.stripe.com/x?locale=en&prefilled_email=a%40b.co');
});

test('isPaymentLinkReady only accepts real Stripe Payment Links', () => {
  const pkg = PACKAGES[0];
  assert.equal(isPaymentLinkReady({ ...pkg, stripePaymentLink: '' }), false);
  assert.equal(isPaymentLinkReady({ ...pkg, stripePaymentLink: 'TODO' }), false);
  assert.equal(isPaymentLinkReady({ ...pkg, stripePaymentLink: 'https://buy.stripe.com/abc' }), true);
});

test('isValidEmail', () => {
  assert.equal(isValidEmail('jane@example.com'), true);
  assert.equal(isValidEmail(' jane@example.com '), true);
  assert.equal(isValidEmail('jane@example'), false);
  assert.equal(isValidEmail('jane example.com'), false);
});
