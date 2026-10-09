// app/api/cron/tracker-health/route.ts
// Daily (vercel.json): emails the owner when a client's website tracker has
// gone quiet for a week. See lib/trackerHealth.ts.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { checkTrackers } from '@/lib/trackerHealth';

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
    return NextResponse.json({ quiet: result.quiet.length, alerted: result.alerted, skipped: result.skipped.length });
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
