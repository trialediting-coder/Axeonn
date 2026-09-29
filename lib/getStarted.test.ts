// lib/getStarted.test.ts
// Run with: npm run test:get-started   (tsx --test, no network needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeadPayload,
  buildPaymentUrl,
  isPaymentLinkReady,
  isValidEmail,
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
    assert.equal(recommendPackage(answersFor(pkg)).id, pkg.id);
  });

  test(`recommends "${pkg.id}" for each single service it covers`, () => {
    for (const service of pkg.match!.services) {
      const answers = { ...answersFor(pkg), services: [service] };
      const got = recommendPackage(answers);
      // A tighter package may own a single service; it must still never be custom.
      assert.notEqual(got.id, CUSTOM_PACKAGE.id, `${pkg.id} / ${service}`);
      assert.ok(got.match!.services.includes(service));
    }
  });

  test(`"${pkg.id}" is excluded by budgets it does not allow (hard filter)`, () => {
    for (const budget of BUDGETS.filter((b) => !pkg.match!.budgets.includes(b))) {
      assert.notEqual(recommendPackage({ ...answersFor(pkg), budget }).id, pkg.id, budget);
    }
  });

  test(`"${pkg.id}" config uses only Airtable service values`, () => {
    for (const s of [...pkg.services, ...pkg.match!.services]) assert.ok(SERVICES.includes(s), s);
  });
}

test('spot checks against the shipped config', () => {
  assert.equal(recommendPackage({ ...base, services: ['Website'], budget: 'Under $1,000' }).id, 'website');
  assert.equal(recommendPackage({ ...base, services: ['Meta Ads'] }).id, 'ads');
  assert.equal(recommendPackage({ ...base, services: ['Google Ads', 'Meta Ads'] }).id, 'ads');
  assert.equal(recommendPackage({ ...base, services: ['SEO', 'Content'] }).id, 'seo-content');
  assert.equal(recommendPackage({ ...base, services: ['AI Automation'] }).id, 'ai-automation');
});

// ---- custom fallback -------------------------------------------------------

test('custom: 3+ services', () => {
  assert.equal(recommendPackage({ ...base, services: ['Website', 'SEO', 'Content'] }).id, 'custom');
  assert.equal(recommendPackage({ ...base, services: [...SERVICES] }).id, 'custom');
});

test('custom: $3k+ budget, even for a single service', () => {
  for (const pkg of PACKAGES) {
    assert.equal(recommendPackage({ ...answersFor(pkg), budget: '$3,000+' }).id, 'custom', pkg.id);
  }
});

test('custom: no good match', () => {
  // Two services no single package covers.
  assert.equal(recommendPackage({ ...base, services: ['Website', 'Meta Ads'] }).id, 'custom');
  // Ads with no site to land on.
  assert.equal(recommendPackage({ ...base, services: ['Meta Ads'], hasWebsite: 'No' }).id, 'custom');
  // Budget too small for anything but a website.
  assert.equal(recommendPackage({ ...base, services: ['AI Automation'], budget: 'Under $1,000' }).id, 'custom');
});

test('custom: empty services or missing budget', () => {
  assert.equal(recommendPackage({ ...base, services: [] }).id, 'custom');
  assert.equal(recommendPackage({ ...base, services: ['Website'], budget: '' }).id, 'custom');
});

test('custom has no payment link', () => {
  assert.equal(CUSTOM_PACKAGE.stripePaymentLink, null);
  assert.equal(isPaymentLinkReady(CUSTOM_PACKAGE), false);
});

test('deterministic: duplicate services and repeat calls give the same answer', () => {
  const a = { ...base, services: ['SEO', 'SEO'] as GetStartedAnswers['services'] };
  assert.equal(recommendPackage(a).id, recommendPackage(a).id);
  assert.equal(recommendPackage(a).id, 'seo-content');
});

// ---- payload + payment URL -------------------------------------------------

test('payload uses the package services and exact keys', () => {
  const pkg = PACKAGES.find((p) => p.id === 'ads')!;
  const payload = buildLeadPayload({ ...base, services: ['Meta Ads'] }, contact, pkg, '');
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
