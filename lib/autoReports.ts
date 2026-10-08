// lib/autoReports.ts
// The automatic monthly report. On the 1st of each month (app/api/cron/
// monthly-reports) every open client whose reports are switched on gets last
// month's numbers by email: website visits and visitors, which buttons were
// clicked, how many people reached out (calls, texts, emails, forms, bookings)
// and an estimated count of new customers from that. Anything Axeon typed into
// the month's report in the admin (calls, leads, booked jobs, what we did, next
// month's plan) rides along in the same email. The same function backs the
// "Send now" button on the client's admin page.
import { sendMonthlyReportEmail } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import type { Onboarding } from '@/lib/onboarding';
import {
  attachTrafficToReport,
  getMonthlyReport,
  getProjectDetails,
  listMonthlyReports,
  markReportEmailed,
  monthLabel,
  previousReport,
  reportStats,
  type MonthlyReport,
} from '@/lib/projects';
import { effectiveCloseRate, getTrackingSettings, hasTraffic, monthTraffic } from '@/lib/siteStats';

export type AutoReportOutcome =
  | { status: 'sent'; report: MonthlyReport }
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

/**
 * Builds and emails one client's report for `month`. With `force` (the admin
 * button) the eligibility checks are skipped and an already-emailed month is
 * sent again; without it, a client with no website numbers and nothing typed in
 * is skipped rather than sent an empty page.
 */
export async function sendAutoReport(onboarding: Onboarding, month: string, opts: { force?: boolean } = {}): Promise<AutoReportOutcome> {
  const settings = await getTrackingSettings(onboarding.id);
  const existing = await getMonthlyReport(onboarding.id, month);
  if (!opts.force) {
    const ok = autoReportEligibility(onboarding, settings, month, existing);
    if (!ok.ok) return { status: 'skipped', reason: ok.reason };
  }

  const traffic = await monthTraffic(onboarding.id, month, effectiveCloseRate(settings));
  if (!hasTraffic(traffic) && !reportHasContent(existing)) {
    const reason = settings.siteKey
      ? 'no website numbers for the month and nothing typed in'
      : 'tracking snippet not installed and nothing typed in';
    if (!opts.force) return { status: 'skipped', reason };
    return { status: 'failed', error: `Nothing to send: ${reason}.` };
  }

  // Attach the numbers even when the site sent nothing, so the report says so honestly.
  const report = await attachTrafficToReport(onboarding.id, month, traffic);
  const [details, all] = await Promise.all([getProjectDetails(onboarding.id), listMonthlyReports(onboarding.id)]);
  const prev = previousReport(all, month);
  try {
    await sendMonthlyReportEmail({
      to: onboarding.clientEmail,
      clientName: onboarding.clientName,
      businessName: onboarding.businessName,
      tier: onboarding.tier,
      monthLabel: monthLabel(month),
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
    });
    await markReportEmailed(report.id);
    return { status: 'sent', report: { ...report, emailedAt: new Date().toISOString() } };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'Email failed', report };
  }
}

export const displayName = (o: Pick<Onboarding, 'businessName' | 'clientName' | 'clientEmail'>) =>
  o.businessName || o.clientName || o.clientEmail;
