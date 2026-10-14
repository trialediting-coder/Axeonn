// app/api/admin/contacts/backfill/route.ts
// POST { onboardingId? }: build the inbox from every call, text, (non-test)
// form and follow-up email that already exists (lib/contacts.ts backfill), for
// one client or all of them. Idempotent: run it again and nothing doubles. Sends
// nothing to anyone and starts or stops no follow-up (replay mode). It stops
// starting new rows well inside maxDuration; done: false (some result has
// complete: false) means run it again to finish.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { backfill, backfillAll } from '@/lib/contacts';
import { errText } from '@/lib/dbRows';
import { redactDigits } from '@/lib/sequenceSchedule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Leaves a minute of maxDuration for the row in flight and the response. */
const BUDGET_MS = 240_000;

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const deadline = Date.now() + BUDGET_MS;
  const body = (await req.json().catch(() => null)) as { onboardingId?: unknown } | null;
  const rawId = body?.onboardingId;
  const id = rawId === undefined || rawId === null ? null : Number(rawId);
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return NextResponse.json({ error: 'onboardingId must be a client id' }, { status: 400 });
  try {
    const results = id ? [await backfill(id, { deadline })] : await backfillAll({ deadline });
    return NextResponse.json({ ok: true, done: results.every((r) => r.complete), results });
  } catch (err) {
    console.error('[admin/contacts/backfill]', redactDigits(errText(err)).slice(0, 300));
    return NextResponse.json({ error: 'Backfill failed; see the server log. It is safe to run again.' }, { status: 500 });
  }
}
