// app/api/admin/billing/portal/route.ts
// Admin-only: create a one-time Customer Portal link for a client (invoices,
// payment method, billing details). Clients can also self-serve through the
// portal's hosted login page (STRIPE_PORTAL_LOGIN_URL).
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createPortalLink } from '@/lib/billing';
import { jsonError, readBody, requireEmail } from '@/lib/billingApi';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await readBody(req);
    const url = await createPortalLink(requireEmail(body.email));
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
