// lib/sequenceAdmin.test.ts
// Run with: npm run test:sequences
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STOP_REASON_LABELS, importNotice, nextStepOffset, startLeadNotice, stopReasonLabel } from './sequenceAdmin';
import { KIND_RULES } from './sequenceShared';

test('every stop reason has a label, including template_changed and bad_number', () => {
  assert.equal(STOP_REASON_LABELS.template_changed, 'Template was edited; this run stopped');
  assert.equal(STOP_REASON_LABELS.bad_number, "Number can't receive texts");
  for (const label of Object.values(STOP_REASON_LABELS)) assert.ok(label.length > 3);
});

test('stage taps are labelled by their action; unknown reasons pass through', () => {
  assert.equal(stopReasonLabel('stage:quote_sent'), 'Stopped by a tap: quote_sent');
  assert.equal(stopReasonLabel('replied'), STOP_REASON_LABELS.replied);
  assert.equal(stopReasonLabel('something_new'), 'something_new');
});

test('import notice counts, lists up to three skips, and hints when the file has no header row', () => {
  assert.equal(importNotice(5, []), 'Saved 5 customers.');
  assert.equal(importNotice(1, []), 'Saved 1 customer.');
  const many = importNotice(2, [1, 2, 3, 4].map((line) => ({ line, reason: 'blank row' })));
  assert.match(many, /Skipped 4: line 1 \(blank row\), line 2 \(blank row\), line 3 \(blank row\), and more\./);
  const hint = importNotice(0, [{ line: 1, reason: 'no phone column' }]);
  assert.match(hint, /If your file has no header row, make sure the first row's phone is a US number\./);
  const noHint = importNotice(0, [{ line: 4, reason: 'no phone column' }]);
  assert.doesNotMatch(noHint, /no header row/);
});

test('start-follow-up notices say why nothing started', () => {
  assert.equal(startLeadNotice({ started: true, runId: 9 }), 'Follow-up started.');
  assert.match(startLeadNotice({ started: false, reason: 'disabled' }), /turned off/);
  assert.match(startLeadNotice({ started: false, reason: 'missing_link' }), /link/);
  assert.match(startLeadNotice({ started: false, reason: 'already_active' }), /already running/);
});

test('a new step waits a day after the last, an hour for reminders, and never past the limit', () => {
  const step = (offsetMinutes: number) => ({ offsetMinutes, channel: 'sms' as const, subject: null, body: 'x' });
  assert.equal(nextStepOffset('new_lead', [step(0), step(60)]), 60 + 1440);
  assert.equal(nextStepOffset('new_lead', []), KIND_RULES.new_lead.minOffset + 1440);
  assert.equal(nextStepOffset('new_lead', [step(KIND_RULES.new_lead.maxOffset)]), KIND_RULES.new_lead.maxOffset);
  assert.equal(nextStepOffset('reminder', [step(-1440)]), -1440 + 60);
  assert.equal(nextStepOffset('reminder', [step(0)]), KIND_RULES.reminder.maxOffset);
});
