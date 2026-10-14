// app/api/proof/leads/stage/route.ts
// POST { id, action } from the signed-in client's Leads tab: Quote sent, Booked,
// Job done or Not a fit on one of their form leads. Moves the stage and starts or
// stops the follow-ups that go with it (lib/leadStages.ts). Only the client's own
// leads: applyLeadStage looks the id up with their onboarding id.
import { NextResponse } from 'next/server';
import { readBody } from '@/lib/billingApi';
import { errText } from '@/lib/dbRows';
import { applyLeadStage, LeadNotFoundError } from '@/lib/leadStages';
import { getSignedInClient } from '@/lib/proofServer';
import { parseStageRequest } from '@/lib/sequenceShared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  let parsed: ReturnType<typeof parseStageRequest>;
  try {
    parsed = parseStageRequest(await readBody(req));
  } catch (err) {
    // parseStageRequest's own messages are written for the client.
    return bad(errText(err));
  }
  const { id, action } = parsed;
  try {
    // A follow-up failure is not an error here: the stage is saved and the result carries a warning (200).
    const result = await applyLeadStage(account.onboardingId, id, action);
    return NextResponse.json({ ok: true, id, ...result });
  } catch (err) {
    if (err instanceof LeadNotFoundError) return bad(err.message);
    // Anything else (a database error) is logged, never shown.
    console.error('[proof/leads/stage]', account.onboardingId, id, action, errText(err));
    return bad('Could not save that. Please try again.');
  }
}
