// app/api/proof/upgrade/route.ts
// POST { tier } from the signed-in client's dashboard: "move me to this plan".
// Stored and emailed to the owner; nothing is billed (lib/upgrades.ts).
import { NextResponse } from 'next/server';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';
import { requestUpgrade } from '@/lib/upgrades';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const onboarding = await getOnboardingById(account.onboardingId);
    if (!onboarding) throw new Error('Please sign in again');
    const body = await readBody(req);
    const request = await requestUpgrade(onboarding, body.tier);
    return NextResponse.json({ ok: true, ...request });
  } catch (err) {
    return jsonError(err);
  }
}
