// app/api/cron/client-notes/route.ts
// Daily (vercel.json): the day-30 and day-90 notes from the owner, each sent
// once per client. See lib/clientNotes.ts.
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { sendClientNotes } from '@/lib/clientNotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });
  try {
    const result = await sendClientNotes();
    if (result.skipped.length) console.error('[cron:client-notes] skipped', result.skipped);
    return NextResponse.json({ sent: result.sent, skipped: result.skipped.length });
  } catch (err) {
    console.error('[cron:client-notes] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
