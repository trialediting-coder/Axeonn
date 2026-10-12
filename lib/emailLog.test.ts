// lib/emailLog.test.ts
// Run with: npm run test:onboarding   (no database or Resend needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL_CATEGORIES, EMAIL_KINDS, emailKindLabel, isEmailCategory, kindFromSubject, kindsInCategory, loggedSubject, recipientsText } from './emailLogShared';

test('every kind belongs to a real category, and every category has kinds', () => {
  for (const { category } of Object.values(EMAIL_KINDS)) assert.ok(isEmailCategory(category));
  for (const c of Object.keys(EMAIL_CATEGORIES)) assert.ok(kindsInCategory(c as keyof typeof EMAIL_CATEGORIES).length > 0, c);
});

test('onboarding and contracts group the right emails', () => {
  assert.deepEqual(kindsInCategory('onboarding'), ['welcome', 'dashboard_invite', 'onboarding_nudge']);
  assert.deepEqual(kindsInCategory('contracts'), ['agreement_sent', 'agreement_signed', 'agreement_signed_alert']);
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

test('past emails get their kind back from the subject line', () => {
  const cases: Array<[string, string]> = [
    ['Welcome to Axeon: your Growth setup (about 20 minutes)', 'welcome'],
    ['Your AxeonPROOF dashboard is ready', 'dashboard_invite'],
    ['Quick one: 2 things left to finish your Axeon setup', 'onboarding_nudge'],
    ['482913 is your Axeon setup code', 'verification_code'],
    ['Reset your AxeonPROOF password', 'password_reset'],
    ['Your Axeon agreement is ready to sign (AX-2026-014)', 'agreement_sent'],
    ['Signed: your Axeon agreement (AX-2026-014)', 'agreement_signed'],
    ['Shine Detailing signed agreement AX-2026-014', 'agreement_signed_alert'],
    ['Update #3: New booking page', 'project_update'],
    ["Preview: Shine Detailing's report 2 goes out October 3", 'report_preview'],
    ['September client reports: 4 sent', 'reports_digest'],
    ['Shine Detailing: month one with Axeon, the starting line', 'monthly_report'],
    ['Shine Detailing: month 2 of the ramp, September 2026', 'monthly_report'],
    ['12 people reached out to Shine Detailing in September 2026. Here is how.', 'monthly_report'],
    ['What Axeon did for Shine Detailing in September 2026', 'monthly_report'],
    ['Your business email is live: joe@shine.co', 'business_email_live'],
    ['Shine Detailing: business email request (mailbox)', 'business_email_request'],
    ['New website lead: Joe (Growth)', 'lead_alert'],
    ['Shine Detailing finished their setup', 'onboarding_complete'],
    ['Payment received: $500.00 from Joe', 'billing_alert'],
    ['Setup fee paid: $500.00 from Joe', 'billing_alert'],
    ['Recurring plan ended: Joe', 'billing_alert'],
    ['Shine Detailing said "sort of" on the September report', 'feedback_alert'],
    ['Shine Detailing left a note on the day-30 survey', 'feedback_alert'],
    ['Shine Detailing: only 1 of 9 marked leads booked', 'low_close_rate'],
    ['Shine Detailing asked about Pro', 'upgrade_request'],
    ["Shine Detailing's website tracker has gone quiet", 'tracker_quiet'],
    ['Blog draft ready for your review: Ceramic coating in winter', 'blog_draft_ready'],
    ['Weekly post generation did not pass review', 'blog_generation_failed'],
    ['Hello from a test', 'other'],
  ];
  for (const [subject, kind] of cases) assert.equal(kindFromSubject(subject), kind, subject);
});
