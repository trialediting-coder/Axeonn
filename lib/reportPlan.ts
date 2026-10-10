// lib/reportPlan.ts
// Which report this is for a client and what rides on it. Pure, so the tests
// cover it; lib/autoReports.ts feeds it the database.
//
// The first three full reports are the "ramp": Google takes two to three
// months to trust a new site, so those reports headline what was built and
// the client's starting point, compare to the baseline from before Axeon
// rather than to last month, and go to the owner first (a two-day hold to add
// a sentence) before the client. A first month with under two weeks of
// tracking is skipped rather than reported on.
import { REPORT_ROTATION } from '@/lib/feedbackShared';

/** How many reports are ramp reports. */
export const RAMP_REPORTS = 3;
/** A first month needs this many tracked days to be worth a report. */
export const MIN_FIRST_MONTH_DAYS = 14;
/** Ramp reports go to the client on this day of the month unless held. */
export const RAMP_SEND_DAY = 3;
/** After this many consecutive reports with no tap, the report asks only the jobs question. */
export const QUIET_REPORTS_BEFORE_FEWER_TAPS = 2;

/** 1 for the first report, counting the months already emailed before `month`. */
export function reportNumber(emailedMonths: readonly string[], month: string): number {
  return emailedMonths.filter((m) => m < month).length + 1;
}

export const isRamp = (number: number) => number <= RAMP_REPORTS;

/**
 * The tap questions a report carries, by its number. `quietStreak` is how
 * many of the latest emailed reports went by with no tap at all.
 */
export function reportQuestions(number: number, month: string, quietStreak = 0): string[] {
  if (number === 1) return ['job', 'pickup', 'worth'];
  if (number === RAMP_REPORTS) return ['jobs', 'recommend'];
  if (quietStreak >= QUIET_REPORTS_BEFORE_FEWER_TAPS) return ['jobs'];
  const m = Number(month.slice(5, 7));
  const rotating = REPORT_ROTATION[(Number.isFinite(m) ? m - 1 : 0) % REPORT_ROTATION.length];
  return ['jobs', rotating];
}

/** Days of `month` ("YYYY-MM") on or after the first tracked event; the whole month when tracking predates it. */
export function trackedDays(month: string, firstEventAt: string | null): number {
  const [y, m] = month.split('-').map(Number);
  const start = Date.UTC(y, m - 1, 1);
  const end = Date.UTC(y, m, 1);
  const first = firstEventAt ? Date.parse(firstEventAt) : NaN;
  const from = Number.isFinite(first) ? Math.max(start, first) : start;
  if (from >= end) return 0;
  return Math.round((end - from) / 86_400_000);
}

/** "Before Axeon: about 13 calls and leads a month" from what onboarding collected, or null when nothing was. */
export function baselineTotal(d: { baselineCalls: number | null; baselineLeads: number | null }): number | null {
  if (d.baselineCalls == null && d.baselineLeads == null) return null;
  return (d.baselineCalls ?? 0) + (d.baselineLeads ?? 0);
}
