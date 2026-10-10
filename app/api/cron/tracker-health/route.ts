// app/api/cron/tracker-health/route.ts
// Daily (vercel.json): emails the owner when a client's website tracker has
// gone quiet for a week (lib/trackerHealth.ts), and when a client's own marks
// say few leads are booking (lib/leadHealth.ts).
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { checkTrackers } from '@/lib/trackerHealth';
import { checkCloseRates } from '@/lib/leadHealth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });
  try {
    const result = await checkTrackers();
    if (result.skipped.length) console.error('[cron:tracker-health] skipped', result.skipped);
    const rates = await checkCloseRates();
    if (rates.skipped.length) console.error('[cron:tracker-health] close-rate skipped', rates.skipped);
    return NextResponse.json({
      quiet: result.quiet.length,
      alerted: result.alerted,
      skipped: result.skipped.length,
      lowCloseRate: rates.low.length,
      lowCloseAlerted: rates.alerted,
    });
  } catch (err) {
    console.error('[cron:tracker-health] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
