// app/api/proof/email-request/route.ts
// POST { kind, detail } from the signed-in client's Email tab: add a mailbox,
// someone is locked out, or anything else. Stored and emailed to the owner
// (lib/businessEmail.ts); nothing changes in Google until Axeon does it.
import { NextResponse } from 'next/server';
import { jsonError, readBody } from '@/lib/billingApi';
import { addEmailRequest } from '@/lib/businessEmail';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const onboarding = await getOnboardingById(account.onboardingId);
    if (!onboarding) throw new Error('Please sign in again');
    const request = await addEmailRequest(onboarding, await readBody(req));
    return NextResponse.json({ ok: true, request });
  } catch (err) {
    return jsonError(err);
  }
}
