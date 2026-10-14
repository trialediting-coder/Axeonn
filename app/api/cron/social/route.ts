// app/api/cron/social/route.ts
// Hourly (vercel.json): publishes due AxeonGROWTH reels and, for posts whose
// numbers are a day old, refreshes Instagram reach and views (lib/social.ts).
// Auth like /api/cron/sequences: `Authorization: Bearer $CRON_SECRET`.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { metaUnavailable } from '@/lib/meta';
import { secretRedact } from '@/lib/metaShared';
import { runSocialCron } from '@/lib/social';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Up to five posts and 25 insight refreshes. Graph calls are capped at 10 s (publish calls 40 s);
// a container still processing is checked again next run, never waited on here. lib/social.ts
// starts no post after CRON_STOP_AFTER_MS (280 s) unless it still fits, and releases the rest.
export const maxDuration = 300;

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const unavailable = metaUnavailable();
  if (unavailable) return unavailable;
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });
  try {
    return NextResponse.json(await runSocialCron());
  } catch (err) {
    console.error('[cron:social] failed', secretRedact(errText(err)));
    return NextResponse.json({ error: 'social cron failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
