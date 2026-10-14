// lib/contacts.test.ts
// Run with: npm run test:inbox. The pure parts of lib/contacts.ts: no database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formStagesBelow, toContact, toEvent } from './contacts';

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
