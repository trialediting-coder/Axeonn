// app/api/proof/billing/route.ts
// POST from the signed-in client's Billing tab: opens Stripe's hosted billing
// portal for their customer and returns the one-time link. The portal is where
// they change the card, see invoices and download receipts; we keep no payment
// screens of our own. Comes back to the Billing tab when they are done.
import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/billingApi';
import { createPortalLink } from '@/lib/billing';
import { APP_ORIGIN } from '@/lib/hostRouting';
import { getOnboardingById } from '@/lib/onboarding';
import { getSignedInClient } from '@/lib/proofServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const account = await getSignedInClient();
  if (!account) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
  try {
    const onboarding = await getOnboardingById(account.onboardingId);
    if (!onboarding) throw new Error('Please sign in again');
    const url = await createPortalLink(onboarding.clientEmail, `${APP_ORIGIN}/?tab=billing`);
    return NextResponse.json({ url });
  } catch (err) {
    return jsonError(err);
  }
}
