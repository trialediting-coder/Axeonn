// app/api/cron/monthly-reports/route.ts
// Monthly job (vercel.json, 1st of the month 14:00 UTC = 8am/9am Central):
// emails every open client last month's report with their website numbers
// (lib/autoReports.ts), then emails the owner a digest of who got one and who
// was skipped. Also prunes raw tracking events past the retention window.
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`.
// POST works too, optionally with { "month": "2026-09" } to run a past month.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { sendMonthlyReportsDigest } from '@/lib/email';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { listOnboardings } from '@/lib/onboarding';
import { displayName, sendAutoReport } from '@/lib/autoReports';
import { monthLabel } from '@/lib/projects';
import { isValidMonth, monthOf, previousMonth, pruneOldEvents } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function run(req: Request, month: string) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });

  const onboardings = await listOnboardings(500);
  const sent: string[] = [];
  const skipped: { name: string; reason: string }[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const o of onboardings) {
    const name = displayName(o);
    try {
      const outcome = await sendAutoReport(o, month);
      if (outcome.status === 'sent') sent.push(name);
      else if (outcome.status === 'skipped') skipped.push({ name, reason: outcome.reason });
      else failed.push({ name, error: outcome.error });
    } catch (err) {
      failed.push({ name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  let pruned = 0;
  try {
    pruned = await pruneOldEvents();
  } catch (err) {
    console.error('[cron:monthly-reports] prune failed', err instanceof Error ? err.message : err);
  }

  if (sent.length || failed.length) {
    try {
      await sendMonthlyReportsDigest({ monthLabel: monthLabel(month), sent, skipped, failed, adminUrl: `${APP_ORIGIN}/admin/onboarding` });
    } catch (err) {
      console.error('[cron:monthly-reports] digest failed', err instanceof Error ? err.message : err);
    }
  }
  if (failed.length) console.error('[cron:monthly-reports] failures', failed);
  return NextResponse.json({ month, checked: onboardings.length, sent, skipped, failed, pruned });
}

export async function GET(req: Request) {
  return run(req, previousMonth(monthOf()));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { month?: unknown };
  const month = isValidMonth(body.month) ? body.month : previousMonth(monthOf());
  return run(req, month);
}
