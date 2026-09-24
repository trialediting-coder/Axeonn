// app/api/admin/billing/records/route.ts
// Admin-only: recent billing activity mirrored from Stripe webhooks.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listBillingRecords } from '@/lib/billingRecords';
import { jsonError } from '@/lib/billingApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get('limit') ?? '50');
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 200 ? limitRaw : 50;
    const records = await listBillingRecords(limit);
    return NextResponse.json({ records });
  } catch (err) {
    return jsonError(err);
  }
}
