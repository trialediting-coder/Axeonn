// lib/reportPlan.test.ts
// Run with: npm run test:onboarding   (pure)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_FIRST_MONTH_DAYS, RAMP_REPORTS, baselineTotal, isRamp, reportNumber, reportQuestions, trackedDays } from './reportPlan';
import { dayOfMonth, quietStreak } from './autoReports';

test('a report is numbered by the months emailed before it, and the first three are the ramp', () => {
  assert.equal(reportNumber([], '2026-09'), 1);
  assert.equal(reportNumber(['2026-07', '2026-08'], '2026-09'), 3);
  assert.equal(reportNumber(['2026-07', '2026-08', '2026-10'], '2026-09'), 3, 'a later month does not count');
  assert.equal(RAMP_REPORTS, 3);
  assert.ok(isRamp(1) && isRamp(3) && !isRamp(4));
});

test('the first report asks the three onboarding taps, the third asks for a recommendation, the rest ask jobs plus a rotating one', () => {
  assert.deepEqual(reportQuestions(1, '2026-09'), ['job', 'pickup', 'worth']);
  assert.deepEqual(reportQuestions(2, '2026-10'), ['jobs', 'clear']);
  assert.deepEqual(reportQuestions(3, '2026-11'), ['jobs', 'recommend']);
  assert.deepEqual(reportQuestions(4, '2026-11'), ['jobs', 'next']);
  assert.deepEqual(reportQuestions(5, '2026-12'), ['jobs', 'source']);
  assert.deepEqual(reportQuestions(6, '2027-01'), ['jobs', 'clear'], 'round again');
  assert.deepEqual(reportQuestions(6, '2027-01', 2), ['jobs'], 'two quiet reports in a row: fewer buttons');
  assert.deepEqual(reportQuestions(6, '2027-01', 1), ['jobs', 'clear']);
  assert.deepEqual(reportQuestions(3, '2026-11', 5), ['jobs', 'recommend'], 'the third report always asks');
});

test('quiet streak counts the latest emailed reports with no tap, stopping at the first that got one', () => {
  const reports = [
    { month: '2026-06', emailedAt: 'x' },
    { month: '2026-07', emailedAt: 'x' },
    { month: '2026-08', emailedAt: 'x' },
    { month: '2026-09', emailedAt: null },
  ];
  assert.equal(quietStreak(reports, new Set(), '2026-10'), 3);
  assert.equal(quietStreak(reports, new Set(['2026-07']), '2026-10'), 1);
  assert.equal(quietStreak(reports, new Set(['2026-08']), '2026-10'), 0);
  assert.equal(quietStreak(reports, new Set(), '2026-07'), 1, 'only months before the one being sent');
});

test('a first month needs two weeks of tracking; the baseline is calls plus leads from before Axeon', () => {
  assert.equal(trackedDays('2026-09', null), 30);
  assert.equal(trackedDays('2026-09', '2026-08-10T00:00:00Z'), 30, 'tracking predates the month');
  assert.equal(trackedDays('2026-09', '2026-09-24T12:00:00Z'), 7);
  assert.equal(trackedDays('2026-09', '2026-10-02T00:00:00Z'), 0);
  assert.ok(trackedDays('2026-09', '2026-09-24T12:00:00Z') < MIN_FIRST_MONTH_DAYS);
  assert.equal(baselineTotal({ baselineCalls: 9, baselineLeads: 4 }), 13);
  assert.equal(baselineTotal({ baselineCalls: null, baselineLeads: 4 }), 4);
  assert.equal(baselineTotal({ baselineCalls: null, baselineLeads: null }), null);
  assert.equal(dayOfMonth(Date.UTC(2026, 9, 3, 14, 0), 'America/Chicago'), 3);
  assert.equal(dayOfMonth(Date.UTC(2026, 9, 3, 2, 0), 'America/Chicago'), 2, 'still the 2nd in Iowa');
});
