// lib/ownerData.test.ts
// Run with: npm run test:onboarding   (pure parts of the owner's data view)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientFlags, latestAnswers, stageOf, tapCounts } from './ownerData';
import type { FeedbackEntry } from './feedbackShared';

const fb = (month: string, answers: Record<string, string>, createdAt: string, rating: FeedbackEntry['rating'] = null): FeedbackEntry => ({
  id: Math.random(), kind: 'report', month, rating, comment: null, answers, createdAt,
});

test('latest answer per question wins, in words, with attention carried', () => {
  const rows = [fb('2026-09', { job: 'notyet', jobs: '0' }, '2026-10-02T00:00:00Z'), fb('2026-10', { jobs: '4-10', worth: 'easily' }, '2026-11-02T00:00:00Z')];
  const latest = latestAnswers(rows);
  assert.deepEqual(latest.map((a) => [a.key, a.answer, a.attention, a.month]), [
    ['jobs', '4 to 10', false, '2026-10'],
    ['worth', 'Easily', false, '2026-10'],
    ['job', 'Not yet', true, '2026-09'],
  ]);
});

test('tap counts: emailed reports that got any tap', () => {
  const reports = [{ month: '2026-08', emailedAt: 'x' }, { month: '2026-09', emailedAt: 'x' }, { month: '2026-10', emailedAt: null }];
  assert.deepEqual(tapCounts(reports, [fb('2026-09', {}, 'x', 'yes')]), { answered: 1, emailed: 2 });
  assert.deepEqual(tapCounts(reports, []), { answered: 0, emailed: 2 });
});

test('flags say what wants a call', () => {
  const base = { stage: 'live' as const, answers: [], closeRate: null, markedWon: 0, markedLost: 0, lastRating: null };
  assert.deepEqual(clientFlags(base), []);
  assert.deepEqual(clientFlags({ ...base, stage: 'quiet', lastRating: 'no' }), ['Tracker quiet', 'Report not useful']);
  assert.deepEqual(clientFlags({ ...base, answers: latestAnswers([fb('2026-09', { worth: 'notyet', pickup: 'rarely' }, 'x')]) }), ['Not worth it yet', 'Rarely picks up']);
  assert.deepEqual(clientFlags({ ...base, closeRate: 20, markedWon: 2, markedLost: 8 }), ['Low close rate']);
  assert.deepEqual(clientFlags({ ...base, closeRate: 20, markedWon: 1, markedLost: 3 }), [], 'under ten marked is not a verdict');
});

test('stage: setup before any event, quiet after a week of silence, else live', () => {
  const now = Date.UTC(2026, 9, 10);
  assert.equal(stageOf(null, now), 'setup');
  assert.equal(stageOf(new Date(now - 2 * 86_400_000).toISOString(), now), 'live');
  assert.equal(stageOf(new Date(now - 9 * 86_400_000).toISOString(), now), 'quiet');
});
