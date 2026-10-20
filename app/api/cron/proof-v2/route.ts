// app/api/cron/proof-v2/route.ts
// Hourly (vercel.json "0 * * * *"). For AxeonPROOF v2 clients only:
//   1. The monthly executive summary: on the 1st from 8:00 AM the client's time
//      (their tracked line's time zone, else Central), a no-password link
//      (lib/proofSummaryLink.ts) by email to the owner and the practice manager,
//      and by text to the owner's cell from their tracked line when texting is approved.
//   2. The practice manager's weekly front-desk summary, Mondays from 8 AM local.
//   3. Due texts of the reactivation (DBR) sprint, outside quiet hours.
// Nothing is sent outside production (lib/proofV2.ts v2SendsEnabled); a month
// or week is recorded as sent only once something actually went out.
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { getOnboardingById } from '@/lib/onboarding';
import { sendExecSummaryEmail, sendWeeklySummaryEmail } from '@/lib/email';
import { getLine, sendOwnerAlert } from '@/lib/phoneLines';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { monthLabel } from '@/lib/projectsShared';
import { signSummaryToken, summaryUrl } from '@/lib/proofSummaryLink';
import { loadV2View, monthSummary, patchV2, processDbrSends, timeZoneFor, v2Onboardings, v2SendsEnabled, getV2Settings } from '@/lib/proofV2';
import { monthlySummaryDue, weeklySummaryDue } from '@/lib/proofV2Shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });
  if (!v2SendsEnabled()) return NextResponse.json({ skipped: 'sends off (not production, or PROOF_V2_SENDS=off)' });

  const deadline = Date.now() + 240_000;
  const now = new Date();
  const monthly: string[] = [];
  const weekly: string[] = [];
  const failed: { id: number; error: string }[] = [];

  for (const id of await v2Onboardings()) {
    if (Date.now() > deadline) break;
    try {
      const o = await getOnboardingById(id);
      if (!o || o.proofVersion !== 2) continue;
      const [tz, s] = await Promise.all([timeZoneFor(o.id), getV2Settings(o.id)]);

      const month = monthlySummaryDue(now, tz, s.summaries?.lastMonth);
      if (month) {
        const sum = await monthSummary(o, month);
        let sent = 0;
        const recipients = [
          { to: o.clientEmail, recipient: 'owner' as const },
          ...(s.manager?.email && s.manager.email !== o.clientEmail.toLowerCase() ? [{ to: s.manager.email, recipient: 'manager' as const }] : []),
        ];
        for (const r of recipients) {
          const url = summaryUrl(signSummaryToken({ onboardingId: o.id, month, recipient: r.recipient }));
          if (await sendExecSummaryEmail({ ...sum, to: r.to, businessName: o.businessName, monthLabel: monthLabel(month), url, industry: o.industry })) sent += 1;
        }
        // The owner's cell gets the link by text from their own tracked line (owner alerts never enter the leads inbox).
        const line = await getLine(o.id);
        if (line && line.smsStatus === 'ready') {
          const url = summaryUrl(signSummaryToken({ onboardingId: o.id, month, recipient: 'owner' }));
          const r = await sendOwnerAlert(line, `Your ${monthLabel(month)} summary from Axeon is ready (no password): ${url}`).catch(() => ({ sent: false }));
          if (r.sent) sent += 1;
        }
        if (sent) {
          await patchV2(o.id, { summaries: { ...(s.summaries ?? {}), lastMonth: month } });
          monthly.push(`${o.businessName ?? o.clientEmail} (${month})`);
        }
      }

      const week = weeklySummaryDue(now, tz, s.summaries?.lastWeek);
      if (week) {
        const view = await loadV2View(o, { now });
        const to = s.manager?.email || o.clientEmail;
        const ok = await sendWeeklySummaryEmail({ to, businessName: o.businessName, managerName: s.manager?.name ?? null, waiting: view.frontDesk.waiting, ...view.frontDesk.week, url: `${APP_ORIGIN}/?tab=leads`, industry: o.industry });
        if (ok) {
          const latest = await getV2Settings(o.id);
          await patchV2(o.id, { summaries: { ...(latest.summaries ?? {}), lastWeek: week } });
          weekly.push(o.businessName ?? o.clientEmail);
        }
      }
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const dbr = await processDbrSends({ now, deadline }).catch((err) => {
    failed.push({ id: 0, error: `dbr: ${err instanceof Error ? err.message : String(err)}` });
    return null;
  });
  if (failed.length) console.error('[cron:proof-v2] failures', failed);
  return NextResponse.json({ monthly, weekly, dbr, failed });
}
