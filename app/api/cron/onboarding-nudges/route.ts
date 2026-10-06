// app/api/cron/onboarding-nudges/route.ts
// Daily job (vercel.json, 15:00 UTC = 10am Central): sends the day 1, 3 and 7
// onboarding reminders and refreshes every open portal's Airtable row. Replaces
// the n8n "Axeon Portal Sync" workflow, so nothing outside the site is needed.
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET` when
// CRON_SECRET is set in the project. POST works too, for a manual run.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { listOnboardings, nudgeStepDue } from '@/lib/onboarding';
import { sendNudgeFor } from '@/lib/onboardingFulfillment';
import { afterOnboardingChange } from '@/lib/onboardingSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_NUDGES_PER_RUN = 40;

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });

  const onboardings = await listOnboardings(500);
  const now = Date.now();
  const nudged: { token: string; step: number }[] = [];
  const failed: { token: string; error: string }[] = [];
  let synced = 0;

  for (const o of onboardings) {
    if (o.status === 'closed') continue;
    const step = nudgeStepDue(o, o.progress, now);
    if (step && nudged.length < MAX_NUDGES_PER_RUN) {
      try {
        await sendNudgeFor(o);
        nudged.push({ token: o.token.slice(0, 4), step });
      } catch (err) {
        failed.push({ token: o.token.slice(0, 4), error: err instanceof Error ? err.message : String(err) });
      }
    }
    // Keep Airtable fresh for every open portal, nudged or not. Completed ones are
    // already final in Airtable, so only refresh them if this run changed them.
    if (o.status === 'active' || step) {
      await afterOnboardingChange(o.token);
      synced += 1;
    }
  }

  if (failed.length) console.error('[cron:onboarding-nudges] failures', failed);
  return NextResponse.json({ checked: onboardings.length, nudged, failed: failed.length, synced });
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
