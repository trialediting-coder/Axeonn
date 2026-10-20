// lib/emailLog.test.ts
// Run with: npm run test:onboarding   (no database or Resend needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL_CATEGORIES, EMAIL_KINDS, emailKindLabel, isEmailCategory, kindsInCategory, loggedSubject, recipientsText } from './emailLogShared';

test('every kind belongs to a real category, and every category has kinds', () => {
  for (const { category } of Object.values(EMAIL_KINDS)) assert.ok(isEmailCategory(category));
  for (const c of Object.keys(EMAIL_CATEGORIES)) assert.ok(kindsInCategory(c as keyof typeof EMAIL_CATEGORIES).length > 0, c);
});

test('onboarding and contracts group the right emails', () => {
  assert.deepEqual(kindsInCategory('onboarding'), ['welcome', 'dashboard_invite', 'onboarding_nudge', 'launch_certificate']);
  assert.deepEqual(kindsInCategory('contracts'), ['agreement_sent', 'agreement_signed', 'agreement_signed_alert']);
});

test("follow-up emails to a client's leads get their own group", () => {
  assert.deepEqual(kindsInCategory('followups'), ['sequence_email']);
  assert.equal(emailKindLabel('sequence_email'), 'Follow-up email to a lead');
});

test('setup codes never reach the log', () => {
  assert.equal(loggedSubject('verification_code', '482913 is your Axeon setup code'), '•••••• is your Axeon setup code');
  assert.equal(loggedSubject('project_update', 'Update #12345: new page'), 'Update #12345: new page');
});

test('recipients are normalised to one lowercase string', () => {
  assert.equal(recipientsText('Owner@Example.com '), 'owner@example.com');
  assert.equal(recipientsText(['a@x.co', 'B@x.co']), 'a@x.co, b@x.co');
  assert.equal(recipientsText(undefined), '');
});

test('unknown kinds fall back to the raw key', () => {
  assert.equal(emailKindLabel('welcome'), 'Welcome / setup link');
  assert.equal(emailKindLabel('retired_kind'), 'retired_kind');
  assert.equal(isEmailCategory('toString'), false);
});
