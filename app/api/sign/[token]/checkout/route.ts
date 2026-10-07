// app/api/sign/[token]/checkout/route.ts
// After signing: open Stripe Checkout for the setup fee + monthly plan. The
// webhook marks the agreement paid and starts onboarding.
import { NextResponse } from 'next/server';
import { TIER_LABELS } from '@/data/onboardingItems';
import { agreementUrl, getAgreement } from '@/lib/agreements';
import { createAgreementCheckout } from '@/lib/billing';
import { clientIp, notFound, rateLimited } from '@/lib/welcomeApi';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (rateLimited(`sign-pay:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }
  const a = await getAgreement(token).catch(() => null);
  if (!a) return notFound();
  if (a.status === 'sent') return NextResponse.json({ ok: false, error: 'Sign the agreement first.' }, { status: 400 });
  if (a.status !== 'signed') return NextResponse.json({ ok: false, error: 'This agreement is already paid.' }, { status: 400 });
  try {
    const { url } = await createAgreementCheckout({
      token: a.token,
      number: a.number,
      clientEmail: a.clientEmail,
      contactName: a.contactName || a.signedName || a.signerName,
      businessName: a.legalName,
      tier: a.tier,
      planLabel: TIER_LABELS[a.tier],
      setupCents: a.setupCents,
      monthlyCents: a.monthlyCents,
      cancelUrl: agreementUrl(a.token),
    });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error('[sign-checkout]', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'Could not open checkout. Call us at (515) 493-8017.' }, { status: 502 });
  }
}
