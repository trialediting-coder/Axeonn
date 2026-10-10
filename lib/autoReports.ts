// lib/autoReports.ts
// The automatic monthly report. A daily job (app/api/cron/monthly-reports)
// works out, for every open client whose reports are switched on, where last
// month's report stands and moves it one step:
//
//   regular report (4th onward)   built and emailed to the client on the 1st
//   ramp report (1st to 3rd)      built on the 1st and previewed to the owner,
//                                 then emailed to the client on the 3rd unless
//                                 the owner is holding it (lib/reportPlan.ts)
//   first partial month           skipped when tracking covered under two weeks
//
// The report carries website visits and visitors, which buttons were clicked,
// how many people reached out, an estimated count of new customers, whatever
// Axeon typed in for the month, and this report's tap questions. The same
// function backs the "Send now" button on the client's admin page.
import { sendMonthlyReportEmail, sendReportPreviewToOwner, type MonthlyReportEmailInput } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import type { Onboarding } from '@/lib/onboarding';
import {
  attachTrafficToReport,
  getMonthlyReport,
  getProjectDetails,
  listMonthlyReports,
  markReportEmailed,
  markReportPreviewed,
  monthLabel,
  previousReport,
  reportStats,
  setReportSurvey,
  type MonthlyReport,
  type ProjectDetails,
} from '@/lib/projects';
import { effectiveCloseRate, firstEventAt, getTrackingSettings, hasTraffic, monthTraffic, REPORT_TIME_ZONE, type TrackingSettings } from '@/lib/siteStats';
import { feedbackUrl, listFeedback } from '@/lib/feedback';
import { MIN_FIRST_MONTH_DAYS, RAMP_REPORTS, RAMP_SEND_DAY, baselineTotal, isRamp, reportNumber, reportQuestions, trackedDays } from '@/lib/reportPlan';
import { getItemStates } from '@/lib/onboarding';
import { readHowFound } from '@/lib/referrals';

export type AutoReportOutcome =
  | { status: 'sent'; report: MonthlyReport }
  | { status: 'previewed'; report: MonthlyReport }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string; report?: MonthlyReport };

/** Something typed in by Axeon, so the report is worth sending even without website numbers. */
export function reportHasContent(r: MonthlyReport | null): boolean {
  if (!r) return false;
  return (
    r.calls != null ||
    r.leads != null ||
    r.booked != null ||
    r.rank != null ||
    r.reviews != null ||
    r.done.length > 0 ||
    r.next.length > 0 ||
    Boolean(r.note) ||
    Boolean(r.fromYou)
  );
}

/**
 * Should the job email this client for `month`? Pure, so the test suite covers it.
 * Closed portals, clients who switched reports off, and clients who signed up
 * after the month ended are out; so is a month already emailed.
 */
export function autoReportEligibility(
  o: Pick<Onboarding, 'status' | 'clientEmail' | 'createdAt'>,
  settings: { autoReports: boolean },
  month: string,
  existing: Pick<MonthlyReport, 'emailedAt'> | null
): { ok: true } | { ok: false; reason: string } {
  if (o.status === 'closed') return { ok: false, reason: 'closed' };
  if (!settings.autoReports) return { ok: false, reason: 'automatic reports are off for this client' };
  if (!o.clientEmail) return { ok: false, reason: 'no email address' };
  if (existing?.emailedAt) return { ok: false, reason: `the ${monthLabel(month)} report was already emailed` };
  // Signed up after the month was over: nothing to report on.
  const [y, m] = month.split('-').map(Number);
  const monthEnd = Date.UTC(y, m, 1);
  if (new Date(o.createdAt).getTime() >= monthEnd) return { ok: false, reason: `became a client after ${monthLabel(month)}` };
  return { ok: true };
}

/** Day of the month in the report time zone, so "the 3rd" means the 3rd in Iowa. */
export function dayOfMonth(now: number | Date = Date.now(), timeZone: string = REPORT_TIME_ZONE): number {
  return Number(new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone }).format(now));
}

/** How many of the latest emailed reports went by without a single tap (lib/reportPlan.ts). */
export function quietStreak(reports: readonly Pick<MonthlyReport, 'month' | 'emailedAt'>[], answeredMonths: ReadonlySet<string>, before: string): number {
  const emailed = reports
    .filter((r) => r.emailedAt && r.month < before)
    .map((r) => r.month)
    .sort()
    .reverse();
  let n = 0;
  for (const m of emailed) {
    if (answeredMonths.has(m)) break;
    n += 1;
  }
  return n;
}

/** Everything the email needs for one client's report. */
async function buildInput(
  onboarding: Onboarding,
  report: MonthlyReport,
  all: MonthlyReport[],
  details: ProjectDetails,
  settings: TrackingSettings,
  plan: { number: number; asked: string[] }
): Promise<MonthlyReportEmailInput> {
  const month = report.month;
  const ramp = isRamp(plan.number);
  // Ramp reports compare to the baseline from before Axeon, not to a thin last month.
  const prev = ramp ? null : previousReport(all, month);
  return {
    to: onboarding.clientEmail,
    clientName: onboarding.clientName,
    businessName: onboarding.businessName,
    tier: onboarding.tier,
    monthLabel: monthLabel(month),
    month,
    plan,
    baseline: baselineTotal(details),
    prevMonthLabel: prev ? monthLabel(prev.month) : null,
    stats: reportStats(report, prev, details, { avgJobValue: settings.avgJobValue }),
    traffic: hasTraffic(report.traffic) ? report.traffic : null,
    prevTraffic: prev && hasTraffic(prev.traffic) ? prev.traffic : null,
    avgJobValue: settings.avgJobValue,
    rank: report.rank,
    keyword: report.keyword,
    reviews: report.reviews,
    rating: report.rating,
    prevRank: prev?.rank ?? null,
    done: report.done,
    next: report.next,
    fromYou: report.fromYou,
    note: report.note,
    proofUrl: `${APP_ORIGIN}/`,
    feedbackUrl: feedbackUrl({ onboardingId: onboarding.id, kind: 'report', month }),
  };
}

