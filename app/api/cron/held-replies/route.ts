// app/api/cron/held-replies/route.ts
// Every 15 minutes (vercel.json): sends inbox replies that were typed during
// quiet hours, once their 8 am has come (lib/inboxReply.ts).
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`; an
// external pinger can use the same header. POST works too, for a manual run.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { errText } from '@/lib/dbRows';
import { sendDueHeldReplies } from '@/lib/inboxReply';
import { redactDigits } from '@/lib/sequenceSchedule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });
  try {
    return NextResponse.json(await sendDueHeldReplies());
  } catch (err) {
    console.error('[cron:held-replies]', redactDigits(errText(err)));
    return NextResponse.json({ error: 'held replies failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
