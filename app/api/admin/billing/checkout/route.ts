// app/api/admin/billing/checkout/route.ts
// Admin-only: mint a Stripe-hosted Checkout link for a project deposit, balance,
// or full payment. The returned URL is what gets sent to the client.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { ADDON_KEYS, TIER_KEYS, createProjectCheckout, isCatalogKey, type CatalogKey } from '@/lib/billing';
import { isPaymentKind } from '@/lib/billingMath';
import { jsonError, optionalString, readBody, requireEmail } from '@/lib/billingApi';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await readBody(req);
    const email = requireEmail(body.email);
    const tier = body.tier;
    if (!isCatalogKey(tier) || !TIER_KEYS.includes(tier)) throw new Error('Unknown tier');
    const kind = body.kind;
    if (!isPaymentKind(kind)) throw new Error('kind must be deposit, balance, or full');

    const rawAddOns: unknown[] = Array.isArray(body.addOns) ? body.addOns : [];
    const addOns: CatalogKey[] = [];
    for (const key of rawAddOns) {
      if (!isCatalogKey(key) || !ADDON_KEYS.includes(key)) throw new Error('Unknown add-on');
      addOns.push(key);
    }

    const result = await createProjectCheckout({
      email,
      name: optionalString(body.name),
      tier,
      kind,
      addOns,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
