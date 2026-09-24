// app/api/admin/billing/pay-links/route.ts
// Admin-only: mint, list, and disable personalized pay links (/pay/<token>).
// The link itself charges nothing; Checkout is created when the client clicks
// through, via app/api/billing/checkout with { token }.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { jsonError, readBody } from '@/lib/billingApi';
import {
  createPayLink,
  listPayLinks,
  payLinkState,
  payLinkUrl,
  setPayLinkStatus,
  validatePayLinkInput,
  type PayLink,
} from '@/lib/payLinks';

export const runtime = 'nodejs';

function present(link: PayLink) {
  return { ...link, url: payLinkUrl(link.token), state: payLinkState(link) };
}

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const links = await listPayLinks(50);
    return NextResponse.json({ links: links.map(present) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const link = await createPayLink(validatePayLinkInput(await readBody(req)));
    const shown = present(link);
    return NextResponse.json({ url: shown.url, link: shown }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await readBody(req);
    const status = body.status;
    if (status !== 'open' && status !== 'disabled') throw new Error('status must be open or disabled');
    const link = await setPayLinkStatus(String(body.token ?? ''), status);
    if (!link) throw new Error('Link not found, or it is already paid');
    return NextResponse.json({ link: present(link) });
  } catch (err) {
    return jsonError(err);
  }
}
