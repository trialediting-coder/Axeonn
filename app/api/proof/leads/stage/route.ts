// app/api/proof/leads/stage/route.ts
// POST { id, action } from the signed-in client's Leads tab: Quote sent, Booked,
// Job done or Not a fit on one of their form leads. Moves the stage and starts or
// stops the follow-ups that go with it (lib/leadStages.ts). Only the client's own
// leads: applyLeadStage looks the id up with their onboarding id.
import { NextResponse } from 'next/server';
import { jsonError, readBody } from '@/lib/billingApi';
import { applyLeadStage } from '@/lib/leadStages';
import { getSignedInClient } from '@/lib/proofServer';
import { parseStageRequest } from '@/lib/sequenceShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const { id, action } = parseStageRequest(await readBody(req));
    const result = await applyLeadStage(account.onboardingId, id, action);
    return NextResponse.json({ ok: true, id, ...result });
  } catch (err) {
    return jsonError(err);
  }
}
