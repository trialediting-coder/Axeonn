// app/api/admin/billing/subscriptions/route.ts
// Admin-only: mint a Checkout link that starts a monthly plan: a seeded per-tier
// plan / the $49 basics plan (planKey), or an ad hoc per-client amount. Renewals, retries, and cancellations flow through the webhook.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createCarePlanCheckout, isPlanKey } from '@/lib/billing';
import { dollarsToCents } from '@/lib/billingMath';
import { jsonError, optionalString, readBody, requireEmail } from '@/lib/billingApi';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await readBody(req);
    if (body.planKey !== undefined && body.planKey !== '' && !isPlanKey(body.planKey)) {
      throw new Error('Unknown plan');
    }
    const result = await createCarePlanCheckout({
      email: requireEmail(body.email),
      name: optionalString(body.name),
      planKey: isPlanKey(body.planKey) ? body.planKey : undefined,
      monthlyAmountCents:
        body.monthlyAmount === undefined || body.monthlyAmount === '' ? undefined : dollarsToCents(body.monthlyAmount),
      planName: optionalString(body.planName),
      description: optionalString(body.description),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
