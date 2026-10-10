// lib/feedbackShared.test.ts
// Run with: npm run test:onboarding   (pure survey helpers)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SURVEYS, answerLabel, cleanAnswers, questionsByKeys, surveyFor } from './feedbackShared';

test('every report tap question has three or four answers and the right ones reach the owner', () => {
  assert.deepEqual(SURVEYS.report!.map((q) => q.key), ['found', 'job', 'pickup', 'worth', 'recommend', 'jobs', 'clear', 'next', 'source']);
  for (const q of surveyFor('report')) assert.ok(q.options.length >= 3 && q.options.length <= 6, q.key);
  const attention = (key: string, value: string) => surveyFor('report').find((q) => q.key === key)!.options.find((o) => o.value === value)!.attention;
  assert.ok(attention('job', 'notyet') && attention('pickup', 'rarely') && attention('worth', 'notyet') && attention('recommend', 'notyet') && attention('jobs', '0') && attention('clear', 'no'));
  assert.ok(!attention('job', 'yes') && !attention('pickup', 'half'));
  assert.deepEqual(surveyFor('note90'), [], 'old kinds keep their rows but ask nothing');
});

test('questions come back in the order the report asked them, unknown keys dropped', () => {
  assert.deepEqual(questionsByKeys('report', ['jobs', 'bogus', 'recommend']).map((q) => q.key), ['jobs', 'recommend']);
  assert.deepEqual(questionsByKeys('report', []), []);
});

test('answers are kept only when the question and option exist for that kind', () => {
  assert.deepEqual(cleanAnswers('report', { job: 'yes', pickup: 'half', worth: 'maybe', bogus: 'x' }), { job: 'yes', pickup: 'half' });
  assert.deepEqual(cleanAnswers('report', 'not an object'), {});
  assert.deepEqual(cleanAnswers('note30', { job: 'yes' }), {});
  assert.deepEqual(answerLabel('report', 'job', 'notyet'), { question: 'Has the site brought you a job you would not have gotten otherwise?', answer: 'Not yet', attention: true });
  assert.deepEqual(answerLabel('report', 'jobs', '1-3'), { question: 'Roughly how many jobs came from the site this month?', answer: '1 to 3', attention: false });
  assert.equal(answerLabel('report', 'job', 'nope'), null);
});