/** The ordinal the owner sees: "report 1", "report 2". */
const sendsOnLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, RAMP_SEND_DAY));
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
};

/**
 * Moves one client's report for `month` one step (see the header). With
 * `force` (the admin button) the checks are skipped and the report goes to the
 * client now, previewed or not, emailed before or not.
 */
export async function sendAutoReport(onboarding: Onboarding, month: string, opts: { force?: boolean; now?: Date } = {}): Promise<AutoReportOutcome> {
  const now = opts.now ?? new Date();
  const settings = await getTrackingSettings(onboarding.id);
  const existing = await getMonthlyReport(onboarding.id, month);
  if (!opts.force) {
    const ok = autoReportEligibility(onboarding, settings, month, existing);
    if (!ok.ok) return { status: 'skipped', reason: ok.reason };
  }

  const [all, details, first] = await Promise.all([listMonthlyReports(onboarding.id), getProjectDetails(onboarding.id), firstEventAt(onboarding.id)]);
  const number = existing?.survey?.number ?? reportNumber(all.filter((r) => r.emailedAt).map((r) => r.month), month);
  const ramp = isRamp(number);

  // A ramp report already previewed: hold, wait for the 3rd, or send.
  if (!opts.force && existing?.previewSentAt && !existing.emailedAt) {
    if (existing.heldAt) return { status: 'skipped', reason: 'held by you; release it on their admin page to send' };
    if (dayOfMonth(now) < RAMP_SEND_DAY) return { status: 'skipped', reason: `previewed; goes to the client on the ${RAMP_SEND_DAY}rd` };
    const plan = existing.survey ?? { number, asked: reportQuestions(number, month) };
    try {
      await sendMonthlyReportEmail(await buildInput(onboarding, existing, all, details, settings, plan));
      await markReportEmailed(existing.id);
      return { status: 'sent', report: { ...existing, emailedAt: now.toISOString() } };
    } catch (err) {
      return { status: 'failed', error: err instanceof Error ? err.message : 'Email failed', report: existing };
    }
  }

  const traffic = await monthTraffic(onboarding.id, month, effectiveCloseRate(settings));
  if (!hasTraffic(traffic) && !reportHasContent(existing)) {
    const reason = settings.siteKey
      ? 'no website numbers for the month and nothing typed in'
      : 'tracking snippet not installed and nothing typed in';
    if (!opts.force) return { status: 'skipped', reason };
    return { status: 'failed', error: `Nothing to send: ${reason}.` };
  }
  // The first month is skipped when tracking covered under two weeks of it: a six-day report reads as a verdict.
  if (!opts.force && number === 1 && hasTraffic(traffic) && !reportHasContent(existing)) {
    const days = trackedDays(month, first);
    if (days < MIN_FIRST_MONTH_DAYS) return { status: 'skipped', reason: `tracking covered ${days} days of ${monthLabel(month)}; the first report is the first full month` };
  }

  // Attach the numbers even when the site sent nothing, so the report says so honestly.
  const report = await attachTrafficToReport(onboarding.id, month, traffic);
  const answered = new Set((await listFeedback(onboarding.id)).filter((f) => f.kind === 'report' && f.month && (f.rating || f.comment || Object.keys(f.answers).length)).map((f) => f.month as string));
  const askFound = !readHowFound(await getItemStates(onboarding.id)).source;
  const plan = existing?.survey ?? { number, asked: reportQuestions(number, month, quietStreak(all, answered, month), { askFound }) };
  await setReportSurvey(report.id, plan);
  const fresh = { ...report, survey: plan };
  const input = await buildInput(onboarding, fresh, all, details, settings, plan);
  try {
    if (ramp && !opts.force) {
      const adminUrl = `${APP_ORIGIN}/admin/onboarding/${onboarding.token}`;
      const previewed = await sendReportPreviewToOwner({ ...input, businessName: onboarding.businessName, preview: { sendsOn: sendsOnLabel(month), adminUrl } });
      if (!previewed) return { status: 'failed', error: 'Preview needs RESEND_API_KEY and ADMIN_EMAIL', report: fresh };
      await markReportPreviewed(report.id);
      return { status: 'previewed', report: { ...fresh, previewSentAt: now.toISOString() } };
    }
    await sendMonthlyReportEmail(input);
    await markReportEmailed(report.id);
    return { status: 'sent', report: { ...fresh, emailedAt: now.toISOString() } };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'Email failed', report: fresh };
  }
}

export const displayName = (o: Pick<Onboarding, 'businessName' | 'clientName' | 'clientEmail'>) =>
  o.businessName || o.clientName || o.clientEmail;

export { RAMP_REPORTS };
