// lib/contacts.test.ts
// Run with: npm run test:inbox. The pure parts of lib/contacts.ts: no database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formStagesBelow, planFormStageCopy, toContact, toEvent } from './contacts';

test('a move code makes by itself only lifts forms that are behind it, never off Won/Lost', () => {
  assert.deepEqual(formStagesBelow('contacted'), ['new']);
  assert.deepEqual(formStagesBelow('booked'), ['new', 'contacted']);
});

test('a contact row becomes the Contact the inbox promises (ids as numbers, times as ISO)', () => {
  const c = toContact({
    id: '42', onboarding_id: 7, phone: '+15155550134', email: null, name: 'Mike', stage: 'booked', source: 'call',
    utm_source: null, utm_medium: null, utm_campaign: null,
    first_seen_at: new Date('2026-10-01T15:00:00Z'), last_activity_at: '2026-10-02T15:00:00.000Z',
    stage_changed_at: null, quote_sent_at: new Date('2026-10-02T16:00:00Z'),
  });
  assert.equal(c.id, 42);
  assert.equal(c.onboardingId, 7);
  assert.equal(c.stage, 'booked');
  assert.equal(c.firstSeenAt, '2026-10-01T15:00:00.000Z');
  assert.equal(c.stageChangedAt, null);
  assert.equal(c.quoteSentAt, '2026-10-02T16:00:00.000Z');
});

test('an unknown stage in the row reads as New', () => {
  const c = toContact({
    id: 1, onboarding_id: 1, phone: null, email: 'a@b.co', name: null, stage: 'archived', source: 'form',
    utm_source: null, utm_medium: null, utm_campaign: null, first_seen_at: '2026-10-01T00:00:00Z', last_activity_at: '2026-10-01T00:00:00Z',
    stage_changed_at: null, quote_sent_at: null,
  });
  assert.equal(c.stage, 'new');
});

test('an event row keeps a null ref id null and a missing payload empty', () => {
  const e = toEvent({
    id: '9', contact_id: '42', onboarding_id: 7, kind: 'note', ref_table: null, ref_id: null, ref_part: 0,
    summary: 'Tapped', payload: null, created_at: '2026-10-02T15:00:00Z',
  });
  assert.equal(e.id, 9);
  assert.equal(e.contactId, 42);
  assert.equal(e.refId, null);
  assert.deepEqual(e.payload, {});
  const f = toEvent({
    id: 10, contact_id: 42, onboarding_id: 7, kind: 'form', ref_table: 'form_submissions', ref_id: '55', ref_part: 0,
    summary: 'Form', payload: { name: 'Mike' }, created_at: '2026-10-02T15:00:00Z',
  });
  assert.equal(f.refId, 55);
  assert.equal(f.refTable, 'form_submissions');
});

// ───────────── Backfill: which form mark wins (copyFormStages) ─────────────

const NOW = '2026-10-14T12:00:00.000Z';
const untouched = { stage: 'new' as const, stageChangedAt: null, quoteSentAt: null, tapped: false };

test('two forms: Won last week beats a new form; the contact ends Won and the new form is lifted without a new time', () => {
  const plan = planFormStageCopy(untouched, [
    { id: 1, stage: 'won', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null },
    { id: 2, stage: 'new', stageChangedAt: null, quoteSentAt: null },
  ], NOW);
  assert.deepEqual(plan.contact, { stage: 'won', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null });
  assert.deepEqual(plan.lift, { stage: 'won', ids: [2] });
});

test('a replayed answered call (contact Contacted) does not beat a Won form, and a Contacted form is lifted too', () => {
  const plan = planFormStageCopy({ ...untouched, stage: 'contacted', stageChangedAt: NOW }, [
    { id: 1, stage: 'contacted', stageChangedAt: '2026-10-01T12:00:00.000Z', quoteSentAt: '2026-10-01T12:00:00.000Z' },
    { id: 2, stage: 'won', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null },
  ], NOW);
  assert.equal(plan.contact?.stage, 'won');
  assert.equal(plan.contact?.quoteSentAt, null, 'the winning form carries no quote; the earlier quote is not borrowed');
  assert.deepEqual(plan.lift, { stage: 'won', ids: [1] });
});

test('the later of two marks wins; a mark with no time loses to one with a time', () => {
  const plan = planFormStageCopy(untouched, [
    { id: 1, stage: 'lost', stageChangedAt: null, quoteSentAt: null },
    { id: 2, stage: 'booked', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null },
  ], NOW);
  assert.equal(plan.contact?.stage, 'booked');
  assert.equal(plan.lift, null, 'a Lost form is never lifted');
});

test('a contact already tapped in the inbox keeps its stage; its forms behind it are still lifted', () => {
  const plan = planFormStageCopy({ stage: 'booked', stageChangedAt: NOW, quoteSentAt: null, tapped: true }, [
    { id: 1, stage: 'won', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null },
    { id: 2, stage: 'new', stageChangedAt: null, quoteSentAt: null },
  ], NOW);
  assert.equal(plan.contact, null);
  assert.deepEqual(plan.lift, { stage: 'booked', ids: [2] });
});

test('a second run finds nothing to change', () => {
  const plan = planFormStageCopy({ stage: 'won', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null, tapped: false }, [
    { id: 1, stage: 'won', stageChangedAt: '2026-10-07T12:00:00.000Z', quoteSentAt: null },
    { id: 2, stage: 'won', stageChangedAt: null, quoteSentAt: null },
  ], NOW);
  assert.deepEqual(plan, { contact: null, lift: null });
});

test('only new forms: nothing is copied and nothing lifted', () => {
  assert.deepEqual(planFormStageCopy(untouched, [{ id: 1, stage: 'new', stageChangedAt: null, quoteSentAt: null }], NOW), { contact: null, lift: null });
});
