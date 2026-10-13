// lib/plans.test.ts
// Run with: npx tsx --test lib/plans.test.ts   (pure parts only; the database functions are exercised live)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeDraft, statusFor, validatePlanItemInput, type PlanItem } from './plans';
import type { PlanDraft } from './planRules';

const NOW = Date.parse('2026-11-12T00:00:00Z');
const draft: PlanDraft = { key: 'reviews-gap', title: 'Get to 120 Google reviews', why: 'You have 18; the top 3 average 150.', owner: 'client', metric: 'reviews', target: 120, current: 18, impact: 3 };
const base = (over: Partial<PlanItem> = {}): PlanItem => ({
  id: 1, onboardingId: 9, key: 'reviews-gap', title: 'Get to 120 Google reviews', why: 'w', owner: 'client', metric: 'reviews', target: 120, current: 18, start: 18, impact: 3,
  status: 'open', edited: false, dueAt: '2027-01-11', sourceAuditId: 1, doneAt: null, createdAt: '2026-10-13T00:00:00.000Z', updatedAt: '2026-10-13T00:00:00.000Z', ...over,
});

test('mergeDraft: new item starts where it stands; an owner-edited item keeps title/owner/target (Review Focus 4)', () => {
  const fresh = mergeDraft(null, draft, NOW, '2027-01-11');
  assert.equal(fresh.start, 18);
  assert.equal(fresh.status, 'open');
  const edited = base({ title: 'Reviews: 100 by Christmas', owner: 'axeon', target: 100, edited: true });
  const merged = mergeDraft(edited, { ...draft, current: 60, why: 'You have 60; the top 3 average 150.' }, NOW, '2027-01-11');
  assert.equal(merged.title, 'Reviews: 100 by Christmas');
  assert.equal(merged.owner, 'axeon');
  assert.equal(merged.target, 100);
  assert.equal(merged.current, 60);
  assert.equal(merged.status, 'on_track');
  const dropped = base({ status: 'dropped' });
  assert.equal(mergeDraft(dropped, draft, NOW, '2027-01-11').status, 'dropped');
});

test('statusFor: done, slipping, on_track, open', () => {
  assert.equal(statusFor(base({ current: 120 }), NOW), 'done');
  assert.equal(statusFor(base({ current: 18 }), NOW), 'open');
  assert.equal(statusFor(base({ current: 40 }), NOW), 'on_track');
  const late = Date.parse('2026-12-20T00:00:00Z'); // 75% of the 90-day window
  assert.equal(statusFor(base({ current: 25 }), late), 'slipping', '7% of the gap closed with 75% of the time gone');
  assert.equal(statusFor(base({ current: 90 }), late), 'on_track');
  assert.equal(statusFor(base({ metric: 'mapsRank', target: 3, current: 3, start: 7 }), NOW), 'done');
  assert.equal(statusFor(base({ metric: null, target: null, current: null, start: null }), late), 'open', 'manual items never slip on their own');
  assert.equal(statusFor(base({ status: 'dropped' }), NOW), 'dropped');
});

test('validatePlanItemInput', () => {
  assert.deepEqual(validatePlanItemInput({ title: ' Film a shop tour ', owner: 'client', why: 'asked on the call' }), { title: 'Film a shop tour', owner: 'client', why: 'asked on the call' });
  assert.throws(() => validatePlanItemInput({ title: '', owner: 'client' }), /title/i);
  assert.throws(() => validatePlanItemInput({ title: 'x', owner: 'someone' }), /owner/i);
});

import { dueFrom } from './plans';
test('dueFrom: never a date in the past (review Important 7)', () => {
  const now = Date.parse('2027-02-01T00:00:00Z');
  assert.equal(dueFrom('2026-10-13', now), '2027-05-02', 'kickoff + 90 is behind us → now + 90');
  assert.equal(dueFrom('2027-01-01', now), '2027-05-02', 'now + 90 wins when later');
  assert.equal(dueFrom('2027-03-01', now), '2027-05-30', 'kickoff + 90 wins when later');
});
