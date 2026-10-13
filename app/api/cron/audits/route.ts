// app/api/cron/audits/route.ts
// Daily job (vercel.json, 14:15 UTC). For every open client with scheduled
// audits on, a kickoff date, a city and a Main keyword: run a `schedule`
// audit when the last one is older than their interval (lib/audits.ts). Daily
// with an interval check means a failed day simply retries tomorrow. The owner
// gets one email on any day something failed.
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`.
import { NextResponse } from 'next/server';
import { auditsWithPendingReviews, completePendingReviews, getAuditSettings, lastScheduledAt, monthSpendUsd, monthlyCapUsd, runAudit, subjectForOnboarding } from '@/lib/audits';
import { auditDue } from '@/lib/auditShared';
import { displayName } from '@/lib/autoReports';
import { isDatabaseConfigured } from '@/lib/db';
import { sendAuditFailuresNotification } from '@/lib/email';
import { listOnboardings } from '@/lib/onboarding';
import { getProjectDetails } from '@/lib/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONCURRENCY = 2;

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });

  const onboardings = await listOnboardings(500);
  const ran: string[] = [];
  const deepRan: string[] = [];
  // Deep audits whose reviews task was still running last time: collect them now (free).
  const reviewsCollected: number[] = [];
  for (const id of await auditsWithPendingReviews()) {
    try {
      const a = await completePendingReviews(id);
      if (a && !a.errors.reviews) reviewsCollected.push(id);
    } catch (err) {
      console.error('[cron:audits] reviews fetch failed', id, err instanceof Error ? err.message : err);
    }
  }
  const skipped: { name: string; reason: string }[] = [];
  const failed: { name: string; error: string; token: string }[] = [];
  const capUsd = monthlyCapUsd();

  const one = async (o: (typeof onboardings)[number]) => {
    const name = displayName(o);
    try {
      if (o.status === 'closed') return skipped.push({ name, reason: 'closed' });
      const settings = await getAuditSettings(o.id);
      if (!settings.enabled) return skipped.push({ name, reason: 'scheduled audits are off' });
      if (!settings.city || !settings.keyword) return skipped.push({ name, reason: 'no city or keyword set' });
      if (!(await getProjectDetails(o.id)).kickoffAt) return skipped.push({ name, reason: 'no kickoff date' });
      if (!auditDue(await lastScheduledAt(o.id), settings.intervalDays)) return skipped.push({ name, reason: 'not due yet' });
      if ((await monthSpendUsd()) >= capUsd) return skipped.push({ name, reason: `monthly audit budget ($${capUsd}) used up` });
      // Deep at kickoff and every deep_refresh_days; quick in between (spec 2026-10-13 §5).
      const deep = !settings.lastDeepAt || Date.now() - Date.parse(settings.lastDeepAt) >= settings.deepRefreshDays * 86_400_000;
      await runAudit(subjectForOnboarding(o, settings), { trigger: 'schedule', onboardingId: o.id, grid: settings.grid, deep });
      (deep ? deepRan : ran).push(name);
    } catch (err) {
      failed.push({ name, error: err instanceof Error ? err.message : String(err), token: o.token });
    }
  };

  for (let i = 0; i < onboardings.length; i += CONCURRENCY) {
    await Promise.all(onboardings.slice(i, i + CONCURRENCY).map(one));
  }

  if (failed.length) {
    console.error('[cron:audits] failures', failed);
    try {
      await sendAuditFailuresNotification({ failed });
    } catch (err) {
      console.error('[cron:audits] failure email failed', err instanceof Error ? err.message : err);
    }
  }
  return NextResponse.json({ checked: onboardings.length, ran, deepRan, reviewsCollected, skipped, failed: failed.map(({ name, error }) => ({ name, error })), spentUsd: await monthSpendUsd(), capUsd });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
