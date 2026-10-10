// lib/feedbackShared.test.ts
// Run with: npm run test:onboarding   (pure survey helpers)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SURVEYS, answerLabel, cleanAnswers, surveyFor } from './feedbackShared';

test('the day-30 survey is three questions, each with a tap for every answer', () => {
  const qs = SURVEYS.note30!;
  assert.deepEqual(qs.map((q) => q.key), ['leads', 'next', 'clear']);
  for (const q of qs) assert.ok(q.options.length >= 3 && q.options.length <= 4, q.key);
  assert.ok(qs[0].options.find((o) => o.value === 'fewer')?.attention, 'fewer leads than hoped reaches the owner');
  assert.ok(qs[2].options.find((o) => o.value === 'no')?.attention, 'confusing numbers reach the owner');
  assert.deepEqual(surveyFor('report'), [], 'the report has taps, not a survey');
});

test('answers are kept only when the question and option exist for that kind', () => {
  assert.deepEqual(cleanAnswers('note30', { leads: 'fewer', next: 'calls', clear: 'maybe', bogus: 'x' }), { leads: 'fewer', next: 'calls' });
  assert.deepEqual(cleanAnswers('note30', 'not an object'), {});
  assert.deepEqual(cleanAnswers('report', { leads: 'fewer' }), {});
  assert.deepEqual(answerLabel('note30', 'leads', 'fewer'), { question: 'Are the calls and leads what you hoped for?', answer: 'Fewer than I hoped', attention: true });
  assert.deepEqual(answerLabel('note30', 'next', 'fit'), { question: 'What should we put our time into next?', answer: 'Better-fit customers', attention: false });
  assert.equal(answerLabel('note30', 'leads', 'nope'), null);
});
