// lib/projects.test.ts
// Run with: npm run test:onboarding   (pure helpers; no database)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  delta,
  guaranteeDay,
  monthLabel,
  parseLines,
  previousReport,
  reportStats,
  tierHasGuarantee,
  validateReportInput,
  validateUpdateInput,
  type MonthlyReport,
} from './projects';

test('the 90-day guarantee is for AxeonCORE and AxeonGROWTH only', () => {
  assert.equal(tierHasGuarantee('essentials'), false);
  assert.equal(tierHasGuarantee('axeoncore'), true);
  assert.equal(tierHasGuarantee('axeongrowth'), true);
});

test('guarantee day counts from kickoff and stops after day 90', () => {
  const kickoff = '2026-10-01';
  const at = (d: string) => Date.parse(`${d}T15:00:00Z`);
  assert.equal(guaranteeDay(null), null);
  assert.equal(guaranteeDay(kickoff, at('2026-09-30')), null);
  assert.equal(guaranteeDay(kickoff, at('2026-10-01')), 1);
  assert.equal(guaranteeDay(kickoff, at('2026-10-10')), 10);
  assert.equal(guaranteeDay(kickoff, at('2026-12-29')), 90);
  assert.equal(guaranteeDay(kickoff, at('2026-12-30')), null);
});

test('lines parse as "Title: detail", bullets stripped', () => {
  assert.deepEqual(parseLines('- New page: Roof repair\n\n2. Just a sentence'), [
    { title: 'New page', body: 'Roof repair' },
    { title: '', body: 'Just a sentence' },
  ]);
  assert.deepEqual(parseLines(undefined), []);
});

test('updates need a headline and an https link', () => {
  assert.throws(() => validateUpdateInput({}), /headline/);
  assert.throws(() => validateUpdateInput({ title: 'x', link: 'javascript:alert(1)' }), /https/);
  const u = validateUpdateInput({ title: 'Live', type: 'bogus', link: 'https://a1detail.com' });
  assert.equal(u.body.type, 'Site change');
  assert.equal(u.body.status, 'Live');
});

test('reports: blank numbers stay blank, never zero', () => {
  const r = validateReportInput({ month: '2026-09', calls: '12', leads: '' });
  assert.equal(r.body.calls, 12);
  assert.equal(r.body.leads, null);
  assert.throws(() => validateReportInput({ month: '2026-13' }), /month/);
  assert.throws(() => validateReportInput({ month: '2026-09', calls: '-1' }), /calls/);
  assert.throws(() => validateReportInput({ month: '2026-09', rating: '6' }), /Rating/);
});

test('report stats compare with last month and the baseline', () => {
  const base = validateReportInput({ month: '2026-08', calls: '10', leads: '4', rank: '9' }).body;
  const now = validateReportInput({ month: '2026-09', calls: '14', leads: '3', rank: '5', keyword: 'roofer ankeny' }).body;
  const d = { kickoffAt: null, targetLaunchAt: null, baselineCalls: 8, baselineLeads: 2, baselineKeyword: null, baselineRank: null };
  const stats = reportStats(now, base, d);
  assert.equal(stats[0].value, '14');
  assert.equal(stats[0].sub, '+4 vs last month · baseline 8');
  assert.equal(stats[1].sub, '−1 vs last month · baseline 2');
  assert.equal(stats[2].value, '—');
  assert.equal(stats[3].value, '#5');
  assert.equal(stats[3].sub, 'was #9 last month');
  assert.equal(delta(null, 3), null);
});

test('previous report and month labels', () => {
  const mk = (month: string) => ({ month }) as MonthlyReport;
  const all = [mk('2026-09'), mk('2026-07'), mk('2026-08')];
  assert.equal(previousReport(all, '2026-09')?.month, '2026-08');
  assert.equal(previousReport(all, '2026-07'), null);
  assert.equal(monthLabel('2026-09'), 'September 2026');
});
