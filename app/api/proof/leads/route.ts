// app/api/proof/leads/route.ts
// POST { id, outcome } from the signed-in client's AxeonPROOF dashboard: marks
// one of their leads as "won" (became a customer), "lost", or null to clear.
// Only contact clicks on their own site can be marked (lib/siteStats.ts).
import { NextResponse } from 'next/server';
import { jsonError, readBody } from '@/lib/billingApi';
import { isLeadOutcome } from '@/lib/projectsShared';
import { getSignedInClient } from '@/lib/proofServer';
import { setLeadOutcome } from '@/lib/siteStats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const body = await readBody(req);
    const id = Number(body.id);
    const outcome = body.outcome == null ? null : body.outcome;
    if (!Number.isInteger(id) || id <= 0) throw new Error('Which lead?');
    if (outcome !== null && !isLeadOutcome(outcome)) throw new Error('Mark a lead as a customer or not');
    const ok = await setLeadOutcome(account.onboardingId, id, outcome);
    if (!ok) throw new Error('That lead is not on your site');
    return NextResponse.json({ ok: true, id, outcome });
  } catch (err) {
    return jsonError(err);
  }
}
