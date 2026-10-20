// app/api/proof/v2/route.ts
// The signed-in AxeonPROOF v2 client: drop a pin, approve a layout or copy,
// approve staging or ask for changes, sign off the front-desk routine, set the
// practice manager for the summaries (lib/proofV2Actions.ts runClientAction).
import { NextResponse } from 'next/server';
import { jsonError, readBody } from '@/lib/billingApi';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';
import { runClientAction } from '@/lib/proofV2Actions';
import { clientIp, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  if (rateLimited(`proofv2:${account.id}:${clientIp(req)}`, 60, 10 * 60 * 1000)) return NextResponse.json({ error: 'Slow down a little and try again.' }, { status: 429 });
  try {
    const onboarding = await getOnboardingById(account.onboardingId);
    if (!onboarding) throw new Error('Please sign in again');
    await runClientAction(onboarding, await readBody(req));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
