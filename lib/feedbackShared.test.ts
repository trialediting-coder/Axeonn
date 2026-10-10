// lib/feedbackShared.test.ts
// Run with: npm run test:onboarding   (pure survey helpers)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SURVEYS, answerLabel, askedQuestions, cleanAnswers, surveyFor } from './feedbackShared';

test('day 30 is three taps; the report asks jobs every month plus one rotating question', () => {
  assert.deepEqual(SURVEYS.note30!.map((q) => q.key), ['job', 'pickup', 'worth']);
  for (const q of surveyFor('note30')) assert.equal(q.options.length, 3, q.key);
  assert.ok(surveyFor('note30').find((q) => q.key === 'worth')!.options.find((o) => o.value === 'notyet')?.attention, 'not worth it yet reaches the owner');
  assert.ok(surveyFor('note30').find((q) => q.key === 'pickup')!.options.find((o) => o.value === 'rarely')?.attention, 'rarely picking up reaches the owner');
  assert.deepEqual(askedQuestions('note30', null).map((q) => q.key), ['job', 'pickup', 'worth']);
  assert.deepEqual(askedQuestions('report', '2026-10').map((q) => q.key), ['jobs', 'clear']);
  assert.deepEqual(askedQuestions('report', '2026-11').map((q) => q.key), ['jobs', 'next']);
  assert.deepEqual(askedQuestions('report', '2026-12').map((q) => q.key), ['jobs', 'source']);
  assert.deepEqual(askedQuestions('report', '2027-01').map((q) => q.key), ['jobs', 'clear'], 'round again');
  assert.deepEqual(askedQuestions('note90', null), []);
});

test('answers are kept only when the question and option exist for that kind', () => {
  assert.deepEqual(cleanAnswers('note30', { job: 'yes', pickup: 'half', worth: 'maybe', bogus: 'x' }), { job: 'yes', pickup: 'half' });
  assert.deepEqual(cleanAnswers('report', { jobs: '4-10', source: 'google', job: 'yes' }), { jobs: '4-10', source: 'google' }, 'a report accepts any of its questions, asked this month or not');
  assert.deepEqual(cleanAnswers('note30', 'not an object'), {});
  assert.deepEqual(answerLabel('note30', 'job', 'notyet'), { question: 'Has the site brought you a job you would not have gotten otherwise?', answer: 'Not yet', attention: true });
  assert.deepEqual(answerLabel('report', 'jobs', '1-3'), { question: 'Roughly how many jobs came from the site this month?', answer: '1 to 3', attention: false });
  assert.equal(answerLabel('note30', 'job', 'nope'), null);
});
