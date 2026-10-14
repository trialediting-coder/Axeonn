// app/api/cron/sequences/route.ts
// Every 15 minutes (vercel.json): during the first week of a quarter, kicks off
// the past-customer check-in; then sends whatever follow-up steps are due, at
// most 200 per tick, inside a 45-second budget (lib/sequences.ts processDueRuns).
// Anything not reached is released for the next tick, never dropped.
//
// Vercel Cron calls this with GET and `Authorization: Bearer $CRON_SECRET`; an
// external pinger can use the same header. POST works too, for a manual run.
// Returns 200 with the counts, or 500 with `errors` when something threw (the
// due sends are still attempted after a failed kick-off).
import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { mayBeInReactivationWindow } from '@/lib/sequenceSchedule';
import { kickOffReactivation, processDueRuns, type ProcessCounts } from '@/lib/sequences';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const KICKOFF_BUDGET_MS = 10_000;
const TOTAL_BUDGET_MS = 45_000;

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ skipped: 'no database' });

  const started = Date.now();
  const errors: string[] = [];
  let reactivation = { clients: 0, runs: 0 };
  // The engine guards once per quarter per client, so repeated ticks are safe;
  // the gate only avoids the per-client lookup on the ~350 days it cannot match.
  if (mayBeInReactivationWindow(new Date())) {
    try {
      reactivation = await kickOffReactivation(new Date(), started + KICKOFF_BUDGET_MS);
    } catch (err) {
      // The due sends below must still go out.
      console.error('[cron:sequences] reactivation kick-off', message(err));
      errors.push(`reactivation: ${message(err)}`);
    }
  }
  let counts: ProcessCounts = { picked: 0, sent: 0, held: 0, done: 0, stopped: 0, failed: 0, skipped: 0, leftover: 0 };
  try {
    counts = await processDueRuns({ deadline: started + TOTAL_BUDGET_MS });
  } catch (err) {
    console.error('[cron:sequences] processDueRuns', message(err));
    errors.push(`process: ${message(err)}`);
  }
  if (counts.failed || counts.leftover) console.error('[cron:sequences]', counts);
  return NextResponse.json(
    { reactivation, ...counts, ms: Date.now() - started, ...(errors.length ? { errors } : {}) },
    { status: errors.length ? 500 : 200 }
  );
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
