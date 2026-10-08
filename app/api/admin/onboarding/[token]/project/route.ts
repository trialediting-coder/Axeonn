// app/api/admin/onboarding/[token]/project/route.ts
// Admin-only, per client: project dates and baseline, Project Updates and
// Monthly Reports. Posting an update or report emails the client; both also
// show in their AxeonPROOF dashboard.
//   GET                                   { details, updates, reports }
//   PUT    { ...details }                 save kickoff, target launch, baseline
//   POST   { kind: 'update', ... }        post an update (emails the client)
//   POST   { kind: 'report', send, ... }  save a month's report (emails when send !== false)
//   POST   { kind: 'tracking', ... }      website address, close rate, automatic reports on/off
//   POST   { kind: 'auto-report', month } build and email the month's report now (lib/autoReports.ts)
//   DELETE { kind, id }                   remove an update or report
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import { sendMonthlyReportEmail, sendProjectUpdateEmail } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { getOnboardingByToken, type Onboarding } from '@/lib/onboarding';
import { sendAutoReport } from '@/lib/autoReports';
import { getTrackingSettings, hasTraffic, isValidMonth, setTrackingSettings, trackingOverview, validateAvgJobValue, validateCloseRate, validateCloseRateMode, validateSiteUrl } from '@/lib/siteStats';
import {
  createProjectUpdate,
  deleteMonthlyReport,
  deleteProjectUpdate,
  getProjectDetails,
  listMonthlyReports,
  listProjectUpdates,
  markReportEmailed,
  markUpdateEmailed,
  monthLabel,
  previousReport,
  reportStats,
  saveMonthlyReport,
  setProjectDetails,
  validateDetailsInput,
  validateReportInput,
  validateUpdateInput,
} from '@/lib/projects';

export const runtime = 'nodejs';

const PROOF_URL = `${APP_ORIGIN}/`;
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

async function load(token: string): Promise<Onboarding> {
  const onboarding = await getOnboardingByToken(token);
  if (!onboarding) throw new Error('Onboarding not found');
  return onboarding;
}

async function present(onboardingId: number) {
  const [details, updates, reports, tracking] = await Promise.all([
    getProjectDetails(onboardingId),
    listProjectUpdates(onboardingId),
    listMonthlyReports(onboardingId),
    trackingOverview(onboardingId),
  ]);
  return { details, updates, reports, tracking };
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    return NextResponse.json(await present(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    await setProjectDetails(onboarding.id, validateDetailsInput(await readBody(req)));
    return NextResponse.json(await present(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    let emailError: string | null = null;

    if (body.kind === 'update') {
      const update = await createProjectUpdate(onboarding.id, validateUpdateInput(body));
      try {
        await sendProjectUpdateEmail({ to: onboarding.clientEmail, clientName: onboarding.clientName, ...update, proofUrl: PROOF_URL });
        await markUpdateEmailed(update.id);
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Email failed';
      }
    } else if (body.kind === 'report') {
      const report = await saveMonthlyReport(onboarding.id, validateReportInput(body));
      if (body.send !== false) {
        const [details, all, settings] = await Promise.all([getProjectDetails(onboarding.id), listMonthlyReports(onboarding.id), getTrackingSettings(onboarding.id)]);
        const prev = previousReport(all, report.month);
        try {
          await sendMonthlyReportEmail({
            to: onboarding.clientEmail,
            clientName: onboarding.clientName,
            businessName: onboarding.businessName,
            tier: onboarding.tier,
            monthLabel: monthLabel(report.month),
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
            proofUrl: PROOF_URL,
          });
          await markReportEmailed(report.id);
        } catch (err) {
          emailError = err instanceof Error ? err.message : 'Email failed';
        }
      }
    } else if (body.kind === 'tracking') {
      await setTrackingSettings(onboarding.id, {
        siteUrl: validateSiteUrl(body.siteUrl),
        closeRateMode: validateCloseRateMode(body.closeRateMode),
        closeRate: validateCloseRate(body.closeRate),
        autoReports: body.autoReports !== false,
        avgJobValue: validateAvgJobValue(body.avgJobValue),
      });
    } else if (body.kind === 'auto-report') {
      if (!isValidMonth(body.month)) throw new Error('Pick the month to send');
      const outcome = await sendAutoReport(onboarding, body.month, { force: true });
      if (outcome.status === 'failed') emailError = outcome.error;
    } else {
      throw new Error('Unknown kind');
    }
    return NextResponse.json({ ...(await present(onboarding.id)), emailError });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (!(await requireAdmin(req))) return unauthorized();
  try {
    const onboarding = await load((await ctx.params).token);
    const body = await readBody(req);
    const id = Number(body.id);
    if (!Number.isInteger(id)) throw new Error('id is required');
    if (body.kind === 'update') await deleteProjectUpdate(onboarding.id, id);
    else if (body.kind === 'report') await deleteMonthlyReport(onboarding.id, id);
    else throw new Error('Unknown kind');
    return NextResponse.json(await present(onboarding.id));
  } catch (err) {
    return jsonError(err);
  }
}
